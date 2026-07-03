import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs'; // <-- NOVO

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

// Mantemos a velha só para a migração silenciosa
const encriptarSenhaAntiga = (text) => {
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

    // 1. Validação da Equipe Interna (Admin)
    if (EQUIPE_INTERNA[emailFinal]) {
      const { data: authData } = await supabaseAdmin.auth.signInWithPassword({
        email: emailFinal,
        password: password,
      });

      if (authData?.user) {
        const nomeAdmin = authData.user.user_metadata?.nome || EQUIPE_INTERNA[emailFinal];
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

    // 2. Validação do Cliente
    let clienteFinal = null;
    let isSocio = false;
    let socioDados = null;

    // Busca otimizada com JSONB (Mais rápido que o loop antigo)
    const { data: clienteTitular } = await supabaseAdmin.from('clientes').select('*').eq('email', emailFinal).maybeSingle();

    if (clienteTitular) {
      clienteFinal = clienteTitular;
    } else {
      const { data: clienteSocio } = await supabaseAdmin.from('clientes').select('*').contains('socios', `[{"email": "${emailFinal}"}]`).maybeSingle();
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

    const documentoPrincipal = clienteFinal.cnpj || clienteFinal.cpf || '';
    const apenasNumeros = documentoPrincipal.replace(/\D/g, '');
    const senhaPadrao = apenasNumeros.substring(0, 6);
    
    const senhaDoBanco = isSocio ? socioDados.senha : clienteFinal.senha;
    let loginAprovado = false;
    let precisaAtualizarParaBcrypt = false;

    // ==========================================
    // LÓGICA DE MIGRAÇÃO SILENCIOSA
    // ==========================================
    
    // Testa se a senha no banco já é o hash novo (Bcrypt começa com $2a$ ou $2b$)
    if (senhaDoBanco && senhaDoBanco.startsWith('$2')) {
      loginAprovado = await bcrypt.compare(password, senhaDoBanco);
    } 
    // Se não for, testa a regra antiga (XOR) OU a senha padrão (CNPJ)
    else if (senhaDoBanco === encriptarSenhaAntiga(password) || password === senhaPadrao) {
      loginAprovado = true;
      precisaAtualizarParaBcrypt = true; // O cliente logou com o velho, vamos atualizar!
    }

    if (loginAprovado) {
      const nomePainel = isSocio ? socioDados.nome : (clienteFinal.nome_contato || clienteFinal.nome_empresa || 'Cliente');

      // Atualiza o banco sem o cliente perceber!
      if (precisaAtualizarParaBcrypt) {
        const salt = await bcrypt.genSalt(10);
        const hashNovo = await bcrypt.hash(password, salt);

        if (isSocio) {
          const sociosAtualizados = clienteFinal.socios.map(s => s.email === socioDados.email ? { ...s, senha: hashNovo } : s);
          await supabaseAdmin.from('clientes').update({ socios: sociosAtualizados }).eq('id', clienteFinal.id);
        } else {
          await supabaseAdmin.from('clientes').update({ senha: hashNovo }).eq('id', clienteFinal.id);
        }
      }

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
    console.error('Erro na rota de auth:', err.message);
    return NextResponse.json({ success: false, error: 'Erro interno.' }, { status: 500 });
  }
}