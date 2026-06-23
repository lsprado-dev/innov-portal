'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { enviarEmailDemanda } from '../../lib/email';

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

export default function EspecialView({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [cliente, setCliente] = useState(null);
  const [processos, setProcessos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('status');
  const [expandidos, setExpandidos] = useState({}); // NOVO: Controle de abrir/fechar os cards
  
  // Controle de Permissão Admin
  const [isInterno, setIsInterno] = useState(false);
  const [operador, setOperador] = useState('');

  // Estados de Dados (Documentos)
  const [docsRecebidos, setDocsRecebidos] = useState([]);
  const [docsEnviados, setDocsEnviados] = useState([]);
  const [subindoArquivo, setSubindoArquivo] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Formulários e Estados de Documentos
  const [descricaoDoc, setDescricaoDoc] = useState('');
  const [arquivoDoc, setArquivoDoc] = useState(null);
  const [processoSelecionadoDoc, setProcessoSelecionadoDoc] = useState(''); // NOVO: Para múltiplos processos

  // FUNÇÃO NOVA: Upload do Admin direto para o Processo (Aba Documentação)
  async function handleUploadAdminDoc(e, procId = null) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return mostrarToast('Arquivo excede 15MB.', 'erro');

    setSubindoArquivo(true);
    const timestamp = Date.now();
    const nomeSeguro = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.\-]/g, '_');
    const caminhoArquivo = `${id}/societario/${timestamp}_${nomeSeguro}`;

    const { error: storageError } = await supabase.storage.from('documentos').upload(caminhoArquivo, file);
    
    if (storageError) {
      mostrarToast('Erro ao subir arquivo: ' + storageError.message, 'erro');
      setSubindoArquivo(false); return;
    }

    const payload = {
      cliente_id: id,
      setor: 'societario',
      nome_original: file.name,
      caminho_storage: caminhoArquivo,
      enviado_por: operador
    };
    if (procId) payload.processo_id = procId; // Linka ao processo se existir

    const { data: novoArq, error: dbError } = await supabase.from('arquivos_portal').insert([payload]).select().single();

    if (!dbError && novoArq) {
      mostrarToast('Documento disponibilizado ao cliente!', 'sucesso');
      setDocsRecebidos([novoArq, ...docsRecebidos]);
    } else {
      mostrarToast('Erro ao registrar no banco de dados.', 'erro');
    }
    setSubindoArquivo(false);
    e.target.value = null; // Reseta o input file
  }

  // Modais do Admin
  const [modalProcesso, setModalProcesso] = useState({ aberto: false, tipo: 'novo', processo: null });
  const [formProcesso, setFormProcesso] = useState({ titulo: '', passo: 1 });
  
  const [modalDocs, setModalDocs] = useState(false);
  const [textoDocs, setTextoDocs] = useState('');
  
  const [modalPagamentos, setModalPagamentos] = useState(false);
  const [textoPagamentos, setTextoPagamentos] = useState('');

  // Notificação do Google Sheets
  async function notificarGoogleSheets(acao, detalhes) {
    const URL_WEBHOOK_SHEETS = "SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI"; 
    if (URL_WEBHOOK_SHEETS === "SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI") return;

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

  function mostrarToast(mensagem, tipo = 'sucesso') {
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, mensagem, tipo }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== toastId)); }, 4000);
  }

  async function carregarDados() {
    // 1. Carrega Cliente
    const { data: cli } = await supabase.from('clientes').select('*').eq('id', id).single();
    if (!cli) { router.push('/login'); return; }
    setCliente(cli);

    // 2. Carrega Processos Ativos
    const { data: procs } = await supabase.from('processos_societarios').select('*').eq('cliente_id', id).order('criado_em', { ascending: true });
    if (procs) setProcessos(procs);

    // 3. Carrega Docs
    const { data: recebidos } = await supabase.from('arquivos_portal').select('*').eq('cliente_id', id).eq('setor', 'societario').order('criado_em', { ascending: false });
    if (recebidos) setDocsRecebidos(recebidos);

    const { data: enviados } = await supabase.from('envios_cliente').select('*').eq('cliente_id', id).order('criado_em', { ascending: false });
    if (enviados) setDocsEnviados(enviados);
  }

  useEffect(() => {
    const tipo = localStorage.getItem('usuario_tipo');
    if (tipo === 'interno') {
      setIsInterno(true);
      setOperador(localStorage.getItem('usuario_nome') || 'Admin');
    }
    carregarDados();
  }, [id, router]);

  // ==========================================
  // FUNÇÕES DO ADMIN (GERENCIAR PROCESSOS)
  // ==========================================
  async function salvarProcesso(e) {
    e.preventDefault();
    setSubindoArquivo(true);

    if (modalProcesso.tipo === 'novo') {
      const { error } = await supabase.from('processos_societarios').insert([{
        cliente_id: id,
        titulo: formProcesso.titulo,
        passo: 1
      }]);
      if (!error) {
        mostrarToast('Novo processo iniciado!', 'sucesso');
        await carregarDados();
        setModalProcesso({ aberto: false, tipo: 'novo', processo: null });
      } else mostrarToast('Erro: ' + error.message, 'erro');
    } else {
      const { error } = await supabase.from('processos_societarios').update({
        passo: formProcesso.passo
      }).eq('id', modalProcesso.processo.id);
      
      if (!error) {
        mostrarToast('Processo avançado!', 'sucesso');
        
        // Avisa a Maria
        const passoNome = PASSOS_SOCIETARIO.find(p => p.id === parseInt(formProcesso.passo))?.nome;
        enviarEmailDemanda({
           to: 'societario@innovbusiness.com.br',
           nomeDestinatario: 'Maria (Societário)',
           nomeRemetente: operador,
           tituloDemanda: `Avanço de Processo: ${cliente.nome_empresa || cliente.nome_contato}`,
           descricao: `O processo "${modalProcesso.processo.titulo}" avançou para o PASSO ${formProcesso.passo}: ${passoNome}.`,
           prazo: 'Acompanhamento Interno'
        }).catch(()=>{});

        await carregarDados();
        setModalProcesso({ aberto: false, tipo: 'novo', processo: null });
      } else mostrarToast('Erro: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  async function deletarProcesso(procId) {
    if(!window.confirm('Tem certeza que deseja apagar este processo?')) return;
    setSubindoArquivo(true);
    const { error } = await supabase.from('processos_societarios').delete().eq('id', procId);
    if (!error) {
      mostrarToast('Processo excluído.', 'aviso');
      await carregarDados();
    }
    setSubindoArquivo(false);
  }

  async function salvarDocsSolicitados(e) {
    e.preventDefault();
    setSubindoArquivo(true);
    const { error } = await supabase.from('clientes').update({ docs_solicitados: textoDocs }).eq('id', id);
    if (!error) {
      mostrarToast('Lista de documentos atualizada!', 'sucesso');
      await carregarDados();
      setModalDocs(false);
    } else mostrarToast('Erro: ' + error.message, 'erro');
    setSubindoArquivo(false);
  }

  async function salvarPagamentosPendentes(e) {
    e.preventDefault();
    setSubindoArquivo(true);
    const { error } = await supabase.from('clientes').update({ pagamentos_pendentes: textoPagamentos }).eq('id', id);
    if (!error) {
      mostrarToast('Lista de pagamentos atualizada!', 'sucesso');
      await carregarDados();
      setModalPagamentos(false);
    } else mostrarToast('Erro: ' + error.message, 'erro');
    setSubindoArquivo(false);
  }

  // ==========================================
  // UPLOADS DE CLIENTES E ADMINS
  // ==========================================
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

    const payloadEnvio = {
      cliente_id: id,
      nome_documento: descricaoDoc.trim(),
      nome_original: arquivoDoc.name,
      caminho_storage: caminhoArquivo,
      departamento: departamentoDestino,
      status: 'pendente'
    };
    
    // Se for Societário, amarra ao processo (se houver 1 ou se o cliente selecionou no dropdown)
    if (departamentoDestino === 'Societário') {
       if (processos.length === 1) payloadEnvio.processo_id = processos[0].id;
       else if (processoSelecionadoDoc) payloadEnvio.processo_id = processoSelecionadoDoc;
    }

    const { error: dbError } = await supabase.from('envios_cliente').insert([payloadEnvio]);

    if (!dbError) {
      mostrarToast('Documento enviado com sucesso!', 'sucesso');
      setDescricaoDoc(''); setArquivoDoc(null); setProcessoSelecionadoDoc('');
      await carregarDados();
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

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white p-6 md:p-12 font-sans relative">
      <div className="max-w-5xl mx-auto">
        
        {/* BARRA SUPERIOR COMPACTA IGUAL MENSALISTA */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 bg-[#1b263b]/30 p-4 rounded-xl border border-zinc-800/60 gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            {isInterno ? (
              <button onClick={() => router.push('/')} className="text-sm font-bold text-[#d4af37] hover:underline hover:text-yellow-400 transition">← Voltar para o Painel Admin</button>
            ) : (
              <span className="text-xs text-zinc-500 font-bold tracking-wider uppercase">Portal de Processos</span>
            )}
          </div>
          <div className="flex items-center gap-4 relative">
            <span className="text-sm text-zinc-400 hidden sm:inline">
              Conectado como: <strong className="text-purple-400 font-extrabold">{operador || cliente.nome_contato}</strong>
            </span>
            <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="text-xs bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-4 py-2 rounded-lg transition-all font-bold">Sair</button>
          </div>
        </div>

        {/* CABEÇALHO */}
        <header className="mb-10 bg-[#1b263b] p-6 sm:p-8 rounded-xl border border-purple-500/30 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{cliente.nome_empresa || cliente.nome_contato}</h1>
            <div className="flex items-center gap-3">
              <span className="text-xs text-purple-400 font-bold uppercase tracking-wider bg-purple-500/10 px-3 py-1 rounded border border-purple-500/20">Processo Societário</span>
              <span className="text-xs text-zinc-400 font-mono">{cliente.cnpj ? `CNPJ: ${cliente.cnpj}` : `CPF: ${cliente.cpf}`}</span>
            </div>
          </div>
        </header>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex flex-wrap gap-4 mb-8 border-b border-zinc-800 pb-px">
          <button onClick={() => setAbaAtiva('status')} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaAtiva === 'status' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconStatus /> Status dos Processos
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-zinc-800 pb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Acompanhamento em Tempo Real</h2>
                <p className="text-sm text-zinc-400">Acompanhe a evolução da sua empresa passo a passo.</p>
              </div>
              {isInterno && (
                <button onClick={() => { setFormProcesso({ titulo: '', passo: 1 }); setModalProcesso({ aberto: true, tipo: 'novo', processo: null }); }} className="bg-purple-500 text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-purple-400 transition shadow-lg w-full sm:w-auto">
                  + Novo Processo
                </button>
              )}
            </div>

            {processos.length === 0 ? (
               <div className="text-center py-12 bg-[#0d1b2a] rounded-xl border border-zinc-800">
                 <p className="text-zinc-500">Nenhum processo societário ativo no momento.</p>
               </div>
            ) : (
               <div className="space-y-10">
                 {processos.map(proc => {
                    const porcentagem = Math.round((proc.passo / 8) * 100);
                    // MÁGICA: Se só tem 1 processo, fica aberto. Se tem vários, lê do estado 'expandidos'.
                    const isExpanded = processos.length === 1 || expandidos[proc.id];

                    return (
                      <div key={proc.id} className="bg-[#0d1b2a] p-6 rounded-xl border border-purple-500/20 relative overflow-hidden shadow-lg transition-all duration-300">
                         {/* Header do Card do Processo */}
                         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-zinc-800 pb-4 gap-4">
                            <div className="flex-1 w-full sm:w-auto">
                              <h3 className="text-lg font-bold text-[#d4af37] flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                                {proc.titulo}
                              </h3>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status:</span>
                                <span className="text-xs font-black text-purple-400">{porcentagem}% Concluído</span>
                              </div>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap items-center">
                              {/* Botão de Expandir/Minimizar (só aparece se tiver > 1 processo) */}
                              {processos.length > 1 && (
                                <button 
                                  onClick={() => setExpandidos(prev => ({ ...prev, [proc.id]: !prev[proc.id] }))} 
                                  className="flex-1 sm:flex-none text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 px-4 py-2 rounded font-bold hover:bg-zinc-700 hover:text-white transition"
                                >
                                  {isExpanded ? 'Ocultar Etapas ▲' : 'Ver Detalhes das Etapas ▼'}
                                </button>
                              )}

                              {isInterno && (
                                <>
                                  <button onClick={() => { setFormProcesso({ titulo: proc.titulo, passo: proc.passo }); setModalProcesso({ aberto: true, tipo: 'editar', processo: proc }); }} className="flex-1 sm:flex-none text-xs bg-purple-500/10 text-purple-300 border border-purple-500/30 px-4 py-2 rounded font-bold hover:bg-purple-500 hover:text-white transition">Avançar Passo</button>
                                  <button onClick={() => deletarProcesso(proc.id)} className="flex-1 sm:flex-none text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-2 rounded font-bold hover:bg-red-500 hover:text-white transition">Excluir</button>
                                </>
                              )}
                            </div>
                         </div>

                         {/* BARRA DE PROGRESSO GLOBAL (Sempre visível) */}
                          <div className={`w-full bg-[#1b263b] rounded-full h-2 border border-zinc-700 overflow-hidden ${isExpanded ? 'mb-8' : 'mb-2'}`}>
                            <div className="bg-gradient-to-r from-purple-700 to-purple-400 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${porcentagem}%` }}></div>
                          </div>

                          {/* TIMELINE VERTICAL DESTE PROCESSO (Oculta se minimizado) */}
                          {isExpanded && (
                            <div className="relative border-l-2 border-zinc-700 ml-4 sm:ml-8 space-y-6 pb-2 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                              {PASSOS_SOCIETARIO.map((passo) => {
                                const isCompleted = proc.passo > passo.id;
                                const isCurrent = proc.passo === passo.id;
                                const isFuture = proc.passo < passo.id;

                                let colorClass = 'bg-zinc-800 border-zinc-600 text-zinc-500'; 
                                if (isCompleted) colorClass = 'bg-emerald-500 border-emerald-400 text-[#0d1b2a] shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                                if (isCurrent) colorClass = 'bg-purple-500 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse';

                                return (
                                  <div key={passo.id} className={`relative pl-8 sm:pl-12 transition-all duration-500 ${isCurrent ? 'scale-[1.01]' : isFuture ? 'opacity-40 grayscale' : ''}`}>
                                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 flex items-center justify-center font-black text-xs z-10 ${colorClass}`}>
                                      {isCompleted ? '✓' : passo.id}
                                    </div>
                                    <div className={`p-4 rounded-xl border transition-all ${isCurrent ? 'bg-[#1b263b] border-purple-500/50 shadow-lg' : 'bg-[#1b263b]/30 border-zinc-800'}`}>
                                      <h3 className={`text-sm font-bold mb-1 ${isCurrent ? 'text-purple-400' : isCompleted ? 'text-emerald-400' : 'text-zinc-300'}`}>{passo.nome}</h3>
                                      <p className="text-xs text-zinc-400 leading-relaxed">{passo.desc}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                      </div>
                    )
                 })}
               </div>
            )}
          </div>
        )}

        {/* ABA 2: DOCUMENTAÇÃO */}
        {abaAtiva === 'documentos' && (
          <div className="space-y-8">
            
            {/* BANNER DINÂMICO DE DOCUMENTOS SOLICITADOS */}
            {(cliente.docs_solicitados || isInterno) && (
              <div className="bg-purple-500/10 p-6 rounded-xl border border-purple-500/30 flex flex-col sm:flex-row justify-between items-start gap-4 shadow-md">
                 <div className="flex-1 w-full">
                   <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <IconDoc /> Documentos Necessários
                   </h3>
                   {cliente.docs_solicitados ? (
                     <div className="bg-[#0d1b2a]/50 p-4 rounded-lg border border-purple-500/20">
                       <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{cliente.docs_solicitados}</p>
                     </div>
                   ) : (
                     <p className="text-sm text-zinc-500 italic">Escreva aqui a lista de documentos que o cliente precisa enviar...</p>
                   )}
                 </div>
                 {isInterno && (
                   <button onClick={() => { setTextoDocs(cliente.docs_solicitados || ''); setModalDocs(true); }} className="w-full sm:w-auto text-xs bg-purple-500 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-purple-400 transition whitespace-nowrap shadow-sm mt-1">
                     {cliente.docs_solicitados ? 'Editar Pedido' : '+ Solicitar Docs'}
                   </button>
                 )}
              </div>
            )}

            {/* FORMULÁRIO DE ENVIO */}
            <div className="bg-[#1b263b] p-6 rounded-xl border border-zinc-800 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-2">Enviar Documento</h3>
              <p className="text-xs text-zinc-400 mb-6">A nossa equipa solicitou um documento? Anexe-o abaixo.</p>
              
              <form onSubmit={(e) => handleEnviarDocumento(e, 'Societário')} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[#0d1b2a] p-5 rounded-lg border border-zinc-800/60">
                <div className="md:col-span-5">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Qual é o documento?</label>
                  <input type="text" required placeholder="Ex: CNH do Sócio, Comprovante..." value={descricaoDoc} onChange={e => setDescricaoDoc(e.target.value)} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Escolher Arquivo</label>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-4 mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#d4af37] mb-1">Financeiro e Taxas Governamentais</h2>
                <p className="text-sm text-zinc-400">Acompanhe os seus pagamentos pendentes e envie os comprovantes.</p>
              </div>
            </div>

            {/* BANNER PIX PREMIUM */}
            <div className="bg-[#0d1b2a] p-6 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-5 mb-8 shadow-md">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                 <div className="bg-emerald-500/10 p-3.5 rounded-full text-emerald-400 border border-emerald-500/20">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"/></svg>
                 </div>
                 <div>
                   <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Pagamento Rápido via PIX</h3>
                   <p className="text-xs text-zinc-400">Chave CNPJ: <strong className="text-emerald-400 text-sm tracking-widest ml-1">52.305.552/0001-01</strong></p>
                 </div>
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText('52.305.552/0001-01'); mostrarToast('Chave PIX copiada para a área de transferência!', 'sucesso'); }} 
                className="bg-emerald-500 text-[#0d1b2a] font-extrabold px-6 py-3 rounded-lg text-xs hover:bg-emerald-400 transition w-full sm:w-auto shadow-[0_0_15px_rgba(16,185,129,0.3)] whitespace-nowrap"
              >
                Copiar Chave PIX
              </button>
            </div>

            {/* BANNER DINÂMICO DE PAGAMENTOS PENDENTES */}
            {(cliente.pagamentos_pendentes || isInterno) && (
              <div className="bg-[#d4af37]/10 p-6 rounded-xl border border-[#d4af37]/30 flex flex-col sm:flex-row justify-between items-start gap-4 shadow-md mb-8">
                 <div className="flex-1 w-full">
                   <h3 className="text-sm font-bold text-[#d4af37] uppercase tracking-wider mb-3 flex items-center gap-2">
                     <IconFinanceiro /> Pagamentos Pendentes
                   </h3>
                   {cliente.pagamentos_pendentes ? (
                     <div className="bg-[#0d1b2a]/50 p-4 rounded-lg border border-[#d4af37]/20">
                       <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{cliente.pagamentos_pendentes}</p>
                     </div>
                   ) : (
                     <p className="text-sm text-zinc-500 italic">Escreva aqui os pagamentos e taxas pendentes para o cliente...</p>
                   )}
                 </div>
                 {isInterno && (
                   <button onClick={() => { setTextoPagamentos(cliente.pagamentos_pendentes || ''); setModalPagamentos(true); }} className="w-full sm:w-auto text-xs bg-[#d4af37] text-[#0d1b2a] px-4 py-2.5 rounded-lg font-bold hover:bg-yellow-500 transition whitespace-nowrap shadow-sm mt-1">
                     {cliente.pagamentos_pendentes ? 'Editar Pagamentos' : '+ Lançar Pendência'}
                   </button>
                 )}
              </div>
            )}

            <form onSubmit={(e) => handleEnviarDocumento(e, 'Financeiro')} className="bg-[#0d1b2a] p-5 sm:p-6 rounded-xl border border-zinc-800 shadow-inner mb-8 max-w-2xl overflow-hidden w-full">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Enviar Comprovante de Pagamento</h3>
              <div className="space-y-4 w-full">
                <div className="w-full">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Do que se trata este comprovante?</label>
                  <input type="text" required placeholder="Ex: Taxa DARE..." value={descricaoDoc} onChange={e => setDescricaoDoc(e.target.value)} className="w-full max-w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                </div>
                <div className="w-full">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Anexar Comprovante</label>
                  <input type="file" required accept=".pdf,image/*" onChange={e => setArquivoDoc(e.target.files[0])} className="text-xs text-zinc-400 bg-[#1b263b] border border-zinc-700 rounded-lg p-2 w-full max-w-full cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#d4af37]/20 file:text-[#d4af37]" />
                </div>
                <button type="submit" disabled={subindoArquivo} className="w-full bg-[#d4af37] text-[#0d1b2a] font-extrabold px-4 py-3 rounded-lg text-sm hover:bg-yellow-500 transition shadow-lg disabled:opacity-50 mt-2">
                  {subindoArquivo ? 'A enviar...' : 'Confirmar e Enviar'}
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

      {/* MODAIS ADMIN */}
      {isInterno && modalProcesso.aberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1b263b] border border-purple-500/50 rounded-xl w-full max-w-md flex flex-col shadow-2xl">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl">
              <h3 className="text-lg font-bold text-purple-400">{modalProcesso.tipo === 'novo' ? 'Novo Processo Societário' : 'Avançar Passo'}</h3>
              <button onClick={() => setModalProcesso({ aberto: false, tipo: 'novo', processo: null })} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={salvarProcesso} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2">Título do Processo</label>
                <input 
                  type="text" 
                  required 
                  disabled={modalProcesso.tipo !== 'novo'}
                  placeholder="Ex: Abertura de Filial SP..." 
                  value={formProcesso.titulo} 
                  onChange={e => setFormProcesso({...formProcesso, titulo: e.target.value})} 
                  className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>
              
              {modalProcesso.tipo === 'editar' && (
                <div className="bg-[#0d1b2a] p-4 rounded-lg border border-zinc-800/80">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-3">Selecione a fase atual:</label>
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto hide-scrollbar">
                    {PASSOS_SOCIETARIO.map(passo => (
                      <label key={passo.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${formProcesso.passo === passo.id ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-[#1b263b] border-zinc-700 text-zinc-300'}`}>
                        <input type="radio" name="passo_proc" className="accent-purple-500 w-4 h-4 cursor-pointer" checked={formProcesso.passo === passo.id} onChange={() => setFormProcesso({...formProcesso, passo: passo.id})} />
                        <span className="text-sm font-bold">Passo {passo.id}: {passo.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3 border-t border-zinc-800">
                <button type="button" onClick={() => setModalProcesso({ aberto: false, tipo: 'novo', processo: null })} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindoArquivo} className="bg-purple-500 text-white hover:bg-purple-400 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50">
                  {subindoArquivo ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInterno && modalDocs && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1b263b] border border-purple-500/50 rounded-xl w-full max-w-md flex flex-col shadow-2xl">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl">
              <h3 className="text-lg font-bold text-purple-400">Documentos Solicitados</h3>
              <button onClick={() => setModalDocs(false)} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={salvarDocsSolicitados} className="p-5 space-y-4">
              <p className="text-xs text-zinc-400">Liste abaixo os documentos que o cliente precisa anexar na plataforma. Ao deixar em branco, o banner desaparecerá para o cliente.</p>
              <textarea 
                rows="6" 
                placeholder="- RG e CPF dos sócios&#10;- Comprovante de Residência..." 
                value={textoDocs} 
                onChange={e => setTextoDocs(e.target.value)} 
                className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
              ></textarea>
              <div className="pt-2 flex justify-end gap-3 border-t border-zinc-800">
                <button type="button" onClick={() => setModalDocs(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindoArquivo} className="bg-purple-500 text-white hover:bg-purple-400 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50">
                  {subindoArquivo ? 'Salvando...' : 'Salvar Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInterno && modalPagamentos && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1b263b] border border-[#d4af37]/50 rounded-xl w-full max-w-md flex flex-col shadow-2xl">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl">
              <h3 className="text-lg font-bold text-[#d4af37]">Pagamentos Pendentes</h3>
              <button onClick={() => setModalPagamentos(false)} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={salvarPagamentosPendentes} className="p-5 space-y-4">
              <p className="text-xs text-zinc-400">Liste abaixo as taxas ou honorários que o cliente precisa pagar. Ao deixar em branco, o aviso desaparecerá para o cliente.</p>
              <textarea 
                rows="6" 
                placeholder="- DARE SP (R$ 150,00)&#10;- Honorários Parcela 1..." 
                value={textoPagamentos} 
                onChange={e => setTextoPagamentos(e.target.value)} 
                className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none"
              ></textarea>
              <div className="pt-2 flex justify-end gap-3 border-t border-zinc-800">
                <button type="button" onClick={() => setModalPagamentos(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-lg disabled:opacity-50">
                  {subindoArquivo ? 'Salvando...' : 'Salvar Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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