import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Nenhum token fornecido.' }, { status: 400 });
    }

    // 1. Verifica se o token atual ainda é válido e legítimo
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);

    // 2. Se for válido, gera um NOVO token com os mesmos dados, mas com validade zerada para +8 horas
    const novoToken = jwt.sign(
      { 
        aud: decoded.aud, 
        role: decoded.role, 
        sub: decoded.sub, 
        email: decoded.email, 
        is_admin: decoded.is_admin,
        empresas_vinculadas: decoded.empresas_vinculadas || [] // <-- 🚀 CORREÇÃO: Repassa os vínculos para o novo crachá!
      },
      process.env.SUPABASE_JWT_SECRET,
      { expiresIn: '8h' } // <-- MÁGICA: Mantém a regra rigorosa de 8 horas na renovação!
    );

    return NextResponse.json({ success: true, token: novoToken });
  } catch (err) {
    // Se cair aqui, o token expirou ou foi fraudado. Não renovamos.
    return NextResponse.json({ success: false, error: 'Token inválido ou expirado.' }, { status: 401 });
  }
}