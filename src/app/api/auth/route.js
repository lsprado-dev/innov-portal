import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

// E-mails reais e atualizados da sua equipe
const EQUIPE_INTERNA = {
  'victor@innovbusiness.com.br': 'Victor (Admin)',
  'societario@innovbusiness.com.br': 'Maria (Societário)',
  'mensalistas@innovbusiness.com.br': 'Helena (Contábil)',
  'fiscal@innovbusiness.com.br': 'Luiza (Fiscal)',
  'rh@innovbusiness.com.br': 'Karen (RH)',
  'supporte@innovbusiness.com.br': 'Beatriz (Suporte)', // Mantive 'supporte' conforme o seu SQL
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
      // Usa o e-mail real e a senha limpa para validar no Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailFinal,
        password: password,
      });

      if (authData?.user) {
        // Puxa o nome do metadata ou usa o fallback do objeto EQUIPE_INTERNA
        const nomeAdmin = authData.user.user_metadata?.nome || EQUIPE_INTERNA[emailFinal];
        
        return NextResponse.json({
          success: true,
          tipo: 'interno',
          nome: nomeAdmin,
          id: authData.user.id
        });
      } else {
        return NextResponse.json({ success: false, error: 'Senha incorreta para este membro da equipe.' }, { status: 401 });
      }
    }

    // ========================================================
    // 2. Validação do Cliente (Via tabela customizada 'clientes')
    // ========================================================
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', emailFinal)
      .maybeSingle();

    if (clienteError) {
      console.error('Erro ao buscar no Supabase:', clienteError.message);
      return NextResponse.json({ success: false, error: 'Erro de comunicação com o banco de dados.' }, { status: 500 });
    }

    if (cliente) {
      // Criptografa a senha digitada para comparar com o que está salvo no banco
      const senhaCriptografadaCliente = encriptarSenha(password);

      // Regra da senha padrão (6 primeiros dígitos do CNPJ)
      const apenasNumeros = cliente.cnpj.replace(/\D/g, '');
      const senhaCNPJ = apenasNumeros.substring(0, 6);

      // Permite o login se for a senha padrão OU a senha nova alterada e criptografada
      if (password === senhaCNPJ || cliente.senha === senhaCriptografadaCliente) {
        return NextResponse.json({
          success: true,
          tipo: 'cliente',
          nome: cliente.nome_contato || 'Cliente',
          id: cliente.id
        });
      } else {
        return NextResponse.json({ success: false, error: 'Senha incorreta para esta empresa.' }, { status: 401 });
      }
    }

    // ========================================================
    // 3. Se não achou na equipe e nem nos clientes
    // ========================================================
    return NextResponse.json({ success: false, error: 'Usuário ou e-mail não encontrado no sistema.' }, { status: 404 });
    
  } catch (err) {
    console.error('Erro crítico na rota de autenticação:', err.message);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor de login.' }, { status: 500 });
  }
}