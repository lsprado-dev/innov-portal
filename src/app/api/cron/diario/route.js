import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// Importamos a nova função de relatório diário
import { enviarRelatorioDiario } from '../../../lib/email'; 

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

    // Buscando as demandas, tickets E agora os Processos Societários!
    const { data: demandas } = await supabase.from('demandas_equipe').select('*').eq('status', 'pendente');
    const { data: tickets } = await supabase.from('pedidos_cliente').select('*').eq('status', 'pendente');
    const { data: processosSocietarios } = await supabase.from('processos_societarios').select('*');

    // Mapeamento da equipe separado por Nome e Setor para o novo visual do Dashboard
    const equipeTracking = [
      { nomeBusca: 'Maria (Societário)', nome: 'Maria', setor: 'Societário' },
      { nomeBusca: 'Helena (Societário e Suporte)', nome: 'Helena', setor: 'Societário e Suporte' },
      { nomeBusca: 'Luiza (Fiscal)', nome: 'Luiza', setor: 'Fiscal' },
      { nomeBusca: 'Nogueira (Fiscal)', nome: 'Nogueira', setor: 'Fiscal' },
      { nomeBusca: 'Vanessa (Contábil)', nome: 'Vanessa', setor: 'Contábil' },
      { nomeBusca: 'Karen (RH)', nome: 'Karen', setor: 'RH' },
      { nomeBusca: 'Beatriz (Suporte)', nome: 'Beatriz', setor: 'Suporte' }
    ];

    // Criando a lista de colaboradores estruturada para o e-mail 2.0
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
          cor: '#10b981' // Verde esmeralda
        };
      } else {
        return { 
          nome: colab.nome, 
          setor: colab.setor, 
          status: `${totalTickets} Tickets / ${totalDemandas} Demandas`, 
          cor: '#f59e0b' // Laranja (indicando pendências)
        };
      }
    });

    // Lista de Gestores com nome para personalização do e-mail
    const gestores = [
      { email: 'victor@innovbusiness.com.br', nome: 'Victor' },
      { email: 'lucas@innovbusiness.com.br', nome: 'Lucas' }
    ];
    
    // Dispara 1 email de Relatório Diário para cada gestor
    for (const gestor of gestores) {
      await enviarRelatorioDiario({
        to: gestor.email,
        nomeGestor: gestor.nome,
        colaboradores: colaboradoresData,
        processosSocietarios: processosSocietarios || []
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, message: 'Tracking diário (Dashboard) enviado com sucesso!' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}