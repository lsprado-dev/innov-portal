'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from './lib/supabase'; // Ajustado para a pasta real
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { enviarEmailDemanda, enviarEmailDocumento } from './lib/email';
import { inscreverAparelho, dispararPush } from './lib/push'; // Ajustado para a pasta real
import InnovChat from './components/InnovChat'; // COMPONENTE DO CHAT
import bcrypt from 'bcryptjs'; // <-- NOVO: Importando criptografia forte

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

// Nova Criptografia Definitiva (Bcrypt) rodando no momento do cadastro
const encriptarSenha = (text) => {
  if (!text) return '';
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(text, salt);
};



const LISTA_COLABORADORES = Object.keys(OBTER_EMAIL_FUNCIONARIO);

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
  const pathname = usePathname(); // NOVO: O espião de rotas do Next.js
  const [sessaoExpirada, setSessaoExpirada] = useState(false);

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

  const [clientes, setClientes] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [recebidos, setRecebidos] = useState([]);
  const [demandas, setDemandas] = useState([]);
  const [pedidosCliente, setPedidosCliente] = useState([]);
  const [alertas, setAlertas] = useState([]);
  
 const [abaAtiva, setAbaAtiva] = useState('ativos');
  const [subAbaAtivos, setSubAbaAtivos] = useState('mensalistas'); 
  const [subAbaDemanda, setSubAbaDemanda] = useState('pendentes'); 
  const [subAbaAlerta, setSubAbaAlerta] = useState('historico_cobrancas'); 
  
  // NOVO ESTADO: Guarda os processos ativos de todos os clientes
  const [processosSocietarios, setProcessosSocietarios] = useState([]);

  // ESTADO DE SELEÇÃO DE DOCS RECEBIDOS
  const [selecionadosRecebidos, setSelecionadosRecebidos] = useState([]);

  // ESTADO DE SAÚDE DO SISTEMA
  const [totalArquivosSistema, setTotalArquivosSistema] = useState(0);
  const [totalArquivosSupabase, setTotalArquivosSupabase] = useState(0);
  const [totalArquivosDrive, setTotalArquivosDrive] = useState(0);
  const [emailsEnviadosHoje, setEmailsEnviadosHoje] = useState(0);
  const [emailsEnviadosMes, setEmailsEnviadosMes] = useState(0);

  // ESTADOS DE AGRUPAMENTO E MODAIS
  const [agruparPorEmpresa, setAgruparPorEmpresa] = useState(false);
  const [agruparPorTitulo, setAgruparPorTitulo] = useState(false);
  const [empresaExpandida, setEmpresaExpandida] = useState(null);
  const [tituloExpandido, setTituloExpandido] = useState(null);
  const [automacaoExpandida, setAutomacaoExpandida] = useState(null);
  const [mostrarModalClientes, setMostrarModalClientes] = useState(false);

  const [previewCSV, setPreviewCSV] = useState(null);
  const [autenticando, setAutenticando] = useState(true);
  const [carregandoDados, setCarregandoDados] = useState(true); // <-- NOVA TRAVA INICIAL
  
  // PAGINAÇÃO
  const TAMANHO_PAGINA = 50;
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [temMaisDados, setTemMaisDados] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);

  const [operador, setOperador] = useState('Administrador');
  const [subindo, setSubindo] = useState(false);
  const [progressoSync, setProgressoSync] = useState(null); // <-- MÁGICA 1 AQUI
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0); // Estado p/ a bolinha do Chat

  const [formDemanda, setFormDemanda] = useState({
    descricao: '',
    atribuido_para: 'Victor (Admin)',
    data_entrega: '',
    prioridade: 'Média'
  });
  
  const [formAlerta, setFormAlerta] = useState({
    clientesSelecionados: [],
    responsavel: '', 
    tipo_documento: 'Extratos Bancários',
    titulo: '',
    mensagem: '',
    prazo: '',
    data_vencimento: '',
    repetir_mensalmente: false,
    dia_recorrencia: '',
    dia_vencimento: '',
    enviar_email: true,
    enviar_push: true,
    enviar_agora: true,
    data_envio_programado: '',
    hora_envio_programado: '',
    arquivo_envio: null,
    exibir_prazo_email: true,
    exibir_vencimento_email: true,
    tipo_alerta: 'cobranca' // NOVO: Separa Cobrança, Lembrete, Envio_Doc
  });
  
  // NOVOS ESTADOS DA CENTRAL DE DISPARO
  const [modoAlertaTopo, setModoAlertaTopo] = useState('cobrancas');
  const [formPush, setFormPush] = useState({ alvo: 'todos', titulo: '', mensagem: '' });
  
  const [buscaAlertaInput, setBuscaAlertaInput] = useState('');
  const [mostrarAutoAlerta, setMostrarAutoAlerta] = useState(false);
  const [buscaAlerta, setBuscaAlerta] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  
  // NOVOS ESTADOS PARA SELEÇÃO E BUSCA DE TICKETS
  const [modoSelecaoRecebidos, setModoSelecaoRecebidos] = useState(false);
  const [buscaPedido, setBuscaPedido] = useState('');
  const [agruparPedidosPorEmpresa, setAgruparPedidosPorEmpresa] = useState(false);
  const [empresaExpandidaPedido, setEmpresaExpandidaPedido] = useState(null);
  const [subAbaTicket, setSubAbaTicket] = useState('pendentes'); // NOVO: Abas de Tickets

  // ESTADO PARA O BALÃO DE COPIAR SENHA
  const [senhaCopiadaId, setSenhaCopiadaId] = useState(null);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [pedindoPush, setPedindoPush] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') setNotificacoesAtivas(false);
    }
  }, []);
  
  // ESTADO DOS LOGS DE AUDITORIA
  const [logs, setLogs] = useState([]);

  // ESTADOS PARA EDIÇÃO MANUAL DE CLIENTE
  const [modalEditarCliente, setModalEditarCliente] = useState({ aberto: false, cliente: null });
  const [formEditar, setFormEditar] = useState({ nome_empresa: '', nome_contato: '', email: '', celular: '', regime_tributario: '' });

  // NOVOS ESTADOS PARA ADICIONAR CLIENTES (MANUAL E CSV)
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [abaAdicionar, setAbaAdicionar] = useState('manual'); // 'manual', 'mensalista' ou 'csv'
  const [buscaMensalista, setBuscaMensalista] = useState('');
  const [tipoAdicionar, setTipoAdicionar] = useState('mensalista'); // 'mensalista' ou 'especiais'
  const [formManual, setFormManual] = useState({ nome_empresa: '', documento: '', nome_contato: '', email: '', celular: '', regime_tributario: 'Simples Nacional' });
  const [tipoImportacaoCsv, setTipoImportacaoCsv] = useState('mensalista'); // 'mensalista' ou 'especiais'

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
  const [dialogo, setDialogo] = useState({ aberto: false, titulo: '', mensagem: '', acao: null, tipo: 'perigo', btnCancelar: 'Cancelar', btnConfirmar: 'Confirmar' });
  function confirmarAcao(titulo, mensagem, acao, tipo = 'perigo', btnCancelar = 'Cancelar', btnConfirmar = 'Confirmar') {
    setDialogo({ aberto: true, titulo, mensagem, acao, tipo, btnCancelar, btnConfirmar });
  }

  // NOVO: LÊ O CLIQUE DO E-MAIL MATINAL DOS GESTORES E FILTRA SOZINHO!
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const colabQuery = urlParams.get('colab');
      if (colabQuery) {
        setBuscaPedido(colabQuery); // Preenche a barra de pesquisa com o nome
        setAbaAtiva('solicitacoes'); // Abre a aba certa
        setSubAbaTicket('pendentes');
      }
    }
  }, []);

  useEffect(() => {
    async function validarAcessoAdmin() {
      const tipoUsuario = localStorage.getItem('usuario_tipo');
      const nomeUsuario = localStorage.getItem('usuario_nome');
      const idUsuario = localStorage.getItem('usuario_id');
      const token = localStorage.getItem('supabase_token');
      
      if (tipoUsuario === 'cliente' && idUsuario) {
        router.push(`/cliente/${idUsuario}`);
        return;
      } 
      
      const colaboradorValido = LISTA_COLABORADORES.includes(nomeUsuario);
      
      // Checagem primária de segurança
      if (tipoUsuario !== 'interno' || !colaboradorValido || !token) {
        localStorage.clear();
        router.push('/login');
        return;
      }

      // BLINDAGEM MÁXIMA: Bate no banco e testa se o token do usuário permite ler clientes (Se o RLS bloquear, ele é expulso)
      const { error } = await supabase.from('clientes').select('id').limit(1);
      if (error) {
        localStorage.clear();
        router.push('/login');
        return;
      }

      if (nomeUsuario) {
        setOperador(nomeUsuario);
        setFormAlerta(prev => ({ ...prev, responsavel: nomeUsuario }));
      }
      setAutenticando(false);
    }
    
    validarAcessoAdmin();
  }, [router]);

  // Carregamento inteligente com reset de paginação
  useEffect(() => {
    if (!autenticando) {
      setPaginaAtual(0);
      setTemMaisDados(false);
      carregarDadosDaAba(0, true);
    }
  }, [abaAtiva, autenticando]);

  // MÁGICA DE UX: Atualiza os dados silenciosamente quando o Admin volta para a janela do painel
  useEffect(() => {
    const handleFocus = () => {
      if (!subindo && !carregandoDados && !autenticando) {
        carregarDadosDaAba(paginaAtual, true);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [abaAtiva, paginaAtual, subindo, carregandoDados, autenticando]);

  // 🛑 O ANTÍDOTO DO NEXT.JS (Corrige o bug de 0 clientes ao voltar):
  // Toda vez que a URL da página mudar (ex: voltando do perfil do cliente), forçamos a barra de recarregar os dados!
  useEffect(() => {
    if (!autenticando && !carregandoDados) {
      carregarDadosDaAba(paginaAtual, true);
    }
  }, [pathname]); // <-- O gatilho é a navegação (voltar para a página)!

  async function carregarDadosDaAba(pagina = 0, recarregar = false) {
    if (pagina === 0) {
      // Conta arquivos que NÃO estão no Google Drive (Foram pro Supabase)
      const reqArqSupa = supabase.from('arquivos_portal').select('id', { count: 'exact', head: true }).not('caminho_storage', 'ilike', 'DRIVE:%');
      const reqEnvSupa = supabase.from('envios_cliente').select('id', { count: 'exact', head: true }).not('caminho_storage', 'ilike', 'DRIVE:%');
      
      // Conta arquivos que ESTÃO no Google Drive
      const reqArqDrive = supabase.from('arquivos_portal').select('id', { count: 'exact', head: true }).ilike('caminho_storage', 'DRIVE:%');
      const reqEnvDrive = supabase.from('envios_cliente').select('id', { count: 'exact', head: true }).ilike('caminho_storage', 'DRIVE:%');

      Promise.all([reqArqSupa, reqEnvSupa, reqArqDrive, reqEnvDrive]).then(res => {
        const supaCount = (res[0].count || 0) + (res[1].count || 0);
        const driveCount = (res[2].count || 0) + (res[3].count || 0);
        setTotalArquivosSupabase(supaCount);
        setTotalArquivosDrive(driveCount);
        setTotalArquivosSistema(supaCount + driveCount);
      });

      // MÁGICA: Puxa a contagem de e-mails em background
      const hojeObj = new Date();
      const inicioDiaStr = new Date(hojeObj.getFullYear(), hojeObj.getMonth(), hojeObj.getDate()).toISOString();
      const inicioMesStr = new Date(hojeObj.getFullYear(), hojeObj.getMonth(), 1).toISOString();

      supabase.from('logs_auditoria').select('id', { count: 'exact', head: true }).eq('acao', 'EMAIL_ENVIADO').gte('criado_em', inicioDiaStr).then(r => setEmailsEnviadosHoje(r.count || 0));
      supabase.from('logs_auditoria').select('id', { count: 'exact', head: true }).eq('acao', 'EMAIL_ENVIADO').gte('criado_em', inicioMesStr).then(r => setEmailsEnviadosMes(r.count || 0));

      // Puxa a contagem sem quebrar o array real da tela!
      supabase.from('solicitacoes_cadastro').select('id', { count: 'exact', head: true }).then(r => {
         setPendentes(prev => (abaAtiva === 'pendentes' || (prev.length > 0 && prev[0]?.id)) ? prev : new Array(r.count || 0)); 
      });
      supabase.from('envios_cliente').select('id', { count: 'exact', head: true }).in('status', ['pendente', 'visto']).then(r => {
         setRecebidos(prev => (abaAtiva === 'recebidos' || (prev.length > 0 && prev[0]?.id)) ? prev : new Array(r.count || 0));
      });
    }
    
    // Cálculo Mágico do RANGE (Ex: Página 0 pega do 0 ao 49 | Página 1 pega do 50 ao 99)
    const from = pagina * TAMANHO_PAGINA;
    const to = from + TAMANHO_PAGINA - 1;
    
    let novaBusca = [];

    // 🛑 COLUNAS BLINDADAS: Apenas as exatas do banco. "senha" e a inexistente "status" ficam de fora!
    const COLUNAS_SEGURAS = 'id, nome_empresa, cnpj, cpf, nome_contato, email, celular, regime_tributario, tipo_conta, ultimo_login, ultima_cidade, empresas_vinculadas, socios, clientes_van, senha_alterada';

    if (abaAtiva === 'ativos' || abaAtiva === 'senhas') {
      // Ampliando o limite de segurança para 5.000 clientes (Evita limite padrão do PostgREST)
      const { data, error } = await supabase
        .from('clientes')
        .select(COLUNAS_SEGURAS)
        .order('nome_empresa')
        .limit(5000);
      
      if (error) console.error('🚨 Erro ao buscar clientes (Coluna inválida?):', error);
      if (data) setClientes(data);
      
      // Carrega os processos vinculados a esses clientes
      const { data: procs } = await supabase.from('processos_societarios').select('*').limit(5000);
      if (procs) setProcessosSocietarios(procs);

      setTemMaisDados(false); 
    } 
    else if (abaAtiva === 'pendentes') {
      const { data } = await supabase.from('solicitacoes_cadastro').select('*').order('criado_em');
      if (data) setPendentes(data);
      setTemMaisDados(false);
    } 
    else if (abaAtiva === 'recebidos') {
      const { data } = await supabase.from('envios_cliente').select('*, clientes(nome_empresa)').in('status', ['pendente', 'visto']).order('criado_em', { ascending: false }).range(from, to);
      novaBusca = data || [];
      setRecebidos(prev => recarregar ? novaBusca : [...prev, ...novaBusca]);
    } 
    else if (abaAtiva === 'solicitacoes') {
      const { data } = await supabase.from('pedidos_cliente').select('*, clientes(nome_empresa)').order('criado_em', { ascending: false }).range(from, to);
      novaBusca = data || [];
      setPedidosCliente(prev => recarregar ? novaBusca : [...prev, ...novaBusca]);
    } 
    else if (abaAtiva === 'alertas') {
      const { data } = await supabase.from('alertas_clientes').select('*, clientes(nome_empresa, regime_tributario)').order('criado_em', { ascending: false }).range(from, to);
      novaBusca = data || [];
      setAlertas(prev => recarregar ? novaBusca : [...prev, ...novaBusca]);
      if (recarregar) {
        const { data: clis, error } = await supabase.from('clientes').select(COLUNAS_SEGURAS).order('nome_empresa');
        if (error) console.error('🚨 Erro (Alertas):', error);
        if (clis) setClientes(clis);
      }
    } 
    else if (abaAtiva === 'demandas') {
      const { data } = await supabase.from('demandas_equipe').select('*').order('criado_em', { ascending: false }).range(from, to);
      novaBusca = data || [];
      setDemandas(prev => recarregar ? novaBusca : [...prev, ...novaBusca]);
    }
    else if (abaAtiva === 'auditoria') {
      const { data } = await supabase.from('logs_auditoria').select('*').order('criado_em', { ascending: false }).range(from, to);
      novaBusca = data || [];
      setLogs(prev => recarregar ? novaBusca : [...prev, ...novaBusca]);
      if (recarregar) {
        const { data: clis, error } = await supabase.from('clientes').select(COLUNAS_SEGURAS).order('nome_empresa');
        if (error) console.error('🚨 Erro (Auditoria):', error);
        if (clis) setClientes(clis);
      }
    }

    // Se vieram exatos 50 itens (TAMANHO_PAGINA), significa que provavelmente ainda tem mais!
    if (['recebidos', 'solicitacoes', 'alertas', 'demandas', 'auditoria'].includes(abaAtiva)) {
      setTemMaisDados(novaBusca.length === TAMANHO_PAGINA);
    }

    setCarregandoDados(false);
    setCarregandoMais(false);
  }

  async function carregarDados() {
    setPaginaAtual(0);
    await carregarDadosDaAba(0, true);
  }

  function handleCarregarMais() {
    if (carregandoMais) return;
    const proximaPagina = paginaAtual + 1;
    setPaginaAtual(proximaPagina);
    setCarregandoMais(true);
    carregarDadosDaAba(proximaPagina, false);
  }

  function handleLogout() {
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('usuario_tipo');
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('supabase_token'); 
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
      responsavel: alerta.responsavel || operador,
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
      exibir_vencimento_email: true,
      tipo_alerta: alerta.tipo_alerta || 'cobranca'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleEditarClienteManual(e) {
    e.preventDefault();
    setSubindo(true);
    const { error } = await supabase
      .from('clientes')
      .update({
        nome_empresa: formEditar.nome_empresa,
        nome_contato: formEditar.nome_contato,
        email: formEditar.email,
        celular: formEditar.celular,
        regime_tributario: formEditar.regime_tributario
      })
      .eq('id', modalEditarCliente.cliente.id);

    if (!error) {
      mostrarToast('Dados da empresa atualizados com sucesso!', 'sucesso');
      setModalEditarCliente({ aberto: false, cliente: null });
      await carregarDados();
    } else {
      mostrarToast('Erro ao atualizar dados: ' + error.message, 'erro');
    }
    setSubindo(false);
  }

  async function handleResetarSenha(cliente) {
    confirmarAcao('Resetar Senha', `Tem certeza que deseja resetar a senha de ${cliente.nome_empresa} para o padrão de fábrica?`, async () => {
      setSubindo(true);
      try {
        const res = await fetch('/api/resetar-senha', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('supabase_token')}` // <-- MÁGICA: Envia o token do Admin
          },
          body: JSON.stringify({ clienteId: cliente.id })
        });
        const data = await res.json();

        if (data.success) {
          mostrarToast(`Senha resetada! A nova senha é: ${data.senhaPadrao}`, 'sucesso');
          await carregarDados(); // Recarrega para atualizar a tela
        } else {
          mostrarToast('Erro ao resetar: ' + data.error, 'erro');
        }
      } catch (err) {
        mostrarToast('Erro de conexão.', 'erro');
      }
      setSubindo(false);
    });
  }

  
  // Função para aplicar Negrito, Itálico e Sublinhado VISUALMENTE (Moderna e Segura)
  function aplicarFormatacaoTexto(tag) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    try {
      // Tenta usar a API moderna de Range
      const range = selection.getRangeAt(0);
      const newNode = document.createElement(tag);
      newNode.appendChild(range.extractContents());
      range.insertNode(newNode);
    } catch (e) {
      // Fallback seguro para navegadores antigos
      let comando = tag === 'b' ? 'bold' : tag === 'i' ? 'italic' : 'underline';
      document.execCommand(comando, false, null);
    }
    
    // Atualiza o estado para salvar no banco
    const editor = document.getElementById('campo-mensagem-alerta');
    if (editor) {
      setFormAlerta({ ...formAlerta, mensagem: editor.innerHTML });
    }
  }

  async function handleCriarAlerta(e) {
    e.preventDefault();
    if (!formAlerta.titulo) return mostrarToast('O Título é obrigatório.', 'erro'); 

    if (formAlerta.tipo_alerta === 'cobranca' && !formAlerta.repetir_mensalmente && !formAlerta.prazo) {
       return mostrarToast('O Prazo p/ Confirmação é obrigatório para cobranças.', 'erro'); 
    }

    if (formAlerta.tipo_alerta === 'envio_doc' && !formAlerta.arquivo_envio) {
       return mostrarToast('É obrigatório anexar um documento para esta opção.', 'erro'); 
    }

    if (formAlerta.repetir_mensalmente && !formAlerta.dia_recorrencia) return mostrarToast('Por favor, informe em que DIA DO MÊS a automação deve enviar o alerta.', 'erro');
    
    if (!formAlerta.repetir_mensalmente && !formAlerta.enviar_agora && !formAlerta.data_envio_programado) {
      return mostrarToast('Se optou por agendar, informe a data em que a publicação deve ocorrer.', 'erro');
    }

    const clientesAlvo = formAlerta.clientesSelecionados;
    if (clientesAlvo.length === 0) return mostrarToast('Nenhum cliente selecionado para o disparo.', 'erro');

    setSubindo(true);
    
    let caminhoArquivoBase = null;
    let nomeArquivoBase = null;
    if (formAlerta.tipo_alerta === 'envio_doc' && formAlerta.arquivo_envio) {
      nomeArquivoBase = formAlerta.arquivo_envio.name;
      
      const formData = new FormData();
      formData.append('file', formAlerta.arquivo_envio);
      
      try {
        const res = await fetch('/api/drive/upload-massa', { method: 'POST', body: formData });
        const resData = await res.json();
        
        if (resData.success) {
          caminhoArquivoBase = `DRIVE:${resData.fileId}`;
        } else {
          setSubindo(false);
          return mostrarToast('Erro no Drive: ' + resData.error, 'erro');
        }
      } catch (err) {
        setSubindo(false);
        return mostrarToast('Erro de conexão ao enviar para o Drive.', 'erro');
      }
    }

    const isRecorrente = formAlerta.repetir_mensalmente;
    const isAgendadoFuturo = !isRecorrente && !formAlerta.enviar_agora;
    const novoStatus = isRecorrente ? 'recorrente' : (isAgendadoFuturo ? 'programado' : 'pendente');

    let dataHoraEnvioFinal = null;
    if (isAgendadoFuturo && formAlerta.data_envio_programado) {
      dataHoraEnvioFinal = formAlerta.data_envio_programado;
      if (formAlerta.hora_envio_programado) dataHoraEnvioFinal += `T${formAlerta.hora_envio_programado}:00`;
    }

    const disparos = clientesAlvo.map(c => ({
      cliente_id: c.id,
      responsavel: formAlerta.responsavel || operador,
      tipo_documento: formAlerta.tipo_documento,
      titulo: formAlerta.titulo,
      mensagem: formAlerta.mensagem,
      prazo: isRecorrente ? null : (formAlerta.prazo || null),
      data_vencimento: isRecorrente ? null : (formAlerta.data_vencimento || null),
      repetir_mensalmente: formAlerta.repetir_mensalmente,
      dia_recorrencia: isRecorrente && formAlerta.dia_recorrencia ? parseInt(formAlerta.dia_recorrencia) : null,
      dia_vencimento: isRecorrente && formAlerta.dia_vencimento ? parseInt(formAlerta.dia_vencimento) : null,
      enviado_email: formAlerta.enviar_email,
      data_envio_programado: dataHoraEnvioFinal,
      status: novoStatus,
      caminho_arquivo: caminhoArquivoBase,
      tipo_alerta: formAlerta.tipo_alerta 
    }));
    
    const { error } = await supabase.from('alertas_clientes').insert(disparos);

    if (!error) {
      let deveEnviarAgora = false;
      
      // MÁGICA: A lógica de decidir se dispara AGORA não pode estar presa ao Checkbox de E-mail!
      // Se não, o Push nunca será disparado se a pessoa quiser apenas notificação pelo celular.
      if (!isRecorrente && formAlerta.enviar_agora) {
        deveEnviarAgora = true;
      } else if (isRecorrente) {
        const hojeDia = new Date().getDate();
        if (parseInt(formAlerta.dia_recorrencia) === hojeDia) deveEnviarAgora = true;
      }

      if (deveEnviarAgora) {
        // 1. Lógica de Envio de E-mails
        if (formAlerta.enviar_email) {
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
                if (formAlerta.tipo_alerta === 'envio_doc') {
                  let urlDoArquivo = '';
                  if (caminhoArquivoBase && caminhoArquivoBase.startsWith('DRIVE:')) {
                    const fileId = caminhoArquivoBase.split('DRIVE:')[1];
                    urlDoArquivo = `https://drive.google.com/file/d/${fileId}/view`;
                  } else if (caminhoArquivoBase) {
                    const { data: publicUrlData } = supabase.storage.from('documentos').getPublicUrl(caminhoArquivoBase);
                    urlDoArquivo = publicUrlData.publicUrl;
                  }

                  await enviarEmailDocumento({
                    to: cli.email,
                    nomeDestinatario: cli.nome_contato || cli.nome_empresa,
                    nomeRemetente: formAlerta.responsavel || operador,
                    tituloEmail: formAlerta.titulo,
                    mensagem: formAlerta.mensagem,
                    nomeArquivo: nomeArquivoBase,
                    urlArquivo: urlDoArquivo,
                    caminhoPasta: 'Enviado diretamente para o seu e-mail.'
                  });
                  
                  await supabase.from('logs_auditoria').insert([{ usuario_nome: formAlerta.responsavel || operador, usuario_tipo: 'interno', acao: 'EMAIL_ENVIADO', detalhe: `Enviou documento por e-mail para ${cli.email}` }]);
                } else {
                  await fetch(urlGoogle, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({
                      cliente_nome: cli.nome_empresa,
                      cliente_email: cli.email,
                      titulo: formAlerta.titulo,
                      mensagem: formAlerta.mensagem.replace(/\n/g, '<br>'),
                      tipo_documento: formAlerta.tipo_documento,
                      exibir_prazo_email: formAlerta.exibir_prazo_email,
                      exibir_vencimento_email: formAlerta.exibir_vencimento_email,
                      prazo_texto: prazoTextoFinal,
                      vencimento_texto: vencimentoTextoFinal
                    })
                  });
                }
              } catch (err) {
                console.error("Erro ao notificar:", err);
              }
            }
          }
        }
        
        // 2. Lógica de Envio de Push Notifications (Agora blindada e independente)
        if (formAlerta.enviar_push) {
           const pushMsg = formAlerta.tipo_alerta === 'envio_doc' 
             ? `Acabamos de disponibilizar o documento "${formAlerta.titulo}" no seu portal.` 
             : 'Você possui uma nova notificação ou cobrança no portal. Acesse para verificar.';
             
           await dispararPush(clientesAlvo.map(c => c.id), formAlerta.tipo_alerta === 'envio_doc' ? 'Novo Documento Recebido' : 'Novo Aviso Disponível', pushMsg);
        }
        
        mostrarToast(`Criado! Disparos realizados para ${clientesAlvo.length} empresa(s).`, 'sucesso');
      } else if (isAgendadoFuturo) {
        mostrarToast(`Agendada para disparo futuro!`, 'sucesso');
      } else if (isRecorrente) {
        mostrarToast(`Automação Mensal Salva!`, 'sucesso');
      } else {
        mostrarToast(`Publicada APENAS no portal.`, 'aviso');
      }

      setFormAlerta({ clientesSelecionados: [], tipo_documento: 'Extratos Bancários', titulo: '', mensagem: '', prazo: '', data_vencimento: '', repetir_mensalmente: false, dia_recorrencia: '', dia_vencimento: '', enviar_email: true, enviar_push: true, enviar_agora: true, data_envio_programado: '', hora_envio_programado: '', arquivo_envio: null, exibir_prazo_email: true, exibir_vencimento_email: true, tipo_alerta: 'cobranca' });
      carregarDados();
    } else {
      mostrarToast('Erro ao criar no sistema: ' + error.message, 'erro');
    }
    setSubindo(false);
  }

  async function handleDisparoPushMassa(e) {
    e.preventDefault();
    if (!formPush.titulo || !formPush.mensagem) return mostrarToast('Título e Mensagem são obrigatórios.', 'erro');
    setSubindo(true);

    let alvosIds = [];
    if (formPush.alvo === 'interno') {
      alvosIds = 'interno'; // Dispara para toda a equipe interna
    } else {
      if (formAlerta.clientesSelecionados.length === 0) {
         setSubindo(false);
         return mostrarToast('Selecione pelo menos um cliente ou mude para o modo Equipe Interna.', 'erro');
      }
      alvosIds = formAlerta.clientesSelecionados.map(c => c.id);
    }

    await dispararPush(alvosIds, formPush.titulo, formPush.mensagem);
    
    // MÁGICA: Grava no Histórico de Auditoria para sabermos quem enviou o Push!
    await supabase.from('logs_auditoria').insert([{
      usuario_nome: operador,
      usuario_tipo: 'interno',
      acao: 'DISPARO_PUSH',
      detalhe: `Enviou alerta "${formPush.titulo}" para o grupo: ${formPush.alvo.toUpperCase()}`
    }]);

    mostrarToast('Notificações push disparadas com sucesso!', 'sucesso');
    setFormPush({ ...formPush, titulo: '', mensagem: '' });
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

  // NOVO: Função para o colaborador corrigir/mover a área do pedido
  // ESTADO DO MODAL DE RESPOSTA A SOLICITAÇÕES
  const [modalRespostaPedido, setModalRespostaPedido] = useState({ aberto: false, pedido: null, texto: '', arquivo: null });

  // FUNÇÃO PARA ENVIAR A RESPOSTA E O ANEXO
  async function handleResponderPedido(e) {
    e.preventDefault();
    setSubindo(true);
    const { pedido, texto, arquivo } = modalRespostaPedido;

    let caminhoArquivo = null;
    let nomeOriginal = null;

    
    if (arquivo) {
      if (arquivo.size > 4.4 * 1024 * 1024) {
        mostrarToast('O arquivo excede o limite de 4.4MB.', 'erro');
        setSubindo(false);
        return;
      }
      const timestamp = Date.now();
      // Salva na pasta do próprio cliente para manter organização e segurança
      caminhoArquivo = `${pedido.cliente_id}/respostas_pedidos/${timestamp}_${arquivo.name}`;
      nomeOriginal = arquivo.name;
      
      const { error: storageError } = await supabase.storage.from('documentos').upload(caminhoArquivo, arquivo);
      if (storageError) {
        mostrarToast('Erro ao anexar arquivo: ' + storageError.message, 'erro');
        setSubindo(false);
        return;
      }
    }

    const { error } = await supabase.from('pedidos_cliente').update({
      status: 'atendido',
      resposta: texto,
      caminho_arquivo_resposta: caminhoArquivo,
      nome_arquivo_resposta: nomeOriginal,
      data_resolucao: new Date().toISOString()
    }).eq('id', pedido.id);

    if (!error) {
      mostrarToast('Solicitação respondida e finalizada com sucesso!', 'sucesso');
      setModalRespostaPedido({ aberto: false, pedido: null, texto: '', arquivo: null });
      await carregarDados();
    } else {
      mostrarToast('Erro ao salvar resposta: ' + error.message, 'erro');
    }
    setSubindo(false);
  }

  // NOVO: Função para mover setor ou atribuir responsável e AVISAR POR E-MAIL
  async function alterarResponsavelOuDepartamento(pedido, campo, valor) {
    setSubindo(true);
    const atualizacao = {};
    atualizacao[campo] = valor;

    const { error } = await supabase.from('pedidos_cliente').update(atualizacao).eq('id', pedido.id);
    
    if (!error) {
      mostrarToast(`Ticket atualizado com sucesso!`, 'sucesso');
      
      // Se mudou o departamento, avisa o departamento inteiro
      if (campo === 'departamento') {
        const emailDestino = MAPA_DEPARTAMENTO_EMAIL[valor];
        if (emailDestino) {
           enviarEmailDemanda({
              to: emailDestino,
              nomeDestinatario: `Equipa ${valor}`,
              nomeRemetente: operador,
              tituloDemanda: `Transferência de Ticket - ${pedido.clientes?.nome_empresa || 'Cliente'}`,
              descricao: `O ticket #${String(pedido.numero_ticket || 0).padStart(5, '0')} foi transferido para o seu departamento.`,
              prazo: 'Aguardando Análise'
           }).catch(()=>{});
           supabase.from('logs_auditoria').insert([{ usuario_nome: operador, usuario_tipo: 'interno', acao: 'EMAIL_ENVIADO', detalhe: `Aviso de ticket transferido para o departamento ${valor}` }]).then();
        }
      }
      
      // Se atribuiu a um colaborador específico, avisa-o diretamente
      if (campo === 'responsavel' && valor !== '') {
        const emailDestino = OBTER_EMAIL_FUNCIONARIO[valor];
        if (emailDestino) {
           enviarEmailDemanda({
              to: emailDestino,
              nomeDestinatario: valor.split(' ')[0],
              nomeRemetente: operador,
              tituloDemanda: `Ticket Atribuído a Você - ${pedido.clientes?.nome_empresa || 'Cliente'}`,
              descricao: `O ticket #${String(pedido.numero_ticket || 0).padStart(5, '0')} foi atribuído a você para resolução.`,
              prazo: 'Aguardando Análise'
           }).catch(()=>{});
           supabase.from('logs_auditoria').insert([{ usuario_nome: operador, usuario_tipo: 'interno', acao: 'EMAIL_ENVIADO', detalhe: `Aviso de ticket atribuído para ${valor}` }]).then();
        }
        
        // MÁGICA: Notificação Push para a equipe
        dispararPush(
          'interno', 
          `Ticket Atribuído: ${valor} 📌`, 
          `O ticket #${String(pedido.numero_ticket || 0).padStart(5, '0')} de ${pedido.clientes?.nome_empresa || 'Cliente'} foi direcionado para você.`
        );
      }

      await carregarDados();
    } else {
      mostrarToast('Erro ao atualizar o ticket.', 'erro');
    }
    setSubindo(false);
  }

  // NOVO: Função para corrigir/mover a área do DOC RECEBIDO
  async function alterarDepartamentoEnvio(id, novoDepartamento) {
    setSubindo(true);
    const { error } = await supabase.from('envios_cliente').update({ departamento: novoDepartamento }).eq('id', id);
    if (!error) {
      mostrarToast(`Documento movido para o setor: ${novoDepartamento}`, 'sucesso');
      await carregarDados();
    } else {
      mostrarToast('Erro ao mover o documento.', 'erro');
    }
    setSubindo(false);
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
        
        supabase.from('logs_auditoria').insert([{ usuario_nome: operador, usuario_tipo: 'interno', acao: 'EMAIL_ENVIADO', detalhe: `Aviso de nova tarefa enviado para ${formDemanda.atribuido_para}` }]).then();
      }

      // MÁGICA: Apita o celular da equipe avisando da nova demanda!
      dispararPush(
        'interno', 
        `Nova Tarefa: ${formDemanda.atribuido_para} ⚡`, 
        `Prioridade ${formDemanda.prioridade}: ${formDemanda.descricao.trim()}`
      );

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

  async function sincronizarDriveClientesAntigos() {
    // 🛑 TRAVA FANTASMA: Checa em background antes de mostrar qualquer loading
    setSubindo(true);
    const { data: checkClientes } = await supabase.from('clientes').select('id').is('id_drive_raiz', null).limit(1);
    const { data: checkPastas } = await supabase.from('pastas_portal').select('id').is('id_drive_pasta', null).limit(1);
    setSubindo(false);

    if ((!checkClientes || checkClientes.length === 0) && (!checkPastas || checkPastas.length === 0)) {
       return mostrarToast('Tudo 100% alinhado! Nenhuma gaveta ou pasta pendente no momento.', 'sucesso');
    }

    confirmarAcao(
      'Sincronizador Inteligente (Google Drive)', 
      'Deseja iniciar a sincronização de múltiplas fases? O sistema criará as estruturas raiz das empresas e, em seguida, fará o mapeamento profundo de todas as subpastas.', 
      async () => {
        setSubindo(true);

        let sucessoCount = 0;
        let subpastasSincronizadas = 0;
        let ultimoErro = null;
        
        // 🧠 O CÉREBRO RÁPIDO: Guarda os IDs gerados agora para evitar o "Bug do 2º Clique"
        const memoriaIdsPastas = {};

        // =========================================================
        // 🚀 FASE 1: SINCRONIZAR CLIENTES NOVOS (RAIZ E SETORES)
        // =========================================================
        const { data: clientesSemDrive, error } = await supabase
          .from('clientes')
          .select('id, nome_empresa, tipo_conta, cpf, cnpj')
          .is('id_drive_raiz', null);

        if (!error && clientesSemDrive && clientesSemDrive.length > 0) {
          const totalC = clientesSemDrive.length;
          
          for (let i = 0; i < totalC; i++) {
            const cli = clientesSemDrive[i];
            
            // 📊 ATUALIZA A TELA (FASE 1)
            setProgressoSync({ fase: 1, totalFases: 2, nomeFase: 'Criando Gavetas Principais', atual: i + 1, total: totalC, texto: cli.nome_empresa, tipo: 'empresas' });

            const temCPF = cli.cpf && cli.cpf.trim() !== '';
            const isSocietario = cli.tipo_conta === 'especiais' || cli.tipo_conta === 'especial' || temCPF;
            const tipoContaReal = isSocietario ? 'especiais' : 'mensalista';

            try {
              const resDrive = await fetch('/api/drive/criar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nomeEmpresa: cli.nome_empresa, tipoConta: tipoContaReal }) 
              });
              const dataDrive = await resDrive.json();
              
              if (dataDrive.success) {
                 const payloadUpdate = { id_drive_raiz: dataDrive.folders.pasta_raiz_cliente };
                 
                 if (isSocietario) {
                   payloadUpdate.id_drive_recebidos = dataDrive.folders.pasta_documentos_recebidos;
                   payloadUpdate.id_drive_enviados = dataDrive.folders.pasta_documentos_enviados;
                   payloadUpdate.id_drive_lixeira = dataDrive.folders.pasta_lixeira;
                 } else {
                   payloadUpdate.id_drive_contabil = dataDrive.folders.pasta_cont_bil;
                   payloadUpdate.id_drive_fiscal = dataDrive.folders.pasta_fiscal;
                   payloadUpdate.id_drive_rh = dataDrive.folders.pasta_dp___rh;
                   payloadUpdate.id_drive_contratos = dataDrive.folders.pasta_contratos; // Gaveta Contratos!
                   payloadUpdate.id_drive_recebidos = dataDrive.folders.pasta_documentos_recebidos;
                   payloadUpdate.id_drive_enviados = dataDrive.folders.pasta_documentos_enviados;
                   payloadUpdate.id_drive_lixeira = dataDrive.folders.pasta_lixeira;
                 }

                 const { error: errUpdate } = await supabase.from('clientes').update(payloadUpdate).eq('id', cli.id);
                 if (errUpdate) { ultimoErro = errUpdate.message; break; }
                 sucessoCount++;
              } else {
                 ultimoErro = dataDrive.error;
                 if (ultimoErro?.toLowerCase().includes('credential') || ultimoErro?.toLowerCase().includes('token')) {
                   mostrarToast(`Erro Fatal de Conexão com o Google!`, 'erro');
                   break; 
                 }
              }
            } catch (e) { ultimoErro = e.message; break; }
          }
        }

        // =========================================================
        // 🚀 FASE 2: SINCRONIZAR SUBPASTAS (RECURSIVIDADE PROFUNDA)
        // =========================================================
        const { data: subpastasPendentesBrutas } = await supabase
          .from('pastas_portal')
          .select('*, clientes!inner(id_drive_raiz, id_drive_contabil, id_drive_fiscal, id_drive_rh, id_drive_recebidos, id_drive_contratos)') 
          .is('id_drive_pasta', null)
          .limit(5000); // 🚀 MÁGICA: Impede o PostgREST de cortar a lista em 1000 itens se houverem muitas subpastas profundas pendentes.

        let subpastasPendentes = [];
        if (subpastasPendentesBrutas && subpastasPendentesBrutas.length > 0) {
          // 🧠 O GRANDE SEGREDO: Algoritmo de Ordenação Topológica
          // Resolve o bug de quando a pasta "Filha" foi criada antes da "Pai" (movida depois)
          const mapPais = {};
          subpastasPendentesBrutas.forEach(sp => { mapPais[sp.id] = sp.parent_id; });
          
          const calcularProfundidade = (id) => {
            let profundidade = 0;
            let idPaiAtual = mapPais[id];
            while (idPaiAtual) {
              profundidade++;
              if (!mapPais[idPaiAtual]) break;
              idPaiAtual = mapPais[idPaiAtual];
              if (profundidade > 30) break; // Trava de segurança anti-loop
            }
            return profundidade;
          };

          // Força a criar: Nível 0 (Raiz) primeiro, depois Nível 1 (Filhos), depois Nível 2 (Netos)...
          subpastasPendentes = subpastasPendentesBrutas.sort((a, b) => calcularProfundidade(a.id) - calcularProfundidade(b.id));
        }

        if (subpastasPendentes && subpastasPendentes.length > 0) {
          const totalP = subpastasPendentes.length;

          for (let j = 0; j < totalP; j++) {
            const sp = subpastasPendentes[j];
            
            // 📊 ATUALIZA A TELA (FASE 2)
            setProgressoSync({ fase: 2, totalFases: 2, nomeFase: 'Mapeando Subpastas', atual: j + 1, total: totalP, texto: sp.nome, tipo: 'pastas/docs' });

            let parentDriveId = null;

            if (!sp.parent_id) {
              // Se não tem pai, a gaveta raiz do setor é o pai
              if (sp.setor === 'contabil') parentDriveId = sp.clientes.id_drive_contabil;
              else if (sp.setor === 'fiscal') parentDriveId = sp.clientes.id_drive_fiscal;
              else if (sp.setor === 'rh') parentDriveId = sp.clientes.id_drive_rh;
              else if (sp.setor === 'contrato') parentDriveId = sp.clientes.id_drive_contratos;
              else parentDriveId = sp.clientes.id_drive_raiz;
            } else {
              // 🧠 Tenta pegar o ID do Pai da memória instantânea primeiro!
              if (memoriaIdsPastas[sp.parent_id]) {
                parentDriveId = memoriaIdsPastas[sp.parent_id];
              } else {
                // Se a pasta pai já existia no banco antes de rodarmos o botão hoje
                const { data: pai } = await supabase.from('pastas_portal').select('id_drive_pasta').eq('id', sp.parent_id).single();
                if (pai && pai.id_drive_pasta) parentDriveId = pai.id_drive_pasta;
              }
            }

            if (parentDriveId) {
              try {
                const resSub = await fetch('/api/drive/criar-subpasta', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nomePasta: sp.nome, parentDriveId })
                });
                const dataSub = await resSub.json();
                
                if (dataSub.success && dataSub.id_drive_pasta) {
                  // 🧠 Salva na memória instantânea caso uma próxima pasta seja filha desta!
                  memoriaIdsPastas[sp.id] = dataSub.id_drive_pasta;
                  await supabase.from('pastas_portal').update({ id_drive_pasta: dataSub.id_drive_pasta }).eq('id', sp.id);
                  subpastasSincronizadas++;
                } else {
                  console.error(`🚨 Erro da API do Google para [${sp.nome}]:`, dataSub.error);
                }
              } catch(e) { console.error('Erro de sistema na subpasta', e); }
            }
          }
        }

        // =========================================================
        // 🎉 FINALIZAÇÃO INTELIGENTE
        // =========================================================
        setProgressoSync({ fase: 'Concluído', totalFases: 2, nomeFase: 'Salvando Dados', atual: 1, total: 1, texto: 'Quase pronto...', tipo: 'finalizado' });

        if (sucessoCount > 0 && subpastasSincronizadas > 0) {
          mostrarToast(`${sucessoCount} empresas e ${subpastasSincronizadas} pastas sincronizadas!`, 'sucesso');
        } else if (sucessoCount > 0) {
          mostrarToast(`${sucessoCount} novas gavetas de empresas geradas no Drive!`, 'sucesso');
        } else if (subpastasSincronizadas > 0) {
          mostrarToast(`${subpastasSincronizadas} subpastas e documentos sincronizados no Drive!`, 'sucesso');
        } else if (ultimoErro) {
          mostrarToast(`Falha no banco ou sistema: ${ultimoErro}`, 'erro');
        }
        
        await carregarDados();
        setProgressoSync(null); 
        setSubindo(false);
      }, 
      'sucesso'
    );
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

  // Função para apenas abrir numa nova aba sem forçar download
  function visualizarDocumento(caminho) {
    if (caminho.startsWith('DRIVE:')) {
      const fileId = caminho.split('DRIVE:')[1];
      window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
      return;
    }
    const { data } = supabase.storage.from('documentos').getPublicUrl(caminho);
    window.open(data.publicUrl, '_blank');
  }

  // Função para forçar o download real
  async function baixarDocumento(caminho, nomeOriginal) {
    setSubindo(true); // Trava a tela para ficheiros grandes
    
    if (caminho.startsWith('DRIVE:')) {
      const fileId = caminho.split('DRIVE:')[1];
      window.open(`https://drive.google.com/uc?export=download&id=${fileId}`, '_blank');
      setSubindo(false);
      return;
    }

    // 1. Faz o download do arquivo bruto (Blob) em vez de apenas pegar o link
    const { data, error } = await supabase.storage.from('documentos').download(caminho);
    
    if (error) {
      mostrarToast('Erro ao baixar o arquivo: ' + error.message, 'erro');
      setSubindo(false);
      return;
    }

    // 2. Cria um link fantasma e força o clique de download real
    const nomeFinal = nomeOriginal || caminho.split('/').pop();
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeFinal; // Este atributo 'download' é o que obriga a baixar
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url); // Limpa a memória do navegador
    
    setSubindo(false);
  }

  // --- 🚀 FUNÇÃO MÁGICA: CLONAR ESTRUTURA BASEADA NO REGIME ---
  async function clonarPastasPadrao(novoClienteId, cnpjBase = '50.457.640/0001-01') {
    try {
      const { data: clienteBase } = await supabase.from('clientes').select('id').eq('cnpj', cnpjBase).single();
      if (!clienteBase) return;

      let { data: pastasBase } = await supabase.from('pastas_portal').select('*').eq('cliente_id', clienteBase.id);
      if (!pastasBase || pastasBase.length === 0) return;

      // 🧠 MÁGICA: Ordenação Topológica
      const mapPais = {};
      pastasBase.forEach(sp => { mapPais[sp.id] = sp.parent_id; });
      const calcularProfundidade = (id) => {
        let profundidade = 0;
        let idPaiAtual = mapPais[id];
        while (idPaiAtual) {
          profundidade++;
          if (!mapPais[idPaiAtual]) break;
          idPaiAtual = mapPais[idPaiAtual];
          if (profundidade > 30) break; // Trava anti-loop
        }
        return profundidade;
      };
      pastasBase = pastasBase.sort((a, b) => calcularProfundidade(a.id) - calcularProfundidade(b.id));

      const mapaIds = {};
      const totalPastas = pastasBase.length;
      
      for (let i = 0; i < totalPastas; i++) {
        const pasta = pastasBase[i];
        
        setProgressoSync({
          fase: 1,
          totalFases: 1,
          nomeFase: 'Estruturando Pastas',
          atual: i + 1,
          total: totalPastas,
          texto: pasta.nome,
          tipo: 'pastas'
        });

        const novaPastaPayload = {
          cliente_id: novoClienteId,
          setor: pasta.setor,
          nome: pasta.nome,
          parent_id: pasta.parent_id ? mapaIds[pasta.parent_id] : null,
          id_drive_pasta: null
        };
        const { data: novaPasta } = await supabase.from('pastas_portal').insert([novaPastaPayload]).select('id').single();
        if (novaPasta) mapaIds[pasta.id] = novaPasta.id;
      }
      
      setProgressoSync(null);
    } catch(e) { 
      console.error('Erro clone pastas:', e); 
      setProgressoSync(null);
    }
  }

  async function inicializarPastasDrive(clienteId, nomeEmpresa, mensagemSucesso, isVan = false) {
    mostrarToast('Criando pastas no Google Drive... Aguarde.', 'aviso');
    try {
      const resDrive = await fetch('/api/drive/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeEmpresa })
      });
      const dataDrive = await resDrive.json();
      
      if (dataDrive.success) {
         await supabase.from('clientes').update({
            id_drive_raiz: dataDrive.folders.pasta_raiz_cliente,
            id_drive_contabil: dataDrive.folders.pasta_cont_bil,
            id_drive_fiscal: dataDrive.folders.pasta_fiscal,
            id_drive_rh: dataDrive.folders.pasta_dp___rh,
            id_drive_contratos: dataDrive.folders.pasta_contratos,
            id_drive_recebidos: dataDrive.folders.pasta_documentos_recebidos,
            id_drive_enviados: dataDrive.folders.pasta_documentos_enviados,
            id_drive_lixeira: dataDrive.folders.pasta_lixeira
         }).eq('id', clienteId);
         
         const cnpjBase = isVan ? '62.379.589/0001-38' : '50.457.640/0001-01';
         await clonarPastasPadrao(clienteId, cnpjBase);
         mostrarToast(mensagemSucesso, 'sucesso');
      }
    } catch (e) {
      console.error("Erro na integração com Drive:", e);
    }
  }

  // Lógica Unificada para criação de cliente MANUAL
  async function handleAdicionarManual(e) {
    e.preventDefault();
    setSubindo(true);

    if(!formManual.nome_empresa || !formManual.documento) {
      mostrarToast('Nome e Documento são obrigatórios.', 'erro');
      setSubindo(false); return;
    }

    const docNumeros = formManual.documento.replace(/\D/g, '');
    if (docNumeros.length < 11) {
      mostrarToast('Documento inválido.', 'erro');
      setSubindo(false); return;
    }

    const isEspecial = tipoAdicionar === 'especiais';
    const campoBusca = isEspecial ? 'cpf' : 'cnpj';
    const isVan = formManual.regime_tributario === 'Lucro Real' || formManual.regime_tributario === 'Lucro Presumido';
    
    const payload = {
      nome_empresa: formManual.nome_empresa,
      nome_contato: formManual.nome_contato,
      email: formManual.email,
      celular: formManual.celular,
      regime_tributario: formManual.regime_tributario,
      tipo_conta: isEspecial ? 'especiais' : 'mensalista',
      senha: encriptarSenha(docNumeros.substring(0, 6)),
      senha_alterada: false,
      clientes_van: isVan
    };
    payload[campoBusca] = formManual.documento;

    const { data: existe } = await supabase.from('clientes').select('id').eq(campoBusca, formManual.documento).single();

    if (existe) {
      mostrarToast('Este cliente (Documento) já existe na base!', 'aviso');
    } else {
      const { data: novoClienteInserido, error } = await supabase.from('clientes').insert([payload]).select().single();
      if (!error && novoClienteInserido) {
        
        await inicializarPastasDrive(novoClienteInserido.id, formManual.nome_empresa, 'Cliente criado e pastas padrão clonadas!', isVan);

        mostrarToast('Cliente cadastrado com sucesso!', 'sucesso');
        setModalAdicionar(false);
        setFormManual({ nome_empresa: '', documento: '', nome_contato: '', email: '', celular: '', regime_tributario: 'Simples Nacional' });
        await carregarDados();
      } else {
        mostrarToast('Erro ao cadastrar: ' + error.message, 'erro');
      }
    }
    setSubindo(false);
  }

  // Inteligência Nova de CSV
  function handleUploadCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
      const lines = event.target.result.split('\n');
      const resultado = [];
      
      for(let i = 1; i < lines.length; i++) {
        const linha = lines[i].trim();
        if (!linha) continue;
        
        let colunas = [];
        let atual = '';
        let dentroDeAspas = false;
        
        let countVirgula = 0;
        let countPontoVirgula = 0;
        for (let j = 0; j < linha.length; j++) {
          if (linha[j] === '"') dentroDeAspas = !dentroDeAspas;
          if (!dentroDeAspas) {
            if (linha[j] === ',') countVirgula++;
            if (linha[j] === ';') countPontoVirgula++;
          }
        }
        const separador = countPontoVirgula > countVirgula ? ';' : ',';
        
        dentroDeAspas = false;
        for (let j = 0; j < linha.length; j++) {
          const char = linha[j];
          if (char === '"') {
            dentroDeAspas = !dentroDeAspas;
          } else if (char === separador && !dentroDeAspas) {
            let val = atual.trim().replace(/^"|"$/g, '').trim().replace(/,$/, '');
            colunas.push(val);
            atual = '';
          } else {
            atual += char;
          }
        }
        let valFinal = atual.trim().replace(/^"|"$/g, '').trim().replace(/,$/, '');
        colunas.push(valFinal);
        
        if (colunas.length >= 2) {
          if (tipoImportacaoCsv === 'especiais') {
            // NOME | CPF | Nome do contato | E-mail do contato | Telefone do contato
            resultado.push({
              nome_empresa: colunas[0] || '',
              cpf: colunas[1] || '',
              nome_contato: colunas[2] || '',
              email: colunas[3] || '',
              celular: colunas[4] || '',
              regime_tributario: 'Simples Nacional',
              tipo_conta: 'especiais'
            });
          } else {
            // EMPRESA | CNPJ | NOME CONTATO | E-MAIL | CELULAR | REGIME TRIBUTÁRIO
            resultado.push({ 
              nome_empresa: colunas[0] || '', 
              cnpj: colunas[1] || '', 
              nome_contato: colunas[2] || '', 
              email: colunas[3] || '', 
              celular: colunas[4] || '', 
              regime_tributario: colunas[5] || 'Simples Nacional',
              tipo_conta: 'mensalista'
            });
          }
        }
      }
      setPreviewCSV(resultado);
      setModalAdicionar(false); // Fecha o modal para mostrar a tabela de pré-visualização
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = null; // Reseta o input
  }

  async function handleDesbloquearSocietario(clienteAlvo) {
    setSubindo(true);
    const payloadProc = {
      cliente_id: clienteAlvo.id,
      titulo: 'Processo Inicial',
      passo: 1,
      valor_honorarios: 0,
      valor_entrada: 0,
      taxas_pendentes: '[]',
      honorario_pago: false
    };
    const { error } = await supabase.from('processos_societarios').insert([payloadProc]);
    if (!error) {
      mostrarToast(`Aba Societário desbloqueada para ${clienteAlvo.nome_empresa}!`, 'sucesso');
      setModalAdicionar(false);
      setBuscaMensalista('');
      await carregarDados();
    } else {
      mostrarToast('Erro ao desbloquear: ' + error.message, 'erro');
    }
    setSubindo(false);
  }

  async function salvarClientesCSV() {
    if (!previewCSV) return;
    setSubindo(true);
    
    for (const cli of previewCSV) { 
      const documentoPrincipal = cli.cnpj || cli.cpf;
      if (!documentoPrincipal) continue;

      const isEspecial = cli.tipo_conta === 'especiais';
      const campoBusca = isEspecial ? 'cpf' : 'cnpj';

      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq(campoBusca, documentoPrincipal)
        .single();

      if (clienteExistente) {
        await supabase
          .from('clientes')
          .update({
            nome_empresa: cli.nome_empresa,
            nome_contato: cli.nome_contato,
            email: cli.email,
            celular: cli.celular,
            regime_tributario: cli.regime_tributario,
            tipo_conta: cli.tipo_conta
          })
          .eq('id', clienteExistente.id);
      } else {
        const senhaGerada = documentoPrincipal.replace(/\D/g, '').substring(0, 6);
        const isVan = cli.regime_tributario === 'Lucro Real' || cli.regime_tributario === 'Lucro Presumido';
        const clienteNovo = {
          ...cli,
          senha: encriptarSenha(senhaGerada),
          senha_alterada: false,
          clientes_van: isVan
        };
        const { data: novoCsv } = await supabase.from('clientes').insert([clienteNovo]).select('id').single(); 
        
        // 🚀 MÁGICA: Clona a árvore baseada no regime
        if (novoCsv) {
            const cnpjBase = isVan ? '62.379.589/0001-38' : '50.457.640/0001-01';
            await clonarPastasPadrao(novoCsv.id, cnpjBase);
        }
      }
    }

    mostrarToast('Planilha processada! Novas empresas/pessoas adicionadas e dados antigos atualizados.', 'sucesso');
    setPreviewCSV(null); 
    await carregarDados();
    setSubindo(false);
  }

  async function aprovarCliente(solicitacao) {
    setSubindo(true);

    if (solicitacao.tipo_solicitacao === 'vinculo_existente') {
      // 1. O CNPJ já existe! Vamos apenas cruzar e conectar as duas contas.
      const { data: origem } = await supabase.from('clientes').select('id, empresas_vinculadas').eq('id', solicitacao.vinculo_origem_id).single();
      const { data: destino } = await supabase.from('clientes').select('id, empresas_vinculadas').eq('cnpj', solicitacao.cnpj).single();

      if (origem && destino) {
        const vincOrigem = origem.empresas_vinculadas || [];
        const vincDestino = destino.empresas_vinculadas || [];

        if (!vincOrigem.includes(destino.id)) vincOrigem.push(destino.id);
        if (!vincDestino.includes(origem.id)) vincDestino.push(origem.id);

        await supabase.from('clientes').update({ empresas_vinculadas: vincOrigem }).eq('id', origem.id);
        await supabase.from('clientes').update({ empresas_vinculadas: vincDestino }).eq('id', destino.id);
      }

      await supabase.from('logs_auditoria').insert([{ usuario_nome: operador, usuario_tipo: 'interno', acao: 'VINCULO_APROVADO', detalhe: `Aprovou o vínculo entre as contas de ${solicitacao.nome_empresa}` }]);
      await supabase.from('solicitacoes_cadastro').delete().eq('id', solicitacao.id);

    } else {
      // 2. É uma Conta Nova ou um "Novo Vínculo" (Cria a conta do zero)
      const documentoSeguro = solicitacao.cnpj || solicitacao.cpf || '';
      const senhaGerada = documentoSeguro.replace(/\D/g, '').substring(0, 6);
      const isVan = solicitacao.regime_tributario === 'Lucro Real' || solicitacao.regime_tributario === 'Lucro Presumido';
      
      const { data: novoCliente, error } = await supabase.from('clientes').insert([{ 
        nome_empresa: solicitacao.nome_empresa, 
        cnpj: solicitacao.cnpj, 
        cpf: solicitacao.cpf, 
        tipo_conta: solicitacao.tipo_conta || 'mensalista', 
        nome_contato: solicitacao.nome_contato, 
        email: solicitacao.email ? solicitacao.email.trim().toLowerCase() : '', 
        celular: solicitacao.celular, 
        regime_tributario: solicitacao.regime_tributario, 
        senha: encriptarSenha(senhaGerada), 
        senha_alterada: false,
        clientes_van: isVan
      }]).select().single();

      if (!error && novoCliente) { 
        
        await inicializarPastasDrive(novoCliente.id, solicitacao.nome_empresa, 'Cliente ativado e pastas padrão clonadas!', isVan);

        // Se a pessoa pediu para criar essa conta NOVA mas atrelada à conta DELE, faz a conexão:
        if (solicitacao.tipo_solicitacao === 'novo_vinculo' && solicitacao.vinculo_origem_id) {
           const { data: origem } = await supabase.from('clientes').select('id, empresas_vinculadas').eq('id', solicitacao.vinculo_origem_id).single();
           if (origem) {
              const vincOrigem = origem.empresas_vinculadas || [];
              if (!vincOrigem.includes(novoCliente.id)) vincOrigem.push(novoCliente.id);
              await supabase.from('clientes').update({ empresas_vinculadas: vincOrigem }).eq('id', origem.id);
              await supabase.from('clientes').update({ empresas_vinculadas: [origem.id] }).eq('id', novoCliente.id);
           }
        }

        await supabase.from('logs_auditoria').insert([{ usuario_nome: operador, usuario_tipo: 'interno', acao: 'CADASTRO_APROVADO', detalhe: `Aprovou o acesso da empresa ${solicitacao.nome_empresa} (CNPJ: ${solicitacao.cnpj})` }]);
        await supabase.from('solicitacoes_cadastro').delete().eq('id', solicitacao.id); 
      } else if (error) {
        mostrarToast('Erro ao criar conta: ' + error.message, 'erro');
      }
    }
    
    await carregarDados(); 
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
    const clienteAlvo = clientes.find(c => c.id === id);
    const isCoringa = clienteAlvo?.cnpj?.replace(/\D/g, '') === '50457640000101' || clienteAlvo?.nome_empresa?.toLowerCase().includes('lsprado');

    if (isCoringa) {
      confirmarAcao(
        'Acesso Negado 🛑', 
        '(conta mestra, deletar isso vai quebrar o sistema, mas vc nao vai fazer mesmo pq eu bloqueia essa funcao rs)', 
        () => {}, 
        'aviso',
        'Cancelar',
        'TÁ BOM, CANCELAR'
      );
      return; 
    }

    confirmarAcao('Excluir Cliente', 'Essa ação é IRREVERSÍVEL. Todos os dados desta empresa serão apagados.', async () => {
      setSubindo(true);
      await supabase.from('clientes').delete().eq('id', id); 
      await carregarDados(); 
      setSubindo(false);
    });
  }

  // ===============================================
  // AÇÕES EM LOTE PARA DOCS RECEBIDOS
  // ===============================================
  function toggleSelecionarTodosRecebidos(e) {
    if (e.target.checked) setSelecionadosRecebidos(recebidos.map(d => d.id));
    else setSelecionadosRecebidos([]);
  }

  function toggleSelecionarRecebido(id) {
    if (selecionadosRecebidos.includes(id)) {
      setSelecionadosRecebidos(selecionadosRecebidos.filter(docId => docId !== id));
    } else {
      setSelecionadosRecebidos([...selecionadosRecebidos, id]);
    }
  }

  function handleAceitarEmLote() {
    confirmarAcao('Mover Documentos', `Deseja mover ${selecionadosRecebidos.length} documento(s) para o histórico?`, async () => {
      setSubindo(true);
      const { error } = await supabase.from('envios_cliente').update({ status: 'historico' }).in('id', selecionadosRecebidos);
      if (!error) {
        setSelecionadosRecebidos([]);
        await carregarDados();
        mostrarToast(`${selecionadosRecebidos.length} documento(s) arquivado(s).`, 'sucesso');
      }
      setSubindo(false);
    }, 'sucesso');
  }

  function handleExcluirEmLote() {
    confirmarAcao('Apagar Documentos', `Tem certeza que deseja apagar permanentemente ${selecionadosRecebidos.length} documento(s)?`, async () => {
      setSubindo(true);
      const docsParaExcluir = recebidos.filter(d => selecionadosRecebidos.includes(d.id));
      const caminhos = docsParaExcluir.map(d => d.caminho_storage);

      if (caminhos.length > 0) await supabase.storage.from('documentos').remove(caminhos);
      await supabase.from('envios_cliente').delete().in('id', selecionadosRecebidos);

      setSelecionadosRecebidos([]);
      await carregarDados();
      mostrarToast(`Documentos excluídos.`, 'sucesso');
      setSubindo(false);
    });
  }

  async function handleBaixarEmLote() {
    const docsParaBaixar = recebidos.filter(d => selecionadosRecebidos.includes(d.id));
    if (docsParaBaixar.length === 0) return;
    
    setSubindo(true); // Trava a tela enquanto baixa os lotes
    mostrarToast(`A preparar ${docsParaBaixar.length} ficheiro(s) para download real...`, 'aviso');
    
    for (const doc of docsParaBaixar) {
      // Baixa o Blob de cada arquivo silenciosamente
      const { data } = await supabase.storage.from('documentos').download(doc.caminho_storage);
      
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.nome_original || doc.caminho_storage.split('/').pop();
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      // Pequeno intervalo para o PC do funcionário não travar com 30 downloads simultâneos
      await new Promise(r => setTimeout(r, 600)); 
    }
    
    setSubindo(false);
    mostrarToast('Transferências concluídas com sucesso!', 'sucesso');
  }

  const eGestor = operador === 'Victor (Admin)' || operador === 'Lucas (Financeiro)';
  
  // =======================================================
  // LÓGICA DE TRIAGEM DE SOLICITAÇÕES POR DEPARTAMENTO
  // =======================================================
  let departamentosVisiveis = [];
  if (operador.includes('Contábil')) departamentosVisiveis.push('Contábil');
  if (operador.includes('Fiscal')) departamentosVisiveis.push('Fiscal');
  if (operador.includes('RH')) departamentosVisiveis.push('DP / RH');
  if (operador.includes('Societário')) departamentosVisiveis.push('Societário', 'Legalização');
  if (operador.includes('Suporte')) departamentosVisiveis.push('Outros', 'Outros / Dúvida Geral', null, ''); 
  // Nota: "null" garante que pedidos antigos (sem área) caiam para o suporte.

  // Filtra as solicitações com base em quem está logado
  const pedidosVisiveis = eGestor 
    ? pedidosCliente 
    : pedidosCliente.filter(p => departamentosVisiveis.includes(p.departamento) || p.responsavel === operador);

  // 🚀 MÁGICA: Agora TODOS os funcionários veem TODOS os documentos recebidos, independente do setor!
  // Isso evita que um documento enviado para o setor errado pelo cliente fique "perdido".
  const recebidosVisiveis = Array.isArray(recebidos) ? recebidos : [];

  const demandasVisiveis = demandas.filter(d => eGestor || d.atribuido_para === operador || d.criado_por === operador);
  const demandasMinhasPendentes = demandasVisiveis.filter(d => d.atribuido_para === operador && d.status === 'pendente').length;
  // NOVO: Filtrar alertas para não poluir a tela. Gestores veem tudo, responsáveis veem os seus.
  const alertasPermitidos = eGestor ? alertas : alertas.filter(a => a.responsavel === operador || !a.responsavel);
  const alertasPendentes = alertasPermitidos.filter(a => a.status === 'pendente' && (a.tipo_alerta === 'cobranca' || !a.tipo_alerta)).length;
  
  const demandasPendentesAgrupadas = LISTA_COLABORADORES.map(colab => {
    return { nome: colab, tarefas: demandasVisiveis.filter(d => d.status === 'pendente' && d.atribuido_para === colab) }
  }).filter(g => g.tarefas.length > 0);

  const demandasConcluidas = demandasVisiveis.filter(d => d.status === 'concluído');

  const alertasFiltradosGerais = alertasPermitidos.filter(a => {
    const termo = buscaAlerta.toLowerCase();
    const nomeEmpresa = a.clientes?.nome_empresa?.toLowerCase() || '';
    const tituloAlerta = a.titulo?.toLowerCase() || '';
    return nomeEmpresa.includes(termo) || tituloAlerta.includes(termo);
  });

  const alertasHistoricoCobrancas = alertasFiltradosGerais.filter(a => a.status !== 'recorrente' && a.status !== 'programado' && (a.tipo_alerta === 'cobranca' || !a.tipo_alerta));
  const alertasHistoricoAvisos = alertasFiltradosGerais.filter(a => a.status !== 'recorrente' && a.status !== 'programado' && a.tipo_alerta === 'lembrete');
  const alertasHistoricoEnvios = alertasFiltradosGerais.filter(a => a.status !== 'recorrente' && a.status !== 'programado' && a.tipo_alerta === 'envio_doc');
  const alertasAgendados = alertasFiltradosGerais.filter(a => a.status === 'programado');
  const alertasRecorrentes = alertasFiltradosGerais.filter(a => a.status === 'recorrente');
  const alertasAtrasados = alertasHistoricoCobrancas.filter(a => {
    if (a.status === 'respondido') return false;
    if (!a.prazo) return false;
    const calc = calcularPrazo(a.prazo);
    return calc.texto.includes('Atrasado');
  });

  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => {
      const termo = buscaCliente.toLowerCase().trim();
      
      if (termo === 'clientesvan') return c.clientes_van === true;

      return (
        (c.nome_empresa?.toLowerCase() || '').includes(termo) || 
        (c.nome_contato?.toLowerCase() || '').includes(termo) || 
        (c.cnpj || '').includes(termo) || 
        (c.cpf || '').includes(termo) || 
        (c.email?.toLowerCase() || '').includes(termo) ||
        (c.regime_tributario?.toLowerCase() || '').includes(termo)
      );
    });
  }, [clientes, buscaCliente]);

  const clientesParaAlerta = clientes.filter(c =>
    c.nome_empresa?.toLowerCase().includes(buscaAlertaInput.toLowerCase()) &&
    !formAlerta.clientesSelecionados.find(sel => sel.id === c.id)
  );

  // FILTRO INTELIGENTE PARA A ABA DE TICKETS (Busca por Nome, Ticket, Data ou Responsável)
  const pedidosFiltrados = pedidosVisiveis.filter(p => {
    const termo = buscaPedido.toLowerCase();
    const numTicket = String(p.numero_ticket || 0).padStart(5, '0');
    const nomeEmp = p.clientes?.nome_empresa?.toLowerCase() || '';
    const responsavelTicket = p.responsavel?.toLowerCase() || '';
    const dataFormat = new Date(p.criado_em).toLocaleDateString('pt-BR');
    
    return nomeEmp.includes(termo) || numTicket.includes(termo) || dataFormat.includes(termo) || responsavelTicket.includes(termo);
  });

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

    if (agruparPorTitulo) {
      const agrupado = {};
      lista.forEach(a => {
        const t = a.titulo || 'Sem Título';
        if (!agrupado[t]) agrupado[t] = [];
        agrupado[t].push(a);
      });

      return (
        <div className="divide-y divide-zinc-800/50">
          {Object.keys(agrupado).sort().map(titulo => (
            <div key={titulo} className="flex flex-col">
              <button onClick={() => setTituloExpandido(tituloExpandido === titulo ? null : titulo)} className="w-full flex items-center justify-between p-4 bg-[#1b263b] hover:bg-zinc-800/50 transition focus:outline-none">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="font-bold text-white text-sm">{titulo}</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">{agrupado[titulo].length} registo(s)</span>
                </div>
                <span className="text-zinc-500 text-xs font-bold">{tituloExpandido === titulo ? 'Ocultar ▲' : 'Ver Histórico ▼'}</span>
              </button>
              {tituloExpandido === titulo && (
                <div className="p-4 bg-[#0d1b2a]/60 border-t border-zinc-800/50 space-y-3">
                  {agrupado[titulo].map(alerta => renderCard(alerta))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return <div className="divide-y divide-zinc-800">{lista.map(alerta => renderCard(alerta))}</div>;
  };

  // ======================================================================
  // CÁLCULO DE SAÚDE DE ARMAZENAMENTO (Estimativa Profissional)
  // Baseado na cota básica de segurança (2GB = 2048MB)
  // Assumindo média de 1.5MB SOMENTE para arquivos salvos no Supabase Backup
  // ======================================================================
  const LIMITE_ARMAZENAMENTO_MB = 2048; 
  const MEDIA_TAMANHO_ARQUIVO_MB = 1.5; 
  const usoArmazenamentoMB = totalArquivosSupabase * MEDIA_TAMANHO_ARQUIVO_MB;
  const porcentagemUso = Math.min((usoArmazenamentoMB / LIMITE_ARMAZENAMENTO_MB) * 100, 100);
  const circunferencia = 2 * Math.PI * 36;
  const offsetDash = circunferencia - (porcentagemUso / 100) * circunferencia;
  
  let corGradienteInicio = "#10b981"; // Verde Seguro
  let corGradienteFim = "#059669";    
  
  if (porcentagemUso >= 90) {
    corGradienteInicio = "#ef4444"; // Vermelho Alerta Máximo
    corGradienteFim = "#b91c1c";    
  } else if (porcentagemUso >= 70) {
    corGradienteInicio = "#f59e0b"; // Amarelo/Laranja Atenção
    corGradienteFim = "#d97706";    
  }

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

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white p-6 md:p-12 font-sans relative">
      {/* =======================================================
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
            {/* NOVO BOTÃO INNOVCHAT PREMIUM */}
            <button onClick={() => { setAbaAtiva('chat'); rolarPara('conteudo-admin'); setMensagensNaoLidas(0); }} className={`flex-1 sm:flex-none justify-center text-xs px-4 py-2.5 sm:py-2 rounded-lg transition-all font-black border flex items-center gap-2 shadow-lg relative ${abaAtiva === 'chat' ? 'bg-yellow-500 text-[#0d1b2a] border-yellow-500 scale-105' : 'bg-[#d4af37] text-[#0d1b2a] border-[#d4af37] hover:bg-yellow-500 hover:scale-105'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              InnovChat
              {mensagensNaoLidas > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce shadow-[0_0_10px_rgba(239,68,68,0.8)] border border-red-400">
                  {mensagensNaoLidas}
                </span>
              )}
            </button>
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
              <div className="overflow-x-auto w-full mb-6">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 uppercase">
                      <th className="pb-2">Nome/Empresa</th><th className="pb-2">Documento</th><th className="pb-2">E-mail</th><th className="pb-2">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewCSV.map((c, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 text-zinc-200">
                        <td className="py-2 font-medium">{c.nome_empresa}</td><td className="py-2">{c.cnpj || c.cpf}</td><td className="py-2">{c.email}</td>
                        <td className="py-2 text-[#d4af37]">{c.tipo_conta === 'especiais' ? 'Societário' : 'Mensalista'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setPreviewCSV(null)} className="px-4 py-2 bg-zinc-800 rounded font-bold text-sm">Cancelar</button>
                <button onClick={() => salvarClientesCSV()} className="px-5 py-2 bg-[#d4af37] text-[#0d1b2a] rounded font-bold text-sm hover:bg-yellow-500">Salvar Tudo ({previewCSV.length} empresas)</button>
              </div>
            </div>
          </div>
        )}

        {!notificacoesAtivas && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/30 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg animate-in fade-in slide-in-from-top-4">
             <div className="flex items-center gap-4">
                <span className="text-4xl animate-bounce drop-shadow-lg">🔔</span>
                <div>
                   <h3 className="text-blue-400 font-black text-sm uppercase tracking-wide">Notificações Desativadas</h3>
                   <p className="text-xs text-blue-200/80 mt-1">Ative para receber alertas sonoros e na tela sobre novas demandas e documentos dos clientes.</p>
                </div>
             </div>
             <button onClick={async () => { setPedindoPush(true); const sucesso = await inscreverAparelho(localStorage.getItem('usuario_id'), 'interno'); if(sucesso){ setNotificacoesAtivas(true); mostrarToast('Notificações ativadas com sucesso!', 'sucesso'); } else { mostrarToast('Permissão negada. Verifique o cadeado na barra do navegador.', 'erro'); } setPedindoPush(false); }} disabled={pedindoPush} className="w-full sm:w-auto bg-blue-500 text-white font-black px-6 py-3.5 rounded-lg text-xs hover:bg-blue-400 transition shadow-[0_0_15px_rgba(59,130,246,0.4)] whitespace-nowrap">
                {pedindoPush ? 'A aguardar permissão...' : 'Ativar Alertas'}
             </button>
          </div>
        )}

        {/* GRADE DE CARDS DO DASHBOARD */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
          <button onClick={() => { setAbaAtiva('ativos'); rolarPara('conteudo-admin'); }} className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 shadow-xl ${abaAtiva === 'ativos' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800/80 hover:border-zinc-700'}`}>
            <div className="flex justify-between w-full items-start">
              <IconUsers />
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${abaAtiva === 'ativos' ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-[#0d1b2a] text-zinc-400'}`}>{clientes.length}</span>
            </div>
            <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Clientes</h3></div>
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
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold transition-all ${recebidosVisiveis.length > 0 ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse' : 'bg-[#0d1b2a] text-zinc-500'}`}>{recebidosVisiveis.length}</span>
            </div>
            <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Docs Recebidos</h3></div>
          </button>

          <button onClick={() => { setAbaAtiva('solicitacoes'); setSubAbaTicket('pendentes'); rolarPara('conteudo-admin'); }} className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 shadow-xl ${abaAtiva === 'solicitacoes' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800/80 hover:border-zinc-700'}`}>
            <div className="flex justify-between w-full items-start">
              <IconChat />
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold transition-all ${pedidosVisiveis.filter(p => p.status === 'pendente').length > 0 ? 'bg-[#d4af37] text-[#0d1b2a] shadow-[0_0_12px_rgba(212,175,55,0.8)] animate-pulse' : 'bg-[#0d1b2a] text-zinc-500'}`}>{pedidosVisiveis.filter(p => p.status === 'pendente').length}</span>
            </div>
            <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Tickets Abertos</h3></div>
          </button>
          
          <button onClick={() => { setAbaAtiva('alertas'); rolarPara('conteudo-admin'); }} className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-28 shadow-xl ${abaAtiva === 'alertas' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800/80 hover:border-zinc-700'}`}>
            <div className="flex justify-between w-full items-start">
              <IconBell />
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold transition-all ${alertasPendentes > 0 ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.8)] animate-pulse' : 'bg-[#0d1b2a] text-zinc-500'}`}>{alertasPendentes}</span>
            </div>
            <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Cobranças/Avisos</h3></div>
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
        
        {/* NOVA ABA: INNOVCHAT (RODANDO EM BACKGROUND) */}
        <InnovChat 
          operador={operador} 
          onFechar={() => setAbaAtiva('ativos')} 
          isVisivel={abaAtiva === 'chat'} 
          setMensagensNaoLidas={setMensagensNaoLidas} 
        />

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
                      <h3 className="font-bold text-white text-sm">{cli.nome_empresa || cli.nome_contato}</h3>
                      <p className="text-xs text-zinc-400">{cli.cnpj ? `CNPJ: ${cli.cnpj}` : `CPF: ${cli.cpf || 'Não informado'}`} | Contato: {cli.nome_contato}</p>
                    </div>
                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 min-w-[200px] bg-[#0d1b2a] p-3 rounded-lg border border-zinc-800/50">
                      <span className="text-xs font-bold text-zinc-500 uppercase">Senha Atual:</span>
                      <div className="relative flex items-center gap-2">
                        {cli.senha_alterada ? (
                          <>
                            <span className="font-mono font-bold tracking-widest text-xs px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 select-none">
                              Personalizada
                            </span>
                            <button 
                              onClick={() => handleResetarSenha(cli)}
                              className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white px-2 py-1.5 rounded font-bold transition shadow-sm"
                              title="Resetar para o Padrão de Fábrica"
                            >
                              Resetar
                            </button>
                          </>
                        ) : (
                          <>
                            <span 
                              onClick={() => {
                                const documento = cli.cnpj || cli.cpf || '';
                                const senhaPadrao = documento.replace(/\D/g, '').substring(0, 6);
                                if (senhaPadrao) {
                                  navigator.clipboard.writeText(senhaPadrao);
                                  setSenhaCopiadaId(cli.id); 
                                  setTimeout(() => setSenhaCopiadaId(null), 2000); 
                                }
                              }}
                              title="Clique para copiar a senha Padrão"
                              className="cursor-pointer hover:scale-105 active:scale-95 font-mono font-bold tracking-widest text-sm px-2 py-1 rounded transition-all shadow-sm bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
                            >
                              {(cli.cnpj || cli.cpf) ? (cli.cnpj || cli.cpf).replace(/\D/g, '').substring(0, 6) : 'Não Definida'}
                            </span>
                            
                            {senhaCopiadaId === cli.id && (
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-emerald-500 text-[#0d1b2a] text-[10px] font-extrabold px-2.5 py-1 rounded shadow-[0_0_10px_rgba(16,185,129,0.5)] pointer-events-none whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                                Copiada! ✓
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-emerald-500"></span>
                              </span>
                            )}
                          </>
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
            ABA NOVA: VISUALIZADOR DE LOGS E SAÚDE DO SISTEMA
        ========================================== */}
        {abaAtiva === 'auditoria' && (
          <div className="space-y-6">
            
            {/* DASHBOARD DE SAÚDE DO SISTEMA E SERVIDORES */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* CARD 1: CLIENTES */}
              <div className="bg-[#1b263b] p-5 sm:p-6 rounded-xl border border-zinc-800 shadow-xl flex flex-col justify-between">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Total de Clientes</p>
                
                <div className="flex items-baseline gap-3 mb-4">
                  <p className="text-5xl font-black text-white">{clientes.length}</p>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded uppercase tracking-widest">Ativos</span>
                </div>

                {/* Divisão Mensalistas vs Societário */}
                <div className="flex gap-2 flex-wrap border-t border-zinc-800/80 pt-3">
                  <div className="flex items-center gap-1.5 bg-[#0d1b2a] border border-[#d4af37]/30 px-2 py-1 rounded-md flex-1 min-w-max">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Mensalistas:</span>
                    <span className="text-[11px] font-black text-[#d4af37]">
                      {clientes.filter(c => !(c.tipo_conta === 'especiais' || c.tipo_conta === 'especial' || (c.cpf && c.cpf.trim() !== ''))).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#0d1b2a] border border-purple-500/30 px-2 py-1 rounded-md flex-1 min-w-max">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Societário:</span>
                    <span className="text-[11px] font-black text-purple-400">
                      {clientes.filter(c => c.tipo_conta === 'especiais' || c.tipo_conta === 'especial' || (c.cpf && c.cpf.trim() !== '')).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 2: ESPAÇO E MEMÓRIA (O GRÁFICO CIRCULAR PREMIUM) */}
              <div className="bg-[#1b263b] p-5 rounded-xl border border-zinc-800 shadow-xl flex flex-col sm:flex-row items-center gap-5 md:col-span-2 relative overflow-hidden">
                {/* Gráfico Circular SVG */}
                <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
                    <defs>
                      <linearGradient id="gradienteUso" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={corGradienteInicio} />
                        <stop offset="100%" stopColor={corGradienteFim} />
                      </linearGradient>
                    </defs>
                    <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800/80" />
                    <circle cx="48" cy="48" r="36" stroke="url(#gradienteUso)" strokeWidth="8" fill="transparent" strokeDasharray={circunferencia} strokeDashoffset={offsetDash} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-white">{Math.round(porcentagemUso)}%</span>
                  </div>
                </div>
                
                {/* Textos do Espaço */}
                <div className="flex-1 text-center sm:text-left w-full">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Espaço Usado (Supabase DB)</p>
                  <p className="text-2xl font-black text-white mb-1">
                    {usoArmazenamentoMB < 1024 ? usoArmazenamentoMB.toFixed(0) + ' MB' : (usoArmazenamentoMB / 1024).toFixed(2) + ' GB'}
                    <span className="text-xs text-zinc-500 font-normal ml-1">/ 2 GB (Backup)</span>
                  </p>
                  <div className="flex flex-col xl:flex-row gap-2 mt-3 justify-center sm:justify-start">
                    <div className="flex items-center gap-1.5 bg-[#0d1b2a] border border-[#34d399]/30 px-2 py-1 rounded-md w-max">
                      <span className="w-2 h-2 rounded-full bg-[#34d399]"></span>
                      <span className="text-[10px] text-zinc-300"><strong className="text-white">{totalArquivosSupabase}</strong> no Supabase</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#0d1b2a] border border-[#d4af37]/30 px-2 py-1 rounded-md w-max">
                      <span className="w-2 h-2 rounded-full bg-[#d4af37]"></span>
                      <span className="text-[10px] text-zinc-300"><strong className="text-white">{totalArquivosDrive}</strong> no G. Drive</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* CARD 3: ATALHOS PARA OS SERVIDORES */}
              <div className="grid grid-cols-1 gap-3">

                {/* NOVO BOTÃO DO DRIVE COM MÁSCARA DOURADA (Sempre visível para admins) */}
                <button onClick={sincronizarDriveClientesAntigos} className="bg-[#0d1b2a] hover:bg-[#1b263b] p-3.5 rounded-xl border border-[#d4af37]/20 hover:border-[#d4af37] shadow-md flex items-center gap-3 transition-all group w-full text-left">
                  <div style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', flexShrink: 0 }} className="flex items-center justify-center bg-zinc-800 rounded-full border border-zinc-700 shadow-inner group-hover:scale-110 transition-transform">
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#d4af37',
                      WebkitMaskImage: 'url("https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg")',
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskImage: 'url("https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg")',
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center'
                    }}></div>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-[#d4af37] uppercase truncate">Sincronizar G. Drive</p>
                    <p className="text-[10px] text-zinc-500 truncate">Esvaziar fila de pastas</p>
                  </div>
                </button>

              {eGestor && (
                <>
                  {/* BOTÃO SUPABASE COM MÁSCARA */}
                  <a href="https://supabase.com/dashboard/projects" target="_blank" rel="noopener noreferrer" className="bg-[#0d1b2a] hover:bg-[#1b263b] p-3.5 rounded-xl border border-emerald-500/20 hover:border-emerald-500 shadow-md flex items-center gap-3 transition-all group">
                    <div style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', flexShrink: 0 }} className="flex items-center justify-center bg-zinc-800 rounded-full border border-zinc-700 shadow-inner group-hover:scale-110 transition-transform">
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#34d399',
                        WebkitMaskImage: 'url("https://cdn.simpleicons.org/supabase")',
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: 'url("https://cdn.simpleicons.org/supabase")',
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center'
                      }}></div>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-bold text-emerald-400 uppercase truncate">Banco de Dados</p>
                      <p className="text-[10px] text-zinc-500 truncate">Painel Supabase</p>
                    </div>
                  </a>

                  {/* BOTÃO VERCEL COM MÁSCARA */}
                  <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="bg-[#0d1b2a] hover:bg-[#1b263b] p-3.5 rounded-xl border border-blue-500/20 hover:border-blue-500 shadow-md flex items-center gap-3 transition-all group">
                    <div style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', flexShrink: 0 }} className="flex items-center justify-center bg-zinc-800 rounded-full border border-zinc-700 shadow-inner group-hover:scale-110 transition-transform">
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#60a5fa',
                        WebkitMaskImage: 'url("https://cdn.simpleicons.org/vercel")',
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: 'url("https://cdn.simpleicons.org/vercel")',
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center'
                      }}></div>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-bold text-blue-400 uppercase truncate">Servidor (Banda)</p>
                      <p className="text-[10px] text-zinc-500 truncate">Painel Vercel</p>
                    </div>
                  </a>
                </>
              )}
            </div>
          </div>

            {/* MONITORAMENTO DE COTA RESEND */}
            <div className="bg-[#1b263b] p-6 rounded-xl border border-zinc-800 shadow-xl mb-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <IconMail /> Consumo da Cota de E-mails (Resend)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Monitoramento em tempo real dos limites do plano gratuito (100 diários / 3.000 mensais).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0d1b2a] p-4 rounded-lg border border-zinc-800/80">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Limite Diário</span>
                    <span className={`text-lg font-black ${emailsEnviadosHoje >= 80 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                      {emailsEnviadosHoje} <span className="text-xs text-zinc-500 font-medium">/ 100</span>
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 mb-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${emailsEnviadosHoje >= 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((emailsEnviadosHoje / 100) * 100, 100)}%` }}></div>
                  </div>
                  {emailsEnviadosHoje >= 80 && <p className="text-[10px] text-red-400 font-bold">⚠️ Atenção: Limite diário prestes a esgotar!</p>}
                </div>

                <div className="bg-[#0d1b2a] p-4 rounded-lg border border-zinc-800/80">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Limite Mensal</span>
                    <span className={`text-lg font-black ${emailsEnviadosMes >= 2500 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                      {emailsEnviadosMes} <span className="text-xs text-zinc-500 font-medium">/ 3000</span>
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 mb-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${emailsEnviadosMes >= 2500 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((emailsEnviadosMes / 3000) * 100, 100)}%` }}></div>
                  </div>
                  {emailsEnviadosMes >= 2500 && <p className="text-[10px] text-red-400 font-bold">⚠️ Atenção: Limite mensal prestes a esgotar!</p>}
                </div>
              </div>
            </div>

            {/* TABELA DE LOGS */}
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
          </div>
        )}

        {/* =======================================================
            CONTEÚDO DAS ABAS
        ======================================================= */}
        
        {abaAtiva === 'ativos' && (
          <div className="space-y-6">
            <div className="bg-[#1b263b] p-4 rounded-xl border border-zinc-800 shadow-lg flex flex-col gap-4">
              
              {/* AS NOVAS SUB-ABAS (MENSALISTAS VS ESPECIAIS) */}
              <div className="grid grid-cols-2 sm:flex bg-[#0d1b2a] p-1.5 rounded-lg border border-zinc-800 w-full sm:w-max gap-1">
                <button onClick={() => setSubAbaAtivos('mensalistas')} className={`flex items-center justify-center gap-2 px-2 sm:px-6 py-2.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${subAbaAtivos === 'mensalistas' ? 'bg-[#d4af37] text-[#0d1b2a] shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
                  <span className="hidden sm:inline">Mensalistas (Ativos)</span>
                  <span className="sm:hidden">Mensalistas</span>
                </button>
                <button onClick={() => setSubAbaAtivos('especiais')} className={`flex items-center justify-center gap-2 px-2 sm:px-6 py-2.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${subAbaAtivos === 'especiais' ? 'bg-purple-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
                  <span className="hidden sm:inline">Processos Societários</span>
                  <span className="sm:hidden">Societários</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="w-full sm:w-1/2 relative">
                  <input type="text" placeholder="Pesquisar por nome, CNPJ/CPF ou e-mail..." value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37] transition-colors" />
                </div>
                <button onClick={() => setModalAdicionar(true)} className="w-full sm:w-auto bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 whitespace-nowrap">
                  + Adicionar Clientes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                // FILTRAGEM INTELIGENTE
                const listaExibicao = subAbaAtivos === 'especiais' 
                  ? clientesFiltrados.filter(c => c.tipo_conta === 'especiais' || c.tipo_conta === 'especial' || (c.cpf && c.cpf.trim() !== '') || processosSocietarios.some(p => p.cliente_id === c.id))
                  : clientesFiltrados.filter(c => !(c.tipo_conta === 'especiais' || c.tipo_conta === 'especial' || (c.cpf && c.cpf.trim() !== '')));

                if (listaExibicao.length === 0) return <p className="text-zinc-500 col-span-full py-8 text-center">Nenhum cliente encontrado nesta categoria.</p>;

                return listaExibicao.map((cli) => {
                  const processosDoCliente = processosSocietarios.filter(p => p.cliente_id === cli.id);
                  const quantidadeProcessos = processosDoCliente.length;
                  
                  // MÁGICA: Considera finalizado apenas quem passou por todas as etapas e pagou os honorários
                  const qtdFinalizados = processosDoCliente.filter(p => p.passo === 8 && p.honorario_pago).length;
                  const qtdAtivos = quantidadeProcessos - qtdFinalizados;
                  
                  // MÁGICA: O card assume o visual e as funções baseadas na ABA que o admin está visualizando!
                  // Se estiver na aba Societário, mostra roxo e o banner de processos. Se estiver na Mensalistas, fica normal!
                  const isEspecial = subAbaAtivos === 'especiais';

                  return (
                    <div key={cli.id} className={`h-full p-6 rounded-xl border shadow-xl flex flex-col justify-between transition ${isEspecial ? 'bg-[#0d1b2a] border-purple-500/30 hover:border-purple-500/60' : 'bg-[#1b263b] border-zinc-800 hover:border-zinc-700'}`}>
                      <div className="flex flex-col flex-1">
                        {/* TRAVA DE ALTURA: Ocupa sempre o espaço de 2 linhas, evitando que empurre o conteúdo abaixo */}
                        <div className="flex justify-between items-start mb-4 gap-3 min-h-[3.5rem]">
                          <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 break-words" title={cli.nome_empresa || cli.nome_contato}>
                            {cli.nome_empresa || cli.nome_contato}
                            {cli.ultimo_login && <IconVerified />}
                          </h3>
                          <div className="flex-shrink-0 pt-0.5">
                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded whitespace-nowrap ${isEspecial ? 'text-purple-400 border-purple-400/30 bg-purple-500/10' : 'text-[#d4af37] border-[#d4af37]/30 bg-[#0d1b2a]'}`}>
                              {isEspecial ? 'Societário' : cli.regime_tributario}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-zinc-400 mb-1">{cli.cnpj ? 'CNPJ:' : 'CPF:'} <span className="text-zinc-300">{cli.cnpj || cli.cpf || 'Não informado'}</span></p>
                        <p className="text-xs text-zinc-400 mb-1">E-mail: <span className="text-zinc-300 truncate inline-block max-w-[200px] align-bottom">{cli.email || 'Não informado'}</span></p>
                        <p className="text-xs text-zinc-400">Contato: <span className="text-zinc-300">{cli.nome_contato || 'Não informado'}</span></p>
                        
                        {/* EMPURRA TUDO PARA O FUNDO, ASSIM TODOS OS CARDS ALINHAM PELA BASE */}
                        <div className="mt-auto">
                          {/* 🚀 O CARD INFORMATIVO DE PROCESSOS MÚLTIPLOS */}
                          {isEspecial && (
                            <div className="pt-5">
                              <div className="p-3 bg-[#1b263b] rounded-lg border border-purple-500/20 text-center flex flex-col justify-center items-center min-h-[88px]">
                                {quantidadeProcessos === 0 ? (
                                  <>
                                    <p className="text-xs text-zinc-400 font-bold mb-1">Nenhum processo iniciado.</p>
                                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider leading-tight">
                                      Para começar, clique em <strong className="text-purple-400">Perfil</strong> e <strong className="text-purple-400">+ Novo Processo</strong>
                                    </p>
                                  </>
                                ) : (
                                  <div className="flex gap-6 items-center justify-center w-full">
                                    {qtdAtivos > 0 && (
                                      <div className="flex flex-col items-center">
                                        <span className="text-2xl font-black text-purple-400 leading-none mb-1">{qtdAtivos}</span>
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Ativo{qtdAtivos > 1 ? 's' : ''}</span>
                                      </div>
                                    )}
                                    
                                    {qtdAtivos > 0 && qtdFinalizados > 0 && <div className="h-6 w-px bg-zinc-700"></div>}
                                    
                                    {qtdFinalizados > 0 && (
                                      <div className="flex flex-col items-center">
                                        <span className="text-2xl font-black text-emerald-400 leading-none mb-1">{qtdFinalizados}</span>
                                        <span className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-wider">Concluído{qtdFinalizados > 1 ? 's' : ''}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* TEXTO DE LOGIN FIXO PARA NÃO QUEBRAR O LAYOUT */}
                          <div className="pt-3 mt-3 border-t border-zinc-800/40 min-h-[36px] flex items-center">
                            {cli.ultimo_login ? (
                              <p className="text-[10px] text-zinc-500 truncate">
                                Último acesso: <span className="text-blue-400/80 font-medium">{formatarDataHora(cli.ultimo_login)}</span>
                                {cli.ultima_cidade && (
                                  <span className="ml-1 text-zinc-400 hidden lg:inline">em <strong className="text-zinc-300">{cli.ultima_cidade}</strong></span>
                                )}
                              </p>
                            ) : (
                              <p className="text-[10px] text-zinc-600 italic">Nunca acessou o portal</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-zinc-800 flex gap-2 flex-wrap sm:flex-nowrap">
                        <Link href={isEspecial ? `/cliente/${cli.id}?view=especial` : `/cliente/${cli.id}`} className={`flex-1 min-w-[100px] border text-center py-2.5 sm:py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${isEspecial ? 'border-purple-500/50 text-purple-400 hover:bg-purple-500 hover:text-white' : 'border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a]'}`}>Perfil</Link>
                        <button type="button" onClick={() => { setModalEditarCliente({ aberto: true, cliente: cli }); setFormEditar({ nome_empresa: cli.nome_empresa || '', nome_contato: cli.nome_contato || '', email: cli.email || '', celular: cli.celular || '', regime_tributario: cli.regime_tributario || 'Simples Nacional' }); }} className="flex-1 sm:flex-none min-w-[80px] px-3 py-2.5 sm:py-2 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 rounded-lg text-xs font-bold transition">Editar</button>
                        <button onClick={() => deletarCliente(cli.id)} className="flex-1 sm:flex-none min-w-[80px] px-3 py-2.5 sm:py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-xs transition font-bold">Excluir</button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {abaAtiva === 'pendentes' && (
          <div className="bg-[#1b263b] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
            {pendentes.length === 0 ? (
              <p className="text-zinc-400 text-center py-12">Nenhuma solicitação de cadastro pendente no momento.</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {Array.isArray(pendentes) && pendentes.map((sol) => (
                  <div key={sol.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1b263b] hover:bg-zinc-800/40 transition">
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="text-lg font-bold text-white">{sol.nome_empresa}</h4>
                        <span className="text-xs bg-[#0d1b2a] text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 whitespace-nowrap">{sol.regime_tributario}</span>
                        
                        {/* ETIQUETAS MÁGICAS DE VÍNCULO */}
                        {sol.tipo_solicitacao === 'vinculo_existente' && (
                          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded uppercase font-bold whitespace-nowrap">Linkar Conta Existente</span>
                        )}
                        {sol.tipo_solicitacao === 'novo_vinculo' && (
                          <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded uppercase font-bold whitespace-nowrap">Nova Conta Vinculada</span>
                        )}
                      </div>

                      {/* NOVO: EXIBE A EMPRESA DE ORIGEM QUE SOLICITOU O VÍNCULO */}
                      {(sol.tipo_solicitacao === 'vinculo_existente' || sol.tipo_solicitacao === 'novo_vinculo') && sol.vinculo_origem_id && (
                        <div className="mb-3 inline-flex items-center gap-1.5 bg-[#0d1b2a] border border-[#d4af37]/30 px-3 py-1.5 rounded-lg shadow-inner">
                          <IconCompany />
                          <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Solicitado por:</span>
                          <span className="text-[11px] font-black text-[#d4af37]">
                            {clientes.find(c => c.id === sol.vinculo_origem_id)?.nome_empresa || 'Empresa não encontrada'}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-zinc-400">CNPJ: {sol.cnpj} | Responsável: <span className="text-zinc-300">{sol.nome_contato}</span></p>
                      <p className="text-xs text-zinc-400 mt-0.5">E-mail: <span className="text-[#d4af37]">{sol.email}</span> | Celular: {sol.celular}</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0">
                      <button onClick={() => rejeitarSolicitacao(sol.id)} className="flex-1 md:flex-none bg-red-500/10 text-red-400 border border-red-500/30 font-bold px-4 py-2 rounded text-xs hover:bg-red-500 hover:text-white transition">Recusar</button>
                      <button onClick={() => aprovarCliente(sol)} className="flex-1 md:flex-none bg-emerald-500 text-black font-extrabold px-4 py-2 rounded text-xs hover:bg-emerald-400 transition shadow whitespace-nowrap">
                        {sol.tipo_solicitacao === 'vinculo_existente' ? 'Aprovar Vínculo' : 'Aprovar e Ativar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'recebidos' && (
          <div className="space-y-4">
            {/* PAINEL DE AÇÕES EM LOTE NO TOPO */}
            {recebidosVisiveis.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#1b263b] border border-[#d4af37]/30 p-4 rounded-xl shadow-lg gap-4">
                {!modoSelecaoRecebidos ? (
                  <div className="w-full flex justify-between items-center">
                    <h3 className="text-white font-bold text-sm flex items-center gap-2"><IconInbox /> Docs Pendentes ({recebidosVisiveis.length})</h3>
                    <button onClick={() => setModoSelecaoRecebidos(true)} className="text-xs bg-[#d4af37] text-[#0d1b2a] font-extrabold px-4 py-2.5 rounded-lg hover:bg-yellow-500 transition shadow-sm">Selecionar Múltiplos Arquivos</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-zinc-300 hover:text-white transition w-full sm:w-auto">
                        <input type="checkbox" className="accent-[#d4af37] w-4 h-4 cursor-pointer" checked={recebidosVisiveis.length > 0 && selecionadosRecebidos.length === recebidosVisiveis.length} onChange={toggleSelecionarTodosRecebidos} />
                        Selecionar Todos ({recebidosVisiveis.length})
                      </label>
                      <button onClick={() => { setModoSelecaoRecebidos(false); setSelecionadosRecebidos([]); }} className="text-xs text-zinc-400 hover:text-white transition underline font-medium">Cancelar</button>
                    </div>
                    
                    {selecionadosRecebidos.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end border-t sm:border-t-0 border-zinc-700 pt-4 sm:pt-0">
                        <span className="text-xs font-bold text-[#d4af37] mr-2 w-full sm:w-auto">{selecionadosRecebidos.length} selecionado(s)</span>
                        <button onClick={handleAceitarEmLote} className="flex-1 sm:flex-none text-xs bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 px-4 py-2.5 sm:py-2 rounded text-emerald-400 font-extrabold transition text-center shadow-sm">Mover para Histórico</button>
                        <button onClick={handleBaixarEmLote} className="flex-1 sm:flex-none text-xs bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/30 px-4 py-2.5 sm:py-2 rounded text-blue-400 font-extrabold transition text-center shadow-sm">Baixar Tudo</button>
                        <button onClick={handleExcluirEmLote} className="flex-1 sm:flex-none text-xs bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 px-4 py-2.5 sm:py-2 rounded text-red-400 font-extrabold transition text-center shadow-sm">Excluir</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="bg-[#1b263b] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
              {recebidosVisiveis.length === 0 ? (
                <p className="text-zinc-400 text-center py-12">Nenhum documento na sua área para análise.</p>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {Array.isArray(recebidosVisiveis) && recebidosVisiveis.map((doc) => (
                    <div key={doc.id} onClick={() => modoSelecaoRecebidos && toggleSelecionarRecebido(doc.id)} className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition w-full min-w-0 ${modoSelecaoRecebidos ? 'cursor-pointer' : ''} ${selecionadosRecebidos.includes(doc.id) ? 'bg-[#d4af37]/10' : 'bg-[#1b263b] hover:bg-zinc-800/40'}`}>
                      <div className="flex items-start gap-4 min-w-0 flex-1 w-full">
                        {modoSelecaoRecebidos && (
                          <div className="pt-1">
                            <input type="checkbox" checked={selecionadosRecebidos.includes(doc.id)} onChange={() => {}} className="accent-[#d4af37] w-5 h-5 cursor-pointer shadow-sm pointer-events-none" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h4 className={`text-lg font-bold truncate max-w-md transition-colors ${selecionadosRecebidos.includes(doc.id) ? 'text-[#d4af37]' : 'text-zinc-200'}`}>{doc.nome_documento}</h4>
                            <span className="text-xs bg-[#0d1b2a] text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 font-semibold uppercase whitespace-nowrap">
                              {doc.clientes?.nome_empresa || 'Empresa Removida'}
                            </span>
                            
                            {/* SELECT DE SETOR NO DOCUMENTO RECEBIDO */}
                            <div className="flex items-center gap-1 bg-[#0d1b2a] border border-zinc-700 hover:border-[#d4af37]/50 transition-colors rounded px-2" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold hidden sm:inline">Setor:</span>
                              <select 
                                value={doc.departamento || 'Outros'} 
                                onChange={(e) => alterarDepartamentoEnvio(doc.id, e.target.value)}
                                className="bg-transparent text-blue-400 text-[11px] font-bold py-1 focus:outline-none cursor-pointer tracking-wider uppercase"
                              >
                                <option value="Contábil" className="bg-[#0d1b2a]">Contábil</option>
                                <option value="Fiscal" className="bg-[#0d1b2a]">Fiscal</option>
                                <option value="DP / RH" className="bg-[#0d1b2a]">DP / RH</option>
                                <option value="Financeiro" className="bg-[#0d1b2a]">Financeiro</option>
                                <option value="Societário" className="bg-[#0d1b2a]">Societário</option>
                                <option value="Legalização" className="bg-[#0d1b2a]">Legalização</option>
                                <option value="Outros" className="bg-[#0d1b2a]">Outros / Suporte</option>
                              </select>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-400 truncate max-w-full mt-2">
                            Arquivo: <span className="text-zinc-300 font-mono break-all">{doc.nome_original}</span>
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5"><IconMiniClock /> Enviado em: {new Date(doc.criado_em).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      
                      {/* Oculta os botões individuais se tiver em modo selecao */}
                      {!modoSelecaoRecebidos && (
                        <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto mt-3 md:mt-0 transition-opacity">
                          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); visualizarDocumento(doc.caminho_storage); }} className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 px-3 py-2.5 rounded text-xs font-bold transition text-white">Visualizar</button>
                          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); baixarDocumento(doc.caminho_storage, doc.nome_original); }} className="flex-1 md:flex-none border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] px-3 py-2.5 rounded text-xs font-bold transition-all shadow-sm">Baixar</button>
                          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); aceitarEMoverParaHistorico(doc); }} className="flex-1 md:flex-none bg-emerald-500 text-black font-extrabold px-3 py-2.5 rounded text-xs hover:bg-emerald-400 transition shadow-sm">Mover para Histórico</button>
                          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); rejeitarEDeletar(doc); }} className="flex-1 md:flex-none px-3 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded text-xs transition">Excluir</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'solicitacoes' && (
          <div className="bg-[#1b263b] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
            
            {/* CABEÇALHO BEM ORGANIZADO */}
            <div className="bg-[#0d1b2a] px-5 py-4 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-t-xl">
              
              {/* AS DUAS NOVAS ABAS MÁGICAS */}
              <div className="flex bg-[#1b263b] p-1 rounded-lg border border-zinc-700 w-full xl:w-auto overflow-x-auto hide-scrollbar">
                <button onClick={() => setSubAbaTicket('pendentes')} className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${subAbaTicket === 'pendentes' ? 'bg-[#d4af37] text-[#0d1b2a] shadow-sm' : 'text-zinc-400 hover:text-white'}`}>
                  Aguardando Ação 
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${subAbaTicket === 'pendentes' ? 'bg-[#0d1b2a] text-[#d4af37]' : 'bg-zinc-700 text-white'}`}>{pedidosFiltrados.filter(p => p.status === 'pendente').length}</span>
                </button>
                <button onClick={() => setSubAbaTicket('resolvidos')} className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${subAbaTicket === 'resolvidos' ? 'bg-emerald-500 text-[#0d1b2a] shadow-sm' : 'text-zinc-400 hover:text-white'}`}>
                  Resolvidos
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${subAbaTicket === 'resolvidos' ? 'bg-[#0d1b2a] text-emerald-500' : 'bg-zinc-700 text-white'}`}>{pedidosFiltrados.filter(p => p.status === 'atendido').length}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto flex-col sm:flex-row">
                <label className="flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-zinc-300 hover:text-white transition whitespace-nowrap bg-zinc-800/50 px-4 py-2.5 sm:py-2 rounded-lg border border-zinc-700 w-full sm:w-auto">
                  <input type="checkbox" checked={agruparPedidosPorEmpresa} onChange={e => { setAgruparPedidosPorEmpresa(e.target.checked); setEmpresaExpandidaPedido(null); }} className="accent-[#d4af37] w-4 h-4 cursor-pointer" />
                  <IconCompany /> Agrupar
                </label>
                <div className="relative w-full sm:w-64">
                  <input type="text" placeholder="Nº Ticket, Empresa ou Data..." value={buscaPedido} onChange={(e) => setBuscaPedido(e.target.value)} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2.5 sm:py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                </div>
              </div>
            </div>

            {/* CORPO DA LISTAGEM (INTELIGENTE) */}
            {(() => {
              const listaExibicao = pedidosFiltrados.filter(p => {
                if (subAbaTicket === 'pendentes') return p.status === 'pendente';
                if (subAbaTicket === 'resolvidos') return p.status === 'atendido';
                return true;
              });

              if (listaExibicao.length === 0) return <p className="text-zinc-400 text-center py-12">Nenhum ticket encontrado nesta aba.</p>;

              const renderCardPedido = (pedido) => (
                  <div key={pedido.id} className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition border-b border-zinc-800/50 last:border-0 ${pedido.status === 'pendente' ? 'bg-[#1b263b] hover:bg-zinc-800/40' : 'bg-[#0d1b2a]/50 opacity-80 hover:opacity-100'}`}>
                    <div className="flex-1 pr-4 w-full">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <IconChat />
                        <span className={`text-xs font-black px-2 py-0.5 rounded shadow-sm ${pedido.status === 'pendente' ? 'text-[#0d1b2a] bg-[#d4af37]' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'}`}>
                          #{String(pedido.numero_ticket || 0).padStart(5, '0')}
                        </span>
                        <span className="text-xs bg-[#0d1b2a] text-[#d4af37] px-2 py-0.5 rounded border border-[#d4af37]/30 font-bold uppercase">
                          {pedido.clientes?.nome_empresa || 'Empresa Removida'}
                        </span>

                        <div className="flex gap-2 items-center flex-wrap">
                          {/* SELECT DE SETOR */}
                          <div className="flex items-center gap-1 bg-[#0d1b2a] border border-zinc-700 hover:border-[#d4af37]/50 transition-colors rounded px-2" onClick={e => e.stopPropagation()}>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold hidden sm:inline">Setor:</span>
                            <select 
                              value={pedido.departamento || 'Outros'} 
                              onChange={(e) => alterarResponsavelOuDepartamento(pedido, 'departamento', e.target.value)}
                              className="bg-transparent text-[#d4af37] text-[11px] font-bold py-1 focus:outline-none cursor-pointer tracking-wider uppercase"
                            >
                              <option value="Contábil" className="bg-[#0d1b2a]">Contábil</option>
                              <option value="Fiscal" className="bg-[#0d1b2a]">Fiscal</option>
                              <option value="DP / RH" className="bg-[#0d1b2a]">DP / RH</option>
                              <option value="Financeiro" className="bg-[#0d1b2a]">Financeiro</option>
                              <option value="Societário" className="bg-[#0d1b2a]">Societário</option>
                              <option value="Legalização" className="bg-[#0d1b2a]">Legalização</option>
                              <option value="Outros" className="bg-[#0d1b2a]">Outros / Suporte</option>
                            </select>
                          </div>
                          
                          {/* SELECT DE RESPONSÁVEL ESPECÍFICO */}
                          <div className="flex items-center gap-1 bg-[#0d1b2a] border border-zinc-700 hover:border-blue-500/50 transition-colors rounded px-2" onClick={e => e.stopPropagation()}>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold hidden sm:inline">Para:</span>
                            <select 
                              value={pedido.responsavel || ''} 
                              onChange={(e) => alterarResponsavelOuDepartamento(pedido, 'responsavel', e.target.value)}
                              className="bg-transparent text-blue-400 text-[11px] font-bold py-1 focus:outline-none cursor-pointer tracking-wider uppercase"
                            >
                              <option value="" className="bg-[#0d1b2a]">Equipa Inteira</option>
                              {LISTA_COLABORADORES.map(c => <option key={c} value={c} className="bg-[#0d1b2a]">{c}</option>)}
                            </select>
                          </div>
                        </div>

                        <span className="text-[11px] text-zinc-500">{new Date(pedido.criado_em).toLocaleString('pt-BR')}</span>
                        {pedido.status === 'atendido' && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 ml-2">
                            ✓ Respondido
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-medium leading-relaxed bg-[#0d1b2a] p-3 rounded-lg border border-zinc-800/50 ${pedido.status === 'pendente' ? 'text-zinc-200' : 'text-zinc-400'}`}>
                        &ldquo;{pedido.descricao}&rdquo;
                      </p>

                      {/* Anexo enviado pelo cliente */}
                      {pedido.caminho_arquivo && (
                        <div className="mt-2 flex items-center gap-2 border border-zinc-700/50 bg-[#0d1b2a] w-max px-3 py-1.5 rounded-lg">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Anexo do Cliente:</span>
                          <span className="text-[11px] text-zinc-400 max-w-[150px] truncate">{pedido.nome_arquivo}</span>
                          <button onClick={(e) => { e.preventDefault(); visualizarDocumento(pedido.caminho_arquivo); }} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-1 rounded transition ml-2">Visualizar</button>
                          <button onClick={(e) => { e.preventDefault(); baixarDocumento(pedido.caminho_arquivo, pedido.nome_arquivo); }} className="text-[10px] bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 px-2 py-1 rounded transition">Baixar</button>
                        </div>
                      )}
                      
                      {/* Resposta Admin Inline */}
                      {pedido.status === 'atendido' && (
                        <div className="mt-3 pl-4 border-l-2 border-emerald-500/50">
                           <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Resposta da Equipa:</p>
                           <p className="text-xs text-zinc-400 italic">{pedido.resposta || 'Respondido e finalizado.'}</p>
                           {pedido.caminho_arquivo_resposta && (
                             <div className="flex gap-2 mt-2">
                               <button onClick={() => visualizarDocumento(pedido.caminho_arquivo_resposta)} className="text-[10px] bg-zinc-800 text-white px-3 py-1.5 rounded hover:bg-zinc-700 transition border border-zinc-700">
                                Visualizar Anexo
                               </button>
                               <button onClick={() => baixarDocumento(pedido.caminho_arquivo_resposta, pedido.nome_arquivo_resposta)} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded hover:bg-emerald-500/20 transition border border-emerald-500/30">
                                 Baixar Anexo
                               </button>
                             </div>
                           )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto whitespace-nowrap mt-2 md:mt-0 flex-col sm:flex-row items-end">
                      <Link href={`/cliente/${pedido.cliente_id}`} className="flex-1 w-full md:w-auto border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm text-center">
                        Acessar Perfil
                      </Link>
                      {pedido.status === 'pendente' && (
                        <button onClick={() => setModalRespostaPedido({ aberto: true, pedido, texto: '', arquivo: null })} className="flex-1 w-full md:w-auto bg-[#d4af37] text-[#0d1b2a] font-extrabold px-4 py-2.5 rounded-lg text-xs hover:bg-yellow-500 transition shadow-lg">
                          Responder e Finalizar
                        </button>
                      )}
                    </div>
                  </div>
              );

              // Lógica de Renderizar as pastas separadas
              if (agruparPedidosPorEmpresa) {
                const agrupado = {};
                listaExibicao.forEach(p => {
                  const n = p.clientes?.nome_empresa || 'Empresa Desconhecida';
                  if (!agrupado[n]) agrupado[n] = [];
                  agrupado[n].push(p);
                });

                return (
                  <div className="divide-y divide-zinc-800/50">
                    {Object.keys(agrupado).sort().map(empresa => (
                      <div key={empresa} className="flex flex-col">
                        <button onClick={() => setEmpresaExpandidaPedido(empresaExpandidaPedido === empresa ? null : empresa)} className="w-full flex items-center justify-between p-4 bg-[#1b263b] hover:bg-zinc-800/50 transition focus:outline-none">
                          <div className="flex items-center gap-3">
                            <IconCompany />
                            <span className="font-bold text-white text-sm">{empresa}</span>
                            <span className="text-[10px] bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-full border border-[#d4af37]/30">{agrupado[empresa].length} ticket(s)</span>
                          </div>
                          <span className="text-zinc-500 text-xs font-bold">{empresaExpandidaPedido === empresa ? 'Ocultar ▲' : 'Ver Tickets ▼'}</span>
                        </button>
                        {empresaExpandidaPedido === empresa && (
                          <div className="p-0 bg-[#0d1b2a]/60 border-t border-zinc-800/50 divide-y divide-zinc-800/50">
                            {agrupado[empresa].map(pedido => renderCardPedido(pedido))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }

              // Lógica de Renderizar todos duma vez
              return <div className="divide-y divide-zinc-800">{listaExibicao.map(pedido => renderCardPedido(pedido))}</div>;
            })()}
          </div>
        )}

        {/* 5. ABA ALERTAS E COBRANÇAS (VERSÃO PRO) */}
        {abaAtiva === 'alertas' && (
          <div className="space-y-6">
            
            {/* NAVEGAÇÃO INTERNA DE DISPAROS */}
            <div className="flex bg-[#1b263b] p-1.5 rounded-xl border border-zinc-800 w-full sm:w-max gap-1 shadow-lg">
              <button onClick={() => setModoAlertaTopo('cobrancas')} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${modoAlertaTopo === 'cobrancas' ? 'bg-[#d4af37] text-[#0d1b2a] shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Gestão de Cobranças
              </button>
              <button onClick={() => setModoAlertaTopo('push')} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${modoAlertaTopo === 'push' ? 'bg-blue-500 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Disparo Rápido (Push)
              </button>
            </div>

            {modoAlertaTopo === 'push' && (
              <div className="bg-blue-500/10 p-6 md:p-8 rounded-xl border border-blue-500/30 shadow-xl animate-in fade-in slide-in-from-top-4">
                <h2 className="text-xl font-black text-blue-400 mb-2 flex items-center gap-2">Central de Notificações (Celular)</h2>
                <p className="text-xs text-blue-200/80 mb-8">Esta área envia apenas uma notificação direta e imediata para o celular/computador do grupo selecionado. Não cria histórico de cobrança no painel.</p>
                
                <form onSubmit={handleDisparoPushMassa} className="space-y-6">
                  <div className="bg-[#0d1b2a] p-5 rounded-lg border border-blue-500/20 shadow-inner">
                    <label className="block text-xs font-bold text-zinc-300 uppercase mb-4 border-b border-blue-500/20 pb-2">1. Selecionar Destinatários do Alerta</label>
                    
                    {/* BOTOES DE SELEÇÃO EM MASSA RÁPIDA */}
                    <div className="flex flex-wrap gap-3 mb-5">
                      <button type="button" onClick={() => { setFormPush({...formPush, alvo: 'interno'}); setFormAlerta({...formAlerta, clientesSelecionados: []}); }} className={`text-sm font-bold px-4 py-2 rounded-lg border transition-all ${formPush.alvo === 'interno' ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white'}`}>🚨 Apenas Equipe Interna (Admins)</button>
                      <button type="button" onClick={() => { setFormPush({...formPush, alvo: 'clientes'}); setFormAlerta({...formAlerta, clientesSelecionados: []}); }} className="text-sm font-medium px-4 py-2 rounded-lg border transition-all text-white bg-zinc-800/50 border-zinc-700 hover:border-zinc-500">Limpar Seleção</button>
                      <button type="button" onClick={() => { setFormPush({...formPush, alvo: 'clientes'}); handleSelecionarMassa('todos'); }} className="text-sm font-medium px-4 py-2 rounded-lg border transition-all text-white bg-zinc-800/50 border-zinc-700 hover:border-zinc-500">Todos os Clientes</button>
                      <button type="button" onClick={() => { setFormPush({...formPush, alvo: 'clientes'}); handleSelecionarMassa('Simples Nacional'); }} className="text-sm font-medium px-4 py-2 rounded-lg border transition-all text-white bg-zinc-800/50 border-zinc-700 hover:border-zinc-500">Simples Nacional</button>
                      <button type="button" onClick={() => { setFormPush({...formPush, alvo: 'clientes'}); handleSelecionarMassa('Lucro Presumido'); }} className="text-sm font-medium px-4 py-2 rounded-lg border transition-all text-white bg-zinc-800/50 border-zinc-700 hover:border-zinc-500">Lucro Presumido</button>
                      <button type="button" onClick={() => { setFormPush({...formPush, alvo: 'clientes'}); handleSelecionarMassa('Lucro Real'); }} className="text-sm font-medium px-4 py-2 rounded-lg border transition-all text-white bg-zinc-800/50 border-zinc-700 hover:border-zinc-500">Lucro Real</button>
                    </div>

                    {formPush.alvo === 'interno' ? (
                      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg text-center text-xs font-bold text-red-400 uppercase tracking-widest animate-pulse shadow-inner">
                        Modo Equipe Ativo: A mensagem será enviada instantaneamente para os celulares/PCs de TODOS os funcionários logados.
                      </div>
                    ) : (
                      <div>
                        {/* AUTOCOMPLETE DE PESQUISA */}
                        <div className="relative">
                          <input type="text" placeholder="Pesquise manualmente pelo nome da empresa..." value={buscaAlertaInput} onChange={(e) => { setBuscaAlertaInput(e.target.value); setMostrarAutoAlerta(true); }} onFocus={() => setMostrarAutoAlerta(true)} onBlur={() => setTimeout(() => setMostrarAutoAlerta(false), 200)} className="w-full bg-[#1b263b] border border-blue-500/30 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors" />
                          {mostrarAutoAlerta && buscaAlertaInput.length > 0 && clientesParaAlerta.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1b263b] border border-zinc-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                              {clientesParaAlerta.map((cli) => (
                                <div key={`auto-push-cli-${cli.id}`} onMouseDown={(e) => { e.preventDefault(); setFormPush({...formPush, alvo: 'clientes'}); adicionarClienteAlerta(cli); }} className="px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white cursor-pointer truncate border-b border-zinc-800/50 last:border-0 transition flex items-center justify-between">
                                  <span className="flex items-center gap-2"><IconCompany /> {cli.nome_empresa}</span>
                                  <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{cli.regime_tributario}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* LISTAGEM DE ELEMENTOS EM CHIPS */}
                        {formAlerta.clientesSelecionados.length > 0 && (
                          <div className="mt-4 p-4 bg-[#1b263b] rounded-lg border border-blue-500/20 shadow-inner">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-bold text-blue-400">{formAlerta.clientesSelecionados.length} empresa(s) na fila do Push</span>
                              <button type="button" onClick={() => setMostrarModalClientes(true)} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 rounded text-white font-bold transition border border-zinc-600 shadow-sm">Ver / Ajustar Lista</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {formAlerta.clientesSelecionados.slice(0, 10).map(cli => (
                                <span key={cli.id} className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
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
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-zinc-300 uppercase">Título da Notificação</label>
                      <input type="text" required placeholder="Ex: Feriado Nacional - Sexta-feira" value={formPush.titulo} onChange={e => setFormPush({...formPush, titulo: e.target.value})} className="w-full bg-[#0d1b2a] border border-blue-500/30 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none" />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-zinc-300 uppercase">Mensagem (Corpo)</label>
                      <textarea rows="2" required placeholder="Ex: Informamos que o escritório estará fechado nesta sexta..." value={formPush.mensagem} onChange={e => setFormPush({...formPush, mensagem: e.target.value})} className="w-full bg-[#0d1b2a] border border-blue-500/30 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none resize-none"></textarea>
                    </div>
                  </div>

                  <div className="flex justify-end pt-5 border-t border-blue-500/20">
                    <button type="submit" disabled={subindo} className="w-full md:w-auto bg-blue-500 text-white font-extrabold px-8 py-3.5 rounded-lg text-sm hover:bg-blue-400 transition shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:opacity-50">
                      {subindo ? 'A disparar...' : 'Enviar Alertas Agora'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* FORMULÁRIO DE CRIAÇÃO E AUTOMATIZAÇÃO */}
            {modoAlertaTopo === 'cobrancas' && (
            <div className="bg-[#1b263b] p-6 md:p-8 rounded-xl border border-zinc-800 shadow-xl animate-in fade-in">
              <h2 className="text-xl font-bold text-[#d4af37] mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Publicar Cobranças ou Avisos
              </h2>
              <form onSubmit={handleCriarAlerta} className="space-y-6">
                
                {/* NOVO: SELETOR DE TIPO (COBRANÇA, LEMBRETE OU ENVIO DE DOC) */}
                <div className="flex flex-wrap bg-[#0d1b2a] p-1.5 rounded-lg border border-zinc-800 w-full mb-6 gap-1">
                  <button type="button" onClick={() => setFormAlerta({...formAlerta, tipo_alerta: 'cobranca'})} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-bold transition-all whitespace-nowrap ${formAlerta.tipo_alerta === 'cobranca' ? 'bg-orange-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    Solicitar Documento
                  </button>
                  <button type="button" onClick={() => setFormAlerta({...formAlerta, tipo_alerta: 'lembrete'})} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-bold transition-all whitespace-nowrap ${formAlerta.tipo_alerta === 'lembrete' ? 'bg-blue-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Enviar Aviso
                  </button>
                  <button type="button" onClick={() => setFormAlerta({...formAlerta, tipo_alerta: 'envio_doc'})} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-bold transition-all whitespace-nowrap ${formAlerta.tipo_alerta === 'envio_doc' ? 'bg-emerald-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Enviar Documento
                  </button>
                </div>

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
                            <div key={`auto-cli-${cli.id}`} onMouseDown={(e) => { e.preventDefault(); adicionarClienteAlerta(cli); }} className="px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white cursor-pointer truncate border-b border-zinc-800/50 last:border-0 transition flex items-center justify-between">
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Responsável (Você)</label>
                    <select value={formAlerta.responsavel} onChange={e => setFormAlerta({...formAlerta, responsavel: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-[#d4af37] focus:outline-none cursor-pointer">
                      {LISTA_COLABORADORES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase">Mensagem Personalizada</label>
                    
                    {/* BARRA DE FERRAMENTAS ESTILO WORD */}
                    <div className="flex gap-1 bg-[#0d1b2a] border border-zinc-800 p-1 rounded-md shadow-inner">
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); aplicarFormatacaoTexto('b'); }} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-[#d4af37] hover:bg-zinc-800 rounded font-serif font-bold text-xs transition" title="Negrito">B</button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); aplicarFormatacaoTexto('i'); }} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-[#d4af37] hover:bg-zinc-800 rounded font-serif italic text-xs transition" title="Itálico">I</button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); aplicarFormatacaoTexto('u'); }} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-[#d4af37] hover:bg-zinc-800 rounded font-serif underline text-xs transition" title="Sublinhado">U</button>
                    </div>
                  </div>
                  
                  {/* EDITOR VISUAL MÁGICO (Substitui o Textarea) */}
                  <div 
                    id="campo-mensagem-alerta"
                    contentEditable
                    suppressContentEditableWarning={true}
                    ref={(el) => {
                      if (el && document.activeElement !== el && el.innerHTML !== formAlerta.mensagem) {
                        el.innerHTML = formAlerta.mensagem;
                      }
                    }}
                    onInput={e => setFormAlerta({...formAlerta, mensagem: e.currentTarget.innerHTML})}
                    className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-[#d4af37] focus:outline-none min-h-[100px] cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-500 empty:before:pointer-events-none"
                    data-placeholder="Ex: Por favor, enviar os extratos ou boletos..."
                    style={{ outline: 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  ></div>
                  <p className="text-[10px] text-zinc-500 mt-1">Selecione o texto e use os botões acima para formatar visualmente e ver o resultado na hora.</p>
                </div>

                {formAlerta.tipo_alerta === 'envio_doc' && (
                  <div className="bg-[#0d1b2a] p-4 rounded-lg border border-emerald-500/30">
                    <label className="block text-xs font-bold text-emerald-400 uppercase mb-2">Anexar Documento para Envio</label>
                    <input 
                      type="file" 
                      required 
                      accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" 
                      onChange={e => setFormAlerta({...formAlerta, arquivo_envio: e.target.files[0]})} 
                      className="text-xs text-zinc-400 bg-[#1b263b] border border-zinc-700 rounded-lg p-2 w-full cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20" 
                    />
                  </div>
                )}

                {/* BLOCO 3: DATAS E RECORRÊNCIA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-800 pt-5">
                  {formAlerta.tipo_alerta === 'cobranca' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase mb-2" title="Até quando o cliente deve enviar ou confirmar">Prazo p/ Confirmação</label>
                      <input type="date" value={formAlerta.prazo} onChange={e => setFormAlerta({...formAlerta, prazo: e.target.value})} disabled={formAlerta.repetir_mensalmente} required={!formAlerta.repetir_mensalmente && formAlerta.tipo_alerta === 'cobranca'} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-[#d4af37] focus:outline-none disabled:opacity-30 cursor-pointer" />
                    </div>
                  )}
                  <div className={formAlerta.tipo_alerta === 'lembrete' ? 'md:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2" title="Caso seja uma cobrança (DAS, Boleto, etc) ou data de evento">Data de Vencimento / Evento (Opcional)</label>
                    <input type="date" value={formAlerta.data_vencimento} onChange={e => setFormAlerta({...formAlerta, data_vencimento: e.target.value})} disabled={formAlerta.repetir_mensalmente} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-[#d4af37] focus:outline-none disabled:opacity-30 cursor-pointer" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs font-bold text-[#d4af37] uppercase mb-2"><IconRepeat /> Automação</label>
                    <label className={`flex items-center gap-3 w-full border rounded-lg px-4 py-3 cursor-pointer transition-colors ${formAlerta.repetir_mensalmente ? 'bg-[#d4af37]/10 border-[#d4af37]' : 'bg-[#0d1b2a] border-zinc-800 hover:border-zinc-700'}`}>
                      <input type="checkbox" checked={formAlerta.repetir_mensalmente} onChange={e => setFormAlerta({...formAlerta, repetir_mensalmente: e.target.checked})} className="accent-[#d4af37] w-4 h-4 cursor-pointer" />
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

                {/* BLOCO 4: OPÇÕES DE PUBLICAÇÃO E E-MAIL */}
                <div className="bg-[#0d1b2a] p-5 rounded-lg border border-zinc-800 mt-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* COLUNA 1: QUANDO PUBLICAR */}
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-[#d4af37] uppercase mb-1">Quando Publicar?</label>
                      {!formAlerta.repetir_mensalmente ? (
                        <>
                          <label className="flex items-center gap-2 cursor-pointer w-full">
                            <input type="checkbox" checked={formAlerta.enviar_agora} onChange={e => setFormAlerta({...formAlerta, enviar_agora: e.target.checked})} className="accent-[#d4af37] w-4 h-4 cursor-pointer" />
                            <span className={`text-sm font-bold ${formAlerta.enviar_agora ? 'text-white' : 'text-zinc-400'}`}>Publicar Imediatamente no Portal</span>
                          </label>
                          {!formAlerta.enviar_agora && (
                            <div className="animate-pulse border-l-2 border-[#d4af37] pl-3 ml-2 mt-2">
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Data Agendada para Publicação:</label>
                              <input type="date" required={!formAlerta.enviar_agora} value={formAlerta.data_envio_programado} onChange={e => setFormAlerta({...formAlerta, data_envio_programado: e.target.value})} className="w-full max-w-[200px] bg-[#1b263b] border border-[#d4af37]/50 rounded px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer" />
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-zinc-500 font-bold bg-[#1b263b] p-2 rounded text-center">Gerenciado pela Automação 🔁</p>
                      )}
                    </div>

                    {/* COLUNA 2: E-MAIL E PUSH */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-[#d4af37] uppercase mb-1">Canais de Aviso Automático</label>
                        
                        <div className="flex flex-col gap-3">
                          {/* CHECK E-MAIL */}
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                              <input type="checkbox" checked={formAlerta.enviar_email} onChange={e => setFormAlerta({...formAlerta, enviar_email: e.target.checked})} className="sr-only cursor-pointer" />
                              <div className={`block w-10 h-6 rounded-full transition-colors ${formAlerta.enviar_email ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formAlerta.enviar_email ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-300 group-hover:text-white transition">Disparar E-mail</p>
                            </div>
                          </label>

                          {/* CHECK PUSH (CELULAR) */}
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                              <input type="checkbox" checked={formAlerta.enviar_push} onChange={e => setFormAlerta({...formAlerta, enviar_push: e.target.checked})} className="sr-only cursor-pointer" />
                              <div className={`block w-10 h-6 rounded-full transition-colors ${formAlerta.enviar_push ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
                              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formAlerta.enviar_push ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-300 group-hover:text-white transition">Notificação (Push) no Celular/PC</p>
                            </div>
                          </label>
                        </div>

                        {formAlerta.enviar_email && (
                          <div className="flex flex-wrap gap-4 border-l-2 border-emerald-500 pl-3 ml-2 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                              <input type="checkbox" checked={formAlerta.exibir_prazo_email} onChange={e => setFormAlerta({...formAlerta, exibir_prazo_email: e.target.checked})} className="accent-emerald-500 w-3.5 h-3.5 cursor-pointer" />
                              Incluir Prazo
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                              <input type="checkbox" checked={formAlerta.exibir_vencimento_email} onChange={e => setFormAlerta({...formAlerta, exibir_vencimento_email: e.target.checked})} className="accent-emerald-500 w-3.5 h-3.5 cursor-pointer" />
                              Incluir Vencimento
                            </label>
                          </div>
                        )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-5 border-t border-zinc-800">
                    <button type="submit" disabled={subindo || formAlerta.clientesSelecionados.length === 0} className="w-full md:w-auto bg-[#d4af37] text-[#0d1b2a] font-extrabold px-8 py-3.5 rounded-lg text-sm hover:bg-yellow-500 transition shadow-[0_0_15px_rgba(212,175,55,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
                      {subindo ? 'A processar...' : (formAlerta.repetir_mensalmente ? 'Salvar Automação' : (!formAlerta.enviar_agora ? 'Agendar Publicação' : 'Confirmar e Publicar Agora'))}
                    </button>
                  </div>
                </div>
              </form>
            </div>
            )}

            {/* ÁREA DE HISTÓRICO DIVIDIDA EM 4 ABAS LÓGICAS */}
            <div className="bg-[#1b263b] rounded-xl border border-zinc-800 shadow-2xl">
              
              <div id="area-lista-alertas" className="bg-[#0d1b2a] px-5 py-4 border-b border-zinc-800 flex flex-col gap-4 rounded-t-xl">
                
                {/* LINHA DE BUSCA E AGRUPAMENTO */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 w-full">
                  <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto">
                    {subAbaAlerta !== 'recorrentes' && (
                      <>
                        <label className="flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-zinc-300 hover:text-white transition whitespace-nowrap bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-700 w-full sm:w-auto">
                          <input type="checkbox" checked={agruparPorEmpresa} onChange={e => { setAgruparPorEmpresa(e.target.checked); setAgruparPorTitulo(false); setEmpresaExpandida(null); }} className="accent-[#d4af37] w-4 h-4 cursor-pointer" />
                          <IconCompany /> Agrupar por Empresa
                        </label>
                        <label className="flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-zinc-300 hover:text-white transition whitespace-nowrap bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-700 w-full sm:w-auto">
                          <input type="checkbox" checked={agruparPorTitulo} onChange={e => { setAgruparPorTitulo(e.target.checked); setAgruparPorEmpresa(false); setTituloExpandido(null); }} className="accent-[#d4af37] w-4 h-4 cursor-pointer" />
                          <svg className="w-4 h-4 text-[#d4af37] flex-shrink-0 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Agrupar por Título
                        </label>
                      </>
                    )}
                  </div>
                  <div className="relative w-full xl:w-80">
                    <input type="text" placeholder="Procurar cobrança, aviso ou empresa..." value={buscaAlerta} onChange={(e) => setBuscaAlerta(e.target.value)} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                  </div>
                </div>

                {/* LINHA DOS BOTÕES DE ABAS (FLEX WRAP PARA NÃO ARRASTAR) */}
                <div className="flex flex-wrap bg-[#1b263b] p-1 rounded-lg border border-zinc-700 w-full gap-1">
                  <button onClick={() => { setSubAbaAlerta('historico_cobrancas'); rolarPara('area-lista-alertas'); }} className={`flex items-center justify-center gap-1 flex-1 min-w-[150px] px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${subAbaAlerta === 'historico_cobrancas' ? 'bg-orange-500 text-[#0d1b2a] shadow-sm' : 'text-zinc-400 hover:text-white'}`}><IconInboxMini /> Histórico Cobranças</button>
                  <button onClick={() => { setSubAbaAlerta('historico_avisos'); rolarPara('area-lista-alertas'); }} className={`flex items-center justify-center gap-1 flex-1 min-w-[150px] px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${subAbaAlerta === 'historico_avisos' ? 'bg-blue-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}><svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Histórico Avisos</button>
                  <button onClick={() => { setSubAbaAlerta('historico_envios'); rolarPara('area-lista-alertas'); }} className={`flex items-center justify-center gap-1 flex-1 min-w-[150px] px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${subAbaAlerta === 'historico_envios' ? 'bg-emerald-500 text-[#0d1b2a] shadow-sm' : 'text-zinc-400 hover:text-white'}`}><IconDocument /> Docs Enviados</button>
                  <button onClick={() => { setSubAbaAlerta('agendados'); rolarPara('area-lista-alertas'); }} className={`flex items-center justify-center gap-1 flex-1 min-w-[150px] px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${subAbaAlerta === 'agendados' ? 'bg-indigo-400 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}><IconCalendar /> Agendados</button>
                  <button onClick={() => { setSubAbaAlerta('recorrentes'); rolarPara('area-lista-alertas'); }} className={`flex items-center justify-center gap-1 flex-1 min-w-[150px] px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${subAbaAlerta === 'recorrentes' ? 'bg-purple-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}><IconRepeat /> Automações</button>
                  <button onClick={() => { setSubAbaAlerta('atrasados'); rolarPara('area-lista-alertas'); }} className={`flex items-center justify-center gap-1 flex-1 min-w-[150px] px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${subAbaAlerta === 'atrasados' ? 'bg-red-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}><IconAlert /> Atrasados ({alertasAtrasados.length})</button>
                </div>

              </div>

              <div className="divide-y divide-zinc-800">
                {subAbaAlerta === 'historico_cobrancas' && renderLista(alertasHistoricoCobrancas, (alerta) => {
                  const prazo = calcularPrazo(alerta.prazo);
                  return (
                    <div key={alerta.id} className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${alerta.status === 'respondido' ? 'opacity-50 bg-[#0d1b2a]/40' : 'bg-[#1b263b] hover:bg-zinc-800/20'}`}>
                      <div className="min-w-0 flex-1 w-full">
                        <div className="flex gap-2 items-center mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded border uppercase whitespace-nowrap ${alerta.status === 'pendente' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>{alerta.status === 'pendente' ? 'Aguardando' : 'Respondido'}</span>
                          
                          {alerta.enviado_email ? (
                            <span className="text-[10px] font-bold text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/30 flex items-center whitespace-nowrap"><IconMail /> E-mail e Portal</span>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 flex items-center whitespace-nowrap"><IconGlobe /> Apenas Portal</span>
                          )}
                          
                          <span className="text-xs font-bold text-zinc-300 truncate max-w-full">{alerta.clientes?.nome_empresa}</span>
                          {alerta.responsavel && <span className="text-[10px] bg-[#1b263b] text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 whitespace-nowrap">Resp: {alerta.responsavel.split(' ')[0]}</span>}
                        </div>
                        <p className="text-sm font-medium text-[#d4af37] mt-2 mb-1 truncate">{alerta.titulo} <span className="text-xs text-zinc-500 ml-1 font-normal">({alerta.tipo_documento})</span></p>
                        <div className="flex gap-3 items-center flex-wrap">
                          {alerta.status !== 'respondido' && <p className={`text-xs ${prazo.cor}`}><IconMiniClock /> Limite: {alerta.prazo ? new Date(alerta.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '--'}</p>}
                          {alerta.data_vencimento && <p className="text-[11px] text-red-400 font-semibold border-l border-zinc-700 pl-3">Vencimento: {new Date(alerta.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>}
                          
                          {alerta.visualizado_em && (
                            <p className="text-[11px] text-blue-400 font-bold border-l border-zinc-700 pl-3 flex items-center" title="Cliente abriu a notificação no portal">
                              <IconEye /> Visto em: {formatarDataHora(alerta.visualizado_em)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0 flex-wrap sm:flex-nowrap">
                        <button onClick={() => preencherCopiaAlerta(alerta)} className="flex-1 md:flex-none text-xs bg-[#d4af37]/10 hover:bg-[#d4af37] hover:text-[#0d1b2a] border border-[#d4af37]/30 px-3 py-2 rounded text-[#d4af37] font-bold transition flex items-center justify-center"><IconRepeat /> Repetir</button>
                        
                        {alerta.status === 'respondido' && alerta.caminho_arquivo && (
                          <>
                            <button onClick={(e) => { e.preventDefault(); visualizarDocumento(alerta.caminho_arquivo); }} className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded text-xs font-bold text-white transition">Visualizar</button>
                            <button onClick={(e) => { e.preventDefault(); baixarDocumento(alerta.caminho_arquivo); }} className="flex-1 md:flex-none border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] px-4 py-2 rounded text-xs font-bold transition">Baixar</button>
                          </>
                        )}
                        
                        <button onClick={() => deletarAlerta(alerta.id)} className="flex-1 md:flex-none text-xs bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-2 rounded text-red-400 transition">Apagar</button>
                      </div>
                    </div>
                  );
                })}

                {subAbaAlerta === 'historico_avisos' && renderLista(alertasHistoricoAvisos, (alerta) => {
                  return (
                    <div key={alerta.id} className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${alerta.status === 'respondido' ? 'opacity-50 bg-[#0d1b2a]/40' : 'bg-[#1b263b] hover:bg-zinc-800/20'}`}>
                      <div className="min-w-0 flex-1 w-full">
                        <div className="flex gap-2 items-center mb-1 flex-wrap">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase whitespace-nowrap ${alerta.status === 'pendente' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>{alerta.status === 'pendente' ? 'Não Lido' : 'Lido'}</span>
                          
                          {alerta.enviado_email ? (
                            <span className="text-[10px] font-bold text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/30 flex items-center whitespace-nowrap"><IconMail /> E-mail e Portal</span>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 flex items-center whitespace-nowrap"><IconGlobe /> Apenas Portal</span>
                          )}
                          
                          <span className="text-xs font-bold text-zinc-300 truncate max-w-full">{alerta.clientes?.nome_empresa}</span>
                          {alerta.responsavel && <span className="text-[10px] bg-[#1b263b] text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 whitespace-nowrap">Resp: {alerta.responsavel.split(' ')[0]}</span>}
                        </div>
                        <p className="text-sm font-medium text-[#d4af37] mt-2 mb-1 truncate">{alerta.titulo} <span className="text-xs text-zinc-500 ml-1 font-normal">({alerta.tipo_documento})</span></p>
                        <div className="flex gap-3 items-center flex-wrap">
                          {alerta.data_vencimento && <p className="text-[11px] text-red-400 font-semibold">Vencimento/Evento: {new Date(alerta.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>}
                          {alerta.visualizado_em && (
                            <p className="text-[11px] text-blue-400 font-bold flex items-center" title="Cliente abriu a notificação no portal">
                              <IconEye /> Visto em: {formatarDataHora(alerta.visualizado_em)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0 flex-wrap sm:flex-nowrap">
                        <button onClick={() => preencherCopiaAlerta(alerta)} className="flex-1 md:flex-none text-xs bg-[#d4af37]/10 hover:bg-[#d4af37] hover:text-[#0d1b2a] border border-[#d4af37]/30 px-3 py-2 rounded text-[#d4af37] font-bold transition flex items-center justify-center"><IconRepeat /> Repetir</button>
                        <button onClick={() => deletarAlerta(alerta.id)} className="flex-1 md:flex-none text-xs bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-2 rounded text-red-400 transition">Apagar</button>
                      </div>
                    </div>
                  );
                })}

                {subAbaAlerta === 'historico_envios' && renderLista(alertasHistoricoEnvios, (alerta) => {
                  return (
                    <div key={alerta.id} className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${alerta.status === 'respondido' ? 'opacity-50 bg-[#0d1b2a]/40' : 'bg-[#1b263b] hover:bg-zinc-800/20'}`}>
                      <div className="min-w-0 flex-1 w-full">
                        <div className="flex gap-2 items-center mb-1 flex-wrap">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase whitespace-nowrap bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Documento Enviado</span>
                          
                          {alerta.enviado_email ? (
                            <span className="text-[10px] font-bold text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/30 flex items-center whitespace-nowrap"><IconMail /> E-mail e Portal</span>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 flex items-center whitespace-nowrap"><IconGlobe /> Apenas Portal</span>
                          )}
                          
                          <span className="text-xs font-bold text-zinc-300 truncate max-w-full">{alerta.clientes?.nome_empresa}</span>
                          {alerta.responsavel && <span className="text-[10px] bg-[#1b263b] text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 whitespace-nowrap">Resp: {alerta.responsavel.split(' ')[0]}</span>}
                        </div>
                        <p className="text-sm font-medium text-emerald-400 mt-2 mb-1 truncate">{alerta.titulo} <span className="text-xs text-zinc-500 ml-1 font-normal">({alerta.tipo_documento})</span></p>
                        <div className="flex gap-3 items-center flex-wrap">
                          {alerta.visualizado_em && (
                            <p className="text-[11px] text-blue-400 font-bold flex items-center" title="Cliente abriu a notificação no portal">
                              <IconEye /> Visto em: {formatarDataHora(alerta.visualizado_em)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0 flex-wrap sm:flex-nowrap">
                        {alerta.caminho_arquivo && (
                          <>
                            <button onClick={(e) => { e.preventDefault(); visualizarDocumento(alerta.caminho_arquivo); }} className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded text-xs font-bold transition border border-zinc-700">Visualizar</button>
                            <button onClick={(e) => { e.preventDefault(); baixarDocumento(alerta.caminho_arquivo); }} className="flex-1 md:flex-none border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] px-4 py-2 rounded text-xs font-bold transition">Baixar Documento</button>
                          </>
                        )}
                        <button onClick={() => preencherCopiaAlerta(alerta)} className="flex-1 md:flex-none text-xs bg-[#d4af37]/10 hover:bg-[#d4af37] hover:text-[#0d1b2a] border border-[#d4af37]/30 px-3 py-2 rounded text-[#d4af37] font-bold transition flex items-center justify-center"><IconRepeat /> Repetir</button>
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
            <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-4">
              <button onClick={() => { setSubAbaDemanda('pendentes'); rolarPara('area-lista-demandas'); }} className={`flex-1 sm:flex-none justify-center px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition ${subAbaDemanda === 'pendentes' ? 'bg-[#d4af37] text-[#0d1b2a]' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>Tarefas Pendentes</button>
              <button onClick={() => { setSubAbaDemanda('concluidas'); rolarPara('area-lista-demandas'); }} className={`flex-1 sm:flex-none justify-center px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition ${subAbaDemanda === 'concluidas' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>Concluídas</button>
              {eGestor && (
                <button onClick={() => { setSubAbaDemanda('analise'); rolarPara('area-lista-demandas'); }} className={`w-full sm:w-auto justify-center px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center ${subAbaDemanda === 'analise' ? 'bg-rose-500 text-white' : 'bg-[#1b263b] border border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}><IconChartMini /> Análise de Equipe</button>
              )}
            </div>

            {subAbaDemanda !== 'analise' && (
              <div className="bg-[#1b263b] p-6 rounded-xl border border-zinc-800 shadow-xl mb-6">
                <h2 className="text-sm font-bold text-white mb-4">Atribuir Nova Tarefa Interna</h2>
                <form onSubmit={handleCriarDemanda} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">O que precisa ser feito?</label>
                    <input type="text" required placeholder="Ex: Revisar balancete..." value={formDemanda.descricao} onChange={e => setFormDemanda({...formDemanda, descricao: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 sm:py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Para quem?</label>
                    <select value={formDemanda.atribuido_para} onChange={e => setFormDemanda({...formDemanda, atribuido_para: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-3 py-3 sm:py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]">
                      {LISTA_COLABORADORES.map((colab, i) => <option key={i} value={colab}>{colab}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Prazo Final</label>
                      <input type="date" required value={formDemanda.data_entrega} onChange={e => setFormDemanda({...formDemanda, data_entrega: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-2 py-2.5 sm:py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Nível</label>
                      <select value={formDemanda.prioridade} onChange={e => setFormDemanda({...formDemanda, prioridade: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-2 py-3 sm:py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]">
                        <option value="Alta">Alta</option>
                        <option value="Média">Média</option>
                        <option value="Baixa">Baixa</option>
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-4 flex justify-end mt-2">
                    <button type="submit" disabled={subindo} className="w-full md:w-auto bg-[#d4af37] text-[#0d1b2a] font-extrabold px-6 py-3.5 sm:py-2.5 rounded-lg text-sm hover:bg-yellow-500 transition shadow-lg">{subindo ? 'A processar...' : 'Publicar Tarefa'}</button>
                  </div>
                </form>
              </div>
            )}

            <div id="area-lista-demandas"></div> {/* Âncora Invisível para Rolagem */}

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
                  
                  // NOVO: Puxa os Tickets do Colaborador
                  const ticketsAbertos = pedidosCliente.filter(p => p.responsavel === colab && p.status === 'pendente').length;

                  return (
                    <div key={colab} className="bg-[#1b263b] p-5 rounded-xl border border-zinc-800 shadow-xl">
                      <h3 className="text-lg font-bold text-[#d4af37] mb-4 border-b border-zinc-800 pb-2">{colab}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm"><span className="text-zinc-400">Tickets Abertos</span><span className={`font-bold ${ticketsAbertos > 0 ? 'text-blue-400' : 'text-zinc-500'}`}>{ticketsAbertos}</span></div>
                        <div className="flex justify-between items-center text-sm"><span className="text-zinc-400">Demandas Em Andamento</span><span className="font-bold text-amber-400">{emAndamento}</span></div>
                        <div className="flex justify-between items-center text-sm"><span className="text-zinc-400">Tarefas Entregues</span><span className="font-bold text-emerald-400">{concluidas}</span></div>
                        <div className="flex justify-between items-center text-sm border-t border-zinc-800 pt-3"><span className="text-red-400 font-semibold">Demandas Atrasadas</span><span className={`font-extrabold text-lg ${emAtraso > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`}>{emAtraso}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      {/* BOTAO DE CARREGAR MAIS (PAGINAÇÃO) */}
        {temMaisDados && (
          <div className="flex justify-center mt-8 mb-12">
            <button onClick={handleCarregarMais} disabled={carregandoMais} className="bg-[#1b263b] border border-[#d4af37]/50 text-[#d4af37] px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#d4af37] hover:text-[#0d1b2a] transition-all flex items-center gap-2">
              {carregandoMais ? <span className="animate-spin border-2 border-current border-t-transparent rounded-full w-4 h-4"></span> : '▼'}
              {carregandoMais ? 'Buscando registros antigos...' : 'Carregar Mais Registros'}
            </button>
          </div>
        )}

      </div>

      {/* MODAL DE RESPOSTA À SOLICITAÇÃO DO CLIENTE */}
      {modalRespostaPedido.aberto && (
        <div className="fixed inset-0 bg-[#0d1b2a]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]">
          <div className="bg-[#1b263b] border border-[#d4af37]/50 rounded-xl w-full max-w-lg flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl">
              <div>
                <h3 className="text-lg font-bold text-[#d4af37]">Responder Solicitação</h3>
                <p className="text-[10px] text-zinc-400 mt-1">Cliente: {modalRespostaPedido.pedido?.clientes?.nome_empresa}</p>
              </div>
              <button type="button" onClick={() => setModalRespostaPedido({ aberto: false, pedido: null, texto: '', arquivo: null })} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <form onSubmit={handleResponderPedido} className="p-5 space-y-4">
              <div className="bg-[#0d1b2a] p-3 rounded-lg border border-zinc-800 mb-4">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Pedido Original:</p>
                <p className="text-sm text-zinc-300 italic">"{modalRespostaPedido.pedido?.descricao}"</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Sua Resposta (Opcional)</label>
                <textarea 
                  rows="3" 
                  placeholder="Escreva uma mensagem ou instrução para o cliente..." 
                  value={modalRespostaPedido.texto} 
                  onChange={(e) => setModalRespostaPedido({...modalRespostaPedido, texto: e.target.value})}
                  className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Anexar Documento (Opcional)</label>
                <input 
                  type="file" 
                  accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" 
                  onChange={(e) => setModalRespostaPedido({...modalRespostaPedido, arquivo: e.target.files[0]})}
                  className="text-xs text-zinc-400 bg-[#0d1b2a] border border-zinc-800 rounded-lg p-2 w-full cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#d4af37]/10 file:text-[#d4af37] hover:file:bg-[#d4af37]/20" 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800 mt-2">
                <button type="button" onClick={() => setModalRespostaPedido({ aberto: false, pedido: null, texto: '', arquivo: null })} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindo} className="bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-lg disabled:opacity-50">
                  {subindo ? 'A enviar...' : 'Enviar e Finalizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                {dialogo.btnCancelar || 'Cancelar'}
              </button>
              <button 
                onClick={() => { if(dialogo.acao) dialogo.acao(); setDialogo({ ...dialogo, aberto: false }); }} 
                className={`px-5 py-2.5 text-[#0d1b2a] text-sm font-extrabold rounded-lg transition shadow-lg ${dialogo.tipo === 'perigo' ? 'bg-red-500 hover:bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-[#d4af37] hover:bg-yellow-500 shadow-[0_0_15px_rgba(212,175,55,0.3)]'}`}
              >
                {dialogo.btnConfirmar || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛑 A TRAVA ANTI-DEDO NERVOSO (Overlay Global de Processamento) */}
      {subindo && (
        <div className="fixed inset-0 z-[99999999] bg-[#0d1b2a]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1b263b] p-8 rounded-2xl border border-[#d4af37]/40 flex flex-col items-center gap-5 shadow-[0_0_60px_rgba(212,175,55,0.2)] animate-in zoom-in duration-200 w-full max-w-sm">
            
            {progressoSync ? (
              <div className="w-full flex flex-col items-center">
                <div className="text-5xl mb-4 animate-bounce drop-shadow-lg">📂</div>
                <h3 className="text-white font-black text-lg mb-2 tracking-wide">Sincronização em Andamento</h3>
                
                <div className="bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-4">
                  {progressoSync.fase === 'Concluído' ? 'Finalizando...' : `Fase ${progressoSync.fase} de ${progressoSync.totalFases}: ${progressoSync.nomeFase}`}
                </div>

                <p className="text-[#d4af37] font-black text-3xl mb-4">{Math.round((progressoSync.atual / progressoSync.total) * 100)}%</p>
                
                <div className="w-full bg-zinc-800 rounded-full h-3.5 mb-3 overflow-hidden border border-zinc-700 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-yellow-600 to-[#d4af37] h-full rounded-full transition-all duration-300 relative overflow-hidden" 
                    style={{ width: `${(progressoSync.atual / progressoSync.total) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_linear_infinite]"></div>
                  </div>
                </div>
                
                <p className="text-xs text-zinc-400 truncate w-full text-center">Processando: <strong className="text-zinc-200">{progressoSync.texto}</strong></p>
                <p className="text-[10px] text-zinc-500 mt-2 font-bold bg-[#0d1b2a] px-3 py-1 rounded-full border border-zinc-800 uppercase tracking-widest">
                  {progressoSync.atual} de {progressoSync.total} {progressoSync.tipo}
                </p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 border-4 border-zinc-700 border-t-[#d4af37] rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.2)] mt-2"></div>
                <p className="text-[#d4af37] font-black tracking-widest uppercase text-sm mt-2 animate-pulse drop-shadow-md">A processar...</p>
              </>
            )}
            
          </div>
        </div>
      )}

{/* 🚀 NOVO: MODAL UNIFICADO PARA ADICIONAR CLIENTES */}
      {modalAdicionar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999999]">
          <div className="bg-[#1b263b] border border-zinc-700 rounded-xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#d4af37]">Adicionar Novo Cliente</h3>
              <button type="button" onClick={() => setModalAdicionar(false)} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <div className="flex bg-[#0d1b2a] p-1 border-b border-zinc-800">
              <button onClick={() => setAbaAdicionar('manual')} className={`flex-1 px-4 py-3 text-[10px] sm:text-xs font-bold transition-all ${abaAdicionar === 'manual' ? 'bg-[#1b263b] text-white border-b-2 border-[#d4af37]' : 'text-zinc-500 hover:text-zinc-300'}`}>Adição Manual</button>
              <button onClick={() => setAbaAdicionar('mensalista')} className={`flex-1 px-4 py-3 text-[10px] sm:text-xs font-bold transition-all ${abaAdicionar === 'mensalista' ? 'bg-[#1b263b] text-white border-b-2 border-purple-500' : 'text-zinc-500 hover:text-zinc-300'}`}>Adição Mensalista</button>
              <button onClick={() => setAbaAdicionar('csv')} className={`flex-1 px-4 py-3 text-[10px] sm:text-xs font-bold transition-all ${abaAdicionar === 'csv' ? 'bg-[#1b263b] text-white border-b-2 border-[#d4af37]' : 'text-zinc-500 hover:text-zinc-300'}`}>Importar CSV</button>
            </div>

            <div className="p-5">
              {abaAdicionar === 'mensalista' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Buscar Cliente Mensalista</label>
                    <input type="text" placeholder="Nome ou CNPJ da empresa..." value={buscaMensalista} onChange={e => setBuscaMensalista(e.target.value)} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
                    {clientes.filter(c => !(c.tipo_conta === 'especiais' || c.tipo_conta === 'especial' || (c.cpf && c.cpf.trim() !== '')) && (c.nome_empresa?.toLowerCase().includes(buscaMensalista.toLowerCase()) || c.cnpj?.includes(buscaMensalista))).map(cli => (
                      <div key={cli.id} className="flex justify-between items-center bg-[#0d1b2a] border border-zinc-800 p-3 rounded-lg hover:border-purple-500/50 transition">
                        <div className="flex flex-col truncate pr-2">
                          <p className="text-sm font-bold text-white truncate">{cli.nome_empresa}</p>
                          <p className="text-[10px] text-zinc-500">CNPJ: {cli.cnpj}</p>
                        </div>
                        <button onClick={() => handleDesbloquearSocietario(cli)} disabled={subindo} className="bg-purple-500 text-white text-[10px] font-bold px-3 py-2 rounded hover:bg-purple-400 transition shadow-sm whitespace-nowrap">
                          Desbloquear Aba
                        </button>
                      </div>
                    ))}
                    {buscaMensalista && clientes.filter(c => !(c.tipo_conta === 'especiais' || c.tipo_conta === 'especial' || (c.cpf && c.cpf.trim() !== '')) && (c.nome_empresa?.toLowerCase().includes(buscaMensalista.toLowerCase()) || c.cnpj?.includes(buscaMensalista))).length === 0 && (
                      <p className="text-xs text-zinc-500 text-center py-4">Nenhum cliente mensalista encontrado com esta busca.</p>
                    )}
                  </div>
                </div>
              )}

              {abaAdicionar === 'manual' && (
                <form onSubmit={handleAdicionarManual} className="space-y-4">
                  <div className="flex bg-[#0d1b2a] p-1 rounded-lg border border-zinc-700 w-full">
                    <button type="button" onClick={() => setTipoAdicionar('mensalista')} className={`flex-1 px-4 py-2 rounded-md text-xs font-bold transition-all ${tipoAdicionar === 'mensalista' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>Mensalista (CNPJ)</button>
                    <button type="button" onClick={() => setTipoAdicionar('especiais')} className={`flex-1 px-4 py-2 rounded-md text-xs font-bold transition-all ${tipoAdicionar === 'especiais' ? 'bg-purple-500 text-white' : 'text-zinc-400 hover:text-white'}`}>Societário (CPF)</button>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Nome / Razão Social</label>
                    <input type="text" required value={formManual.nome_empresa} onChange={e => setFormManual({...formManual, nome_empresa: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#d4af37] outline-none" />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Documento ({tipoAdicionar === 'especiais' ? 'CPF' : 'CNPJ'})</label>
                    <input type="text" required value={formManual.documento} onChange={e => setFormManual({...formManual, documento: e.target.value})} placeholder={tipoAdicionar === 'especiais' ? '000.000.000-00' : '00.000.000/0001-00'} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#d4af37] outline-none font-mono" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Nome do Contato</label>
                      <input type="text" value={formManual.nome_contato} onChange={e => setFormManual({...formManual, nome_contato: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#d4af37] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">E-mail</label>
                      <input type="email" value={formManual.email} onChange={e => setFormManual({...formManual, email: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#d4af37] outline-none" />
                    </div>
                  </div>

                  <div className={`grid gap-3 ${tipoAdicionar === 'mensalista' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    <div className="w-full">
                      <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Telefone / Celular</label>
                      <input type="text" value={formManual.celular} onChange={e => setFormManual({...formManual, celular: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#d4af37] outline-none" />
                    </div>
                    {tipoAdicionar === 'mensalista' && (
                      <div className="w-full">
                        <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Regime Tributário</label>
                        <select value={formManual.regime_tributario} onChange={e => setFormManual({...formManual, regime_tributario: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#d4af37] outline-none cursor-pointer">
                          <option value="Simples Nacional">Simples Nacional</option>
                          <option value="Lucro Presumido">Lucro Presumido</option>
                          <option value="Lucro Real">Lucro Real</option>
                          <option value="MEI">MEI</option>
                          <option value="Pessoa Física">Pessoa Física</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end gap-2 border-t border-zinc-800">
                    <button type="submit" disabled={subindo} className="w-full bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-5 py-3 rounded-lg text-sm font-extrabold transition shadow-lg">
                      {subindo ? 'Salvando...' : 'Cadastrar Cliente'}
                    </button>
                  </div>
                </form>
              )}

              {abaAdicionar === 'csv' && (
                <div className="space-y-6">
                  <div className="bg-[#0d1b2a] p-4 rounded-lg border border-zinc-700">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-3">Esta planilha é de clientes Mensalistas ou Societário?</label>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${tipoImportacaoCsv === 'mensalista' ? 'bg-zinc-800 border-zinc-500 text-white' : 'bg-[#1b263b] border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                        <input type="radio" name="tipo_csv" className="accent-[#d4af37] w-4 h-4 cursor-pointer" checked={tipoImportacaoCsv === 'mensalista'} onChange={() => setTipoImportacaoCsv('mensalista')} />
                        <span className="text-sm font-bold">Mensalistas (CNPJ)</span>
                      </label>
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${tipoImportacaoCsv === 'especiais' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-[#1b263b] border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                        <input type="radio" name="tipo_csv" className="accent-purple-500 w-4 h-4 cursor-pointer" checked={tipoImportacaoCsv === 'especiais'} onChange={() => setTipoImportacaoCsv('especiais')} />
                        <span className="text-sm font-bold">Societário (CPF)</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-400 font-bold mb-2">Formato Exigido do CSV:</p>
                    {tipoImportacaoCsv === 'especiais' ? (
                      <p className="text-[10px] text-zinc-400 font-mono">1. Nome | 2. CPF | 3. Nome Contato | 4. E-mail | 5. Telefone</p>
                    ) : (
                      <p className="text-[10px] text-zinc-400 font-mono">1. Empresa | 2. CNPJ | 3. Nome Contato | 4. E-mail | 5. Celular | 6. Regime</p>
                    )}
                  </div>

                  <label className="w-full bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-5 py-3 rounded-lg font-bold text-sm transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
                    <IconDocument /> Buscar Arquivo CSV
                    <input type="file" accept=".csv" className="hidden" onChange={handleUploadCSV} />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📝 MODAL DE EDIÇÃO MANUAL DE CLIENTE */}
      {modalEditarCliente.aberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999999]">
          <div className="bg-[#1b263b] border border-zinc-700 rounded-xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-[#d4af37]">Editar Cadastro</h3>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Documento: {modalEditarCliente.cliente?.cnpj || modalEditarCliente.cliente?.cpf || 'Não informado'}</p>
              </div>
              <button type="button" onClick={() => setModalEditarCliente({ aberto: false, cliente: null })} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={handleEditarClienteManual} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Razão Social / Nome Fantasia</label>
                <input type="text" required value={formEditar.nome_empresa} onChange={e => setFormEditar({...formEditar, nome_empresa: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#d4af37] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Nome do Contato</label>
                <input type="text" required value={formEditar.nome_contato} onChange={e => setFormEditar({...formEditar, nome_contato: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#d4af37] outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">E-mail</label>
                  <input type="email" required value={formEditar.email} onChange={e => setFormEditar({...formEditar, email: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#d4af37] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Telefone Celular</label>
                  <input type="text" required value={formEditar.celular} onChange={e => setFormEditar({...formEditar, celular: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#d4af37] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Regime Tributário</label>
                <select value={formEditar.regime_tributario} onChange={e => setFormEditar({...formEditar, regime_tributario: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#d4af37] outline-none cursor-pointer">
                  <option value="Simples Nacional">Simples Nacional</option>
                  <option value="Lucro Presumido">Lucro Presumido</option>
                  <option value="Lucro Real">Lucro Real</option>
                  <option value="MEI">MEI</option>
                  <option value="Pessoa Física">Pessoa Física</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-zinc-800">
                <button type="button" onClick={() => setModalEditarCliente({ aberto: false, cliente: null })} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindo} className="bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-5 py-2 rounded-lg text-xs font-extrabold transition shadow-lg">
                  {subindo ? 'Salvando...' : 'Salvar Alterações'}
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