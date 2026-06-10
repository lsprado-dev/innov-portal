import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

const EQUIPE_INTERNA = {
  'adm-innov@innovative.com': 'Victor (Admin)',
  'societario-innov@innovative.com': 'Maria (Societário)',
  'contabil-innov@innovative.com': 'Helena (Contábil)',
  'fiscal-innov@innovative.com': 'Luiza (Fiscal)',
  'rh-innov@innovative.com': 'Karen (RH)',
  'suporte-innov@innovative.com': 'Beatriz (Suporte)',
  'financeiro-innov@innovative.com': 'Lucas (Financeiro)'
};

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    let emailFinal = email;
    if (!email.includes('@')) {
      emailFinal = `${email}@innovative.com`;
    }

    // 1. Validação da Equipe Interna (Lendo a senha oculta do ambiente)
    if (EQUIPE_INTERNA[emailFinal]) {
      if (password === process.env.ADMIN_PASSWORD) {
        return NextResponse.json({
          success: true,
          tipo: 'interno',
          nome: EQUIPE_INTERNA[emailFinal]
        });
      } else {
        return NextResponse.json({ success: false, error: 'Senha incorreta para este membro da equipe.' }, { status: 401 });
      }
    }

    // 2. Validação do Cliente
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
      const apenasNumeros = cliente.cnpj.replace(/\D/g, '');
      const senhaCNPJ = apenasNumeros.substring(0, 6);

      if (password === senhaCNPJ) {
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

    return NextResponse.json({ success: false, error: 'Usuário ou e-mail não encontrado no sistema.' }, { status: 404 });
  } catch (err) {
    console.error('Erro crítico na rota de autenticação:', err.message);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor de login.' }, { status: 500 });
  }
}