export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#0d1b2a] text-zinc-300 p-8 md:p-16 font-sans">
      <div className="max-w-3xl mx-auto bg-[#1b263b] p-8 md:p-12 rounded-2xl border border-zinc-800 shadow-2xl">
        <h1 className="text-3xl font-black text-[#d4af37] mb-6">Política de Privacidade</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <p>
            A <strong>Innovative Business</strong> valoriza a sua privacidade. Esta política descreve como tratamos os seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-3">1. Dados Coletados</h2>
          <p>
            Coletamos apenas os dados essenciais para a prestação dos nossos serviços contábeis e fiscais, incluindo: Razão Social, CNPJ, CPF dos sócios, E-mail, Telefone e documentos financeiros/empresariais enviados através deste portal.
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-3">2. Armazenamento e Segurança</h2>
          <p>
            Os seus arquivos são armazenados de forma criptografada em infraestruturas seguras (Google Drive e Supabase) com controle restrito de acesso. Apenas os profissionais autorizados da nossa equipe possuem acesso à sua pasta. As senhas de acesso ao portal são salvas com criptografia forte (hash), sendo impossível a leitura reversa.
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-3">3. Retenção e Exclusão</h2>
          <p>
            Manteremos os seus dados enquanto a relação contratual estiver ativa. Após o término, o cliente pode exercer o <strong>Direito ao Esquecimento</strong> pelo próprio painel. No entanto, alertamos que certos dados fiscais e contábeis serão mantidos pelo período exigido pelas leis tributárias locais (Art. 16, I da LGPD).
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-3">4. Cookies e Rastreamento</h2>
          <p>
            Utilizamos apenas cookies essenciais para manter a sua sessão segura (Login) e garantir o funcionamento do sistema de segurança e auditoria (Registro de IP e Ações). Não vendemos nem compartilhamos os seus dados com anunciantes.
          </p>

        </div>
        
        <div className="mt-12 pt-6 border-t border-zinc-800 text-center">
          <a href="/login" className="text-[#d4af37] font-bold hover:underline">← Voltar para o Login</a>
        </div>
      </div>
    </div>
  );
}