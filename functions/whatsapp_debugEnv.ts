Deno.serve((req) => {
  const clientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
  const instanceId = Deno.env.get('WHATSAPP_INSTANCE_ID');
  
  // Lista TODAS as variáveis que começam com ZAPI ou WHATSAPP
  const allEnvs = Deno.env.toObject();
  const relevantEnvs = Object.keys(allEnvs)
    .filter(key => key.includes('ZAPI') || key.includes('WHATSAPP'))
    .reduce((obj, key) => {
      obj[key] = allEnvs[key] ? `${allEnvs[key].substring(0, 10)}... (${allEnvs[key].length} chars)` : 'NOT SET';
      return obj;
    }, {});

  return Response.json({
    timestamp: new Date().toISOString(),
    ZAPI_CLIENT_TOKEN: {
      exists: !!clientToken,
      length: clientToken?.length || 0,
      first10: clientToken?.substring(0, 10) || 'NOT SET',
      value: clientToken || 'NOT SET'
    },
    WHATSAPP_INSTANCE_ID: {
      exists: !!instanceId,
      length: instanceId?.length || 0,
      first10: instanceId?.substring(0, 10) || 'NOT SET',
      value: instanceId || 'NOT SET'
    },
    all_relevant_env_vars: relevantEnvs,
    total_env_vars: Object.keys(allEnvs).length
  });
});