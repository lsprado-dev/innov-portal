import { NextResponse } from 'next/server';
import { criarEstruturaClienteDrive } from '../../../../lib/driveUtils'; // Ajuste o caminho se a sua lib ficar em outro lugar

export async function POST(req) {
  try {
    const { nomeEmpresa } = await req.json();
    
    if (!nomeEmpresa) {
      return NextResponse.json({ success: false, error: 'Nome da empresa não fornecido.' }, { status: 400 });
    }

    const resultado = await criarEstruturaClienteDrive(nomeEmpresa);

    if (resultado.success) {
      return NextResponse.json(resultado);
    } else {
      return NextResponse.json({ success: false, error: resultado.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}