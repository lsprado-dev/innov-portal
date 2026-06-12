'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { enviarEmailDemanda } from '../../lib/email'; 

// Dicionário rápido para mapear nome da equipe para e-mail
const OBTER_EMAIL_FUNCIONARIO = {
  'Lucas (Financeiro)': 'lucas@innovbusiness.com.br'
};

// Função de Criptografia Reversível para salvar de forma segura no Supabase
const encriptarSenha = (text) => {
  if (!text) return '';
  return btoa(text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join(''));
};

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
const IconFinanceiroLarge = () => <svg className="w-8 h-8 text-[#d4af37] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// Nova inteligência de meses do Financeiro
const CICLO_FINANCEIRO = [
  { id: '01', ref: 'Janeiro', pag: 'Fevereiro' },
  { id: '02', ref: 'Fevereiro', pag: 'Março' },
  { id: '03', ref: 'Março', pag: 'Abril' },
  { id: '04', ref: 'Abril', pag: 'Maio' },
  { id: '05', ref: 'Maio', pag: 'Junho' },
  { id: '06', ref: 'Junho', pag: 'Julho' },
  { id: '07', ref: 'Julho', pag: 'Agosto' },
  { id: '08', ref: 'Agosto', pag: 'Setembro' },
  { id: '09', ref: 'Setembro', pag: 'Outubro' },
  { id: '10', ref: 'Outubro', pag: 'Novembro' },
  { id: '11', ref: 'Novembro', pag: 'Dezembro' },
  { id: '12', ref: 'Dezembro', pag: 'Jan de 2027' }
];

const IconFolderSolid = () => <svg className="w-6 h-6 text-[#d4af37]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>;
const IconFile = () => <svg className="w-6 h-6 text-[#d4af37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const IconSearch = () => <svg className="w-4 h-4 text-zinc-500 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconMiniClock = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconCheck = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>;
const IconClip = () => <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const IconChatList = () => <svg className="w-6 h-6 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const IconEye = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>;
const IconRestore = () => <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

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

export default function ClientePage({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { id } = params;

  const [cliente, setCliente] = useState(null);
  
  const [abaPrincipal, setAbaPrincipal] = useState('pastas'); 
  const [pastaAtiva, setPastaAtiva] = useState(null); 
  
  // ESTADOS DE PASTAS E SUBPASTAS
  const [pastas, setPastas] = useState([]);
  const [subpastaAtiva, setSubpastaAtiva] = useState(null);

  // ESTADOS PARA O BOTÃO MOVER
  const [arquivoMovendo, setArquivoMovendo] = useState(null);
  const [destinoPastaMover, setDestinoPastaMover] = useState('');

  const [arquivos, setArquivos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [itensLixeira, setItensLixeira] = useState([]);
  const [novoPedido, setNovoPedido] = useState('');

  const [alertasGlobaisPendentes, setAlertasGlobaisPendentes] = useState(0);

  // ESTADOS DO MODAL DE PERFIL E SENHA
  const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [alertasSemArquivo, setAlertasSemArquivo] = useState({});
  const [boletosSolicitados, setBoletosSolicitados] = useState([]); // Memória anti-spam
  const [mensalidadesPagas, setMensalidadesPagas] = useState([]); // Memória do checkbox

  const [toasts, setToasts] = useState([]); // Memória dos Toasts
  const [carregando, setCarregando] = useState(true);
  const [subindoArquivo, setSubindoArquivo] = useState(false);

  // FUNÇÃO MÁGICA DOS TOASTS (Remove sozinho após 4 segundos)
  function mostrarToast(mensagem, tipo = 'sucesso') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }
  const [operador, setOperador] = useState('Desconhecido');
  const [isInterno, setIsInterno] = useState(false);
  
  const [busca, setBusca] = useState('');
  const [mostrarAutocomplete, setMostrarAutocomplete] = useState(false);

  const [enviosPre, setEnviosPre] = useState([
    { id: 1, descricao: '', arquivo: null }
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
      const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();
      if (error || !data) {
        alert('Cliente não encontrado.');
        router.push(tipoSalvo === 'interno' ? '/' : '/login');
        return;
      }
      setCliente(data);
      setCarregando(false);
      atualizarBadgeGlobal(id);
    }
    carregarCliente();
  }, [id, router]);

  useEffect(() => {
    setBusca(''); 
    setMostrarAutocomplete(false);
    
    // Reset da subpasta ao trocar de aba principal ou setor
    if (abaPrincipal === 'pastas') {
      setSubpastaAtiva(null);
    }

    carregarDadosDaAba();
  }, [abaPrincipal, pastaAtiva, id]);

  async function atualizarBadgeGlobal(clienteId) {
    if (!clienteId) return;
    const { data } = await supabase.from('alertas_clientes').select('id').eq('cliente_id', clienteId).eq('status', 'pendente');
    setAlertasGlobaisPendentes(data ? data.length : 0);
  }

  async function carregarDadosDaAba() {
    setArquivos([]);
    setPedidos([]);
    setPastas([]);
    setItensLixeira([]);
    
    if (abaPrincipal === 'pastas' && pastaAtiva) {
      // 1. Carrega subpastas
      const resPastas = await supabase.from('pastas_portal').select('*').eq('cliente_id', id).eq('setor', pastaAtiva).order('nome');
      if (resPastas.data) setPastas(resPastas.data);

      // 2. Carrega arquivos ativos (fora da lixeira)
      const { data } = await supabase.from('arquivos_portal').select('*').eq('cliente_id', id).eq('setor', pastaAtiva).is('data_exclusao', null).order('criado_em', { ascending: false });
      if (data) setArquivos(data);

      // 3. Carrega status de pagamentos manuais (apenas Financeiro)
      if (pastaAtiva === 'financeiro') {
        const { data: pagas } = await supabase.from('mensalidades_status').select('mes_ref').eq('cliente_id', id);
        if (pagas) setMensalidadesPagas(pagas.map(p => p.mes_ref));
      }
    } 
    else if (abaPrincipal === 'envios') {
      const { data } = await supabase.from('envios_cliente').select('*').eq('cliente_id', id).is('data_exclusao', null).order('criado_em', { ascending: false });
      if (data) setArquivos(data);
    } 
    else if (abaPrincipal === 'solicitacoes') {
      const { data } = await supabase.from('pedidos_cliente').select('*').eq('cliente_id', id).order('criado_em', { ascending: false });
      if (data) setPedidos(data);
    } 
    else if (abaPrincipal === 'alertas') {
      const { data } = await supabase.from('alertas_clientes').select('*').eq('cliente_id', id).order('criado_em', { ascending: false });
      
      if (data) {
        setAlertas(data);
        const tipoSalvo = localStorage.getItem('usuario_tipo');
        if (tipoSalvo !== 'interno') {
          const naoLidos = data.filter(a => !a.visualizado_em && a.status === 'pendente').map(a => a.id);
          if (naoLidos.length > 0) {
            await supabase.from('alertas_clientes').update({ visualizado_em: new Date().toISOString() }).in('id', naoLidos);
            await registrarAuditoria('ALERTA_VISUALIZADO', `O cliente visualizou ${naoLidos.length} cobrança(s)/pendência(s) pendente(s) no portal.`);
          }
        }
      }
    }
    else if (abaPrincipal === 'lixeira') {
      // Carrega arquivos apagados
      const reqArq = supabase.from('arquivos_portal').select('*').eq('cliente_id', id).not('data_exclusao', 'is', null);
      const reqEnv = supabase.from('envios_cliente').select('*').eq('cliente_id', id).not('data_exclusao', 'is', null);
      
      const [resArq, resEnv] = await Promise.all([reqArq, reqEnv]);
      
      let lixeiraCompleta = [];
      if (resArq.data) lixeiraCompleta = [...lixeiraCompleta, ...resArq.data.map(i => ({...i, origem: 'portal'}))];
      if (resEnv.data) lixeiraCompleta = [...lixeiraCompleta, ...resEnv.data.map(i => ({...i, origem: 'envios'}))];
      
      lixeiraCompleta.sort((a, b) => new Date(b.data_exclusao) - new Date(a.data_exclusao));
      setItensLixeira(lixeiraCompleta);
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

  // ===============================================
  // GESTÃO DE PASTAS (APENAS ADMIN)
  // ===============================================
  async function handleCriarPasta() {
    const nomePasta = prompt('Qual é o nome da nova pasta?');
    if (!nomePasta || nomePasta.trim() === '') return;
    
    const { error } = await supabase.from('pastas_portal').insert([{
      cliente_id: id,
      setor: pastaAtiva,
      nome: nomePasta.trim(),
      parent_id: subpastaAtiva || null // MAGIA: Se ele estiver dentro de uma pasta, salva como filha dela!
    }]);

    if (!error) {
      await registrarAuditoria('PASTA_CRIADA', `Criou a pasta "${nomePasta.trim()}" no setor de ${pastaAtiva}.`);
      carregarDadosDaAba();
    }
  }

  async function handleRenomearPasta(pasta) {
    const novoNome = prompt('Renomear pasta para:', pasta.nome);
    if (!novoNome || novoNome.trim() === '' || novoNome === pasta.nome) return;

    const { error } = await supabase.from('pastas_portal').update({ nome: novoNome.trim() }).eq('id', pasta.id);
    if (!error) carregarDadosDaAba();
  }

  async function handleDeletarPasta(pasta) {
    if (!confirm(`Atenção: Tem certeza que deseja excluir a pasta "${pasta.nome}"?\n\nOs arquivos dentro dela NÃO serão apagados, eles serão movidos automaticamente para a tela inicial deste setor para evitar perda de dados.`)) return;
    
    await supabase.from('pastas_portal').delete().eq('id', pasta.id);
    setSubpastaAtiva(null);
    carregarDadosDaAba();
  }

  // ===============================================
  // GESTÃO DE ARQUIVOS E FLUXOS COM TOASTS
  // ===============================================
  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file || !pastaAtiva) return;

    if (file.size > 15 * 1024 * 1024) return mostrarToast('O ficheiro excede o tamanho máximo de 15MB.', 'erro');

    setSubindoArquivo(true);
    const timestamp = Date.now();
    const caminhoArquivo = `${id}/${pastaAtiva}/${timestamp}_${file.name}`;
    const { error: storageError } = await supabase.storage.from('documentos').upload(caminhoArquivo, file);

    if (storageError) {
      mostrarToast('Erro no Storage: ' + storageError.message, 'erro');
      setSubindoArquivo(false);
      return;
    }

    await supabase.from('arquivos_portal').insert([{ cliente_id: id, setor: pastaAtiva, subpasta_id: subpastaAtiva, nome_original: file.name, caminho_storage: caminhoArquivo, enviado_por: operador }]);

    mostrarToast('Documento publicado com sucesso!', 'sucesso');
    await registrarAuditoria('ARQUIVO_UPLOAD', `Subiu o documento "${file.name}" na pasta ${pastaAtiva}.`);
    carregarDadosDaAba();
    setSubindoArquivo(false);
  }

  async function handleUploadFinanceiro(e, mesRef) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return mostrarToast('O ficheiro excede 15MB.', 'erro');

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
    carregarDadosDaAba();
    setSubindoArquivo(false);
  }

  async function handleSolicitarBoleto(mesRef) {
    if (!confirm(`Deseja solicitar à equipe o reenvio do boleto referente a ${mesRef}?`)) return;
    
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
  }

  async function confirmarMovimentacao(e) {
    e.preventDefault();
    if (!arquivoMovendo) return;
    
    setSubindoArquivo(true);
    const destino = destinoPastaMover === '' ? null : destinoPastaMover;
    const { error } = await supabase.from('arquivos_portal').update({ subpasta_id: destino }).eq('id', arquivoMovendo.id);
    
    if (!error) {
      mostrarToast('Arquivo movido com sucesso!', 'sucesso');
      setArquivoMovendo(null);
      setDestinoPastaMover('');
      carregarDadosDaAba();
    } else {
      mostrarToast('Erro ao mover arquivo: ' + error.message, 'erro');
    }
    setSubindoArquivo(false);
  }

  async function handleMoverParaLixeira(arq, origem) {
    if (!confirm('Deseja mover este arquivo para a Lixeira? Ele ficará salvo por 30 dias.')) return;
    const tabela = origem === 'portal' ? 'arquivos_portal' : 'envios_cliente';
    const { error } = await supabase.from(tabela).update({ data_exclusao: new Date().toISOString() }).eq('id', arq.id);
    if (!error) { mostrarToast('Movido para a lixeira.', 'aviso'); await registrarAuditoria('ARQUIVO_LIXEIRA', `Moveu o arquivo para a lixeira.`); carregarDadosDaAba(); }
  }

  async function handleRestaurarDaLixeira(arq) {
    const tabela = arq.origem === 'portal' ? 'arquivos_portal' : 'envios_cliente';
    const { error } = await supabase.from(tabela).update({ data_exclusao: null }).eq('id', arq.id);
    if (!error) { mostrarToast('Arquivo restaurado!', 'sucesso'); carregarDadosDaAba(); }
  }

  async function handleDeletarPermanente(arq) {
    if (!confirm('PERIGO: Este arquivo será apagado permanentemente. Deseja continuar?')) return;
    await supabase.storage.from('documentos').remove([arq.caminho_storage]);
    const tabela = arq.origem === 'portal' ? 'arquivos_portal' : 'envios_cliente';
    await supabase.from(tabela).delete().eq('id', arq.id);
    mostrarToast('Arquivo deletado permanentemente.', 'aviso');
    carregarDadosDaAba();
  }

  async function handleEsvaziarLixeira() {
    if (!confirm('Esvaziar a lixeira agora? TODOS os arquivos aqui serão DELETADOS PERMANENTEMENTE.')) return;
    setSubindoArquivo(true);
    for (const arq of itensLixeira) {
      await supabase.storage.from('documentos').remove([arq.caminho_storage]);
      const tabela = arq.origem === 'portal' ? 'arquivos_portal' : 'envios_cliente';
      await supabase.from(tabela).delete().eq('id', arq.id);
    }
    mostrarToast('Lixeira esvaziada com sucesso.', 'sucesso');
    carregarDadosDaAba();
    setSubindoArquivo(false);
  }

  async function handleRenomear(arquivoId, nomeAtual) {
    const novoNome = prompt('Digite o novo nome para o ficheiro:', nomeAtual);
    if (!novoNome || novoNome.trim() === '' || novoNome === nomeAtual) return;
    const { error } = await supabase.from('arquivos_portal').update({ nome_original: novoNome.trim() }).eq('id', arquivoId);
    if (!error) { mostrarToast('Arquivo renomeado.', 'sucesso'); carregarDadosDaAba(); }
  }

  function baixarDocumento(caminhoStorage) {
    const { data } = supabase.storage.from('documentos').getPublicUrl(caminhoStorage);
    window.open(data.publicUrl, '_blank');
  }

  async function handleAlterarSenha(e) {
    e.preventDefault();
    if (novaSenha.trim().length < 6) return mostrarToast('A nova senha deve possuir no mínimo 6 caracteres.', 'erro');
    setSalvandoSenha(true);
    const { error } = await supabase.from('clientes').update({ senha: encriptarSenha(novaSenha.trim()), senha_alterada: true }).eq('id', id);
    if (!error) {
      mostrarToast('Senha atualizada com sucesso!', 'sucesso');
      setNovaSenha('');
      setMostrarModalPerfil(false);
    } else {
      mostrarToast('Erro ao atualizar a senha: ' + error.message, 'erro');
    }
    setSalvandoSenha(false);
  }

  function handleLogout() {
    localStorage.removeItem('usuario_nome'); localStorage.removeItem('usuario_tipo'); localStorage.removeItem('usuario_id');
    router.push('/login');
  }

  async function handleResponderAlerta(e, alerta) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return mostrarToast('O ficheiro excede 15MB.', 'erro');

    setSubindoArquivo(true);
    const timestamp = Date.now();
    const caminhoArquivo = `${id}/respostas/${timestamp}_${file.name}`;
    const { error: storageError } = await supabase.storage.from('documentos').upload(caminhoArquivo, file);
    
    if (storageError) { mostrarToast('Erro no upload: ' + storageError.message, 'erro'); setSubindoArquivo(false); return; }

    const { error: dbError } = await supabase.from('alertas_clientes').update({ status: 'respondido', caminho_arquivo: caminhoArquivo }).eq('id', alerta.id);
    if (!dbError) {
      mostrarToast('Documento enviado! A Innovative foi notificada.', 'sucesso');
      carregarDadosDaAba();
      atualizarBadgeGlobal(id);
    }
    setSubindoArquivo(false);
  }

  async function handleConcluirDemanda0Arquivo(alerta) {
    if (!confirm('Pretende marcar esta demanda como concluída sem anexar arquivos?')) return;
    setSubindoArquivo(true);
    const { error } = await supabase.from('alertas_clientes').update({ status: 'respondido' }).eq('id', alerta.id);
    if (!error) {
      mostrarToast('Demanda concluída com sucesso!', 'sucesso');
      carregarDadosDaAba();
      atualizarBadgeGlobal(id);
    }
    setSubindoArquivo(false);
  }

  function adicionarMaisUm() { setEnviosPre([...enviosPre, { id: Date.now(), descricao: '', arquivo: null }]); }
  function removerLineEnvio(linhaId) { if (enviosPre.length === 1) return; setEnviosPre(enviosPre.filter(item => item.id !== linhaId)); }
  function alterarDescricao(linhaId, texto) { setEnviosPre(enviosPre.map(item => item.id === linhaId ? { ...item, descricao: texto } : item)); }
  function alterarArquivo(linhaId, arquivoSelecionado) { setEnviosPre(enviosPre.map(item => item.id === linhaId ? { ...item, arquivo: arquivoSelecionado } : item)); }

  async function handleEnviarParaContabilidade(e) {
    e.preventDefault();
    const validos = enviosPre.filter(item => item.arquivo && item.descricao.trim());
    if (validos.length === 0) return mostrarToast('Preencha a descrição e selecione um ficheiro.', 'erro');

    for (const item of validos) {
      if (item.arquivo.size > 15 * 1024 * 1024) return mostrarToast(`O ficheiro "${item.arquivo.name}" excede 15MB.`, 'erro');
    }

    setSubindoArquivo(true);
    for (const item of validos) {
      const timestamp = Date.now();
      const caminhoArquivo = `${id}/recebidos/${timestamp}_${item.arquivo.name}`;
      await supabase.storage.from('documentos').upload(caminhoArquivo, item.arquivo);
      await supabase.from('envios_cliente').insert([{ cliente_id: id, nome_documento: item.descricao.trim(), nome_original: item.arquivo.name, caminho_storage: caminhoArquivo, status: 'pendente' }]);
    }

    mostrarToast('Documentos enviados com sucesso!', 'sucesso');
    setEnviosPre([{ id: 1, descricao: '', arquivo: null }]);
    carregarDadosDaAba();
    setSubindoArquivo(false);
  }

  async function handleEnviarPedido(e) {
    e.preventDefault();
    if (!novoPedido.trim()) return;
    
    setSubindoArquivo(true);
    await supabase.from('pedidos_cliente').insert([{ cliente_id: id, descricao: novoPedido.trim(), status: 'pendente' }]);

    mostrarToast('A sua solicitação foi enviada para a Innovative!', 'sucesso');
    setNovoPedido('');
    carregarDadosDaAba();
    setSubindoArquivo(false);
  }

  const arquivosFiltradosDaBusca = arquivos.filter((arq) => {
    const textoBusca = busca.toLowerCase();
    const nomeOriginal = arq.nome_original?.toLowerCase() || '';
    const nomeDoc = arq.nome_documento?.toLowerCase() || '';
    const matchBusca = nomeOriginal.includes(textoBusca) || nomeDoc.includes(textoBusca);
    
    if (abaPrincipal === 'pastas') {
      return matchBusca && (arq.subpasta_id || null) === subpastaAtiva;
    }
    return matchBusca;
  });

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
  
  // Filtra as pastas para mostrar apenas as que estão no nível atual
  const pastasAtuais = pastas.filter(p => (p.parent_id || null) === (subpastaAtiva || null));

  if (carregando) return <div className="min-h-screen bg-[#0d1b2a] text-white flex items-center justify-center">A carregar portal...</div>;

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white font-sans p-6 md:p-12 relative">
      
      {/* ==========================================
          MODAL DE MOVER ARQUIVO (APENAS ADMIN)
      ========================================== */}
      {arquivoMovendo && isInterno && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1b263b] border border-zinc-700 rounded-xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#d4af37]">Mover Arquivo</h3>
              <button onClick={() => setArquivoMovendo(null)} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <form onSubmit={confirmarMovimentacao} className="p-5 space-y-4">
              <p className="text-sm text-zinc-300">
                Selecione o destino para o arquivo <strong className="text-white block mt-1 truncate">{arquivoMovendo.nome_original}</strong>
              </p>
              <select 
                value={destinoPastaMover} 
                onChange={(e) => setDestinoPastaMover(e.target.value)}
                className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="">Pasta Principal (Raiz do Setor {pastaAtiva})</option>
                {pastas.map(p => (
                  <option key={p.id} value={p.id}>📂 {p.nome}</option>
                ))}
              </select>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setArquivoMovendo(null)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition">Cancelar</button>
                <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] hover:bg-yellow-500 px-6 py-2.5 rounded-lg text-sm font-extrabold transition shadow-lg">
                  {subindoArquivo ? 'A Mover...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GESTÃO DE PERFIL E TROCA DE SENHA */}
      {mostrarModalPerfil && cliente && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1b263b] border border-zinc-700 rounded-xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 bg-[#0d1b2a] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#d4af37]">Configurações da Conta</h3>
              <button onClick={() => setMostrarModalPerfil(false)} className="text-zinc-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Empresa / Razão Social</p>
                <p className="text-white text-sm font-semibold">{cliente.nome_empresa}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-0.5">CNPJ</p>
                  <p className="text-white text-sm font-mono">{cliente.cnpj}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Telemóvel</p>
                  <p className="text-white text-sm">{cliente.celular || 'Não cadastrado'}</p>
                </div>
              </div>
              
              <div className="border-t border-zinc-800 pt-5 mt-4">
                <h4 className="text-sm font-bold text-orange-400 mb-3 uppercase tracking-wider">Alterar Senha do Portal</h4>
                <form onSubmit={handleAlterarSenha} className="flex gap-2">
                  <input type="text" required placeholder="Introduza a nova senha..." value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="flex-1 bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-400" />
                  <button type="submit" disabled={salvandoSenha} className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-5 py-2 rounded-lg text-sm transition shadow-md">
                    {salvandoSenha ? 'A Gravar...' : 'Atualizar'}
                  </button>
                </form>
                <p className="text-[10px] text-zinc-500 mt-2">A senha salva será exigida já na sua próxima autenticação.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        
        {/* BARRA SUPERIOR COMPACTA */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 bg-[#1b263b]/30 p-4 rounded-xl border border-zinc-800/60 gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            {isInterno ? (
              <Link href="/" className="text-sm font-bold text-[#d4af37] hover:underline hover:text-yellow-400 transition">← Voltar para o Painel Admin</Link>
            ) : (
              <span className="text-xs text-zinc-500 font-bold tracking-wider uppercase">Portal Restrito do Cliente</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              Conectado como: <strong onClick={() => setMostrarModalPerfil(true)} className="text-[#d4af37] font-extrabold cursor-pointer hover:underline" title="Ver Perfil e Trocar Senha">{operador}</strong>
            </span>
            <button onClick={handleLogout} className="text-xs bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-4 py-2 rounded-lg transition-all font-bold">Sair</button>
          </div>
        </div>

        {/* CABEÇALHO DO CLIENTE COM LOGO */}
        {cliente && (
          <header className="mb-10 bg-[#1b263b] p-8 rounded-xl border border-zinc-800 shadow-xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-5">
                <img src="/logo.png" alt="Logo Innovative" className="w-20 h-20 object-contain drop-shadow-lg" />
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">{cliente.nome_empresa}</h1>
                  <p className="text-zinc-400 text-sm">CNPJ: {cliente.cnpj}</p>
                </div>
              </div>
              <span className="bg-[#0d1b2a] text-[#d4af37] px-4 py-2 rounded-lg text-sm font-bold border border-[#d4af37]/30">
                {cliente.regime_tributario}
              </span>
            </div>
          </header>
        )}

        {/* NAVEGAÇÃO PRINCIPAL INTELIGENTE */}
        <div className="flex flex-wrap gap-4 mb-8 border-b border-zinc-800 pb-px">
          <button onClick={() => setAbaPrincipal('pastas')} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaPrincipal === 'pastas' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconFolderTab /> Pastas de Arquivos
          </button>
          <button onClick={() => setAbaPrincipal('envios')} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaPrincipal === 'envios' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconUploadTab /> {isInterno ? 'Histórico de Envios' : 'Enviar Documentos'}
          </button>
          <button onClick={() => setAbaPrincipal('solicitacoes')} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaPrincipal === 'solicitacoes' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconChatTab /> {isInterno ? 'Histórico de Solicitações' : 'Solicitações'}
          </button>
          <button onClick={() => setAbaPrincipal('alertas')} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaPrincipal === 'alertas' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <IconBellTab /> {isInterno ? 'Documentos Solicitados' : 'Alertas / Cobranças'}
            {alertasGlobaisPendentes > 0 && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-black shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse border border-red-400">
                {alertasGlobaisPendentes}
              </span>
            )}
          </button>
          {isInterno && (
            <button onClick={() => setAbaPrincipal('lixeira')} className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 flex items-center ${abaPrincipal === 'lixeira' ? 'border-red-500 text-red-400' : 'border-transparent text-zinc-500 hover:text-red-400'}`}>
              <IconTrashTab /> Lixeira
            </button>
          )}
        </div>

        {/* ==========================================
            ABA 1: PASTAS PERMANENTES DE ARQUIVOS
        ========================================== */}
        {abaPrincipal === 'pastas' && (
          <>
            <div className="flex flex-col md:flex-row w-full gap-4 mb-10">
              <button onClick={() => setPastaAtiva('contabil')} className={`flex-1 w-full p-5 rounded-xl border transition-all text-left flex flex-col justify-between shadow-lg ${pastaAtiva === 'contabil' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800 hover:border-zinc-700'}`}>
                <IconFolderLarge />
                <h3 className="text-sm font-bold text-white mb-1">Contábil</h3>
                <p className="text-[10px] text-zinc-400">Balanços e DREs</p>
              </button>
              <button onClick={() => setPastaAtiva('fiscal')} className={`flex-1 w-full p-5 rounded-xl border transition-all text-left flex flex-col justify-between shadow-lg ${pastaAtiva === 'fiscal' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800 hover:border-zinc-700'}`}>
                <IconChartLarge />
                <h3 className="text-sm font-bold text-white mb-1">Fiscal</h3>
                <p className="text-[10px] text-zinc-400">Guias e Impostos</p>
              </button>
              <button onClick={() => setPastaAtiva('rh')} className={`flex-1 w-full p-5 rounded-xl border transition-all text-left flex flex-col justify-between shadow-lg ${pastaAtiva === 'rh' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800 hover:border-zinc-700'}`}>
                <IconUsersLarge />
                <h3 className="text-sm font-bold text-white mb-1">DP / RH</h3>
                <p className="text-[10px] text-zinc-400">Folhas e Recibos</p>
              </button>
              <button onClick={() => setPastaAtiva('contrato')} className={`flex-1 w-full p-5 rounded-xl border transition-all text-left flex flex-col justify-between shadow-lg ${pastaAtiva === 'contrato' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800 hover:border-zinc-700'}`}>
                <IconDocLarge />
                <h3 className="text-sm font-bold text-white mb-1">Contratos</h3>
                <p className="text-[10px] text-zinc-400">Atos e Alterações</p>
              </button>
              <button onClick={() => setPastaAtiva('financeiro')} className={`flex-1 w-full p-5 rounded-xl border transition-all text-left flex flex-col justify-between shadow-lg ${pastaAtiva === 'financeiro' ? 'border-[#d4af37] bg-zinc-800' : 'bg-[#1b263b] border-zinc-800 hover:border-[#d4af37]/50'}`}>
                <IconFinanceiroLarge />
                <h3 className="text-sm font-bold text-white mb-1">Financeiro</h3>
                <p className="text-[10px] text-zinc-400">Controle de mensalidades</p>
              </button>
            </div>

            {pastaAtiva === 'financeiro' ? (
              <div className="bg-[#1b263b] p-8 rounded-xl border border-[#d4af37]/30 shadow-xl mb-10">
                <div className="border-b border-zinc-800 pb-4 mb-6">
                  <h3 className="text-xl font-bold text-[#d4af37]">Gestão Financeira</h3>
                  <p className="text-sm text-zinc-400 mt-1">Anexe aqui os comprovantes referentes a cada competência. O vencimento ocorre sempre no mês subsequente.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {CICLO_FINANCEIRO.map((mes) => {
                    const comprovanteEnviado = arquivos.find(a => a.setor === 'financeiro' && a.caminho_storage?.includes(`/financeiro/${mes.ref}_`));
                    const pagoManualmente = mensalidadesPagas.includes(mes.ref);
                    const isPago = comprovanteEnviado || pagoManualmente;

                    // Lógica mágica de datas
                    const hoje = new Date();
                    const dataLiberacao = new Date(hoje.getFullYear(), parseInt(mes.id, 10), 10);
                    dataLiberacao.setHours(0, 0, 0, 0); 
                    
                    const estaLiberado = hoje >= dataLiberacao;
                    const mesAbertura = (parseInt(mes.id, 10) + 1) > 12 ? 1 : (parseInt(mes.id, 10) + 1);

                    // Estilização inteligente do Card
                    let estiloCard = '';
                    if (isPago) {
                      estiloCard = 'bg-emerald-500/10 border-emerald-500/40';
                    } else if (estaLiberado) {
                      estiloCard = 'bg-[#0d1b2a] border-zinc-700 shadow-[0_0_15px_rgba(212,175,55,0.05)]'; 
                    } else {
                      estiloCard = 'bg-[#0d1b2a]/30 border-zinc-800/30 opacity-50 grayscale pointer-events-none';
                    }

                    return (
                      <div key={mes.id} className={`p-4 rounded-xl border flex flex-col justify-between h-44 transition-all relative ${estiloCard}`}>
                        
                        {/* Cabeçalho do Card: Nome travado na esquerda, Checkbox na direita */}
                        <div className="flex justify-between items-start gap-2">
                          
                          {/* LADO ESQUERDO */}
                          <div className="flex-1">
                            <h4 className={`text-[11px] font-bold uppercase tracking-wide ${isPago ? 'text-emerald-400' : estaLiberado ? 'text-white' : 'text-zinc-500'}`}>Ref: {mes.ref}</h4>
                            <p className={`text-[11px] font-medium mt-0.5 ${isPago ? 'text-emerald-500/80' : estaLiberado ? 'text-zinc-400' : 'text-zinc-600'}`}>
                              Vencimento 20 de {mes.pag}
                            </p>
                            {isPago && (
                              <div className="mt-2">
                                <span className="bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">Pago</span>
                              </div>
                            )}
                          </div>

                          {/* LADO DIREITO */}
                          {(estaLiberado || isPago) && (
                            <div className="pointer-events-auto flex-shrink-0 z-10 pt-0.5">
                              <label className={`flex items-center gap-2 ${comprovanteEnviado ? 'cursor-default' : 'cursor-pointer'} group`} title={comprovanteEnviado ? "Pago via comprovante" : "Marcar como pago manualmente"}>
                                <span className={`text-[10px] font-bold text-white transition-all opacity-0 group-hover:opacity-100 ${isPago ? 'group-hover:text-emerald-400' : 'group-hover:text-[#d4af37]'}`}>Pago</span>
                                <input 
                                  type="checkbox" 
                                  checked={isPago} 
                                  disabled={!!comprovanteEnviado}
                                  onChange={() => togglePagoManual(mes.ref, isPago)} 
                                  className="w-5 h-5 cursor-pointer transition-colors"
                                  style={{ accentColor: isPago ? '#10b981' : '#d4af37' }} 
                                />
                              </label>
                            </div>
                          )}
                          
                        </div>
                        
                        <div className="mt-2">
                          {comprovanteEnviado ? (
                            <div className="flex flex-col gap-2 mt-1">
                              <div className="flex gap-2">
                                <button onClick={() => baixarDocumento(comprovanteEnviado.caminho_storage)} className="flex-1 text-[11px] border border-emerald-500/50 text-emerald-400 py-1.5 rounded font-bold shadow-sm hover:bg-emerald-500 hover:text-black transition pointer-events-auto">Ver Comprovante</button>
                                {isInterno && (
                                  <button onClick={() => handleMoverParaLixeira(comprovanteEnviado, 'portal')} className="px-2 bg-red-500/10 text-red-500 rounded border border-red-500/20 hover:bg-red-500 hover:text-white transition pointer-events-auto" title="Excluir"><IconTrashTab /></button>
                                )}
                              </div>
                            </div>
                          ) : estaLiberado ? (
                            <div className="flex flex-col gap-1.5 pointer-events-auto mt-1">
                              <label className="block text-center text-[11px] border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] py-1.5 rounded font-bold transition cursor-pointer shadow-sm">
                                {subindoArquivo ? 'Aguarde...' : '+ Anexar Comprovante'}
                                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => handleUploadFinanceiro(e, mes.ref)} disabled={subindoArquivo} />
                              </label>
                              {!isPago && (
                                <button 
                                  onClick={() => handleSolicitarBoleto(mes.ref)} 
                                  disabled={subindoArquivo || boletosSolicitados.includes(mes.ref)} 
                                  className={`block w-full text-center text-[10px] border py-1.5 rounded font-bold transition ${boletosSolicitados.includes(mes.ref) ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 cursor-not-allowed' : 'border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
                                >
                                  {boletosSolicitados.includes(mes.ref) ? 'Solicitação Enviada ✓' : 'Solicitar Boleto'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 mt-1">
                              <span className="block text-center text-[10px] text-zinc-600 py-2 border border-zinc-800/30 rounded font-bold">
                                Abre dia 10/{String(mesAbertura).padStart(2, '0')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : pastaAtiva && (
              <div className="bg-[#1b263b] p-8 rounded-xl border border-zinc-800 shadow-xl mb-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-4 mb-6 gap-4">
                  {/* BREADCRUMBS INTELIGENTES TIPO GOOGLE DRIVE */}
                  <h3 className="text-xl font-bold text-[#d4af37] capitalize flex items-center gap-2 flex-wrap">
                    <span className={`transition ${subpastaAtiva ? 'cursor-pointer hover:underline text-zinc-400 hover:text-white' : 'text-[#d4af37]'}`} onClick={() => setSubpastaAtiva(null)}>
                      Setor {pastaAtiva}
                    </span>
                    {caminhoPastas.map((p, index) => (
                      <span key={p.id} className="flex items-center gap-2">
                        <span className="text-zinc-600">/</span>
                        <span 
                          className={`transition ${index === caminhoPastas.length - 1 ? 'text-[#d4af37]' : 'cursor-pointer hover:underline text-zinc-400 hover:text-white'}`}
                          onClick={() => setSubpastaAtiva(p.id)}
                        >
                          {index === caminhoPastas.length - 1 && <IconFolderSolid />} {p.nome}
                        </span>
                      </span>
                    ))}
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
                    <div className="relative w-full sm:w-64">
                      <input type="text" placeholder="Procurar documento..." value={busca} onChange={(e) => { setBusca(e.target.value); setMostrarAutocomplete(true); }} onFocus={() => setMostrarAutocomplete(true)} onBlur={() => setTimeout(() => setMostrarAutocomplete(false), 200)} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                      {mostrarAutocomplete && busca.length > 0 && arquivosFiltradosDaBusca.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d1b2a] border border-zinc-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                          {arquivosFiltradosDaBusca.map((arq) => (
                            <div key={`auto-${arq.id}`} onClick={() => { setBusca(arq.nome_original); setMostrarAutocomplete(false); }} className="px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer truncate border-b border-zinc-800/50 last:border-0 transition flex items-center">
                              <IconSearch /> {arq.nome_original}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {isInterno && (
                      <div className="flex gap-2">
                        <button onClick={handleCriarPasta} className="bg-zinc-800 text-zinc-300 px-4 py-2.5 rounded-lg font-bold border border-zinc-700 hover:bg-zinc-700 hover:text-white transition shadow-lg text-sm whitespace-nowrap">
                          + Nova Pasta
                        </button>
                        <label className="bg-[#d4af37] text-[#0d1b2a] px-4 py-2.5 rounded-lg font-bold hover:bg-yellow-500 transition shadow-lg cursor-pointer text-sm text-center whitespace-nowrap">
                          {subindoArquivo ? 'A Enviar...' : 'Enviar Arquivo'}
                          <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleUpload} disabled={subindoArquivo} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* EXIBIÇÃO DE SUBPASTAS DINÂMICAS */}
                {pastasAtuais.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {pastasAtuais.map(pasta => (
                      <div key={pasta.id} className="p-4 bg-[#0d1b2a] border border-zinc-700 rounded-lg flex justify-between items-center group cursor-pointer hover:border-[#d4af37] transition shadow-md">
                        <div className="flex items-center gap-3 flex-1 overflow-hidden" onClick={() => setSubpastaAtiva(pasta.id)}>
                          <IconFolderSolid /> <span className="font-bold text-zinc-200 truncate">{pasta.nome}</span>
                        </div>
                        {isInterno && (
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition pl-2">
                            <button onClick={(e) => { e.stopPropagation(); handleRenomearPasta(pasta); }} className="text-[10px] bg-zinc-800 hover:bg-zinc-600 px-2 py-1 rounded font-bold text-zinc-300">Renomear</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeletarPasta(pasta); }} className="text-[10px] bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-2 py-1 rounded font-bold border border-red-500/20">Excluir</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* EXIBIÇÃO DE ARQUIVOS */}
                {arquivosFiltradosDaBusca.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">Nenhum documento nesta área ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {arquivosFiltradosDaBusca.map((arq) => (
                      <div key={arq.id} className="p-4 bg-[#0d1b2a] rounded-lg border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <IconFile />
                          <div className="min-w-0 w-full">
                            <p className="text-sm text-zinc-200 font-medium truncate max-w-md">{arq.nome_original}</p>
                            <p className="text-[11px] text-zinc-500 mt-0.5 truncate">Enviado por: <span className="text-zinc-400 font-semibold">{arq.enviado_por}</span> em {new Date(arq.criado_em).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                          {isInterno && (
                            <>
                              <button onClick={() => setArquivoMovendo(arq)} className="flex-1 sm:flex-none text-xs bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/30 px-3 py-2 rounded-lg text-blue-400 font-medium transition">Mover</button>
                              <button onClick={() => handleRenomear(arq.id, arq.nome_original)} className="flex-1 sm:flex-none text-xs bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/60 px-3 py-2 rounded-lg text-zinc-300 font-medium transition">Renomear</button>
                              <button onClick={() => handleMoverParaLixeira(arq, 'portal')} className="flex-1 sm:flex-none text-xs bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-2 rounded-lg text-red-400 font-medium transition">Excluir</button>
                            </>
                          )}
                          <button onClick={() => baixarDocumento(arq.caminho_storage)} className="flex-1 sm:flex-none text-xs border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] px-4 py-2.5 rounded-lg font-bold transition-all shadow-sm whitespace-nowrap">Visualizar / Baixar</button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <p className="text-xs text-zinc-400 mt-1">Insira a descrição e anexe os ficheiros (PDF ou Imagem).</p>
                </header>
                <form onSubmit={handleEnviarParaContabilidade} className="space-y-4">
                  {enviosPre.map((item) => (
                    <div key={item.id} className="p-4 bg-[#0d1b2a] rounded-lg border border-zinc-800/60 flex flex-col md:flex-row items-end md:items-center gap-4">
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Qual é o assunto/documento?</label>
                        <input type="text" required placeholder="Ex: Extrato Bancário de Maio..." value={item.descricao} onChange={(e) => alterarDescricao(item.id, e.target.value)} className="w-full bg-[#1b263b] border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
                      </div>
                      <div className="w-full md:w-auto">
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Escolher Ficheiro</label>
                        <input type="file" required accept="application/pdf,image/*" onChange={(e) => alterarArquivo(item.id, e.target.files[0])} className="text-xs text-zinc-400 bg-[#1b263b] border border-zinc-800 rounded-lg p-2 w-full cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200" />
                      </div>
                      {enviosPre.length > 1 && (
                        <button type="button" onClick={() => removerLineEnvio(item.id)} className="text-xs text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white px-3 py-2.5 rounded-lg border border-red-500/20 transition">Remover</button>
                      )}
                    </div>
                  ))}
                  <div className="pt-2 flex flex-col sm:flex-row sm:justify-between gap-3">
                    <button type="button" onClick={adicionarMaisUm} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-5 py-2.5 rounded-lg text-sm transition">Anexar + 1 Documento</button>
                    <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] font-extrabold px-6 py-2.5 rounded-lg text-sm hover:bg-yellow-500 transition shadow-lg disabled:opacity-50">
                      {subindoArquivo ? 'A enviar ficheiros...' : 'Enviar Tudo'}
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
                        <div key={`auto-envio-${arq.id}`} onClick={() => { setBusca(arq.nome_documento); setMostrarAutocomplete(false); }} className="px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer truncate border-b border-zinc-800/50 last:border-0 transition flex items-center">
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
                          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">Ficheiro: <span className="text-zinc-400 font-mono break-all">{arq.nome_original}</span> | Colocado em {new Date(arq.criado_em).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border whitespace-nowrap ${arq.status === 'pendente' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                          {arq.status === 'pendente' ? 'Pendente' : 'Salvo no Histórico'}
                        </span>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {isInterno && (
                            <button onClick={() => handleMoverParaLixeira(arq, 'envios')} className="flex-1 sm:flex-none text-xs bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-2.5 rounded-lg text-red-400 font-medium transition">Excluir</button>
                          )}
                          <button onClick={() => baixarDocumento(arq.caminho_storage)} className="flex-1 sm:flex-none text-xs border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0d1b2a] px-4 py-2.5 rounded-lg font-bold transition-all shadow-sm">Baixar</button>
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
              <h3 className="text-xl font-bold text-[#d4af37] capitalize whitespace-nowrap">Central de Atendimento e Solicitações</h3>
              <p className="text-xs text-zinc-400 mt-1">Envie pedidos ou recados diretos para a nossa equipa.</p>
            </div>
            {!isInterno && (
              <form onSubmit={handleEnviarPedido} className="mb-8 bg-[#0d1b2a] p-5 rounded-lg border border-zinc-800/60">
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-3">O que precisa hoje?</label>
                <textarea required rows="3" placeholder="Ex: Gostaria da minha guia DAS do mês de Janeiro..." value={novoPedido} onChange={(e) => setNovoPedido(e.target.value)} className="w-full bg-[#1b263b] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none mb-3"></textarea>
                <div className="flex justify-end">
                  <button type="submit" disabled={subindoArquivo} className="bg-[#d4af37] text-[#0d1b2a] font-extrabold px-6 py-2.5 rounded-lg text-sm hover:bg-yellow-500 transition shadow-lg disabled:opacity-50">
                    {subindoArquivo ? 'A Enviar...' : 'Enviar Solicitação para Equipa'}
                  </button>
                </div>
              </form>
            )}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white mb-4">Histórico de Pedidos</h4>
              {pedidos.length === 0 ? (
                <p className="text-zinc-500 text-sm">Nenhuma solicitação encontrada neste perfil.</p>
              ) : (
                pedidos.map(pedido => (
                  <div key={pedido.id} className="p-4 bg-[#0d1b2a] rounded-lg border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <IconChatList />
                        <span className="text-[11px] text-zinc-500">{new Date(pedido.criado_em).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-sm text-zinc-200 font-medium leading-relaxed">"{pedido.descricao}"</p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded border uppercase whitespace-nowrap ${pedido.status === 'pendente' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                        {pedido.status === 'pendente' ? <><IconMiniClock />Enviado para a Equipe</> : <><IconCheck /> Atendido</>}
                      </span>
                    </div>
                  </div>
                ))
              )}
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
              {alertas.length === 0 ? (
                <p className="text-zinc-500 text-sm">Nenhuma pendência neste momento. Tudo em dia!</p>
              ) : (
                alertas.map(alerta => (
                  <div key={alerta.id} className={`p-6 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${alerta.status === 'pendente' ? 'bg-[#0d1b2a] border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.05)]' : 'bg-[#0d1b2a]/50 border-emerald-500/20 opacity-70'}`}>
                    <div className="flex-1 w-full md:pr-6">
                      
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded uppercase whitespace-nowrap ${alerta.status === 'pendente' ? 'bg-orange-500 text-black shadow-sm' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                          {alerta.status === 'pendente' ? <><IconMiniClock /> Envio Necessário</> : <><IconCheck /> Resolvido</>}
                        </span>
                        
                        {alerta.status === 'pendente' && alerta.prazo && (
                          <span className="text-xs font-black text-white bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] border border-red-600 px-3 py-1 rounded-md uppercase tracking-wider animate-pulse">
                            🚨 Prazo {formatarPrazoSemAno(alerta.prazo)}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-lg font-bold text-white mb-2">{alerta.titulo}</h4>
                      {alerta.mensagem && <p className="text-sm text-zinc-300 leading-relaxed mb-3">{alerta.mensagem}</p>}
                      
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
                            Concluído sem ficheiros
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

      </div>

      {/* SISTEMA DE TOASTS PREMIUM */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
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