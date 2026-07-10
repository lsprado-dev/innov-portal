import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

// Ajuste da importação (Tente usar o atalho @/ padrão do Next.js)
// Se o @/ não funcionar no seu projeto, mude para: import { getInterToken } from '../../../../lib/inter';
import { getInterToken } from '@/lib/inter'; 
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function obterMesRef(dataVencimento) {
  const mesVencimento = parseInt(dataVencimento.split('-')[1], 10);
  const mapa = {
    1: 'Dezembro', 2: 'Janeiro', 3: 'Fevereiro', 4: 'Março',
    5: 'Abril', 6: 'Maio', 7: 'Junho', 8: 'Julho',
    9: 'Agosto', 10: 'Setembro', 11: 'Outubro', 12: 'Novembro'
  };
  return mapa[mesVencimento];
}

export async function GET() {
  try {
    const token = await getInterToken();
    const cert = Buffer.from(process.env.INTER_CERT_BASE64, 'base64').toString('ascii');
    const key = Buffer.from(process.env.INTER_KEY_BASE64, 'base64').toString('ascii');
    const httpsAgent = new https.Agent({ cert, key });

    const anoAtual = new Date().getFullYear().toString(); 
    let cobrancasInter = [];

    const trimestres = [
      { ini: `${anoAtual}-01-01`, fim: `${anoAtual}-03-31` },
      { ini: `${anoAtual}-04-01`, fim: `${anoAtual}-06-30` },
      { ini: `${anoAtual}-07-01`, fim: `${anoAtual}-09-30` },
      { ini: `${anoAtual}-10-01`, fim: `${anoAtual}-12-31` }
    ];

    for (const tri of trimestres) {
      let paginaAtual = 0;
      let totalPaginas = 1;

      while (paginaAtual < totalPaginas) {
        try {
          const response = await axios.get(
            `https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas?dataInicial=${tri.ini}&dataFinal=${tri.fim}&filtrarDataPor=VENCIMENTO&tamanhoPagina=100&paginaAtual=${paginaAtual}`,
            { headers: { Authorization: `Bearer ${token}` }, httpsAgent }
          );
          
          const lista = response.data.cobrancas || response.data.content || (Array.isArray(response.data) ? response.data : []);
          cobrancasInter.push(...lista);

          totalPaginas = response.data.totalPages || 1;
          paginaAtual++;
        } catch (err) {
          console.error(`Falha no trimestre ${tri.ini}:`, err.response?.data || err.message);
          break; 
        }
      }
    }

    const { data: clientesSupabase } = await supabaseAdmin.from('clientes').select('id, cnpj, cpf');
    let importados = 0;

    for (const cob of cobrancasInter) {
      const dadosCobranca = cob.cobranca || cob;
      const dadosBoleto = cob.boleto || cob;

      if (!dadosCobranca.dataVencimento || !dadosCobranca.dataVencimento.startsWith(anoAtual)) continue;

      const documentoPagador = dadosCobranca.pagador?.cpfCnpj || '';
      if (!documentoPagador) continue;
      
      const clienteMatch = clientesSupabase.find(c => {
        const docLimpo = (c.cnpj || c.cpf || '').replace(/\D/g, '');
        return docLimpo === documentoPagador;
      });

      if (clienteMatch) {
        let statusInterno = 'pendente'; 
        const sit = dadosCobranca.situacao;
        
        if (sit === 'RECEBIDO' || sit === 'PAGO' || sit === 'MARCADO_RECEBIDO') statusInterno = 'pago';
        else if (sit === 'VENCIDO' || sit === 'ATRASADO' || sit === 'EXPIRADO') statusInterno = 'expirado';
        else if (sit === 'CANCELADO') continue; 

        const mesRefCorreto = obterMesRef(dadosCobranca.dataVencimento);
        const idCobranca = dadosCobranca.codigoSolicitacao || cob.codigoSolicitacao || dadosBoleto.nossoNumero;
        const linhaDigitavel = dadosBoleto.linhaDigitavel || '';
        const linkMagicoPDF = `/api/boletos/pdf?nossoNumero=${idCobranca}`;

        await supabaseAdmin.from('boletos_api').upsert({
          cliente_id: clienteMatch.id,
          mes_ref: mesRefCorreto,
          nosso_numero: idCobranca, 
          linha_digitavel: linhaDigitavel,
          url_pdf: linkMagicoPDF,
          valor: dadosCobranca.valorNominal || dadosCobranca.valorTotal || 0,
          status: statusInterno,
          data_vencimento: dadosCobranca.dataVencimento
        }, { onConflict: 'nosso_numero' });

        importados++;
      }
    }

    return NextResponse.json({ success: true, message: `${importados} boletos capturados com sucesso pelo Vencimento!` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}