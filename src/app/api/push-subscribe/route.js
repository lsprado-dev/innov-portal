import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { subscription, usuarioId, usuarioTipo } = await request.json();

    if (!subscription || !usuarioId || !usuarioTipo) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    // Salva o celular do cliente no banco
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .insert([{
        usuario_id: usuarioId,
        usuario_tipo: usuarioTipo,
        subscription: subscription
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}