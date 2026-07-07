import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enviarRelatorioDiario } from '../../../lib/email'; 

// 🛑 FORÇA A VERCEL A NUNCA FAZER CACHE DESTA ROTA (Garante que roda todos os dias)
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Trava de segurança da Vercel para hackers não acionarem o email
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Acesso Negado', { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: demandas } = await supabase.from('demandas_equipe').select('*').eq('status', 'pendente');
    const { data: tickets } = await supabase.from('pedidos_cliente').select('*').eq('status', 'pendente');
    const { data: processosSocietarios } = await supabase.from('processos_societarios').select('*');

    const equipeTracking = [
      { nomeBusca: 'Victor (Admin)', nome: 'Victor', setor: 'Gestão/Admin' },
      { nomeBusca: 'Lucas (Financeiro)', nome: 'Lucas', setor: 'Financeiro' },
      { nomeBusca: 'Vanessa (Contábil)', nome: 'Vanessa', setor: 'Contábil' },
      { nomeBusca: 'Maria (Societário)', nome: 'Maria', setor: 'Societário' },
      { nomeBusca: 'Helena (Societário e Suporte)', nome: 'Helena', setor: 'Societário e Suporte' },
      { nomeBusca: 'Luiza (Fiscal)', nome: 'Luiza', setor: 'Fiscal' },
      { nomeBusca: 'Nogueira (Fiscal)', nome: 'Nogueira', setor: 'Fiscal' },
      { nomeBusca: 'Karen (RH)', nome: 'Karen', setor: 'RH' },
      { nomeBusca: 'Beatriz (Suporte)', nome: 'Beatriz', setor: 'Suporte' }
    ];

    const colaboradoresData = equipeTracking.map(colab => {
      const dem = demandas?.filter(d => d.atribuido_para === colab.nomeBusca) || [];
      const tks = tickets?.filter(t => t.responsavel === colab.nomeBusca) || [];
      
      const totalTickets = tks.length;
      const totalDemandas = dem.length;

      if (totalTickets === 0 && totalDemandas === 0) {
        return { 
          nome: colab.nome, 
          setor: colab.setor, 
          status: 'Tudo em dia', 
          cor: '#10b981'
        };
      } else {
        return { 
          nome: colab.nome, 
          setor: colab.setor, 
          status: `${totalTickets} Tickets / ${totalDemandas} Demandas`, 
          cor: '#f59e0b'
        };
      }
    });

    const gestores = [
      { email: 'victor@innovbusiness.com.br', nome: 'Victor' },
      { email: 'lucas@innovbusiness.com.br', nome: 'Lucas' }
    ];
    
    // 🚀 MÁGICA: Dispara TODOS os e-mails simultaneamente! (Foge do Timeout de 10s da Vercel)
    const promessasEmails = gestores.map(async (gestor) => {
      const res = await enviarRelatorioDiario({
        to: gestor.email,
        nomeGestor: gestor.nome,
        colaboradores: colaboradoresData,
        processosSocietarios: processosSocietarios || []
      });
      
      if (!res.success) {
        console.error(`🚨 Erro ao enviar para ${gestor.nome}:`, res.error);
      } else {
        console.log(`✅ Relatório enviado com sucesso para ${gestor.nome}`);
      }
    });

    await Promise.all(promessasEmails);

    return NextResponse.json({ success: true, message: 'Tracking diário (Dashboard) enviado com sucesso!' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}