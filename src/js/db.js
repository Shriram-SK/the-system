// ══════════════════════════════════════════════════
// THE SYSTEM — db.js
// All Supabase database interactions
// ══════════════════════════════════════════════════

let supabaseClient = null;

function initSupabase() {
  supabaseClient = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY
  );

  return supabaseClient;
}

// ── AUTH ──────────────────────────────────────────
async function signInWithGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });

  if (error) throw error;
}

async function signInWithEmail(email, password) {
  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) throw error;
  return data;
}

async function signUpWithEmail(email, password) {
  const { data, error } =
    await supabaseClient.auth.signUp({
      email,
      password
    });

  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) throw error;
}

// ── PLAYER ────────────────────────────────────────
async function getPlayer(userId) {
  const { data, error } = await supabaseClient
    .from('players')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

async function updatePlayer(userId, updates) {
  const { data, error } = await supabaseClient
    .from('players')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function upsertPlayer(userId, fields) {
  const { data, error } = await supabaseClient
    .from('players')
    .upsert({
      id: userId,
      ...fields
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── DAILY QUESTS ──────────────────────────────────
async function getTodayQuests(userId) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabaseClient
    .from('daily_quests')
    .select('*')
    .eq('player_id', userId)
    .eq('quest_date', today)
    .order('category');

  if (error) throw error;
  return data;
}

async function insertQuests(userId, quests) {
  const today = new Date().toISOString().split('T')[0];

  const rows = quests.map(q => ({
    player_id: userId,
    quest_date: today,
    category: q.category,
    name: q.name,
    icon: q.icon,
    xp_reward: q.xp,
    gold_reward: q.gold,
    stat_bonus: q.stat || null,
    difficulty: q.diff,
    completed: false,
    failed: false
  }));

  const { data, error } = await supabaseClient
    .from('daily_quests')
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
}

async function completeQuestDB(questId) {
  const { data, error } = await supabaseClient
    .from('daily_quests')
    .update({ completed: true })
    .eq('id', questId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function failQuestDB(questId) {
  const { data, error } = await supabaseClient
    .from('daily_quests')
    .update({ failed: true })
    .eq('id', questId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── SHADOWS ───────────────────────────────────────
async function getShadows(userId) {
  const { data, error } = await supabaseClient
    .from('shadows')
    .select('*')
    .eq('player_id', userId)
    .order('extracted_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function insertShadow(userId, shadow) {
  const { data, error } = await supabaseClient
    .from('shadows')
    .insert({
      player_id: userId,
      name: shadow.name,
      grade: shadow.grade,
      icon: shadow.icon
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── HABITS ────────────────────────────────────────
async function getHabits(userId) {
  const { data, error } = await supabaseClient
    .from('habits')
    .select('*')
    .eq('player_id', userId)
    .order('created_at');

  if (error) throw error;
  return data;
}

async function insertHabit(userId, name, xpPerDay, stat) {
  const { data, error } = await supabaseClient
    .from('habits')
    .insert({
      player_id: userId,
      name,
      xp_per_day: xpPerDay,
      stat_bonus: stat
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateHabit(habitId, updates) {
  const { data, error } = await supabaseClient
    .from('habits')
    .update(updates)
    .eq('id', habitId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteHabit(habitId) {
  const { error } = await supabaseClient
    .from('habits')
    .delete()
    .eq('id', habitId);

  if (error) throw error;
}

// ── CUSTOM REWARDS ────────────────────────────────
async function getCustomRewards(userId) {
  const { data, error } = await supabaseClient
    .from('custom_rewards')
    .select('*')
    .eq('player_id', userId)
    .order('created_at');

  if (error) throw error;
  return data;
}

async function insertCustomReward(userId, name, icon, cost) {
  const { data, error } = await supabaseClient
    .from('custom_rewards')
    .insert({
      player_id: userId,
      name,
      icon,
      cost
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteCustomReward(rewardId) {
  const { error } = await supabaseClient
    .from('custom_rewards')
    .delete()
    .eq('id', rewardId);

  if (error) throw error;
}

// ── PURCHASES ─────────────────────────────────────
async function logPurchase(userId, rewardName, cost) {
  const { error } = await supabaseClient
    .from('purchases')
    .insert({
      player_id: userId,
      reward_name: rewardName,
      cost
    });

  if (error) throw error;
}
