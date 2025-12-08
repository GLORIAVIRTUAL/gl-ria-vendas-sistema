import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Imap from 'npm:imap@0.8.19';
import { simpleParser } from 'npm:mailparser@3.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = Deno.env.get('GMAIL_EMAIL');
    const password = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!email || !password) {
      return Response.json({ 
        error: 'Configuração de email não encontrada',
        details: 'Configure GMAIL_EMAIL e GMAIL_APP_PASSWORD'
      }, { status: 500 });
    }

    const imap = new Imap({
      user: email,
      password: password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    return new Promise((resolve) => {
      const emails = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err, box) => {
          if (err) {
            resolve(Response.json({ error: 'Erro ao abrir caixa de entrada', details: err.message }, { status: 500 }));
            return;
          }

          // Busca apenas emails não lidos dos últimos 7 dias
          imap.search(['UNSEEN', ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]], (err, results) => {
            if (err) {
              resolve(Response.json({ error: 'Erro ao buscar emails', details: err.message }, { status: 500 }));
              return;
            }

            if (!results || results.length === 0) {
              imap.end();
              resolve(Response.json({ success: true, emails: [], count: 0 }));
              return;
            }

            const fetch = imap.fetch(results.slice(0, 10), { bodies: '' });

            fetch.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, (err, parsed) => {
                  if (!err && parsed) {
                    emails.push({
                      subject: parsed.subject,
                      from: parsed.from?.text || parsed.from,
                      date: parsed.date,
                      text: parsed.text?.substring(0, 200) || '',
                      html: parsed.html ? parsed.html.substring(0, 200) : ''
                    });
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              console.error('Fetch error:', err);
              imap.end();
              resolve(Response.json({ error: 'Erro ao buscar mensagens', details: err.message }, { status: 500 }));
            });

            fetch.once('end', () => {
              imap.end();
              resolve(Response.json({ success: true, emails, count: emails.length }));
            });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        resolve(Response.json({ 
          error: 'Erro ao conectar com Gmail', 
          details: err.message,
          hint: 'Verifique se a senha de aplicativo está correta'
        }, { status: 500 }));
      });

      imap.once('end', () => {
        console.log('Conexão IMAP encerrada');
      });

      imap.connect();
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});