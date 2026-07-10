import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: async (url, options) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('supabase_token');
        
        // Só injeta o cabeçalho se o token de cliente realmente existir
        if (token) {
          // CLONA os headers para evitar mutação do singleton no lado do servidor/cliente
          const newHeaders = new Headers(options.headers || {});
          newHeaders.set('Authorization', `Bearer ${token}`);
          options.headers = newHeaders;
        }
      }
          
          const response = await fetch(url, options);
          
          // MÁGICA: Se o Supabase avisar que o passe VIP venceu (Erro 401)
          if (response.status === 401) {
            if (typeof window !== 'undefined') {
              // Dispara um alarme global no navegador
              window.dispatchEvent(new CustomEvent('sessao_expirada'));
            }
          }
          
          return response;
        }
      }
    });