(() => {
  const table = document.querySelector('#success-table');
  const gallery = document.querySelector('#trial-gallery');
  const strip = gallery.querySelector('.trial-strip');
  const heading = document.querySelector('#trial-heading');
  const summary = document.querySelector('#trial-summary');
  const status = document.querySelector('#trial-loading');
  const navigation = gallery.querySelector('.trial-navigation');
  const previous = gallery.querySelector('.trial-prev');
  const next = gallery.querySelector('.trial-next');
  const visibility = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => { if (!isIntersecting) target.pause(); });
  }, {root: strip, threshold: .2});
  let manifestPromise;
  let selectedCell;
  let selection = 0;
  const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  table.querySelectorAll('.trial-cell').forEach(cell => {
    const policy = cell.closest('tr').querySelector('th').textContent;
    cell.setAttribute('aria-label', `Watch five ${policy} trials in ${cell.dataset.scene}: ${cell.textContent.split('/')[0]} successes`);
  });

  function unloadTrials() {
    strip.querySelectorAll('video').forEach(video => {
      visibility.unobserve(video);
      video.pause();
      video.removeAttribute('src');
      video.load();
    });
    strip.replaceChildren();
  }

  function updateArrows() {
    previous.disabled = strip.scrollLeft <= 2;
    next.disabled = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2;
  }

  function card(trial) {
    const figure = document.createElement('figure');
    figure.className = 'trial-card';
    const caption = document.createElement('figcaption');
    const label = document.createElement('span');
    label.textContent = `Trial ${trial.trial}`;
    const outcome = document.createElement('span');
    outcome.className = `trial-outcome ${trial.success ? 'success' : 'failure'}`;
    outcome.textContent = trial.success ? '✓ Success' : '× Failure';
    caption.append(label, outcome);

    const media = document.createElement('div');
    media.className = 'trial-media';
    const video = document.createElement('video');
    video.preload = 'none';
    video.playsInline = true;
    video.muted = true;
    video.poster = trial.poster;
    video.setAttribute('aria-label', `${heading.textContent}, trial ${trial.trial}, ${trial.success ? 'success' : 'failure'}`);
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'trial-play';
    play.setAttribute('aria-label', `Play trial ${trial.trial}`);
    const glyph = document.createElement('span');
    glyph.textContent = '▶';
    glyph.setAttribute('aria-hidden', 'true');
    play.append(glyph);
    const error = document.createElement('p');
    error.className = 'trial-error';
    error.hidden = true;
    error.setAttribute('role', 'status');
    error.textContent = 'Video could not load. Select Play to retry.';
    play.addEventListener('click', () => {
      error.hidden = true;
      video.controls = true;
      video.src = trial.src;
      play.hidden = true;
      video.play().catch(() => {
        play.hidden = false;
      });
    });
    video.addEventListener('play', () => {
      document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
    });
    video.addEventListener('error', () => {
      error.hidden = false;
      play.hidden = false;
      video.controls = false;
    });
    video.addEventListener('focus', () => figure.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: motion()}));
    media.append(video, play);
    const duration = document.createElement('p');
    duration.className = 'trial-duration';
    const seconds = Math.round(trial.duration);
    duration.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · Trial recording`;
    figure.append(caption, media, duration, error);
    return figure;
  }

  table.addEventListener('click', async event => {
    const cell = event.target.closest('.trial-cell');
    if (!cell) return;
    const current = ++selection;
    selectedCell?.setAttribute('aria-expanded', 'false');
    selectedCell = cell;
    cell.setAttribute('aria-expanded', 'true');
    unloadTrials();
    const policy = cell.closest('tr').querySelector('th').textContent;
    heading.textContent = `${policy} · ${cell.dataset.scene}`;
    summary.textContent = `${cell.textContent.split('/')[0]} of 5 trials succeeded`;
    status.textContent = 'Loading recordings…';
    navigation.hidden = true;
    gallery.hidden = false;
    gallery.scrollIntoView({behavior: motion(), block: 'nearest'});
    try {
      if (!manifestPromise) {
        manifestPromise = fetch('assets/trials/index.json').then(response => {
          if (!response.ok) throw new Error('Trial index unavailable');
          return response.json();
        }).catch(error => { manifestPromise = undefined; throw error; });
      }
      const manifest = await manifestPromise;
      if (selection !== current) return;
      const trials = manifest.trials.filter(t => t.policy === cell.dataset.policy && t.scene === cell.dataset.scene);
      if (trials.length !== 5 || trials.filter(t => t.success).length !== Number(cell.textContent.split('/')[0])) {
        throw new Error('Trial index does not match the table');
      }
      trials.sort((a, b) => a.trial - b.trial);
      strip.append(...trials.map(card));
      strip.querySelectorAll('video').forEach(video => visibility.observe(video));
      strip.scrollLeft = 0;
      navigation.hidden = false;
      status.textContent = '';
      requestAnimationFrame(() => {
        updateArrows();
        gallery.scrollIntoView({behavior: motion(), block: 'nearest'});
      });
    } catch {
      if (selection === current) status.textContent = 'Recordings could not load. Select the result again to retry.';
    }
  });
  gallery.querySelector('.trial-close').addEventListener('click', () => {
    selection++;
    unloadTrials();
    gallery.hidden = true;
    selectedCell?.setAttribute('aria-expanded', 'false');
    selectedCell?.focus();
  });
  function move(direction) {
    const first = strip.querySelector('.trial-card');
    if (first) strip.scrollBy({left: direction * (first.getBoundingClientRect().width + 20), behavior: motion()});
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  strip.addEventListener('keydown', event => {
    if (event.target !== strip) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  strip.addEventListener('scroll', updateArrows, {passive: true});
  new ResizeObserver(updateArrows).observe(strip);
  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) strip.querySelectorAll('video').forEach(v => v.pause());
  });
  observer.observe(gallery);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) strip.querySelectorAll('video').forEach(v => v.pause());
  });
})();
