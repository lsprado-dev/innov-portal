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
      
      // Verifica se foi pago por qualquer via (Boleto, PIX ou Baixa Manual no App do Inter)
      if (sit === 'RECEBIDO' || sit === 'PAGO' || sit === 'RECEBIDO_PIX' || sit === 'MARCADO_RECEBIDO') {
        // A V3 envia codigoSolicitacao no lugar de nossoNumero
        const idCobranca = evento.codigoSolicitacao || evento.nossoNumero;
        
        // Verifica se na notificação em tempo real veio a flag de PIX
        const isPix = sit === 'RECEBIDO_PIX' || JSON.stringify(evento).includes('"PIX"');
        
        // Dá baixa automática no boleto do cliente com o status correto!
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