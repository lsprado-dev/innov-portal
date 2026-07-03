import { google } from 'googleapis';

// Configura a autenticação do robô usando as variáveis de ambiente
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  // Corrige possíveis quebras de linha na chave privada
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/drive']
);

export const drive = google.drive({ version: 'v3', auth });