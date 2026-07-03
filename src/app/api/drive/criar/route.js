import { NextResponse } from 'next/server';
// Opção 1: Tirar um nível de retorno (Geralmente resolve na hora)
import { criarEstruturaClienteDrive } from '../../../lib/driveUtils'; 

// Opção 2: Se a Opção 1 falhar, use o atalho absoluto do Next.js:
// import { criarEstruturaClienteDrive } from '@/lib/driveUtils'; // Ajuste o caminho se a sua lib ficar em outro lugar

export async function POST(req) {
  try {
    // MÁGICA: Agora a API "pega" o tipoConta que o painel enviou
    const { nomeEmpresa, tipoConta } = await req.json();
    
    if (!nomeEmpresa) {
      return NextResponse.json({ success: false, error: 'Nome da empresa não fornecido.' }, { status: 400 });
    }

    // MÁGICA: E repassa esse tipoConta lá pra dentro da ferramenta do Drive!
    const resultado = await criarEstruturaClienteDrive(nomeEmpresa, tipoConta);

    if (resultado.success) {
      return NextResponse.json(resultado);
    } else {
      return NextResponse.json({ success: false, error: resultado.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}