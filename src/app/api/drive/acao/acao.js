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
    const { acao, fileId, targetFolderId } = await req.json();
    if (!fileId || !fileId.startsWith('DRIVE:')) return NextResponse.json({ success: true });
    
    const realId = fileId.split('DRIVE:')[1];

    if (acao === 'mover' && targetFolderId) {
      // 1. Descobre de onde o arquivo está vindo
      const file = await drive.files.get({ fileId: realId, fields: 'parents' });
      const previousParents = file.data.parents ? file.data.parents.join(',') : '';
      
      // 2. Tira da pasta antiga e joga na nova (Lixeira Física ou Restauração)
      await drive.files.update({
        fileId: realId,
        addParents: targetFolderId,
        removeParents: previousParents,
        fields: 'id, parents'
      });
    } else if (acao === 'deletar') {
      // Exclui o arquivo permanentemente da face da terra
      await drive.files.delete({ fileId: realId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}