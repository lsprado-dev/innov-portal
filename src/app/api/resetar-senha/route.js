import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { clienteId } = await request.json();

    // 1. Pega os dados do cliente para descobrir o CNPJ/CPF
    const { data: cliente, error: fetchError } = await supabaseAdmin
      .from('clientes')
      .select('cnpj, cpf')
      .eq('id', clienteId)
      .single();

    if (fetchError || !cliente) throw new Error('Cliente não encontrado.');

    // 2. Calcula a senha padrão
    const documento = cliente.cnpj || cliente.cpf || '';
    const senhaPadrao = documento.replace(/\D/g, '').substring(0, 6);

    if (!senhaPadrao) throw new Error('Cliente sem documento válido para gerar a senha.');

    // 3. Gera o Hash seguro da senha padrão
    const salt = await bcrypt.genSalt(10);
    const hashPadrao = await bcrypt.hash(senhaPadrao, salt);

    // 4. Atualiza no banco de dados e marca como NÃO alterada
    const { error: updateError } = await supabaseAdmin
      .from('clientes')
      .update({ senha: hashPadrao, senha_alterada: false })
      .eq('id', clienteId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, senhaPadrao });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}