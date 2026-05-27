import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

async function getAccessToken(clientId, clientSecret, refreshToken) {
  try {
    // 🔥 SANITIZAR: Remover prefixos que podem estar nos valores
    clientId = clientId.replace('client_id=', '').trim();
    clientSecret = clientSecret.replace('client_secret=', '').trim();
    refreshToken = refreshToken.replace('refresh_token=', '').trim();
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get access token: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('No access token received from Google');
    }
    
    return data.access_token;
  } catch (error) {
    throw new Error(`Error getting access token: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  console.log('🎥 === CREATE GOOGLE CALENDAR EVENT START ===');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'User not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { summary, description, startDateTime, endDateTime, attendeeEmail, attendeeName } = body;

    console.log('📝 Dados recebidos:', { summary, startDateTime, endDateTime, attendeeEmail });

    if (!summary || !startDateTime || !endDateTime || !attendeeEmail) {
      return Response.json({ 
        error: 'Missing required fields',
        message: 'summary, startDateTime, endDateTime, and attendeeEmail are required'
      }, { status: 400 });
    }

    const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GOOGLE_CALENDAR_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      return Response.json({ 
        error: 'Missing Google Calendar credentials',
        message: 'Please configure GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and GOOGLE_CALENDAR_REFRESH_TOKEN in environment variables'
      }, { status: 500 });
    }

    console.log('🔑 Obtendo access token...');
    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);
    console.log('✅ Access token obtido');

    const event = {
      summary,
      description: description || '',
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        { email: attendeeEmail, displayName: attendeeName || attendeeEmail }
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    console.log('📅 Criando evento no Google Calendar...');
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    const eventData = await calendarResponse.json();

    if (!calendarResponse.ok) {
      console.error('❌ Erro na resposta do Google Calendar:', eventData);
      return Response.json({ 
        error: 'Failed to create calendar event',
        message: eventData.error?.message || 'Unknown error from Google Calendar API',
        details: eventData 
      }, { status: 500 });
    }

    console.log('📦 Resposta do Google Calendar:', JSON.stringify(eventData, null, 2));
    console.log('🔗 conferenceData:', eventData.conferenceData);
    console.log('🔗 hangoutLink:', eventData.hangoutLink);

    // Tenta extrair o link do Meet de múltiplas formas
    let meetLink = null;
    
    // Método 1: conferenceData.entryPoints
    if (eventData.conferenceData?.entryPoints) {
      const videoEntry = eventData.conferenceData.entryPoints.find(ep => ep.entryPointType === 'video');
      if (videoEntry?.uri) {
        meetLink = videoEntry.uri;
        console.log('✅ Link encontrado via conferenceData.entryPoints:', meetLink);
      }
    }
    
    // Método 2: hangoutLink (fallback)
    if (!meetLink && eventData.hangoutLink) {
      meetLink = eventData.hangoutLink;
      console.log('✅ Link encontrado via hangoutLink:', meetLink);
    }

    // Método 3: conferenceData.conferenceId (construir link manualmente)
    if (!meetLink && eventData.conferenceData?.conferenceId) {
      meetLink = `https://meet.google.com/${eventData.conferenceData.conferenceId}`;
      console.log('✅ Link construído via conferenceId:', meetLink);
    }

    if (!meetLink) {
      console.warn('⚠️ Nenhum link de Meet encontrado! Event data:', JSON.stringify(eventData, null, 2));
    }

    console.log('🎉 Evento criado com sucesso!');
    console.log('🔗 Meet Link final:', meetLink);

    return Response.json({
      success: true,
      eventId: eventData.id,
      eventLink: eventData.htmlLink,
      meetLink: meetLink,
      debug: {
        hasConferenceData: !!eventData.conferenceData,
        hasHangoutLink: !!eventData.hangoutLink,
        conferenceId: eventData.conferenceData?.conferenceId
      }
    });

  } catch (error) {
    console.error('❌ Error in createGoogleCalendarEvent:', error);
    console.error('Stack:', error.stack);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    console.log('🎥 === CREATE GOOGLE CALENDAR EVENT END ===\n');
  }
});