// ── CONFIG ────────────────────────────────────────────────
// Set this to the date you want Day 1 to begin. Format: 'YYYY-MM-DD'
const START_DATE = '2026-06-01';
// ──────────────────────────────────────────────────────────

let data = {};

// ── Stars ─────────────────────────────────────────────────
function buildStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 90; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 1;
    star.style.cssText = [
      `width: ${size}px`,
      `height: ${size}px`,
      `left: ${Math.random() * 100}%`,
      `top: ${Math.random() * 100}%`,
      `--d: ${2 + Math.random() * 4}s`,
      `--delay: ${Math.random() * 5}s`,
      `--mo: ${0.2 + Math.random() * 0.5}`
    ].join('; ');
    container.appendChild(star);
  }
}

// ── Helpers ───────────────────────────────────────────────
function getDayNumber() {
  const start = new Date(START_DATE + 'T00:00:00');
  const now   = new Date();
  const diff  = Math.floor((now - start) / 86400000);
  return Math.min(Math.max(diff + 1, 0), 30);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Day grid ──────────────────────────────────────────────
function buildGrid(today) {
  const grid = document.getElementById('day-grid');
  grid.innerHTML = '';

  for (let d = 1; d <= 30; d++) {
    const btn = document.createElement('button');
    btn.className = 'day-btn'
      + (d === today ? ' today'  : '')
      + (d > today   ? ' locked' : '');
    btn.textContent = d;
    btn.setAttribute('aria-label', d > today ? `Day ${d} — locked` : `Day ${d}`);

    if (d <= today) {
      btn.addEventListener('click', () => showMessage(d));
    }
    grid.appendChild(btn);
  }
}

function setActiveButton(day) {
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.textContent) === day);
  });
}

// ── Message card ──────────────────────────────────────────
function resetCard() {
  document.getElementById('photo-wrap').style.display   = 'none';
  document.getElementById('message-body').style.display = 'none';
  document.getElementById('poem-wrap').style.display    = 'none';
  document.getElementById('audio-wrap').style.display   = 'none';
  document.getElementById('badges').innerHTML            = '';
  document.getElementById('message-body').textContent   = '';
  document.getElementById('poem-body').textContent      = '';
  document.getElementById('photo-caption').textContent  = '';

  const audio = document.getElementById('audio-el');
  audio.pause();
  audio.src = '';
  document.getElementById('play-btn').innerHTML        = '&#9654;';
  document.getElementById('progress-bar').style.width = '0%';
  document.getElementById('time-display').textContent  = '0:00';
}

function renderBadges(entry) {
  const container = document.getElementById('badges');
  if (entry.photo) container.innerHTML += `<span class="badge badge-photo">&#128247; photo</span>`;
  if (entry.poem)  container.innerHTML += `<span class="badge badge-poem">&#10022; poem</span>`;
  if (entry.audio) container.innerHTML += `<span class="badge badge-audio">&#127908; voice</span>`;
}

function renderPhoto(entry) {
  if (!entry.photo) return;
  const wrap = document.getElementById('photo-wrap');
  document.getElementById('photo-img').src = entry.photo;
  document.getElementById('photo-img').alt = entry.photo_caption || '';
  const caption = document.getElementById('photo-caption');
  caption.textContent    = entry.photo_caption || '';
  caption.style.display  = entry.photo_caption ? 'block' : 'none';
  wrap.style.display     = 'block';
}

function renderMessage(entry) {
  if (!entry.message) return;
  const body = document.getElementById('message-body');
  body.textContent   = entry.message;
  body.style.display = 'block';
}

function renderPoem(entry) {
  if (!entry.poem) return;
  document.getElementById('poem-title').textContent = entry.poem_title || 'a poem for you';
  document.getElementById('poem-body').textContent  = entry.poem;
  document.getElementById('poem-wrap').style.display = 'block';
}

function renderAudio(entry) {
  if (!entry.audio) return;

  const audioEl     = document.getElementById('audio-el');
  const playBtn     = document.getElementById('play-btn');
  const progressBar = document.getElementById('progress-bar');
  const progressWrap = document.getElementById('progress-wrap');
  const timeDisplay  = document.getElementById('time-display');

  audioEl.src = entry.audio;
  audioEl.load();
  document.getElementById('audio-wrap').style.display = 'block';

  playBtn.onclick = () => {
    if (audioEl.paused) {
      audioEl.play();
      playBtn.innerHTML = '&#9646;&#9646;';
    } else {
      audioEl.pause();
      playBtn.innerHTML = '&#9654;';
    }
  };

  audioEl.ontimeupdate = () => {
    if (!audioEl.duration) return;
    const pct = (audioEl.currentTime / audioEl.duration) * 100;
    progressBar.style.width  = pct + '%';
    timeDisplay.textContent  = formatTime(audioEl.currentTime);
  };

  audioEl.onended = () => {
    playBtn.innerHTML = '&#9654;';
    progressBar.style.width = '0%';
    audioEl.currentTime = 0;
    setTimeout(() => { timeDisplay.textContent = '0:00'; }, 300);
  };

  progressWrap.onclick = (e) => {
    const rect  = progressWrap.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioEl.currentTime = ratio * audioEl.duration;
  };
}

function showMessage(day) {
  setActiveButton(day);
  resetCard();

  const entry = data[day];
  const card  = document.getElementById('card');

  document.getElementById('day-label').textContent = `Day ${day}`;
  card.style.display = 'block';

  if (!entry) {
    document.getElementById('topic').textContent = '';
    const body = document.getElementById('message-body');
    body.innerHTML    = '<span class="no-data">This message is still being written with love… check back soon.</span>';
    body.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  document.getElementById('topic').textContent = entry.topic || '';
  renderBadges(entry);
  renderPhoto(entry);
  renderMessage(entry);
  renderPoem(entry);
  renderAudio(entry);

  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Countdown ─────────────────────────────────────────────
function startCountdown(today) {
  const timerEl = document.getElementById('countdown-timer');
  const labelEl = document.querySelector('.countdown-label');

  if (today >= 30) {
    labelEl.textContent  = 'all 30 days are unlocked ♡';
    timerEl.textContent  = '';
    return;
  }

  function tick() {
    const start   = new Date(START_DATE + 'T00:00:00');
    const nextDay = new Date(start);
    nextDay.setDate(start.getDate() + today);

    const diff = nextDay - new Date();
    if (diff <= 0) { location.reload(); return; }

    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000)   / 1000)).padStart(2, '0');
    timerEl.textContent = `${h}:${m}:${s}`;
  }

  tick();
  setInterval(tick, 1000);
}

// ── Init ──────────────────────────────────────────────────
async function init() {
  buildStars();

  try {
    const res  = await fetch('messages.json');
    const json = await res.json();
    json.days.forEach(d => { data[d.day] = d; });
  } catch (e) {
    console.warn('Could not load messages.json');
  }

  const today = getDayNumber();
  buildGrid(today);
  startCountdown(today);

  const unlocked = document.querySelectorAll('.day-btn:not(.locked)');
  if (unlocked.length) {
    const last = unlocked[unlocked.length - 1];
    showMessage(parseInt(last.textContent));
  }
}

init();
