'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase'; // Ajuste o caminho se a sua pasta lib estiver noutro local
import { dispararPush } from '../lib/push'; // Ajuste o caminho

// Dicionário rápido de funcionários para o Select de delegação
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

// Ícones Premium
const IconSend = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const IconPin = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const IconChatTeam = () => <svg className="w-6 h-6 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>;

export default function InnovChat({ operador, onFechar }) {
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [modoDelegar, setModoDelegar] = useState(false);
  const [subindo, setSubindo] = useState(false);
  const [usuariosOnline, setUsuariosOnline] = useState([]); // NOVO ESTADO: PRESENÇA ONLINE
  
  const [formDelegar, setFormDelegar] = useState({
    atribuido_para: 'Maria (Societário)',
    descricao: '',
    prazo: '',
    prioridade: 'Média'
  });

  const chatFimRef = useRef(null);

  // 1. Carregar Histórico e Ligar o Motor Realtime (WebSockets)
  useEffect(() => {
    async function carregarChat() {
      const { data } = await supabase
        .from('chat_interno')
        .select('*')
        .order('criado_em', { ascending: true })
        .limit(100);
      if (data) setMensagens(data);
    }
    carregarChat();

    // A mágica da fluidez: Ouve a tabela do Supabase ao vivo
    const canalChat = supabase.channel('chat_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_interno' }, (payload) => {
        setMensagens(prev => {
          const jaExiste = prev.some(m => m.mensagem === payload.new.mensagem && m.remetente === payload.new.remetente);
          if (jaExiste) return prev;
          return [...prev, payload.new];
        });
        
        // Se a pessoa estiver em outra aba, aumenta a bolinha de notificação!
        if (!isVisivel && setMensagensNaoLidas) {
          setMensagensNaoLidas(prev => prev + 1);
        }
      })
      .subscribe();

    // SISTEMA DE PRESENÇA MÁGICA (ONLINE/OFFLINE EM TEMPO REAL)
    const canalPresenca = supabase.channel('chat_presenca');
    canalPresenca
      .on('presence', { event: 'sync' }, () => {
        const estado = canalPresenca.presenceState();
        const onlineAgrupado = Object.values(estado).flat().map(user => user.operador);
        setUsuariosOnline([...new Set(onlineAgrupado)]); // Guarda apenas valores únicos
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await canalPresenca.track({ operador: operador }); // Sinaliza ao mundo que você entrou!
        }
      });

    return () => { 
      supabase.removeChannel(canalChat); 
      supabase.removeChannel(canalPresenca);
    };
  }, [operador]);

  // 2. Rolar para o final suavemente sempre que houver mensagem nova
  useEffect(() => {
    if (chatFimRef.current) {
      chatFimRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens]);

  // 3. Enviar Mensagem Normal
  async function handleEnviarChat(e) {
    e.preventDefault();
    if (!novaMensagem.trim()) return;
    
    setSubindo(true);
    const texto = novaMensagem.trim();
    setNovaMensagem(''); // Limpa o input instantaneamente para fluidez

    // Adiciona na tela instantaneamente antes mesmo de ir para o banco (Estilo WhatsApp)
    const msgTemporaria = { id: Date.now(), remetente: operador, mensagem: texto, tipo: 'texto', criado_em: new Date().toISOString() };
    setMensagens(prev => [...prev, msgTemporaria]);

    const { error } = await supabase.from('chat_interno').insert([{
      remetente: operador,
      mensagem: texto,
      tipo: 'texto'
    }]);

    if (error) {
      alert("Erro ao enviar mensagem para o banco: " + error.message);
    } else {
      // Disparo inteligente de Notificações
      if (operador === 'Victor (Admin)') {
        dispararPush('interno', `Mensagem Victor)`, texto);
      } else {
        dispararPush('interno', `Nova mensagem no InnovChat`, `${operador.split(' ')[0]}: ${texto}`);
      }
    }
    setSubindo(false);
  }

  // 4. Delegação e Criação de Demanda Embutida
  async function handleDelegar(e) {
    e.preventDefault();
    if (!formDelegar.descricao.trim() || !formDelegar.prazo) return;
    setSubindo(true);

    // Salva a tarefa oficial na tabela de Demandas
    const { error: errDemanda } = await supabase.from('demandas_equipe').insert([{
      criado_por: operador,
      atribuido_para: formDelegar.atribuido_para,
      descricao: formDelegar.descricao.trim(),
      data_entrega: formDelegar.prazo,
      prioridade: formDelegar.prioridade,
      status: 'pendente'
    }]);

    if (!errDemanda) {
      // Salva o balão bonitão no chat
      await supabase.from('chat_interno').insert([{
        remetente: operador,
        mensagem: formDelegar.descricao.trim(),
        tipo: 'demanda',
        destinatario_demanda: formDelegar.atribuido_para
      }]);

      // Alerta o funcionário específico
      dispararPush('interno', `📌 Tarefa Delegada por ${operador.split(' ')[0]}`, `Para ${formDelegar.atribuido_para}: ${formDelegar.descricao.trim()}`);
      
      setModoDelegar(false);
      setFormDelegar({ atribuido_para: 'Maria (Societário)', descricao: '', prazo: '', prioridade: 'Média' });
    }
    setSubindo(false);
  }

  function formatarHora(dataISO) {
    if (!dataISO) return '';
    return new Date(dataISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className={`${isVisivel ? 'flex' : 'hidden'} bg-[#1b263b] shadow-2xl flex-col w-full overflow-hidden animate-in fade-in duration-300 fixed inset-0 z-[99999] h-[100dvh] rounded-none sm:relative sm:inset-auto sm:z-auto sm:h-[75vh] sm:max-h-[800px] sm:rounded-xl sm:border sm:border-zinc-800 sm:zoom-in-95`}>
      
      {/* HEADER DO CHAT */}
      <div className="bg-[#0d1b2a] p-4 sm:p-5 border-b border-zinc-800 flex justify-between items-center z-10 shrink-0 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onFechar} className="sm:hidden text-zinc-400 hover:text-white flex items-center gap-1 font-bold text-xs p-2 -ml-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Voltar
          </button>
          <div className="hidden sm:block bg-[#d4af37]/10 p-2 rounded-full border border-[#d4af37]/30">
            <IconChatTeam />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-none">InnovChat</h2>
            <p className="text-[11px] text-zinc-400 mt-1 font-medium">Equipe Interna Online <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-1"></span></p>
          </div>
        </div>
        {operador === 'Victor (Admin)' && (
          <span className="text-[10px] font-black bg-red-500/10 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1">
            <span className="hidden sm:inline">Modo CEO</span>
          </span>
        )}
      </div>

      {/* BARRA DE EQUIPA ONLINE/OFFLINE */}
      <div className="bg-[#0d1b2a]/80 border-b border-zinc-800/50 px-4 py-2 flex gap-2.5 overflow-x-auto hide-scrollbar shrink-0 shadow-sm w-full touch-pan-x snap-x cursor-grab active:cursor-grabbing">
        {Object.keys(OBTER_EMAIL_FUNCIONARIO).map(nome => {
          const isOnline = usuariosOnline.includes(nome);
          const primeiroNome = nome.split(' ')[0];
          return (
            <div key={nome} className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-full border snap-start ${isOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-[#1b263b] border-zinc-700/50 text-zinc-500 opacity-60'} transition-colors cursor-default`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></span>
              <span className="text-[10px] font-extrabold">{primeiroNome}</span>
            </div>
          );
        })}
      </div>

      {/* ÁREA DE MENSAGENS (ESTILO GOOGLE CHAT / WHATSAPP) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 bg-[#0d1b2a]/30 hide-scrollbar flex flex-col">
        {mensagens.length === 0 ? (
          <div className="m-auto text-center flex flex-col items-center opacity-50">
            <span className="text-6xl mb-4">💬</span>
            <p className="text-zinc-400 font-medium">Nenhuma mensagem no histórico.</p>
            <p className="text-xs text-zinc-500 mt-1">Envie o primeiro recado para a equipa!</p>
          </div>
        ) : (
          (() => {
            // Filtra primeiro para garantir que a verificação de "mensagem anterior" não pega registos ocultos
            const mensagensFiltradas = mensagens.filter(msg => {
              if (msg.tipo !== 'demanda') return true; 
              if (msg.remetente === operador || msg.destinatario_demanda === operador) return true;
              if (operador === 'Victor (Admin)' || operador === 'Lucas (Financeiro)') return true;
              return false;
            });

            return mensagensFiltradas.map((msg, index) => {
              const souEu = msg.remetente === operador;
              const isCEO = msg.remetente === 'Victor (Admin)';
              
              const msgAnterior = index > 0 ? mensagensFiltradas[index - 1] : null;
              
              // MÁGICA: Agrupa se for a mesma pessoa enviando textos em sequência!
              const agrupar = msgAnterior && msgAnterior.remetente === msg.remetente && msgAnterior.tipo !== 'demanda' && msg.tipo !== 'demanda';

              // Renderização do Balão de Tarefa Delegada
              if (msg.tipo === 'demanda') {
                return (
                  <div key={msg.id} className="w-full flex justify-center mt-6 mb-4">
                    <div className="bg-[#1b263b] border border-blue-500/30 rounded-xl p-4 sm:p-5 w-full max-w-md shadow-[0_4px_20px_rgba(59,130,246,0.1)] relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                          <IconPin /> Tarefa Delegada
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">{formatarHora(msg.criado_em)}</span>
                      </div>
                      <p className="text-xs font-bold text-white mb-2">
                        <span className="text-zinc-500 font-medium">De:</span> {msg.remetente.split(' ')[0]} <span className="mx-1 text-zinc-600">➔</span> <span className="text-zinc-500 font-medium">Para:</span> <span className="text-blue-400">{msg.destinatario_demanda.split(' ')[0]}</span>
                      </p>
                      <div className="bg-[#0d1b2a]/80 p-3 rounded-lg border border-zinc-800/80 mb-3">
                        <p className="text-sm text-zinc-300 leading-relaxed italic">"{msg.mensagem}"</p>
                      </div>
                      <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest font-bold">Verifique o Painel de Demandas</p>
                    </div>
                  </div>
                );
              }

              // Renderização do Balão de Conversa Padrão (ESTILO WHATSAPP)
              return (
                <div key={msg.id} className={`flex w-full ${souEu ? 'justify-end' : 'justify-start'} ${agrupar ? 'mt-1' : 'mt-4'}`}>
                  <div className={`flex flex-col max-w-[85%] sm:max-w-[65%] ${souEu ? 'items-end' : 'items-start'}`}>
                    
                    {!agrupar && (
                      <span className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${isCEO ? 'text-red-400' : 'text-zinc-400'} ${souEu ? 'mr-2' : 'ml-2'}`}>
                        {msg.remetente.split(' ')[0]} {isCEO && ''}
                      </span>
                    )}

                    <div className={`relative px-3 pt-2 pb-1.5 min-w-[70px] text-sm leading-relaxed shadow-sm ${
                      souEu 
                        ? `bg-[#d4af37] text-[#0d1b2a] font-medium ${agrupar ? 'rounded-2xl rounded-tr-sm rounded-br-sm' : 'rounded-2xl rounded-br-sm'}` 
                        : isCEO 
                          ? `bg-red-500/10 border border-red-500/30 text-white shadow-[0_0_15px_rgba(239,68,68,0.1)] ${agrupar ? 'rounded-2xl rounded-tl-sm rounded-bl-sm' : 'rounded-2xl rounded-bl-sm'}` 
                          : `bg-[#1b263b] border border-zinc-700/80 text-white ${agrupar ? 'rounded-2xl rounded-tl-sm rounded-bl-sm' : 'rounded-2xl rounded-bl-sm'}`
                    }`}>
                      <span className="pr-10 block whitespace-pre-wrap break-words">{msg.mensagem}</span>
                      <span className={`absolute bottom-1 right-2 text-[9px] font-bold ${souEu ? 'text-yellow-900/60' : 'text-zinc-500'}`}>
                        {formatarHora(msg.criado_em)}
                      </span>
                    </div>

                    {/* MÁGICA: MOSTRAR VISTO POR APENAS NA ÚLTIMA MENSAGEM */}
                    {index === mensagensFiltradas.length - 1 && usuariosOnline.filter(u => u !== msg.remetente).length > 0 && (
                      <span className={`text-[9px] text-zinc-500 font-medium mt-1 flex items-center gap-1 ${souEu ? 'mr-1' : 'ml-1'} animate-in fade-in duration-500`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>
                        Visualizado por {usuariosOnline.filter(u => u !== msg.remetente).map(u => u.split(' ')[0]).join(', ')}
                      </span>
                    )}

                  </div>
                </div>
              );
            });
          })()
        )}
        <div ref={chatFimRef} className="pt-2" /> {/* Ponto cego magnético do scroll */}
      </div>

      {/* ÁREA DE INPUT / DELEGAÇÃO */}
      <div className="bg-[#0d1b2a] border-t border-zinc-800 shrink-0 relative">
        
        {modoDelegar ? (
          <form onSubmit={handleDelegar} className="p-3 sm:p-4 bg-[#1b263b]/95 sm:bg-[#1b263b]/80 border-t border-blue-500/30 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-center mb-2 sm:mb-4">
              <h4 className="text-[11px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                <IconPin /> Nova Delegação Rápida
              </h4>
              <button type="button" onClick={() => setModoDelegar(false)} className="text-zinc-500 hover:text-white font-bold px-2 py-1 transition-colors">✕</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="sm:col-span-8">
                <input type="text" autoFocus required placeholder="Descreva a tarefa..." value={formDelegar.descricao} onChange={e => setFormDelegar({...formDelegar, descricao: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-3 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div className="sm:col-span-4">
                <select value={formDelegar.atribuido_para} onChange={e => setFormDelegar({...formDelegar, atribuido_para: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-700 rounded-lg px-2 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-blue-400 cursor-pointer transition-colors">
                  {Object.keys(OBTER_EMAIL_FUNCIONARIO).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-3">
              <input type="date" required value={formDelegar.prazo} onChange={e => setFormDelegar({...formDelegar, prazo: e.target.value})} className="col-span-1 sm:col-span-3 bg-[#0d1b2a] border border-zinc-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer transition-colors" />
              
              <select value={formDelegar.prioridade} onChange={e => setFormDelegar({...formDelegar, prioridade: e.target.value})} className="col-span-1 sm:col-span-3 bg-[#0d1b2a] border border-zinc-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer transition-colors">
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
              
              <button type="submit" disabled={subindo} className="col-span-2 sm:col-span-6 bg-blue-500 hover:bg-blue-400 text-white font-black py-2 rounded-lg text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {subindo ? '...' : 'Delegar e Notificar'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleEnviarChat} className="flex gap-2 sm:gap-3 p-4">
            <button 
              type="button" 
              onClick={() => setModoDelegar(true)} 
              className="flex-shrink-0 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/30 px-3 sm:px-4 rounded-xl font-bold transition flex items-center justify-center shadow-sm group" 
              title="Delegar Tarefa"
            >
              <IconPin />
              <span className="hidden sm:inline-block ml-1 text-xs uppercase tracking-wider opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto transition-all duration-300">Delegar</span>
            </button>
            
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Digite a sua mensagem..." 
              value={novaMensagem} 
              onChange={e => setNovaMensagem(e.target.value)} 
              className="flex-1 bg-[#1b263b] border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] transition-colors"
            />
            
            <button 
              type="submit" 
              disabled={!novaMensagem.trim() || subindo} 
              className="flex-shrink-0 bg-[#d4af37] text-[#0d1b2a] font-black px-4 sm:px-6 py-3 rounded-xl hover:bg-yellow-500 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2"
            >
              <span className="hidden sm:inline">Enviar</span>
              <IconSend />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}