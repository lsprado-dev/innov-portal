import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

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
    
    // 1. JANELA DESLIZANTE DE 85 DIAS:
    // Garante que não tomamos bloqueio do banco (Rate Limit) por excesso de requisições.
    // Como a regra de negócio exige tudo dentro do mês, 85 dias cobrem Junho, Julho e o futuro próximo.
    let dataFim = new Date(dataLocal);
    dataFim.setDate(dataFim.getDate() + 25);
    
    let dataIni = new Date(dataFim);
    dataIni.setDate(dataIni.getDate() - 85);
    
    // Trava rígida: Nunca puxar lixo antes de 1º de Junho.
    const corteJunho = new Date('2026-06-01T00:00:00Z');
    if (dataIni < corteJunho) dataIni = corteJunho;

    const strIni = dataIni.toISOString().split('T')[0];
    const strFim = dataFim.toISOString().split('T')[0];

    const tiposDeFiltro = ['VENCIMENTO', 'EMISSAO', 'PAGAMENTO'];
    const boletosMap = new Map(); // 2. O MAPA MÁGICO: Impede que o Inter minta para nós.

    for (const tipoFiltro of tiposDeFiltro) {
      let paginaAtual = 0;
      let totalPaginas = 1;

      while (paginaAtual < totalPaginas) {
        try {
          const response = await axios.get(
            `https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas?dataInicial=${strIni}&dataFinal=${strFim}&filtrarDataPor=${tipoFiltro}&tamanhoPagina=100&paginaAtual=${paginaAtual}`,
            { headers: { Authorization: `Bearer ${token}` }, httpsAgent }
          );
          
          const lista = response.data.cobrancas || response.data.content || (Array.isArray(response.data) ? response.data : []);
          
          // DEDUPLICAÇÃO INTELIGENTE: Se o boleto já está na memória como PAGO, 
          // não deixa o filtro de VENCIMENTO rebaixar ele para pendente!
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
                boletosMap.set(id, cob); // Mantém sempre a versão que atesta o pagamento
              }
            }
          }

          totalPaginas = response.data.totalPaginas || response.data.totalPages || 1;
          paginaAtual++;
        } catch (err) {
          console.error(`Falha no filtro ${tipoFiltro}:`, err.response?.data || err.message);
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
      if (!dataVenci) continue;

      // Escudo final de segurança
      if (dataVenci < '2026-06-01') continue;

      const documentoPagador = (dadosCobranca.pagador?.cpfCnpj || dadosCobranca.pagador?.cnpjCpf || '').replace(/\D/g, '');
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
        const origem = dadosCobranca.origemRecebimento || cob.origemRecebimento || '';
        const isPix = sit.includes('RECEBIDO_PIX') || origem === 'PIX' || recebimentos.some(r => r.origemRecebimento === 'PIX');
        
        const hojeStr = dataLocal.toISOString().split('T')[0];

        if (valorPago > 0 || sit.includes('RECEBIDO') || sit.includes('PAGO') || sit.includes('MARCADO') || sit.includes('ABATIDO')) {
            statusInterno = isPix ? 'pago via pix' : 'pago';
        } else if (sit.includes('CANCELADO') || sit.includes('BAIXADO') || sit.includes('EXPIRADO')) {
            statusInterno = 'expirado';
        } else if (sit.includes('VENCIDO') || sit.includes('ATRASADO') || dataVenci < hojeStr) {
            statusInterno = 'atrasado';
        } else {
            statusInterno = 'pendente';
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