/* Wyrd public film. Deliberately independent of decorative background playback. */
(() => {
  'use strict';
  const player = document.getElementById('film-player');
  const dataElement = document.getElementById('film-data');
  if (!player || !dataElement) return;
  let data;
  try { data = JSON.parse(dataElement.textContent); } catch { return; }
  const shell = document.querySelector('.film-player-shell');
  const status = document.getElementById('film-status');
  const nowPlaying = document.getElementById('film-now-playing');
  const direct = document.getElementById('film-direct-link');
  const retry = document.getElementById('film-retry');
  const captions = document.getElementById('film-captions');
  const chapterTrack = document.getElementById('film-chapter-track');
  const variants = [...document.querySelectorAll('[data-film-variant]')];
  const chapterButtons = [...document.querySelectorAll('.film-chapter-list [data-film-seek]')];
  let variant = 'wide';
  let preferredFilmVariant = 'wide';
  let fullFilmPosition = 0;
  let mapPosition = 0;
  let sourceRevision = 0;
  let pendingSeek = null;

  const clampTime = (value, duration) => Math.max(0, Math.min(Number.isFinite(value) ? value : 0, Math.max(0, duration - 0.05)));
  function setStatus(text) { status.textContent = text; }
  function isCaptionsShowing() { return captions?.track?.mode === 'showing'; }
  function updateChapters() {
    const index = variant === 'map' ? -1 : data.chapters.findLastIndex(chapter => player.currentTime >= chapter.start);
    chapterButtons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  }
  function restorePosition(revision, time, resume, showCaptions) {
    if (revision !== sourceRevision) return;
    const length = variant === 'map' ? data.mapDuration : data.duration;
    const duration = Number.isFinite(player.duration) ? player.duration : length;
    try { player.currentTime = clampTime(time, duration); } catch { pendingSeek = { revision, time, resume, showCaptions }; return; }
    pendingSeek = null;
    if (captions?.track) captions.track.mode = showCaptions ? 'showing' : 'disabled';
    updateChapters();
    if (resume) {
      const promise = player.play();
      if (promise?.catch) promise.catch(() => setStatus('The film is ready at your selected passage. Press play to continue.'));
    }
  }
  function selectVariant(next, options = {}) {
    if (!Object.hasOwn(data.sources, next)) return;
    const same = next === variant;
    const wasPlaying = options.play ?? (!player.paused && !player.ended);
    const showCaptions = isCaptionsShowing();
    if (variant === 'map') mapPosition = player.currentTime;
    else fullFilmPosition = player.currentTime;
    const time = options.time ?? (next === 'map' ? mapPosition : fullFilmPosition);
    if (same) {
      if (player.readyState >= 1) restorePosition(sourceRevision, time, wasPlaying, showCaptions);
      else {
        pendingSeek = { revision: sourceRevision, time, resume: wasPlaying, showCaptions };
        player.preload = 'metadata';
        player.load();
      }
      if (options.focus) player.focus({ preventScroll: true });
      return;
    }
    player.pause();
    variant = next;
    if (next !== 'map') preferredFilmVariant = next;
    sourceRevision += 1;
    const revision = sourceRevision;
    pendingSeek = { revision, time, resume: wasPlaying, showCaptions };
    player.src = data.sources[next];
    player.poster = data.posters[next];
    player.width = next === 'portrait' ? 1080 : 1920;
    player.height = next === 'portrait' ? 1920 : 1080;
    player.preload = 'metadata';
    shell.dataset.aspect = next === 'portrait' ? 'portrait' : 'wide';
    player.setAttribute('aria-label', next === 'map' ? 'Wyrd: our intended international network' : 'Wyrd: One intelligence. Many modes.');
    if (captions) captions.src = next === 'map' ? data.captions.map : data.captions.film;
    if (chapterTrack) chapterTrack.track.mode = next === 'map' ? 'disabled' : 'hidden';
    variants.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filmVariant === next)));
    nowPlaying.replaceChildren();
    nowPlaying.append(document.createTextNode(next === 'map' ? 'Our intended international network ' : 'The complete Wyrd film '));
    const duration = document.createElement('span'); duration.textContent = next === 'map' ? '0:56' : '11:09'; nowPlaying.append(duration);
    direct.href = data.sources[next];
    retry.hidden = true;
    setStatus(next === 'map' ? 'The narrated map shows intended 2028 platforms and later African expansion. Press play to watch.' : 'Your place is preserved. Press play to continue in this format.');
    updateChapters();
    player.load();
    if (options.focus) player.focus({ preventScroll: true });
  }

  player.tabIndex = 0;
  variants.forEach(button => button.addEventListener('click', () => {
    selectVariant(button.dataset.filmVariant);
    if (button.classList.contains('film-map-link')) {
      shell.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      player.focus({ preventScroll: true });
    }
  }));
  document.querySelectorAll('[data-film-seek]').forEach(button => button.addEventListener('click', () => {
    const time = Number(button.dataset.filmSeek);
    selectVariant(variant === 'map' ? preferredFilmVariant : variant, { time, play: true, focus: true });
    shell.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }));
  player.addEventListener('loadedmetadata', () => {
    const pending = pendingSeek;
    if (pending) restorePosition(pending.revision, pending.time, pending.resume, pending.showCaptions);
  });
  player.addEventListener('canplay', () => {
    const pending = pendingSeek;
    if (pending) restorePosition(pending.revision, pending.time, pending.resume, pending.showCaptions);
  });
  player.addEventListener('timeupdate', () => {
    if (variant === 'map') mapPosition = player.currentTime;
    else fullFilmPosition = player.currentTime;
    updateChapters();
  });
  player.addEventListener('playing', () => {
    retry.hidden = true;
    setStatus(variant === 'map' ? 'Playing the narrated map. The network and dates are intended expansion targets.' : 'Playing the complete film. Use the player controls for English captions and full screen.');
  });
  player.addEventListener('error', () => {
    retry.hidden = false;
    setStatus('The video could not load. Retry playback, open the video directly, or read the complete transcript below.');
  });
  player.addEventListener('ended', () => setStatus(variant === 'map' ? 'The map has ended. Choose Widescreen or Portrait to return to your place in the complete film.' : 'The film has ended. Explore a chapter, read the transcript or start a conversation with Wyrd.'));
  retry.addEventListener('click', () => {
    const time = variant === 'map' ? mapPosition : fullFilmPosition;
    pendingSeek = { revision: sourceRevision, time, resume: true, showCaptions: isCaptionsShowing() };
    retry.hidden = true;
    setStatus('Retrying playback.');
    player.load();
  });
  const query = new URLSearchParams(location.search);
  const requestedTime = query.get('t');
  if (requestedTime !== null && requestedTime.trim() !== '' && Number.isFinite(Number(requestedTime))) {
    const time = clampTime(Number(requestedTime), data.duration);
    pendingSeek = { revision: sourceRevision, time, resume: false, showCaptions: false };
    fullFilmPosition = time;
    player.preload = 'metadata';
    player.load();
    setStatus('A selected passage is ready. Press play when you are ready.');
  } else if (query.get('view') === 'map') {
    // A valid full-film time takes precedence when both parameters are present.
    selectVariant('map', { time: 0, play: false });
  }
})();
