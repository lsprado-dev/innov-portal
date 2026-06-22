import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: async (url, options) => {
      // 1. Verifica se estamos no navegador (para evitar erros no servidor do Next.js)
      if (typeof window !== 'undefined') {
        // 2. Pega o "Passe VIP" que guardamos no momento do login
        const token = localStorage.getItem('supabase_token');
        
        // 3. Se o token existir, injeta ele na requisição como um crachá oficial
        if (token) {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          };
        }
      }
      
      // 4. Continua a requisição normalmente para o Supabase
      return fetch(url, options);
    }
  }
});