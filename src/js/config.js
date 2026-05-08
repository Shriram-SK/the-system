// ══════════════════════════════════════════════════
// THE SYSTEM — config.js
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with yours
// from: Supabase Dashboard → Project Settings → API
// ══════════════════════════════════════════════════

const CONFIG = {
  SUPABASE_URL: 'https://nkkkbrvqdbjqixlupnqw.supabase.co',       // e.g. https://abcdef.supabase.co
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ra2ticnZxZGJqcWl4bHVwbnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjMwNzQsImV4cCI6MjA5MzczOTA3NH0.0Z19M2UcDo7jI2lnjV6BFmN1PW5n_U4CRaKELK4ZnNM', // eyJh...
};

// ── RANK SYSTEM ──
const RANKS = [
  { rank:'E',       min:1,   max:4,   color:'#6b7a9a', title:'The Weakest',       class:'E-RANK HUNTER' },
  { rank:'D',       min:5,   max:9,   color:'#4a9eff', title:'Awakened Hunter',    class:'D-RANK HUNTER' },
  { rank:'C',       min:10,  max:19,  color:'#4aff8a', title:'Seasoned Hunter',    class:'C-RANK HUNTER' },
  { rank:'B',       min:20,  max:34,  color:'#ffd700', title:'Elite Hunter',       class:'B-RANK HUNTER' },
  { rank:'A',       min:35,  max:49,  color:'#ff8c42', title:'High-Rank Hunter',   class:'A-RANK HUNTER' },
  { rank:'S',       min:50,  max:74,  color:'#ff4a4a', title:'National-Level Hunter', class:'S-RANK HUNTER' },
  { rank:'SS',      min:75,  max:99,  color:'#9b6dff', title:'The Shadow Monarch', class:'SS-RANK HUNTER' },
  { rank:'MONARCH', min:100, max:999, color:'#4a9eff', title:'Ruler of Shadows',   class:'SHADOW MONARCH' },
];

// XP needed per level (scales exponentially)
const XP_PER_LEVEL = (lv) => Math.floor(100 * Math.pow(1.18, lv - 1));

// ── DEFAULT SHOP REWARDS ──
const DEFAULT_REWARDS = [
  { id:'sr1', name:'30 Min Gaming',    icon:'🎮', cost:20,  desc:'Quick session. Earned.' },
  { id:'sr2', name:'1 Hour Gaming',    icon:'🕹️', cost:40,  desc:'Full session unlocked.' },
  { id:'sr3', name:'2 Hours Gaming',   icon:'👾', cost:70,  desc:'Extended grind session.' },
  { id:'sr4', name:'Watch 1 Episode',  icon:'📺', cost:25,  desc:'One episode. Then back.' },
  { id:'sr5', name:'Binge 3 Episodes', icon:'🎬', cost:65,  desc:'Proper watch session.' },
  { id:'sr6', name:'Movie Night',      icon:'🍿', cost:90,  desc:'Full movie. Deserved.' },
  { id:'sr7', name:'Cheat Meal',       icon:'🍕', cost:60,  desc:'One meal. No guilt.' },
  { id:'sr8', name:'Cheat Day',        icon:'🍔', cost:160, desc:'Full diet day off.' },
  { id:'sr9', name:'Full Rest Day',    icon:'😴', cost:120, desc:'System-approved rest.' },
  { id:'sr10',name:'Social Media 1hr', icon:'📱', cost:25,  desc:'Scroll guilt-free.' },
  { id:'sr11',name:'Late Sleep Night', icon:'🌙', cost:50,  desc:'One night, no alarm.' },
  { id:'sr12',name:'Buy Something',    icon:'🛍️', cost:250, desc:'You grinded for this.' },
];

// ── SHADOW ARMY DATA ──
const SHADOW_POOL = [
  { name:'IGRIS',     grade:'S',        icon:'⚔️',  color:'#ff4a4a' },
  { name:'BERU',      grade:'National', icon:'🐝',  color:'#9b6dff' },
  { name:'IRON',      grade:'A',        icon:'🛡️',  color:'#ff8c42' },
  { name:'TANK',      grade:'A',        icon:'💪',  color:'#ff8c42' },
  { name:'KAISEL',    grade:'National', icon:'🐉',  color:'#9b6dff' },
  { name:'BELLION',   grade:'National', icon:'👹',  color:'#9b6dff' },
  { name:'GREED',     grade:'S',        icon:'💀',  color:'#ff4a4a' },
  { name:'TUSK',      grade:'S',        icon:'🦷',  color:'#ff4a4a' },
  { name:'SHADOW SOLDIER', grade:'D',   icon:'🗡️', color:'#4a9eff' },
  { name:'SHADOW KNIGHT',  grade:'C',   icon:'⚔️',  color:'#4aff8a' },
  { name:'SHADOW MAGE',    grade:'B',   icon:'🔮',  color:'#ffd700' },
  { name:'SHADOW ASSASSIN',grade:'A',   icon:'🌑',  color:'#ff8c42' },
];

// ── PLAYER TITLES by level ──
function getPlayerTitle(lv) {
  const r = RANKS.find(r => lv >= r.min && lv <= r.max) || RANKS[0];
  return r.title;
}
function getPlayerClass(lv) {
  const r = RANKS.find(r => lv >= r.min && lv <= r.max) || RANKS[0];
  return `◆ ${r.class} ◆`;
}
function getRankData(lv) {
  return RANKS.find(r => lv >= r.min && lv <= r.max) || RANKS[0];
}

