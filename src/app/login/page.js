'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

// ==========================================
// FUNÇÕES DE VALIDAÇÃO E MÁSCARA (UX AVANÇADA)
// ==========================================

const encriptarSenha = (text) => {
  if (!text) return '';
  return btoa(text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join(''));
};

const maskCNPJ = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

const maskCelular = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2')
    .substring(0, 15);
};

const validarCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj == '') return false;
  if (cnpj.length != 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(0)) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(1)) return false;

  return true;
};

const validarEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function LoginPage() {
  const [modo, setModo] = useState('login');
  
  // Estados do Login
  const [emailLogin, setEmailLogin] = useState('');
  const [senha, setSenha] = useState('');
  
  // Estados de Feedback
  const [toasts, setToasts] = useState([]);
  const [carregando, setCarregando] = useState(false);

  // Gatilho do PWA (Instalação nativa)
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Captura o evento nativo de instalação do navegador assim que a página carrega
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function mostrarToast(mensagem, tipo = 'sucesso') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 5000); // Aumentei para 5s para dar tempo de ler os passos
  }

  // 1. Adicione este estado junto aos outros 'useState' no início do componente
  const [mostrarModalIos, setMostrarModalIos] = useState(false);

  // 2. Substitua a função handleInstalarApp inteira
  const handleInstalarApp = async (plataforma) => {
    if (plataforma === 'ios') {
      setMostrarModalIos(true);
      return;
    }

    // Windows e Android (A Mágica acontece aqui!)
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        mostrarToast('Instalação concluída com sucesso!', 'sucesso');
      }
      setDeferredPrompt(null);
    } else {
      mostrarToast(`Para instalar no ${plataforma === 'windows' ? 'Windows' : 'Android'}, procure o ícone de instalação na barra do seu navegador.`, 'aviso');
    }
  };
  
  // Estados do Cadastro
  const [formCadastro, setFormCadastro] = useState({
    nome_empresa: '', 
    cnpj: '', 
    nome_contato: '', 
    email: '',
    celular: '', 
    regime_tributario: ''
  });

  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setCarregando(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLogin, password: senha }) 
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        mostrarToast(data.error || 'Erro ao realizar login.', 'erro');
        setCarregando(false);
        return;
      }

      localStorage.setItem('usuario_nome', data.nome);
      localStorage.setItem('usuario_tipo', data.tipo);
      if (data.id) {
        localStorage.setItem('usuario_id', data.id);
      }

      if (data.tipo === 'interno') {
        router.push('/');
      } else {
        let cidadeFormatada = null;
        try {
          const geoRes = await fetch('https://ipapi.co/json/');
          const geoData = await geoRes.json();
          if (geoData.city && geoData.region) {
            cidadeFormatada = `${geoData.city} - ${geoData.region}`;
          }
        } catch (e) {
          console.log('Não foi possível rastrear a cidade.');
        }

        await supabase.from('clientes').update({ 
          ultimo_login: new Date().toISOString(),
          ultima_cidade: cidadeFormatada
        }).eq('id', data.id);
        
        router.push(`/cliente/${data.id}`);
      }
    } catch (err) {
      mostrarToast('Erro de conexão com o servidor.', 'erro');
    } finally {
      setCarregando(false);
    }
  }

  async function handleSolicitarConta(e) {
    e.preventDefault();
    setCarregando(true);

    if (!validarCNPJ(formCadastro.cnpj)) {
      mostrarToast('O CNPJ introduzido é inválido ou não existe.', 'erro');
      setCarregando(false);
      return;
    }

    if (!validarEmail(formCadastro.email)) {
      mostrarToast('Por favor, insira um e-mail profissional válido.', 'erro');
      setCarregando(false);
      return;
    }

    if (formCadastro.celular.length < 14) {
      mostrarToast('O número de celular está incompleto.', 'erro');
      setCarregando(false);
      return;
    }

    if (!formCadastro.regime_tributario) {
      mostrarToast('Por favor, selecione um Regime Tributário.', 'erro');
      setCarregando(false);
      return;
    }

    const { error } = await supabase.from('solicitacoes_cadastro').insert([{
      nome_empresa: formCadastro.nome_empresa,
      cnpj: formCadastro.cnpj,
      nome_contato: formCadastro.nome_contato,
      email: formCadastro.email,
      celular: formCadastro.celular,
      regime_tributario: formCadastro.regime_tributario
    }]);

    if (error) {
      mostrarToast('Erro ao enviar solicitação: ' + error.message, 'erro');
    } else {
      mostrarToast('Pedido enviado! A contabilidade liberará o acesso em breve.', 'sucesso');
      setModo('login');
      setFormCadastro({ nome_empresa: '', cnpj: '', nome_contato: '', email: '', celular: '', regime_tributario: '' });
    }
    setCarregando(false);
  }

  return (
    <div className="min-h-screen bg-[#0d1b2a] flex items-center justify-center p-6 font-sans">
      <div className={`bg-[#1b263b] p-8 rounded-xl border border-zinc-800 shadow-2xl w-full transition-all duration-300 ${modo === 'cadastro' ? 'max-w-2xl' : 'max-w-md'}`}>
        
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="Logo Innovative" className="w-36 h-auto mb-4 object-contain drop-shadow-lg" />
          <p className="text-zinc-400 text-sm font-medium tracking-wide uppercase">
            Portal do Cliente 
            <span className="block mt-1 text-[#d4af37] font-bold">Innovative</span>
          </p>
        </div>

        {modo === 'login' ? (
          <div className="animate-in fade-in duration-300">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">E-mail de acesso</label>
                <input type="text" required placeholder="Ex: lucas@innovbusiness.com" value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Senha</label>
                <input type="password" required placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-colors" />
              </div>
              <button type="submit" disabled={carregando} className="w-full bg-[#d4af37] text-[#0d1b2a] font-extrabold py-3.5 rounded-lg hover:bg-yellow-500 transition shadow-[0_0_15px_rgba(212,175,55,0.3)] mt-2">
                {carregando ? 'A Autenticar...' : 'Acessar o Portal'}
              </button>
            </form>

            <div className="text-center mt-6 pt-4 border-t border-zinc-800/60">
              <button type="button" onClick={() => setModo('cadastro')} className="text-sm text-zinc-400 hover:text-[#d4af37] transition font-medium">
                É cliente e ainda não tem acesso? <span className="text-[#d4af37] font-bold underline">Solicite Aqui</span>
              </button>
            </div>

            {/* BARRA DE INSTALAÇÃO DO APLICATIVO */}
            <div className="mt-8 pt-6 border-t border-zinc-800/60">
              <p className="text-center text-[10px] text-zinc-500 font-bold uppercase mb-4 tracking-widest">Instalar App Oficial</p>
              <div className="flex justify-center gap-4">
                <button type="button" onClick={() => handleInstalarApp('windows')} className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-[#d4af37] transition" aria-label="Instalar no Windows">
                  <i className="fab fa-windows text-sm"></i>
                </button>
                <button type="button" onClick={() => handleInstalarApp('android')} className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-[#d4af37] transition" aria-label="Instalar no Android">
                  <i className="fab fa-android text-sm"></i>
                </button>
                <button type="button" onClick={() => handleInstalarApp('ios')} className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center hover:bg-[#d4af37]/10 hover:border-[#d4af37] hover:text-[#d4af37] transition" aria-label="Instalar no iPhone">
                  <i className="fab fa-apple text-sm"></i>
                </button>
              </div>
            </div>

          </div>
        ) : (
          <form onSubmit={handleSolicitarConta} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-6 border-b border-zinc-800 pb-4 flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-[#d4af37]">Solicitar Criação de Conta</h2>
                <p className="text-xs text-zinc-400 mt-1">Preencha os dados oficiais da empresa para liberarmos o acesso.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Nome da Empresa (Razão Social)</label>
                <input type="text" required placeholder="Ex: Innovative Business LTDA" value={formCadastro.nome_empresa} onChange={e => setFormCadastro({...formCadastro, nome_empresa: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">CNPJ</label>
                <input 
                  type="text" 
                  required 
                  placeholder="00.000.000/0001-00" 
                  value={formCadastro.cnpj} 
                  onChange={e => setFormCadastro({...formCadastro, cnpj: maskCNPJ(e.target.value)})} 
                  className={`w-full bg-[#0d1b2a] border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none font-mono transition-colors ${formCadastro.cnpj.length === 18 && validarCNPJ(formCadastro.cnpj) ? 'border-emerald-500 focus:border-emerald-500' : formCadastro.cnpj.length === 18 && !validarCNPJ(formCadastro.cnpj) ? 'border-red-500 focus:border-red-500' : 'border-zinc-800 focus:border-[#d4af37]'}`} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Nome do Contato Principal</label>
                <input type="text" required placeholder="Ex: João Silva" value={formCadastro.nome_contato} onChange={e => setFormCadastro({...formCadastro, nome_contato: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none" />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Celular / WhatsApp</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="(00) 00000-0000" 
                    value={formCadastro.celular} 
                    onChange={e => setFormCadastro({...formCadastro, celular: maskCelular(e.target.value)})} 
                    className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none" 
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">E-mail Profissional</label>
                  <input type="email" required placeholder="contato@empresa.com.br" value={formCadastro.email} onChange={e => setFormCadastro({...formCadastro, email: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none" />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Regime Tributário</label>
                  <select 
                    required
                    value={formCadastro.regime_tributario} 
                    onChange={e => setFormCadastro({...formCadastro, regime_tributario: e.target.value})} 
                    className={`w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:border-[#d4af37] focus:outline-none cursor-pointer appearance-none ${formCadastro.regime_tributario === '' ? 'text-zinc-500' : 'text-white'}`}
                  >
                    <option value="" disabled hidden>Selecione...</option>
                    <option value="Simples Nacional" className="text-white">Simples Nacional</option>
                    <option value="Lucro Presumido" className="text-white">Lucro Presumido</option>
                    <option value="Lucro Real" className="text-white">Lucro Real</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-zinc-800 flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={() => setModo('login')} className="w-full sm:w-1/3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-lg text-sm transition">Cancelar</button>
              <button type="submit" disabled={carregando} className="w-full sm:w-2/3 bg-[#d4af37] text-[#0d1b2a] font-extrabold py-3 rounded-lg text-sm hover:bg-yellow-500 transition shadow-lg">
                {carregando ? 'A Processar...' : 'Enviar Solicitação Oficial'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 🛑 A TRAVA ANTI-DEDO NERVOSO (Overlay Global de Processamento) */}
      {carregando && (
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

      {/* MODAL EXPLICATIVO PARA IOS */}
      {mostrarModalIos && (
        <div className="fixed inset-0 z-[99999999] bg-[#0d1b2a]/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#1b263b] p-8 rounded-2xl border border-zinc-700 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setMostrarModalIos(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
            <h3 className="text-xl font-bold text-white mb-4 text-center">Instalar no iPhone</h3>
            <div className="space-y-4 text-zinc-300 text-sm">
              <p>1. Toque no botão <span className="font-bold text-[#d4af37]">Compartilhar</span> no Safari.</p>
              <div className="bg-[#0d1b2a] p-3 rounded-lg border border-zinc-800 flex items-center justify-center">
                <i className="fas fa-share-from-square text-2xl text-[#d4af37]"></i>
              </div>
              <p>2. Role para baixo e selecione <span className="font-bold text-[#d4af37]">"Adicionar à Tela de Início"</span>.</p>
            </div>
            <button onClick={() => setMostrarModalIos(false)} className="w-full mt-6 bg-[#d4af37] text-[#0d1b2a] font-bold py-3 rounded-lg hover:bg-yellow-500 transition">Entendido</button>
          </div>
        </div>
      )}

    </div>
  );
}