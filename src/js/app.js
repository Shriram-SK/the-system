// ══════════════════════════════════════════════════
// THE SYSTEM — app.js
// Main application logic, event wiring, state mgmt
// ══════════════════════════════════════════════════

const APP = (() => {
  let currentUser = null;
  let player = null;
  let todayQuests = [];
  let habits = [];
  let shadows = [];
  let customRewards = [];
  let pendingPenaltyQuestId = null;

  // ── INIT ────────────────────────────────────────
  async function init() {
    const client = initSupabase();

    if (!client) {
      console.error('Supabase failed to initialize');
      return;
    }
    
    await bootSequence();

    // Auth state listener
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        currentUser = session.user;
        await loadApp();
      } else {
        currentUser = null;
        showAuthScreen();
      }
    });

    // Offline detection
    window.addEventListener('offline', () => document.body.classList.add('offline'));
    window.addEventListener('online', () => document.body.classList.remove('offline'));
  }

  // ── BOOT SEQUENCE ────────────────────────────────
  async function bootSequence() {
    const bar = document.getElementById('loadBar');
    const sub = document.getElementById('loadSub');
    const steps = [
      [20, 'Initializing System...'],
      [45, 'Connecting to database...'],
      [70, 'Loading player data...'],
      [90, 'Preparing quests...'],
      [100, 'System ready.'],
    ];
    for (const [pct, msg] of steps) {
      bar.style.width = pct + '%';
      sub.textContent = msg;
      await delay(350);
    }
    await delay(300);
    document.getElementById('loadingScreen').classList.add('hidden');
  }

  // ── APP LOAD ─────────────────────────────────────
  async function loadApp() {
    try {
      player = await getPlayer(currentUser.id);
    } catch {
      // New user - profile auto-created by Supabase trigger
      player = await upsertPlayer(currentUser.id, {
        name: currentUser.user_metadata?.full_name || 'Player',
      });
    }

    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');

    renderBottomNav();
    updateStatsUI(player);
    renderRankProgression(player.level);
    checkLoginBonus(player);

    // Load all data in parallel
    const [quests, h, s, cr] = await Promise.all([
      getTodayQuests(currentUser.id),
      getHabits(currentUser.id),
      getShadows(currentUser.id),
      getCustomRewards(currentUser.id),
    ]);

    todayQuests = quests;
    habits = h;
    shadows = s;
    customRewards = cr;

    // Auto-generate quests if none exist today
    if (!todayQuests.length) {
      const generated = generateDailyQuests();
      todayQuests = await insertQuests(currentUser.id, generated);
      await updatePlayer(currentUser.id, { last_quest_date: today() });
    }

    renderAllQuests(todayQuests);
    renderGateHeader(player);
    renderShadows(shadows, player.shadow_count);
    renderHabits(habits);
    renderHeatmap(player.heatmap);
    renderShop(player.gold, customRewards);
    renderAwakening(player);

    wireEvents();
  }

  // ── WIRE EVENTS ──────────────────────────────────
  function wireEvents() {
    // Auth
    document.getElementById('googleSignIn').onclick = async () => {
      try { await signInWithGoogle(); }
      catch(e) { setAuthMsg(e.message, true); }
    };
    document.getElementById('emailSignIn').onclick = async () => {
      const email = document.getElementById('authEmail').value.trim();
      const pass  = document.getElementById('authPassword').value;
      try {
        await signInWithEmail(email, pass);
      } catch(e) { setAuthMsg(e.message, true); }
    };
    document.getElementById('emailSignUp').onclick = async () => {
      const email = document.getElementById('authEmail').value.trim();
      const pass  = document.getElementById('authPassword').value;
      try {
        await signUpWithEmail(email, pass);
        setAuthMsg('Check your email to confirm your account.', false);
      } catch(e) { setAuthMsg(e.message, true); }
    };
    document.getElementById('signOutBtn').onclick = async () => {
      await signOut();
      document.getElementById('mainApp').classList.add('hidden');
      document.getElementById('authScreen').classList.remove('hidden');
    };

    // Login bonus
    document.getElementById('claimBtn').onclick = claimLoginBonus;

    // Nav buttons
    document.querySelectorAll('.nav-btn[data-panel]').forEach(btn => {
      btn.onclick = () => switchPanel(btn.dataset.panel);
    });

    // Habit add
    document.getElementById('addHabitBtn').onclick = addHabit;

    // Reward add
    document.getElementById('addRewardBtn').onclick = addCustomRewardUI;

    // Vision save
    document.getElementById('saveVisionBtn').onclick = saveVision;
    document.getElementById('saveAntiBtn').onclick = saveAntiVision;

    // Penalty modal
    document.getElementById('acceptPenalty').onclick = acceptPenalty;

    // Level up modal
    document.getElementById('closeLevelUp').onclick = () => {
      document.getElementById('levelUpModal').classList.add('hidden');
    };

    // Arise modal
    document.getElementById('closeAriseModal').onclick = () => {
      document.getElementById('ariseModal').classList.add('hidden');
    };
  }

  // ── PANEL SWITCH ─────────────────────────────────
  function switchPanel(panelId) {
    activatePanel(panelId);
    if (panelId === 'quests') renderAllQuests(todayQuests);
    if (panelId === 'shadows') renderShadows(shadows, player.shadow_count);
    if (panelId === 'habits') renderHabits(habits);
    if (panelId === 'shop') renderShop(player.gold, customRewards);
    if (panelId === 'awakening') renderAwakening(player);
  }

  // ── LOGIN BONUS ──────────────────────────────────
  async function claimLoginBonus() {
    const todayStr = today();
    const prevStreak = player.streak || 0;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = player.last_login === yesterday ? prevStreak + 1 : 1;
    const xpBonus = 50 + Math.min(newStreak - 1, 14) * 5;
    const goldBonus = 10 + Math.floor(newStreak / 7) * 5;

    player = await updatePlayer(currentUser.id, {
      last_login: todayStr,
      streak: newStreak,
      xp: player.xp + xpBonus,
      total_xp: player.total_xp + xpBonus,
      gold: player.gold + goldBonus,
    });

    bumpHeatmap();
    player = await updatePlayer(currentUser.id, { heatmap: player.heatmap });

    document.getElementById('loginBonus').classList.add('hidden');
    showToast(`✦ LOGIN BONUS — +${xpBonus} XP, +${goldBonus} Gold | Streak: ${newStreak} days 🔥`, 'gold');
    updateStatsUI(player);
    checkLevelUp(player.xp - xpBonus, player.xp);
  }

  // ── QUEST COMPLETE ───────────────────────────────
  async function completeQuest(questId, event) {
    const q = todayQuests.find(x => x.id === questId);
    if (!q || q.completed || q.failed) return;

    // Optimistic UI update
    q.completed = true;
    renderAllQuests(todayQuests);

    // Particle burst at click point
    if (event) spawnParticles(event.clientX, event.clientY, 'var(--green)');
    showXPFloat(q.xp_reward, event?.clientX, event?.clientY);

    // DB update
    await completeQuestDB(questId);

    // Build player updates
    const prevLevel = player.level;
    const prevRank = getRankData(prevLevel).rank;
    let newXP = player.xp + q.xp_reward;
    let newLevel = player.level;

    // Level up loop
    while (newXP >= XP_PER_LEVEL(newLevel)) {
      newXP -= XP_PER_LEVEL(newLevel);
      newLevel++;
    }

    // Stat boost
    const statKey = q.stat_bonus === 'int' ? 'int_stat' : q.stat_bonus;
    const statUpdates = statKey ? { [statKey]: (player[statKey] || 1) + 1 } : {};

    // Heatmap
    bumpHeatmap();

    player = await updatePlayer(currentUser.id, {
      xp: newXP,
      total_xp: player.total_xp + q.xp_reward,
      gold: player.gold + q.gold_reward,
      level: newLevel,
      heatmap: player.heatmap,
      ...statUpdates,
    });

    updateStatsUI(player);
    renderShop(player.gold, customRewards);
    showToast(`✦ QUEST COMPLETE — +${q.xp_reward} XP, +${q.gold_reward} Gold`, 'gold');

    // Level up event
    if (newLevel > prevLevel) {
      const newRank = getRankData(newLevel).rank;
      showLevelUpModal(newLevel, prevRank, newRank);
      screenFlash(getRankData(newLevel).color + '30');
    }

    // Boss quest = extract shadow
    if (q.category === 'boss') {
      await extractShadow();
    }
  }

  // ── QUEST FAIL ───────────────────────────────────
  async function failQuest(questId) {
    const q = todayQuests.find(x => x.id === questId);
    if (!q || q.completed || q.failed) return;
    pendingPenaltyQuestId = questId;
    const penalty = Math.floor(q.xp_reward * 0.3);
    document.getElementById('penaltyMsg').textContent =
      `You abandoned "${q.name}". The System penalizes weakness. -${penalty} XP will be deducted.`;
    document.getElementById('penaltyModal').classList.remove('hidden');
  }

  async function acceptPenalty() {
    document.getElementById('penaltyModal').classList.add('hidden');
    if (!pendingPenaltyQuestId) return;
    const q = todayQuests.find(x => x.id === pendingPenaltyQuestId);
    if (!q) return;
    const penalty = Math.floor(q.xp_reward * 0.3);
    q.failed = true;
    await failQuestDB(pendingPenaltyQuestId);
    player = await updatePlayer(currentUser.id, {
      xp: Math.max(0, player.xp - penalty),
      total_xp: Math.max(0, player.total_xp - penalty),
    });
    updateStatsUI(player);
    renderAllQuests(todayQuests);
    showToast(`💀 PENALTY — -${penalty} XP. Do not fail again.`, 'pen');
    pendingPenaltyQuestId = null;
  }

  // ── SHADOW EXTRACTION ────────────────────────────
  async function extractShadow() {
    // Pick a shadow from pool that isn't already owned
    const ownedNames = shadows.map(s => s.name);
    const available = SHADOW_POOL.filter(s => !ownedNames.includes(s.name));
    const pool = available.length ? available : SHADOW_POOL;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    const newShadow = await insertShadow(currentUser.id, chosen);
    shadows.unshift(newShadow);

    player = await updatePlayer(currentUser.id, {
      shadow_count: (player.shadow_count || 0) + 1,
    });

    showAriseModal(chosen);
    updateStatsUI(player);
    renderShadows(shadows, player.shadow_count);
  }

  // ── HABITS ───────────────────────────────────────
  async function addHabit() {
    const name = document.getElementById('habitName').value.trim();
    const val = document.getElementById('habitXP').value; // "20,int"
    if (!name) return;
    const [xp, stat] = val.split(',');
    const h = await insertHabit(currentUser.id, name, parseInt(xp), stat);
    habits.push(h);
    document.getElementById('habitName').value = '';
    renderHabits(habits);
    showToast(`🔁 Habit "${name}" added to the System.`);
  }

  async function doneHabit(habitId) {
    const h = habits.find(x => x.id === habitId);
    if (!h) return;
    const todayStr = today();
    if (h.last_done === todayStr) { showToast('Already done today.'); return; }
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = h.last_done === yesterday ? h.streak + 1 : 1;

    const updated = await updateHabit(habitId, { last_done: todayStr, streak: newStreak });
    Object.assign(h, updated);

    // Stat bump
    const statKey = h.stat_bonus === 'int' ? 'int_stat' : h.stat_bonus;
    const statUpdates = statKey ? { [statKey]: (player[statKey] || 1) + 1 } : {};

    bumpHeatmap();
    player = await updatePlayer(currentUser.id, {
      xp: player.xp + h.xp_per_day,
      total_xp: player.total_xp + h.xp_per_day,
      gold: player.gold + Math.floor(h.xp_per_day / 4),
      heatmap: player.heatmap,
      ...statUpdates,
    });

    updateStatsUI(player);
    renderHabits(habits);
    renderHeatmap(player.heatmap);
    showToast(`🔁 Habit done! +${h.xp_per_day} XP | Streak: ${newStreak} 🔥`, 'ok');
  }

  async function deleteHabitUI(habitId) {
    await deleteHabit(habitId);
    habits = habits.filter(h => h.id !== habitId);
    renderHabits(habits);
  }

  // ── SHOP ─────────────────────────────────────────
  async function buyReward(id, name, cost, icon) {
    if (player.gold < cost) { showToast('Not enough Gold.', 'pen'); return; }
    player = await updatePlayer(currentUser.id, { gold: player.gold - cost });
    await logPurchase(currentUser.id, name, cost);
    updateStatsUI(player);
    renderShop(player.gold, customRewards);
    showToast(`${icon} Reward unlocked: "${name}". Enjoy it, Player.`, 'gold');
  }

  async function buyCustomReward(id, name, cost, icon) {
    if (player.gold < cost) { showToast('Not enough Gold.', 'pen'); return; }
    player = await updatePlayer(currentUser.id, { gold: player.gold - cost });
    await logPurchase(currentUser.id, name, cost);
    updateStatsUI(player);
    renderShop(player.gold, customRewards);
    showToast(`${icon} Reward: "${name}" redeemed.`, 'gold');
  }

  async function addCustomRewardUI() {
    const name = document.getElementById('rName').value.trim();
    const cost = parseInt(document.getElementById('rCost').value) || 0;
    const icon = document.getElementById('rIcon').value.trim() || '🎁';
    if (!name || !cost) { showToast('Enter name and cost.'); return; }
    const r = await insertCustomReward(currentUser.id, name, icon, cost);
    customRewards.push(r);
    document.getElementById('rName').value = '';
    document.getElementById('rCost').value = '';
    document.getElementById('rIcon').value = '';
    renderShop(player.gold, customRewards);
    showToast(`🎁 Custom reward "${name}" added.`, 'gold');
  }

  async function deleteCustomRewardUI(id) {
    await deleteCustomReward(id);
    customRewards = customRewards.filter(r => r.id !== id);
    renderShop(player.gold, customRewards);
  }

  // ── VISION ───────────────────────────────────────
  async function saveVision() {
    const v = document.getElementById('visionTA').value;
    player = await updatePlayer(currentUser.id, { vision: v });
    showToast('🌟 Vision saved. Let it burn inside you.', 'ok');
  }

  async function saveAntiVision() {
    const v = document.getElementById('antiVisionTA').value;
    player = await updatePlayer(currentUser.id, { anti_vision: v });
    showToast('💀 Anti-Vision saved. Remember this on your weakest days.', 'pen');
  }

  // ── AUTH SCREEN ──────────────────────────────────
  function showAuthScreen() {
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
  }

  function setAuthMsg(msg, isErr) {
    const el = document.getElementById('authMsg');
    el.textContent = msg;
    el.className = 'auth-note ' + (isErr ? 'err' : 'ok');
  }

  // ── HEATMAP BUMP ─────────────────────────────────
  function bumpHeatmap() {
    if (!player.heatmap) player.heatmap = new Array(84).fill(0);
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const idx = Math.min(dayOfYear % 84, 83);
    player.heatmap[idx] = Math.min(4, (player.heatmap[idx] || 0) + 1);
  }

  // ── LEVEL UP CHECK ───────────────────────────────
  function checkLevelUp(prevXP, newXP) {
    // Simple check — proper check happens in completeQuest
  }

  // ── UTILS ────────────────────────────────────────
  function today() { return new Date().toISOString().split('T')[0]; }
  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ── PUBLIC API ───────────────────────────────────
  return {
    init,
    switchPanel,
    completeQuest,
    failQuest,
    doneHabit,
    deleteHabitUI,
    buyReward,
    buyCustomReward,
    addCustomRewardUI: () => addCustomRewardUI(),
    deleteCustomRewardUI,
  };
})();

// Boot
APP.init();
