import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

// Lógica à prova de balas para ler a chave privada (Remove aspas extras e converte as quebras de linha)
const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '')
  .replace(/\\n/g, '\n')
  .replace(/^"|"$/g, ''); 

// Autentica o nosso robô
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  privateKey,
  ['https://www.googleapis.com/auth/drive']
);
const drive = google.drive({ version: 'v3', auth });

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const folderId = formData.get('folderId'); // O ID da pasta destino lá no Drive

    if (!file || !folderId) {
      return NextResponse.json({ success: false, error: 'Arquivo ou ID da pasta ausentes.' }, { status: 400 });
    }

    // Converte o arquivo do navegador para um formato legível pelo Google (Buffer/Stream)
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Faz o Upload real para o Drive
    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId],
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: stream,
      },
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    });

    return NextResponse.json({ success: true, fileId: response.data.id, link: response.data.webViewLink });

  } catch (error) {
    console.error("Erro no Upload para o Drive:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}