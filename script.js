const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');
const bookingForm = document.querySelector('#booking-form');
const bookingSubmit = document.querySelector('#booking-submit');
const bookingStatus = document.querySelector('#booking-status');
const scheduleDays = document.querySelector('#schedule-days');
const scheduleTimes = document.querySelector('#schedule-times');
const scheduleSummary = document.querySelector('#schedule-summary');
const selectedDateInput = document.querySelector('#data');
const selectedTimeInput = document.querySelector('#horario');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = lightbox?.querySelector('img');
const lightboxClose = lightbox?.querySelector('.lightbox-close');
const lightboxPrev = lightbox?.querySelector('.lightbox-prev');
const lightboxNext = lightbox?.querySelector('.lightbox-next');

const galleryItems = [
  ...document.querySelectorAll('.portfolio-gallery .gallery-item')
];

const filterButtons = [
  ...document.querySelectorAll('.portfolio-filter')
];

const portfolioEmpty = document.querySelector('#portfolio-empty');
const revealItems = document.querySelectorAll('.reveal');

const WEEKDAYS = [
  'DOM',
  'SEG',
  'TER',
  'QUA',
  'QUI',
  'SEX',
  'SÁB'
];

const MONTHS = [
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

const REFRESH_INTERVAL_MS = 30000;

let currentLightboxIndex = 0;
let lastFocusedElement = null;
let selectedScheduleDate = null;
let selectedScheduleTime = '';
let displayWeekDates = [];
let bookedSlots = new Map();
let scheduleRefreshTimer = null;
let scheduleRequestRunning = false;

function closeMenu() {
  navigation?.classList.remove('open');

  menuButton?.setAttribute(
    'aria-expanded',
    'false'
  );

  menuButton?.setAttribute(
    'aria-label',
    'Abrir menu'
  );

  document.body.classList.remove(
    'menu-open'
  );
}

menuButton?.addEventListener(
  'click',
  () => {
    const isOpen =
      navigation?.classList.toggle(
        'open'
      ) ?? false;

    menuButton.setAttribute(
      'aria-expanded',
      String(isOpen)
    );

    menuButton.setAttribute(
      'aria-label',
      isOpen
        ? 'Fechar menu'
        : 'Abrir menu'
    );

    document.body.classList.toggle(
      'menu-open',
      isOpen
    );
  }
);

navLinks.forEach((link) => {
  link.addEventListener(
    'click',
    closeMenu
  );
});

window.addEventListener(
  'resize',
  () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  }
);

function getVisibleGalleryItems() {
  return galleryItems.filter(
    (item) => !item.hidden
  );
}

function renderLightboxItem(item) {
  if (!lightboxImage || !item) {
    return;
  }

  lightboxImage.src =
    item.dataset.image || '';

  lightboxImage.alt =
    item.dataset.alt || '';
}

function openLightbox(button) {
  if (!lightbox || !lightboxImage) {
    return;
  }

  const visibleItems =
    getVisibleGalleryItems();

  const itemIndex =
    visibleItems.indexOf(button);

  if (itemIndex < 0) {
    return;
  }

  currentLightboxIndex =
    itemIndex;

  lastFocusedElement =
    button;

  renderLightboxItem(
    visibleItems[
      currentLightboxIndex
    ]
  );

  lightbox.hidden = false;

  document.body.classList.add(
    'lightbox-open'
  );

  lightboxClose?.focus();
}

function closeLightbox() {
  if (!lightbox || !lightboxImage) {
    return;
  }

  lightbox.hidden = true;

  lightboxImage.src = '';
  lightboxImage.alt = '';

  document.body.classList.remove(
    'lightbox-open'
  );

  lastFocusedElement?.focus();
}

function moveLightbox(direction) {
  const visibleItems =
    getVisibleGalleryItems();

  if (!visibleItems.length) {
    return;
  }

  currentLightboxIndex =
    (
      currentLightboxIndex +
      direction +
      visibleItems.length
    ) %
    visibleItems.length;

  renderLightboxItem(
    visibleItems[
      currentLightboxIndex
    ]
  );
}

galleryItems.forEach((item) => {
  item.addEventListener(
    'click',
    () => openLightbox(item)
  );
});

lightboxClose?.addEventListener(
  'click',
  closeLightbox
);

lightboxPrev?.addEventListener(
  'click',
  () => moveLightbox(-1)
);

lightboxNext?.addEventListener(
  'click',
  () => moveLightbox(1)
);

lightbox?.addEventListener(
  'click',
  (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  }
);

function applyPortfolioFilter(
  filter,
  activeButton = null
) {
  filterButtons.forEach(
    (button) => {
      const active =
        activeButton
          ? button === activeButton
          : button.dataset.filter ===
            filter;

      button.classList.toggle(
        'active',
        active
      );

      button.setAttribute(
        'aria-pressed',
        String(active)
      );
    }
  );

  let visibleCount = 0;

  galleryItems.forEach(
    (item) => {
      const categories =
        (
          item.dataset.category ||
          ''
        )
          .split(/\s+/)
          .filter(Boolean);

      const visible =
        filter === 'all' ||
        categories.includes(filter);

      item.hidden = !visible;

      if (visible) {
        visibleCount += 1;
      }
    }
  );

  if (portfolioEmpty) {
    portfolioEmpty.hidden =
      visibleCount > 0;
  }
}

filterButtons.forEach(
  (button) => {
    button.addEventListener(
      'click',
      () => {
        applyPortfolioFilter(
          button.dataset.filter ||
            'all',
          button
        );
      }
    );
  }
);

const initialPortfolioFilter =
  document.querySelector(
    '.portfolio-filter[data-filter="freestyle"]'
  );

applyPortfolioFilter(
  'freestyle',
  initialPortfolioFilter
);

document.addEventListener(
  'keydown',
  (event) => {
    if (
      lightbox &&
      !lightbox.hidden
    ) {
      if (event.key === 'Escape') {
        closeLightbox();
        return;
      }

      if (
        event.key === 'ArrowLeft'
      ) {
        moveLightbox(-1);
        return;
      }

      if (
        event.key === 'ArrowRight'
      ) {
        moveLightbox(1);
        return;
      }
    }

    if (event.key === 'Escape') {
      closeMenu();
    }
  }
);

const reduceMotion =
  window
    .matchMedia(
      '(prefers-reduced-motion: reduce)'
    )
    .matches;

if (
  reduceMotion ||
  !(
    'IntersectionObserver' in
    window
  )
) {
  revealItems.forEach(
    (item) =>
      item.classList.add(
        'visible'
      )
  );
} else {
  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (
              entry.isIntersecting
            ) {
              entry.target.classList.add(
                'visible'
              );

              observer.unobserve(
                entry.target
              );
            }
          }
        );
      },
      {
        threshold: 0.08
      }
    );

  revealItems.forEach(
    (item) =>
      observer.observe(item)
  );
}

function cloneDate(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function startOfDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function addDays(
  date,
  amount
) {
  const result =
    cloneDate(date);

  result.setDate(
    result.getDate() + amount
  );

  return result;
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

function formatDateForMessage(
  dateValue
) {
  const [
    year,
    month,
    day
  ] = dateValue.split('-');

  if (
    !year ||
    !month ||
    !day
  ) {
    return dateValue;
  }

  return `${day}/${month}/${year}`;
}

function formatTimeValue(value) {
  return String(
    value || ''
  ).slice(0, 5);
}

function isSameCalendarDay(
  firstDate,
  secondDate
) {
  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  );
}

function isPastDate(date) {
  return (
    startOfDay(date) <
    startOfDay(new Date())
  );
}

function getMondayForDisplayedWeek() {
  const today =
    startOfDay(
      new Date()
    );

  const dayOfWeek =
    today.getDay();

  if (dayOfWeek === 0) {
    return addDays(
      today,
      1
    );
  }

  if (dayOfWeek === 6) {
    return addDays(
      today,
      2
    );
  }

  return addDays(
    today,
    -(dayOfWeek - 1)
  );
}

function getDisplayedWeekDates() {
  const monday =
    getMondayForDisplayedWeek();

  return Array.from(
    {
      length: 6
    },
    (_, index) =>
      addDays(
        monday,
        index
      )
  );
}

function buildAllTimeSlots() {
  const slots = [];

  for (
    let hour = 9;
    hour <= 20;
    hour += 1
  ) {
    slots.push(
      `${String(hour).padStart(
        2,
        '0'
      )}:00`
    );

    if (hour < 20) {
      slots.push(
        `${String(hour).padStart(
          2,
          '0'
        )}:30`
      );
    }
  }

  return slots;
}

const ALL_TIME_SLOTS =
  buildAllTimeSlots();

function isTimePastForDate(
  date,
  time
) {
  const now = new Date();

  if (
    !isSameCalendarDay(
      date,
      now
    )
  ) {
    return false;
  }

  const [
    hour,
    minute
  ] = time
    .split(':')
    .map(Number);

  const slotDate =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour,
      minute,
      0,
      0
    );

  return slotDate <= now;
}

function getSlotKey(
  dateValue,
  timeValue
) {
  return (
    `${dateValue}|` +
    `${formatTimeValue(
      timeValue
    )}`
  );
}

function getSlotStatus(
  dateValue,
  timeValue
) {
  return (
    bookedSlots.get(
      getSlotKey(
        dateValue,
        timeValue
      )
    ) ||
    'available'
  );
}

function showBookingStatus(
  message,
  type = 'info'
) {
  if (!bookingStatus) {
    return;
  }

  bookingStatus.hidden = false;

  bookingStatus.textContent =
    message;

  bookingStatus.classList.remove(
    'is-success',
    'is-error',
    'is-info'
  );

  bookingStatus.classList.add(
    `is-${type}`
  );
}

function hideBookingStatus() {
  if (!bookingStatus) {
    return;
  }

  bookingStatus.hidden = true;
  bookingStatus.textContent = '';

  bookingStatus.classList.remove(
    'is-success',
    'is-error',
    'is-info'
  );
}

function updateScheduleSummary() {
  if (!scheduleSummary) {
    return;
  }

  if (
    !selectedScheduleDate
  ) {
    scheduleSummary.textContent =
      'Escolha um dia para ver os horários.';

    return;
  }

  if (
    !selectedScheduleTime
  ) {
    scheduleSummary.textContent =
      'Escolha um horário disponível.';

    return;
  }

  const weekday =
    WEEKDAYS[
      selectedScheduleDate.getDay()
    ];

  const day =
    String(
      selectedScheduleDate.getDate()
    ).padStart(2, '0');

  const month =
    String(
      selectedScheduleDate.getMonth() +
        1
    ).padStart(2, '0');

  scheduleSummary.innerHTML =
    `Selecionado: <strong>${weekday} • ${day}/${month} • ${selectedScheduleTime}</strong>`;
}

function selectScheduleTime(
  time,
  button
) {
  if (button.disabled) {
    return;
  }

  selectedScheduleTime =
    time;

  if (selectedTimeInput) {
    selectedTimeInput.value =
      time;
  }

  scheduleTimes
    ?.querySelectorAll(
      '.schedule-time'
    )
    .forEach(
      (item) => {
        const active =
          item === button;

        item.classList.toggle(
          'is-active',
          active
        );

        item.setAttribute(
          'aria-pressed',
          String(active)
        );
      }
    );

  hideBookingStatus();
  updateScheduleSummary();
}

function createTimeButton(
  date,
  time
) {
  const dateValue =
    formatDateValue(date);

  const status =
    getSlotStatus(
      dateValue,
      time
    );

  const past =
    isTimePastForDate(
      date,
      time
    );

  const button =
    document.createElement(
      'button'
    );

  button.type = 'button';

  button.className =
    'schedule-time';

  button.dataset.time =
    time;

  button.setAttribute(
    'aria-pressed',
    'false'
  );

  const label =
    document.createElement(
      'span'
    );

  label.className =
    'schedule-time-label';

  label.textContent =
    time;

  button.appendChild(
    label
  );

  if (past) {
    button.disabled = true;

    button.classList.add(
      'is-occupied'
    );

    button.setAttribute(
      'aria-label',
      `${time}, horário indisponível`
    );

    return button;
  }

  if (
    status === 'occupied'
  ) {
    button.disabled = true;

    button.classList.add(
      'is-occupied'
    );

    button.setAttribute(
      'aria-label',
      `${time}, ocupado`
    );

    return button;
  }

  if (
    status === 'pending'
  ) {
    button.disabled = true;

    button.classList.add(
      'is-pending'
    );

    button.setAttribute(
      'aria-label',
      `${time}, reservado temporariamente`
    );

    return button;
  }

  button.setAttribute(
    'aria-label',
    `Selecionar ${time}`
  );

  button.addEventListener(
    'click',
    () =>
      selectScheduleTime(
        time,
        button
      )
  );

  return button;
}

function renderScheduleTimes(
  date,
  keepSelection = true
) {
  if (!scheduleTimes) {
    return;
  }

  const previousTime =
    keepSelection
      ? selectedScheduleTime
      : '';

  scheduleTimes.innerHTML =
    '';

  selectedScheduleTime =
    '';

  if (selectedTimeInput) {
    selectedTimeInput.value =
      '';
  }

  const availableButtons =
    [];

  ALL_TIME_SLOTS.forEach(
    (time) => {
      const button =
        createTimeButton(
          date,
          time
        );

      scheduleTimes.appendChild(
        button
      );

      if (!button.disabled) {
        availableButtons.push(
          button
        );
      }
    }
  );

  if (
    !availableButtons.length
  ) {
    const message =
      document.createElement(
        'p'
      );

    message.className =
      'schedule-empty';

    message.textContent =
      'Não há horários disponíveis neste dia.';

    scheduleTimes.appendChild(
      message
    );

    updateScheduleSummary();
    return;
  }

  const previousButton =
    previousTime
      ? availableButtons.find(
          (button) =>
            button.dataset.time ===
            previousTime
        )
      : null;

  const buttonToSelect =
    previousButton ||
    availableButtons[0];

  if (buttonToSelect) {
    selectScheduleTime(
      buttonToSelect.dataset.time,
      buttonToSelect
    );
  }
}

function selectScheduleDate(
  date,
  button,
  keepTimeSelection = false
) {
  if (button.disabled) {
    return;
  }

  selectedScheduleDate =
    cloneDate(date);

  if (selectedDateInput) {
    selectedDateInput.value =
      formatDateValue(date);
  }

  scheduleDays
    ?.querySelectorAll(
      '.schedule-day'
    )
    .forEach(
      (item) => {
        const active =
          item === button;

        item.classList.toggle(
          'is-active',
          active
        );

        item.setAttribute(
          'aria-pressed',
          String(active)
        );
      }
    );

  renderScheduleTimes(
    date,
    keepTimeSelection
  );

  hideBookingStatus();
  updateScheduleSummary();
}

function dayHasAnyPotentialSlot(
  date
) {
  if (isPastDate(date)) {
    return false;
  }

  return ALL_TIME_SLOTS.some(
    (time) => {
      if (
        isTimePastForDate(
          date,
          time
        )
      ) {
        return false;
      }

      const status =
        getSlotStatus(
          formatDateValue(date),
          time
        );

      return (
        status === 'available'
      );
    }
  );
}

function renderScheduleDays() {
  if (!scheduleDays) {
    return;
  }

  scheduleDays.innerHTML = '';

  const previousDateValue =
    selectedScheduleDate
      ? formatDateValue(
          selectedScheduleDate
        )
      : '';

  let selectedButton = null;
  let firstSelectableButton =
    null;

  displayWeekDates.forEach(
    (date) => {
      const button =
        document.createElement(
          'button'
        );

      const dateValue =
        formatDateValue(date);

      const disabled =
        isPastDate(date) ||
        !dayHasAnyPotentialSlot(
          date
        );

      button.type = 'button';

      button.className =
        'schedule-day';

      button.dataset.date =
        dateValue;

      button.setAttribute(
        'aria-pressed',
        'false'
      );

      button.setAttribute(
        'aria-label',
        `${WEEKDAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`
      );

      button.innerHTML = `
        <small>${WEEKDAYS[date.getDay()]}</small>
        <strong>${String(date.getDate()).padStart(2, '0')}</strong>
        <span>${MONTHS[date.getMonth()]}</span>
      `;

      if (disabled) {
        button.disabled =
          true;

        button.classList.add(
          'is-disabled'
        );
      } else {
        button.addEventListener(
          'click',
          () =>
            selectScheduleDate(
              date,
              button
            )
        );

        if (
          !firstSelectableButton
        ) {
          firstSelectableButton =
            button;
        }
      }

      if (
        !disabled &&
        previousDateValue ===
          dateValue
      ) {
        selectedButton =
          button;
      }

      scheduleDays.appendChild(
        button
      );
    }
  );

  const buttonToSelect =
    selectedButton ||
    firstSelectableButton;

  if (buttonToSelect) {
    const date =
      displayWeekDates.find(
        (item) =>
          formatDateValue(
            item
          ) ===
          buttonToSelect.dataset.date
      );

    if (date) {
      selectScheduleDate(
        date,
        buttonToSelect,
        Boolean(
          selectedButton
        )
      );
    }
  } else {
    selectedScheduleDate =
      null;

    selectedScheduleTime =
      '';

    if (selectedDateInput) {
      selectedDateInput.value =
        '';
    }

    if (selectedTimeInput) {
      selectedTimeInput.value =
        '';
    }

    scheduleTimes.innerHTML =
      '';

    const message =
      document.createElement(
        'p'
      );

    message.className =
      'schedule-empty';

    message.textContent =
      'Não há horários disponíveis nesta semana.';

    scheduleTimes.appendChild(
      message
    );

    updateScheduleSummary();
  }
}

function setScheduleLoading(
  isLoading
) {
  scheduleDays
    ?.querySelectorAll(
      'button'
    )
    .forEach(
      (button) => {
        if (isLoading) {
          button.classList.add(
            'is-loading'
          );
        } else {
          button.classList.remove(
            'is-loading'
          );
        }
      }
    );

  scheduleTimes
    ?.querySelectorAll(
      'button'
    )
    .forEach(
      (button) => {
        if (isLoading) {
          button.classList.add(
            'is-loading'
          );
        } else {
          button.classList.remove(
            'is-loading'
          );
        }
      }
    );
}

async function loadBookedSlots(
  {
    silent = false
  } = {}
) {
  if (
    !window.supabaseClient ||
    !displayWeekDates.length ||
    scheduleRequestRunning
  ) {
    return false;
  }

  scheduleRequestRunning =
    true;

  if (!silent) {
    setScheduleLoading(true);
  }

  const startDate =
    formatDateValue(
      displayWeekDates[0]
    );

  const endDate =
    formatDateValue(
      displayWeekDates[
        displayWeekDates.length -
          1
      ]
    );

  try {
    const {
      data,
      error
    } =
      await window.supabaseClient.rpc(
        'get_public_booked_slots',
        {
          p_start_date:
            startDate,
          p_end_date:
            endDate
        }
      );

    if (error) {
      throw error;
    }

    const nextBookedSlots =
      new Map();

    (
      data || []
    ).forEach(
      (slot) => {
        const dateValue =
          String(
            slot.booking_date ||
              ''
          ).slice(0, 10);

        const timeValue =
          formatTimeValue(
            slot.booking_time
          );

        const status =
          slot.slot_status ===
          'pending'
            ? 'pending'
            : 'occupied';

        if (
          dateValue &&
          timeValue
        ) {
          nextBookedSlots.set(
            getSlotKey(
              dateValue,
              timeValue
            ),
            status
          );
        }
      }
    );

    bookedSlots =
      nextBookedSlots;

    renderScheduleDays();

    return true;
  } catch (error) {
    console.error(
      'Erro ao carregar agenda:',
      error
    );

    if (!silent) {
      showBookingStatus(
        'Não foi possível carregar a disponibilidade agora. Atualize a página em alguns instantes.',
        'error'
      );
    }

    return false;
  } finally {
    scheduleRequestRunning =
      false;

    setScheduleLoading(false);
  }
}

function getFriendlyBookingError(
  error
) {
  const message =
    String(
      error?.message || ''
    ).toLowerCase();

  if (
    message.includes(
      'não está mais disponível'
    ) ||
    message.includes(
      'nao esta mais disponivel'
    ) ||
    (
      message.includes(
        'horário'
      ) &&
      message.includes(
        'disponível'
      )
    )
  ) {
    return 'Esse horário acabou de ficar indisponível. Escolha outro horário.';
  }

  if (
    message.includes(
      'domingo'
    )
  ) {
    return 'A Haus Barber não atende aos domingos.';
  }

  if (
    message.includes(
      'já passou'
    ) ||
    message.includes(
      'ja passou'
    )
  ) {
    return 'Esse horário já passou. Escolha outro horário.';
  }

  if (
    message.includes(
      'fora do período'
    ) ||
    message.includes(
      'fora do periodo'
    )
  ) {
    return 'Escolha um horário entre 09:00 e 20:00.';
  }

  if (
    message.includes(
      'network'
    ) ||
    message.includes(
      'fetch'
    )
  ) {
    return 'Não foi possível conectar ao sistema de agenda. Verifique sua internet e tente novamente.';
  }

  return 'Não foi possível reservar esse horário agora. Tente novamente.';
}

function buildWhatsAppMessage(
  {
    nome,
    servico,
    data,
    horario
  }
) {
  return [
    'Olá! Vim pelo site da Haus Barber.',
    '',
    `Nome: ${nome}`,
    `Serviço: ${servico}`,
    `Data desejada: ${formatDateForMessage(data)}`,
    `Horário desejado: ${horario}`,
    '',
    'O site reservou esse horário temporariamente. Gostaria de confirmar meu agendamento.'
  ].join('\n');
}

async function createBookingRequest(
  {
    nome,
    servico,
    data,
    horario
  }
) {
  const {
    data: bookingId,
    error
  } =
    await window.supabaseClient.rpc(
      'create_booking_request',
      {
        p_customer_name:
          nome,
        p_service:
          servico,
        p_booking_date:
          data,
        p_booking_time:
          `${horario}:00`
      }
    );

  if (error) {
    throw error;
  }

  return bookingId;
}

bookingForm?.addEventListener(
  'submit',
  async (event) => {
    event.preventDefault();

    if (
      !window.supabaseClient
    ) {
      showBookingStatus(
        'O sistema de agenda ainda não conseguiu conectar. Atualize a página e tente novamente.',
        'error'
      );

      return;
    }

    const nameInput =
      document.querySelector(
        '#nome'
      );

    const serviceInput =
      document.querySelector(
        '#servico'
      );

    if (
      !nameInput?.checkValidity()
    ) {
      nameInput?.reportValidity();
      nameInput?.focus();
      return;
    }

    if (
      !serviceInput?.checkValidity()
    ) {
      serviceInput?.reportValidity();
      serviceInput?.focus();
      return;
    }

    const nome =
      nameInput.value.trim();

    const servico =
      serviceInput.value.trim();

    const data =
      selectedDateInput?.value ||
      '';

    const horario =
      selectedTimeInput?.value ||
      '';

    if (
      !data ||
      !horario
    ) {
      showBookingStatus(
        'Escolha um dia e um horário disponível.',
        'error'
      );

      scheduleSummary?.scrollIntoView(
        {
          behavior: 'smooth',
          block: 'center'
        }
      );

      return;
    }

    const currentStatus =
      getSlotStatus(
        data,
        horario
      );

    if (
      currentStatus !==
      'available'
    ) {
      showBookingStatus(
        'Esse horário não está mais disponível. Escolha outro.',
        'error'
      );

      await loadBookedSlots();

      return;
    }

    const whatsappWindow =
      window.open(
        '',
        '_blank'
      );

    if (bookingSubmit) {
      bookingSubmit.disabled =
        true;

      bookingSubmit.textContent =
        'RESERVANDO HORÁRIO...';
    }

    showBookingStatus(
      'Reservando seu horário por até 30 minutos...',
      'info'
    );

    try {
      await createBookingRequest(
        {
          nome,
          servico,
          data,
          horario
        }
      );

      bookedSlots.set(
        getSlotKey(
          data,
          horario
        ),
        'pending'
      );

      renderScheduleDays();

      showBookingStatus(
        'Horário reservado temporariamente por até 30 minutos. Abrindo o WhatsApp para você confirmar com a Haus Barber.',
        'success'
      );

      const message =
        buildWhatsAppMessage(
          {
            nome,
            servico,
            data,
            horario
          }
        );

      const whatsappUrl =
        `https://wa.me/5561995705082?text=${encodeURIComponent(message)}`;

      if (
        whatsappWindow &&
        !whatsappWindow.closed
      ) {
        whatsappWindow.location.href =
          whatsappUrl;
      } else {
        window.location.href =
          whatsappUrl;
      }
    } catch (error) {
      console.error(
        'Erro ao criar agendamento:',
        error
      );

      if (
        whatsappWindow &&
        !whatsappWindow.closed
      ) {
        whatsappWindow.close();
      }

      showBookingStatus(
        getFriendlyBookingError(
          error
        ),
        'error'
      );

      await loadBookedSlots(
        {
          silent: true
        }
      );
    } finally {
      if (bookingSubmit) {
        bookingSubmit.disabled =
          false;

        bookingSubmit.textContent =
          'CONTINUAR NO WHATSAPP';
      }
    }
  }
);

function startScheduleAutoRefresh() {
  if (
    scheduleRefreshTimer
  ) {
    clearInterval(
      scheduleRefreshTimer
    );
  }

  scheduleRefreshTimer =
    window.setInterval(
      () => {
        loadBookedSlots(
          {
            silent: true
          }
        );
      },
      REFRESH_INTERVAL_MS
    );
}

async function initializeSchedule() {
  if (
    !scheduleDays ||
    !scheduleTimes
  ) {
    return;
  }

  displayWeekDates =
    getDisplayedWeekDates();

  renderScheduleDays();

  if (
    !window.supabaseClient
  ) {
    showBookingStatus(
      'O sistema de agenda não conseguiu iniciar. Verifique a configuração do Supabase.',
      'error'
    );

    if (bookingSubmit) {
      bookingSubmit.disabled =
        true;
    }

    return;
  }

  const loaded =
    await loadBookedSlots();

  if (
    !loaded &&
    bookingSubmit
  ) {
    bookingSubmit.disabled =
      true;
  }

  startScheduleAutoRefresh();
}

window.addEventListener(
  'focus',
  () => {
    loadBookedSlots(
      {
        silent: true
      }
    );
  }
);

document.addEventListener(
  'visibilitychange',
  () => {
    if (!document.hidden) {
      loadBookedSlots(
        {
          silent: true
        }
      );
    }
  }
);

initializeSchedule();
