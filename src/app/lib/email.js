'use server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Dicionário para traduzir o número do passo no nome real dele no e-mail
const MAPA_PASSOS_SOCIETARIO = {
  1: 'Viabilidade',
  2: 'DBE (Receita Federal)',
  3: 'Pagamento da Taxa DARE',
  4: 'Emissão de Docs/Contrato',
  5: 'Assinatura de Documentos',
  6: 'Registro na Junta Comercial',
  7: 'Protocolar Processo',
  8: 'Deferido (Concluído)'
};

// ============================================================================
// 1. FUNÇÃO: ENVIO DE DEMANDAS (Automático ao gerar demandas)
// ============================================================================
export async function enviarEmailDemanda({ 
  to, 
  nomeDestinatario, 
  nomeRemetente, 
  tituloDemanda, 
  descricao, 
  prazo 
}) {
  const primeiroNome = nomeDestinatario.split(' ')[0];

  try {
    const { data, error } = await resend.emails.send({
      from: 'Innov Portal <sistema@innovbusiness.com.br>',
      to: [to],
      subject: `📌 Nova Demanda: ${tituloDemanda}`,
      html: `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background-color: #ffffff; padding: 35px 20px; text-align: center; border-bottom: 3px solid #d4af37;">
              <img src="https://portal.innovbusiness.com.br/icon.png" alt="Logo Innovative" style="width: 110px; height: auto; display: block; margin: 0 auto; border-radius: 20px;" />
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #0d1b2a; font-size: 24px; margin-top: 0; font-weight: 700;">Olá, ${primeiroNome}!</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Você acabou de receber uma nova demanda no portal. Confira os detalhes abaixo:
              </p>
              <div style="background-color: #f8fafc; border-left: 4px solid #d4af37; padding: 20px; margin: 30px 0; border-radius: 4px; border: 1px solid #e2e8f0; border-left-width: 4px; border-left-color: #d4af37;">
                <p style="color: #0d1b2a; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">📌 ${tituloDemanda}</p>
                <p style="color: #334155; margin: 0 0 10px 0; font-size: 15px;"><strong>Enviado por:</strong> <span style="color: #64748b;">${nomeRemetente}</span></p>
                <p style="color: #334155; margin: 0 0 10px 0; font-size: 15px;"><strong>Prazo de Entrega:</strong> <span style="color: #dc2626; font-weight: bold;">${prazo}</span></p>
                <p style="color: #334155; margin: 0; font-size: 15px;">
                  <strong>O que fazer:</strong> <br/>
                  <span style="color: #64748b; display: block; margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${descricao}</span>
                </p>
              </div>
              <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                <a href="https://portal.innovbusiness.com.br" target="_blank" style="background-color: #d4af37; color: #0d1b2a; padding: 16px 36px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">Acessar Portal</a>
              </div>
            </div>
            <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">© 2026 Innovative Business. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err };
  }
}

// ============================================================================
// 2. FUNÇÃO: RELATÓRIO DIÁRIO DE GESTÃO (Segunda a Sexta às 8h)
// ============================================================================
export async function enviarRelatorioDiario({ 
  to, 
  nomeGestor,
  colaboradores = [], 
  processosSocietarios = [] 
}) {
  const primeiroNome = nomeGestor.split(' ')[0];
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  // 1. Tabela Dinâmica de Colaboradores
  const htmlColaboradores = colaboradores.length === 0
    ? `<tr><td colspan="3" style="padding: 15px; text-align: center; color: #64748b; font-style: italic;">Nenhum dado de produtividade hoje.</td></tr>`
    : colaboradores.map(colab => {
        const corStatus = colab.cor || '#10b981';
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #1b263b; color: #f1f5f9; font-weight: bold;">${colab.nome}</td>
            <td style="padding: 12px; border-bottom: 1px solid #1b263b; color: #94a3b8; font-size: 13px;">${colab.setor}</td>
            <td style="padding: 12px; border-bottom: 1px solid #1b263b; text-align: right;">
              <span style="background-color: ${corStatus}20; color: ${corStatus}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid ${corStatus}40;">
                ${colab.status || 'Tudo em dia'}
              </span>
            </td>
          </tr>
        `;
      }).join('');

  // 2. Condicional Inteligente: Se NÃO houver processos, o bloco inteiro do Societário desaparece
  let blocoSocietarioHtml = '';
  if (processosSocietarios && processosSocietarios.length > 0) {
    const htmlSocietarioLinhas = processosSocietarios.map(proc => {
      const numPasso = parseInt(proc.passo) || 1;
      const porcentagemCalculada = Math.round((numPasso / 8) * 100);
      const nomeDoPasso = MAPA_PASSOS_SOCIETARIO[numPasso] || 'Acompanhamento';
      const isFinished = numPasso === 8;

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #1b263b; color: ${isFinished ? '#10b981' : '#d4af37'}; font-weight: bold;">
            ${proc.titulo}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #1b263b; color: #94a3b8; font-size: 13px;">
            Passo ${numPasso}: ${nomeDoPasso}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #1b263b; text-align: right;">
            <div style="width: 100%; max-width: 100px; display: inline-block; background-color: #1b263b; border-radius: 4px; height: 6px; overflow: hidden; vertical-align: middle; margin-right: 8px;">
              <div style="width: ${porcentagemCalculada}%; background-color: ${isFinished ? '#10b981' : '#a855f7'}; height: 100%;"></div>
            </div>
            <span style="font-size: 11px; color: #f1f5f9; font-weight: bold; display: inline-block; min-width: 32px; text-align: right;">
              ${porcentagemCalculada}%
            </span>
          </td>
        </tr>
      `;
    }).join('');

    blocoSocietarioHtml = `
      <div style="background-color: #0d1b2a; border: 1px solid #1b263b; border-radius: 8px; overflow: hidden; margin-bottom: 35px;">
        <div style="background-color: #1b263b; padding: 12px 15px; border-bottom: 1px solid #2d3748;">
          <h3 style="margin: 0; color: #d4af37; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;"> Andamento Societário</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${htmlSocietarioLinhas}
          </tbody>
        </table>
      </div>
    `;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Innov Business <sistema@innovbusiness.com.br>',
      to: [to],
      subject: `📊 Tracking Diário de Operações - ${dataHoje}`,
      html: `
        <div style="background-color: #0d1b2a; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 650px; margin: 0 auto; background-color: #111f32; border: 1px solid #1b263b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            
            <div style="background: linear-gradient(180deg, #1b263b 0%, #111f32 100%); padding: 35px 20px; text-align: center; border-bottom: 2px solid #d4af37;">
              <img src="https://portal.innovbusiness.com.br/icon.png" alt="Logo" style="width: 90px; margin-bottom: 15px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);" />
              <h1 style="color: #d4af37; font-size: 22px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Tracking Operacional</h1>
              <p style="color: #94a3b8; font-size: 14px; margin: 5px 0 0 0;">Resumo de Produtividade • ${dataHoje}</p>
            </div>

            <div style="padding: 30px;">
              <p style="color: #f1f5f9; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Olá, <strong style="color: #d4af37;">${primeiroNome}</strong>. Aqui está o resumo atualizado das operações da equipe Innov Business.
              </p>

              <div style="background-color: #0d1b2a; border: 1px solid #1b263b; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                <div style="background-color: #1b263b; padding: 12px 15px; border-bottom: 1px solid #2d3748;">
                  <h3 style="margin: 0; color: #a855f7; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Status da Equipe</h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tbody>
                    ${htmlColaboradores}
                  </tbody>
                </table>
              </div>

              ${blocoSocietarioHtml}

              <div style="text-align: center; margin-top: 20px;">
                <a href="https://portal.innovbusiness.com.br/admin" target="_blank" style="background-color: #d4af37; color: #0d1b2a; padding: 16px 40px; font-size: 15px; font-weight: 900; text-decoration: none; border-radius: 8px; display: inline-block; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(212,175,55,0.3);">
                  Visão Geral no Painel Gestor
                </a>
              </div>
            </div>

            <div style="background-color: #0a1520; padding: 25px; text-align: center; border-top: 1px solid #1b263b;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">Relatório gerado automaticamente pelo Portal Innov Business.</p>
              <p style="color: #475569; font-size: 11px; margin: 8px 0 0 0;">© 2026 • Confidencial - Uso restrito à Gestão.</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err };
  }
}

// ============================================================================
// 3. FUNÇÃO: ENVIO DE DOCUMENTOS (Com caminho da pasta)
// ============================================================================
export async function enviarEmailDocumento({ 
  to, 
  nomeDestinatario, 
  nomeRemetente, 
  tituloEmail, 
  mensagem,
  nomeArquivo,
  urlArquivo,
  caminhoPasta
}) {
  const primeiroNome = nomeDestinatario.split(' ')[0];

  try {
    const { data, error } = await resend.emails.send({
      from: 'Innov Portal <sistema@innovbusiness.com.br>',
      to: [to],
      subject: `📄 ${tituloEmail}`,
      html: `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background-color: #ffffff; padding: 35px 20px; text-align: center; border-bottom: 3px solid #d4af37;">
              <img src="https://portal.innovbusiness.com.br/icon.png" alt="Logo Innovative" style="width: 110px; height: auto; display: block; margin: 0 auto; border-radius: 20px;" />
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #0d1b2a; font-size: 24px; margin-top: 0; font-weight: 700;">Olá, ${primeiroNome}!</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Um novo documento foi disponibilizado para você pela nossa equipe.
              </p>
              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px; border: 1px solid #e2e8f0; border-left-width: 4px; border-left-color: #3b82f6;">
                <p style="color: #0d1b2a; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">📄 ${tituloEmail}</p>
                <p style="color: #334155; margin: 0 0 10px 0; font-size: 15px;"><strong>Enviado por:</strong> <span style="color: #64748b;">${nomeRemetente}</span></p>
                ${nomeArquivo ? `<p style="color: #334155; margin: 0 0 10px 0; font-size: 15px;"><strong>Arquivo:</strong> <span style="color: #3b82f6; font-family: monospace;">${nomeArquivo}</span></p>` : ''}
                ${caminhoPasta ? `<p style="color: #334155; margin: 0 0 15px 0; font-size: 15px;"><strong>Onde encontrar:</strong> <br/><span style="color: #64748b; font-size: 13px; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 5px;">${caminhoPasta}</span></p>` : ''}
                <div style="color: #334155; margin: 0; font-size: 15px;">
                  <strong>Mensagem:</strong> <br/>
                  <div style="color: #64748b; margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${mensagem}</div>
                </div>
              </div>
              
              ${urlArquivo ? `
                <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
                  <a href="${urlArquivo}" target="_blank" style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                    Visualizar / Baixar Documento
                  </a>
                </div>
              ` : ''}

              <div style="text-align: center; margin-top: 20px; margin-bottom: 20px;">
                <a href="https://portal.innovbusiness.com.br" target="_blank" style="background-color: #d4af37; color: #0d1b2a; padding: 16px 36px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">Acessar Portal</a>
              </div>
            </div>
            <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">© 2026 Innovative Business. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err };
  }
}