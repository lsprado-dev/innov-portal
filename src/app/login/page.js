'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

// ==========================================
// FUNÇÕES DE VALIDAÇÃO E MÁSCARA (UX AVANÇADA)
// ==========================================

// 0. Função de Criptografia Reversível para proteção no banco de dados
const encriptarSenha = (text) => {
  if (!text) return '';
  return btoa(text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join(''));
};
// 1. Máscara de CNPJ: 00.000.000/0001-00
const maskCNPJ = (value) => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não é dígito
    .replace(/^(\d{2})(\d)/, '$1.$2') // Coloca ponto após os dois primeiros dígitos
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3') // Coloca ponto após o quinto dígito
    .replace(/\.(\d{3})(\d)/, '.$1/$2') // Coloca a barra após o oitavo dígito
    .replace(/(\d{4})(\d)/, '$1-$2') // Coloca o traço antes dos últimos 2 dígitos
    .substring(0, 18); // Limita o tamanho máximo a 18 caracteres
};

// 2. Máscara de Celular: (00) 00000-0000
const maskCelular = (value) => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não é dígito
    .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca parênteses em volta dos 2 primeiros dígitos
    .replace(/(\d)(\d{4})$/, '$1-$2') // Coloca traço entre o 5º e o 4º dígito final
    .substring(0, 15); // Limita o tamanho máximo a 15 caracteres
};

// 3. Validador Real de CNPJ (Algoritmo da Receita Federal)
const validarCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj == '') return false;
  if (cnpj.length != 14) return false;

  // Elimina CNPJs inválidos conhecidos
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Valida DVs
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

// Validador simples de E-mail (Requer @ e ponto)
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
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  
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
    setErro('');
    setSucesso('');
    setCarregando(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLogin, password: encriptarSenha(senha) }) // Envia criptografada
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErro(data.error || 'Erro ao realizar login.');
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
        // RADAR DE LOCALIZAÇÃO (Invisível para o cliente)
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

        // GATILHO MÁGICO: Grava data, hora e cidade no Supabase
        await supabase.from('clientes').update({ 
          ultimo_login: new Date().toISOString(),
          ultima_cidade: cidadeFormatada
        }).eq('id', data.id);
        
        router.push(`/cliente/${data.id}`);
      }
    } catch (err) {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  }

  async function handleSolicitarConta(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    // VALIDAÇÕES RIGOROSAS (UX Avançada)
    if (!validarCNPJ(formCadastro.cnpj)) {
      setErro('O CNPJ introduzido é inválido ou não existe. Por favor, verifique.');
      setCarregando(false);
      return;
    }

    if (!validarEmail(formCadastro.email)) {
      setErro('Por favor, insira um e-mail profissional válido.');
      setCarregando(false);
      return;
    }

    if (formCadastro.celular.length < 14) {
      setErro('O número de celular está incompleto.');
      setCarregando(false);
      return;
    }

    if (!formCadastro.regime_tributario) {
      setErro('Por favor, selecione um Regime Tributário.');
      setCarregando(false);
      return;
    }

    // Processo de envio para a BD se estiver tudo perfeito
    const { error } = await supabase.from('solicitacoes_cadastro').insert([{
      nome_empresa: formCadastro.nome_empresa,
      cnpj: formCadastro.cnpj,
      nome_contato: formCadastro.nome_contato,
      email: formCadastro.email,
      celular: formCadastro.celular,
      regime_tributario: formCadastro.regime_tributario
    }]);

    if (error) {
      setErro('Erro ao enviar solicitação: ' + error.message);
    } else {
      setSucesso('Pedido enviado com sucesso! A contabilidade irá analisar e liberar o seu acesso em breve.');
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
          <p className="text-zinc-400 text-sm font-medium tracking-wide uppercase">Portal Digital da Contabilidade</p>
        </div>

        {erro && <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 text-sm rounded font-medium shadow-sm animate-in fade-in zoom-in">{erro}</div>}
        {sucesso && <div className="mb-6 p-4 bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-400 text-sm rounded font-medium shadow-sm animate-in fade-in zoom-in">{sucesso}</div>}

        {modo === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in duration-300">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Utilizador / E-mail</label>
              <input type="text" required placeholder="Ex: adm-innov" value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Senha Segura</label>
              <input type="password" required placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-colors" />
            </div>
            <button type="submit" disabled={carregando} className="w-full bg-[#d4af37] text-[#0d1b2a] font-extrabold py-3.5 rounded-lg hover:bg-yellow-500 transition shadow-[0_0_15px_rgba(212,175,55,0.3)] mt-2">
              {carregando ? 'A Autenticar...' : 'Acessar o Portal'}
            </button>
            <div className="text-center mt-6 pt-4 border-t border-zinc-800/60">
              <button type="button" onClick={() => { setModo('cadastro'); setErro(''); setSucesso(''); }} className="text-sm text-zinc-400 hover:text-[#d4af37] transition font-medium">
                É cliente e ainda não tem acesso? <span className="text-[#d4af37] font-bold underline">Solicite Aqui</span>
              </button>
            </div>
          </form>
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

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">E-mail Profissional</label>
                <input type="email" required placeholder="contato@empresa.com.br" value={formCadastro.email} onChange={e => setFormCadastro({...formCadastro, email: e.target.value})} className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Celular / WhatsApp</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="(00) 00000-0000" 
                    value={formCadastro.celular} 
                    onChange={e => setFormCadastro({...formCadastro, celular: maskCelular(e.target.value)})} 
                    className="w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Regime Tributário</label>
                  <select 
                    required
                    value={formCadastro.regime_tributario} 
                    onChange={e => setFormCadastro({...formCadastro, regime_tributario: e.target.value})} 
                    className={`w-full bg-[#0d1b2a] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-[#d4af37] focus:outline-none cursor-pointer appearance-none ${formCadastro.regime_tributario === '' ? 'text-zinc-500' : 'text-white'}`}
                  >
                    <option value="" disabled hidden>Selecione...</option>
                    <option value="Simples Nacional" className="text-white">Simples Nacional</option>
                    <option value="Lucro Presumido" className="text-white">Lucro Presumido</option>
                    <option value="Lucro Real" className="text-white">Lucro Real</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-zinc-800 flex gap-3">
              <button type="button" onClick={() => { setModo('login'); setErro(''); setSucesso(''); }} className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-lg text-sm transition">Cancelar</button>
              <button type="submit" disabled={carregando} className="w-2/3 bg-[#d4af37] text-[#0d1b2a] font-extrabold py-3 rounded-lg text-sm hover:bg-yellow-500 transition shadow-lg">
                {carregando ? 'A Processar...' : 'Enviar Solicitação Oficial'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}