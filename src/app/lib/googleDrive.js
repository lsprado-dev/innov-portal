import { google } from 'googleapis';

// Lógica à prova de balas para ler a chave privada (Remove aspas extras e converte as quebras de linha)
const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '')
  .replace(/\\n/g, '\n')
  .replace(/^"|"$/g, ''); 

const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  privateKey,
  ['https://www.googleapis.com/auth/drive']
);

export const drive = google.drive({ version: 'v3', auth });