const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');
const bookingForm = document.querySelector('#booking-form');
const dateInput = document.querySelector('#data');

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

function getLocalDateString() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    now.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

if (dateInput) {
  dateInput.min = getLocalDateString();
}

bookingForm?.addEventListener(
  'submit',
  (event) => {
    event.preventDefault();

    if (!bookingForm.reportValidity()) {
      return;
    }

    const data = new FormData(bookingForm);

    const nome = String(
      data.get('nome') || ''
    ).trim();

    const servico = String(
      data.get('servico') || ''
    ).trim();

    const dataDesejada = String(
      data.get('data') || ''
    ).trim();

    const horario = String(
      data.get('horario') || ''
    ).trim();

    const [year, month, day] =
      dataDesejada.split('-');

    const formattedDate =
      year && month && day
        ? `${day}/${month}/${year}`
        : dataDesejada;

    const message = [
      'Olá! Vim pelo site da Haus Barber.',
      '',
      `👤 Nome: ${nome}`,
      `✂️ Serviço: ${servico}`,
      `📅 Data desejada: ${formattedDate}`,
      `🕐 Horário desejado: ${horario}`,
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
    '.portfolio-filter.active'
  );

applyPortfolioFilter(
  initialPortfolioFilter?.dataset.filter ||
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
