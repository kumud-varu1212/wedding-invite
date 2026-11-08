/* ===== EDIT ME ===== */
const CONFIG = {
  eventStart: '2026-12-12T09:00:00+05:30',
  eventEnd: '2026-12-12T16:30:00+05:30',
  title: 'Milinda & Kumudi Wedding',
  venue: 'Asliya Golden Cassandra, Colombo, Sri Lanka',
  rsvpEndpoint: '', // e.g. a Google Apps Script / Formspree URL that accepts JSON POST
  events: [
    { title: 'Wedding Starts', date: '9 AM', time: '', venue: '', icon: 'poruwa' },
    { title: 'Poruwa Ceremony', date: '10:30 AM', time: '', venue: '', icon: 'rings' }
  ],
  gallery: ['/New Assets/Album/G1.webp', '/New Assets/Album/G2.webp', '/New Assets/Album/G3 2.webp', '/New Assets/Album/G4.webp', '/New Assets/Album/G5.webp', '/New Assets/Album/G6 3.webp'] // e.g. 'assets/G1.webp'
};

const $ = (s) => document.querySelector(s);
const pad = (n) => String(n).padStart(2, '0');

/* countdown */
const cards = $('#cards');
['Days', 'Hours', 'Min', 'Sec'].forEach((l) => cards.insertAdjacentHTML('beforeend', `<div class="card"><b>00</b><i></i><small>${l}</small></div>`));
const nums = cards.querySelectorAll('b');
function tick() {
  let s = Math.max(0, Math.floor((new Date(CONFIG.eventStart) - Date.now()) / 1000));
  const v = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
  v.forEach((n, i) => (nums[i].textContent = pad(n)));
}
tick(); setInterval(tick, 1000);

/* events */
const icons = {
  poruwa: '<svg viewBox="0 0 48 48"><circle cx="24" cy="6" r="2.4" fill="currentColor"/><path d="M24 8v32"/><ellipse cx="24" cy="21" rx="8" ry="2.6"/><ellipse cx="24" cy="38" rx="10" ry="3"/><path d="M12 42h24"/></svg>',
  rings: '<svg viewBox="0 0 48 48"><circle cx="17" cy="30" r="10"/><circle cx="31" cy="30" r="10"/><path d="M24 12l3 4h-6z" fill="currentColor"/></svg>'
};
$('#eventList').innerHTML = CONFIG.events.map((e) =>
  `<div class="ev reveal"><div class="arch">${icons[e.icon] || icons.rings}<h3>${e.title}</h3></div>
   <p class="d">${e.date}</p>${e.time ? `<p class="t">${e.time}</p>` : ''}${e.venue ? `<p class="v">${e.venue}</p>` : ''}</div>`).join('');

/* gallery */
$('#grid').innerHTML = CONFIG.gallery.map((src, i) =>
  `<div class="ph reveal">${src ? `<img src="${src}" alt="Gallery ${i + 1}" loading="lazy">` : '<svg><use href="#cam"/></svg>'}</div>`).join('');

/* scroll reveal */
const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: .15 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* add to calendar (.ics) */
$('#calBtn').addEventListener('click', () => {
  const f = (d) => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Invitation//EN', 'BEGIN:VEVENT', `UID:${Date.now()}@invitation`, `DTSTAMP:${f(Date.now())}`,
    `DTSTART:${f(CONFIG.eventStart)}`, `DTEND:${f(CONFIG.eventEnd)}`, `SUMMARY:${CONFIG.title}`, `LOCATION:${CONFIG.venue}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'wedding.ics';
  a.click();
});
/* petals */
const pc = $('.petals');
for (let i = 0; i < 5; i++) {
  const p = document.createElement('i'), s = 6 + Math.random() * 6;
  p.className = 'petal';
  p.style.cssText = `left:${Math.random() * 100}%;width:${s * 2}px;height:${s}px;--dx:${(Math.random() * 120 - 60) | 0}px;animation-duration:${10 + Math.random() * 10}s;animation-delay:${-Math.random() * 20}s;opacity:${.5 + Math.random() * .4}`;
  pc.appendChild(p);
}
/* click & drag to scroll (mouse only) */
(() => {
  const root = document.scrollingElement;
  let down = false, moved = false, y0 = 0, s0 = 0;
  addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.closest('iframe,input,textarea,select')) return;
    down = true; moved = false; y0 = e.clientY; s0 = root.scrollTop;
  });
  addEventListener('mousemove', (e) => {
    if (!down) return;
    const dy = e.clientY - y0;
    if (!moved) {
      if (Math.abs(dy) < 5) return;
      moved = true;
      root.style.scrollBehavior = 'auto';
      document.body.classList.add('dragging');
    }
    root.scrollTop = s0 - dy;
    e.preventDefault();
  });
  const end = () => {
    down = false;
    root.style.scrollBehavior = '';
    document.body.classList.remove('dragging');
  };
  addEventListener('mouseup', end);
  document.documentElement.addEventListener('mouseleave', end);
  addEventListener('click', (e) => {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);
})();

/* guest name from link */
const p = new URLSearchParams(location.search);
const gn = p.get('name') || p.get('guest');
if (gn) $('#guest').textContent = gn;

/* background music with fade in/out */
(() => {
  const a = $('#bgm'), btn = $('#musicBtn'), MAX = 0.5, FADE = 2000;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const gain = ctx.createGain(); gain.gain.value = 0;
  ctx.createMediaElementSource(a).connect(gain).connect(ctx.destination);
  let on = false, looping = false, t;
  const fade = (to, ms, done) => {
    const g = gain.gain, n = ctx.currentTime;
    g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(to, n + ms / 1000);
    clearTimeout(t); if (done) t = setTimeout(done, ms);
  };
  const arm = ['click', 'touchend', 'keydown', 'pointerdown'];
  const first = (e) => { if (!e.target.closest('#musicBtn') && !on) play(); };
  const disarm = () => arm.forEach((v) => removeEventListener(v, first));
  const play = () => {
    ctx.resume();
    a.play().then(() => { on = true; looping = false; disarm(); btn.classList.remove('off'); fade(MAX, FADE); })
      .catch((err) => console.warn('Music blocked or file not found:', err));
  };
  const stop = () => { on = false; looping = false; btn.classList.add('off'); fade(0, 800, () => a.pause()); };
  arm.forEach((v) => addEventListener(v, first));
  btn.addEventListener('click', () => { on ? stop() : play(); });
  a.addEventListener('timeupdate', () => {
    if (on && !looping && a.duration && a.duration - a.currentTime < 2.2) {
      looping = true;
      fade(0, 1800, () => { a.currentTime = 0; a.play(); fade(MAX, FADE); looping = false; });
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) a.pause(); else if (on) { ctx.resume(); a.play(); } });
    window.startMusic = play;
})();

/* cover: tap to open + start music */
(() => {
  const cover = $('#cover'), root = document.documentElement;
  root.classList.add('locked');
  $('#openBtn').addEventListener('click', () => {
    window.startMusic && window.startMusic();
    cover.classList.add('hide'); root.classList.remove('locked');
    setTimeout(() => cover.remove(), 1200);
  });
})();