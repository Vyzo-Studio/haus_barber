const adminLoginSection = document.querySelector('#admin-login');
const adminDashboard = document.querySelector('#admin-dashboard');
const adminLoginForm = document.querySelector('#admin-login-form');
const adminEmailInput = document.querySelector('#admin-email');
const adminPasswordInput = document.querySelector('#admin-password');
const adminLoginButton = document.querySelector('#admin-login-button');
const passwordToggle = document.querySelector('#password-toggle');
const loginMessage = document.querySelector('#login-message');

const adminUserEmail = document.querySelector('#admin-user-email');
const adminLogoutButton = document.querySelector('#admin-logout-button');
const adminRefreshButton = document.querySelector('#admin-refresh-button');

const adminStatusFilter = document.querySelector('#admin-status-filter');
const adminDateFilter = document.querySelector('#admin-date-filter');
const adminSearch = document.querySelector('#admin-search');
const clearFiltersButton = document.querySelector('#clear-filters-button');

const adminDatePicker = document.querySelector('#admin-date-picker');
const adminDateTrigger = document.querySelector('#admin-date-trigger');
const adminDateTriggerLabel = document.querySelector('#admin-date-trigger-label');
const adminDatePopover = document.querySelector('#admin-date-popover');
const adminDatePrevWeek = document.querySelector('#admin-date-prev-week');
const adminDateNextWeek = document.querySelector('#admin-date-next-week');
const adminDateWeekLabel = document.querySelector('#admin-date-week-label');
const adminDateDays = document.querySelector('#admin-date-days');
const adminDateClear = document.querySelector('#admin-date-clear');

const adminGlobalMessage = document.querySelector('#admin-global-message');
const adminLoading = document.querySelector('#admin-loading');
const adminEmpty = document.querySelector('#admin-empty');
const adminBookingsList = document.querySelector('#admin-bookings-list');
const adminLastUpdate = document.querySelector('#admin-last-update');

const statPending = document.querySelector('#stat-pending');
const statConfirmed = document.querySelector('#stat-confirmed');
const statToday = document.querySelector('#stat-today');
const statVisible = document.querySelector('#stat-visible');

const bookingCardTemplate = document.querySelector('#booking-card-template');

const adminConfirmModal = document.querySelector('#admin-confirm-modal');
const adminConfirmTitle = document.querySelector('#admin-confirm-title');
const adminConfirmText = document.querySelector('#admin-confirm-text');
const adminConfirmCancel = document.querySelector('#admin-confirm-cancel');
const adminConfirmSubmit = document.querySelector('#admin-confirm-submit');
const modalBackdrop = document.querySelector('[data-modal-close]');

const cashStatusBadge = document.querySelector('#cash-status-badge');
const cashDateLabel = document.querySelector('#cash-date-label');

const cashTodayTotal = document.querySelector('#cash-today-total');
const cashTodayCount = document.querySelector('#cash-today-count');

const cashExpectedToday = document.querySelector('#cash-expected-today');
const cashExpectedCount = document.querySelector('#cash-expected-count');

const cashReceivedToday = document.querySelector('#cash-received-today');

const cashMonthTotal = document.querySelector('#cash-month-total');
const cashMonthCount = document.querySelector('#cash-month-count');

const cashYearTotal = document.querySelector('#cash-year-total');
const cashYearCount = document.querySelector('#cash-year-count');

const cashOpenButton = document.querySelector('#cash-open-button');
const cashCloseButton = document.querySelector('#cash-close-button');
const cashMainActions = document.querySelector('.cash-main-actions');

const cashMessage = document.querySelector('#cash-message');

const cashHistoryMonth = document.querySelector('#cash-history-month');
const cashHistoryYear = document.querySelector('#cash-history-year');
const cashYearSummaryYear = document.querySelector('#cash-year-summary-year');

const cashDailyHistory = document.querySelector('#cash-daily-history');
const cashDailyEmpty = document.querySelector('#cash-daily-empty');
const cashHistoryMonthTotal = document.querySelector('#cash-history-month-total');

const cashYearHistory = document.querySelector('#cash-year-history');
const cashHistoryYearTotal = document.querySelector('#cash-history-year-total');

const cashDayTemplate = document.querySelector('#cash-day-template');
const cashMonthTemplate = document.querySelector('#cash-month-template');

const AUTO_REFRESH_MS = 30000;

const STATUS_LABELS = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  rejected: 'Recusado',
  cancelled: 'Cancelado',
  expired: 'Expirado'
};

const PAYMENT_LABELS = {
  unpaid: 'Não recebido',
  paid: 'Recebido',
  refunded: 'Estornado'
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

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const MONTH_SHORT = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ'
];

let allBookings = [];
let currentSession = null;
let currentUser = null;
let currentAction = null;

let autoRefreshTimer = null;

let loadingBookings = false;
let loadingCash = false;

let currentCashStatus = 'not_opened';
let currentCashDashboard = null;

let calendarWeekStart = null;

function showLoginMessage(message, type = 'info') {
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

  loginMessage.classList.add(`is-${type}`);
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

function showGlobalMessage(message, type = 'info') {
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

  adminGlobalMessage.classList.add(`is-${type}`);
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

function showCashMessage(message, type = 'info') {
  if (!cashMessage) {
    return;
  }

  cashMessage.hidden = false;
  cashMessage.textContent = message;

  cashMessage.classList.remove(
    'is-error',
    'is-success',
    'is-info'
  );

  cashMessage.classList.add(`is-${type}`);
}

function hideCashMessage() {
  if (!cashMessage) {
    return;
  }

  cashMessage.hidden = true;
  cashMessage.textContent = '';

  cashMessage.classList.remove(
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
    : 'ATUALIZAR PAINEL';
}

function setCashButtonsLoading(isLoading) {
  if (cashOpenButton) {
    cashOpenButton.disabled = isLoading;
  }

  if (cashCloseButton) {
    cashCloseButton.disabled = isLoading;
  }
}

function forceShowButton(button) {
  if (!button) {
    return;
  }

  button.hidden = false;
  button.removeAttribute('hidden');

  button.style.setProperty(
    'display',
    'inline-flex',
    'important'
  );

  button.style.setProperty(
    'visibility',
    'visible',
    'important'
  );

  button.style.setProperty(
    'opacity',
    '1',
    'important'
  );

  button.style.setProperty(
    'pointer-events',
    'auto',
    'important'
  );
}

function forceHideButton(button) {
  if (!button) {
    return;
  }

  button.hidden = true;
  button.setAttribute('hidden', '');

  button.style.setProperty(
    'display',
    'none',
    'important'
  );
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
    adminUserEmail.textContent = currentUser.email;
  }

  startAutoRefresh();
}

function getBrazilDateValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  ).formatToParts(date);

  const values = {};

  parts.forEach((part) => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function getBrazilCurrentYear() {
  return Number(
    new Intl.DateTimeFormat(
      'en',
      {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric'
      }
    ).format(new Date())
  );
}

function getBrazilCurrentMonth() {
  return Number(
    new Intl.DateTimeFormat(
      'en',
      {
        timeZone: 'America/Sao_Paulo',
        month: 'numeric'
      }
    ).format(new Date())
  );
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

function cloneDate(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function getBrazilTodayDate() {
  const value = getBrazilDateValue();

  return parseBookingDate(value);
}

function getMondayOfWeek(date) {
  const result = cloneDate(date);

  const day = result.getDay();

  const difference =
    day === 0
      ? -6
      : 1 - day;

  result.setDate(
    result.getDate() +
    difference
  );

  return result;
}

function isSameCalendarDay(dateA, dateB) {
  if (
    !dateA ||
    !dateB
  ) {
    return false;
  }

  return (
    dateA.getFullYear() ===
      dateB.getFullYear() &&
    dateA.getMonth() ===
      dateB.getMonth() &&
    dateA.getDate() ===
      dateB.getDate()
  );
}

function formatBookingDate(value) {
  const date =
    parseBookingDate(value);

  if (!date) {
    return value || '';
  }

  const day =
    String(
      date.getDate()
    ).padStart(2, '0');

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  return `${day}/${month}`;
}

function formatFullDate(value) {
  const date =
    parseBookingDate(value);

  if (!date) {
    return value || '';
  }

  const day =
    String(
      date.getDate()
    ).padStart(2, '0');

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  const year =
    date.getFullYear();

  return `${day}/${month}/${year}`;
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

  const date =
    new Date(value);

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
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(date);
}

function getWeekdayLabel(value) {
  const date =
    parseBookingDate(value);

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
  return getBrazilDateValue();
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

function centsToNumber(value) {
  const number =
    Number(value);

  if (
    Number.isNaN(number)
  ) {
    return 0;
  }

  return number;
}

function formatCurrency(cents) {
  const value =
    centsToNumber(cents) /
    100;

  return new Intl.NumberFormat(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL'
    }
  ).format(value);
}

function formatAdminDateTrigger(value) {
  const date =
    parseBookingDate(value);

  if (!date) {
    return 'TODAS AS DATAS';
  }

  const weekday =
    WEEKDAY_LABELS[
      date.getDay()
    ];

  const day =
    String(
      date.getDate()
    ).padStart(2, '0');

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  const year =
    date.getFullYear();

  return `${weekday} • ${day}/${month}/${year}`;
}

function formatCalendarWeekLabel(startDate) {
  if (!startDate) {
    return '';
  }

  const endDate =
    cloneDate(startDate);

  endDate.setDate(
    endDate.getDate() + 5
  );

  const startDay =
    String(
      startDate.getDate()
    ).padStart(2, '0');

  const endDay =
    String(
      endDate.getDate()
    ).padStart(2, '0');

  const startMonth =
    MONTH_SHORT[
      startDate.getMonth()
    ];

  const endMonth =
    MONTH_SHORT[
      endDate.getMonth()
    ];

  const startYear =
    startDate.getFullYear();

  const endYear =
    endDate.getFullYear();

  if (
    startYear !== endYear
  ) {
    return `${startDay} ${startMonth} ${startYear} — ${endDay} ${endMonth} ${endYear}`;
  }

  if (
    startDate.getMonth() !==
    endDate.getMonth()
  ) {
    return `${startDay} ${startMonth} — ${endDay} ${endMonth} ${endYear}`;
  }

  return `${startDay} — ${endDay} ${endMonth} ${endYear}`;
}

function setAdminDateTriggerLabel() {
  if (!adminDateTriggerLabel) {
    return;
  }

  adminDateTriggerLabel.textContent =
    formatAdminDateTrigger(
      adminDateFilter?.value ||
      ''
    );
}

function renderAdminDateCalendar() {
  if (
    !adminDateDays ||
    !calendarWeekStart
  ) {
    return;
  }

  adminDateDays.innerHTML = '';

  const selectedValue =
    adminDateFilter?.value ||
    '';

  const selectedDate =
    parseBookingDate(
      selectedValue
    );

  const today =
    getBrazilTodayDate();

  for (
    let offset = 0;
    offset < 6;
    offset += 1
  ) {
    const date =
      cloneDate(
        calendarWeekStart
      );

    date.setDate(
      calendarWeekStart.getDate() +
      offset
    );

    const button =
      document.createElement(
        'button'
      );

    const dateValue =
      formatDateValue(date);

    const weekday =
      WEEKDAY_LABELS[
        date.getDay()
      ];

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    const month =
      MONTH_SHORT[
        date.getMonth()
      ];

    button.type = 'button';

    button.className =
      'admin-calendar-day';

    button.dataset.date =
      dateValue;

    button.setAttribute(
      'aria-label',
      `Filtrar agendamentos de ${weekday}, ${day} de ${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`
    );

    button.setAttribute(
      'aria-pressed',
      String(
        selectedValue ===
        dateValue
      )
    );

    button.innerHTML = `
      <small>${weekday}</small>
      <strong>${day}</strong>
      <span>${month}</span>
    `;

    if (
      selectedDate &&
      isSameCalendarDay(
        selectedDate,
        date
      )
    ) {
      button.classList.add(
        'is-selected'
      );
    }

    if (
      today &&
      isSameCalendarDay(
        today,
        date
      )
    ) {
      button.classList.add(
        'is-today'
      );
    }

    button.addEventListener(
      'click',
      () => {
        selectAdminCalendarDate(
          dateValue
        );
      }
    );

    adminDateDays.appendChild(
      button
    );
  }

  if (adminDateWeekLabel) {
    adminDateWeekLabel.textContent =
      formatCalendarWeekLabel(
        calendarWeekStart
      );
  }
}

function openAdminDatePopover() {
  if (
    !adminDatePopover ||
    !adminDateTrigger
  ) {
    return;
  }

  const selectedDate =
    parseBookingDate(
      adminDateFilter?.value ||
      ''
    );

  if (selectedDate) {
    calendarWeekStart =
      getMondayOfWeek(
        selectedDate
      );
  } else if (!calendarWeekStart) {
    calendarWeekStart =
      getMondayOfWeek(
        getBrazilTodayDate()
      );
  }

  renderAdminDateCalendar();

  adminDatePopover.hidden =
    false;

  adminDateTrigger.setAttribute(
    'aria-expanded',
    'true'
  );
}

function closeAdminDatePopover() {
  if (
    !adminDatePopover ||
    !adminDateTrigger
  ) {
    return;
  }

  adminDatePopover.hidden =
    true;

  adminDateTrigger.setAttribute(
    'aria-expanded',
    'false'
  );
}

function toggleAdminDatePopover() {
  if (!adminDatePopover) {
    return;
  }

  if (
    adminDatePopover.hidden
  ) {
    openAdminDatePopover();
  } else {
    closeAdminDatePopover();
  }
}

function selectAdminCalendarDate(
  dateValue
) {
  if (!adminDateFilter) {
    return;
  }

  adminDateFilter.value =
    dateValue;

  setAdminDateTriggerLabel();
  renderAdminDateCalendar();
  renderBookings();
  closeAdminDatePopover();
}

function clearAdminDateSelection(
  {
    close = true,
    resetWeek = false
  } = {}
) {
  if (adminDateFilter) {
    adminDateFilter.value = '';
  }

  if (resetWeek) {
    calendarWeekStart =
      getMondayOfWeek(
        getBrazilTodayDate()
      );
  }

  setAdminDateTriggerLabel();
  renderAdminDateCalendar();
  renderBookings();

  if (close) {
    closeAdminDatePopover();
  }
}

function moveAdminCalendarWeek(
  amount
) {
  if (!calendarWeekStart) {
    calendarWeekStart =
      getMondayOfWeek(
        getBrazilTodayDate()
      );
  }

  calendarWeekStart =
    cloneDate(
      calendarWeekStart
    );

  calendarWeekStart.setDate(
    calendarWeekStart.getDate() +
    amount * 7
  );

  renderAdminDateCalendar();
}

function initializeAdminCalendar() {
  calendarWeekStart =
    getMondayOfWeek(
      getBrazilTodayDate()
    );

  setAdminDateTriggerLabel();
  renderAdminDateCalendar();
}

function isPendingExpired(booking) {
  if (
    booking.status !== 'pending' ||
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

function getEffectiveStatus(booking) {
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

function updateStats(visibleBookings) {
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
        ) === 'confirmed' &&
        booking.booking_date ===
          today
    ).length;

  if (statPending) {
    statPending.textContent =
      String(pendingCount);
  }

  if (statConfirmed) {
    statConfirmed.textContent =
      String(confirmedCount);
  }

  if (statToday) {
    statToday.textContent =
      String(todayCount);
  }

  if (statVisible) {
    statVisible.textContent =
      String(
        visibleBookings.length
      );
  }
}

function getStatusLabel(status) {
  return (
    STATUS_LABELS[status] ||
    status
  );
}

function getPaymentLabel(status) {
  return (
    PAYMENT_LABELS[status] ||
    'Não recebido'
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
    getStatusLabel(status);

  element.className =
    'booking-status-badge';

  element.classList.add(
    `status-${status}`
  );
}

function applyPaymentStatus(
  element,
  status
) {
  if (!element) {
    return;
  }

  const paymentStatus =
    status ||
    'unpaid';

  element.textContent =
    getPaymentLabel(
      paymentStatus
    ).toUpperCase();

  element.classList.remove(
    'payment-unpaid',
    'payment-paid',
    'payment-refunded'
  );

  element.classList.add(
    `payment-${paymentStatus}`
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

  const paymentStatus =
    booking.payment_status ||
    'unpaid';

  const today =
    getTodayValue();

  const confirmButton =
    card.querySelector(
      '[data-action="confirm"]'
    );

  const rejectButton =
    card.querySelector(
      '[data-action="reject"]'
    );

  const paidButton =
    card.querySelector(
      '[data-action="paid"]'
    );

  const refundButton =
    card.querySelector(
      '[data-action="refund"]'
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

  if (paidButton) {
    const canShowPaid =
      status === 'confirmed' &&
      paymentStatus === 'unpaid' &&
      booking.booking_date ===
        today;

    paidButton.hidden =
      !canShowPaid;

    if (canShowPaid) {
      paidButton.disabled =
        currentCashStatus !==
        'open';

      if (
        currentCashStatus !==
        'open'
      ) {
        paidButton.title =
          'Abra ou reabra o caixa antes de registrar o pagamento.';
      }

      paidButton.addEventListener(
        'click',
        () => {
          if (
            currentCashStatus !==
            'open'
          ) {
            showCashMessage(
              'Abra ou reabra o caixa antes de finalizar um atendimento.',
              'error'
            );

            return;
          }

          openActionModal(
            booking,
            'paid'
          );
        }
      );
    }
  }

  if (refundButton) {
    const canShowRefund =
      paymentStatus ===
      'paid';

    refundButton.hidden =
      !canShowRefund;

    if (canShowRefund) {
      refundButton.disabled =
        currentCashStatus !==
        'open';

      if (
        currentCashStatus !==
        'open'
      ) {
        refundButton.title =
          'Abra ou reabra o caixa antes de registrar um estorno.';
      }

      refundButton.addEventListener(
        'click',
        () => {
          if (
            currentCashStatus !==
            'open'
          ) {
            showCashMessage(
              'Abra ou reabra o caixa antes de registrar um estorno.',
              'error'
            );

            return;
          }

          openActionModal(
            booking,
            'refund'
          );
        }
      );
    }
  }

  if (cancelButton) {
    const canCancel =
      status === 'confirmed' &&
      paymentStatus !==
        'paid';

    cancelButton.hidden =
      !canCancel;

    if (canCancel) {
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
}

function createBookingCard(booking) {
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

  const amountElement =
    card.querySelector(
      '[data-booking-amount]'
    );

  const paymentElement =
    card.querySelector(
      '[data-booking-payment]'
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

  if (amountElement) {
    amountElement.textContent =
      formatCurrency(
        booking.service_amount_cents
      );
  }

  applyPaymentStatus(
    paymentElement,
    booking.payment_status
  );

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
  if (!window.supabaseClient) {
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
          formatDateValue(start),

        p_end_date:
          formatDateValue(end)
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
  }

  try {
    await expireOldPendingBookings();

    const {
      data,
      error
    } =
      await window.supabaseClient
        .from('bookings')
        .select(`
          id,
          customer_name,
          service,
          service_amount_cents,
          booking_date,
          booking_time,
          status,
          payment_status,
          expires_at,
          completed_at,
          created_at,
          updated_at
        `)
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
              hour:
                '2-digit',
              minute:
                '2-digit',
              second:
                '2-digit'
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
      'Não foi possível carregar os agendamentos.',
      'error'
    );
  } finally {
    loadingBookings =
      false;

    if (adminLoading) {
      adminLoading.hidden =
        true;
    }
  }
}

function updateCashStatusBadge(status) {
  if (!cashStatusBadge) {
    return;
  }

  cashStatusBadge.classList.remove(
    'is-open',
    'is-closed',
    'is-not-opened'
  );

  if (status === 'open') {
    cashStatusBadge.textContent =
      'CAIXA ABERTO';

    cashStatusBadge.classList.add(
      'is-open'
    );

    return;
  }

  if (status === 'closed') {
    cashStatusBadge.textContent =
      'CAIXA FECHADO';

    cashStatusBadge.classList.add(
      'is-closed'
    );

    return;
  }

  cashStatusBadge.textContent =
    'CAIXA NÃO ABERTO';

  cashStatusBadge.classList.add(
    'is-not-opened'
  );
}

function updateCashButtons(status) {
  if (cashMainActions) {
    cashMainActions.style.setProperty(
      'display',
      'flex',
      'important'
    );

    cashMainActions.style.setProperty(
      'visibility',
      'visible',
      'important'
    );

    cashMainActions.style.setProperty(
      'opacity',
      '1',
      'important'
    );
  }

  if (status === 'open') {
    forceHideButton(
      cashOpenButton
    );

    if (cashCloseButton) {
      cashCloseButton.textContent =
        'FECHAR CAIXA';
    }

    forceShowButton(
      cashCloseButton
    );

    return;
  }

  forceHideButton(
    cashCloseButton
  );

  if (cashOpenButton) {
    cashOpenButton.textContent =
      status === 'closed'
        ? 'REABRIR CAIXA'
        : 'ABRIR CAIXA';
  }

  forceShowButton(
    cashOpenButton
  );
}

function renderCashDashboard(data) {
  const row =
    Array.isArray(data)
      ? data[0]
      : data;

  if (!row) {
    return;
  }

  currentCashDashboard =
    row;

  currentCashStatus =
    row.cash_status ||
    'not_opened';

  updateCashStatusBadge(
    currentCashStatus
  );

  updateCashButtons(
    currentCashStatus
  );

  if (cashDateLabel) {
    cashDateLabel.textContent =
      formatFullDate(
        row.business_date
      );
  }

  if (cashTodayTotal) {
    cashTodayTotal.textContent =
      formatCurrency(
        row.today_received_cents
      );
  }

  if (cashReceivedToday) {
    cashReceivedToday.textContent =
      formatCurrency(
        row.today_received_cents
      );
  }

  if (cashTodayCount) {
    const count =
      centsToNumber(
        row.today_received_count
      );

    cashTodayCount.textContent =
      `${count} ${
        count === 1
          ? 'atendimento recebido'
          : 'atendimentos recebidos'
      }`;
  }

  if (cashExpectedToday) {
    cashExpectedToday.textContent =
      formatCurrency(
        row.today_expected_cents
      );
  }

  if (cashExpectedCount) {
    const count =
      centsToNumber(
        row.today_expected_count
      );

    cashExpectedCount.textContent =
      `${count} ${
        count === 1
          ? 'atendimento confirmado'
          : 'atendimentos confirmados'
      }`;
  }

  if (cashMonthTotal) {
    cashMonthTotal.textContent =
      formatCurrency(
        row.month_total_cents
      );
  }

  if (cashMonthCount) {
    const count =
      centsToNumber(
        row.month_received_count
      );

    cashMonthCount.textContent =
      `${count} ${
        count === 1
          ? 'atendimento recebido'
          : 'atendimentos recebidos'
      }`;
  }

  if (cashYearTotal) {
    cashYearTotal.textContent =
      formatCurrency(
        row.year_total_cents
      );
  }

  if (cashYearCount) {
    const count =
      centsToNumber(
        row.year_received_count
      );

    cashYearCount.textContent =
      `${count} ${
        count === 1
          ? 'atendimento recebido'
          : 'atendimentos recebidos'
      }`;
  }

  renderBookings();
}

async function loadCashDashboard(
  {
    silent = false
  } = {}
) {
  if (
    !window.supabaseClient ||
    loadingCash
  ) {
    return;
  }

  loadingCash = true;

  if (!silent) {
    hideCashMessage();
  }

  try {
    const {
      data,
      error
    } =
      await window.supabaseClient.rpc(
        'get_cash_dashboard'
      );

    if (error) {
      throw error;
    }

    renderCashDashboard(
      data
    );
  } catch (error) {
    console.error(
      'Erro ao carregar caixa:',
      error
    );

    if (!silent) {
      showCashMessage(
        'Não foi possível carregar os dados do caixa.',
        'error'
      );
    }
  } finally {
    loadingCash = false;
  }
}

function populateCashYears() {
  const currentYear =
    getBrazilCurrentYear();

  const firstYear =
    Math.min(
      2026,
      currentYear
    );

  const options = [];

  for (
    let year = currentYear;
    year >= firstYear;
    year -= 1
  ) {
    options.push(
      `<option value="${year}">${year}</option>`
    );
  }

  if (cashHistoryYear) {
    cashHistoryYear.innerHTML =
      options.join('');

    cashHistoryYear.value =
      String(currentYear);
  }

  if (cashYearSummaryYear) {
    cashYearSummaryYear.innerHTML =
      options.join('');

    cashYearSummaryYear.value =
      String(currentYear);
  }

  if (cashHistoryMonth) {
    cashHistoryMonth.value =
      String(
        getBrazilCurrentMonth()
      );
  }
}

function renderDailyHistory(data) {
  if (!cashDailyHistory) {
    return;
  }

  const rows =
    Array.isArray(data)
      ? data
      : [];

  cashDailyHistory.innerHTML =
    '';

  if (cashDailyEmpty) {
    cashDailyEmpty.hidden =
      rows.length > 0;
  }

  let totalNet = 0;

  rows.forEach(
    (row) => {
      totalNet +=
        centsToNumber(
          row.net_cents
        );

      if (!cashDayTemplate) {
        return;
      }

      const fragment =
        cashDayTemplate
          .content
          .cloneNode(true);

      const dateElement =
        fragment.querySelector(
          '[data-cash-day-date]'
        );

      const statusElement =
        fragment.querySelector(
          '[data-cash-day-status]'
        );

      const countElement =
        fragment.querySelector(
          '[data-cash-day-count]'
        );

      const grossElement =
        fragment.querySelector(
          '[data-cash-day-gross]'
        );

      const refundsElement =
        fragment.querySelector(
          '[data-cash-day-refunds]'
        );

      const netElement =
        fragment.querySelector(
          '[data-cash-day-net]'
        );

      if (dateElement) {
        dateElement.textContent =
          formatFullDate(
            row.business_date
          );
      }

      if (statusElement) {
        statusElement.textContent =
          row.cash_status ===
            'open'
            ? 'Caixa aberto'
            : 'Caixa fechado';
      }

      if (countElement) {
        countElement.textContent =
          String(
            centsToNumber(
              row.sales_count
            )
          );
      }

      if (grossElement) {
        grossElement.textContent =
          formatCurrency(
            row.gross_cents
          );
      }

      if (refundsElement) {
        refundsElement.textContent =
          formatCurrency(
            row.refunds_cents
          );
      }

      if (netElement) {
        netElement.textContent =
          formatCurrency(
            row.net_cents
          );
      }

      cashDailyHistory.appendChild(
        fragment
      );
    }
  );

  if (cashHistoryMonthTotal) {
    cashHistoryMonthTotal.textContent =
      formatCurrency(
        totalNet
      );
  }
}

async function loadMonthlyHistory(
  {
    silent = false
  } = {}
) {
  if (
    !window.supabaseClient ||
    !cashHistoryMonth ||
    !cashHistoryYear
  ) {
    return;
  }

  const month =
    Number(
      cashHistoryMonth.value
    );

  const year =
    Number(
      cashHistoryYear.value
    );

  try {
    const {
      data,
      error
    } =
      await window.supabaseClient.rpc(
        'get_cash_month_daily',
        {
          p_year: year,
          p_month: month
        }
      );

    if (error) {
      throw error;
    }

    renderDailyHistory(
      data
    );
  } catch (error) {
    console.error(
      'Erro ao carregar histórico mensal:',
      error
    );

    if (!silent) {
      showCashMessage(
        'Não foi possível carregar o histórico mensal.',
        'error'
      );
    }
  }
}

function renderYearHistory(data) {
  if (!cashYearHistory) {
    return;
  }

  const rows =
    Array.isArray(data)
      ? data
      : [];

  cashYearHistory.innerHTML =
    '';

  let totalYear = 0;

  rows.forEach(
    (row) => {
      totalYear +=
        centsToNumber(
          row.net_cents
        );

      if (!cashMonthTemplate) {
        return;
      }

      const fragment =
        cashMonthTemplate
          .content
          .cloneNode(true);

      const monthElement =
        fragment.querySelector(
          '[data-cash-month-name]'
        );

      const countElement =
        fragment.querySelector(
          '[data-cash-month-count]'
        );

      const totalElement =
        fragment.querySelector(
          '[data-cash-month-total]'
        );

      const monthIndex =
        Number(
          row.month_number
        ) - 1;

      if (monthElement) {
        monthElement.textContent =
          MONTH_NAMES[
            monthIndex
          ] ||
          `Mês ${row.month_number}`;
      }

      if (countElement) {
        const count =
          centsToNumber(
            row.sales_count
          );

        countElement.textContent =
          `${count} ${
            count === 1
              ? 'atendimento'
              : 'atendimentos'
          }`;
      }

      if (totalElement) {
        totalElement.textContent =
          formatCurrency(
            row.net_cents
          );
      }

      cashYearHistory.appendChild(
        fragment
      );
    }
  );

  if (cashHistoryYearTotal) {
    cashHistoryYearTotal.textContent =
      formatCurrency(
        totalYear
      );
  }
}

async function loadYearHistory(
  {
    silent = false
  } = {}
) {
  if (
    !window.supabaseClient ||
    !cashYearSummaryYear
  ) {
    return;
  }

  const year =
    Number(
      cashYearSummaryYear.value
    );

  try {
    const {
      data,
      error
    } =
      await window.supabaseClient.rpc(
        'get_cash_year_monthly',
        {
          p_year: year
        }
      );

    if (error) {
      throw error;
    }

    renderYearHistory(
      data
    );
  } catch (error) {
    console.error(
      'Erro ao carregar histórico anual:',
      error
    );

    if (!silent) {
      showCashMessage(
        'Não foi possível carregar o histórico anual.',
        'error'
      );
    }
  }
}

async function refreshAllData(
  {
    silent = false
  } = {}
) {
  if (!silent) {
    setRefreshLoading(true);
  }

  try {
    await loadCashDashboard({
      silent
    });

    await loadBookings({
      silent
    });

    await loadMonthlyHistory({
      silent
    });

    await loadYearHistory({
      silent
    });
  } finally {
    if (!silent) {
      setRefreshLoading(false);
    }
  }
}

function getActionContent(
  booking,
  action
) {
  if (action === 'open-cash') {
    if (
      currentCashStatus ===
      'closed'
    ) {
      return {
        title:
          'REABRIR CAIXA?',

        text:
          `O caixa será reaberto mantendo o faturamento atual de ${formatCurrency(
            currentCashDashboard?.today_received_cents
          )}.`,

        button:
          'REABRIR CAIXA'
      };
    }

    return {
      title:
        'ABRIR CAIXA?',

      text:
        'O caixa de hoje será aberto em R$ 0,00. Os valores recebidos serão somados durante o dia.',

      button:
        'ABRIR CAIXA'
    };
  }

  if (action === 'close-cash') {
    return {
      title:
        'FECHAR CAIXA?',

      text:
        `O caixa será fechado com ${formatCurrency(
          currentCashDashboard?.today_received_cents
        )} de faturamento real. Você poderá reabri-lo depois se precisar.`,

      button:
        'FECHAR CAIXA'
    };
  }

  const customer =
    booking?.customer_name ||
    'Cliente';

  const date =
    formatBookingDate(
      booking?.booking_date
    );

  const time =
    formatBookingTime(
      booking?.booking_time
    );

  const amount =
    formatCurrency(
      booking?.service_amount_cents
    );

  if (action === 'confirm') {
    return {
      title:
        'CONFIRMAR AGENDAMENTO?',

      text:
        `Confirmar o horário de ${customer} para ${date} às ${time}? O valor previsto será ${amount}.`,

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
        `Cancelar o agendamento de ${customer} para ${date} às ${time}? O horário será liberado novamente.`,

      button:
        'CANCELAR AGENDAMENTO'
    };
  }

  if (action === 'paid') {
    return {
      title:
        'FINALIZAR ATENDIMENTO?',

      text:
        `Registrar ${amount} como recebido pelo atendimento de ${customer}? Esse valor será adicionado ao caixa de hoje.`,

      button:
        'FINALIZAR / RECEBIDO'
    };
  }

  if (action === 'refund') {
    return {
      title:
        'ESTORNAR PAGAMENTO?',

      text:
        `Registrar um estorno de ${amount} referente ao atendimento de ${customer}? O valor será descontado do faturamento.`,

      button:
        'CONFIRMAR ESTORNO'
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

  closeAdminDatePopover();

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

    adminConfirmSubmit.disabled =
      false;
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

function getActionRpc(action) {
  const functions = {
    confirm:
      'admin_confirm_booking',

    reject:
      'admin_reject_booking',

    cancel:
      'admin_cancel_booking',

    paid:
      'mark_booking_paid',

    refund:
      'refund_booking_payment'
  };

  return (
    functions[action] ||
    ''
  );
}

async function executeBookingAction(
  booking,
  action
) {
  const functionName =
    getActionRpc(action);

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
}

async function executeCashAction(action) {
  let functionName = '';

  if (
    action === 'open-cash'
  ) {
    functionName =
      'open_cash_session';
  }

  if (
    action === 'close-cash'
  ) {
    functionName =
      'close_cash_session';
  }

  if (!functionName) {
    throw new Error(
      'Ação de caixa inválida.'
    );
  }

  const {
    error
  } =
    await window.supabaseClient.rpc(
      functionName
    );

  if (error) {
    throw error;
  }
}

function getFriendlyActionError(error) {
  const message =
    String(
      error?.message ||
      ''
    ).toLowerCase();

  if (
    message.includes(
      'abra o caixa'
    )
  ) {
    return 'Abra ou reabra o caixa antes de registrar esse pagamento.';
  }

  if (
    message.includes(
      'já foi recebido'
    ) ||
    message.includes(
      'ja foi recebido'
    )
  ) {
    return 'Esse atendimento já foi registrado como recebido.';
  }

  if (
    message.includes(
      'já foi estornado'
    ) ||
    message.includes(
      'ja foi estornado'
    )
  ) {
    return 'Esse pagamento já foi estornado.';
  }

  if (
    message.includes(
      'só é possível finalizar'
    ) ||
    message.includes(
      'so e possivel finalizar'
    )
  ) {
    return 'Somente atendimentos marcados para hoje podem ser finalizados.';
  }

  if (
    message.includes(
      'precisa estar confirmado'
    )
  ) {
    return 'O atendimento precisa estar confirmado antes de ser recebido.';
  }

  if (
    message.includes(
      'estorno antes de cancelar'
    )
  ) {
    return 'Esse atendimento já foi recebido. Faça o estorno antes de cancelar.';
  }

  if (
    message.includes(
      'expirou'
    )
  ) {
    return 'Essa solicitação já expirou.';
  }

  if (
    message.includes(
      'não autorizado'
    ) ||
    message.includes(
      'nao autorizado'
    )
  ) {
    return 'Sua conta não possui permissão para realizar essa ação.';
  }

  return 'Não foi possível concluir essa ação. Atualize o painel e tente novamente.';
}

async function executeCurrentAction() {
  if (
    !currentAction ||
    !window.supabaseClient
  ) {
    return;
  }

  const action =
    currentAction.action;

  const booking =
    currentAction.booking;

  if (adminConfirmSubmit) {
    adminConfirmSubmit.disabled =
      true;

    adminConfirmSubmit.textContent =
      'PROCESSANDO...';
  }

  setCashButtonsLoading(true);

  try {
    const wasClosed =
      currentCashStatus ===
      'closed';

    if (
      action === 'open-cash' ||
      action === 'close-cash'
    ) {
      await executeCashAction(
        action
      );
    } else {
      await executeBookingAction(
        booking,
        action
      );
    }

    const successMessages = {
      confirm:
        'Agendamento confirmado. O valor entrou no faturamento previsto.',

      reject:
        'Solicitação recusada. O horário foi liberado.',

      cancel:
        'Agendamento cancelado. O horário foi liberado.',

      paid:
        'Atendimento finalizado. O valor foi adicionado ao caixa.',

      refund:
        'Estorno registrado. O valor foi descontado do faturamento.',

      'close-cash':
        'Caixa fechado com sucesso.'
    };

    let successMessage =
      successMessages[action] ||
      'Operação realizada com sucesso.';

    if (
      action === 'open-cash'
    ) {
      successMessage =
        wasClosed
          ? 'Caixa reaberto com sucesso. O faturamento anterior foi mantido.'
          : 'Caixa aberto com sucesso. O caixa de hoje começou em R$ 0,00.';
    }

    const cashAction =
      [
        'paid',
        'refund',
        'open-cash',
        'close-cash'
      ].includes(action);

    closeActionModal();

    if (cashAction) {
      showCashMessage(
        successMessage,
        'success'
      );
    } else {
      showGlobalMessage(
        successMessage,
        'success'
      );
    }

    await refreshAllData({
      silent: true
    });
  } catch (error) {
    console.error(
      'Erro ao executar ação:',
      error
    );

    const friendlyMessage =
      getFriendlyActionError(
        error
      );

    if (adminConfirmText) {
      adminConfirmText.textContent =
        friendlyMessage;
    }

    if (adminConfirmSubmit) {
      adminConfirmSubmit.disabled =
        false;

      adminConfirmSubmit.textContent =
        'TENTAR NOVAMENTE';
    }
  } finally {
    setCashButtonsLoading(
      false
    );
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
      await window.supabaseClient.auth.signInWithPassword({
        email,
        password
      });

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

    populateCashYears();
    initializeAdminCalendar();

    await refreshAllData();
  } catch (error) {
    console.error(
      'Erro no login:',
      error
    );

    const message =
      String(
        error?.message ||
        ''
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
    setLoginLoading(
      false
    );
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

  currentCashDashboard =
    null;

  currentCashStatus =
    'not_opened';

  if (adminBookingsList) {
    adminBookingsList.innerHTML =
      '';
  }

  if (adminLoginForm) {
    adminLoginForm.reset();
  }

  if (adminDateFilter) {
    adminDateFilter.value =
      '';
  }

  initializeAdminCalendar();

  hideGlobalMessage();
  hideCashMessage();
  hideLoginMessage();

  closeAdminDatePopover();

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

    populateCashYears();
    initializeAdminCalendar();

    await refreshAllData();
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
          refreshAllData({
            silent: true
          });
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

    autoRefreshTimer =
      null;
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
    refreshAllData();
  }
);

cashOpenButton?.addEventListener(
  'click',
  () => {
    openActionModal(
      null,
      'open-cash'
    );
  }
);

cashCloseButton?.addEventListener(
  'click',
  () => {
    openActionModal(
      null,
      'close-cash'
    );
  }
);

cashHistoryMonth?.addEventListener(
  'change',
  () => {
    loadMonthlyHistory();
  }
);

cashHistoryYear?.addEventListener(
  'change',
  () => {
    loadMonthlyHistory();
  }
);

cashYearSummaryYear?.addEventListener(
  'change',
  () => {
    loadYearHistory();
  }
);

adminStatusFilter?.addEventListener(
  'change',
  renderBookings
);

adminSearch?.addEventListener(
  'input',
  renderBookings
);

adminDateTrigger?.addEventListener(
  'click',
  (event) => {
    event.stopPropagation();

    toggleAdminDatePopover();
  }
);

adminDatePopover?.addEventListener(
  'click',
  (event) => {
    event.stopPropagation();
  }
);

adminDatePrevWeek?.addEventListener(
  'click',
  () => {
    moveAdminCalendarWeek(
      -1
    );
  }
);

adminDateNextWeek?.addEventListener(
  'click',
  () => {
    moveAdminCalendarWeek(
      1
    );
  }
);

adminDateClear?.addEventListener(
  'click',
  () => {
    clearAdminDateSelection({
      close: true,
      resetWeek: true
    });
  }
);

clearFiltersButton?.addEventListener(
  'click',
  () => {
    if (adminStatusFilter) {
      adminStatusFilter.value =
        'active';
    }

    if (adminSearch) {
      adminSearch.value =
        '';
    }

    clearAdminDateSelection({
      close: true,
      resetWeek: true
    });

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
  executeCurrentAction
);

document.addEventListener(
  'click',
  (event) => {
    if (
      adminDatePicker &&
      !adminDatePicker.contains(
        event.target
      )
    ) {
      closeAdminDatePopover();
    }
  }
);

document.addEventListener(
  'keydown',
  (event) => {
    if (
      event.key !==
      'Escape'
    ) {
      return;
    }

    if (
      adminConfirmModal &&
      !adminConfirmModal.hidden
    ) {
      closeActionModal();
      return;
    }

    if (
      adminDatePopover &&
      !adminDatePopover.hidden
    ) {
      closeAdminDatePopover();

      adminDateTrigger?.focus();
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
      refreshAllData({
        silent: true
      });
    }
  }
);

window.addEventListener(
  'focus',
  () => {
    if (currentUser) {
      refreshAllData({
        silent: true
      });
    }
  }
);

initializeAdminCalendar();
restoreSession();
