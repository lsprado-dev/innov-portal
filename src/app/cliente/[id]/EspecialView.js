'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { enviarEmailDemanda, enviarEmailDocumento } from '../../lib/email';
import { dispararPush } from '../../lib/push';
import DOMPurify from 'dompurify';

// ==========================================
// ÍCONES PREMIUM (SVG)
// ==========================================
const IconStatus = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconDoc = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconFinanceiro = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconFileMini = () => <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const IconLock = () => <svg className="w-8 h-8 mx-auto text-zinc-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const IconCheck = () => <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>;

// BACKUP DOS PASSOS CASO O PROCESSO ANTIGO NÃO TENHA SNAPSHOT NO BANCO
const PASSOS_BACKUP = [
  { id: 1, nome: 'Viabilidade', desc: 'Análise prévia de viabilidade na Junta Comercial e Prefeitura.' },
  { id: 2, nome: 'DBE', desc: 'Solicitação do CNPJ na Receita Federal.' },
  { id: 3, nome: 'Pagamento da Taxa', desc: 'Emissão e pagamento das taxas.' },
  { id: 4, nome: 'Emissão de Docs', desc: 'Elaboração do Contrato Social e documentos.' },
  { id: 5, nome: 'Assinatura', desc: 'Aguardando a sua assinatura.' },
  { id: 6, nome: 'Registro', desc: 'Envio do processo para análise.' },
  { id: 7, nome: 'Protocolar', desc: 'Acompanhamento do protocolo.' },
  { id: 8, nome: 'Deferido (Concluído)', desc: 'Processo finalizado com sucesso!' }
];

export default function EspecialView({ params }) {
  const router = useRouter();
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  
  // NOVO: Estados de Templates
  const [templatesProcessos, setTemplatesProcessos] = useState([]);
  const [modalGerenciarTemplates, setModalGerenciarTemplates] = useState(false);
  const [novoTemplateForm, setNovoTemplateForm] = useState({ nome: '', passos: [{ id: 1, nome: '', desc: '' }, { id: 2, nome: '', desc: '' }, { id: 3, nome: '', desc: '' }, { id: 4, nome: '', desc: '' }, { id: 5, nome: '', desc: '' }, { id: 6, nome: '', desc: '' }, { id: 7, nome: '', desc: '' }, { id: 8, nome: '', desc: '' }] });
  const [templateSelecionadoId, setTemplateSelecionadoId] = useState('');

  useEffect(() => {
    const handleSessaoExpirada = () => setSessaoExpirada(true);
    window.addEventListener('sessao_expirada', handleSessaoExpirada);
    return () => window.removeEventListener('sessao_expirada', handleSessaoExpirada);
  }, []);

  // ==========================================
  // RENOVAÇÃO SILENCIOSA DE SESSÃO (+30 DIAS)
  // ==========================================
  useEffect(() => {
    async function renovarSessao() {
      const tokenAtual = localStorage.getItem('supabase_token');
      if (!tokenAtual) return;

      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenAtual })
        });
        
        const data = await res.json();
        
        if (data.success && data.token) {
          // Troca o passe velho pelo passe novo recém-carimbado!
          localStorage.setItem('supabase_token', data.token);
        }
      } catch (e) {
        console.error('Falha ao tentar renovar a sessão em background:', e);
      }
    }
    
    renovarSessao();
  }, []);

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

  // Estados para Taxas Governamentais Estruturadas (Admin)
  const [listaTaxas, setListaTaxas] = useState([]);
  const [taxaNome, setTaxaNome] = useState('');
  const [taxaValor, setTaxaValor] = useState('');
  const [isPix, setIsPix] = useState(false);
  const [chavePix, setChavePix] = useState('');
  const [taxaBoleto, setTaxaBoleto] = useState(null);
  const [semTaxas, setSemTaxas] = useState(false); // NOVO: Checkbox sem taxas

  // Estado para controle de pagamento de honorários (Cliente)
  const [honorarioPagoManual, setHonorarioPagoManual] = useState({});

  // FUNÇÃO NOVA: Upload do Admin direto para o Processo (Aba Documentação)
  async function handleUploadAdminDoc(e, procId = null) {
    const file = e.target.files[0];
    if (!file) return;
    
    e.target.value = null; // MÁGICA: Limpa a memória do input

    if (file.size > (file.name?.match(/\.(csv|xls|xlsx)$/i) ? 50 : 4.4) * 1024 * 1024) return mostrarToast('Arquivo excede o limite permitido (50MB p/ planilhas).', 'erro');

    setSubindoArquivo(true);
    const timestamp = Date.now();
    const nomeSeguro = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.\-]/g, '_');

    // 1. Busca o ID da gaveta de Documentos Enviados no Drive!
    const { data: dadosCliente } = await supabase.from('clientes').select('id_drive_enviados').eq('id', id).single();
    const pastaDestinoDrive = dadosCliente?.id_drive_enviados;

    let caminhoArquivo = null;

    // 2. Manda pro Google Drive
    if (pastaDestinoDrive) {
       const formData = new FormData();
       formData.append('file', file);
       formData.append('folderId', pastaDestinoDrive);
       try {
         const res = await fetch('/api/drive/upload', { method: 'POST', body: formData });
         const resData = await res.json();
         if (resData.success) caminhoArquivo = `DRIVE:${resData.fileId}`;
       } catch (err) { console.error("Erro no fetch do Drive:", err); }
    }

    // 3. Fallback de Segurança (Supabase)
    if (!caminhoArquivo) {
        caminhoArquivo = `${id}/societario/${timestamp}_${nomeSeguro}`;
        const { error: storageError } = await supabase.storage.from('documentos').upload(caminhoArquivo, file);
        if (storageError) {
          mostrarToast('Erro ao subir arquivo: ' + storageError.message, 'erro');
          setSubindoArquivo(false); return;
        }
    }

    const payload = {
      cliente_id: id,
      setor: 'societario',
      nome_original: file.name,
      caminho_storage: caminhoArquivo,
      enviado_por: operador
    };
    if (procId) payload.processo_id = procId;

    const { data: novoArq, error: dbError } = await supabase.from('arquivos_portal').insert([payload]).select().single();

    if (!dbError && novoArq) {
      mostrarToast('Documento disponibilizado ao cliente!', 'sucesso');
      setDocsRecebidos([novoArq, ...docsRecebidos]);
    } else {
      mostrarToast('Erro ao registrar no banco de dados.', 'erro');
    }
    setSubindoArquivo(false);
    e.target.value = null; 
  }

  // ESTADO DO MODAL DE E-MAIL DO DOCUMENTO
  const [modalEmailDoc, setModalEmailDoc] = useState({ aberto: false, arquivo: null, titulo: 'Novo Documento Disponível', mensagem: '' });

  // Modais do Admin
  const [modalProcesso, setModalProcesso] = useState({ aberto: false, tipo: 'novo', processo: null });
  const [formProcesso, setFormProcesso] = useState({ titulo: '', passo: 1, valor_honorarios: '', valor_entrada: '', taxas_pendentes: '', taxas_pagas: '' });
  const [subAbaStatus, setSubAbaStatus] = useState('ativos'); // NOVO: Abas de processos Finalizados x Ativos
  
  const [modalDocs, setModalDocs] = useState(false);
  const [textoDocs, setTextoDocs] = useState('');

  // NOVO: Estados para o Switcher de Empresas
  const [empresasLigadas, setEmpresasLigadas] = useState([]);
  const [mostrarSwitcher, setMostrarSwitcher] = useState(false);

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
    // 🛑 MÁGICA DE SEGURANÇA: Select explícito para NUNCA trafegar a senha do cliente!
    const COLUNAS_SEGURAS = 'id, nome_empresa, nome_contato, cnpj, cpf, email, celular, regime_tributario, tipo_conta, empresas_vinculadas, docs_solicitados, dia_vencimento, clientes_van, socios, links, id_drive_raiz, id_drive_contabil, id_drive_fiscal, id_drive_rh, id_drive_contratos, id_drive_recebidos, id_drive_enviados, id_drive_lixeira';

    // 1. Dispara TODAS as buscas ao mesmo tempo (Paralelo = Muito mais rápido!)
    const reqCli = supabase.from('clientes').select(COLUNAS_SEGURAS).eq('id', id).single();
    const reqProcs = supabase.from('processos_societarios').select('*').eq('cliente_id', id).order('criado_em', { ascending: true });
    const reqRecebidos = supabase.from('arquivos_portal').select('*').eq('cliente_id', id).eq('setor', 'societario').order('criado_em', { ascending: false });
    const reqEnviados = supabase.from('envios_cliente').select('*').eq('cliente_id', id).order('criado_em', { ascending: false });
    const reqTemplates = supabase.from('templates_processos').select('*').order('criado_em', { ascending: true });

    // 2. Aguarda a resposta conjunta
    const [resCli, resProcs, resRecebidos, resEnviados, resTemplates] = await Promise.all([reqCli, reqProcs, reqRecebidos, reqEnviados, reqTemplates]);
    
    if (resTemplates.data) setTemplatesProcessos(resTemplates.data);

    if (!resCli.data) { router.push('/login'); return; }
    setCliente(resCli.data);

    // Busca as contas vinculadas (para o Account Switcher)
    if (resCli.data.empresas_vinculadas && resCli.data.empresas_vinculadas.length > 0) {
      const { data: ligadas } = await supabase.from('clientes').select('id, nome_empresa, cnpj, cpf, tipo_conta').in('id', resCli.data.empresas_vinculadas);
      if (ligadas) setEmpresasLigadas(ligadas);
    }

    if (resProcs.data) setProcessos(resProcs.data);
    if (resRecebidos.data) setDocsRecebidos(resRecebidos.data);
    if (resEnviados.data) setDocsEnviados(resEnviados.data);
  }

  useEffect(() => {
    const tipo = localStorage.getItem('usuario_tipo');
    if (tipo === 'interno') {
      setIsInterno(true);
      setOperador(localStorage.getItem('usuario_nome') || 'Admin');
    }
    carregarDados();
  }, [id, router]);

  // MÁGICA DE UX: Atualiza os dados societários silenciosamente ao voltar para a janela
  useEffect(() => {
    const handleFocus = () => {
      if (!subindoArquivo) {
        carregarDados();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id, subindoArquivo]);

  // NOVO: Limpa as bolinhas de notificação assim que o Admin abre a respectiva aba
  useEffect(() => {
    if (!isInterno) return;
    
    let idsParaAtualizar = [];
    if (abaAtiva === 'documentos') {
      idsParaAtualizar = docsEnviados.filter(d => d.departamento === 'Societário' && d.status === 'pendente').map(d => d.id);
    } else if (abaAtiva === 'financeiro') {
      idsParaAtualizar = docsEnviados.filter(d => d.departamento === 'Financeiro' && d.status === 'pendente').map(d => d.id);
    }
    
    if (idsParaAtualizar.length > 0) {
      // 1. Apaga a bolinha na tela imediatamente (UX Otimista)
      setDocsEnviados(prev => prev.map(d => idsParaAtualizar.includes(d.id) ? { ...d, status: 'visto' } : d));
      // 2. Avisa o banco de dados em segundo plano
      supabase.from('envios_cliente').update({ status: 'visto' }).in('id', idsParaAtualizar).then();
    }
  }, [abaAtiva, isInterno, docsEnviados]);

  // ==========================================
  // FUNÇÕES DO ADMIN E FLUXO DE TAXAS
  // ==========================================
  async function handleAdicionarTaxa() {
    if (!taxaNome.trim() || !taxaValor.trim()) return mostrarToast('Preencha o nome e o valor da taxa.', 'erro');
    if (isPix && !chavePix.trim()) return mostrarToast('Preencha a chave PIX.', 'erro');
    if (!isPix && !taxaBoleto) return mostrarToast('Anexe o boleto ou guia.', 'erro');

    setSubindoArquivo(true);
    let caminhoBoleto = null;
    if (!isPix && taxaBoleto) {
      const timestamp = Date.now();
      const nomeSeguro = taxaBoleto.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.\-]/g, '_');
      caminhoBoleto = `${id}/boletos_taxas/${timestamp}_${nomeSeguro}`;
      await supabase.storage.from('documentos').upload(caminhoBoleto, taxaBoleto);
    }

    const novaTaxa = {
      id: Date.now().toString(),
      nome: taxaNome.trim(),
      valor: taxaValor.trim(),
      isPix,
      chavePix: isPix ? chavePix.trim() : null,
      boleto: caminhoBoleto,
      status: 'pendente',
      comprovante: null
    };

    setListaTaxas([...listaTaxas, novaTaxa]);
    setTaxaNome(''); setTaxaValor(''); setTaxaBoleto(null); setChavePix(''); setIsPix(false);
    setSubindoArquivo(false);
  }

  function toggleStatusTaxa(taxaId) {
    setListaTaxas(listaTaxas.map(t => t.id === taxaId ? { ...t, status: t.status === 'pendente' ? 'pago' : 'pendente' } : t));
  }

  function removerTaxa(taxaId) {
    setListaTaxas(listaTaxas.filter(t => t.id !== taxaId));
  }

  async function handleAnexarComprovanteTaxa(e, proc, taxaId) {
    const file = e.target.files[0];
    if(!file) return;
    
    e.target.value = null; // MÁGICA: Libera o input!
    
    setSubindoArquivo(true);
    const timestamp = Date.now();
    const nomeSeguro = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.\-]/g, '_');
    const caminhoComprovante = `${id}/comprovantes_taxas/${timestamp}_${nomeSeguro}`;
    
    await supabase.storage.from('documentos').upload(caminhoComprovante, file);

    let parsed = [];
    try {
      parsed = JSON.parse(proc.taxas_pendentes || '[]');
      if (!Array.isArray(parsed)) parsed = [parsed];
    } catch(err) { parsed = []; }
    
    parsed = parsed.map(t => (t.id === taxaId || t.nome === taxaId) ? { ...t, status: 'pago', comprovante: caminhoComprovante } : t);

    const { error } = await supabase.from('processos_societarios').update({
       taxas_pendentes: JSON.stringify(parsed)
    }).eq('id', proc.id);

    if (!error) {
       mostrarToast('Comprovante enviado! A taxa foi movida para as pagas.', 'sucesso');
       await carregarDados();
    } else {
       mostrarToast('Erro ao atualizar taxa: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  async function toggleHonorarioPago(procId, statusAtual) {
    setSubindoArquivo(true);
    const novoStatus = !statusAtual;
    
    // Buscando também os valores e taxas do processo
    const { data: proc } = await supabase.from('processos_societarios').select('historico_passos, titulo, passo, valor_honorarios, valor_entrada, taxas_pendentes, passos_snapshot').eq('id', procId).single();
    let historico = {};
    try { historico = typeof proc?.historico_passos === 'string' ? JSON.parse(proc.historico_passos) : (proc?.historico_passos || {}); } catch(e) {}
    
    let listaPassos = [];
    try { listaPassos = typeof proc?.passos_snapshot === 'string' ? JSON.parse(proc.passos_snapshot) : proc?.passos_snapshot; } catch(e){}
    if (!listaPassos || !Array.isArray(listaPassos) || listaPassos.length === 0) listaPassos = PASSOS_BACKUP;
    const ultimoPassoId = listaPassos[listaPassos.length - 1]?.id || 8;

    if (novoStatus) historico[ultimoPassoId] = new Date().toISOString();
    else delete historico[ultimoPassoId];

    const { error } = await supabase.from('processos_societarios').update({ honorario_pago: novoStatus, historico_passos: historico }).eq('id', procId);
    if (!error) {
      mostrarToast(novoStatus ? 'Processo 100% finalizado com sucesso!' : 'Pagamento revertido para pendente.', 'sucesso');
      
      // Prepara as taxas pagas para enviar a planilha
      let taxasArray = [];
      try { taxasArray = JSON.parse(proc?.taxas_pendentes || '[]'); if(!Array.isArray(taxasArray)) taxasArray = [taxasArray]; } catch(e){}
      const taxasPagasStr = taxasArray.filter(t => t.status === 'pago').map(t => `${t.nome} (R$ ${t.valor})`).join(' | ') || 'Nenhuma';

      // Sincronizacao direta com o NOVO link do Google Sheets
      fetch("https://script.google.com/macros/s/AKfycby7zYZabe5RAmuGWmzG1q7bbhtfBSlxHLmsyzXeitffYmxftWNJ0mHfPqJqlPLwIplKxQ/exec", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          id: procId,
          cliente_nome: cliente.nome_empresa || cliente.nome_contato,
          titulo: proc?.titulo || 'Sem Titulo',
          passo: novoStatus ? ultimoPassoId : (parseInt(proc?.passo) || 1),
          pago: novoStatus,
          valor_total: proc?.valor_honorarios || 0,
          valor_entrada: proc?.valor_entrada || 0,
          taxas_pagas: taxasPagasStr
        })
      }).catch(err => console.error("Erro Sheets:", err));

      await carregarDados();
    } else {
      mostrarToast('Erro ao atualizar: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  async function salvarProcesso(e) {
    e.preventDefault();
    setSubindoArquivo(true);

    const payloadProc = {
      titulo: formProcesso.titulo,
      passo: formProcesso.passo,
      valor_honorarios: formProcesso.valor_honorarios ? parseFloat(formProcesso.valor_honorarios) : 0,
      valor_entrada: formProcesso.valor_entrada ? parseFloat(formProcesso.valor_entrada) : 0,
      taxas_pendentes: JSON.stringify(listaTaxas),
      taxas_pagas: null,
      honorario_pago: formProcesso.honorario_pago || false
    };

    if (modalProcesso.tipo === 'novo') {
      if (!templateSelecionadoId) {
        mostrarToast('Selecione um modelo/template de processo.', 'erro');
        setSubindoArquivo(false);
        return;
      }
      const tplEncontrado = templatesProcessos.find(t => t.id === templateSelecionadoId);
      const passosParaSnapshot = tplEncontrado ? (typeof tplEncontrado.passos === 'string' ? JSON.parse(tplEncontrado.passos) : tplEncontrado.passos) : PASSOS_BACKUP;

      payloadProc.cliente_id = id;
      payloadProc.passos_snapshot = passosParaSnapshot;

      const { error } = await supabase.from('processos_societarios').insert([payloadProc]);
      if (!error) {
        mostrarToast('Novo processo iniciado!', 'sucesso');
        await carregarDados();
        setModalProcesso({ aberto: false, tipo: 'novo', processo: null });
      } else mostrarToast('Erro: ' + error.message, 'erro');
    } else {
      // MÁGICA DOS CARIMBOS DE TEMPO: Verifica quais passos foram pulados/concluídos
      let historico = {};
      try { historico = typeof modalProcesso.processo.historico_passos === 'string' ? JSON.parse(modalProcesso.processo.historico_passos) : (modalProcesso.processo.historico_passos || {}); } catch(e) {}
      
      let listaPassosModal = [];
      try { listaPassosModal = typeof modalProcesso.processo.passos_snapshot === 'string' ? JSON.parse(modalProcesso.processo.passos_snapshot) : modalProcesso.processo.passos_snapshot; } catch(e){}
      if (!listaPassosModal || !Array.isArray(listaPassosModal) || listaPassosModal.length === 0) listaPassosModal = PASSOS_BACKUP;
      const ultimoPassoIdModal = listaPassosModal[listaPassosModal.length - 1]?.id || 8;

      const passoAntigo = modalProcesso.processo.passo;
      if (formProcesso.passo > passoAntigo) {
        for (let i = passoAntigo; i < formProcesso.passo; i++) {
          if (!historico[i]) historico[i] = new Date().toISOString();
        }
      }
      if (formProcesso.honorario_pago && !historico[ultimoPassoIdModal]) historico[ultimoPassoIdModal] = new Date().toISOString();
      else if (!formProcesso.honorario_pago && historico[ultimoPassoIdModal]) delete historico[ultimoPassoIdModal];
      
      payloadProc.historico_passos = historico;

      const { error } = await supabase.from('processos_societarios').update(payloadProc).eq('id', modalProcesso.processo.id);
      
      if (!error) {
        mostrarToast('Processo atualizado!', 'sucesso');
        
        // Sincronizacao direta e imediata com o NOVO link do Google Sheets
        fetch("https://script.google.com/macros/s/AKfycby7zYZabe5RAmuGWmzG1q7bbhtfBSlxHLmsyzXeitffYmxftWNJ0mHfPqJqlPLwIplKxQ/exec", {
          method: 'POST',
          mode: 'no-cors',
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            id: modalProcesso.processo.id,
            cliente_nome: cliente.nome_empresa || cliente.nome_contato,
            titulo: formProcesso.titulo,
            passo: parseInt(formProcesso.passo),
            pago: formProcesso.honorario_pago,
            valor_total: formProcesso.valor_honorarios || 0,
            valor_entrada: formProcesso.valor_entrada || 0,
            taxas_pagas: listaTaxas.filter(t => t.status === 'pago').map(t => `${t.nome} (R$ ${t.valor})`).join(' | ') || 'Nenhuma'
          })
        }).catch(err => console.error("Erro na sincronização Sheets:", err));
        
        // Dispara o Push para o Celular do Cliente (Protegido contra travamento)
        try {
          if (typeof dispararPush === 'function') {
            dispararPush(
              id, 
              'Processo Atualizado!', 
              `O seu processo de legalização avançou para a etapa: ${formProcesso.passo}.`
            );
          } else {
            console.warn("Aviso: Função dispararPush não encontrada/importada neste arquivo.");
          }
        } catch (pushErr) {
          console.error("Erro ao tentar enviar o push:", pushErr);
        }
        
        // Avisa a Maria
        let passosProcModal = [];
        try { passosProcModal = typeof modalProcesso.processo?.passos_snapshot === 'string' ? JSON.parse(modalProcesso.processo.passos_snapshot) : modalProcesso.processo?.passos_snapshot; } catch(e){}
        if (!passosProcModal || !Array.isArray(passosProcModal)) passosProcModal = PASSOS_BACKUP;
        const passoNome = passosProcModal.find(p => p.id === parseInt(formProcesso.passo))?.nome;
        enviarEmailDemanda({
           to: 'societario@innovbusiness.com.br',
           nomeDestinatario: 'Maria (Societário)',
           nomeRemetente: operador,
           tituloDemanda: `Atualização de Processo: ${cliente.nome_empresa || cliente.nome_contato}`,
           descricao: `O processo "${modalProcesso.processo.titulo}" foi atualizado para o PASSO ${formProcesso.passo}: ${passoNome}.`,
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

  // ==========================================
  // UPLOADS DE CLIENTES E ADMINS
  // ==========================================
  async function handleEnviarDocumento(e, departamentoDestino) {
    e.preventDefault();
    if (!arquivoDoc || !descricaoDoc.trim()) return mostrarToast('Preencha a descrição e selecione o arquivo.', 'erro');
    if (arquivoDoc.size > (arquivoDoc.name?.match(/\.(csv|xls|xlsx)$/i) ? 50 : 4.4) * 1024 * 1024) return mostrarToast('Arquivo excede o limite permitido (50MB p/ planilhas).', 'erro');
    
    // Trava de segurança: impede documentos fantasmas se houver múltiplos processos
    if (processos.length > 1 && !processoSelecionadoDoc) return mostrarToast('Por favor, selecione para qual processo este documento pertence.', 'erro');

    setSubindoArquivo(true);
    
    // 1. Busca os IDs do Drive salvos neste cliente
    const { data: dadosCliente } = await supabase.from('clientes').select('id_drive_recebidos').eq('id', id).single();
    const pastaDestinoDrive = dadosCliente?.id_drive_recebidos;

    let caminhoFinal = null;

    // 2. Tenta fazer upload no Drive
    if (pastaDestinoDrive) {
       const formData = new FormData();
       formData.append('file', arquivoDoc);
       formData.append('folderId', pastaDestinoDrive);
       
       try {
         const res = await fetch('/api/drive/upload', { method: 'POST', body: formData });
         const resData = await res.json();
         if (resData.success) {
           caminhoFinal = `DRIVE:${resData.fileId}`;
         }
       } catch (err) { console.error("Erro no fetch do Drive:", err); }
    }

    // 3. Fallback de Segurança (Supabase)
    if (!caminhoFinal) {
      const timestamp = Date.now();
      caminhoFinal = `${id}/recebidos_societario/${timestamp}_${arquivoDoc.name}`;
      const { error: storageError } = await supabase.storage.from('documentos').upload(caminhoFinal, arquivoDoc);
      if (storageError) {
        mostrarToast('Erro ao subir arquivo: ' + storageError.message, 'erro');
        setSubindoArquivo(false);
        return;
      }
    }

    const payloadEnvio = {
      cliente_id: id,
      nome_documento: descricaoDoc.trim(),
      nome_original: arquivoDoc.name,
      caminho_storage: caminhoFinal,
      departamento: departamentoDestino,
      status: 'pendente'
    };
    
    if (processos.length === 1) {
      payloadEnvio.processo_id = processos[0].id;
    } else if (processoSelecionadoDoc) {
      payloadEnvio.processo_id = processoSelecionadoDoc;
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

  function visualizarDocumento(caminhoStorage) {
    if (caminhoStorage.startsWith('DRIVE:')) {
      const fileId = caminhoStorage.split('DRIVE:')[1];
      window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
      return;
    }
    const { data } = supabase.storage.from('documentos').getPublicUrl(caminhoStorage);
    window.open(data.publicUrl, '_blank');
  }

  async function handleEnviarEmailDoc(e) {
    e.preventDefault();
    setSubindoArquivo(true);
    const arq = modalEmailDoc.arquivo;
    
    let caminhoBase = "Processo Societário";
    if (arq.processo_id) {
      const proc = processos.find(p => p.id === arq.processo_id);
      if (proc) caminhoBase += ` / ${proc.titulo}`;
    }
    
    try {
      const { data: publicUrlData } = supabase.storage.from('documentos').getPublicUrl(arq.caminho_storage);

      await enviarEmailDocumento({
        to: cliente.email,
        nomeDestinatario: cliente.nome_contato || cliente.nome_empresa,
        nomeRemetente: operador,
        tituloEmail: modalEmailDoc.titulo,
        mensagem: modalEmailDoc.mensagem,
        nomeArquivo: arq.nome_original,
        urlArquivo: publicUrlData.publicUrl,
        caminhoPasta: caminhoBase
      });
      await supabase.from('logs_auditoria').insert([{ usuario_nome: operador, usuario_tipo: 'interno', acao: 'EMAIL_ENVIADO', detalhe: `Enviou documento por e-mail para ${cliente.email}` }]);
      mostrarToast('E-mail enviado com sucesso!', 'sucesso');
      setModalEmailDoc({ aberto: false, arquivo: null, titulo: 'Novo Documento Disponível', mensagem: '' });
    } catch (err) {
      mostrarToast('Erro ao enviar e-mail.', 'erro');
    }
    setSubindoArquivo(false);
  }
  async function baixarDocumento(caminhoStorage, nomeOriginal) {
    setSubindoArquivo(true);
    mostrarToast('Baixando Arquivo...', 'aviso');
    
    if (caminhoStorage.startsWith('DRIVE:')) {
      const fileId = caminhoStorage.split('DRIVE:')[1];
      const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeOriginal || 'documento';
      document.body.appendChild(a);
      a.click();
      a.remove();
      mostrarToast('Download concluído!', 'sucesso');
      setSubindoArquivo(false);
      return;
    }

    const { data, error } = await supabase.storage.from('documentos').download(caminhoStorage);
    if (error) {
      mostrarToast('Erro ao baixar o arquivo: ' + error.message, 'erro');
      setSubindoArquivo(false);
      return;
    }
    const nomeFinal = nomeOriginal || caminhoStorage.split('/').pop();
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeFinal; 
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url); 
    mostrarToast('Download concluído!', 'sucesso');
    setSubindoArquivo(false);
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
            ) : cliente && (cliente.tipo_conta !== 'especiais' && cliente.tipo_conta !== 'especial') ? (
              <button onClick={() => router.push(`/cliente/${id}`)} className="text-sm font-bold text-[#d4af37] hover:underline hover:text-yellow-400 transition">← Voltar para Painel Principal</button>
            ) : (
              <span className="text-xs text-zinc-500 font-bold tracking-wider uppercase">Portal de Processos</span>
            )}
          </div>
          <div className="flex items-center gap-4 relative">
            <span className="text-sm text-zinc-400 hidden sm:inline">
              Conectado como: <strong className="text-purple-400 font-extrabold">{operador || cliente.nome_contato}</strong>
            </span>
            
            {/* SWITCHER DE CONTAS */}
            {empresasLigadas.length > 0 && (
              <div className="relative z-[999]">
                <button onClick={() => setMostrarSwitcher(!mostrarSwitcher)} className="text-xs bg-[#1b263b] border border-zinc-700 hover:border-purple-500 px-3 py-2 rounded-lg transition-all font-bold flex items-center gap-2">
                  Trocar Conta ▼
                </button>
                {mostrarSwitcher && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#0d1b2a] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden text-left">
                    <div className="px-4 py-3 border-b border-zinc-800 bg-[#1b263b]/50">
                      <p className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Contas Vinculadas</p>
                    </div>
                    <div onClick={() => { localStorage.setItem('usuario_id', cliente.id); window.location.href = `/cliente/${cliente.id}?view=especial`; }} className="px-4 py-3 cursor-pointer hover:bg-zinc-800 transition border-b border-zinc-800/50 flex justify-between items-center">
                      <div className="truncate pr-2">
                        <p className="text-xs font-bold text-purple-400 truncate">{cliente.nome_empresa} (Atual)</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{cliente.cnpj || cliente.cpf}</p>
                      </div>
                      <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold">Societário</span>
                    </div>
                    {empresasLigadas.map(emp => {
                      const isEspecial = emp.tipo_conta === 'especiais' || emp.tipo_conta === 'especial';
                      return (
                        <div key={emp.id} onClick={() => { 
                          localStorage.setItem('usuario_id', emp.id); 
                          window.location.href = isEspecial ? `/cliente/${emp.id}?view=especial` : `/cliente/${emp.id}`; 
                        }} className="px-4 py-3 cursor-pointer hover:bg-zinc-800 transition border-b border-zinc-800/50 last:border-0 flex justify-between items-center">
                          <div className="truncate pr-2">
                            <p className="text-xs font-medium text-white truncate">{emp.nome_empresa}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{emp.cnpj || emp.cpf}</p>
                          </div>
                          {isEspecial && <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold">Societário</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
            {isInterno && docsEnviados.filter(d => d.departamento === 'Societário' && d.status === 'pendente').length > 0 && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500 text-white font-black animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.6)]">
                {docsEnviados.filter(d => d.departamento === 'Societário' && d.status === 'pendente').length}
              </span>
            )}
          </button>
          <button onClick={() => setAbaAtiva('financeiro')} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaAtiva === 'financeiro' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconFinanceiro /> Financeiro & Taxas
            {isInterno && docsEnviados.filter(d => d.departamento === 'Financeiro' && d.status === 'pendente').length > 0 && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-black animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                {docsEnviados.filter(d => d.departamento === 'Financeiro' && d.status === 'pendente').length}
              </span>
            )}
          </button>
        </div>

        {/* ABA 1: STATUS DO PROCESSO */}
        {abaAtiva === 'status' && (
          <div className="bg-[#1b263b] p-8 rounded-xl border border-zinc-800 shadow-xl mb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-zinc-800 pb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Acompanhamento de Processos</h2>
                <div className="flex bg-[#0d1b2a] p-1 rounded-lg border border-zinc-700 w-max mt-2">
                  <button onClick={() => setSubAbaStatus('ativos')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${subAbaStatus === 'ativos' ? 'bg-purple-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Em Andamento</button>
                  <button onClick={() => setSubAbaStatus('finalizados')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${subAbaStatus === 'finalizados' ? 'bg-emerald-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Finalizados</button>
                </div>
              </div>
             {isInterno && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => setModalGerenciarTemplates(true)} className="bg-zinc-800 text-purple-300 border border-purple-500/30 hover:bg-purple-500 hover:text-white font-bold px-4 py-2.5 rounded-lg text-xs sm:text-sm transition shadow-md">
                    + Templates
                  </button>
                  <button onClick={() => { 
                    setFormProcesso({ titulo: '', passo: 1, valor_honorarios: '', valor_entrada: '' }); 
                    setListaTaxas([]); setTaxaNome(''); setTaxaValor(''); setTaxaBoleto(null); setIsPix(false); setChavePix(''); setSemTaxas(false);
                    setTemplateSelecionadoId(templatesProcessos[0]?.id || '');
                    setModalProcesso({ aberto: true, tipo: 'novo', processo: null }); 
                  }} className="bg-purple-500 text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-purple-400 transition shadow-lg">
                    + Novo Processo
                  </button>
                </div>
              )}
            </div>

            {(() => {
              const processosFiltrados = processos?.filter(proc => {
                let listaPassos = [];
                try { listaPassos = typeof proc?.passos_snapshot === 'string' ? JSON.parse(proc.passos_snapshot) : proc?.passos_snapshot; } catch(e){}
                if (!listaPassos || !Array.isArray(listaPassos) || listaPassos.length === 0) listaPassos = PASSOS_BACKUP;
                const ultimoPassoId = listaPassos[listaPassos.length - 1]?.id || 8;

                // MÁGICA: Os pontos de interrogação (?.) impedem a quebra se o documento não tiver nome no banco!
                const temComprovanteEnviado = docsEnviados?.some(d => d.processo_id === proc.id && (d.tipo_documento === 'comprovante_honorario' || d?.nome_documento?.includes('Comprovante Honorários')));
                const isFinished = proc.passo === ultimoPassoId && (proc.honorario_pago || temComprovanteEnviado || honorarioPagoManual[proc.id]);
                return subAbaStatus === 'ativos' ? !isFinished : isFinished;
              }) || [];

              if (processosFiltrados.length === 0) return (
                 <div className="text-center py-12 bg-[#0d1b2a] rounded-xl border border-zinc-800">
                   <p className="text-zinc-500">Nenhum processo nesta categoria.</p>
                 </div>
              );

              return (
                 <div className="space-y-10">
                   {processosFiltrados?.map(proc => {
                      let listaPassos = [];
                      try { listaPassos = typeof proc?.passos_snapshot === 'string' ? JSON.parse(proc.passos_snapshot) : proc?.passos_snapshot; } catch(e){}
                      if (!listaPassos || !Array.isArray(listaPassos) || listaPassos.length === 0) listaPassos = PASSOS_BACKUP;
                      
                      const totalPassos = listaPassos.length;
                      const ultimoPassoId = listaPassos[totalPassos - 1]?.id || totalPassos;

                      const temComprovanteEnviado = docsEnviados?.some(d => d.processo_id === proc.id && (d.tipo_documento === 'comprovante_honorario' || d?.nome_documento?.includes('Comprovante Honorários')));
                      const isFinished = proc.passo === ultimoPassoId && (proc.honorario_pago || temComprovanteEnviado || honorarioPagoManual[proc.id]);
                      
                      let porcentagem = Math.round((proc.passo / totalPassos) * 100);
                      if (proc.passo === ultimoPassoId && !isFinished) {
                        porcentagem = 99;
                      }
                      
                      const isExpanded = processosFiltrados.length === 1 || expandidos[proc.id];
                      let historicoObj = {};
                      try { historicoObj = typeof proc?.historico_passos === 'string' ? JSON.parse(proc.historico_passos) : (proc?.historico_passos || {}); } catch(e) {}

                      return (
                        <div key={proc.id} className="bg-[#0d1b2a] p-6 rounded-xl border border-purple-500/20 relative overflow-hidden shadow-lg transition-all duration-300">
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-zinc-800 pb-4 gap-4">
                              <div className="flex-1 w-full sm:w-auto">
                                <h3 className="text-lg font-bold text-[#d4af37] flex items-center gap-2 mb-2">
                                  <span className={`w-2 h-2 rounded-full ${subAbaStatus === 'ativos' ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                  {proc.titulo}
                                </h3>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status:</span>
                                  <span className={`text-xs font-black ${subAbaStatus === 'ativos' ? 'text-purple-400' : 'text-emerald-400'}`}>{porcentagem}% Concluído</span>
                                </div>
                              </div>

                              <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap items-center">
                                {processosFiltrados.length > 1 && (
                                  <button onClick={() => setExpandidos(prev => ({ ...prev, [proc.id]: !prev[proc.id] }))} className="flex-1 sm:flex-none text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 px-4 py-2 rounded font-bold hover:bg-zinc-700 hover:text-white transition">
                                    {isExpanded ? 'Ocultar Etapas ▲' : 'Ver Detalhes ▼'}
                                  </button>
                                )}

                                {isInterno && (
                                  <>
                                    <button onClick={() => { 
                                      let parsed = [];
                                      try { parsed = JSON.parse(proc.taxas_pendentes || '[]'); if (!Array.isArray(parsed)) parsed = [parsed]; } catch(err) { parsed = []; }
                                      setListaTaxas(parsed); setTaxaNome(''); setTaxaValor(''); setTaxaBoleto(null); setIsPix(false); setChavePix(''); setSemTaxas(parsed.length === 0);
                                      setFormProcesso({ 
                                        titulo: proc.titulo, passo: proc.passo, valor_honorarios: proc.valor_honorarios || '', valor_entrada: proc.valor_entrada || '', honorario_pago: proc.honorario_pago || false
                                      }); 
                                      setModalProcesso({ aberto: true, tipo: 'editar', processo: proc }); 
                                    }} className="flex-1 sm:flex-none text-xs bg-purple-500/10 text-purple-300 border border-purple-500/30 px-4 py-2 rounded font-bold hover:bg-purple-500 hover:text-white transition">Gerenciar</button>
                                    <button onClick={() => deletarProcesso(proc.id)} className="flex-1 sm:flex-none text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-2 rounded font-bold hover:bg-red-500 hover:text-white transition">Excluir</button>
                                  </>
                                )}
                              </div>
                           </div>

                            <div className={`w-full bg-[#1b263b] rounded-full h-2 border border-zinc-700 overflow-hidden ${isExpanded ? 'mb-8' : 'mb-2'}`}>
                              <div className={`h-2 rounded-full transition-all duration-1000 ease-out ${subAbaStatus === 'ativos' ? 'bg-gradient-to-r from-purple-700 to-purple-400' : 'bg-emerald-500'}`} style={{ width: `${porcentagem}%` }}></div>
                            </div>

                            {isExpanded && (
                              <div className="relative ml-2 sm:ml-6 space-y-6 pb-2 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                {listaPassos?.map((passo, index) => {
                                  let isCompleted = proc.passo > passo.id;
                                  let isCurrent = proc.passo === passo.id;
                                  const isFuture = proc.passo < passo.id;
                                  const isUltimoPasso = passo.id === ultimoPassoId;
                                  
                                  if (isUltimoPasso && proc.passo === ultimoPassoId) {
                                    if (proc.honorario_pago || temComprovanteEnviado || honorarioPagoManual[proc.id]) { isCompleted = true; isCurrent = false; }
                                  }

                                  let colorClass = 'bg-zinc-800 border-zinc-600 text-zinc-500'; 
                                  if (isCompleted) colorClass = 'bg-emerald-500 border-emerald-400 text-[#0d1b2a] shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                                  if (isCurrent) colorClass = 'bg-purple-500 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse';
                                  
                                  const dataCarimbo = historicoObj[passo.id] ? new Date(historicoObj[passo.id]) : null;

                                  return (
                                    <div key={passo.id} className={`relative pl-12 sm:pl-16 transition-all duration-500 ${isCurrent ? 'scale-[1.01]' : isFuture ? 'opacity-40 grayscale' : ''}`}>
                                      {index !== listaPassos.length - 1 && (
                                        <div className={`absolute left-4 -ml-[1px] top-[36px] w-[2px] ${isCompleted ? 'bg-emerald-500/50' : 'bg-zinc-700'} z-0`} style={{ bottom: '-28px' }}></div>
                                      )}
                                      <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 flex items-center justify-center font-black text-xs z-10 ${colorClass}`}>
                                        {isCompleted ? '✓' : passo.id}
                                      </div>
                                      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isCurrent ? 'bg-[#1b263b] border-purple-500/50 shadow-lg' : 'bg-[#1b263b]/30 border-zinc-800'}`}>
                                        <div className="flex-1">
                                          <h3 className={`text-sm font-bold mb-1 ${isCurrent ? 'text-purple-400' : isCompleted ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                            {isUltimoPasso && isCurrent ? 'Pagar Honorários / Finalizar' : passo.nome}
                                          </h3>
                                          <p className="text-xs text-zinc-400 leading-relaxed">
                                            {isUltimoPasso && isCurrent ? 'Seu processo foi deferido! Clique ao lado para ir ao financeiro, efetuar o acerto dos honorários e liberar a documentação 100% concluída.' : passo.desc}
                                          </p>
                                        </div>
                                        {isUltimoPasso && isCurrent && !isInterno && (
                                          <button 
                                            type="button"
                                            onClick={() => { setAbaAtiva('financeiro'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            className="text-xs bg-[#d4af37] text-[#0d1b2a] font-extrabold px-3 py-2 rounded-lg hover:bg-yellow-500 transition shadow-sm whitespace-nowrap self-start sm:self-center"
                                          >
                                            Ir para Financeiro ➔
                                          </button>
                                        )}
                                        {dataCarimbo && (
                                          <div className="text-[10px] text-zinc-500 font-bold bg-[#0d1b2a] px-3 py-1.5 rounded-lg border border-zinc-800 flex-shrink-0">
                                            Finalizado em: {dataCarimbo.toLocaleDateString('pt-BR')} às {dataCarimbo.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                          </div>
                                        )}
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
              );
            })()}

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

            {/* FORMULÁRIO DE ENVIO GERAL (Cliente) */}
            <div className="bg-[#1b263b] p-5 sm:p-6 rounded-xl border border-zinc-800 shadow-xl overflow-hidden">
              <h3 className="text-lg font-bold text-white mb-2">Enviar Documento</h3>
              <p className="text-xs text-zinc-400 mb-6">A nossa equipa solicitou um documento? Anexe-o abaixo.</p>
              
              <form onSubmit={(e) => handleEnviarDocumento(e, 'Societário')} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[#0d1b2a] p-4 sm:p-5 rounded-lg border border-zinc-800/60 w-full">
                {processos.length > 1 && (
                  <div className="md:col-span-12 mb-1 border-b border-zinc-800 pb-3 w-full">
                    <label className="block text-xs font-bold text-purple-400 uppercase mb-2">Para qual processo é este documento?</label>
                    <select required value={processoSelecionadoDoc} onChange={e => setProcessoSelecionadoDoc(e.target.value)} className="w-full max-w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer truncate">
                      <option value="">Selecione um processo...</option>
                      {processos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                    </select>
                  </div>
                )}
                
                <div className="md:col-span-5 w-full">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Qual é o documento?</label>
                  <input type="text" required placeholder="Ex: CNH do Sócio..." value={descricaoDoc} onChange={e => setDescricaoDoc(e.target.value)} className="w-full max-w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
                </div>
                <div className="md:col-span-4 w-full">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Escolher Arquivo</label>
                  <input type="file" required accept=".pdf,image/*,.csv,.xls,.xlsx" onChange={e => setArquivoDoc(e.target.files[0])} className="text-xs text-zinc-400 bg-[#1b263b] border border-zinc-700 rounded-lg p-2 w-full max-w-full cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200" />
                </div>
                <div className="md:col-span-3 w-full mt-2 md:mt-0">
                  <button type="submit" disabled={subindoArquivo} className="w-full bg-purple-500 text-white font-extrabold px-4 py-2.5 rounded-lg text-sm hover:bg-purple-400 transition shadow-lg disabled:opacity-50">
                    {subindoArquivo ? 'A enviar...' : 'Enviar Arquivo'}
                  </button>
                </div>
              </form>
            </div>

            {/* RENDERIZAÇÃO DOS DOCUMENTOS (Agrupados se houver > 1 processo) */}
            {processos.length <= 1 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lado 1: Você Enviou */}
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

                {/* Lado 2: Equipe Disponibilizou */}
                <div className="bg-[#1b263b] p-6 rounded-xl border border-zinc-800 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">A Equipa Disponibilizou</h3>
                    {isInterno && (
                      <label className="text-[10px] bg-purple-500 hover:bg-purple-400 text-white px-3 py-1.5 rounded transition font-bold cursor-pointer shadow-sm">
                        + Publicar Doc
                        <input type="file" accept=".pdf,image/*,.csv,.xls,.xlsx" className="hidden" onChange={(e) => handleUploadAdminDoc(e, processos[0]?.id || null)} disabled={subindoArquivo} />
                      </label>
                    )}
                  </div>
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
                          <div className="flex gap-2">
                            {isInterno && <button onClick={() => setModalEmailDoc({ aberto: true, arquivo: doc, titulo: 'Novo Documento Disponível', mensagem: '' })} className="text-[10px] flex-shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded transition font-bold shadow-sm">E-mail</button>}
                            <button onClick={() => baixarDocumento(doc.caminho_storage, doc.nome_original)} className="text-[10px] flex-shrink-0 bg-purple-500 text-white hover:bg-purple-400 px-3 py-1.5 rounded transition font-bold shadow-sm">Baixar</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // SE TIVER MAIS DE 1 PROCESSO, AGRUPA EM BLOCOS!
              <div className="space-y-8">
                {processos.map(proc => {
                  const enviadosDeste = docsEnviados.filter(d => d.departamento === 'Societário' && d.processo_id === proc.id);
                  const recebidosDeste = docsRecebidos.filter(d => d.processo_id === proc.id);
                  
                  return (
                    <div key={proc.id} className="bg-[#1b263b] p-6 rounded-xl border border-purple-500/20 shadow-lg">
                      <h3 className="text-lg font-bold text-[#d4af37] mb-5 border-b border-zinc-800 pb-3 flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-purple-500"></span> {proc.titulo}
                      </h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Lado 1: Enviado pelo cliente */}
                        <div>
                          <p className="text-[11px] font-bold text-white mb-3 uppercase tracking-wider">Você Enviou</p>
                          <div className="space-y-2">
                            {enviadosDeste.length === 0 ? <p className="text-zinc-500 text-xs italic">Nenhum documento.</p> : enviadosDeste.map(doc => (
                              <div key={doc.id} className="p-2.5 bg-[#0d1b2a] rounded-lg border border-zinc-800 flex justify-between items-center gap-2">
                                <div className="truncate flex-1">
                                  <p className="text-xs font-bold text-zinc-200 truncate">{doc.nome_documento}</p>
                                  <p className="text-[9px] text-zinc-500">{new Date(doc.criado_em).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <button onClick={() => baixarDocumento(doc.caminho_storage, doc.nome_original)} className="text-[10px] bg-zinc-800 text-white px-2 py-1 rounded font-bold">Baixar</button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Lado 2: Enviado pela Equipe (Admin) */}
                        <div className="w-full overflow-hidden">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2 w-full">
                            <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">A Equipa Disponibilizou</p>
                            {isInterno && (
                              <label className="text-[9px] bg-purple-500 hover:bg-purple-400 text-white px-3 py-1.5 rounded transition font-bold cursor-pointer whitespace-nowrap shadow-sm">
                                + Publicar Doc
                                <input type="file" accept=".pdf,image/*,.csv,.xls,.xlsx" className="hidden" onChange={(e) => handleUploadAdminDoc(e, proc.id)} disabled={subindoArquivo} />
                              </label>
                            )}
                          </div>
                          <div className="space-y-2">
                            {recebidosDeste.length === 0 ? <p className="text-zinc-500 text-xs italic">Nenhum documento.</p> : recebidosDeste.map(doc => (
                              <div key={doc.id} className="p-2.5 bg-purple-500/5 rounded-lg border border-purple-500/20 flex justify-between items-center gap-2">
                                <div className="truncate flex-1">
                                  <p className="text-xs font-bold text-zinc-200 truncate">{doc.nome_original}</p>
                                  <p className="text-[9px] text-zinc-500">{new Date(doc.criado_em).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="flex gap-2">
                                  {isInterno && <button onClick={() => setModalEmailDoc({ aberto: true, arquivo: doc, titulo: 'Novo Documento Disponível', mensagem: '' })} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white px-2 py-1 rounded font-bold transition shadow-sm">E-mail</button>}
                                  <button onClick={() => baixarDocumento(doc.caminho_storage, doc.nome_original)} className="text-[10px] bg-purple-500 text-white px-2 py-1 rounded font-bold">Baixar</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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

            {/* BANNER PIX DISCRETO */}
            <div className="bg-[#1b263b] p-4 sm:p-5 rounded-xl border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <div className="text-emerald-400">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                 </div>
                 <div>
                   <h3 className="text-sm font-bold text-white mb-0.5">Pagamento via PIX</h3>
                   <p className="text-xs text-zinc-400">Chave CNPJ: <strong className="text-emerald-400">52.305.552/0001-01</strong></p>
                 </div>
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText('52.305.552/0001-01'); mostrarToast('Chave PIX copiada!', 'sucesso'); }} 
                className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold px-4 py-2 rounded-lg text-xs hover:bg-emerald-500 hover:text-[#0d1b2a] transition w-full sm:w-auto whitespace-nowrap"
              >
                Copiar Chave
              </button>
            </div>

            {/* NOVO: FINANCEIRO SEPARADO POR PROCESSO */}
            <div className="space-y-6 mb-8">
              {processos.map(proc => {
                let listaPassosFin = [];
                try { listaPassosFin = typeof proc.passos_snapshot === 'string' ? JSON.parse(proc.passos_snapshot) : proc.passos_snapshot; } catch(e){}
                if (!listaPassosFin || !Array.isArray(listaPassosFin) || listaPassosFin.length === 0) listaPassosFin = PASSOS_BACKUP;
                const ultimoPassoFin = listaPassosFin[listaPassosFin.length - 1]?.id || 8;

                const finalizado = proc.passo === ultimoPassoFin;
                const clientEnviouComprovante = docsEnviados.find(d => d.processo_id === proc.id && d.tipo_documento === 'comprovante_honorario');
                
                let taxasArray = [];
                try {
                   if (proc.taxas_pendentes) {
                      const p = JSON.parse(proc.taxas_pendentes);
                      taxasArray = Array.isArray(p) ? p : [p];
                   }
                } catch(e) {}
        
                const taxasPendentes = taxasArray.filter(t => t.status === 'pendente');
                const taxasPagas = taxasArray.filter(t => t.status === 'pago');

                return (
                  <div key={proc.id} className={`bg-[#0d1b2a] p-6 rounded-xl border ${finalizado ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-[#d4af37]/30 shadow-md'}`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${finalizado ? 'text-emerald-400' : 'text-[#d4af37]'}`}>
                      <IconFinanceiro /> {proc.titulo} {finalizado && <span className="text-emerald-400 ml-2"><IconCheck /></span>}
                    </h3>
                    
                    <div className={`grid grid-cols-1 gap-6 ${(finalizado || isInterno) ? 'md:grid-cols-2' : ''}`}>
                      <div className="space-y-4">
                        
                        <div className="bg-[#1b263b] p-4 rounded-lg border border-zinc-700/50">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Taxas Governamentais (Pendentes)</p>
                          {taxasPendentes.length === 0 ? <p className="text-xs text-zinc-600 italic">Tudo limpo.</p> : (
                             taxasPendentes.map(taxa => (
                                <div key={taxa.id || taxa.nome} className="space-y-2 mt-2 p-3 bg-[#0d1b2a] border border-zinc-700 rounded-lg">
                                   <p className="text-sm font-bold text-white">{taxa.nome}</p>
                                   <p className="text-xs text-[#d4af37] font-extrabold">Valor: R$ {taxa.valor}</p>
                                   
                                   {taxa.isPix ? (
                                      <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-zinc-800">
                                        <p className="text-[10px] text-zinc-400 font-mono break-all text-center bg-[#1b263b] p-1.5 rounded">{taxa.chavePix}</p>
                                        <button type="button" onClick={() => { navigator.clipboard.writeText(taxa.chavePix); mostrarToast('Chave PIX copiada!', 'sucesso'); }} className="w-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 py-2 rounded font-bold transition hover:bg-emerald-500 hover:text-black">Copiar Chave PIX</button>
                                      </div>
                                   ) : (
                                      taxa.boleto && (
                                        <div className="flex gap-2 mt-2 pt-2 border-t border-zinc-800">
                                          <button type="button" onClick={() => { const { data } = supabase.storage.from('documentos').getPublicUrl(taxa.boleto); window.open(data.publicUrl, '_blank'); }} className="flex-1 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded font-bold transition">Ver Boleto</button>
                                          <button type="button" onClick={() => baixarDocumento(taxa.boleto, `Boleto_${taxa.nome}.pdf`)} className="flex-1 text-[10px] border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] py-2 rounded font-bold transition">Baixar Boleto</button>
                                        </div>
                                      )
                                   )}
                                   {!isInterno && (
                                     <label className="block text-center mt-2 w-full cursor-pointer bg-[#d4af37] text-[#0d1b2a] font-extrabold py-2 rounded-lg text-[10px] hover:bg-yellow-500 transition shadow-sm">
                                        {subindoArquivo ? 'Aguarde...' : '+ Anexar Comprovante'}
                                        <input type="file" accept="application/pdf,image/*,.csv,.xls,.xlsx" className="hidden" onChange={e => handleAnexarComprovanteTaxa(e, proc, taxa.id)} disabled={subindoArquivo} />
                                     </label>
                                   )}
                                </div>
                             ))
                          )}
                        </div>

                        <div className="bg-[#1b263b] p-4 rounded-lg border border-emerald-500/20">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Taxas Já Pagas</p>
                          {taxasPagas.length === 0 ? <p className="text-xs text-zinc-600 italic">Nenhum pagamento ainda.</p> : (
                             taxasPagas.map(taxa => (
                                <div key={taxa.id || taxa.nome} className="space-y-1 mt-2 p-3 bg-[#0d1b2a] border border-emerald-500/20 rounded-lg">
                                   <p className="text-sm font-bold text-white flex items-center gap-1"><IconCheck /> {taxa.nome}</p>
                                   <p className="text-xs text-emerald-400 font-bold">R$ {taxa.valor}</p>
                                   {taxa.comprovante && isInterno && (
                                      <button type="button" onClick={() => { const { data } = supabase.storage.from('documentos').getPublicUrl(taxa.comprovante); window.open(data.publicUrl, '_blank'); }} className="mt-2 w-full text-[10px] bg-zinc-800 hover:bg-zinc-700 text-white py-1.5 rounded font-bold transition">Ver Comprovante Anexado</button>
                                   )}
                                </div>
                             ))
                          )}
                        </div>
                      </div>

                      {(finalizado || isInterno) && (
<div className="flex flex-col justify-center bg-[#1b263b] p-6 rounded-lg border border-zinc-700/50 text-center">
                          {/* MÁGICA FINANCEIRA: Layout flexível conforme a entrada do cliente */}
                          <div className="space-y-3 mb-4 text-left border-b border-zinc-800 pb-4">
                            {proc.valor_entrada > 0 ? (
                              <>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-zinc-400 font-medium">Honorários Totais:</span>
                                  <span className="text-zinc-300 font-bold">R$ {Number(proc.valor_honorarios).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-emerald-400">
                                  <span className="font-medium">Valor de Entrada (Sinal Pago):</span>
                                  <span className="font-bold">- R$ {Number(proc.valor_entrada).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-zinc-800/60">
                                  <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wide">Honorários Devidos:</span>
                                  <span className="text-lg font-black text-white">R$ {Number(proc.valor_honorarios - proc.valor_entrada).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Honorários Totais:</span>
                                <span className="text-xl font-black text-white">R$ {proc.valor_honorarios ? Number(proc.valor_honorarios).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}</span>
                              </div>
                            )}
                          </div>

                          {/* SE FOR VISÃO DO CLIENTE EM PASSO DE PAGAMENTO FINAL */}
                          {finalizado && !isInterno ? (
                            <div className="space-y-4 text-center">
                              <h4 className="text-emerald-400 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2"><IconCheck /> Pagamento Final do Processo</h4>
                              <p className="text-xs text-zinc-300">Efetue o acerto do saldo restante via PIX para concluir o processo:</p>
                              
                              <div className="bg-[#0d1b2a] p-3 rounded-lg border border-zinc-800 text-center">
                                <p className="text-xs font-mono font-bold text-zinc-300 select-all">CNPJ: 52.305.552/0001-01</p>
                                <button type="button" onClick={() => { navigator.clipboard.writeText('52.305.552/0001-01'); mostrarToast('Chave PIX de Honorários copiada!', 'sucesso'); }} className="mt-2 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded font-bold hover:bg-emerald-500 hover:text-black transition">Copiar Chave PIX</button>
                              </div>

                              <div className="flex flex-col items-center gap-3 border-t border-zinc-800 pt-4 mt-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${proc.honorario_pago ? 'bg-emerald-500' : honorarioPagoManual[proc.id] ? 'bg-orange-500 animate-pulse' : 'bg-red-500'}`}></span>
                                  <span className={`text-[11px] font-bold ${proc.honorario_pago ? 'text-emerald-400' : honorarioPagoManual[proc.id] ? 'text-orange-400' : 'text-red-400'}`}>
                                    {proc.honorario_pago ? 'Pago & Confirmado' : honorarioPagoManual[proc.id] ? 'Pago (Aguardando conferência)' : 'Aguardando Pagamento Final'}
                                  </span>
                                </div>
                                
                                {!proc.honorario_pago && !honorarioPagoManual[proc.id] && (
                                  <label className="block w-full cursor-pointer bg-[#d4af37] text-[#0d1b2a] font-extrabold py-2.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-yellow-500 transition shadow-sm text-center">
                                    {subindoArquivo ? 'Aguarde...' : 'Anexar Comprovante de Pagamento'}
                                    <input type="file" accept="application/pdf,image/*,.csv,.xls,.xlsx" className="hidden" onChange={async (e) => {
                                      const file = e.target.files[0];
                                      if(!file) return;
                                      setSubindoArquivo(true);
                                      const caminho = `${id}/recebidos_societario/${Date.now()}_Honorario_${file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
                                      await supabase.storage.from('documentos').upload(caminho, file);
                                      await supabase.from('envios_cliente').insert([{ 
  cliente_id: id, 
  processo_id: proc.id, 
  nome_documento: `Comprovante Honorários - ${proc.titulo}`, 
  nome_original: file.name, 
  caminho_storage: caminho, 
  departamento: 'Financeiro', 
  status: 'pendente',
  tipo_documento: 'comprovante_honorario' // <--- A MÁGICA ACONTECE AQUI
}]);
                                      
                                      const { data: dbProc } = await supabase.from('processos_societarios').select('historico_passos, passos_snapshot').eq('id', proc.id).single();
                                      let hist = {}; try { hist = typeof dbProc?.historico_passos === 'string' ? JSON.parse(dbProc.historico_passos) : (dbProc?.historico_passos || {}); } catch(e) {}
                                      
                                      let listaPassosDB = [];
                                      try { listaPassosDB = typeof dbProc?.passos_snapshot === 'string' ? JSON.parse(dbProc.passos_snapshot) : dbProc?.passos_snapshot; } catch(e){}
                                      if (!listaPassosDB || !Array.isArray(listaPassosDB) || listaPassosDB.length === 0) listaPassosDB = PASSOS_BACKUP;
                                      const ultimoPassoUp = listaPassosDB[listaPassosDB.length - 1]?.id || 8;

                                      hist[ultimoPassoUp] = new Date().toISOString();
                                      await supabase.from('processos_societarios').update({ historico_passos: hist }).eq('id', proc.id);

                                      setHonorarioPagoManual({...honorarioPagoManual, [proc.id]: true});
                                      mostrarToast('Comprovante enviado! Aguardando baixa interna.', 'sucesso');
                                      await carregarDados();
                                      setSubindoArquivo(false);
                                    }} disabled={subindoArquivo} />
                                  </label>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              {!finalizado && isInterno && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded mt-2 inline-block">Visível apenas para a equipa (Processo em andamento)</span>}
                              
                              {finalizado && isInterno && (
                                <div className="mt-2 flex flex-col items-center gap-3 w-full">
                                  {clientEnviouComprovante ? (
                                    <div className="w-full space-y-2">
                                      <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-lg text-[10px] font-bold w-full text-center">
                                        O Cliente enviou o comprovante do saldo final!
                                      </div>
                                      <div className="flex gap-2 w-full">
                                        <button 
                                          type="button" 
                                          onClick={() => { const { data } = supabase.storage.from('documentos').getPublicUrl(clientEnviouComprovante.caminho_storage); window.open(data.publicUrl, '_blank'); }} 
                                          className="flex-1 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-white py-1.5 rounded font-bold transition"
                                        >
                                          Visualizar
                                        </button>
                                        <button 
                                          type="button" 
                                          onClick={() => baixarDocumento(clientEnviouComprovante.caminho_storage, clientEnviouComprovante.nome_original)} 
                                          className="flex-1 text-[10px] border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] py-1.5 rounded font-bold transition"
                                        >
                                          Baixar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-3 py-2 rounded-lg text-[10px] font-bold w-full text-center">
                                      Aguardando cliente anexar comprovante final (ou dê baixa manual).
                                    </div>
                                  )}
                                  
                                  <button 
                                    type="button" 
                                    onClick={() => toggleHonorarioPago(proc.id, proc.honorario_pago)} 
                                    className={`w-full py-2.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition shadow-sm ${
                                      proc.honorario_pago 
                                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20' 
                                      : 'bg-emerald-500 text-[#0d1b2a] hover:bg-emerald-400'
                                    }`}
                                  >
                                    {proc.honorario_pago 
                                      ? 'Reverter Baixa' 
                                      : clientEnviouComprovante 
                                        ? 'Dar Baixa (comprovante conferido)' 
                                        : 'Dar Baixa Manual (Saldo Recebido)'}
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <form onSubmit={(e) => handleEnviarDocumento(e, 'Financeiro')} className="bg-[#0d1b2a] p-5 sm:p-6 rounded-xl border border-zinc-800 shadow-inner mb-8 max-w-2xl overflow-hidden w-full">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Enviar Comprovante de Pagamento</h3>
              <div className="space-y-4 w-full">
                
                {processos.length > 1 && (
                  <div className="w-full mb-2">
                    <label className="block text-xs font-bold text-[#d4af37] uppercase mb-1">Referente a qual processo?</label>
                    <select required value={processoSelecionadoDoc} onChange={e => setProcessoSelecionadoDoc(e.target.value)} className="w-full max-w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37] cursor-pointer truncate">
                      <option value="">Selecione um processo...</option>
                      {processos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                    </select>
                  </div>
                )}

                <div className="w-full">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Do que se trata este comprovante?</label>
                  <input type="text" required placeholder="Ex: Taxa DARE..." value={descricaoDoc} onChange={e => setDescricaoDoc(e.target.value)} className="w-full max-w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                </div>
                <div className="w-full">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Anexar Comprovante</label>
                  <input type="file" required accept=".pdf,image/*,.csv,.xls,.xlsx" onChange={e => setArquivoDoc(e.target.files[0])} className="text-xs text-zinc-400 bg-[#1b263b] border border-zinc-700 rounded-lg p-2 w-full max-w-full cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#d4af37]/20 file:text-[#d4af37]" />
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
          <div className={`bg-[#1b263b] border border-purple-500/50 rounded-xl w-full ${modalProcesso.tipo === 'editar' ? 'max-w-5xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto hide-scrollbar flex flex-col shadow-2xl`}>
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl sticky top-0 z-10">
              <h3 className="text-lg font-bold text-purple-400">{modalProcesso.tipo === 'novo' ? 'Novo Processo Societário' : 'Gerenciar Processo'}</h3>
              <button onClick={() => setModalProcesso({ aberto: false, tipo: 'novo', processo: null })} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={salvarProcesso} className="p-5">
              <div className={`grid grid-cols-1 ${modalProcesso.tipo === 'editar' ? 'md:grid-cols-2' : ''} gap-5`}>
                
                {/* LADO ESQUERDO: Dados e Financeiro */}
                <div className="space-y-4">
                  {modalProcesso.tipo === 'novo' && (
                    <div>
                      <label className="block text-[10px] font-bold text-purple-400 uppercase mb-2">Selecione o Modelo / Template do Processo</label>
                      <select 
                        required 
                        value={templateSelecionadoId} 
                        onChange={e => setTemplateSelecionadoId(e.target.value)} 
                        className="w-full bg-[#0d1b2a] border border-purple-500/50 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                      >
                        <option value="">Selecione um modelo...</option>
                        {templatesProcessos.map(tpl => (
                          <option key={tpl.id} value={tpl.id}>{tpl.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-purple-400 uppercase mb-2">Título do Processo</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ex: Abertura de Filial SP..." 
                      value={formProcesso.titulo} 
                      onChange={e => setFormProcesso({...formProcesso, titulo: e.target.value})} 
                      className="w-full bg-[#0d1b2a] border border-purple-500/50 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  {/* CAMPOS FINANCEIROS */}
                  <div className="bg-[#0d1b2a] p-4 rounded-lg border border-[#d4af37]/30 space-y-4 shadow-inner">
                    <div>
                      <p className="text-[9px] text-zinc-500 mb-3">Estes valores ficarão ocultos para o cliente até o Passo 8 ser atingido.</p>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <label className="block text-[10px] font-bold text-[#d4af37] uppercase mb-1">Valor Total (R$)</label>
                          <input type="number" step="0.01" placeholder="1500.00" value={formProcesso.valor_honorarios} onChange={e => setFormProcesso({...formProcesso, valor_honorarios: e.target.value})} className="w-full bg-[#1b263b] border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-emerald-400 uppercase mb-1">Valor de Entrada (R$)</label>
                          <input type="number" step="0.01" placeholder="Ex: 500.00" value={formProcesso.valor_entrada} onChange={e => setFormProcesso({...formProcesso, valor_entrada: e.target.value})} className="w-full bg-[#1b263b] border border-emerald-500/50 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                        </div>
                      </div>
                      
                      {/* NOVO: CHECKBOX DE HONORÁRIOS PAGOS (APENAS ADMIN) */}
                      <div className="mt-3 flex items-center justify-between bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20">
                         <span className="text-[10px] font-bold text-emerald-400 uppercase">Honorários já foram pagos?</span>
                         <label className="flex items-center gap-2 cursor-pointer">
                           <span className={`text-[10px] font-bold ${formProcesso.honorario_pago ? 'text-emerald-400' : 'text-zinc-500'}`}>{formProcesso.honorario_pago ? 'Sim, recebido' : 'Não'}</span>
                           <input type="checkbox" checked={!!formProcesso.honorario_pago} onChange={e => setFormProcesso({...formProcesso, honorario_pago: e.target.checked})} className="accent-emerald-500 w-4 h-4 cursor-pointer" />
                         </label>
                      </div>
                    </div>
                    
                    <div className="space-y-3 border-t border-zinc-800 pt-3">
                      <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                        <label className="block text-[10px] font-bold text-[#d4af37] uppercase">Taxas do Processo</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${semTaxas ? 'text-purple-400' : 'text-zinc-500'}`}>Sem taxas</span>
                          <input type="checkbox" checked={semTaxas} onChange={e => {
                            setSemTaxas(e.target.checked);
                            if (e.target.checked) {
                              setTaxaNome(''); setTaxaValor(''); setTaxaBoleto(null); setIsPix(false); setChavePix('');
                            }
                          }} className="accent-purple-500 w-4 h-4 cursor-pointer" />
                        </label>
                      </div>
                      
                      {!semTaxas && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                          <div>
                            <label className="block text-[9px] text-zinc-400 uppercase mb-0.5">Nome da Taxa</label>
                            <input type="text" placeholder="Ex: DARE JUCESP" value={taxaNome} onChange={e => setTaxaNome(e.target.value)} className="w-full bg-[#1b263b] border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] text-zinc-400 uppercase mb-0.5">Valor da Taxa</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-xs text-zinc-500 font-bold">R$</span>
                                <input type="text" placeholder="150,00" value={taxaValor} onChange={e => setTaxaValor(e.target.value)} className="w-full bg-[#1b263b] border border-zinc-700 rounded pl-7 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]" />
                              </div>
                            </div>
                            <div className="flex items-end pb-1">
                              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 font-bold">
                                <input type="checkbox" checked={isPix} onChange={e => setIsPix(e.target.checked)} className="accent-[#d4af37] w-4 h-4 cursor-pointer" />
                                Pagamento via PIX
                              </label>
                            </div>
                          </div>

                          {isPix ? (
                            <div>
                              <label className="block text-[9px] text-emerald-400 font-bold uppercase mb-0.5">Chave PIX (Copia e Cola)</label>
                              <input type="text" placeholder="Cole a chave PIX aqui..." value={chavePix} onChange={e => setChavePix(e.target.value)} className="w-full bg-[#1b263b] border border-emerald-500/50 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[9px] text-zinc-400 uppercase mb-0.5">Anexar Guia/Boleto (PDF ou Imagem)</label>
                              <input type="file" accept="application/pdf,image/*,.csv,.xls,.xlsx" onChange={e => setTaxaBoleto(e.target.files[0])} className="text-[10px] text-zinc-400 bg-[#1b263b] border border-zinc-700 rounded p-1 w-full file:bg-zinc-800 file:text-white file:border-0 file:rounded cursor-pointer" />
                            </div>
                          )}
                          
                          <button type="button" onClick={handleAdicionarTaxa} disabled={subindoArquivo} className="w-full text-[10px] bg-zinc-800 hover:bg-zinc-700 text-[#d4af37] py-2 rounded font-bold uppercase tracking-wider transition border border-[#d4af37]/30">
                            + Adicionar à Lista de Taxas
                          </button>
                        </div>
                      )}
                    </div>

                    {!semTaxas && listaTaxas.length > 0 && (
                      <div className="space-y-2 mt-4 pt-3 border-t border-zinc-800">
                        <label className="block text-[10px] font-bold text-[#d4af37] uppercase">Taxas do Processo</label>
                        {listaTaxas.map(taxa => (
                          <div key={taxa.id} className={`p-2 rounded border flex justify-between items-center ${taxa.status === 'pago' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-800/50 border-zinc-700'}`}>
                            <div className="flex-1 min-w-0 pr-2">
                              <p className={`text-xs font-bold truncate ${taxa.status === 'pago' ? 'text-emerald-400' : 'text-zinc-200'}`}>{taxa.nome}</p>
                              <p className="text-[10px] text-zinc-400 font-mono">R$ {taxa.valor} {taxa.isPix ? '(PIX)' : '(Boleto)'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => toggleStatusTaxa(taxa.id)} className={`text-[10px] px-2 py-1 rounded font-bold transition ${taxa.status === 'pago' ? 'bg-emerald-500 text-black' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}>
                                {taxa.status === 'pago' ? 'Paga' : 'Pendente'}
                              </button>
                              <button type="button" onClick={() => removerTaxa(taxa.id)} className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded font-bold hover:bg-red-500 hover:text-white transition">X</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* LADO DIREITO: Fases do Processo (Só no Editar) */}
                {modalProcesso.tipo === 'editar' && (
                  <div className="bg-[#0d1b2a] p-4 rounded-lg border border-zinc-800/80 flex flex-col h-full">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-3">Selecione a fase atual:</label>
                    <div className="space-y-2 overflow-y-auto hide-scrollbar flex-1 pr-1" style={{ maxHeight: '380px' }}>
                      {(() => {
                        let passosModal = [];
                        try { passosModal = typeof modalProcesso.processo?.passos_snapshot === 'string' ? JSON.parse(modalProcesso.processo.passos_snapshot) : modalProcesso.processo?.passos_snapshot; } catch(e){}
                        if (!passosModal || !Array.isArray(passosModal) || passosModal.length === 0) passosModal = PASSOS_BACKUP;

                        return passosModal.map(passo => (
                          <label key={passo.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${formProcesso.passo === passo.id ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-[#1b263b] border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}>
                            <input type="radio" name="passo_proc" className="accent-purple-500 w-4 h-4 cursor-pointer" checked={formProcesso.passo === passo.id} onChange={() => setFormProcesso({...formProcesso, passo: passo.id})} />
                            <span className="text-sm font-bold">Passo {passo.id}: {passo.nome}</span>
                          </label>
                        ));
                      })()}
                    </div>
                  </div>
                )}

              </div>

              <div className="pt-5 mt-5 flex justify-end gap-3 border-t border-zinc-800">
                <button type="button" onClick={() => setModalProcesso({ aberto: false, tipo: 'novo', processo: null })} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindoArquivo} className="bg-purple-500 text-white hover:bg-purple-400 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50">
                  {subindoArquivo ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GERENCIAR TEMPLATES DE PROCESSO (ADMIN) */}
      {isInterno && modalGerenciarTemplates && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1b263b] border border-purple-500/50 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto hide-scrollbar flex flex-col shadow-2xl">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl sticky top-0 z-10">
              <h3 className="text-lg font-bold text-purple-400">Modelos / Templates de Processos</h3>
              <button onClick={() => setModalGerenciarTemplates(false)} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* LISTA DE TEMPLATES EXISTENTES */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Modelos Cadastrados</h4>
                <div className="space-y-3">
                  {templatesProcessos?.map(tpl => {
                    let pList = [];
                    try { pList = typeof tpl.passos === 'string' ? JSON.parse(tpl.passos) : tpl.passos; } catch(e){}
                    return (
                      <div key={tpl.id} className="p-4 bg-[#0d1b2a] border border-zinc-800 rounded-xl flex justify-between items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-white">{tpl.nome}</h5>
                            {tpl.is_padrao && <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-bold">Padrão</span>}
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">{Array.isArray(pList) ? pList.length : 0} etapas configuradas</p>
                        </div>
                        {!tpl.is_padrao && (
                          <button 
                            onClick={async () => {
                              if (!window.confirm(`Deseja mesmo excluir o template "${tpl.nome}"?`)) return;
                              const { error } = await supabase.from('templates_processos').delete().eq('id', tpl.id);
                              if (!error) {
                                mostrarToast('Template excluído!', 'sucesso');
                                await carregarDados();
                              } else mostrarToast('Erro ao excluir: ' + error.message, 'erro');
                            }} 
                            className="text-xs bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-3 py-1.5 rounded transition font-bold"
                          >
                            Excluir Template
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CRIAR NOVO TEMPLATE */}
              <div className="border-t border-zinc-800 pt-6">
                <h4 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-4">+ Criar Novo Modelo de Processo</h4>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!novoTemplateForm?.nome?.trim()) return mostrarToast('Preencha o nome do modelo.', 'erro');
                  if (novoTemplateForm?.passos?.some(p => !p.nome.trim())) return mostrarToast('Preencha o nome de todas as etapas.', 'erro');

                  setSubindoArquivo(true);
                  const { error } = await supabase.from('templates_processos').insert([{
                    nome: novoTemplateForm.nome.trim(),
                    passos: JSON.stringify(novoTemplateForm.passos),
                    is_padrao: false
                  }]);

                  if (!error) {
                    mostrarToast('Novo modelo criado com sucesso!', 'sucesso');
                    setNovoTemplateForm({ nome: '', passos: [{ id: 1, nome: '', desc: '' }, { id: 2, nome: '', desc: '' }] });
                    await carregarDados();
                  } else mostrarToast('Erro: ' + error.message, 'erro');
                  setSubindoArquivo(false);
                }} className="space-y-4 bg-[#0d1b2a] p-5 rounded-xl border border-zinc-800">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome do Modelo (Ex: Alvará de Funcionamento)</label>
                    <input 
                      type="text" 
                      required 
                      value={novoTemplateForm?.nome || ''} 
                      onChange={e => setNovoTemplateForm({...novoTemplateForm, nome: e.target.value})} 
                      placeholder="Nome do modelo..." 
                      className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" 
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-zinc-300">Etapas do Processo:</label>
                    {novoTemplateForm?.passos?.map((p, idx) => (
                      <div key={idx} className="p-3 bg-[#1b263b] border border-zinc-700 rounded-lg space-y-2 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-purple-400">Etapa {idx + 1}</span>
                          {novoTemplateForm.passos.length > 2 && (
                            <button 
                              type="button" 
                              onClick={() => {
                                const novosPassos = novoTemplateForm.passos.filter((_, i) => i !== idx).map((item, i) => ({ ...item, id: i + 1 }));
                                setNovoTemplateForm({ ...novoTemplateForm, passos: novosPassos });
                              }} 
                              className="text-[10px] text-red-400 hover:text-white font-bold"
                            >
                              Remover Etapa
                            </button>
                          )}
                        </div>
                        <input 
                          type="text" 
                          required 
                          placeholder="Nome da etapa (Ex: Protocolo na Prefeitura)" 
                          value={p.nome} 
                          onChange={e => {
                            const arr = [...novoTemplateForm.passos];
                            arr[idx].nome = e.target.value;
                            setNovoTemplateForm({...novoTemplateForm, passos: arr});
                          }} 
                          className="w-full bg-[#0d1b2a] border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500" 
                        />
                        <input 
                          type="text" 
                          placeholder="Descrição orientativa para o cliente..." 
                          value={p.desc} 
                          onChange={e => {
                            const arr = [...novoTemplateForm.passos];
                            arr[idx].desc = e.target.value;
                            setNovoTemplateForm({...novoTemplateForm, passos: arr});
                          }} 
                          className="w-full bg-[#0d1b2a] border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500" 
                        />
                      </div>
                    ))}

                    <button 
                      type="button" 
                      onClick={() => {
                        const proxId = novoTemplateForm.passos.length + 1;
                        setNovoTemplateForm({
                          ...novoTemplateForm,
                          passos: [...novoTemplateForm.passos, { id: proxId, nome: '', desc: '' }]
                        });
                      }} 
                      className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-purple-300 rounded-lg transition"
                    >
                      + Adicionar Outra Etapa
                    </button>
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                    <button type="submit" disabled={subindoArquivo} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition shadow-md">
                      {subindoArquivo ? 'Salvando...' : 'Salvar Modelo'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {isInterno && modalDocs && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1b263b] border border-purple-500/50 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto hide-scrollbar flex flex-col shadow-2xl">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl sticky top-0 z-10">
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

      {/* 🚨 MODAL DE SESSÃO EXPIRADA (BLOQUEIO TOTAL) */}
      {sessaoExpirada && (
        <div className="fixed inset-0 z-[999999999] bg-[#0d1b2a]/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1b263b] p-8 rounded-2xl border border-red-500/50 max-w-sm w-full shadow-[0_0_60px_rgba(239,68,68,0.2)] text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-5 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <svg className="w-8 h-8 text-red-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-white mb-2">Sessão Expirada</h3>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Por questões de segurança, o seu tempo de acesso esgotou. Por favor, faça login novamente para continuar.
            </p>
            <button 
              onClick={() => { localStorage.clear(); window.location.href = '/login'; }} 
              className="w-full bg-[#d4af37] text-[#0d1b2a] font-black py-3.5 rounded-xl hover:bg-yellow-500 transition shadow-lg uppercase tracking-wider"
            >
              Fazer Login Novamente
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE E-MAIL DO DOCUMENTO */}
      {modalEmailDoc.aberto && (
        <div className="fixed inset-0 bg-[#0d1b2a]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]">
          <div className="bg-[#1b263b] border border-purple-500/50 rounded-xl w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl">
              <h3 className="text-lg font-bold text-purple-400">Enviar por E-mail</h3>
              <button type="button" onClick={() => setModalEmailDoc({ aberto: false, arquivo: null, titulo: 'Novo Documento Disponível', mensagem: '' })} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={handleEnviarEmailDoc} className="p-5 space-y-4">
              <div className="bg-[#0d1b2a] p-3 rounded-lg border border-zinc-800 flex items-center gap-3">
                <span className="text-xs text-zinc-300 font-mono truncate">{modalEmailDoc.arquivo?.nome_original}</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Título do E-mail</label>
                <input type="text" required value={modalEmailDoc.titulo} onChange={e => setModalEmailDoc({...modalEmailDoc, titulo: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Mensagem (Opcional)</label>
                <textarea rows="4" placeholder="Escreva uma mensagem adicional..." value={modalEmailDoc.mensagem} onChange={e => setModalEmailDoc({...modalEmailDoc, mensagem: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"></textarea>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalEmailDoc({ aberto: false, arquivo: null, titulo: 'Novo Documento Disponível', mensagem: '' })} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindoArquivo} className="bg-purple-500 text-white hover:bg-purple-400 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-lg">
                  {subindoArquivo ? 'A enviar...' : 'Enviar E-mail'}
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