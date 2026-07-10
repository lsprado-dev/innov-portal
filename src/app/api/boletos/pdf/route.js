import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';
import { getInterToken } from '../../../../lib/inter';

export async function GET(request) {
  try {
    // 1. Pega o "nossoNumero" que veio na URL
    const { searchParams } = new URL(request.url);
    const nossoNumero = searchParams.get('nossoNumero');

    if (!nossoNumero) {
      return NextResponse.json({ error: 'Nosso Número não informado.' }, { status: 400 });
    }

    // 2. Prepara a Autenticação (MTLS)
    const token = await getInterToken();
    const cert = Buffer.from(process.env.INTER_CERT_BASE64, 'base64').toString('ascii');
    const key = Buffer.from(process.env.INTER_KEY_BASE64, 'base64').toString('ascii');
    const httpsAgent = new https.Agent({ cert, key });

    // 3. Pede o arquivo PDF original para o Banco Inter
    const response = await axios.get(
      `https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas/${nossoNumero}/pdf`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent,
        responseType: 'arraybuffer' // MÁGICA: Diz pro Axios não ler como texto, mas como arquivo binário!
      }
    );

    // 4. Entrega o PDF formatado pro navegador do cliente
    return new NextResponse(response.data, {
      headers: {
        'Content-Type': 'application/pdf',
        // "inline" faz o navegador tentar abrir na tela. Se quisesse forçar o download direto seria "attachment"
        'Content-Disposition': `inline; filename="Boleto_${nossoNumero}.pdf"` 
      }
    });

  } catch (error) {
    console.error('Erro ao baixar PDF:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Erro ao gerar o documento do boleto.' }, { status: 500 });
  }
}