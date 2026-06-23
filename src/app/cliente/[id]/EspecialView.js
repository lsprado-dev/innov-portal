'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

// ==========================================
// ÍCONES PREMIUM (SVG)
// ==========================================
const IconStatus = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconDoc = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconFinanceiro = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconFileMini = () => <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;

// CONSTANTES DOS PASSOS SOCIETÁRIOS
const PASSOS_SOCIETARIO = [
  { id: 1, nome: 'Viabilidade', desc: 'Análise prévia de viabilidade na Junta Comercial e Prefeitura.' },
  { id: 2, nome: 'DBE (Documento Básico de Entrada)', desc: 'Solicitação do CNPJ na Receita Federal.' },
  { id: 3, nome: 'Pagamento da Taxa DARE', desc: 'Emissão e pagamento das taxas estaduais.' },
  { id: 4, nome: 'Emissão de Docs e Contrato', desc: 'Elaboração do Contrato Social e documentos complementares.' },
  { id: 5, nome: 'Assinatura de Documentos', desc: 'Aguardando a sua assinatura digital ou física.' },
  { id: 6, nome: 'Registro na Junta Comercial', desc: 'Envio do processo para análise final da Junta Comercial.' },
  { id: 7, nome: 'Protocolar Processo', desc: 'Acompanhamento do protocolo nos órgãos competentes.' },
  { id: 8, nome: 'Deferido (Concluído)', desc: 'Processo finalizado com sucesso! A sua empresa está pronta.' }
];

export default function EspecialView({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { id } = params;

  const [cliente, setCliente] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('status');
  
  // Estados de Dados
  const [docsRecebidos, setDocsRecebidos] = useState([]); // Docs enviados pela contabilidade
  const [docsEnviados, setDocsEnviados] = useState([]);   // Docs enviados pelo cliente
  
  const [subindoArquivo, setSubindoArquivo] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Estado para formulário de envio
  const [descricaoDoc, setDescricaoDoc] = useState('');
  const [arquivoDoc, setArquivoDoc] = useState(null);

  function mostrarToast(mensagem, tipo = 'sucesso') {
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, mensagem, tipo }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== toastId)); }, 4000);
  }

  // Função para enviar dados para a futura planilha do Google Sheets
  async function notificarGoogleSheets(acao, detalhes) {
    // ATENÇÃO: Substitua esta URL pela URL do seu Google Apps Script quando criarmos ele
    const URL_WEBHOOK_SHEETS = "SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI"; 
    
    if (URL_WEBHOOK_SHEETS === "SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI") return; // Ignora se não estiver configurado

    try {
      await fetch(URL_WEBHOOK_SHEETS, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          cliente_nome: cliente.nome_empresa || cliente.nome_contato,
          cpf_cnpj: cliente.cnpj || cliente.cpf,
          acao: acao,
          detalhes: detalhes,
          data: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Erro ao notificar Sheets', e);
    }
  }

  useEffect(() => {
    async function carregarDados() {
      // 1. Carrega Cliente
      const { data: cli } = await supabase.from('clientes').select('*').eq('id', id).single();
      if (!cli) {
        router.push('/login');
        return;
      }
      setCliente(cli);

      // 2. Carrega Docs enviados pela contabilidade (Arquivos Portal - Setor Societário)
      const { data: recebidos } = await supabase.from('arquivos_portal').select('*').eq('cliente_id', id).eq('setor', 'societario').order('criado_em', { ascending: false });
      if (recebidos) setDocsRecebidos(recebidos);

      // 3. Carrega Docs enviados pelo cliente (Envios Cliente - Societário e Financeiro)
      const { data: enviados } = await supabase.from('envios_cliente').select('*').eq('cliente_id', id).order('criado_em', { ascending: false });
      if (enviados) setDocsEnviados(enviados);
    }
    carregarDados();
  }, [id, router]);

  async function handleEnviarDocumento(e, departamentoDestino) {
    e.preventDefault();
    if (!arquivoDoc || !descricaoDoc.trim()) return mostrarToast('Preencha a descrição e selecione o arquivo.', 'erro');
    if (arquivoDoc.size > 15 * 1024 * 1024) return mostrarToast('Arquivo excede 15MB.', 'erro');

    setSubindoArquivo(true);
    const timestamp = Date.now();
    const caminhoArquivo = `${id}/recebidos_societario/${timestamp}_${arquivoDoc.name}`;
    
    const { error: storageError } = await supabase.storage.from('documentos').upload(caminhoArquivo, arquivoDoc);
    
    if (storageError) {
      mostrarToast('Erro ao subir arquivo: ' + storageError.message, 'erro');
      setSubindoArquivo(false);
      return;
    }

    const { data: novoEnvio, error: dbError } = await supabase.from('envios_cliente').insert([{
      cliente_id: id,
      nome_documento: descricaoDoc.trim(),
      nome_original: arquivoDoc.name,
      caminho_storage: caminhoArquivo,
      departamento: departamentoDestino,
      status: 'pendente'
    }]).select().single();

    if (!dbError) {
      mostrarToast('Documento enviado com sucesso para análise!', 'sucesso');
      setDocsEnviados([novoEnvio, ...docsEnviados]);
      setDescricaoDoc('');
      setArquivoDoc(null);
      
      // Notifica o Google Sheets!
      await notificarGoogleSheets('NOVO_DOCUMENTO', `O cliente enviou o documento: ${descricaoDoc.trim()} para o setor ${departamentoDestino}`);
      
    } else {
      mostrarToast('Erro ao registrar documento.', 'erro');
    }
    setSubindoArquivo(false);
  }

  function baixarDocumento(caminhoStorage, nomeOriginal) {
    supabase.storage.from('documentos').download(caminhoStorage).then(({ data, error }) => {
      if (error) return mostrarToast('Erro ao baixar.', 'erro');
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeOriginal || 'documento';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (!cliente) return (
    <div className="min-h-screen bg-[#0d1b2a] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-zinc-800 border-t-purple-500 rounded-full animate-spin"></div>
    </div>
  );

  const passoAtual = cliente.passo_societario || 1;
  const porcentagemProgresso = Math.round((passoAtual / 8) * 100);

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white p-6 md:p-12 font-sans relative">
      <div className="max-w-5xl mx-auto">
        
        {/* CABEÇALHO */}
        <header className="mb-10 bg-[#1b263b] p-6 sm:p-8 rounded-xl border border-purple-500/30 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{cliente.nome_empresa || cliente.nome_contato}</h1>
            <div className="flex items-center gap-3">
              <span className="text-xs text-purple-400 font-bold uppercase tracking-wider bg-purple-500/10 px-3 py-1 rounded border border-purple-500/20">Processo Societário</span>
              <span className="text-xs text-zinc-400 font-mono">{cliente.cnpj ? `CNPJ: ${cliente.cnpj}` : `CPF: ${cliente.cpf}`}</span>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 transition px-5 py-2.5 rounded-lg font-bold border border-red-500/20 text-sm w-full sm:w-auto">Sair do Portal</button>
        </header>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex flex-wrap gap-4 mb-8 border-b border-zinc-800 pb-px">
          <button onClick={() => setAbaAtiva('status')} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaAtiva === 'status' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconStatus /> Status do Processo
          </button>
          <button onClick={() => setAbaAtiva('documentos')} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaAtiva === 'documentos' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconDoc /> Documentação
          </button>
          <button onClick={() => setAbaAtiva('financeiro')} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaAtiva === 'financeiro' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconFinanceiro /> Financeiro & Taxas
          </button>
        </div>

        {/* ABA 1: STATUS DO PROCESSO */}
        {abaAtiva === 'status' && (
          <div className="bg-[#1b263b] p-8 rounded-xl border border-zinc-800 shadow-xl mb-10">
            <h2 className="text-xl font-bold text-white mb-2">Acompanhamento em Tempo Real</h2>
            <p className="text-sm text-zinc-400 mb-8">Acompanhe a evolução da sua empresa passo a passo.</p>

            {/* BARRA DE PROGRESSO GLOBAL */}
            <div className="mb-12 bg-[#0d1b2a] p-5 rounded-xl border border-purple-500/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Progresso Total</span>
                <span className="text-sm font-black text-purple-400">{porcentagemProgresso}% Concluído</span>
              </div>
              <div className="w-full bg-[#1b263b] rounded-full h-3 border border-zinc-700 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-700 via-purple-500 to-[#d4af37] h-3 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${porcentagemProgresso}%` }}>
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* TIMELINE VERTICAL */}
            <div className="relative border-l-2 border-zinc-700 ml-4 sm:ml-8 space-y-8 pb-4">
              {PASSOS_SOCIETARIO.map((passo) => {
                const isCompleted = passoAtual > passo.id;
                const isCurrent = passoAtual === passo.id;
                const isFuture = passoAtual < passo.id;

                let colorClass = 'bg-zinc-800 border-zinc-600 text-zinc-500'; // Futuro
                if (isCompleted) colorClass = 'bg-emerald-500 border-emerald-400 text-[#0d1b2a] shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                if (isCurrent) colorClass = 'bg-purple-500 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse';

                return (
                  <div key={passo.id} className={`relative pl-8 sm:pl-12 transition-all duration-500 ${isCurrent ? 'scale-[1.02]' : isFuture ? 'opacity-50 grayscale' : ''}`}>
                    {/* Bolinha da Timeline */}
                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 flex items-center justify-center font-black text-xs z-10 ${colorClass}`}>
                      {isCompleted ? '✓' : passo.id}
                    </div>

                    <div className={`p-5 rounded-xl border transition-all ${isCurrent ? 'bg-[#0d1b2a] border-purple-500/50 shadow-lg' : 'bg-[#0d1b2a]/50 border-zinc-800'}`}>
                      <h3 className={`text-base font-bold mb-1 ${isCurrent ? 'text-purple-400' : isCompleted ? 'text-emerald-400' : 'text-zinc-300'}`}>
                        {passo.nome}
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{passo.desc}</p>
                      
                      {isCurrent && (
                        <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-widest text-purple-300 bg-purple-500/20 px-3 py-1 rounded">
                          Fase Atual (Em Análise)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA 2: DOCUMENTAÇÃO */}
        {abaAtiva === 'documentos' && (
          <div className="space-y-8">
            
            {/* FORMULÁRIO DE ENVIO */}
            <div className="bg-[#1b263b] p-6 rounded-xl border border-zinc-800 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-2">Enviar Documento Solicitado</h3>
              <p className="text-xs text-zinc-400 mb-6">A nossa equipa solicitou um documento? Anexe-o abaixo.</p>
              
              <form onSubmit={(e) => handleEnviarDocumento(e, 'Societário')} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[#0d1b2a] p-5 rounded-lg border border-zinc-800/60">
                <div className="md:col-span-5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Qual é o documento?</label>
                  <input type="text" required placeholder="Ex: CNH do Sócio, Comprovante de Residência..." value={descricaoDoc} onChange={e => setDescricaoDoc(e.target.value)} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Escolher Arquivo (PDF ou Imagem)</label>
                  <input type="file" required accept=".pdf,image/*" onChange={e => setArquivoDoc(e.target.files[0])} className="text-xs text-zinc-400 bg-[#1b263b] border border-zinc-700 rounded-lg p-2 w-full cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200" />
                </div>
                <div className="md:col-span-3">
                  <button type="submit" disabled={subindoArquivo} className="w-full bg-purple-500 text-white font-extrabold px-4 py-2.5 rounded-lg text-sm hover:bg-purple-400 transition shadow-lg disabled:opacity-50">
                    {subindoArquivo ? 'A enviar...' : 'Enviar Arquivo'}
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* HISTÓRICO DE ENVIOS DO CLIENTE */}
              <div className="bg-[#1b263b] p-6 rounded-xl border border-zinc-800 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Você Enviou</h3>
                <div className="space-y-3">
                  {docsEnviados.filter(d => d.departamento === 'Societário').length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-4 bg-[#0d1b2a] rounded-lg">Você ainda não enviou documentos.</p>
                  ) : (
                    docsEnviados.filter(d => d.departamento === 'Societário').map(doc => (
                      <div key={doc.id} className="p-3 bg-[#0d1b2a] rounded-lg border border-zinc-800 flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <IconFileMini />
                          <div className="truncate">
                            <p className="text-sm font-bold text-zinc-200 truncate">{doc.nome_documento}</p>
                            <p className="text-[10px] text-zinc-500">{new Date(doc.criado_em).toLocaleDateString('pt-BR')} • {doc.status}</p>
                          </div>
                        </div>
                        <button onClick={() => baixarDocumento(doc.caminho_storage, doc.nome_original)} className="text-[10px] flex-shrink-0 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded transition font-bold">Baixar</button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* DOCUMENTOS DISPONIBILIZADOS PELA EQUIPA */}
              <div className="bg-[#1b263b] p-6 rounded-xl border border-zinc-800 shadow-xl">
                <h3 className="text-sm font-bold text-purple-400 mb-4 uppercase tracking-wider">A Equipa Disponibilizou</h3>
                <div className="space-y-3">
                  {docsRecebidos.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-4 bg-[#0d1b2a] rounded-lg">Nenhum documento liberado pela equipe ainda.</p>
                  ) : (
                    docsRecebidos.map(doc => (
                      <div key={doc.id} className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/20 flex justify-between items-center gap-3 hover:border-purple-500/40 transition">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <IconFileMini />
                          <div className="truncate">
                            <p className="text-sm font-bold text-zinc-200 truncate">{doc.nome_original}</p>
                            <p className="text-[10px] text-zinc-500">{new Date(doc.criado_em).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        <button onClick={() => baixarDocumento(doc.caminho_storage, doc.nome_original)} className="text-[10px] flex-shrink-0 bg-purple-500 text-white hover:bg-purple-400 px-3 py-1.5 rounded transition font-bold shadow-sm">Baixar</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: FINANCEIRO E TAXAS */}
        {abaAtiva === 'financeiro' && (
          <div className="bg-[#1b263b] p-8 rounded-xl border border-[#d4af37]/30 shadow-xl mb-10">
            <h2 className="text-xl font-bold text-[#d4af37] mb-2">Financeiro e Taxas Governamentais</h2>
            <p className="text-sm text-zinc-400 mb-8">Anexe aqui os comprovantes das guias pagas e honorários do processo.</p>

            <form onSubmit={(e) => handleEnviarDocumento(e, 'Financeiro')} className="bg-[#0d1b2a] p-6 rounded-xl border border-zinc-800 shadow-inner mb-8 max-w-2xl">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Enviar Comprovante de Pagamento</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Do que se trata este comprovante?</label>
                  <input type="text" required placeholder="Ex: Pagamento da Taxa DARE, Honorários Parcela 1..." value={descricaoDoc} onChange={e => setDescricaoDoc(e.target.value)} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Anexar Comprovante (PDF/Imagem)</label>
                  <input type="file" required accept=".pdf,image/*" onChange={e => setArquivoDoc(e.target.files[0])} className="text-xs text-zinc-400 bg-[#1b263b] border border-zinc-700 rounded-lg p-2 w-full cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#d4af37]/20 file:text-[#d4af37]" />
                </div>
                <button type="submit" disabled={subindoArquivo} className="w-full bg-[#d4af37] text-[#0d1b2a] font-extrabold px-4 py-3 rounded-lg text-sm hover:bg-yellow-500 transition shadow-lg disabled:opacity-50">
                  {subindoArquivo ? 'A enviar...' : 'Confirmar e Enviar Comprovante'}
                </button>
              </div>
            </form>

            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider border-t border-zinc-800 pt-6">Histórico de Comprovantes Enviados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {docsEnviados.filter(d => d.departamento === 'Financeiro').length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 col-span-full">Nenhum comprovante enviado.</p>
              ) : (
                docsEnviados.filter(d => d.departamento === 'Financeiro').map(doc => (
                  <div key={doc.id} className="p-4 bg-[#0d1b2a] rounded-lg border border-zinc-800 hover:border-[#d4af37]/50 transition flex flex-col justify-between h-28">
                    <div>
                      <p className="text-sm font-bold text-[#d4af37] truncate">{doc.nome_documento}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Enviado em {new Date(doc.criado_em).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button onClick={() => baixarDocumento(doc.caminho_storage, doc.nome_original)} className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-white w-full py-1.5 rounded transition font-bold mt-2">Baixar Original</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* SISTEMA DE TOASTS */}
      <div className="fixed bottom-6 right-6 z-[9999999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border pointer-events-auto transition-all backdrop-blur-md min-w-[280px] max-w-sm ${
            toast.tipo === 'erro' ? 'bg-red-500/10 border-red-500/30 text-red-100' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
          }`}>
            <span className="text-xl">{toast.tipo === 'erro' ? '❌' : '✅'}</span>
            <span className="text-sm font-bold leading-snug">{toast.mensagem}</span>
          </div>
        ))}
      </div>

    </div>
  );
}