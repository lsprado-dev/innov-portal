import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { usuarioId, titulo, body, url } = await request.json();

    let query = supabaseAdmin.from('push_subscriptions').select('subscription');
    
    // Se for um array (envio em massa), atira para todos da lista
    if (Array.isArray(usuarioId)) {
      query = query.in('usuario_id', usuarioId);
    } else {
      query = query.eq('usuario_id', usuarioId);
    }

    const { data: subs } = await query;

    if (subs && subs.length > 0) {
      const payload = JSON.stringify({ title: titulo, body, url });
      
      const promises = subs.map(sub => 
        webpush.sendNotification(sub.subscription, payload).catch(async (e) => {
          if (e.statusCode === 404 || e.statusCode === 410) {
            // Se o cliente desinstalou o app, o sistema apaga o link quebrado automaticamente
            await supabaseAdmin.from('push_subscriptions').delete().eq('subscription', sub.subscription);
          }
        })
      );
      
      await Promise.all(promises);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}