import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

// ===== Helpers =====
function getCreds() {
  const token = (Deno.env.get('META_ADS_TOKEN') || '').trim();
  let adAccountId = (Deno.env.get('META_AD_ACCOUNT_ID') || '').trim();
  if (adAccountId && !adAccountId.startsWith('act_')) {
    adAccountId = 'act_' + adAccountId.replace(/\D/g, '');
  }
  return { token, adAccountId };
}

function formatMetaError(data) {
  const e = data?.error || data;
  if (!e) return 'Erro desconhecido da Meta';
  const parts = [];
  if (e.error_user_title) parts.push(e.error_user_title);
  if (e.error_user_msg) parts.push(e.error_user_msg);
  if (!e.error_user_msg && e.message) parts.push(e.message);
  if (e.code) parts.push(`(code ${e.code}${e.error_subcode ? '/' + e.error_subcode : ''})`);
  if (e.fbtrace_id) parts.push(`[trace ${e.fbtrace_id}]`);
  return parts.join(' ') || 'Erro da Meta';
}

async function metaFetch(path, { method = 'GET', token, params = {} } = {}) {
  const url = new URL(`${GRAPH_BASE}${path}`);
  const finalParams = { access_token: token, ...params };

  let res;
  if (method === 'GET') {
    for (const [k, v] of Object.entries(finalParams)) {
      url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    res = await fetch(url.toString(), { method: 'GET' });
  } else {
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(finalParams)) {
      form.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    res = await fetch(`${GRAPH_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    throw new Error(formatMetaError(data));
  }
  return data;
}

// Mapa objetivo → otimização
const OPT_MAP = {
  OUTCOME_AWARENESS: 'REACH',
  OUTCOME_TRAFFIC: 'LINK_CLICKS',
  OUTCOME_ENGAGEMENT: 'POST_ENGAGEMENT',
  OUTCOME_LEADS: 'LEAD_GENERATION',
  OUTCOME_SALES: 'OFFSITE_CONVERSIONS'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action, params = {} } = await req.json();
    const { token, adAccountId } = getCreds();

    if (!token) {
      return Response.json({ error: 'META_ADS_TOKEN não configurado. Cadastre o secret e tente novamente.' }, { status: 400 });
    }
    const needsAccount = !['list_pages', 'diagnose'].includes(action);
    if (needsAccount && !adAccountId) {
      return Response.json({ error: 'META_AD_ACCOUNT_ID não configurado. Cadastre o secret (formato act_123456789).' }, { status: 400 });
    }

    switch (action) {
      // ===== Diagnóstico de setup =====
      case 'diagnose': {
        const me = await metaFetch('/me', { token, params: { fields: 'id,name' } });
        const accounts = await metaFetch('/me/adaccounts', { token, params: { fields: 'id,name,account_status,currency', limit: 50 } });
        const businesses = await metaFetch('/me/businesses', { token, params: { fields: 'id,name', limit: 50 } });
        return Response.json({ me, adaccounts: accounts.data || [], businesses: businesses.data || [] });
      }

      // ===== Testar conexão =====
      case 'test_connection': {
        const acc = await metaFetch(`/${adAccountId}`, {
          token,
          params: { fields: 'id,name,account_status,currency,amount_spent,balance,business_name' }
        });
        return Response.json({ ok: true, account: acc });
      }

      // ===== Listar páginas (com fallback via Businesses) =====
      case 'list_pages': {
        const pages = [];
        const seen = new Set();
        const addPages = (arr) => {
          (arr || []).forEach(p => {
            if (p?.id && !seen.has(p.id)) { seen.add(p.id); pages.push({ id: p.id, name: p.name }); }
          });
        };
        try {
          const direct = await metaFetch('/me/accounts', { token, params: { fields: 'id,name', limit: 100 } });
          addPages(direct.data);
        } catch (_) { /* System User não vê por aqui */ }

        try {
          const businesses = await metaFetch('/me/businesses', { token, params: { fields: 'id,name', limit: 50 } });
          for (const biz of (businesses.data || [])) {
            try {
              const owned = await metaFetch(`/${biz.id}/owned_pages`, { token, params: { fields: 'id,name', limit: 100 } });
              addPages(owned.data);
            } catch (_) { /* ignore */ }
            try {
              const client = await metaFetch(`/${biz.id}/client_pages`, { token, params: { fields: 'id,name', limit: 100 } });
              addPages(client.data);
            } catch (_) { /* ignore */ }
          }
        } catch (_) { /* ignore */ }

        return Response.json({ pages });
      }

      // ===== Listar campanhas =====
      case 'list_campaigns': {
        const data = await metaFetch(`/${adAccountId}/campaigns`, {
          token,
          params: { fields: 'id,name,objective,status,daily_budget,created_time', limit: 100 }
        });
        return Response.json({ campaigns: data.data || [] });
      }

      // ===== Insights por campanha =====
      case 'campaign_insights': {
        const { campaign_id, date_preset = 'last_7d' } = params;
        const data = await metaFetch(`/${campaign_id}/insights`, {
          token,
          params: { date_preset, fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions' }
        });
        return Response.json({ insights: data.data?.[0] || null });
      }

      // ===== Insights agregados da conta =====
      case 'account_insights': {
        const { date_preset = 'last_7d' } = params;
        const data = await metaFetch(`/${adAccountId}/insights`, {
          token,
          params: { date_preset, fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency' }
        });
        return Response.json({ insights: data.data?.[0] || null });
      }

      case 'list_adsets': {
        const { campaign_id } = params;
        const data = await metaFetch(`/${campaign_id}/adsets`, {
          token, params: { fields: 'id,name,status,daily_budget,optimization_goal', limit: 100 }
        });
        return Response.json({ adsets: data.data || [] });
      }

      case 'list_ads': {
        const { adset_id } = params;
        const data = await metaFetch(`/${adset_id}/ads`, {
          token, params: { fields: 'id,name,status,creative', limit: 100 }
        });
        return Response.json({ ads: data.data || [] });
      }

      // ===== Upload de imagem por URL =====
      case 'upload_image_from_url': {
        const { image_url } = params;
        const imgRes = await fetch(image_url);
        if (!imgRes.ok) throw new Error('Não foi possível baixar a imagem da URL.');
        const blob = await imgRes.blob();
        const form = new FormData();
        form.append('access_token', token);
        form.append('filename', new File([blob], 'ad-image.jpg', { type: blob.type || 'image/jpeg' }));
        const res = await fetch(`${GRAPH_BASE}/${adAccountId}/adimages`, { method: 'POST', body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.error) throw new Error(formatMetaError(data));
        const first = data.images && Object.values(data.images)[0];
        return Response.json({ image_hash: first?.hash || null, raw: data });
      }

      // ===== Upload de vídeo por URL =====
      case 'upload_video_from_url': {
        const { video_url } = params;
        const vidRes = await fetch(video_url);
        if (!vidRes.ok) throw new Error('Não foi possível baixar o vídeo da URL.');
        const blob = await vidRes.blob();
        const form = new FormData();
        form.append('access_token', token);
        form.append('source', new File([blob], 'ad-video.mp4', { type: blob.type || 'video/mp4' }));
        const res = await fetch(`${GRAPH_BASE}/${adAccountId}/advideos`, { method: 'POST', body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.error) throw new Error(formatMetaError(data));
        return Response.json({ video_id: data.id || null, raw: data });
      }

      // ===== Criar só a campanha (PAUSED) =====
      case 'create_campaign': {
        const { name, objective, special_ad_categories = [] } = params;
        const data = await metaFetch(`/${adAccountId}/campaigns`, {
          method: 'POST', token,
          params: { name, objective, status: 'PAUSED', special_ad_categories }
        });
        return Response.json({ campaign_id: data.id });
      }

      case 'pause_campaign': {
        await metaFetch(`/${params.campaign_id}`, { method: 'POST', token, params: { status: 'PAUSED' } });
        return Response.json({ ok: true });
      }

      case 'activate_campaign': {
        await metaFetch(`/${params.campaign_id}`, { method: 'POST', token, params: { status: 'ACTIVE' } });
        return Response.json({ ok: true });
      }

      // ===== Publicar campanha completa (4 passos com rollback) =====
      case 'publish_complete_campaign': {
        const {
          name, objective, status = 'PAUSED', special_ad_categories = [],
          daily_budget_cents, page_id,
          targeting = {}, // { geo_locations, age_min, age_max, publisher_platforms, genders }
          creative = {}   // { message, link, headline, description, cta_type, image_hash, video_id }
        } = params;

        const optimization_goal = OPT_MAP[objective] || 'LINK_CLICKS';
        let campaignId = null;

        try {
          // 1) Campanha
          const camp = await metaFetch(`/${adAccountId}/campaigns`, {
            method: 'POST', token,
            params: { name, objective, status: 'PAUSED', special_ad_categories }
          });
          campaignId = camp.id;

          // 2) Ad Set
          const adsetParams = {
            name: `${name} - Conjunto`,
            campaign_id: campaignId,
            daily_budget: daily_budget_cents,
            billing_event: 'IMPRESSIONS',
            optimization_goal,
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
            status: 'PAUSED',
            targeting: {
              geo_locations: targeting.geo_locations || { countries: ['BR'] },
              age_min: targeting.age_min || 18,
              age_max: targeting.age_max || 65,
              genders: targeting.genders || [0],
              publisher_platforms: targeting.publisher_platforms || ['facebook', 'instagram']
            },
            promoted_object: { page_id }
          };
          const adset = await metaFetch(`/${adAccountId}/adsets`, { method: 'POST', token, params: adsetParams });

          // 3) Criativo
          const linkData = {
            message: creative.message || '',
            link: creative.link || '',
            name: creative.headline || '',
            description: creative.description || ''
          };
          if (creative.cta_type) {
            linkData.call_to_action = { type: creative.cta_type, value: { link: creative.link || '' } };
          }
          if (creative.image_hash) linkData.image_hash = creative.image_hash;
          if (creative.video_id) linkData.video_id = creative.video_id;

          const adcreative = await metaFetch(`/${adAccountId}/adcreatives`, {
            method: 'POST', token,
            params: {
              name: `${name} - Criativo`,
              object_story_spec: { page_id, link_data: linkData }
            }
          });

          // 4) Anúncio
          const ad = await metaFetch(`/${adAccountId}/ads`, {
            method: 'POST', token,
            params: {
              name: `${name} - Anúncio`,
              adset_id: adset.id,
              creative: { creative_id: adcreative.id },
              status: 'PAUSED'
            }
          });

          // Se o usuário pediu para já ativar
          if (status === 'ACTIVE') {
            await metaFetch(`/${campaignId}`, { method: 'POST', token, params: { status: 'ACTIVE' } });
          }

          return Response.json({
            ok: true,
            campaign_id: campaignId,
            adset_id: adset.id,
            creative_id: adcreative.id,
            ad_id: ad.id,
            ads_manager_url: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId.replace('act_', '')}`
          });
        } catch (err) {
          // Rollback: deleta a campanha para não deixar órfãos
          if (campaignId) {
            try { await metaFetch(`/${campaignId}`, { method: 'DELETE', token }); } catch (_) { /* ignore */ }
          }
          throw err;
        }
      }

      default:
        return Response.json({ error: `Ação desconhecida: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});