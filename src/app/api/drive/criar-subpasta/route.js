import { google } from 'googleapis';
import { NextResponse } from 'next/server';

let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
privateKey = privateKey.replace(/"/g, '').replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

export async function POST(req) {
  try {
    const { nomePasta, parentDriveId } = await req.json();
    if (!nomePasta || !parentDriveId) {
      return NextResponse.json({ success: false, error: 'Parâmetros ausentes.' }, { status: 400 });
    }

    // Cria a subpasta dentro da pasta pai informada
    const response = await drive.files.create({
      requestBody: {
        name: nomePasta,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentDriveId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    return NextResponse.json({ success: true, id_drive_pasta: response.data.id });
  } catch (error) {
    console.error("Erro ao criar subpasta no Drive:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}