import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// 🔑 CHAVE MESTRA: Usamos o Service Role para o login poder ler o banco trancado
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

const encriptarSenha = (text) => {
  if (!text) return '';
  return btoa(text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join(''));
};

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    let emailTratado = email.trim().toLowerCase(); 
    let emailFinal = emailTratado;
    if (!emailTratado.includes('@')) {
      emailFinal = `${emailTratado}@innovbusiness.com.br`;
    }

    // ========================================================
    // 1. Validação da Equipe Interna (Admin)
    // ========================================================
    if (EQUIPE_INTERNA[emailFinal]) {
      const { data: authData } = await supabaseAdmin.auth.signInWithPassword({
        email: emailFinal,
        password: password,
      });

      if (authData?.user) {
        const nomeAdmin = authData.user.user_metadata?.nome || EQUIPE_INTERNA[emailFinal];
        
        // 🔥 NOVO: Geramos o Passe VIP pro Admin com a tag is_admin: true
        const tokenAdmin = jwt.sign(
          { aud: 'authenticated', role: 'authenticated', sub: authData.user.id, email: emailFinal, is_admin: true },
          process.env.SUPABASE_JWT_SECRET,
          { expiresIn: '7d' }
        );

        return NextResponse.json({ success: true, tipo: 'interno', nome: nomeAdmin, id: authData.user.id, token: tokenAdmin });
      } else {
        return NextResponse.json({ success: false, error: 'Senha incorreta para este membro da equipe.' }, { status: 401 });
      }
    }

    // ========================================================
    // 2. Validação do Cliente (Usando Supabase Admin)
    // ========================================================
    let clienteFinal = null;
    let isSocio = false;
    let socioDados = null;

    const { data: clienteTitular } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('email', emailFinal)
      .maybeSingle();

    if (clienteTitular) {
      clienteFinal = clienteTitular;
    } else {
      // Busca direto no banco usando JSONB, baixando apenas 1 cliente em vez de todos!
      const { data: clienteSocio } = await supabaseAdmin
        .from('clientes')
        .select('*')
        .contains('socios', `[{"email": "${emailFinal}"}]`)
        .maybeSingle();

      if (clienteSocio && clienteSocio.socios) {
        const socioEncontrado = clienteSocio.socios.find(s => s.email && s.email.trim().toLowerCase() === emailFinal);
        if (socioEncontrado) {
          clienteFinal = clienteSocio;
          isSocio = true;
          socioDados = socioEncontrado;
        }
      }
    }

    if (!clienteFinal) {
      return NextResponse.json({ success: false, error: 'Usuário ou e-mail não encontrado no sistema.' }, { status: 404 });
    }

    const senhaCriptografadaDigitada = encriptarSenha(password);
    
    // NOVO: Pega o CNPJ, se não tiver, pega o CPF. Se não tiver nenhum, usa vazio para não quebrar o código.
    const documentoPrincipal = clienteFinal.cnpj || clienteFinal.cpf || '';
    const apenasNumeros = documentoPrincipal.replace(/\D/g, '');
    const senhaPadrao = apenasNumeros.substring(0, 6);

    let loginAprovado = false;
    if (isSocio) {
      if (socioDados.senha === senhaCriptografadaDigitada || password === senhaPadrao) loginAprovado = true;
    } else {
      if (clienteFinal.senha === senhaCriptografadaDigitada || password === senhaPadrao) loginAprovado = true;
    }

    if (loginAprovado) {
      const nomePainel = isSocio ? socioDados.nome : (clienteFinal.nome_contato || clienteFinal.nome_empresa || 'Cliente');

      // 🔐 Gerando o Passe VIP do Cliente
      const token = jwt.sign(
        { aud: 'authenticated', role: 'authenticated', sub: clienteFinal.id, email: emailFinal },
        process.env.SUPABASE_JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({ success: true, tipo: 'cliente', nome: nomePainel, id: clienteFinal.id, token: token });
    } else {
      return NextResponse.json({ success: false, error: 'Senha incorreta para esta conta.' }, { status: 401 });
    }
    
  } catch (err) {
    console.error('Erro crítico na rota de autenticação:', err.message);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor de login.' }, { status: 500 });
  }
}