import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { audio_url } = await req.json();

    if (!audio_url) {
      return Response.json({ error: 'audio_url é obrigatório' }, { status: 400 });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return Response.json({ error: 'OPENAI_API_KEY não configurada' }, { status: 500 });
    }

    console.log('🎤 Baixando áudio:', audio_url);

    // Baixa o áudio
    const audioResponse = await fetch(audio_url);
    if (!audioResponse.ok) {
      throw new Error(`Erro ao baixar áudio: ${audioResponse.status}`);
    }

    const audioBlob = await audioResponse.blob();
    console.log('📦 Áudio baixado, tamanho:', audioBlob.size);

    // Prepara FormData para Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'text');

    console.log('🔄 Enviando para Whisper API...');

    // Chama Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('❌ Erro Whisper:', errorText);
      throw new Error(`Whisper API erro: ${whisperResponse.status}`);
    }

    const transcription = await whisperResponse.text();
    console.log('✅ Transcrição:', transcription);

    return Response.json({ 
      success: true,
      transcription: transcription.trim()
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});