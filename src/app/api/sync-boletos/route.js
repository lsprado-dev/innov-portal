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

    const anoBase = new Date().getFullYear();
    let cobrancasInter = [];

    // Começamos do mês 5 (Maio) para garantir que pegamos tudo que vence a partir de Junho.
    const mesesBlocos = [];
    for (let i = 5; i <= 12; i++) {
      const mesStr = String(i).padStart(2, '0');
      const ultimoDia = new Date(anoBase, i, 0).getDate();
      mesesBlocos.push({
        ini: `${anoBase}-${mesStr}-01`,
        fim: `${anoBase}-${mesStr}-${ultimoDia}`
      });
    }

    // A MÁGICA DEFINITIVA: 
    // Usamos apenas os parâmetros oficiais da V3. 'PAGAMENTO' é a chave para o Inter "cuspir" 
    // os boletos que foram liquidados instantaneamente via QR Code (Bolepix).
    const tiposDeFiltro = ['VENCIMENTO', 'EMISSAO', 'PAGAMENTO'];

    for (const bloco of mesesBlocos) {
      for (const tipoFiltro of tiposDeFiltro) {
        let paginaAtual = 0;
        let totalPaginas = 1;

        while (paginaAtual < totalPaginas) {
          try {
            const response = await axios.get(
              `https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas?dataInicial=${bloco.ini}&dataFinal=${bloco.fim}&filtrarDataPor=${tipoFiltro}&tamanhoPagina=100&paginaAtual=${paginaAtual}`,
              { headers: { Authorization: `Bearer ${token}` }, httpsAgent }
            );
            
            const lista = response.data.cobrancas || response.data.content || (Array.isArray(response.data) ? response.data : []);
            cobrancasInter.push(...lista);

            totalPaginas = response.data.totalPaginas || response.data.totalPages || 1;
            paginaAtual++;
          } catch (err) {
            console.error(`Falha no bloco ${bloco.ini} com filtro ${tipoFiltro}:`, err.response?.data || err.message);
            break; 
          }
        }
      }
    }

    const { data: clientesSupabase } = await supabaseAdmin.from('clientes').select('id, cnpj, cpf');
    let importados = 0;

    for (const cob of cobrancasInter) {
      const dadosCobranca = cob.cobranca || cob;
      const dadosBoleto = cob.boleto || cob;

      // 1. Garantia de Vencimento
      const dataVenci = dadosCobranca.dataVencimento || dadosBoleto?.dataVencimento || cob.dataVencimento || dadosCobranca.dataEmissao || cob.dataEmissao;
      if (!dataVenci) continue;

      // ESCUDO DE TITÂNIO: Ignorar absolutamente TUDO o que vencer antes de 1º de Junho do ano atual.
      const dataCorte = `${anoBase}-06-01`;
      if (dataVenci < dataCorte) continue;

      // 2. Limpeza brutal do CPF/CNPJ
      const documentoPagador = (dadosCobranca.pagador?.cpfCnpj || dadosCobranca.pagador?.cnpjCpf || '').replace(/\D/g, '');
      if (!documentoPagador) continue;
      
      const clienteMatch = clientesSupabase.find(c => {
        const docLimpo = (c.cnpj || c.cpf || '').replace(/\D/g, '');
        return docLimpo === documentoPagador;
      });

      if (clienteMatch) {
        let statusInterno = 'pendente'; 
        const sit = (dadosCobranca.situacao || '').toUpperCase();
        
        // MÁGICA: Verifica se pingou qualquer valor financeiro real nesse boleto
        const valorPago = parseFloat(dadosCobranca.valorTotalRecebido || dadosCobranca.valorRecebido || dadosCobranca.valorPago || 0);
        
        // Identificação real do PIX pela API V3
        const recebimentos = dadosCobranca.recebimentos || cob.recebimentos || [];
        const origem = dadosCobranca.origemRecebimento || cob.origemRecebimento || '';
        const isPix = sit.includes('RECEBIDO_PIX') || origem === 'PIX' || recebimentos.some(r => r.origemRecebimento === 'PIX');
        
        // Pega a data de hoje correta no fuso horário para saber se já passou do vencimento
        const dataLocal = new Date();
        dataLocal.setMinutes(dataLocal.getMinutes() - dataLocal.getTimezoneOffset());
        const hojeStr = dataLocal.toISOString().split('T')[0];

        // LÓGICA DE STATUS
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

        // Upsert blindado para não apagar linha digitável caso o Inter omita no pagamento via PIX
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