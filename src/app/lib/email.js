'use server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function enviarEmailDemanda({ 
  to, 
  nomeDestinatario, 
  nomeRemetente, 
  tituloDemanda, 
  descricao, 
  prazo 
}) {
  // Pega apenas o primeiro nome para deixar o e-mail pessoal
  const primeiroNome = nomeDestinatario.split(' ')[0];

  try {
    const { data, error } = await resend.emails.send({
      from: 'Innov Portal <sistema@innovbusiness.com.br>',
      to: [to],
      subject: `Nova Tarefa: ${tituloDemanda}`,
      html: `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);">

            <div style="background-color: #ffffff; padding: 35px 20px; text-align: center; border-bottom: 3px solid #d4af37;">
              <img src="https://portal.innovbusiness.com.br/icon.png" alt="Logo Innovative Business" style="width: 110px; height: auto; display: block; margin: 0 auto; border-radius: 20px;" />
            </div>

            <div style="padding: 40px 30px;">
              <h2 style="color: #0d1b2a; font-size: 24px; margin-top: 0; font-weight: 700;">Olá, ${primeiroNome}!</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Você acabou de receber uma nova demanda no portal. Confira os detalhes abaixo:
              </p>

              <div style="background-color: #f8fafc; border-left: 4px solid #d4af37; padding: 20px; margin: 30px 0; border-radius: 4px; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                <p style="color: #0d1b2a; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">
                  📌 ${tituloDemanda}
                </p>
                <p style="color: #334155; margin: 0 0 10px 0; font-size: 15px;">
                   <strong>Enviado por:</strong> <span style="color: #64748b;">${nomeRemetente}</span>
                </p>
                <p style="color: #334155; margin: 0 0 10px 0; font-size: 15px;">
                   <strong>Prazo de Entrega:</strong> <span style="color: #dc2626; font-weight: bold;">${prazo}</span>
                </p>
                <p style="color: #334155; margin: 0; font-size: 15px;">
                  <strong>O que fazer:</strong> <br/>
                  <span style="color: #64748b; display: inline-block; margin-top: 5px; line-height: 1.5;">${descricao}</span>
                </p>
              </div>

              <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                <a href="https://portal.innovbusiness.com.br" target="_blank" style="background-color: #d4af37; color: #0d1b2a; padding: 16px 36px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(212,175,55,0.2);">
                  Acessar Portal
                </a>
              </div>
            </div>

            <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                © 2026 Innovative Business. Todos os direitos reservados.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0 0;">
                Desenvolvido por <a href="https://lucasprado.space/pt/" style="color: #d4af37; text-decoration: none; font-weight: 600;">Lucas Prado</a>
              </p>
            </div>

          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Erro no Resend:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Erro no disparo:", err);
    return { success: false, error: err };
  }
}