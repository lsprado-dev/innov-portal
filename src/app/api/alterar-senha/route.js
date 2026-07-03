import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { clienteId, novaSenha, contaSelecionada } = await request.json();

    if (!novaSenha || novaSenha.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
    }

    // Cria o Hash ultra-seguro
    const salt = await bcrypt.genSalt(10);
    const hashSeguro = await bcrypt.hash(novaSenha.trim(), salt);

    if (contaSelecionada === 'principal') {
      const { error } = await supabaseAdmin.from('clientes').update({ 
        senha: hashSeguro, 
        senha_alterada: true 
      }).eq('id', clienteId);
      
      if (error) throw error;
    } else {
      // É um sócio. Precisamos puxar os sócios antigos e atualizar a array
      const { data } = await supabaseAdmin.from('clientes').select('socios').eq('id', clienteId).single();
      const sociosAtualizados = (data.socios || []).map(s => 
        s.id === contaSelecionada ? { ...s, senha: hashSeguro } : s
      );
      
      const { error } = await supabaseAdmin.from('clientes').update({ socios: sociosAtualizados }).eq('id', clienteId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}