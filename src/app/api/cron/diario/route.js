import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enviarEmailDemanda } from '../../../../lib/email'; // Confirme que o caminho para o email.js está correto

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Trava de segurança da Vercel para hackers não acionarem o email
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Acesso Negado', { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: demandas } = await supabase.from('demandas_equipe').select('*').eq('status', 'pendente');
    const { data: tickets } = await supabase.from('pedidos_cliente').select('*').eq('status', 'pendente');

    // Retirado Lucas e Victor!
    const equipeTracking = [
      'Maria (Societário)', 'Helena (Societário e Suporte)', 'Luiza (Fiscal)',
      'Nogueira (Fiscal)', 'Vanessa (Contábil)', 'Karen (RH)', 'Beatriz (Suporte)'
    ];

    let mensagemHTML = `Resumo de Produtividade Diária:\n\n`;

    equipeTracking.forEach(colab => {
      const dem = demandas?.filter(d => d.atribuido_para === colab) || [];
      const tks = tickets?.filter(t => t.responsavel === colab) || [];

      mensagemHTML += `------------------------------------\n`;
      mensagemHTML += `COLABORADORA: ${colab}\n`;
      
      if (dem.length === 0 && tks.length === 0) {
        mensagemHTML += `✅ Tudo em dia! Nenhuma pendência.\n`;
      } else {
        mensagemHTML += `⚠️ Tickets Abertos: ${tks.length}\n`;
        mensagemHTML += `⚠️ Demandas Pendentes: ${dem.length}\n`;
        // ATENÇÃO: Troque "SEU_DOMINIO.com" pelo link real do seu sistema final
        mensagemHTML += `Ver Detalhes (Clique aqui): https://portal.innovbusiness.com.br/admin?colab=${encodeURIComponent(colab)}\n`;
      }
      mensagemHTML += `\n`;
    });

    const gestores = ['victor@innovbusiness.com.br', 'lucas@innovbusiness.com.br'];
    
    // Dispara 1 email para cada gestor
    for (const email of gestores) {
      await enviarEmailDemanda({
        to: email,
        nomeDestinatario: 'Gestor',
        nomeRemetente: 'Sistema Innovative',
        tituloDemanda: 'Tracking Diário de Produtividade',
        descricao: mensagemHTML,
        prazo: 'Análise de Rotina'
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, message: 'Tracking diário enviado!' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}