import { NextResponse } from 'next/server';
import { drive } from '../../../lib/googleDrive'; 
import { Readable } from 'stream';

const ROOT_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // 1. Procura se a pasta "Documentos Enviados" (Massa) já existe na raiz
    let pastaMassaId = null;
    const searchRes = await drive.files.list({
      q: `name = 'Documentos Enviados' and '${ROOT_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)',
      spaces: 'drive',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      pastaMassaId = searchRes.data.files[0].id;
    } else {
      // 2. Cria a pasta "Documentos Enviados" se for a primeira vez
      const novaPasta = await drive.files.create({
        requestBody: {
          name: 'Documentos Enviados',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [ROOT_ID],
        },
        fields: 'id',
        supportsAllDrives: true,
      });
      pastaMassaId = novaPasta.data.id;
    }

    // 3. Prepara o arquivo para o formato que o Google Drive aceita
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // 4. Faz o upload do arquivo
    const uploadRes = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [pastaMassaId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    // 5. MÁGICA: Libera o acesso para o cliente conseguir baixar sem pedir permissão
    await drive.permissions.create({
      fileId: uploadRes.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    });

    return NextResponse.json({ success: true, fileId: uploadRes.data.id });
  } catch (error) {
    console.error('Erro no upload massa pro Drive:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}