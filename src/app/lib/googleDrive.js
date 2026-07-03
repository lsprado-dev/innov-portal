import { google } from 'googleapis';

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key = process.env.GOOGLE_PRIVATE_KEY;

// Limpa a chave privada (Remove aspas extras da Vercel e conserta as quebras de linha)
const privateKey = (key || '').replace(/\\n/g, '\n').replace(/^"|"$/g, '');

// O GoogleAuth é o padrão ouro atual. Ele "força" o crachá a ser validado antes de enviar.
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: email,
    private_key: privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

export const drive = google.drive({ version: 'v3', auth });