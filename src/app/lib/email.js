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
  const primeiroNome = nomeDestinatario.split(' ')[0];

  try {
    const { data, error } = await resend.emails.send({
      from: 'Innov Portal <sistema@innovbusiness.com.br>',
      to: [to],
      subject: `📋 Nova Demanda: ${tituloDemanda}`,
      html: `
        <div style="background-color: #050a0f; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0d1b2a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.8);">

            <div style="background-color: #0b1622; padding: 35px 20px; text-align: center; border-bottom: 3px solid #d4af37;">
              <img src="https://portal.innovbusiness.com.br/icon.png" alt="Logo Innovative Business" style="width: 110px; height: auto; display: block; margin: 0 auto; border-radius: 20px;" />
            </div>

            <div style="padding: 40px 30px;">
              <h2 style="color: #ffffff; font-size: 24px; margin-top: 0;">Olá, ${primeiroNome}!</h2>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
                Você acabou de receber uma nova demanda no portal. Confira os detalhes abaixo:
              </p>

              <div style="background-color: #112236; border-left: 4px solid #d4af37; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #d4af37; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">
                  📌 ${tituloDemanda}
                </p>
                <p style="color: #e2e8f0; margin: 0 0 10px 0; font-size: 15px;">
                   <strong>Enviado por:</strong> <span style="color: #94a3b8;">${nomeRemetente}</span>
                </p>
                <p style="color: #e2e8f0; margin: 0 0 10px 0; font-size: 15px;">
                   <strong>Prazo de Entrega:</strong> <span style="color: #ef4444; font-weight: bold;">${prazo}</span>
                </p>
                <p style="color: #e2e8f0; margin: 0; font-size: 15px;">
                  <strong>O que fazer:</strong> <br/>
                  <span style="color: #94a3b8; display: inline-block; margin-top: 5px;">${descricao}</span>
                </p>
              </div>

              <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                <a href="https://portal.innovbusiness.com.br" target="_blank" style="background-color: #d4af37; color: #0d1b2a; padding: 16px 36px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
                  Acessar Portal
                </a>
              </div>
            </div>

            <div style="background-color: #0b1622; padding: 20px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="color: #475569; font-size: 13px; margin: 0;">
                © 2026 Innovative Business. Todos os direitos reservados.
              </p>
              <p style="color: #475569; font-size: 12px; margin: 8px 0 0 0;">
                Desenvolvido por <a href="https://lucasprado.space/pt/" style="color: #d4af37; text-decoration: none;">Lucas Prado</a>
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