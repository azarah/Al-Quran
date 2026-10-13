(function (root) {
  "use strict";

const SURAHS = [
  "Al-Fatihah", "Al-Baqarah", "Aal-Imran", "An-Nisa", "Al-Ma'idah",
  "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
  "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr",
  "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Ta-Ha",
  "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan",
  "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum",
  "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir",
  "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
  "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah",
  "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman",
  "Al-Waqi'ah", "Al-Hadid", "Al-Mujadila", "Al-Hashr", "Al-Mumtahanah",
  "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq",
  "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah",
  "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj",
  "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
  "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin",
  "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat",
  "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil",
  "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
  "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

const STOP = new Set("a an the and or to of for in on at by with from into onto over under my your our their me we i you it its this that these those is are was were be been being will would can could should shall just one thing things real really leave room keep make do does did get go going up down out then than too very so as if but not no yes please today tomorrow now next also some any all only own same other another more most much many few lot lots bit way ways something everything nothing here there what which who how why about after before again still already always never back off per via need want try trying gotta gonna let lets asap soon later first last new big small little sure maybe ok okay task tasks todo list item priority priorities ship finish done complete start begin write send call email fix build clean plan review check update move put gotta stuff kinda sort etc am im ive id they them he she his her him weve dont doesnt didnt wont cant less early late daily tonight journal process team exam really every each both such than into".split(/\s+/));

const VERBISH = new Set(["protect", "guard", "help", "save", "watch", "seek", "hold", "find", "give"]);

const HARSH = new Set(["penalty", "punishment", "punish", "torment", "hell", "blast", "earthquake", "chastisement", "wrath", "doom", "grievous", "slaughter", "slay", "slain", "painful", "terrible", "horror", "fire", "boiling", "scalding", "pus", "agony"]);

const BRIDGE = {
  rest: ["sleep", "repose", "slumber"],
  relax: ["repose", "tranquillity", "peace"],
  calm: ["tranquillity", "peace", "satisfaction"],
  peace: ["peace", "tranquillity"],
  morning: ["morning", "dawn"],
  dawn: ["dawn", "morning"],
  evening: ["evening"],
  night: ["night"],
  sleep: ["sleep", "repose", "slumber"],
  protect: ["protector", "protection", "protect"],
  protection: ["protection", "protector"],
  guard: ["guard", "protect", "protector"],
  family: ["parents", "kindred", "mates", "children", "household"],
  kids: ["children", "offspring", "childhood"],
  kid: ["children", "offspring", "childhood"],
  child: ["child", "children", "offspring", "childhood"],
  children: ["children", "offspring"],
  mom: ["mother", "parents"],
  dad: ["father", "parents"],
  mother: ["mother", "parents"],
  father: ["father", "parents"],
  parents: ["parents"],
  wife: ["wife", "mates", "spouse"],
  husband: ["husband", "mates", "spouse"],
  marriage: ["mates", "spouse", "marry"],
  spouse: ["spouse", "mates"],
  love: ["love", "mercy"],
  heart: ["heart", "hearts"],
  work: ["work", "labour"],
  job: ["work", "livelihood", "labour"],
  money: ["wealth", "money", "provision"],
  wealth: ["wealth"],
  debt: ["debt"],
  pray: ["prayer", "pray"],
  prayer: ["prayer"],
  salah: ["prayer"],
  patient: ["patience", "patiently", "persevere"],
  patience: ["patience", "patiently", "persevere"],
  stress: ["difficulty", "burden", "distress"],
  anxiety: ["distress", "grief"],
  worry: ["distress", "grief"],
  worried: ["distress", "grief"],
  hard: ["difficulty", "hardship"],
  hardship: ["difficulty", "hardship"],
  busy: ["labour", "task"],
  focus: ["remembrance", "remember"],
  grateful: ["grateful"],
  gratitude: ["grateful"],
  thanks: ["grateful"],
  thank: ["grateful"],
  study: ["knowledge", "wisdom", "read"],
  learn: ["knowledge", "wisdom"],
  learning: ["knowledge", "wisdom"],
  read: ["read"],
  book: ["book"],
  health: ["healing", "heal"],
  sick: ["sick", "affliction"],
  home: ["home", "homes", "houses", "dwell"],
  house: ["house", "homes"],
  travel: ["travel", "journey"],
  journey: ["journey", "travel"],
  friend: ["friend", "friends"],
  friends: ["friends", "friend"],
  forgive: ["forgive", "forgives", "forgiveness"],
  forgiveness: ["forgiveness", "forgive"],
  sorry: ["forgive", "repentance"],
  anger: ["anger"],
  angry: ["anger"],
  truth: ["truth"],
  honest: ["truth"],
  honesty: ["truth"],
  lie: ["lie", "falsehood"],
  time: ["time"],
  success: ["success", "prosper"],
  hope: ["hope", "mercy"],
  fear: ["fear"],
  afraid: ["fear"],
  trust: ["trust"],
  help: ["help"],
  strength: ["strength", "strong"],
  strong: ["strong", "strength"],
  weak: ["weak"],
  poor: ["poor", "needy"],
  charity: ["charity", "spend"],
  justice: ["justice"],
  fair: ["justice"],
  water: ["water"],
  food: ["food", "eat"],
  eat: ["eat", "food"],
  hunger: ["hunger"],
  rain: ["rain"],
  light: ["light"],
  dark: ["darkness"],
  darkness: ["darkness"],
  path: ["path"],
  guide: ["guide", "guidance"],
  god: ["allah"],
  allah: ["allah"],
  faith: ["faith", "believe"],
  believe: ["believe", "faith"],
  soul: ["soul", "souls"],
  death: ["death"],
  life: ["life"],
  heaven: ["garden", "heaven"],
  paradise: ["garden"],
  garden: ["garden"],
  moon: ["moon"],
  sun: ["sun"],
  star: ["star", "stars"],
  stars: ["stars", "star"],
  sea: ["sea"],
  ocean: ["sea"],
  mountain: ["mountain", "mountains"],
  earth: ["earth"],
  bird: ["bird", "birds"],
  birds: ["birds", "bird"],
  knowledge: ["knowledge", "wisdom"],
  wisdom: ["wisdom", "knowledge"],
  remember: ["remember", "remembrance"],
  remembrance: ["remembrance", "remember"],
  orphan: ["orphan", "orphans"],
  mercy: ["mercy"],
  merciful: ["merciful", "mercy"],
  kind: ["kind", "kindness"],
  kindness: ["kindness", "kind"],
  humble: ["humility", "humble"],
  pride: ["pride", "arrogant"],
  repent: ["repent", "repentance", "forgiveness"],
  sin: ["sin", "sins"],
  sins: ["sins", "sin"],
  good: ["good"],
  evil: ["evil"],
  day: ["day"],
  fast: ["fasting", "fast"],
  fasting: ["fasting"],
  ramadan: ["ramadan", "fasting"],
  quran: ["quran"],
  koran: ["quran"],
  tongue: ["tongue"],
  speech: ["word", "speak"],
  speak: ["speak", "word"],
  word: ["word", "words"],
  words: ["words", "word"],
  neighbor: ["neighbour", "kinsfolk"],
  neighbour: ["neighbour"],
  patience: ["patience", "patiently"],
  burden: ["burden"],
  ease: ["ease", "relief"],
  relief: ["relief", "ease"],
  difficulty: ["difficulty"],
  grief: ["grief"],
  sadness: ["grief", "sorrow"],
  sorrow: ["sorrow", "grief"],
  happy: ["joy", "glad"],
  joy: ["joy", "glad"],
  provision: ["provision"],
  rizq: ["provision"],
  patience2: ["patience"]
};

const ANCHORS = {
  morning: ["93:1"],
  dawn: ["93:1", "89:1"],
  night: ["92:1", "93:2"],
  evening: ["30:18"],
  sleep: ["78:9", "25:47"],
  rest: ["78:9", "25:47"],
  relax: ["78:9", "13:28"],
  calm: ["13:28", "48:4"],
  peace: ["13:28"],
  patience: ["2:153", "103:3"],
  patient: ["2:153"],
  protect: ["2:257"],
  protection: ["2:257"],
  guard: ["13:11"],
  prayer: ["2:153", "2:186"],
  pray: ["2:186", "2:153"],
  salah: ["2:153"],
  work: ["9:105", "94:7"],
  job: ["9:105", "94:7"],
  labour: ["94:7"],
  labor: ["94:7"],
  hard: ["94:5"],
  hardship: ["94:5", "94:6"],
  difficulty: ["94:5", "94:6"],
  stress: ["94:5", "2:286"],
  burden: ["2:286", "94:2"],
  ease: ["94:5", "94:6"],
  relief: ["94:5", "94:6"],
  anxiety: ["94:5", "2:286"],
  worry: ["94:5", "65:3"],
  worried: ["94:5", "65:3"],
  grief: ["94:5", "12:86"],
  heart: ["13:28"],
  remember: ["2:152", "13:28"],
  remembrance: ["13:28"],
  focus: ["13:28", "94:8"],
  grateful: ["14:7", "2:152"],
  gratitude: ["14:7"],
  thank: ["14:7", "2:152"],
  thanks: ["14:7"],
  family: ["30:21", "17:23"],
  parents: ["17:23", "17:24"],
  mother: ["31:14", "17:23"],
  father: ["17:23"],
  mom: ["31:14", "17:23"],
  dad: ["17:23"],
  child: ["17:24", "2:233"],
  children: ["2:233", "64:15"],
  kids: ["2:233"],
  wife: ["30:21"],
  husband: ["30:21"],
  marriage: ["30:21"],
  spouse: ["30:21"],
  love: ["30:21"],
  mercy: ["39:53", "7:156"],
  trust: ["65:3", "3:159"],
  fear: ["2:197"],
  afraid: ["2:286"],
  knowledge: ["20:114", "96:1"],
  learn: ["96:1", "20:114"],
  learning: ["96:1"],
  study: ["96:1", "20:114"],
  read: ["96:1"],
  wisdom: ["2:269"],
  wealth: ["102:1", "89:20"],
  money: ["2:261", "34:39"],
  charity: ["2:261"],
  poor: ["93:8", "2:177"],
  orphan: ["93:9", "2:177"],
  time: ["103:1", "103:3"],
  success: ["23:1"],
  hope: ["39:53", "94:5"],
  forgive: ["39:53", "3:135"],
  forgiveness: ["39:53"],
  sorry: ["39:53"],
  truth: ["103:3"],
  honest: ["9:119", "103:3"],
  justice: ["4:135", "5:8"],
  fair: ["4:135"],
  home: ["16:80"],
  house: ["16:80"],
  travel: ["4:100"],
  journey: ["2:197"],
  friend: ["3:103"],
  friends: ["3:103"],
  death: ["3:185"],
  life: ["67:2"],
  soul: ["91:7", "91:9"],
  good: ["99:7"],
  evil: ["99:8"],
  light: ["24:35", "2:257"],
  dark: ["2:257"],
  darkness: ["2:257"],
  path: ["1:6"],
  guide: ["1:6"],
  help: ["1:5", "2:153"],
  water: ["21:30"],
  food: ["2:172"],
  faith: ["103:3", "2:153"],
  believe: ["2:285"],
  god: ["2:255", "112:1"],
  allah: ["112:1", "2:255"],
  quran: ["2:2"],
  fast: ["2:183"],
  fasting: ["2:183"],
  ramadan: ["2:185"],
  sun: ["91:1"],
  moon: ["54:1"],
  star: ["53:1"],
  stars: ["53:1"],
  sea: ["18:109"],
  ocean: ["18:109"],
  mountain: ["59:21"],
  earth: ["51:20"],
  bird: ["67:19"],
  birds: ["67:19"],
  garden: ["55:46"],
  heaven: ["55:46"],
  paradise: ["55:46"],
  anger: ["3:134"],
  angry: ["3:134"],
  kind: ["17:23"],
  kindness: ["17:23"],
  humble: ["25:63"],
  sin: ["39:53"],
  sins: ["39:53"],
  repent: ["39:53"],
  strength: ["2:286"],
  weak: ["4:28"],
  day: ["78:11"],
  provision: ["65:3"],
  debt: ["2:280"],
  grief: ["12:86"],
  sadness: ["12:86"],
  tongue: ["50:18"],
  speech: ["50:18"],
  words: ["50:18"],
  word: ["14:24"]
};

const FALLBACK = ["94:7", "9:105", "99:7", "103:3", "94:5", "2:152"];

function stem(w) {
  if (w.length > 5 && w.endsWith("ing")) {
    const b = w.slice(0, -3);
    if (b.endsWith(b.slice(-1)) && b.length > 3) return b.slice(0, -1);
    return b;
  }
  if (w.length > 4 && w.endsWith("ied")) return w.slice(0, -3) + "y";
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 5 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 4 && /[^s]s$/.test(w)) return w.slice(0, -1);
  return w;
}

function tokens(text) {
  return (String(text).toLowerCase().match(/[a-z']+/g) || [])
    .map(function (w) { return w.replace(/^'+|'+$/g, ""); })
    .filter(Boolean);
}

let verses = [];
let index = new Map();
let byKey = {};
let N = 1;

function ingest(raw) {
  verses = [];
  index = new Map();
  byKey = {};
  const lines = String(raw || "").split(/\r?\n/);
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
  const sm = /^SURAH\s+(\d+)\s+-\s+/.exec(lines[i]);
  if (sm) { cur = +sm[1]; continue; }
  const m = /^\[(\d+):(\d+)\]$/.exec(lines[i]);
  if (!m || !cur) continue;
  const ar = (lines[i + 1] || "").trim();
  const en = (lines[i + 2] || "").trim();
  const words = tokens(en);
  const v = { s: +m[1], a: +m[2], ar: ar, en: en, words: words, n: words.length, i: verses.length };
  const vi = verses.length;
  verses.push(v);
  const seen = new Set();
  words.forEach(function (w) {
    [w, stem(w)].forEach(function (key) {
      if (key.length < 3 || seen.has(key)) return;
      seen.add(key);
      let bucket = index.get(key);
      if (!bucket) { bucket = []; index.set(key, bucket); }
      bucket.push(vi);
    });
  });
    i += 2;
  }
  N = verses.length || 1;
  verses.forEach(function (v) { byKey[v.s + ":" + v.a] = v; });
}

function idf(term) {
  const df = (index.get(term) || []).length;
  if (!df) return 0;
  return Math.log((N + 1) / df);
}

function isHarsh(v) {
  return v.words.some(function (w) { return HARSH.has(w) || HARSH.has(stem(w)); });
}

function tidy(s) {
  return s.replace(/\s+/g, " ").replace(/^["'(\s]+/, "").replace(/[;:,\s]+$/, "").replace(/[—-]\s*$/, "").trim();
}

function clauseHarsh(part) {
  return tokens(part).some(function (w) { return HARSH.has(w) || HARSH.has(stem(w)); });
}

function clausesOf(clean) {
  return clean.split(/\s*(?:;|(?<=[.?!])\s+|:)\s*/).map(tidy).filter(function (p) { return p.length > 12; });
}

function expandClause(part, terms) {
  const bits = part.split(/,\s+/).map(function (b) { return b.trim(); }).filter(Boolean);
  if (bits.length < 2) return tidy(part);
  const lowTerms = terms.map(function (t) { return t.toLowerCase(); });
  let idx = 0;
  bits.forEach(function (b, i) {
    const low = b.toLowerCase();
    if (lowTerms.some(function (t) { return low.indexOf(t) >= 0; })) idx = i;
  });
  let lo = idx;
  let hi = idx;
  function join() { return tidy(bits.slice(lo, hi + 1).join(", ")); }
  let out = join();
  while (out.length < 72 && (lo > 0 || hi < bits.length - 1)) {
    if (hi < bits.length - 1) hi += 1;
    else if (lo > 0) lo -= 1;
    const next = join();
    if (next.length > 168 && out.length >= 36) break;
    out = next;
    if (out.length > 168) {
      out = out.slice(0, 165).trim() + "…";
      break;
    }
  }
  return out;
}

function excerpt(en, terms) {
  const clean = en.replace(/\s+/g, " ").trim();
  const full = tidy(clean);
  const lowered = terms.map(function (t) { return String(t || "").toLowerCase(); }).filter(Boolean);
  const hit = lowered.some(function (t) { return clean.toLowerCase().indexOf(t) >= 0; });
  if (!hit) {
    const first = expandClause(clausesOf(clean)[0] || full, []);
    return first.length > 168 ? first.slice(0, 165).trim() + "…" : first;
  }
  if (full.length <= 168 && !clauseHarsh(full)) return full;
  const parts = clausesOf(clean);
  let best = "";
  let bestScore = -1;
  parts.forEach(function (part) {
    const low = part.toLowerCase();
    let score = 0;
    lowered.forEach(function (t) { if (low.indexOf(t) >= 0) score += 10 + t.length; });
    if (!score) return;
    if (clauseHarsh(part)) score -= 14;
    if (score > bestScore) { bestScore = score; best = part; }
  });
  const chosen = best || parts[0] || full;
  const out = expandClause(chosen, lowered);
  return out.length > 168 ? out.slice(0, 165).trim() + "…" : out;
}

function displayArabic(v) {
  let ar = (v.ar || "").trim();
  if (v.s === 1 && v.a === 1) return ar;
  if (ar.indexOf("بِسْمِ") === 0 || ar.indexOf("بسم") === 0) {
    ar = ar.split(/\s+/).slice(4).join(" ");
  }
  return ar;
}

function contentWords(text) {
  const raw = tokens(text);
  const out = [];
  raw.forEach(function (w) {
    const s = stem(w);
    if (STOP.has(w) || STOP.has(s) || w.length < 3) return;
    if (out.indexOf(w) === -1) out.push(w);
  });
  return out;
}

function lookupTerms(word) {
  const s = stem(word);
  const bridged = BRIDGE[word] || BRIDGE[s] || [];
  const terms = [];
  function add(t) { if (t && t.length >= 3 && terms.indexOf(t) === -1) terms.push(t); }
  if (!BRIDGE[word] && !BRIDGE[s]) {
    add(word);
    add(s);
  }
  bridged.forEach(add);
  if (BRIDGE[word] || BRIDGE[s]) {
    add(word);
    add(s);
  }
  return terms;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pack(v, terms) {
  const key = v.s + ":" + v.a;
  const hints = terms && terms.length ? terms : tokens(v.en).slice(0, 4);
  return {
    key: key,
    s: v.s,
    a: v.a,
    name: SURAHS[v.s - 1] || "",
    ar: displayArabic(v),
    en: v.en,
    excerpt: excerpt(v.en, hints)
  };
}

function fallbackPick(text, used) {
  const order = FALLBACK;
  const start = hash(String(text || "verse")) % order.length;
  for (let k = 0; k < order.length; k++) {
    const key = order[(start + k) % order.length];
    if (used && used.has(key)) continue;
    if (byKey[key]) return pack(byKey[key], []);
  }
  return byKey[order[start]] ? pack(byKey[order[start]], []) : null;
}

function ayah(s, a, ar, en) { return { s: s, a: a, ar: ar, en: en }; }

const MEANINGS = [
  { keys: ["morning", "dawn", "sunrise", "fajr", "daybreak"], verses: [
    ayah(93, 1, "وَالضُّحَىٰ", "By the Glorious Morning Light"),
    ayah(93, 4, "وَلَلْآخِرَةُ خَيْرٌ لَكَ مِنَ الْأُولَىٰ", "And verily the Hereafter will be better for thee than the present"),
    ayah(93, 5, "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ", "And soon will thy Guardian-Lord give thee (that wherewith) thou shalt be well-pleased")
  ]},
  { keys: ["night", "evening", "dusk", "dark"], verses: [
    ayah(93, 2, "وَاللَّيْلِ إِذَا سَجَىٰ", "And by the Night when it is still"),
    ayah(78, 10, "وَجَعَلْنَا اللَّيْلَ لِبَاسًا", "And made the night as a covering"),
    ayah(25, 47, "وَهُوَ الَّذِي جَعَلَ لَكُمُ اللَّيْلَ لِبَاسًا وَالنَّوْمَ سُبَاتًا", "He makes the Night as a Robe for you, and Sleep as Repose")
  ]},
  { keys: ["sleep", "rest", "nap", "relax", "tired", "repose", "slumber", "bed"], verses: [
    ayah(78, 9, "وَجَعَلْنَا نَوْمَكُمْ سُبَاتًا", "And made your sleep for rest"),
    ayah(78, 10, "وَجَعَلْنَا اللَّيْلَ لِبَاسًا", "And made the night as a covering"),
    ayah(25, 47, "وَالنَّوْمَ سُبَاتًا", "Sleep as Repose, and the Day as a Resurrection")
  ]},
  { keys: ["work", "job", "labour", "labor", "ship", "finish", "build", "busy", "project", "deadline", "effort", "hustle", "task"], verses: [
    ayah(94, 7, "فَإِذَا فَرَغْتَ فَانْصَبْ", "Therefore, when thou art free (from thine immediate task), still labour hard"),
    ayah(94, 8, "وَإِلَىٰ رَبِّكَ فَارْغَبْ", "And to thy Lord turn (all) thy attention"),
    ayah(9, 105, "وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ", "Work (righteousness): Soon will Allah observe your work")
  ]},
  { keys: ["hard", "hardship", "stress", "anxiety", "worry", "worried", "difficult", "struggle", "burden", "overwhelm", "relief", "ease", "pressure"], verses: [
    ayah(94, 5, "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", "So, verily, with every difficulty, there is relief"),
    ayah(94, 6, "إِنَّ مَعَ الْعُسْرِ يُسْرًا", "Verily, with every difficulty there is relief"),
    ayah(94, 2, "وَوَضَعْنَا عَنْكَ وِزْرَكَ", "And removed from thee thy burden"),
    ayah(2, 286, "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", "On no soul doth Allah place a burden greater than it can bear")
  ]},
  { keys: ["patient", "patience", "persevere", "endure", "wait"], verses: [
    ayah(2, 153, "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", "Seek help with patient perseverance and prayer; for Allah is with those who patiently persevere"),
    ayah(103, 3, "وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ", "Do righteous deeds, and join together in the mutual teaching of Truth, and of Patience and Constancy"),
    ayah(94, 5, "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", "So, verily, with every difficulty, there is relief")
  ]},
  { keys: ["pray", "prayer", "salah", "dua", "worship", "supplicate"], verses: [
    ayah(2, 186, "فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ", "I am indeed close: I listen to the prayer of every suppliant when he calleth on Me"),
    ayah(1, 5, "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", "Thee do we worship, and Thine aid we seek"),
    ayah(94, 8, "وَإِلَىٰ رَبِّكَ فَارْغَبْ", "And to thy Lord turn (all) thy attention")
  ]},
  { keys: ["protect", "guard", "safe", "safety", "shield", "secure"], verses: [
    ayah(2, 257, "اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا يُخْرِجُهُمْ مِنَ الظُّلُمَاتِ إِلَى النُّورِ", "Allah is the Protector of those who have faith: from the depths of darkness He will lead them forth into light"),
    ayah(2, 286, "أَنْتَ مَوْلَانَا", "Thou art our Protector"),
    ayah(93, 3, "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ", "Thy Guardian-Lord hath not forsaken thee, nor is He displeased")
  ]},
  { keys: ["grateful", "gratitude", "thank", "thanks", "thankful"], verses: [
    ayah(14, 7, "لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ", "If ye are grateful, I will add more (favours) unto you"),
    ayah(2, 152, "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي", "Then do ye remember Me; I will remember you. Be grateful to Me"),
    ayah(93, 11, "وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ", "But the bounty of the Lord — rehearse and proclaim")
  ]},
  { keys: ["remember", "remembrance", "focus", "dhikr", "heart", "calm", "peace", "still", "quiet"], verses: [
    ayah(13, 28, "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", "In the remembrance of Allah do hearts find satisfaction"),
    ayah(2, 152, "فَاذْكُرُونِي أَذْكُرْكُمْ", "Then do ye remember Me; I will remember you"),
    ayah(94, 1, "أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ", "Have We not expanded thee thy breast?")
  ]},
  { keys: ["family", "parents", "mother", "father", "mom", "dad", "parent", "mama", "papa"], verses: [
    ayah(17, 23, "وَبِالْوَالِدَيْنِ إِحْسَانًا", "Thy Lord hath decreed that ye worship none but Him, and that ye be kind to parents"),
    ayah(17, 24, "وَقُلْ رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا", "My Lord! bestow on them thy Mercy even as they cherished me in childhood"),
    ayah(31, 14, "حَمَلَتْهُ أُمُّهُ وَهْنًا عَلَىٰ وَهْنٍ", "In travail upon travail did his mother bear him")
  ]},
  { keys: ["kids", "children", "child", "son", "daughter", "baby"], verses: [
    ayah(17, 24, "كَمَا رَبَّيَانِي صَغِيرًا", "Bestow on them thy Mercy even as they cherished me in childhood"),
    ayah(17, 23, "وَبِالْوَالِدَيْنِ إِحْسَانًا", "Be kind to parents"),
    ayah(93, 6, "أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ", "Did He not find thee an orphan and give thee shelter and care?")
  ]},
  { keys: ["wife", "husband", "marriage", "spouse", "love", "marry", "beloved"], verses: [
    ayah(30, 21, "وَجَعَلَ بَيْنَكُمْ مَوَدَّةً وَرَحْمَةً", "He has put love and mercy between your hearts"),
    ayah(78, 8, "وَخَلَقْنَاكُمْ أَزْوَاجًا", "And created you in pairs"),
    ayah(3, 134, "وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ", "For Allah loves those who do good")
  ]},
  { keys: ["forgive", "forgiveness", "sorry", "mercy", "repent", "sin", "sins", "pardon"], verses: [
    ayah(39, 53, "لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا", "Despair not of the Mercy of Allah: for Allah forgives all sins"),
    ayah(3, 134, "وَالْعَافِينَ عَنِ النَّاسِ", "Who restrain anger, and pardon all men"),
    ayah(2, 286, "وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا", "Blot out our sins, and grant us forgiveness. Have mercy on us")
  ]},
  { keys: ["trust", "rely", "hope", "fear", "afraid", "scared"], verses: [
    ayah(65, 3, "وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", "And if any one puts his trust in Allah, sufficient is Allah for him"),
    ayah(93, 5, "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ", "And soon will thy Guardian-Lord give thee that wherewith thou shalt be well-pleased"),
    ayah(2, 257, "اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا", "Allah is the Protector of those who have faith")
  ]},
  { keys: ["read", "study", "learn", "learning", "knowledge", "book", "school", "exam", "wisdom"], verses: [
    ayah(20, 114, "وَقُلْ رَبِّ زِدْنِي عِلْمًا", "O my Lord! advance me in knowledge"),
    ayah(96, 1, "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ", "Read in the name of thy Lord and Cherisher, Who created"),
    ayah(93, 7, "وَوَجَدَكَ ضَالًّا فَهَدَىٰ", "And He found thee wandering, and He gave thee guidance")
  ]},
  { keys: ["quran", "recite", "revelation"], verses: [
    ayah(96, 1, "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ", "Read in the name of thy Lord and Cherisher, Who created"),
    ayah(20, 114, "وَقُلْ رَبِّ زِدْنِي عِلْمًا", "O my Lord! advance me in knowledge"),
    ayah(2, 152, "فَاذْكُرُونِي أَذْكُرْكُمْ", "Then do ye remember Me; I will remember you")
  ]},
  { keys: ["money", "wealth", "save", "savings", "spend", "charity", "give", "poor", "bill", "bills", "debt", "provision"], verses: [
    ayah(2, 261, "مَثَلُ الَّذِينَ يُنْفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ", "The parable of those who spend their substance in the way of Allah is that of a grain of corn: it groweth seven ears"),
    ayah(93, 8, "وَوَجَدَكَ عَائِلًا فَأَغْنَىٰ", "And He found thee in need, and made thee independent"),
    ayah(99, 7, "فَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ", "Then shall anyone who has done an atom's weight of good, see it")
  ]},
  { keys: ["time", "hour", "clock", "age", "moment"], verses: [
    ayah(103, 1, "وَالْعَصْرِ", "By the Token of Time through the ages"),
    ayah(103, 3, "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ", "Except such as have Faith, and do righteous deeds"),
    ayah(94, 7, "فَإِذَا فَرَغْتَ فَانْصَبْ", "When thou art free from thine immediate task, still labour hard")
  ]},
  { keys: ["good", "deed", "deeds", "kindness", "kind", "righteous"], verses: [
    ayah(99, 7, "فَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ", "Then shall anyone who has done an atom's weight of good, see it"),
    ayah(103, 3, "وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ", "Do righteous deeds, and join together in the mutual teaching of Truth"),
    ayah(3, 134, "وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ", "For Allah loves those who do good")
  ]},
  { keys: ["justice", "fair", "honest", "truth", "honesty"], verses: [
    ayah(4, 135, "كُونُوا قَوَّامِينَ بِالْقِسْطِ", "Stand out firmly for justice, as witnesses to Allah, even as against yourselves"),
    ayah(103, 3, "وَتَوَاصَوْا بِالْحَقِّ", "Join together in the mutual teaching of Truth, and of Patience and Constancy"),
    ayah(5, 8, "اعْدِلُوا هُوَ أَقْرَبُ لِلتَّقْوَىٰ", "Be just: that is next to piety")
  ]},
  { keys: ["anger", "angry", "rage", "temper"], verses: [
    ayah(3, 134, "وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ", "Who restrain anger, and pardon all men; for Allah loves those who do good"),
    ayah(39, 53, "إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا", "Allah forgives all sins"),
    ayah(13, 28, "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", "In the remembrance of Allah do hearts find satisfaction")
  ]},
  { keys: ["water", "drink", "rain", "thirst"], verses: [
    ayah(56, 68, "أَفَرَأَيْتُمُ الْمَاءَ الَّذِي تَشْرَبُونَ", "See ye the water which ye drink?"),
    ayah(21, 30, "وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ", "We made from water every living thing"),
    ayah(25, 48, "وَأَنْزَلْنَا مِنَ السَّمَاءِ مَاءً طَهُورًا", "And We send down pure water from the sky")
  ]},
  { keys: ["light", "lamp", "darkness"], verses: [
    ayah(24, 35, "اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ", "Allah is the Light of the heavens and the earth"),
    ayah(2, 257, "يُخْرِجُهُمْ مِنَ الظُّلُمَاتِ إِلَى النُّورِ", "From the depths of darkness He will lead them forth into light"),
    ayah(93, 1, "وَالضُّحَىٰ", "By the Glorious Morning Light")
  ]},
  { keys: ["sun", "sunshine"], verses: [
    ayah(91, 1, "وَالشَّمْسِ وَضُحَاهَا", "By the Sun and his glorious splendour"),
    ayah(93, 1, "وَالضُّحَىٰ", "By the Glorious Morning Light"),
    ayah(25, 45, "ثُمَّ جَعَلْنَا الشَّمْسَ عَلَيْهِ دَلِيلًا", "Then do We make the sun its guide")
  ]},
  { keys: ["home", "house", "dwell"], verses: [
    ayah(16, 80, "وَاللَّهُ جَعَلَ لَكُمْ مِنْ بُيُوتِكُمْ سَكَنًا", "It is Allah Who made your habitations homes of rest and quiet for you"),
    ayah(93, 6, "أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ", "Did He not find thee an orphan and give thee shelter and care?"),
    ayah(78, 9, "وَجَعَلْنَا نَوْمَكُمْ سُبَاتًا", "And made your sleep for rest")
  ]},
  { keys: ["help", "aid", "support"], verses: [
    ayah(1, 5, "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", "Thee do we worship, and Thine aid we seek"),
    ayah(2, 153, "اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", "Seek help with patient perseverance and prayer"),
    ayah(2, 257, "اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا", "Allah is the Protector of those who have faith")
  ]},
  { keys: ["allah", "god", "faith", "believe"], verses: [
    ayah(112, 1, "قُلْ هُوَ اللَّهُ أَحَدٌ", "Say: He is Allah, the One and Only"),
    ayah(112, 2, "اللَّهُ الصَّمَدُ", "Allah, the Eternal, Absolute"),
    ayah(2, 255, "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", "Allah! There is no god but He, the Living, the Self-subsisting, Eternal")
  ]},
  { keys: ["attention", "turn", "intention", "purpose"], verses: [
    ayah(94, 8, "وَإِلَىٰ رَبِّكَ فَارْغَبْ", "And to thy Lord turn all thy attention"),
    ayah(94, 7, "فَإِذَا فَرَغْتَ فَانْصَبْ", "When thou art free from thine immediate task, still labour hard"),
    ayah(13, 28, "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", "In the remembrance of Allah do hearts find satisfaction")
  ]}
];

const MEANING_FALLBACK = [3, 4, 19, 9, 28];

const FUNCTION_WORDS = new Set("a an the and or to of for in on at by with from into my your our their me we i you it its this that these those is are was were be been being will would can could should just some any all one real thing things leave room up down out now next very really please asap gonna gotta let lets am im do does did than too so as if but not no yes also only own same other here there what which who how why about after before again still already back off per via".split(/\s+/));

function packAyah(v) {
  return {
    key: v.s + ":" + v.a,
    s: v.s,
    a: v.a,
    name: SURAHS[v.s - 1] || "",
    ar: v.ar,
    en: v.en,
    excerpt: v.en
  };
}

function meaningWords(text) {
  const out = [];
  tokens(text).forEach(function (w) {
    const s = stem(w);
    if (FUNCTION_WORDS.has(w) || FUNCTION_WORDS.has(s) || w.length < 3) return;
    if (out.indexOf(w) === -1) out.push(w);
  });
  return out;
}

function wordHitsKey(word, key) {
  const sw = stem(word);
  const sk = stem(key);
  if (word === key || sw === key || sw === sk) return 12;
  if (sw.length >= 4 && (key.indexOf(sw) === 0 || sw.indexOf(sk) === 0)) return 8;
  return 0;
}

function rankMeanings(text) {
  const words = meaningWords(text);
  const ranked = [];
  if (!words.length) return ranked;
  MEANINGS.forEach(function (m) {
    let score = 0;
    words.forEach(function (word, wi) {
      let hit = 0;
      m.keys.forEach(function (key) {
        const n = wordHitsKey(word, key);
        if (n > hit) hit = n;
      });
      if (!hit) return;
      const weight = VERBISH.has(word) || VERBISH.has(stem(word)) ? 0.55 : 1;
      score += hit * weight * (1 + wi * 0.2);
    });
    if (score > 0) ranked.push({ m: m, score: score });
  });
  ranked.sort(function (a, b) { return b.score - a.score; });
  return ranked;
}

function relatedVerses(text) {
  const ranked = rankMeanings(text);
  const out = [];
  const seen = {};
  function add(v) {
    if (!v) return;
    const key = v.s + ":" + v.a;
    if (seen[key]) return;
    seen[key] = 1;
    out.push(packAyah(v));
  }
  if (!ranked.length) {
    const start = hash(String(text || "verse")) % MEANING_FALLBACK.length;
    for (let k = 0; k < MEANING_FALLBACK.length; k++) {
      MEANINGS[MEANING_FALLBACK[(start + k) % MEANING_FALLBACK.length]].verses.forEach(add);
    }
    return out.slice(0, 4);
  }
  ranked[0].m.verses.forEach(add);
  for (let i = 1; i < ranked.length && out.length < 4; i++) add(ranked[i].m.verses[0]);
  return out.slice(0, 4);
}

function pickByMeaning(text, used) {
  const all = relatedVerses(text);
  if (!all.length) return null;
  if (used) {
    for (let i = 0; i < all.length; i++) {
      if (!used.has(all[i].key)) return all[i];
    }
  }
  return all[0];
}

function pickVerse(text, used) {
  if (!verses.length) return pickByMeaning(text, used);
  const words = contentWords(text);
  if (!words.length) return fallbackPick(text, used);
  const scores = new Map();
  function bump(vi, add, term, word) {
    if (!add || vi == null || vi < 0) return;
    let row = scores.get(vi);
    if (!row) { row = { score: 0, terms: [], words: 0, seen: {} }; scores.set(vi, row); }
    row.score += add;
    if (term && row.terms.indexOf(term) === -1) row.terms.push(term);
    if (word && !row.seen[word]) {
      row.seen[word] = 1;
      row.words += 1;
    }
  }

  words.forEach(function (word) {
    const weight = VERBISH.has(word) || VERBISH.has(stem(word)) ? 0.62 : 1;
    const terms = lookupTerms(word);
    const anchors = ANCHORS[word] || ANCHORS[stem(word)] || [];
    const perVerse = new Map();
    terms.forEach(function (term) {
      const hits = index.get(term);
      if (!hits) return;
      const rarity = idf(term);
      if (!rarity) return;
      const exact = term === word || term === stem(word);
      let wgt = (exact ? 10 : 6) * rarity * weight;
      if (hits.length > 280 && !anchors.length) wgt *= 0.28;
      hits.forEach(function (vi) {
        const prev = perVerse.get(vi);
        if (!prev || wgt > prev.wgt) perVerse.set(vi, { wgt: wgt, term: term });
      });
    });
    perVerse.forEach(function (hit, vi) { bump(vi, hit.wgt, hit.term, word); });
    anchors.forEach(function (key) {
      const v = byKey[key];
      if (!v) return;
      bump(v.i, 76 * weight, terms[0] || word, word);
    });
  });

  let best = null;
  scores.forEach(function (row, vi) {
    const v = verses[vi];
    const key = v.s + ":" + v.a;
    if (used && used.has(key)) return;
    let score = row.score;
    if (row.words && row.words > 1) score += (row.words - 1) * 16;
    if (v.n <= 12) score += 18;
    else if (v.n <= 22) score += 12;
    else if (v.n <= 40) score += 5;
    else if (v.n > 120) score -= 28;
    else if (v.n > 70) score -= 14;
    const anchored = words.some(function (word) {
      const list = ANCHORS[word] || ANCHORS[stem(word)] || [];
      return list.indexOf(key) !== -1;
    });
    if (isHarsh(v) && !anchored) score -= 40;
    if (!best || score > best.score) best = { score: score, row: row, vi: vi };
  });

  if (!best || best.score < 8) return fallbackPick(text, used);
  return pack(verses[best.vi], best.row.terms);
}

let lastRandomKey = "";

function allCuratedAyahs() {
  const out = [];
  const seen = {};
  MEANINGS.forEach(function (m) {
    m.verses.forEach(function (v) {
      const key = v.s + ":" + v.a;
      if (seen[key]) return;
      seen[key] = 1;
      out.push(v);
    });
  });
  return out;
}

function randomAyah() {
  const pool = allCuratedAyahs();
  if (!pool.length) return null;
  let pick = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1) {
    let guard = 0;
    while (pick.s + ":" + pick.a === lastRandomKey && guard++ < 12) {
      pick = pool[Math.floor(Math.random() * pool.length)];
    }
  }
  lastRandomKey = pick.s + ":" + pick.a;
  return packAyah(pick);
}

  root.QuranBeside = {
    ingest: ingest,
    pick: pickVerse,
    related: relatedVerses,
    random: randomAyah,
    ready: function () { return true; }
  };
})(typeof window !== "undefined" ? window : globalThis);
