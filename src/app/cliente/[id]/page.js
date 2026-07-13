'use client';
import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase'; // Ajuste o caminho se necessário
import MensalistaView from './MensalistaView';
import EspecialView from './EspecialView';

export default function ControladorCliente({ params }) {
  // Desempacota o ID (Padrão do Next.js App Router)
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  // Lê a URL para ver se o cliente quer abrir a aba societário
  const searchParams = useSearchParams();
  const isViewEspecial = searchParams.get('view') === 'especial';
  
  const [tipoConta, setTipoConta] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function checarTipoConta() {
      const { data } = await supabase
        .from('clientes')
        .select('tipo_conta')
        .eq('id', id)
        .single();

      if (data) {
        setTipoConta(data.tipo_conta);
      }
      setCarregando(false);
    }
    
    checarTipoConta();
  }, [id]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#0d1b2a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-zinc-800 border-t-[#d4af37] rounded-full animate-spin"></div>
          <p className="text-[#d4af37] font-bold tracking-widest uppercase text-sm">Carregando portal...</p>
        </div>
      </div>
    );
  }

  // Se for da galera do Societário OU se pediu para ver o Societário, manda para a tela nova!
  if (tipoConta === 'especiais' || tipoConta === 'especial' || isViewEspecial) {
    return <EspecialView params={params} />;
  }

  // Se não for (ou se for antigo/nulo), manda com segurança para a tela normal que já funciona!
  return <MensalistaView params={params} />;
}