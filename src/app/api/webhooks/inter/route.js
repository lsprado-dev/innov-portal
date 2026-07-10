import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    
    // O Inter manda um array de eventos
    for (const evento of body) {
      const sit = evento.situacao;
      
      // Verifica se foi pago por qualquer via
      if (sit === 'RECEBIDO' || sit === 'PAGO' || sit === 'RECEBIDO_PIX' || sit === 'MARCADO_RECEBIDO') {
        const idCobranca = evento.codigoSolicitacao || evento.nossoNumero;
        
        // Verificação OFICIAL do Banco Inter para pagamento via QR Code do Boleto
        const recebimentos = evento.recebimentos || [];
        const isPix = sit === 'RECEBIDO_PIX' || recebimentos.some(r => r.origemRecebimento === 'PIX');
        
        await supabaseAdmin
          .from('boletos_api')
          .update({ 
            status: isPix ? 'pago via pix' : 'pago', 
            data_pagamento: new Date().toISOString()
          })
          .eq('nosso_numero', idCobranca); 
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no Webhook do Inter:', error);
    // Sempre retorne 200 pro Inter, senão ele acha que seu sistema caiu e tenta mandar de novo
    return NextResponse.json({ success: true, message: 'Processado com erro interno' });
  }
}