import './globals.css';

export const metadata = {
  title: 'Innovative Business',
  description: 'Portal Digital da Contabilidade',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0d1b2a] text-white">
        {children}
      </body>
    </html>
  );
}