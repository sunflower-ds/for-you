// ── CONFIG ────────────────────────────────────────────────
const START_DATE = '2026-06-01';
// ──────────────────────────────────────────────────────────

let data = {};

// ══════════════════════════════════════════════════════════
//  PARALLAX BACKGROUND
// ══════════════════════════════════════════════════════════
function initParallax() {
  const canvas = document.getElementById('parallax-canvas');
  const ctx    = canvas.getContext('2d');

  let W, H;
  const mouse  = { x: 0.5, y: 0.5 };
  const target = { x: 0.5, y: 0.5 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Four depth layers — slowest (far) to fastest (near)
  const LAYERS = [
    { items: [], speed: 0.012, count: 5,  sizeMin: 20, sizeMax: 30, alpha: 0.10 },
    { items: [], speed: 0.030, count: 10, sizeMin: 9,  sizeMax: 16, alpha: 0.18 },
    { items: [], speed: 0.058, count: 20, sizeMin: 3,  sizeMax: 7,  alpha: 0.28 },
    { items: [], speed: 0.095, count: 32, sizeMin: 1,  sizeMax: 2.5,alpha: 0.40 },
  ];

  function rand(min, max) { return min + Math.random() * (max - min); }

  LAYERS.forEach(layer => {
    for (let i = 0; i < layer.count; i++) {
      layer.items.push({
        bx: rand(0, 1),
        by: rand(0, 1),
        size: rand(layer.sizeMin, layer.sizeMax),
        rot: rand(0, Math.PI * 2),
        rotSpeed: rand(-0.003, 0.003),
        isPetal: Math.random() > 0.45,
      });
    }
  });

  function drawSunflower(x, y, r, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    for (let p = 0; p < 8; p++) {
      const a  = (p / 8) * Math.PI * 2;
      const px = Math.cos(a) * r * 1.5;
      const py = Math.sin(a) * r * 1.5;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.38, r * 0.65, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f5c518';
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#3d2008';
    ctx.fill();
    ctx.restore();
  }

  function drawPetal(x, y, r, rot, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.5, r, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f5c518';
    ctx.fill();
    ctx.restore();
  }

  let lastTime = 0;
  function frame(ts) {
    const dt = Math.min((ts - lastTime) / 16, 3);
    lastTime = ts;

    // Smooth mouse follow
    mouse.x += (target.x - mouse.x) * 0.05 * dt;
    mouse.y += (target.y - mouse.y) * 0.05 * dt;

    ctx.clearRect(0, 0, W, H);

    const ox = (mouse.x - 0.5) * 2;
    const oy = (mouse.y - 0.5) * 2;

    LAYERS.forEach(layer => {
      layer.items.forEach(item => {
        item.rot += item.rotSpeed * dt;
        const sx = ((item.bx + ox * layer.speed * 2 + 10) % 1 + 1) % 1;
        const sy = ((item.by + oy * layer.speed * 2 + 10) % 1 + 1) % 1;
        if (item.isPetal) {
          drawPetal(sx * W, sy * H, item.size, item.rot, layer.alpha);
        } else {
          drawSunflower(sx * W, sy * H, item.size, layer.alpha);
        }
      });
    });

    requestAnimationFrame(frame);
  }

  // Track mouse across the whole page
  document.addEventListener('mousemove', e => {
    target.x = e.clientX / window.innerWidth;
    target.y = e.clientY / window.innerHeight;
  });

  // On mobile, use device tilt if available
  window.addEventListener('deviceorientation', e => {
    if (e.gamma == null) return;
    target.x = Math.min(Math.max((e.gamma + 45) / 90, 0), 1);
    target.y = Math.min(Math.max((e.beta  + 45) / 90, 0), 1);
  });

  // Gentle auto-drift when no input
  let driftAngle = 0;
  setInterval(() => {
    driftAngle += 0.008;
    if (document.hidden) return;
    target.x = 0.5 + Math.cos(driftAngle) * 0.12;
    target.y = 0.5 + Math.sin(driftAngle * 0.7) * 0.08;
  }, 50);

  requestAnimationFrame(frame);
}

// ══════════════════════════════════════════════════════════
//  VINE
// ══════════════════════════════════════════════════════════
const VINE_COLS  = 10;
const VINE_ROWS  = 3;
const VINE_TOTAL = 30;

function getVinePositions() {
  const pos = [];
  for (let row = 0; row < VINE_ROWS; row++) {
    const ltr = row % 2 === 0;
    for (let col = 0; col < VINE_COLS; col++) {
      const c = ltr ? col : (VINE_COLS - 1 - col);
      pos.push({ x: 31 + c * 56, y: 44 + row * 88, row });
    }
  }
  return pos;
}

function getDayDate(dayNum) {
  const d = new Date(START_DATE + 'T00:00:00');
  d.setDate(d.getDate() + dayNum - 1);
  return d;
}

function drawVine(today) {
  const svg = document.getElementById('vine-svg');
  if (!svg) return;
  svg.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';
  const positions = getVinePositions();

  function el(tag, attrs, parent) {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    (parent || svg).appendChild(e);
    return e;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  for (let i = 0; i < positions.length - 1; i++) {
    const unlocked = i < today;
    const { x: x1, y: y1, row: r1 } = positions[i];
    const { x: x2, y: y2, row: r2 } = positions[i + 1];
    const mx = (x1 + x2) / 2;
    const d  = r1 === r2
      ? `M ${x1} ${y1} C ${mx} ${y1-10}, ${mx} ${y2-10}, ${x2} ${y2}`
      : `M ${x1} ${y1} C ${x1} ${(y1+y2)/2}, ${x2} ${(y1+y2)/2}, ${x2} ${y2}`;
    el('path', { d, stroke: unlocked ? '#4a6a1a' : '#2a3a0a', 'stroke-width': unlocked ? '2.5' : '1.8', fill: 'none', 'stroke-linecap': 'round', opacity: unlocked ? '1' : '0.35' });
    if (unlocked && i % 2 === 0 && r1 === r2) {
      const lx = lerp(x1, x2, 0.45);
      const ly = lerp(y1, y2, 0.45) - 9;
      const ld = i % 4 === 0 ? -1 : 1;
      el('ellipse', { cx: lx, cy: ly, rx: '6', ry: '3.5', transform: `rotate(${ld*35} ${lx} ${ly})`, fill: '#3d6614', opacity: '0.8' });
    }
  }

  for (let d = 1; d <= VINE_TOTAL; d++) {
    const { x, y }  = positions[d - 1];
    const unlocked  = d <= today;
    const isToday   = d === today;
    const dateNum   = getDayDate(d).getDate().toString();
    const g = el('g', { style: unlocked ? 'cursor:pointer' : 'cursor:default', transform: `translate(${x},${y})` });
    if (unlocked) g.addEventListener('click', () => showMessage(d));

    if (unlocked) {
      const pr = isToday ? 12 : 9;
      const cr = isToday ? 6.5 : 5;
      const pc = isToday ? '#f5c518' : '#c9a820';
      const cc = isToday ? '#5a2e00' : '#3d2008';
      if (isToday) {
        el('circle', { r: '19', fill: 'rgba(245,197,24,0.11)' }, g);
        el('circle', { r: '14', fill: 'rgba(245,197,24,0.09)' }, g);
      }
      for (let p = 0; p < 8; p++) {
        const a  = (p / 8) * Math.PI * 2;
        const px = Math.cos(a) * (pr * 1.55);
        const py = Math.sin(a) * (pr * 1.55);
        el('ellipse', { cx: px, cy: py, rx: isToday ? '5' : '3.8', ry: isToday ? '8.5' : '6.5', transform: `rotate(${(p/8)*360} ${px} ${py})`, fill: pc, opacity: '0.9' }, g);
      }
      el('circle', { r: cr + 1.5, fill: cc }, g);
      el('circle', { r: cr, fill: isToday ? '#3d2008' : '#2a1505' }, g);
      if (isToday) {
        [[-1.8,-1.8],[0,-2.3],[1.8,-1.8],[-2.3,0],[0,0],[2.3,0],[-1.8,1.8],[0,2.3],[1.8,1.8]].forEach(([sx,sy]) => {
          el('circle', { cx: sx, cy: sy, r: '0.85', fill: '#5a2e00' }, g);
        });
      }
      el('text', { y: '0.4', 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': isToday ? '5.5' : '4.8', 'font-family': 'sans-serif', fill: isToday ? '#f5e090' : '#c9a040', 'font-weight': 'bold' }, g).textContent = d;
      el('text', { y: isToday ? pr+18 : pr+14, 'text-anchor': 'middle', 'font-size': isToday ? '8.5' : '7.5', 'font-family': 'sans-serif', fill: isToday ? '#f5c518' : '#7a6820', 'font-weight': isToday ? 'bold' : 'normal' }, g).textContent = dateNum;
    } else {
      el('circle', { r: '5', fill: '#2a3a0a', opacity: '0.55' }, g);
      el('circle', { r: '3', fill: '#1a2a08', opacity: '0.45' }, g);
      for (let p = 0; p < 6; p++) {
        const a = (p / 6) * Math.PI * 2;
        el('ellipse', { cx: Math.cos(a)*4.5, cy: Math.sin(a)*4.5, rx: '1.8', ry: '3.2', transform: `rotate(${(p/6)*360} ${Math.cos(a)*4.5} ${Math.sin(a)*4.5})`, fill: '#3a5010', opacity: '0.35' }, g);
      }
      el('text', { y: '0.4', 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': '4', 'font-family': 'sans-serif', fill: '#4a5a20', opacity: '0.5' }, g).textContent = d;
      el('text', { y: '16', 'text-anchor': 'middle', 'font-size': '7', 'font-family': 'sans-serif', fill: '#3a4a18', opacity: '0.4' }, g).textContent = dateNum;
    }
  }
}

// ══════════════════════════════════════════════════════════
//  SCREEN SWITCHING
// ══════════════════════════════════════════════════════════
function showMain() {
  const welcome = document.getElementById('welcome-screen');
  const main    = document.getElementById('main-screen');
  welcome.classList.add('exiting');
  setTimeout(() => {
    welcome.style.display = 'none';
    main.classList.remove('hidden');
    main.classList.add('entering');
    triggerVisibleReveals();
  }, 680);
}

function showWelcome() {
  const welcome = document.getElementById('welcome-screen');
  const main    = document.getElementById('main-screen');
  main.classList.add('hidden');
  main.classList.remove('entering');
  welcome.style.display = 'flex';
  welcome.classList.remove('exiting');
  welcome.style.animation = 'none';
  requestAnimationFrame(() => { welcome.style.animation = ''; });
}

// ══════════════════════════════════════════════════════════
//  SCROLL REVEAL
// ══════════════════════════════════════════════════════════
let revealObserver = null;

function initScrollReveal() {
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function triggerVisibleReveals() {
  initScrollReveal();
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
    });
  }, 80);
}

function revealCardChildren() {
  document.querySelectorAll('.reveal-child').forEach((el, i) => {
    el.style.transitionDelay = `${i * 110}ms`;
    setTimeout(() => el.classList.add('visible'), 60 + i * 110);
  });
}

function hideCardChildren() {
  document.querySelectorAll('.reveal-child').forEach(el => {
    el.classList.remove('visible');
    el.style.transitionDelay = '0ms';
  });
}

// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════
//  CARD
// ══════════════════════════════════════════════════════════
function resetCard() {
  hideCardChildren();
  ['photo-wrap','audio-wrap','message-body','poem-wrap','questions-wrap','signature'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('badges').innerHTML          = '';
  document.getElementById('message-body').textContent  = '';
  document.getElementById('poem-body').textContent     = '';
  document.getElementById('photo-caption').textContent = '';
  document.getElementById('questions-list').innerHTML  = '';
  document.getElementById('signature').textContent     = '';
  const audio = document.getElementById('audio-el');
  audio.pause(); audio.src = '';
  document.getElementById('play-btn').innerHTML        = '&#9654;';
  document.getElementById('progress-bar').style.width = '0%';
  document.getElementById('time-display').textContent  = '0:00';
}

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
  audioEl.src = entry.audio; audioEl.load();
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
    playBtn.innerHTML = '&#9654;'; progressBar.style.width = '0%';
    audioEl.currentTime = 0;
    setTimeout(() => { timeDisplay.textContent = '0:00'; }, 300);
  };
  progressWrap.onclick = e => {
    const r = progressWrap.getBoundingClientRect();
    audioEl.currentTime = ((e.clientX - r.left) / r.width) * audioEl.duration;
  };
}

function renderMessage(entry) {
  if (!entry.message) return;
  const body = document.getElementById('message-body');
  body.textContent = entry.message; body.style.display = 'block';
}

function renderPoem(entry) {
  if (!entry.poem) return;
  document.getElementById('poem-title').textContent  = entry.poem_title || 'a poem for you';
  document.getElementById('poem-body').textContent   = entry.poem;
  document.getElementById('poem-wrap').style.display = 'block';
}

function renderQuestions(entry) {
  if (!entry.questions || !entry.questions.length) return;
  const wrap      = document.getElementById('questions-wrap');
  const list      = document.getElementById('questions-list');
  const revealBtn = document.getElementById('reveal-btn');
  const btnText   = document.getElementById('reveal-btn-text');
  const questions = entry.questions.slice(0, 3);
  let revealed    = 0;
  const labels    = ['&#10022; reveal a question', '&#10022; reveal another', '&#10022; one more'];
  wrap.style.display = 'block'; revealBtn.className = 'reveal-btn'; btnText.innerHTML = labels[0];
  revealBtn.onclick = () => {
    if (revealed >= questions.length) return;
    const item = document.createElement('div'); item.className = 'question-item';
    const num  = document.createElement('div'); num.className = 'question-number'; num.textContent = `0${revealed+1}`;
    const text = document.createElement('div'); text.className = 'question-text'; text.textContent = questions[revealed];
    item.appendChild(num); item.appendChild(text); list.appendChild(item); revealed++;
    setTimeout(() => item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    if (revealed >= questions.length) revealBtn.classList.add('all-done');
    else btnText.innerHTML = labels[revealed];
  };
}

function renderSignature(entry) {
  const el = document.getElementById('signature');
  if (!entry.signature) { el.style.display = 'none'; return; }
  el.textContent   = '— ' + entry.signature;
  el.style.display = 'block';
}

function showMessage(day) {
  resetCard();
  const entry = data[day];
  const card  = document.getElementById('card');
  document.getElementById('day-label').textContent = `Day ${day}`;
  card.style.display = 'block';
  if (!entry) {
    document.getElementById('topic').textContent = '';
    const body = document.getElementById('message-body');
    body.innerHTML = '<span class="no-data">This message is still being written with love… check back soon. 🌻</span>';
    body.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    revealCardChildren(); return;
  }
  document.getElementById('topic').textContent = entry.topic || '';
  renderBadges(entry); renderPhoto(entry); renderAudio(entry);
  renderMessage(entry); renderPoem(entry); renderQuestions(entry); renderSignature(entry);
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  revealCardChildren();
}

// ══════════════════════════════════════════════════════════
//  COUNTDOWN
// ══════════════════════════════════════════════════════════
function startCountdown(today) {
  const timerEl = document.getElementById('countdown-timer');
  const labelEl = document.querySelector('.countdown-label');
  if (today >= 30) { labelEl.textContent = 'all 30 days are unlocked 🌻'; timerEl.textContent = ''; return; }
  function tick() {
    const start   = new Date(START_DATE + 'T00:00:00');
    const nextDay = new Date(start);
    nextDay.setDate(start.getDate() + today);
    const diff = nextDay - new Date();
    if (diff <= 0) { location.reload(); return; }
    const h = String(Math.floor(diff/3600000)).padStart(2,'0');
    const m = String(Math.floor((diff%3600000)/60000)).padStart(2,'0');
    const s = String(Math.floor((diff%60000)/1000)).padStart(2,'0');
    timerEl.textContent = `${h}:${m}:${s}`;
  }
  tick(); setInterval(tick, 1000);
}

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
async function init() {
  initParallax();

  document.getElementById('enter-btn').addEventListener('click', showMain);
  document.getElementById('welcome-return-btn').addEventListener('click', showWelcome);

  try {
    const res  = await fetch('messages.json');
    const json = await res.json();
    json.days.forEach(d => { data[d.day] = d; });
  } catch (e) {
    console.warn('Could not load messages.json');
  }

  const today = getDayNumber();
  drawVine(today);
  startCountdown(today);
  showMessage(today);
}

init();
