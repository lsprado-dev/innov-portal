import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';
import { getInterToken } from '../../../lib/inter';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const nossoNumero = searchParams.get('nossoNumero');

    if (!nossoNumero) return NextResponse.json({ error: 'Nosso Número não informado.' }, { status: 400 });

    const token = await getInterToken();
    const cert = Buffer.from(process.env.INTER_CERT_BASE64, 'base64').toString('ascii');
    const key = Buffer.from(process.env.INTER_KEY_BASE64, 'base64').toString('ascii');
    const httpsAgent = new https.Agent({ cert, key });

    // 1. Faz a requisição padrão (o Inter devolve um JSON com o Base64 dentro)
    const response = await axios.get(
      `https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas/${nossoNumero}/pdf`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent
      }
    );

    // 2. Extrai o Base64 mágico que o Inter manda na V3
    const pdfBase64 = response.data.pdf;
    
    // 3. Converte o texto Base64 em um arquivo PDF real (Binário)
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // 4. Entrega o PDF formatado pro navegador do cliente
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Boleto_${nossoNumero}.pdf"` 
      }
    });

  } catch (error) {
    console.error('Erro ao baixar PDF:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Erro ao gerar o documento do boleto.' }, { status: 500 });
  }
}