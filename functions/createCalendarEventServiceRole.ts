import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function getAccessToken(clientId, clientSecret, refreshToken) {
  try {
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
  console.log('🎥 === CREATE CALENDAR EVENT (SERVICE ROLE) START ===');
  
  try {
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
      console.error('❌ Credenciais do Google Calendar não configuradas');
      return Response.json({ 
        error: 'Missing Google Calendar credentials',
        meetLink: null
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
        meetLink: null
      }, { status: 500 });
    }

    console.log('📦 Resposta do Google Calendar:', JSON.stringify(eventData, null, 2));

    // Extrai o link do Meet
    let meetLink = null;
    
    if (eventData.conferenceData?.entryPoints) {
      const videoEntry = eventData.conferenceData.entryPoints.find(ep => ep.entryPointType === 'video');
      if (videoEntry?.uri) {
        meetLink = videoEntry.uri;
        console.log('✅ Link encontrado via conferenceData.entryPoints:', meetLink);
      }
    }
    
    if (!meetLink && eventData.hangoutLink) {
      meetLink = eventData.hangoutLink;
      console.log('✅ Link encontrado via hangoutLink:', meetLink);
    }

    if (!meetLink && eventData.conferenceData?.conferenceId) {
      meetLink = `https://meet.google.com/${eventData.conferenceData.conferenceId}`;
      console.log('✅ Link construído via conferenceId:', meetLink);
    }

    console.log('🎉 Evento criado com sucesso!');
    console.log('🔗 Meet Link final:', meetLink);

    return Response.json({
      success: true,
      eventId: eventData.id,
      eventLink: eventData.htmlLink,
      meetLink: meetLink
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: error.message,
      meetLink: null
    }, { status: 500 });
  } finally {
    console.log('🎥 === CREATE CALENDAR EVENT (SERVICE ROLE) END ===\n');
  }
});