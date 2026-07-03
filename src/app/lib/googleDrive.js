import { google } from 'googleapis';

// 🚀 BLINDAGEM MÁXIMA DA CHAVE PRIVADA
let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
privateKey = privateKey.replace(/"/g, ''); // Arranca QUALQUER aspa que a Vercel colocar
privateKey = privateKey.replace(/\\n/g, '\n'); // Transforma o texto \n em quebra de linha real

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

export const drive = google.drive({ version: 'v3', auth });