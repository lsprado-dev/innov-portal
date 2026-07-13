import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

// Subindo 4 níveis exatos para achar a pasta lib na raiz do projeto
import { getInterToken } from '../../lib/inter'; 
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function obterMesRef(dataVencimento) {
  if (!dataVencimento) return 'Desconhecido';
  const mesVencimento = parseInt(dataVencimento.split('-')[1], 10);
  const mapa = {
    1: 'Dezembro', 2: 'Janeiro', 3: 'Fevereiro', 4: 'Março',
    5: 'Abril', 6: 'Maio', 7: 'Junho', 8: 'Julho',
    9: 'Agosto', 10: 'Setembro', 11: 'Outubro', 12: 'Novembro'
  };
  return mapa[mesVencimento] || 'Desconhecido';
}

export async function GET() {
  try {
    const token = await getInterToken();
    const cert = Buffer.from(process.env.INTER_CERT_BASE64, 'base64').toString('ascii');
    const key = Buffer.from(process.env.INTER_KEY_BASE64, 'base64').toString('ascii');
    const httpsAgent = new https.Agent({ cert, key });

    const dataLocal = new Date();
    dataLocal.setMinutes(dataLocal.getMinutes() - dataLocal.getTimezoneOffset());
    
    // 1. JANELA DINÂMICA DE 89 DIAS (Garante que nunca para de sincronizar o mês atual!)
    // Puxa exatamente os últimos 89 dias até hoje, respeitando o limite da API V3.
    const strFim = dataLocal.toISOString().split('T')[0];
    
    const dataInicio = new Date(dataLocal);
    dataInicio.setDate(dataInicio.getDate() - 89);
    const strIni = dataInicio.toISOString().split('T')[0];

    // EMISSAO voltou! Precisamos dele para achar os boletos que foram "Marcados como Recebido" manualmente no Inter,
    // pois eles somem do VENCIMENTO e não geram log de PAGAMENTO sistêmico.
    const tiposDeFiltro = ['VENCIMENTO', 'PAGAMENTO', 'EMISSAO'];
    const boletosMap = new Map();

    for (const tipoFiltro of tiposDeFiltro) {
      let paginaAtual = 0;
      let temMaisPaginas = true;

      while (temMaisPaginas) {
        try {
          // CORREÇÃO CRÍTICA DA PAGINAÇÃO API V3: Usar paginacao.itensPorPagina e paginacao.paginaAtual
          const response = await axios.get(
            `https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas?dataInicial=${strIni}&dataFinal=${strFim}&filtrarDataPor=${tipoFiltro}&paginacao.itensPorPagina=100&paginacao.paginaAtual=${paginaAtual}`,
            { headers: { Authorization: `Bearer ${token}` }, httpsAgent }
          );
          
          const lista = response.data.cobrancas || response.data.content || (Array.isArray(response.data) ? response.data : []);
          
          // DEDUPLICAÇÃO INTELIGENTE COM PROTEÇÃO DE STATUS
          for (const cob of lista) {
            const cobRoot = cob.cobranca || cob;
            const bolRoot = cob.boleto || cob;
            const id = cobRoot.codigoSolicitacao || cob.codigoSolicitacao || bolRoot.nossoNumero;
            
            if (!id) continue;

            if (!boletosMap.has(id)) {
              boletosMap.set(id, cob);
            } else {
              const sitNova = (cobRoot.situacao || '').toUpperCase();
              const valorPago = parseFloat(cobRoot.valorTotalRecebido || cobRoot.valorRecebido || 0);
              
              if (sitNova.includes('RECEBIDO') || sitNova.includes('PAGO') || sitNova.includes('BAIXADO') || valorPago > 0) {
                boletosMap.set(id, cob); 
              }
            }
          }

          // MÁGICA DA PAGINAÇÃO: Se a lista retornar menos de 100 itens, significa que chegamos na última página!
          if (lista.length < 100) {
            temMaisPaginas = false;
          } else {
            paginaAtual++;
          }
          
          // DELAY ANTI-BLOQUEIO: Dá um respiro para o Banco Inter não derrubar a nossa conexão
          await new Promise(r => setTimeout(r, 400));
          
        } catch (err) {
          console.error(`Falha no filtro ${tipoFiltro} (Pág ${paginaAtual}):`, err.response?.data || err.message);
          break; 
        }
      }
    }

    const cobrancasInter = Array.from(boletosMap.values());
    const { data: clientesSupabase } = await supabaseAdmin.from('clientes').select('id, cnpj, cpf');
    let importados = 0;

    for (const cob of cobrancasInter) {
      const dadosCobranca = cob.cobranca || cob;
      const dadosBoleto = cob.boleto || cob;

      const dataVenci = dadosCobranca.dataVencimento || dadosBoleto?.dataVencimento || cob.dataVencimento || dadosCobranca.dataEmissao || cob.dataEmissao;
      if (!dataVenci || dataVenci < strIni) continue; // Escudo que bloqueia lixo anterior a 01/06

      // Extração Blindada do CNPJ para garantir que bate com o portal
      const pagador = dadosCobranca.pagador || cob.pagador || {};
      const documentoPagador = (pagador.cpfCnpj || pagador.cnpjCpf || pagador.numeroCpfCnpj || pagador.cpf || pagador.cnpj || '').replace(/\D/g, '');
      if (!documentoPagador) continue;
      
      const clienteMatch = clientesSupabase.find(c => {
        const docLimpo = (c.cnpj || c.cpf || '').replace(/\D/g, '');
        return docLimpo === documentoPagador;
      });

      if (clienteMatch) {
        let statusInterno = 'pendente'; 
        const sit = (dadosCobranca.situacao || '').toUpperCase();
        
        const valorPago = parseFloat(dadosCobranca.valorTotalRecebido || dadosCobranca.valorRecebido || dadosCobranca.valorPago || 0);
        const recebimentos = dadosCobranca.recebimentos || cob.recebimentos || [];
        const origem = (dadosCobranca.origemRecebimento || cob.origemRecebimento || '').toUpperCase();
        
        // Se foi marcado manualmente como recebido no painel do Inter (situação exata MARCADO_RECEBIDO na API V3)
        // Injetamos a flag isPix para que ele fique classificado corretamente como "Pago via PIX" no seu Portal!
        const isMarcadoManual = sit === 'MARCADO_RECEBIDO' || sit.includes('MARCADO');
        const isPix = sit.includes('RECEBIDO_PIX') || origem === 'PIX' || recebimentos.some(r => (r.origemRecebimento || '').toUpperCase() === 'PIX') || isMarcadoManual;
        
        const hojeStr = dataLocal.toISOString().split('T')[0];

        // LÓGICA REFINADA: SEPARANDO CANCELADO DE EXPIRADO
        if (valorPago > 0 || sit.includes('RECEBIDO') || sit.includes('PAGO') || sit.includes('MARCADO') || sit.includes('ABATIDO')) {
            statusInterno = isPix ? 'pago via pix' : 'pago';
        } else if (sit.includes('CANCELADO') || sit.includes('BAIXADO')) {
            statusInterno = 'cancelado';
        } else if (sit.includes('EXPIRADO')) {
            statusInterno = 'expirado';
        } else {
            // Regra do 1 mês: Se passou 30 dias do vencimento e não foi pago, forçamos o status para expirado
            const dataVencimentoDate = new Date(`${dataVenci}T12:00:00Z`);
            const diffDias = (dataLocal - dataVencimentoDate) / (1000 * 3600 * 24);
            
            if (diffDias > 30) {
                statusInterno = 'expirado';
            } else if (sit.includes('VENCIDO') || sit.includes('ATRASADO') || dataVenci < hojeStr) {
                statusInterno = 'atrasado';
            } else {
                statusInterno = 'pendente';
            }
        }

        const mesRefCorreto = obterMesRef(dataVenci);
        const idCobranca = dadosCobranca.codigoSolicitacao || cob.codigoSolicitacao || dadosBoleto?.nossoNumero;
        const linhaDigitavel = dadosBoleto?.linhaDigitavel || '';
        const linkMagicoPDF = `/api/boletos/pdf?nossoNumero=${idCobranca}`;

        const payloadUpsert = {
          cliente_id: clienteMatch.id,
          mes_ref: mesRefCorreto,
          nosso_numero: idCobranca,
          url_pdf: linkMagicoPDF,
          valor: dadosCobranca.valorNominal || dadosCobranca.valorTotal || 0,
          status: statusInterno,
          data_vencimento: dataVenci
        };
        
        if (linhaDigitavel) {
          payloadUpsert.linha_digitavel = linhaDigitavel;
        }

        await supabaseAdmin.from('boletos_api').upsert(payloadUpsert, { onConflict: 'nosso_numero' });
        importados++;
      }
    }

    return NextResponse.json({ success: true, message: `${importados} boletos sincronizados com o banco de dados!` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}