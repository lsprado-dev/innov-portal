import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';
import { getInterToken } from '../../lib/inter';
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

    // 2. MÁGICA RETROATIVA: Busca o passado (1 ano inteiro em blocos de 90 dias para não bloquear a API) e o futuro
    let cobrancasInter = [];
    
    // Cria 5 janelas de tempo (4 pro passado de 90 dias + 1 pro futuro)
    const janelasDeBusca = [];
    
    // Janela Futura (hoje até +90 dias)
    const hojeData = new Date();
    const futuroData = new Date(hojeData.getTime() + 90 * 24 * 60 * 60 * 1000);
    janelasDeBusca.push({ inicio: hojeData.toISOString().split('T')[0], fim: futuroData.toISOString().split('T')[0] });

    // Janelas Passadas (Volta 360 dias)
    for (let i = 0; i < 4; i++) {
      const fimPassado = new Date(hojeData.getTime() - (i * 90) * 24 * 60 * 60 * 1000);
      const inicioPassado = new Date(hojeData.getTime() - ((i + 1) * 90) * 24 * 60 * 60 * 1000);
      janelasDeBusca.push({ inicio: inicioPassado.toISOString().split('T')[0], fim: fimPassado.toISOString().split('T')[0] });
    }

    // Varre todas as janelas de tempo pedindo os boletos pro Inter
    for (const janela of janelasDeBusca) {
      try {
        const response = await axios.get(
          `https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas?dataInicial=${janela.inicio}&dataFinal=${janela.fim}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent
          }
        );
        
        // MÁGICA DE PREVENÇÃO: Aceita qualquer formato que o Inter V3 decida devolver
        const lista = response.data.cobrancas || response.data.content || (Array.isArray(response.data) ? response.data : []);
        cobrancasInter.push(...lista);

      } catch (err) {
        console.error(`Aviso: Falha ao buscar janela ${janela.inicio} a ${janela.fim}`);
      }
    }

    // 3. Puxa a lista de todos os seus clientes para fazer o "Match"
    const { data: clientesSupabase } = await supabaseAdmin.from('clientes').select('id, cnpj, cpf');
    let importados = 0;

    // 4. Analisa cada boleto retornado pelo banco
    for (const cob of cobrancasInter) {
      // Na V3 do Inter, os dados vêm dentro de "gavetas"
      const dadosCobranca = cob.cobranca || cob;
      const dadosBoleto = cob.boleto || cob;

      // Pega o CPF/CNPJ do pagador do boleto lá no Inter
      const documentoPagador = dadosCobranca.pagador?.cpfCnpj || '';
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
        if (dadosCobranca.situacao === 'RECEBIDO' || dadosCobranca.situacao === 'PAGO') statusInterno = 'pago';
        if (dadosCobranca.situacao === 'VENCIDO' || dadosCobranca.situacao === 'ATRASADO') statusInterno = 'atrasado';
        if (dadosCobranca.situacao === 'CANCELADO' || dadosCobranca.situacao === 'EXPIRADO') continue;

        const mesRefCorreto = obterMesRef(dadosCobranca.dataVencimento);

        // O identificador mudou de nossoNumero para codigoSolicitacao na V3
        const idCobranca = dadosCobranca.codigoSolicitacao || cob.codigoSolicitacao || dadosBoleto.nossoNumero;
        const linhaDigitavel = dadosBoleto.linhaDigitavel || '';

        // O link gerador de PDF agora vai usar esse código novo da V3!
        const linkMagicoPDF = `/api/boletos/pdf?nossoNumero=${idCobranca}`;

        // 5. Cadastra ou atualiza o boleto na tabela
        await supabaseAdmin.from('boletos_api').upsert({
          cliente_id: clienteMatch.id,
          mes_ref: mesRefCorreto,
          nosso_numero: idCobranca, // Salva o codigoSolicitacao no banco para o Webhook bater certinho!
          linha_digitavel: linhaDigitavel,
          url_pdf: linkMagicoPDF,
          valor: dadosCobranca.valorNominal || dadosCobranca.valorTotal || 0,
          status: statusInterno,
          data_vencimento: dadosCobranca.dataVencimento
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