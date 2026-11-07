/* =========================================================
   GREENJOLA — THE GAME · screen machine + navigation
   Keyboard (arrows / Enter / Esc), mouse, touch and gamepad.
   ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { burst, loopNoise, sfx, setSound, city, reduceMotion } = window.FX;

  const game = $('#game');
  const loader = $('#loader');

  /* ---------- settings (memory card) ---------- */
  const STORE_KEY = 'gj23';
  const settings = { sound: true, crt: true, rumble: true, mode: '', unlocked: false };
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORE_KEY) || '{}')); } catch (e) { /* private mode */ }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ }
  }

  /* ---------- data (checked against Spotify / Deezer / Apple Music / jolagreen23.com) ---------- */
  const ALBUMS = {
    rd: { title: '“RECHERCHE&DESTRUCTION”', desc: 'Premier album · 15.12.2023 · 12 titres, avec Wallace Cleaver et Benny The Butcher.', action: "Entrée pour l'écouter sur Spotify" },
    xp: { title: '“+99XP”', desc: 'Deuxième album · 08.11.2024 · 15 titres, avec Green Montana, Adèle Castillon et Lesram.', action: "Entrée pour l'écouter sur Spotify" },
    goty: { title: '“GOTY EDITION”', desc: 'EP · 2025 · 15 titres dans sa version complète.', action: "Entrée pour l'écouter sur Spotify" },
    unknown: { title: '“???”', desc: 'Signal inconnu. Un projet de 23 titres attend dans le bunker.', action: 'Entrée pour lancer le décryptage' },
  };

  // featurings in tracklist order, then the EXTENDO + bonus — photos: official Deezer artist pictures
  const PLAYERS = [
    { cam: 'CAM 01 // PLAYER 2', name: 'TIAKOLA', track: 'LOCKED UP (feat. Tiakola) · piste 03 · 2:53', meta: 'PISTE 03', link: 'https://www.deezer.com/fr/track/3835575631' },
    { cam: 'CAM 02 // PLAYER 3', name: 'LA MANO 1.9', track: '2319 (feat. La Mano 1.9) · piste 09 · 2:51', meta: 'PISTE 09', link: 'https://www.deezer.com/fr/track/3835575691' },
    { cam: 'CAM 03 // PLAYER 4', name: 'LA FÈVE', track: 'JOLAF (feat. La Fève) · piste 22 · 3:43', meta: 'PISTE 22', link: 'https://www.deezer.com/fr/track/3835575821' },
    { cam: 'DLC // EXTENDO +', name: 'JOSMAN', track: 'FOKONKITTELEBANDO (feat. Josman) · 23 JPT EXTENDO + · piste 01 · 3:32', meta: 'EXTENDO+', link: 'https://www.deezer.com/fr/track/4080520211' },
  ];

  // official clips — Jolagreen23 YouTube channel
  const CLIPS = [
    { id: 'F2LdS7puOl4', title: 'MÉTAL', date: '30.01.2026' },
    { id: 'lS6gVOXUd5s', title: 'LOCKED UP ft. TIAKOLA', date: '27.02.2026' },
    { id: 'IwlYh7vyrPc', title: 'JAPANEXPO', date: '16.04.2026' },
  ];

  // official store items (jolagreen23.com/products.json)
  const SHOP = [
    { name: 'CD', price: '10 €', img: 'assets/img/shop-cd.jpg', url: 'https://jolagreen23.com/products/cd-23-jours-plus-tard' },
    { name: 'CD — version alternative', price: '15 €', img: 'assets/img/shop-cd-exclu.jpg', url: 'https://jolagreen23.com/products/cd-23-jours-plus-tard-alternative-version' },
    { name: 'Clé USB', price: '10 €', img: 'assets/img/shop-usb.jpg', url: 'https://jolagreen23.com/products/cle-usb-23-jours-plus-tard' },
    { name: 'Pack 2 CD', price: '23 €', img: 'assets/img/shop-bundle-cd.jpg', url: 'https://jolagreen23.com/products/pack-cd-23-jours-de-plus' },
    { name: 'Mega pack', price: '60 €', img: 'assets/img/shop-bundle.jpg', url: 'https://jolagreen23.com/products/mega-pack-23-jours-plus-tard' },
  ];

  // [title, duration, featuring] — 23 JOURS PLUS TARD (Label Blue Sky, 13.03.2026)
  const TRACKS = [
    ['MONSTRES&DEMONS', '1:26'], ['JAPANEXPO', '2:49'], ['LOCKED UP', '2:53', 'Tiakola'],
    ['CRUELLA', '3:00'], ['PHANTOM', '3:14'], ['KADYROV', '2:28'], ['MON CARTOON', '2:32'],
    ['BLEUDECHANEL', '2:37'], ['2319', '2:51', 'La Mano 1.9'], ['INAZUMA11', '2:21'],
    ['METAL', '3:12'], ['LA QUÊTE', '2:55'], ['PAR LA FENÊTRE', '2:21'], ['M1030', '3:10'],
    ['PARIS7', '2:42'], ['2 TEMPS EN TEMPS', '2:34'], ['JME SENS DIFFERENT', '2:06'],
    ['FOUTULESEUM', '2:58'], ['MARIA', '3:01'], ['FAUX SOURIRE', '3:01'], ['MADARASKIT', '1:49'],
    ['JOLAF', '3:43', 'La Fève'], ['23JOURSPLUSTARD', '3:17'],
  ];

  // 23 JPT EXTENDO + (26.06.2026)
  const DLC = [
    ['FOKONKITTELEBANDO', '3:32', 'Josman'], ['WWE 2K26', '2:15'], ['MASENKO', '3:27'], ['WOLFENSTEIN', '2:19'],
    ['RIP EDDIE GUERRERO', '2:48'], ['ALTAIR IBN LA AHAD', '2:08'], ['KATAKURI', '2:50'], ['PERSONAL SHOPPER', '2:03'],
  ];

  const STORY = [
    'Ça fait <em>23 jours</em> que je suis enfermé dans ce bunker.',
    'Dehors, la ville a changé. Les écrans ne s’éteignent plus.',
    'J’ai capté trois signaux : <em>Tiakola</em>, <em>La Mano 1.9</em> et <em>La Fève</em>.',
    '<em>23 titres</em>. Une seule sortie. On y va.',
  ];

  const FX_FOR = { albums: 'corner', players: 'corner', release: 'disc' };
  const MENU_HINTS = {
    difficulty: "Commence l'histoire depuis le bunker.",
    release: "Va direct à l'album : écoute, tracklist et CD.",
    albums: 'Toute la discographie, sauvegarde par sauvegarde.',
    players: 'Les caméras du bunker : les featurings.',
    shop: 'CD, clé USB et packs officiels.',
    options: 'Son, filtre CRT, vibrations.',
    credits: 'Générique de fin.',
  };

  /* ---------- image slots: hide broken <img>, keep the generated fallback ---------- */
  function markSlot(img) {
    const fail = () => {
      img.classList.add('slot-missing');
      img.parentElement.classList.remove('has-img');
    };
    const ok = () => {
      img.classList.remove('slot-missing');
      img.parentElement.classList.add('has-img');
    };
    img.addEventListener('error', fail);
    img.addEventListener('load', ok);
    if (img.complete) (img.naturalWidth ? ok : fail)();
  }
  $$('img[data-slot]').forEach(markSlot);

  /* ---------- screen machine ---------- */
  let current = 'boot';
  let busy = false;
  const historyStack = [];
  const focusMemory = {};

  const screenEl = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* Transitions copied from the trailer:
     dip     → quick cut through black (back navigation, small menus)
     corner  → black screen + spinning memory-card icon bottom-right (title → menu, menu → album select)
     disc    → centered spinning disc with bloom + progress bar (→ story, → album release)
     vhs     → VHS tracking glitch (story → cameras)
     card    → black title card "23 JOURS PLUS TARD" (cameras → album release)
     static  → TV static burst (camera switch) */
  const blackout = $('#blackout');
  const cornerLoad = $('#corner-load');
  const vhs = $('#vhs');
  const titleCard = $('#title-card');
  const D = (ms) => (reduceMotion ? Math.min(ms, 150) : ms);

  async function go(id, { fx = 'dip', push = true, url = push ? 'push' : 'replace' } = {}) {
    if (busy || id === current) return;
    busy = true;
    const from = screenEl(current);
    const to = screenEl(id);
    leave(current);

    if (fx === 'disc') {
      loader.classList.remove('is-on');
      void loader.offsetWidth;
      loader.classList.add('is-on');
      await wait(D(1300));
      swap(from, to, id, push, url);
      loader.classList.remove('is-on');
    } else if (fx === 'corner') {
      blackout.classList.add('is-on');
      await wait(D(260));
      cornerLoad.classList.add('is-on');
      await wait(D(650));
      swap(from, to, id, push, url);
      cornerLoad.classList.remove('is-on');
      await wait(D(120));
      blackout.classList.remove('is-on');
    } else if (fx === 'vhs') {
      sfx.static();
      vhs.classList.add('is-on');
      game.classList.add('is-vhs');
      await wait(D(520));
      swap(from, to, id, push, url);
      await wait(D(380));
      vhs.classList.remove('is-on');
      game.classList.remove('is-vhs');
    } else if (fx === 'card') {
      sfx.static();
      vhs.classList.add('is-on');
      game.classList.add('is-vhs');
      await wait(D(400));
      titleCard.classList.add('is-on');
      vhs.classList.remove('is-on');
      game.classList.remove('is-vhs');
      await wait(D(900));
      swap(from, to, id, push, url);
      titleCard.classList.remove('is-on');
    } else if (fx === 'fade') {
      swap(from, to, id, push, url);
    } else if (fx === 'static') {
      sfx.static();
      const b = burst(340);
      await wait(D(150));
      swap(from, to, id, push, url);
      await b;
    } else {
      blackout.classList.add('is-on', 'is-fast');
      await wait(D(200));
      swap(from, to, id, push, url);
      await wait(D(60));
      blackout.classList.remove('is-on');
      await wait(D(200));
      blackout.classList.remove('is-fast');
    }
    busy = false;
  }

  function swap(from, to, id, push, url = 'replace') {
    if (push) historyStack.push(current);
    const hash = id === 'boot' || id === 'title' ? '' : '#' + id;
    if (url !== 'none' && location.hash !== hash) {
      try { history[url === 'push' ? 'pushState' : 'replaceState'](null, '', hash || location.pathname + location.search); } catch (e) { /* file:// */ }
    }
    from.classList.remove('is-active');
    to.classList.add('is-active');
    current = id;
    document.body.dataset.screen = id;
    $('[data-home-label]').textContent = id === 'menu' ? 'ÉCRAN TITRE' : 'ACCUEIL';
    const horizontal = ['albums', 'players'].includes(id);
    $('[data-hint-axis]').innerHTML = horizontal
      ? 'RIGHT/LEFT <svg><use href="#i-leftright"/></svg>'
      : (id === 'story' ? 'ENTER <svg><use href="#i-arrow"/></svg>' : 'UP/DOWN <svg><use href="#i-updown"/></svg>');
    enter(id);
  }

  // home button / H key / Select: inner screen -> main menu, main menu -> title screen
  function goHome() {
    if (busy || current === 'boot' || current === 'title') return;
    sfx.back();
    historyStack.length = 0;
    go(current === 'menu' || current === 'credits' ? 'title' : 'menu', { push: false });
  }

  function back() {
    if (busy) return;
    sfx.back();
    if (current === 'credits') { historyStack.length = 0; go('title', { push: false }); return; }
    let target = historyStack.pop() || screenEl(current).dataset.back || 'menu';
    if (target === 'boot' || target === 'title') target = 'menu';
    if (target === current) target = 'menu';
    go(target, { push: false });
  }

  /* ---------- focus / navigation ---------- */
  function options(id = current) {
    const scr = screenEl(id);
    if (id === 'story' && !scr.classList.contains('is-done')) return [];
    return $$('.opt', scr);
  }

  function setFocus(i, { sound = true, scroll = true } = {}) {
    const list = options();
    if (!list.length) return;
    const n = (i + list.length) % list.length;
    const prev = focusMemory[current];
    focusMemory[current] = n;
    list.forEach((el, k) => el.classList.toggle('is-focus', k === n));
    const el = list[n];
    el.focus({ preventScroll: true });
    if (scroll && ['release', 'albums', 'shop'].includes(current)) {
      el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (sound && prev !== n) sfx.move();
    onFocus(el);
  }

  function move(dir) { setFocus((focusMemory[current] ?? 0) + dir); }

  // Keyboard/gamepad activation goes through here only; native keyboard "clicks"
  // (detail === 0) are ignored in the click handler so one key press = one action.
  let programmatic = false;
  function activateFocused() {
    const el = options()[focusMemory[current] ?? 0];
    if (!el) return;
    programmatic = true;
    el.click();
    programmatic = false;
  }

  /* ---------- desktop preview panels (official visuals only) ---------- */
  const IMG = 'assets/img/';
  const PREVIEWS = {
    difficulty: () => `
      <p class="pv-kicker">NEW GAME</p>
      <h3 class="pv-title">Le bunker</h3>
      <p class="pv-text">23 jours enfermé. Choisis ta difficulté, traverse la ville et retrouve les trois featurings de l'album.</p>
      <ul class="pv-stats"><li><b>3</b> players</li><li><b>23</b> niveaux</li><li><b>1</b> sortie</li></ul>`,
    release: () => `
      <img class="pv-cover" src="${IMG}cover-23jpt.jpg" alt="">
      <p class="pv-kicker">QUICK PLAY</p>
      <h3 class="pv-title">23 JOURS PLUS TARD</h3>
      <ul class="pv-stats"><li><b>13.03.26</b> sortie</li><li><b>23</b> titres</li><li><b>1 h 03</b> durée</li></ul>`,
    albums: () => `
      <div class="pv-covers">${['cover-rd', 'cover-99xp', 'cover-goty', 'cover-23jpt'].map((c) => `<img src="${IMG}${c}.jpg" alt="">`).join('')}</div>
      <p class="pv-kicker">LOAD GAME</p>
      <h3 class="pv-title">4 sauvegardes</h3>
      <p class="pv-text">RECHERCHE&amp;DESTRUCTION · +99XP · GOTY EDITION · ???</p>`,
    players: () => `
      <p class="pv-kicker">EXTRAS // CAMÉRAS</p>
      <ol class="pv-players"><li>TIAKOLA <small>LOCKED UP</small></li><li>LA MANO 1.9 <small>2319</small></li><li>LA FÈVE <small>JOLAF</small></li><li class="is-dlc">JOSMAN <small>DLC · FOKONKITTELEBANDO</small></li></ol>`,
    shop: () => `
      <img class="pv-cover" src="${IMG}shop-bundle.jpg" alt="">
      <p class="pv-kicker">BOUTIQUE OFFICIELLE</p>
      <h3 class="pv-title">CD, clé USB &amp; packs</h3>
      <ul class="pv-stats"><li><b>10 €</b> le CD</li><li><b>23 €</b> pack 2 CD</li><li><b>60 €</b> mega pack</li></ul>`,
    options: () => `
      <p class="pv-kicker">OPTIONS</p>
      <ul class="pv-stats pv-stats--col"><li><b>${settings.sound ? 'ON' : 'OFF'}</b> son</li><li><b>${settings.crt ? 'ON' : 'OFF'}</b> filtre CRT</li><li><b>${settings.rumble ? 'ON' : 'OFF'}</b> vibrations</li></ul>`,
    credits: () => `
      <img class="pv-logo" src="${IMG}logo-23jours.png" alt="">
      <p class="pv-kicker">EXIT GAME</p>
      <h3 class="pv-title">Thanks for playing</h3>`,
  };
  const MODES = {
    'EASY JOLA': ['Balade', 'Les dialogues défilent tranquillement. Idéal pour découvrir l’univers.'],
    'MEDIUM D BLOCK': ['Normal', 'L’expérience telle qu’elle a été pensée.'],
    'HARD GANG': ['Hardcore', 'Pas de raccourci. Tu fais tout le chemin jusqu’à la sortie.'],
    '23 MODE': ['23', 'Couleurs saturées, grain renforcé. Le mode des vrais.'],
  };
  let previewKey = '';
  function showPreview(screen, key) {
    const box = $(`[data-preview="${screen}"]`);
    if (!box || previewKey === screen + key) return;
    previewKey = screen + key;
    let html = '';
    if (screen === 'menu' && PREVIEWS[key]) html = PREVIEWS[key]();
    if (screen === 'difficulty') {
      const m = MODES[key];
      html = m
        ? `<p class="pv-kicker">DIFFICULTÉ</p><h3 class="pv-title">${key}</h3><p class="pv-mode">${m[0]}</p><p class="pv-text">${m[1]}</p>`
        : `<img class="pv-logo" src="${IMG}logo-23jours.png" alt=""><p class="pv-text">Retour au menu principal.</p>`;
    }
    box.classList.remove('is-in');
    void box.offsetWidth;
    box.innerHTML = html;
    box.classList.add('is-in');
  }

  function onFocus(el) {
    if (current === 'menu' && el.dataset.go) showPreview('menu', el.dataset.go);
    if (current === 'difficulty') showPreview('difficulty', el.dataset.mode || 'back');
    if (current === 'menu' && el.dataset.go) $('[data-menu-hint]').textContent = MENU_HINTS[el.dataset.go] || '';
    if (current === 'albums' && el.dataset.album) showAlbum(el.dataset.album);
    if (current === 'players' && el.dataset.player) switchPlayer(+el.dataset.player);
  }

  function rumble() {
    if (!settings.rumble || reduceMotion) return;
    game.classList.remove('rumble');
    void game.offsetWidth;
    game.classList.add('rumble');
    if (navigator.vibrate) navigator.vibrate(30);
  }
  game.addEventListener('animationend', (e) => { if (e.target === game) game.classList.remove('rumble'); });

  /* ---------- screen hooks ---------- */
  const cityFx = city($('#story .city'));
  let camClock = 0;

  function enter(id) {
    if (id === 'story') startStory();
    if (id === 'players') startCamClock();
    const scroller = $('.release-scroll', screenEl(id));
    if (scroller) scroller.scrollTop = 0;
    if (options(id).length) setFocus(focusMemory[id] ?? 0, { sound: false });
  }

  function leave(id) {
    if (id === 'story') { cityFx.stop(); clearInterval(typing); typing = null; }
    if (id === 'players') clearInterval(camClock);
    if (id === 'release') stopClips();
  }

  /* ---------- boot ---------- */
  const bootTimers = [];
  function runBoot() {
    const steps = $$('#boot .boot-step');
    const plan = [[300, 0], [3400, -2], [3900, 1], [7000, -2], [7500, 2], [12600, -2], [13300, -1]];
    plan.forEach(([t, k]) => {
      bootTimers.push(setTimeout(() => {
        steps.forEach((s, i) => s.classList.toggle('is-on', i === k));
        $('#boot').classList.toggle('is-dim', k === 2);
        if (k === -1) go('title', { fx: 'fade', push: false });
      }, t + 200));
    });
  }
  function skipBoot() {
    bootTimers.forEach(clearTimeout);
    go('title', { push: false });
  }

  /* ---------- title ---------- */
  function startGame() {
    sfx.start();
    rumble();
    historyStack.length = 0;
    go('menu', { fx: 'corner', push: false });
  }

  /* ---------- difficulty ---------- */
  function setMode(mode) {
    settings.mode = mode;
    save();
    document.body.dataset.mode = mode;
    $('[data-mode-label]').textContent = mode;
    renderSave();
  }

  /* ---------- story / dialog ---------- */
  const dialog = $('#story .dialog');
  const dialogText = $('#story .dialog-text');
  let line = 0;
  let typing = null;

  function segments(html) {
    // "<em>x</em>" -> [{ t, em }]
    return html.split(/(<em>.*?<\/em>)/).filter(Boolean).map((s) => {
      const m = s.match(/^<em>(.*)<\/em>$/);
      return m ? { t: m[1], em: true } : { t: s, em: false };
    });
  }

  function render(segs, count) {
    let left = count;
    dialogText.textContent = '';
    for (const s of segs) {
      if (left <= 0) break;
      const part = s.t.slice(0, left);
      left -= part.length;
      if (s.em) {
        const em = document.createElement('em');
        em.textContent = part;
        dialogText.appendChild(em);
      } else {
        dialogText.appendChild(document.createTextNode(part));
      }
    }
  }

  function typeLine(i) {
    const segs = segments(STORY[i]);
    const total = segs.reduce((n, s) => n + s.t.length, 0);
    let c = 0;
    dialog.classList.remove('is-wait');
    clearInterval(typing);
    typing = null;
    if (reduceMotion) { render(segs, total); dialog.classList.add('is-wait'); return; }
    typing = setInterval(() => {
      c++;
      render(segs, c);
      if (c % 2 === 0) sfx.type();
      if (c >= total) {
        clearInterval(typing);
        typing = null;
        dialog.classList.add('is-wait');
      }
    }, 32);
  }

  function advanceStory() {
    const scr = screenEl('story');
    if (scr.classList.contains('is-done') || current !== 'story') return;
    if (typing) {
      clearInterval(typing);
      typing = null;
      render(segments(STORY[line]), Infinity);
      dialog.classList.add('is-wait');
      return;
    }
    sfx.move();
    line++;
    if (line < STORY.length) typeLine(line);
    else {
      dialog.classList.remove('is-wait');
      scr.classList.add('is-done');
      setFocus(0, { sound: false });
    }
  }

  function startStory() {
    const scr = screenEl('story');
    scr.classList.remove('is-done');
    $$('.opt', scr).forEach((o) => o.classList.remove('is-focus'));
    focusMemory.story = 0;
    line = 0;
    cityFx.start();
    typeLine(0);
  }
  dialog.addEventListener('click', advanceStory);

  /* ---------- albums ---------- */
  let albumKey = '';
  let swapTimer = 0;
  function showAlbum(key) {
    if (key === albumKey) return;
    albumKey = key;
    const scr = screenEl('albums');
    scr.classList.add('is-swap');
    scr.dataset.tint = key;
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => {
      $('[data-album-title]').textContent = ALBUMS[key].title;
      $('[data-album-desc]').textContent = ALBUMS[key].desc;
      const touch = matchMedia('(hover: none)').matches;
      $('[data-album-action]').textContent = touch ? ALBUMS[key].action.replace('Entrée', 'Touche la pochette') : ALBUMS[key].action;
      scr.classList.remove('is-swap');
    }, 160);
  }

  const toast = $('#albums .toast');
  let toastTimer = 0;
  function showToast(msg, ms = 2200) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), ms);
  }

  let decrypting = false;
  async function pickAlbum(key) {
    if (key !== 'unknown' || decrypting) return;
    decrypting = true;
    sfx.select();
    rumble();
    showToast('SIGNAL TROUVÉ… DÉCRYPTAGE DE « ??? »', 1400);
    screenEl('albums').classList.add('is-decrypt');
    burst(220);
    await wait(1300);
    screenEl('albums').classList.remove('is-decrypt');
    settings.unlocked = true;
    save();
    renderSave();
    await go('release', { fx: 'disc' });
    decrypting = false;
  }

  loopNoise($('.art-unknown canvas'));
  loopNoise($('#players .feed-noise'));

  /* ---------- players (surveillance cams) ---------- */
  let playerIdx = 0;

  function switchPlayer(i) {
    if (i === playerIdx) return;
    playerIdx = i;
    const p = PLAYERS[i];
    sfx.static();
    burst(200);
    $('[data-player-link]').href = p.link;
    const nameEl = $('[data-player-name]');
    nameEl.textContent = p.name;
    nameEl.classList.remove('is-glitch');
    void nameEl.offsetWidth;
    nameEl.classList.add('is-glitch');
    $('[data-player-cam]').textContent = p.cam;
    $('[data-player-track]').textContent = p.track;
    $('[data-cam-meta]').textContent = p.meta;
    $$('#players .cam-tab[data-player]').forEach((t) => t.classList.toggle('is-live', +t.dataset.player === i));
  }
  $$('#players .cam-tab[data-player]').forEach((t) => t.classList.toggle('is-live', +t.dataset.player === 0));

  function startCamClock() {
    const t0 = Date.now() - 23 * 60 * 1000;
    const out = $('[data-cam-clock]');
    const tick = () => {
      const s = Math.floor((Date.now() - t0) / 1000);
      const hh = String(Math.floor(s / 3600)).padStart(2, '0');
      const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      out.textContent = `${hh}:${mm}:${ss}`;
    };
    tick();
    clearInterval(camClock);
    camClock = setInterval(tick, 1000);
  }

  /* ---------- release: stage lists ---------- */
  function fillStages(list, tracks) {
    tracks.forEach(([name, dur, feat], i) => {
      const li = document.createElement('li');
      if (feat) li.className = 'is-feat';
      const num = document.createElement('b');
      num.textContent = String(i + 1).padStart(2, '0');
      const label = document.createElement('span');
      label.textContent = name;
      if (feat) {
        const f = document.createElement('em');
        f.textContent = `feat. ${feat}`;
        label.append(document.createElement('br'), f);
      }
      li.append(num, label);
      if (dur) {
        const d = document.createElement('small');
        d.textContent = dur;
        li.append(d);
      }
      list.appendChild(li);
    });
  }
  fillStages($('[data-stage-list="main"]'), TRACKS);
  fillStages($('[data-stage-list="dlc"]'), DLC);

  /* ---------- release: official clips (click-to-load, no YouTube request before) ---------- */
  const clipsWrap = $('[data-clips]');
  CLIPS.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'opt clip';
    b.dataset.clip = c.id;
    b.setAttribute('aria-label', `Lire le clip ${c.title}`);
    const thumb = document.createElement('span');
    thumb.className = 'clip-frame';
    const img = document.createElement('img');
    img.src = `https://i.ytimg.com/vi/${c.id}/hqdefault.jpg`;
    img.alt = '';
    img.loading = 'lazy';
    const play = document.createElement('span');
    play.className = 'clip-play';
    play.innerHTML = '<svg><use href="#i-play"/></svg>';
    thumb.append(img, play);
    const t = document.createElement('span');
    t.className = 'clip-title';
    t.textContent = c.title;
    const d = document.createElement('small');
    d.textContent = c.date;
    b.append(thumb, t, d);
    clipsWrap.appendChild(b);
  });

  function playClip(btn) {
    stopClips();
    const frame = $('.clip-frame', btn);
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.clip}?autoplay=1&rel=0`;
    iframe.title = $('.clip-title', btn).textContent;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    frame.classList.add('is-playing');
    frame.appendChild(iframe);
  }
  function stopClips() {
    $$('.clip-frame iframe').forEach((f) => { f.parentElement.classList.remove('is-playing'); f.remove(); });
  }

  /* ---------- shop ---------- */
  const shopGrid = $('[data-shop]');
  SHOP.forEach((p) => {
    const a = document.createElement('a');
    a.className = 'opt shop-item';
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener';
    const img = document.createElement('img');
    img.src = p.img;
    img.alt = `${p.name} 23 JOURS PLUS TARD`;
    img.loading = 'lazy';
    const name = document.createElement('span');
    name.className = 'shop-name';
    name.textContent = p.name;
    const price = document.createElement('span');
    price.className = 'shop-price';
    price.textContent = p.price;
    a.append(img, name, price);
    shopGrid.appendChild(a);
  });

  /* ---------- options ---------- */
  function renderOptions() {
    $$('#options .opt-toggle').forEach((b) => {
      $('.val', b).textContent = settings[b.dataset.key] ? 'ON' : 'OFF';
    });
    document.body.classList.toggle('no-crt', !settings.crt);
    setSound(settings.sound);
  }
  function renderSave() {
    const parts = [];
    if (settings.mode) parts.push(settings.mode);
    if (settings.unlocked) parts.push('23 JOURS PLUS TARD DÉBLOQUÉ');
    $('[data-save]').textContent = parts.length ? parts.join(' · ') : 'AUCUNE SAUVEGARDE';
  }
  function toggle(key) {
    settings[key] = !settings[key];
    save();
    renderOptions();
    if (key === 'sound' && settings.sound) sfx.select();
  }

  /* ---------- credits auto-exit ---------- */
  $('#credits .credits-roll').addEventListener('animationend', (e) => {
    if (e.animationName === 'roll' && current === 'credits') { historyStack.length = 0; go('title', { push: false }); }
  });

  /* ---------- input: pointer ---------- */
  game.addEventListener('click', (e) => {
    if (e.detail === 0 && !programmatic) { if (!e.target.closest('a')) e.preventDefault(); return; }
    if (busy) return;
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      if (nav.dataset.nav !== current) { sfx.select(); go(nav.dataset.nav, { fx: 'dip' }); }
      return;
    }
    if (current === 'title') { startGame(); return; }
    if (e.target.closest('.home-btn')) { goHome(); return; }
    const el = e.target.closest('[data-go], [data-action], .album, .cam-tab, .clip, a.opt');
    if (!el || !screenEl(current).contains(el)) return;

    const idx = options().indexOf(el);
    if (idx > -1 && idx !== focusMemory[current]) setFocus(idx, { sound: false });

    if (el.matches('a.opt')) { sfx.select(); return; }
    if (el.dataset.album) { pickAlbum(el.dataset.album); return; }
    if (el.dataset.clip) { sfx.select(); playClip(el); return; }
    if (el.dataset.player) return;

    const action = el.dataset.action;
    if (action === 'skip-boot') return skipBoot();
    if (action === 'back') return back();
    if (action === 'toggle') { sfx.select(); return toggle(el.dataset.key); }
    if (action === 'reset') {
      sfx.back();
      rumble();
      settings.mode = '';
      settings.unlocked = false;
      save();
      delete document.body.dataset.mode;
      $('[data-mode-label]').textContent = 'MEDIUM D BLOCK';
      renderSave();
      return;
    }
    if (action === 'mode') {
      sfx.select();
      rumble();
      setMode(el.dataset.mode);
      go('story', { fx: 'disc' });
      return;
    }
    if (el.dataset.go) {
      sfx.select();
      rumble();
      const target = el.dataset.go;
      go(target, { fx: el.dataset.fx || FX_FOR[target] || 'dip' });
    }
  });

  game.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || busy) return;
    const el = e.target.closest('.opt');
    if (!el) return;
    const idx = options().indexOf(el);
    if (idx > -1 && idx !== focusMemory[current]) setFocus(idx, { scroll: false });
  });

  // keep the highlighted option in sync when someone Tabs through the page
  game.addEventListener('focusin', (e) => {
    const el = e.target.closest('.opt');
    if (!el) return;
    const idx = options().indexOf(el);
    if (idx > -1 && idx !== focusMemory[current]) setFocus(idx, { sound: false });
  });

  /* ---------- input: keyboard ---------- */
  const PREV = ['ArrowUp', 'ArrowLeft'];
  const NEXT = ['ArrowDown', 'ArrowRight'];
  const HOME_KEYS = ['h', 'H', 'Home'];
  const HANDLED = PREV.concat(NEXT, ['Enter', ' ', 'Escape', 'Backspace'], HOME_KEYS);

  function handle(key) {
    if (busy) return;
    if (HOME_KEYS.includes(key) && current !== 'boot' && current !== 'title') { goHome(); return; }
    if (current === 'boot') { skipBoot(); return; }
    if (current === 'title') { startGame(); return; }
    if (current === 'credits') { back(); return; }
    if (key === 'Escape' || key === 'Backspace') { back(); return; }
    if (current === 'story' && !screenEl('story').classList.contains('is-done')) {
      if (key === 'Enter' || key === ' ' || NEXT.includes(key)) advanceStory();
      return;
    }
    if (PREV.includes(key)) move(-1);
    else if (NEXT.includes(key)) move(1);
    else if (key === 'Enter' || key === ' ') activateFocused();
  }

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key === 'Tab') return;
    if (!HANDLED.includes(e.key) && current !== 'boot' && current !== 'title') return;
    e.preventDefault();
    if (e.repeat && !PREV.concat(NEXT).includes(e.key)) return;
    handle(e.key);
  });

  /* ---------- input: gamepad (d-pad, cross = select, circle = back, start) ---------- */
  const padState = {};
  const PAD_MAP = { 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight', 0: 'Enter', 1: 'Escape', 9: 'Enter', 8: 'Home' };
  let polling = false;
  function pollPads() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad) continue;
      for (const [btn, key] of Object.entries(PAD_MAP)) {
        const pressed = !!(pad.buttons[btn] && pad.buttons[btn].pressed);
        const id = pad.index + ':' + btn;
        if (pressed && !padState[id]) handle(key);
        padState[id] = pressed;
      }
    }
    requestAnimationFrame(pollPads);
  }
  window.addEventListener('gamepadconnected', () => { if (!polling) { polling = true; pollPads(); } });

  /* ---------- init ---------- */
  if (settings.mode) setMode(settings.mode);
  renderOptions();
  renderSave();

  const isScreen = (id) => !!id && !!document.getElementById(id) && document.getElementById(id).classList.contains('screen');
  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    historyStack.pop();
    go(isScreen(id) ? id : 'title', { push: false, url: 'none' });
  });

  const start = location.hash.slice(1);
  if (isScreen(start) && !['boot', 'title', 'story'].includes(start)) {
    go(start, { fx: 'fade', push: false, url: 'none' }); // lien partagé : on arrive directement sur l'écran
  } else if (settings.seenBoot) {
    go('title', { fx: 'fade', push: false }); // déjà venu : pas de séquence de démarrage
  } else {
    settings.seenBoot = true;
    save();
    runBoot();
  }
})();
