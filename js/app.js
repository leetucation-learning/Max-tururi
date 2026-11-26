/* Vânătoarea de indicii · Ornamentul și povestea — motorul cursului (HTML + SCORM 2004 3rd Ed.) */
(function () {
  'use strict';
  var C = window.COURSE, CUES = window.CUES || {}, SZ = window.IMGSIZES || {};
  var SCR = C.screens, IDX = {};
  SCR.forEach(function (s, i) { IDX[s.id] = i; });
  var REQUIRED = SCR.filter(function (s) { return s.lesson; }).map(function (s) { return s.id; });
  var SCORED = { sort_familii: 1, match_functiune: 1, choice_argument: 1, sort_stil: 1 };
  var IMG = 'media/img/';
  var LS_KEY = 'ui3_vanatoarea_v1';

  var state = { v: 1, loc: '0.0', visited: {}, ex: {}, ws: {}, strokes: [], fb: {}, audio: true, cc: false, ix: {}, done: false };
  var cur = 0, ret = null, lms = false, saveT = null, visitedBefore = false;

  /* ------------------------------------------------------------ utilitare */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mk(t) { return esc(t).replace(/\*(.+?)\*/g, '<mark>$1</mark>'); }
  function plain(t) { return String(t || '').replace(/\*/g, ''); }
  function img(name, alt, cls) {
    var sz = SZ[name] || [1200, 900];
    return '<img src="' + IMG + name + '.jpg" width="' + sz[0] + '" height="' + sz[1] + '" alt="' + esc(alt || '') + '"' + (cls ? ' class="' + cls + '"' : '') + ' loading="lazy" decoding="async">';
  }
  function cueAttr(n) { return n == null ? '' : ' data-cue="' + n + '"'; }
  function shuffle(a, seed) { var r = a.slice(), s = seed || 7; for (var i = r.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; var j = Math.floor(s / 233280 * (i + 1)); var t = r[i]; r[i] = r[j]; r[j] = t; } return r; }
  function scr() { return SCR[cur]; }
  function ex(id, def) { if (!state.ex[id]) state.ex[id] = def; return state.ex[id]; }
  function announce(t) { var a = $('#live'); a.textContent = ''; setTimeout(function () { a.textContent = t; }, 40); }

  var ICON = {
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" fill="none"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" fill="none"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg>',
    replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    cc: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M10.5 10.2a2.5 2.5 0 1 0 0 3.6M17 10.2a2.5 2.5 0 1 0 0 3.6" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
    text: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14M5 10h14M5 15h9M5 20h6" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    sheet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9 11h7M9 15h7" stroke="currentColor" stroke-width="2"/></svg>',
    ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#1F6B3A"/><path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="#fff" stroke-width="2.6" fill="none"/></svg>',
    bad: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#9B1C1C"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.6"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 20h16" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    print: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M6 17H3V9h18v8h-3M7 14h10v7H7z" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    exit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v16h-6M3 12h12M10 7l-5 5 5 5" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none"/></svg>'
  };
  var CATI = {
    veg: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 26C6 13 15 6 27 5c0 13-7 21-20 21z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M6 26L19 13" stroke="currentColor" stroke-width="2.2"/></svg>',
    zoo: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 10c5 0 9 3 13 9 4-6 8-9 13-9-3 3-5 6-7 11H10C8 16 6 13 3 10z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="16" cy="9" r="2.6" fill="currentColor"/></svg>',
    ant: '<svg viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="16" rx="10" ry="12" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="14" r="1.7" fill="currentColor"/><circle cx="20" cy="14" r="1.7" fill="currentColor"/><path d="M12 21c2.5 2 5.5 2 8 0" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    lit: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 27L13 5h2l8 22M8.5 19h11" stroke="currentColor" stroke-width="2.4" fill="none"/><path d="M24 15h4M26 13v12" stroke="currentColor" stroke-width="2.2"/></svg>',
    geo: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3l13 13-13 13L3 16z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16 10l6 6-6 6-6-6z" fill="currentColor"/></svg>',
    sym: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 16h24M16 4c5 4 5 20 0 24M16 4c-5 4-5 20 0 24" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
    sec: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 24c4-10 8-10 13 0s9 10 13 0" stroke="currentColor" stroke-width="2.4" fill="none"/><path d="M3 14c4-8 8-8 13 0s9 8 13 0" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    neo: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 11L16 4l13 7z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M7 13v12M13 13v12M19 13v12M25 13v12M4 27h24" stroke="currentColor" stroke-width="2.2"/></svg>',
    mol: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 28V14l3-5 3 5v14M18 28V14l3-5 3 5v14M5 28h22" stroke="currentColor" stroke-width="2.2" fill="none"/><path d="M11 4v3M21 4v3" stroke="currentColor" stroke-width="2"/></svg>'
  };
  function catLabel(id) { return (C.cats[id] || C.styles[id] || {}).label || id; }

  /* ------------------------------------------------------------ salvare (LMS sau local) */
  function serialize() {
    return JSON.stringify(state);
  }
  function load() {
    var raw = '';
    if (lms) raw = SCORM.get('cmi.suspend_data');
    else { try { raw = localStorage.getItem(LS_KEY) || ''; } catch (e) { raw = ''; } }
    if (raw) { try { var o = JSON.parse(raw); if (o && o.v === 1) state = Object.assign(state, o); } catch (e) { /* stare nouă */ } }
  }
  function save(now) {
    clearTimeout(saveT);
    var go = function () {
      var data = serialize();
      if (lms) {
        SCORM.set('cmi.location', state.loc);
        SCORM.set('cmi.suspend_data', data);
        SCORM.set('cmi.progress_measure', progress().toFixed(2));
        SCORM.commit();
      } else { try { localStorage.setItem(LS_KEY, data); } catch (e) { /* fără stocare */ } }
      var sv = $('#ws-save'); if (sv) sv.textContent = 'Salvat ' + new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    };
    if (now) go(); else saveT = setTimeout(go, 900);
  }
  function progress() { var n = REQUIRED.filter(function (id) { return state.visited[id]; }).length; return n / REQUIRED.length; }

  /* ------------------------------------------------------------ scor, finalizare, interacțiuni */
  function scoreParts() {
    var raw = 0, max = 0, tried = 0;
    Object.keys(SCORED).forEach(function (k) {
      var s = SCR.filter(function (x) { return x.ex === k; })[0]; if (!s) return;
      var e = state.ex[k] || {}, first = e.first || {};
      if (e.first != null && (typeof e.first !== 'object' || Object.keys(e.first).length)) tried++;
      var n = s.type === 'choice' ? 1 : s.items.length;
      max += n;
      if (s.type === 'choice') { if (e.first === true) raw += 1; }
      else Object.keys(first).forEach(function (i) { if (first[i]) raw += 1; });
    });
    return { raw: raw, max: max, tried: tried };
  }
  function reportScore() {
    if (!lms) return;
    var p = scoreParts();
    SCORM.set('cmi.score.min', 0); SCORM.set('cmi.score.max', p.max); SCORM.set('cmi.score.raw', p.raw);
    SCORM.set('cmi.score.scaled', (p.max ? p.raw / p.max : 0).toFixed(2));
  }
  function checkDone() {
    if (state.done) return;
    if (REQUIRED.every(function (id) { return state.visited[id]; })) {
      state.done = true;
      if (lms) { SCORM.set('cmi.completion_status', 'completed'); SCORM.set('cmi.success_status', 'passed'); reportScore(); SCORM.commit(); }
      save(true);
    }
  }
  function ts() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); }
  function ix(id, type, resp, result, desc) {
    if (!lms) return;
    var n = state.ix[id];
    if (n == null) { n = parseInt(SCORM.get('cmi.interactions._count'), 10) || 0; state.ix[id] = n; SCORM.set('cmi.interactions.' + n + '.id', id); SCORM.set('cmi.interactions.' + n + '.type', type); }
    var b = 'cmi.interactions.' + n + '.';
    if (desc) SCORM.set(b + 'description', desc.slice(0, 250));
    SCORM.set(b + 'learner_response', String(resp).slice(0, 4000));
    if (result) SCORM.set(b + 'result', result);
    SCORM.set(b + 'timestamp', ts());
    reportScore();
    save();
  }

  /* ------------------------------------------------------------ audio și subtitrare */
  var audio = new Audio(); audio.preload = 'auto';
  var revealed = -1, stallT = null;
  function revealUpTo(k) {
    $$('#stage .cue.wait').forEach(function (el) { if (+el.getAttribute('data-cue') <= k) el.classList.remove('wait'); });
  }
  function revealAll() { revealed = 99; $$('#stage .cue.wait').forEach(function (el) { el.classList.remove('wait'); }); }
  function setCC(t) { var cc = $('#cc'); cc.textContent = t || ''; cc.hidden = !(state.cc && t); }
  function audioUI() {
    var has = !!CUES[scr().id];
    var pp = $('#b-play');
    pp.disabled = !has; $('#b-replay').disabled = !has; $('#b-text').disabled = !has; $('#b-cc').disabled = !has;
    var playing = has && !audio.paused && !audio.ended;
    pp.innerHTML = playing ? ICON.pause : ICON.play;
    pp.setAttribute('aria-label', playing ? 'Pauză narațiune' : 'Pornește narațiunea');
    $('#b-cc').setAttribute('aria-pressed', state.cc ? 'true' : 'false');
    var t = $('#time');
    if (has) { var d = CUES[scr().id].dur; t.textContent = fmt(audio.currentTime || 0) + ' / ' + fmt(d); } else t.textContent = '';
  }
  function fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function stopAudio() { clearTimeout(stallT); try { audio.pause(); } catch (e) { /* */ } setCC(''); }
  function playScreen(fromStart) {
    var s = scr(), c = CUES[s.id];
    stopAudio();
    if (!c) { revealAll(); audioUI(); return; }
    if (visitedBefore) revealAll();
    if (fromStart !== false) { audio.src = c.src; try { audio.currentTime = 0; } catch (e) { /* */ } }
    if (!state.audio) { revealAll(); audioUI(); return; }
    var p = audio.play();
    if (p && p.catch) p.catch(function () { revealAll(); audioUI(); });
    stallT = setTimeout(function () { if (audio.paused || audio.currentTime === 0) revealAll(); }, 2500);
    audioUI();
  }
  audio.addEventListener('timeupdate', function () {
    var s = scr(), c = CUES[s.id]; if (!c) return;
    var t = audio.currentTime, k = 0;
    for (var i = 0; i < c.cues.length; i++) if (t + 0.05 >= c.cues[i]) k = i;
    if (k > revealed) { revealed = k; revealUpTo(k); }
    setCC(s.vo[k]);
    audioUI();
  });
  audio.addEventListener('ended', function () { revealAll(); setCC(''); audioUI(); });
  audio.addEventListener('pause', audioUI);
  audio.addEventListener('play', audioUI);
  audio.addEventListener('error', function () { revealAll(); audioUI(); });

  /* ------------------------------------------------------------ randare ecrane */
  var R = {}, B = {};

  R.start = function (s) {
    var resume = state.loc && state.loc !== '0.0' && IDX[state.loc] != null;
    var M = C.meta;
    return '<section class="screen s-start" aria-labelledby="t">' +
      '<div class="txt">' +
      '<p class="kicker">' + esc(M.series) + '</p>' +
      '<h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1>' +
      '<p class="sub">' + esc(M.subtitle) + '</p>' +
      '<div class="credits"><div><b>Curator și conținut:</b> ' + esc(M.curator) + '</div><div><b>E-learning:</b> ' + esc(M.elearning) + '</div><div class="note">' + esc(M.project) + '</div></div>' +
      '<div class="actions">' +
      (resume ? '<button class="btn" data-go="' + esc(state.loc) + '">Continuă de la „' + esc(SCR[IDX[state.loc]].menu) + '” ' + ICON.next + '</button><button class="btn ghost" data-go="0.1">Începe de la capăt</button>'
        : '<button class="btn" data-go="0.1">Începe ' + ICON.next + '</button>') +
      '</div>' +
      '<p class="note">Cursul are narațiune. Pornește sunetul sau folosește subtitrarea (CC). Durată: aproximativ 20–25 de minute.</p>' +
      '<div class="fund"><img src="media/brand/cp_logo_ink.png" alt="Municipiul Timișoara prin Centrul de Proiecte" width="953" height="190"><span>' + esc(M.funding) + '</span></div>' +
      '</div>' +
      '<div class="photo bw">' + img(s.img, 'Elevi, din spate, ascultă turul în fața unui palat verde cu turn, în Piața Victoriei.') + '</div>' +
      '</section>';
  };

  R.about = function (s) {
    return '<section class="screen" aria-labelledby="t"><div class="grid2"><div>' +
      '<h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1><p class="lead">' + esc(s.lead) + '</p>' +
      '<ul class="list">' + s.items.map(function (it) { return '<li class="cue wait"' + cueAttr(it.cue) + '>' + esc(it.text) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="mosaic">' + s.imgs.map(function (m) { return '<figure><div class="photo bw">' + img(m.src, m.alt) + '</div><figcaption class="cap">' + esc(m.cap) + '</figcaption></figure>'; }).join('') + '</div>' +
      '</div></section>';
  };

  R.toc = function (s) {
    var cards = C.lessons.map(function (L) {
      var ids = SCR.filter(function (x) { return x.lesson === L.id; }).map(function (x) { return x.id; });
      var seen = ids.filter(function (id) { return state.visited[id]; }).length;
      return '<button class="tcard" data-go="' + ids[0] + '"><span class="n">' + L.n + '</span><h2>' + esc(L.title) + '</h2><p>' + esc(L.desc) + '</p>' +
        '<span class="st">' + (seen === ids.length ? 'Parcurs' : seen ? seen + ' din ' + ids.length + ' ecrane' : ids.length + ' ecrane') + '</span></button>';
    }).join('');
    cards += '<button class="tcard ws" data-go="4.0"><span class="n">' + ICON.sheet.replace('<svg', '<svg style="width:46px;height:46px"') + '</span><h2>Fișa de lucru</h2><p>Planul, indiciile tale, semnificația lor și clădirea preferată. Se descarcă în Word sau se tipărește.</p><span class="st">Deschide fișa</span></button>';
    return '<section class="screen" aria-labelledby="t"><h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1><p class="lead">' + esc(s.lead) + '</p><div class="toc">' + cards + '</div></section>';
  };

  R.quote = function (s) {
    return '<section class="screen" aria-labelledby="t"><div class="grid2"><div>' +
      '<p class="kicker">Lecția 1 · Citește ornamentul</p><h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1>' +
      '<blockquote class="q">„' + esc(s.quote) + '”</blockquote><p class="by">' + esc(s.by) + '</p>' +
      '<div class="chips">' + s.chips.map(function (c) { return '<span class="chip cue wait"' + cueAttr(c.cue) + '>' + esc(c.text) + '</span>'; }).join('') + '</div></div>' +
      '<figure style="margin:0"><div class="photo bw" style="aspect-ratio:3/4">' + img(s.img.src, s.img.alt) + '</div><figcaption class="cap">Palatul Lloyd, Piața Victoriei</figcaption></figure>' +
      '</div></section>';
  };

  R.reveal = function (s) {
    var e = ex(s.id, { open: [] });
    return '<section class="screen" aria-labelledby="t"><p class="kicker">Lecția 1 · Citește ornamentul</p><h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1>' +
      '<p class="lead">' + esc(s.lead) + '</p>' +
      '<div class="reveal">' + s.cards.map(function (c, i) {
        return '<button class="rbtn" id="rb' + i + '" data-i="' + i + '" aria-expanded="false" aria-controls="rpanel">' + CATI[c.cat] + '<b>' + esc(catLabel(c.cat)) + '</b>' +
          '<span class="seen">' + (e.open.indexOf(c.cat) >= 0 ? 'Deschis ✓' : 'Deschide') + '</span></button>';
      }).join('') + '</div>' +
      '<div id="rpanel" class="rpanel" role="region" aria-live="polite" aria-label="Familia aleasă"><p class="note" style="grid-column:1/-1;margin:0">Alege o familie de mai sus.</p></div>' +
      '<div class="done" id="rdone" ' + (e.open.length >= s.cards.length ? '' : 'hidden') + '>' + ICON.ok.replace('<svg', '<svg style="width:26px;height:26px;flex:0 0 26px"') + '<span>Ai deschis toate cele patru familii. Mergi mai departe la exercițiu.</span></div>' +
      '</section>';
  };
  B.reveal = function (s, root) {
    var e = ex(s.id, { open: [] });
    $$('.rbtn', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var c = s.cards[+b.dataset.i];
        $$('.rbtn', root).forEach(function (x) { x.setAttribute('aria-expanded', x === b ? 'true' : 'false'); });
        $('#rpanel', root).innerHTML = '<div class="photo">' + img(c.img, c.alt) + '</div><div><p class="cat">' + CATI[c.cat] + esc(catLabel(c.cat)) + '</p><h2>' + esc(catLabel(c.cat)) + '</h2><p>' + esc(c.text) + '</p><p class="note">' + esc(c.ex) + '</p></div>';
        if (e.open.indexOf(c.cat) < 0) { e.open.push(c.cat); b.querySelector('.seen').textContent = 'Deschis ✓'; save(); }
        if (e.open.length >= s.cards.length) $('#rdone', root).hidden = false;
      });
    });
  };

  /* sortare (familii sau stiluri) */
  R.sort = function (s) {
    var e = ex(s.ex, { placed: {}, first: {} });
    var items = shuffle(s.items, s.ex.length * 13);
    var isStyle = s.binset === 'styles';
    var head = '<section class="screen" aria-labelledby="t"><p class="kicker">' + (isStyle ? 'Lecția 3 · Povestea clădirii' : 'Lecția 1 · Exercițiu') + '</p><h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1><p class="lead">' + esc(s.lead) + '</p>';
    if (isStyle) head += '<div class="styles">' + s.styles.map(function (st) {
      return '<div class="panel"><h2><span style="display:inline-block;width:28px;height:28px;vertical-align:-4px;margin-right:8px">' + CATI[st.id] + '</span>' + esc(C.styles[st.id].label) + '</h2><p class="yrs">' + esc(st.years) + '</p><p>' + esc(st.signs) + '</p></div>';
    }).join('') + '</div>';
    return head + '<div class="sortwrap"><div><h2 class="sr">' + (isStyle ? 'Clădirile' : 'Indiciile') + '</h2><div class="items">' + items.map(function (it) {
      var pl = e.placed[it.id];
      return '<button class="item' + (pl ? ' placed' : '') + '" data-id="' + it.id + '" aria-pressed="false"' + (pl ? ' aria-disabled="true"' : '') + '>' +
        '<div class="photo' + (pl ? '' : ' bw') + '">' + img(it.img, it.alt) + '</div><span class="l">' + esc(it.label) + '</span>' +
        (pl ? '<span class="badge">' + esc(catLabel(pl)) + ' ✓</span>' : '') + '</button>';
    }).join('') + '</div></div>' +
      '<div><h2 class="sr">' + (isStyle ? 'Stilurile' : 'Familiile') + '</h2><div class="bins">' + s.bins.map(function (b) {
        var tot = s.items.filter(function (it) { return it.bin === b; }).length;
        var got = s.items.filter(function (it) { return e.placed[it.id] === b; }).length;
        var info = C.cats[b] || C.styles[b];
        return '<button class="bin" data-bin="' + b + '">' + CATI[b] + '<span><b>' + esc(info.label) + '</b>' + (info.hint ? '<small>' + esc(info.hint) + '</small>' : '') + '</span><span class="count" aria-label="' + got + ' din ' + tot + ' puse">' + got + '/' + tot + '</span></button>';
      }).join('') + '</div><div class="fb" id="fb" role="status" aria-live="polite"></div></div></div>' +
      '<div class="done" id="sdone" ' + (Object.keys(e.placed).length >= s.items.length ? '' : 'hidden') + '>' + ICON.ok.replace('<svg', '<svg style="width:26px;height:26px;flex:0 0 26px"') + '<span id="sdone-t"></span></div></section>';
  };
  B.sort = function (s, root) {
    var e = ex(s.ex, { placed: {}, first: {} }), sel = null;
    function doneText() {
      var ok = Object.keys(e.first).filter(function (k) { return e.first[k]; }).length;
      $('#sdone-t', root).textContent = 'Gata: ' + ok + ' din ' + s.items.length + ' puse corect din prima încercare.';
    }
    if (Object.keys(e.placed).length >= s.items.length) doneText();
    $$('.item', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.classList.contains('placed')) return;
        sel = b.dataset.id;
        $$('.item', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var it = s.items.filter(function (x) { return x.id === sel; })[0];
        $('#fb', root).className = 'fb'; $('#fb', root).textContent = 'Ai ales „' + it.label + '”. Acum alege ' + (s.binset === 'styles' ? 'stilul.' : 'familia.');
      });
    });
    $$('.bin', root).forEach(function (bn) {
      bn.addEventListener('click', function () {
        var fb = $('#fb', root);
        if (!sel) { fb.className = 'fb'; fb.textContent = 'Întâi alege ' + (s.binset === 'styles' ? 'o clădire' : 'un indiciu') + ' din stânga.'; return; }
        var it = s.items.filter(function (x) { return x.id === sel; })[0], bin = bn.dataset.bin;
        var card = root.querySelector('.item[data-id="' + sel + '"]');
        if (e.first[sel] == null) e.first[sel] = (bin === it.bin);
        if (bin === it.bin) {
          e.placed[sel] = bin;
          card.classList.add('placed'); card.setAttribute('aria-disabled', 'true'); card.setAttribute('aria-pressed', 'false');
          card.querySelector('.photo').classList.remove('bw');
          card.insertAdjacentHTML('beforeend', '<span class="badge">' + esc(catLabel(bin)) + ' ✓</span>');
          fb.className = 'fb ok'; fb.innerHTML = '<strong>Corect.</strong>' + esc(it.fb);
          var tot = s.items.filter(function (x) { return x.bin === bin; }).length, got = s.items.filter(function (x) { return e.placed[x.id] === bin; }).length;
          var cnt = bn.querySelector('.count'); cnt.textContent = got + '/' + tot; cnt.setAttribute('aria-label', got + ' din ' + tot + ' puse');
          sel = null;
          if (Object.keys(e.placed).length >= s.items.length) {
            $('#sdone', root).hidden = false; doneText();
            var resp = s.items.map(function (x) { return x.id + '[.]' + e.placed[x.id]; }).join('[,]');
            var okn = Object.keys(e.first).filter(function (k) { return e.first[k]; }).length;
            ix(s.ex, 'matching', resp, okn === s.items.length ? 'correct' : 'incorrect', plain(s.title) + ' · prima încercare ' + okn + '/' + s.items.length);
          }
        } else {
          card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
          var right = C.cats[it.bin] || C.styles[it.bin];
          fb.className = 'fb bad'; fb.innerHTML = '<strong>Nu chiar.</strong>Nu este „' + esc(catLabel(bin)) + '”. Mai privește o dată: ' + esc(s.binset === 'styles' ? 'citește semnele stilurilor de mai sus.' : 'ce fel de figură vezi? (' + right.hint + ')');
        }
        save();
      });
    });
  };

  R.route = function (s) {
    return '<section class="screen route" aria-labelledby="t"><p class="kicker">Lecția 2 · Vânătoarea pe traseu</p><h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1>' +
      '<div class="grid2"><figure style="margin:0"><div class="photo bw">' + img(s.img.src, s.img.alt) + '</div></figure>' +
      '<ul class="facts">' + s.facts.map(function (f) { return '<li class="cue wait"' + cueAttr(f.cue) + '>' + esc(f.text) + '</li>'; }).join('') + '</ul></div>' +
      '<h2 class="kicker" style="margin-top:26px">Patru opriri</h2><div class="stops cue wait" data-cue="4">' + s.stops.map(function (st) {
        var hs = SCR[IDX[st.to]], e = state.ex[hs.ex] || {}, tot = hs.views.reduce(function (a, v) { return a + v.spots.length; }, 0), f = (e.found || []).length;
        return '<button class="stop" data-go="' + st.to + '"><div class="photo bw">' + img(st.img, st.alt) + '</div><div class="s"><span class="n">' + st.n + '</span><b>' + esc(st.name) + '</b><small>' + esc(st.where) + '</small>' +
          (f ? '<div class="ok">' + f + ' din ' + tot + ' indicii</div>' : '') + '</div></button>';
      }).join('') + '</div></section>';
  };

  /* vânătoarea pe fațadă */
  function spots(s) { var a = []; s.views.forEach(function (v, vi) { v.spots.forEach(function (sp) { a.push({ v: vi, sp: sp }); }); }); return a; }
  function hotStyle(src, sp) {
    var bx = sp.w >= 100 ? 0 : sp.x / (100 - sp.w) * 100, by = sp.h >= 100 ? 0 : sp.y / (100 - sp.h) * 100;
    return 'left:' + sp.x + '%;top:' + sp.y + '%;width:' + sp.w + '%;height:' + sp.h + '%;' +
      '--bg:url(' + IMG + src + '.jpg);--bs:' + (10000 / sp.w).toFixed(2) + '% ' + (10000 / sp.h).toFixed(2) + '%;--bp:' + bx.toFixed(2) + '% ' + by.toFixed(2) + '%';
  }
  R.hunt = function (s) {
    var e = ex(s.ex, { found: [], view: 0 });
    var all = spots(s), view = Math.min(e.view || 0, s.views.length - 1);
    var tabs = s.views.length > 1 ? '<div class="tabs" role="tablist" aria-label="Vederi">' + s.views.map(function (v, i) {
      var t = v.spots.length, f = v.spots.filter(function (sp) { return e.found.indexOf(sp.id) >= 0; }).length;
      return '<button class="tab" role="tab" id="tab' + i + '" aria-controls="vw" aria-selected="' + (i === view) + '" data-v="' + i + '">' + esc(v.name) + '<span class="c">' + f + '/' + t + '</span></button>';
    }).join('') + '</div>' : '';
    return '<section class="screen" aria-labelledby="t"><div class="hunt"><div class="hhead"><p class="kicker">' + esc(s.kicker) + ' · Lecția 2</p><h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1>' +
      '<ul class="facts" style="margin:0 0 6px">' + s.facts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="hpic">' + tabs + '<div id="vw" role="' + (s.views.length > 1 ? 'tabpanel' : 'group') + '" aria-label="Fotografia: caută indiciile"></div>' +
      '<div class="hunttools"><span class="count" id="hcount" aria-live="polite"></span>' +
      '<button class="btn ghost" id="hhint">' + ICON.bulb + 'Indiciu</button><button class="btn ghost" id="hall">' + ICON.eye + 'Arată tot</button></div>' +
      '<p class="note">Atinge sau apasă pe fotografie acolo unde vezi un ornament. Cu tastatura, treci prin zone cu Tab.</p></div>' +
      '<div class="hlist"><h2 class="kicker">Indicii găsite</h2><ol class="found-list" id="flist"></ol><div class="done" id="hdone" hidden>' + ICON.ok.replace('<svg', '<svg style="width:26px;height:26px;flex:0 0 26px"') + '<span>' + esc(s.done) + '</span></div></div></div></section>';
  };
  B.hunt = function (s, root) {
    var e = ex(s.ex, { found: [], view: 0 }), all = spots(s);
    function num(id) { for (var i = 0; i < all.length; i++) if (all[i].sp.id === id) return i + 1; return 0; }
    function drawView(vi) {
      e.view = vi;
      var v = s.views[vi], sz = SZ[v.img] || [1000, 1333];
      var html = '<div class="viewer" style="--r:' + (sz[0] / sz[1]).toFixed(3) + '">' +
        '<img class="base" src="' + IMG + v.img + '.jpg" width="' + sz[0] + '" height="' + sz[1] + '" alt="' + esc(v.alt) + '" draggable="false">' +
        v.spots.map(function (sp) {
          var f = e.found.indexOf(sp.id) >= 0;
          return '<button class="hot' + (f ? ' found' : '') + '" data-id="' + sp.id + '" style="' + hotStyle(v.img, sp) + '" aria-label="' + (f ? num(sp.id) + '. Găsit: ' + esc(sp.title) : 'Caută în zona: ' + esc(sp.area)) + '">' + (f ? '<span class="num" aria-hidden="true">' + num(sp.id) + '</span>' : '') + '</button>';
        }).join('') + '</div>';
      $('#vw', root).innerHTML = html;
      $$('.hot.found', root).forEach(paintFound);
      $$('.tab', root).forEach(function (t) { t.setAttribute('aria-selected', +t.dataset.v === vi ? 'true' : 'false'); });
      if ($('#vw', root).getAttribute('role') === 'tabpanel') $('#vw', root).setAttribute('aria-labelledby', 'tab' + vi);
      $$('.hot', root).forEach(function (h) { h.addEventListener('click', function (ev) { ev.stopPropagation(); hit(h.dataset.id); }); });
      $('.viewer', root).addEventListener('click', function (ev) {
        if (ev.target.closest('.hot')) return;
        var r = this.getBoundingClientRect(), m = document.createElement('span');
        m.className = 'miss'; m.style.left = (ev.clientX - r.left) + 'px'; m.style.top = (ev.clientY - r.top) + 'px';
        this.appendChild(m); setTimeout(function () { m.remove(); }, 650);
      });
    }
    function paintFound(h) { h.style.backgroundImage = 'var(--bg)'; h.style.backgroundSize = 'var(--bs)'; h.style.backgroundPosition = 'var(--bp)'; }
    function list() {
      var items = all.filter(function (a) { return e.found.indexOf(a.sp.id) >= 0; }).sort(function (a, b) { return e.found.indexOf(a.sp.id) - e.found.indexOf(b.sp.id); });
      $('#flist', root).innerHTML = items.length ? items.map(function (a) {
        var sp = a.sp;
        return '<li class="' + (sp.mystery ? 'mys' : '') + '"><p class="cat">' + (CATI[sp.cat] || '') + esc(catLabel(sp.cat)) + '</p><h3><span class="num">' + num(sp.id) + '.</span>' + esc(sp.title) + '</h3><p>' + esc(sp.text) + '</p></li>';
      }).join('') : '<li><p class="note">Încă nimic. Privește fotografia de la stânga: indiciile sunt sus, pe frontoane, pe colțuri și între ferestre.</p></li>';
      $('#hcount', root).textContent = e.found.length + ' din ' + all.length + ' indicii găsite';
      $$('.tab', root).forEach(function (t) {
        var v = s.views[+t.dataset.v], f = v.spots.filter(function (sp) { return e.found.indexOf(sp.id) >= 0; }).length;
        t.querySelector('.c').textContent = f + '/' + v.spots.length;
      });
      var done = e.found.length >= all.length;
      $('#hdone', root).hidden = !done;
      $('#hhint', root).disabled = done; $('#hall', root).disabled = done;
    }
    function hit(id) {
      if (e.found.indexOf(id) >= 0) { var li = $$('#flist li', root)[e.found.indexOf(id)]; if (li) li.scrollIntoView({ block: 'nearest' }); return; }
      e.found.push(id);
      var h = root.querySelector('.hot[data-id="' + id + '"]'), sp = all.filter(function (a) { return a.sp.id === id; })[0].sp;
      if (h) { h.classList.add('found'); h.insertAdjacentHTML('beforeend', '<span class="num" aria-hidden="true">' + num(id) + '</span>'); h.setAttribute('aria-label', num(id) + '. Găsit: ' + sp.title); paintFound(h); }
      list();
      announce('Ai găsit: ' + sp.title + '. ' + e.found.length + ' din ' + all.length + '.');
      if (e.found.length >= all.length) ix(s.ex, 'other', 'gasite:' + e.found.length + '/' + all.length, 'neutral', plain(s.title) + ' · vânătoarea de indicii');
      save();
    }
    $$('.tab', root).forEach(function (t) {
      t.addEventListener('click', function () { drawView(+t.dataset.v); save(); });
      t.addEventListener('keydown', function (ev) {
        if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
        var n = s.views.length, i = (+t.dataset.v + (ev.key === 'ArrowRight' ? 1 : n - 1)) % n;
        drawView(i); root.querySelector('.tab[data-v="' + i + '"]').focus();
      });
    });
    $('#hhint', root).addEventListener('click', function () {
      var next = all.filter(function (a) { return e.found.indexOf(a.sp.id) < 0; })[0]; if (!next) return;
      if (next.v !== e.view) drawView(next.v);
      var h = root.querySelector('.hot[data-id="' + next.sp.id + '"]');
      h.classList.remove('pulse'); void h.offsetWidth; h.classList.add('pulse');
      announce('Indiciu: privește în zona „' + next.sp.area + '”' + (s.views.length > 1 ? ', în vederea „' + s.views[next.v].name + '”.' : '.'));
    });
    $('#hall', root).addEventListener('click', function () {
      all.forEach(function (a) { if (e.found.indexOf(a.sp.id) < 0) e.found.push(a.sp.id); });
      drawView(e.view); list();
      ix(s.ex, 'other', 'gasite:' + all.length + '/' + all.length + ';aratate', 'neutral', plain(s.title) + ' · vânătoarea de indicii');
      save();
    });
    drawView(Math.min(e.view || 0, s.views.length - 1)); list();
  };

  /* potrivire */
  R.match = function (s) {
    var e = ex(s.ex, { ans: {}, first: {}, res: {} });
    var opts = s.options;
    return '<section class="screen" aria-labelledby="t"><p class="kicker">Lecția 3 · Povestea clădirii</p><h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1><p class="lead">' + esc(s.lead) + '</p>' +
      '<div class="rows">' + s.items.map(function (it) {
        var r = e.res[it.id];
        return '<div class="mrow' + (r ? ' ' + r : '') + '" data-id="' + it.id + '"><div class="photo">' + img(it.img, it.alt) + '</div>' +
          '<label for="m_' + it.id + '">' + esc(it.label) + '</label>' +
          '<select id="m_' + it.id + '"><option value="">Alege funcțiunea…</option>' + opts.map(function (o) { return '<option value="' + o.id + '"' + (e.ans[it.id] === o.id ? ' selected' : '') + '>' + esc(o.text) + '</option>'; }).join('') + '</select>' +
          '<span class="res" aria-hidden="true">' + (r === 'ok' ? ICON.ok : r === 'bad' ? ICON.bad : '') + '</span>' +
          '<p class="mfb" id="mf_' + it.id + '">' + (r === 'ok' ? '<b>Corect.</b> ' + esc(it.fb) : r === 'bad' ? '<b>Nu chiar.</b> Mai încearcă.' : '') + '</p></div>';
      }).join('') + '</div><div class="actions"><button class="btn" id="mcheck">Verifică</button></div><div class="fb" id="fb" role="status" aria-live="polite"></div></section>';
  };
  B.match = function (s, root) {
    var e = ex(s.ex, { ans: {}, first: {}, res: {} });
    $$('select', root).forEach(function (sel) {
      sel.addEventListener('change', function () { var id = sel.id.slice(2); e.ans[id] = sel.value; var row = sel.closest('.mrow'); row.classList.remove('ok', 'bad'); row.querySelector('.res').innerHTML = ''; row.querySelector('.mfb').innerHTML = ''; delete e.res[id]; save(); });
    });
    $('#mcheck', root).addEventListener('click', function () {
      var ok = 0, empty = 0;
      s.items.forEach(function (it) {
        var a = e.ans[it.id], row = root.querySelector('.mrow[data-id="' + it.id + '"]');
        if (!a) { empty++; return; }
        var good = a === it.ans;
        if (e.first[it.id] == null) e.first[it.id] = good;
        e.res[it.id] = good ? 'ok' : 'bad';
        row.classList.remove('ok', 'bad'); row.classList.add(good ? 'ok' : 'bad');
        row.querySelector('.res').innerHTML = good ? ICON.ok : ICON.bad;
        row.querySelector('.mfb').innerHTML = good ? '<b>Corect.</b> ' + esc(it.fb) : '<b>Nu chiar.</b> Gândește-te ce se petrecea în clădire. Mai încearcă.';
        if (good) ok++;
      });
      var fb = $('#fb', root);
      if (empty) { fb.className = 'fb'; fb.textContent = 'Ai ' + ok + ' corecte. Mai ai ' + empty + ' ornamente fără răspuns.'; }
      else if (ok === s.items.length) {
        fb.className = 'fb ok'; fb.innerHTML = '<strong>Toate corecte.</strong>Ornamentele spun povestea funcțiunii: comerț, bancă agricolă, industrie, universitate.';
        var resp = s.items.map(function (it) { return it.id + '[.]' + e.ans[it.id]; }).join('[,]');
        var okn = Object.keys(e.first).filter(function (k) { return e.first[k]; }).length;
        ix(s.ex, 'matching', resp, okn === s.items.length ? 'correct' : 'incorrect', plain(s.title) + ' · prima încercare ' + okn + '/' + s.items.length);
      } else { fb.className = 'fb bad'; fb.textContent = ok + ' din ' + s.items.length + ' corecte. Schimbă răspunsurile marcate cu roșu și verifică din nou.'; }
      save();
    });
  };

  /* alegere */
  R.choice = function (s) {
    var e = ex(s.ex, { sel: '', tries: 0 });
    var solved = e.solved;
    return '<section class="screen" aria-labelledby="t"><p class="kicker">Lecția 3 · Povestea clădirii</p><h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1>' +
      '<div class="grid2"><div><p class="lead" id="clead">' + esc(s.lead) + '</p>' +
      '<fieldset class="opts" aria-labelledby="clead">' + s.opts.map(function (o) {
        return '<label class="opt' + (solved ? (o.ok ? ' ok' : '') : '') + '"><input type="radio" name="arg" value="' + o.id + '"' + (e.sel === o.id ? ' checked' : '') + '><span>' + esc(o.text) +
          '<span class="ofb" id="of_' + o.id + '">' + (solved ? esc(o.fb) : '') + '</span></span></label>';
      }).join('') + '</fieldset>' +
      '<div class="actions"><button class="btn" id="ccheck">Verifică</button></div><div class="fb" id="fb" role="status" aria-live="polite"></div>' +
      '<div id="formula"' + (solved ? '' : ' hidden') + '><h2 class="kicker" style="margin-top:20px">Formula unui argument</h2><div class="formula">' + s.formula.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div></div>' +
      '</div><figure style="margin:0"><div class="photo">' + img(s.img.src, s.img.alt) + '</div><figcaption class="cap">Palatul Széchényi, frontonul</figcaption></figure></div></section>';
  };
  B.choice = function (s, root) {
    var e = ex(s.ex, { sel: '', tries: 0 });
    $$('input[name=arg]', root).forEach(function (r) { r.addEventListener('change', function () { e.sel = r.value; save(); }); });
    $('#ccheck', root).addEventListener('click', function () {
      var fb = $('#fb', root);
      if (!e.sel) { fb.className = 'fb'; fb.textContent = 'Alege mai întâi un argument.'; return; }
      var o = s.opts.filter(function (x) { return x.id === e.sel; })[0];
      if (e.first == null) e.first = o.ok;
      e.tries++;
      $$('.opt', root).forEach(function (l) { l.classList.remove('ok', 'bad'); });
      var lab = root.querySelector('input[value="' + o.id + '"]').closest('.opt');
      lab.classList.add(o.ok ? 'ok' : 'bad');
      $('#of_' + o.id, root).textContent = o.fb;
      if (o.ok) {
        e.solved = true;
        s.opts.forEach(function (x) { $('#of_' + x.id, root).textContent = x.fb; });
        fb.className = 'fb ok'; fb.innerHTML = '<strong>Corect.</strong>Folosește aceeași formulă la întrebările 3 și 5 din fișă.';
        $('#formula', root).hidden = false;
        ix(s.ex, 'choice', o.id, e.first ? 'correct' : 'incorrect', plain(s.title) + ' · încercări ' + e.tries);
      } else { fb.className = 'fb bad'; fb.innerHTML = '<strong>Nu chiar.</strong>' + esc(o.fb) + ' Alege alt argument.'; }
      save();
    });
  };

  R.recap = function (s) {
    return '<section class="screen" aria-labelledby="t"><p class="kicker">Lecția 3 · Povestea clădirii</p><h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1>' +
      '<ol class="points">' + s.points.map(function (p) { return '<li class="cue wait"' + cueAttr(p.cue) + '><span>' + esc(p.text) + '</span></li>'; }).join('') + '</ol>' +
      '<div class="mys cue wait" data-cue="5"><div class="photo">' + img(s.mystery.img, s.mystery.alt) + '</div><div><p class="kicker">Indiciul-mister</p><p style="margin:0">' + esc(s.mystery.text) + '</p>' +
      '<div class="actions"><button class="btn mark" data-go="4.0">' + ICON.sheet + 'Deschide fișa</button></div></div></div></section>';
  };

  /* ------------------------------------------------------------ fișa de lucru */
  var W = C.worksheet;
  function wv(k) { return state.ws[k] == null ? '' : state.ws[k]; }
  function field(k, label, ta, ph) {
    return '<label for="w_' + k + '">' + esc(label) + '</label>' + (ta ? '<textarea id="w_' + k + '" data-k="' + k + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>' + esc(wv(k)) + '</textarea>'
      : '<input type="text" id="w_' + k + '" data-k="' + k + '" value="' + esc(wv(k)) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>');
  }
  function learnerName() {
    var n = lms ? SCORM.get('cmi.learner_name') : '';
    if (n && n.indexOf(',') > 0) { var p = n.split(','); n = (p[1] || '').trim() + ' ' + (p[0] || '').trim(); }
    return n.trim();
  }
  R.worksheet = function (s) {
    if (!state.ws.nume) { var ln = learnerName(); if (ln) state.ws.nume = ln; }
    if (!state.ws.scoala) state.ws.scoala = C.meta.school;
    if (!state.ws.clasa) state.ws.clasa = 'X';
    var cl = state.ws.clasa;
    var backBtn = ret != null && SCR[ret] && SCR[ret].id !== '4.0' ? '<button class="btn ghost" data-go="' + SCR[ret].id + '">' + ICON.prev + 'Înapoi la „' + esc(SCR[ret].menu) + '”</button>' : '';
    return '<section class="screen ws" aria-labelledby="t"><div class="wshead"><img src="media/brand/cp_logo_ink.png" width="953" height="190" alt="Finanțat de Municipiul Timișoara prin Centrul de Proiecte și Administrația pentru Sănătate și Educație"><p>Urban Instances V3 – Cetatea citită<br>Ediția a III-a · Școli creative 2026–2027<br>Activitatea 1: Vânătoarea de indicii · LEETUCATION S.R.L.</p></div>' +
      '<p class="kicker">The Built City · „Vânătoarea de indicii” · curator: ' + esc(C.meta.curator) + '</p><h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1>' +
      '<p class="lead">' + esc(s.lead) + '</p>' + (backBtn ? '<div class="actions" style="margin:-6px 0 14px">' + backBtn + '</div>' : '') +
      '<fieldset><legend>Date</legend><div class="row3"><div>' + field('nume', 'Nume') + '</div><div><label for="w_clasa">Clasa</label><select id="w_clasa" data-k="clasa">' +
      ['IX', 'X', 'XI'].map(function (c) { return '<option value="' + c + '"' + (cl === c ? ' selected' : '') + '>a ' + c + '-a</option>'; }).join('') + '</select></div>' +
      '<div><label for="w_data">Data</label><input type="date" id="w_data" data-k="data" value="' + esc(wv('data')) + '"></div></div>' + field('scoala', 'Școala') + '</fieldset>' +
      '<fieldset><legend>Definiția</legend><p class="def">' + esc(W.intro) + '</p></fieldset>' +
      '<fieldset><legend><span class="qn">1.</span><span id="q1t">' + esc(W.q1[cl]) + '</span></legend>' +
      '<div class="maptools" role="toolbar" aria-label="Unelte pentru plan">' +
      '<button class="btn ghost tool" data-tool="start" aria-pressed="true">● Punct de plecare</button><button class="btn ghost tool" data-tool="route" aria-pressed="false">〰 Traseu</button>' +
      '<button class="btn ghost tool" data-tool="fav" aria-pressed="false">★ Clădirea preferată</button><button class="btn ghost" id="mundo">Anulează</button><button class="btn ghost" id="mclear">Șterge tot</button></div>' +
      '<div class="mapbox" id="mapbox"><img src="' + IMG + 'plan.png" width="1729" height="1466" alt="Planul centrului Timișoarei: clădirile în negru, străzile în alb." draggable="false"><canvas id="mapc" aria-hidden="true"></canvas></div>' +
      '<p class="note">Atinge planul pentru punctul de plecare, trage cu degetul sau cu mouse-ul pentru traseu. Dacă nu poți desena, descrie traseul în cuvinte.</p>' +
      field('traseu', 'Traseul în cuvinte (opțional)', true, 'De exemplu: din clasă până la Operă, apoi pe Corso, până la Catedrală…') + '</fieldset>' +
      '<fieldset><legend><span class="qn">2.</span>' + esc(W.q2) + '</legend>' + W.q2cats.map(function (c) {
        return '<div class="pair"><span class="cl" aria-hidden="true">' + CATI[c[0]].replace('<svg', '<svg style="width:22px;height:22px;vertical-align:-5px;margin-right:6px"') + esc(c[1]) + '</span><div>' + field('q2_' + c[0] + '_1', '1) ' + c[1]) + '</div><div>' + field('q2_' + c[0] + '_2', '2) ' + c[1]) + '</div></div>';
      }).join('') + '</fieldset>' +
      '<fieldset><legend><span class="qn">3.</span>' + esc(W.q3) + '</legend>' + [1, 2, 3].map(function (i) { return field('q3_' + i, i + ')', true, i === 1 ? 'Văd … Înseamnă … Se potrivește cu clădirea, pentru că …' : ''); }).join('') + '</fieldset>' +
      '<fieldset><legend><span class="qn">4.</span>' + esc(W.q4) + '</legend>' + field('q4_cladire', 'Clădirea') +
      '<div id="q4x" class="' + (cl === 'IX' ? 'hide' : '') + '">' + field('q4_arg', W.q4arg, true) + field('q4_stil', 'Stilul') + '</div>' +
      '<p class="note">' + esc(W.q4map) + ' Folosește steaua (★) de pe plan.</p></fieldset>' +
      '<fieldset id="q5" class="' + (cl === 'XI' ? '' : 'hide') + '"><legend><span class="qn">5.</span>' + esc(W.q5) + '</legend>' + field('q5', 'Argumentul', true, 'Ornamentul … înseamnă … iar clădirea a fost … de aceea …') + '</fieldset>' +
      '<fieldset><legend>Descarcă sau tipărește</legend><div class="actions" style="margin-top:0"><button class="btn" id="wdocx">' + ICON.down + 'Descarcă fișa (.docx)</button><button class="btn ghost" id="wprint">' + ICON.print + 'Tipărește / salvează PDF</button></div>' +
      '<p class="save" id="ws-save" aria-live="polite"></p><p class="note" id="wmsg" role="status"></p></fieldset>' +
      '<div class="actions">' + (state.done ? '<button class="btn mark" data-go="9.0">Mergi la final ' + ICON.next + '</button>' : '') + '</div></section>';
  };
  var ixT = {};
  B.worksheet = function (s, root) {
    $$('[data-k]', root).forEach(function (el) {
      var k = el.dataset.k;
      var on = function () {
        state.ws[k] = el.value; save();
        if (k === 'clasa') {
          $('#q1t', root).textContent = W.q1[el.value];
          $('#q4x', root).classList.toggle('hide', el.value === 'IX');
          $('#q5', root).classList.toggle('hide', el.value !== 'XI');
        }
        if (/^(q|traseu)/.test(k)) { clearTimeout(ixT[k]); ixT[k] = setTimeout(function () { if (el.value.trim()) ix('fisa_' + k, 'long-fill-in', el.value.trim(), 'neutral', 'Fișa de lucru · ' + k); }, 1500); }
      };
      el.addEventListener(el.tagName === 'SELECT' || el.type === 'date' ? 'change' : 'input', on);
    });
    if (!state.ws.data) { var d = new Date(); state.ws.data = d.toISOString().slice(0, 10); $('#w_data', root).value = state.ws.data; }
    MAP.init(root);
    $('#wdocx', root).addEventListener('click', function () { downloadDocx(); });
    $('#wprint', root).addEventListener('click', function () { printSheet(); });
  };

  /* desen pe plan */
  var MAP = (function () {
    var tool = 'start', cv, ctx, box, drawing = null, ro;
    function pts() { return state.strokes; }
    function draw() {
      if (!cv) return;
      var r = box.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      render(ctx, cv.width, cv.height, dpr);
    }
    function render(c, w, h, k, keep) {
      if (!keep) c.clearRect(0, 0, w, h);
      var starts = 0;
      pts().forEach(function (a) {
        if (a.t === 'p' && a.p.length > 1) {
          c.strokeStyle = '#0F1014'; c.lineWidth = 4 * k; c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath(); a.p.forEach(function (q, i) { var x = q[0] * w, y = q[1] * h; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke();
          c.strokeStyle = '#E4EF3B'; c.lineWidth = 1.6 * k; c.stroke();
        } else if (a.t === 's') {
          starts++;
          c.fillStyle = '#0F1014'; c.beginPath(); c.arc(a.x * w, a.y * h, 12 * k, 0, 7); c.fill();
          c.strokeStyle = '#E4EF3B'; c.lineWidth = 3 * k; c.stroke();
          c.fillStyle = '#fff'; c.font = 'bold ' + Math.round(12 * k) + 'px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('P' + starts, a.x * w, a.y * h + 0.5 * k);
        } else if (a.t === 'f') {
          star(c, a.x * w, a.y * h, 16 * k, k);
        }
      });
    }
    function star(c, x, y, R, k) {
      c.beginPath();
      for (var i = 0; i < 10; i++) { var rr = i % 2 ? R * 0.45 : R, an = Math.PI / 5 * i - Math.PI / 2; c.lineTo(x + rr * Math.cos(an), y + rr * Math.sin(an)); }
      c.closePath(); c.fillStyle = '#E4EF3B'; c.fill(); c.strokeStyle = '#0F1014'; c.lineWidth = 2.5 * k; c.stroke();
    }
    function pos(ev) { var r = cv.getBoundingClientRect(); return [Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height))]; }
    function r3(v) { return Math.round(v * 1000) / 1000; }
    function total() { return pts().reduce(function (a, s) { return a + (s.p ? s.p.length : 1); }, 0); }
    function init(root) {
      box = $('#mapbox', root); cv = $('#mapc', root); ctx = cv.getContext('2d');
      $$('.tool', root).forEach(function (b) { b.addEventListener('click', function () { tool = b.dataset.tool; $$('.tool', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }); });
      $('#mundo', root).addEventListener('click', function () { pts().pop(); draw(); save(); });
      $('#mclear', root).addEventListener('click', function () { if (!pts().length) return; state.strokes = []; draw(); save(); announce('Planul a fost golit.'); });
      cv.addEventListener('pointerdown', function (ev) {
        ev.preventDefault(); var p = pos(ev);
        if (tool === 'route') {
          if (total() > 1800) { $('#wmsg').textContent = 'Planul e plin. Șterge un traseu cu „Anulează”.'; return; }
          drawing = { t: 'p', p: [[r3(p[0]), r3(p[1])]] }; pts().push(drawing); cv.setPointerCapture(ev.pointerId);
        } else if (tool === 'start') { pts().push({ t: 's', x: r3(p[0]), y: r3(p[1]) }); draw(); save(); }
        else { state.strokes = pts().filter(function (a) { return a.t !== 'f'; }); state.strokes.push({ t: 'f', x: r3(p[0]), y: r3(p[1]) }); draw(); save(); }
      });
      cv.addEventListener('pointermove', function (ev) {
        if (!drawing) return; var p = pos(ev), l = drawing.p[drawing.p.length - 1];
        if (Math.abs(p[0] - l[0]) + Math.abs(p[1] - l[1]) < 0.004) return;
        drawing.p.push([r3(p[0]), r3(p[1])]); draw();
      });
      var end = function () { if (!drawing) return; if (drawing.p.length < 2) pts().pop(); drawing = null; draw(); save(); };
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
      if (ro) ro.disconnect();
      if (window.ResizeObserver) { ro = new ResizeObserver(draw); ro.observe(box); }
      var im = $('img', box); if (im.complete) draw(); else im.addEventListener('load', draw);
    }
    function exportJPEG(maxW) {
      return new Promise(function (res) {
        var im = new Image();
        im.onload = function () {
          var w = Math.min(maxW || 1400, im.naturalWidth), h = Math.round(w * im.naturalHeight / im.naturalWidth);
          var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d');
          x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
          var k = w / 800; render(x, w, h, k, true);
          res({ data: c.toDataURL('image/jpeg', 0.86), w: w, h: h });
        };
        im.onerror = function () { res(null); };
        im.src = IMG + 'plan.png';
      });
    }
    return { init: init, exportJPEG: exportJPEG };
  })();

  function wsBlocks(map, logo) {
    var cl = state.ws.clasa || 'X', b = [];
    if (logo) b.push({ img: logo.data, iw: logo.w, ih: logo.h, ext: 'png', wcm: 7.6, alt: 'Finanțat de Municipiul Timișoara prin Centrul de Proiecte și Administrația pentru Sănătate și Educație' });
    var hasStart = state.strokes.some(function (a) { return a.t === 's'; }), hasRoute = state.strokes.some(function (a) { return a.t === 'p'; }), hasFav = state.strokes.some(function (a) { return a.t === 'f'; });
    b.push({ p: 'Urban Instances V3 – Cetatea citită · Activitatea 1: Vânătoarea de indicii · LEETUCATION S.R.L.', sz: 16, color: '555555' });
    b.push({ title: 'Vânătoarea de indicii: ornamentul și povestea' });
    b.push({ p: 'The Built City · tururi de arhitectură · Curator: ' + C.meta.curator, sz: 18, color: '444444', after: 200 });
    b.push({ runs: [['Nume: ', { b: true }], [state.ws.nume || '…', {}]] });
    b.push({ runs: [['Clasa: ', { b: true }], ['a ' + cl + '-a · ' + (state.ws.scoala || ''), {}]] });
    b.push({ runs: [['Data: ', { b: true }], [state.ws.data || '', {}]], after: 200 });
    b.push({ p: W.intro, i: true, border: true, after: 240 });
    b.push({ h: '1. ' + W.q1[cl] });
    if (map) b.push({ img: map.data, iw: map.w, ih: map.h, wcm: 16, alt: 'Planul centrului Timișoarei cu traseul marcat' });
    b.push({ p: 'Pe plan: ' + [hasStart ? 'punct(e) de plecare' : '', hasRoute ? 'traseu' : '', hasFav ? 'clădirea preferată (stea)' : ''].filter(Boolean).join(', ') + (hasStart || hasRoute || hasFav ? '' : 'nimic marcat'), sz: 18, color: '444444' });
    if (state.ws.traseu) b.push({ runs: [['Traseul în cuvinte: ', { b: true }], [state.ws.traseu, {}]] });
    b.push({ h: '2. ' + W.q2 });
    W.q2cats.forEach(function (c) {
      b.push({ runs: [[c[1] + ': ', { b: true }], ['1) ' + (state.ws['q2_' + c[0] + '_1'] || '…') + '   2) ' + (state.ws['q2_' + c[0] + '_2'] || '…'), {}]], indent: 200 });
    });
    b.push({ h: '3. ' + W.q3 });
    [1, 2, 3].forEach(function (i) { b.push({ p: i + ') ' + (state.ws['q3_' + i] || '…'), indent: 200 }); });
    b.push({ h: '4. ' + W.q4 });
    b.push({ p: state.ws.q4_cladire || '…', indent: 200 });
    if (cl !== 'IX') {
      b.push({ runs: [[W.q4arg + ' ', { b: true }]], indent: 200, after: 40 });
      b.push({ p: (state.ws.q4_arg || '…') + (state.ws.q4_stil ? '\nStilul: ' + state.ws.q4_stil : ''), indent: 200 });
    }
    b.push({ p: W.q4map + ' ' + (hasFav ? 'Da, cu steaua de pe plan.' : '…'), indent: 200 });
    if (cl === 'XI') { b.push({ h: '5. ' + W.q5 }); b.push({ p: state.ws.q5 || '…', indent: 200 }); }
    b.push({ p: C.meta.funding + ' E-learning: ' + C.meta.elearning + '.', sz: 16, color: '555555', before: 300 });
    return b;
  }
  function loadLogo() {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () {
        var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0);
        res({ data: c.toDataURL('image/png'), w: c.width, h: c.height });
      };
      im.onerror = function () { res(null); };
      im.src = 'media/brand/cp_logo_print.png';
    });
  }
  function fileName() {
    var n = (state.ws.nume || 'elev').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return 'Fisa_Vanatoarea-de-indicii_' + (n || 'elev') + '.docx';
  }
  function downloadDocx() {
    var msg = $('#wmsg');
    msg.textContent = 'Pregătesc fișa…';
    Promise.all([MAP.exportJPEG(1400), loadLogo()]).then(function (r) {
      var map = r[0], logo = r[1];
      try {
        var blob = DOCX.build(wsBlocks(map, logo), { title: 'Vânătoarea de indicii · fișa de lucru', author: state.ws.nume || '' });
        if (window.navigator && window.navigator.msSaveOrOpenBlob) { window.navigator.msSaveOrOpenBlob(blob, fileName()); }
        else {
          var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName();
          document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        }
        msg.textContent = 'Fișa a fost descărcată: ' + fileName() + '. Dacă descărcarea nu pornește în platformă, folosește „Tipărește / salvează PDF”.';
        ix('fisa_descarcata', 'other', 'docx', 'neutral', 'Fișa de lucru descărcată');
      } catch (e) { msg.textContent = 'Descărcarea nu a mers aici. Folosește „Tipărește / salvează PDF”.'; }
    });
  }
  function printSheet() {
    MAP.exportJPEG(1600).then(function (map) {
      var cl = state.ws.clasa || 'X', P = $('#print');
      var A = function (k) { return '<div class="ans">' + esc(state.ws[k] || ' ') + '</div>'; };
      var h = '<div class="phead"><img class="plogo" src="media/brand/cp_logo_print.png" alt="Finanțat de Municipiul Timișoara prin Centrul de Proiecte și Administrația pentru Sănătate și Educație"><div class="meta">Urban Instances V3 – Cetatea citită<br>Ediția a III-a · Școli creative 2026–2027<br>Activitatea 1: Vânătoarea de indicii · LEETUCATION S.R.L.</div></div><h1>Vânătoarea de indicii: ornamentul și povestea</h1>' +
        '<div class="meta">The Built City · tururi de arhitectură · Curator: ' + esc(C.meta.curator) + '</div>' +
        '<div class="q"><b>Nume:</b>' + A('nume') + '</div><div class="q"><b>Clasa:</b><div class="ans">a ' + cl + '-a · ' + esc(state.ws.scoala || '') + '</div></div><div class="q"><b>Data:</b>' + A('data') + '</div>' +
        '<p><i>' + esc(W.intro) + '</i></p>' +
        '<div class="q"><b>1. ' + esc(W.q1[cl]) + '</b>' + (map ? '<img src="' + map.data + '" alt="Planul cu traseul marcat">' : '') + (state.ws.traseu ? '<div class="ans">' + esc(state.ws.traseu) + '</div>' : '') + '</div>' +
        '<div class="q"><b>2. ' + esc(W.q2) + '</b>' + W.q2cats.map(function (c) { return '<div><i>' + esc(c[1]) + ':</i> 1) ' + esc(state.ws['q2_' + c[0] + '_1'] || '…') + ' · 2) ' + esc(state.ws['q2_' + c[0] + '_2'] || '…') + '</div>'; }).join('') + '</div>' +
        '<div class="q"><b>3. ' + esc(W.q3) + '</b>' + A('q3_1') + A('q3_2') + A('q3_3') + '</div>' +
        '<div class="q"><b>4. ' + esc(W.q4) + '</b>' + A('q4_cladire') + (cl !== 'IX' ? '<i>' + esc(W.q4arg) + '</i>' + A('q4_arg') + A('q4_stil') : '') + '</div>' +
        (cl === 'XI' ? '<div class="q"><b>5. ' + esc(W.q5) + '</b>' + A('q5') + '</div>' : '') +
        '<div class="foot">' + esc(C.meta.funding) + ' E-learning: ' + esc(C.meta.elearning) + '.</div>';
      P.innerHTML = h;
      setTimeout(function () { window.print(); }, 150);
    });
  }

  /* ------------------------------------------------------------ final */
  R.final = function (s) {
    var miss = REQUIRED.filter(function (id) { return !state.visited[id]; });
    var p = scoreParts();
    var M = C.meta;
    return '<section class="screen final" aria-labelledby="t"><div class="grid2"><div>' +
      '<h1 class="t" id="t" tabindex="-1">' + mk(s.title) + '</h1><p class="lead">' + esc(s.lead) + '</p>' +
      (miss.length ? '<p class="fb">Mai ai ' + miss.length + ' ' + (miss.length === 1 ? 'ecran' : 'ecrane') + ' de parcurs. <button class="btn ghost" data-go="' + miss[0] + '">Mergi la „' + esc(SCR[IDX[miss[0]]].menu) + '”</button></p>'
        : '<p class="endmsg">Cursul este finalizat.' + (p.tried ? ' Răspunsuri corecte din prima încercare la exerciții: ' + p.raw + ' din ' + p.max + '.' : '') + '</p>') +
      '<h2 class="kicker" style="margin-top:24px" id="dlh">Materialele activității</h2>' +
      '<ul class="dl" aria-labelledby="dlh">' + C.downloads.map(function (d, i) {
        return '<li><a class="dlcard" href="' + esc(d.href) + '" download data-dl="' + i + '">' + ICON.down + '<span><b>' + esc(d.title) + '</b><small>' + esc(d.desc) + '</small><small class="meta">PDF · ' + esc(d.size) + ' · de tipărit</small></span></a></li>';
      }).join('') +
      '<li><button class="dlcard" id="dl-mine" type="button">' + ICON.sheet + '<span><b>Fișa ta completată</b><small>Răspunsurile tale și traseul desenat pe plan.</small><small class="meta">Word (.docx)</small></span></button></li>' +
      '</ul><p class="note" id="wmsg" role="status"></p>' +
      '<h2 class="kicker" style="margin-top:24px">Părerea ta (opțional)</h2><div class="likert">' + C.feedback.map(function (f) {
        return '<fieldset><legend>' + esc(f.q) + '</legend><div class="sc">' + [1, 2, 3, 4, 5].map(function (n) {
          return '<label><input type="radio" name="' + f.id + '" value="' + n + '"' + (state.fb[f.id] === n ? ' checked' : '') + '><span>' + n + '</span></label>';
        }).join('') + '<span class="note" style="align-self:center;margin-left:6px">1 = deloc · 5 = pe deplin</span></div></fieldset>';
      }).join('') + '</div>' +
      '<div class="actions">' + (lms ? '<button class="btn" id="exit">' + ICON.exit + 'Ieși din curs</button>' : '') + '<button class="btn ghost" data-go="4.0">' + ICON.sheet + 'Fișa de lucru</button><button class="btn ghost" data-go="0.2">Cuprinsul</button></div>' +
      '</div><div><figure style="margin:0"><div class="photo bw">' + img(s.img.src, s.img.alt) + '</div></figure>' +
      '<div class="credits" style="margin-top:20px"><dl><dt>Curator și conținut</dt><dd>' + esc(M.curator) + ' · fișa de lucru „Vânătoarea de indicii”</dd>' +
      '<dt>E-learning</dt><dd>' + esc(M.elearning) + '</dd><dt>Activitate</dt><dd>' + esc(M.project) + '</dd><dt>Fotografii</dt><dd>Turul din noiembrie 2026, ' + esc(M.school) + '</dd>' +
      '<dt>Voce</dt><dd>Narațiune generată (ElevenLabs, prin Magnific)</dd></dl></div>' +
      '<details class="src"><summary>Surse pentru datele despre clădiri</summary><ol>' + C.sources.map(function (x) {
        return '<li>' + esc(x[0]) + (/^https?:/.test(x[1]) ? ' · <a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + esc(x[1].replace(/^https?:\/\//, '')) + '<span class="sr"> (se deschide într-o filă nouă)</span></a>' : ' · ' + esc(x[1])) + '</li>';
      }).join('') + '</ol></details>' +
      '<div class="logos"><img class="cp" src="media/brand/cp_logo_ink.png" alt="Finanțat de Municipiul Timișoara prin Centrul de Proiecte" width="953" height="190">' +
      '<img class="lt" src="media/brand/leetucation_v_ink.svg" alt="LEETUCATION" width="420" height="186"></div><p class="note">' + esc(M.funding) + '</p>' +
      '</div></div></section>';
  };
  B.final = function (s, root) {
    $$('.likert input', root).forEach(function (r) {
      r.addEventListener('change', function () {
        state.fb[r.name] = +r.value; save();
        var f = C.feedback.filter(function (x) { return x.id === r.name; })[0];
        ix(r.name, 'likert', r.value, 'neutral', f.q);
      });
    });
    var x = $('#exit', root); if (x) x.addEventListener('click', exitCourse);
    $('#dl-mine', root).addEventListener('click', function () {
      var has = Object.keys(state.ws).some(function (k) { return /^(q|traseu)/.test(k) && String(state.ws[k]).trim(); }) || state.strokes.length;
      if (!has) { $('#wmsg', root).innerHTML = 'Fișa ta e încă goală. <button class="btn ghost" data-go2="4.0">Completează fișa</button>'; $('[data-go2]', root).addEventListener('click', function () { go('4.0'); }); return; }
      downloadDocx();
    });
    $$('[data-dl]', root).forEach(function (a) {
      a.addEventListener('click', function () { var d = C.downloads[+a.dataset.dl]; ix('material_' + (+a.dataset.dl + 1), 'other', 'descarcat', 'neutral', 'Material descărcat: ' + d.title); });
    });
  };

  /* ------------------------------------------------------------ navigare */
  function go(i, opts) {
    opts = opts || {};
    if (typeof i === 'string') i = IDX[i];
    if (i == null || i < 0 || i >= SCR.length) return;
    if (SCR[i].id === '4.0' && cur !== i) ret = cur;
    stopAudio();
    cur = i;
    var s = scr();
    visitedBefore = !!state.visited[s.id];
    if (s.type !== 'start') { state.visited[s.id] = true; state.loc = s.id; }
    revealed = -1;
    var st = $('#stage');
    st.innerHTML = R[s.type](s);
    if (visitedBefore || !CUES[s.id]) revealAll();
    $$('[data-go]', st).forEach(function (b) { b.addEventListener('click', function () { go(b.dataset.go); }); });
    if (B[s.type]) B[s.type](s, st);
    $('main').scrollTop = 0;
    updateChrome();
    checkDone();
    save();
    var t = $('#t', st); if (t && !opts.noFocus) t.focus({ preventScroll: true });
    document.title = plain(s.title) + ' · ' + C.meta.title;
    if (s.type !== 'start') playScreen(); else audioUI();
  }
  function updateChrome() {
    var p = Math.round(progress() * 100);
    $('#prog i').style.width = p + '%'; $('#pct').textContent = p + '%';
    $('#prog').setAttribute('aria-valuenow', p);
    $('#b-prev').disabled = cur === 0;
    var nx = $('#b-next');
    nx.disabled = cur === SCR.length - 1;
    var isStart = scr().type === 'start';
    $('#bar').hidden = isStart;
    $('#b-sheet').hidden = scr().id === '4.0';
    menuList();
    audioUI();
  }
  function menuList() {
    var groups = [{ t: 'Început', f: function (s) { return !s.lesson && ['0.1', '0.2'].indexOf(s.id) >= 0; } }]
      .concat(C.lessons.map(function (L) { return { t: 'Lecția ' + L.n + ' · ' + L.title, f: function (s) { return s.lesson === L.id; } }; }))
      .concat([{ t: 'Fișa și finalul', f: function (s) { return s.id === '4.0' || s.id === '9.0'; } }]);
    $('#menu-list').innerHTML = groups.map(function (g) {
      return '<h3>' + esc(g.t) + '</h3><ol>' + SCR.filter(g.f).map(function (s) {
        return '<li class="' + (state.visited[s.id] ? 'seen' : '') + '"><button data-mgo="' + s.id + '"' + (s === scr() ? ' aria-current="page"' : '') + '><span class="dot" aria-hidden="true"></span><span>' + esc(s.menu) + (state.visited[s.id] ? '<span class="sr"> (parcurs)</span>' : '') + '</span></button></li>';
      }).join('') + '</ol>';
    }).join('');
    $$('[data-mgo]').forEach(function (b) { b.addEventListener('click', function () { closeMenu(); go(b.dataset.mgo); }); });
    $('#m-sound').setAttribute('aria-pressed', state.audio ? 'true' : 'false');
    $('#m-sound .v').textContent = state.audio ? 'pornit' : 'oprit';
    $('#m-cc').setAttribute('aria-pressed', state.cc ? 'true' : 'false');
    $('#m-cc .v').textContent = state.cc ? 'pornită' : 'oprită';
    $('#m-exit').hidden = !lms;
  }
  var lastFocus = null;
  function openMenu() { lastFocus = document.activeElement; $('#drawer').classList.add('open'); $('#b-menu').setAttribute('aria-expanded', 'true'); $('#drawer .panel').focus(); }
  function closeMenu() { $('#drawer').classList.remove('open'); $('#b-menu').setAttribute('aria-expanded', 'false'); if (lastFocus) lastFocus.focus(); }

  function exitCourse() {
    stopAudio(); save(true);
    if (lms) { reportScore(); SCORM.finish(state.done ? 'normal' : 'suspend', true); }
    $('#stage').innerHTML = '<section class="screen" aria-labelledby="t"><h1 class="t" id="t" tabindex="-1">La <mark>revedere</mark></h1><p class="lead">Progresul tău a fost salvat. Poți închide această fereastră.</p></section>';
    $('#bar').hidden = true; $('#t').focus();
  }

  /* ------------------------------------------------------------ pornire */
  function shell() {
    document.getElementById('app').innerHTML =
      '<header class="top"><div class="brand">' + esc(C.meta.title) + ' <span>· The Built City</span></div>' +
      '<div class="prog" id="prog" role="progressbar" aria-label="Progres în curs" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><span class="pct" id="pct" aria-hidden="true">0%</span>' +
      '<button class="iconbtn" id="b-menu" aria-expanded="false" aria-controls="drawer">' + ICON.menu + '<span class="lbl">Cuprins</span></button></header>' +
      '<main id="main" tabindex="-1"><div id="stage"></div></main>' +
      '<div class="cc" id="cc" hidden aria-hidden="true"></div>' +
      '<nav class="bar" id="bar" aria-label="Navigare și narațiune">' +
      '<button class="btn ghost" id="b-prev" aria-label="Înapoi">' + ICON.prev + '<span class="lbl">Înapoi</span></button>' +
      '<button class="iconbtn" id="b-play" aria-label="Pornește narațiunea">' + ICON.play + '</button>' +
      '<button class="iconbtn" id="b-replay" aria-label="Ascultă din nou">' + ICON.replay + '</button>' +
      '<button class="iconbtn" id="b-cc" aria-pressed="false" aria-label="Subtitrare">' + ICON.cc + '</button>' +
      '<button class="iconbtn" id="b-text" aria-label="Textul narațiunii">' + ICON.text + '</button>' +
      '<span class="time" id="time" aria-hidden="true"></span><span class="grow"></span>' +
      '<button class="btn ghost" id="b-sheet" aria-label="Fișa de lucru">' + ICON.sheet + '<span class="lbl">Fișa</span></button>' +
      '<button class="btn" id="b-next" aria-label="Înainte"><span class="lbl">Înainte</span>' + ICON.next + '</button></nav>';
    document.getElementById('drawer').innerHTML = '<div class="scrim" data-close></div><div class="panel" role="dialog" aria-modal="true" aria-labelledby="mh" tabindex="-1">' +
      '<div style="display:flex;justify-content:space-between;align-items:center"><h2 id="mh">Cuprins</h2><button class="iconbtn" data-close aria-label="Închide cuprinsul"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2"/></svg></button></div>' +
      '<div id="menu-list"></div><div class="tools">' +
      '<button class="btn ghost" id="m-sound" aria-pressed="true">' + ICON.sound + 'Sunet: <span class="v">pornit</span></button>' +
      '<button class="btn ghost" id="m-cc" aria-pressed="false">' + ICON.cc + 'Subtitrare: <span class="v">oprită</span></button>' +
      '<button class="btn ghost" id="m-exit" hidden>' + ICON.exit + 'Ieși din curs</button></div></div>';

    $('#b-prev').addEventListener('click', function () { go(cur - 1); });
    $('#b-next').addEventListener('click', function () { go(cur + 1); });
    $('#b-sheet').addEventListener('click', function () { go('4.0'); });
    $('#b-play').addEventListener('click', function () {
      if (!CUES[scr().id]) return;
      if (audio.paused || audio.ended) {
        if (!state.audio) { state.audio = true; menuList(); }
        if (!audio.src || audio.src.indexOf(CUES[scr().id].src) < 0 || audio.ended) { playScreen(); return; }
        audio.play().catch(function () { revealAll(); });
      } else audio.pause();
    });
    $('#b-replay').addEventListener('click', function () { if (!state.audio) { state.audio = true; menuList(); } playScreen(); });
    $('#b-cc').addEventListener('click', function () { state.cc = !state.cc; save(); audioUI(); menuList(); if (!state.cc) setCC(''); });
    $('#b-text').addEventListener('click', function () {
      var s = scr(); if (!s.vo) return;
      var d = $('#tdlg'); $('#tdlg-b').innerHTML = s.vo.map(function (v) { return '<p>' + esc(v) + '</p>'; }).join('');
      $('#tdlg-t').textContent = 'Textul narațiunii · ' + plain(s.title);
      if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    });
    $('#tdlg-x').addEventListener('click', function () { var d = $('#tdlg'); if (d.close) d.close(); else d.removeAttribute('open'); });
    $('#b-menu').addEventListener('click', openMenu);
    $$('#drawer [data-close]').forEach(function (b) { b.addEventListener('click', closeMenu); });
    $('#drawer').addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
      if (e.key === 'Tab') { var f = $$('#drawer button:not([hidden])'), a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    $('#m-sound').addEventListener('click', function () { state.audio = !state.audio; if (!state.audio) stopAudio(); save(); menuList(); audioUI(); });
    $('#m-cc').addEventListener('click', function () { state.cc = !state.cc; save(); menuList(); audioUI(); });
    $('#m-exit').addEventListener('click', function () { closeMenu(); exitCourse(); });
    document.addEventListener('keydown', function (e) {
      if (e.altKey && e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); go(cur + (e.key === 'ArrowRight' ? 1 : -1)); }
    });
    window.addEventListener('pagehide', function () { save(true); if (lms && !SCORM.terminated()) SCORM.finish(state.done ? 'normal' : 'suspend', false); });
    window.addEventListener('beforeunload', function () { save(true); if (lms && !SCORM.terminated()) SCORM.finish(state.done ? 'normal' : 'suspend', false); });
  }

  function start() {
    lms = SCORM.init();
    load();
    if (lms) {
      var cs = SCORM.get('cmi.completion_status');
      if (cs !== 'completed') SCORM.set('cmi.completion_status', 'incomplete');
      if (cs === 'completed') state.done = true;
      SCORM.set('cmi.score.min', 0);
      SCORM.commit();
    }
    shell();
    window.__course = { go: go, state: function () { return state; }, lms: function () { return lms; }, score: scoreParts, screens: SCR };
    go(0, { noFocus: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
