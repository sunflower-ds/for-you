// ── CONFIG ────────────────────────────────────────────────
const START_DATE = '2026-06-01';
// ──────────────────────────────────────────────────────────

let data = {};

// ── Floating petal particles ──────────────────────────────
function buildPetals() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const size = Math.random() * 5 + 4;
    p.style.cssText = [
      `width: ${size}px`,
      `height: ${size * 1.6}px`,
      `left: ${Math.random() * 100}%`,
      `top: ${40 + Math.random() * 60}%`,
      `--pd: ${3 + Math.random() * 5}s`,
      `--pdelay: ${Math.random() * 6}s`,
      `transform: rotate(${Math.random() * 360}deg)`,
      `opacity: 0`
    ].join('; ');
    container.appendChild(p);
  }
  // Tiny gold dots (like seeds drifting)
  for (let i = 0; i < 55; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 2 + 1;
    s.style.cssText = [
      `width: ${sz}px`,
      `height: ${sz}px`,
      `left: ${Math.random() * 100}%`,
      `top: ${Math.random() * 100}%`,
      `--d: ${2 + Math.random() * 5}s`,
      `--delay: ${Math.random() * 6}s`,
      `--mo: ${0.15 + Math.random() * 0.4}`
    ].join('; ');
    container.appendChild(s);
  }
}

// ── Scroll-reveal observer ────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  return observer;
}

// Stagger reveal-child elements inside the card
function revealCardChildren() {
  const children = document.querySelectorAll('.reveal-child');
  children.forEach((el, i) => {
    el.style.transitionDelay = `${i * 110}ms`;
    // Small timeout to let display:block kick in before transition
    setTimeout(() => el.classList.add('visible'), 60 + i * 110);
  });
}

function hideCardChildren() {
  document.querySelectorAll('.reveal-child').forEach(el => {
    el.classList.remove('visible');
    el.style.transitionDelay = '0ms';
  });
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
    if (d <= today) btn.addEventListener('click', () => showMessage(d));
    grid.appendChild(btn);
  }
}

function setActiveButton(day) {
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.textContent) === day);
  });
}

// ── Card reset ────────────────────────────────────────────
function resetCard() {
  hideCardChildren();

  document.getElementById('photo-wrap').style.display     = 'none';
  document.getElementById('audio-wrap').style.display     = 'none';
  document.getElementById('message-body').style.display   = 'none';
  document.getElementById('poem-wrap').style.display      = 'none';
  document.getElementById('questions-wrap').style.display = 'none';
  document.getElementById('badges').innerHTML              = '';
  document.getElementById('message-body').textContent     = '';
  document.getElementById('poem-body').textContent        = '';
  document.getElementById('photo-caption').textContent    = '';
  document.getElementById('questions-list').innerHTML     = '';

  const audio = document.getElementById('audio-el');
  audio.pause();
  audio.src = '';
  document.getElementById('play-btn').innerHTML        = '&#9654;';
  document.getElementById('progress-bar').style.width = '0%';
  document.getElementById('time-display').textContent  = '0:00';
}

// ── Render sections ───────────────────────────────────────
function renderBadges(entry) {
  const c = document.getElementById('badges');
  if (entry.photo) c.innerHTML += `<span class="badge badge-photo">&#127819; photo</span>`;
  if (entry.audio) c.innerHTML += `<span class="badge badge-audio">&#127908; voice</span>`;
  if (entry.poem)  c.innerHTML += `<span class="badge badge-poem">&#10022; poem</span>`;
}

function renderPhoto(entry) {
  if (!entry.photo) return;
  const wrap = document.getElementById('photo-wrap');
  document.getElementById('photo-img').src = entry.photo;
  document.getElementById('photo-img').alt = entry.photo_caption || '';
  const cap = document.getElementById('photo-caption');
  cap.textContent   = entry.photo_caption || '';
  cap.style.display = entry.photo_caption ? 'block' : 'none';
  wrap.style.display = 'block';
}

function renderAudio(entry) {
  if (!entry.audio) return;
  const audioEl      = document.getElementById('audio-el');
  const playBtn      = document.getElementById('play-btn');
  const progressBar  = document.getElementById('progress-bar');
  const progressWrap = document.getElementById('progress-wrap');
  const timeDisplay  = document.getElementById('time-display');

  audioEl.src = entry.audio;
  audioEl.load();
  document.getElementById('audio-wrap').style.display = 'block';

  playBtn.onclick = () => {
    if (audioEl.paused) { audioEl.play(); playBtn.innerHTML = '&#9646;&#9646;'; }
    else                { audioEl.pause(); playBtn.innerHTML = '&#9654;'; }
  };
  audioEl.ontimeupdate = () => {
    if (!audioEl.duration) return;
    progressBar.style.width = (audioEl.currentTime / audioEl.duration * 100) + '%';
    timeDisplay.textContent = formatTime(audioEl.currentTime);
  };
  audioEl.onended = () => {
    playBtn.innerHTML = '&#9654;';
    progressBar.style.width = '0%';
    audioEl.currentTime = 0;
    setTimeout(() => { timeDisplay.textContent = '0:00'; }, 300);
  };
  progressWrap.onclick = (e) => {
    const r = progressWrap.getBoundingClientRect();
    audioEl.currentTime = ((e.clientX - r.left) / r.width) * audioEl.duration;
  };
}

function renderMessage(entry) {
  if (!entry.message) return;
  const body = document.getElementById('message-body');
  body.textContent   = entry.message;
  body.style.display = 'block';
}

function renderPoem(entry) {
  if (!entry.poem) return;
  document.getElementById('poem-title').textContent  = entry.poem_title || 'a poem for you';
  document.getElementById('poem-body').textContent   = entry.poem;
  document.getElementById('poem-wrap').style.display = 'block';
}

function renderQuestions(entry) {
  if (!entry.questions || entry.questions.length === 0) return;
  const wrap      = document.getElementById('questions-wrap');
  const list      = document.getElementById('questions-list');
  const revealBtn = document.getElementById('reveal-btn');
  const btnText   = document.getElementById('reveal-btn-text');
  const questions = entry.questions.slice(0, 3);
  let revealed    = 0;

  const labels = [
    '&#10022; reveal a question',
    '&#10022; reveal another',
    '&#10022; one more'
  ];

  wrap.style.display   = 'block';
  revealBtn.className  = 'reveal-btn';
  btnText.innerHTML    = labels[0];

  revealBtn.onclick = () => {
    if (revealed >= questions.length) return;
    const item = document.createElement('div');
    item.className = 'question-item';
    const num  = document.createElement('div');
    num.className   = 'question-number';
    num.textContent = `0${revealed + 1}`;
    const text = document.createElement('div');
    text.className   = 'question-text';
    text.textContent = questions[revealed];
    item.appendChild(num);
    item.appendChild(text);
    list.appendChild(item);
    revealed++;
    setTimeout(() => item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    if (revealed >= questions.length) revealBtn.classList.add('all-done');
    else btnText.innerHTML = labels[revealed];
  };
}

// ── Show message ──────────────────────────────────────────
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
    body.innerHTML    = '<span class="no-data">This message is still being written with love… check back soon. 🌻</span>';
    body.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    revealCardChildren();
    return;
  }

  document.getElementById('topic').textContent = entry.topic || '';

  renderBadges(entry);
  renderPhoto(entry);
  renderAudio(entry);
  renderMessage(entry);
  renderPoem(entry);
  renderQuestions(entry);

  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  revealCardChildren();
}

// ── Countdown ─────────────────────────────────────────────
function startCountdown(today) {
  const timerEl = document.getElementById('countdown-timer');
  const labelEl = document.querySelector('.countdown-label');
  if (today >= 30) {
    labelEl.textContent = 'all 30 days are unlocked 🌻';
    timerEl.textContent = '';
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
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    timerEl.textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ── Init ──────────────────────────────────────────────────
async function init() {
  buildPetals();
  initScrollReveal();

  // Trigger .reveal elements already in view on load
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) el.classList.add('visible');
    });
  }, 100);

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
    showMessage(parseInt(unlocked[unlocked.length - 1].textContent));
  }
}

init();
