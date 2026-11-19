// Leonida Trophy Atlas: checklist, filters, spoiler mode, export/import.
// All state lives in localStorage under keys of our own; the app fetches only
// data/trophies.json from its own folder and makes no network request at run time.
const EARNED_KEY = 'leonida-atlas-earned-v1';
const SPOILER_KEY = 'leonida-atlas-spoiler-v1';
const KIND_KEY = 'leonida-atlas-kind-v1';

const KIND_LABELS = [
  ['all', 'All 55'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectibles', 'Collectibles'],
  ['activities', 'Activities'],
  ['completion', 'Platinum & 100%'],
  ['online', 'Online'],
];
const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

const listEl = document.getElementById('trophyList');
const stagesEl = document.getElementById('stages');
const statsEl = document.getElementById('stats');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const spoilerEl = document.getElementById('spoiler');
const kindFiltersEl = document.getElementById('kindFilters');
const filterNoteEl = document.getElementById('filterNote');
const emptyEl = document.getElementById('emptyState');
const emptyTextEl = document.getElementById('emptyText');

const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const roadmap = data.roadmap;

let earned = new Set(loadJson(EARNED_KEY, []));
let spoilerOn = localStorage.getItem(SPOILER_KEY) === '1';
let kindFilter = localStorage.getItem(KIND_KEY) || 'all';
if (!KIND_LABELS.some(([k]) => k === kindFilter)) kindFilter = 'all';

function loadJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null');
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort()));
}
function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0');
}
function saveKind() {
  localStorage.setItem(KIND_KEY, kindFilter);
}
function isEarned(t) {
  return earned.has(t.name);
}
function isSpoilerHidden(t) {
  return spoilerOn && t.kinds.includes('story') && !isEarned(t);
}
function gradeCounts() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (isEarned(t)) counts[t.grade] += 1;
  return counts;
}

function renderStats() {
  const total = trophies.length;
  const hidden = trophies.filter((t) => t.hidden).length;
  statsEl.innerHTML = '';
  const chips = [
    `<span class="stat"><b>${total}</b> trophies</span>`,
    `<span class="stat"><span class="dot-platinum">&#9679;</span> 1 platinum</span>`,
    `<span class="stat"><span class="dot-gold">&#9679;</span> 2 gold</span>`,
    `<span class="stat"><span class="dot-silver">&#9679;</span> 6 silver</span>`,
    `<span class="stat"><span class="dot-bronze">&#9679;</span> 46 bronze</span>`,
    `<span class="stat"><b>${hidden}</b> hidden</span>`,
    `<span class="stat"><b>0</b> online</span>`,
    `<span class="stat"><b>1</b> missable</span>`,
  ];
  for (const html of chips) {
    const span = document.createElement('span');
    span.innerHTML = html;
    statsEl.append(span.firstChild);
  }
}

function renderProgress() {
  const n = earned.size;
  const pct = Math.round((n / trophies.length) * 100);
  document.getElementById('progressText').textContent = `${n} of ${trophies.length} earned`;
  document.getElementById('progressPct').textContent = `${pct}% to the platinum`;
  const fill = document.getElementById('progressFill');
  fill.style.width = `${pct}%`;
  const bar = document.getElementById('progressBar');
  bar.setAttribute('aria-valuenow', String(n));
  const c = gradeCounts();
  document.getElementById('progressNote').textContent =
    `Earned so far: ${c.platinum} platinum, ${c.gold} gold, ${c.silver} silver, ${c.bronze} bronze.` +
    (n === trophies.length ? ' Leonida Legend: the platinum is yours.' : ' Tick a trophy off and it stays ticked, even after you close the browser.');
}

function renderRoadmap() {
  stagesEl.innerHTML = '';
  for (const stage of roadmap) {
    const names = trophies
      .filter((t) => t.stage === stage.stage)
      .map((t) => t.name);
    const li = document.createElement('li');
    li.className = 'stage';
    const h = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = stage.stage;
    h.append(num, document.createTextNode(` ${stage.title} `));
    const time = document.createElement('span');
    time.className = 'stage-time';
    time.textContent = stage.time;
    h.append(time);
    const p = document.createElement('p');
    p.textContent = stage.text;
    const covers = document.createElement('p');
    covers.className = 'stage-trophies';
    covers.innerHTML = `<b>${names.length} trophies:</b> `;
    covers.append(document.createTextNode(names.join(', ')));
    li.append(h, p, covers);
    stagesEl.append(li);
  }
}

function renderKindFilters() {
  kindFiltersEl.innerHTML = '';
  for (const [key, label] of KIND_LABELS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'kind-btn';
    btn.textContent = label;
    btn.setAttribute('aria-pressed', String(kindFilter === key));
    btn.addEventListener('click', () => {
      kindFilter = key;
      saveKind();
      renderKindFilters();
      renderList();
    });
    kindFiltersEl.append(btn);
  }
}

function matchesFilters(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (kindFilter === 'online') return false;
  if (kindFilter !== 'all' && !t.kinds.includes(kindFilter)) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${t.kinds.join(' ')}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function trophyCard(t) {
  const li = document.createElement('li');
  li.className = 'trophy' + (isEarned(t) ? ' earned' : '');
  li.dataset.name = t.name;

  const checkWrap = document.createElement('div');
  checkWrap.className = 'trophy-check';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(t);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.name);
    else earned.delete(t.name);
    saveEarned();
    renderProgress();
    renderList();
  });
  checkWrap.append(box);

  const body = document.createElement('div');
  body.className = 'trophy-body';
  const head = document.createElement('div');
  head.className = 'trophy-head';
  const name = document.createElement('h3');
  name.className = 'trophy-name';
  const badge = document.createElement('span');
  badge.className = `grade-badge grade-${t.grade}`;
  badge.textContent = GRADE_LABELS[t.grade];
  if (isSpoilerHidden(t)) {
    name.textContent = 'Hidden trophy';
    name.classList.add('spoiler-mask');
  } else {
    name.textContent = t.name;
  }
  head.append(name, badge);
  if (t.hidden) {
    const tag = document.createElement('span');
    tag.className = 'tag tag-hidden';
    tag.textContent = 'Hidden on PS5';
    head.append(tag);
  }
  if (t.missable) {
    const tag = document.createElement('span');
    tag.className = 'tag tag-missable';
    tag.textContent = 'Potentially missable';
    head.append(tag);
  }
  for (const kind of t.kinds) {
    if (kind === 'missable') continue;
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = KIND_LABELS.find(([k]) => k === kind)?.[1] ?? kind;
    head.append(tag);
  }
  body.append(head);

  if (isSpoilerHidden(t)) {
    const mask = document.createElement('p');
    mask.className = 'trophy-desc spoiler-mask';
    mask.textContent = 'Story trophy: its name, description and guide stay hidden until you earn it. Untick “Hide story spoilers” to see it, or tick it earned to reveal it.';
    body.append(mask);
  } else {
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = `“${t.description}”`;
    body.append(desc);
    if (typeof t.count === 'number') {
      const count = document.createElement('p');
      count.className = 'trophy-count';
      count.textContent = t.count >= 1000 ? `Target: $${t.count.toLocaleString('en-US')}` : `Target: ${t.count}`;
      body.append(count);
    }
    if (t.missable && t.missable_note) {
      const warn = document.createElement('p');
      warn.className = 'trophy-guide';
      warn.innerHTML = '<b>Missable warning:</b> ';
      warn.append(document.createTextNode(t.missable_note));
      body.append(warn);
    }
    const guide = document.createElement('p');
    guide.className = 'trophy-guide';
    guide.innerHTML = '<b>Guide:</b> ';
    guide.append(document.createTextNode(t.guide));
    body.append(guide);
    const sources = document.createElement('p');
    sources.className = 'trophy-sources';
    sources.textContent = 'Sources: ';
    for (const s of t.sources) {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.name;
      sources.append(a);
    }
    body.append(sources);
    const stage = document.createElement('p');
    stage.className = 'trophy-stage';
    stage.textContent = `Roadmap stage ${t.stage}: ${roadmap[t.stage - 1].title}`;
    body.append(stage);
  }

  li.append(checkWrap, body);
  return li;
}

function renderList() {
  const shown = trophies.filter(matchesFilters);
  listEl.replaceChildren(...shown.map(trophyCard));
  document.getElementById('listHeading').textContent =
    kindFilter === 'all' && !searchEl.value.trim() && gradeEl.value === 'all'
      ? `The 55 trophies`
      : `Showing ${shown.length} of 55 trophies`;
  emptyEl.hidden = shown.length !== 0;
  if (shown.length === 0) {
    emptyTextEl.textContent =
      kindFilter === 'online'
        ? 'There are no online trophies in GTA 6: all 55 are single-player, and none needs PlayStation Plus or an online mode. (PowerPyx roadmap.)'
        : 'Try a different kind, grade or search word, or clear the search box.';
  }
  const earnedShown = shown.filter(isEarned).length;
  filterNoteEl.textContent =
    kindFilter === 'online'
      ? 'Online filter: no trophies here, by design. Every trophy in the game is single-player.'
      : `Showing ${shown.length} trophies, ${earnedShown} of them earned. ` +
        (spoilerOn
          ? 'Spoiler mode is on: story trophies you have not earned yet are masked.'
          : 'Spoiler mode is off: story trophy names and guides are visible.');
}

function exportProgress() {
  const payload = {
    app: 'Leonida Trophy Atlas — GTA VI',
    exported: new Date().toISOString(),
    earned: [...earned].sort(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importProgress(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const known = new Set(trophies.map((t) => t.name));
    const good = names.filter((n) => typeof n === 'string' && known.has(n));
    earned = new Set(good);
    saveEarned();
    renderProgress();
    renderList();
    filterNoteEl.textContent = `Imported ${good.length} earned trophies` +
      (names.length !== good.length ? ` (${names.length - good.length} names were not in the list and were skipped).` : '.');
  } catch {
    filterNoteEl.textContent = 'That file could not be imported: it is not a progress file from this atlas.';
  }
}

document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) importProgress(file);
  e.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  earned = new Set();
  saveEarned();
  renderProgress();
  renderList();
});
spoilerEl.checked = spoilerOn;
spoilerEl.addEventListener('change', () => {
  spoilerOn = spoilerEl.checked;
  saveSpoiler();
  renderList();
});
searchEl.addEventListener('input', renderList);
gradeEl.addEventListener('change', renderList);

renderStats();
renderRoadmap();
renderKindFilters();
renderProgress();
renderList();
