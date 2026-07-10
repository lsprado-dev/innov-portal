import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';
import { getInterToken } from '../../lib/inter';

export async function GET() {
  try {
    const token = await getInterToken();
    const cert = Buffer.from(process.env.INTER_CERT_BASE64, 'base64').toString('ascii');
    const key = Buffer.from(process.env.INTER_KEY_BASE64, 'base64').toString('ascii');
    const httpsAgent = new https.Agent({ cert, key });

    // Registra a URL do seu sistema no Banco Inter
    await axios.put(
      'https://cdws.inter.co/cobranca/v2/boletos/webhook',
      // ATENÇÃO: Confirme se este é o domínio correto do seu projeto na Vercel!
      { webhookUrl: 'https://portal.innovbusiness.com.br/api/webhooks/inter' }, 
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent
      }
    );

    return NextResponse.json({ success: true, message: 'Webhook cadastrado no Banco Inter com Sucesso!' });
  } catch (error) {
    return NextResponse.json({ error: error.response?.data || error.message });
  }
}