'use client';
import { useEffect, useState, use, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { enviarEmailDemanda, enviarEmailDocumento } from '../../lib/email'; 
import { inscreverAparelho, dispararPush } from '../../lib/push'; 
import DOMPurify from 'dompurify'; 
import bcrypt from 'bcryptjs'; // <-- NOVO: Importando criptografia forte

// Função de Criptografia Definitiva (Bcrypt) para novos Sócios
const encriptarSenha = (text) => {
  if (!text) return '';
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(text, salt);
};

// Dicionário rápido para mapear nome da equipe para e-mail
const OBTER_EMAIL_FUNCIONARIO = {
  'Lucas (Financeiro)': 'lucas@innovbusiness.com.br'
};

const MAPA_DEPARTAMENTO_EMAIL = {
  'Contábil': 'contabil@innovbusiness.com.br',
  'Fiscal': 'fiscal@innovbusiness.com.br',
  'DP / RH': 'rh@innovbusiness.com.br',
  'Financeiro': 'lucas@innovbusiness.com.br',
  'Societário': 'societario@innovbusiness.com.br',
  'Legalização': 'societario@innovbusiness.com.br',
  'Outros': 'suporte@innovbusiness.com.br',
  'Outros / Dúvida Geral': 'suporte@innovbusiness.com.br',
  'Outros / Suporte': 'suporte@innovbusiness.com.br'
};

// Função para avisar a equipa automaticamente
function notificarEquipaDepto(depto, nomeEmpresa, assunto) {
  const email = MAPA_DEPARTAMENTO_EMAIL[depto];
  if(email) {
    enviarEmailDemanda({
      to: email,
      nomeDestinatario: `Equipa ${depto}`,
      nomeRemetente: nomeEmpresa,
      tituloDemanda: assunto,
      descricao: `O cliente ${nomeEmpresa} enviou uma nova interação no Portal. Acesse o sistema para verificar.`,
      prazo: 'Aguardando Análise'
    }).catch(()=>{}); // Ignora erros para não travar a tela
  }
}

// ==========================================
// ÍCONES PREMIUM (SVG) DA MARCA
// ==========================================
const IconFolderTab = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
const IconUploadTab = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const IconChatTab = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const IconBellTab = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const IconTrashTab = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const IconFolderLarge = () => <svg className="w-8 h-8 text-[#d4af37] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
const IconChartLarge = () => <svg className="w-8 h-8 text-[#d4af37] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const IconUsersLarge = () => <svg className="w-8 h-8 text-[#d4af37] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const IconDocLarge = () => <svg className="w-8 h-8 text-[#d4af37] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconSocietarioLarge = () => <svg className="w-8 h-8 text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const IconFinanceiroLarge = () => <svg className="w-8 h-8 text-[#d4af37] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// Nova inteligência de meses do Financeiro com suporte a Múltiplos Anos
const getCicloFinanceiro = (ano) => {
  // Retrocompatibilidade: Se for 2026, mantém a ref exata antiga para não sumir com os dados já salvos no banco!
  const s = ano === 2026 ? '' : ` ${ano}`;
  const sJan = ano === 2026 ? '' : ` ${ano + 1}`;
  
  return [
    { id: '02', ref: `Fevereiro${s}`, servico: `Jan`, pag: `Fevereiro ${ano}` },
    { id: '03', ref: `Março${s}`, servico: `Fev`, pag: `Março ${ano}` },
    { id: '04', ref: `Abril${s}`, servico: `Mar`, pag: `Abril ${ano}` },
    { id: '05', ref: `Maio${s}`, servico: `Abr`, pag: `Maio ${ano}` },
    { id: '06', ref: `Junho${s}`, servico: `Mai`, pag: `Junho ${ano}` },
    { id: '07', ref: `Julho${s}`, servico: `Jun`, pag: `Julho ${ano}` },
    { id: '08', ref: `Agosto${s}`, servico: `Jul`, pag: `Agosto ${ano}` },
    { id: '09', ref: `Setembro${s}`, servico: `Ago`, pag: `Setembro ${ano}` },
    { id: '10', ref: `Outubro${s}`, servico: `Set`, pag: `Outubro ${ano}` },
    { id: '11', ref: `Novembro${s}`, servico: `Out`, pag: `Novembro ${ano}` },
    { id: '12', ref: `Dezembro${s}`, servico: `Nov`, pag: `Dezembro ${ano}` },
    { id: '13', ref: `Janeiro${sJan}`, servico: `Dez`, pag: `Janeiro ${ano + 1}` }
  ];
};

const IconFolderSolid = () => <svg className="w-6 h-6 text-[#d4af37]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>;
const IconFile = () => <svg className="w-6 h-6 text-[#d4af37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const IconSearch = () => <svg className="w-4 h-4 text-zinc-500 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconMiniClock = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconCheck = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>;
const IconClip = () => <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const IconChatList = () => <svg className="w-6 h-6 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const IconDots = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>;
const IconEye = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>;
const IconRestore = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

// NOVOS ÍCONES DE BANNER (Premium e Proporcionais)
const IconAlertRed = () => <svg className="w-10 h-10 text-red-500 flex-shrink-0 animate-pulse drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const IconWarningOrange = () => <svg className="w-10 h-10 text-orange-500 flex-shrink-0 animate-bounce drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconCheckGreen = () => <svg className="w-10 h-10 text-emerald-500 flex-shrink-0 animate-bounce drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconInfoBlue = () => <svg className="w-10 h-10 text-blue-400 flex-shrink-0 animate-pulse drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// NOVOS ÍCONES PARA LINKS ÚTEIS
const IconLinkTab = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const IconCopy = () => <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const IconExternal = () => <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;

function formatarPrazoSemAno(dataString) {
  if (!dataString) return '';
  const partes = dataString.split('-');
  if(partes.length === 3) return `dia ${partes[2]}/${partes[1]}`;
  return dataString;
}

function formatarDataHoraEnviado(dataString) {
  if (!dataString) return '';
  const data = new Date(dataString);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const horas = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');
  return `${dia}/${mes} às ${horas}h${minutos}`;
}

function calcularDiasLixeira(dataISO) {
  if (!dataISO) return 0;
  const exclusao = new Date(dataISO);
  const hoje = new Date();
  const diffTempo = hoje.getTime() - exclusao.getTime();
  const diffDias = Math.floor(diffTempo / (1000 * 3600 * 24));
  const restantes = 30 - diffDias;
  return restantes < 0 ? 0 : restantes;
}

const maskCNPJ = (value) => value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18);
const maskCelular = (value) => value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').substring(0, 15);
const validarCNPJ = (cnpj) => cnpj.replace(/[^\d]+/g, '').length === 14;

export default function MensalistaView({ params: paramsPromise }) {
  const router = useRouter();
  const [sessaoExpirada, setSessaoExpirada] = useState(false);

  useEffect(() => {
    const handleSessaoExpirada = () => setSessaoExpirada(true);
    window.addEventListener('sessao_expirada', handleSessaoExpirada);

    // 🛑 BLOQUEIO GLOBAL: Proíbe o navegador de baixar ou abrir ficheiros arrastados acidentalmente
    const bloquearDownloadBrowser = (e) => e.preventDefault();
    window.addEventListener('dragover', bloquearDownloadBrowser, { passive: false });
    window.addEventListener('drop', bloquearDownloadBrowser, { passive: false });

    return () => {
      window.removeEventListener('sessao_expirada', handleSessaoExpirada);
      window.removeEventListener('dragover', bloquearDownloadBrowser);
      window.removeEventListener('drop', bloquearDownloadBrowser);
    };
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

  const params = use(paramsPromise);
  const { id } = params;

  const [cliente, setCliente] = useState(null);
  
  const [abaPrincipal, setAbaPrincipal] = useState('pastas'); 
  const [pastaAtiva, setPastaAtiva] = useState(null); 
  
  // ESTADOS DE PASTAS E SUBPASTAS
  const [pastas, setPastas] = useState([]);
  const [subpastaAtiva, setSubpastaAtiva] = useState(null);

  // ESTADOS PARA OS BOTÕES MOVER, RENOMEAR E MULTI-SELEÇÃO
  const [arquivosMovendo, setArquivosMovendo] = useState([]); 
  const [destinoPastaMover, setDestinoPastaMover] = useState('');
  
  const [arquivoRenomeando, setArquivoRenomeando] = useState(null);
  const [novoNomeArquivo, setNovoNomeArquivo] = useState('');
  
  const [selecionados, setSelecionados] = useState([]);
  const [modoSelecao, setModoSelecao] = useState(false); // NOVO: Controla a exibição das caixinhas
  const [menuAberto, setMenuAberto] = useState(null); // NOVO: Controla o dropdown de 3 pontinhos
  
  // EXCLUSIVOS DO LUCAS (FINANCEIRO) - Multi Pastas
  const [modoSelecaoPastas, setModoSelecaoPastas] = useState(false);
  const [pastasSelecionadas, setPastasSelecionadas] = useState([]);
  const [modalMultiPastas, setModalMultiPastas] = useState({ aberto: false, nomes: [''] });

  const [arquivos, setArquivos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [itensLixeira, setItensLixeira] = useState([]);
  const [boletosDaAPI, setBoletosDaAPI] = useState([]); 
  const [novoPedido, setNovoPedido] = useState('');
  const [anoFinanceiro, setAnoFinanceiro] = useState(new Date().getFullYear()); // NOVO: Controle de Ano Automático
  const [processos, setProcessos] = useState([]);
  const [badgeSocietario, setBadgeSocietario] = useState(0);
  const [departamentoPedido, setDepartamentoPedido] = useState('Contábil'); // NOVO: Filtro de Departamento
  const [arquivoPedido, setArquivoPedido] = useState(null); // NOVO: Anexo no ticket do cliente
  
  // ESTADOS DA TRÉPLICA (RESPONDER POR BAIXO DO CARD)
  const [chamadoReabrindo, setChamadoReabrindo] = useState(null);
  const [textoReplica, setTextoReplica] = useState('');
  
  // ESTADOS DO MURAL DE AVISOS
  const [subAbaAviso, setSubAbaAviso] = useState('ativos');
  const [expandidosAvisos, setExpandidosAvisos] = useState({});

  // NOVO: ESTADOS DO MODAL DE DÚVIDA RÁPIDA NO ARQUIVO
  const [modalDuvidaArquivo, setModalDuvidaArquivo] = useState({ aberto: false, arquivo: null, texto: '' });

  async function handleEnviarDuvidaArquivo(e) {
    e.preventDefault();
    if (!modalDuvidaArquivo.texto.trim()) return;
    setSubindoArquivo(true);
    
    const arq = modalDuvidaArquivo.arquivo;
    const depto = arq.setor === 'financeiro' ? 'Financeiro' : (arq.setor === 'rh' ? 'DP / RH' : 'Contábil');
    const descFinal = `[Referente ao arquivo: ${arq.nome_original}]\n\nDúvida: ${modalDuvidaArquivo.texto.trim()}`;

    const { error } = await supabase.from('pedidos_cliente').insert([{ 
      cliente_id: id, 
      descricao: descFinal, 
      status: 'pendente',
      departamento: depto,
      caminho_arquivo: arq.caminho_storage, // Anexa o arquivo automaticamente!
      nome_arquivo: arq.nome_original
    }]);

    if (!error) {
      mostrarToast(`Dúvida enviada para a equipa com sucesso!`, 'sucesso');
      setModalDuvidaArquivo({ aberto: false, arquivo: null, texto: '' });
    } else {
      mostrarToast('Erro ao enviar dúvida: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  // NOVO: ESTADOS PARA OS DISCLAIMERS E BOLINHAS VERDES
  const [textosPastas, setTextosPastas] = useState({});
  const [arquivosNaoLidos, setArquivosNaoLidos] = useState([]);
  const [modalTextoPasta, setModalTextoPasta] = useState({ aberto: false, setor: '', textoPadrao: '', textoVan: '' });
  
  // ESTADO DO MODAL DE RESPOSTA A SOLICITAÇÕES (ADMIN DENTRO DO PERFIL)
  const [modalRespostaPedido, setModalRespostaPedido] = useState({ aberto: false, pedido: null, texto: '', arquivo: null });

  async function handleResponderPedidoAdmin(e) {
    e.preventDefault();
    setSubindoArquivo(true);
    const { pedido, texto, arquivo } = modalRespostaPedido;

    let caminhoArquivo = null;
    let nomeOriginal = null;

    if (arquivo) {
      if (arquivo.size > 4.4 * 1024 * 1024) {
        mostrarToast('O arquivo excede o limite de 4.4MB.', 'erro');
        setSubindoArquivo(false);
        return;
      }
      const timestamp = Date.now();
      caminhoArquivo = `${pedido.cliente_id}/respostas_pedidos/${timestamp}_${arquivo.name}`;
      nomeOriginal = arquivo.name;
      
      const { error: storageError } = await supabase.storage.from('documentos').upload(caminhoArquivo, arquivo);
      if (storageError) {
        mostrarToast('Erro ao anexar arquivo: ' + storageError.message, 'erro');
        setSubindoArquivo(false);
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
      
      // Apita o celular do Cliente
      dispararPush(
        id, 
        'Resposta da Equipe 💬', 
        `O seu chamado sobre "${pedido.descricao.substring(0, 25)}..." foi respondido!`
      );

      setModalRespostaPedido({ aberto: false, pedido: null, texto: '', arquivo: null });
      await carregarDadosDaAba();
    } else {
      mostrarToast('Erro ao salvar resposta: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  const [alertasGlobaisPendentes, setAlertasGlobaisPendentes] = useState(0);
  const [alertasGlobaisAtrasados, setAlertasGlobaisAtrasados] = useState(0); // NOVO: Conta quem perdeu o prazo
  const [alertasGlobaisLembretes, setAlertasGlobaisLembretes] = useState(0); // NOVO: Conta avisos pendentes
  const [pedidosResolvidosNaoLidos, setPedidosResolvidosNaoLidos] = useState(0); // NOVO: Banner verde
  const [subAbaSolicitacao, setSubAbaSolicitacao] = useState('ativas'); // NOVO: Filtro de abas
  const [subAbaAvisos, setSubAbaAvisos] = useState('recentes'); // NOVO: Filtro do Mural de Avisos
  const [avisosExpandidos, setAvisosExpandidos] = useState({}); // NOVO: Controle de abrir/fechar recados

  // ESTADO DO MODAL DE E-MAIL DO DOCUMENTO
  const [modalEmailDoc, setModalEmailDoc] = useState({ aberto: false, arquivo: null, titulo: 'Novo Documento Disponível', mensagem: '' });

  // ESTADOS DO MODAL DE PERFIL E SENHA
  const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  
  // NOVOS ESTADOS PARA GESTÃO DE SÓCIOS
  const [contaSelecionadaSenha, setContaSelecionadaSenha] = useState('principal');
  const [mostrarFormSocio, setMostrarFormSocio] = useState(false);
  const [formSocio, setFormSocio] = useState({ nome: '', email: '', celular: '' });
  
  // ESTADOS DOS LINKS ÚTEIS
  const [mostrarFormLink, setMostrarFormLink] = useState(false);
  const [formLink, setFormLink] = useState({ titulo: '', url: '', descricao: '', regime_alvo: 'Todos' });
  const [linkEditando, setLinkEditando] = useState(null); // Memória para saber se estamos editando
  const [progressoLink, setProgressoLink] = useState(null); // NOVO: Controle da barra de loading de 2 fases

  // ESTADOS PARA VÍNCULO DE MÚLTIPLOS CNPJS (ACCOUNT SWITCHER)
  const [mostrarFormVinculo, setMostrarFormVinculo] = useState(false);
  const [formVinculo, setFormVinculo] = useState({ cnpj: '', nome_empresa: '', nome_contato: '', email: '', celular: '', regime_tributario: '' });
  const [statusBuscaCnpj, setStatusBuscaCnpj] = useState('ocioso'); // ocioso, buscando, encontrado, nao_encontrado
  const [empresasLigadas, setEmpresasLigadas] = useState([]);
  const [mostrarSwitcher, setMostrarSwitcher] = useState(false);

  const [alertasSemArquivo, setAlertasSemArquivo] = useState({});
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [pedindoPush, setPedindoPush] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') setNotificacoesAtivas(false);
    }
  }, []);
  const [boletosSolicitados, setBoletosSolicitados] = useState([]); // Memória anti-spam
  const [mensalidadesPagas, setMensalidadesPagas] = useState([]); // Memória do checkbox

  const [toasts, setToasts] = useState([]); // Memória dos Toasts
  const [carregando, setCarregando] = useState(true);
  const [carregandoConteudo, setCarregandoConteudo] = useState(false);
  const [subindoArquivo, setSubindoArquivo] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // Radar do Drag & Drop

  // SISTEMA DE CONFIRMAÇÃO PREMIUM
  const [dialogo, setDialogo] = useState({ aberto: false, titulo: '', mensagem: '', acao: null, tipo: 'perigo' });
  function confirmarAcao(titulo, mensagem, acao, tipo = 'perigo') {
    setDialogo({ aberto: true, titulo, mensagem, acao, tipo });
  }

  // SISTEMA DE MODAL DE INPUT (Substitui os prompts nativos de Pastas e Arquivos)
  const [inputModal, setInputModal] = useState({ aberto: false, titulo: '', valor: '', placeholder: '', acao: null });
  function abrirInputModal(titulo, valorAtual, placeholder, acao) {
    setInputModal({ aberto: true, titulo, valor: valorAtual, placeholder, acao });
  }

  // FUNÇÃO MÁGICA DOS TOASTS (Remove sozinho após 4 segundos)
  function mostrarToast(mensagem, tipo = 'sucesso') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }

  // FUNÇÃO DE ROLAGEM SUAVE (Scroll Inteligente)
  function rolarPara(idElemento) {
    setTimeout(() => {
      const el = document.getElementById(idElemento);
      if (el) {
        // Desce até o elemento deixando 80px de margem respirável no topo
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100); // Aguarda o React renderizar a aba antes de descer
  }

  const [operador, setOperador] = useState('Desconhecido');
  const [isInterno, setIsInterno] = useState(false);
  
  // NOVO: Estados para edição manual do cliente pelo Admin na página do cliente
  const [modalEditarCliente, setModalEditarCliente] = useState(false);
  const [formEditar, setFormEditar] = useState({ nome_empresa: '', nome_contato: '', email: '', celular: '', dia_vencimento: 20 });
  
  // ESTADOS MÁGICOS PARA O VÍNCULO DIRETO DO ADMIN
  const [todosClientesParaLink, setTodosClientesParaLink] = useState([]);
  const [buscaLink, setBuscaLink] = useState('');
  const [empresasLigadasForm, setEmpresasLigadasForm] = useState([]);
  const [mostrarAutoLink, setMostrarAutoLink] = useState(false);

  async function handleSalvarEdicaoManual(e) {
    e.preventDefault();
    setSubindoArquivo(true);

    const novosVinculosIds = empresasLigadasForm.map(e => e.id);
    const velhosVinculosIds = cliente.empresas_vinculadas || [];
    
    const { error } = await supabase.from('clientes').update({
      nome_empresa: formEditar.nome_empresa,
      nome_contato: formEditar.nome_contato,
      email: formEditar.email,
      celular: formEditar.celular,
      dia_vencimento: parseInt(formEditar.dia_vencimento, 10),
      empresas_vinculadas: novosVinculosIds
    }).eq('id', id);

    if (!error) {
      // 🚀 MÁGICA: Espelhamento Automático de Vínculos!
      const adicionados = novosVinculosIds.filter(vid => !velhosVinculosIds.includes(vid));
      const removidos = velhosVinculosIds.filter(vid => !novosVinculosIds.includes(vid));

      // 1. Vai nos adicionados e pluga o cabo da "nossa" empresa neles
      for (const addedId of adicionados) {
        const { data: d } = await supabase.from('clientes').select('empresas_vinculadas').eq('id', addedId).single();
        if (d) {
          const v = d.empresas_vinculadas || [];
          if (!v.includes(id)) {
            v.push(id);
            await supabase.from('clientes').update({ empresas_vinculadas: v }).eq('id', addedId);
          }
        }
      }

      // 2. Vai nos removidos e arranca o cabo da "nossa" empresa deles
      for (const remId of removidos) {
        const { data: d } = await supabase.from('clientes').select('empresas_vinculadas').eq('id', remId).single();
        if (d) {
          const v = (d.empresas_vinculadas || []).filter(x => x !== id);
          await supabase.from('clientes').update({ empresas_vinculadas: v }).eq('id', remId);
        }
      }

      mostrarToast('Dados cadastrais atualizados com sucesso!', 'sucesso');
      setCliente({ ...cliente, ...formEditar, dia_vencimento: parseInt(formEditar.dia_vencimento, 10), empresas_vinculadas: novosVinculosIds });
      setEmpresasLigadas(empresasLigadasForm); // Atualiza o Switcher de cara!
      setModalEditarCliente(false);
      await registrarAuditoria('CLIENTE_EDITADO', `Editou os dados cadastrais da empresa ${formEditar.nome_empresa}.`);
    } else {
      mostrarToast('Erro ao atualizar: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  const [busca, setBusca] = useState('');
  const [mostrarAutocomplete, setMostrarAutocomplete] = useState(false);

  const [enviosPre, setEnviosPre] = useState([
    { id: 1, descricao: '', arquivo: null, departamento: 'Contábil' }
  ]);

  // FUNÇÃO AUXILIAR DE LOGS DE AUDITORIA
  async function registrarAuditoria(acao, detalhe) {
    const tipoSalvo = localStorage.getItem('usuario_tipo') || 'cliente';
    await supabase.from('logs_auditoria').insert([{
      usuario_nome: operador,
      usuario_tipo: tipoSalvo,
      acao: acao,
      detalhe: detalhe
    }]);
  }

  useEffect(() => {
    const nomeSalvo = localStorage.getItem('usuario_nome');
    const tipoSalvo = localStorage.getItem('usuario_tipo');
    const idSalvo = localStorage.getItem('usuario_id'); // Puxa o ID de quem logou

    // PROTEÇÃO CONTRA INVASÃO DE URL
    if (!nomeSalvo || !tipoSalvo) {
      router.push('/login');
      return;
    }
    if (tipoSalvo === 'cliente' && idSalvo !== id) {
      router.push(`/cliente/${idSalvo}`); // Força a voltar para o próprio perfil
      return;
    }
    
    if (nomeSalvo) setOperador(nomeSalvo);
    if (tipoSalvo === 'interno') setIsInterno(true);

    async function carregarCliente() {
      // 🛑 MÁGICA DE SEGURANÇA: Select explícito para NUNCA trafegar a senha do cliente!
      const COLUNAS_SEGURAS = 'id, nome_empresa, nome_contato, cnpj, cpf, email, celular, regime_tributario, tipo_conta, empresas_vinculadas, docs_solicitados, dia_vencimento, clientes_van, socios, links, id_drive_raiz, id_drive_contabil, id_drive_fiscal, id_drive_rh, id_drive_contratos, id_drive_recebidos, id_drive_enviados, id_drive_lixeira';

      const { data, error } = await supabase.from('clientes').select(COLUNAS_SEGURAS).eq('id', id).single();
      if (error || !data) {
        alert('Cliente não encontrado.');
        router.push(tipoSalvo === 'interno' ? '/' : '/login');
        return;
      }
      setCliente(data);
      setCarregando(false);
      atualizarBadgeGlobal(id);

      // NOVO: Puxa os disclaimers das pastas e as bolinhas verdes
      const { data: txts } = await supabase.from('textos_pastas').select('*');
      if (txts) {
        const map = {};
        txts.forEach(t => {
          try {
            // MÁGICA: Tenta ler como JSON (Pacotinho com Padrao e Van)
            const parsed = JSON.parse(t.descricao);
            map[t.setor] = parsed;
          } catch(e) {
            // Fallback de segurança: Se ainda estiver como texto simples antigo
            map[t.setor] = { padrao: t.descricao || '', van: t.descricao || '' };
          }
        });
        setTextosPastas(map);
      }
      
      const { data: nLidos } = await supabase.from('arquivos_portal').select('id, setor, subpasta_id').eq('cliente_id', id).is('visualizado_cliente', false);
      if (nLidos) setArquivosNaoLidos(nLidos);

      // NOVO: Puxa o Account Switcher (Empresas Vinculadas incluindo CPF/Societário)
      if (data.empresas_vinculadas && data.empresas_vinculadas.length > 0) {
        const { data: ligadas } = await supabase.from('clientes').select('id, nome_empresa, cnpj, cpf, tipo_conta').in('id', data.empresas_vinculadas);
        if (ligadas) setEmpresasLigadas(ligadas);
      }

      // NOVO: Puxa os processos societários para mostrar a notificação (badge roxo)
      const { data: procs } = await supabase.from('processos_societarios').select('*').eq('cliente_id', id);
      if (procs) {
        setProcessos(procs);
        if (procs.length > 0 && !localStorage.getItem(`societario_visto_${id}_${procs.length}`)) {
          setBadgeSocietario(procs.length);
        }
      }

    }
    carregarCliente();
  }, [id, router]);

  // NOVO: Função para o Admin salvar a explicação global
  async function salvarTextoPasta(e) {
    e.preventDefault();
    setSubindoArquivo(true);
    const { setor, textoPadrao, textoVan } = modalTextoPasta;
    
    // MÁGICA: Empacota os dois textos num JSON antes de mandar pro banco
    const payloadDescricao = JSON.stringify({ padrao: textoPadrao, van: textoVan });

    const { error } = await supabase.from('textos_pastas').upsert({ setor, descricao: payloadDescricao });
    if (!error) {
       setTextosPastas(prev => ({...prev, [setor]: { padrao: textoPadrao, van: textoVan }}));
       mostrarToast('Explicações atualizadas para todos os clientes!', 'sucesso');
       setModalTextoPasta({ aberto: false, setor: '', textoPadrao: '', textoVan: '' });
    } else {
       mostrarToast('Erro ao salvar: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  useEffect(() => {
    setBusca(''); 
    setMostrarAutocomplete(false);
    setSelecionados([]); 
    
    if (abaPrincipal === 'pastas') {
      setSubpastaAtiva(null);
    }

    carregarDadosDaAba();
  }, [abaPrincipal, pastaAtiva, id]);

  // MÁGICA DE UX: Atualiza os dados do cliente silenciosamente quando volta pro navegador
  useEffect(() => {
    const handleFocus = () => {
      if (!subindoArquivo && !carregandoConteudo) {
        carregarDadosDaAba();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [abaPrincipal, pastaAtiva, id, subindoArquivo, carregandoConteudo]);

  // NOVO: ATUALIZAÇÃO OTIMISTA (A bolinha verde some no exato milissegundo em que o cliente abre a pasta)
  useEffect(() => {
    if (isInterno || abaPrincipal !== 'pastas' || !pastaAtiva) return;
    
    setArquivosNaoLidos(prev => {
      const naTela = prev.filter(a => a.setor === pastaAtiva && (a.subpasta_id || null) === (subpastaAtiva || null));
      if (naTela.length > 0) {
        const ids = naTela.map(a => a.id);
        // 1. Apaga visualmente no mesmo instante
        setArquivos(arqPrev => arqPrev.map(a => ids.includes(a.id) ? { ...a, visualizado_cliente: true } : a));
        // 2. Envia pro banco em background sem travar a tela
        supabase.from('arquivos_portal').update({ visualizado_cliente: true }).in('id', ids).then();
        return prev.filter(a => !ids.includes(a.id));
      }
      return prev;
    });
  }, [pastaAtiva, subpastaAtiva, isInterno, abaPrincipal]);

  async function atualizarBadgeGlobal(clienteId) {
    if (!clienteId) return;
    const { data } = await supabase.from('alertas_clientes').select('id, prazo, tipo_alerta').eq('cliente_id', clienteId).eq('status', 'pendente');
    if (data) {
      const cobrancas = data.filter(a => a.tipo_alerta === 'cobranca' || !a.tipo_alerta);
      const lembretes = data.filter(a => a.tipo_alerta === 'lembrete');

      // Correção de Fuso: Evita que o prazo expire horas mais cedo devido ao fuso UTC
      const dataLocal = new Date();
      dataLocal.setMinutes(dataLocal.getMinutes() - dataLocal.getTimezoneOffset());
      const hoje = dataLocal.toISOString().split('T')[0];
      
      const atrasados = cobrancas.filter(a => a.prazo && a.prazo < hoje).length;
      
      setAlertasGlobaisAtrasados(atrasados);
      setAlertasGlobaisPendentes(cobrancas.length - atrasados); 
      setAlertasGlobaisLembretes(lembretes.length);
    } else {
      setAlertasGlobaisPendentes(0);
      setAlertasGlobaisAtrasados(0);
      setAlertasGlobaisLembretes(0);
    }

    // Busca tickets resolvidos que o cliente ainda não viu
    const { data: dataPedidos } = await supabase.from('pedidos_cliente').select('id').eq('cliente_id', clienteId).eq('status', 'atendido').is('visualizado_em', null);
    if (dataPedidos) setPedidosResolvidosNaoLidos(dataPedidos.length);
  }

  async function carregarDadosDaAba() {
    setCarregandoConteudo(true); // <--- Inicia a animação de loading
    try {
      if (abaPrincipal === 'pastas' && pastaAtiva) {
        // MÁGICA: Prepara as consultas e dispara juntas em paralelo
        let setoresBusca = [pastaAtiva];
        // Busca ampla para viabilizar a "Virtualização" de pastas
        if (cliente?.clientes_van && (pastaAtiva === 'contabil' || pastaAtiva === 'contrato')) {
          setoresBusca = ['contabil', 'contrato'];
        }

        const reqPastas = supabase.from('pastas_portal').select('*').eq('cliente_id', id).in('setor', setoresBusca).order('nome');
        const reqArquivos = supabase.from('arquivos_portal').select('*').eq('cliente_id', id).in('setor', setoresBusca).is('data_exclusao', null).order('criado_em', { ascending: false });
        const reqFinanceiro = pastaAtiva === 'financeiro' ? supabase.from('mensalidades_status').select('mes_ref').eq('cliente_id', id) : Promise.resolve({ data: null });
        const reqBoletosInter = pastaAtiva === 'financeiro' ? supabase.from('boletos_api').select('*').eq('cliente_id', id) : Promise.resolve({ data: null });

        const [resPastas, resArquivos, resFinanceiro, resBoletos] = await Promise.all([reqPastas, reqArquivos, reqFinanceiro, reqBoletosInter]);

        let processedPastas = resPastas.data || [];
        let processedArquivos = resArquivos.data || [];

        // 🚀 MÁGICA DE VIRTUALIZAÇÃO: Se for cliente Van, move "Documentos Empresa" (fisicamente no Contábil) para a aba Contratos visualmente
        if (cliente?.clientes_van && (pastaAtiva === 'contabil' || pastaAtiva === 'contrato')) {
          const docsEmpresaFolder = processedPastas.find(p => p.nome === 'Documentos Empresa' && p.setor === 'contabil');
          if (docsEmpresaFolder) {
            const descendants = new Set([docsEmpresaFolder.id]);
            let added = true;
            while (added) {
              added = false;
              for (const p of processedPastas) {
                if (!descendants.has(p.id) && descendants.has(p.parent_id)) {
                  descendants.add(p.id);
                  added = true;
                }
              }
            }
            // Mapeia adicionando o selo "original_setor"
            processedPastas = processedPastas.map(p => descendants.has(p.id) ? { ...p, setor: 'contrato', original_setor: 'contabil' } : p);
            processedArquivos = processedArquivos.map(a => descendants.has(a.subpasta_id) ? { ...a, setor: 'contrato', original_setor: 'contabil' } : a);
          }
        }

        const finalPastas = processedPastas.filter(p => p.setor === pastaAtiva);
        const finalArquivos = processedArquivos.filter(a => a.setor === pastaAtiva);

        setPastas(finalPastas);
        if (resFinanceiro.data) setMensalidadesPagas(resFinanceiro.data.map(p => p.mes_ref));
        if (resBoletos && resBoletos.data) setBoletosDaAPI(resBoletos.data);
        else if (pastaAtiva === 'financeiro') setBoletosDaAPI([]);

        setArquivos(finalArquivos);
        const tipoSalvo = localStorage.getItem('usuario_tipo');
        if (tipoSalvo !== 'interno') {
           const arquivosNaTela = finalArquivos.filter(a => (a.subpasta_id || null) === (subpastaAtiva || null) && !a.visualizado_cliente);
           if (arquivosNaTela.length > 0) {
             const ids = arquivosNaTela.map(a => a.id);
             setArquivosNaoLidos(prev => prev.filter(a => !ids.includes(a.id)));
             setArquivos(prev => prev.map(a => ids.includes(a.id) ? { ...a, visualizado_cliente: true } : a));
             supabase.from('arquivos_portal').update({ visualizado_cliente: true }).in('id', ids).then();
           }
        }
    } 
    else if (abaPrincipal === 'envios') {
      const { data } = await supabase.from('envios_cliente').select('*').eq('cliente_id', id).is('data_exclusao', null).order('criado_em', { ascending: false });
      setArquivos(data || []);
    } 
    else if (abaPrincipal === 'solicitacoes') {
      const { data } = await supabase.from('pedidos_cliente').select('*').eq('cliente_id', id).order('criado_em', { ascending: false });
      if (data) {
        setPedidos(data);
        const tipoSalvo = localStorage.getItem('usuario_tipo');
        if (tipoSalvo !== 'interno') {
          const naoLidos = data.filter(p => !p.visualizado_em && p.status === 'atendido').map(p => p.id);
          if (naoLidos.length > 0) {
            await supabase.from('pedidos_cliente').update({ visualizado_em: new Date().toISOString() }).in('id', naoLidos);
            atualizarBadgeGlobal(id);
            setPedidos(prev => prev.map(p => naoLidos.includes(p.id) ? { ...p, visualizado_em: new Date().toISOString() } : p));
          }
        }
      } else { setPedidos([]); }
    } 
    else if (abaPrincipal === 'alertas' || abaPrincipal === 'avisos') {
      const { data } = await supabase.from('alertas_clientes').select('*').eq('cliente_id', id).order('criado_em', { ascending: false });
      if (data) {
        setAlertas(data);
        const tipoSalvo = localStorage.getItem('usuario_tipo');
        if (tipoSalvo !== 'interno') {
          // Identifica se o cliente está abrindo a aba de Cobranças ou de Avisos
          const isAviso = abaPrincipal === 'avisos';
          
          const naoLidos = data.filter(a => {
            if (a.visualizado_em || a.status !== 'pendente') return false;
            // Marca como visto apenas o que corresponde à aba atual
            if (isAviso) return a.tipo_alerta === 'lembrete';
            return a.tipo_alerta === 'cobranca' || !a.tipo_alerta;
          }).map(a => a.id);

          if (naoLidos.length > 0) {
            await supabase.from('alertas_clientes').update({ visualizado_em: new Date().toISOString() }).in('id', naoLidos);
            const nomeAuditoria = isAviso ? 'Aviso(s)' : 'Cobrança(s)';
            await registrarAuditoria('ALERTA_VISUALIZADO', `O cliente visualizou ${naoLidos.length} ${nomeAuditoria} no portal.`);
          }
        }
      } else { setAlertas([]); }
    }
    else if (abaPrincipal === 'lixeira') {
      const reqArq = supabase.from('arquivos_portal').select('*').eq('cliente_id', id).not('data_exclusao', 'is', null);
      const reqEnv = supabase.from('envios_cliente').select('*').eq('cliente_id', id).not('data_exclusao', 'is', null);
      const [resArq, resEnv] = await Promise.all([reqArq, reqEnv]);
      
      let lixeiraCompleta = [];
      if (resArq.data) lixeiraCompleta = [...lixeiraCompleta, ...resArq.data.map(i => ({...i, origem: 'portal'}))];
        if (resEnv.data) lixeiraCompleta = [...lixeiraCompleta, ...resEnv.data.map(i => ({...i, origem: 'envios'}))];
        lixeiraCompleta.sort((a, b) => new Date(b.data_exclusao) - new Date(a.data_exclusao));
        setItensLixeira(lixeiraCompleta);
      }
    } catch (error) {
      console.error("Erro no carregamento da aba:", error);
      mostrarToast("Houve uma instabilidade na rede. Alguns dados podem não ter carregado.", "erro");
    } finally {
      setCarregandoConteudo(false); // <--- Termina a animação garantido, com erro ou sem!
    }
  }

    async function togglePagoManual(mesRef, estaPago) {
    if (estaPago) {
      await supabase.from('mensalidades_status').delete().match({ cliente_id: id, mes_ref: mesRef });
      setMensalidadesPagas(prev => prev.filter(m => m !== mesRef));
    } else {
      await supabase.from('mensalidades_status').insert([{ cliente_id: id, mes_ref: mesRef }]);
      setMensalidadesPagas(prev => [...prev, mesRef]);
    }
  }

  async function handleBaixaManualBoleto(boleto) {
    confirmarAcao('Baixa Manual', 'Deseja marcar este boleto como pago manualmente (Ex: Recebido via PIX na conta)?', async () => {
      setSubindoArquivo(true);
      const { error } = await supabase.from('boletos_api').update({ status: 'pago via pix' }).eq('nosso_numero', boleto.nosso_numero);
      if (!error) {
        mostrarToast('Baixa manual realizada com sucesso!', 'sucesso');
        await registrarAuditoria('BOLETO_BAIXA_MANUAL', `Deu baixa manual no boleto Ref: ${boleto.mes_ref}.`);
        await carregarDadosDaAba();
      } else {
        mostrarToast('Erro ao dar baixa: ' + error.message, 'erro');
      }
      setSubindoArquivo(false);
    });
  }

  // ===============================================
  // GESTÃO DE PASTAS (APENAS ADMIN E CORINGA)
  // ===============================================

  async function processarPastaCoringa(nomeOuArrayCoringa, parentIdAtual) {
    const nomesCoringa = Array.isArray(nomeOuArrayCoringa) ? nomeOuArrayCoringa : [nomeOuArrayCoringa];
    const cnpjLimpo = cliente?.cnpj?.replace(/\D/g, '') || '';
    const nomeEmpresa = cliente?.nome_empresa?.toLowerCase() || '';
    const isCoringa = cnpjLimpo === '50457640000101' || nomeEmpresa.includes('lsprado');
    
    if (!isCoringa) return;
    if (pastaAtiva === 'financeiro') return;

    // 🚀 MÁGICA 1: Burlar o limite oculto de 1000 do Supabase puxando clientes em lotes
    let allClients = [];
    let loopC = 0;
    while (true) {
      const { data } = await supabase.from('clientes').select('id').range(loopC, loopC + 999);
      if (!data || data.length === 0) break;
      allClients.push(...data);
      if (data.length < 1000) break;
      loopC += 1000;
    }
    const otherClients = allClients.filter(c => c.id !== id);

    if (!parentIdAtual) {
      const insertData = [];
      otherClients.forEach(c => {
        nomesCoringa.forEach(nome => {
          insertData.push({ cliente_id: c.id, setor: pastaAtiva, nome: nome, parent_id: null });
        });
      });
      // Proteção de Lote (Chunking) para evitar erro de Payload da API
      for (let i = 0; i < insertData.length; i += 200) {
        await supabase.from('pastas_portal').insert(insertData.slice(i, i + 200));
      }
    } else {
      let atual = parentIdAtual;
      const arvoreOriginal = [];
      let dbSearchLimit = 15; 
      
      while (atual && dbSearchLimit > 0) {
        let f = pastas.find(p => p.id === atual);
        if (!f) {
          const { data } = await supabase.from('pastas_portal').select('id, nome, parent_id').eq('id', atual).single();
          f = data;
        }
        if (f) {
          arvoreOriginal.unshift(f.nome);
          atual = f.parent_id;
          dbSearchLimit--;
        } else {
          break;
        }
      }

      if (arvoreOriginal.length > 0) {
        // 🚀 MÁGICA 2: Burlar o limite de 1000 pastas que fazia o sistema ignorar as pastas pais de outros clientes
        let todasPastasSetor = [];
        let loopP = 0;
        while (true) {
          const { data } = await supabase.from('pastas_portal')
            .select('id, cliente_id, nome, parent_id')
            .eq('setor', pastaAtiva)
            .range(loopP, loopP + 999);
          if (!data || data.length === 0) break;
          todasPastasSetor.push(...data);
          if (data.length < 1000) break;
          loopP += 1000;
        }

        const insertData = [];
        
        otherClients.forEach(c => {
          const pastasCliente = todasPastasSetor.filter(p => p.cliente_id === c.id);
          
          const validarCaminho = (pastaCandidata) => {
            let currId = pastaCandidata.id;
            for (let i = arvoreOriginal.length - 1; i >= 0; i--) {
              const p = pastasCliente.find(x => x.id === currId);
              if (!p || p.nome !== arvoreOriginal[i]) return false;
              currId = p.parent_id;
            }
            return currId === null;
          };

          const match = pastasCliente.find(p => p.nome === arvoreOriginal[arvoreOriginal.length - 1] && validarCaminho(p));

          if (match) {
            nomesCoringa.forEach(nome => {
              insertData.push({ cliente_id: c.id, setor: pastaAtiva, nome: nome, parent_id: match.id });
            });
          }
        });

        // Proteção de Lote (Chunking) para evitar erro de Payload
        if (insertData.length > 0) {
          for (let i = 0; i < insertData.length; i += 200) {
            await supabase.from('pastas_portal').insert(insertData.slice(i, i + 200));
          }
        }
      }
    }
  }

  function handleCriarPasta() {
    abrirInputModal('Nova Pasta', '', 'Digite o nome da pasta...', async (nomePasta) => {
      if (!nomePasta || nomePasta.trim() === '') return;
      setSubindoArquivo(true);

      // Respeita o setor original caso estejamos criando dentro de uma pasta virtualizada
      let setorReal = pastaAtiva;
      if (subpastaAtiva) {
         const p = pastas.find(x => x.id === subpastaAtiva);
         if (p && p.original_setor) setorReal = p.original_setor;
      }

      // 1. Descobre qual é a pasta Pai no Google Drive para colocar a nova dentro dela
      let parentDriveId = null;
      if (!subpastaAtiva) {
        if (setorReal === 'contabil') parentDriveId = cliente.id_drive_contabil;
        else if (setorReal === 'fiscal') parentDriveId = cliente.id_drive_fiscal;
        else if (setorReal === 'rh') parentDriveId = cliente.id_drive_rh;
        else if (setorReal === 'contrato') parentDriveId = cliente.id_drive_contratos;
        else parentDriveId = cliente.id_drive_raiz;
      } else {
        parentDriveId = pastas.find(p => p.id === subpastaAtiva)?.id_drive_pasta;
      }

      // 2. Manda o robô criar a pasta fisicamente no Google Drive em tempo real
      let idDrivePastaFinal = null;
      if (parentDriveId) {
        try {
          const resSub = await fetch('/api/drive/criar-subpasta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomePasta: nomePasta.trim(), parentDriveId })
          });
          const dataSub = await resSub.json();
          if (dataSub.success) idDrivePastaFinal = dataSub.id_drive_pasta;
        } catch(e) { console.error("Erro ao espelhar pasta no Drive:", e); }
      }
      
      const { error } = await supabase.from('pastas_portal').insert([{
        cliente_id: id,
        setor: setorReal,
        nome: nomePasta.trim(),
        parent_id: subpastaAtiva || null,
        id_drive_pasta: idDrivePastaFinal // Amarra o ID do Drive no banco
      }]);
      
      if (!error) {
        await processarPastaCoringa(nomePasta.trim(), subpastaAtiva);
        await registrarAuditoria('PASTA_CRIADA', `Criou a pasta "${nomePasta.trim()}" espelhada no Google Drive.`);
        await carregarDadosDaAba();
      }
      setSubindoArquivo(false);
    });
  }

  // 🚀 MÁGICA: Mapeia o DNA da pasta na Lsprado e caça as irmãs nos outros clientes
  async function obterIdsPastaGlobal(pastaAlvo) {
    let atual = pastaAlvo.id;
    const arvoreOriginal = [];
    let dbSearchLimit = 15;
    
    while (atual && dbSearchLimit > 0) {
      let f = pastas.find(p => p.id === atual);
      if (!f) {
        const { data } = await supabase.from('pastas_portal').select('id, nome, parent_id').eq('id', atual).single();
        f = data;
      }
      if (f) {
        arvoreOriginal.unshift(f.nome);
        atual = f.parent_id;
        dbSearchLimit--;
      } else {
        break;
      }
    }

    if (arvoreOriginal.length === 0) return [pastaAlvo.id];

    // 🚀 MÁGICA: Burlar o limite oculto de 1000 do Supabase puxando tudo em blocos
    let todasPastasSetor = [];
    let loopP = 0;
    while (true) {
      const { data } = await supabase.from('pastas_portal')
        .select('id, cliente_id, nome, parent_id')
        .eq('setor', pastaAlvo.setor)
        .range(loopP, loopP + 999);
      if (!data || data.length === 0) break;
      todasPastasSetor.push(...data);
      if (data.length < 1000) break;
      loopP += 1000;
    }

    if (todasPastasSetor.length === 0) return [pastaAlvo.id];

    const idsGlobais = [];
    
    // 🚀 MÁGICA: Puxando clientes ignorando o limite
    let allClients = [];
    let loopC = 0;
    while (true) {
      const { data } = await supabase.from('clientes').select('id').range(loopC, loopC + 999);
      if (!data || data.length === 0) break;
      allClients.push(...data);
      if (data.length < 1000) break;
      loopC += 1000;
    }

    allClients.forEach(c => {
      const pastasCliente = todasPastasSetor.filter(p => p.cliente_id === c.id);
      
      const validarCaminho = (pastaCandidata) => {
        let currId = pastaCandidata.id;
        for (let i = arvoreOriginal.length - 1; i >= 0; i--) {
          const p = pastasCliente.find(x => x.id === currId);
          if (!p || p.nome !== arvoreOriginal[i]) return false;
          currId = p.parent_id;
        }
        return currId === null;
      };

      const match = pastasCliente.find(p => p.nome === arvoreOriginal[arvoreOriginal.length - 1] && validarCaminho(p));
      if (match) idsGlobais.push(match.id);
    });

    return idsGlobais;
  }

  function handleRenomearPasta(pasta) {
    const cnpjLimpo = cliente?.cnpj?.replace(/\D/g, '') || '';
    const nomeEmpresa = cliente?.nome_empresa?.toLowerCase() || '';
    const isCoringa = cnpjLimpo === '50457640000101' || nomeEmpresa.includes('lsprado');

    const tituloModal = isCoringa ? 'Renomear Pasta Global' : 'Renomear Pasta';
    const placeholder = isCoringa ? 'Novo nome (Mudará para TODOS os clientes)...' : 'Novo nome da pasta...';

    abrirInputModal(tituloModal, pasta.nome, placeholder, async (novoNome) => {
      if (!novoNome || novoNome.trim() === '' || novoNome === pasta.nome) return;
      setSubindoArquivo(true);
      
      if (isCoringa && pastaAtiva !== 'financeiro') {
         const idsGlobais = await obterIdsPastaGlobal(pasta);
         
         // 🚀 TRAVA DE GARANTIA: Garante que a pasta Mestra (a que vc clicou) ESTEJA na lista!
         if (!idsGlobais.includes(pasta.id)) idsGlobais.push(pasta.id);
         
         // 🚀 MÁGICA: Dividir Array em lotes de 100 para não quebrar a URI da API!
         for (let i = 0; i < idsGlobais.length; i += 100) {
           await supabase.from('pastas_portal').update({ nome: novoNome.trim() }).in('id', idsGlobais.slice(i, i + 100));
         }
      } else {
         await supabase.from('pastas_portal').update({ nome: novoNome.trim() }).eq('id', pasta.id);
      }
      
      await carregarDadosDaAba();
      setSubindoArquivo(false);
    });
  }

  function handleExcluirPastasEmLote() {
    const qtd = pastasSelecionadas.length;
    if (qtd === 0) return;

    const cnpjLimpo = cliente?.cnpj?.replace(/\D/g, '') || '';
    const nomeEmpresa = cliente?.nome_empresa?.toLowerCase() || '';
    const isCoringa = cnpjLimpo === '50457640000101' || nomeEmpresa.includes('lsprado');
    
    const mensagem = isCoringa
      ? `MODO CORINGA: Tem certeza que deseja excluir ${qtd} pasta(s) para TODOS OS CLIENTES do sistema?\n\nAs subpastas filhas também poderão ser apagadas.`
      : `Atenção: Tem certeza que deseja excluir as ${qtd} pasta(s) selecionada(s)?\n\nOs arquivos dentro delas NÃO serão apagados, eles voltarão automaticamente para a tela inicial deste setor.`;

    confirmarAcao(isCoringa ? 'Excluir Pastas Globais' : 'Excluir Pastas em Lote', mensagem, async () => {
      setSubindoArquivo(true);
      let idsParaDeletar = [];

      if (isCoringa && pastaAtiva !== 'financeiro') {
        for (let pid of pastasSelecionadas) {
          const pasta = pastas.find(p => p.id === pid);
          if (pasta) {
            const idsGlobais = await obterIdsPastaGlobal(pasta);
            idsParaDeletar.push(...idsGlobais);
            if (!idsParaDeletar.includes(pasta.id)) idsParaDeletar.push(pasta.id);
          }
        }
      } else {
        idsParaDeletar = [...pastasSelecionadas];
      }

      // 🚀 MÁGICA 4: Dividir o Array em Lotes (Chunks) de 100 para evitar Erro "URI Too Long" da API
      for (let i = 0; i < idsParaDeletar.length; i += 100) {
        await supabase.from('pastas_portal').delete().in('id', idsParaDeletar.slice(i, i + 100));
      }

      setPastasSelecionadas([]);
      setModoSelecaoPastas(false);
      setSubpastaAtiva(null);
      await carregarDadosDaAba();
      setSubindoArquivo(false);
      mostrarToast(`${qtd} pastas excluídas com sucesso.`, 'sucesso');
    });
  }

  async function handleCriarMultiPastas(e) {
    e.preventDefault();
    const nomesValidos = modalMultiPastas.nomes.filter(n => n.trim() !== '');
    if (nomesValidos.length === 0) return;
    setSubindoArquivo(true);

    let parentDriveId = null;
    if (!subpastaAtiva) {
      if (pastaAtiva === 'contabil') parentDriveId = cliente.id_drive_contabil;
      else if (pastaAtiva === 'fiscal') parentDriveId = cliente.id_drive_fiscal;
      else if (pastaAtiva === 'rh') parentDriveId = cliente.id_drive_rh;
      else if (pastaAtiva === 'contrato') parentDriveId = cliente.id_drive_contratos;
      else parentDriveId = cliente.id_drive_raiz;
    } else {
      parentDriveId = pastas.find(p => p.id === subpastaAtiva)?.id_drive_pasta;
    }

    const pastasCriadasComSucesso = [];

    for (let nomePasta of nomesValidos) {
      let idDrivePastaFinal = null;
      if (parentDriveId) {
        try {
          const resSub = await fetch('/api/drive/criar-subpasta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomePasta: nomePasta.trim(), parentDriveId })
          });
          const dataSub = await resSub.json();
          if (dataSub.success) idDrivePastaFinal = dataSub.id_drive_pasta;
        } catch(e) { console.error("Erro ao espelhar pasta no Drive:", e); }
      }
      
      const { data: novaPasta, error } = await supabase.from('pastas_portal').insert([{
        cliente_id: id,
        setor: pastaAtiva,
        nome: nomePasta.trim(),
        parent_id: subpastaAtiva || null,
        id_drive_pasta: idDrivePastaFinal
      }]).select().single();
      
      if (!error && novaPasta) {
        pastasCriadasComSucesso.push(nomePasta.trim());
      }
    }
    
    // 🚀 MÁGICA: Só chama o Coringa UMA vez com todas as pastas para evitar Crash da API (Payload/Timeout)
    if (pastasCriadasComSucesso.length > 0) {
      await processarPastaCoringa(pastasCriadasComSucesso, subpastaAtiva);
    }
    
    await registrarAuditoria('PASTA_CRIADA_LOTE', `Criou ${nomesValidos.length} pastas espelhadas.`);
    await carregarDadosDaAba();
    setModalMultiPastas({ aberto: false, nomes: [''] });
    setSubindoArquivo(false);
    mostrarToast(`${nomesValidos.length} pastas criadas com sucesso!`, 'sucesso');
  }

  function handleDeletarPasta(pasta) {
    const cnpjLimpo = cliente?.cnpj?.replace(/\D/g, '') || '';
    const nomeEmpresa = cliente?.nome_empresa?.toLowerCase() || '';
    const isCoringa = cnpjLimpo === '50457640000101' || nomeEmpresa.includes('lsprado');
    
    const mensagem = isCoringa
      ? `MODO CORINGA: Tem certeza que deseja excluir a pasta "${pasta.nome}" para TODOS OS CLIENTES do sistema?\n\nAs subpastas filhas também poderão ser apagadas. Os arquivos voltarão para a tela inicial.`
      : `Atenção: Tem certeza que deseja excluir a pasta "${pasta.nome}"?\n\nOs arquivos dentro dela NÃO serão apagados, eles voltarão automaticamente para a tela inicial deste setor.`;

    confirmarAcao(isCoringa ? 'Excluir Pasta Global' : 'Excluir Pasta', mensagem, async () => {
      setSubindoArquivo(true);
      if (isCoringa && pastaAtiva !== 'financeiro') {
        const idsGlobais = await obterIdsPastaGlobal(pasta);
        
        // 🚀 TRAVA DE GARANTIA: Garante que a pasta Mestra seja apagada junto!
        if (!idsGlobais.includes(pasta.id)) idsGlobais.push(pasta.id);
        
        // 🚀 MÁGICA 5: Lotes de 100 para evitar bloqueio da API Supabase (URI Too Long)
        for (let i = 0; i < idsGlobais.length; i += 100) {
          await supabase.from('pastas_portal').delete().in('id', idsGlobais.slice(i, i + 100));
        }
      } else {
        await supabase.from('pastas_portal').delete().eq('id', pasta.id);
      }
      setSubpastaAtiva(null);
      await carregarDadosDaAba();
      setSubindoArquivo(false);
    });
  }

  // ===============================================
  // GESTÃO DE ARQUIVOS E FLUXOS COM TOASTS
  // ===============================================
  
  async function fazerUploadUnitario(file, targetPastaId, directDriveId = null) {
    if (file.size > 4.4 * 1024 * 1024) {
      mostrarToast(`Ignorado: "${file.name}" excede 4.4MB.`, 'erro');
      return false;
    }

    let setorReal = pastaAtiva;
    if (targetPastaId) {
      const pastaAlvo = pastas.find(p => p.id === targetPastaId);
      if (pastaAlvo && pastaAlvo.original_setor) {
         setorReal = pastaAlvo.original_setor;
      }
    }

    // 1. Identifica dinamicamente qual a pasta alvo correta do Google Drive
    let folderIdDrive = directDriveId; 
    
    if (!folderIdDrive) {
      if (targetPastaId) {
        let achouNaTela = pastas.find(p => p.id === targetPastaId)?.id_drive_pasta;
        if (achouNaTela) {
          folderIdDrive = achouNaTela;
        } else {
          const { data: dbPasta } = await supabase.from('pastas_portal').select('id_drive_pasta').eq('id', targetPastaId).single();
          if (dbPasta) folderIdDrive = dbPasta.id_drive_pasta;
        }
      } else {
        if (setorReal === 'contabil') folderIdDrive = cliente.id_drive_contabil;
        else if (setorReal === 'fiscal') folderIdDrive = cliente.id_drive_fiscal;
        else if (setorReal === 'rh') folderIdDrive = cliente.id_drive_rh;
        else if (setorReal === 'contrato') folderIdDrive = cliente.id_drive_contratos; 
        else folderIdDrive = cliente.id_drive_raiz;
      }
    }

    let caminhoFinal = null;

    if (folderIdDrive) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', folderIdDrive);

      try {
        const res = await fetch('/api/drive/upload', { method: 'POST', body: formData });
        const resData = await res.json();
        if (resData.success) {
          caminhoFinal = `DRIVE:${resData.fileId}`;
        }
      } catch (err) { console.error("Erro no upload para o Drive:", err); }
    }

    // Fallback de Segurança: Se o Drive falhar, salva no Supabase Storage como backup
    if (!caminhoFinal) {
      const timestamp = Date.now();
      const nomeSeguro = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.\-]/g, '_');
      caminhoFinal = `${id}/${setorReal}/${timestamp}_${nomeSeguro}`;
      const { error: storageError } = await supabase.storage.from('documentos').upload(caminhoFinal, file);
      if (storageError) {
        mostrarToast(`Erro no arquivo "${file.name}": ${storageError.message}`, 'erro');
        return false;
      }
    }

    await supabase.from('arquivos_portal').insert([{ 
      cliente_id: id, 
      setor: setorReal, 
      subpasta_id: targetPastaId, 
      nome_original: file.name, 
      caminho_storage: caminhoFinal, 
      enviado_por: operador 
    }]);
    
    await registrarAuditoria('ARQUIVO_UPLOAD', `Subiu o documento "${file.name}" para o Drive.`);
    return true;
  }

  async function handleUpload(eOrFiles) {
    let files = [];
    if (eOrFiles?.target?.files) {
      files = Array.from(eOrFiles.target.files);
      eOrFiles.target.value = null; // MÁGICA: Limpa a memória do input
    }
    else if (eOrFiles instanceof FileList) files = Array.from(eOrFiles);
    else if (Array.isArray(eOrFiles)) files = eOrFiles;
    else if (eOrFiles instanceof File) files = [eOrFiles];

    if (files.length === 0 || !pastaAtiva) return;
    if (files.length > 20) return mostrarToast('Por favor, selecione no máximo 20 arquivos por vez.', 'erro');

    setSubindoArquivo(true);
    let sucessoCount = 0;

    // MÁGICA: Processa em lotes de 3 em 3 para não estourar o limite do Google Drive / Vercel
    for (let i = 0; i < files.length; i += 3) {
      const lote = files.slice(i, i + 3);
      const resultados = await Promise.all(lote.map(file => fazerUploadUnitario(file, subpastaAtiva)));
      sucessoCount += resultados.filter(sucesso => sucesso).length;
    }

    if (sucessoCount > 0) {
      mostrarToast(`${sucessoCount} documento(s) publicado(s) com sucesso!`, 'sucesso');
      
      // Se quem enviou foi a equipe, avisa o cliente
      if (isInterno) {
        dispararPush(
          id, 
          'Novo Documento Disponível 📄', 
          `A equipe disponibilizou ${sucessoCount} arquivo(s) novo(s) na sua pasta.`
        );
      }
      
      await carregarDadosDaAba();
    }
    setSubindoArquivo(false);
  }

  async function handleUploadFinanceiro(e, mesRef) {
    const file = e.target.files[0];
    if (!file) return;
    
    e.target.value = null; // MÁGICA: Libera o input para tentar novamente

    if (file.size > 4.4 * 1024 * 1024) return mostrarToast('O arquivo excede 4.4MB.', 'erro');

    setSubindoArquivo(true);
    const timestamp = Date.now();
    const caminhoArquivo = `${id}/financeiro/${mesRef}_${timestamp}_${file.name}`;
    const { error: storageError } = await supabase.storage.from('documentos').upload(caminhoArquivo, file);
    
    if (storageError) { mostrarToast('Erro no Storage', 'erro'); setSubindoArquivo(false); return; }

    const { error: dbError } = await supabase.from('arquivos_portal').insert([{ cliente_id: id, setor: 'financeiro', subpasta_id: null, nome_original: file.name, caminho_storage: caminhoArquivo, enviado_por: operador }]);

    if (dbError) {
      mostrarToast('Erro ao registrar no banco de dados: ' + dbError.message, 'erro');
      setSubindoArquivo(false);
      return;
    }

    mostrarToast(`Comprovante de ${mesRef} anexado com sucesso!`, 'sucesso');
    await registrarAuditoria('COMPROVANTE_ENVIADO', `Enviou o comprovante referente a ${mesRef}.`);
    await carregarDadosDaAba();
    setSubindoArquivo(false);
  }

  function handleSolicitarBoleto(mesRef) {
    confirmarAcao('Solicitar 2ª Via', `Deseja solicitar à equipa o reenvio do boleto referente a ${mesRef}?`, async () => {
      setSubindoArquivo(true);
      const dataAmanha = new Date();
      dataAmanha.setDate(dataAmanha.getDate() + 1);
      const dataAmanhaStr = dataAmanha.toISOString().split('T')[0];

      const { error } = await supabase.from('demandas_equipe').insert([{ criado_por: cliente.nome_empresa, atribuido_para: 'Lucas (Financeiro)', descricao: `Solicitação de Boleto - Ref: ${mesRef}`, data_entrega: dataAmanhaStr, prioridade: 'Alta', status: 'pendente' }]);

      if (!error) {
        try {
          await enviarEmailDemanda({ to: OBTER_EMAIL_FUNCIONARIO['Lucas (Financeiro)'], nomeDestinatario: 'Lucas (Financeiro)', nomeRemetente: cliente.nome_empresa, tituloDemanda: `Nova Solicitação de Boleto - Ref: ${mesRef}`, descricao: `O cliente ${cliente.nome_empresa} está solicitando o boleto da competência ${mesRef}.`, prazo: new Date(dataAmanhaStr).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) });
        } catch (err) { console.error("Falha ao notificar por e-mail:", err); }
        
        mostrarToast('Solicitação enviada com sucesso! O Financeiro foi notificado.', 'sucesso');
        await registrarAuditoria('BOLETO_SOLICITADO', `Solicitou a 2ª via do boleto de ${mesRef}.`);
        setBoletosSolicitados(prev => [...prev, mesRef]); 
      } else {
        mostrarToast('Erro ao enviar solicitação: ' + error.message, 'erro');
      }
      setSubindoArquivo(false);
    }, 'sucesso');
  }

  // ===============================================
  // AÇÕES EM LOTE (MULTI-SELEÇÃO)
  // ===============================================
  function toggleSelecao(id) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  }

  function toggleSelecionarTodos() {
    if (selecionados.length === arquivosFiltradosDaBusca.length && arquivosFiltradosDaBusca.length > 0) {
      setSelecionados([]); 
    } else {
      setSelecionados(arquivosFiltradosDaBusca.map(a => a.id)); 
    }
  }

  function handleExcluirSelecionados() {
    confirmarAcao('Excluir Selecionados', `Deseja mover ${selecionados.length} arquivo(s) para a lixeira?`, async () => {
      setSubindoArquivo(true);
      for (const id of selecionados) {
        await supabase.from('arquivos_portal').update({ data_exclusao: new Date().toISOString() }).eq('id', id);
      }
      mostrarToast(`${selecionados.length} arquivo(s) movido(s) para a lixeira.`, 'aviso');
      setSelecionados([]);
      await carregarDadosDaAba();
      setSubindoArquivo(false);
    });
  }

  async function handleBaixarSelecionados() {
    if (selecionados.length === 0) return;
    
    setSubindoArquivo(true);
    mostrarToast(`A preparar o download de ${selecionados.length} ficheiro(s)...`, 'aviso');
    
    for (const id of selecionados) {
      const arq = arquivosFiltradosDaBusca.find(a => a.id === id);
      if (arq) {
        const { data } = await supabase.storage.from('documentos').download(arq.caminho_storage);
        if (data) {
          const url = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = arq.nome_original || arq.caminho_storage.split('/').pop();
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }
        await new Promise(resolve => setTimeout(resolve, 600)); 
      }
    }
    setSelecionados([]);
    setSubindoArquivo(false);
    mostrarToast('Transferências concluídas com sucesso!', 'sucesso');
  }

  async function confirmarMovimentacao(e) {
    e.preventDefault();
    if (arquivosMovendo.length === 0) return;
    
    setSubindoArquivo(true);
    const destino = destinoPastaMover === '' ? null : destinoPastaMover;
    
    const ids = arquivosMovendo.map(a => a.id);
    const { error } = await supabase.from('arquivos_portal').update({ subpasta_id: destino }).in('id', ids);
    
    if (!error) {
      mostrarToast(`${arquivosMovendo.length} arquivo(s) movido(s) com sucesso!`, 'sucesso');
      setArquivosMovendo([]);
      setDestinoPastaMover('');
      setSelecionados([]);
      await carregarDadosDaAba();
    } else {
      mostrarToast('Erro ao mover arquivos: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  function handleMoverParaLixeira(arq, origem) {
    confirmarAcao('Mover para a Lixeira', 'Deseja mover este arquivo para a gaveta Lixeira do Drive? Ele ficará protegido lá.', async () => {
      setSubindoArquivo(true);
      // Joga na gaveta física da Lixeira do cliente
      if (arq.caminho_storage?.startsWith('DRIVE:')) {
        await fetch('/api/drive/acao', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ acao: 'mover', fileId: arq.caminho_storage, targetFolderId: cliente.id_drive_lixeira }) 
        });
      }
      const tabela = origem === 'portal' ? 'arquivos_portal' : 'envios_cliente';
      const { error } = await supabase.from(tabela).update({ data_exclusao: new Date().toISOString() }).eq('id', arq.id);
      if (!error) { mostrarToast('Movido para a Lixeira física.', 'aviso'); await registrarAuditoria('ARQUIVO_LIXEIRA', `Moveu o arquivo para a lixeira.`); await carregarDadosDaAba(); }
      setSubindoArquivo(false);
    });
  }

  async function handleRestaurarDaLixeira(arq) {
    setSubindoArquivo(true); 
    
    // MÁGICA DE RESTAURAÇÃO: Descobre de onde ele veio
    let pastaOriginalId = null;
    if (arq.origem === 'envios') {
       pastaOriginalId = cliente.id_drive_recebidos;
    } else {
       if (arq.subpasta_id) {
          pastaOriginalId = typeof pastas !== 'undefined' ? pastas.find(p => p.id === arq.subpasta_id)?.id_drive_pasta : null;
          if (!pastaOriginalId) {
             const { data: dbPasta } = await supabase.from('pastas_portal').select('id_drive_pasta').eq('id', arq.subpasta_id).single();
             if (dbPasta) pastaOriginalId = dbPasta.id_drive_pasta;
          }
       } else {
          if (arq.setor === 'contabil') pastaOriginalId = cliente.id_drive_contabil;
          else if (arq.setor === 'fiscal') pastaOriginalId = cliente.id_drive_fiscal;
          else if (arq.setor === 'rh') pastaOriginalId = cliente.id_drive_rh;
          else if (arq.setor === 'contrato') pastaOriginalId = cliente.id_drive_contratos;
          else if (arq.setor === 'societario') pastaOriginalId = cliente.id_drive_enviados;
          else pastaOriginalId = cliente.id_drive_raiz;
       }
    }

    // Devolve para a pasta original
    if (arq.caminho_storage?.startsWith('DRIVE:') && pastaOriginalId) {
      await fetch('/api/drive/acao', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ acao: 'mover', fileId: arq.caminho_storage, targetFolderId: pastaOriginalId }) 
      });
    }
    
    const tabela = arq.origem === 'portal' ? 'arquivos_portal' : 'envios_cliente';
    const { error } = await supabase.from(tabela).update({ data_exclusao: null }).eq('id', arq.id);
    if (!error) { mostrarToast('Arquivo restaurado para a pasta original!', 'sucesso'); await carregarDadosDaAba(); }
    setSubindoArquivo(false);
  }

  function handleDeletarPermanente(arq) {
    confirmarAcao('Excluir Definitivamente', 'PERIGO: Este arquivo será apagado permanentemente dos servidores e não poderá ser recuperado. Deseja continuar?', async () => {
      setSubindoArquivo(true);
      if (arq.caminho_storage?.startsWith('DRIVE:')) {
        await fetch('/api/drive/acao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'deletar', fileId: arq.caminho_storage }) });
      } else {
        await supabase.storage.from('documentos').remove([arq.caminho_storage]);
      }
      const tabela = arq.origem === 'portal' ? 'arquivos_portal' : 'envios_cliente';
      await supabase.from(tabela).delete().eq('id', arq.id);
      mostrarToast('Arquivo deletado permanentemente.', 'aviso');
      await carregarDadosDaAba();
      setSubindoArquivo(false);
    });
  }

  function handleEsvaziarLixeira() {
    confirmarAcao('Esvaziar Lixeira', 'Esvaziar a lixeira agora? TODOS os arquivos aqui presentes serão DELETADOS PERMANENTEMENTE.', async () => {
      setSubindoArquivo(true);
      for (const arq of itensLixeira) {
        if (arq.caminho_storage?.startsWith('DRIVE:')) {
          await fetch('/api/drive/acao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'deletar', fileId: arq.caminho_storage }) });
        } else {
          await supabase.storage.from('documentos').remove([arq.caminho_storage]);
        }
        const tabela = arq.origem === 'portal' ? 'arquivos_portal' : 'envios_cliente';
        await supabase.from(tabela).delete().eq('id', arq.id);
      }
      mostrarToast('Lixeira esvaziada com sucesso.', 'sucesso');
      await carregarDadosDaAba();
      setSubindoArquivo(false);
    });
  }

  function handleRenomear(arq) {
    abrirInputModal('Renomear Arquivo', arq.nome_original, 'Digite o novo nome...', async (novoNome) => {
      if (!novoNome || novoNome.trim() === '' || novoNome === arq.nome_original) return;
      setSubindoArquivo(true);
      const { error } = await supabase.from('arquivos_portal').update({ nome_original: novoNome.trim() }).eq('id', arq.id);
      if (!error) { mostrarToast('Arquivo renomeado.', 'sucesso'); await carregarDadosDaAba(); }
      setSubindoArquivo(false);
    });
  }

  async function handleEnviarEmailDoc(e) {
    e.preventDefault();
    setSubindoArquivo(true);
    const arq = modalEmailDoc.arquivo;
    
    let caminhoBase = `Setor ${pastaAtiva}`;
    if (caminhoPastas && caminhoPastas.length > 0) {
      caminhoBase += ` / ${caminhoPastas.map(p => p.nome).join(' / ')}`;
    }
    
    try {
      let urlDoArquivo = '';
      if (arq.caminho_storage && arq.caminho_storage.startsWith('DRIVE:')) {
        const fileId = arq.caminho_storage.split('DRIVE:')[1];
        urlDoArquivo = `https://drive.google.com/file/d/${fileId}/view`;
      } else if (arq.caminho_storage) {
        const { data: publicUrlData } = supabase.storage.from('documentos').getPublicUrl(arq.caminho_storage);
        urlDoArquivo = publicUrlData.publicUrl;
      }

      await enviarEmailDocumento({
        to: cliente.email,
        nomeDestinatario: cliente.nome_contato || cliente.nome_empresa,
        nomeRemetente: operador,
        tituloEmail: modalEmailDoc.titulo,
        mensagem: modalEmailDoc.mensagem,
        nomeArquivo: arq.nome_original,
        urlArquivo: urlDoArquivo,
        caminhoPasta: caminhoBase
      });
      await supabase.from('logs_auditoria').insert([{ usuario_nome: operador, usuario_tipo: 'interno', acao: 'EMAIL_ENVIADO', detalhe: `Enviou documento por e-mail para ${cliente.email}` }]);
      
      // MÁGICA: Dispara o alerta para o celular do cliente!
      dispararPush(id, 'Novo Documento Disponível 📄', `A equipe enviou o documento "${arq.nome_original}" no seu e-mail.`);
      
      mostrarToast('E-mail e notificação enviados com sucesso!', 'sucesso');
      setModalEmailDoc({ aberto: false, arquivo: null, titulo: 'Novo Documento Disponível', mensagem: '' });
    } catch (err) {
      mostrarToast('Erro ao enviar e-mail.', 'erro');
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

  async function baixarDocumento(caminhoStorage, nomeOriginal) {
    setSubindoArquivo(true);
    
    if (caminhoStorage.startsWith('DRIVE:')) {
      const fileId = caminhoStorage.split('DRIVE:')[1];
      window.open(`https://drive.google.com/uc?export=download&id=${fileId}`, '_blank');
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
    setSubindoArquivo(false);
  }

  async function handleAdicionarSocio(e) {
    e.preventDefault();
    const sociosAtuais = cliente.socios || [];
    if (sociosAtuais.length >= 2) return mostrarToast('O limite máximo é de 2 sócios adicionais.', 'erro');

    setSubindoArquivo(true);
    // Senha padrão de fábrica: 6 primeiros dígitos do CNPJ
    const senhaPadrao = cliente.cnpj.replace(/\D/g, '').substring(0, 6);
    
    const novoSocio = {
      id: Date.now().toString(),
      nome: formSocio.nome.trim(),
      email: formSocio.email.trim(),
      celular: formSocio.celular.trim(),
      senha: encriptarSenha(senhaPadrao)
    };

    const novaLista = [...sociosAtuais, novoSocio];
    const { error } = await supabase.from('clientes').update({ socios: novaLista }).eq('id', id);

    if (!error) {
      mostrarToast(`Sócio adicionado! A senha provisória é ${senhaPadrao}`, 'sucesso');
      setCliente({ ...cliente, socios: novaLista });
      setFormSocio({ nome: '', email: '', celular: '' });
      setMostrarFormSocio(false);
    } else {
      mostrarToast('Erro ao adicionar sócio: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  function handleRemoverSocio(socioId) {
    confirmarAcao('Remover Acesso', 'Tem certeza que deseja revogar o acesso deste sócio permanentemente?', async () => {
      setSubindoArquivo(true);
      const novaLista = (cliente.socios || []).filter(s => s.id !== socioId);
      const { error } = await supabase.from('clientes').update({ socios: novaLista }).eq('id', id);
      if (!error) {
        mostrarToast('Acesso do sócio revogado com sucesso.', 'sucesso');
        setCliente({ ...cliente, socios: novaLista });
        if (contaSelecionadaSenha === socioId) setContaSelecionadaSenha('principal');
      }
      setSubindoArquivo(false);
    });
  }

  async function handleAlterarSenha(e) {
    e.preventDefault();
    if (novaSenha.trim().length < 6) return mostrarToast('A nova senha deve possuir no mínimo 6 caracteres.', 'erro');
    setSalvandoSenha(true);

    try {
      const res = await fetch('/api/alterar-senha', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}` // <-- MÁGICA: Envia a carteirinha do usuário
        },
        body: JSON.stringify({
          clienteId: id,
          novaSenha: novaSenha.trim(),
          contaSelecionada: contaSelecionadaSenha
        })
      });

      const data = await res.json();

      if (data.success) {
        mostrarToast('Senha atualizada com sucesso e protegida!', 'sucesso');
        setNovaSenha('');
        setMostrarModalPerfil(false);
        if (contaSelecionadaSenha !== 'principal') {
          const sociosAtualizados = (cliente.socios || []).map(s => s.id === contaSelecionadaSenha ? { ...s, senha: '***' } : s);
          setCliente({ ...cliente, socios: sociosAtualizados });
        }
      } else {
        mostrarToast('Erro ao atualizar a senha: ' + data.error, 'erro');
      }
    } catch (err) {
      mostrarToast('Erro de conexão com o servidor.', 'erro');
    }
    setSalvandoSenha(false);
  }

 // ===============================================
  // GESTÃO DE LINKS ÚTEIS (COM ESPELHAMENTO GLOBAL)
  // ===============================================
  async function handleSalvarLink(e) {
    e.preventDefault();
    if (!formLink.titulo?.trim() || !formLink.url?.trim()) return;

    setSubindoArquivo(true);
    
    const isCoringa = cliente?.cnpj?.replace(/\D/g, '') === '50457640000101' || cliente?.nome_empresa?.toLowerCase().includes('lsprado');
    const regimeAlvo = formLink.regime_alvo || 'Todos';

    const novoLink = { 
      id: linkEditando || Date.now().toString(), 
      titulo: formLink.titulo.trim(), 
      url: formLink.url.trim(), 
      descricao: formLink.descricao?.trim() || '',
      regime_alvo: regimeAlvo,
      is_global: isCoringa
    };

    const linksAtuais = cliente.links || [];
    const novaListaLsprado = linkEditando 
      ? linksAtuais.map(l => l.id === linkEditando ? novoLink : l) 
      : [...linksAtuais, novoLink];

    const { error } = await supabase.from('clientes').update({ links: novaListaLsprado }).eq('id', id);

    if (!error) {
      
      if (isCoringa) {
        const { data: allClients } = await supabase.from('clientes').select('id, links, regime_tributario, nome_empresa');
        
        const paraAdicionar = [];
        const paraRemover = [];

        // Separa os clientes nas suas respectivas filas
        for (const c of allClients) {
          if (c.id === id) continue; // Pula o próprio Lsprado

          let linksDoCliente = c.links || [];
          const hasLink = linksDoCliente.some(l => l.id === novoLink.id);
          const deveTerLink = regimeAlvo === 'Todos' || c.regime_tributario === regimeAlvo;

          if (deveTerLink) {
             // Se não tem ou se os dados do link mudaram (edição), vai pra fila de atualização
             if (!hasLink || JSON.stringify(linksDoCliente.find(l => l.id === novoLink.id)) !== JSON.stringify(novoLink)) {
                paraAdicionar.push(c);
             }
          } else if (hasLink) {
             // Se tem o link mas o regime_alvo mudou e ele não tem mais direito, remove
             paraRemover.push(c);
          }
        }

        const totalFases = (paraAdicionar.length > 0 ? 1 : 0) + (paraRemover.length > 0 ? 1 : 0);
        let faseAtual = 1;

        // ETAPA 1: ADICIONANDO / ATUALIZANDO
        if (paraAdicionar.length > 0) {
          for (let i = 0; i < paraAdicionar.length; i++) {
            const c = paraAdicionar[i];
            setProgressoLink({ fase: faseAtual, totalFases, nomeFase: 'Aplicando link', atual: i + 1, total: paraAdicionar.length, texto: c.nome_empresa });
            
            let linksDoCliente = c.links || [];
            const hasLink = linksDoCliente.some(l => l.id === novoLink.id);
            if (hasLink) {
              linksDoCliente = linksDoCliente.map(l => l.id === novoLink.id ? novoLink : l);
            } else {
              linksDoCliente.push(novoLink);
            }
            await supabase.from('clientes').update({ links: linksDoCliente }).eq('id', c.id);
          }
          faseAtual++;
        }

        // ETAPA 2: REMOVENDO ANTIGOS (Se aplicável)
        if (paraRemover.length > 0) {
          for (let i = 0; i < paraRemover.length; i++) {
            const c = paraRemover[i];
            setProgressoLink({ fase: faseAtual, totalFases, nomeFase: 'Limpando link', atual: i + 1, total: paraRemover.length, texto: c.nome_empresa });
            
            let linksDoCliente = c.links || [];
            linksDoCliente = linksDoCliente.filter(l => l.id !== novoLink.id);
            await supabase.from('clientes').update({ links: linksDoCliente }).eq('id', c.id);
          }
        }
      }

      mostrarToast(linkEditando ? 'Link atualizado com sucesso!' : 'Link adicionado com sucesso!', 'sucesso');
      setCliente({ ...cliente, links: novaListaLsprado });
      setFormLink({ titulo: '', url: '', descricao: '', regime_alvo: 'Todos' });
      setLinkEditando(null);
      setMostrarFormLink(false);
      setProgressoLink(null);
    } else { 
      mostrarToast('Erro ao salvar link: ' + error.message, 'erro'); 
    }
    setSubindoArquivo(false);
  }

  function handleRemoverLink(linkId) {
    const isCoringa = cliente?.cnpj?.replace(/\D/g, '') === '50457640000101' || cliente?.nome_empresa?.toLowerCase().includes('lsprado');
    const msg = isCoringa ? 'Este link global será apagado de TODOS os clientes do sistema. Continuar?' : 'Tem certeza que deseja remover este acesso rápido?';

    confirmarAcao(isCoringa ? 'Excluir Link Global' : 'Excluir Link', msg, async () => {
      setSubindoArquivo(true);
      const novaLista = (cliente.links || []).filter(l => l.id !== linkId);
      const { error } = await supabase.from('clientes').update({ links: novaLista }).eq('id', id);
      
      if (!error) { 
        if (isCoringa) {
          const { data: allClients } = await supabase.from('clientes').select('id, links, nome_empresa');
          const paraRemover = allClients.filter(c => c.id !== id && c.links && c.links.some(l => l.id === linkId));
          
          if (paraRemover.length > 0) {
            for (let i = 0; i < paraRemover.length; i++) {
              const c = paraRemover[i];
              setProgressoLink({ fase: 1, totalFases: 1, nomeFase: 'Excluindo Globalmente', atual: i + 1, total: paraRemover.length, texto: c.nome_empresa });
              const novaListaDele = c.links.filter(l => l.id !== linkId);
              await supabase.from('clientes').update({ links: novaListaDele }).eq('id', c.id);
            }
          }
        }
        mostrarToast('Link removido com sucesso.', 'sucesso'); 
        setCliente({ ...cliente, links: novaLista }); 
      }
      setProgressoLink(null);
      setSubindoArquivo(false);
    });
  }

  function copiarParaTransferencia(texto) {
    navigator.clipboard.writeText(texto);
    mostrarToast('Copiado para a área de transferência!', 'sucesso');
  }

  // NOVO: ALTERAR REGIME DIRETAMENTE DO PERFIL (APENAS ADMIN)
  async function handleAlterarRegime(novoRegime) {
    if (!novoRegime || novoRegime === cliente.regime_tributario) return;
    setSubindoArquivo(true);
    
    const { error } = await supabase.from('clientes').update({ regime_tributario: novoRegime }).eq('id', id);
    
    if (!error) {
      setCliente({ ...cliente, regime_tributario: novoRegime });
      mostrarToast(`Regime atualizado para ${novoRegime}!`, 'sucesso');
      await registrarAuditoria('CLIENTE_EDITADO', `Alterou o regime tributário para ${novoRegime}.`);
    } else {
      mostrarToast('Erro ao atualizar regime: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  // Função Exclusiva do Admin para alterar o Ciclo do Financeiro
  async function handleAlterarDiaVencimento(novoDia) {
    setSubindoArquivo(true);
    const diaNum = parseInt(novoDia, 10);
    const { error } = await supabase.from('clientes').update({ dia_vencimento: diaNum }).eq('id', id);

    if (!error) {
      setCliente({ ...cliente, dia_vencimento: diaNum });
      mostrarToast(diaNum === 99 ? 'Cliente configurado como Isento!' : `Vencimento atualizado para o dia ${diaNum}!`, 'sucesso');
      await registrarAuditoria('CLIENTE_EDITADO', `Alterou o ciclo do financeiro para ${diaNum === 99 ? 'Isento' : diaNum}.`);
      // Admin continua na aba e pode reverter a qualquer momento
    } else {
      mostrarToast('Erro ao atualizar vencimento: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  function handleLogout() {
    localStorage.removeItem('usuario_nome'); localStorage.removeItem('usuario_tipo'); localStorage.removeItem('usuario_id');
    router.push('/login');
  }

  // LOGICA DO MULTI-CNPJ
  async function handleBuscarCnpjVinculo(e) {
    e.preventDefault();
    if (formVinculo.cnpj.length < 18) return mostrarToast('Preencha o CNPJ completo.', 'erro');
    setStatusBuscaCnpj('buscando');
    
    // Verifica se a empresa já existe na plataforma
    const { data, error } = await supabase.from('clientes').select('id, nome_empresa').eq('cnpj', formVinculo.cnpj).single();
    
    if (data) {
      // Existe! Guarda apenas para exibição e aprovação do Admin
      setFormVinculo(prev => ({ ...prev, nome_empresa: data.nome_empresa }));
      setStatusBuscaCnpj('encontrado');
    } else {
      // Não existe! Cliente terá de preencher o resto para o Admin criar
      setStatusBuscaCnpj('nao_encontrado');
    }
  }

  async function handleSolicitarVinculo(e) {
    e.preventDefault();
    setSubindoArquivo(true);
    
    const tipo = statusBuscaCnpj === 'encontrado' ? 'vinculo_existente' : 'novo_vinculo';
    
    const payload = {
      vinculo_origem_id: cliente.id,
      tipo_solicitacao: tipo,
      cnpj: formVinculo.cnpj,
      nome_empresa: formVinculo.nome_empresa,
      nome_contato: formVinculo.nome_contato || cliente.nome_contato,
      email: formVinculo.email || cliente.email,
      celular: formVinculo.celular || cliente.celular,
      regime_tributario: formVinculo.regime_tributario || 'Simples Nacional'
    };

    const { error } = await supabase.from('solicitacoes_cadastro').insert([payload]);
    
    if (!error) {
      mostrarToast('Pedido enviado! A equipa irá validar o vínculo em breve.', 'sucesso');
      setMostrarFormVinculo(false);
      setFormVinculo({ cnpj: '', nome_empresa: '', nome_contato: '', email: '', celular: '', regime_tributario: '' });
      setStatusBuscaCnpj('ocioso');
    } else {
      mostrarToast('Erro ao enviar pedido: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  async function handleResponderAlerta(e, alerta) {
    const file = e.target.files[0];
    if (!file) return;
    
    e.target.value = null; // MÁGICA: Libera o input

    if (file.size > 15 * 1024 * 1024) return mostrarToast('O arquivo excede 15MB.', 'erro');

    setSubindoArquivo(true);
    const timestamp = Date.now();
    const caminhoArquivo = `${id}/respostas/${timestamp}_${file.name}`;
    const { error: storageError } = await supabase.storage.from('documentos').upload(caminhoArquivo, file);
    
    if (storageError) { mostrarToast('Erro no upload: ' + storageError.message, 'erro'); setSubindoArquivo(false); return; }

    const { error: dbError } = await supabase.from('alertas_clientes').update({ status: 'respondido', caminho_arquivo: caminhoArquivo }).eq('id', alerta.id);
    if (!dbError) {
      
      // INJEÇÃO DUPLA: Cria o espelho nos Docs Recebidos do Admin
      await supabase.from('envios_cliente').insert([{
        cliente_id: id,
        nome_documento: `[RESPOSTA] ${alerta.titulo}`,
        nome_original: file.name,
        caminho_storage: caminhoArquivo,
        status: 'pendente'
      }]);

      mostrarToast('Documento enviado! A Innovative foi notificada.', 'sucesso');
      await carregarDadosDaAba();
      atualizarBadgeGlobal(id);
    }
    setSubindoArquivo(false);
  }

  function handleConcluirDemanda0Arquivo(alerta) {
    confirmarAcao('Concluir sem Arquivos', 'Pretende marcar esta pendência como concluída sem anexar arquivos?', async () => {
      setSubindoArquivo(true);
      const { error } = await supabase.from('alertas_clientes').update({ status: 'respondido' }).eq('id', alerta.id);
      if (!error) {
        mostrarToast('Demanda concluída com sucesso!', 'sucesso');
        await carregarDadosDaAba();
        atualizarBadgeGlobal(id);
      }
      setSubindoArquivo(false);
    }, 'sucesso');
  }

  async function handleMarcarAvisoLido(alerta) {
    setSubindoArquivo(true);
    const { error } = await supabase.from('alertas_clientes').update({ status: 'respondido' }).eq('id', alerta.id);
    if (!error) {
      mostrarToast('Aviso marcado como lido!', 'sucesso');
      await carregarDadosDaAba();
      atualizarBadgeGlobal(id);
    }
    setSubindoArquivo(false);
  }

  async function handleMoverAvisoHistorico(alerta) {
    setSubindoArquivo(true);
    const { error } = await supabase.from('alertas_clientes').update({ status: 'historico' }).eq('id', alerta.id);
    if (!error) {
      mostrarToast('Aviso guardado no histórico!', 'sucesso');
      await carregarDadosDaAba();
    }
    setSubindoArquivo(false);
  }

  function adicionarMaisUm() { setEnviosPre([...enviosPre, { id: Date.now(), descricao: '', arquivo: null, departamento: 'Contábil' }]); }
  function removerLineEnvio(linhaId) { if (enviosPre.length === 1) return; setEnviosPre(enviosPre.filter(item => item.id !== linhaId)); }
  function alterarDescricao(linhaId, texto) { setEnviosPre(enviosPre.map(item => item.id === linhaId ? { ...item, descricao: texto } : item)); }
  function alterarArquivo(linhaId, arquivoSelecionado) { setEnviosPre(enviosPre.map(item => item.id === linhaId ? { ...item, arquivo: arquivoSelecionado } : item)); }
  function alterarDepartamentoEnvio(linhaId, valor) { setEnviosPre(enviosPre.map(item => item.id === linhaId ? { ...item, departamento: valor } : item)); } // NOVO

  async function handleEnviarParaContabilidade(e) {
    e.preventDefault();
    const validos = enviosPre.filter(item => item.arquivo && item.descricao.trim());
    if (validos.length === 0) return mostrarToast('Preencha a descrição e selecione um arquivo.', 'erro');

    for (const item of validos) {
      if (item.arquivo.size > 4.4 * 1024 * 1024) return mostrarToast(`O arquivo "${item.arquivo.name}" excede 4.4MB.`, 'erro');
    }

    setSubindoArquivo(true);
    
    // 1. Busca os IDs do Drive salvos neste cliente
    const { data: dadosCliente } = await supabase.from('clientes').select('id_drive_recebidos').eq('id', id).single();
    const pastaDestinoDrive = dadosCliente?.id_drive_recebidos;

    for (const item of validos) {
      let caminhoFinal = null;

      // 2. Se o cliente tiver a pasta no Drive, joga pra lá! Se não tiver, joga pro Supabase como backup.
      if (pastaDestinoDrive) {
        const formData = new FormData();
        formData.append('file', item.arquivo);
        formData.append('folderId', pastaDestinoDrive);
        
        try {
          const res = await fetch('/api/drive/upload', { method: 'POST', body: formData });
          const resData = await res.json();
          if (resData.success) {
            caminhoFinal = `DRIVE:${resData.fileId}`; // Identificador mágico pra gente saber que tá no Drive
          } else {
            console.error("Falha no Drive, caindo para backup.");
          }
        } catch (err) { console.error("Erro no fetch do Drive:", err); }
      }

      // Fallback de segurança (se o Drive falhar, salva no Supabase para não perder o doc do cliente)
      if (!caminhoFinal) {
         const timestamp = Date.now();
         caminhoFinal = `${id}/recebidos/${timestamp}_${item.arquivo.name}`;
         await supabase.storage.from('documentos').upload(caminhoFinal, item.arquivo);
      }

      await supabase.from('envios_cliente').insert([{ 
        cliente_id: id, 
        nome_documento: item.descricao.trim(), 
        nome_original: item.arquivo.name, 
        caminho_storage: caminhoFinal, 
        status: 'pendente', 
        departamento: item.departamento 
      }]);
    }

    mostrarToast('Documentos enviados com sucesso!', 'sucesso');
    setEnviosPre([{ id: 1, descricao: '', arquivo: null, departamento: 'Contábil' }]);
    carregarDadosDaAba();
    setSubindoArquivo(false);
  }

  async function handleEnviarPedido(e) {
    e.preventDefault();
    if (!novoPedido.trim() || !departamentoPedido) return;
    
    setSubindoArquivo(true);
    let caminhoArquivo = null;
    let nomeOriginal = null;

    if (arquivoPedido) {
      if (arquivoPedido.size > 4.4 * 1024 * 1024) {
        mostrarToast('O arquivo excede o limite de 4.4MB.', 'erro');
        setSubindoArquivo(false); return;
      }
      const timestamp = Date.now();
      caminhoArquivo = `${id}/pedidos_cliente/${timestamp}_${arquivoPedido.name}`;
      nomeOriginal = arquivoPedido.name;
      const { error } = await supabase.storage.from('documentos').upload(caminhoArquivo, arquivoPedido);
      if (error) {
        mostrarToast('Erro ao anexar arquivo: ' + error.message, 'erro');
        setSubindoArquivo(false); return;
      }
    }

    await supabase.from('pedidos_cliente').insert([{ 
      cliente_id: id, 
      descricao: novoPedido.trim(), 
      status: 'pendente',
      departamento: departamentoPedido,
      caminho_arquivo: caminhoArquivo,
      nome_arquivo: nomeOriginal
    }]);

    notificarEquipaDepto(departamentoPedido, cliente?.nome_empresa, 'Novo Ticket Aberto');
    
    // Apita o celular de TODOS os Admins logados
    dispararPush(
      'interno', 
      `Novo Ticket: ${cliente?.nome_empresa} 🚨`, 
      `Departamento: ${departamentoPedido}. Acesse o painel para verificar a solicitação.`
    );

    mostrarToast(`A sua solicitação foi enviada para o departamento ${departamentoPedido}!`, 'sucesso');
    setNovoPedido('');
    setArquivoPedido(null);
    setDepartamentoPedido('Contábil'); // Reseta para o padrão
    carregarDadosDaAba();
    setSubindoArquivo(false);
  }

  async function handleEnviarReplica(pedidoOriginal) {
    if (!textoReplica.trim()) return;
    setSubindoArquivo(true);

    const depto = pedidoOriginal.departamento || 'Contábil';
    const textoFormatado = `[Continuação do Pedido de ${new Date(pedidoOriginal.criado_em).toLocaleDateString('pt-BR')}]:\n\n${textoReplica.trim()}`;

    const { error } = await supabase.from('pedidos_cliente').insert([{ 
      cliente_id: id, 
      descricao: textoFormatado, 
      status: 'pendente',
      departamento: depto 
    }]);

    if (!error) {
      notificarEquipaDepto(depto, cliente?.nome_empresa, 'Resposta de Cliente (Ticket)');
      mostrarToast('Nova mensagem enviada com sucesso para a equipa!', 'sucesso');
      setChamadoReabrindo(null);
      setTextoReplica('');
      carregarDadosDaAba();
    } else {
      mostrarToast('Erro ao enviar: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }
  const arquivosFiltradosDaBusca = useMemo(() => {
    return arquivos.filter((arq) => {
      const textoBusca = busca.toLowerCase();
      const nomeOriginal = arq.nome_original?.toLowerCase() || '';
      const nomeDoc = arq.nome_documento?.toLowerCase() || '';
      const matchBusca = nomeOriginal.includes(textoBusca) || nomeDoc.includes(textoBusca);
      
      if (abaPrincipal === 'pastas') {
        return matchBusca && (arq.subpasta_id || null) === subpastaAtiva;
      }
      return matchBusca;
    });
  }, [arquivos, busca, abaPrincipal, subpastaAtiva]);

  // Lógica de "Google Drive" - Constrói o caminho de navegação
  function obterCaminhoPastas(pastaId) {
    const caminho = [];
    let atual = pastas.find(p => p.id === pastaId);
    while (atual) {
      caminho.unshift(atual);
      atual = pastas.find(p => p.id === atual.parent_id); // Puxa o pai do pai infinitamente
    }
    return caminho;
  }
  const caminhoPastas = subpastaAtiva ? obterCaminhoPastas(subpastaAtiva) : [];
  
  // MÁGICA RECURSIVA: Verifica se a pasta ou qualquer subpasta filha infinita possui arquivos
  const pastaTemArquivos = (pastaId) => {
    // 1. Tem arquivo direto nela?
    if (arquivos.some(a => a.subpasta_id === pastaId)) return true;
    
    // 2. Não tem? Busca as subpastas filhas e checa recursivamente na árvore!
    const subpastasFilhas = pastas.filter(p => p.parent_id === pastaId);
    return subpastasFilhas.some(filha => pastaTemArquivos(filha.id));
  };

  // 🟢 MÁGICA RECURSIVA 2: A Bolinha Verde Inteligente (Bubbling)
  const pastaTemNaoLidos = (pastaId) => {
    // 1. Tem novidade direto nela? Acende!
    if (arquivosNaoLidos.some(a => a.subpasta_id === pastaId)) return true;
    // 2. Não tem? Pergunta para as filhas se alguma delas tem novidade lá no fundo!
    const subpastasFilhas = pastas.filter(p => p.parent_id === pastaId);
    return subpastasFilhas.some(filha => pastaTemNaoLidos(filha.id));
  };

  // Filtra as pastas para mostrar apenas as que estão no nível atual
  const pastasAtuais = pastas.filter(p => {
    const isNivelAtual = (p.parent_id || null) === (subpastaAtiva || null);
    if (!isNivelAtual) return false;
    
    // Se for a equipe interna (Admin), mostra tudo. Se for cliente, só mostra se tiver arquivo na árvore.
    if (isInterno) return true; 
    return pastaTemArquivos(p.id);
  });

  // Lógica do Drag and Drop (Arrastar e Soltar)
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation(); // MÁGICA: Impede o navegador de tentar ler o arquivo nativamente
    if (abaPrincipal === 'pastas' && pastaAtiva && pastaAtiva !== 'financeiro') setIsDragging(true);
    else if (abaPrincipal === 'envios' || abaPrincipal === 'solicitacoes') setIsDragging(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    // MÁGICA: Só desativa o overlay se o mouse realmente sair da janela do navegador
    if (e.currentTarget && e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }
  async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // Extrai diretamente a lista de arquivos para evitar conflito da API de diretórios
    const files = Array.from(e.dataTransfer.files || []);
    if (!files || files.length === 0) return;

    // 1. Mágica do Drop na aba de Envios
    if (abaPrincipal === 'envios') {
      if (files.length > 0) {
        alterarArquivo(enviosPre[0].id, files[0]);
        mostrarToast(`Arquivo "${files[0].name}" anexado! Preencha a descrição.`, 'sucesso');
      }
      return;
    }

    // 2. Mágica do Drop na aba de Solicitações (Tickets)
    if (abaPrincipal === 'solicitacoes') {
      if (files.length > 0) {
        setArquivoPedido(files[0]);
        mostrarToast(`Arquivo "${files[0].name}" anexado ao ticket!`, 'sucesso');
      }
      return;
    }

    // 3. Drop nas Pastas (Mágica Otimizada: Reutiliza o fluxo do botão +Arquivo)
    if (abaPrincipal === 'pastas') {
      if (!pastaAtiva || pastaAtiva === 'financeiro') {
        return mostrarToast('Navegue até uma pasta (exceto Financeiro) para soltar arquivos diretos.', 'aviso');
      }
      
      // Repassa a lista inteira de arquivos para a função principal de upload.
      // O sistema já sabe exatamente em qual pasta/subpasta o utilizador está e sincroniza com o Drive!
      await handleUpload(files);
      return;
    }
  }

  // Efeito SKELETON (Carregamento Premium)
  if (carregando) return (
    <div className="min-h-screen bg-[#0d1b2a] p-6 md:p-12 flex flex-col gap-10 pointer-events-none">
      {/* Skeleton do Header */}
      <div className="flex justify-between items-center animate-pulse mb-4">
        <div className="w-64 h-12 bg-zinc-800 rounded-lg"></div>
        <div className="flex gap-4">
          <div className="w-24 h-8 bg-zinc-800 rounded-lg"></div>
          <div className="w-16 h-8 bg-red-500/20 rounded-lg"></div>
        </div>
      </div>
      {/* Skeleton da Navegação */}
      <div className="flex gap-6 animate-pulse border-b border-zinc-800 pb-2">
        <div className="w-32 h-6 bg-zinc-800 rounded"></div>
        <div className="w-32 h-6 bg-zinc-800 rounded"></div>
        <div className="w-32 h-6 bg-zinc-800 rounded"></div>
      </div>
      {/* Skeleton dos Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-pulse">
        {[1,2,3,4,5].map(i => <div key={i} className="h-28 bg-[#1b263b] border border-zinc-800 rounded-xl"></div>)}
      </div>
      {/* Skeleton da Área de Conteúdo */}
      <div className="flex-1 bg-[#1b263b] border border-zinc-800 rounded-xl p-8 animate-pulse mt-4">
        <div className="w-48 h-8 bg-zinc-800 rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-16 bg-zinc-800 rounded-lg"></div>)}
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="min-h-screen bg-[#0d1b2a] text-white font-sans p-6 md:p-12 relative"
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >

      {/* 📂 O OVERLAY DO GOOGLE DRIVE (Drag & Drop) */}
      {isDragging && (
        <div 
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="fixed inset-0 z-[99998] bg-[#d4af37]/10 backdrop-blur-md flex items-center justify-center border-[6px] border-dashed border-[#d4af37] m-4 rounded-3xl cursor-copy"
        >
          <div className="bg-[#1b263b] p-10 rounded-2xl shadow-2xl flex flex-col items-center gap-4 pointer-events-none">
            <span className="text-7xl animate-bounce">📂</span>
            <h2 className="text-3xl font-black text-[#d4af37]">Solte o arquivo aqui</h2>
            <p className="text-zinc-300 font-medium text-lg text-center">
              {abaPrincipal === 'pastas' ? (
                <>Será publicado na pasta: <br/><span className="text-white font-bold text-xl">{pastas.find(p => p.id === subpastaAtiva)?.nome || pastaAtiva}</span></>
              ) : abaPrincipal === 'envios' ? (
                'O arquivo será anexado ao formulário de envio.'
              ) : (
                'O arquivo será anexado ao seu ticket.'
              )}
            </p>
          </div>
        </div>
      )}

      {/* ÂNCORA Z-0 PARA MATAR O LOGO E A BARRA VOADORA */}
      <div className="relative z-0 max-w-5xl mx-auto">
        
        {/* BARRA SUPERIOR COMPACTA */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 bg-[#1b263b]/30 p-4 rounded-xl border border-zinc-800/60 gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            {isInterno ? (
              <button onClick={() => router.push('/')} className="text-sm font-bold text-[#d4af37] hover:underline hover:text-yellow-400 transition">← Voltar para o Painel Admin</button>
            ) : (
              <span className="text-xs text-zinc-500 font-bold tracking-wider uppercase">Portal Restrito do Cliente</span>
            )}
          </div>
          <div className="flex items-center gap-4 relative">
            <span className="text-sm text-zinc-400 hidden sm:inline">
              Conectado como: <strong onClick={() => setMostrarModalPerfil(true)} className="text-[#d4af37] font-extrabold cursor-pointer hover:underline" title="Configurações da Conta">{operador}</strong>
            </span>
            
            {/* SWITCHER DE CONTAS */}
            {empresasLigadas.length > 0 && (
              <div className="relative">
                <button onClick={() => setMostrarSwitcher(!mostrarSwitcher)} className="text-xs bg-[#1b263b] border border-zinc-700 hover:border-[#d4af37] px-3 py-2 rounded-lg transition-all font-bold flex items-center gap-2">
                  Trocar Empresa ▼
                </button>
                {mostrarSwitcher && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#0d1b2a] border border-zinc-700 rounded-xl shadow-2xl z-[999] overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800 bg-[#1b263b]/50">
                      <p className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Empresas Vinculadas</p>
                    </div>
                    {/* A empresa Mestre (a que estamos) também aparece para poder voltar */}
                    <div onClick={() => { localStorage.setItem('usuario_id', cliente.id); window.location.href = `/cliente/${cliente.id}`; }} className="px-4 py-3 cursor-pointer hover:bg-zinc-800 transition border-b border-zinc-800/50">
                      <p className="text-xs font-bold text-[#d4af37] truncate">{cliente.nome_empresa} (Atual)</p>
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

            <button onClick={() => setMostrarModalPerfil(true)} className="sm:hidden text-xs bg-zinc-800 px-3 py-2 rounded-lg font-bold border border-zinc-700">⚙️ Perfil</button>
            <button onClick={handleLogout} className="text-xs bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-4 py-2 rounded-lg transition-all font-bold">Sair</button>
          </div>
        </div>

        {/* BANNER DE NOTIFICAÇÕES (PUSH) */}
        {!notificacoesAtivas && !isInterno && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/30 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg animate-in fade-in slide-in-from-top-4">
             <div className="flex items-center gap-4">
                <span className="text-4xl animate-bounce drop-shadow-lg">🔔</span>
                <div>
                   <h3 className="text-blue-400 font-black text-sm uppercase tracking-wide">Ative as Notificações no seu aparelho!</h3>
                   <p className="text-xs text-blue-200/80 mt-1">Seja avisado em tempo real sobre novas guias de pagamento, documentos e respostas da nossa equipa.</p>
                </div>
             </div>
             <button onClick={async () => { setPedindoPush(true); const sucesso = await inscreverAparelho(id, 'cliente'); if(sucesso){ setNotificacoesAtivas(true); mostrarToast('Notificações ativadas no seu aparelho!', 'sucesso'); } else { mostrarToast('Permissão negada. Verifique as configurações do navegador.', 'erro'); } setPedindoPush(false); }} disabled={pedindoPush} className="w-full sm:w-auto bg-blue-500 text-white font-black px-6 py-3.5 rounded-lg text-xs hover:bg-blue-400 transition shadow-[0_0_15px_rgba(59,130,246,0.4)] whitespace-nowrap">
                {pedindoPush ? 'A aguardar permissão...' : 'Permitir Notificações'}
             </button>
          </div>
        )}

        {/* CABEÇALHO DO CLIENTE COM LOGO */}
        {cliente && (
          <header className="mb-10 bg-[#1b263b] p-6 sm:p-8 rounded-xl border border-zinc-800 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 sm:gap-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
                <img src="/logo.png" alt="Logo Innovative" className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-lg" />
                <div>
                  <h1 
                    className={`text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center justify-center sm:justify-start gap-3 ${isInterno ? 'cursor-pointer hover:text-[#d4af37] transition group' : ''}`}
                    onClick={() => {
                      if (isInterno) {
                        setFormEditar({
                          nome_empresa: cliente.nome_empresa || '',
                          nome_contato: cliente.nome_contato || '',
                          email: cliente.email || '',
                          celular: cliente.celular || '',
                          dia_vencimento: cliente.dia_vencimento || 20
                        });
                        setEmpresasLigadasForm([...empresasLigadas]);
                        setBuscaLink('');
                        setModalEditarCliente(true);
                        
                        // 🚀 Busca rápida de empresas para o campo de pesquisa
                        supabase.from('clientes').select('id, nome_empresa, cnpj, cpf, tipo_conta').neq('id', id).then(({data}) => {
                          if (data) setTodosClientesParaLink(data);
                        });
                      }
                    }}
                    title={isInterno ? "Clique para editar os dados cadastrais" : ""}
                  >
                    {cliente.nome_empresa}
                    {isInterno && <span className="opacity-0 group-hover:opacity-100 text-[10px] text-[#d4af37] transition-opacity bg-zinc-800/80 px-2 py-1 rounded uppercase tracking-widest border border-[#d4af37]/30 shadow-md">Editar</span>}
                  </h1>
                  <p className="text-zinc-400 text-sm">CNPJ: {cliente.cnpj}</p>
                </div>
              </div>
              
              {/* MAGICA: Dropdown para o Admin, Texto normal para o Cliente */}
              {isInterno ? (
                <select
                  value={cliente.regime_tributario || 'Simples Nacional'}
                  onChange={(e) => handleAlterarRegime(e.target.value)}
                  disabled={subindoArquivo}
                  className="bg-[#0d1b2a] text-[#d4af37] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold border border-[#d4af37]/50 hover:bg-[#1b263b] w-full sm:w-auto text-center cursor-pointer focus:outline-none focus:border-yellow-500 transition-colors disabled:opacity-50 shadow-sm appearance-none"
                  title="Clique para alterar o Regime Tributário"
                >
                  <option value="Simples Nacional">Simples Nacional</option>
                  <option value="Lucro Presumido">Lucro Presumido</option>
                  <option value="Lucro Real">Lucro Real</option>
                </select>
              ) : (
                <span className="bg-[#0d1b2a] text-[#d4af37] px-4 py-2 rounded-lg text-xs sm:text-sm font-bold border border-[#d4af37]/30 w-full sm:w-auto text-center">
                  {cliente.regime_tributario}
                </span>
              )}

            </div>
          </header>
        )}

        {/* BANNERS INTELIGENTES DE PENDÊNCIAS E ATRASOS */}
        {!isInterno && alertasGlobaisAtrasados > 0 && (
          <div className="mb-4 bg-red-500/10 border border-red-500/40 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <IconAlertRed />
                <div>
                   <h3 className="text-red-400 font-bold text-sm">Você possui {alertasGlobaisAtrasados} pendência(s) em ATRASO!</h3>
                   <p className="text-xs text-red-200/70">O prazo expirou. Por favor, verificar pendência(s).</p>
                </div>
             </div>
             <button onClick={() => { setAbaPrincipal('alertas'); rolarPara('conteudo-abas'); }} className="w-full sm:w-auto bg-red-500 text-white font-bold px-6 py-2.5 rounded-lg text-xs hover:bg-red-600 transition shadow-md whitespace-nowrap">
                Verificar Agora
             </button>
          </div>
        )}

        {!isInterno && alertasGlobaisPendentes > 0 && (
          <div className="mb-4 bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_0_15px_rgba(249,115,22,0.1)] animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <IconWarningOrange />
                <div>
                   <h3 className="text-orange-400 font-bold text-sm">Você possui {alertasGlobaisPendentes} pendência(s) no prazo</h3>
                   <p className="text-xs text-orange-200/70">Acesse a aba para enviar os documentos solicitados ou marcar como realizado.</p>
                </div>
             </div>
             <button onClick={() => { setAbaPrincipal('alertas'); rolarPara('conteudo-abas'); }} className="w-full sm:w-auto bg-orange-500 text-white font-bold px-6 py-2.5 rounded-lg text-xs hover:bg-orange-600 transition shadow-md whitespace-nowrap">
                Ir para Pendências
             </button>
          </div>
        )}

        {/* BANNER AZUL DE AVISOS */}
        {!isInterno && alertasGlobaisLembretes > 0 && (
          <div className="mb-4 bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_0_15px_rgba(59,130,246,0.1)] animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <IconInfoBlue />
                <div>
                   <h3 className="text-blue-400 font-bold text-sm">Você possui {alertasGlobaisLembretes} novo(s) aviso(s)!</h3>
                   <p className="text-xs text-blue-200/70">Acesse para conferir os recados ou lembretes da nossa equipa.</p>
                </div>
             </div>
             <button onClick={() => { setAbaPrincipal('avisos'); rolarPara('conteudo-abas'); }} className="w-full sm:w-auto bg-blue-500 text-white font-bold px-6 py-2.5 rounded-lg text-xs hover:bg-blue-600 transition shadow-md whitespace-nowrap">
                Ler Avisos
             </button>
          </div>
        )}

        {!isInterno && pedidosResolvidosNaoLidos > 0 && (
          <div className="mb-8 bg-emerald-500/10 border border-emerald-500/40 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <IconCheckGreen />
                <div>
                   <h3 className="text-emerald-400 font-bold text-sm">Você possui {pedidosResolvidosNaoLidos} solicitação(ões) respondida(s)!</h3>
                   <p className="text-xs text-emerald-200/70">A equipa atendeu ao seu pedido. Clique para conferir a resposta e baixar anexos se houver.</p>
                </div>
             </div>
             <button onClick={() => { setAbaPrincipal('solicitacoes'); rolarPara('conteudo-abas'); }} className="w-full sm:w-auto bg-emerald-500 text-[#0d1b2a] font-extrabold px-6 py-2.5 rounded-lg text-xs hover:bg-emerald-400 transition shadow-md whitespace-nowrap">
                Conferir Resposta
             </button>
          </div>
        )}

        {/* NAVEGAÇÃO PRINCIPAL INTELIGENTE */}
        <div className="flex flex-wrap gap-4 mb-8 border-b border-zinc-800 pb-px">
          <button onClick={() => { setAbaPrincipal('pastas'); rolarPara('conteudo-abas'); }} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaPrincipal === 'pastas' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconFolderTab /> Pastas de Arquivos
          </button>
          <button onClick={() => { setAbaPrincipal('envios'); rolarPara('conteudo-abas'); }} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaPrincipal === 'envios' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconUploadTab /> {isInterno ? 'Histórico de Envios' : 'Enviar Documentos'}
          </button>
          <button onClick={() => { setAbaPrincipal('solicitacoes'); rolarPara('conteudo-abas'); }} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaPrincipal === 'solicitacoes' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconChatTab /> {isInterno ? 'Histórico de Solicitações' : 'Solicitações'}
          </button>
          <button onClick={() => { setAbaPrincipal('alertas'); rolarPara('conteudo-abas'); }} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaPrincipal === 'alertas' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconBellTab /> {isInterno ? 'Cobranças/Pendências' : 'Cobranças / Pendências'}
            {alertasGlobaisPendentes > 0 && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-black shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse border border-red-400">
                {alertasGlobaisPendentes}
              </span>
            )}
          </button>

          <button onClick={() => { setAbaPrincipal('avisos'); rolarPara('conteudo-abas'); }} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaPrincipal === 'avisos' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Avisos
            {alertasGlobaisLembretes > 0 && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white font-black shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse border border-blue-400">
                {alertasGlobaisLembretes}
              </span>
            )}
          </button>
          
          {/* SÓ MOSTRA SE FOR ADMIN OU SE O CLIENTE TIVER ALGUM LINK CONFIGURADO */}
          {(isInterno || (cliente?.links && cliente.links.length > 0)) && (
            <button onClick={() => { setAbaPrincipal('links'); rolarPara('conteudo-abas'); }} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaPrincipal === 'links' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-zinc-400 hover:text-white'}`}>
              <IconLinkTab /> Links Úteis
            </button>
          )}

          {isInterno && (
            <button onClick={() => { setAbaPrincipal('lixeira'); rolarPara('conteudo-abas'); }} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaPrincipal === 'lixeira' ? 'border-red-500 text-red-400' : 'border-transparent text-zinc-500 hover:text-red-400'}`}>
              <IconTrashTab /> Lixeira
            </button>
          )}
        </div>

        <div id="conteudo-abas"></div> {/* Âncora Invisível */}

        {/* ==========================================
            ABA 1: PASTAS PERMANENTES DE ARQUIVOS
        ========================================== */}
        {abaPrincipal === 'pastas' && (
          <>
            <div className="flex flex-col md:flex-row w-full gap-4 mb-10">
              {[
                { id: 'contabil', nome: cliente?.clientes_van ? 'Contábil' : 'Documentos', desc: cliente?.clientes_van ? 'Balanços e DREs' : 'Documentos legais da empresa.', icon: <IconFolderLarge /> },
                { id: 'fiscal', nome: 'Fiscal', desc: 'Guias e Impostos', icon: <IconChartLarge /> },
                { id: 'rh', nome: 'DP / RH', desc: 'Folhas e Recibos', icon: <IconUsersLarge /> },
                { id: 'contrato', nome: 'Contratos', desc: 'Atos e Alterações', icon: <IconDocLarge /> },
                { id: 'financeiro', nome: 'Financeiro', desc: 'Controle de mensalidades', icon: <IconFinanceiroLarge /> },
                { id: 'societario', nome: 'Societário', desc: 'Processos', icon: <IconSocietarioLarge /> }
              ].filter(pasta => !(pasta.id === 'financeiro' && parseInt(cliente?.dia_vencimento, 10) === 99 && !isInterno)).map(pasta => {
                const qtdNovos = !isInterno ? arquivosNaoLidos.filter(a => a.setor === pasta.id).length : 0;
                return (
                  <button key={pasta.id} onClick={() => { 
                    setPastaAtiva(pasta.id); 
                    if (pasta.id === 'societario') {
                      setBadgeSocietario(0);
                      localStorage.setItem(`societario_visto_${id}_${processos.length}`, 'true');
                    }
                    rolarPara('conteudo-pastas'); 
                  }} className={`relative flex-1 w-full p-5 rounded-xl border transition-all text-left flex flex-col justify-between shadow-lg ${pastaAtiva === pasta.id ? (pasta.id === 'societario' ? 'border-purple-500 bg-zinc-800' : 'border-[#d4af37] bg-zinc-800') : 'bg-[#1b263b] border-zinc-800 hover:border-zinc-700'}`}>
                    
                    {pasta.id !== 'societario' && qtdNovos > 0 && <span className="absolute -top-2 -right-2 bg-emerald-500 text-[#0d1b2a] text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm border border-emerald-400">{qtdNovos} Novo{qtdNovos > 1 ? 's' : ''}</span>}
                    {pasta.id === 'societario' && badgeSocietario > 0 && <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm border border-purple-400">{badgeSocietario} Novo(s)</span>}
                    
                    {pasta.icon}
                    <h3 className="text-sm font-bold text-white mb-1">{pasta.nome}</h3>
                    <p className="text-[10px] text-zinc-400">{pasta.desc}</p>
                  </button>
                )
              })}
            </div>

            <div id="conteudo-pastas"></div> {/* Âncora Invisível */}

            {pastaAtiva === 'societario' ? (
              <div className="bg-[#1b263b] p-8 rounded-xl border border-purple-500/30 shadow-xl mb-10 text-center animate-in fade-in">
                 <h3 className="text-2xl font-bold text-purple-400 mb-4">Painel Societário</h3>
                 {processos.length === 0 ? (
                    <div className="bg-[#0d1b2a] p-6 rounded-lg border border-purple-500/20 max-w-2xl mx-auto shadow-inner">
                       <p className="text-zinc-300 text-sm leading-relaxed">
                         Aqui ficarão os seus processos societários como <strong>Alteração Contratual, Abertura de Filial, Alteração de LTDA</strong>, entre outros serviços que pode contratar por fora com a nossa contabilidade.
                       </p>
                       <p className="text-zinc-500 text-xs mt-6 italic">Nenhum processo ativo no momento.</p>
                    </div>
                 ) : (
                    <div className="bg-[#0d1b2a] p-6 rounded-lg border border-purple-500/20 max-w-2xl mx-auto shadow-inner">
                       <p className="text-zinc-300 text-sm mb-6">Possui <strong>{processos.length}</strong> processo(s) em andamento ou no histórico.</p>
                       <button onClick={() => window.location.href = `/cliente/${id}?view=especial`} className="bg-purple-500 text-white font-black px-8 py-3.5 rounded-lg text-sm hover:bg-purple-400 transition shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                         Acessar Painel Especial
                       </button>
                       {isInterno && (
                         <p className="text-zinc-500 text-[10px] mt-4">Como Admin, pode clicar acima para gerir os processos deste cliente.</p>
                       )}
                    </div>
                 )}
              </div>
            ) : pastaAtiva === 'financeiro' ? (
              <div className="bg-[#1b263b] p-8 rounded-xl border border-[#d4af37]/30 shadow-xl mb-10">
                <div className="border-b border-zinc-800 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#d4af37]">Controle Mensalidades</h3>
                    <p className="text-sm text-zinc-400 mt-1">Acompanhe os meses pagos, visualize os boletos e anexe comprovantes.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* TOGGLE MÁGICO DE ANOS (Oculto para cliente até Dez/2026) */}
                    {(isInterno || new Date().getFullYear() > 2026 || (new Date().getFullYear() === 2026 && new Date().getMonth() >= 11)) && (
                      <div className="flex items-center bg-[#0d1b2a] rounded-lg border border-zinc-700 shadow-sm p-1">
                        <button onClick={() => setAnoFinanceiro(prev => prev - 1)} className="px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition font-bold">←</button>
                        <span className="px-4 py-1.5 text-[#d4af37] font-black text-sm">{anoFinanceiro}</span>
                        <button onClick={() => setAnoFinanceiro(prev => prev + 1)} className="px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition font-bold">→</button>
                      </div>
                    )}

                    {isInterno && (
                      <div className="flex items-center gap-2 bg-[#0d1b2a] p-2.5 rounded-lg border border-zinc-700 shadow-sm">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">Trocar Vencimento:</span>
                        <select 
                          value={cliente?.dia_vencimento || 20} 
                          onChange={(e) => handleAlterarDiaVencimento(e.target.value)}
                          disabled={subindoArquivo}
                          className="bg-[#1b263b] text-[#d4af37] px-2 py-1.5 rounded text-xs font-bold border border-[#d4af37]/30 cursor-pointer focus:outline-none"
                        >
                          <option value="20">Dia 20 (Abre dia 10)</option>
                          <option value="26">Dia 26 (Abre dia 15)</option>
                          <option value="30">Dia 30 (Abre dia 20)</option>
                          <option value="10">Dia 10 (Abre dia 01)</option>
                          <option value="99">Isenta (Ocultar Aba)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                
                {parseInt(cliente?.dia_vencimento, 10) === 99 ? (
                  <div className="bg-[#0d1b2a] border border-[#d4af37]/20 p-10 rounded-xl text-center shadow-inner mt-4 animate-in fade-in">
                    <span className="text-5xl block mb-4 drop-shadow-md opacity-90">🎁</span>
                    <h4 className="text-lg font-bold text-[#d4af37] mb-2 uppercase tracking-wide">Cliente Isento</h4>
                    <p className="text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
                      A visualização das cobranças está oculta. Este cliente está isento de mensalidades, pois outra empresa está responsável pelo seu pagamento ou possui um bônus concedido.
                    </p>
                    <p className="text-xs text-zinc-500 mt-6 italic">
                      Se precisar reativar a área financeira deste cliente, altere o "Trocar Vencimento" acima.
                    </p>
                  </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {getCicloFinanceiro(anoFinanceiro).map((mes) => {
                    const boletoInter = boletosDaAPI.find(b => b.mes_ref === mes.ref); 
                    const comprovanteEnviado = arquivos.find(a => a.setor === 'financeiro' && a.caminho_storage?.includes(`/financeiro/${mes.ref}_`));
                    const pagoManualmente = mensalidadesPagas.includes(mes.ref);

                    // 1. Lógica de Ciclos de Vencimento Dinâmicos
                    const diaVencimento = cliente?.dia_vencimento || 20;
                    let diaAbertura = 10;
                    if (diaVencimento === 26) diaAbertura = 15;
                    else if (diaVencimento === 30) diaAbertura = 20;
                    else if (diaVencimento === 10) diaAbertura = 1;

                    // 2. Lógica Mágica de Datas (Conectada ao Ano Selecionado)
                    const hoje = new Date();
                    const mesPagamentoIndex = parseInt(mes.id, 10) - 1; 
                    const dataLiberacao = new Date(anoFinanceiro, mesPagamentoIndex, diaAbertura);
                    dataLiberacao.setHours(0, 0, 0, 0);
                    
                    const estaLiberado = hoje >= dataLiberacao || !!boletoInter;
                    const mesAbertura = dataLiberacao.getMonth() + 1; 

                    // 3. Atualizando as lógicas de Status Definitivas (Baseado no Backend)
                    const isPagoAPI = boletoInter && (boletoInter.status === 'pago' || boletoInter.status === 'pago via pix');
                    // MÁGICA: A isenção retroativa dos primeiros meses só vale para o ano de fundação do portal (2026)
                    const isMesAntigoPago = anoFinanceiro === 2026 && ['01', '02', '03', '04'].includes(mes.id);
                    const isPago = isPagoAPI || comprovanteEnviado || pagoManualmente || isMesAntigoPago;
                    
                    const emAtraso = boletoInter && boletoInter.status === 'atrasado';
                    const estaExpirado = boletoInter && boletoInter.status === 'expirado';
                    const estaCancelado = boletoInter && boletoInter.status === 'cancelado';
                    const emAberto = boletoInter && boletoInter.status === 'pendente';

                    // Estilização inteligente do Card
                    let estiloCard = '';
                    if (isPago) {
                      estiloCard = 'bg-emerald-500/10 border-emerald-500/40';
                    } else if (estaCancelado) {
                      estiloCard = 'bg-zinc-900 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'; 
                    } else if (estaExpirado) {
                      estiloCard = 'bg-black border-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]';
                    } else if (emAtraso) {
                      estiloCard = 'bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
                    } else if (emAberto) {
                      estiloCard = 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]'; 
                    } else if (estaLiberado) {
                      estiloCard = 'bg-[#0d1b2a] border-zinc-700 shadow-[0_0_15px_rgba(212,175,55,0.05)]'; 
                    } else {
                      estiloCard = 'bg-[#0d1b2a]/30 border-zinc-800/30 opacity-50 grayscale pointer-events-none';
                    }

                    return (
                      <div key={mes.id} className={`p-4 rounded-xl border flex flex-col justify-between h-full min-h-[13rem] gap-2 transition-all relative ${estiloCard}`}>
                        
                        {/* Cabeçalho do Card */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <h4 className={`text-[11px] font-bold uppercase tracking-wide ${isPago ? 'text-emerald-400' : estaCancelado ? 'text-red-400/70' : estaExpirado ? 'text-zinc-400' : emAtraso ? 'text-red-400' : emAberto ? 'text-blue-400' : estaLiberado ? 'text-white' : 'text-zinc-500'}`}>Ref. Serviços de {mes.servico}</h4>
                            <p className={`text-[11px] font-medium mt-0.5 ${isPago ? 'text-emerald-500/80' : (estaExpirado || estaCancelado) ? 'text-zinc-500 font-bold' : emAtraso ? 'text-red-400/80 font-bold animate-pulse' : emAberto ? 'text-blue-400/80' : estaLiberado ? 'text-zinc-400' : 'text-zinc-600'}`}>
                              {boletoInter ? `Vence ${new Date(boletoInter.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}` : `Vencimento ${diaVencimento} de ${mes.pag}`}
                            </p>
                            
                            {isPago && (
                              <div className="mt-2">
                                <span className="bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                                  {boletoInter?.status === 'pago via pix' ? 'Pago via PIX' : 'Pago'}
                                </span>
                              </div>
                            )}
                            {estaExpirado && !isPago && (
                              <div className="mt-2">
                                <span className="bg-zinc-800 text-white border border-zinc-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">Expirado</span>
                              </div>
                            )}
                            {estaCancelado && !isPago && (
                              <div className="mt-2">
                                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">Cancelado</span>
                              </div>
                            )}
                            {emAtraso && !isPago && !estaExpirado && !estaCancelado && (
                              <div className="mt-2">
                                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm animate-pulse">Atrasado</span>
                              </div>
                            )}
                            {emAberto && !isPago && !emAtraso && !estaExpirado && !estaCancelado && (
                              <div className="mt-2">
                                <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">Em Aberto</span>
                              </div>
                            )}
                          </div>

                          {(estaLiberado || isPago) && (
                            <div className="pointer-events-auto flex-shrink-0 z-10 pt-0.5">
                              <label className={`flex items-center gap-2 ${(comprovanteEnviado || boletoInter) ? 'cursor-default' : 'cursor-pointer'} group`} title={comprovanteEnviado ? "Pago via comprovante" : boletoInter ? "Gerenciado automaticamente pelo Inter" : "Marcar como pago manualmente"}>
                                <span className={`text-[10px] font-bold text-white transition-all opacity-0 group-hover:opacity-100 ${isPago ? 'group-hover:text-emerald-400' : 'group-hover:text-[#d4af37]'}`}>Pago</span>
                                <input 
                                  type="checkbox" 
                                  checked={isPago} 
                                  disabled={!!comprovanteEnviado || !!boletoInter} 
                                  onChange={() => togglePagoManual(mes.ref, isPago)} 
                                  className="w-5 h-5 cursor-pointer transition-colors"
                                  style={{ accentColor: isPago ? '#10b981' : '#d4af37' }} 
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          {/* SE EXISTIR BOLETO DA API DO INTER: EXIBE ROTA AUTOMÁTICA */}
                          {boletoInter ? (
                            <div className="flex flex-col gap-1.5 pointer-events-auto mt-1">
                              {!isPagoAPI ? (
                                <>
                                  {(estaExpirado || estaCancelado) ? (
                                    <button type="button" onClick={() => { setNovoPedido(`Gostaria de solicitar a 2ª via do boleto de ${mes.ref}, pois o anterior foi ${estaCancelado ? 'cancelado' : 'expirado'}.`); setDepartamentoPedido('Financeiro'); setAbaPrincipal('solicitacoes'); rolarPara('nova-solicitacao-form'); mostrarToast('Ticket preenchido!', 'aviso'); }} className="block w-full text-center text-[10px] border border-zinc-700 text-white bg-zinc-800 hover:bg-zinc-700 py-2 rounded font-bold transition shadow-sm uppercase">
                                      Abrir Ticket p/ 2ª Via
                                    </button>
                                  ) : (
                                    <>
                                      <a href={boletoInter.url_pdf} target="_blank" rel="noopener noreferrer" className={`block w-full text-center text-[11px] text-white py-1.5 rounded font-bold transition shadow-md ${emAtraso ? 'bg-red-500 hover:bg-red-400' : 'bg-blue-500 hover:bg-blue-400'}`}>Ver / Baixar Boleto</a>
                                      <button type="button" onClick={() => { if (boletoInter.linha_digitavel) { navigator.clipboard.writeText(boletoInter.linha_digitavel); mostrarToast('Código copiado!', 'sucesso'); } }} className="block w-full text-center text-[10px] border border-zinc-600 text-zinc-300 py-1 rounded font-medium hover:bg-zinc-800 hover:text-white transition">Copiar Código</button>
                                    </>
                                  )}
                                  
                                  {isInterno && !estaExpirado && (
                                    <button type="button" onClick={() => handleBaixaManualBoleto(boletoInter)} className="block w-full text-center text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 py-1.5 rounded font-bold hover:bg-emerald-500 hover:text-black transition mt-1">
                                      Dar Baixa Manual (PIX)
                                    </button>
                                  )}
                                </>
                              ) : (
                                <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded text-center border border-emerald-500/20">
                                  {boletoInter.status === 'pago via pix' ? 'Baixa Manual Realizada ✓' : 'Compensado via API Inter ✓'}
                                </div>
                              )}
                            </div>
                          ) : comprovanteEnviado ? (
                            /* CASO CONTRÁRIO: MANTÉM O SEU LINDO SVALUAGUARDA MANUAL ANTIGO */
                            <div className="flex flex-col gap-2 mt-1">
                              <div className="flex gap-1.5">
                                <button onClick={() => visualizarDocumento(comprovanteEnviado.caminho_storage)} className="flex-1 text-[11px] border border-emerald-500/50 text-emerald-400 py-1.5 rounded font-bold shadow-sm hover:bg-emerald-500 hover:text-black transition pointer-events-auto">Visualizar</button>
                                {isInterno && (
                                  <>
                                    <button onClick={() => baixarDocumento(comprovanteEnviado.caminho_storage, comprovanteEnviado.nome_original)} className="px-3 text-[11px] border border-[#d4af37]/50 text-[#d4af37] py-1.5 rounded font-bold shadow-sm hover:bg-[#d4af37] hover:text-[#0d1b2a] transition pointer-events-auto" title="Baixar Original">Baixar</button>
                                    <button onClick={() => handleMoverParaLixeira(comprovanteEnviado, 'portal')} className="px-2 bg-red-500/10 text-red-500 rounded border border-red-500/20 hover:bg-red-500 hover:text-white transition pointer-events-auto" title="Excluir"><IconTrashTab /></button>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : estaLiberado ? (
                            <div className="flex flex-col gap-1.5 pointer-events-auto mt-1">
                              
                              {/* 🚨 AVISO DE SEGURANÇA (VISÃO ADMIN VS CLIENTE) */}
                              {!isPago && (
                                <>
                                  {isInterno ? (
                                    <div className="bg-red-500/10 border border-red-500/30 p-1.5 rounded text-center"><p className="text-[9px] font-bold text-red-400 uppercase">⚠ Boleto API Não Encontrado</p></div>
                                  ) : (
                                    <div className="bg-orange-500/10 border border-orange-500/30 p-1.5 rounded text-center"><p className="text-[10px] font-bold text-orange-400">Boleto indisponível</p></div>
                                  )}
                                  {!isInterno && (
                                    <button onClick={() => { setNovoPedido(`Não estou localizando o boleto de ${mes.ref}. Podem verificar?`); setDepartamentoPedido('Financeiro'); setAbaPrincipal('solicitacoes'); rolarPara('nova-solicitacao-form'); mostrarToast('Ticket preenchido!', 'aviso'); }} className="block w-full text-center text-[10px] border border-orange-500/50 text-orange-400 bg-orange-500/10 py-1.5 rounded font-bold hover:bg-orange-500 hover:text-white transition">Abrir Ticket p/ Financeiro</button>
                                  )}
                                </>
                              )}

                              <label className="block text-center text-[10px] border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] py-1.5 rounded font-bold transition cursor-pointer shadow-sm mt-1">
                                {subindoArquivo ? 'Aguarde...' : '+ Anexar Comprovante'}
                                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => handleUploadFinanceiro(e, mes.ref)} disabled={subindoArquivo} />
                              </label>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 mt-1">
                              <span className="block text-center text-[10px] text-zinc-600 py-2 border border-zinc-800/30 rounded font-bold">Abre dia {String(diaAbertura).padStart(2, '0')}/{String(mesAbertura).padStart(2, '0')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            ) : pastaAtiva && (
              <div className="bg-[#1b263b] p-5 sm:p-8 rounded-xl border border-zinc-800 shadow-xl mb-10">
                
                {/* NOVO: DISCLAIMER DA PASTA */}
                <div className="bg-[#0d1b2a]/50 p-4 rounded-lg border border-zinc-800/60 mb-6 flex justify-between items-start gap-4">
                   <div>
                     <h4 className="text-sm font-bold text-[#d4af37] uppercase tracking-wider mb-1">Sobre esta pasta</h4>
                     <p className="text-sm text-zinc-300 leading-relaxed">
                       {textosPastas[pastaAtiva] 
                          ? (cliente?.clientes_van ? textosPastas[pastaAtiva].van : textosPastas[pastaAtiva].padrao) 
                          : 'Documentos importantes desta categoria.'}
                     </p>
                   </div>
                   {isInterno && (
                     <button onClick={() => setModalTextoPasta({ 
                       aberto: true, 
                       setor: pastaAtiva, 
                       textoPadrao: textosPastas[pastaAtiva]?.padrao || '',
                       textoVan: textosPastas[pastaAtiva]?.van || ''
                     })} className="flex-shrink-0 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded border border-zinc-700 transition font-bold shadow-sm">
                       Editar Textos
                     </button>
                   )}
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-zinc-800 pb-4 mb-6 gap-4">
                  {/* BREADCRUMBS INTELIGENTES TIPO GOOGLE DRIVE */}
                  <h3 className="text-lg sm:text-xl font-bold text-[#d4af37] capitalize flex items-center gap-1.5 sm:gap-2 flex-wrap w-full lg:w-auto leading-relaxed">
                    <span className={`transition ${subpastaAtiva ? 'cursor-pointer hover:underline text-zinc-400 hover:text-white' : 'text-[#d4af37]'}`} onClick={() => setSubpastaAtiva(null)}>
                      Setor {pastaAtiva === 'contabil' ? (cliente?.clientes_van ? 'Contábil' : 'Empresa') : pastaAtiva}
                    </span>
                    {caminhoPastas.map((p, index) => (
                      <span key={p.id} className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                        <span className="text-zinc-600">/</span>
                        <span 
                          className={`transition flex items-center gap-1 ${index === caminhoPastas.length - 1 ? 'text-[#d4af37]' : 'cursor-pointer hover:underline text-zinc-400 hover:text-white'}`}
                          onClick={() => setSubpastaAtiva(p.id)}
                        >
                          {index === caminhoPastas.length - 1 && <span className="hidden sm:inline"><IconFolderSolid /></span>} {p.nome}
                        </span>
                      </span>
                    ))}
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row w-full lg:w-auto items-stretch sm:items-center gap-3">
                    <div className="relative w-full sm:w-64 flex-shrink-0">
                      <input type="text" placeholder="Procurar documento..." value={busca} onChange={(e) => { setBusca(e.target.value); setMostrarAutocomplete(true); }} onFocus={() => setMostrarAutocomplete(true)} onBlur={() => setTimeout(() => setMostrarAutocomplete(false), 200)} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-2.5 sm:py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                      {mostrarAutocomplete && busca.length > 0 && arquivosFiltradosDaBusca.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d1b2a] border border-zinc-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                          {arquivosFiltradosDaBusca.map((arq) => (
                            <div key={`auto-${arq.id}`} onMouseDown={(e) => { e.preventDefault(); setBusca(arq.nome_original); setMostrarAutocomplete(false); }} className="px-4 py-3 sm:py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer truncate border-b border-zinc-800/50 last:border-0 transition flex items-center">
                              <IconSearch /> {arq.nome_original}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {isInterno && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        {operador === 'Lucas (Financeiro)' && pastasAtuais.length > 0 && (
                          <button onClick={() => { setModoSelecaoPastas(!modoSelecaoPastas); setPastasSelecionadas([]); }} className="flex-1 sm:flex-none bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 sm:px-4 py-2.5 rounded-lg font-bold hover:bg-blue-500 hover:text-white transition shadow-sm text-xs sm:text-sm whitespace-nowrap text-center">
                            {modoSelecaoPastas ? 'Cancelar Seleção' : 'Selecionar Pastas'}
                          </button>
                        )}
                        <button onClick={() => operador === 'Lucas (Financeiro)' ? setModalMultiPastas({ aberto: true, nomes: [''] }) : handleCriarPasta()} className="flex-1 sm:flex-none bg-zinc-800 text-zinc-300 px-3 sm:px-4 py-2.5 rounded-lg font-bold border border-zinc-700 hover:bg-zinc-700 hover:text-white transition shadow-lg text-xs sm:text-sm whitespace-nowrap text-center">
                          + Pasta{operador === 'Lucas (Financeiro)' ? 's' : ''}
                        </button>
                        <label className="flex-1 sm:flex-none bg-[#d4af37] text-[#0d1b2a] px-3 sm:px-4 py-2.5 rounded-lg font-bold hover:bg-yellow-500 transition shadow-lg cursor-pointer text-xs sm:text-sm text-center whitespace-nowrap">
                          {subindoArquivo ? 'A Enviar...' : 'Enviar Arquivos'}
                          <input type="file" multiple accept="application/pdf,image/*" className="hidden" onChange={handleUpload} disabled={subindoArquivo} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* EXIBIÇÃO DE LOADING E DADOS */}
                {carregandoConteudo ? (
                  <div className="flex flex-col items-center justify-center py-12 opacity-80">
                    <div className="w-10 h-10 border-4 border-zinc-700 border-t-[#d4af37] rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]"></div>
                    <p className="text-sm text-[#d4af37] font-bold tracking-widest uppercase animate-pulse">Buscando documentos...</p>
                  </div>
                ) : (
                  <>
                    {/* BARRA DE AÇÃO PARA PASTAS (MULTI-SELEÇÃO) */}
                    {modoSelecaoPastas && pastasSelecionadas.length > 0 && (
                      <div className="flex justify-between items-center bg-red-500/10 border border-red-500/30 p-3 rounded-lg mb-4 animate-in fade-in">
                        <span className="text-xs font-bold text-red-400">{pastasSelecionadas.length} pasta(s) selecionada(s)</span>
                        <button onClick={handleExcluirPastasEmLote} className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition">Excluir Selecionadas</button>
                      </div>
                    )}

                    {/* EXIBIÇÃO DE SUBPASTAS DINÂMICAS (ESTILO GOOGLE DRIVE) */}
                    {pastasAtuais.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                        {pastasAtuais.map(pasta => {
                          // 🟢 Usa a nova função recursiva para a bolinha verde "subir" até a raiz!
                          const temNovo = !isInterno && pastaTemNaoLidos(pasta.id);
                          return (
                            <div key={pasta.id} className={`bg-[#1b263b]/50 border rounded-xl flex items-center justify-between group cursor-pointer hover:bg-zinc-800/80 transition-all shadow-sm ${pastasSelecionadas.includes(pasta.id) ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-zinc-700/60 hover:border-[#d4af37]'}`}>
                              <div className="flex items-center gap-3 p-3.5 flex-1 relative min-w-0" onClick={() => modoSelecaoPastas ? setPastasSelecionadas(prev => prev.includes(pasta.id) ? prev.filter(p => p !== pasta.id) : [...prev, pasta.id]) : setSubpastaAtiva(pasta.id)}>
                                {modoSelecaoPastas ? (
                                  <input type="checkbox" checked={pastasSelecionadas.includes(pasta.id)} onChange={() => setPastasSelecionadas(prev => prev.includes(pasta.id) ? prev.filter(p => p !== pasta.id) : [...prev, pasta.id])} onClick={e => e.stopPropagation()} className="accent-[#d4af37] w-4 h-4 cursor-pointer flex-shrink-0" />
                                ) : (
                                  <div className="flex-shrink-0 text-zinc-400 group-hover:text-[#d4af37] transition-colors">
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                                  </div>
                                )}
                                <span className="font-semibold text-sm text-zinc-300 group-hover:text-[#d4af37] truncate pr-2 transition-colors">{pasta.nome}</span>
                                {temNovo && <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse flex-shrink-0 ml-auto mr-1"></span>}
                              </div>
                              {isInterno && (
                                <div className="flex-shrink-0 pr-2">
                                  {/* 3 Pontinhos da Pasta */}
                                  <div className="relative" onClick={(e) => e.stopPropagation()} onMouseLeave={() => setMenuAberto(null)}>
                                    <button onClick={(e) => { e.stopPropagation(); setMenuAberto(menuAberto === `pasta-${pasta.id}` ? null : `pasta-${pasta.id}`); }} className="p-1.5 text-zinc-500 hover:text-[#d4af37] hover:bg-zinc-700 rounded-lg transition-colors">
                                      <IconDots />
                                    </button>
                                    {menuAberto === `pasta-${pasta.id}` && (
                                      <div className="absolute right-0 top-full pt-1 w-36 z-[999]">
                                        <div className="bg-[#1b263b] border border-[#d4af37]/30 rounded-lg shadow-2xl py-1 flex flex-col overflow-hidden">
                                          <button onClick={(e) => { e.stopPropagation(); setMenuAberto(null); handleRenomearPasta(pasta); }} className="px-4 py-2.5 text-left text-xs font-bold text-zinc-300 hover:bg-[#d4af37] hover:text-[#0d1b2a] transition flex items-center">
                                            <svg className="w-3.5 h-3.5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Renomear
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); setMenuAberto(null); handleDeletarPasta(pasta); }} className="px-4 py-2.5 text-left text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition flex items-center">
                                            <IconTrashTab /> Excluir
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* EXIBIÇÃO DE ARQUIVOS */}
                    {arquivosFiltradosDaBusca.length === 0 ? (
                      <p className="text-zinc-400 text-center py-8">Nenhum documento nesta área ainda.</p>
                    ) : (
                      <>
                        {/* BARRA DE AÇÕES EM LOTE (ESTILO GOOGLE DRIVE) */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#1b263b] border border-[#d4af37]/30 p-3 rounded-lg mb-4 gap-3">
                          {!modoSelecao ? (
                            <div className="w-full flex justify-between items-center">
                              <span className="text-sm font-bold text-zinc-300">Arquivos ({arquivosFiltradosDaBusca.length})</span>
                              <button onClick={() => setModoSelecao(true)} className="text-xs bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 font-bold px-4 py-2 rounded-lg hover:bg-[#d4af37] hover:text-[#0d1b2a] transition shadow-sm">
                                Modo de Seleção
                              </button>
                            </div>
                          ) : (
                            <>
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300 hover:text-white transition w-full sm:w-auto">
                                <input type="checkbox" className="accent-[#d4af37] w-4 h-4 cursor-pointer" checked={selecionados.length === arquivosFiltradosDaBusca.length && arquivosFiltradosDaBusca.length > 0} onChange={toggleSelecionarTodos} />
                                Selecionar Todos
                              </label>
                              
                              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
                                {selecionados.length > 0 && (
                                  <>
                                    <span className="text-xs font-bold text-[#d4af37] mr-2 w-full sm:w-auto">{selecionados.length} selecionado(s)</span>
                                    {isInterno && (
                                      <>
                                        <button onClick={() => setArquivosMovendo(arquivosFiltradosDaBusca.filter(a => selecionados.includes(a.id)))} className="flex-1 sm:flex-none text-[10px] bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/30 px-3 py-2 rounded text-blue-400 font-bold transition text-center">Mover</button>
                                        <button onClick={handleExcluirSelecionados} className="flex-1 sm:flex-none text-[10px] bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-2 rounded text-red-400 font-bold transition text-center">Excluir</button>
                                      </>
                                    )}
                                    <button onClick={handleBaixarSelecionados} className="flex-1 sm:flex-none text-[10px] bg-[#d4af37] text-black px-3 py-2 rounded font-bold hover:bg-yellow-500 transition shadow-sm text-center">Baixar</button>
                                  </>
                                )}
                                <button onClick={() => { setModoSelecao(false); setSelecionados([]); }} className="text-xs text-zinc-400 hover:text-white font-bold px-3 py-2 underline transition">Cancelar</button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* LISTAGEM DE ARQUIVOS (LAYOUT PRO DRIVE) */}
                        <div className="grid grid-cols-1 gap-2">
                          {arquivosFiltradosDaBusca.map((arq) => (
                            <div key={arq.id} className={`p-3 rounded-lg border flex items-center justify-between gap-4 w-full transition-all group hover:bg-zinc-800/40 ${selecionados.includes(arq.id) ? 'bg-[#d4af37]/10 border-[#d4af37]/50' : 'bg-[#0d1b2a] border-zinc-800/50'}`}>
                              
                              {/* Clica na linha toda: Se o modo seleção tiver ativo ele checa a caixa, se não ele Visualiza direto! */}
                              <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => modoSelecao ? toggleSelecao(arq.id) : visualizarDocumento(arq.caminho_storage)}>
                                {modoSelecao && (
                                  <input type="checkbox" className="accent-[#d4af37] w-4 h-4 cursor-pointer flex-shrink-0" checked={selecionados.includes(arq.id)} onChange={() => toggleSelecao(arq.id)} onClick={e => e.stopPropagation()} />
                                )}
                                <div className="flex-shrink-0 text-zinc-400 group-hover:text-[#d4af37] transition-colors"><IconFile /></div>
                                <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                                  <p className="text-sm text-zinc-200 font-medium truncate group-hover:text-white transition-colors">{arq.nome_original}</p>
                                  <p className="text-[11px] text-zinc-500 hidden sm:block truncate">Enviado por: <span className="text-zinc-400 font-semibold">{arq.enviado_por}</span> em {new Date(arq.criado_em).toLocaleDateString('pt-BR')}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 relative">
                                {!modoSelecao && (
                                  <>
                                    <button onClick={() => visualizarDocumento(arq.caminho_storage)} className="hidden sm:flex text-xs border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] px-4 py-1.5 rounded-lg font-bold transition-all shadow-sm">
                                      Visualizar
                                    </button>
                                    
                                    {/* MENU 3 PONTINHOS MAGICO (SVGs VETORIZADOS) */}
                                    <div className="relative" onMouseLeave={() => setMenuAberto(null)}>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setMenuAberto(menuAberto === arq.id ? null : arq.id); }} 
                                        className="p-1.5 text-zinc-400 hover:text-[#d4af37] hover:bg-zinc-700 rounded-lg transition"
                                      >
                                        <IconDots />
                                      </button>

                                      {menuAberto === arq.id && (
                                        <div className="absolute right-0 top-full pt-1 w-48 z-[999]">
                                          <div className="bg-[#1b263b] border border-[#d4af37]/30 rounded-lg shadow-2xl py-1 flex flex-col overflow-hidden">
                                            <button onClick={() => { setMenuAberto(null); visualizarDocumento(arq.caminho_storage); }} className="px-4 py-2.5 text-left text-xs font-bold text-zinc-300 hover:bg-[#d4af37] hover:text-[#0d1b2a] transition flex items-center sm:hidden">
                                              <IconEye /> Visualizar
                                            </button>
                                            <button onClick={() => { setMenuAberto(null); baixarDocumento(arq.caminho_storage, arq.nome_original); }} className="px-4 py-2.5 text-left text-xs font-bold text-zinc-300 hover:bg-[#d4af37] hover:text-[#0d1b2a] transition flex items-center">
                                              <svg className="w-3.5 h-3.5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Fazer Download
                                            </button>
                                            
                                            {!isInterno && (
                                              <button onClick={(e) => { e.stopPropagation(); setMenuAberto(null); setModalDuvidaArquivo({ aberto: true, arquivo: arq, texto: '' }); }} className="px-4 py-2.5 text-left text-xs font-bold text-[#d4af37] hover:bg-zinc-700 transition flex items-center">
                                                <IconChatList /> Solicitar Suporte
                                              </button>
                                            )}

                                            {isInterno && (
                                              <>
                                                <button onClick={(e) => { e.stopPropagation(); setMenuAberto(null); setModalEmailDoc({ aberto: true, arquivo: arq, titulo: 'Novo Documento Disponível', mensagem: '' }); }} className="px-4 py-2.5 text-left text-xs font-bold text-blue-400 hover:bg-zinc-700 transition flex items-center">
                                                  <svg className="w-3.5 h-3.5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Enviar E-mail
                                                </button>
                                                <button onClick={() => { setMenuAberto(null); setArquivosMovendo([arq]); }} className="px-4 py-2.5 text-left text-xs font-bold text-indigo-400 hover:bg-zinc-700 transition flex items-center">
                                                  <svg className="w-3.5 h-3.5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> Mover Arquivo
                                                </button>
                                                <button onClick={() => { setMenuAberto(null); handleRenomear(arq); }} className="px-4 py-2.5 text-left text-xs font-bold text-zinc-300 hover:bg-[#d4af37] hover:text-[#0d1b2a] transition flex items-center">
                                                  <svg className="w-3.5 h-3.5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Renomear
                                                </button>
                                                <div className="border-t border-zinc-700/50 my-1"></div>
                                                <button onClick={() => { setMenuAberto(null); handleMoverParaLixeira(arq, 'portal'); }} className="px-4 py-2.5 text-left text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition flex items-center">
                                                  <IconTrashTab /> Excluir
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ==========================================
            ABA 2: ENVIO DE DOCUMENTOS DO CLIENTE
        ========================================== */}
        {abaPrincipal === 'envios' && (
          <div className="bg-[#1b263b] p-8 rounded-xl border border-zinc-800 shadow-xl mb-10">
            {!isInterno && (
              <div className="mb-10 border-b border-zinc-800 pb-8">
                <header className="mb-6">
                  <h3 className="text-xl font-bold text-[#d4af37]">Enviar Documentos para a Contabilidade</h3>
                  <p className="text-xs text-zinc-400 mt-1">Insira a descrição e anexe os arquivos (PDF ou Imagem).</p>
                </header>
                <form onSubmit={handleEnviarParaContabilidade} className="space-y-4">
                  {enviosPre.map((item) => (
                    <div key={item.id} className="p-4 bg-[#0d1b2a] rounded-lg border border-zinc-800/60 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                      <div className="lg:col-span-5">
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Qual é o assunto/documento?</label>
                        <input type="text" required placeholder="Ex: Extrato Bancário..." value={item.descricao} onChange={(e) => alterarDescricao(item.id, e.target.value)} className="w-full bg-[#1b263b] border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                      </div>
                      <div className="lg:col-span-3">
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Para qual setor?</label>
                        <select value={item.departamento} onChange={(e) => alterarDepartamentoEnvio(item.id, e.target.value)} className="w-full bg-[#1b263b] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]">
                          <option value="Contábil">{cliente?.clientes_van ? 'Contábil' : 'Documentos'}</option>
                          <option value="Fiscal">Fiscal</option>
                          <option value="DP / RH">DP / RH</option>
                          <option value="Financeiro">Financeiro</option>
                          <option value="Societário">Societário</option>
                          <option value="Legalização">Legalização</option>
                          <option value="Outros">Outros / Suporte</option>
                        </select>
                      </div>
                      <div className="lg:col-span-3">
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Escolher Arquivo</label>
                        <input type="file" required accept="application/pdf,image/*" onChange={(e) => alterarArquivo(item.id, e.target.files[0])} className="text-xs text-zinc-400 bg-[#1b263b] border border-zinc-800 rounded-lg p-2 w-full cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200" />
                      </div>
                      {enviosPre.length > 1 && (
                        <div className="lg:col-span-1 flex justify-end">
                          <button type="button" onClick={() => removerLineEnvio(item.id)} className="w-full lg:w-auto text-xs text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white px-3 py-2.5 rounded-lg border border-red-500/20 transition">Remover</button>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="pt-2 flex flex-col sm:flex-row sm:justify-between gap-3">
                    <button type="button" onClick={adicionarMaisUm} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-5 py-2.5 rounded-lg text-sm transition">Anexar + 1 Documento</button>
                    <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] font-extrabold px-6 py-2.5 rounded-lg text-sm hover:bg-yellow-500 transition shadow-lg disabled:opacity-50">
                      {subindoArquivo ? 'A enviar arquivos...' : 'Enviar Tudo'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg font-bold text-white">Histórico de Envios</h3>
                <div className="relative w-full sm:w-64">
                  <input type="text" placeholder="Procurar envio..." value={busca} onChange={(e) => { setBusca(e.target.value); setMostrarAutocomplete(true); }} onFocus={() => setMostrarAutocomplete(true)} onBlur={() => setTimeout(() => setMostrarAutocomplete(false), 200)} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                  {mostrarAutocomplete && busca.length > 0 && arquivosFiltradosDaBusca.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d1b2a] border border-zinc-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                      {arquivosFiltradosDaBusca.map((arq) => (
                        <div key={`auto-envio-${arq.id}`} onMouseDown={(e) => { e.preventDefault(); setBusca(arq.nome_documento); setMostrarAutocomplete(false); }} className="px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer truncate border-b border-zinc-800/50 last:border-0 transition flex items-center">
                          <IconSearch /> {arq.nome_documento}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {arquivos.length === 0 ? (
                <p className="text-zinc-500 text-sm">Nenhum documento foi enviado pelo cliente ainda.</p>
              ) : arquivosFiltradosDaBusca.length === 0 ? (
                <p className="text-zinc-500 text-sm">Nenhum envio encontrado com "{busca}".</p>
              ) : (
                <div className="space-y-3">
                  {arquivosFiltradosDaBusca.map((arq) => (
                    <div key={arq.id} className="p-4 bg-[#0d1b2a] rounded-lg border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <IconFile />
                        <div className="min-w-0 w-full">
                          <p className="text-sm text-zinc-200 font-medium truncate max-w-md">{arq.nome_documento}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">Arquivo: <span className="text-zinc-400 font-mono break-all">{arq.nome_original}</span> | Colocado em {new Date(arq.criado_em).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
                        <span className={`flex items-center gap-1 text-[10px] font-extrabold px-3 py-1.5 rounded border whitespace-nowrap transition-all ${arq.status === 'pendente' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'}`}>
                          {arq.status === 'pendente' ? <><IconMiniClock /> Pendente (Em Análise)</> : <><IconCheck /> Recebido e Verificado</>}
                        </span>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {isInterno && (
                            <button onClick={() => handleMoverParaLixeira(arq, 'envios')} className="flex-1 sm:flex-none text-xs bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-2.5 rounded-lg text-red-400 font-medium transition">Excluir</button>
                          )}
                          <button onClick={() => visualizarDocumento(arq.caminho_storage)} className="flex-1 sm:flex-none text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 px-4 py-2.5 rounded-lg text-white font-bold transition-all shadow-sm">Visualizar</button>
                          <button onClick={() => baixarDocumento(arq.caminho_storage, arq.nome_original)} className="flex-1 sm:flex-none text-xs border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] px-4 py-2.5 rounded-lg font-bold transition-all shadow-sm">Baixar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            ABA: LIXEIRA (APENAS INTERNO)
        ========================================== */}
        {abaPrincipal === 'lixeira' && isInterno && (
          <div className="bg-[#1b263b] p-8 rounded-xl border border-red-500/30 shadow-xl mb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-red-500/20 pb-4 mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold text-red-400 capitalize flex items-center gap-2"><IconTrashTab /> Lixeira do Cliente</h3>
                <p className="text-xs text-zinc-400 mt-1">Arquivos excluídos são mantidos aqui por 30 dias para segurança.</p>
              </div>
              
              {itensLixeira.length > 0 && (
                <button onClick={handleEsvaziarLixeira} disabled={subindoArquivo} className="bg-red-500 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-600 transition shadow-lg text-sm whitespace-nowrap">
                  {subindoArquivo ? 'A processar...' : 'Esvaziar Lixeira Agora'}
                </button>
              )}
            </div>

            {itensLixeira.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">A lixeira está vazia.</p>
            ) : (
              <div className="space-y-3">
                {itensLixeira.map((arq) => {
                  const diasRestantes = calcularDiasLixeira(arq.data_exclusao);
                  return (
                    <div key={`${arq.origem}-${arq.id}`} className="p-4 bg-[#0d1b2a] rounded-lg border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0 opacity-80 hover:opacity-100 transition">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="min-w-0 w-full">
                          <p className="text-sm text-zinc-300 font-medium truncate max-w-md line-through">{arq.nome_original}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">Excluído em {new Date(arq.data_exclusao).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                        <span className={`text-[10px] font-extrabold px-2 py-1 rounded border whitespace-nowrap ${diasRestantes <= 5 ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-orange-400 border-orange-500/30 bg-orange-500/10'}`}>
                          {diasRestantes} dias restantes
                        </span>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button onClick={() => handleRestaurarDaLixeira(arq)} className="flex-1 sm:flex-none text-xs bg-emerald-500/10 hover:bg-emerald-500 hover:text-[#0d1b2a] border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-1">
                            <IconRestore /> Restaurar
                          </button>
                          <button onClick={() => handleDeletarPermanente(arq)} className="flex-1 sm:flex-none text-xs bg-red-500 text-white hover:bg-red-600 px-4 py-2.5 rounded-lg font-bold transition">
                            Apagar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            ABA 3: SOLICITAÇÕES DO CLIENTE
        ========================================== */}
        {abaPrincipal === 'solicitacoes' && (
          <div className="bg-[#1b263b] p-8 rounded-xl border border-zinc-800 shadow-xl mb-10">
            <div className="border-b border-zinc-800 pb-4 mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-[#d4af37] capitalize">Central de Atendimento e Solicitações</h3>
              <p className="text-xs text-zinc-400 mt-1">Envie pedidos ou recados diretos para a nossa equipa.</p>
            </div>
            
            <div id="nova-solicitacao-form"></div>
            
            {!isInterno && (
              <form onSubmit={handleEnviarPedido} className="mb-10 bg-[#0d1b2a] p-6 rounded-xl border border-zinc-800/60 space-y-5 shadow-lg">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">O que precisa hoje?</label>
                  <textarea required rows="3" placeholder="Ex: Gostaria da minha guia DAS do mês de Janeiro..." value={novoPedido} onChange={(e) => setNovoPedido(e.target.value)} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none transition-colors"></textarea>
                </div>
                <div className="w-full md:w-1/2 lg:w-1/3">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Para qual departamento?</label>
                  <select value={departamentoPedido} onChange={(e) => setDepartamentoPedido(e.target.value)} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] cursor-pointer transition-colors">
                    <option value="Contábil">{cliente?.clientes_van ? 'Contábil' : 'Documentos'}</option>
                    <option value="Fiscal">Fiscal</option>
                    <option value="DP / RH">DP / RH</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Societário">Societário</option>
                    <option value="Legalização">Legalização</option>
                    <option value="Outros">Outros / Dúvida Geral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Anexar Documento (Opcional)</label>
                  <input type="file" accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={(e) => setArquivoPedido(e.target.files[0])} className="text-xs text-zinc-400 bg-[#1b263b] border border-zinc-700 rounded-lg p-2 w-full cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#d4af37]/10 file:text-[#d4af37] hover:file:bg-[#d4af37]/20" />
                </div>
                <div className="flex justify-end border-t border-zinc-800/60 pt-5 mt-2">
                  <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] font-extrabold px-8 py-3 rounded-lg text-sm hover:bg-yellow-500 transition shadow-[0_0_15px_rgba(212,175,55,0.2)] disabled:opacity-50 w-full sm:w-auto">
                    {subindoArquivo ? 'A Enviar...' : 'Enviar Solicitação para Equipa'}
                  </button>
                </div>
              </form>
            )}
            
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-2 mb-4 gap-4">
                <h4 className="text-sm font-bold text-white">Histórico de Tickets</h4>
                <div className="flex bg-[#0d1b2a] p-1 rounded-lg border border-zinc-800 w-full sm:w-auto">
                  <button onClick={() => setSubAbaSolicitacao('ativas')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${subAbaSolicitacao === 'ativas' ? 'bg-[#d4af37] text-[#0d1b2a] shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Ativas Recentes</button>
                  <button onClick={() => setSubAbaSolicitacao('antigas')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${subAbaSolicitacao === 'antigas' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Arquivo (Antigas)</button>
                </div>
              </div>

              {(() => {
                const hojeApp = new Date();
                const pedidosAtivos = pedidos.filter(p => {
                  if (p.status === 'pendente') return true;
                  if (!p.data_resolucao) return true;
                  const diffDias = (hojeApp - new Date(p.data_resolucao)) / (1000 * 60 * 60 * 24);
                  return diffDias <= 2;
                });
                
                const pedidosAntigos = pedidos.filter(p => {
                  if (p.status === 'pendente') return false;
                  if (!p.data_resolucao) return false;
                  const diffDias = (hojeApp - new Date(p.data_resolucao)) / (1000 * 60 * 60 * 24);
                  return diffDias > 2;
                });

                const listaExibicao = subAbaSolicitacao === 'ativas' ? pedidosAtivos : pedidosAntigos;

                if (listaExibicao.length === 0) {
                  return <p className="text-zinc-500 text-sm p-4 bg-[#0d1b2a] rounded-lg">Nenhum ticket encontrado nesta categoria.</p>;
                }

                return listaExibicao.map(pedido => (
                  <div key={pedido.id} className={`p-5 rounded-xl border flex flex-col gap-4 transition-all duration-300 ${pedido.status === 'pendente' ? 'bg-[#0d1b2a] border-zinc-700/50' : (pedido.visualizado_em && !isInterno ? 'bg-[#0d1b2a]/40 border-emerald-500/10 opacity-60 grayscale-[30%] hover:opacity-100 hover:grayscale-0' : 'bg-[#0d1b2a]/90 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]')}`}>
                    
                    {/* PARTE DO CLIENTE */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-[10px] font-black bg-[#d4af37] text-[#0d1b2a] px-2 py-0.5 rounded tracking-wider flex items-center shadow-sm">
                            #{String(pedido.numero_ticket || 0).padStart(5, '0')}
                          </span>
                          <span className="text-[10px] font-bold bg-[#1b263b] text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                            <IconChatList /> {pedido.departamento || 'Geral'}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-medium">Enviado em {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-sm text-zinc-200 font-medium leading-relaxed">"{pedido.descricao}"</p>
                        {pedido.caminho_arquivo && (
                          <div className="mt-3 flex items-center gap-2 border border-zinc-700/50 bg-[#0d1b2a] w-max px-3 py-1.5 rounded-lg">
                            <IconClip /> <span className="text-[11px] text-zinc-400 max-w-[150px] truncate">{pedido.nome_arquivo}</span>
                            <button onClick={(e) => { e.preventDefault(); baixarDocumento(pedido.caminho_arquivo, pedido.nome_arquivo); }} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-1 rounded transition ml-2">Baixar</button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                        <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-md border uppercase whitespace-nowrap shadow-sm ${pedido.status === 'pendente' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                          {pedido.status === 'pendente' ? <><IconMiniClock /> Aguardando Retorno</> : <><IconCheck /> Resolvido</>}
                        </span>
                        {/* Botão mágico para o Admin responder direto do perfil do cliente */}
                        {isInterno && pedido.status === 'pendente' && (
                          <button onClick={() => setModalRespostaPedido({ aberto: true, pedido, texto: '', arquivo: null })} className="bg-[#d4af37] text-[#0d1b2a] font-extrabold px-3 py-1.5 rounded text-[10px] hover:bg-yellow-500 transition shadow-sm uppercase mt-1">
                            Responder Chamado
                          </button>
                        )}
                      </div>
                    </div>

                    {/* RESPOSTA DA CONTABILIDADE (Se Atendido) */}
                    {pedido.status === 'atendido' && (
                      <div className="mt-2 bg-[#1b263b]/50 rounded-lg p-4 border-l-4 border-[#d4af37]">
                        <p className="text-[10px] uppercase font-bold text-[#d4af37] mb-2 tracking-wider">Resposta da Equipa</p>
                        
                        {pedido.resposta ? (
                          <p className="text-sm text-zinc-300 leading-relaxed mb-3 whitespace-pre-wrap">{pedido.resposta}</p>
                        ) : (
                          <p className="text-sm text-zinc-500 italic mb-3">Solicitação atendida e finalizada internamente.</p>
                        )}
                        
                        {/* Se tiver arquivo anexo na resposta */}
                        {pedido.caminho_arquivo_resposta && (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-zinc-800/60 mt-2">
                            <div className="flex items-center gap-2 overflow-hidden w-full">
                              <IconClip />
                              <span className="text-xs text-zinc-300 truncate font-mono">{pedido.nome_arquivo_resposta}</span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button onClick={() => visualizarDocumento(pedido.caminho_arquivo_resposta)} className="flex-1 sm:flex-none text-xs bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700/60 px-4 py-2 rounded-lg transition font-bold shadow-sm whitespace-nowrap">
                                Visualizar
                              </button>
                              <button onClick={() => baixarDocumento(pedido.caminho_arquivo_resposta, pedido.nome_arquivo_resposta)} className="flex-1 sm:flex-none text-xs bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-4 py-2 rounded-lg transition font-extrabold shadow-sm whitespace-nowrap">
                                Baixar
                              </button>
                            </div>
                          </div>
                        )}

                        {!isInterno && (
                          <div className="mt-4 pt-4 border-t border-zinc-800/60">
                            {chamadoReabrindo === pedido.id ? (
                              <div className="bg-[#0d1b2a] p-4 rounded-lg border border-zinc-700 animate-in fade-in zoom-in-95 duration-200 shadow-inner">
                                <label className="block text-[10px] font-bold text-[#d4af37] uppercase mb-2">Enviar nova dúvida sobre este assunto:</label>
                                <textarea 
                                  autoFocus
                                  rows="3" 
                                  placeholder="Digite a sua nova dúvida aqui..." 
                                  value={textoReplica} 
                                  onChange={(e) => setTextoReplica(e.target.value)}
                                  className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none mb-3"
                                ></textarea>
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => { setChamadoReabrindo(null); setTextoReplica(''); }} className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition">Cancelar</button>
                                  <button onClick={() => handleEnviarReplica(pedido)} disabled={subindoArquivo || !textoReplica.trim()} className="px-4 py-2 bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 rounded-lg text-xs font-extrabold transition disabled:opacity-50 shadow-sm">
                                    {subindoArquivo ? 'A enviar...' : 'Enviar Mensagem'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-end">
                                <button onClick={() => { setChamadoReabrindo(pedido.id); setTextoReplica(''); }} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 px-4 py-2 rounded-lg transition font-bold shadow-sm">
                                  Ainda tem dúvidas? Responder aqui
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {/* ==========================================
            ABA 4: ALERTAS / COBRANÇAS
        ========================================== */}
        {abaPrincipal === 'alertas' && (
          <div className="bg-[#1b263b] p-8 rounded-xl border border-zinc-800 shadow-xl mb-10">
            <div className="border-b border-zinc-800 pb-4 mb-6">
              <h3 className="text-xl font-bold text-orange-400 capitalize">Documentos Pendentes</h3>
              <p className="text-xs text-zinc-400 mt-1">A nossa equipa solicitou as ações abaixo. Atenda as exigências para manter a sua contabilidade em dia.</p>
            </div>

            <div className="space-y-4">
              {alertas.filter(a => a.tipo_alerta === 'cobranca' || !a.tipo_alerta).length === 0 ? (
                <p className="text-zinc-500 text-sm">Nenhuma pendência neste momento. Tudo em dia!</p>
              ) : (
                alertas.filter(a => a.tipo_alerta === 'cobranca' || !a.tipo_alerta).map(alerta => (
                  <div key={alerta.id} className={`p-6 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${alerta.status === 'pendente' ? 'bg-[#0d1b2a] border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.05)]' : 'bg-[#0d1b2a]/50 border-emerald-500/20 opacity-70'}`}>
                    <div className="flex-1 w-full md:pr-6 min-w-0">
                      
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded uppercase whitespace-nowrap ${alerta.status === 'pendente' ? 'bg-orange-500 text-black shadow-sm' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                          {alerta.status === 'pendente' ? <><IconMiniClock /> Envio Necessário</> : <><IconCheck /> Resolvido</>}
                        </span>
                        
                        {alerta.status === 'pendente' && alerta.prazo && (
                          <span className="text-xs font-black text-white bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] border border-red-600 px-3 py-1 rounded-md uppercase tracking-wider animate-pulse">
                             Prazo {formatarPrazoSemAno(alerta.prazo)}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-lg font-bold text-white mb-2 break-words">{alerta.titulo}</h4>
                      {alerta.mensagem && (
                        <div 
                          className="text-sm text-zinc-300 leading-relaxed mb-3 space-y-1 break-words [word-break:break-word]" 
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(alerta.mensagem.replace(/\n/g, '<br>')) }}
                        />
                      )}
                      
                      <p className="text-[10px] font-semibold text-zinc-500 border-t border-zinc-800/80 pt-2 inline-block">
                        Enviado pela Innovative em {formatarDataHoraEnviado(alerta.criado_em)}
                      </p>

                      {!isInterno && alerta.status === 'pendente' && (
                        <p className="text-[11px] text-blue-400 mt-2 font-bold flex items-center gap-1">
                          <IconEye /> Visualizado (A Innovative Business foi notificada da sua leitura)
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-4 md:mt-0 w-full md:w-auto flex flex-col gap-3 min-w-[240px]">
                      {alerta.status === 'pendente' && !isInterno ? (
                        <>
                          {alertasSemArquivo[alerta.id] ? (
                            <button onClick={() => handleConcluirDemanda0Arquivo(alerta)} disabled={subindoArquivo} className="block w-full text-center bg-emerald-500 text-black font-extrabold px-6 py-3.5 rounded-lg text-sm hover:bg-emerald-400 transition shadow-[0_0_15px_rgba(16,185,129,0.3)] whitespace-nowrap">
                              {subindoArquivo ? 'A processar...' : <><IconCheck /> Concluir Demanda</>}
                            </button>
                          ) : (
                            <label className="block w-full text-center bg-[#d4af37] text-[#0d1b2a] font-extrabold px-6 py-3.5 rounded-lg text-sm hover:bg-yellow-500 transition shadow-[0_0_15px_rgba(212,175,55,0.3)] cursor-pointer whitespace-nowrap">
                              {subindoArquivo ? 'A Enviar...' : <><IconClip /> Anexar Arquivo</>}
                              <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => handleResponderAlerta(e, alerta)} disabled={subindoArquivo} />
                            </label>
                          )}

                          <label className="flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-zinc-400 hover:text-white transition p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <input 
                              type="checkbox" 
                              className="accent-[#d4af37] w-4 h-4 cursor-pointer"
                              checked={!!alertasSemArquivo[alerta.id]} 
                              onChange={() => setAlertasSemArquivo({...alertasSemArquivo, [alerta.id]: !alertasSemArquivo[alerta.id]})} 
                            />
                            Não tenho arquivos a anexar
                          </label>
                        </>
                      ) : (
                        alerta.caminho_arquivo ? (
                          <button onClick={() => baixarDocumento(alerta.caminho_arquivo)} className="w-full whitespace-nowrap text-xs border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] px-4 py-3 rounded-lg font-bold transition-all shadow-sm">
                            Ver Arquivo Enviado
                          </button>
                        ) : (
                          <span className="w-full text-center whitespace-nowrap text-xs bg-zinc-800 text-zinc-400 px-4 py-3 rounded-lg font-bold shadow-sm cursor-not-allowed">
                            Concluído sem arquivos
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            ABA NOVA: AVISOS E LEMBRETES (AZUL)
        ========================================== */}
        {abaPrincipal === 'avisos' && (
          <div className="bg-[#1b263b] p-8 rounded-xl border border-zinc-800 shadow-xl mb-10">
            <div className="border-b border-zinc-800 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-blue-400 capitalize flex items-center gap-2">
                   <IconInfoBlue /> Mural de Avisos
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Confira os recados e comunicados importantes deixados pela equipa.</p>
              </div>
              <div className="flex bg-[#0d1b2a] p-1 rounded-lg border border-zinc-800 w-full sm:w-auto">
                <button onClick={() => setSubAbaAviso('ativos')} className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-xs font-bold transition-all ${subAbaAviso === 'ativos' ? 'bg-blue-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>Recentes</button>
                <button onClick={() => setSubAbaAviso('historico')} className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-xs font-bold transition-all ${subAbaAviso === 'historico' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>Histórico</button>
              </div>
            </div>

            <div className="space-y-4">
              {(() => {
                const todosAvisos = alertas.filter(a => a.tipo_alerta === 'lembrete');
                const hojeApp = new Date();

                const ativos = [];
                const historico = [];

                todosAvisos.forEach(a => {
                  if (a.status === 'historico') {
                    historico.push(a);
                    return;
                  }

                  const diffCriacao = (hojeApp - new Date(a.criado_em)) / (1000 * 3600 * 24);
                  const diffVisto = a.visualizado_em ? (hojeApp - new Date(a.visualizado_em)) / (1000 * 3600 * 24) : 0;
                  
                  if (a.status === 'pendente') {
                    // Mágica 1: Não leu em 45 dias? Arquiva.
                    if (diffCriacao >= 45) historico.push(a);
                    else ativos.push(a);
                  } else if (a.status === 'respondido') {
                    // Mágica 2: Já passou 15 dias da criação E 1 dia da leitura? Arquiva.
                    if ((diffCriacao >= 15 && diffVisto >= 1) || diffCriacao >= 45) {
                      historico.push(a);
                    } else {
                      ativos.push(a);
                    }
                  } else {
                    historico.push(a);
                  }
                });

                const listaExibicao = subAbaAviso === 'ativos' ? ativos : historico;

                if (listaExibicao.length === 0) return <p className="text-zinc-500 text-sm py-8 text-center bg-[#0d1b2a] rounded-xl border border-zinc-800">Nenhum aviso nesta categoria.</p>;

                return listaExibicao.map(alerta => {
                  // Efeito Sanfona: Se tiver só 1, fica aberto. Se tiver vários, respeita o clique.
                  const isExpanded = listaExibicao.length === 1 || expandidosAvisos[alerta.id];
                  
                  return (
                    <div key={alerta.id} className={`p-6 rounded-xl border flex flex-col gap-4 transition-all duration-300 ${alerta.status === 'pendente' ? 'bg-[#0d1b2a] border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.05)]' : 'bg-[#0d1b2a]/50 border-blue-500/20 opacity-80 hover:opacity-100'}`}>
                      
                      {/* HEADER DO AVISO */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className={`text-[10px] font-extrabold px-3 py-1 rounded uppercase whitespace-nowrap ${alerta.status === 'pendente' ? 'bg-blue-500 text-white shadow-sm' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                              {alerta.status === 'pendente' ? 'Não Lido' : (alerta.status === 'historico' || subAbaAviso === 'historico' ? 'No Histórico' : 'Lido')}
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-500 border-l border-zinc-800/80 pl-3">
                              {formatarDataHoraEnviado(alerta.criado_em)}
                            </span>
                          </div>
                          
                          <h4 className={`text-lg font-bold text-white break-words pr-4 ${!isExpanded ? 'truncate' : ''}`}>{alerta.titulo}</h4>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
                          {listaExibicao.length > 1 && (
                            <button onClick={() => setExpandidosAvisos(prev => ({...prev, [alerta.id]: !prev[alerta.id]}))} className="flex-1 md:flex-none text-xs bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 rounded text-zinc-300 hover:text-white font-bold transition border border-zinc-700 shadow-sm whitespace-nowrap">
                              {isExpanded ? 'Ocultar ▲' : 'Ver Detalhes ▼'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* CORPO DO AVISO (Expansível) */}
                      {isExpanded && (
                        <div className="border-t border-zinc-800/60 pt-4 mt-2 animate-in fade-in slide-in-from-top-2">
                          {alerta.mensagem && (
                            <div 
                              className="text-sm text-zinc-300 leading-relaxed mb-5 space-y-1 break-words [word-break:break-word]" 
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(alerta.mensagem.replace(/\n/g, '<br>')) }}
                            />
                          )}
                          
                          <div className="flex flex-col sm:flex-row gap-3 items-center justify-end bg-[#1b263b]/50 p-3 rounded-lg border border-zinc-800/50">
                            {alerta.status === 'pendente' && !isInterno ? (
                              <button onClick={() => handleMarcarAvisoLido(alerta)} disabled={subindoArquivo} className="w-full sm:w-auto text-center bg-blue-500 text-white font-extrabold px-6 py-2.5 rounded-lg text-xs hover:bg-blue-600 transition shadow-[0_0_15px_rgba(59,130,246,0.3)] whitespace-nowrap">
                                {subindoArquivo ? 'A processar...' : 'Marcar como Lido'}
                              </button>
                            ) : (
                              <span className="w-full sm:w-auto text-center whitespace-nowrap text-xs text-zinc-500 font-bold px-4 py-2">
                                ✓ Aviso Lido
                              </span>
                            )}

                            {!isInterno && alerta.status !== 'historico' && subAbaAviso !== 'historico' && (
                              <button onClick={() => handleMoverAvisoHistorico(alerta)} disabled={subindoArquivo} className="w-full sm:w-auto text-center bg-zinc-800 text-zinc-400 font-bold px-6 py-2.5 rounded-lg text-xs hover:bg-zinc-700 hover:text-white transition border border-zinc-700 whitespace-nowrap shadow-sm">
                                Mover para Histórico
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* ==========================================
            ABA 5: LINKS ÚTEIS E ACESSOS
        ========================================== */}
        {abaPrincipal === 'links' && (
          <div className="bg-[#1b263b] p-8 rounded-xl border border-zinc-800 shadow-xl mb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-4 mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#d4af37] capitalize">Links Úteis e Acessos</h3>
                <p className="text-xs text-zinc-400 mt-1">Acessos rápidos a sistemas, portais de faturação ou formulários externos.</p>
              </div>
              {isInterno && !mostrarFormLink && (
                <button onClick={() => { setFormLink({ titulo: '', url: '', descricao: '', regime_alvo: 'Todos' }); setLinkEditando(null); setMostrarFormLink(true); }} className="bg-zinc-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-700 transition shadow-md whitespace-nowrap">
                  + Adicionar Link
                </button>
              )}
            </div>

            {isInterno && mostrarFormLink && (
              <form onSubmit={handleSalvarLink} className="mb-8 bg-[#0d1b2a] p-6 rounded-xl border border-[#d4af37]/30 shadow-lg animate-in fade-in">
                <h4 className="text-sm font-bold text-[#d4af37] mb-4">{linkEditando ? 'Editar Acesso Rápido' : 'Cadastrar Novo Link'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Título do Sistema</label>
                    <input type="text" required placeholder="Ex: Portal de Faturação..." value={formLink.titulo} onChange={e => setFormLink({...formLink, titulo: e.target.value})} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#d4af37] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">URL (Endereço Web)</label>
                    <input type="url" required placeholder="https://..." value={formLink.url} onChange={e => setFormLink({...formLink, url: e.target.value})} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#d4af37] outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Descrição (Opcional)</label>
                    <input type="text" placeholder="Ex: Utilize este portal para emitir os seus recibos..." value={formLink.descricao} onChange={e => setFormLink({...formLink, descricao: e.target.value})} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#d4af37] outline-none" />
                  </div>

                  {/* CAIXA MÁGICA: Só aparece se for o Lsprado */}
                  {(cliente?.cnpj?.replace(/\D/g, '') === '50457640000101' || cliente?.nome_empresa?.toLowerCase().includes('lsprado')) && (
                    <div className="md:col-span-2 mt-2 p-4 bg-[#1b263b] rounded-lg border border-purple-500/30 shadow-inner">
                      <label className="block text-xs font-bold text-purple-400 uppercase mb-2">📡 Espelhamento Global (Regime Tributário)</label>
                      <select value={formLink.regime_alvo} onChange={e => setFormLink({...formLink, regime_alvo: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:border-purple-400 outline-none cursor-pointer">
                        <option value="Todos">Visível para TODOS os Clientes</option>
                        <option value="Simples Nacional">Visível APENAS para Simples Nacional</option>
                        <option value="Lucro Presumido">Visível APENAS para Lucro Presumido</option>
                        <option value="Lucro Real">Visível APENAS para Lucro Real</option>
                      </select>
                      <p className="text-[10px] text-zinc-400 mt-2 font-medium">Ao salvar, este link será criado, atualizado ou removido do painel dos clientes de forma 100% automática com base nesta regra.</p>
                    </div>
                  )}

                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button type="button" onClick={() => { setMostrarFormLink(false); setLinkEditando(null); setFormLink({ titulo: '', url: '', descricao: '', regime_alvo: 'Todos' }); }} className="px-5 py-2.5 bg-zinc-800 text-zinc-300 text-sm font-bold rounded-lg hover:bg-zinc-700 transition">Cancelar</button>
                  <button type="submit" disabled={subindoArquivo} className="px-6 py-2.5 bg-[#d4af37] text-[#0d1b2a] text-sm font-extrabold rounded-lg hover:bg-yellow-500 shadow-lg transition">
                    {subindoArquivo ? 'A Sincronizar...' : 'Guardar Link'}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {(!cliente?.links || cliente.links.length === 0) ? (
                <div className="col-span-1 lg:col-span-2 py-10 text-center">
                  <span className="text-4xl block mb-2 opacity-30">🔗</span>
                  <p className="text-zinc-500 text-sm font-medium">Nenhum link útil foi configurado para o seu perfil.</p>
                </div>
              ) : (
                cliente.links.map(link => (
                  <div key={link.id} className="bg-[#0d1b2a] border border-zinc-800 p-6 rounded-xl flex flex-col justify-between group hover:border-[#d4af37]/50 transition-all shadow-md">
                    <div className="mb-6">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-white font-bold text-lg">{link.titulo}</h4>
                        {(cliente?.cnpj?.replace(/\D/g, '') === '50457640000101' || cliente?.nome_empresa?.toLowerCase().includes('lsprado')) && link.regime_alvo && (
                           <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded uppercase font-bold tracking-wider ml-2 whitespace-nowrap">{link.regime_alvo}</span>
                        )}
                      </div>
                      {link.descricao && <p className="text-xs text-zinc-400 leading-relaxed mb-3">{link.descricao}</p>}
                      <div className="bg-[#1b263b] px-3 py-2 rounded border border-zinc-800/80 cursor-pointer hover:bg-zinc-800 transition" onClick={() => copiarParaTransferencia(link.url)} title="Clique para copiar">
                        <p className="text-[11px] text-[#d4af37] font-mono truncate select-none">{link.url}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full mt-auto pt-5 border-t border-zinc-800/60">
                      <button onClick={() => copiarParaTransferencia(link.url)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center shadow-sm">
                        <IconCopy /> Copiar
                      </button>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] px-3 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center text-center">
                        <IconExternal /> Acessar
                      </a>
                      {isInterno && (
                        <>
                          <button onClick={() => { setFormLink({ titulo: link.titulo, url: link.url, descricao: link.descricao, regime_alvo: link.regime_alvo || 'Todos' }); setLinkEditando(link.id); setMostrarFormLink(true); }} className="px-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white rounded-lg text-xs font-bold transition">
                            Editar
                          </button>
                          <button onClick={() => handleRemoverLink(link.id)} className="px-3 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition">
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* ==========================================
          MODAL DE MOVER ARQUIVO (REPOSICIONADO PARA CORRIGIR Z-INDEX)
      ========================================== */}
      {arquivosMovendo.length > 0 && isInterno && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999999]">
          <div className="bg-[#1b263b] border border-zinc-700 rounded-xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#d4af37]">Mover {arquivosMovendo.length > 1 ? 'Arquivos' : 'Arquivo'}</h3>
              <button onClick={() => setArquivosMovendo([])} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={confirmarMovimentacao} className="p-5 space-y-4">
              <p className="text-sm text-zinc-300">
                Selecione o destino para {arquivosMovendo.length > 1 ? <strong className="text-[#d4af37]">{arquivosMovendo.length} arquivos selecionados</strong> : <strong className="text-white block mt-1 truncate">{arquivosMovendo[0].nome_original}</strong>}
              </p>
              <select 
                value={destinoPastaMover} 
                onChange={(e) => setDestinoPastaMover(e.target.value)}
                className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="">Pasta Principal (Raiz do Setor {pastaAtiva})</option>
                {pastas
                  .map(p => ({ ...p, caminhoCompleto: obterCaminhoPastas(p.id).map(x => x.nome).join(' / ') }))
                  .sort((a, b) => a.caminhoCompleto.localeCompare(b.caminhoCompleto))
                  .map(p => (
                    <option key={p.id} value={p.id}>📂 {p.caminhoCompleto}</option>
                ))}
              </select>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setArquivosMovendo([])} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-lg">
                  {subindoArquivo ? 'A Mover...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GESTÃO DE PERFIL E TROCA DE SENHA (REPOSICIONADO PARA CORRIGIR Z-INDEX) */}
      {mostrarModalPerfil && cliente && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999999]">
          <div className="bg-[#1b263b] border border-zinc-700 rounded-xl w-full max-w-lg flex flex-col shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-lg font-bold text-[#d4af37]">Configurações da Conta</h3>
              <button onClick={() => setMostrarModalPerfil(false)} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <div className="p-5 space-y-6">
              {/* DADOS PRINCIPAIS */}
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Titular Principal / Empresa</p>
                <p className="text-white font-semibold">{cliente.nome_empresa}</p>
                <p className="text-xs text-zinc-400 mt-1">{cliente.email} • CNPJ: {cliente.cnpj}</p>
              </div>

              {/* GESTÃO DE SÓCIOS */}
              <div className="border-t border-zinc-800 pt-5">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-[#d4af37] uppercase tracking-wider">Acessos Secundários (Sócios)</h4>
                  {(cliente.socios || []).length < 2 && !mostrarFormSocio && (
                    <button onClick={() => setMostrarFormSocio(true)} className="text-[10px] bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37] hover:text-[#0d1b2a] px-3 py-1.5 rounded-md font-bold transition">
                      + Adicionar
                    </button>
                  )}
                </div>

                {(cliente.socios || []).length === 0 && !mostrarFormSocio && (
                  <p className="text-xs text-zinc-500 italic">Nenhum sócio ou utilizador adicional registado.</p>
                )}

                {/* Lista de Sócios */}
                <div className="space-y-2 mb-3">
                  {(cliente.socios || []).map(socio => (
                    <div key={socio.id} className="bg-[#0d1b2a] border border-zinc-700/50 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-sm text-white font-bold">{socio.nome}</p>
                        <p className="text-[10px] text-zinc-400">{socio.email} • {socio.celular}</p>
                      </div>
                      <button onClick={() => handleRemoverSocio(socio.id)} className="text-xs text-red-400 hover:text-red-300 font-bold transition p-1">Revogar</button>
                    </div>
                  ))}
                </div>

                {/* Formulário de Adição */}
                {mostrarFormSocio && (
                  <form onSubmit={handleAdicionarSocio} className="bg-[#0d1b2a] p-4 rounded-lg border border-zinc-700 mb-4 animate-in fade-in duration-300 space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Nome Completo</label>
                      <input type="text" required value={formSocio.nome} onChange={e => setFormSocio({...formSocio, nome: e.target.value})} className="w-full bg-[#1b263b] border border-zinc-700 rounded p-2 text-xs text-white focus:border-[#d4af37] outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">E-mail</label>
                        <input type="email" required value={formSocio.email} onChange={e => setFormSocio({...formSocio, email: e.target.value})} className="w-full bg-[#1b263b] border border-zinc-700 rounded p-2 text-xs text-white focus:border-[#d4af37] outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Telemóvel</label>
                        <input type="tel" required value={formSocio.celular} onChange={e => setFormSocio({...formSocio, celular: e.target.value})} className="w-full bg-[#1b263b] border border-zinc-700 rounded p-2 text-xs text-white focus:border-[#d4af37] outline-none" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                      <button type="button" onClick={() => setMostrarFormSocio(false)} className="text-[11px] font-bold text-zinc-400 hover:text-white px-3 py-1">Cancelar</button>
                      <button type="submit" disabled={subindoArquivo} className="text-[11px] font-bold bg-[#d4af37] text-black px-4 py-1.5 rounded hover:bg-yellow-500 shadow-sm">Salvar Sócio</button>
                    </div>
                  </form>
                )}
              </div>
              
              {/* TROCA DE SENHA COM DROPDOWN INTELIGENTE */}
              <div className="border-t border-zinc-800 pt-5">
                <h4 className="text-sm font-bold text-orange-400 mb-3 uppercase tracking-wider">Gestão de Senhas</h4>
                <form onSubmit={handleAlterarSenha} className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">De qual conta deseja alterar a senha?</label>
                    <select 
                      value={contaSelecionadaSenha} 
                      onChange={e => setContaSelecionadaSenha(e.target.value)} 
                      className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400"
                    >
                      <option value="principal">Titular: {cliente.email}</option>
                      {(cliente.socios || []).map(s => (
                        <option key={s.id} value={s.id}>Sócio: {s.email}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Nova Senha</label>
                      <input type="text" required placeholder="Nova senha segura..." value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400" />
                    </div>
                    <button type="submit" disabled={salvandoSenha} className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-5 py-2.5 rounded-lg text-sm transition shadow-md h-[42px]">
                      {salvandoSenha ? 'A Gravar...' : 'Atualizar'}
                    </button>
                  </div>
                </form>
              </div>

              {/* GESTÃO DE MÚLTIPLOS CNPJS */}
              {!isInterno && (
                <div className="border-t border-zinc-800 pt-5">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">Empresas Conectadas</h4>
                    {!mostrarFormVinculo && (
                      <button onClick={() => { setMostrarFormVinculo(true); setStatusBuscaCnpj('ocioso'); setFormVinculo({...formVinculo, cnpj: ''}); }} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-md font-bold transition">
                        + Conectar CNPJ
                      </button>
                    )}
                  </div>
                  
                  {empresasLigadas.length === 0 && !mostrarFormVinculo && (
                    <p className="text-xs text-zinc-500 italic">Nenhuma outra empresa vinculada a este perfil.</p>
                  )}

                  {/* Lista de Ligadas no Modal */}
                  {!mostrarFormVinculo && empresasLigadas.map(emp => (
                    <div key={emp.id} className="bg-[#0d1b2a] border border-blue-500/20 p-3 rounded-lg flex justify-between items-center mb-2">
                      <div>
                        <p className="text-sm text-white font-bold">{emp.nome_empresa}</p>
                        <p className="text-[10px] text-zinc-400">CNPJ: {emp.cnpj}</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-bold">Conectada</span>
                    </div>
                  ))}

                  {/* FORMULÁRIO MÁGICO DE VÍNCULO */}
                  {mostrarFormVinculo && (
                    <div className="bg-[#0d1b2a] p-4 rounded-lg border border-blue-500/30 animate-in fade-in duration-300">
                      {statusBuscaCnpj === 'ocioso' && (
                        <form onSubmit={handleBuscarCnpjVinculo}>
                          <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-2">Qual CNPJ deseja vincular à sua conta?</label>
                          <div className="flex gap-2">
                            <input type="text" required placeholder="00.000.000/0001-00" value={formVinculo.cnpj} onChange={e => setFormVinculo({...formVinculo, cnpj: maskCNPJ(e.target.value)})} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg p-2 text-sm text-white focus:border-blue-400 outline-none font-mono" />
                            <button type="submit" className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded-lg text-xs transition">Buscar</button>
                          </div>
                        </form>
                      )}

                      {statusBuscaCnpj === 'encontrado' && (
                        <div className="space-y-4">
                          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded text-sm text-emerald-400">
                            <strong>Empresa Encontrada!</strong><br/>
                            {formVinculo.nome_empresa}
                          </div>
                          <p className="text-xs text-zinc-400">Ao solicitar o vínculo, a nossa equipa irá avaliar o seu pedido. Caso aprovado, poderá alternar entre elas no menu principal.</p>
                          <div className="flex gap-2">
                            <button onClick={() => setMostrarFormVinculo(false)} className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition">Cancelar</button>
                            <button onClick={handleSolicitarVinculo} disabled={subindoArquivo} className="flex-1 bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-md">{subindoArquivo ? 'Aguarde...' : 'Solicitar Vínculo Oficial'}</button>
                          </div>
                        </div>
                      )}

                      {statusBuscaCnpj === 'nao_encontrado' && (
                        <form onSubmit={handleSolicitarVinculo} className="space-y-3">
                          <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded text-xs text-orange-400 mb-2">
                            Este CNPJ ainda não tem portal. Preencha os dados abaixo para criarmos e vincularmos automaticamente.
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Razão Social</label>
                            <input type="text" required value={formVinculo.nome_empresa} onChange={e => setFormVinculo({...formVinculo, nome_empresa: e.target.value})} className="w-full bg-[#1b263b] border border-zinc-700 rounded p-2 text-xs text-white outline-none" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">Regime Tributário</label>
                              <select required value={formVinculo.regime_tributario} onChange={e => setFormVinculo({...formVinculo, regime_tributario: e.target.value})} className="w-full bg-[#1b263b] border border-zinc-700 rounded p-2 text-xs text-white outline-none">
                                <option value="">Selecione...</option>
                                <option value="Simples Nacional">Simples Nacional</option>
                                <option value="Lucro Presumido">Lucro Presumido</option>
                                <option value="Lucro Real">Lucro Real</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">E-mail da nova empresa</label>
                              <input type="email" value={formVinculo.email} onChange={e => setFormVinculo({...formVinculo, email: e.target.value})} placeholder={cliente.email} className="w-full bg-[#1b263b] border border-zinc-700 rounded p-2 text-xs text-white outline-none" />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setMostrarFormVinculo(false)} className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition">Cancelar</button>
                            <button type="submit" disabled={subindoArquivo} className="flex-1 bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-md">{subindoArquivo ? 'Aguarde...' : 'Criar e Vincular'}</button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RESPOSTA À SOLICITAÇÃO (VISÃO ADMIN DENTRO DO PERFIL) */}
      {modalRespostaPedido.aberto && (
        <div className="fixed inset-0 bg-[#0d1b2a]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]">
          <div className="bg-[#1b263b] border border-[#d4af37]/50 rounded-xl w-full max-w-lg flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl">
              <div>
                <h3 className="text-lg font-bold text-[#d4af37]">Responder Solicitação</h3>
                <p className="text-[10px] text-zinc-400 mt-1">Cliente: {cliente?.nome_empresa}</p>
              </div>
              <button type="button" onClick={() => setModalRespostaPedido({ aberto: false, pedido: null, texto: '', arquivo: null })} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <form onSubmit={handleResponderPedidoAdmin} className="p-5 space-y-4">
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
                <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-lg disabled:opacity-50">
                  {subindoArquivo ? 'A enviar...' : 'Enviar e Finalizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MÚLTIPLAS PASTAS (EXCLUSIVO LUCAS) */}
      {modalMultiPastas.aberto && (
        <div className="fixed inset-0 bg-[#0d1b2a]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]">
          <div className="bg-[#1b263b] border border-zinc-700 rounded-xl w-full max-w-md flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl sticky top-0 z-10">
              <h3 className="text-lg font-bold text-[#d4af37]">Criar Múltiplas Pastas</h3>
              <button type="button" onClick={() => setModalMultiPastas({ aberto: false, nomes: [''] })} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={handleCriarMultiPastas} className="p-5 space-y-4">
              <p className="text-xs text-zinc-400 mb-2">Escreva o nome das pastas. Clique no botão abaixo para adicionar até 20 caixas duma vez.</p>
              <div className="space-y-3">
                {modalMultiPastas.nomes.map((nome, index) => (
                  <div key={index} className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2">
                    <input 
                      type="text" 
                      placeholder={`Nome da Pasta ${index + 1}`}
                      value={nome} 
                      autoFocus={index === modalMultiPastas.nomes.length - 1}
                      onChange={(e) => {
                        const novos = [...modalMultiPastas.nomes];
                        novos[index] = e.target.value;
                        setModalMultiPastas({...modalMultiPastas, nomes: novos});
                      }}
                      className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                    {modalMultiPastas.nomes.length > 1 && (
                      <button type="button" onClick={() => {
                        const novos = modalMultiPastas.nomes.filter((_, i) => i !== index);
                        setModalMultiPastas({...modalMultiPastas, nomes: novos});
                      }} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2.5 rounded-lg transition font-bold border border-red-500/20">X</button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                {modalMultiPastas.nomes.length < 20 && (
                  <button type="button" onClick={() => setModalMultiPastas({...modalMultiPastas, nomes: [...modalMultiPastas.nomes, '']})} className="flex-1 bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-600 hover:text-white py-2 rounded-lg text-xs font-bold transition border-dashed">
                    + Adicionar campo
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => setModalMultiPastas({...modalMultiPastas, nomes: ['01 - Janeiro', '02 - Fevereiro', '03 - Março', '04 - Abril', '05 - Maio', '06 - Junho', '07 - Julho', '08 - Agosto', '09 - Setembro', '10 - Outubro', '11 - Novembro', '12 - Dezembro']})} 
                  className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white py-2 rounded-lg text-xs font-bold transition border-dashed"
                >
                  Preencher 12 Meses
                </button>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-zinc-800 mt-2">
                <button type="button" onClick={() => setModalMultiPastas({ aberto: false, nomes: [''] })} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-lg disabled:opacity-50">
                  {subindoArquivo ? 'Criando...' : 'Confirmar e Criar Todas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SISTEMA DE MODAL COM INPUT PREMIUM (Substitui prompt nativo) */}
      {inputModal.aberto && (
        <div className="fixed inset-0 bg-[#0d1b2a]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]">
          <div className="bg-[#1b263b] border border-zinc-700 rounded-xl w-full max-w-md flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl">
              <h3 className="text-lg font-bold text-[#d4af37]">{inputModal.titulo}</h3>
              <button type="button" onClick={() => setInputModal({ ...inputModal, aberto: false })} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); inputModal.acao(inputModal.valor); setInputModal({ ...inputModal, aberto: false }); }} className="p-5 space-y-4">
              <div>
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder={inputModal.placeholder}
                  value={inputModal.valor} 
                  onChange={(e) => setInputModal({...inputModal, valor: e.target.value})}
                  className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setInputModal({ ...inputModal, aberto: false })} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" className="bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-lg">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SISTEMA DE CONFIRMAÇÃO PREMIUM (Substitui o alert feio do navegador) */}
      {dialogo.aberto && (
        <div className="fixed inset-0 bg-[#0d1b2a]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]">
          <div className="bg-[#1b263b] border border-zinc-700 rounded-xl w-full max-w-sm p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
            <h3 className={`text-xl font-black mb-2 ${dialogo.tipo === 'perigo' ? 'text-red-500' : 'text-[#d4af37]'}`}>
              {dialogo.tipo === 'perigo' ? '⚠️ ' : '✅ '}{dialogo.titulo}
            </h3>
            <p className="text-zinc-300 text-sm mb-8 leading-relaxed whitespace-pre-wrap">{dialogo.mensagem}</p>
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
      {(subindoArquivo || progressoLink) && (
        <div className="fixed inset-0 z-[99999999] bg-[#0d1b2a]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1b263b] p-8 rounded-2xl border border-[#d4af37]/40 flex flex-col items-center gap-5 shadow-[0_0_60px_rgba(212,175,55,0.2)] animate-in zoom-in duration-200 w-full max-w-sm">

            {progressoLink ? (
              <div className="w-full flex flex-col items-center">
                <div className="text-5xl mb-4 animate-bounce drop-shadow-lg">🔗</div>
                <h3 className="text-white font-black text-lg mb-2 tracking-wide text-center">Sincronizando Links</h3>

                <div className="bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-4 text-center">
                  Fase {progressoLink.fase} de {progressoLink.totalFases}: {progressoLink.nomeFase}
                </div>

                <p className="text-[#d4af37] font-black text-3xl mb-4">{Math.round((progressoLink.atual / progressoLink.total) * 100)}%</p>

                <div className="w-full bg-zinc-800 rounded-full h-3.5 mb-3 overflow-hidden border border-zinc-700 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-yellow-600 to-[#d4af37] h-full rounded-full transition-all duration-300 relative overflow-hidden" 
                    style={{ width: `${(progressoLink.atual / progressoLink.total) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_linear_infinite]"></div>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 truncate w-full text-center">Cliente: <strong className="text-zinc-200">{progressoLink.texto}</strong></p>
                <p className="text-[10px] text-zinc-500 mt-2 font-bold bg-[#0d1b2a] px-3 py-1 rounded-full border border-zinc-800 uppercase tracking-widest">
                  {progressoLink.atual} de {progressoLink.total}
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

      {/* MODAL DE DÚVIDA RÁPIDA (DIRETO DO ARQUIVO) */}
      {modalDuvidaArquivo.aberto && (
        <div className="fixed inset-0 bg-[#0d1b2a]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]">
          <div className="bg-[#1b263b] border border-[#d4af37]/50 rounded-xl w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl">
              <h3 className="text-lg font-bold text-[#d4af37]">Solicitar Suporte</h3>
              <button type="button" onClick={() => setModalDuvidaArquivo({ aberto: false, arquivo: null, texto: '' })} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={handleEnviarDuvidaArquivo} className="p-5 space-y-4">
              <div className="bg-[#0d1b2a] p-3 rounded-lg border border-zinc-800 flex items-center gap-3">
                <div className="flex-shrink-0"><IconFile /></div>
                <span className="text-xs text-zinc-300 font-mono truncate">{modalDuvidaArquivo.arquivo?.nome_original}</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Em que podemos ajudar com este documento?</label>
                <textarea 
                  rows="4" 
                  autoFocus
                  required
                  placeholder="Escreva a sua mensagem para a nossa equipa..." 
                  value={modalDuvidaArquivo.texto} 
                  onChange={(e) => setModalDuvidaArquivo({...modalDuvidaArquivo, texto: e.target.value})}
                  className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none"
                ></textarea>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalDuvidaArquivo({ aberto: false, arquivo: null, texto: '' })} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-lg">
                  {subindoArquivo ? 'A enviar...' : 'Enviar para Suporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR DISCLAIMER DA PASTA (ADMIN) */}
      {modalTextoPasta.aberto && (
        <div className="fixed inset-0 bg-[#0d1b2a]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]">
          <div className="bg-[#1b263b] border border-[#d4af37]/50 rounded-xl w-full max-w-lg flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl">
              <h3 className="text-lg font-bold text-[#d4af37]">Editar Explicações da Pasta</h3>
              <button type="button" onClick={() => setModalTextoPasta({ aberto: false, setor: '', textoPadrao: '', textoVan: '' })} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={salvarTextoPasta} className="p-5 space-y-4">
              <p className="text-xs text-zinc-400">Personalize o que os clientes lerão ao abrir a pasta <strong className="text-white uppercase">{modalTextoPasta.setor}</strong>.</p>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-zinc-300 uppercase">Texto para Clientes (Simples Nacional)</label>
                <textarea 
                  rows="3" 
                  autoFocus
                  required
                  placeholder="Escreva a explicação padrão..." 
                  value={modalTextoPasta.textoPadrao} 
                  onChange={(e) => setModalTextoPasta({...modalTextoPasta, textoPadrao: e.target.value})}
                  className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none"
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-purple-400 uppercase">Texto para Clientes VAN (Lucro Real/Presumido)</label>
                <textarea 
                  rows="3" 
                  required
                  placeholder="Escreva a explicação personalizada..." 
                  value={modalTextoPasta.textoVan} 
                  onChange={(e) => setModalTextoPasta({...modalTextoPasta, textoVan: e.target.value})}
                  className="w-full bg-[#0d1b2a] border border-purple-500/30 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-400 resize-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalTextoPasta({ aberto: false, setor: '', textoPadrao: '', textoVan: '' })} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-lg">
                  {subindoArquivo ? 'Salvando...' : 'Salvar Textos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO MANUAL (ADMIN) */}
      {modalEditarCliente && isInterno && (
        <div className="fixed inset-0 bg-[#0d1b2a]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]">
          <div className="bg-[#1b263b] border border-[#d4af37]/50 rounded-xl w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl">
              <h3 className="text-lg font-bold text-[#d4af37]">Editar Dados Cadastrais</h3>
              <button type="button" onClick={() => setModalEditarCliente(false)} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <form onSubmit={handleSalvarEdicaoManual} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">CNPJ (Intocável)</label>
                <input 
                  type="text" 
                  value={cliente.cnpj} 
                  disabled 
                  className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed opacity-70"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#d4af37] uppercase mb-1">Razão Social / Nome da Empresa</label>
                <input 
                  type="text" 
                  required
                  value={formEditar.nome_empresa} 
                  onChange={(e) => setFormEditar({...formEditar, nome_empresa: e.target.value})}
                  className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#d4af37] uppercase mb-1">Nome do Contato Principal</label>
                <input 
                  type="text" 
                  value={formEditar.nome_contato} 
                  onChange={(e) => setFormEditar({...formEditar, nome_contato: e.target.value})}
                  className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#d4af37] uppercase mb-1">E-mail de Contato</label>
                  <input 
                    type="email" 
                    required
                    value={formEditar.email} 
                    onChange={(e) => setFormEditar({...formEditar, email: e.target.value})}
                    className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#d4af37] uppercase mb-1">Telemóvel / Celular</label>
                  <input 
                    type="tel" 
                    value={formEditar.celular} 
                    onChange={(e) => setFormEditar({...formEditar, celular: maskCelular(e.target.value)})}
                    className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#d4af37] uppercase mb-1">Ciclo de Mensalidade</label>
                <select 
                  value={formEditar.dia_vencimento} 
                  onChange={(e) => setFormEditar({...formEditar, dia_vencimento: e.target.value})}
                  className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37] cursor-pointer"
                >
                  <option value="20">Padrão - Vence dia 20 (Abre dia 10)</option>
                  <option value="26">Especial - Vence dia 26 (Abre dia 15)</option>
                  <option value="30">Especial - Vence dia 30 (Abre dia 20)</option>
                  <option value="10">Especial - Vence dia 10 (Abre dia 01)</option>
                  <option value="99">Isenta (Oculta Aba Financeiro)</option>
                </select>
              </div>

              <div className="border-t border-zinc-800 pt-4 mt-2">
                <label className="block text-[10px] font-bold text-blue-400 uppercase mb-2">Vincular Empresas (Máx: 5)</label>
                
                {empresasLigadasForm.length < 5 && (
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Pesquisar por nome, CNPJ ou CPF..."
                      value={buscaLink}
                      onChange={(e) => { setBuscaLink(e.target.value); setMostrarAutoLink(true); }}
                      onFocus={() => setMostrarAutoLink(true)}
                      onBlur={() => setTimeout(() => setMostrarAutoLink(false), 200)}
                      className="w-full bg-[#0d1b2a] border border-blue-500/30 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400"
                    />
                    {mostrarAutoLink && buscaLink.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d1b2a] border border-zinc-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                        {todosClientesParaLink
                          .filter(c => (c.nome_empresa?.toLowerCase().includes(buscaLink.toLowerCase()) || c.cnpj?.includes(buscaLink) || c.cpf?.includes(buscaLink)) && !empresasLigadasForm.some(l => l.id === c.id))
                          .map((cli) => {
                            const isEspecial = cli.tipo_conta === 'especiais' || cli.tipo_conta === 'especial';
                            return (
                              <div
                                key={`auto-link-${cli.id}`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setEmpresasLigadasForm([...empresasLigadasForm, cli]);
                                  setBuscaLink('');
                                  setMostrarAutoLink(false);
                                }}
                                className="px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer truncate border-b border-zinc-800/50 last:border-0 transition flex items-center justify-between"
                              >
                                <div className="truncate pr-2 flex items-center gap-2">
                                  <span>{cli.nome_empresa}</span>
                                  {isEspecial && <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold">Societário</span>}
                                </div>
                                <span className="text-[10px] text-zinc-500 flex-shrink-0">{cli.cnpj || cli.cpf}</span>
                              </div>
                            )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {empresasLigadasForm.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Nenhuma empresa vinculada.</p>
                ) : (
                  <div className="space-y-2">
                    {empresasLigadasForm.map(emp => (
                      <div key={emp.id} className="flex justify-between items-center bg-[#0d1b2a] border border-blue-500/20 p-2.5 rounded-lg">
                        <div className="truncate pr-2">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-white truncate">{emp.nome_empresa}</p>
                            {(emp.tipo_conta === 'especiais' || emp.tipo_conta === 'especial') && <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold">Societário</span>}
                          </div>
                          <p className="text-[10px] text-zinc-500 truncate">{emp.cnpj || emp.cpf}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEmpresasLigadasForm(empresasLigadasForm.filter(e => e.id !== emp.id))}
                          className="text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded transition whitespace-nowrap font-bold"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800 mt-2">
                <button type="button" onClick={() => setModalEditarCliente(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-lg disabled:opacity-50">
                  {subindoArquivo ? 'Salvando...' : 'Salvar Alterações'}
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
          <div className="bg-[#1b263b] border border-[#d4af37]/50 rounded-xl w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center rounded-t-xl">
              <h3 className="text-lg font-bold text-[#d4af37]">Enviar por E-mail</h3>
              <button type="button" onClick={() => setModalEmailDoc({ aberto: false, arquivo: null, titulo: 'Novo Documento Disponível', mensagem: '' })} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={handleEnviarEmailDoc} className="p-5 space-y-4">
              <div className="bg-[#0d1b2a] p-3 rounded-lg border border-zinc-800 flex items-center gap-3">
                <span className="text-xs text-zinc-300 font-mono truncate">{modalEmailDoc.arquivo?.nome_original}</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Título do E-mail</label>
                <input type="text" required value={modalEmailDoc.titulo} onChange={e => setModalEmailDoc({...modalEmailDoc, titulo: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Mensagem (Opcional)</label>
                <textarea rows="4" placeholder="Escreva uma mensagem adicional..." value={modalEmailDoc.mensagem} onChange={e => setModalEmailDoc({...modalEmailDoc, mensagem: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none"></textarea>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalEmailDoc({ aberto: false, arquivo: null, titulo: 'Novo Documento Disponível', mensagem: '' })} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-lg">
                  {subindoArquivo ? 'A enviar...' : 'Enviar E-mail'}
                </button>
              </div>
            </form>
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