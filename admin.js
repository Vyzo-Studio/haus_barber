const adminLoginSection = document.querySelector(
  '#admin-login'
);

const adminDashboard = document.querySelector(
  '#admin-dashboard'
);

const adminLoginForm = document.querySelector(
  '#admin-login-form'
);

const adminEmailInput = document.querySelector(
  '#admin-email'
);

const adminPasswordInput = document.querySelector(
  '#admin-password'
);

const adminLoginButton = document.querySelector(
  '#admin-login-button'
);

const passwordToggle = document.querySelector(
  '#password-toggle'
);

const loginMessage = document.querySelector(
  '#login-message'
);

const adminUserEmail = document.querySelector(
  '#admin-user-email'
);

const adminLogoutButton = document.querySelector(
  '#admin-logout-button'
);

const adminRefreshButton = document.querySelector(
  '#admin-refresh-button'
);

const adminStatusFilter = document.querySelector(
  '#admin-status-filter'
);

const adminDateFilter = document.querySelector(
  '#admin-date-filter'
);

const adminSearch = document.querySelector(
  '#admin-search'
);

const clearFiltersButton = document.querySelector(
  '#clear-filters-button'
);

const adminGlobalMessage = document.querySelector(
  '#admin-global-message'
);

const adminLoading = document.querySelector(
  '#admin-loading'
);

const adminEmpty = document.querySelector(
  '#admin-empty'
);

const adminBookingsList = document.querySelector(
  '#admin-bookings-list'
);

const adminLastUpdate = document.querySelector(
  '#admin-last-update'
);

const statPending = document.querySelector(
  '#stat-pending'
);

const statConfirmed = document.querySelector(
  '#stat-confirmed'
);

const statToday = document.querySelector(
  '#stat-today'
);

const statVisible = document.querySelector(
  '#stat-visible'
);

const bookingCardTemplate = document.querySelector(
  '#booking-card-template'
);

const adminConfirmModal = document.querySelector(
  '#admin-confirm-modal'
);

const adminConfirmTitle = document.querySelector(
  '#admin-confirm-title'
);

const adminConfirmText = document.querySelector(
  '#admin-confirm-text'
);

const adminConfirmCancel = document.querySelector(
  '#admin-confirm-cancel'
);

const adminConfirmSubmit = document.querySelector(
  '#admin-confirm-submit'
);

const modalBackdrop = document.querySelector(
  '[data-modal-close]'
);

const AUTO_REFRESH_MS = 30000;

let allBookings = [];
let currentSession = null;
let currentUser = null;
let currentAction = null;
let autoRefreshTimer = null;
let loadingBookings = false;

const STATUS_LABELS = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  rejected: 'Recusado',
  cancelled: 'Cancelado',
  expired: 'Expirado'
};

const WEEKDAY_LABELS = [
  'DOM',
  'SEG',
  'TER',
  'QUA',
  'QUI',
  'SEX',
  'SÁB'
];

function showLoginMessage(
  message,
  type = 'info'
) {
  if (!loginMessage) {
    return;
  }

  loginMessage.hidden = false;
  loginMessage.textContent = message;

  loginMessage.classList.remove(
    'is-error',
    'is-success',
    'is-info'
  );

  loginMessage.classList.add(
    `is-${type}`
  );
}

function hideLoginMessage() {
  if (!loginMessage) {
    return;
  }

  loginMessage.hidden = true;
  loginMessage.textContent = '';

  loginMessage.classList.remove(
    'is-error',
    'is-success',
    'is-info'
  );
}

function showGlobalMessage(
  message,
  type = 'info'
) {
  if (!adminGlobalMessage) {
    return;
  }

  adminGlobalMessage.hidden = false;
  adminGlobalMessage.textContent = message;

  adminGlobalMessage.classList.remove(
    'is-error',
    'is-success',
    'is-info'
  );

  adminGlobalMessage.classList.add(
    `is-${type}`
  );
}

function hideGlobalMessage() {
  if (!adminGlobalMessage) {
    return;
  }

  adminGlobalMessage.hidden = true;
  adminGlobalMessage.textContent = '';

  adminGlobalMessage.classList.remove(
    'is-error',
    'is-success',
    'is-info'
  );
}

function setLoginLoading(isLoading) {
  if (!adminLoginButton) {
    return;
  }

  adminLoginButton.disabled = isLoading;

  adminLoginButton.textContent = isLoading
    ? 'ENTRANDO...'
    : 'ENTRAR NO PAINEL';
}

function setRefreshLoading(isLoading) {
  if (!adminRefreshButton) {
    return;
  }

  adminRefreshButton.disabled = isLoading;

  adminRefreshButton.textContent = isLoading
    ? 'ATUALIZANDO...'
    : 'ATUALIZAR AGENDA';
}

function showLoginScreen() {
  if (adminLoginSection) {
    adminLoginSection.hidden = false;
  }

  if (adminDashboard) {
    adminDashboard.hidden = true;
  }

  stopAutoRefresh();
}

function showDashboardScreen() {
  if (adminLoginSection) {
    adminLoginSection.hidden = true;
  }

  if (adminDashboard) {
    adminDashboard.hidden = false;
  }

  if (
    adminUserEmail &&
    currentUser?.email
  ) {
    adminUserEmail.textContent =
      currentUser.email;
  }

  startAutoRefresh();
}

function formatDateValue(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseBookingDate(value) {
  if (!value) {
    return null;
  }

  const [
    year,
    month,
    day
  ] = String(value)
    .slice(0, 10)
    .split('-')
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatBookingDate(value) {
  const date = parseBookingDate(value);

  if (!date) {
    return value || '';
  }

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  return `${day}/${month}`;
}

function formatBookingTime(value) {
  return String(
    value || ''
  ).slice(0, 5);
}

function formatCreatedAt(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(date);
}

function getWeekdayLabel(value) {
  const date = parseBookingDate(value);

  if (!date) {
    return '';
  }

  return (
    WEEKDAY_LABELS[
      date.getDay()
    ] || ''
  );
}

function getTodayValue() {
  return formatDateValue(
    new Date()
  );
}

function normalizeText(value) {
  return String(
    value || ''
  )
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .trim();
}

function isPendingExpired(
  booking
) {
  if (
    booking.status !==
      'pending' ||
    !booking.expires_at
  ) {
    return false;
  }

  const expiresAt =
    new Date(
      booking.expires_at
    );

  if (
    Number.isNaN(
      expiresAt.getTime()
    )
  ) {
    return false;
  }

  return (
    expiresAt.getTime() <=
    Date.now()
  );
}

function getEffectiveStatus(
  booking
) {
  if (
    isPendingExpired(
      booking
    )
  ) {
    return 'expired';
  }

  return booking.status;
}

function statusMatchesFilter(
  booking,
  filter
) {
  const status =
    getEffectiveStatus(
      booking
    );

  if (filter === 'all') {
    return true;
  }

  if (filter === 'active') {
    return (
      status === 'pending' ||
      status === 'confirmed'
    );
  }

  return status === filter;
}

function getFilteredBookings() {
  const statusFilter =
    adminStatusFilter?.value ||
    'active';

  const dateFilter =
    adminDateFilter?.value ||
    '';

  const searchTerm =
    normalizeText(
      adminSearch?.value ||
      ''
    );

  return allBookings.filter(
    (booking) => {
      if (
        !statusMatchesFilter(
          booking,
          statusFilter
        )
      ) {
        return false;
      }

      if (
        dateFilter &&
        booking.booking_date !==
          dateFilter
      ) {
        return false;
      }

      if (searchTerm) {
        const searchable =
          normalizeText(
            [
              booking.customer_name,
              booking.service
            ].join(' ')
          );

        if (
          !searchable.includes(
            searchTerm
          )
        ) {
          return false;
        }
      }

      return true;
    }
  );
}

function updateStats(
  visibleBookings
) {
  const today =
    getTodayValue();

  const pendingCount =
    allBookings.filter(
      (booking) =>
        getEffectiveStatus(
          booking
        ) === 'pending'
    ).length;

  const confirmedCount =
    allBookings.filter(
      (booking) =>
        getEffectiveStatus(
          booking
        ) === 'confirmed'
    ).length;

  const todayCount =
    allBookings.filter(
      (booking) =>
        getEffectiveStatus(
          booking
        ) ===
          'confirmed' &&
        booking.booking_date ===
          today
    ).length;

  if (statPending) {
    statPending.textContent =
      String(
        pendingCount
      );
  }

  if (statConfirmed) {
    statConfirmed.textContent =
      String(
        confirmedCount
      );
  }

  if (statToday) {
    statToday.textContent =
      String(
        todayCount
      );
  }

  if (statVisible) {
    statVisible.textContent =
      String(
        visibleBookings.length
      );
  }
}

function getStatusLabel(
  status
) {
  return (
    STATUS_LABELS[status] ||
    status
  );
}

function applyStatusBadge(
  element,
  status
) {
  if (!element) {
    return;
  }

  element.textContent =
    getStatusLabel(
      status
    );

  element.className =
    'booking-status-badge';

  element.classList.add(
    `status-${status}`
  );
}

function configureActionButtons(
  card,
  booking
) {
  const status =
    getEffectiveStatus(
      booking
    );

  const confirmButton =
    card.querySelector(
      '[data-action="confirm"]'
    );

  const rejectButton =
    card.querySelector(
      '[data-action="reject"]'
    );

  const cancelButton =
    card.querySelector(
      '[data-action="cancel"]'
    );

  if (confirmButton) {
    confirmButton.hidden =
      status !== 'pending';

    confirmButton.addEventListener(
      'click',
      () => {
        openActionModal(
          booking,
          'confirm'
        );
      }
    );
  }

  if (rejectButton) {
    rejectButton.hidden =
      status !== 'pending';

    rejectButton.addEventListener(
      'click',
      () => {
        openActionModal(
          booking,
          'reject'
        );
      }
    );
  }

  if (cancelButton) {
    cancelButton.hidden =
      status !==
      'confirmed';

    cancelButton.addEventListener(
      'click',
      () => {
        openActionModal(
          booking,
          'cancel'
        );
      }
    );
  }
}

function createBookingCard(
  booking
) {
  if (!bookingCardTemplate) {
    return null;
  }

  const fragment =
    bookingCardTemplate
      .content
      .cloneNode(true);

  const card =
    fragment.querySelector(
      '.admin-booking-card'
    );

  if (!card) {
    return null;
  }

  const status =
    getEffectiveStatus(
      booking
    );

  const statusElement =
    card.querySelector(
      '[data-booking-status]'
    );

  const weekdayElement =
    card.querySelector(
      '[data-booking-weekday]'
    );

  const dateElement =
    card.querySelector(
      '[data-booking-date]'
    );

  const timeElement =
    card.querySelector(
      '[data-booking-time]'
    );

  const nameElement =
    card.querySelector(
      '[data-booking-name]'
    );

  const serviceElement =
    card.querySelector(
      '[data-booking-service]'
    );

  const createdElement =
    card.querySelector(
      '[data-booking-created]'
    );

  applyStatusBadge(
    statusElement,
    status
  );

  if (weekdayElement) {
    weekdayElement.textContent =
      getWeekdayLabel(
        booking.booking_date
      );
  }

  if (dateElement) {
    dateElement.textContent =
      formatBookingDate(
        booking.booking_date
      );
  }

  if (timeElement) {
    timeElement.textContent =
      formatBookingTime(
        booking.booking_time
      );
  }

  if (nameElement) {
    nameElement.textContent =
      booking.customer_name ||
      '—';
  }

  if (serviceElement) {
    serviceElement.textContent =
      booking.service ||
      '—';
  }

  if (createdElement) {
    createdElement.textContent =
      formatCreatedAt(
        booking.created_at
      ) || '—';
  }

  configureActionButtons(
    card,
    booking
  );

  return card;
}

function renderBookings() {
  if (!adminBookingsList) {
    return;
  }

  const visibleBookings =
    getFilteredBookings();

  adminBookingsList.innerHTML =
    '';

  updateStats(
    visibleBookings
  );

  if (adminEmpty) {
    adminEmpty.hidden =
      visibleBookings.length >
      0;
  }

  visibleBookings.forEach(
    (booking) => {
      const card =
        createBookingCard(
          booking
        );

      if (card) {
        adminBookingsList.appendChild(
          card
        );
      }
    }
  );
}

async function verifyAdminUser() {
  if (
    !window.supabaseClient ||
    !currentUser
  ) {
    return false;
  }

  try {
    const {
      data,
      error
    } =
      await window.supabaseClient.rpc(
        'is_admin'
      );

    if (error) {
      throw error;
    }

    return data === true;
  } catch (error) {
    console.error(
      'Erro ao verificar administrador:',
      error
    );

    return false;
  }
}

async function expireOldPendingBookings() {
  if (
    !window.supabaseClient
  ) {
    return;
  }

  const start =
    new Date();

  start.setDate(
    start.getDate() - 30
  );

  const end =
    new Date();

  end.setDate(
    end.getDate() + 60
  );

  try {
    await window.supabaseClient.rpc(
      'get_public_booked_slots',
      {
        p_start_date:
          formatDateValue(
            start
          ),
        p_end_date:
          formatDateValue(
            end
          )
      }
    );
  } catch (error) {
    console.warn(
      'Não foi possível atualizar reservas expiradas:',
      error
    );
  }
}

async function loadBookings(
  {
    silent = false
  } = {}
) {
  if (
    !window.supabaseClient ||
    loadingBookings
  ) {
    return;
  }

  loadingBookings = true;

  if (!silent) {
    hideGlobalMessage();

    if (adminLoading) {
      adminLoading.hidden =
        false;
    }

    setRefreshLoading(true);
  }

  try {
    await expireOldPendingBookings();

    const {
      data,
      error
    } =
      await window.supabaseClient
        .from('bookings')
        .select(
          `
            id,
            customer_name,
            service,
            booking_date,
            booking_time,
            status,
            expires_at,
            created_at,
            updated_at
          `
        )
        .order(
          'booking_date',
          {
            ascending: true
          }
        )
        .order(
          'booking_time',
          {
            ascending: true
          }
        )
        .order(
          'created_at',
          {
            ascending: true
          }
        );

    if (error) {
      throw error;
    }

    allBookings =
      Array.isArray(data)
        ? data
        : [];

    renderBookings();

    if (adminLastUpdate) {
      adminLastUpdate.textContent =
        `Atualizado às ${
          new Intl.DateTimeFormat(
            'pt-BR',
            {
              timeZone:
                'America/Sao_Paulo',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }
          ).format(
            new Date()
          )
        }`;
    }
  } catch (error) {
    console.error(
      'Erro ao carregar agendamentos:',
      error
    );

    showGlobalMessage(
      'Não foi possível carregar a agenda. Tente atualizar novamente.',
      'error'
    );
  } finally {
    loadingBookings = false;

    if (adminLoading) {
      adminLoading.hidden =
        true;
    }

    setRefreshLoading(false);
  }
}

function getActionContent(
  booking,
  action
) {
  const customer =
    booking.customer_name ||
    'Cliente';

  const date =
    formatBookingDate(
      booking.booking_date
    );

  const time =
    formatBookingTime(
      booking.booking_time
    );

  if (action === 'confirm') {
    return {
      title:
        'CONFIRMAR AGENDAMENTO?',
      text:
        `Confirmar o horário de ${customer} para ${date} às ${time}?`,
      button:
        'CONFIRMAR AGENDAMENTO'
    };
  }

  if (action === 'reject') {
    return {
      title:
        'RECUSAR SOLICITAÇÃO?',
      text:
        `Recusar a solicitação de ${customer} para ${date} às ${time}? O horário será liberado novamente.`,
      button:
        'RECUSAR SOLICITAÇÃO'
    };
  }

  if (action === 'cancel') {
    return {
      title:
        'CANCELAR AGENDAMENTO?',
      text:
        `Cancelar o agendamento confirmado de ${customer} para ${date} às ${time}? O horário ficará disponível novamente.`,
      button:
        'CANCELAR AGENDAMENTO'
    };
  }

  return {
    title:
      'CONFIRMAR AÇÃO?',
    text:
      'Deseja continuar?',
    button:
      'CONFIRMAR'
  };
}

function openActionModal(
  booking,
  action
) {
  if (!adminConfirmModal) {
    return;
  }

  currentAction = {
    booking,
    action
  };

  const content =
    getActionContent(
      booking,
      action
    );

  if (adminConfirmTitle) {
    adminConfirmTitle.textContent =
      content.title;
  }

  if (adminConfirmText) {
    adminConfirmText.textContent =
      content.text;
  }

  if (adminConfirmSubmit) {
    adminConfirmSubmit.textContent =
      content.button;
  }

  adminConfirmModal.hidden =
    false;

  document.body.classList.add(
    'modal-open'
  );

  adminConfirmSubmit?.focus();
}

function closeActionModal() {
  if (!adminConfirmModal) {
    return;
  }

  adminConfirmModal.hidden =
    true;

  document.body.classList.remove(
    'modal-open'
  );

  currentAction = null;

  if (adminConfirmSubmit) {
    adminConfirmSubmit.disabled =
      false;

    adminConfirmSubmit.textContent =
      'CONFIRMAR';
  }
}

async function executeBookingAction() {
  if (
    !currentAction ||
    !window.supabaseClient
  ) {
    return;
  }

  const {
    booking,
    action
  } = currentAction;

  if (adminConfirmSubmit) {
    adminConfirmSubmit.disabled =
      true;

    adminConfirmSubmit.textContent =
      'PROCESSANDO...';
  }

  try {
    let functionName = '';

    if (action === 'confirm') {
      functionName =
        'admin_confirm_booking';
    }

    if (action === 'reject') {
      functionName =
        'admin_reject_booking';
    }

    if (action === 'cancel') {
      functionName =
        'admin_cancel_booking';
    }

    if (!functionName) {
      throw new Error(
        'Ação inválida.'
      );
    }

    const {
      error
    } =
      await window.supabaseClient.rpc(
        functionName,
        {
          p_booking_id:
            booking.id
        }
      );

    if (error) {
      throw error;
    }

    closeActionModal();

    const successMessages = {
      confirm:
        'Agendamento confirmado com sucesso. O horário agora aparece como ocupado no site.',
      reject:
        'Solicitação recusada. O horário foi liberado novamente.',
      cancel:
        'Agendamento cancelado. O horário foi liberado novamente.'
    };

    showGlobalMessage(
      successMessages[action] ||
        'Agenda atualizada com sucesso.',
      'success'
    );

    await loadBookings(
      {
        silent: true
      }
    );
  } catch (error) {
    console.error(
      'Erro ao atualizar agendamento:',
      error
    );

    if (adminConfirmSubmit) {
      adminConfirmSubmit.disabled =
        false;
    }

    const message =
      String(
        error?.message || ''
      ).toLowerCase();

    let friendlyMessage =
      'Não foi possível concluir essa ação. Atualize a agenda e tente novamente.';

    if (
      message.includes(
        'expirou'
      )
    ) {
      friendlyMessage =
        'Essa solicitação já expirou e o horário foi liberado.';
    }

    if (
      message.includes(
        'já possui outro'
      ) ||
      message.includes(
        'ja possui outro'
      )
    ) {
      friendlyMessage =
        'Esse horário já possui outro agendamento confirmado.';
    }

    if (
      message.includes(
        'não autorizado'
      ) ||
      message.includes(
        'nao autorizado'
      )
    ) {
      friendlyMessage =
        'Sua conta não possui permissão para realizar essa ação.';
    }

    if (adminConfirmText) {
      adminConfirmText.textContent =
        friendlyMessage;
    }

    if (adminConfirmSubmit) {
      adminConfirmSubmit.textContent =
        'TENTAR NOVAMENTE';
    }
  }
}

async function loginAdmin(
  email,
  password
) {
  if (!window.supabaseClient) {
    showLoginMessage(
      'Não foi possível conectar ao sistema. Atualize a página.',
      'error'
    );

    return;
  }

  setLoginLoading(true);
  hideLoginMessage();

  try {
    const {
      data,
      error
    } =
      await window.supabaseClient.auth.signInWithPassword(
        {
          email,
          password
        }
      );

    if (error) {
      throw error;
    }

    currentSession =
      data.session;

    currentUser =
      data.user;

    const isAdmin =
      await verifyAdminUser();

    if (!isAdmin) {
      await window.supabaseClient.auth.signOut();

      currentSession = null;
      currentUser = null;

      showLoginMessage(
        'Este usuário existe, mas não está autorizado como administrador da Haus Barber.',
        'error'
      );

      return;
    }

    showDashboardScreen();

    await loadBookings();
  } catch (error) {
    console.error(
      'Erro no login:',
      error
    );

    const message =
      String(
        error?.message || ''
      ).toLowerCase();

    if (
      message.includes(
        'invalid login credentials'
      )
    ) {
      showLoginMessage(
        'E-mail ou senha incorretos.',
        'error'
      );
    } else if (
      message.includes(
        'email not confirmed'
      )
    ) {
      showLoginMessage(
        'Este e-mail ainda não foi confirmado no Supabase.',
        'error'
      );
    } else {
      showLoginMessage(
        'Não foi possível entrar no painel. Tente novamente.',
        'error'
      );
    }
  } finally {
    setLoginLoading(false);
  }
}

async function logoutAdmin() {
  if (!window.supabaseClient) {
    return;
  }

  try {
    await window.supabaseClient.auth.signOut();
  } catch (error) {
    console.error(
      'Erro ao sair:',
      error
    );
  }

  currentSession = null;
  currentUser = null;
  allBookings = [];

  if (adminBookingsList) {
    adminBookingsList.innerHTML =
      '';
  }

  if (adminLoginForm) {
    adminLoginForm.reset();
  }

  hideGlobalMessage();
  hideLoginMessage();

  showLoginScreen();
}

async function restoreSession() {
  if (!window.supabaseClient) {
    showLoginScreen();

    showLoginMessage(
      'Não foi possível carregar a conexão com o Supabase.',
      'error'
    );

    return;
  }

  try {
    const {
      data,
      error
    } =
      await window.supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    if (!data.session) {
      showLoginScreen();
      return;
    }

    currentSession =
      data.session;

    currentUser =
      data.session.user;

    const isAdmin =
      await verifyAdminUser();

    if (!isAdmin) {
      await window.supabaseClient.auth.signOut();

      currentSession = null;
      currentUser = null;

      showLoginScreen();

      showLoginMessage(
        'Sua conta não possui acesso administrativo.',
        'error'
      );

      return;
    }

    showDashboardScreen();

    await loadBookings();
  } catch (error) {
    console.error(
      'Erro ao restaurar sessão:',
      error
    );

    showLoginScreen();

    showLoginMessage(
      'Não foi possível restaurar sua sessão. Entre novamente.',
      'error'
    );
  }
}

function startAutoRefresh() {
  stopAutoRefresh();

  autoRefreshTimer =
    window.setInterval(
      () => {
        if (
          currentUser &&
          !document.hidden
        ) {
          loadBookings(
            {
              silent: true
            }
          );
        }
      },
      AUTO_REFRESH_MS
    );
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(
      autoRefreshTimer
    );

    autoRefreshTimer = null;
  }
}

adminLoginForm?.addEventListener(
  'submit',
  async (event) => {
    event.preventDefault();

    const email =
      adminEmailInput?.value
        .trim() ||
      '';

    const password =
      adminPasswordInput?.value ||
      '';

    if (
      !email ||
      !password
    ) {
      showLoginMessage(
        'Preencha o e-mail e a senha.',
        'error'
      );

      return;
    }

    await loginAdmin(
      email,
      password
    );
  }
);

passwordToggle?.addEventListener(
  'click',
  () => {
    if (!adminPasswordInput) {
      return;
    }

    const showingPassword =
      adminPasswordInput.type ===
      'text';

    adminPasswordInput.type =
      showingPassword
        ? 'password'
        : 'text';

    passwordToggle.textContent =
      showingPassword
        ? 'MOSTRAR'
        : 'OCULTAR';

    passwordToggle.setAttribute(
      'aria-label',
      showingPassword
        ? 'Mostrar senha'
        : 'Ocultar senha'
    );
  }
);

adminLogoutButton?.addEventListener(
  'click',
  logoutAdmin
);

adminRefreshButton?.addEventListener(
  'click',
  () => {
    loadBookings();
  }
);

adminStatusFilter?.addEventListener(
  'change',
  renderBookings
);

adminDateFilter?.addEventListener(
  'change',
  renderBookings
);

adminSearch?.addEventListener(
  'input',
  renderBookings
);

clearFiltersButton?.addEventListener(
  'click',
  () => {
    if (adminStatusFilter) {
      adminStatusFilter.value =
        'active';
    }

    if (adminDateFilter) {
      adminDateFilter.value =
        '';
    }

    if (adminSearch) {
      adminSearch.value =
        '';
    }

    renderBookings();
  }
);

adminConfirmCancel?.addEventListener(
  'click',
  closeActionModal
);

modalBackdrop?.addEventListener(
  'click',
  closeActionModal
);

adminConfirmSubmit?.addEventListener(
  'click',
  executeBookingAction
);

document.addEventListener(
  'keydown',
  (event) => {
    if (
      event.key === 'Escape' &&
      adminConfirmModal &&
      !adminConfirmModal.hidden
    ) {
      closeActionModal();
    }
  }
);

document.addEventListener(
  'visibilitychange',
  () => {
    if (
      !document.hidden &&
      currentUser
    ) {
      loadBookings(
        {
          silent: true
        }
      );
    }
  }
);

window.addEventListener(
  'focus',
  () => {
    if (currentUser) {
      loadBookings(
        {
          silent: true
        }
      );
    }
  }
);

restoreSession();
