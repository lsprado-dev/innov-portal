import './globals.css';

export const metadata = {
  title: 'Innovative Business',
  description: 'Portal Digital da Contabilidade',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#0d1b2a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0d1b2a] text-white min-h-screen flex flex-col">
        
        <main className="flex-grow flex flex-col">
          {children}
        </main>

        {/* ==========================================
            RODAPÉ GLOBAL DO DESENVOLVEDOR
        ========================================== */}
        <footer className="w-full bg-[#0b1622] border-t border-zinc-800/80 py-6 px-4 flex-shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 text-center">
            <p className="text-sm text-zinc-400 font-medium">
              Sistema SaaS desenvolvido por
            </p>
            <a 
              href="https://lucasprado.space/pt/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#d4af37] font-bold hover:text-yellow-400 hover:underline transition-all"
            >
              Lucas Prado
            </a>
          </div>
        </footer>

      </body>
    </html>
  );
}