(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionAllowed = () => !reduced.matches && !document.documentElement.classList.contains('motion-paused');
  const overlay = document.createElement('div'); overlay.className = 'page-transition'; overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '<div class="transition-graphic"><span class="transition-orbit"></span><span class="transition-orbit second"></span><span class="transition-axis left"></span><span class="transition-axis right"></span><i></i></div><span class="transition-label"></span>';
  document.body.append(overlay);
  let navigating = false;
  function resetTransition() { navigating = false; overlay.classList.remove('is-active'); document.body.classList.remove('route-leaving'); }
  addEventListener('pageshow', resetTransition);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const next = new URL(link.href, location.href);
    if (!['http:', 'https:', 'file:'].includes(next.protocol) || next.origin !== location.origin) return;
    if (next.pathname === location.pathname && next.search === location.search) return;
    if (!motionAllowed() || navigating) return;
    event.preventDefault(); navigating = true;
    const label = /studio/i.test(next.pathname) ? 'Personal Studio' : /article/i.test(next.pathname) ? 'A moment to read.' : /writing/i.test(next.pathname) ? 'Writing' : 'A personal space.';
    overlay.querySelector('.transition-label').textContent = label; overlay.classList.add('is-active'); document.body.classList.add('route-leaving');
    setTimeout(() => { location.assign(next.href); }, 390);
  });
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); } }), { threshold: .08, rootMargin: '0px 0px -12px 0px' });
    function observeContent() {
      document.querySelectorAll('.section-heading,.work-card,.licensing-card,.credentials,.project-card,.note-row,.writing-row,.writing-hero,.article-head,.lock-card').forEach((target, index) => {
        if (target.dataset.motionObserved) return; target.dataset.motionObserved = 'true';
        target.style.setProperty('--reveal-delay', (index % 3) * 55 + 'ms'); target.classList.add('motion-reveal'); observer.observe(target);
      });
    }
    observeContent(); document.addEventListener('content:rendered', observeContent);
  }
  const cardSelector = '.work-card,.licensing-card,.credentials,.project-card,.photo-item,.book-card,.note-row,.writing-row,.lock-card,.studio-photo-card,.studio-empty,.studio-book-row,.studio-stats>div,.writing-plan,.empty-books,.photo-note,.portrait-frame';
  const titleSelector = '.section-heading h2,.journey-main>h2,.contact h2,.writing-hero h1,.writing-collection-top h2,.article-title,.studio-heading h1,.collection-heading h3,.topic-panel h3';
  const titleObserver = 'IntersectionObserver' in window && !reduced.matches ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('title-inview');
      else entry.target.classList.remove('title-inview');
    });
  }, { threshold: .25, rootMargin: '-7% 0px -9% 0px' }) : null;
  function enhanceCardsAndTitles() {
    document.querySelectorAll(cardSelector).forEach(card => card.classList.add('hover-card'));
    if (!titleObserver) return;
    document.querySelectorAll(titleSelector).forEach(title => {
      if (title.querySelector(':scope > .title-motion-text')) return;
      const text = document.createElement('span'); text.className = 'title-motion-text';
      while (title.firstChild) text.append(title.firstChild);
      title.append(text); title.classList.add('title-motion');
      titleObserver.observe(title);
    });
  }
  enhanceCardsAndTitles();
  document.addEventListener('content:rendered', enhanceCardsAndTitles);
  if (!document.querySelector('#hero-title')) {
    const button = document.querySelector('#motion-toggle');
    let paused = reduced.matches;
    function setMotion() { document.documentElement.classList.toggle('motion-paused', paused); if (button) { button.setAttribute('aria-pressed', String(paused)); button.textContent = paused ? 'Resume motion ▷' : 'Pause motion Ⅱ'; } }
    if (button) button.addEventListener('click', () => { paused = !paused; setMotion(); });
    reduced.addEventListener('change', event => { paused = event.matches; setMotion(); }); setMotion();
  }
})();
