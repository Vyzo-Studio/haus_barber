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
const adminDateToday = document.querySelector('#admin-date-today');

const adminSelectedDayLabel = document.querySelector(
  '#admin-selected-day-label'
);

const bookingTabs = Array.from(
  document.querySelectorAll('[data-booking-view]')
);

const bookingTabPendingCount = document.querySelector(
  '#booking-tab-pending-count'
);

const bookingTabScheduledCount = document.querySelector(
  '#booking-tab-scheduled-count'
);

const bookingTabFinalizedCount = document.querySelector(
  '#booking-tab-finalized-count'
);

const adminBookingsKicker = document.querySelector(
  '#admin-bookings-kicker'
);

const adminEmptyTitle = document.querySelector(
  '#admin-empty-title'
);

const adminEmptyText = document.querySelector(
  '#admin-empty-text'
);

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

const paymentMethodSection = document.querySelector(
  '#payment-method-section'
);

const paymentMethodError = document.querySelector(
  '#payment-method-error'
);

const paymentMethodInputs = Array.from(
  document.querySelectorAll(
    'input[name="payment-method"]'
  )
);

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
const cashYearSummaryYear = document.querySelector(
  '#cash-year-summary-year'
);

const cashDailyHistory = document.querySelector('#cash-daily-history');
const cashDailyEmpty = document.querySelector('#cash-daily-empty');

const cashHistoryMonthTotal = document.querySelector(
  '#cash-history-month-total'
);

const cashYearHistory = document.querySelector('#cash-year-history');

const cashHistoryYearTotal = document.querySelector(
  '#cash-history-year-total'
);

const cashDayTemplate = document.querySelector('#cash-day-template');
const cashMonthTemplate = document.querySelector('#cash-month-template');

const cashPaymentCashTotal = document.querySelector(
  '#cash-payment-cash-total'
);

const cashPaymentCashCount = document.querySelector(
  '#cash-payment-cash-count'
);

const cashPaymentCashRefunds = document.querySelector(
  '#cash-payment-cash-refunds'
);

const cashPaymentPixTotal = document.querySelector(
  '#cash-payment-pix-total'
);

const cashPaymentPixCount = document.querySelector(
  '#cash-payment-pix-count'
);

const cashPaymentPixRefunds = document.querySelector(
  '#cash-payment-pix-refunds'
);

const cashPaymentDebitTotal = document.querySelector(
  '#cash-payment-debit-total'
);

const cashPaymentDebitCount = document.querySelector(
  '#cash-payment-debit-count'
);

const cashPaymentDebitRefunds = document.querySelector(
  '#cash-payment-debit-refunds'
);

const cashPaymentCreditTotal = document.querySelector(
  '#cash-payment-credit-total'
);

const cashPaymentCreditCount = document.querySelector(
  '#cash-payment-credit-count'
);

const cashPaymentCreditRefunds = document.querySelector(
  '#cash-payment-credit-refunds'
);

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

const PAYMENT_METHOD_LABELS = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit: 'Débito',
  credit: 'Crédito'
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
let loadingPaymentBreakdown = false;

let currentCashStatus = 'not_opened';
let currentCashDashboard = null;

let calendarWeekStart = null;

let currentBookingView = 'pending';

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

  cashMessage.classList.add(
    `is-${type}`
  );
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

  adminLoginButton.textContent =
    isLoading
      ? 'ENTRANDO...'
      : 'ENTRAR NO PAINEL';
}

function setRefreshLoading(isLoading) {
  if (!adminRefreshButton) {
    return;
  }

  adminRefreshButton.disabled = isLoading;

  adminRefreshButton.textContent =
    isLoading
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

function getBrazilDateValue(date = new Date()) {
  const parts =
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    ).formatToParts(date);

  const values = {};

  parts.forEach(
    (part) => {
      if (part.type !== 'literal') {
        values[part.type] =
          part.value;
      }
    }
  );

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
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
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
  return parseBookingDate(
    getBrazilDateValue(
      new Date()
    )
  );
}

function getMondayOfWeek(date) {
  const result =
    cloneDate(date);

  const day =
    result.getDay();

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

function isSameCalendarDay(
  dateA,
  dateB
) {
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

function formatSelectedDay(value) {
  const date =
    parseBookingDate(value);

  if (!date) {
    return '';
  }

  const weekday =
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        weekday: 'long'
      }
    )
      .format(date)
      .replace('-feira', '')
      .toUpperCase();

  return `${weekday} • ${formatFullDate(value)}`;
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
  return getBrazilDateValue(
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

function getPaymentMethodLabel(method) {
  return (
    PAYMENT_METHOD_LABELS[
      method
    ] || ''
  );
}

function formatAdminDateTrigger(value) {
  const date =
    parseBookingDate(value);

  if (!date) {
    return 'SELECIONE UMA DATA';
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
    startYear !==
    endYear
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

function updateSelectedDayLabels() {
  const value =
    adminDateFilter?.value ||
    getTodayValue();

  if (adminDateTriggerLabel) {
    adminDateTriggerLabel.textContent =
      formatAdminDateTrigger(value);
  }

  if (adminSelectedDayLabel) {
    adminSelectedDayLabel.textContent =
      formatSelectedDay(value);
  }
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
    getTodayValue();

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

function resetAgendaToToday({
  render = true,
  closePopover = true
} = {}) {
  const today =
    getBrazilDateValue(
      new Date()
    );

  const todayDate =
    parseBookingDate(
      today
    );

  if (adminDateFilter) {
    adminDateFilter.value =
      today;

    adminDateFilter.defaultValue =
      today;
  }

  if (todayDate) {
    calendarWeekStart =
      getMondayOfWeek(
        todayDate
      );
  }

  updateSelectedDayLabels();
  renderAdminDateCalendar();

  if (closePopover) {
    closeAdminDatePopover();
  }

  if (render) {
    renderBookings();
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
      getTodayValue()
    );

  if (selectedDate) {
    calendarWeekStart =
      getMondayOfWeek(
        selectedDate
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

function selectAdminCalendarDate(dateValue) {
  if (!adminDateFilter) {
    return;
  }

  adminDateFilter.value =
    dateValue;

  const selectedDate =
    parseBookingDate(
      dateValue
    );

  if (selectedDate) {
    calendarWeekStart =
      getMondayOfWeek(
        selectedDate
      );
  }

  updateSelectedDayLabels();
  renderAdminDateCalendar();
  renderBookings();
  closeAdminDatePopover();
}

function goToToday() {
  resetAgendaToToday({
    render: true,
    closePopover: true
  });
}

function moveAdminCalendarWeek(amount) {
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
  resetAgendaToToday({
    render: false,
    closePopover: true
  });
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

  resetAgendaToToday({
    render: false,
    closePopover: true
  });

  startAutoRefresh();
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

function isPendingBooking(booking) {
  return (
    getEffectiveStatus(
      booking
    ) === 'pending'
  );
}

function isScheduledBooking(booking) {
  const status =
    getEffectiveStatus(
      booking
    );

  const paymentStatus =
    booking.payment_status ||
    'unpaid';

  return (
    status === 'confirmed' &&
    (
      paymentStatus === 'unpaid' ||
      paymentStatus === 'refunded'
    )
  );
}

function isFinalizedBooking(booking) {
  const status =
    getEffectiveStatus(
      booking
    );

  const paymentStatus =
    booking.payment_status ||
    'unpaid';

  return (
    status === 'confirmed' &&
    paymentStatus === 'paid'
  );
}

function matchesCurrentBookingView(booking) {
  if (
    currentBookingView ===
    'pending'
  ) {
    return isPendingBooking(
      booking
    );
  }

  if (
    currentBookingView ===
    'scheduled'
  ) {
    return isScheduledBooking(
      booking
    );
  }

  if (
    currentBookingView ===
    'finalized'
  ) {
    return isFinalizedBooking(
      booking
    );
  }

  return false;
}

function getSelectedDayBookings() {
  const selectedDate =
    adminDateFilter?.value ||
    getTodayValue();

  return allBookings.filter(
    (booking) =>
      booking.booking_date ===
      selectedDate
  );
}

function getBookingCountsForSelectedDay() {
  const bookings =
    getSelectedDayBookings();

  return {
    pending:
      bookings.filter(
        isPendingBooking
      ).length,

    scheduled:
      bookings.filter(
        isScheduledBooking
      ).length,

    finalized:
      bookings.filter(
        isFinalizedBooking
      ).length
  };
}

function updateBookingTabCounts() {
  const counts =
    getBookingCountsForSelectedDay();

  if (bookingTabPendingCount) {
    bookingTabPendingCount.textContent =
      String(
        counts.pending
      );
  }

  if (bookingTabScheduledCount) {
    bookingTabScheduledCount.textContent =
      String(
        counts.scheduled
      );
  }

  if (bookingTabFinalizedCount) {
    bookingTabFinalizedCount.textContent =
      String(
        counts.finalized
      );
  }
}

function updateBookingTabVisuals() {
  bookingTabs.forEach(
    (tab) => {
      const view =
        tab.dataset.bookingView;

      const isActive =
        view ===
        currentBookingView;

      tab.classList.toggle(
        'is-active',
        isActive
      );

      tab.setAttribute(
        'aria-selected',
        String(isActive)
      );
    }
  );
}

function updateBookingViewTexts() {
  if (
    currentBookingView ===
    'pending'
  ) {
    if (adminBookingsKicker) {
      adminBookingsKicker.textContent =
        'PENDENTES';
    }

    if (adminEmptyTitle) {
      adminEmptyTitle.textContent =
        'NENHUM PENDENTE';
    }

    if (adminEmptyText) {
      adminEmptyText.textContent =
        'Não há solicitações aguardando confirmação neste dia.';
    }

    return;
  }

  if (
    currentBookingView ===
    'scheduled'
  ) {
    if (adminBookingsKicker) {
      adminBookingsKicker.textContent =
        'AGENDADOS';
    }

    if (adminEmptyTitle) {
      adminEmptyTitle.textContent =
        'NENHUM AGENDADO';
    }

    if (adminEmptyText) {
      adminEmptyText.textContent =
        'Não há atendimentos confirmados e em aberto neste dia.';
    }

    return;
  }

  if (adminBookingsKicker) {
    adminBookingsKicker.textContent =
      'FINALIZADOS';
  }

  if (adminEmptyTitle) {
    adminEmptyTitle.textContent =
      'NENHUM FINALIZADO';
  }

  if (adminEmptyText) {
    adminEmptyText.textContent =
      'Ainda não há atendimentos finalizados neste dia.';
  }
}

function setBookingView(view) {
  if (
    ![
      'pending',
      'scheduled',
      'finalized'
    ].includes(view)
  ) {
    return;
  }

  currentBookingView =
    view;

  updateBookingTabVisuals();
  updateBookingViewTexts();
  renderBookings();
}

function getFilteredBookings() {
  const selectedDate =
    adminDateFilter?.value ||
    getTodayValue();

  const searchTerm =
    normalizeText(
      adminSearch?.value ||
      ''
    );

  return allBookings.filter(
    (booking) => {
      if (
        booking.booking_date !==
        selectedDate
      ) {
        return false;
      }

      if (
        !matchesCurrentBookingView(
          booking
        )
      ) {
        return false;
      }

      if (searchTerm) {
        const searchable =
          normalizeText(
            [
              booking.customer_name,
              booking.service,
              getPaymentMethodLabel(
                booking.payment_method
              ),
              formatBookingTime(
                booking.booking_time
              )
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
  const counts =
    getBookingCountsForSelectedDay();

  const today =
    getTodayValue();

  const todayCount =
    allBookings.filter(
      (booking) =>
        booking.booking_date ===
          today &&
        (
          isPendingBooking(
            booking
          ) ||
          isScheduledBooking(
            booking
          ) ||
          isFinalizedBooking(
            booking
          )
        )
    ).length;

  if (statPending) {
    statPending.textContent =
      String(
        counts.pending
      );
  }

  if (statConfirmed) {
    statConfirmed.textContent =
      String(
        counts.scheduled
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

function getStatusLabel(status) {
  return (
    STATUS_LABELS[
      status
    ] ||
    status
  );
}

function getPaymentLabel(status) {
  return (
    PAYMENT_LABELS[
      status
    ] ||
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
    getStatusLabel(
      status
    );

  element.className =
    'booking-status-badge';

  element.classList.add(
    `status-${status}`
  );
}

function applyPaymentStatus(
  element,
  booking
) {
  if (!element) {
    return;
  }

  const paymentStatus =
    booking.payment_status ||
    'unpaid';

  const methodLabel =
    getPaymentMethodLabel(
      booking.payment_method
    );

  let label =
    getPaymentLabel(
      paymentStatus
    ).toUpperCase();

  if (
    paymentStatus !==
      'unpaid' &&
    methodLabel
  ) {
    label +=
      ` • ${methodLabel.toUpperCase()}`;
  }

  element.textContent =
    label;

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
      (
        paymentStatus === 'unpaid' ||
        paymentStatus === 'refunded'
      );

    paidButton.hidden =
      !canShowPaid;

    if (canShowPaid) {
      paidButton.textContent =
        paymentStatus ===
          'refunded'
          ? 'REGISTRAR NOVO PAGAMENTO'
          : 'FINALIZAR / RECEBIDO';

      paidButton.disabled =
        currentCashStatus !==
        'open';

      paidButton.title =
        currentCashStatus ===
          'open'
          ? (
              paymentStatus ===
                'refunded'
                ? 'Registrar uma nova forma de pagamento.'
                : 'Finalizar atendimento e registrar pagamento.'
            )
          : 'Abra ou reabra o caixa antes de registrar o pagamento.';

      paidButton.addEventListener(
        'click',
        () => {
          if (
            currentCashStatus !==
            'open'
          ) {
            showCashMessage(
              'Abra ou reabra o caixa antes de registrar um pagamento.',
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

      refundButton.title =
        currentCashStatus ===
          'open'
          ? 'Estornar este pagamento.'
          : 'Abra ou reabra o caixa antes de registrar um estorno.';

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
    booking
  );

  if (createdElement) {
    createdElement.textContent =
      formatCreatedAt(
        booking.created_at
      ) ||
      '—';
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

  updateSelectedDayLabels();
  updateBookingTabCounts();
  updateBookingTabVisuals();
  updateBookingViewTexts();

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
          payment_method,
          paid_at,
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
              timeZone: 'America/Sao_Paulo',
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
      'Não foi possível carregar os agendamentos.',
      'error'
    );
  } finally {
    loadingBookings = false;

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

  if (
    status === 'open'
  ) {
    cashStatusBadge.textContent =
      'CAIXA ABERTO';

    cashStatusBadge.classList.add(
      'is-open'
    );

    return;
  }

  if (
    status === 'closed'
  ) {
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

  if (
    status === 'open'
  ) {
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

function setPaymentBreakdownCard(
  method,
  row
) {
  const net =
    centsToNumber(
      row?.net_cents
    );

  const sales =
    centsToNumber(
      row?.sales_count
    );

  const refunds =
    centsToNumber(
      row?.refund_cents
    );

  let totalElement = null;
  let countElement = null;
  let refundElement = null;

  if (
    method === 'cash'
  ) {
    totalElement =
      cashPaymentCashTotal;

    countElement =
      cashPaymentCashCount;

    refundElement =
      cashPaymentCashRefunds;
  }

  if (
    method === 'pix'
  ) {
    totalElement =
      cashPaymentPixTotal;

    countElement =
      cashPaymentPixCount;

    refundElement =
      cashPaymentPixRefunds;
  }

  if (
    method === 'debit'
  ) {
    totalElement =
      cashPaymentDebitTotal;

    countElement =
      cashPaymentDebitCount;

    refundElement =
      cashPaymentDebitRefunds;
  }

  if (
    method === 'credit'
  ) {
    totalElement =
      cashPaymentCreditTotal;

    countElement =
      cashPaymentCreditCount;

    refundElement =
      cashPaymentCreditRefunds;
  }

  if (totalElement) {
    totalElement.textContent =
      formatCurrency(net);
  }

  if (countElement) {
    countElement.textContent =
      `${sales} ${
        sales === 1
          ? 'pagamento'
          : 'pagamentos'
      }`;
  }

  if (refundElement) {
    refundElement.textContent =
      `Estornos: ${formatCurrency(
        refunds
      )}`;
  }
}

function renderCashPaymentBreakdown(data) {
  const rows =
    Array.isArray(data)
      ? data
      : [];

  const methods = [
    'cash',
    'pix',
    'debit',
    'credit'
  ];

  methods.forEach(
    (method) => {
      const row =
        rows.find(
          (item) =>
            item.payment_method ===
            method
        ) || {
          payment_method: method,
          gross_cents: 0,
          sales_count: 0,
          refund_cents: 0,
          refund_count: 0,
          net_cents: 0
        };

      setPaymentBreakdownCard(
        method,
        row
      );
    }
  );
}

async function loadCashPaymentBreakdown(
  {
    silent = false
  } = {}
) {
  if (
    !window.supabaseClient ||
    loadingPaymentBreakdown
  ) {
    return;
  }

  loadingPaymentBreakdown = true;

  try {
    const today =
      getTodayValue();

    const {
      data,
      error
    } =
      await window.supabaseClient.rpc(
        'get_cash_payment_breakdown',
        {
          p_start_date: today,
          p_end_date: today
        }
      );

    if (error) {
      throw error;
    }

    renderCashPaymentBreakdown(
      data
    );
  } catch (error) {
    console.error(
      'Erro ao carregar formas de pagamento:',
      error
    );

    if (!silent) {
      showCashMessage(
        'O caixa foi carregado, mas não foi possível carregar a divisão por forma de pagamento.',
        'error'
      );
    }
  } finally {
    loadingPaymentBreakdown =
      false;
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

    await loadCashPaymentBreakdown({
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

function resetPaymentMethodSelection() {
  paymentMethodInputs.forEach(
    (input) => {
      input.checked = false;
    }
  );

  if (paymentMethodError) {
    paymentMethodError.hidden =
      true;
  }
}

function showPaymentMethodSelection() {
  if (paymentMethodSection) {
    paymentMethodSection.hidden =
      false;
  }

  resetPaymentMethodSelection();
}

function hidePaymentMethodSelection() {
  if (paymentMethodSection) {
    paymentMethodSection.hidden =
      true;
  }

  resetPaymentMethodSelection();
}

function getSelectedPaymentMethod() {
  const selected =
    paymentMethodInputs.find(
      (input) =>
        input.checked
    );

  return (
    selected?.value ||
    ''
  );
}

function getActionContent(
  booking,
  action
) {
  if (
    action ===
    'open-cash'
  ) {
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
        'O caixa de hoje será aberto em R$ 0,00. Os pagamentos registrados serão somados automaticamente.',

      button:
        'ABRIR CAIXA'
    };
  }

  if (
    action ===
    'close-cash'
  ) {
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

  if (
    action ===
    'confirm'
  ) {
    return {
      title:
        'CONFIRMAR AGENDAMENTO?',

      text:
        `Confirmar o horário de ${customer} para ${date} às ${time}? O valor previsto será ${amount}.`,

      button:
        'CONFIRMAR AGENDAMENTO'
    };
  }

  if (
    action ===
    'reject'
  ) {
    return {
      title:
        'RECUSAR SOLICITAÇÃO?',

      text:
        `Recusar a solicitação de ${customer} para ${date} às ${time}? O horário será liberado novamente.`,

      button:
        'RECUSAR SOLICITAÇÃO'
    };
  }

  if (
    action ===
    'cancel'
  ) {
    return {
      title:
        'CANCELAR AGENDAMENTO?',

      text:
        `Cancelar o agendamento de ${customer} para ${date} às ${time}? O horário será liberado novamente.`,

      button:
        'CANCELAR AGENDAMENTO'
    };
  }

  if (
    action ===
    'paid'
  ) {
    if (
      booking?.payment_status ===
      'refunded'
    ) {
      return {
        title:
          'REGISTRAR NOVO PAGAMENTO?',

        text:
          `O pagamento anterior de ${amount} foi estornado. Selecione agora a forma correta de pagamento de ${customer}.`,

        button:
          'REGISTRAR NOVO PAGAMENTO'
      };
    }

    return {
      title:
        'FINALIZAR ATENDIMENTO?',

      text:
        `Registrar ${amount} como recebido de ${customer}? Escolha abaixo como o pagamento foi realizado.`,

      button:
        'FINALIZAR / RECEBIDO'
    };
  }

  if (
    action ===
    'refund'
  ) {
    const method =
      getPaymentMethodLabel(
        booking?.payment_method
      );

    return {
      title:
        'ESTORNAR PAGAMENTO?',

      text:
        `Registrar um estorno de ${amount} referente ao atendimento de ${customer}${
          method
            ? ` pago por ${method}`
            : ''
        }? Depois do estorno, o atendimento voltará para a aba Agendados.`,

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

  if (
    action === 'paid'
  ) {
    showPaymentMethodSelection();
  } else {
    hidePaymentMethodSelection();
  }

  adminConfirmModal.hidden =
    false;

  document.body.classList.add(
    'modal-open'
  );

  if (
    action === 'paid'
  ) {
    paymentMethodInputs[
      0
    ]?.focus();
  } else {
    adminConfirmSubmit?.focus();
  }
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

  hidePaymentMethodSelection();

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

    refund:
      'refund_booking_payment'
  };

  return (
    functions[
      action
    ] ||
    ''
  );
}

async function executeBookingAction(
  booking,
  action,
  paymentMethod = ''
) {
  if (
    action === 'paid'
  ) {
    const {
      error
    } =
      await window.supabaseClient.rpc(
        'mark_booking_paid',
        {
          p_booking_id:
            booking.id,

          p_payment_method:
            paymentMethod
        }
      );

    if (error) {
      throw error;
    }

    return;
  }

  const functionName =
    getActionRpc(
      action
    );

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
    action ===
    'open-cash'
  ) {
    functionName =
      'open_cash_session';
  }

  if (
    action ===
    'close-cash'
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
      'forma de pagamento inválida'
    ) ||
    message.includes(
      'forma de pagamento invalida'
    )
  ) {
    return 'Selecione uma forma de pagamento válida.';
  }

  if (
    message.includes(
      'abra ou reabra o caixa'
    ) ||
    message.includes(
      'abra o caixa'
    )
  ) {
    return 'Abra ou reabra o caixa antes de registrar o pagamento.';
  }

  if (
    message.includes(
      'já possui um pagamento ativo'
    ) ||
    message.includes(
      'ja possui um pagamento ativo'
    ) ||
    message.includes(
      'já foi recebido'
    ) ||
    message.includes(
      'ja foi recebido'
    )
  ) {
    return 'Esse atendimento já possui um pagamento ativo.';
  }

  if (
    message.includes(
      'não possui pagamento disponível para estorno'
    ) ||
    message.includes(
      'nao possui pagamento disponivel para estorno'
    )
  ) {
    return 'Não existe um pagamento ativo para estornar.';
  }

  if (
    message.includes(
      'precisa estar confirmado'
    )
  ) {
    return 'O agendamento precisa estar confirmado antes de registrar o pagamento.';
  }

  if (
    message.includes(
      'não possui um valor válido'
    ) ||
    message.includes(
      'nao possui um valor valido'
    )
  ) {
    return 'Esse atendimento não possui um valor válido cadastrado.';
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

  const wasRefundedPayment =
    action === 'paid' &&
    booking?.payment_status ===
      'refunded';

  let paymentMethod = '';

  if (
    action === 'paid'
  ) {
    paymentMethod =
      getSelectedPaymentMethod();

    if (!paymentMethod) {
      if (paymentMethodError) {
        paymentMethodError.hidden =
          false;
      }

      return;
    }
  }

  if (adminConfirmSubmit) {
    adminConfirmSubmit.disabled =
      true;

    adminConfirmSubmit.textContent =
      'PROCESSANDO...';
  }

  setCashButtonsLoading(
    true
  );

  try {
    const wasClosed =
      currentCashStatus ===
      'closed';

    if (
      action ===
        'open-cash' ||
      action ===
        'close-cash'
    ) {
      await executeCashAction(
        action
      );
    } else {
      await executeBookingAction(
        booking,
        action,
        paymentMethod
      );
    }

    const successMessages = {
      confirm:
        'Agendamento confirmado. Ele foi movido para a aba Agendados.',

      reject:
        'Solicitação recusada e removida da agenda principal.',

      cancel:
        'Agendamento cancelado e removido da agenda principal.',

      refund:
        'Pagamento estornado. O atendimento voltou para a aba Agendados.',

      'close-cash':
        'Caixa fechado com sucesso.'
    };

    let successMessage =
      successMessages[
        action
      ] ||
      'Operação realizada com sucesso.';

    if (
      action ===
      'open-cash'
    ) {
      successMessage =
        wasClosed
          ? 'Caixa reaberto com sucesso. O faturamento anterior foi mantido.'
          : 'Caixa aberto com sucesso.';
    }

    if (
      action === 'paid'
    ) {
      const methodLabel =
        getPaymentMethodLabel(
          paymentMethod
        );

      if (
        wasRefundedPayment
      ) {
        successMessage =
          `Novo pagamento de ${formatCurrency(
            booking.service_amount_cents
          )} registrado via ${methodLabel}. O atendimento voltou para Finalizados.`;
      } else {
        successMessage =
          `${formatCurrency(
            booking.service_amount_cents
          )} recebido via ${methodLabel}. O atendimento foi movido para Finalizados.`;
      }
    }

    const cashAction =
      [
        'paid',
        'refund',
        'open-cash',
        'close-cash'
      ].includes(
        action
      );

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

      if (
        action === 'paid'
      ) {
        adminConfirmSubmit.textContent =
          wasRefundedPayment
            ? 'REGISTRAR NOVO PAGAMENTO'
            : 'FINALIZAR / RECEBIDO';
      } else {
        adminConfirmSubmit.textContent =
          'TENTAR NOVAMENTE';
      }
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

    currentBookingView =
      'pending';

    showDashboardScreen();

    populateCashYears();

    resetAgendaToToday({
      render: false,
      closePopover: true
    });

    updateBookingTabVisuals();
    updateBookingViewTexts();

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

  currentCashDashboard = null;
  currentCashStatus =
    'not_opened';

  currentBookingView =
    'pending';

  if (adminBookingsList) {
    adminBookingsList.innerHTML =
      '';
  }

  if (adminLoginForm) {
    adminLoginForm.reset();
  }

  if (adminSearch) {
    adminSearch.value = '';
  }

  renderCashPaymentBreakdown([]);

  resetAgendaToToday({
    render: false,
    closePopover: true
  });

  updateBookingTabVisuals();
  updateBookingViewTexts();

  hideGlobalMessage();
  hideCashMessage();
  hideLoginMessage();

  closeAdminDatePopover();
  closeActionModal();

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

    if (
      !data.session
    ) {
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

    currentBookingView =
      'pending';

    showDashboardScreen();

    populateCashYears();

    resetAgendaToToday({
      render: false,
      closePopover: true
    });

    updateBookingTabVisuals();
    updateBookingViewTexts();

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
    if (
      !adminPasswordInput
    ) {
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

bookingTabs.forEach(
  (tab) => {
    tab.addEventListener(
      'click',
      () => {
        setBookingView(
          tab.dataset.bookingView
        );
      }
    );
  }
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

adminDateToday?.addEventListener(
  'click',
  goToToday
);

clearFiltersButton?.addEventListener(
  'click',
  () => {
    if (adminSearch) {
      adminSearch.value = '';
    }

    renderBookings();
  }
);

paymentMethodInputs.forEach(
  (input) => {
    input.addEventListener(
      'change',
      () => {
        if (paymentMethodError) {
          paymentMethodError.hidden =
            true;
        }
      }
    );
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

window.addEventListener(
  'pageshow',
  (event) => {
    if (
      currentUser &&
      event.persisted
    ) {
      currentBookingView =
        'pending';

      resetAgendaToToday({
        render: true,
        closePopover: true
      });

      updateBookingTabVisuals();
      updateBookingViewTexts();

      refreshAllData({
        silent: true
      });
    }
  }
);

resetAgendaToToday({
  render: false,
  closePopover: true
});

renderCashPaymentBreakdown([]);

updateBookingTabVisuals();

updateBookingViewTexts();

restoreSession();
