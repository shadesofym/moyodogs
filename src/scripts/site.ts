import './reveal';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- fullscreen menu ---------- */
function initMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const closeButton = document.querySelector<HTMLButtonElement>('[data-menu-close]');
  if (!toggle || !menu) return;

  // Alles ausserhalb des Menüs wird inert, damit Tastatur und Screenreader im
  // Overlay bleiben und nicht hinter dem offenen Menü weiterlaufen.
  const behind = () =>
    Array.from(document.querySelectorAll<HTMLElement>('body > :not(#site-menu):not(script):not(style)'));

  const setOpen = (open: boolean, restoreFocus = true) => {
    menu.dataset.open = String(open);
    menu.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    behind().forEach((element) => {
      element.inert = open;
    });
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) closeButton?.focus();
    else if (restoreFocus) toggle.focus();
  };

  const focusable = () =>
    Array.from(menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter(
      (element) => element.getClientRects().length > 0,
    );

  toggle.addEventListener('click', () => setOpen(menu.dataset.open !== 'true'));
  closeButton?.addEventListener('click', () => setOpen(false));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false, false)));

  menu.addEventListener('keydown', (event) => {
    if (menu.dataset.open !== 'true') return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

/* ---------- read progress ---------- */
let progressBound = false;
function bindProgress() {
  if (progressBound) return;
  progressBound = true;
  const update = () => {
    const bar = document.querySelector<HTMLElement>('[data-progress]');
    if (!bar) return;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    bar.style.width = `${max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0}%`;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  document.addEventListener('astro:page-load', update);
}

/* ---------- counters ---------- */
function initCounters() {
  const counters = document.querySelectorAll<HTMLElement>('[data-count]');
  if (!counters.length) return;

  const finish = (el: HTMLElement) => {
    el.textContent = el.dataset.count ?? el.textContent;
  };

  if (reduced.matches || !('IntersectionObserver' in window)) {
    counters.forEach(finish);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        const target = Number(el.dataset.count);
        if (!Number.isFinite(target)) return;
        const duration = 1300;
        let start: number | null = null;
        const step = (now: number) => {
          start ??= now;
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = String(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(step);
          else finish(el);
        };
        requestAnimationFrame(step);
        // Guarantee the exact value even if the tab was backgrounded.
        window.setTimeout(() => finish(el), duration + 500);
      }),
    { threshold: 0.5 },
  );
  counters.forEach((el) => observer.observe(el));
}

/* ---------- hovering dog portraits ---------- */
function initDogPreview() {
  const preview = document.querySelector<HTMLElement>('[data-dog-preview]');
  if (!preview || !window.matchMedia('(hover: hover)').matches) return;
  const image = preview.querySelector('img');
  if (!image) return;

  document.querySelectorAll<HTMLElement>('[data-preview]').forEach((row) => {
    row.addEventListener('mouseenter', () => {
      image.src = row.dataset.preview ?? '';
      preview.dataset.on = 'true';
    });
    row.addEventListener('mouseleave', () => {
      preview.dataset.on = 'false';
    });
    row.addEventListener('mousemove', (event) => {
      preview.style.left = `${event.clientX}px`;
      preview.style.top = `${event.clientY}px`;
    });
  });
}

function init() {
  initMenu();
  bindProgress();
  initCounters();
  initDogPreview();
}

document.addEventListener('astro:page-load', init);
