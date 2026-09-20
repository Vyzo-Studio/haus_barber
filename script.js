(function () {
  'use strict';

  function safeInit(name, initializer) {
    try {
      initializer();
    } catch (error) {
      console.error(`[Haus Barber] Falha em ${name}:`, error);
    }
  }

  function initMenu() {
    const menuButton = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.main-nav a');

    if (!menuButton || !navigation) {
      return;
    }

    function closeMenu() {
      navigation.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Abrir menu');
      document.body.classList.remove('menu-open');
    }

    menuButton.addEventListener('click', function () {
      const isOpen = navigation.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      document.body.classList.toggle('menu-open', isOpen);
    });

    navLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
  }

  function initPortfolio() {
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    const filterButtons = Array.from(document.querySelectorAll('.portfolio-filter'));
    const portfolioEmpty = document.querySelector('#portfolio-empty');
    const lightbox = document.querySelector('#lightbox');
    const lightboxImage = lightbox ? lightbox.querySelector('img') : null;
    const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;
    const lightboxPrev = lightbox ? lightbox.querySelector('.lightbox-prev') : null;
    const lightboxNext = lightbox ? lightbox.querySelector('.lightbox-next') : null;

    let lastFocusedElement = null;
    let currentLightboxIndex = 0;

    function getVisibleGalleryItems() {
      return galleryItems.filter(function (item) {
        return !item.hidden;
      });
    }

    function renderLightboxItem(item) {
      if (!lightboxImage || !item) {
        return;
      }

      lightboxImage.src = item.dataset.image || '';
      lightboxImage.alt = item.dataset.alt || '';
    }

    function openLightbox(button) {
      if (!lightbox || !lightboxImage) {
        return;
      }

      const visibleItems = getVisibleGalleryItems();
      const index = visibleItems.indexOf(button);

      if (index < 0) {
        return;
      }

      currentLightboxIndex = index;
      lastFocusedElement = button;
      renderLightboxItem(visibleItems[currentLightboxIndex]);
      lightbox.hidden = false;
      document.body.classList.add('lightbox-open');

      if (lightboxClose) {
        lightboxClose.focus();
      }
    }

    function closeLightbox() {
      if (!lightbox || !lightboxImage) {
        return;
      }

      lightbox.hidden = true;
      lightboxImage.src = '';
      lightboxImage.alt = '';
      document.body.classList.remove('lightbox-open');

      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    }

    function moveLightbox(direction) {
      const visibleItems = getVisibleGalleryItems();

      if (!visibleItems.length) {
        return;
      }

      currentLightboxIndex = (
        currentLightboxIndex + direction + visibleItems.length
      ) % visibleItems.length;

      renderLightboxItem(visibleItems[currentLightboxIndex]);
    }

    function applyPortfolioFilter(filter, activeButton) {
      filterButtons.forEach(function (button) {
        const active = activeButton
          ? button === activeButton
          : button.dataset.filter === filter;

        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });

      let visibleCount = 0;

      galleryItems.forEach(function (item) {
        const categories = (item.dataset.category || '')
          .split(/\s+/)
          .filter(Boolean);

        const visible = filter === 'all' || categories.includes(filter);
        item.hidden = !visible;

        if (visible) {
          visibleCount += 1;
          item.classList.add('visible');
        }
      });

      if (portfolioEmpty) {
        portfolioEmpty.hidden = visibleCount > 0;
      }
    }

    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        applyPortfolioFilter(button.dataset.filter || 'all', button);
      });
    });

    const initialButton = document.querySelector(
      '.portfolio-filter[data-filter="freestyle"]'
    );

    applyPortfolioFilter('freestyle', initialButton);

    galleryItems.forEach(function (item) {
      item.addEventListener('click', function () {
        openLightbox(item);
      });
    });

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', function () {
        moveLightbox(-1);
      });
    }

    if (lightboxNext) {
      lightboxNext.addEventListener('click', function () {
        moveLightbox(1);
      });
    }

    if (lightbox) {
      lightbox.addEventListener('click', function (event) {
        if (event.target === lightbox) {
          closeLightbox();
        }
      });
    }

    document.addEventListener('keydown', function (event) {
      if (!lightbox || lightbox.hidden) {
        return;
      }

      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        moveLightbox(-1);
      } else if (event.key === 'ArrowRight') {
        moveLightbox(1);
      }
    });
  }

  function initReveal() {
    const revealItems = document.querySelectorAll('.reveal');

    if (!revealItems.length) {
      return;
    }

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach(function (item) {
        item.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08
      }
    );

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initScheduler() {
    const scheduleDays = document.querySelector('#schedule-days');
    const scheduleTimes = document.querySelector('#schedule-times');
    const scheduleSummary = document.querySelector('#schedule-summary');
    const selectedDateInput = document.querySelector('#data');
    const selectedTimeInput = document.querySelector('#horario');

    if (
      !scheduleDays ||
      !scheduleTimes ||
      !scheduleSummary ||
      !selectedDateInput ||
      !selectedTimeInput
    ) {
      return;
    }

    const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

    let selectedDate = null;
    let selectedTime = '';

    function cloneDate(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function todayAtMidnight() {
      return cloneDate(new Date());
    }

    function formatISODate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function formatDateForMessage(value) {
      const parts = value.split('-');

      if (parts.length !== 3) {
        return value;
      }

      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function isSameDay(a, b) {
      return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
      );
    }

    function buildTimeSlots() {
      const slots = [];

      for (let hour = 9; hour <= 20; hour += 1) {
        slots.push(`${String(hour).padStart(2, '0')}:00`);

        if (hour < 20) {
          slots.push(`${String(hour).padStart(2, '0')}:30`);
        }
      }

      return slots;
    }

    const allTimeSlots = buildTimeSlots();

    function getAvailableTimes(date) {
      const now = new Date();

      if (!isSameDay(date, now)) {
        return allTimeSlots.slice();
      }

      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      return allTimeSlots.filter(function (time) {
        const parts = time.split(':');
        const minutes = Number(parts[0]) * 60 + Number(parts[1]);
        return minutes > currentMinutes;
      });
    }

    function getDisplayedWeek() {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const start = cloneDate(now);

      if (dayOfWeek === 0) {
        start.setDate(start.getDate() + 1);
      } else if (dayOfWeek === 6) {
        start.setDate(start.getDate() + 2);
      } else {
        start.setDate(start.getDate() - (dayOfWeek - 1));
      }

      const dates = [];

      for (let offset = 0; offset < 6; offset += 1) {
        const date = cloneDate(start);
        date.setDate(start.getDate() + offset);
        dates.push(date);
      }

      return dates;
    }

    function isDateUnavailable(date) {
      const today = todayAtMidnight();

      if (date < today) {
        return true;
      }

      if (isSameDay(date, new Date()) && getAvailableTimes(date).length === 0) {
        return true;
      }

      return false;
    }

    function updateSummary() {
      if (!selectedDate || !selectedTime) {
        scheduleSummary.textContent = 'Selecione um dia e um horário.';
        return;
      }

      const weekday = WEEKDAYS[selectedDate.getDay()];
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');

      scheduleSummary.innerHTML = `Selecionado: <strong>${weekday} • ${day}/${month} • ${selectedTime}</strong>`;
    }

    function selectTime(time, button) {
      selectedTime = time;
      selectedTimeInput.value = time;

      scheduleTimes.querySelectorAll('.schedule-time').forEach(function (item) {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });

      updateSummary();
    }

    function renderTimes(date) {
      scheduleTimes.innerHTML = '';
      selectedTime = '';
      selectedTimeInput.value = '';

      const times = getAvailableTimes(date);

      if (!times.length) {
        const empty = document.createElement('p');
        empty.className = 'schedule-empty';
        empty.textContent = 'Não há mais horários disponíveis neste dia.';
        scheduleTimes.appendChild(empty);
        updateSummary();
        return;
      }

      times.forEach(function (time, index) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'schedule-time';
        button.textContent = time;
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', `Selecionar horário ${time}`);

        button.addEventListener('click', function () {
          selectTime(time, button);
        });

        scheduleTimes.appendChild(button);

        if (index === 0) {
          selectTime(time, button);
        }
      });
    }

    function selectDate(date, button) {
      selectedDate = cloneDate(date);
      selectedDateInput.value = formatISODate(date);

      scheduleDays.querySelectorAll('.schedule-day').forEach(function (item) {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });

      renderTimes(date);
      updateSummary();
    }

    function renderDays() {
      scheduleDays.innerHTML = '';
      const dates = getDisplayedWeek();
      let firstAvailableButton = null;
      let firstAvailableDate = null;

      dates.forEach(function (date) {
        const unavailable = isDateUnavailable(date);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'schedule-day';
        button.disabled = unavailable;
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute(
          'aria-label',
          `${WEEKDAYS[date.getDay()]} ${String(date.getDate()).padStart(2, '0')} de ${MONTHS[date.getMonth()]}`
        );

        button.innerHTML = `
          <small>${WEEKDAYS[date.getDay()]}</small>
          <strong>${String(date.getDate()).padStart(2, '0')}</strong>
          <span>${MONTHS[date.getMonth()]}</span>
        `;

        if (unavailable) {
          button.classList.add('is-disabled');
        } else {
          button.addEventListener('click', function () {
            selectDate(date, button);
          });

          if (!firstAvailableButton) {
            firstAvailableButton = button;
            firstAvailableDate = date;
          }
        }

        scheduleDays.appendChild(button);
      });

      if (firstAvailableButton && firstAvailableDate) {
        selectDate(firstAvailableDate, firstAvailableButton);
      } else {
        scheduleSummary.textContent = 'Não há dias disponíveis nesta semana.';
      }
    }

    renderDays();

    const bookingForm = document.querySelector('#booking-form');

    if (!bookingForm) {
      return;
    }

    bookingForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const nomeInput = document.querySelector('#nome');
      const serviceInput = document.querySelector('#servico');
      const nome = nomeInput ? nomeInput.value.trim() : '';
      const servico = serviceInput ? serviceInput.value.trim() : '';
      const data = selectedDateInput.value;
      const horario = selectedTimeInput.value;

      if (!nome) {
        if (nomeInput) {
          nomeInput.focus();
          nomeInput.reportValidity();
        }
        return;
      }

      if (!servico) {
        if (serviceInput) {
          serviceInput.focus();
          serviceInput.reportValidity();
        }
        return;
      }

      if (!data || !horario) {
        scheduleSummary.textContent = 'Escolha um dia e um horário antes de continuar.';
        scheduleSummary.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const message = [
        'Olá! Vim pelo site da Haus Barber.',
        '',
        `Nome: ${nome}`,
        `Serviço: ${servico}`,
        `Data desejada: ${formatDateForMessage(data)}`,
        `Horário desejado: ${horario}`,
        '',
        'Gostaria de confirmar a disponibilidade desse horário.'
      ].join('\n');

      const whatsappUrl = `https://wa.me/5561995705082?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    });
  }

  function start() {
    safeInit('menu', initMenu);
    safeInit('portfólio', initPortfolio);
    safeInit('animações', initReveal);
    safeInit('agendamento', initScheduler);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
