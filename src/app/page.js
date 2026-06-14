'use client';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase'; // Ajustado para a pasta real
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { enviarEmailDemanda } from './lib/email'; // Ajustado para a pasta real

// Dicionário rápido para mapear nome da equipe para e-mail
const OBTER_EMAIL_FUNCIONARIO = {
  'Victor (Admin)': 'victor@innovbusiness.com.br',
  'Maria (Societário)': 'societario@innovbusiness.com.br',
  'Helena (Societário e Suporte)': 'mensalistas@innovbusiness.com.br',
  'Luiza (Fiscal)': 'fiscal@innovbusiness.com.br',
  'Nogueira (Fiscal)': 'fiscal2@innovbusiness.com.br',
  'Vanessa (Contábil)': 'contabil@innovbusiness.com.br',
  'Karen (RH)': 'rh@innovbusiness.com.br',
  'Beatriz (Suporte)': 'suporte@innovbusiness.com.br',
  'Lucas (Financeiro)': 'lucas@innovbusiness.com.br'
};

// Funções de Criptografia Reversível com tolerância a senhas antigas
const encriptarSenha = (text) => {
  if (!text) return '';
  return btoa(text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join(''));
};

const decriptarSenha = (cipher) => {
  if (!cipher || cipher === 'Não Definida') return cipher;
  try {
    const decoded = atob(cipher);
    const plain = decoded.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join('');
    if (/[\x00-\x1F\x7F]/.test(plain)) return cipher; // Evita quebra se a senha antiga for texto puro
    return plain;
  } catch (e) {
    return cipher; // Retorna o texto puro caso seja um cliente antigo pré-criptografia
  }
};

const LISTA_COLABORADORES = [
  'Victor (Admin)',
  'Maria (Societário)',
  'Helena (Societário e Suporte)',
  'Luiza (Fiscal)',
  'Nogueira (Fiscal)',
  'Vanessa (Contábil)',
  'Karen (RH)',
  'Beatriz (Suporte)',
  'Lucas (Financeiro)'
];

// Componentes de Ícones Premium (SVG)
const IconUsers = () => <svg className="w-7 h-7 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const IconClock = () => <svg className="w-7 h-7 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconInbox = () => <svg className="w-7 h-7 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;
const IconChat = () => <svg className="w-7 h-7 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const IconBell = () => <svg className="w-7 h-7 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const IconLightning = () => <svg className="w-7 h-7 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const IconDocument = () => <svg className="w-5 h-5 text-[#0d1b2a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconMiniClock = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconCheck = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>;
const IconCompany = () => <svg className="w-4 h-4 text-[#d4af37] flex-shrink-0 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const IconChartMini = () => <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const IconMail = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const IconRepeat = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const IconGlobe = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
const IconAlert = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const IconCalendar = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconEye = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>;
const IconInboxMini = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;
const IconVerified = () => <svg className="w-4 h-4 text-blue-400 inline ml-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7l-3.61.81.34 3.68L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;

function formatarDataHora(dataString) {
  if (!dataString) return '';
  const data = new Date(dataString);
  
  // Força o fuso horário de São Paulo (Brasil) independentemente do PC
  const opcoesData = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' };
  const opcoesHora = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' };
  
  const dataFormatada = data.toLocaleDateString('pt-BR', opcoesData);
  const horaFormatada = data.toLocaleTimeString('pt-BR', opcoesHora).replace(':', 'h');
  
  return `${dataFormatada} às ${horaFormatada}`;
}

export default function AdminPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [recebidos, setRecebidos] = useState([]);
  const [demandas, setDemandas] = useState([]);
  const [pedidosCliente, setPedidosCliente] = useState([]);
  const [alertas, setAlertas] = useState([]);
  
  const [abaAtiva, setAbaAtiva] = useState('ativos');
  const [subAbaDemanda, setSubAbaDemanda] = useState('pendentes'); 
  const [subAbaAlerta, setSubAbaAlerta] = useState('historico_geral'); 
  
  // ESTADOS DE AGRUPAMENTO E MODAIS
  const [agruparPorEmpresa, setAgruparPorEmpresa] = useState(false);
  const [empresaExpandida, setEmpresaExpandida] = useState(null);
  const [automacaoExpandida, setAutomacaoExpandida] = useState(null);
  const [mostrarModalClientes, setMostrarModalClientes] = useState(false);

  const [previewCSV, setPreviewCSV] = useState(null);
  const [autenticando, setAutenticando] = useState(true);
  const [carregandoDados, setCarregandoDados] = useState(true); // <-- NOVA TRAVA INICIAL
  const [operador, setOperador] = useState('Administrador');
  const [subindo, setSubindo] = useState(false);

  const [formDemanda, setFormDemanda] = useState({
    descricao: '',
    atribuido_para: 'Victor (Admin)',
    data_entrega: '',
    prioridade: 'Média'
  });
  
  const [formAlerta, setFormAlerta] = useState({
    clientesSelecionados: [],
    tipo_documento: 'Extratos Bancários',
    titulo: '',
    mensagem: '',
    prazo: '',
    data_vencimento: '',
    repetir_mensalmente: false,
    dia_recorrencia: '',
    dia_vencimento: '',
    enviar_email: true,
    enviar_agora: true,
    data_envio_programado: '',
    exibir_prazo_email: true,
    exibir_vencimento_email: true
  });
  
  const [buscaAlertaInput, setBuscaAlertaInput] = useState('');
  const [mostrarAutoAlerta, setMostrarAutoAlerta] = useState(false);
  const [buscaAlerta, setBuscaAlerta] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  
  // ESTADO PARA O BALÃO DE COPIAR SENHA
  const [senhaCopiadaId, setSenhaCopiadaId] = useState(null);
  
  // ESTADO DOS LOGS DE AUDITORIA
  const [logs, setLogs] = useState([]);

  // SISTEMA DE TOASTS PREMIUM
  const [toasts, setToasts] = useState([]);
  function mostrarToast(mensagem, tipo = 'sucesso') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 4000);
  }

  // FUNÇÃO DE ROLAGEM SUAVE (Scroll Inteligente)
  function rolarPara(idElemento) {
    setTimeout(() => {
      const el = document.getElementById(idElemento);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  }

  // SISTEMA DE CONFIRMAÇÃO PREMIUM (Adeus confirm nativo)
  const [dialogo, setDialogo] = useState({ aberto: false, titulo: '', mensagem: '', acao: null, tipo: 'perigo' });
  function confirmarAcao(titulo, mensagem, acao, tipo = 'perigo') {
    setDialogo({ aberto: true, titulo, mensagem, acao, tipo });
  }

  useEffect(() => {
    const tipoUsuario = localStorage.getItem('usuario_tipo');
    const nomeUsuario = localStorage.getItem('usuario_nome');
    const idUsuario = localStorage.getItem('usuario_id');
    
    if (tipoUsuario === 'cliente' && idUsuario) {
      router.push(`/cliente/${idUsuario}`);
      return;
    } 
    
    // CÃO DE GUARDA: Só entra se for 'interno' E o nome constar na lista oficial da equipe
    const colaboradorValido = LISTA_COLABORADORES.includes(nomeUsuario);
    
    if (tipoUsuario !== 'interno' || !colaboradorValido) {
      localStorage.clear();
      router.push('/login');
    } else {
      if (nomeUsuario) setOperador(nomeUsuario);
      setAutenticando(false);
      carregarDados();
    }
  }, [router]);

  async function carregarDados() {
    // [ENGENHARIA DA LIXEIRA] Purga automática de registros com mais de 30 dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);
    const dataLimiteISO = dataLimite.toISOString();
    
    // 1. Busca quais são os arquivos físicos no Storage que já venceram
    const { data: arqVencidos } = await supabase.from('arquivos_portal').select('caminho_storage').lt('data_exclusao', dataLimiteISO);
    const { data: envVencidos } = await supabase.from('envios_cliente').select('caminho_storage').lt('data_exclusao', dataLimiteISO);
    
    let caminhosParaDeletar = [];
    if (arqVencidos) caminhosParaDeletar = [...caminhosParaDeletar, ...arqVencidos.map(a => a.caminho_storage)];
    if (envVencidos) caminhosParaDeletar = [...caminhosParaDeletar, ...envVencidos.map(a => a.caminho_storage)];
    
    // 2. Apaga o PDF/Imagem real do HD do servidor (Evita custo fantasma)
    if (caminhosParaDeletar.length > 0) {
      await supabase.storage.from('documentos').remove(caminhosParaDeletar);
    }

    // 3. Finalmente, limpa os registros textuais do banco de dados
    await supabase.from('arquivos_portal').delete().lt('data_exclusao', dataLimiteISO);
    await supabase.from('envios_cliente').delete().lt('data_exclusao', dataLimiteISO);

    // Carrega os logs de auditoria mais recentes (limite de 100 ações)
    const resLogs = await supabase.from('logs_auditoria').select('*').order('criado_em', { ascending: false }).limit(100);
    if (resLogs.data) setLogs(resLogs.data);

    const resAtivos = await supabase.from('clientes').select('*').order('nome_empresa');
    if (resAtivos.data) setClientes(resAtivos.data);

    const resPendentes = await supabase.from('solicitacoes_cadastro').select('*').order('criado_em');
    if (resPendentes.data) setPendentes(resPendentes.data);

    const resRecebidos = await supabase
      .from('envios_cliente')
      .select('*, clientes(nome_empresa)')
      .eq('status', 'pendente')
      .order('criado_em', { ascending: false });
    if (resRecebidos.data) setRecebidos(resRecebidos.data);

    const resPedidos = await supabase
      .from('pedidos_cliente')
      .select('*, clientes(nome_empresa)')
      .eq('status', 'pendente')
      .order('criado_em', { ascending: false });
    if (resPedidos.data) setPedidosCliente(resPedidos.data);

    const resDemandas = await supabase
      .from('demandas_equipe')
      .select('*')
      .order('criado_em', { ascending: false });
    if (resDemandas.data) setDemandas(resDemandas.data);

    const resAlertas = await supabase
      .from('alertas_clientes').select('*, clientes(nome_empresa, regime_tributario)')
      .order('criado_em', { ascending: false });
    if (resAlertas.data) setAlertas(resAlertas.data);
    
    setCarregandoDados(false); // <-- DESLIGA O SKELETON QUANDO TUDO CHEGAR!
  }

  function handleLogout() {
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('usuario_tipo');
    localStorage.removeItem('usuario_id');
    router.push('/login');
  }

  // ===============================================
  // FUNÇÕES DE SELEÇÃO EM MASSA (NOVO SISTEMA)
  // ===============================================
  function handleSelecionarMassa(tipo) {
    let selecionados = [];
    if (tipo === 'todos') selecionados = [...clientes];
    else if (tipo) selecionados = clientes.filter(c => c.regime_tributario === tipo);
    setFormAlerta({ ...formAlerta, clientesSelecionados: selecionados });
  }

  function toggleClienteSelecao(cli) {
    const existe = formAlerta.clientesSelecionados.find(c => c.id === cli.id);
    if (existe) {
      setFormAlerta({ ...formAlerta, clientesSelecionados: formAlerta.clientesSelecionados.filter(c => c.id !== cli.id) });
    } else {
      setFormAlerta({ ...formAlerta, clientesSelecionados: [...formAlerta.clientesSelecionados, cli] });
    }
  }

  function adicionarClienteAlerta(cliente) {
    if (!formAlerta.clientesSelecionados.find(c => c.id === cliente.id)) {
      setFormAlerta({ ...formAlerta, clientesSelecionados: [...formAlerta.clientesSelecionados, cliente] });
    }
    setBuscaAlertaInput('');
    setMostrarAutoAlerta(false);
  }

  function removerClienteAlerta(id) {
    setFormAlerta({ ...formAlerta, clientesSelecionados: formAlerta.clientesSelecionados.filter(c => c.id !== id) });
  }

  function preencherCopiaAlerta(alerta) {
    setFormAlerta({
      clientesSelecionados: alerta.clientes ? [{
        id: alerta.cliente_id,
        nome_empresa: alerta.clientes.nome_empresa,
        regime_tributario: alerta.clientes.regime_tributario
      }] : [],
      tipo_documento: alerta.tipo_documento || 'Outros',
      titulo: alerta.titulo,
      mensagem: alerta.mensagem || '',
      prazo: '', 
      data_vencimento: '',
      repetir_mensalmente: alerta.repetir_mensalmente || false,
      dia_recorrencia: alerta.dia_recorrencia || '',
      dia_vencimento: alerta.dia_vencimento || '',
      enviar_email: alerta.enviado_email !== false,
      enviar_agora: true,
      data_envio_programado: '',
      exibir_prazo_email: true,
      exibir_vencimento_email: true
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleCriarAlerta(e) {
    e.preventDefault();
    if (!formAlerta.titulo) return mostrarToast('O Título é obrigatório.', 'erro'); 

    if (!formAlerta.repetir_mensalmente && !formAlerta.prazo) return mostrarToast('O Prazo p/ Confirmação é obrigatório para cobranças pontuais.', 'erro'); 

    if (formAlerta.repetir_mensalmente && !formAlerta.dia_recorrencia) return mostrarToast('Por favor, informe em que DIA DO MÊS a automação deve enviar o alerta.', 'erro');
    
    if (formAlerta.enviar_email && !formAlerta.repetir_mensalmente && !formAlerta.enviar_agora && !formAlerta.data_envio_programado) {
      return mostrarToast('Se optou por não enviar agora, informe a data em que o e-mail deve ser disparado.', 'erro');
    }

    const clientesAlvo = formAlerta.clientesSelecionados;
    if (clientesAlvo.length === 0) return mostrarToast('Nenhum cliente selecionado para o disparo.', 'erro');

    setSubindo(true);
    
    const isRecorrente = formAlerta.repetir_mensalmente;
    const isAgendadoFuturo = !isRecorrente && formAlerta.enviar_email && !formAlerta.enviar_agora;
    const novoStatus = isRecorrente ? 'recorrente' : (isAgendadoFuturo ? 'programado' : 'pendente');

    const disparos = clientesAlvo.map(c => ({
      cliente_id: c.id,
      tipo_documento: formAlerta.tipo_documento,
      titulo: formAlerta.titulo,
      mensagem: formAlerta.mensagem,
      prazo: isRecorrente ? null : formAlerta.prazo,
      data_vencimento: isRecorrente ? null : (formAlerta.data_vencimento || null),
      repetir_mensalmente: formAlerta.repetir_mensalmente,
      dia_recorrencia: isRecorrente && formAlerta.dia_recorrencia ? parseInt(formAlerta.dia_recorrencia) : null,
      dia_vencimento: isRecorrente && formAlerta.dia_vencimento ? parseInt(formAlerta.dia_vencimento) : null,
      enviado_email: formAlerta.enviar_email,
      data_envio_programado: isAgendadoFuturo ? formAlerta.data_envio_programado : null,
      status: novoStatus
    }));
    
    const { error } = await supabase.from('alertas_clientes').insert(disparos);

    if (!error) {
      let deveEnviarAgora = false;
      
      if (formAlerta.enviar_email) {
        if (!isRecorrente && formAlerta.enviar_agora) {
          deveEnviarAgora = true;
        } else if (isRecorrente) {
          const hojeDia = new Date().getDate();
          if (parseInt(formAlerta.dia_recorrencia) === hojeDia) deveEnviarAgora = true;
        }
      }

      if (deveEnviarAgora) {
        const urlGoogle = "https://script.google.com/macros/s/AKfycbxEchPoftP-NOxqzmah4rV0RCAPDYfmaSZwL7jaGcu2ApI42YRW8pzKACtg7sMk4kCz/exec";
        
        let prazoTextoFinal = "";
        let vencimentoTextoFinal = "";

        if (!isRecorrente) {
          prazoTextoFinal = formAlerta.prazo;
          vencimentoTextoFinal = formAlerta.data_vencimento;
        } else {
          if (formAlerta.dia_recorrencia) prazoTextoFinal = `Todo dia ${formAlerta.dia_recorrencia}`;
          if (formAlerta.dia_vencimento) vencimentoTextoFinal = `Todo dia ${formAlerta.dia_vencimento}`;
        }

        for (const cli of clientesAlvo) {
          if (cli.email && cli.email.trim() !== '') {
            try {
              await fetch(urlGoogle, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({
                  cliente_nome: cli.nome_empresa,
                  cliente_email: cli.email,
                  titulo: formAlerta.titulo,
                  mensagem: formAlerta.mensagem,
                  tipo_documento: formAlerta.tipo_documento,
                  exibir_prazo_email: formAlerta.exibir_prazo_email,
                  exibir_vencimento_email: formAlerta.exibir_vencimento_email,
                  prazo_texto: prazoTextoFinal,
                  vencimento_texto: vencimentoTextoFinal
                })
              });
            } catch (err) {
              console.error("Erro ao notificar webhook:", err);
            }
          }
        }
        mostrarToast(`Criado! E-mails disparados para ${clientesAlvo.length} empresa(s).`, 'sucesso');
      } else if (isAgendadoFuturo) {
        mostrarToast(`Agendada para disparo futuro!`, 'sucesso');
      } else if (isRecorrente) {
        mostrarToast(`Automação Mensal Salva!`, 'sucesso');
      } else {
        mostrarToast(`Cobrança publicada APENAS no portal (Sem e-mail).`, 'aviso');
      }

      setFormAlerta({ clientesSelecionados: [], tipo_documento: 'Extratos Bancários', titulo: '', mensagem: '', prazo: '', data_vencimento: '', repetir_mensalmente: false, dia_recorrencia: '', dia_vencimento: '', enviar_email: true, enviar_agora: true, data_envio_programado: '', exibir_prazo_email: true, exibir_vencimento_email: true });
      carregarDados();
    } else {
      mostrarToast('Erro ao criar cobrança no sistema: ' + error.message, 'erro');
    }
    setSubindo(false);
  }

  function deletarAlerta(id) {
    confirmarAcao('Excluir Cobrança', 'Tem certeza que deseja excluir esta cobrança permanentemente?', async () => {
      setSubindo(true);
      const { error } = await supabase.from('alertas_clientes').delete().eq('id', id);
      if (!error) await carregarDados();
      setSubindo(false);
    });
  }

  function atenderPedidoCliente(id) {
    confirmarAcao('Marcar como Atendida', 'Deseja marcar esta solicitação do cliente como atendida?', async () => {
      setSubindo(true);
      const { error } = await supabase.from('pedidos_cliente').update({ status: 'atendido' }).eq('id', id);
      if (!error) await carregarDados();
      setSubindo(false);
    }, 'sucesso');
  }

  async function handleCriarDemanda(e) {
    e.preventDefault();
    if (!formDemanda.descricao.trim() || !formDemanda.data_entrega) return;
    setSubindo(true);
    
    const { error } = await supabase.from('demandas_equipe').insert([{
      criado_por: operador, 
      atribuido_para: formDemanda.atribuido_para, 
      descricao: formDemanda.descricao.trim(), 
      data_entrega: formDemanda.data_entrega, 
      prioridade: formDemanda.prioridade, 
      status: 'pendente'
    }]);
    
    if (!error) { 
      const emailDestino = OBTER_EMAIL_FUNCIONARIO[formDemanda.atribuido_para];
      
      if (emailDestino) {
        enviarEmailDemanda({
          to: emailDestino,
          nomeDestinatario: formDemanda.atribuido_para,
          nomeRemetente: operador, 
          tituloDemanda: `Nova Tarefa - Prioridade ${formDemanda.prioridade}`,
          descricao: formDemanda.descricao.trim(),
          prazo: new Date(formDemanda.data_entrega).toLocaleDateString('pt-BR', {timeZone: 'UTC'})
        }).catch(err => console.error("Falha no disparo automágico:", err));
      }

      setFormDemanda({ descricao: '', atribuido_para: 'Victor (Admin)', data_entrega: '', prioridade: 'Média' }); 
      await carregarDados(); 
    }
    setSubindo(false);
  }

  async function concluirDemanda(id) {
    setSubindo(true);
    const { error } = await supabase.from('demandas_equipe').update({ status: 'concluído' }).eq('id', id);
    if (!error) await carregarDados();
    setSubindo(false);
  }

  function deletarDemanda(id) {
    confirmarAcao('Excluir Tarefa', 'Tem certeza que deseja apagar esta demanda da lista?', async () => {
      setSubindo(true);
      const { error } = await supabase.from('demandas_equipe').delete().eq('id', id);
      if (!error) await carregarDados();
      setSubindo(false);
    });
  }

  function calcularPrazo(dataString) {
    if (!dataString) return { texto: 'Sem prazo limite', cor: 'text-zinc-500' };
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const [ano, mes, dia] = dataString.split('-');
    const entrega = new Date(ano, mes - 1, dia);
    entrega.setHours(0, 0, 0, 0);

    const diffTempo = entrega.getTime() - hoje.getTime();
    const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return { texto: `Atrasado há ${Math.abs(diffDias)} dias`, cor: 'text-red-500 font-extrabold animate-pulse' };
    if (diffDias === 0) return { texto: 'Prazo encerra hoje', cor: 'text-orange-500 font-bold' };
    if (diffDias === 1) return { texto: 'Prazo encerra amanhã', cor: 'text-amber-400 font-semibold' };
    return { texto: `Termina em ${diffDias} dias`, cor: 'text-emerald-400 font-medium' };
  }

  function aceitarEMoverParaHistorico(doc) {
    confirmarAcao('Mover Documento', 'Deseja mover este documento para o histórico?', async () => {
      setSubindo(true);
      const { error } = await supabase.from('envios_cliente').update({ status: 'historico' }).eq('id', doc.id);
      if (!error) await carregarDados(); 
      setSubindo(false);
    }, 'sucesso');
  }

  function rejeitarEDeletar(doc) {
    confirmarAcao('Apagar Documento', 'Tem certeza que deseja apagar permanentemente este documento?', async () => {
      setSubindo(true);
      await supabase.storage.from('documentos').remove([doc.caminho_storage]);
      await supabase.from('envios_cliente').delete().eq('id', doc.id);
      await carregarDados();
      setSubindo(false);
    });
  }

  function baixarDocumento(caminho) {
    const { data } = supabase.storage.from('documentos').getPublicUrl(caminho);
    window.open(data.publicUrl, '_blank');
  }

  function handleUploadCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
      const lines = event.target.result.split('\n');
      const resultado = [];
      for(let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const colunas = lines[i].split(',');
        if (colunas.length >= 2) {
          resultado.push({ nome_empresa: colunas[0]?.trim(), cnpj: colunas[1]?.trim(), nome_contato: colunas[2]?.trim() || '', email: colunas[3]?.trim() || '', celular: colunas[4]?.trim() || '', regime_tributario: colunas[5]?.trim() || 'Simples Nacional' });
        }
      }
      setPreviewCSV(resultado);
    };
    reader.readAsText(file, 'UTF-8');
  }

  async function salvarClientesCSV() {
    if (!previewCSV) return;
    setSubindo(true);
    for (const cli of previewCSV) { await supabase.from('clientes').insert([cli]); }
    setPreviewCSV(null); 
    await carregarDados();
    setSubindo(false);
  }

  async function aprovarCliente(solicitacao) {
    setSubindo(true);
    const senhaGerada = solicitacao.cnpj.replace(/\D/g, '').substring(0, 6);
    const { error } = await supabase.from('clientes').insert([{ 
      nome_empresa: solicitacao.nome_empresa, 
      cnpj: solicitacao.cnpj, 
      nome_contato: solicitacao.nome_contato, 
      email: solicitacao.email, 
      celular: solicitacao.celular, 
      regime_tributario: solicitacao.regime_tributario, 
      senha: encriptarSenha(senhaGerada), 
      senha_alterada: false 
    }]);
    if (!error) { 
      await supabase.from('logs_auditoria').insert([{
        usuario_nome: operador,
        usuario_tipo: 'interno',
        acao: 'CADASTRO_APROVADO',
        detalhe: `Aprovou o acesso da empresa ${solicitacao.nome_empresa} (CNPJ: ${solicitacao.cnpj})`
      }]);
      await supabase.from('solicitacoes_cadastro').delete().eq('id', solicitacao.id); 
      await carregarDados(); 
    }
    setSubindo(false);
  }

  function rejeitarSolicitacao(id) {
    confirmarAcao('Recusar Solicitação', 'Deseja realmente recusar e apagar esta solicitação de cadastro?', async () => {
      setSubindo(true);
      const { error } = await supabase.from('solicitacoes_cadastro').delete().eq('id', id);
      if (!error) await carregarDados();
      setSubindo(false);
    });
  }

  function deletarCliente(id) {
    confirmarAcao('Excluir Cliente', 'Essa ação é IRREVERSÍVEL. Todos os dados desta empresa serão apagados.', async () => {
      setSubindo(true);
      await supabase.from('clientes').delete().eq('id', id); 
      await carregarDados(); 
      setSubindo(false);
    });
  }

  const eGestor = operador === 'Victor (Admin)' || operador === 'Lucas (Financeiro)';
  const demandasVisiveis = demandas.filter(d => eGestor || d.atribuido_para === operador || d.criado_por === operador);
  const demandasMinhasPendentes = demandasVisiveis.filter(d => d.atribuido_para === operador && d.status === 'pendente').length;
  const alertasPendentes = alertas.filter(a => a.status === 'pendente').length;
  
  const demandasPendentesAgrupadas = LISTA_COLABORADORES.map(colab => {
    return { nome: colab, tarefas: demandasVisiveis.filter(d => d.status === 'pendente' && d.atribuido_para === colab) }
  }).filter(g => g.tarefas.length > 0);

  const demandasConcluidas = demandasVisiveis.filter(d => d.status === 'concluído');

  const alertasFiltradosGerais = alertas.filter(a => {
    const termo = buscaAlerta.toLowerCase();
    const nomeEmpresa = a.clientes?.nome_empresa?.toLowerCase() || '';
    const tituloAlerta = a.titulo?.toLowerCase() || '';
    return nomeEmpresa.includes(termo) || tituloAlerta.includes(termo);
  });

  const alertasHistoricoGeral = alertasFiltradosGerais.filter(a => a.status !== 'recorrente' && a.status !== 'programado');
  const alertasAgendados = alertasFiltradosGerais.filter(a => a.status === 'programado');
  const alertasRecorrentes = alertasFiltradosGerais.filter(a => a.status === 'recorrente');
  const alertasAtrasados = alertasHistoricoGeral.filter(a => {
    if (a.status === 'respondido') return false;
    if (!a.prazo) return false;
    const calc = calcularPrazo(a.prazo);
    return calc.texto.includes('Atrasado');
  });

  const clientesFiltrados = clientes.filter(c => {
    const termo = buscaCliente.toLowerCase();
    return c.nome_empresa?.toLowerCase().includes(termo) || c.cnpj?.includes(termo) || c.email?.toLowerCase().includes(termo);
  });

  const clientesParaAlerta = clientes.filter(c =>
    c.nome_empresa.toLowerCase().includes(buscaAlertaInput.toLowerCase()) &&
    !formAlerta.clientesSelecionados.find(sel => sel.id === c.id)
  );

  // FUNÇÃO DE RENDERIZAÇÃO INTELIGENTE (Agrupada ou Lista Solta)
  const renderLista = (lista, renderCard) => {
    if (lista.length === 0) return <p className="text-zinc-500 text-center py-8">Nenhum registo encontrado.</p>;

    if (agruparPorEmpresa) {
      const agrupado = {};
      lista.forEach(a => {
        const n = a.clientes?.nome_empresa || 'Empresa Desconhecida';
        if (!agrupado[n]) agrupado[n] = [];
        agrupado[n].push(a);
      });

      return (
        <div className="divide-y divide-zinc-800/50">
          {Object.keys(agrupado).sort().map(empresa => (
            <div key={empresa} className="flex flex-col">
              <button onClick={() => setEmpresaExpandida(empresaExpandida === empresa ? null : empresa)} className="w-full flex items-center justify-between p-4 bg-[#1b263b] hover:bg-zinc-800/50 transition focus:outline-none">
                <div className="flex items-center gap-3">
                  <IconCompany />
                  <span className="font-bold text-white text-sm">{empresa}</span>
                  <span className="text-[10px] bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-full border border-[#d4af37]/30">{agrupado[empresa].length} registo(s)</span>
                </div>
                <span className="text-zinc-500 text-xs font-bold">{empresaExpandida === empresa ? 'Ocultar ▲' : 'Ver Histórico ▼'}</span>
              </button>
              {empresaExpandida === empresa && (
                <div className="p-4 bg-[#0d1b2a]/60 border-t border-zinc-800/50 space-y-3">
                  {agrupado[empresa].map(alerta => renderCard(alerta))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    return <div className="divide-y divide-zinc-800">{lista.map(alerta => renderCard(alerta))}</div>;
  };

  if (autenticando || carregandoDados) {
    return (
      <div className="min-h-screen bg-[#0d1b2a] flex flex-col pointer-events-none animate-in fade-in duration-500 relative overflow-hidden">
        
        {/* Header Falso com a Logomarca (Para não parecer que a tela quebrou) */}
        <div className="p-6 md:p-12 pb-0 z-10">
          <div className="flex justify-between items-center bg-[#1b263b]/20 p-4 rounded-xl border border-zinc-800/40 shadow-sm">
            <img src="/logo.png" alt="Logo" className="w-32 h-auto opacity-40 animate-pulse" />
            <div className="hidden sm:flex gap-4">
              <div className="w-24 h-8 bg-zinc-800/50 rounded-lg animate-pulse"></div>
              <div className="w-16 h-8 bg-red-500/10 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Centro da Tela: Loader claro e elegante */}
        <div className="flex-1 flex flex-col items-center justify-center pb-20 z-10">
          <div className="w-14 h-14 border-4 border-zinc-800 border-t-[#d4af37] rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.2)] mb-6"></div>
          <p className="text-[#d4af37] font-bold tracking-widest uppercase text-sm animate-pulse drop-shadow-md">Sincronizando dados...</p>
          <p className="text-zinc-500 text-xs mt-2 font-medium">Preparando o painel de controle</p>
        </div>

        {/* Skeleton Fantasma na Base (Apenas para dar volume à tela) */}
        <div className="px-6 md:px-12 pb-6 w-full absolute bottom-0 opacity-20">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 animate-pulse">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-[#1b263b] rounded-t-xl border-t border-zinc-700"></div>)}
          </div>
        </div>
        
      </div>
    );
  }

   
          MODAL DE EDIÇÃO DA LISTA DE CLIENTES SELECIONADOS
      ======================================================= */}
      {mostrarModalClientes && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1b263b] border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-[#0d1b2a] rounded-t-xl">
              <h3 className="text-lg font-bold text-[#d4af37]">Empresas Selecionadas ({formAlerta.clientesSelecionados.length})</h3>
              <button onClick={() => setMostrarModalClientes(false)} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto hide-scrollbar space-y-2">
              <p className="text-xs text-zinc-400 mb-3 px-1">Marque ou desmarque os clientes para ajustar a lista de envios em massa.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {clientes.map(cli => {
                  const isSelected = !!formAlerta.clientesSelecionados.find(c => c.id === cli.id);
                  return (
                    <label key={cli.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${isSelected ? 'bg-[#d4af37]/10 border-[#d4af37]/50' : 'bg-[#0d1b2a] border-zinc-800 hover:border-zinc-700'}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleClienteSelecao(cli)} className="accent-[#d4af37] w-4 h-4" />
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-[#d4af37]' : 'text-zinc-300'}`}>{cli.nome_empresa}</span>
                        <span className="text-[10px] text-zinc-500 truncate">CNPJ: {cli.cnpj}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-zinc-800 bg-[#0d1b2a] rounded-b-xl flex justify-end">
              <button onClick={() => setMostrarModalClientes(false)} className="bg-[#d4af37] text-[#0d1b2a] font-bold px-8 py-2.5 rounded-lg text-sm hover:bg-yellow-500 transition shadow-lg">Confirmar Seleção</button>
            </div>
          </div>
        </div>
      )}


      <div className="max-w-6xl mx-auto">
        
        {/* BARRA SUPERIOR COMPACTA COM LOGO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 bg-[#1b263b]/30 p-4 rounded-xl border border-zinc-800/60 gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-32 h-auto object-contain drop-shadow-md" />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            <button onClick={() => { setAbaAtiva('senhas'); rolarPara('conteudo-admin'); }} className={`flex-1 sm:flex-none justify-center text-xs px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg transition-all font-bold border flex items-center gap-1 ${abaAtiva === 'senhas' ? 'bg-[#d4af37] text-[#0d1b2a] border-[#d4af37]' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}>Senhas</button>
            <button onClick={() => { setAbaAtiva('auditoria'); rolarPara('conteudo-admin'); }} className={`flex-1 sm:flex-none justify-center text-xs px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg transition-all font-bold border flex items-center gap-1 ${abaAtiva === 'auditoria' ? 'bg-[#d4af37] text-[#0d1b2a] border-[#d4af37]' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}>Auditoria</button>
            <span className="text-sm text-zinc-400 hidden lg:inline">
              Conectado como: <strong className="text-[#d4af37] font-semibold">{operador}</strong>
            </span>
            <button onClick={handleLogout} className="flex-1 sm:flex-none justify-center text-xs bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg transition-all font-bold">Sair</button>
          </div>
        </div>

        {/* MODAL DE PRÉ-VISUALIZAÇÃO DE CSV */}
        {previewCSV && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1b263b] border border-zinc-800 p-6 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-[#d4af37] mb-2">Confirmar Importação de Clientes</h2>
              <table className="w-full text-left text-xs mb-6 border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase">
                    <th className="pb-2">Empresa</th><th className="pb-2">CNPJ</th><th className="pb-2">E-mail</th><th className="pb-2">Regime</th>
                  </tr>
                </thead>
                <tbody>
                  {previewCSV.map((c, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 text-zinc-200">
                      <td className="py-2 font-medium">{c.nome_empresa}</td><td className="py-2">{c.cnpj}</td><td className="py-2">{c.email}</td><td className="py-2 text-[#d4af37]">{c.regime_tributario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end gap-3">
                <button onClick={() => setPreviewCSV(null)} className="px-4 py-2 bg-zinc-800 rounded font-bold text-sm">Cancelar</button>
                <button onClick={() => salvarClientesCSV()} className="px-5 py-2 bg-[#d4af37] text-[#0d1b2a] rounded font-bold text-sm hover:bg-yellow-500">Salvar Tudo ({previewCSV.length} empresas)</button>
              </div>
            </div>
          </div>
        )}

        {/* GRADE DE CARDS DO DASHBOARD */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
          <button onClick={() => { setAbaAtiva('ativos'); rolarPara('conteudo-admin'); }} className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 shadow-xl ${abaAtiva === 'ativos' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800/80 hover:border-zinc-700'}`}>
            <div className="flex justify-between w-full items-start">
              <IconUsers />
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${abaAtiva === 'ativos' ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-[#0d1b2a] text-zinc-400'}`}>{clientes.length}</span>
            </div>
            <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Clientes Ativos</h3></div>
          </button>

          <button onClick={() => { setAbaAtiva('pendentes'); rolarPara('conteudo-admin'); }} className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 shadow-xl ${abaAtiva === 'pendentes' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800/80 hover:border-zinc-700'}`}>
            <div className="flex justify-between w-full items-start">
              <IconClock />
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold transition-all ${pendentes.length > 0 ? 'bg-zinc-500 text-white shadow-[0_0_12px_rgba(113,113,122,0.8)] animate-pulse' : 'bg-[#0d1b2a] text-zinc-500'}`}>{pendentes.length}</span>
            </div>
            <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Cadastros Pendentes</h3></div>
          </button>

          <button onClick={() => { setAbaAtiva('recebidos'); rolarPara('conteudo-admin'); }} className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 shadow-xl ${abaAtiva === 'recebidos' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800/80 hover:border-zinc-700'}`}>
            <div className="flex justify-between w-full items-start">
              <IconInbox />
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold transition-all ${recebidos.length > 0 ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse' : 'bg-[#0d1b2a] text-zinc-500'}`}>{recebidos.length}</span>
            </div>
            <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Docs Recebidos</h3></div>
          </button>

          <button onClick={() => { setAbaAtiva('solicitacoes'); rolarPara('conteudo-admin'); }} className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 shadow-xl ${abaAtiva === 'solicitacoes' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800/80 hover:border-zinc-700'}`}>
            <div className="flex justify-between w-full items-start">
              <IconChat />
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold transition-all ${pedidosCliente.length > 0 ? 'bg-[#d4af37] text-[#0d1b2a] shadow-[0_0_12px_rgba(212,175,55,0.8)] animate-pulse' : 'bg-[#0d1b2a] text-zinc-500'}`}>{pedidosCliente.length}</span>
            </div>
            <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Solicitações</h3></div>
          </button>
          
          <button onClick={() => { setAbaAtiva('alertas'); rolarPara('conteudo-admin'); }} className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 shadow-xl ${abaAtiva === 'alertas' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800/80 hover:border-zinc-700'}`}>
            <div className="flex justify-between w-full items-start">
              <IconBell />
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold transition-all ${alertasPendentes > 0 ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.8)] animate-pulse' : 'bg-[#0d1b2a] text-zinc-500'}`}>{alertasPendentes}</span>
            </div>
            <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Cobranças</h3></div>
          </button>

          <button onClick={() => { setAbaAtiva('demandas'); rolarPara('conteudo-admin'); }} className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 shadow-xl ${abaAtiva === 'demandas' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800/80 hover:border-zinc-700'}`}>
            <div className="flex justify-between w-full items-start">
              <IconLightning />
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold transition-all ${demandasMinhasPendentes > 0 ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-[#0d1b2a] text-zinc-500'}`}>{demandasMinhasPendentes}</span>
            </div>
            <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Demandas</h3></div>
          </button>
        </div>

        <div id="conteudo-admin"></div> {/* Âncora Invisível para Rolagem */}
        {abaAtiva === 'senhas' && (
          <div className="bg-[#1b263b] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
            <div className="bg-[#0d1b2a] p-5 border-b border-zinc-800 flex justify-between items-center gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-[#d4af37]">Central de Acessos e Senhas</h2>
                <p className="text-xs text-zinc-400">Consulte se o cliente alterou a senha inicial de 6 dígitos.</p>
              </div>
              <input type="text" placeholder="Procurar empresa ou CNPJ..." value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} className="w-full sm:w-64 bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
            </div>
            <div className="divide-y divide-zinc-800">
              {clientesFiltrados.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Nenhum cliente encontrado.</p>
              ) : (
                clientesFiltrados.map(cli => (
                  <div key={cli.id} className="p-5 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-zinc-800/20 transition">
                    <div className="flex-1 w-full">
                      <h3 className="font-bold text-white text-sm">{cli.nome_empresa}</h3>
                      <p className="text-xs text-zinc-400">CNPJ: {cli.cnpj} | Contato: {cli.nome_contato}</p>
                    </div>
                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 min-w-[200px] bg-[#0d1b2a] p-3 rounded-lg border border-zinc-800/50">
                      <span className="text-xs font-bold text-zinc-500 uppercase">Senha Atual:</span>
                      <div className="relative flex items-center">
                        <span 
                          onClick={() => {
                            // Descriptografa antes de mandar para a área de transferência
                            const senhaBruta = cli.senha || (cli.cnpj ? cli.cnpj.replace(/\D/g, '').substring(0, 6) : '');
                            const senhaCopiada = decriptarSenha(senhaBruta);
                            if (senhaCopiada && senhaCopiada !== 'Não Definida') {
                              navigator.clipboard.writeText(senhaCopiada);
                              setSenhaCopiadaId(cli.id); 
                              setTimeout(() => setSenhaCopiadaId(null), 2000); 
                            }
                          }}
                          title="Clique para copiar"
                          className={`cursor-pointer hover:scale-105 active:scale-95 font-mono font-bold tracking-widest text-sm px-2 py-1 rounded transition-all shadow-sm ${cli.senha_alterada ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30' : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'}`}
                        >
                          {/* Exibe decriptada na tela do Admin */}
                          {decriptarSenha(cli.senha || (cli.cnpj ? cli.cnpj.replace(/\D/g, '').substring(0, 6) : 'Não Definida'))}
                        </span>
                        
                        {/* BALÃO FLUTUANTE DE SUCESSO */}
                        {senhaCopiadaId === cli.id && (
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-emerald-500 text-[#0d1b2a] text-[10px] font-extrabold px-2.5 py-1 rounded shadow-[0_0_10px_rgba(16,185,129,0.5)] pointer-events-none whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                            Copiada! ✓
                            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-emerald-500"></span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            ABA NOVA: VISUALIZADOR DE LOGS DE AUDITORIA
        ========================================== */}
        {abaAtiva === 'auditoria' && (
          <div className="bg-[#1b263b] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl mb-6">
            <div className="bg-[#0d1b2a] p-5 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-[#d4af37]">Logs de Auditoria do Sistema</h2>
              <p className="text-xs text-zinc-400">Linha do tempo em tempo real com todas as ações realizadas por funcionários e clientes.</p>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3 hide-scrollbar">
              {logs.length === 0 ? (
                <p className="text-zinc-500 text-center py-6">Nenhum evento registado no sistema.</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-3 bg-[#0d1b2a]/60 rounded-lg border border-zinc-800/80 flex justify-between items-start sm:items-center gap-4 text-xs hover:border-zinc-700 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.usuario_tipo === 'interno' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                          {log.usuario_nome}
                        </span>
                        <span className="text-zinc-500 font-mono text-[10px] uppercase">[{log.acao}]</span>
                      </div>
                      <p className="text-zinc-300 font-medium">{log.detalhe}</p>
                    </div>
                    <span className="text-zinc-500 text-[10px] font-semibold whitespace-nowrap">
                      {new Date(log.criado_em).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =======================================================
            CONTEÚDO DAS ABAS
        ======================================================= */}
        
        {abaAtiva === 'ativos' && (
          <div className="space-y-6">
            <div className="bg-[#1b263b] p-4 rounded-xl border border-zinc-800 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-1/2 relative">
                <input type="text" placeholder="Pesquisar por nome, CNPJ ou e-mail..." value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37] transition-colors" />
              </div>
              <label className="w-full sm:w-auto bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-lg cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap">
                <IconDocument /> Importar Planilha CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleUploadCSV} />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientesFiltrados.length === 0 ? (
                <p className="text-zinc-500 col-span-full py-8 text-center">Nenhum cliente encontrado.</p>
              ) : (
                clientesFiltrados.map((cli) => (
                  <div key={cli.id} className="bg-[#1b263b] p-6 rounded-xl border border-zinc-800 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition">
                    <div>
                      {/* NOVO: EXIBIÇÃO DO SELO AZUL SE ELE TIVER LOGADO (ULTIMO_LOGIN DIFERENTE DE NULL) */}
                      <div className="flex justify-between items-start mb-4 gap-3">
                        <h3 className="text-lg font-bold text-white leading-tight break-words" title={cli.nome_empresa}>
                          {cli.nome_empresa}
                          {cli.ultimo_login && <IconVerified />}
                        </h3>
                        <div className="flex-shrink-0 pt-0.5">
                          <span className="text-[10px] font-bold text-[#d4af37] border border-[#d4af37]/30 bg-[#0d1b2a] px-2 py-0.5 rounded whitespace-nowrap">{cli.regime_tributario}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 mb-1">CNPJ: <span className="text-zinc-300">{cli.cnpj}</span></p>
                      <p className="text-xs text-zinc-400 mb-1">E-mail: <span className="text-zinc-300 truncate inline-block max-w-[200px] align-bottom">{cli.email || 'Não informado'}</span></p>
                      <p className="text-xs text-zinc-400">Contato: <span className="text-zinc-300">{cli.nome_contato || 'Não informado'}</span></p>
                      
                      {/* CARIMBO PEQUENO DE ÚLTIMO LOGIN + CIDADE */}
                      {cli.ultimo_login && (
                        <p className="text-[10px] text-zinc-500 mt-3 pt-2 border-t border-zinc-800/40">
                          Último acesso: <span className="text-blue-400/80 font-medium">{formatarDataHora(cli.ultimo_login)}</span>
                          {cli.ultima_cidade && (
                            <span className="ml-1 text-zinc-400">em <strong className="text-zinc-300">{cli.ultima_cidade}</strong></span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-zinc-800 flex gap-2">
                      <Link href={`/cliente/${cli.id}`} className="flex-1 border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] text-center py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm">Acessar Perfil</Link>
                      <button onClick={() => deletarCliente(cli.id)} className="px-3 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-xs transition font-bold">Excluir</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'pendentes' && (
          <div className="bg-[#1b263b] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
            {pendentes.length === 0 ? (
              <p className="text-zinc-400 text-center py-12">Nenhuma solicitação de cadastro pendente no momento.</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {pendentes.map((sol) => (
                  <div key={sol.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1b263b] hover:bg-zinc-800/40 transition">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-lg font-bold text-white">{sol.nome_empresa}</h4>
                        <span className="text-xs bg-[#0d1b2a] text-zinc-400 px-2 py-0.5 rounded border border-zinc-800">{sol.regime_tributario}</span>
                      </div>
                      <p className="text-xs text-zinc-400">CNPJ: {sol.cnpj} | Responsável: <span className="text-zinc-300">{sol.nome_contato}</span></p>
                      <p className="text-xs text-zinc-400 mt-0.5">E-mail: <span className="text-[#d4af37]">{sol.email}</span> | Celular: {sol.celular}</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={() => rejeitarSolicitacao(sol.id)} className="flex-1 md:flex-none bg-red-500/10 text-red-400 border border-red-500/30 font-bold px-4 py-2 rounded text-xs hover:bg-red-500 hover:text-white transition">Recusar</button>
                      <button onClick={() => aprovarCliente(sol)} className="flex-1 md:flex-none bg-emerald-500 text-black font-extrabold px-4 py-2 rounded text-xs hover:bg-emerald-400 transition shadow">Aprovar e Ativar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'recebidos' && (
          <div className="bg-[#1b263b] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
            {recebidos.length === 0 ? (
              <p className="text-zinc-400 text-center py-12">Nenhum documento recebido dos clientes para análise.</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {recebidos.map((doc) => (
                  <div key={doc.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1b263b] hover:bg-zinc-800/40 transition w-full min-w-0">
                    <div className="min-w-0 flex-1 w-full">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h4 className="text-lg font-bold text-[#d4af37] truncate max-w-md">{doc.nome_documento}</h4>
                        <span className="text-xs bg-[#0d1b2a] text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 font-semibold uppercase whitespace-nowrap">
                          {doc.clientes?.nome_empresa || 'Empresa Removida'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate max-w-full">
                        Arquivo original: <span className="text-zinc-300 font-mono break-all">{doc.nome_original}</span>
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5"><IconMiniClock /> Enviado em: {new Date(doc.criado_em).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto">
                      <button onClick={() => baixarDocumento(doc.caminho_storage)} className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 px-3 py-2.5 rounded text-xs font-bold transition">Visualizar</button>
                      <button onClick={() => aceitarEMoverParaHistorico(doc)} className="flex-1 md:flex-none bg-emerald-500 text-black font-extrabold px-3 py-2.5 rounded text-xs hover:bg-emerald-400 transition">Mover para Histórico</button>
                      <button onClick={() => rejeitarEDeletar(doc)} className="flex-1 md:flex-none px-3 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded text-xs transition">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'solicitacoes' && (
          <div className="bg-[#1b263b] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
            {pedidosCliente.length === 0 ? (
              <p className="text-zinc-400 text-center py-12">Nenhuma solicitação de cliente pendente.</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {pedidosCliente.map((pedido) => (
                  <div key={pedido.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1b263b] hover:bg-zinc-800/40 transition">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-3 mb-2">
                        <IconChat />
                        <span className="text-xs bg-[#0d1b2a] text-[#d4af37] px-2 py-0.5 rounded border border-[#d4af37]/30 font-bold uppercase">
                          {pedido.clientes?.nome_empresa || 'Empresa Removida'}
                        </span>
                        <span className="text-[11px] text-zinc-500">{new Date(pedido.criado_em).toLocaleString('pt-BR')}</span>
                      </div>
                     <p className="text-sm text-zinc-200 font-medium leading-relaxed bg-[#0d1b2a] p-3 rounded-lg border border-zinc-800/50">
  &ldquo;{pedido.descricao}&rdquo;
</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto whitespace-nowrap mt-2 md:mt-0">
                      <Link href={`/cliente/${pedido.cliente_id}`} className="flex-1 md:flex-none border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm text-center">
                        Acessar Perfil
                      </Link>
                      <button onClick={() => atenderPedidoCliente(pedido.id)} className="flex-1 md:flex-none bg-emerald-500 text-black font-extrabold px-4 py-2.5 rounded-lg text-xs hover:bg-emerald-400 transition shadow-lg">Marcar como Atendido</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. ABA ALERTAS E COBRANÇAS (VERSÃO PRO) */}
        {abaAtiva === 'alertas' && (
          <div className="space-y-6">
            
            {/* FORMULÁRIO DE CRIAÇÃO E AUTOMATIZAÇÃO */}
            <div className="bg-[#1b263b] p-6 md:p-8 rounded-xl border border-zinc-800 shadow-xl">
              <h2 className="text-xl font-bold text-[#d4af37] mb-6 flex items-center gap-2"><IconBell /> Painel Avançado de Cobranças</h2>
              <form onSubmit={handleCriarAlerta} className="space-y-6">
                
                {/* BLOCO 1: DESTINATÁRIOS (NOVA LÓGICA DE SELEÇÃO RÁPIDA) */}
                <div className="bg-[#0d1b2a] p-5 rounded-lg border border-zinc-800 shadow-inner">
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-4 border-b border-zinc-800 pb-2">1. Selecionar Destinatários</label>
                  
                  <div className="flex flex-wrap gap-3 mb-5">
                    <button type="button" onClick={() => setFormAlerta({...formAlerta, clientesSelecionados: []})} className="text-sm font-medium px-4 py-2 rounded-lg border transition-all text-white bg-zinc-800/50 border-zinc-700 hover:border-zinc-500">Limpar Seleção</button>
                    <button type="button" onClick={() => handleSelecionarMassa('todos')} className="text-sm font-medium px-4 py-2 rounded-lg border transition-all text-white bg-zinc-800/50 border-zinc-700 hover:border-zinc-500">Todos os Clientes</button>
                    <button type="button" onClick={() => handleSelecionarMassa('Simples Nacional')} className="text-sm font-medium px-4 py-2 rounded-lg border transition-all text-white bg-zinc-800/50 border-zinc-700 hover:border-zinc-500">Simples Nacional</button>
                    <button type="button" onClick={() => handleSelecionarMassa('Lucro Presumido')} className="text-sm font-medium px-4 py-2 rounded-lg border transition-all text-white bg-zinc-800/50 border-zinc-700 hover:border-zinc-500">Lucro Presumido</button>
                    <button type="button" onClick={() => handleSelecionarMassa('Lucro Real')} className="text-sm font-medium px-4 py-2 rounded-lg border transition-all text-white bg-zinc-800/50 border-zinc-700 hover:border-zinc-500">Lucro Real</button>
                  </div>

                  <div>
                    <div className="relative">
                      <input type="text" placeholder="Pesquise manualmente pelo nome da empresa..." value={buscaAlertaInput} onChange={(e) => { setBuscaAlertaInput(e.target.value); setMostrarAutoAlerta(true); }} onFocus={() => setMostrarAutoAlerta(true)} onBlur={() => setTimeout(() => setMostrarAutoAlerta(false), 200)} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                      {mostrarAutoAlerta && buscaAlertaInput.length > 0 && clientesParaAlerta.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1b263b] border border-zinc-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                          {clientesParaAlerta.map((cli) => (
                            <div key={`auto-cli-${cli.id}`} onClick={() => adicionarClienteAlerta(cli)} className="px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white cursor-pointer truncate border-b border-zinc-800/50 last:border-0 transition flex items-center justify-between">
                              <span className="flex items-center gap-2"><IconCompany /> {cli.nome_empresa}</span>
                              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{cli.regime_tributario}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {formAlerta.clientesSelecionados.length > 0 && (
                      <div className="mt-4 p-4 bg-[#1b263b] rounded-lg border border-zinc-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-[#d4af37]">{formAlerta.clientesSelecionados.length} empresa(s) selecionada(s)</span>
                          <button type="button" onClick={() => setMostrarModalClientes(true)} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 rounded text-white font-bold transition border border-zinc-600">Ver / Editar Lista</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formAlerta.clientesSelecionados.slice(0, 10).map(cli => (
                            <span key={cli.id} className="flex items-center gap-1 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                              {cli.nome_empresa} <button type="button" onClick={() => removerClienteAlerta(cli.id)} className="ml-1 hover:text-white bg-black/20 rounded-full w-4 h-4 flex items-center justify-center transition">✕</button>
                            </span>
                          ))}
                          {formAlerta.clientesSelecionados.length > 10 && (
                            <span className="text-xs text-zinc-400 py-1.5 font-medium px-2">+ {formAlerta.clientesSelecionados.length - 10} ocultas...</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* BLOCO 2: CONTEÚDO DO PEDIDO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Categoria</label>
                    <select value={formAlerta.tipo_documento} onChange={e => setFormAlerta({...formAlerta, tipo_documento: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-[#d4af37] focus:outline-none">
                      <option value="Extratos Bancários">Extratos Bancários</option>
                      <option value="Arquivos XML">Arquivos XML</option>
                      <option value="Folha de Pagamento">Folha de Pagamento</option>
                      <option value="Guias e Impostos">Guias e Impostos</option>
                      <option value="Notas Fiscais">Notas Fiscais</option>
                      <option value="Boletos de Mensalidade">Boletos de Mensalidade</option>
                      <option value="Documentos Societários">Documentos Societários</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Título / Assunto Principal</label>
                    <input type="text" required placeholder="Ex: Fechamento de Maio/2026" value={formAlerta.titulo} onChange={e => setFormAlerta({...formAlerta, titulo: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-[#d4af37] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Mensagem Personalizada</label>
                  <textarea rows="2" placeholder="Ex: Por favor, enviar os extratos ou boletos..." value={formAlerta.mensagem} onChange={e => setFormAlerta({...formAlerta, mensagem: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-[#d4af37] focus:outline-none resize-none"></textarea>
                </div>

                {/* BLOCO 3: DATAS E RECORRÊNCIA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-800 pt-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2" title="Até quando o cliente deve enviar ou confirmar">Prazo p/ Confirmação</label>
                    <input type="date" value={formAlerta.prazo} onChange={e => setFormAlerta({...formAlerta, prazo: e.target.value})} disabled={formAlerta.repetir_mensalmente} required={!formAlerta.repetir_mensalmente} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-[#d4af37] focus:outline-none disabled:opacity-30" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2" title="Caso seja uma cobrança (DAS, Boleto, etc)">Data de Vencimento</label>
                    <input type="date" value={formAlerta.data_vencimento} onChange={e => setFormAlerta({...formAlerta, data_vencimento: e.target.value})} disabled={formAlerta.repetir_mensalmente} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-[#d4af37] focus:outline-none disabled:opacity-30" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs font-bold text-[#d4af37] uppercase mb-2"><IconRepeat /> Automação</label>
                    <label className={`flex items-center gap-3 w-full border rounded-lg px-4 py-3 cursor-pointer transition-colors ${formAlerta.repetir_mensalmente ? 'bg-[#d4af37]/10 border-[#d4af37]' : 'bg-[#0d1b2a] border-zinc-800 hover:border-zinc-700'}`}>
                      <input type="checkbox" checked={formAlerta.repetir_mensalmente} onChange={e => setFormAlerta({...formAlerta, repetir_mensalmente: e.target.checked})} className="accent-[#d4af37] w-4 h-4" />
                      <span className={`text-sm font-bold ${formAlerta.repetir_mensalmente ? 'text-[#d4af37]' : 'text-zinc-400'}`}>Repetir Todo Mês</span>
                    </label>
                    {formAlerta.repetir_mensalmente && (
                      <div className="mt-3 p-3 bg-[#0d1b2a] border border-[#d4af37]/50 rounded-lg shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                        <label className="block text-[10px] font-bold text-[#d4af37] uppercase mb-1">Dia do Envio Automático:</label>
                        <input type="number" min="1" max="31" placeholder="Ex: 5" required={formAlerta.repetir_mensalmente} value={formAlerta.dia_recorrencia} onChange={e => setFormAlerta({...formAlerta, dia_recorrencia: e.target.value})} className="w-full bg-[#1b263b] border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:border-[#d4af37] focus:outline-none mb-3" />
                        
                        <label className="block text-[10px] font-bold text-[#d4af37] uppercase mb-1">Dia do Vencimento (Opcional):</label>
                        <input type="number" min="1" max="31" placeholder="Ex: 20" value={formAlerta.dia_vencimento} onChange={e => setFormAlerta({...formAlerta, dia_vencimento: e.target.value})} className="w-full bg-[#1b263b] border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:border-[#d4af37] focus:outline-none" />
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOCO 4: CONTROLE DE E-MAIL */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0d1b2a] p-4 rounded-lg border border-zinc-800 mt-2">
                  <div className="w-full md:w-2/3 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" checked={formAlerta.enviar_email} onChange={e => setFormAlerta({...formAlerta, enviar_email: e.target.checked})} className="sr-only" />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${formAlerta.enviar_email ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formAlerta.enviar_email ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Disparar E-mail</p>
                        <p className="text-[10px] text-zinc-500">Notificar o cliente diretamente na sua caixa de entrada.</p>
                      </div>
                    </label>

                    {formAlerta.enviar_email && (
                      <div className="p-4 bg-[#1b263b] border border-zinc-800 rounded-lg space-y-3">
                        <div className="flex flex-wrap gap-4 border-b border-zinc-700 pb-3">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                            <input type="checkbox" checked={formAlerta.exibir_prazo_email} onChange={e => setFormAlerta({...formAlerta, exibir_prazo_email: e.target.checked})} className="accent-[#d4af37] w-3.5 h-3.5" />
                            Incluir Prazo no E-mail
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                            <input type="checkbox" checked={formAlerta.exibir_vencimento_email} onChange={e => setFormAlerta({...formAlerta, exibir_vencimento_email: e.target.checked})} className="accent-[#d4af37] w-3.5 h-3.5" />
                            Incluir Vencimento no E-mail
                          </label>
                        </div>

                        {!formAlerta.repetir_mensalmente && (
                          <>
                            <label className="flex items-center gap-2 cursor-pointer w-full">
                              <input type="checkbox" checked={formAlerta.enviar_agora} onChange={e => setFormAlerta({...formAlerta, enviar_agora: e.target.checked})} className="accent-[#d4af37] w-4 h-4" />
                              <span className={`text-sm font-bold ${formAlerta.enviar_agora ? 'text-[#d4af37]' : 'text-zinc-400'}`}>Enviar Imediatamente</span>
                            </label>
                            {!formAlerta.enviar_agora && (
                              <div className="animate-pulse border-t border-zinc-700 pt-2 mt-2">
                                <label className="block text-[10px] font-bold text-[#d4af37] uppercase mb-1">Data Agendada para Envio do E-mail:</label>
                                <input type="date" required={!formAlerta.enviar_agora} value={formAlerta.data_envio_programado} onChange={e => setFormAlerta({...formAlerta, data_envio_programado: e.target.value})} className="w-full bg-[#0d1b2a] border border-[#d4af37]/50 rounded px-3 py-1.5 text-xs text-white focus:outline-none" />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={subindo || formAlerta.clientesSelecionados.length === 0} className="w-full md:w-auto bg-[#d4af37] text-[#0d1b2a] font-extrabold px-8 py-3.5 rounded-lg text-sm hover:bg-yellow-500 transition shadow-[0_0_15px_rgba(212,175,55,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
                    {subindo ? 'A processar...' : (formAlerta.repetir_mensalmente ? 'Salvar Automação' : (formAlerta.enviar_email && !formAlerta.enviar_agora ? 'Agendar Disparo' : 'Confirmar e Enviar Agora'))}
                  </button>
                </div>
              </form>
            </div>

            {/* ÁREA DE HISTÓRICO DIVIDIDA EM 4 ABAS LÓGICAS */}
            <div className="bg-[#1b263b] rounded-xl border border-zinc-800 shadow-2xl">
              
              <div className="bg-[#0d1b2a] px-5 py-4 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 rounded-t-xl">
                <div className="flex bg-[#1b263b] p-1 rounded-lg border border-zinc-700 w-full md:w-auto overflow-x-auto hide-scrollbar">
                  <button onClick={() => setSubAbaAlerta('historico_geral')} className={`flex items-center gap-1 flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${subAbaAlerta === 'historico_geral' ? 'bg-[#d4af37] text-[#0d1b2a] shadow-sm' : 'text-zinc-400 hover:text-white'}`}><IconInboxMini /> Histórico de Envios</button>
                  <button onClick={() => setSubAbaAlerta('agendados')} className={`flex items-center gap-1 flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${subAbaAlerta === 'agendados' ? 'bg-indigo-400 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}><IconCalendar /> Agendados</button>
                  <button onClick={() => setSubAbaAlerta('recorrentes')} className={`flex items-center gap-1 flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${subAbaAlerta === 'recorrentes' ? 'bg-purple-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}><IconRepeat /> Automações</button>
                  <button onClick={() => setSubAbaAlerta('atrasados')} className={`flex items-center gap-1 flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${subAbaAlerta === 'atrasados' ? 'bg-red-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}><IconAlert /> Atrasados ({alertasAtrasados.length})</button>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto flex-col sm:flex-row">
                  {subAbaAlerta !== 'recorrentes' && (
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300 hover:text-white transition whitespace-nowrap bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-700">
                      <input type="checkbox" checked={agruparPorEmpresa} onChange={e => { setAgruparPorEmpresa(e.target.checked); setEmpresaExpandida(null); }} className="accent-[#d4af37] w-4 h-4 cursor-pointer" />
                      <IconCompany /> Agrupar por Empresa
                    </label>
                  )}
                  <div className="relative w-full md:w-64">
                    <input type="text" placeholder="Procurar cobrança..." value={buscaAlerta} onChange={(e) => setBuscaAlerta(e.target.value)} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-zinc-800">
                {subAbaAlerta === 'historico_geral' && renderLista(alertasHistoricoGeral, (alerta) => {
                  const prazo = calcularPrazo(alerta.prazo);
                  return (
                    <div key={alerta.id} className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${alerta.status === 'respondido' ? 'opacity-50 bg-[#0d1b2a]/40' : 'bg-[#1b263b] hover:bg-zinc-800/20'}`}>
                      <div className="min-w-0 flex-1 w-full">
                        <div className="flex gap-2 items-center mb-1 flex-wrap">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase whitespace-nowrap ${alerta.status === 'pendente' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>{alerta.status === 'pendente' ? 'Aguardando' : 'Respondido'}</span>
                          
                          {/* ETIQUETA CLARA DE COMO FOI ENVIADO */}
                          {alerta.enviado_email ? (
                            <span className="text-[10px] font-bold text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/30 flex items-center whitespace-nowrap"><IconMail /> E-mail e Portal</span>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 flex items-center whitespace-nowrap"><IconGlobe /> Apenas Portal</span>
                          )}
                          
                          <span className="text-xs font-bold text-zinc-300 truncate max-w-full">{alerta.clientes?.nome_empresa}</span>
                        </div>
                        <p className="text-sm font-medium text-[#d4af37] mt-2 mb-1 truncate">{alerta.titulo} <span className="text-xs text-zinc-500 ml-1 font-normal">({alerta.tipo_documento})</span></p>
                        <div className="flex gap-3 items-center flex-wrap">
                          {alerta.status !== 'respondido' && <p className={`text-xs ${prazo.cor}`}><IconMiniClock /> Limite: {alerta.prazo ? new Date(alerta.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '--'}</p>}
                          {alerta.data_vencimento && <p className="text-[11px] text-red-400 font-semibold border-l border-zinc-700 pl-3">Vencimento: {new Date(alerta.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>}
                          
                          {/* O NOVO VISTO AZUL DE LEITURA (SABER SE ELE LEU) */}
                          {alerta.visualizado_em && (
                            <p className="text-[11px] text-blue-400 font-bold border-l border-zinc-700 pl-3 flex items-center" title="Cliente abriu a notificação no portal">
                              <IconEye /> Visto em: {formatarDataHora(alerta.visualizado_em)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0 flex-wrap sm:flex-nowrap">
                        <button onClick={() => preencherCopiaAlerta(alerta)} className="flex-1 md:flex-none text-xs bg-[#d4af37]/10 hover:bg-[#d4af37] hover:text-[#0d1b2a] border border-[#d4af37]/30 px-3 py-2 rounded text-[#d4af37] font-bold transition flex items-center justify-center"><IconRepeat /> Repetir</button>
                        {alerta.status === 'respondido' && alerta.caminho_arquivo && <button onClick={() => baixarDocumento(alerta.caminho_arquivo)} className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-xs font-bold transition">Ver Anexo</button>}
                        <button onClick={() => deletarAlerta(alerta.id)} className="flex-1 md:flex-none text-xs bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-2 rounded text-red-400 transition">Apagar</button>
                      </div>
                    </div>
                  );
                })}

                {subAbaAlerta === 'agendados' && renderLista(alertasAgendados, (alerta) => (
                  <div key={alerta.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d1b2a]/50 hover:bg-zinc-800/20 transition border-l-4 border-indigo-400">
                    <div className="min-w-0 flex-1 w-full">
                      <div className="flex gap-2 items-center mb-1">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase text-indigo-400 border-indigo-500/30 bg-indigo-500/10 flex items-center"><IconCalendar /> Envio Agendado</span>
                        <span className="text-xs font-bold text-zinc-300 truncate max-w-full">{alerta.clientes?.nome_empresa}</span>
                      </div>
                      <p className="text-sm font-medium text-[#d4af37] mt-1 truncate">{alerta.titulo} <span className="text-xs text-zinc-500 ml-1 font-normal">({alerta.tipo_documento})</span></p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Disparo programado para: <strong className="text-indigo-400 text-xs">{new Date(alerta.data_envio_programado).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</strong>
                      </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                      <button onClick={() => deletarAlerta(alerta.id)} className="flex-1 md:flex-none text-xs bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 px-4 py-2 rounded text-red-400 font-bold transition whitespace-nowrap">Cancelar Agendamento</button>
                    </div>
                  </div>
                ))}

                {subAbaAlerta === 'atrasados' && renderLista(alertasAtrasados, (alerta) => {
                  const prazo = calcularPrazo(alerta.prazo);
                  return (
                    <div key={alerta.id} className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition bg-[#1b263b] hover:bg-zinc-800/20 border-l-4 border-red-500`}>
                      <div className="min-w-0 flex-1 w-full">
                        <div className="flex gap-2 items-center mb-1 flex-wrap">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase whitespace-nowrap bg-red-500/10 text-red-500 border-red-500/30 flex items-center`}><IconAlert /> Cliente Atrasado</span>
                          <span className="text-xs font-bold text-zinc-300 truncate max-w-full">{alerta.clientes?.nome_empresa}</span>
                        </div>
                        <p className="text-sm font-medium text-[#d4af37] mt-2 mb-1 truncate">{alerta.titulo} <span className="text-xs text-zinc-500 ml-1 font-normal">({alerta.tipo_documento})</span></p>
                        <div className="flex gap-3 items-center flex-wrap">
                          <p className={`text-xs ${prazo.cor}`}><IconMiniClock /> Limite era dia: {new Date(alerta.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                          {alerta.data_vencimento && <p className="text-[11px] text-red-400 font-semibold border-l border-zinc-700 pl-3">Vencimento da Guia: {new Date(alerta.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>}

                          {alerta.visualizado_em && (
                            <p className="text-[11px] text-blue-400 font-bold border-l border-zinc-700 pl-3 flex items-center" title="Cliente abriu a notificação no portal">
                              <IconEye /> Visto em: {formatarDataHora(alerta.visualizado_em)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0 flex-wrap sm:flex-nowrap">
                        <button onClick={() => deletarAlerta(alerta.id)} className="flex-1 md:flex-none text-xs bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-2 rounded text-red-400 transition whitespace-nowrap">Apagar Registo</button>
                      </div>
                    </div>
                  );
                })}

                {/* =======================================================
                    NOVO: AGRUPAMENTO DE AUTOMAÇÕES POR TÍTULO
                ======================================================= */}
                {subAbaAlerta === 'recorrentes' && (() => {
                  if (alertasRecorrentes.length === 0) return <p className="text-zinc-500 text-center py-12">Nenhuma automação mensal programada no sistema.</p>;
                  
                  // Agrupa pelo Título da Automação
                  const agrupadoAuto = {};
                  alertasRecorrentes.forEach(a => {
                    const k = a.titulo;
                    if (!agrupadoAuto[k]) agrupadoAuto[k] = [];
                    agrupadoAuto[k].push(a);
                  });

                  return (
                    <div className="divide-y divide-zinc-800/50">
                      {Object.keys(agrupadoAuto).sort().map(titulo => {
                        const itens = agrupadoAuto[titulo];
                        const ref = itens[0];
                        const isExpanded = automacaoExpandida === titulo;

                        const deletarRegraCompleta = () => {
                           confirmarAcao('Excluir Automação', `Deseja excluir esta automação para TODOS os ${itens.length} clientes vinculados?`, async () => {
                               setSubindo(true);
                               const ids = itens.map(i => i.id);
                               await supabase.from('alertas_clientes').delete().in('id', ids);
                               await carregarDados();
                               setSubindo(false);
                           });
                        };

                        return (
                          <div key={titulo} className="flex flex-col">
                            <div className="p-5 bg-[#0d1b2a]/50 hover:bg-zinc-800/20 transition border-l-4 border-purple-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="min-w-0 flex-1 w-full">
                                <div className="flex gap-2 items-center mb-1">
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase text-purple-400 border-purple-500/30 bg-purple-500/10 flex items-center"><IconRepeat /> Automação de Grupo</span>
                                  <span className="text-xs font-bold text-zinc-300 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">Ativo para {itens.length} cliente(s)</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#d4af37] mt-1 truncate">{titulo} <span className="text-sm text-zinc-500 ml-1 font-normal">({ref.tipo_documento})</span></h3>
                                <div className="flex gap-3 items-center mt-2 flex-wrap">
                                  <p className="text-[11px] text-zinc-400">Envia todo dia: <strong className="text-white bg-zinc-800 px-2 py-0.5 rounded ml-1">{ref.dia_recorrencia || '--'}</strong></p>
                                  {ref.dia_vencimento && <p className="text-[11px] text-zinc-400 border-l border-zinc-700 pl-3">Vence todo dia: <strong className="text-white bg-zinc-800 px-2 py-0.5 rounded ml-1">{ref.dia_vencimento}</strong></p>}
                                </div>
                              </div>
                              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 flex-wrap sm:flex-nowrap">
                                <button onClick={() => setAutomacaoExpandida(isExpanded ? null : titulo)} className="flex-1 md:flex-none text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white px-4 py-2.5 rounded font-bold transition whitespace-nowrap">
                                  {isExpanded ? 'Ocultar Clientes ▲' : 'Ver Clientes ▼'}
                                </button>
                                <button onClick={deletarRegraCompleta} className="flex-1 md:flex-none text-xs bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 px-4 py-2.5 rounded text-red-400 font-bold transition whitespace-nowrap">Excluir Automação Geral</button>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="p-5 bg-[#1b263b] border-t border-zinc-800 space-y-2 shadow-inner">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase mb-3">Clientes vinculados a esta regra:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {itens.map(alerta => (
                                    <div key={alerta.id} className="flex items-center justify-between bg-[#0d1b2a] p-3 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition">
                                      <span className="text-sm font-bold text-zinc-300 truncate pr-2"><IconCompany /> {alerta.clientes?.nome_empresa}</span>
                                      <button onClick={() => deletarAlerta(alerta.id)} className="text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 rounded transition border border-red-500/20 whitespace-nowrap">Remover</button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>
        )}

        {/* 6. ABA DEMANDAS INTERNAS */}
        {abaAtiva === 'demandas' && (
          <div className="space-y-6">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setSubAbaDemanda('pendentes')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${subAbaDemanda === 'pendentes' ? 'bg-[#d4af37] text-[#0d1b2a]' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>Tarefas Pendentes</button>
              <button onClick={() => setSubAbaDemanda('concluidas')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${subAbaDemanda === 'concluidas' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>Concluídas</button>
              {eGestor && (
                <button onClick={() => setSubAbaDemanda('analise')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center ${subAbaDemanda === 'analise' ? 'bg-rose-500 text-white' : 'bg-[#1b263b] border border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}><IconChartMini /> Análise de Equipe</button>
              )}
            </div>

            {subAbaDemanda !== 'analise' && (
              <div className="bg-[#1b263b] p-6 rounded-xl border border-zinc-800 shadow-xl mb-6">
                <h2 className="text-sm font-bold text-white mb-4">Atribuir Nova Tarefa Interna</h2>
                <form onSubmit={handleCriarDemanda} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">O que precisa ser feito?</label>
                    <input type="text" required placeholder="Ex: Revisar balancete..." value={formDemanda.descricao} onChange={e => setFormDemanda({...formDemanda, descricao: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Para quem?</label>
                    <select value={formDemanda.atribuido_para} onChange={e => setFormDemanda({...formDemanda, atribuido_para: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]">
                      {LISTA_COLABORADORES.map((colab, i) => <option key={i} value={colab}>{colab}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Prazo Final</label>
                      <input type="date" required value={formDemanda.data_entrega} onChange={e => setFormDemanda({...formDemanda, data_entrega: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Nível</label>
                      <select value={formDemanda.prioridade} onChange={e => setFormDemanda({...formDemanda, prioridade: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]">
                        <option value="Alta">Alta</option>
                        <option value="Média">Média</option>
                        <option value="Baixa">Baixa</option>
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-4 flex justify-end mt-2">
                    <button type="submit" disabled={subindo} className="bg-[#d4af37] text-[#0d1b2a] font-extrabold px-6 py-2.5 rounded-lg text-sm hover:bg-yellow-500 transition shadow-lg">{subindo ? 'A processar...' : 'Publicar Tarefa'}</button>
                  </div>
                </form>
              </div>
            )}

            {subAbaDemanda === 'pendentes' && (
              <div className="space-y-6">
                {demandasPendentesAgrupadas.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">Nenhuma demanda pendente visível para você.</p>
                ) : (
                  demandasPendentesAgrupadas.map(grupo => (
                    <div key={grupo.nome} className="bg-[#1b263b] rounded-xl border border-zinc-800 overflow-hidden shadow-lg">
                      <div className="bg-[#0d1b2a] px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                        <h3 className="font-bold text-zinc-200">{grupo.nome}</h3>
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">{grupo.tarefas.length} tarefas</span>
                      </div>
                      <div className="divide-y divide-zinc-800/60">
                        {grupo.tarefas.map(d => {
                          const prazo = calcularPrazo(d.data_entrega);
                          return (
                            <div key={d.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-zinc-800/20 transition">
                              <div className="min-w-0 flex-1">
                                <div className="flex gap-2 items-center mb-1">
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${d.prioridade === 'Alta' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : d.prioridade === 'Média' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>{d.prioridade}</span>
                                  <span className="text-[11px] text-zinc-500">Enviado por {d.criado_por}</span>
                                </div>
                                <p className="text-sm text-zinc-200 font-medium mb-1">{d.descricao}</p>
                                <p className={`text-xs ${prazo.cor}`}><IconMiniClock /> {prazo.texto} ({new Date(d.data_entrega).toLocaleDateString('pt-BR', {timeZone: 'UTC'})})</p>
                              </div>
                              <div className="flex gap-2">
                                {d.atribuido_para === operador && <button onClick={() => concluirDemanda(d.id)} className="bg-emerald-500 text-black font-extrabold px-4 py-2 rounded text-xs hover:bg-emerald-400 transition shadow">Concluir Tarefa</button>}
                                {(d.criado_por === operador || eGestor) && <button onClick={() => deletarDemanda(d.id)} className="px-3 bg-zinc-800 hover:bg-red-500 hover:text-white border border-zinc-700 hover:border-red-500 rounded text-xs transition">Excluir</button>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {subAbaDemanda === 'concluidas' && (
              <div className="bg-[#1b263b] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
                {demandasConcluidas.length === 0 ? (
                  <p className="text-zinc-500 text-center py-12">Nenhuma tarefa concluída no seu painel.</p>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {demandasConcluidas.map(d => (
                      <div key={d.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d1b2a]/30 opacity-70">
                        <div>
                          <div className="flex gap-2 items-center mb-1">
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"><IconCheck /> Concluída</span>
                            <span className="text-[11px] text-zinc-500">{d.atribuido_para} finalizou. (Pedido por: {d.criado_por})</span>
                          </div>
                          <p className="text-sm text-zinc-400 line-through">{d.descricao}</p>
                        </div>
                        {(d.criado_por === operador || eGestor) && <button onClick={() => deletarDemanda(d.id)} className="text-xs text-red-500 hover:underline">Apagar do Histórico</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {subAbaDemanda === 'analise' && eGestor && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {LISTA_COLABORADORES.map(colab => {
                  const tarefasDoColab = demandas.filter(d => d.atribuido_para === colab);
                  const concluidas = tarefasDoColab.filter(d => d.status === 'concluído').length;
                  const pendentesCalculo = tarefasDoColab.filter(d => d.status === 'pendente').map(d => calcularPrazo(d.data_entrega).texto.includes('Atrasado') ? 'atrasado' : 'no_prazo');
                  const emAndamento = pendentesCalculo.filter(p => p === 'no_prazo').length;
                  const emAtraso = pendentesCalculo.filter(p => p === 'atrasado').length;

                  return (
                    <div key={colab} className="bg-[#1b263b] p-5 rounded-xl border border-zinc-800 shadow-xl">
                      <h3 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-2">{colab}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm"><span className="text-zinc-400">Tarefas Entregues</span><span className="font-bold text-emerald-400">{concluidas}</span></div>
                        <div className="flex justify-between items-center text-sm"><span className="text-zinc-400">Em Andamento (No Prazo)</span><span className="font-bold text-blue-400">{emAndamento}</span></div>
                        <div className="flex justify-between items-center text-sm border-t border-zinc-800 pt-3"><span className="text-red-400 font-semibold">Em Atraso</span><span className={`font-extrabold text-lg ${emAtraso > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`}>{emAtraso}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* SISTEMA DE CONFIRMAÇÃO (Substitui o alert feio do navegador) */}
      {dialogo.aberto && (
        <div className="fixed inset-0 bg-[#0d1b2a]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]">
          <div className="bg-[#1b263b] border border-zinc-700 rounded-xl w-full max-w-sm p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
            <h3 className={`text-xl font-black mb-2 ${dialogo.tipo === 'perigo' ? 'text-red-500' : 'text-[#d4af37]'}`}>
              {dialogo.tipo === 'perigo' ? '⚠️ ' : '✅ '}{dialogo.titulo}
            </h3>
            <p className="text-zinc-300 text-sm mb-8 leading-relaxed">{dialogo.mensagem}</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDialogo({ ...dialogo, aberto: false })} 
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-lg transition"
              >
                Cancelar
              </button>
              <button 
                onClick={() => { dialogo.acao(); setDialogo({ ...dialogo, aberto: false }); }} 
                className={`px-5 py-2.5 text-[#0d1b2a] text-sm font-extrabold rounded-lg transition shadow-lg ${dialogo.tipo === 'perigo' ? 'bg-red-500 hover:bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-[#d4af37] hover:bg-yellow-500 shadow-[0_0_15px_rgba(212,175,55,0.3)]'}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛑 A TRAVA ANTI-DEDO NERVOSO (Overlay Global de Processamento) */}
      {subindo && (
        <div className="fixed inset-0 z-[99999999] bg-[#0d1b2a]/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-[#1b263b] p-8 rounded-2xl border border-[#d4af37]/40 flex flex-col items-center gap-5 shadow-[0_0_60px_rgba(212,175,55,0.2)] animate-in zoom-in duration-200">
            <div className="w-14 h-14 border-4 border-zinc-700 border-t-[#d4af37] rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.2)] mt-2"></div>
            <p className="text-[#d4af37] font-black tracking-widest uppercase text-sm mt-2 animate-pulse drop-shadow-md">A processar...</p>
          </div>
        </div>
      )}

      {/* SISTEMA DE TOASTS PREMIUM */}
      <div className="fixed bottom-6 right-6 z-[9999999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border pointer-events-auto transition-all backdrop-blur-md min-w-[280px] max-w-sm transform translate-y-0 opacity-100 ${
            toast.tipo === 'erro' ? 'bg-red-500/10 border-red-500/30 text-red-100' :
            toast.tipo === 'aviso' ? 'bg-orange-500/10 border-orange-500/30 text-orange-100' :
            'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
          }`}>
            <span className="text-xl drop-shadow-md">{toast.tipo === 'erro' ? '❌' : toast.tipo === 'aviso' ? '⚠️' : '✅'}</span>
            <span className="text-sm font-bold leading-snug">{toast.mensagem}</span>
          </div>
        ))}
      </div>

    </div>
  );
}