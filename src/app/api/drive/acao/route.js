import { google } from 'googleapis';
import { NextResponse } from 'next/server';

let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
privateKey = privateKey.replace(/"/g, '').replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
  credentials: { client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key: privateKey },
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

export async function POST(req) {
  try {
    const { acao, fileId } = await req.json();
    if (!fileId || !fileId.startsWith('DRIVE:')) return NextResponse.json({ success: true });
    
    const realId = fileId.split('DRIVE:')[1];

    if (acao === 'lixeira') {
      await drive.files.update({ fileId: realId, requestBody: { trashed: true } });
    } else if (acao === 'restaurar') {
      await drive.files.update({ fileId: realId, requestBody: { trashed: false } });
    } else if (acao === 'deletar') {
      await drive.files.delete({ fileId: realId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}