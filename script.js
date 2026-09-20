const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');
const bookingForm = document.querySelector('#booking-form');

const lightbox = document.querySelector('#lightbox');
const lightboxImage = lightbox?.querySelector('img');
const lightboxCaption = document.querySelector('#lightbox-caption');
const lightboxClose = lightbox?.querySelector('.lightbox-close');
const lightboxPrev = lightbox?.querySelector('.lightbox-prev');
const lightboxNext = lightbox?.querySelector('.lightbox-next');

const galleryItems = [
  ...document.querySelectorAll('.gallery-item')
];

const filterButtons = [
  ...document.querySelectorAll('.portfolio-filter')
];

const portfolioEmpty = document.querySelector('#portfolio-empty');

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

  document.body.classList.remove('menu-open');
}

menuButton?.addEventListener('click', () => {
  const isOpen =
    navigation?.classList.toggle('open') ?? false;

  menuButton.setAttribute(
    'aria-expanded',
    String(isOpen)
  );

  menuButton.setAttribute(
    'aria-label',
    isOpen ? 'Fechar menu' : 'Abrir menu'
  );

  document.body.classList.toggle(
    'menu-open',
    isOpen
  );
});

navLinks.forEach((link) => {
  link.addEventListener('click', closeMenu);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    closeMenu();
  }
});

function getVisibleGalleryItems() {
  return galleryItems.filter(
    (item) => !item.hidden
  );
}

let lastFocusedElement = null;
let currentLightboxIndex = 0;

function renderLightboxItem(item) {
  if (!lightboxImage || !item) {
    return;
  }

  lightboxImage.src =
    item.dataset.image || '';

  lightboxImage.alt =
    item.dataset.alt || '';

  if (lightboxCaption) {
    lightboxCaption.textContent =
      item.dataset.title ||
      item.dataset.alt ||
      '';
  }
}

function openLightbox(button) {
  if (!lightbox || !lightboxImage) {
    return;
  }

  const visibleItems =
    getVisibleGalleryItems();

  currentLightboxIndex = Math.max(
    0,
    visibleItems.indexOf(button)
  );

  lastFocusedElement = button;

  renderLightboxItem(
    visibleItems[currentLightboxIndex]
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

  if (lightboxCaption) {
    lightboxCaption.textContent = '';
  }

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
    ) % visibleItems.length;

  renderLightboxItem(
    visibleItems[currentLightboxIndex]
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
  filterButtons.forEach((item) => {
    const active = activeButton
      ? item === activeButton
      : item.dataset.filter === filter;

    item.classList.toggle(
      'active',
      active
    );

    item.setAttribute(
      'aria-pressed',
      String(active)
    );
  });

  let visibleCount = 0;

  galleryItems.forEach((item) => {
    const categories = (
      item.dataset.category || ''
    )
      .split(/\s+/)
      .filter(Boolean);

    const visible =
      filter === 'all' ||
      categories.includes(filter);

    item.hidden = !visible;

    if (visible) {
      visibleCount += 1;
      item.classList.add('visible');
    }
  });

  if (portfolioEmpty) {
    portfolioEmpty.hidden =
      visibleCount > 0;
  }
}

filterButtons.forEach((button) => {
  button.addEventListener(
    'click',
    () => {
      applyPortfolioFilter(
        button.dataset.filter || 'all',
        button
      );
    }
  );
});

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

      if (event.key === 'ArrowLeft') {
        moveLightbox(-1);
        return;
      }

      if (event.key === 'ArrowRight') {
        moveLightbox(1);
        return;
      }
    }

    if (event.key === 'Escape') {
      closeMenu();
    }
  }
);

const revealItems =
  document.querySelectorAll('.reveal');

const reduceMotion =
  window
    .matchMedia(
      '(prefers-reduced-motion: reduce)'
    )
    .matches;

if (
  reduceMotion ||
  !('IntersectionObserver' in window)
) {
  revealItems.forEach((item) => {
    item.classList.add('visible');
  });
} else {
  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              'visible'
            );

            observer.unobserve(
              entry.target
            );
          }
        });
      },
      {
        threshold: 0.08
      }
    );

  revealItems.forEach((item) => {
    observer.observe(item);
  });
}

const scheduleDays =
  document.querySelector('#schedule-days');

const scheduleTimes =
  document.querySelector('#schedule-times');

const scheduleSummary =
  document.querySelector('#schedule-summary');

const selectedDateInput =
  document.querySelector('#data');

const selectedTimeInput =
  document.querySelector('#horario');

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

function cloneDate(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
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

function formatDateForMessage(dateValue) {
  const [year, month, day] =
    dateValue.split('-');

  if (!year || !month || !day) {
    return dateValue;
  }

  return `${day}/${month}/${year}`;
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

function buildAllTimeSlots() {
  const slots = [];

  for (
    let hour = 9;
    hour <= 20;
    hour += 1
  ) {
    slots.push(
      `${String(hour).padStart(2, '0')}:00`
    );

    if (hour < 20) {
      slots.push(
        `${String(hour).padStart(2, '0')}:30`
      );
    }
  }

  return slots;
}

const ALL_TIME_SLOTS =
  buildAllTimeSlots();

function getAvailableSlotsForDate(date) {
  const now = new Date();

  if (!isSameCalendarDay(date, now)) {
    return ALL_TIME_SLOTS;
  }

  const nowInMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  return ALL_TIME_SLOTS.filter(
    (slot) => {
      const [hour, minute] =
        slot
          .split(':')
          .map(Number);

      const slotInMinutes =
        hour * 60 + minute;

      return slotInMinutes >
        nowInMinutes;
    }
  );
}

function getScheduleDates() {
  const now = new Date();

  let startDate =
    cloneDate(now);

  while (
    startDate.getDay() === 0 ||
    getAvailableSlotsForDate(
      startDate
    ).length === 0
  ) {
    startDate.setDate(
      startDate.getDate() + 1
    );
  }

  const dates = [];
  let cursor =
    cloneDate(startDate);

  while (dates.length < 7) {
    if (cursor.getDay() !== 0) {
      dates.push(
        cloneDate(cursor)
      );
    }

    cursor.setDate(
      cursor.getDate() + 1
    );
  }

  return dates;
}

let selectedScheduleDate = null;
let selectedScheduleTime = '';

function updateScheduleSummary() {
  if (!scheduleSummary) {
    return;
  }

  if (
    !selectedScheduleDate ||
    !selectedScheduleTime
  ) {
    scheduleSummary.textContent =
      'Selecione um dia e um horário.';

    return;
  }

  const weekday =
    WEEKDAYS[
      selectedScheduleDate.getDay()
    ];

  const day = String(
    selectedScheduleDate.getDate()
  ).padStart(2, '0');

  const month = String(
    selectedScheduleDate.getMonth() + 1
  ).padStart(2, '0');

  scheduleSummary.innerHTML =
    `Selecionado: <strong>${weekday} • ${day}/${month} • ${selectedScheduleTime}</strong>`;
}

function selectScheduleTime(
  time,
  button
) {
  selectedScheduleTime = time;

  if (selectedTimeInput) {
    selectedTimeInput.value = time;
  }

  scheduleTimes
    ?.querySelectorAll(
      '.schedule-time'
    )
    .forEach((item) => {
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
    });

  updateScheduleSummary();
}

function renderScheduleTimes(date) {
  if (!scheduleTimes) {
    return;
  }

  scheduleTimes.innerHTML = '';
  selectedScheduleTime = '';

  if (selectedTimeInput) {
    selectedTimeInput.value = '';
  }

  const availableSlots =
    getAvailableSlotsForDate(date);

  if (!availableSlots.length) {
    const message =
      document.createElement('p');

    message.className =
      'schedule-empty';

    message.textContent =
      'Não há mais horários disponíveis neste dia.';

    scheduleTimes.appendChild(
      message
    );

    updateScheduleSummary();
    return;
  }

  availableSlots.forEach(
    (time, index) => {
      const button =
        document.createElement(
          'button'
        );

      button.type = 'button';

      button.className =
        'schedule-time';

      button.textContent = time;

      button.setAttribute(
        'aria-pressed',
        'false'
      );

      button.setAttribute(
        'aria-label',
        `Selecionar ${time}`
      );

      button.addEventListener(
        'click',
        () => {
          selectScheduleTime(
            time,
            button
          );
        }
      );

      scheduleTimes.appendChild(
        button
      );

      if (index === 0) {
        selectScheduleTime(
          time,
          button
        );
      }
    }
  );
}

function selectScheduleDate(
  date,
  button
) {
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
    .forEach((item) => {
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
    });

  renderScheduleTimes(date);
  updateScheduleSummary();
}

function renderScheduleDays() {
  if (!scheduleDays) {
    return;
  }

  scheduleDays.innerHTML = '';

  const dates =
    getScheduleDates();

  dates.forEach(
    (date, index) => {
      const button =
        document.createElement(
          'button'
        );

      button.type = 'button';

      button.className =
        'schedule-day';

      button.setAttribute(
        'aria-pressed',
        'false'
      );

      button.setAttribute(
        'aria-label',
        `Selecionar ${WEEKDAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`
      );

      button.innerHTML = `
        <small>${WEEKDAYS[date.getDay()]}</small>
        <strong>${String(date.getDate()).padStart(2, '0')}</strong>
        <span>${MONTHS[date.getMonth()]}</span>
      `;

      button.addEventListener(
        'click',
        () => {
          selectScheduleDate(
            date,
            button
          );
        }
      );

      scheduleDays.appendChild(
        button
      );

      if (index === 0) {
        selectScheduleDate(
          date,
          button
        );
      }
    }
  );
}

renderScheduleDays();

bookingForm?.addEventListener(
  'submit',
  (event) => {
    event.preventDefault();

    const nomeInput =
      document.querySelector(
        '#nome'
      );

    const serviceInput =
      document.querySelector(
        '#servico'
      );

    if (!nomeInput?.value.trim()) {
      nomeInput?.focus();
      nomeInput?.reportValidity();
      return;
    }

    if (!serviceInput?.value) {
      serviceInput?.focus();
      serviceInput?.reportValidity();
      return;
    }

    const nome =
      nomeInput.value.trim();

    const servico =
      serviceInput.value.trim();

    const dataDesejada =
      selectedDateInput?.value ||
      '';

    const horario =
      selectedTimeInput?.value ||
      '';

    if (
      !dataDesejada ||
      !horario
    ) {
      if (scheduleSummary) {
        scheduleSummary.textContent =
          'Escolha um dia e um horário antes de continuar.';

        scheduleSummary.scrollIntoView(
          {
            behavior: 'smooth',
            block: 'center'
          }
        );
      }

      return;
    }

    const message = [
      'Olá! Vim pelo site da Haus Barber.',
      '',
      `Nome: ${nome}`,
      `Serviço: ${servico}`,
      `Data desejada: ${formatDateForMessage(dataDesejada)}`,
      `Horário desejado: ${horario}`,
      '',
      'Gostaria de confirmar a disponibilidade desse horário.'
    ].join('\n');

    const whatsappUrl =
      `https://wa.me/5561995705082?text=${encodeURIComponent(message)}`;

    window.open(
      whatsappUrl,
      '_blank',
      'noopener,noreferrer'
    );
  }
);
