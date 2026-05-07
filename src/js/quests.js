// ══════════════════════════════════════════════════
// THE SYSTEM — quests.js
// Quest pool + daily generation logic
// ══════════════════════════════════════════════════

const QUEST_POOL = {
  fitness: [
    { name:'Complete full workout session',          icon:'🏋️', xp:80,  gold:40, diff:'hard',   stat:'str' },
    { name:'Do 100 push-ups (any sets)',             icon:'💪', xp:60,  gold:30, diff:'normal', stat:'str' },
    { name:'Do 50 squats + 20 lunges each side',    icon:'🦵', xp:50,  gold:25, diff:'normal', stat:'str' },
    { name:'10-min stretching + mobility work',     icon:'🤸', xp:20,  gold:10, diff:'easy',   stat:'agi' },
    { name:'30-minute outdoor walk or jog',         icon:'🏃', xp:50,  gold:25, diff:'normal', stat:'vit' },
    { name:'5 pull-ups or 10 negative pull-ups',   icon:'🔝', xp:40,  gold:20, diff:'normal', stat:'str' },
    { name:'20-minute HIIT session',               icon:'⚡', xp:70,  gold:35, diff:'hard',   stat:'agi' },
    { name:'Plank — 3 sets of 45 seconds',         icon:'🧱', xp:30,  gold:15, diff:'easy',   stat:'vit' },
    { name:'Full leg day — squats/lunges/bridges', icon:'🦿', xp:70,  gold:35, diff:'hard',   stat:'str' },
    { name:'Walk 8,000+ steps today',             icon:'👟', xp:40,  gold:20, diff:'normal', stat:'vit' },
    { name:'Cold shower immediately after workout',icon:'🚿', xp:25,  gold:12, diff:'easy',   stat:'vit' },
    { name:'5km run — any pace',                   icon:'🏅', xp:90,  gold:45, diff:'hard',   stat:'agi' },
    { name:'Core circuit — 4 exercises, 3 sets',   icon:'🎯', xp:50,  gold:25, diff:'normal', stat:'str' },
    { name:'Dips — 3 sets to failure',             icon:'💎', xp:40,  gold:20, diff:'normal', stat:'str' },
    { name:'Yoga or active recovery 20 minutes',   icon:'☯️', xp:30,  gold:15, diff:'easy',   stat:'agi' },
  ],

  nutrition: [
    { name:'Hit your daily protein target (160g)', icon:'🥚', xp:60,  gold:30, diff:'normal', stat:'vit' },
    { name:'Zero junk food or fried snacks today', icon:'🚫', xp:50,  gold:25, diff:'normal', stat:'vit' },
    { name:'Drink 3.5 litres of water',            icon:'💧', xp:40,  gold:20, diff:'normal', stat:'vit' },
    { name:'Eat a high-protein breakfast',         icon:'🍳', xp:30,  gold:15, diff:'easy',   stat:'vit' },
    { name:'Zero added sugar today',               icon:'🍬', xp:60,  gold:30, diff:'normal', stat:'vit' },
    { name:'Meal prep for the next 3 days',        icon:'🍱', xp:50,  gold:25, diff:'normal', stat:'per' },
    { name:'No soda or sugary drinks today',       icon:'🧃', xp:30,  gold:15, diff:'easy',   stat:'vit' },
    { name:'Eat a full vegetable serving at lunch',icon:'🥗', xp:25,  gold:12, diff:'easy',   stat:'vit' },
    { name:'No eating after 9 PM',                icon:'🌙', xp:40,  gold:20, diff:'normal', stat:'per' },
    { name:'Stay within your calorie target',     icon:'📊', xp:50,  gold:25, diff:'normal', stat:'vit' },
    { name:'Eat soya chunks or tofu — protein hit',icon:'🌱', xp:25,  gold:12, diff:'easy',   stat:'vit' },
    { name:'Zero alcohol today',                  icon:'🍺', xp:30,  gold:15, diff:'easy',   stat:'vit' },
  ],

  mind: [
    { name:'1 hour focused job-switch study',     icon:'📚', xp:60,  gold:30, diff:'normal', stat:'int' },
    { name:'2-hour deep work study session',      icon:'🎓', xp:90,  gold:45, diff:'hard',   stat:'int' },
    { name:'Complete one certification chapter',  icon:'🏆', xp:70,  gold:35, diff:'hard',   stat:'int' },
    { name:'Read for 20 minutes',                 icon:'📖', xp:25,  gold:12, diff:'easy',   stat:'int' },
    { name:'No social media for 3 hours',         icon:'📵', xp:40,  gold:20, diff:'normal', stat:'per' },
    { name:'Write 5 things you are grateful for', icon:'✍️', xp:15,  gold:8,  diff:'easy',   stat:'sen' },
    { name:'10-min meditation or breathwork',     icon:'🧘', xp:25,  gold:12, diff:'easy',   stat:'sen' },
    { name:'Review work and plan tomorrow',       icon:'📋', xp:20,  gold:10, diff:'easy',   stat:'per' },
    { name:'Solve a coding/technical problem',    icon:'💻', xp:80,  gold:40, diff:'hard',   stat:'int' },
    { name:'Learn one new technical concept',     icon:'⚙️', xp:50,  gold:25, diff:'normal', stat:'int' },
    { name:'Watch a technical tutorial (no skip)',icon:'🎬', xp:40,  gold:20, diff:'normal', stat:'int' },
    { name:'Write a journal entry — reflect',     icon:'📓', xp:20,  gold:10, diff:'easy',   stat:'sen' },
    { name:'Practice 10 SQL or coding problems',  icon:'🔢', xp:70,  gold:35, diff:'hard',   stat:'int' },
  ],

  discipline: [
    { name:'Wake up before 8 AM',                   icon:'⏰', xp:30,  gold:15, diff:'easy',   stat:'per' },
    { name:'Sleep before 11 PM tonight',            icon:'🌛', xp:30,  gold:15, diff:'easy',   stat:'vit' },
    { name:'Make your bed first thing',             icon:'🛏️', xp:10,  gold:5,  diff:'easy',   stat:'per' },
    { name:'No phone for first 30 min after wake', icon:'📱', xp:25,  gold:12, diff:'easy',   stat:'per' },
    { name:'Log all meals for the day',            icon:'📝', xp:20,  gold:10, diff:'easy',   stat:'per' },
    { name:'Track your workout in your log',       icon:'🗓️', xp:15,  gold:8,  diff:'easy',   stat:'per' },
    { name:'Get 8 hours of sleep',                 icon:'😴', xp:40,  gold:20, diff:'normal', stat:'vit' },
    { name:'Zero screen time after 10 PM',         icon:'🌑', xp:35,  gold:18, diff:'normal', stat:'per' },
    { name:'Start studying within 10 min of sitting',icon:'🎯', xp:35,  gold:18, diff:'normal', stat:'per' },
    { name:'Spend 15 min in morning sunlight',     icon:'☀️', xp:20,  gold:10, diff:'easy',   stat:'vit' },
    { name:'No procrastination — first task in 5 min',icon:'⚡', xp:30, gold:15, diff:'normal', stat:'per' },
    { name:'Complete full daily quest list',       icon:'✅', xp:50,  gold:25, diff:'normal', stat:'per' },
  ],

  boss: [
    { name:'BOSS: Full workout + hit protein + 2hr study',    icon:'💀', xp:200, gold:100, diff:'boss', stat:'str' },
    { name:'BOSS: Zero junk + all fitness quests done',       icon:'🔥', xp:180, gold:90,  diff:'boss', stat:'vit' },
    { name:'BOSS: Run 5km + full workout + cold shower',      icon:'👑', xp:220, gold:110, diff:'boss', stat:'agi' },
    { name:'BOSS: 3-hour deep work — zero distraction',       icon:'⚡', xp:190, gold:95,  diff:'boss', stat:'int' },
    { name:'BOSS: Perfect day — all habits + all quests done',icon:'🌌', xp:250, gold:125, diff:'boss', stat:'per' },
    { name:'BOSS: Morning workout + meal prep + 2hr study',   icon:'🏹', xp:200, gold:100, diff:'boss', stat:'sen' },
    { name:'BOSS: No social media + no junk + full workout',  icon:'🗡️', xp:210, gold:105, diff:'boss', stat:'per' },
  ],
};

// ── Pick N random from array ──
function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

// ── Generate today's quest set ──
function generateDailyQuests() {
  return [
    ...pickRandom(QUEST_POOL.fitness, 4).map(q => ({...q, category:'fitness'})),
    ...pickRandom(QUEST_POOL.nutrition, 3).map(q => ({...q, category:'nutrition'})),
    ...pickRandom(QUEST_POOL.mind, 3).map(q => ({...q, category:'mind'})),
    ...pickRandom(QUEST_POOL.discipline, 3).map(q => ({...q, category:'discipline'})),
    ...pickRandom(QUEST_POOL.boss, 1).map(q => ({...q, category:'boss'})),
  ];
}

// ── Category metadata ──
const CAT_META = {
  fitness:    { label:'⚔ FITNESS QUESTS',    color:'var(--green)',  tagClass:'badge-green' },
  nutrition:  { label:'🍽 NUTRITION QUESTS',  color:'var(--gold)',   tagClass:'badge-gold' },
  mind:       { label:'🧠 MIND QUESTS',       color:'var(--purple)', tagClass:'badge-purple' },
  discipline: { label:'⚡ DISCIPLINE QUESTS', color:'var(--blue)',   tagClass:'badge-blue' },
  boss:       { label:'💀 DAILY BOSS QUEST',  color:'var(--red)',    tagClass:'badge-red' },
};
