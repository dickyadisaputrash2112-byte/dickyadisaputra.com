document.getElementById('year').textContent = new Date().getFullYear();

// Keep navigation reachable at tablet and phone widths.
const menuButton = document.querySelector('.menu-toggle');
const header = document.querySelector('.site-header');
function closeMenu() {
  header.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}
menuButton.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
header.querySelectorAll('.nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });

// Animate sections only when motion is allowed; content stays visible without JS.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('is-pending');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('main > .section > .wrap, .career-layout, main > .contact > .wrap').forEach(node => {
    node.classList.add('scroll-turn');
    if (node.getBoundingClientRect().top > window.innerHeight) node.classList.add('is-pending');
    observer.observe(node);
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      observer.disconnect();
      document.querySelectorAll('.is-pending').forEach(node => node.classList.remove('is-pending'));
    }
  });
}

(() => {
  const slides = [
    { selector: '.hero', title: 'Hero' },
    { selector: '#now', title: 'Now' },
    { selector: '#past', title: 'Past' },
    { selector: '#credentials', title: 'Credentials' },
    { selector: '#building', title: 'Personal Projects' },
    { selector: '#beyond', title: 'Beyond Work' },
    { selector: '#contact', title: 'Contact' }
  ];
  const duration = 8000; // Seven scenes in 56 seconds.
  const overlay = document.getElementById('presentation');
  const stage = document.getElementById('presentation-stage');
  const launch = document.getElementById('present-launch');
  const exit = document.getElementById('presentation-exit');
  const prev = document.getElementById('presentation-prev');
  const next = document.getElementById('presentation-next');
  const play = document.getElementById('presentation-play');
  const title = document.getElementById('presentation-title');
  const count = document.getElementById('presentation-count');
  const progress = overlay.querySelector('.presentation-progress');
  const fill = document.getElementById('presentation-progress-fill');
  let index = 0;
  let playing = false;
  let elapsed = 0;
  let started = 0;
  let frame = 0;
  let previousFocus = null;

  function updateProgress() {
    fill.style.width = `${((index + Math.min(elapsed / duration, 1)) / slides.length) * 100}%`;
  }

  function render() {
    const scene = document.querySelector(slides[index].selector).cloneNode(true);
    scene.removeAttribute('id');
    scene.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    scene.querySelectorAll('.is-pending').forEach(node => node.classList.remove('is-pending'));
    scene.classList.add('presentation-scene');
    stage.replaceChildren(scene);
    stage.scrollTop = 0;
    title.textContent = slides[index].title;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    progress.setAttribute('aria-valuenow', String(index + 1));
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    updateProgress();
  }

  function pause() {
    playing = false;
    cancelAnimationFrame(frame);
    play.textContent = 'Play ▶';
    play.setAttribute('aria-label', 'Play presentation');
  }

  function tick(now) {
    if (!playing) return;
    elapsed += Math.max(0, now - started);
    started = now;
    if (elapsed >= duration) {
      if (index === slides.length - 1) {
        elapsed = duration;
        pause();
        updateProgress();
        return;
      }
      index += 1;
      elapsed = 0;
      render();
    }
    updateProgress();
    frame = requestAnimationFrame(tick);
  }

  function resume() {
    if (index === slides.length - 1 && elapsed >= duration) {
      index = 0;
      elapsed = 0;
      render();
    }
    playing = true;
    started = performance.now();
    play.textContent = 'Pause Ⅱ';
    play.setAttribute('aria-label', 'Pause presentation');
    frame = requestAnimationFrame(tick);
  }

  function go(delta) {
    const target = Math.max(0, Math.min(slides.length - 1, index + delta));
    if (target === index) return;
    index = target;
    elapsed = 0;
    render();
    if (playing) started = performance.now();
  }

  function open() {
    previousFocus = document.activeElement;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('presenting');
    index = 0;
    elapsed = 0;
    render();
    exit.focus();
    overlay.requestFullscreen?.().catch(() => {});
    resume();
  }

  function close() {
    if (overlay.hidden) return;
    pause();
    if (document.fullscreenElement === overlay) document.exitFullscreen?.().catch(() => {});
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('presenting');
    stage.replaceChildren();
    previousFocus?.focus();
  }

  launch.addEventListener('click', open);
  exit.addEventListener('click', close);
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  play.addEventListener('click', () => playing ? pause() : resume());
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && !overlay.hidden) close();
  });
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
    else if (event.code === 'Space' && event.target.tagName !== 'A') {
      event.preventDefault(); playing ? pause() : resume();
    } else if (event.key === 'Tab') {
      const focusables = [...overlay.querySelectorAll('button:not([disabled]), a[href]')];
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
})();
