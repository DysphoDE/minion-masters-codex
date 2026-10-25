/* ===========================================================
   Minion Masters Codex — App
   Hash-Routing, Render-Funktionen, Interaktion. Daten: window.MM (js/data.js)
   =========================================================== */
(() => {
  'use strict';
  const D = window.MM;
  const app = document.getElementById('app');

  // ---------- Helfer ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const store = {
    get(k, d) { try { const v = localStorage.getItem('mmc:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('mmc:' + k, JSON.stringify(v)); } catch { /* privater Modus */ } },
  };

  const CARD = Object.fromEntries(D.cards.map(c => [c.id, c]));
  const MASTER = Object.fromEntries(D.masters.map(m => [m.id, m]));
  const MODE = { '1v1': '1v1 Ranked', rand: '2v2 Randoms', pre: '2v2 Premade', draft: 'Draft' };
  const TYPE = { minion: 'Minion', spell: 'Zauber', building: 'Gebäude' };
  const RARITY = { common: 'Common', rare: 'Rare', supreme: 'Supreme', legendary: 'Legendary' };
  const TIER_ORDER = { S: 0, A: 1, B: 2, C: 3 };
  const FACTIONS = [...new Set(D.cards.map(c => c.faction))].sort();
  // "Crystal Elves" (Karten) und "Crystal Elf" (Fraktion) gelten als gleich
  const sameFaction = (a, b) => norm(a).slice(0, 8) === norm(b).slice(0, 8);
  const factionIcon = name => {
    const f = D.factions.find(f => sameFaction(f.name, name));
    return f ? f.icon : '';
  };

  const cardOf = ref => (typeof ref === 'string' ? CARD[ref] : null);
  const refId = ref => (typeof ref === 'string' ? ref : null);
  const avgMana = refs => {
    const cs = refs.map(cardOf).filter(Boolean);
    return cs.length ? (cs.reduce((a, c) => a + c.mana, 0) / cs.length) : 0;
  };
  const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const pct = n => (n == null ? '–' : fmt1(n) + ' %');
  // Kurzer Fließtext mit Links und Zeilenumbrüchen
  const rich = s => esc(s).replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');
  const deckText = (masterId, refs) =>
    `${MASTER[masterId]?.name || 'Master'}: ${refs.map(r => cardOf(r)?.name || r.name).join(', ')}`;

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 1800);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('In die Zwischenablage kopiert'); }
    catch { prompt('Zum Kopieren:', text); }
  }

  // ---------- Icons (24er-Raster, Strich) ----------
  const ICONS = {
    cards: '<rect x="3" y="7" width="12" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/>',
    hand: '<rect x="3.5" y="5" width="9" height="13" rx="1.5" transform="rotate(-12 8 11)"/><rect x="11.5" y="5" width="9" height="13" rx="1.5" transform="rotate(10 16 11)"/>',
    mana: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    bridge: '<path d="M2 18h20M4 18v-3a8 8 0 0 1 16 0v3M8 18v-4M12 18v-5M16 18v-4"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 1 1.5 2 2 2 2s-1-4 1-7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    swords: '<path d="M4 4l10 10M20 4L10 14M13 15l3 3M11 15l-3 3M17 21l4-4M7 21l-4-4"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M15 9.2h-4a1.8 1.8 0 0 0 0 3.6h2a1.8 1.8 0 0 1 0 3.6H9"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M12 21 8 9l4-6 4 6z"/>',
    shard: '<path d="M12 2l5 7-5 13-5-13z"/><path d="M7 9h10"/>',
    token: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 7l4.5 2.5v5L12 17l-4.5-2.5v-5z"/>',
    ticket: '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/><path d="M14 7v2M14 11v2M14 15v2"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3.5 8 4.5 9 8 12 8zM12 8s1.5-4.5 4-3.5S15 8 12 8z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17.5 14c2.6.2 4.5 2 4.5 5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',
    book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    trophy: '<path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    heart: '<path d="M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11z"/>',
    snow: '<path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10M9 3.5l3 2 3-2M9 20.5l3-2 3 2"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down: '<path d="M12 5v14M5 12l7 7 7-7"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17h.01"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    sparkles: '<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2"/><circle cx="16" cy="16" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="16" cy="8" r="1.2"/><circle cx="8" cy="16" r="1.2"/>',
    robot: '<rect x="5" y="8" width="14" height="11" rx="2"/><path d="M12 4v4M9 13h.01M15 13h.01M9 16h6M3 12v3M21 12v3"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    hourglass: '<path d="M6 3h12M6 21h12M7 3v3a5 5 0 0 0 10 0V3M7 21v-3a5 5 0 0 1 10 0v3"/>',
    tower: '<path d="M6 21V10L4 8V3h3v2h2.5V3h5v2H17V3h3v5l-2 2v11z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>',
  };
  const icon = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;

  // ---------- Fließtext-Aufbereitung ----------
  // Kartennamen und Master im Text werden zu klickbaren Links (eine Regex, längste Namen zuerst)
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const linkTargets = [
    ...D.cards.filter(c => c.name.length >= 4).map(c => ({ key: esc(c.name), html: `<span class="clink r-${c.rarity}" data-card="${c.id}">${esc(c.name)}</span>` })),
    // Kurzformen wie "A'Zog" oder "Korrrgoth" für Karten mit Beinamen
    ...D.cards.filter(c => c.name.includes(',')).map(c => ({ key: esc(c.name.split(',')[0]), html: `<span class="clink r-${c.rarity}" data-card="${c.id}">${esc(c.name.split(',')[0])}</span>` })),
    ...D.masters.map(m => ({ key: esc(m.name), html: `<a class="mlink" href="#master/${m.id}"><img src="${m.icon}" alt="">${esc(m.name)}</a>` })),
  ].sort((a, b) => b.key.length - a.key.length);
  const linkMap = new Map(linkTargets.map(t => [t.key, t.html]));
  const linkRe = new RegExp(`(?<![A-Za-zÄÖÜäöüß'])(${linkTargets.map(t => reEsc(t.key)).join('|')})(?![A-Za-zÄÖÜäöüß])`, 'g');
  const linkify = s => esc(s)
    .replace(linkRe, m => linkMap.get(m) || m)
    .replace(/(\d+(?:[.,]\d+)?\s?%)/g, '<b class="num">$1</b>')
    .replace(/(https?:\/\/[^\s)<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  // Text in Sätze zerlegen (Abkürzungen wie "z. B." oder "ca." bleiben heil)
  const sentences = s => String(s || '')
    .split(/(?<=[.!?])(?<!\b(?:ca|bzw|z\. ?B|u\. ?a|d\. ?h|v\. ?a|inkl|ggf|evtl|Nr|vs|Okt|Dez|Jan|Feb|Aug|Sept|Nov|max|min|etc|[A-Z])\.)\s+(?=[A-ZÄÖÜ0-9„"'(])/)
    .map(x => x.trim()).filter(Boolean);
  const bulletList = (s, cls = '') => `<ul class="bullets ${cls}">${sentences(s).map(x => `<li>${linkify(x)}</li>`).join('')}</ul>`;
  // "Früh: … Mitte: … Spät: …" in Phasen zerlegen
  function phases(s) {
    const re = /(Früh|Mitte|Spät)(?:\s*\([^)]*\))?:\s*/g;
    const parts = []; let m, last = null;
    while ((m = re.exec(s))) { if (last) last.text = s.slice(last.end, m.index).trim(); last = { label: m[1], end: re.lastIndex }; parts.push(last); }
    if (last) last.text = s.slice(last.end).trim();
    return parts.length >= 2 ? parts : null;
  }

  // ---------- Bausteine ----------
  const tierBadge = t => (t ? `<span class="tier tier-${esc(t)}" title="Tier ${esc(t)}">${esc(t)}</span>` : '');
  const manaGem = m => `<span class="mana">${esc(m)}</span>`;
  const factionTag = f => {
    const ic = factionIcon(f);
    return `<span class="tag">${ic ? `<img src="${ic}" alt="">` : ''}${esc(f)}</span>`;
  };

  function mini(ref) {
    const c = cardOf(ref);
    if (!c) {
      if (ref && ref.group) return ref.group.map(mini).join('');
      return `<div class="mini unknown" title="${esc(ref?.name)}">${esc(ref?.name)}</div>`;
    }
    return `<div class="mini r-${c.rarity}" data-card="${c.id}" title="${esc(c.name)} · ${c.mana} Mana">
      ${c.img ? `<img loading="lazy" src="${c.img}" alt="">` : ''}${manaGem(c.mana)}<span class="mlabel">${esc(c.name)}</span></div>`;
  }

  function tile(c, extra = '') {
    return `<div class="ccard r-${c.rarity} ${extra}" data-card="${c.id}" tabindex="0" role="button" aria-label="${esc(c.name)}">
      ${manaGem(c.mana)}${tierBadge(c.tier)}
      <div class="art">${c.img ? `<img loading="lazy" src="${c.img}" alt="">` : ''}</div>
      <div class="cname">${esc(c.name)}<small>${TYPE[c.type] || c.type} · ${esc(c.faction)}</small></div>
    </div>`;
  }

  function curve(refs) {
    const buckets = [0, 0, 0, 0, 0, 0, 0, 0]; // 0-1,2,3,4,5,6,7,8+
    refs.map(cardOf).filter(Boolean).forEach(c => { buckets[Math.min(Math.max(c.mana, 1), 8) - 1]++; });
    const max = Math.max(...buckets, 1);
    const labels = ['≤1', '2', '3', '4', '5', '6', '7', '8+'];
    return `<div class="curve-wrap"><div class="curve">${buckets.map((b, i) =>
      `<div style="height:${(b / max) * 100}%">${b ? `<b>${b}</b>` : ''}<span>${labels[i]}</span></div>`).join('')}</div></div>`;
  }

  function masterAvatar(id) {
    const m = MASTER[id];
    return `<a class="deck-master" href="#master/${id}" title="${esc(m?.name || '')}">${m ? `<img src="${m.icon}" alt="">` : ''}</a>`;
  }

  function deckPanel(d) {
    const avg = d.avg || avgMana(d.cards);
    return `<article class="panel deck" id="deck-${d.id}">
      <div class="deck-head">
        ${masterAvatar(d.master)}
        <div class="deck-title">
          <h3>${esc(d.name)}</h3>
          <div class="deck-meta">
            <span class="tag gold">${esc(MASTER[d.master]?.name || d.masterName)}</span>
            <span class="tag tag-mana">Ø ${fmt1(avg)} Mana</span>
            <span class="tag">${esc(d.modeName.split('(')[0].trim())}</span>
          </div>
        </div>
      </div>
      <div class="mini-row">${d.cards.map(mini).join('')}</div>
      ${curve(d.cards)}
      ${d.playstyle ? `<p class="deck-style">${icon('sparkles')}<span>${linkify(d.playstyle)}</span></p>` : ''}
      <div class="dtabs" role="tablist">
        <button class="on" data-dtab="plan">${icon('route')} Spielplan</button>
        ${d.combos?.length ? `<button data-dtab="combos">${icon('bolt')} Kombos</button>` : ''}
        <button data-dtab="tips">${icon('info')} Tipps &amp; Schwächen</button>
      </div>
      <div class="dpane" data-pane="plan">${(() => {
        const ph = phases(d.gameplan || '');
        return ph ? `<div class="phases">${ph.map(p => `<div class="phase phase-${norm(p.label)}"><span class="phase-label">${p.label}</span><p>${linkify(p.text)}</p></div>`).join('')}</div>`
          : bulletList(d.gameplan, 'small');
      })()}</div>
      ${d.combos?.length ? `<div class="dpane" data-pane="combos" hidden><ul class="tip-cards">${d.combos.map(c => `<li>${icon('bolt')}<span>${linkify(c)}</span></li>`).join('')}</ul></div>` : ''}
      <div class="dpane" data-pane="tips" hidden>
        ${d.tips ? `<div class="callout info">${icon('info')}<div>${linkify(d.tips)}</div></div>` : ''}
        ${d.weak ? `<div class="callout warn">${icon('alert')}<div><b>Schwach gegen:</b> ${linkify(d.weak)}</div></div>` : ''}
      </div>
      ${d.source ? `<p class="deck-src">Quelle: ${(() => { const u = (d.source.match(/https?:\/\/[^\s)]+/) || [])[0]; const label = esc(d.source.split('(')[0].split(':')[0].trim()); return u ? `<a href="${u}" target="_blank" rel="noopener">${label}</a>` : label; })()}</p>` : ''}
      <div class="deck-actions">
        <button class="btn btn-sm" data-copy-deck="${esc(deckText(d.master, d.cards))}">Deckliste kopieren</button>
        <button class="btn btn-sm" data-to-builder='${esc(JSON.stringify({ m: d.master, c: d.cards.map(refId).filter(Boolean) }))}'>Im Deckbuilder öffnen</button>
      </div>
    </article>`;
  }

  function lbRow(d) {
    const avg = avgMana(d.cards);
    return `<article class="panel deck">
      <div class="deck-head">
        ${masterAvatar(d.master)}
        <div class="deck-title">
          <h3>#${d.rank} · ${esc(MASTER[d.master]?.name || '?')}</h3>
          <div class="deck-meta"><span class="tag">${MODE[d.mode]}</span><span class="tag tag-mana">Ø ${fmt1(avg)} Mana</span></div>
        </div>
      </div>
      <div class="mini-row">${d.cards.map(mini).join('')}</div>
      <div class="deck-actions">
        <button class="btn btn-sm" data-copy-deck="${esc(deckText(d.master, d.cards))}">Kopieren</button>
        <button class="btn btn-sm" data-to-builder='${esc(JSON.stringify({ m: d.master, c: d.cards.map(refId).filter(Boolean) }))}'>Im Deckbuilder öffnen</button>
      </div>
    </article>`;
  }

  const pageHero = (eyebrow, title, lead, img) => `
    <section class="page-hero" ${img ? `style="--hero-img:url('${new URL(img, location.href).href}')"` : ''}><div class="wrap">
      <span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}
    </div></section>`;

  const chipGroup = (name, options, active, multi = false) =>
    `<div class="chips" data-chips="${name}" ${multi ? 'data-multi' : ''}>${options.map(([v, label]) =>
      `<button class="chip ${(multi ? active.includes(v) : active === v) ? 'on' : ''}" data-v="${esc(v)}">${label}</button>`).join('')}</div>`;

  // Chip-Gruppen: Klick toggelt und ruft onChange(name, value-oder-array)
  function bindChips(root, state, onChange) {
    $$('[data-chips]', root).forEach(g => {
      g.addEventListener('click', e => {
        const b = e.target.closest('.chip'); if (!b) return;
        const name = g.dataset.chips, v = b.dataset.v;
        if (g.hasAttribute('data-multi')) {
          const arr = state[name];
          const i = arr.indexOf(v);
          i >= 0 ? arr.splice(i, 1) : arr.push(v);
          b.classList.toggle('on');
        } else {
          state[name] = state[name] === v && g.hasAttribute('data-toggle') ? '' : v;
          $$('.chip', g).forEach(x => x.classList.toggle('on', x.dataset.v === state[name]));
        }
        onChange(name);
      });
    });
  }

  // Wie viele Decks spielen eine Karte?
  const deckUsage = {};
  [...D.decks, ...D.lbDecks].forEach(d => d.cards.forEach(r => { if (typeof r === 'string') deckUsage[r] = (deckUsage[r] || 0) + 1; }));

  // =========================================================
  //  SEITEN
  // =========================================================
  const pages = {};

  // ---------- Start ----------
  pages.home = () => {
    const ms = D.masterStats;
    const best1 = Object.entries(ms).filter(([, s]) => s.n1v1 > 1000).sort((a, b) => b[1].wr1v1 - a[1].wr1v1).slice(0, 5);
    const best2 = Object.entries(ms).filter(([, s]) => s.n2v2 > 1000).sort((a, b) => b[1].wr2v2 - a[1].wr2v2).slice(0, 5);
    const sTier = D.cards.filter(c => c.tier === 'S');
    const shots = ['ss1', 'ss2', 'ss3', 'ss4', 'ss5', 'ss6', 'ss7', 'ss8'];
    const feat = (route, title, text, img) => `<a class="panel hover feature" href="#${route}" style="--fimg:url('${new URL(`img/site/${img}.jpg`, location.href).href}')"><h3>${title}</h3><p>${text}</p></a>`;
    return `
    <section class="hero"><div class="hero-bg"></div><div class="wrap"><div class="hero-content">
      <img class="hero-logo" src="img/site/logo.png" alt="Minion Masters">
      <span class="eyebrow">Persönlicher Guide · Stand Patch ${esc((D.patch || '').split(' ')[0])}</span>
      <h1>Alles, was du für die Arena brauchst</h1>
      <p>Aktuelle Meta-Decks aus den Ranglisten, Builds für alle 14 Master, Datenbank mit allen ${D.cards.length} Karten, Tierlist, Kombos, Counter und ein eigener Deckbuilder.</p>
      <div class="hero-cta">
        <a class="btn btn-gold" href="#meta">Meta-Decks ansehen</a>
        <a class="btn" href="#masters">Master-Builds</a>
        <a class="btn" href="#builder">Deckbuilder</a>
      </div>
    </div></div></section>
    <div class="wrap">
      <div class="stats-row">
        <div class="stat"><b>${D.cards.length}</b><span>Karten</span></div>
        <div class="stat"><b>${D.masters.length}</b><span>Master</span></div>
        <div class="stat"><b>${D.decks.length + D.lbDecks.length}</b><span>Decks</span></div>
        <div class="stat"><b>${D.combos.length}</b><span>Kombos</span></div>
        <div class="stat"><b>${esc((D.patch || '').split(' ')[0])}</b><span>Aktueller Patch</span></div>
      </div>

      <section class="section">
        <div class="section-head"><div><span class="eyebrow">Meta auf einen Blick</span><h2>Was gerade gespielt wird</h2></div>
        <a class="btn btn-sm" href="#meta">Zur Meta-Analyse →</a></div>
        <p class="lead">${esc(D.metaSummary.split(/(?<!\bca|\bz\.B|\bbzw|\bu\.a)\.\s+(?=[A-ZÄÖÜ0-9])/).slice(0, 3).join('. '))}.</p>
        <div class="tabs" id="homeModeTabs">${Object.entries(MODE).map(([k, v], i) => `<button class="tab ${i ? '' : 'on'}" data-mode="${k}">${v}</button>`).join('')}</div>
        <div id="homeTop"></div>
        <p class="small dim">Anteil der Leaderboard-Decks, die die Karte spielen (Auswertung BadAsAFish80, Patch 2.33).</p>
      </section>

      <section class="section">
        <div class="grid grid-2">
          <div class="panel"><h3>Stärkste Master · 1v1</h3>${best1.map(([id, s]) => winBar(id, s.wr1v1, s.n1v1)).join('')}</div>
          <div class="panel"><h3>Stärkste Master · 2v2 Randoms</h3>${best2.map(([id, s]) => winBar(id, s.wr2v2, s.n2v2)).join('')}</div>
        </div>
        <p class="small dim" style="margin-top:8px">Winrates aus öffentlichen Match-Statistiken, Stand ${esc(Object.values(ms)[0]?.date || '')}, also vor Patch 2.34.</p>
      </section>

      <section class="section">
        <div class="section-head"><div><span class="eyebrow">S-Tier</span><h2>Die Karten, die du kennen musst</h2></div><a class="btn btn-sm" href="#tiers">Ganze Tierlist →</a></div>
        <div class="card-grid">${sTier.map(c => tile(c)).join('')}</div>
      </section>

      <section class="section">
        <div class="section-head"><div><span class="eyebrow">Bereiche</span><h2>Wohin willst du?</h2></div></div>
        <div class="home-feature">
          ${feat('meta', 'Meta &amp; Decks', 'Kuratierte Decks mit Spielplan und über 200 Leaderboard-Decks für alle Modi.', shots[0])}
          ${feat('masters', 'Master-Builds', 'Perks, Alternativ-Perks, Winrates und die besten Decks pro Master.', shots[1])}
          ${feat('cards', 'Karten-Datenbank', 'Alle Karten durchsuchen und filtern, mit Spielraten pro Modus.', shots[2])}
          ${feat('combos', 'Kombos &amp; Counter', 'Starke Synergien und was gegen die nervigsten Karten hilft.', shots[3])}
          ${feat('builder', 'Deckbuilder', 'Eigene Decks bauen, analysieren, speichern und kopieren.', shots[4])}
          ${feat('basics', 'Grundlagen', 'Mana, XP, Brücken, Perks und das komplette Stichwort-Glossar.', shots[5])}
          ${feat('tips', 'Modi &amp; Tipps', 'Regeln und Strategie für jeden Modus, dazu Einsteiger- und Profi-Tipps.', shots[6])}
          ${feat('lore', 'Lore &amp; Links', 'Hintergrund, Zeitleiste, Galerie und nützliche Links.', shots[7])}
        </div>
      </section>
    </div>`;
  };
  function winBar(id, wr, n) {
    const m = MASTER[id];
    const w = Math.max(0, Math.min(100, (wr - 40) / 20 * 100)); // 40–60 % auf volle Breite
    return `<a href="#master/${id}" style="display:flex;align-items:center;gap:12px;margin:10px 0;color:inherit;text-decoration:none">
      <img src="${m.icon}" alt="" style="width:38px;height:38px;border-radius:9px;object-fit:cover">
      <div style="flex:1"><div style="display:flex;justify-content:space-between;font-size:14px"><b>${esc(m.name)}</b><span class="${wr >= 50 ? 'good' : 'warn'}">${pct(wr)}</span></div>
      <div class="bar"><i style="width:${w}%"></i></div><small class="dim">${n.toLocaleString('de-DE')} Matches</small></div></a>`;
  }
  pages.home.after = () => {
    const show = mode => {
      const top = Object.entries(D.cardRates).filter(([, r]) => r[mode]).sort((a, b) => b[1][mode] - a[1][mode]).slice(0, 12);
      $('#homeTop').innerHTML = `<div class="card-grid">${top.map(([id, r]) => {
        const c = CARD[id];
        return tile(c).replace('<div class="cname">', `<div class="cname"><span class="good" style="font-size:12px">${pct(r[mode])} der Decks</span>`);
      }).join('')}</div>`;
    };
    show('1v1');
    $('#homeModeTabs').addEventListener('click', e => {
      const b = e.target.closest('.tab'); if (!b) return;
      $$('.tab', b.parentNode).forEach(t => t.classList.toggle('on', t === b));
      show(b.dataset.mode);
    });
  };

  // ---------- Meta & Decks ----------
  const C = window.MMC;
  const metaState = { tab: 'curated', mode: '', lbMode: '1v1', lbMaster: '', lbCard: '', lbLimit: 24 };
  const DECKS_PER_MODE = { '1v1': 8500, rand: 8500, pre: 8500, draft: 6460 };
  const RATE_KEY = { 'ranked-1v1': '1v1', 'ranked-2v2-randoms': 'rand', 'ranked-2v2-premade': 'pre', draft: 'draft' };
  const sectionHead = (eyebrow, title, extra = '') => `<div class="section-head"><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div>${extra}</div>`;
  const findCard = name => CARD[D.cards.find(c => norm(c.name) === norm(name))?.id] || D.cards.find(c => norm(c.name).startsWith(norm(name)));
  const topCardsFor = (k, n) => Object.entries(D.cardRates).filter(([, r]) => r[k]).sort((a, b) => b[1][k] - a[1][k]).slice(0, n);
  const topMastersFor = (k, n) => Object.entries(D.masterPick).sort((a, b) => (b[1][k] || 0) - (a[1][k] || 0)).slice(0, n);
  // Karten und Master, die in einem Text genannt werden (Reihenfolge des Auftretens)
  function mentioned(text) {
    const found = [];
    const t = esc(text);
    for (const m of t.matchAll(linkRe)) {
      const html = linkMap.get(m[1]) || '';
      const id = (html.match(/data-card="([^"]+)"/) || [])[1];
      const mid = (html.match(/#master\/([^"]+)"/) || [])[1];
      const key = id ? 'c:' + id : 'm:' + mid;
      if ((id || mid) && !found.some(f => f.key === key)) found.push({ key, card: id, master: mid });
    }
    return { cards: found.filter(f => f.card).map(f => f.card), masters: found.filter(f => f.master).map(f => f.master) };
  }
  function metaSegments() {
    const markers = [['1v1:', '1v1 Ranked'], ['2v2 Randoms:', '2v2 Randoms'], ['2v2 Premades:', '2v2 Premade'], ['Draft:', 'Draft'], ['Patch 2.34', 'Patch 2.34']];
    const txt = D.metaSummary;
    const pos = markers.map(([m, l]) => [txt.indexOf(m), m, l]).filter(x => x[0] >= 0).sort((a, b) => a[0] - b[0]);
    if (!pos.length) return { intro: txt, parts: [] };
    const parts = pos.map(([p, m, l], i) => ({ label: l, text: txt.slice(p + (m.endsWith(':') ? m.length : 0), i + 1 < pos.length ? pos[i + 1][0] : txt.length).trim() }));
    return { intro: txt.slice(0, pos[0][0]).trim(), parts };
  }
  function modeCard(k) {
    const mc = C.modeCards[k];
    const total = DECKS_PER_MODE[k];
    const modeId = Object.keys(RATE_KEY).find(id => RATE_KEY[id] === k);
    return `<article class="mode-card">
      <div class="mode-card-head">
        <span class="ico-badge">${icon(mc.icon)}</span>
        <div><h3>${MODE[k]}</h3><span class="dim small">${total.toLocaleString('de-DE')} Top-Decks ausgewertet</span></div>
        <div class="big-num"><b>${fmt1(mc.avg)}</b><small>Ø Mana</small></div>
      </div>
      <p class="mode-blurb">${linkify(mc.blurb)}</p>
      <div class="mode-row"><span class="mini-label">Top-Master</span>
        <div class="avatar-row">${topMastersFor(k, 3).map(([id, p]) => `<a class="avatar" href="#master/${id}" title="${esc(MASTER[id].name)}"><img src="${MASTER[id].icon}" alt=""><span>${Math.round((p[k] || 0) / total * 100)} %</span></a>`).join('')}</div>
      </div>
      <div class="mode-row"><span class="mini-label">Meistgespielt</span>
        <div class="mini-strip">${topCardsFor(k, 5).map(([id, r]) => `<div class="strip-item">${mini(id)}<span>${Math.round(r[k])} %</span></div>`).join('')}</div>
      </div>
      ${modeId && D.decks.some(d => d.mode === modeId) ? `<button class="btn btn-sm" data-goto-decks="${modeId}">${icon('cards')} Decks für ${MODE[k]}</button>` : ''}
    </article>`;
  }
  function patchBox() {
    const P = C.patch;
    const row = ([name, change], dir) => {
      const c = findCard(name);
      return `<li class="patch-item ${dir}" ${c ? `data-card="${c.id}"` : ''}>
        ${c ? `<img src="${c.img}" alt="" loading="lazy">` : `<span class="patch-noimg">${icon('cards')}</span>`}
        <div><b>${esc(c?.name.split(',')[0] || name)}</b><span>${esc(change)}</span></div>
        <span class="patch-dir">${icon(dir === 'nerf' ? 'down' : 'up')}</span></li>`;
    };
    return `<div class="patch-box">
      <div class="patch-head">
        <span class="patch-ver">Patch ${P.version}</span>
        <div><h3>„${P.title}“ · ${P.date}</h3><p class="muted small" style="margin:0">Kam direkt nach der Datenerhebung für die Decks. Die 1v1-Meta dürfte sich leicht verschieben.</p></div>
      </div>
      <div class="patch-cols">
        <div><h4 class="patch-title nerf">${icon('down')} Abgeschwächt</h4><ul class="patch-list">${P.nerfs.map(n => row(n, 'nerf')).join('')}</ul></div>
        <div><h4 class="patch-title buff">${icon('up')} Verstärkt</h4><ul class="patch-list">${P.buffs.map(b => row(b, 'buff')).join('')}</ul>
          <p class="small muted" style="margin:10px 0 0">${linkify(P.masterBuff)}</p></div>
      </div>
      <div class="patch-limits">${icon('lock')}<span>Neu auf 1 Kopie limitiert:</span>${P.limits.map(n => { const c = findCard(n); return c ? `<span class="clink r-${c.rarity}" data-card="${c.id}">${esc(c.name)}</span>` : esc(n); }).join('')}</div>
    </div>`;
  }
  function archetypeCard(a) {
    const m = mentioned(a.description);
    const banner = CARD[m.cards[0]];
    return `<article class="arch">
      <div class="arch-banner">${banner ? `<img src="${banner.img}" alt="" loading="lazy">` : ''}<h3>${esc(a.name)}</h3></div>
      <div class="arch-body">
        ${m.masters.length ? `<div class="avatar-row small">${m.masters.map(id => `<a class="avatar" href="#master/${id}" title="${esc(MASTER[id].name)}"><img src="${MASTER[id].icon}" alt=""></a>`).join('')}</div>` : ''}
        ${m.cards.length ? `<div class="mini-strip">${m.cards.slice(0, 5).map(id => mini(id)).join('')}</div>` : ''}
        <p class="small muted">${linkify(a.description)}</p>
        <div class="vs">
          <div class="vs-good">${icon('up')}<div><b>Stark gegen</b><span>${linkify(a.strong_against)}</span></div></div>
          <div class="vs-bad">${icon('down')}<div><b>Schwach gegen</b><span>${linkify(a.weak_against)}</span></div></div>
        </div>
      </div>
    </article>`;
  }
  pages.meta = () => {
    const modesWithDecks = D.modes.filter(m => m.deckCount);
    if (!metaState.mode) metaState.mode = modesWithDecks[0]?.id;
    const seg = metaSegments();
    return `
    ${pageHero('Meta-Analyse · Patch ' + esc((D.patch || '').split(' ')[0]), 'Meta &amp; Decks', 'Was in den Ranglisten wirklich gespielt wird: Modi im Vergleich, Archetypen, kuratierte Decks mit Spielplan und über 200 echte Leaderboard-Decks.', 'img/site/ss2.jpg')}
    <div class="wrap">
      <nav class="jump">
        <a href="#meta" data-jump="m-modes">${icon('layers')} Modi</a><a href="#meta" data-jump="m-patch">${icon('bolt')} Patch 2.34</a>
        <a href="#meta" data-jump="m-arch">${icon('sparkles')} Archetypen</a><a href="#meta" data-jump="m-decks">${icon('cards')} Decks</a>
      </nav>
      <section class="section" id="m-modes">
        ${sectionHead('Die Meta in vier Modi', 'Was gerade gewinnt')}
        <div class="mode-grid">${Object.keys(C.modeCards).map(modeCard).join('')}</div>
        <details class="more" style="margin-top:16px"><summary>Ausführliche Meta-Analyse lesen</summary><div>
          <p class="muted">${linkify(seg.intro)}</p>
          <div class="grid grid-2">${seg.parts.map(p => `<div class="panel"><span class="eyebrow">${esc(p.label)}</span>${bulletList(p.text, 'small')}</div>`).join('')}</div>
          <p class="small dim" style="margin-top:10px">${esc(D.patch)}</p>
        </div></details>
      </section>
      <section class="section" id="m-patch">${patchBox()}</section>
      <section class="section" id="m-arch">
        ${sectionHead('Archetypen', 'Die Deck-Typen der Meta')}
        <div class="arch-grid">${D.archetypes.map(archetypeCard).join('')}</div>
      </section>
      <section class="section" id="m-decks">
        ${sectionHead('Decks', 'Fertige Listen zum Nachbauen')}
        <div class="tabs" id="metaTabs">
          <button class="tab" data-tab="curated">${icon('star')} Kuratierte Decks (${D.decks.length})</button>
          <button class="tab" data-tab="lb">${icon('trophy')} Leaderboard-Decks (${D.lbDecks.length})</button>
          <button class="tab" data-tab="patches">${icon('calendar')} Patch-Historie</button>
        </div>
        <div id="metaBody"></div>
      </section>
    </div>`;
  };
  pages.meta.after = () => {
    const body = $('#metaBody');
    const render = () => {
      $$('#metaTabs .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === metaState.tab));
      if (metaState.tab === 'curated') {
        const modes = D.modes.filter(m => m.deckCount);
        const decks = D.decks.filter(d => d.mode === metaState.mode);
        body.innerHTML = `
          ${chipGroup('mode', modes.map(m => [m.id, esc(m.name.split('(')[0].trim()) + ` (${m.deckCount})`]), metaState.mode)}
          <div class="grid grid-2" style="margin-top:18px">${decks.map(deckPanel).join('')}</div>`;
        bindChips(body, metaState, render);
      } else if (metaState.tab === 'lb') {
        const masters = [...new Set(D.lbDecks.map(d => d.master).filter(Boolean))].sort();
        const q = norm(metaState.lbCard);
        let list = D.lbDecks.filter(d => d.mode === metaState.lbMode && (!metaState.lbMaster || d.master === metaState.lbMaster));
        if (q) list = list.filter(d => d.cards.some(r => norm(cardOf(r)?.name || r.name).includes(q)));
        const shown = list.slice(0, metaState.lbLimit);
        body.innerHTML = `
          <div class="callout info">${icon('info')}<div><b>Echte Decks aus den Ranglisten.</b> Die Top-Decks der Leaderboards für Patch 2.33 aus der Meta-Auswertung von BadAsAFish80, sortiert nach Platzierung. Draft-Decks stammen aus dem Leaderboard-Import vom 21.09.2026.</div></div>
          <div class="toolbar-row" style="margin:16px 0 12px">${chipGroup('lbMode', Object.entries(MODE), metaState.lbMode)}</div>
          <div class="toolbar-row" style="margin-bottom:18px">
            <select class="input" id="lbMaster"><option value="">Alle Master</option>${masters.map(m => `<option value="${m}" ${m === metaState.lbMaster ? 'selected' : ''}>${esc(MASTER[m].name)}</option>`).join('')}</select>
            <input class="input search" id="lbCard" placeholder="Deck enthält Karte …" value="${esc(metaState.lbCard)}">
            <span class="count-label">${list.length} Decks</span>
          </div>
          <div class="grid grid-2">${shown.map(lbRow).join('') || '<p class="empty">Keine Decks für diese Filter.</p>'}</div>
          ${list.length > shown.length ? `<p style="text-align:center;margin-top:18px"><button class="btn" id="lbMore">Mehr anzeigen (${list.length - shown.length} weitere)</button></p>` : ''}`;
        bindChips(body, metaState, () => { metaState.lbLimit = 24; render(); });
        $('#lbMaster').onchange = e => { metaState.lbMaster = e.target.value; metaState.lbLimit = 24; render(); };
        const inp = $('#lbCard');
        inp.oninput = () => { metaState.lbCard = inp.value; clearTimeout(inp._t); inp._t = setTimeout(() => { render(); const n = $('#lbCard'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); };
        const more = $('#lbMore'); if (more) more.onclick = () => { metaState.lbLimit += 24; render(); };
      } else {
        const ph = [...D.patchHistory].sort((a, b) => String(b.date).localeCompare(String(a.date)));
        body.innerHTML = `<div class="patch-history">${ph.map(p => {
          const ver = (p.title.match(/^\d+\.\d+/) || [''])[0];
          return `<article class="ph-item"><div class="ph-ver ${ver ? '' : 'news'}">${ver ? esc(ver) : icon('info')}</div>
            <div><span class="dim small">${esc(p.date)}</span><h4>${esc(ver ? p.title.replace(ver, '').replace(/[()]/g, '').trim() || 'Balance-Patch' : p.title)}</h4>
            <p class="small muted">${linkify(p.summary)}</p></div></article>`;
        }).join('')}</div>`;
      }
    };
    $('#metaTabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) { metaState.tab = b.dataset.tab; render(); } });
    app.querySelector('.page').addEventListener('click', e => {
      const j = e.target.closest('[data-jump]');
      if (j) { e.preventDefault(); document.getElementById(j.dataset.jump)?.scrollIntoView({ behavior: 'smooth' }); }
      const g = e.target.closest('[data-goto-decks]');
      if (g) { metaState.tab = 'curated'; metaState.mode = g.dataset.gotoDecks; render(); document.getElementById('m-decks').scrollIntoView({ behavior: 'smooth' }); }
    });
    render();
  };

  // ---------- Master ----------
  const tierOfMaster = m => (m.tier.match(/^([SABC])/) || [])[1] || '';
  pages.masters = () => {
    const ms = D.masterStats, mp = D.masterPick;
    const rows = D.masters.map(m => ({ m, s: ms[m.id] || {}, p: mp[m.id] || {} }));
    return `
    ${pageHero('Helden', 'Die 14 Master', 'Jeder Master hat einen Grundangriff und drei Perk-Stufen. Hier findest du Perks, Alternativ-Perks, Build-Empfehlungen, Winrates und die besten Decks.', 'img/site/ss5.jpg')}
    <div class="wrap">
      <section class="section">
        <div class="master-grid">${D.masters.map(m => `
          <a class="mcard" href="#master/${m.id}">
            <img src="${m.icon}" alt="" loading="lazy">
            ${tierBadge(tierOfMaster(m))}
            <div class="minfo"><h3>${esc(m.name)}</h3><div class="mtitle">${esc(m.title.split('(')[0])}</div><div class="mrole">${esc(m.role)}</div></div>
          </a>`).join('')}</div>
      </section>
      <section class="section">
        <div class="section-head"><div><span class="eyebrow">Statistik</span><h2>Winrates &amp; Beliebtheit</h2></div>
        <p class="small">Winrate aus öffentlichen Match-Daten (Stand ${esc(Object.values(ms)[0]?.date || '')}). Picks = Anzahl Leaderboard-Decks mit diesem Master (Patch 2.33). Zum Sortieren auf eine Spalte klicken.</p></div>
        <div class="panel" style="overflow-x:auto;padding:0">
          <table class="stat-table" id="masterTable">
            <thead><tr>
              <th data-sort="name">Master</th><th data-sort="wr1v1">WR 1v1</th><th data-sort="wr2v2">WR 2v2</th><th data-sort="wrPre">WR Premade</th>
              <th data-sort="p1v1">Picks 1v1</th><th data-sort="prand">Picks Randoms</th><th data-sort="ppre">Picks Premade</th><th data-sort="pdraft">Picks Draft</th>
            </tr></thead>
            <tbody>${rows.map(({ m, s, p }) => `<tr data-name="${esc(m.name)}" data-wr1v1="${s.wr1v1 || 0}" data-wr2v2="${s.wr2v2 || 0}" data-wrpre="${s.wrPre || 0}" data-p1v1="${p['1v1'] || 0}" data-prand="${p.rand || 0}" data-ppre="${p.pre || 0}" data-pdraft="${p.draft || 0}">
              <td><a href="#master/${m.id}" class="tm"><img src="${m.icon}" alt="">${esc(m.name)}</a></td>
              ${['wr1v1', 'wr2v2', 'wrPre'].map(k => `<td class="${(s[k] || 0) >= 52 ? 'good' : (s[k] || 0) < 48 ? 'warn' : ''}">${pct(s[k])}</td>`).join('')}
              ${['1v1', 'rand', 'pre', 'draft'].map(k => `<td>${(p[k] || 0).toLocaleString('de-DE')}</td>`).join('')}
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </section>
      <section class="section">
        <div class="panel"><h3>So funktioniert das Master- und Perk-System</h3><p class="muted" style="margin:0">${rich(D.masterSystem)}</p></div>
      </section>
    </div>`;
  };
  pages.masters.after = () => {
    const t = $('#masterTable'); let dir = -1, last = '';
    t.querySelector('thead').addEventListener('click', e => {
      const th = e.target.closest('th'); if (!th) return;
      const k = th.dataset.sort.toLowerCase();
      dir = last === k ? -dir : (k === 'name' ? 1 : -1); last = k;
      const tb = t.querySelector('tbody');
      [...tb.rows].sort((a, b) => {
        const x = a.dataset[k], y = b.dataset[k];
        return k === 'name' ? dir * x.localeCompare(y) : dir * (parseFloat(x) - parseFloat(y));
      }).forEach(r => tb.appendChild(r));
      $$('th', t).forEach(h => h.classList.toggle('sorted', h === th));
    });
  };

  // Build-Text in Abschnitte gliedern: "Perk 1: …", "Deck: …", Statistik-Hinweise als Fußnote
  function buildBlocks(text) {
    const blocks = [], notes = [];
    let cur = null;
    sentences(text).forEach(x => {
      const m = x.match(/^(Perk \d|Deck(?:bau)?|Spielweise|Tipp)(?:\s*\([^)]*\))?:\s*/i);
      if (/Statistik\s*=|Perk-Winrates:|Datensatz/.test(x)) { notes.push(x); return; }
      if (m) { cur = { label: m[1].replace(/^Deck$/i, 'Deckbau'), items: [x.slice(m[0].length)] }; blocks.push(cur); }
      else if (cur) cur.items.push(x);
      else { cur = { label: 'Allgemein', items: [x] }; blocks.push(cur); }
    });
    return `<div class="build-blocks">${blocks.map(b => `<div class="build-row"><span class="build-label">${esc(b.label)}</span>
      <ul class="bullets small">${b.items.map(i => `<li>${linkify(i)}</li>`).join('')}</ul></div>`).join('')}</div>
      ${notes.length ? `<p class="small dim" style="margin:12px 0 0">${icon('info')} ${esc(notes.join(' '))}</p>` : ''}`;
  }
  pages.master = id => {
    const m = MASTER[id];
    if (!m) return `<div class="wrap section"><p>Master nicht gefunden. <a href="#masters">Zurück</a></p></div>`;
    const s = D.masterStats[id] || {};
    const tiers = {};
    m.perks.forEach(p => { const n = (String(p.tier).match(/\d/) || ['?'])[0]; (tiers[n] = tiers[n] || []).push(p); });
    const curated = D.decks.filter(d => d.master === id);
    const lb = D.lbDecks.filter(d => d.master === id);
    // Häufigste Karten in Top-Decks dieses Masters
    const freq = {};
    lb.forEach(d => d.cards.forEach(r => { if (typeof r === 'string') freq[r] = (freq[r] || 0) + 1; }));
    const topCards = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const statBox = (label, wr, n) => `<div><small>${label}</small><b class="${wr >= 52 ? 'good' : wr < 48 ? 'warn' : ''}">${pct(wr)}</b><span class="dim small"> ${n ? n.toLocaleString('de-DE') + ' Sp.' : ''}</span></div>`;
    const idx = D.masters.findIndex(x => x.id === id);
    const prev = D.masters[(idx - 1 + D.masters.length) % D.masters.length], next = D.masters[(idx + 1) % D.masters.length];
    return `
    ${pageHero('Master', esc(m.name), esc(m.title), m.img)}
    <div class="wrap">
      <div class="toolbar-row" style="justify-content:space-between;margin:18px 0 0">
        <a href="#masters" class="btn btn-sm">← Alle Master</a>
        <div style="display:flex;gap:8px"><a class="btn btn-sm" href="#master/${prev.id}">← ${esc(prev.name)}</a><a class="btn btn-sm" href="#master/${next.id}">${esc(next.name)} →</a></div>
      </div>
      <section class="section">
        <div class="master-detail">
          <div>
            <div class="master-portrait"><img src="${m.img}" alt="${esc(m.name)}"></div>
            <div class="kv">
              ${statBox('1v1', s.wr1v1, s.n1v1)}${statBox('2v2 Solo', s.wr2v2, s.n2v2)}${statBox('Premade', s.wrPre, s.nPre)}${statBox('Gesamt', s.wrAll, s.nAll)}
            </div>
          </div>
          <div>
            <div class="deck-meta" style="margin-bottom:12px">${tierBadge(tierOfMaster(m))}<span class="tag gold">${esc(m.unlock)}</span></div>
            <p class="lead" style="color:var(--text)">${linkify(m.role)}</p>
            <div class="attack">${icon('target')}<div><b>Grundangriff</b><span>${linkify(m.attack)}</span></div></div>
            <div class="panel" style="margin-bottom:14px"><h3>${icon('star', 'h-ico')} Perk-Baum</h3>
              <div class="perk-tree">${Object.entries(tiers).map(([n, ps]) => `
                <div class="perk-tier">
                  <div class="perk-step"><b>${n}</b><small>${{ 1: '20', 2: '60', 3: '120' }[n] || '?'} XP</small></div>
                  <div class="perk-list">${ps.map((p, i) => `${i ? '<span class="perk-or">oder</span>' : ''}<div class="perk ${/alt/i.test(p.tier) ? 'alt' : ''}"><b>${esc(p.name)}${/alt/i.test(p.tier) ? ' <span class="tag">Alternative</span>' : ''}</b><span>${linkify(p.effect)}</span></div>`).join('')}</div>
                </div>`).join('')}
              </div>
            </div>
            <div class="panel build-panel"><h3>${icon('sparkles', 'h-ico')} Build-Empfehlung</h3>${buildBlocks(m.build)}</div>
            <div class="callout info" style="margin-top:14px">${icon('trophy')}<div><b>Einschätzung</b><br>${linkify(m.tier)}</div></div>
            ${m.faction ? `<p class="small dim">Fraktionsbezug: ${esc(m.faction)}</p>` : ''}
          </div>
        </div>
      </section>
      ${topCards.length ? `<section class="section">
        <div class="section-head"><div><span class="eyebrow">Aus ${lb.length} Leaderboard-Decks</span><h2>Beliebteste Karten mit ${esc(m.name)}</h2></div></div>
        <div class="card-grid">${topCards.map(([cid, n]) => tile(CARD[cid]).replace('<div class="cname">', `<div class="cname"><span class="good" style="font-size:12px">in ${Math.round(n / lb.length * 100)} % der Decks</span>`)).join('')}</div>
      </section>` : ''}
      ${curated.length ? `<section class="section"><div class="section-head"><div><span class="eyebrow">Kuratiert</span><h2>Empfohlene Decks</h2></div></div>
        <div class="grid grid-2">${curated.map(deckPanel).join('')}</div></section>` : ''}
      ${lb.length ? `<section class="section"><div class="section-head"><div><span class="eyebrow">Ranglisten</span><h2>Leaderboard-Decks mit ${esc(m.name)}</h2></div></div>
        <div class="grid grid-2">${lb.slice(0, 12).map(lbRow).join('')}</div>
        ${lb.length > 12 ? `<p class="small dim" style="margin-top:10px">${lb.length - 12} weitere Decks unter <a href="#meta" data-lb-master="${id}">Meta &amp; Decks → Leaderboard</a>.</p>` : ''}</section>` : `<section class="section"><div class="note">Für ${esc(m.name)} gibt es in den aktuellen Leaderboard-Auswertungen keine Top-Decks. Die Build-Empfehlung oben beschreibt passende Deck-Typen.</div></section>`}
    </div>`;
  };

  // ---------- Karten ----------
  const cardState = { q: '', type: [], rarity: [], faction: [], mana: [], tier: [], sort: 'tier' };
  pages.cards = () => `
    ${pageHero('Datenbank', 'Alle Karten', `${D.cards.length} Karten: Minions, Zauber und Gebäude. Klick auf eine Karte zeigt Details, Spielraten, Kombos und Counter.`, 'img/site/ss3.jpg')}
    <div class="wrap">
      <div class="toolbar" id="cardToolbar">
        <div class="toolbar-row">
          <input class="input search" id="cardSearch" placeholder="Name oder Effekt suchen …" value="${esc(cardState.q)}">
          <select class="input" id="cardSort">
            <option value="tier">Sortierung: Tier</option><option value="mana">Mana</option><option value="name">Name</option>
            <option value="r1v1">Spielrate 1v1</option><option value="rrand">Spielrate 2v2 Randoms</option><option value="rpre">Spielrate Premade</option>
          </select>
          <button class="btn btn-sm" id="cardReset">Filter zurücksetzen</button>
        </div>
        <details class="more" open><summary>Filter</summary><div style="display:grid;gap:8px">
          <div class="toolbar-row"><label class="lbl">Typ</label>${chipGroup('type', Object.entries(TYPE), cardState.type, true)}</div>
          <div class="toolbar-row"><label class="lbl">Mana</label>${chipGroup('mana', [['1', '≤1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7+']], cardState.mana, true)}</div>
          <div class="toolbar-row"><label class="lbl">Seltenheit</label>${chipGroup('rarity', Object.entries(RARITY), cardState.rarity, true)}</div>
          <div class="toolbar-row"><label class="lbl">Tier</label>${chipGroup('tier', [['S', 'S'], ['A', 'A'], ['B', 'B'], ['C', 'C']], cardState.tier, true)}</div>
          <div class="toolbar-row"><label class="lbl">Fraktion</label>${chipGroup('faction', FACTIONS.map(f => [f, (factionIcon(f) ? `<img src="${factionIcon(f)}" alt="">` : '') + esc(f)]), cardState.faction, true)}</div>
        </div></details>
      </div>
      <div class="count-label" id="cardCount" style="margin-bottom:10px"></div>
      <div class="card-grid" id="cardGrid"></div>
    </div>`;
  function filterCards(st, extraQ) {
    const q = norm(st.q || extraQ || '');
    return D.cards.filter(c =>
      (!q || norm(c.name).includes(q) || norm(c.text).includes(q)) &&
      (!st.type.length || st.type.includes(c.type)) &&
      (!st.rarity?.length || st.rarity.includes(c.rarity)) &&
      (!st.faction.length || st.faction.includes(c.faction)) &&
      (!st.tier?.length || st.tier.includes(c.tier)) &&
      (!st.mana.length || st.mana.includes(String(Math.min(Math.max(c.mana, 1), 7)))));
  }
  function sortCards(list, sort) {
    const rate = (c, k) => D.cardRates[c.id]?.[k] || 0;
    const cmp = {
      tier: (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.mana - b.mana || a.name.localeCompare(b.name),
      mana: (a, b) => a.mana - b.mana || a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name),
      r1v1: (a, b) => rate(b, '1v1') - rate(a, '1v1'),
      rrand: (a, b) => rate(b, 'rand') - rate(a, 'rand'),
      rpre: (a, b) => rate(b, 'pre') - rate(a, 'pre'),
    }[sort];
    return [...list].sort(cmp);
  }
  pages.cards.after = () => {
    const render = () => {
      const list = sortCards(filterCards(cardState), cardState.sort);
      $('#cardGrid').innerHTML = list.map(c => tile(c)).join('') || '<p class="empty">Keine Karte passt zu den Filtern.</p>';
      $('#cardCount').textContent = `${list.length} von ${D.cards.length} Karten`;
    };
    $('#cardSort').value = cardState.sort;
    $('#cardSort').onchange = e => { cardState.sort = e.target.value; render(); };
    const s = $('#cardSearch');
    s.oninput = () => { cardState.q = s.value; clearTimeout(s._t); s._t = setTimeout(render, 120); };
    $('#cardReset').onclick = () => { Object.assign(cardState, { q: '', type: [], rarity: [], faction: [], mana: [], tier: [] }); route(); };
    bindChips($('#cardToolbar'), cardState, render);
    render();
  };

  // ---------- Tierlist ----------
  const tierState = { view: 'tier', type: '', mode: '1v1', showAll: false };
  pages.tiers = () => `
    ${pageHero('Ranking', 'Tierlist &amp; beste Karten', 'Zwei Sichten: eine aus den Patch Notes abgeleitete Tierlist und ein Ranking nach tatsächlicher Spielrate in den Leaderboards.', 'img/site/ss4.jpg')}
    <div class="wrap">
      <section class="section">
        <div class="tabs" id="tierTabs">
          <button class="tab" data-view="tier">Tierlist S–C</button>
          <button class="tab" data-view="rate">Meta-Ranking nach Spielrate</button>
          <button class="tab" data-view="best">Die besten Karten erklärt</button>
        </div>
        <div id="tierBody"></div>
      </section>
    </div>`;
  pages.tiers.after = () => {
    const body = $('#tierBody');
    const render = () => {
      $$('#tierTabs .tab').forEach(t => t.classList.toggle('on', t.dataset.view === tierState.view));
      const typeChips = `<div class="toolbar-row" style="margin-bottom:16px"><label class="lbl">Typ</label>${chipGroup('type', [['', 'Alle'], ...Object.entries(TYPE)], tierState.type)}</div>`;
      const byType = c => !tierState.type || c.type === tierState.type;
      if (tierState.view === 'tier') {
        const labels = { S: 'Meta-prägend', A: 'Sehr stark', B: 'Solide', C: 'Nische' };
        const colors = { S: 'var(--t-s)', A: 'var(--t-a)', B: 'var(--t-b)', C: 'var(--t-c)' };
        body.innerHTML = `
          <div class="note" style="margin-bottom:16px"><strong>Wie diese Tierlist entstand:</strong> ${esc(D.cardMeta.tier_methode || '')}</div>
          ${typeChips}
          ${['S', 'A', 'B', 'C'].map(t => {
            let cs = D.cards.filter(c => c.tier === t && byType(c)).sort((a, b) => a.mana - b.mana);
            const total = cs.length;
            const cut = !tierState.showAll && t === 'B' && cs.length > 40;
            if (cut) cs = cs.slice(0, 40);
            return `<div class="tier-row"><div class="tier-label" style="background:${colors[t]}"><div>${t}<small>${labels[t]}</small></div></div>
              <div class="tier-cards">${cs.map(c => mini(c.id)).join('')}${cut ? `<button class="btn btn-sm" id="tierAll" style="align-self:center">+ ${total - 40} weitere</button>` : ''}</div></div>`;
          }).join('')}`;
        const all = $('#tierAll'); if (all) all.onclick = () => { tierState.showAll = true; render(); };
      } else if (tierState.view === 'rate') {
        const k = tierState.mode;
        const list = D.cards.filter(c => D.cardRates[c.id]?.[k] && byType(c)).sort((a, b) => D.cardRates[b.id][k] - D.cardRates[a.id][k]).slice(0, 40);
        const max = D.cardRates[list[0]?.id]?.[k] || 1;
        body.innerHTML = `
          <div class="toolbar-row" style="margin-bottom:12px"><label class="lbl">Modus</label>${chipGroup('mode', Object.entries(MODE), k)}</div>
          ${typeChips}
          <div class="grid" style="gap:8px">${list.map((c, i) => `
            <div class="rate-row" data-card="${c.id}">
              <span class="rank">${i + 1}</span>
              <img src="${c.img}" alt="" loading="lazy">
              <div class="rate-main"><div class="rate-top"><b>${esc(c.name)}</b>${tierBadge(c.tier)}<span class="tag tag-mana">${c.mana} Mana</span><span class="tag">${TYPE[c.type]}</span></div>
              <div class="bar"><i style="width:${D.cardRates[c.id][k] / max * 100}%"></i></div></div>
              <span class="rate-val">${pct(D.cardRates[c.id][k])}</span>
            </div>`).join('')}</div>
          <p class="small dim" style="margin-top:12px">Anteil der Leaderboard-Decks (${k === 'draft' ? '6.460' : '8.500'} Decks) mit dieser Karte, Patch 2.33.</p>`;
      } else {
        body.innerHTML = `<div class="grid grid-2">${D.topCards.map((t, i) => {
          const c = cardOf(t.card);
          return `<div class="panel" style="display:flex;gap:16px;align-items:flex-start">
            <div style="width:96px;flex-shrink:0">${mini(t.card)}</div>
            <div><span class="eyebrow">#${i + 1}</span><h3>${esc(c?.name || t.card.name)} ${c ? tierBadge(c.tier) : ''}</h3><p class="muted small" style="margin:0">${esc(t.why)}</p></div></div>`;
        }).join('')}</div>`;
      }
      bindChips(body, tierState, render);
    };
    $('#tierTabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) { tierState.view = b.dataset.view; render(); } });
    render();
  };

  // ---------- Kombos & Counter ----------
  const comboState = { q: '', threat: '' };
  pages.combos = () => `
    ${pageHero('Synergien', 'Kombos &amp; Counter', 'Karten, die zusammen mehr können, und Antworten auf die nervigsten Bedrohungen der Meta.', 'img/site/ss6.jpg')}
    <div class="wrap">
      <section class="section">
        <div class="section-head"><div><span class="eyebrow">${D.combos.length} Kombos</span><h2>Starke Kombos</h2></div>
        <input class="input search" id="comboSearch" placeholder="Kombo oder Karte suchen …" style="max-width:360px" value="${esc(comboState.q)}"></div>
        <div class="grid grid-2" id="comboGrid"></div>
      </section>
      <section class="section" id="counter">
        <div class="section-head"><div><span class="eyebrow">Counter-Finder</span><h2>Was hilft gegen …?</h2></div>
        <p class="small">Wähle eine Bedrohung und du siehst passende Antworten.</p></div>
        <div class="chips" id="threatChips" style="margin-bottom:18px">
          <button class="chip ${!comboState.threat ? 'on' : ''}" data-v="">Alle</button>
          ${D.counters.map((c, i) => `<button class="chip ${comboState.threat === String(i) ? 'on' : ''}" data-v="${i}">${esc(cardOf(c.threat)?.name.split(',')[0] || c.threat.name)}</button>`).join('')}
        </div>
        <div class="grid grid-2" id="counterGrid"></div>
      </section>
    </div>`;
  function comboPanel(c) {
    return `<article class="panel combo"><h3>${esc(c.name)}</h3>
      <div class="combo-cards">${c.cards.map(mini).join('<span class="plus">+</span>')}</div>
      <p><b>Warum:</b> ${esc(c.why)}</p><p><b>So spielst du es:</b> ${esc(c.how)}</p></article>`;
  }
  function counterPanel(c) {
    const t = cardOf(c.threat);
    const answers = c.answers.map(a => {
      if (a && a.group) return `<div style="width:100%"><span class="tag gold">${esc(a.name)}</span></div>${a.group.map(mini).join('')}`;
      return mini(a);
    }).join('');
    return `<article class="panel combo">
      <div style="display:flex;gap:14px;align-items:center">
        <div style="width:72px;flex-shrink:0">${t ? mini(c.threat) : ''}</div>
        <div><span class="eyebrow">Bedrohung</span><h3 style="margin:0">${esc(t?.name || c.threat.name)}</h3></div>
      </div>
      <div><span class="eyebrow" style="color:var(--ok)">Antworten</span><div class="combo-cards">${answers}</div></div>
      <p>${esc(c.tip)}</p></article>`;
  }
  pages.combos.after = () => {
    const renderCombos = () => {
      const q = norm(comboState.q);
      const list = D.combos.filter(c => !q || norm(c.name + c.why + c.how).includes(q) || c.cards.some(r => norm(cardOf(r)?.name || r.name).includes(q)));
      $('#comboGrid').innerHTML = list.map(comboPanel).join('') || '<p class="empty">Keine Kombo gefunden.</p>';
    };
    const renderCounters = () => {
      const list = comboState.threat === '' ? D.counters : [D.counters[+comboState.threat]];
      $('#counterGrid').innerHTML = list.map(counterPanel).join('');
    };
    const s = $('#comboSearch');
    s.oninput = () => { comboState.q = s.value; renderCombos(); };
    $('#threatChips').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      comboState.threat = b.dataset.v;
      $$('#threatChips .chip').forEach(x => x.classList.toggle('on', x === b));
      renderCounters();
    });
    renderCombos(); renderCounters();
  };

  // ---------- Deckbuilder ----------
  const bState = { q: '', type: [], mana: [], faction: [] };
  let deck = store.get('deck', { m: 'apep', c: [], name: '' });
  const saveDeck = () => store.set('deck', deck);
  pages.builder = () => `
    ${pageHero('Werkstatt', 'Deckbuilder', 'Wähle einen Master und 10 Karten. Die Analyse prüft Mana-Kurve, Luftabwehr, Zauber und Kartenmix. Decks werden lokal in deinem Browser gespeichert.', 'img/site/ss7.jpg')}
    <div class="wrap section">
      <div class="builder">
        <div>
          <div class="toolbar" id="bToolbar" style="top:var(--topbar-h)">
            <div class="toolbar-row"><input class="input search" id="bSearch" placeholder="Karte suchen …" value="${esc(bState.q)}"></div>
            <div class="toolbar-row"><label class="lbl">Typ</label>${chipGroup('type', Object.entries(TYPE), bState.type, true)}</div>
            <div class="toolbar-row"><label class="lbl">Mana</label>${chipGroup('mana', [['1', '≤1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7+']], bState.mana, true)}</div>
            <div class="toolbar-row"><label class="lbl">Fraktion</label>${chipGroup('faction', FACTIONS.map(f => [f, (factionIcon(f) ? `<img src="${factionIcon(f)}" alt="">` : '') + esc(f)]), bState.faction, true)}</div>
          </div>
          <div class="card-grid" id="bGrid"></div>
        </div>
        <aside class="builder-side">
          <div class="panel">
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
              <img id="bMasterImg" src="" alt="" style="width:56px;height:56px;border-radius:12px;object-fit:cover;border:2px solid var(--gold)">
              <div style="flex:1;display:grid;gap:6px">
                <select class="input" id="bMaster">${D.masters.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select>
                <input class="input" id="bName" placeholder="Deckname" value="${esc(deck.name)}">
              </div>
            </div>
            <div class="slots" id="bSlots"></div>
            <div id="bStats"></div>
            <div class="deck-actions" style="margin-top:12px">
              <button class="btn btn-sm btn-gold" id="bSave">Speichern</button>
              <button class="btn btn-sm" id="bCopy">Kopieren</button>
              <button class="btn btn-sm" id="bImport">Importieren</button>
              <button class="btn btn-sm btn-danger" id="bClear">Leeren</button>
            </div>
          </div>
          <div class="panel"><h3>Analyse</h3><ul class="analysis" id="bAnalysis"></ul></div>
          <div class="panel"><h3>Gespeicherte Decks</h3><div id="bSaved" style="display:grid;gap:6px"></div></div>
        </aside>
      </div>
    </div>`;
  function analyse(cs) {
    const out = [];
    const air = cs.filter(c => /Luft/.test(c.text) || (c.type === 'spell' && !/Ziele: Boden(?! &)/.test(c.text)));
    const spells = cs.filter(c => c.type === 'spell');
    const cheap = cs.filter(c => c.mana <= 2);
    const big = cs.filter(c => c.mana >= 6);
    const avg = cs.length ? cs.reduce((a, c) => a + c.mana, 0) / cs.length : 0;
    if (cs.length < 10) out.push(['warn', `Noch ${10 - cs.length} Karte(n) frei.`]);
    if (cs.length) {
      if (avg > 4.4) out.push(['warn', `Ø ${fmt1(avg)} Mana ist sehr teuer. Top-Decks liegen bei etwa 3,7 (1v1) bis 4,2 (Premade).`]);
      else if (avg < 2.8) out.push(['warn', `Ø ${fmt1(avg)} Mana ist sehr billig. Achte auf genug Durchschlagskraft im Late Game.`]);
      else out.push(['good', `Ø ${fmt1(avg)} Mana liegt im Bereich der Meta-Decks.`]);
      const airMinions = cs.filter(c => c.type !== 'spell' && /Luft/.test(c.text));
      if (airMinions.length < 2) out.push(['warn', `Nur ${airMinions.length} Einheit(en) treffen Flieger. Empfohlen sind mindestens 2.`]);
      else out.push(['good', `${airMinions.length} Einheiten mit Luftabwehr.`]);
      if (air.length === 0) out.push(['warn', 'Keine Antwort auf Flieger im Deck!']);
      if (cheap.length < 2) out.push(['warn', `Nur ${cheap.length} Karte(n) für ≤2 Mana. Billige Karten helfen beim Zyklen und Brückenhalten.`]);
      else out.push(['good', `${cheap.length} günstige Karten (≤2 Mana) für den Zyklus.`]);
      if (spells.length === 0) out.push(['warn', 'Kein Zauber. Ein Flächenzauber gegen Schwärme (z. B. Daggerfall, Fireball) ist meist sinnvoll.']);
      else if (spells.length > 4) out.push(['warn', `${spells.length} Zauber sind viele: wenig Präsenz auf den Brücken.`]);
      else out.push(['good', `${spells.length} Zauber.`]);
      if (big.length > 3) out.push(['warn', `${big.length} Karten ab 6 Mana: sehr langsamer Start.`]);
      const s = cs.filter(c => c.tier === 'S' || c.tier === 'A').length;
      out.push(['', `${s} Karte(n) aus Tier S/A.`]);
      const usage = cs.filter(c => D.cardRates[c.id]?.['1v1'] >= 10).map(c => c.name);
      if (usage.length) out.push(['', `Meta-Staples (≥10 % der 1v1-Decks): ${usage.join(', ')}.`]);
    }
    return out;
  }
  pages.builder.after = () => {
    const renderGrid = () => {
      const list = sortCards(filterCards(bState), 'mana');
      $('#bGrid').innerHTML = list.map(c => tile(c, deck.c.includes(c.id) ? 'in-deck' : '').replace('data-card=', 'data-add=')).join('');
    };
    const renderDeck = () => {
      const cs = deck.c.map(id => CARD[id]).filter(Boolean).sort((a, b) => a.mana - b.mana);
      $('#bMaster').value = deck.m;
      $('#bMasterImg').src = MASTER[deck.m]?.icon || '';
      $('#bSlots').innerHTML = Array.from({ length: 10 }, (_, i) => cs[i]
        ? `<div class="slot">${mini(cs[i].id).replace('data-card=', 'data-remove=')}</div>` : '<div class="slot">+</div>').join('');
      $('#bStats').innerHTML = curve(cs.map(c => c.id)) + `<div class="deck-meta"><span class="tag tag-mana">Ø ${fmt1(avgMana(cs.map(c => c.id)))} Mana</span><span class="tag">${cs.length}/10 Karten</span>
        ${Object.entries(TYPE).map(([k, v]) => `<span class="tag">${cs.filter(c => c.type === k).length} ${v}</span>`).join('')}</div>`;
      $('#bAnalysis').innerHTML = analyse(cs).map(([cls, t]) => `<li class="${cls}">${esc(t)}</li>`).join('') || '<li class="dim">Füge Karten hinzu, um die Analyse zu sehen.</li>';
      saveDeck();
    };
    const renderSaved = () => {
      const saved = store.get('saved', []);
      $('#bSaved').innerHTML = saved.length ? saved.map((d, i) => `<div class="saved-deck"><span><b>${esc(d.name || 'Unbenannt')}</b><br><small class="dim">${esc(MASTER[d.m]?.name)} · ${d.c.length} Karten</small></span>
        <span style="display:flex;gap:4px"><button class="btn btn-sm" data-load="${i}">Laden</button><button class="btn btn-sm btn-danger" data-del="${i}">×</button></span></div>`).join('')
        : '<p class="dim small" style="margin:0">Noch keine Decks gespeichert.</p>';
    };
    const toggle = id => {
      const i = deck.c.indexOf(id);
      if (i >= 0) deck.c.splice(i, 1);
      else if (deck.c.length >= 10) { toast('Das Deck hat schon 10 Karten'); return; }
      else deck.c.push(id);
      renderDeck(); renderGrid();
    };
    $('#bGrid').addEventListener('click', e => { const t = e.target.closest('[data-add]'); if (t) toggle(t.dataset.add); });
    $('#bSlots').addEventListener('click', e => { const t = e.target.closest('[data-remove]'); if (t) toggle(t.dataset.remove); });
    $('#bMaster').onchange = e => { deck.m = e.target.value; renderDeck(); };
    $('#bName').oninput = e => { deck.name = e.target.value; saveDeck(); };
    $('#bClear').onclick = () => { deck.c = []; renderDeck(); renderGrid(); };
    $('#bCopy').onclick = () => copy(deckText(deck.m, deck.c));
    $('#bSave').onclick = () => {
      const saved = store.get('saved', []);
      const name = deck.name || `${MASTER[deck.m].name}-Deck ${saved.length + 1}`;
      const i = saved.findIndex(d => d.name === name);
      const entry = { name, m: deck.m, c: [...deck.c] };
      i >= 0 ? (saved[i] = entry) : saved.push(entry);
      store.set('saved', saved); deck.name = name; $('#bName').value = name;
      renderSaved(); toast('Deck gespeichert');
    };
    $('#bImport').onclick = () => {
      const txt = prompt('Deckliste einfügen (Format: "Master: Karte, Karte, …")');
      if (!txt) return;
      const [mPart, cPart] = txt.includes(':') ? [txt.slice(0, txt.indexOf(':')), txt.slice(txt.indexOf(':') + 1)] : ['', txt];
      const mid = D.masters.find(m => norm(m.name) === norm(mPart))?.id;
      if (mid) deck.m = mid;
      // Kartennamen können Kommas enthalten ("A'Zog, Voidfiend …"): längste Namen zuerst suchen
      let rest = ',' + cPart.split(',').map(norm).join(',') + ',';
      const found = [];
      [...D.cards].sort((a, b) => b.name.length - a.name.length).forEach(c => {
        const key = ',' + c.name.split(',').map(norm).join(',') + ',';
        if (rest.includes(key) && found.length < 10) { found.push(c.id); rest = rest.replace(key, ','); }
      });
      deck.c = found; renderDeck(); renderGrid();
      toast(`${found.length} Karten importiert`);
    };
    $('#bSaved').addEventListener('click', e => {
      const l = e.target.closest('[data-load]'), d = e.target.closest('[data-del]');
      const saved = store.get('saved', []);
      if (l) { const s = saved[+l.dataset.load]; deck = { m: s.m, c: [...s.c], name: s.name }; $('#bName').value = s.name; renderDeck(); renderGrid(); }
      if (d && confirm('Deck löschen?')) { saved.splice(+d.dataset.del, 1); store.set('saved', saved); renderSaved(); }
    });
    const s = $('#bSearch');
    s.oninput = () => { bState.q = s.value; clearTimeout(s._t); s._t = setTimeout(renderGrid, 120); };
    bindChips($('#bToolbar'), bState, renderGrid);
    renderGrid(); renderDeck(); renderSaved();
  };

  // ---------- Grundlagen ----------
  const basicsState = { kwCat: '', bridges: 2, tlMode: '1v1' };
  const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const KW_COLOR = { combat: 'var(--mana)', buff: 'var(--ok)', control: 'var(--t-s)', card: 'var(--supreme)', faction: 'var(--gold)' };

  function arenaSvg() {
    const hs = (n, x, y) => `<g class="hs" data-hs="${n}" transform="translate(${x} ${y})"><circle r="15"/><text>${n}</text></g>`;
    return `<svg class="arena" viewBox="0 0 800 380" role="img" aria-label="Schema der Arena mit zwei Hälften, zwei Brücken und den Türmen der Master">
      <defs>
        <clipPath id="clipL"><circle cx="120" cy="190" r="38"/></clipPath>
        <clipPath id="clipR"><circle cx="680" cy="190" r="38"/></clipPath>
        <pattern id="water" width="24" height="14" patternUnits="userSpaceOnUse"><path d="M0 7q6-6 12 0t12 0" fill="none" stroke="rgba(120,180,255,.3)" stroke-width="1.5"/></pattern>
      </defs>
      <rect x="10" y="10" width="368" height="360" rx="22" class="half you" data-hs="1"/>
      <rect x="422" y="10" width="368" height="360" rx="22" class="half foe"/>
      <rect x="378" y="10" width="44" height="360" fill="url(#water)" class="river"/>
      <text x="36" y="44" class="side-label you">DEINE SEITE</text>
      <text x="764" y="44" class="side-label foe" text-anchor="end">GEGNER</text>
      <g data-hs="5">
        <path class="lane" d="M160 172 C 240 118 300 92 352 92"/><path class="lane" d="M160 208 C 240 262 300 288 352 288"/>
        <path class="lane" d="M640 172 C 560 118 500 92 448 92"/><path class="lane" d="M640 208 C 560 262 500 288 448 288"/>
      </g>
      <g class="bridge own" data-hs="2"><rect x="348" y="70" width="104" height="44" rx="9"/><text x="400" y="92">gehalten</text></g>
      <g class="bridge neutral" data-hs="3"><rect x="348" y="266" width="104" height="44" rx="9"/><text x="400" y="288">neutral</text></g>
      <g data-hs="4"><circle cx="120" cy="190" r="44" class="tower you"/><image href="img/masters/valorian-icon.webp" x="82" y="152" width="76" height="76" clip-path="url(#clipL)"/></g>
      <g data-hs="6"><circle cx="680" cy="190" r="44" class="tower foe"/><image href="img/masters/ravager-icon.webp" x="642" y="152" width="76" height="76" clip-path="url(#clipR)"/></g>
      <circle r="7" class="unit you"><animateMotion dur="5s" repeatCount="indefinite" path="M160 172 C 240 118 300 92 400 92"/></circle>
      <circle r="7" class="unit you"><animateMotion dur="5s" begin="2.5s" repeatCount="indefinite" path="M160 172 C 240 118 300 92 400 92"/></circle>
      <circle r="7" class="unit foe"><animateMotion dur="6s" begin="1s" repeatCount="indefinite" path="M640 208 C 560 262 500 288 400 288"/></circle>
      ${hs(1, 250, 336)}${hs(2, 452, 70)}${hs(3, 452, 266)}${hs(4, 160, 150)}${hs(5, 262, 150)}${hs(6, 640, 150)}
    </svg>`;
  }

  function manaChart() {
    const R = C.manaRates, W = 640, H = 270, L = 46, Rt = 96, T = 22, B = 38, X1 = 280, Y0 = 15, Y1 = 42;
    const x = t => L + t / X1 * (W - L - Rt), y = v => T + (1 - (v - Y0) / (Y1 - Y0)) * (H - T - B);
    const series = [['1v1', 'var(--chart-1)'], ['2v2', 'var(--chart-2)']];
    const path = k => R.times.map((t, i) => {
      const v = 60 / R[k][i], nx = i + 1 < R.times.length ? R.times[i + 1] : X1;
      return `${i ? 'L' : 'M'}${x(t).toFixed(1)} ${y(v).toFixed(1)} L${x(nx).toFixed(1)} ${y(v).toFixed(1)}`;
    }).join(' ');
    const grid = [20, 25, 30, 35, 40].map(v => `<line x1="${L}" x2="${W - Rt}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 8}" y="${y(v)}" class="axis" text-anchor="end">${v}</text>`).join('');
    const ticks = [0, 40, 80, 120, 160, 200, 240, 280].map(t => `<text x="${x(t)}" y="${H - B + 20}" class="axis" text-anchor="middle">${fmtTime(t)}</text>`).join('');
    const last = k => 60 / R[k][R[k].length - 1];
    return `<div class="chart-wrap">
      <div class="legend">${series.map(([k, c]) => `<span><i style="background:${c}"></i>${k}</span>`).join('')}</div>
      <div class="chart-box">
        <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mana pro Minute im Spielverlauf, 1v1 und 2v2">
          ${grid}${ticks}
          <text x="${L}" y="12" class="axis">Mana pro Minute</text>
          ${series.map(([k, c]) => `<path d="${path(k)}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/>
            <text x="${x(X1) + 8}" y="${y(last(k))}" class="direct">${k} · ${fmt1(last(k))}</text>`).join('')}
          <line class="crosshair" x1="0" x2="0" y1="${T}" y2="${H - B}" style="display:none"/>
          <rect class="hit" x="${L}" y="${T}" width="${W - L - Rt}" height="${H - T - B}" fill="transparent"/>
        </svg>
        <div class="chart-tip" hidden></div>
      </div>
      <details class="more"><summary>Als Tabelle</summary><div style="overflow-x:auto">
        <table class="stat-table" style="min-width:0"><thead><tr><th>Ab</th><th>1v1: Sek. pro Mana</th><th>1v1: Mana/Min</th><th>2v2: Sek. pro Mana</th><th>2v2: Mana/Min</th></tr></thead>
        <tbody>${R.times.map((t, i) => `<tr><td>${fmtTime(t)}</td><td>${fmt1(R['1v1'][i])}</td><td>${fmt1(60 / R['1v1'][i])}</td><td>${fmt1(R['2v2'][i])}</td><td>${fmt1(60 / R['2v2'][i])}</td></tr>`).join('')}</tbody></table>
      </div></details>
    </div>`;
  }
  function bindManaChart() {
    const svg = $('.chart'), tip = $('.chart-tip'), line = $('.chart .crosshair'); if (!svg) return;
    const R = C.manaRates, L = 46, W = 640, Rt = 96, X1 = 280;
    svg.querySelector('.hit').addEventListener('mousemove', e => {
      const box = svg.getBoundingClientRect();
      const vx = (e.clientX - box.left) / box.width * W;
      const t = Math.max(0, Math.min(X1, (vx - L) / (W - L - Rt) * X1));
      const i = R.times.filter(s => s <= t).length - 1;
      line.setAttribute('x1', vx); line.setAttribute('x2', vx); line.style.display = '';
      tip.hidden = false;
      tip.style.left = Math.min(box.width - 170, Math.max(0, e.clientX - box.left + 12)) + 'px';
      tip.innerHTML = `<b>${fmtTime(t)}</b><span><i style="background:var(--chart-1)"></i>1v1: ${fmt1(60 / R['1v1'][i])} Mana/Min</span><span><i style="background:var(--chart-2)"></i>2v2: ${fmt1(60 / R['2v2'][i])} Mana/Min</span>`;
    });
    svg.querySelector('.hit').addEventListener('mouseleave', () => { tip.hidden = true; line.style.display = 'none'; });
  }

  function matchTimeline() {
    const { bridges, tlMode } = basicsState;
    const rate = ((tlMode === '1v1' ? 1 : 2) + bridges) / 4; // XP pro Sekunde
    const frenzyXp = tlMode === '1v1' ? 200 : 400;
    const ms = [['Perk 1', 20, 'star'], ['Perk 2', 60, 'star'], ['Perk 3', 120, 'star'], ['Mana Frenzy', frenzyXp, 'flame']].map(([l, xp, ic]) => ({ l, xp, ic, t: xp / rate }));
    const Tmax = Math.max(ms[3].t, 230) * 1.06;
    const base = frenzyXp / ((tlMode === '1v1' ? 1 : 2) / 4);
    const pos = t => (t / Tmax * 100).toFixed(2) + '%';
    return `
      <div class="tl-track">
        ${[40, 80, 120, 160, 200].filter(t => t < Tmax).map(t => `<span class="tl-tick" style="left:${pos(t)}" title="Mana wird schneller"></span>`).join('')}
        <div class="tl-fill" style="width:${pos(ms[3].t)}"></div>
        ${ms.map((m, i) => `<div class="tl-ms ${i % 2 ? 'below' : ''} ${m.ic === 'flame' ? 'frenzy' : ''}" style="left:${pos(m.t)}">
          <span class="tl-dot">${icon(m.ic)}</span><span class="tl-label"><b>${m.l}</b>${fmtTime(m.t)}</span></div>`).join('')}
      </div>
      <div class="tl-legend"><span><i class="tick"></i>Mana-Tempo steigt (alle 40 s bis 3:20)</span><span>${fmt1(rate * 4)} XP alle 4 s</span></div>
      <p class="tl-summary">${bridges
        ? `Mit ${bridges === 2 ? 'beiden Brücken' : 'einer Brücke'} erreichst du die Mana Frenzy nach <b>${fmtTime(ms[3].t)}</b>, also <b>${fmtTime(base - ms[3].t)}</b> früher als ohne Brücke.`
        : `Ohne Brücke dauert es <b>${fmtTime(ms[3].t)}</b> bis zur Mana Frenzy. Deshalb ist Brückenkontrolle so wichtig.`}</p>`;
  }

  function factionCards() {
    return D.factions.map(f => {
      let cs = D.cards.filter(c => sameFaction(c.faction, f.name));
      const byName = !cs.length; // Puffs sind keine eigene Kartenfraktion: über den Namen finden
      if (byName) cs = D.cards.filter(c => c.name.includes(f.name));
      const score = c => Object.values(D.cardRates[c.id] || {}).reduce((a, b) => a + b, 0);
      const sig = [...cs].sort((a, b) => score(b) - score(a)).slice(0, 4);
      const theme = sentences(f.theme).slice(0, 2).join(' ');
      return `<article class="faction-card">
        <div class="faction-banner">${sig[0] ? `<img src="${sig[0].img}" alt="" loading="lazy">` : ''}${f.icon ? `<img class="faction-emblem" src="${f.icon}" alt="">` : ''}</div>
        <div class="faction-body">
          <h3>${esc(f.name)}</h3>
          <p class="small muted">${linkify(theme)}</p>
          ${sig.length ? `<div class="mini-strip">${sig.map(c => mini(c.id)).join('')}</div>` : ''}
          ${cs.length && !byName ? `<a class="more-link" href="#cards" data-faction="${esc(cs[0].faction)}">Alle ${cs.length} Karten ${icon('route')}</a>` : ''}
        </div>
      </article>`;
    }).join('');
  }

  function leagueLadder() {
    return `<div class="ladder">${C.leagues.map((l, i) => `
      <div class="rung" style="--lc:${l.color};--i:${i}">
        <div class="emblem">${l.icon ? `<img src="${l.icon}" alt="">` : `<svg viewBox="0 0 40 46"><path d="M20 2l17 10v22L20 44 3 34V12z" fill="var(--lc)" opacity=".9"/><text x="20" y="27" text-anchor="middle">${l.name[0]}</text></svg>`}</div>
        <b>${l.name}</b><small>${l.ranks}</small>
        <span class="reward">${icon('gift')}${esc(l.reward)}</span>
      </div>`).join('')}</div>`;
  }

  pages.basics = () => {
    const B = D.basics;
    const catOf = name => C.keywordCats.find(c => c.names.includes(name))?.id || 'card';
    const mechText = ref => B.mechanics.find(m => m.title === ref)?.text || '';
    return `
    ${pageHero('Das Spiel verstehen', 'Grundlagen &amp; Mechaniken', esc(C.basicsIntro), 'img/site/Angled_combatScene.jpg')}
    <div class="wrap">
      <nav class="jump">
        <a href="#basics" data-jump="b-facts">${icon('info')} Auf einen Blick</a><a href="#basics" data-jump="b-arena">${icon('map')} Arena</a>
        <a href="#basics" data-jump="b-tempo">${icon('clock')} Tempo &amp; XP</a><a href="#basics" data-jump="b-mech">${icon('layers')} Mechaniken</a>
        <a href="#basics" data-jump="glossar">${icon('book')} Glossar</a><a href="#basics" data-jump="b-factions">${icon('shield')} Fraktionen</a><a href="#basics" data-jump="b-leagues">${icon('trophy')} Ligen</a>
      </nav>
      <section class="section" id="b-facts">
        <div class="facts">${C.facts.map(f => `<div class="fact">${icon(f.icon)}<b>${f.big}</b><span>${f.label}</span><small>${f.sub}</small></div>`).join('')}</div>
      </section>

      <section class="section" id="b-arena">
        ${sectionHead('Das Spielfeld', 'So ist die Arena aufgebaut', '<p class="small">Fahr über die Nummern oder die Liste.</p>')}
        <div class="arena-wrap">
          <div class="panel arena-panel">${arenaSvg()}</div>
          <ol class="arena-legend">${C.arena.map(a => `<li data-hs="${a.n}"><span class="hs-num">${a.n}</span><div><b>${a.title}</b><span>${linkify(a.text)}</span></div></li>`).join('')}</ol>
        </div>
      </section>

      <section class="section" id="b-tempo">
        ${sectionHead('Tempo &amp; XP', 'Wann passiert was im Match?')}
        <div class="grid grid-2" style="align-items:stretch">
          <div class="panel">
            <h3>${icon('star', 'h-ico')} Perks und Mana Frenzy</h3>
            <p class="small muted">Stell ein, wie viele Brücken du hältst. Die Zeitleiste zeigt, wann deine Perks und die Mana Frenzy kommen.</p>
            <div class="toolbar-row" style="gap:16px;margin-bottom:6px">
              <div class="seg" data-seg="tlMode">${['1v1', '2v2'].map(v => `<button class="${basicsState.tlMode === v ? 'on' : ''}" data-v="${v}">${v}</button>`).join('')}</div>
              <div class="seg" data-seg="bridges">${[0, 1, 2].map(v => `<button class="${basicsState.bridges === v ? 'on' : ''}" data-v="${v}">${icon('bridge')} ${v}</button>`).join('')}</div>
            </div>
            <div id="matchTl">${matchTimeline()}</div>
          </div>
          <div class="panel">
            <h3>${icon('mana', 'h-ico')} Mana-Tempo im Spielverlauf</h3>
            <p class="small muted">Alle 40 Sekunden lädt Mana schneller. Ab 3:20 ist das Maximum erreicht. Im 2v2 läuft alles etwas langsamer.</p>
            ${manaChart()}
          </div>
        </div>
      </section>

      <section class="section" id="b-mech">
        ${sectionHead('Mechaniken', 'Die Regeln im Detail')}
        <div class="mech-grid">${C.mechanics.map(m => `<article class="mech">
          <span class="ico-badge">${icon(m.icon)}</span>
          <h3>${esc(m.title)}</h3>
          <p class="mech-key">${linkify(m.key)}</p>
          <ul class="bullets">${m.bullets.map(b => `<li>${linkify(b)}</li>`).join('')}</ul>
          ${mechText(m.ref) ? `<details class="more"><summary>Ausführlich</summary><div class="small muted">${linkify(mechText(m.ref))}</div></details>` : ''}
        </article>`).join('')}</div>
      </section>

      <section class="section" id="glossar">
        ${sectionHead(`${B.keywords.length} Begriffe`, 'Stichwort-Glossar', '<input class="input search" id="kwSearch" placeholder="Begriff suchen …" style="max-width:320px">')}
        <div class="chips" id="kwCats" style="margin-bottom:16px">
          <button class="chip on" data-v="">Alle</button>
          ${C.keywordCats.map(c => `<button class="chip" data-v="${c.id}" style="--kc:${KW_COLOR[c.id]}">${icon(c.icon)} ${c.label} <span class="dim">${B.keywords.filter(k => catOf(k.name) === c.id).length}</span></button>`).join('')}
        </div>
        <div class="kw-grid" id="kwGrid">${B.keywords.map(k => { const cat = catOf(k.name); const ci = C.keywordCats.find(c => c.id === cat); return `
          <div class="kw" data-cat="${cat}" data-kw="${esc(norm(k.name + k.text))}" style="--kc:${KW_COLOR[cat]}">
            <span class="kw-ico">${icon(ci?.icon || 'cards')}</span>
            <div><b>${esc(k.name)}</b><span>${linkify(k.text)}</span></div>
          </div>`; }).join('')}</div>
      </section>

      <section class="section" id="b-factions">
        ${sectionHead('Völker', 'Die Fraktionen', '<p class="small">Mit den vier meistgespielten Karten jeder Fraktion.</p>')}
        <div class="faction-grid">${factionCards()}</div>
      </section>

      <section class="section" id="b-leagues">
        ${sectionHead('Ranked', 'Ligen &amp; Saison-Belohnungen')}
        ${leagueLadder()}
        <div class="grid grid-4" style="margin-top:16px">
          ${[['shield', 'Sicherer Start', 'In Wood und Stone verlierst du bei Niederlagen keine Punkte.'],
             ['bolt', 'Siegesserien', 'Bis unter Master I gibt es doppelte Punkte, wenn die zwei Spiele davor auch gewonnen wurden.'],
             ['layers', 'Drei Ranglisten', 'Getrennt für 1v1, 2v2 Random und 2v2 Premade. Draft hat seit 2.0 ein eigenes Leaderboard.'],
             ['calendar', 'Reset', 'Die Ranked-Saison wird mit jedem Update zurückgesetzt. Jede Liga-Belohnung gibt es einmal pro Saison.']]
            .map(([ic, t, x]) => `<div class="mini-fact">${icon(ic)}<div><b>${t}</b><span>${x}</span></div></div>`).join('')}
        </div>
      </section>
    </div>`;
  };
  pages.basics.after = () => {
    const root = app.querySelector('.page');
    // Arena: Nummer und Listeneintrag gemeinsam hervorheben
    const wrap = $('.arena-wrap');
    const hl = n => $$('[data-hs]', wrap).forEach(el => el.classList.toggle('hl', el.dataset.hs === n));
    wrap.addEventListener('mouseover', e => { const t = e.target.closest('[data-hs]'); hl(t ? t.dataset.hs : ''); });
    wrap.addEventListener('mouseleave', () => hl(''));
    // Zeitleiste
    $$('[data-seg]', root).forEach(seg => seg.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const k = seg.dataset.seg;
      basicsState[k] = k === 'bridges' ? +b.dataset.v : b.dataset.v;
      $$('button', seg).forEach(x => x.classList.toggle('on', x === b));
      $('#matchTl').innerHTML = matchTimeline();
    }));
    bindManaChart();
    // Glossar
    const s = $('#kwSearch');
    const filterKw = () => {
      const q = norm(s.value);
      $$('#kwGrid .kw').forEach(k => { k.hidden = (q && !k.dataset.kw.includes(q)) || (basicsState.kwCat && k.dataset.cat !== basicsState.kwCat); });
    };
    s.oninput = filterKw;
    $('#kwCats').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      basicsState.kwCat = b.dataset.v;
      $$('#kwCats .chip').forEach(x => x.classList.toggle('on', x === b));
      filterKw();
    });
    root.addEventListener('click', e => {
      const j = e.target.closest('[data-jump]');
      if (j) { e.preventDefault(); document.getElementById(j.dataset.jump)?.scrollIntoView({ behavior: 'smooth' }); }
    });
  };

  // ---------- Modi & Tipps ----------
  const tipState = { mode: 0 };
  pages.tips = () => {
    const B = D.basics;
    const learned = store.get('learned', {});
    const done = (arr, key) => arr.filter((_, i) => learned[key + i]).length;
    const tipList = (arr, key) => `<ol class="tips-list">${arr.map((t, i) => `<li class="${learned[key + i] ? 'done' : ''}"><label class="check-tip"><input type="checkbox" data-learn="${key}${i}" ${learned[key + i] ? 'checked' : ''}><span>${linkify(t)}</span></label></li>`).join('')}</ol>`;
    const progress = (arr, key) => `<div class="progress" data-progress="${key}" data-total="${arr.length}"><div class="bar"><i style="width:${done(arr, key) / arr.length * 100}%"></i></div><span>${done(arr, key)}/${arr.length} verinnerlicht</span></div>`;
    const f2p = B.economy.find(e => /F2P/.test(e.title));
    const steps = f2p ? f2p.text.split(/\s*\d\)\s+/).filter(Boolean) : [];
    return `
    ${pageHero('Strategie', 'Modi &amp; Tipps', 'Regeln und Strategie für jeden Spielmodus, Tipps vom Einsteiger bis zum Profi und alles zu Währungen und Fortschritt.', 'img/site/GardenWorld_2v2.jpg')}
    <div class="wrap">
      <nav class="jump">
        <a href="#tips" data-jump="t-modes">${icon('layers')} Spielmodi</a><a href="#tips" data-jump="t-tips">${icon('check')} Tipps</a>
        <a href="#tips" data-jump="t-f2p">${icon('sparkles')} F2P-Leitfaden</a><a href="#tips" data-jump="t-eco">${icon('coin')} Währungen</a>
      </nav>
      <section class="section" id="t-modes">
        ${sectionHead('Spielmodi', 'Alle Modi im Überblick')}
        <div class="mode-pills" id="modePills">${D.modes.map((m, i) => `<button class="mode-pill ${i === tipState.mode ? 'on' : ''}" data-i="${i}">${icon(C.modeFacts[m.id]?.icon || 'swords')}<span>${esc(m.name.split('(')[0].trim())}</span></button>`).join('')}</div>
        <div id="modeBody"></div>
      </section>
      <section class="section" id="t-tips">
        <div class="grid grid-2" style="align-items:start">
          <div><span class="eyebrow">Für den Einstieg</span><h2>Einsteiger-Tipps</h2>${progress(B.beginner, 'b')}${tipList(B.beginner, 'b')}</div>
          <div><span class="eyebrow">Für Fortgeschrittene</span><h2>Profi-Tipps</h2>${progress(B.advanced, 'a')}${tipList(B.advanced, 'a')}</div>
        </div>
      </section>
      ${steps.length ? `<section class="section" id="t-f2p">
        ${sectionHead('Free to Play', 'Wofür du deine Ressourcen ausgibst')}
        <div class="steps">${steps.map((s, i) => `<div class="step"><span class="step-n">${i + 1}</span><p>${linkify(s)}</p></div>`).join('')}</div>
      </section>` : ''}
      <section class="section" id="t-eco">
        ${sectionHead('Fortschritt', 'Währungen &amp; Fortschritt')}
        <div class="eco-grid">${B.economy.filter(e => e !== f2p).map(e => { const ss = sentences(e.text); return `
          <article class="eco">
            <div class="eco-head"><span class="ico-badge">${icon(C.economyIcons[e.title] || 'coin')}</span><h3>${esc(e.title)}</h3></div>
            <p class="eco-lead">${linkify(ss[0] || '')}</p>
            ${ss.length > 1 ? `<ul class="bullets small">${ss.slice(1, 4).map(x => `<li>${linkify(x)}</li>`).join('')}</ul>` : ''}
            ${ss.length > 4 ? `<details class="more"><summary>Mehr</summary><div><ul class="bullets small">${ss.slice(4).map(x => `<li>${linkify(x)}</li>`).join('')}</ul></div></details>` : ''}
          </article>`; }).join('')}</div>
      </section>
    </div>`;
  };
  pages.tips.after = () => {
    const root = app.querySelector('.page');
    const renderMode = () => {
      const m = D.modes[tipState.mode];
      const mf = C.modeFacts[m.id] || { icon: 'swords', facts: [] };
      const decks = D.decks.filter(d => d.mode === m.id);
      const rk = RATE_KEY[m.id];
      $('#modeBody').innerHTML = `<article class="mode-detail">
        <header class="mode-detail-head">
          <span class="ico-badge lg">${icon(mf.icon)}</span>
          <div><h3>${esc(m.name)}</h3><div class="fact-chips">${mf.facts.map(f => `<span class="tag">${esc(f)}</span>`).join('')}</div></div>
        </header>
        <div class="mode-detail-body">
          <div>
            <h4 class="eyebrow">${icon('book')} Regeln</h4>${bulletList(m.rules)}
            ${m.rewards && m.rewards.length > 2 ? `<h4 class="eyebrow" style="margin-top:18px">${icon('gift')} Belohnungen</h4>${bulletList(m.rewards, 'small')}` : ''}
          </div>
          <div>
            <h4 class="eyebrow">${icon('sparkles')} Strategie</h4>
            <ul class="tip-cards">${m.tips.map(t => `<li>${icon('check')}<span>${linkify(t)}</span></li>`).join('')}</ul>
            ${rk ? `<h4 class="eyebrow" style="margin-top:18px">${icon('trophy')} Meistgespielte Karten</h4>
              <div class="mini-strip">${topCardsFor(rk, 6).map(([id, r]) => `<div class="strip-item">${mini(id)}<span>${Math.round(r[rk])} %</span></div>`).join('')}</div>` : ''}
            ${decks.length ? `<p style="margin:16px 0 0"><a class="btn btn-sm btn-gold" href="#meta" data-meta-mode="${m.id}">${icon('cards')} ${decks.length} Decks für diesen Modus</a></p>` : ''}
          </div>
        </div>
      </article>`;
    };
    $('#modePills').addEventListener('click', e => {
      const b = e.target.closest('.mode-pill'); if (!b) return;
      tipState.mode = +b.dataset.i;
      $$('#modePills .mode-pill').forEach(t => t.classList.toggle('on', t === b));
      renderMode();
    });
    root.addEventListener('change', e => {
      const k = e.target.dataset?.learn; if (!k) return;
      const l = store.get('learned', {}); l[k] = e.target.checked; store.set('learned', l);
      e.target.closest('li').classList.toggle('done', e.target.checked);
      const key = k[0], p = root.querySelector(`[data-progress="${key}"]`), total = +p.dataset.total;
      const n = Object.keys(l).filter(x => x[0] === key && l[x]).length;
      p.querySelector('i').style.width = n / total * 100 + '%';
      p.querySelector('span').textContent = `${n}/${total} verinnerlicht`;
    });
    root.addEventListener('click', e => {
      const j = e.target.closest('[data-jump]');
      if (j) { e.preventDefault(); document.getElementById(j.dataset.jump)?.scrollIntoView({ behavior: 'smooth' }); }
    });
    renderMode();
  };

  // ---------- Lore & Links ----------
  pages.lore = () => {
    const B = D.basics;
    const shots = ['ss1', 'ss2', 'ss3', 'ss4', 'ss5', 'ss6', 'ss7', 'ss8', 'Angled_combatScene', 'GardenWorld_2v2', 'DemonvsUndead'];
    const ls = sentences(B.lore);
    const paras = []; for (let i = 0; i < ls.length; i += 2) paras.push(ls.slice(i, i + 2).join(' '));
    const years = {};
    B.timeline.forEach(t => { const y = String(t.date).slice(0, 4); (years[y] = years[y] || []).push(t); });
    return `
    ${pageHero('Hintergrund', 'Lore, Geschichte &amp; Links', 'Die Welt hinter der Arena, zehn Jahre Entwicklungsgeschichte und alle wichtigen Anlaufstellen.', 'img/site/DemonvsUndead.jpg')}
    <div class="wrap">
      <section class="section">
        <div class="lore-grid">
          <div class="lore-text">${paras.map((p, i) => `<p class="${i ? '' : 'lead lore-lead'}">${linkify(p)}</p>`).join('')}</div>
          <figure class="lore-fig"><img src="img/site/ss6.jpg" alt="" data-zoom><img src="img/site/ss8.jpg" alt="" data-zoom></figure>
        </div>
      </section>
      <section class="section">
        ${sectionHead('Galerie', 'Screenshots', '<p class="small">Klick zum Vergrößern.</p>')}
        <div class="gallery">${shots.map(s => `<img src="img/site/${s}.jpg" alt="Screenshot" loading="lazy" data-zoom>`).join('')}</div>
      </section>
      <section class="section">
        <div class="grid grid-2" style="align-items:start">
          <div><span class="eyebrow">Zeitleiste</span><h2>Geschichte des Spiels</h2>
            <div class="year-tl">${Object.entries(years).map(([y, items]) => `<div class="year"><span class="year-badge">${esc(y)}</span>
              <div class="year-items">${items.map(t => `<div class="tl"><b>${esc(t.date)}</b><p>${linkify(t.event)}</p></div>`).join('')}</div></div>`).join('')}</div></div>
          <div><span class="eyebrow">Links</span><h2>Nützliche Links</h2>
            <div class="link-grid">${B.links.map(l => { let host = ''; try { host = new URL(l.url).hostname.replace('www.', ''); } catch { host = l.url; } return `<a class="link-card" href="${esc(l.url)}" target="_blank" rel="noopener">
              <span class="link-ico">${esc(host[0].toUpperCase())}</span><div><b>${esc(l.name)}</b><small>${esc(host)}</small></div></a>`; }).join('')}</div></div>
        </div>
      </section>
      <section class="section">
        <details class="more"><summary>Alle Quellen dieses Guides (${D.sources.length})</summary><div>
          <ul class="src-list">${D.sources.map(s => `<li>${rich(s.url)}${s.date ? ` <span>(${esc(s.date)})</span>` : ''}</li>`).join('')}</ul>
        </div></details>
      </section>
    </div>`;
  };

  // =========================================================
  //  Karten-Modal
  // =========================================================
  function openCard(id) {
    const c = CARD[id]; if (!c) return;
    const r = D.cardRates[id] || {};
    const [stats, effect] = c.text.includes(' — ') ? c.text.split(' — ') : (/[a-z]{4}/.test(c.text) && !/Ziele:|HP |Schaden/.test(c.text) ? ['', c.text] : [c.text, '']);
    const combos = D.combos.filter(k => k.cards.includes(id));
    const asThreat = D.counters.filter(k => k.threat === id);
    const asAnswer = D.counters.filter(k => k.answers.some(a => a === id || a?.group?.includes(id)));
    const max = Math.max(...Object.values(r), 1);
    const inDeck = deck.c.includes(id);
    modal(`<div class="card-detail" style="--rc:var(--${c.rarity})">
      <div><div class="big-art"><img src="${c.img}" alt="${esc(c.name)}"></div>
        <button class="btn btn-sm ${inDeck ? '' : 'btn-gold'}" style="width:100%;justify-content:center;margin-top:12px" data-builder-toggle="${id}">${inDeck ? '− Aus Deckbuilder entfernen' : '+ Zum Deckbuilder'}</button></div>
      <div>
        <div class="deck-meta" style="margin-bottom:8px">${tierBadge(c.tier)}<span class="tag" style="color:var(--${c.rarity})">${RARITY[c.rarity]}</span>${factionTag(c.faction)}<span class="tag">${TYPE[c.type]}</span></div>
        <h2 style="margin-bottom:4px">${esc(c.name)}</h2>
        <div class="kv">
          <div><small>Mana</small><b>${c.mana}</b></div>
          ${c.count ? `<div><small>Anzahl</small><b>${esc(c.count)}</b></div>` : ''}
          ${stats.split(' · ').filter(Boolean).map(s => { const m = s.match(/^(HP|Schaden|Ziele:?)\s*(.*)$/); return m ? `<div><small>${m[1].replace(':', '')}</small><b>${esc(m[2])}</b></div>` : ''; }).join('')}
        </div>
        ${stats.match(/max\.[^·]*/) ? `<p class="small warn">${esc(stats.match(/max\.[^·]*/)[0])}</p>` : ''}
        ${effect ? `<p class="muted">${esc(effect)}</p>` : ''}
        ${Object.keys(r).length ? `<h4 class="eyebrow" style="margin-top:16px">Spielrate in Leaderboard-Decks</h4>
          ${Object.entries(MODE).map(([k, v]) => `<div style="display:grid;grid-template-columns:110px 1fr 60px;gap:10px;align-items:center;margin:6px 0;font-size:13px"><span class="muted">${v}</span><div class="bar"><i style="width:${(r[k] || 0) / max * 100}%"></i></div><b>${pct(r[k] || 0)}</b></div>`).join('')}` : ''}
        ${deckUsage[id] ? `<p class="small dim">Steckt in ${deckUsage[id]} der Decks in diesem Guide.</p>` : ''}
      </div></div>
      ${combos.length ? `<h3 style="margin-top:22px">Kombos</h3><div class="grid grid-2">${combos.map(comboPanel).join('')}</div>` : ''}
      ${asThreat.length ? `<h3 style="margin-top:22px">So konterst du ${esc(c.name.split(',')[0])}</h3><div class="grid grid-2">${asThreat.map(counterPanel).join('')}</div>` : ''}
      ${asAnswer.length ? `<h3 style="margin-top:22px">Gute Antwort gegen</h3><div class="combo-cards">${asAnswer.map(k => mini(k.threat)).join('')}</div>` : ''}`);
  }
  function modal(html) {
    $('#modalBody').innerHTML = html;
    $('#modal').hidden = false;
    $('#modal .modal').scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() { $('#modal').hidden = true; document.body.style.overflow = ''; }

  // =========================================================
  //  Globale Suche
  // =========================================================
  const searchIndex = [
    ...D.cards.map(c => ({ t: c.name, s: `${TYPE[c.type]} · ${c.mana} Mana · ${c.faction} · Tier ${c.tier}`, img: c.img, go: () => openCard(c.id) })),
    ...D.masters.map(m => ({ t: m.name, s: 'Master · ' + m.title.split('(')[0], img: m.icon, go: () => { location.hash = 'master/' + m.id; } })),
    ...D.decks.map(d => ({ t: d.name, s: `Deck · ${MASTER[d.master]?.name || ''} · ${d.modeName.split('(')[0]}`, img: MASTER[d.master]?.icon, go: () => { metaState.tab = 'curated'; metaState.mode = d.mode; location.hash = 'meta'; route(); setTimeout(() => document.getElementById('deck-' + d.id)?.scrollIntoView({ behavior: 'smooth' }), 120); } })),
    ...D.combos.map(k => ({ t: k.name, s: 'Kombo', ico: '⚡', go: () => { comboState.q = k.name; location.hash = 'combos'; route(); } })),
    ...D.basics.keywords.map(k => ({ t: k.name, s: 'Glossar · ' + k.text.slice(0, 70), ico: 'Aa', go: () => { location.hash = 'basics'; route(); setTimeout(() => { const s = $('#kwSearch'); s.value = k.name.split(' ')[0]; s.dispatchEvent(new Event('input')); document.getElementById('glossar').scrollIntoView(); }, 80); } })),
  ];
  let sel = 0, results = [];
  function openSearch() {
    $('#searchOverlay').hidden = false;
    const i = $('#globalSearch'); i.value = ''; i.focus(); doSearch('');
  }
  function closeSearch() { $('#searchOverlay').hidden = true; }
  function doSearch(q) {
    const n = norm(q);
    results = n ? searchIndex.filter(x => norm(x.t).includes(n)).sort((a, b) => norm(a.t).indexOf(n) - norm(b.t).indexOf(n)).slice(0, 40) : searchIndex.filter(x => x.s.startsWith('Master')).slice(0, 14);
    sel = 0;
    $('#searchResults').innerHTML = results.map((r, i) => `<div class="sr ${i === sel ? 'sel' : ''}" data-i="${i}">
      ${r.img ? `<img src="${r.img}" alt="">` : `<span class="sr-ico">${r.ico || '•'}</span>`}<div><b>${esc(r.t)}</b><small>${esc(r.s)}</small></div></div>`).join('') || '<p class="empty">Nichts gefunden.</p>';
  }
  function pick(i) { const r = results[i]; if (!r) return; closeSearch(); r.go(); }

  // =========================================================
  //  Routing & globale Events
  // =========================================================
  function route() {
    const h = location.hash.slice(1) || 'home';
    const [name, arg] = h.split('/');
    const page = pages[name] ? name : 'home';
    app.innerHTML = `<div class="page">${pages[page](arg)}</div>`;
    pages[page].after?.(arg);
    $$('#nav a').forEach(a => a.classList.toggle('active', a.dataset.route === (page === 'master' ? 'masters' : page)));
    $('#nav').classList.remove('open');
    document.title = (page === 'home' ? '' : ($('h1', app)?.textContent + ' · ')) + 'Minion Masters Codex';
  }
  let lastHash = location.hash;
  window.addEventListener('hashchange', () => {
    closeModal();
    route();
    if (location.hash !== lastHash) window.scrollTo({ top: 0 });
    lastHash = location.hash;
  });

  document.addEventListener('click', e => {
    const t = e.target;
    const card = t.closest('[data-card]');
    if (card && !t.closest('[data-add],[data-remove]')) { e.preventDefault(); openCard(card.dataset.card); return; }
    const dt = t.closest('[data-dtab]');
    if (dt) { const art = dt.closest('article'); $$('[data-dtab]', art).forEach(b => b.classList.toggle('on', b === dt)); $$('[data-pane]', art).forEach(p => { p.hidden = p.dataset.pane !== dt.dataset.dtab; }); return; }
    const cp = t.closest('[data-copy-deck]'); if (cp) { copy(cp.dataset.copyDeck); return; }
    const tb = t.closest('[data-to-builder]');
    if (tb) { const d = JSON.parse(tb.dataset.toBuilder); deck = { m: d.m || deck.m, c: d.c.slice(0, 10), name: '' }; saveDeck(); location.hash = 'builder'; toast('Deck in den Deckbuilder geladen'); return; }
    const bt = t.closest('[data-builder-toggle]');
    if (bt) {
      const id = bt.dataset.builderToggle, i = deck.c.indexOf(id);
      if (i >= 0) deck.c.splice(i, 1); else if (deck.c.length < 10) deck.c.push(id); else { toast('Das Deck hat schon 10 Karten'); return; }
      saveDeck(); toast(i >= 0 ? 'Aus dem Deck entfernt' : `Zum Deck hinzugefügt (${deck.c.length}/10)`);
      openCard(id);
      if (location.hash === '#builder') route();
      return;
    }
    const fl = t.closest('[data-faction]'); if (fl) { cardState.faction = [fl.dataset.faction]; }
    const lm = t.closest('[data-lb-master]'); if (lm) { metaState.tab = 'lb'; metaState.lbMaster = lm.dataset.lbMaster; metaState.lbMode = D.lbDecks.find(d => d.master === lm.dataset.lbMaster)?.mode || '1v1'; }
    const mm = t.closest('[data-meta-mode]'); if (mm) { metaState.tab = 'curated'; metaState.mode = mm.dataset.metaMode; }
    const z = t.closest('[data-zoom]'); if (z) { modal(`<img class="img-zoom" src="${z.src}" alt="">`); return; }
    if (t === $('#modal')) closeModal();
    if (t === $('#searchOverlay')) closeSearch();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches?.('.ccard[data-card]')) openCard(e.target.dataset.card);
    if (!$('#searchOverlay').hidden) {
      if (e.key === 'Escape') closeSearch();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % Math.max(results.length, 1);
        $$('.sr').forEach((el, i) => el.classList.toggle('sel', i === sel));
        $$('.sr')[sel]?.scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter') pick(sel);
      return;
    }
    if (e.key === 'Escape') closeModal();
    if (e.key === '/' && !e.target.matches?.('input, textarea, select')) { e.preventDefault(); openSearch(); }
  });
  // Vorschau für Kartenlinks im Fließtext
  const peek = document.createElement('div');
  peek.className = 'peek'; peek.hidden = true; document.body.appendChild(peek);
  document.addEventListener('mouseover', e => {
    const l = e.target.closest?.('.clink');
    if (!l) { peek.hidden = true; return; }
    const c = CARD[l.dataset.card]; if (!c) return;
    peek.innerHTML = `<div class="r-${c.rarity}" style="--rc:var(--${c.rarity})"><img src="${c.img}" alt="">${manaGem(c.mana)}${tierBadge(c.tier)}<b>${esc(c.name)}</b><small>${TYPE[c.type]} · ${esc(c.faction)}</small></div>`;
    const r = l.getBoundingClientRect();
    peek.hidden = false;
    peek.style.left = Math.min(innerWidth - 190, Math.max(8, r.left + r.width / 2 - 90)) + 'px';
    peek.style.top = (r.top > 300 ? r.top - 262 : r.bottom + 8) + 'px';
  });
  window.addEventListener('scroll', () => { peek.hidden = true; }, { passive: true });
  $('#globalSearch').addEventListener('input', e => doSearch(e.target.value));
  $('#searchResults').addEventListener('click', e => { const r = e.target.closest('.sr'); if (r) pick(+r.dataset.i); });
  $('#searchBtn').onclick = openSearch;
  $('#modalClose').onclick = closeModal;
  $('#menuBtn').onclick = () => $('#nav').classList.toggle('open');
  $('#footStand').textContent = `Stand: ${D.built}, Patch ${(D.patch || '').split(' ')[0]}.`;

  route();
})();
