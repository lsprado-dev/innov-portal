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

    // MÁGICA SUPREMA (O Hack da Comunidade):
    // Boletos pagos via Pix DESAPARECEM da busca por "VENCIMENTO".
    // Eles só aparecem se buscarmos por "SITUACAO" (Data em que o status mudou para pago).
    // Começamos do mês 5 (Maio) para garantir que não escapa nada que vença em Junho.
    const mesesBlocos = [];
    for (let i = 5; i <= 12; i++) {
      const mesStr = String(i).padStart(2, '0');
      const ultimoDia = new Date(anoBase, i, 0).getDate();
      mesesBlocos.push({
        ini: `${anoBase}-${mesStr}-01`,
        fim: `${anoBase}-${mesStr}-${ultimoDia}`
      });
    }

    // Faremos 2 varreduras em cada mês: Uma por VENCIMENTO (boletos abertos/normais) e outra por SITUACAO (Bolepix escondido).
    const tiposDeFiltro = ['VENCIMENTO', 'SITUACAO'];

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

      // 1. Garantia de Vencimento (Se o Inter engolir o vencimento no Pix, usamos a data de emissão como salva-vidas)
      const dataVenci = dadosCobranca.dataVencimento || dadosBoleto?.dataVencimento || cob.dataVencimento || dadosCobranca.dataEmissao || cob.dataEmissao;
      if (!dataVenci) continue;

      // ESCUDO DE TITÂNIO: Ignorar absolutamente TUDO o que vencer antes de 1º de Junho do ano atual.
      // Isso extermina de vez o bug do lixo antigo (Ex: Ref: Dezembro Vence 20/01/2026).
      const dataCorte = `${anoBase}-06-01`;
      if (dataVenci < dataCorte) continue;

      // 2. Limpeza brutal do CPF/CNPJ (Garante que só sobram números para a comparação perfeita)
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
        
        // Identificação real do PIX pela API V3 (Evita sobrescrever o webhook e salva a pátria)
        const recebimentos = dadosCobranca.recebimentos || cob.recebimentos || [];
        const origem = dadosCobranca.origemRecebimento || cob.origemRecebimento || '';
        const isPix = sit.includes('RECEBIDO_PIX') || origem === 'PIX' || recebimentos.some(r => r.origemRecebimento === 'PIX');
        
        // Pega a data de hoje correta no fuso horário para saber se já passou do vencimento
        const dataLocal = new Date();
        dataLocal.setMinutes(dataLocal.getMinutes() - dataLocal.getTimezoneOffset());
        const hojeStr = dataLocal.toISOString().split('T')[0];

        // 1. SE FOI PAGO OU ABATIDO (Dinheiro > 0 ou status de recebimento/abatimento)
        if (valorPago > 0 || sit.includes('RECEBIDO') || sit.includes('PAGO') || sit.includes('MARCADO') || sit.includes('ABATIDO')) {
            statusInterno = isPix ? 'pago via pix' : 'pago';
        } 
        // 2. SE O BANCO MATOU O BOLETO DE VEZ (Cancelado, Baixado ou Expirado)
        else if (sit.includes('CANCELADO') || sit.includes('BAIXADO') || sit.includes('EXPIRADO')) {
            statusInterno = 'expirado';
        } 
        // 3. SE ATRASOU MAS AINDA ESTÁ VIVO (Passou da data de vencimento, mas não foi cancelado)
        else if (sit.includes('VENCIDO') || sit.includes('ATRASADO') || dataVenci < hojeStr) {
            statusInterno = 'atrasado';
        } 
        // 4. SE ESTÁ TUDO OK NO PRAZO
        else {
            statusInterno = 'pendente';
        }

        const mesRefCorreto = obterMesRef(dataVenci);
        const idCobranca = dadosCobranca.codigoSolicitacao || cob.codigoSolicitacao || dadosBoleto?.nossoNumero;
        const linhaDigitavel = dadosBoleto?.linhaDigitavel || '';
        const linkMagicoPDF = `/api/boletos/pdf?nossoNumero=${idCobranca}`;

        // Montamos o payload de Upsert com cuidado para NÃO zerar a linha digitável se ela vier vazia no PIX
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