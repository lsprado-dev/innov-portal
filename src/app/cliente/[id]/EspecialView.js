'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function EspecialView({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    async function carregarCliente() {
      const { data } = await supabase.from('clientes').select('*').eq('id', id).single();
      if (data) setCliente(data);
    }
    carregarCliente();
  }, [id]);

  if (!cliente) return null;

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white p-6 md:p-12 font-sans relative">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 bg-[#1b263b] p-8 rounded-xl border border-purple-500/30 shadow-xl flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{cliente.nome_empresa || cliente.nome_contato}</h1>
            <p className="text-sm text-purple-400 font-bold uppercase tracking-wider">Portal de Processos Societários</p>
          </div>
          <button onClick={() => router.push('/login')} className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg font-bold border border-red-500/20">Sair</button>
        </header>

        <div className="bg-[#1b263b] p-10 rounded-xl border border-zinc-800 text-center">
          <h2 className="text-xl font-bold text-[#d4af37] mb-2">Tela em Construção 🚧</h2>
          <p className="text-zinc-400">Aqui vai entrar a barra de progresso, a documentação e o financeiro!</p>
        </div>
      </div>
    </div>
  );
}