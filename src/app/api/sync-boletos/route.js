import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';
import { getInterToken } from '../../../lib/inter';
import { createClient } from '@supabase/supabase-js';

// Usamos a chave de serviço para ter poder total de escrita no banco
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mágica 1: Traduz a data de Vencimento do Inter para a sua "Referência" do painel
function obterMesRef(dataVencimento) {
  // Ex: 2026-02-20 -> Pega o "02" e converte para número 2
  const mesVencimento = parseInt(dataVencimento.split('-')[1], 10);
  
  // Se vence no mês 2 (Fevereiro), a referência é Janeiro (1).
  const mapa = {
    1: 'Dezembro', 2: 'Janeiro', 3: 'Fevereiro', 4: 'Março',
    5: 'Abril', 6: 'Maio', 7: 'Junho', 8: 'Julho',
    9: 'Agosto', 10: 'Setembro', 11: 'Outubro', 12: 'Novembro'
  };
  return mapa[mesVencimento];
}

export async function GET() {
  try {
    // 1. Prepara a Autenticação Segura (MTLS)
    const token = await getInterToken();
    const cert = Buffer.from(process.env.INTER_CERT_BASE64, 'base64').toString('ascii');
    const key = Buffer.from(process.env.INTER_KEY_BASE64, 'base64').toString('ascii');
    const httpsAgent = new https.Agent({ cert, key });

    // 2. Busca os boletos emitidos nos últimos 60 dias até 60 dias no futuro
    const hoje = new Date();
    const dataFinal = new Date(hoje.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; 
    const dataInicial = new Date(hoje.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Chamada à V3 do Banco Inter
    const response = await axios.get(
      `https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas?dataInicial=${dataInicial}&dataFinal=${dataFinal}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent
      }
    );

    const cobrancasInter = response.data.cobrancas || [];

    // 3. Puxa a lista de todos os seus clientes para fazer o "Match"
    const { data: clientesSupabase } = await supabaseAdmin.from('clientes').select('id, cnpj, cpf');
    let importados = 0;

    // 4. Analisa cada boleto retornado pelo banco
    for (const cob of cobrancasInter) {
      // Pega o CPF/CNPJ do pagador do boleto lá no Inter (vem só com números)
      const documentoPagador = cob.pagador?.cpfCnpj || '';
      if (!documentoPagador) continue;
      
      // Mágica 2: Acha o cliente no seu banco ignorando os pontos e traços do CNPJ
      const clienteMatch = clientesSupabase.find(c => {
        const docLimpo = (c.cnpj || c.cpf || '').replace(/\D/g, '');
        return docLimpo === documentoPagador;
      });

      // Se encontrou o cliente dono deste boleto...
      if (clienteMatch) {
        // Traduz a situação do banco para a linguagem do seu portal
        let statusInterno = 'pendente';
        if (cob.situacao === 'RECEBIDO') statusInterno = 'pago';
        if (cob.situacao === 'VENCIDO') statusInterno = 'atrasado';
        if (cob.situacao === 'CANCELADO') continue; // Pula os boletos cancelados

        const mesRefCorreto = obterMesRef(cob.dataVencimento);

        // O Inter não manda o link do PDF direto na lista. Vamos criar a nossa própria rota interna pra puxar o PDF depois!
        const linkMagicoPDF = `/api/boletos/pdf?nossoNumero=${cob.nossoNumero}`;

        // 5. Cadastra ou atualiza o boleto na tabela do Supabase (Aquele Unique serve pra não duplicar)
        await supabaseAdmin.from('boletos_api').upsert({
          cliente_id: clienteMatch.id,
          mes_ref: mesRefCorreto,
          nosso_numero: cob.nossoNumero,
          linha_digitavel: cob.linhaDigitavel,
          url_pdf: linkMagicoPDF,
          valor: cob.valorNominal,
          status: statusInterno,
          data_vencimento: cob.dataVencimento
        }, { onConflict: 'nosso_numero' });

        importados++;
      }
    }

    return NextResponse.json({ success: true, message: `${importados} boletos identificados e sincronizados com seus clientes!` });
  } catch (error) {
    console.error(error.response?.data || error);
    return NextResponse.json({ error: error.response?.data || error.message }, { status: 500 });
  }
}