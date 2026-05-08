// ══════════════════════════════════════════════════
// THE SYSTEM — ui.js
// All rendering and UI update functions
// ══════════════════════════════════════════════════

// ── HTML ESCAPE (prevents XSS in all innerHTML renders) ───────────────
function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── TOAST ─────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3500);
}

// ── XP FLOAT ANIMATION ────────────────────────────
function showXPFloat(xp, x, y) {
  const el = document.getElementById('xpFloat');
  el.textContent = `+${xp} XP`;
  el.style.left = (x || window.innerWidth / 2) + 'px';
  el.style.top  = (y || window.innerHeight / 2) + 'px';
  el.className = 'xp-float show';
  el.style.animation = 'floatUp 1s ease forwards';
  setTimeout(() => { el.className = 'xp-float hidden'; el.style.animation = ''; }, 1000);
}

// ── PARTICLE BURST ────────────────────────────────
function spawnParticles(x, y, color = 'var(--blue)') {
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left:${x}px; top:${y}px;
      background:${color};
      --tx:${(Math.random()-0.5)*100}px;
      --ty:${(Math.random()-1)*80}px;
      position:fixed; z-index:9000;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}

// ── SCREEN FLASH ──────────────────────────────────
function screenFlash(color = 'var(--blue)') {
  const el = document.createElement('div');
  el.className = 'screen-flash';
  el.style.background = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

// ── UPDATE STATS UI ───────────────────────────────
function updateStatsUI(player) {
  if (!player) return;
  const lv = player.level;
  const needed = XP_PER_LEVEL(lv);
  const pct = Math.min(100, (player.xp / needed) * 100);
  const rank = getRankData(lv);

  // XP bar
  document.getElementById('xpFill').style.width = pct + '%';
  document.getElementById('xpText').textContent = `${player.xp} / ${needed} XP`;

  // Stats
  document.getElementById('sLv').textContent = lv;
  document.getElementById('sTXP').textContent = player.total_xp || 0;
  document.getElementById('sGold').textContent = player.gold;
  document.getElementById('sStreak').textContent = player.streak;
  document.getElementById('sShadow').textContent = player.shadow_count || 0;

  // Nav gold
  document.getElementById('navGoldAmt').textContent = player.gold;
  document.getElementById('shopGoldAmt').textContent = player.gold + ' G';

  // Rank badge
  const badge = document.getElementById('rankBadge');
  const rl = document.getElementById('rankLetter');
  rl.textContent = rank.rank === 'MONARCH' ? '👑' : rank.rank;
  badge.style.borderColor = rank.color;
  rl.style.color = rank.color;
  if (rank.rank === 'MONARCH') badge.style.boxShadow = `0 0 20px ${rank.color}40`;

  // Player info (textContent is safe; listed here for consistency)
  document.getElementById('playerName').textContent = player.name || 'PLAYER';
  document.getElementById('playerClass').textContent = getPlayerClass(lv);
  document.getElementById('playerTitle').textContent = getPlayerTitle(lv);

  // Attributes
  updateAttributes(player);

  // Alert (textContent — already safe)
  document.getElementById('alertText').textContent =
    `SYSTEM ALERT — ${player.name || 'Player'}, Rank ${rank.rank}, Level ${lv}. Continue your ascent.`;
}

function updateAttributes(player) {
  const attrs = ['str', 'agi', 'vit', 'int', 'per', 'sen'];
  attrs.forEach(a => {
    const val = player[a === 'int' ? 'int_stat' : a] || 1;
    const cap = Math.min(val, 100);
    document.getElementById('a' + a.charAt(0).toUpperCase() + a.slice(1)).style.width = cap + '%';
    document.getElementById('v' + a.charAt(0).toUpperCase() + a.slice(1)).textContent = val;
  });
}

// ── RANK PROGRESSION ──────────────────────────────
function renderRankProgression(currentLevel) {
  const container = document.getElementById('rankProgression');
  container.innerHTML = RANKS.map(r => {
    const isCurrent = currentLevel >= r.min && currentLevel <= r.max;
    const isPast = currentLevel > r.max;
    return `<div class="rp-cell ${isCurrent ? 'current' : ''}" style="${isCurrent ? `border-color:${r.color};box-shadow:0 0 12px ${r.color}30;` : ''} ${isPast ? 'opacity:.5;' : ''}">
      <div class="rp-letter" style="color:${r.color};">${r.rank}</div>
      <div class="rp-range">${r.min === r.max ? `Lv ${r.min}` : `Lv ${r.min}–${r.min > 90 ? '∞' : r.max}`}</div>
      ${isCurrent ? '<div style="font-size:8px;color:var(--cyan);font-family:var(--font-mono);margin-top:2px;">YOU</div>' : ''}
    </div>`;
  }).join('');
}

// ── QUESTS ────────────────────────────────────────
function renderAllQuests(quests) {
  const container = document.getElementById('questCategories');
  const cats = ['fitness','nutrition','mind','discipline','boss'];

  container.innerHTML = cats.map(cat => {
    const qs = quests.filter(q => q.category === cat);
    const done = qs.filter(q => q.completed).length;
    const meta = CAT_META[cat];

    return `
    <div class="quest-cat">
      <div class="quest-cat-header">
        <div class="quest-cat-name" style="color:${meta.color};">${meta.label}</div>
        <div class="sec-line"></div>
        <div class="sec-tag">${done}/${qs.length}</div>
      </div>
      <div class="quest-list">
        ${qs.map(q => renderQuestItem(q)).join('')}
      </div>
    </div>`;
  }).join('');

  renderDashboardQuests(quests);
}

function renderQuestItem(q) {
  const isBoss = q.category === 'boss';
  const cls = q.completed ? 'done' : q.failed ? 'failed' : '';
  const statLabel = q.stat_bonus ? `+${q.stat_bonus.toUpperCase()}` : '';

  return `
  <div class="qi ${q.category} ${cls} ${isBoss ? 'boss-pulse' : ''}" id="qi-${q.id}">
    <div class="qi-icon">${escapeHTML(q.icon)}</div>
    <div class="qi-info">
      <div class="qn">${escapeHTML(q.name)}</div>
      <div class="qm">${escapeHTML(q.category.toUpperCase())} · ${escapeHTML(q.difficulty.toUpperCase())} ${q.failed ? '· FAILED' : ''}</div>
    </div>
    <div class="qi-pills">
      <span class="pill px">+${q.xp_reward} XP</span>
      <span class="pill pg">+${q.gold_reward}G</span>
      ${statLabel ? `<span class="pill pa">${escapeHTML(statLabel)}</span>` : ''}
    </div>
    ${!q.completed && !q.failed ? `
    <div class="qi-acts">
      <button class="btn btn-green btn-sm" data-action="complete" data-id="${q.id}">✓</button>
      <button class="btn btn-red btn-sm" data-action="fail" data-id="${q.id}">✗</button>
    </div>` : q.completed
      ? `<div class="qi-done-check">✓</div>`
      : `<div class="qi-failed-label">FAILED</div>`}
  </div>`;
}

function renderDashboardQuests(quests) {
  const active = quests.filter(q => !q.completed && !q.failed).slice(0, 5);
  const done = quests.filter(q => q.completed).length;
  document.getElementById('dashQTag').textContent = `${done} / ${quests.length}`;
  const el = document.getElementById('dashQList');
  el.innerHTML = active.length
    ? active.map(q => renderQuestItem(q)).join('')
    : `<div style="padding:14px;font-size:13px;color:var(--muted);">
        ${done === quests.length && quests.length > 0
          ? '✦ All quests completed today. The System is pleased.'
          : 'Head to the Quests tab to see today\'s missions.'}
       </div>`;
}

// ── GATE HEADER ───────────────────────────────────
function renderGateHeader(player) {
  const rank = getRankData(player.level);
  document.getElementById('gateRank').textContent = rank.rank;
  document.getElementById('gateRank').style.color = rank.color;
  document.getElementById('gateDate').textContent = new Date().toLocaleDateString('en-IN', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  });
  startGateTimer();
}

let _gateInterval = null;
function startGateTimer() {
  function tick() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const el = document.getElementById('gateTimer');
    if (el) el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  tick();
  if (_gateInterval) clearInterval(_gateInterval);
  _gateInterval = setInterval(tick, 1000);
}

// ── SHADOWS ───────────────────────────────────────
function renderShadows(shadows, totalCount) {
  document.getElementById('shadowCount').textContent = totalCount || shadows.length;
  const grid = document.getElementById('shadowGrid');
  if (!shadows.length) {
    grid.innerHTML = `<div class="shadow-empty">
      <div class="se-icon">⬡</div>
      <div class="se-text">No shadows yet. Complete Boss Quests to extract your army.</div>
    </div>`;
    return;
  }
  grid.innerHTML = shadows.map(s => {
    const gradeClass = `grade-${s.grade.toLowerCase().replace(' ','')}`;
    return `<div class="shadow-card ${gradeClass}">
      <div class="shadow-icon">${s.icon}</div>
      <div class="shadow-name">${s.name}</div>
      <div class="shadow-grade">GRADE: ${s.grade}</div>
    </div>`;
  }).join('');
}

// ── SHADOWS ARISE MODAL ───────────────────────────
function showAriseModal(shadow) {
  document.getElementById('newShadowName').textContent = shadow.name;
  document.getElementById('newShadowGrade').textContent = `GRADE: ${shadow.grade}`;
  document.getElementById('ariseModal').classList.remove('hidden');
  spawnAriseParticles();
  screenFlash('rgba(155,109,255,.3)');
}

function spawnAriseParticles() {
  const container = document.getElementById('amParticles');
  container.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'arise-particle';
    p.style.cssText = `
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      --tx:${(Math.random()-0.5)*60}px;
      --ty:${-(Math.random()*60+20)}px;
      animation-delay:${Math.random()*2}s;
      animation-duration:${1.5+Math.random()}s;
    `;
    container.appendChild(p);
  }
}

// ── LEVEL UP MODAL ────────────────────────────────
function showLevelUpModal(newLevel, prevRank, newRank) {
  const modal = document.getElementById('levelUpModal');
  const rankData = getRankData(newLevel);
  document.getElementById('luRank').textContent = newLevel;
  document.getElementById('luRank').style.color = rankData.color;
  document.getElementById('luSub').textContent = `You have reached Level ${newLevel}`;
  if (prevRank && newRank && prevRank !== newRank) {
    document.getElementById('luRankChange').textContent =
      `RANK UP: ${prevRank} → ${newRank}`;
  } else {
    document.getElementById('luRankChange').textContent = '';
  }
  modal.classList.remove('hidden');
  screenFlash(rankData.color + '40');
}

// ── HABITS ────────────────────────────────────────
function renderHabits(habits) {
  const el = document.getElementById('habitList');
  const today = new Date().toISOString().split('T')[0];
  if (!habits.length) {
    el.innerHTML = '<div style="padding:14px;font-size:13px;color:var(--muted);">No habits yet. Add your first above.</div>';
    return;
  }
  el.innerHTML = habits.map(h => {
    const done = h.last_done === today;
    return `<div class="qi discipline ${done ? 'done' : ''}">
      <div class="qi-icon">${done ? '✅' : '⬜'}</div>
      <div class="qi-info">
        <div class="qn">${escapeHTML(h.name)}</div>
        <div class="habit-meta">
          🔥 ${h.streak || 0} day streak · +${h.xp_per_day} XP/day · ${h.stat_bonus ? '→ ' + h.stat_bonus.toUpperCase() : ''}
        </div>
      </div>
      <div class="qi-acts">
        ${!done
          ? `<button class="btn btn-green btn-sm" data-action="done-habit" data-id="${h.id}">DONE</button>`
          : `<span class="habit-complete-label">COMPLETE</span>`}
        <button class="btn btn-red btn-sm" data-action="delete-habit" data-id="${h.id}" title="Delete habit">✕</button>
      </div>
    </div>`;
  }).join('');
}

function renderHeatmap(heatmap) {
  const grid = document.getElementById('heatmap');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const labels = document.getElementById('heatLabels');
  labels.innerHTML = months.map(m => `<div class="heat-lbl">${m}</div>`).join('');
  const arr = heatmap || new Array(84).fill(0);
  grid.innerHTML = arr.map((v, i) =>
    `<div class="hc l${Math.min(v,4)}" style="animation-delay:${i*8}ms;" title="Activity level: ${v}"></div>`
  ).join('');
}

// ── SHOP ──────────────────────────────────────────
function renderShop(gold, customRewards) {
  document.getElementById('shopGoldAmt').textContent = (gold || 0) + ' G';
  const grid = document.getElementById('shopGrid');
  grid.innerHTML = DEFAULT_REWARDS.map(r => {
    const canAfford = gold >= r.cost;
    return `<div class="sc ${!canAfford ? 'locked' : ''}" data-action="buy-reward" data-id="${r.id}">
      <div class="sc-icon">${r.icon}</div>
      <div class="sc-name">${r.name}</div>
      <div class="sc-cost">${r.cost} Gold</div>
      <div class="sc-desc">${r.desc}</div>
    </div>`;
  }).join('');

  const cgrid = document.getElementById('customShopGrid');
  if (!customRewards?.length) {
    cgrid.innerHTML = '<div class="empty-hint">Add a custom reward above.</div>';
  } else {
    cgrid.innerHTML = customRewards.map(r => {
      const canAfford = gold >= r.cost;
      // Only pass numeric ID via data attribute — buyCustomReward looks up data locally (prevents XSS)
      return `<div class="sc ${!canAfford ? 'locked' : ''}" data-action="buy-custom" data-id="${r.id}">
        <div class="sc-icon">${escapeHTML(r.icon || '🎁')}</div>
        <div class="sc-name">${escapeHTML(r.name)}</div>
        <div class="sc-cost">${r.cost} Gold</div>
        <button class="btn btn-red btn-sm" style="margin-top:8px;" data-action="remove-custom" data-id="${r.id}">REMOVE</button>
      </div>`;
    }).join('');
  }
}

// ── AWAKENING ─────────────────────────────────────
function renderAwakening(player) {
  document.getElementById('visionTA').value = player.vision || '';
  document.getElementById('antiVisionTA').value = player.anti_vision || '';
}

// ── LOGIN BONUS ───────────────────────────────────
function checkLoginBonus(player) {
  const today = new Date().toISOString().split('T')[0];
  const bonusEl = document.getElementById('loginBonus');
  if (player.last_login !== today) {
    bonusEl.classList.remove('hidden');
    const streak = player.streak || 0;
    const xpBonus = 50 + Math.min(streak, 14) * 5;
    const goldBonus = 10 + Math.floor(streak / 7) * 5;
    document.getElementById('bonusSub').textContent =
      `Streak: ${streak} days | Claim +${xpBonus} XP, +${goldBonus} Gold`;
  } else {
    bonusEl.classList.add('hidden');
  }
}

// ── BOTTOM NAV (mobile) ───────────────────────────
function renderBottomNav() {
  const existing = document.getElementById('bottomNav');
  if (existing) return;
  const nav = document.createElement('nav');
  nav.id = 'bottomNav';
  nav.className = 'bottom-nav';
  const items = [
    {panel:'dashboard', icon:'🧍', label:'Status'},
    {panel:'quests',    icon:'⚔',  label:'Quests'},
    {panel:'shadows',   icon:'👥', label:'Shadows'},
    {panel:'habits',    icon:'🔁', label:'Habits'},
    {panel:'shop',      icon:'🏪', label:'Shop'},
    {panel:'awakening', icon:'🌌', label:'Awaken'},
  ];
  nav.innerHTML = items.map(i =>
    `<button class="bottom-nav-btn" data-panel="${i.panel}">
      <span class="bn-icon">${i.icon}</span>
      <span>${i.label}</span>
    </button>`
  ).join('');
  document.body.appendChild(nav);
}

function updateBottomNav(panelId) {
  document.querySelectorAll('.bottom-nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.panel === panelId);
  });
}

// ── PANEL SWITCH ──────────────────────────────────
function activatePanel(panelId) {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + panelId).classList.remove('hidden');
  document.querySelector(`.nav-btn[data-panel="${panelId}"]`)?.classList.add('active');
  updateBottomNav(panelId);
}
