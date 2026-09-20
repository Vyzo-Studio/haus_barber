const SUPABASE_URL = 'COLE_AQUI_A_PROJECT_URL';

const SUPABASE_PUBLIC_KEY = 'COLE_AQUI_A_PUBLISHABLE_KEY';

if (
  !SUPABASE_URL ||
  SUPABASE_URL === 'COLE_AQUI_A_PROJECT_URL'
) {
  throw new Error(
    'A Project URL do Supabase ainda não foi configurada.'
  );
}

if (
  !SUPABASE_PUBLIC_KEY ||
  SUPABASE_PUBLIC_KEY === 'COLE_AQUI_A_PUBLISHABLE_KEY'
) {
  throw new Error(
    'A Publishable Key do Supabase ainda não foi configurada.'
  );
}

if (
  typeof window.supabase === 'undefined'
) {
  throw new Error(
    'A biblioteca do Supabase não foi carregada.'
  );
}

window.supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
