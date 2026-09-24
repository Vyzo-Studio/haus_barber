const SUPABASE_URL =
  'https://pmhpgrdeknzbvegkrnxi.supabase.co';

const SUPABASE_PUBLIC_KEY =
  'sb_publishable_pTdf3oXkrwazZbligXLmQg_OCc0TEyW';

function showStartupError(message) {
  console.error(message);

  const target =
    document.getElementById(
      'login-message'
    );

  if (!target) {
    return;
  }

  target.hidden = false;

  target.textContent =
    message;

  target.classList.remove(
    'is-success',
    'is-info'
  );

  target.classList.add(
    'is-error'
  );
}

function storageWorks(storage) {
  if (!storage) {
    return false;
  }

  const testKey =
    '__haus_barber_storage_test__';

  try {
    storage.setItem(
      testKey,
      '1'
    );

    const valid =
      storage.getItem(
        testKey
      ) === '1';

    storage.removeItem(
      testKey
    );

    return valid;
  } catch (error) {
    return false;
  }
}

function createMemoryStorage() {
  const values = {};

  return {
    getItem(key) {
      if (
        Object.prototype.hasOwnProperty.call(
          values,
          key
        )
      ) {
        return values[key];
      }

      return null;
    },

    setItem(key, value) {
      values[key] =
        String(value);
    },

    removeItem(key) {
      delete values[key];
    }
  };
}

function resolveAuthStorage() {
  try {
    if (
      storageWorks(
        window.localStorage
      )
    ) {
      return {
        storage:
          window.localStorage,
        mode:
          'localStorage'
      };
    }
  } catch (error) {
  }

  try {
    if (
      storageWorks(
        window.sessionStorage
      )
    ) {
      return {
        storage:
          window.sessionStorage,
        mode:
          'sessionStorage'
      };
    }
  } catch (error) {
  }

  return {
    storage:
      createMemoryStorage(),
    mode:
      'memory'
  };
}

if (
  !SUPABASE_URL ||
  SUPABASE_URL ===
    'COLE_AQUI_A_PROJECT_URL'
) {
  showStartupError(
    'A conexão com o Supabase não está configurada.'
  );

  window.supabaseClient =
    null;
} else if (
  !SUPABASE_PUBLIC_KEY
) {
  showStartupError(
    'A chave pública do Supabase não está configurada.'
  );

  window.supabaseClient =
    null;
} else if (
  typeof window.supabase ===
  'undefined'
) {
  showStartupError(
    'Não foi possível carregar o sistema. Abra o painel diretamente no Safari e recarregue a página.'
  );

  window.supabaseClient =
    null;
} else {
  const authStorage =
    resolveAuthStorage();

  window.HAUS_AUTH_STORAGE_MODE =
    authStorage.mode;

  try {
    window.supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLIC_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            storage:
              authStorage.storage
          }
        }
      );
  } catch (error) {
    console.error(
      'Erro ao iniciar Supabase:',
      error
    );

    window.supabaseClient =
      null;

    showStartupError(
      'Não foi possível iniciar a conexão do painel. Recarregue a página no Safari.'
    );
  }
}
