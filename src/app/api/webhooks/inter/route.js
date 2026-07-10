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
      if (evento.situacao === 'RECEBIDO') {
        const nossoNumero = evento.nossoNumero;
        
        // Dá baixa automática no boleto do cliente!
        await supabaseAdmin
          .from('boletos_api')
          .update({ 
            status: 'pago', 
            data_pagamento: new Date().toISOString()
          })
          .eq('nosso_numero', nossoNumero); 
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no Webhook do Inter:', error);
    // Sempre retorne 200 pro Inter, senão ele acha que seu sistema caiu e tenta mandar de novo
    return NextResponse.json({ success: true, message: 'Processado com erro interno' });
  }
}