import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

// E-mails reais e atualizados da sua equipe
const EQUIPE_INTERNA = {
  'victor@innovbusiness.com.br': 'Victor (Admin)',
  'societario@innovbusiness.com.br': 'Maria (Societário)',
  'mensalistas@innovbusiness.com.br': 'Helena (Societário e Suporte)',
  'fiscal2@innovbusiness.com.br': 'Nogueira (Fiscal)',
  'contabil@innovbusiness.com.br': 'Vanessa (Contábil)',
  'fiscal@innovbusiness.com.br': 'Luiza (Fiscal)',
  'rh@innovbusiness.com.br': 'Karen (RH)',
  'suporte@innovbusiness.com.br': 'Beatriz (Suporte)',
  'lucas@innovbusiness.com.br': 'Lucas (Financeiro)'
};

// Função de criptografia reversível para validar os Clientes
const encriptarSenha = (text) => {
  if (!text) return '';
  return btoa(text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join(''));
};

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Limpa espaços invisíveis e converte tudo para minúsculo
    let emailTratado = email.trim().toLowerCase(); 

    let emailFinal = emailTratado;
    if (!emailTratado.includes('@')) {
      emailFinal = `${emailTratado}@innovbusiness.com.br`;
    }

    // ========================================================
    // 1. Validação da Equipe Interna (Via Supabase Auth Nativo)
    // ========================================================
    if (EQUIPE_INTERNA[emailFinal]) {
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: emailFinal,
        password: password,
      });

      if (authData?.user) {
        const nomeAdmin = authData.user.user_metadata?.nome || EQUIPE_INTERNA[emailFinal];
        return NextResponse.json({ success: true, tipo: 'interno', nome: nomeAdmin, id: authData.user.id });
      } else {
        return NextResponse.json({ success: false, error: 'Senha incorreta para este membro da equipe.' }, { status: 401 });
      }
    }

    // ========================================================
    // 2. Validação do Cliente (Titular principal ou Sócio)
    // ========================================================
    let clienteFinal = null;
    let isSocio = false;
    let socioDados = null;

    // A) Primeiro, procura pelo e-mail do titular da empresa
    const { data: clienteTitular } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', emailFinal)
      .maybeSingle();

    if (clienteTitular) {
      clienteFinal = clienteTitular;
    } else {
      // B) Se não for o titular, VARREDURA FLEXÍVEL NO JSON! 
      // Puxa os clientes e acha o sócio sem ligar pra maiúsculas ou minúsculas
      const { data: todosClientes } = await supabase.from('clientes').select('*');
      
      if (todosClientes) {
        for (const cli of todosClientes) {
          if (cli.socios && Array.isArray(cli.socios)) {
            const socioEncontrado = cli.socios.find(s => s.email && s.email.trim().toLowerCase() === emailFinal);
            if (socioEncontrado) {
              clienteFinal = cli;
              isSocio = true;
              socioDados = socioEncontrado;
              break; // Achou o sócio, para a busca na hora!
            }
          }
        }
      }
    }

    // Se depois disso tudo não achou ninguém, bloqueia o acesso
    if (!clienteFinal) {
      return NextResponse.json({ success: false, error: 'Usuário ou e-mail não encontrado no sistema.' }, { status: 404 });
    }

    // ========================================================
    // 3. Validação de Senha (Titular VS Sócio)
    // ========================================================
    const senhaCriptografadaDigitada = encriptarSenha(password);
    
    // Regra da senha padrão (6 primeiros dígitos do CNPJ)
    const apenasNumeros = clienteFinal.cnpj.replace(/\D/g, '');
    const senhaCNPJ = apenasNumeros.substring(0, 6);

    let loginAprovado = false;

    if (isSocio) {
      // Compara com a senha do JSON do sócio
      if (socioDados.senha === senhaCriptografadaDigitada || password === senhaCNPJ) loginAprovado = true;
    } else {
      // Compara com a senha do titular
      if (clienteFinal.senha === senhaCriptografadaDigitada || password === senhaCNPJ) loginAprovado = true;
    }

    if (loginAprovado) {
      // Se for sócio, mostra o nome dele no topo da tela. Se não, mostra o contato da empresa.
      const nomePainel = isSocio ? socioDados.nome : (clienteFinal.nome_contato || clienteFinal.nome_empresa || 'Cliente');

      return NextResponse.json({
        success: true,
        tipo: 'cliente',
        nome: nomePainel,
        id: clienteFinal.id
      });
    } else {
      return NextResponse.json({ success: false, error: 'Senha incorreta para esta conta.' }, { status: 401 });
    }
    
  } catch (err) {
    console.error('Erro crítico na rota de autenticação:', err.message);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor de login.' }, { status: 500 });
  }
}