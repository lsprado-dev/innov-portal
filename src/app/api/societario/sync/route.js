import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const dados = await req.json();

    // 🔗 LINK DA SUA WEB APP DO GOOGLE SHEETS (Implementado)
    const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbw1t7TFbMVkMSj28OM4avyCquTTOu6TtZGhaHCu04NzQ7ntKKInFkxyKCKHwNs-IwAL/exec";

    // Envia os dados de forma assíncrona para o Sheets
    const response = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao sincronizar com Sheets:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}