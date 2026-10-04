/* As-Sirat — multi-hub knowledge RPG (world + Midian/Egypt/Sinai/Makkah/Ruins) */
(function (global) {
  "use strict";

  var STORE_KEY = "alquran-sirat-v2";
  var LEGACY_KEY = "alquran-sirat-midian-v1";

  var ROOTS = {
    rushd: { ar: "رشد", en: "rushd", gloss: "right guidance", speak: "رُشْد" },
    saqy: { ar: "سقي", en: "saqy", gloss: "to water", speak: "سَقَى" },
    sabr: { ar: "صبر", en: "ṣabr", gloss: "patience", speak: "صَبْر" },
    wazn: { ar: "وزن", en: "wazn", gloss: "weight / balance", speak: "وَزْن" },
    adl: { ar: "عدل", en: "ʿadl", gloss: "justice", speak: "عَدْل" },
    amn: { ar: "أمن", en: "amn", gloss: "safety / trust", speak: "أَمْن" },
    khwn: { ar: "خون", en: "khawn", gloss: "betrayal", speak: "خِيَانَة" },
    tawakkul: { ar: "وكل", en: "tawakkul", gloss: "trust in God", speak: "تَوَكُّل" },
    huda: { ar: "هدي", en: "hudā", gloss: "guidance", speak: "هُدَى" },
    mithaq: { ar: "وثق", en: "mīthāq", gloss: "covenant", speak: "مِيثَاق" },
    shukr: { ar: "شكر", en: "shukr", gloss: "gratitude", speak: "شُكْر" },
    taqwa: { ar: "وقي", en: "taqwā", gloss: "God-consciousness", speak: "تَقْوَى" },
    rahm: { ar: "رحم", en: "raḥm", gloss: "mercy", speak: "رَحْمَة" },
    fasaad: { ar: "فسد", en: "fasād", gloss: "corruption", speak: "فَسَاد" }
  };

  var ASMA = [
    { id: "rahman", ar: "الرَّحْمٰن", en: "The Most Merciful", hub: "midian" },
    { id: "rahim", ar: "الرَّحِيم", en: "The Especially Merciful", hub: "egypt" },
    { id: "malik", ar: "الْمَلِك", en: "The King", hub: "egypt" },
    { id: "salam", ar: "السَّلَام", en: "The Source of Peace", hub: "sinai" },
    { id: "mumin", ar: "الْمُؤْمِن", en: "The Guardian of Faith", hub: "sinai" },
    { id: "aziz", ar: "الْعَزِيز", en: "The Almighty", hub: "makkah" },
    { id: "hakim", ar: "الْحَكِيم", en: "The Wise", hub: "makkah" },
    { id: "ghafur", ar: "الْغَفُور", en: "The Forgiving", hub: "ruins" },
    { id: "shakur", ar: "الشَّكُور", en: "The Appreciative", hub: "makkah" },
    { id: "sabur", ar: "الصَّبُور", en: "The Patient", hub: "egypt" },
    { id: "hadi", ar: "الْهَادِي", en: "The Guide", hub: "midian" },
    { id: "adlname", ar: "الْعَدْل", en: "The Just", hub: "midian" }
  ];

  var DEBATES = [
    {
      id: "d-munafiq",
      foe: "The hypocrites (munafiqun)",
      side: "deny",
      prompt: "They smile in public and plot in private. Which root answers their double tongue?",
      options: [
        { text: "صبر — endure and ignore forever", ok: false },
        { text: "وقي · taqwā — sincerity before God, not people", ok: true, root: "taqwa" },
        { text: "وزن — weigh their coins only", ok: false }
      ],
      win: "You refuse their stage. Taqwā joins your speech."
    },
    {
      id: "d-zalim",
      foe: "The wrongdoers (ẓālimūn)",
      side: "deny",
      prompt: "They call short measure ‘business.’ Which root answers?",
      options: [
        { text: "عدل · ʿadl — restore the balance", ok: true, root: "adl" },
        { text: "خون — meet betrayal with betrayal", ok: false },
        { text: "فسد — burn the market", ok: false }
      ],
      win: "Justice spoken calmly is sharper than rage."
    },
    {
      id: "d-muhsin",
      foe: "A doer of good (muḥsin) seeks counsel",
      side: "believe",
      prompt: "How do you encourage excellence without pride?",
      options: [
        { text: "شكر · shukr — gratitude keeps the heart soft", ok: true, root: "shukr" },
        { text: "ملك — claim kingship of virtue", ok: false },
        { text: "خون — test them with a false promise", ok: false }
      ],
      win: "Shukr steadies both of you."
    },
    {
      id: "d-kafir",
      foe: "Those who reject faith (kāfirūn)",
      side: "deny",
      prompt: "They mock revelation as old stories. Your reply?",
      options: [
        { text: "هدي · hudā — point to clear signs, then leave the rest", ok: true, root: "huda" },
        { text: "Match mockery with mockery", ok: false },
        { text: "Demand they convert by force of voice", ok: false }
      ],
      win: "Guidance offered; compulsion refused."
    },
    {
      id: "d-muttaqi",
      foe: "The God-fearing (muttaqūn)",
      side: "believe",
      prompt: "They ask what fear of God looks like on the road.",
      options: [
        { text: "وقي · taqwā — choose the unseen Witness over the crowd", ok: true, root: "taqwa" },
        { text: "Hide every good deed out of despair", ok: false },
        { text: "Announce piety for reputation", ok: false }
      ],
      win: "Your Stance and theirs recognize each other."
    }
  ];

  var CALCS = [
    {
      id: "c-iddah",
      title: "Village law · ʿiddah",
      prompt: "A widow asks how long she waits before remarriage (not pregnant). What does the Qurʾan set?",
      options: [
        { text: "Three menstrual cycles", ok: false },
        { text: "Four months and ten days", ok: true },
        { text: "One full year", ok: false }
      ],
      ref: "2:234",
      note: "Four months and ten days — unless she is pregnant, then until she delivers."
    },
    {
      id: "c-oath",
      title: "Village law · oath expiation",
      prompt: "Someone breaks a careless oath. Which is a valid expiation path (5:89)?",
      options: [
        { text: "Feed or clothe ten poor persons, or free a slave; if unable, fast three days", ok: true },
        { text: "Pay any amount once", ok: false },
        { text: "Fast thirty days only, no alternative", ok: false }
      ],
      ref: "5:89",
      note: "Expiation has ordered options — then fasting if unable."
    },
    {
      id: "c-inherit",
      title: "Village law · inheritance",
      prompt: "A deceased leaves one daughter and no son. Her Qurʾanic fixed share is…",
      options: [
        { text: "One half", ok: true },
        { text: "Two thirds", ok: false },
        { text: "One quarter", ok: false }
      ],
      ref: "4:11",
      note: "A sole daughter receives one half; two or more daughters share two thirds."
    }
  ];

  var FALLBACK_VERSES = {
    "28:22": { ar: "وَلَمَّا تَوَجَّهَ تِلْقَاءَ مَدْيَنَ…", en: "…he turned towards Madyan… hope that my Lord will show me the straight Path." },
    "28:23": { ar: "وَلَمَّا وَرَدَ مَاءَ مَدْيَنَ…", en: "At Midian's watering place… two women keeping back their flocks…" },
    "28:24": { ar: "فَسَقَىٰ لَهُمَا…", en: "So he watered their flocks… O my Lord! truly am I in need of any good…" },
    "7:85": { ar: "…فَأَوْفُوا الْكَيْلَ وَالْمِيزَانَ…", en: "Give just measure and weight… do no mischief on the earth…" },
    "12:90": { ar: "قَالُوا أَإِنَّكَ لَأَنْتَ يُوسُفُ…", en: "They said: Are you indeed Joseph?…" },
    "12:92": { ar: "قَالَ لَا تَثْرِيبَ عَلَيْكُمُ الْيَوْمَ…", en: "He said: This day let no reproach be on you…" },
    "20:12": { ar: "إِنِّي أَنَا رَبُّكَ فَاخْلَعْ نَعْلَيْكَ…", en: "I am thy Lord: remove thy shoes… thou art in the sacred valley…" },
    "2:63": { ar: "وَإِذْ أَخَذْنَا مِيثَاقَكُمْ وَرَفَعْنَا فَوْقَكُمُ الطُّورَ…", en: "We took your covenant and raised above you the Mount…" },
    "3:96": { ar: "إِنَّ أَوَّلَ بَيْتٍ وُضِعَ لِلنَّاسِ لَلَّذِي بِبَكَّةَ…", en: "The first House appointed for men was that at Bakka…" },
    "2:125": { ar: "وَإِذْ جَعَلْنَا الْبَيْتَ مَثَابَةً لِلنَّاسِ وَأَمْنًا…", en: "We made the House a place of assembly and of security…" },
    "7:73": { ar: "وَإِلَىٰ ثَمُودَ أَخَاهُمْ صَالِحًا…", en: "To Thamud We sent Salih… this she-camel of Allah…" },
    "89:6": { ar: "أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِعَادٍ", en: "Seest thou not how thy Lord dealt with the 'Ad…" },
    "10:90": { ar: "…حَتَّىٰ إِذَا أَدْرَكَهُ الْغَرَقُ…", en: "…until when drowning overtook him…" },
    "2:234": { ar: "وَالَّذِينَ يُتَوَفَّوْنَ مِنْكُمْ وَيَذَرُونَ أَزْوَاجًا يَتَرَبَّصْنَ بِأَنْفُسِهِنَّ أَرْبَعَةَ أَشْهُرٍ وَعَشْرًا…", en: "Those who die and leave widows… four months and ten days…" },
    "5:89": { ar: "…فَكَفَّارَتُهُ إِطْعَامُ عَشَرَةِ مَسَاكِينَ…", en: "…expiation is feeding ten indigents… or fasting three days…" },
    "4:11": { ar: "…فَإِنْ كَانَتْ وَاحِدَةً فَلَهَا النِّصْفُ…", en: "…if only one daughter, her share is a half…" }
  };

  var api = { getVerse: null, openVerse: null };
  var saveTimer = null;
  var ttsBusy = false;

  /* ---------- state ---------- */
  function emptyHub(id) {
    return {
      id: id,
      intro: false,
      complete: false,
      wellChoice: null,
      mentorStep: 0,
      mentorDone: false,
      trialDone: false,
      hunts: {},
      asmaTaken: {},
      fork: null,
      special: null
    };
  }

  function defaultState() {
    return {
      version: 2,
      clarity: 40,
      believe: 0,
      deny: 0,
      tags: [],
      roots: [],
      companions: [],
      book: [],
      asma: [],
      debates: {},
      calcs: {},
      ngPlus: 0,
      screen: "world",
      hub: null,
      hubs: {
        midian: emptyHub("midian"),
        egypt: emptyHub("egypt"),
        sinai: emptyHub("sinai"),
        makkah: emptyHub("makkah"),
        ruins: emptyHub("ruins")
      },
      worldIntro: false,
      overlay: null
    };
  }

  function migrateLegacy(legacy) {
    var s = defaultState();
    if (!legacy) return s;
    s.clarity = legacy.clarity || s.clarity;
    s.believe = legacy.believe || 0;
    s.deny = legacy.deny || 0;
    s.tags = legacy.tags || [];
    s.roots = legacy.roots || [];
    s.companions = legacy.companions || [];
    s.book = legacy.book || [];
    var m = s.hubs.midian;
    m.wellChoice = legacy.wellChoice || null;
    m.mentorStep = legacy.mentorStep || 0;
    m.mentorDone = !!legacy.mentorDone;
    m.trialDone = !!legacy.marketDone;
    m.hunts = legacy.hunts || {};
    m.intro = !!legacy.introSeen;
    m.complete = !!legacy.complete;
    s.worldIntro = true;
    return s;
  }

  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (raw && raw.version === 2) {
        var base = defaultState();
        deepMerge(base, raw);
        return base;
      }
      var legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
      if (legacy) return migrateLegacy(legacy);
    } catch (e) { /* ignore */ }
    return defaultState();
  }

  function deepMerge(target, src) {
    Object.keys(src).forEach(function (k) {
      if (src[k] && typeof src[k] === "object" && !Array.isArray(src[k]) && target[k] && typeof target[k] === "object" && !Array.isArray(target[k])) {
        deepMerge(target[k], src[k]);
      } else if (src[k] !== undefined) {
        target[k] = src[k];
      }
    });
  }

  function persist(state) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }, 60);
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function hubDone(state, id) { return !!(state.hubs[id] && state.hubs[id].complete); }

  function hubUnlocked(state, id) {
    if (id === "midian") return true;
    if (id === "egypt") return hubDone(state, "midian");
    if (id === "sinai") return hubDone(state, "egypt");
    if (id === "makkah") return hubDone(state, "sinai");
    if (id === "ruins") return hubDone(state, "midian");
    return false;
  }

  function hasRoot(state, id) { return state.roots.indexOf(id) !== -1; }

  function speakAr(text) {
    if (!global.speechSynthesis || !text) return;
    try {
      global.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA";
      u.rate = 0.9;
      ttsBusy = true;
      u.onend = function () { ttsBusy = false; };
      global.speechSynthesis.speak(u);
    } catch (e) { ttsBusy = false; }
  }

  function unlockRoot(state, id) {
    if (!ROOTS[id] || hasRoot(state, id)) return false;
    state.roots.push(id);
    state.clarity = clamp(state.clarity + 8, 0, 100);
    speakAr(ROOTS[id].speak || ROOTS[id].ar);
    return true;
  }

  function addCompanion(state, id, label) {
    if (state.companions.some(function (c) { return c.id === id; })) return;
    state.companions.push({ id: id, label: label });
    state.clarity = clamp(state.clarity + 5, 0, 100);
  }

  function addTag(state, tag, side) {
    if (state.tags.indexOf(tag) === -1) state.tags.push(tag);
    if (side === "believe") state.believe += 1;
    if (side === "deny") state.deny += 1;
  }

  function addBook(state, entry) {
    if (state.book.some(function (b) { return b.ref === entry.ref && b.title === entry.title; })) return;
    state.book.push(entry);
  }

  function addAsma(state, id) {
    if (state.asma.indexOf(id) !== -1) return false;
    var a = ASMA.filter(function (x) { return x.id === id; })[0];
    if (!a) return false;
    state.asma.push(id);
    state.clarity = clamp(state.clarity + 6, 0, 100);
    speakAr(a.ar);
    addBook(state, { ref: "Asma", title: a.en, note: a.ar });
    return true;
  }

  function verseOf(ref) {
    var p = ref.split(":");
    var s = +p[0], a = +p[1];
    if (api.getVerse) {
      var v = api.getVerse(s, a);
      if (v) return v;
    }
    var fb = FALLBACK_VERSES[ref];
    return fb ? { s: s, a: a, ar: fb.ar, en: fb.en } : null;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function curHub(state) { return state.hubs[state.hub] || null; }

  function markHubComplete(state, id) {
    var h = state.hubs[id];
    if (!h || h.complete) return;
    h.complete = true;
    state.clarity = clamp(state.clarity + 10, 0, 100);
  }

  function checkMidianComplete(h) {
    return !!(h.wellChoice && h.mentorDone && h.trialDone &&
      h.hunts.h1 && h.hunts.h2 && h.hunts.h3);
  }

  function checkEgyptComplete(h) {
    return !!(h.fork && h.mentorDone && h.trialDone && h.hunts.e1);
  }

  function checkSinaiComplete(h) {
    return !!(h.fork && h.mentorDone && h.trialDone && h.hunts.s1);
  }

  function checkMakkahComplete(h) {
    return !!(h.fork && h.mentorDone && h.trialDone && h.hunts.k1);
  }

  function checkRuinsComplete(h) {
    return !!(h.special && h.special.ad && h.special.thamud && h.special.pharaoh);
  }

  function refreshHubComplete(state) {
    var id = state.hub;
    if (!id) return;
    var h = state.hubs[id];
    var ok = false;
    if (id === "midian") ok = checkMidianComplete(h);
    if (id === "egypt") ok = checkEgyptComplete(h);
    if (id === "sinai") ok = checkSinaiComplete(h);
    if (id === "makkah") ok = checkMakkahComplete(h);
    if (id === "ruins") ok = checkRuinsComplete(h);
    if (ok) markHubComplete(state, id);
  }

  /* ---------- UI helpers ---------- */
  function metersHtml(state) {
    var stance = state.believe === state.deny ? "balanced"
      : (state.believe > state.deny ? "toward belief" : "toward denial");
    var hubsDone = ["midian", "egypt", "sinai", "makkah", "ruins"].filter(function (id) {
      return hubDone(state, id);
    }).length;
    return (
      '<div class="sirat-meters">' +
        '<div class="sirat-meter"><span>Clarity</span><b>' + state.clarity + '</b>' +
          '<div class="sirat-bar"><i style="width:' + state.clarity + '%"></i></div></div>' +
        '<div class="sirat-meter"><span>Stance</span><b>' + escapeHtml(stance) + '</b>' +
          '<small>believe ' + state.believe + ' · deny ' + state.deny + '</small></div>' +
        '<div class="sirat-meter"><span>Roots</span><b>' + state.roots.length + '</b></div>' +
        '<div class="sirat-meter"><span>Asma</span><b>' + state.asma.length + ' / ' + ASMA.length + '</b></div>' +
        '<div class="sirat-meter"><span>Hubs</span><b>' + hubsDone + ' / 5</b>' +
          (state.ngPlus ? '<small>NG+ ' + state.ngPlus + '</small>' : '') + '</div>' +
      '</div>'
    );
  }

  function panel(title, body, actions) {
    var btns = (actions || []).map(function (a) {
      return '<button type="button" class="sirat-btn' + (a.primary ? ' primary' : '') +
        '" data-act="' + escapeHtml(a.id) + '">' + escapeHtml(a.label) + '</button>';
    }).join('');
    return (
      '<div class="sirat-overlay" role="dialog" aria-modal="true">' +
        '<div class="sirat-panel">' +
          '<div class="sirat-panel-frame">' +
            '<h2>' + escapeHtml(title) + '</h2>' +
            '<div class="sirat-panel-body">' + body + '</div>' +
            '<div class="sirat-actions">' + btns + '</div>' +
          '</div>' +
        '</div></div>'
    );
  }

  function pin(id, label, sub, x, y, open, done) {
    var cls = 'sirat-pin' + (open ? '' : ' locked') + (done ? ' done' : '');
    return (
      '<button type="button" class="' + cls + '" data-loc="' + id + '"' +
        (open ? '' : ' disabled') +
        ' style="left:' + x + '%;top:' + y + '%">' +
        '<strong>' + escapeHtml(label) + '</strong>' +
        '<em>' + escapeHtml(open ? sub : 'locked') + '</em></button>'
    );
  }

  /* ---------- WORLD ---------- */
  function worldHtml(state) {
    var hubs = [
      { id: "midian", label: "Midian", sub: "Well & measure", x: 28, y: 58 },
      { id: "egypt", label: "Egypt", sub: "Betrayal → trust", x: 48, y: 42 },
      { id: "sinai", label: "Sinai", sub: "Covenant", x: 62, y: 36 },
      { id: "makkah", label: "Makkah", sub: "The House", x: 72, y: 62 },
      { id: "ruins", label: "Ruins", sub: "Cautionary lands", x: 40, y: 78 }
    ];
    var pins = hubs.map(function (h) {
      return pin(h.id, h.label, h.sub, h.x, h.y, hubUnlocked(state, h.id), hubDone(state, h.id));
    }).join('');

    var tools =
      pin("book", "Book", "Signs & Asma", 18, 28, true, state.book.length > 0) +
      pin("debates", "Debates", "Trial of Speech", 82, 28, hubDone(state, "midian"), Object.keys(state.debates).length >= DEBATES.length) +
      pin("calcs", "Village law", "Trial of Deed", 88, 48, hubDone(state, "egypt"), Object.keys(state.calcs).length >= CALCS.length) +
      pin("progress", "Progress", "Save / NG+", 14, 72, true, false);

    return (
      '<div class="sirat-map sirat-world" aria-label="Map of Signs">' +
        '<svg class="sirat-map-art" viewBox="0 0 400 240" aria-hidden="true">' +
          '<rect width="400" height="240" fill="url(#sky)"/>' +
          '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#c5dced"/><stop offset="100%" stop-color="#e8eef4"/></linearGradient></defs>' +
          '<ellipse cx="200" cy="210" rx="240" ry="50" fill="#b8cfc0" opacity=".55"/>' +
          '<path d="M0 150 Q120 100 220 130 T400 110 L400 240 L0 240 Z" fill="#9eb8a8" opacity=".45"/>' +
          '<circle cx="190" cy="100" r="36" fill="#a8c8d8" opacity=".4"/>' +
          '<text x="200" y="28" text-anchor="middle" fill="#2a4a62" font-size="16" font-family="Cinzel, Georgia, serif">Map of Signs</text>' +
          '<text x="200" y="48" text-anchor="middle" fill="#5a6a7a" font-size="11" font-family="Nunito, sans-serif">Complete hubs · collect Asma · keep the Straight Path</text>' +
        '</svg>' + pins + tools +
      '</div>'
    );
  }

  /* ---------- HUB MAPS ---------- */
  function midianMap(state) {
    var h = state.hubs.midian;
    return (
      '<div class="sirat-map" aria-label="Midian">' +
        '<svg class="sirat-map-art" viewBox="0 0 400 220" aria-hidden="true">' +
          '<rect width="400" height="220" fill="#f3edd4"/>' +
          '<circle cx="70" cy="130" r="28" fill="#9ec4d4" stroke="#5a8a9a" stroke-width="2"/>' +
          '<rect x="175" y="48" width="70" height="42" rx="4" fill="#c4a574"/>' +
          '<rect x="290" y="100" width="54" height="36" rx="3" fill="#b89a6a"/>' +
          '<text x="200" y="24" text-anchor="middle" fill="#6b2d8a" font-size="14" font-family="Georgia, serif">Midian · مدين</text>' +
        '</svg>' +
        pin("well", "Well", "Stance fork", 18, 58, true, !!h.wellChoice) +
        pin("tent", "Shuʿayb", "Mentor", 48, 28, !!h.wellChoice, h.mentorDone) +
        pin("market", "Market", "Trial of deed", 78, 52, h.mentorDone, h.trialDone) +
        pin("stones", "Stones", "Verse hunts", 62, 78, h.trialDone, !!(h.hunts.h1 && h.hunts.h2 && h.hunts.h3)) +
        pin("asma-spot", "Seal", "Asma", 30, 22, !!h.wellChoice, !!(h.asmaTaken.rahman && h.asmaTaken.hadi && h.asmaTaken.adlname)) +
        pin("back", "World", "Map of Signs", 88, 18, true, false) +
      '</div>'
    );
  }

  function egyptMap(state) {
    var h = state.hubs.egypt;
    return (
      '<div class="sirat-map" aria-label="Egypt">' +
        '<svg class="sirat-map-art" viewBox="0 0 400 220" aria-hidden="true">' +
          '<rect width="400" height="220" fill="#e8f0f4"/>' +
          '<path d="M180 0 L210 220 L170 220 Z" fill="#7eb3c9" opacity=".45"/>' +
          '<rect x="240" y="60" width="80" height="70" fill="#d4c4a0"/>' +
          '<text x="200" y="24" text-anchor="middle" fill="#1565c0" font-size="14" font-family="Georgia, serif">Egypt · مصر</text>' +
        '</svg>' +
        pin("prison", "Prison", "Betrayal fork", 30, 55, true, !!h.fork) +
        pin("yusuf", "Yusuf", "Mentor", 55, 35, !!h.fork, h.mentorDone) +
        pin("court", "Court", "Forgiveness trial", 75, 55, h.mentorDone, h.trialDone) +
        pin("nile", "Nile stone", "Verse hunt", 40, 78, h.trialDone, !!h.hunts.e1) +
        pin("asma-spot", "Seal", "Asma", 20, 28, !!h.fork, !!(h.asmaTaken.rahim && h.asmaTaken.malik && h.asmaTaken.sabur)) +
        pin("back", "World", "Map of Signs", 88, 18, true, false) +
      '</div>'
    );
  }

  function sinaiMap(state) {
    var h = state.hubs.sinai;
    return (
      '<div class="sirat-map" aria-label="Sinai">' +
        '<svg class="sirat-map-art" viewBox="0 0 400 220" aria-hidden="true">' +
          '<rect width="400" height="220" fill="#efe8dc"/>' +
          '<path d="M80 180 L200 40 L320 180 Z" fill="#c2b49a"/>' +
          '<text x="200" y="24" text-anchor="middle" fill="#5a4030" font-size="14" font-family="Georgia, serif">Sinai · الطور</text>' +
        '</svg>' +
        pin("valley", "Valley", "Shoes fork", 28, 60, true, !!h.fork) +
        pin("musa", "Musa", "Mentor", 50, 32, !!h.fork, h.mentorDone) +
        pin("covenant", "Covenant", "Law trial", 72, 55, h.mentorDone, h.trialDone) +
        pin("tablet", "Tablet", "Verse hunt", 55, 78, h.trialDone, !!h.hunts.s1) +
        pin("asma-spot", "Seal", "Asma", 18, 30, !!h.fork, !!(h.asmaTaken.salam && h.asmaTaken.mumin)) +
        pin("back", "World", "Map of Signs", 88, 18, true, false) +
      '</div>'
    );
  }

  function makkahMap(state) {
    var h = state.hubs.makkah;
    return (
      '<div class="sirat-map" aria-label="Makkah">' +
        '<svg class="sirat-map-art" viewBox="0 0 400 220" aria-hidden="true">' +
          '<rect width="400" height="220" fill="#f7f1e4"/>' +
          '<rect x="170" y="70" width="60" height="60" fill="#3d6b5a" opacity=".25"/>' +
          '<rect x="185" y="85" width="30" height="30" fill="#3d6b5a" opacity=".45"/>' +
          '<text x="200" y="24" text-anchor="middle" fill="#3d6b5a" font-size="14" font-family="Georgia, serif">Makkah / Bakkah · مكة</text>' +
        '</svg>' +
        pin("house", "House", "Sanctuary fork", 50, 48, true, !!h.fork) +
        pin("ibrahim", "Ibrahim", "Mentor", 28, 32, !!h.fork, h.mentorDone) +
        pin("idol", "Heart-idol", "Taqwā trial", 74, 55, h.mentorDone, h.trialDone) +
        pin("stone", "Inscription", "Verse hunt", 60, 78, h.trialDone, !!h.hunts.k1) +
        pin("asma-spot", "Seal", "Asma", 18, 60, !!h.fork, !!(h.asmaTaken.aziz && h.asmaTaken.hakim && h.asmaTaken.shakur)) +
        pin("back", "World", "Map of Signs", 88, 18, true, false) +
      '</div>'
    );
  }

  function ruinsMap(state) {
    var h = state.hubs.ruins;
    var sp = h.special || {};
    return (
      '<div class="sirat-map" aria-label="Ruins">' +
        '<svg class="sirat-map-art" viewBox="0 0 400 220" aria-hidden="true">' +
          '<rect width="400" height="220" fill="#ebe4da"/>' +
          '<rect x="40" y="100" width="50" height="40" fill="#9a8a78" opacity=".5"/>' +
          '<rect x="160" y="90" width="40" height="55" fill="#8a7a68" opacity=".5"/>' +
          '<rect x="280" y="110" width="60" height="30" fill="#7a6a58" opacity=".5"/>' +
          '<text x="200" y="24" text-anchor="middle" fill="#8b1a1a" font-size="14" font-family="Georgia, serif">Ruined zones · caution</text>' +
        '</svg>' +
        pin("ad", "ʿAd", "Pride of pillars", 22, 55, true, !!sp.ad) +
        pin("thamud", "Thamud", "She-camel sign", 50, 48, true, !!sp.thamud) +
        pin("pharaoh", "Pharaoh", "Drowning brink", 78, 55, true, !!sp.pharaoh) +
        pin("asma-spot", "Seal", "Asma", 35, 78, !!(sp.ad || sp.thamud || sp.pharaoh), !!h.asmaTaken.ghafur) +
        pin("back", "World", "Map of Signs", 88, 18, true, false) +
      '</div>'
    );
  }

  /* ---------- OVERLAYS ---------- */
  function bookOverlay(state) {
    var signs = state.book.length
      ? '<ul class="sirat-book-list">' + state.book.map(function (b) {
          var open = b.ref.indexOf(":") !== -1
            ? '<button type="button" class="sirat-link" data-open-ref="' + escapeHtml(b.ref) + '">' + escapeHtml(b.ref) + ' · ' + escapeHtml(b.title) + '</button>'
            : '<span>' + escapeHtml(b.ref) + ' · ' + escapeHtml(b.title) + '</span>';
          return '<li>' + open + '<span>' + escapeHtml(b.note || '') + '</span></li>';
        }).join('') + '</ul>'
      : '<p class="sirat-muted">Empty. Travel hubs and collect signs.</p>';
    var asma = '<div class="sirat-chips">' + ASMA.map(function (a) {
      var on = state.asma.indexOf(a.id) !== -1;
      return '<span class="sirat-chip' + (on ? ' on' : '') + '" title="' + escapeHtml(a.en) + '">' +
        (on ? a.ar : '· · ·') + '</span>';
    }).join('') + '</div>';
    var comps = state.companions.length
      ? state.companions.map(function (c) { return '<span class="sirat-chip on">' + escapeHtml(c.label) + '</span>'; }).join('')
      : '<p class="sirat-muted">None yet.</p>';
    return panel("Book of Signs",
      signs + '<p class="sirat-muted">Asma seals</p>' + asma +
      '<p class="sirat-muted" style="margin-top:10px">Companions</p><div class="sirat-chips">' + comps + '</div>',
      [{ id: "close", label: "Close", primary: true }]);
  }

  function progressOverlay(state) {
    var rows = ["midian", "egypt", "sinai", "makkah", "ruins"].map(function (id) {
      var h = state.hubs[id];
      var status = !hubUnlocked(state, id) ? "locked" : (h.complete ? "complete" : "in progress");
      return '<li><b>' + id + '</b> — ' + status + '</li>';
    }).join('');
    return panel("Progress · Save / New Game+",
      '<p>Progress autosaves on this device.</p>' +
      '<ul class="sirat-book-list">' + rows + '</ul>' +
      '<p class="sirat-muted">Debates ' + Object.keys(state.debates).length + '/' + DEBATES.length +
      ' · Village law ' + Object.keys(state.calcs).length + '/' + CALCS.length +
      ' · Roots ' + state.roots.length + ' · Clarity ' + state.clarity + '</p>' +
      '<p class="sirat-muted">New Game+ keeps your Book and Asma, resets hubs, bumps NG+ count, and shuffles difficulty lightly via lower starting Clarity floor.</p>',
      [
        { id: "close", label: "Close", primary: true },
        { id: "ngplus", label: "New Game+" },
        { id: "reset-all", label: "Full reset" }
      ]);
  }

  function debatesListOverlay(state) {
    var list = DEBATES.map(function (d) {
      var done = !!state.debates[d.id];
      return '<button type="button" class="sirat-choice' + (done ? ' done' : '') +
        '" data-debate="' + d.id + '">' + (done ? '✓ ' : '') + escapeHtml(d.foe) + '</button>';
    }).join('');
    return panel("Trial of Speech",
      '<p>Answer denier and believer archetypes with the right root of character.</p>' +
      '<div class="sirat-options">' + list + '</div>',
      [{ id: "close", label: "Close", primary: true }]);
  }

  function debateOverlay(state, id) {
    var d = DEBATES.filter(function (x) { return x.id === id; })[0];
    if (!d) return "";
    if (state.debates[d.id]) {
      return panel(d.foe, "<p>Already resolved.</p>", [{ id: "debates-again", label: "Back", primary: true }]);
    }
    var opts = d.options.map(function (o, i) {
      return '<button type="button" class="sirat-choice" data-debate-pick="' + d.id + '|' + i + '">' +
        escapeHtml(o.text) + '</button>';
    }).join('');
    return panel("Debate · " + d.foe,
      '<p>' + escapeHtml(d.prompt) + '</p><div class="sirat-options">' + opts + '</div>',
      [{ id: "debates-again", label: "Back" }]);
  }

  function calcsListOverlay(state) {
    var list = CALCS.map(function (c) {
      var done = !!state.calcs[c.id];
      return '<button type="button" class="sirat-choice' + (done ? ' done' : '') +
        '" data-calc="' + c.id + '">' + (done ? '✓ ' : '') + escapeHtml(c.title) + '</button>';
    }).join('');
    return panel("Village law · Trial of Deed",
      '<p>Apply Qurʾanic numbers to village questions.</p>' +
      '<div class="sirat-options">' + list + '</div>',
      [{ id: "close", label: "Close", primary: true }]);
  }

  function calcOverlay(state, id) {
    var c = CALCS.filter(function (x) { return x.id === id; })[0];
    if (!c) return "";
    if (state.calcs[c.id]) {
      return panel(c.title, '<p>' + escapeHtml(c.note) + '</p>' +
        '<p><button type="button" class="sirat-link" data-open-ref="' + c.ref + '">Open ' + c.ref + '</button></p>',
        [{ id: "calcs-again", label: "Back", primary: true }]);
    }
    var opts = c.options.map(function (o, i) {
      return '<button type="button" class="sirat-choice" data-calc-pick="' + c.id + '|' + i + '">' +
        escapeHtml(o.text) + '</button>';
    }).join('');
    return panel(c.title, '<p>' + escapeHtml(c.prompt) + '</p><div class="sirat-options">' + opts + '</div>',
      [{ id: "calcs-again", label: "Back" }]);
  }

  function asmaHubOverlay(state) {
    var hub = state.hub;
    var h = curHub(state);
    var list = ASMA.filter(function (a) { return a.hub === hub; });
    var body = list.map(function (a) {
      var taken = state.asma.indexOf(a.id) !== -1;
      return '<button type="button" class="sirat-choice' + (taken ? ' done' : '') +
        '" data-take-asma="' + a.id + '"' + (taken ? ' disabled' : '') + '>' +
        (taken ? '✓ ' : 'Receive ') + escapeHtml(a.ar) + ' — ' + escapeHtml(a.en) +
        '</button>';
    }).join('');
    return panel("Asma seals · " + hub,
      '<p>Receive Names tied to this land. Spoken aloud when unlocked.</p>' +
      '<div class="sirat-options">' + body + '</div>',
      [{ id: "close", label: "Close", primary: true }]);
  }

  /* Midian overlays (condensed) */
  function midianOverlay(state) {
    var o = state.overlay;
    var h = state.hubs.midian;
    if (!o) return "";
    if (o.type === "hub-intro") {
      return panel("Midian",
        "<p>Wells, fair trade, and Shuʿayb’s warning against short measure. You are a seeker.</p>",
        [{ id: "hub-intro-ok", label: "Enter", primary: true }]);
    }
    if (o.type === "well") {
      return panel("The well of Midian",
        "<p>Men water flocks. Two women wait — their father is old. What do you do?</p>",
        [
          { id: "m-well-help", label: "Water their flocks, then seek shade", primary: true },
          { id: "m-well-wait", label: "Wait your turn" },
          { id: "m-well-pay", label: "Demand pay before helping" }
        ]);
    }
    if (o.type === "result") {
      return panel(o.title, "<p>" + escapeHtml(o.body) + "</p>" + (o.extra || ""),
        [{ id: "close", label: "Return", primary: true }]);
    }
    if (o.type === "mentor") {
      var lines = [
        "Peace upon the traveler. Midian remembers those who keep the balance.",
        "Prosperity tempts my people to shorten the measure.",
        "If you walk with justice, the market will test you."
      ];
      var step = h.mentorStep || 0;
      var more = step < lines.length - 1;
      return panel("Shuʿayb · شعيب",
        "<p>" + escapeHtml(lines[step]) + "</p>" +
        (step === 2 ? '<p class="sirat-gain">Root: <b>عدل · ʿadl</b></p>' : ""),
        more
          ? [{ id: "m-mentor-next", label: "Continue", primary: true }]
          : [{ id: "m-mentor-done", label: "I will remember", primary: true }]);
    }
    if (o.type === "market") {
      return panel("Market · Trial of Deed",
        "<p>A merchant’s scale reads light. He offers you a silent share.</p>",
        [
          { id: "m-mkt-ok", label: "Refuse; insist on full measure", primary: true },
          { id: "m-mkt-away", label: "Walk away quietly" },
          { id: "m-mkt-take", label: "Take the silent share" }
        ]);
    }
    if (o.type === "stones") {
      var hunts = [
        { id: "h1", title: "The straight Path", ans: "28:22", clue: "A traveler turns toward Midian hoping for the straight Path.", opts: ["28:22", "7:85", "12:21"], root: "rushd" },
        { id: "h2", title: "The well", ans: "28:23", clue: "Two women keep flocks back; their father is very old.", opts: ["28:24", "28:23", "11:84"], root: "saqy" },
        { id: "h3", title: "Just measure", ans: "7:85", clue: "Shuʿayb: give just measure and weight; withhold nothing due.", opts: ["26:181", "11:84", "7:85"], root: "wazn" }
      ];
      if (o.huntId) {
        var ht = hunts.filter(function (x) { return x.id === o.huntId; })[0];
        if (h.hunts[ht.id]) {
          var v = verseOf(ht.ans);
          return panel("Sign · " + ht.ans,
            (v ? '<p class="sirat-ar" lang="ar" dir="rtl">' + escapeHtml(v.ar) + '</p><p>' + escapeHtml(v.en) + '</p>' : "") +
            '<p><button type="button" class="sirat-link" data-open-ref="' + ht.ans + '">Open reader</button></p>',
            [{ id: "m-stones", label: "Back", primary: true }]);
        }
        return panel("Hunt of Signs",
          '<p>' + escapeHtml(ht.clue) + '</p><div class="sirat-options">' +
          ht.opts.map(function (opt) {
            return '<button type="button" class="sirat-choice" data-m-hunt="' + ht.id + '|' + opt + '|' + ht.ans + '|' + ht.root + '|' + escapeHtml(ht.title) + '">' + opt + '</button>';
          }).join('') + '</div>',
          [{ id: "m-stones", label: "Back" }]);
      }
      return panel("Stones of Signs",
        '<div class="sirat-options">' + hunts.map(function (ht) {
          return '<button type="button" class="sirat-choice' + (h.hunts[ht.id] ? ' done' : '') +
            '" data-m-open-hunt="' + ht.id + '">' + (h.hunts[ht.id] ? '✓ ' : '') + escapeHtml(ht.title) + '</button>';
        }).join('') + '</div>',
        [{ id: "close", label: "Close", primary: true }]);
    }
    return "";
  }

  function egyptOverlay(state) {
    var o = state.overlay;
    var h = state.hubs.egypt;
    if (!o) return "";
    if (o.type === "hub-intro") {
      return panel("Egypt",
        "<p>A land of betrayal and trust. Yusuf’s patience is your mentor — never a piece to command.</p>",
        [{ id: "hub-intro-ok", label: "Enter", primary: true }]);
    }
    if (o.type === "prison") {
      return panel("Prison night",
        "<p>You are wrongly blamed. Years may pass. How do you hold your Stance?</p>",
        [
          { id: "e-fork-sabr", label: "Wait with ṣabr; serve those around you", primary: true },
          { id: "e-fork-bitter", label: "Nurse bitterness and plan revenge" },
          { id: "e-fork-despair", label: "Despair of any good arriving" }
        ]);
    }
    if (o.type === "mentor") {
      var lines = [
        "Do not grieve for what they did — God is subtle with those who wait.",
        "When power returns, do not answer betrayal with humiliation.",
        "This day let no reproach be on you. Mercy closes the wound."
      ];
      var step = h.mentorStep || 0;
      return panel("Yusuf · يوسف",
        '<p class="sirat-role">Mentor · interpreter of trust</p><p>' + escapeHtml(lines[step]) + '</p>',
        step < 2
          ? [{ id: "e-mentor-next", label: "Continue", primary: true }]
          : [{ id: "e-mentor-done", label: "I learn mercy", primary: true }]);
    }
    if (o.type === "court") {
      return panel("Court of forgiveness",
        "<p>Those who wronged you stand exposed. What do you speak?</p>",
        [
          { id: "e-court-mercy", label: "No reproach this day — God forgives", primary: true },
          { id: "e-court-score", label: "List every wrong publicly" },
          { id: "e-court-exile", label: "Cast them out forever" }
        ]);
    }
    if (o.type === "nile") {
      if (h.hunts.e1) {
        return panel("Sign · 12:92", "<p>Already collected.</p>" +
          '<p><button type="button" class="sirat-link" data-open-ref="12:92">Open 12:92</button></p>',
          [{ id: "close", label: "Close", primary: true }]);
      }
      return panel("Nile stone",
        "<p>Clue: On the day of recognition he says — this day let no reproach be on you.</p>" +
        '<div class="sirat-options">' +
          ["12:90", "12:92", "28:24"].map(function (r) {
            return '<button type="button" class="sirat-choice" data-e-hunt="' + r + '">' + r + '</button>';
          }).join('') + '</div>',
        [{ id: "close", label: "Back" }]);
    }
    if (o.type === "result") {
      return panel(o.title, "<p>" + escapeHtml(o.body) + "</p>" + (o.extra || ""),
        [{ id: "close", label: "Return", primary: true }]);
    }
    return "";
  }

  function sinaiOverlay(state) {
    var o = state.overlay;
    var h = state.hubs.sinai;
    if (!o) return "";
    if (o.type === "hub-intro") {
      return panel("Sinai",
        "<p>The Mount. Covenant and law. Remove what blinds you before you approach.</p>",
        [{ id: "hub-intro-ok", label: "Enter", primary: true }]);
    }
    if (o.type === "valley") {
      return panel("Sacred valley",
        "<p>A voice: remove your shoes — you are in a sacred valley. What do you set down?</p>",
        [
          { id: "s-fork-shoes", label: "Set down pride and hurry; approach humbly", primary: true },
          { id: "s-fork-keep", label: "Keep your status; approach as you are" },
          { id: "s-fork-flee", label: "Flee the voice" }
        ]);
    }
    if (o.type === "mentor") {
      var lines = [
        "Covenant is not a chain of fear alone — it is remembrance with the Mount above you.",
        "Law without mercy hardens; mercy without law dissolves.",
        "Carry guidance; do not claim to own it."
      ];
      var step = h.mentorStep || 0;
      return panel("Musa · موسى",
        '<p class="sirat-role">Mentor · at the Mount</p><p>' + escapeHtml(lines[step]) + '</p>',
        step < 2
          ? [{ id: "s-mentor-next", label: "Continue", primary: true }]
          : [{ id: "s-mentor-done", label: "I accept counsel", primary: true }]);
    }
    if (o.type === "covenant") {
      return panel("Covenant trial",
        "<p>The people want a god they can see. You are offered a glittering substitute.</p>",
        [
          { id: "s-cov-hold", label: "Hold the covenant; refuse the substitute", primary: true },
          { id: "s-cov-bend", label: "Allow a ‘small’ visible god for unity" },
          { id: "s-cov-rage", label: "Smash everything in anger first" }
        ]);
    }
    if (o.type === "tablet") {
      if (h.hunts.s1) {
        return panel("Sign · 2:63", "<p>Collected.</p>" +
          '<p><button type="button" class="sirat-link" data-open-ref="2:63">Open 2:63</button></p>',
          [{ id: "close", label: "Close", primary: true }]);
      }
      return panel("Tablet hunt",
        "<p>Clue: We took your covenant and raised above you the Mount.</p>" +
        '<div class="sirat-options">' +
          ["20:12", "2:63", "7:85"].map(function (r) {
            return '<button type="button" class="sirat-choice" data-s-hunt="' + r + '">' + r + '</button>';
          }).join('') + '</div>',
        [{ id: "close", label: "Back" }]);
    }
    if (o.type === "result") {
      return panel(o.title, "<p>" + escapeHtml(o.body) + "</p>" + (o.extra || ""),
        [{ id: "close", label: "Return", primary: true }]);
    }
    return "";
  }

  function makkahOverlay(state) {
    var o = state.overlay;
    var h = state.hubs.makkah;
    if (!o) return "";
    if (o.type === "hub-intro") {
      return panel("Makkah / Bakkah",
        "<p>The first House. Security and assembly. Mentors of the line of Ibrahim guide — you do not play them.</p>",
        [{ id: "hub-intro-ok", label: "Enter", primary: true }]);
    }
    if (o.type === "house") {
      return panel("At the House",
        "<p>The House is made a place of assembly and security. How do you enter?</p>",
        [
          { id: "k-fork-amn", label: "Enter as a guest of amn — leave harm outside", primary: true },
          { id: "k-fork-trade", label: "Enter mainly to network and trade" },
          { id: "k-fork-pride", label: "Enter to be seen as pious" }
        ]);
    }
    if (o.type === "mentor") {
      var lines = [
        "Leave what partners with God — even the polished ones in the heart.",
        "Build for people a place of return, not a throne for the self.",
        "Gratitude (shukr) keeps the House from becoming a marketplace of egos."
      ];
      var step = h.mentorStep || 0;
      return panel("Ibrahim · إبراهيم",
        '<p class="sirat-role">Mentor · friend of God</p><p>' + escapeHtml(lines[step]) + '</p>',
        step < 2
          ? [{ id: "k-mentor-next", label: "Continue", primary: true }]
          : [{ id: "k-mentor-done", label: "I hear", primary: true }]);
    }
    if (o.type === "idol") {
      return panel("Heart-idol trial",
        "<p>A hidden idol: reputation. Smash the stone outside while keeping the idol inside?</p>",
        [
          { id: "k-idol-break", label: "Break both — outer and inner", primary: true },
          { id: "k-idol-show", label: "Break only what people see" },
          { id: "k-idol-keep", label: "Keep reputation; call it dawah for show" }
        ]);
    }
    if (o.type === "stone") {
      if (h.hunts.k1) {
        return panel("Sign · 3:96", "<p>Collected.</p>" +
          '<p><button type="button" class="sirat-link" data-open-ref="3:96">Open 3:96</button></p>',
          [{ id: "close", label: "Close", primary: true }]);
      }
      return panel("Inscription",
        "<p>Clue: The first House appointed for men was that at Bakka…</p>" +
        '<div class="sirat-options">' +
          ["2:125", "3:96", "28:22"].map(function (r) {
            return '<button type="button" class="sirat-choice" data-k-hunt="' + r + '">' + r + '</button>';
          }).join('') + '</div>',
        [{ id: "close", label: "Back" }]);
    }
    if (o.type === "result") {
      return panel(o.title, "<p>" + escapeHtml(o.body) + "</p>" + (o.extra || ""),
        [{ id: "close", label: "Return", primary: true }]);
    }
    return "";
  }

  function ruinsOverlay(state) {
    var o = state.overlay;
    if (!o) return "";
    if (o.type === "hub-intro") {
      return panel("Ruined zones",
        "<p>You do not conquer these lands. You witness, recover a sign, and refuse the same mistake.</p>",
        [{ id: "hub-intro-ok", label: "Enter carefully", primary: true }]);
    }
    if (o.type === "ruin-ad") {
      return panel("ʿAd · Iram of the pillars",
        "<p>Pride built pillars into the sky. What do you take from the ruin?</p>",
        [
          { id: "r-ad-humility", label: "Humility — strength without arrogance", primary: true },
          { id: "r-ad-power", label: "A hunger to build taller still" }
        ]);
    }
    if (o.type === "ruin-thamud") {
      return panel("Thamud · the she-camel",
        "<p>A clear sign was hamstrung. How do you answer the memory?</p>",
        [
          { id: "r-th-respect", label: "Respect signs; do not slaughter what God made a proof", primary: true },
          { id: "r-th-mock", label: "Treat signs as superstition" }
        ]);
    }
    if (o.type === "ruin-pharaoh") {
      return panel("Pharaoh’s brink",
        "<p>Water closes. At the last breath some claim belief. What do you learn?</p>",
        [
          { id: "r-ph-now", label: "Turn before the brink — delayed faith may come too late", primary: true },
          { id: "r-ph-gamble", label: "Live as you wish; repent at the end" }
        ]);
    }
    if (o.type === "result") {
      return panel(o.title, "<p>" + escapeHtml(o.body) + "</p>" + (o.extra || ""),
        [{ id: "close", label: "Return", primary: true }]);
    }
    return "";
  }

  function overlayHtml(state) {
    var o = state.overlay;
    if (!o) return "";
    if (o.type === "world-intro") {
      return panel("As-Sirat · Map of Signs",
        "<p>Travel Qurʾanic lands as a <b>seeker</b>. Mentors guide; they are never playable. Unlock hubs in order, debate archetypes, settle village law, and collect Asma seals.</p>",
        [{ id: "world-intro-ok", label: "Begin", primary: true }]);
    }
    if (o.type === "book") return bookOverlay(state);
    if (o.type === "progress") return progressOverlay(state);
    if (o.type === "debates") return debatesListOverlay(state);
    if (o.type === "debate") return debateOverlay(state, o.id);
    if (o.type === "calcs") return calcsListOverlay(state);
    if (o.type === "calc") return calcOverlay(state, o.id);
    if (o.type === "asma") return asmaHubOverlay(state);
    if (o.type === "locked") {
      return panel("Locked", "<p>" + escapeHtml(o.body) + "</p>", [{ id: "close", label: "OK", primary: true }]);
    }
    if (state.hub === "midian") return midianOverlay(state);
    if (state.hub === "egypt") return egyptOverlay(state);
    if (state.hub === "sinai") return sinaiOverlay(state);
    if (state.hub === "makkah") return makkahOverlay(state);
    if (state.hub === "ruins") return ruinsOverlay(state);
    return "";
  }

  /* ---------- RENDER ---------- */
  function statusLine(state) {
    if (state.screen === "world") {
      var done = ["midian", "egypt", "sinai", "makkah", "ruins"].filter(function (id) { return hubDone(state, id); }).length;
      return done >= 5 ? "All hubs witnessed" : "Choose a hub on the Map of Signs";
    }
    var names = { midian: "Midian", egypt: "Egypt", sinai: "Sinai", makkah: "Makkah", ruins: "Ruins" };
    var h = curHub(state);
    return names[state.hub] + (h && h.complete ? " · complete" : " · in progress");
  }

  function render(root, state) {
    if (!root) return;
    refreshHubComplete(state);
    persist(state);

    var map = "";
    if (state.screen === "world") map = worldHtml(state);
    else if (state.hub === "midian") map = midianMap(state);
    else if (state.hub === "egypt") map = egyptMap(state);
    else if (state.hub === "sinai") map = sinaiMap(state);
    else if (state.hub === "makkah") map = makkahMap(state);
    else if (state.hub === "ruins") map = ruinsMap(state);

    var rootChips = Object.keys(ROOTS).slice(0, 10).map(function (id) {
      var r = ROOTS[id];
      var on = hasRoot(state, id);
      return '<span class="sirat-chip' + (on ? ' on' : '') + '">' + (on ? r.ar : '·') + '</span>';
    }).join('');

    root.innerHTML =
      '<div class="sirat">' +
        '<div class="sirat-stage"><div class="sirat-stage-inner">' +
          '<header class="sirat-head">' +
            '<div class="sirat-brand">' +
              '<span class="sirat-crystal" aria-hidden="true"></span>' +
              '<div><h1>As-Sirat</h1>' +
                '<p class="lead">Multi-hub knowledge RPG — seeker, not prophet.</p></div>' +
            '</div>' +
            '<p class="sirat-status">' + escapeHtml(statusLine(state)) + '</p>' +
          '</header>' +
          metersHtml(state) +
          '<div class="sirat-roots"><span class="sirat-label">Roots</span>' +
            '<div class="sirat-chips">' + rootChips + '</div></div>' +
          map +
          '<p class="sirat-hint">Autosave on · Book &amp; Progress on the world map · TTS on unlocks</p>' +
        '</div></div>' +
        overlayHtml(state) +
      '</div>';
  }

  /* ---------- ACTIONS ---------- */
  function enterHub(state, id) {
    if (!hubUnlocked(state, id)) {
      state.overlay = { type: "locked", body: "Complete the previous hub on the Straight Path first." };
      return;
    }
    state.screen = "hub";
    state.hub = id;
    var h = state.hubs[id];
    if (!h.intro) state.overlay = { type: "hub-intro" };
    else state.overlay = null;
  }

  function result(state, title, body, extra) {
    state.overlay = { type: "result", title: title, body: body, extra: extra || "" };
  }

  function onAction(root, state, act) {
    var h = curHub(state);

    if (act === "close") state.overlay = null;
    else if (act === "world-intro-ok") { state.worldIntro = true; state.overlay = null; }
    else if (act === "hub-intro-ok") { if (h) h.intro = true; state.overlay = null; }
    else if (act === "debates-again") state.overlay = { type: "debates" };
    else if (act === "calcs-again") state.overlay = { type: "calcs" };
    else if (act === "m-stones") state.overlay = { type: "stones" };

    /* Midian */
    else if (act === "m-well-help") {
      h.wellChoice = "help"; addTag(state, "helper", "believe");
      unlockRoot(state, "saqy"); unlockRoot(state, "sabr");
      addCompanion(state, "sabr", "Sabr · Patience");
      addBook(state, { ref: "28:24", title: "Watered, then shade", note: "Helped without demand." });
      state.clarity = clamp(state.clarity + 12, 0, 100);
      result(state, "You watered their flocks", "Shuʿayb’s tent opens. Roots of watering and patience awaken.");
    } else if (act === "m-well-wait") {
      h.wellChoice = "wait"; addTag(state, "passive", "believe"); unlockRoot(state, "sabr");
      result(state, "You waited", "Little harm, little help. Patience known; fuller mercy unclaimed.");
    } else if (act === "m-well-pay") {
      h.wellChoice = "pay"; addTag(state, "mercenary", "deny"); unlockRoot(state, "saqy");
      state.clarity = clamp(state.clarity - 8, 0, 100);
      result(state, "You demanded pay", "Stance tilts toward denial. Listen carefully to Shuʿayb.");
    } else if (act === "m-mentor-next") {
      h.mentorStep = (h.mentorStep || 0) + 1;
      if (h.mentorStep >= 2) unlockRoot(state, "adl");
    } else if (act === "m-mentor-done") {
      unlockRoot(state, "adl"); unlockRoot(state, "rushd");
      h.mentorDone = true;
      addBook(state, { ref: "11:84", title: "Shuʿayb’s warning", note: "Do not give short measure." });
      state.overlay = null;
    } else if (act === "m-mkt-ok") {
      h.trialDone = true; addTag(state, "just", "believe");
      unlockRoot(state, "wazn"); unlockRoot(state, "adl");
      addCompanion(state, "adl", "Adl · Justice");
      addBook(state, { ref: "7:85", title: "Give just measure", note: "Refused short weight." });
      state.clarity = clamp(state.clarity + 12, 0, 100);
      result(state, "The balance holds", "Stones of Signs unlock.",
        '<p class="sirat-gain">Companion Adl · roots وزن / عدل</p>');
    } else if (act === "m-mkt-away") {
      h.trialDone = true; addTag(state, "avoidant", "deny"); unlockRoot(state, "wazn");
      result(state, "You walked away", "You did not share the fraud — nor stop it.");
    } else if (act === "m-mkt-take") {
      h.trialDone = true; addTag(state, "cheater", "deny"); unlockRoot(state, "wazn");
      state.clarity = clamp(state.clarity - 14, 0, 100);
      result(state, "Silent share", "Clarity damaged. The inscriptions grow harder to read.");
    }

    /* Egypt */
    else if (act === "e-fork-sabr") {
      h.fork = "sabr"; addTag(state, "patient", "believe");
      unlockRoot(state, "sabr"); unlockRoot(state, "tawakkul");
      addCompanion(state, "tawakkul", "Tawakkul · Trust");
      result(state, "Prison patience", "You serve without bitterness. Yusuf’s counsel opens.");
    } else if (act === "e-fork-bitter") {
      h.fork = "bitter"; addTag(state, "vengeful", "deny"); unlockRoot(state, "khwn");
      state.clarity = clamp(state.clarity - 6, 0, 100);
      result(state, "Bitterness", "You know betrayal’s name — but not how to leave it.");
    } else if (act === "e-fork-despair") {
      h.fork = "despair"; addTag(state, "despairing", "deny");
      state.clarity = clamp(state.clarity - 10, 0, 100);
      result(state, "Despair", "Clarity dims. Mentors still speak — listen.");
    } else if (act === "e-mentor-next") {
      h.mentorStep = (h.mentorStep || 0) + 1;
    } else if (act === "e-mentor-done") {
      h.mentorDone = true; unlockRoot(state, "rahm"); unlockRoot(state, "amn");
      addBook(state, { ref: "12:92", title: "No reproach", note: "Mercy at the court." });
      state.overlay = null;
    } else if (act === "e-court-mercy") {
      h.trialDone = true; addTag(state, "merciful", "believe");
      addCompanion(state, "rahm", "Raḥma · Mercy");
      state.clarity = clamp(state.clarity + 14, 0, 100);
      result(state, "No reproach", "The Nile stone unlocks. Forgiveness is strength.");
    } else if (act === "e-court-score") {
      h.trialDone = true; addTag(state, "scorekeeper", "deny");
      result(state, "Public ledger", "Truth without mercy. The stone still opens — colder.");
    } else if (act === "e-court-exile") {
      h.trialDone = true; addTag(state, "exile", "deny");
      state.clarity = clamp(state.clarity - 8, 0, 100);
      result(state, "Exile", "Power spent on casting out.");
    }

    /* Sinai */
    else if (act === "s-fork-shoes") {
      h.fork = "humble"; addTag(state, "humble", "believe");
      unlockRoot(state, "huda"); unlockRoot(state, "taqwa");
      result(state, "Shoes removed", "You approach the Mount lighter.");
    } else if (act === "s-fork-keep") {
      h.fork = "status"; addTag(state, "status", "deny");
      state.clarity = clamp(state.clarity - 5, 0, 100);
      result(state, "Status kept", "The voice still speaks — status muffles it.");
    } else if (act === "s-fork-flee") {
      h.fork = "flee"; addTag(state, "fleeing", "deny");
      state.clarity = clamp(state.clarity - 10, 0, 100);
      result(state, "Flight", "You circle back later. Mentors wait.");
    } else if (act === "s-mentor-next") {
      h.mentorStep = (h.mentorStep || 0) + 1;
    } else if (act === "s-mentor-done") {
      h.mentorDone = true; unlockRoot(state, "mithaq");
      addBook(state, { ref: "20:12", title: "Sacred valley", note: "Remove thy shoes." });
      state.overlay = null;
    } else if (act === "s-cov-hold") {
      h.trialDone = true; addTag(state, "covenant", "believe");
      addCompanion(state, "taqwa", "Taqwā");
      state.clarity = clamp(state.clarity + 12, 0, 100);
      result(state, "Covenant held", "Tablet hunt unlocks.");
    } else if (act === "s-cov-bend") {
      h.trialDone = true; addTag(state, "compromise", "deny");
      result(state, "Small god allowed", "Unity bought too cheaply.");
    } else if (act === "s-cov-rage") {
      h.trialDone = true; addTag(state, "rage", "deny"); unlockRoot(state, "fasaad");
      state.clarity = clamp(state.clarity - 6, 0, 100);
      result(state, "Rage first", "Zeal without wisdom scatters.");
    }

    /* Makkah */
    else if (act === "k-fork-amn") {
      h.fork = "amn"; addTag(state, "secure", "believe");
      unlockRoot(state, "amn"); unlockRoot(state, "taqwa");
      result(state, "Guest of security", "Ibrahim’s counsel opens.");
    } else if (act === "k-fork-trade") {
      h.fork = "trade"; addTag(state, "transactional", "deny");
      result(state, "Network first", "The House is more than a market.");
    } else if (act === "k-fork-pride") {
      h.fork = "pride"; addTag(state, "showy", "deny");
      state.clarity = clamp(state.clarity - 8, 0, 100);
      result(state, "Seen as pious", "Clarity dims under performance.");
    } else if (act === "k-mentor-next") {
      h.mentorStep = (h.mentorStep || 0) + 1;
    } else if (act === "k-mentor-done") {
      h.mentorDone = true; unlockRoot(state, "shukr");
      addCompanion(state, "shukr", "Shukr · Gratitude");
      addBook(state, { ref: "2:125", title: "House of security", note: "Assembly and amn." });
      state.overlay = null;
    } else if (act === "k-idol-break") {
      h.trialDone = true; addTag(state, "sincere", "believe");
      state.clarity = clamp(state.clarity + 14, 0, 100);
      result(state, "Inner idol broken", "Inscription unlocks. The House is clearer.");
    } else if (act === "k-idol-show") {
      h.trialDone = true; addTag(state, "hypocrite-lite", "deny");
      result(state, "Outer only", "Stones fall; the heart-idol remains.");
    } else if (act === "k-idol-keep") {
      h.trialDone = true; addTag(state, "reputation", "deny");
      state.clarity = clamp(state.clarity - 10, 0, 100);
      result(state, "Reputation kept", "Dawah as display.");
    }

    /* Ruins */
    else if (act === "r-ad-humility") {
      h.special = h.special || {}; h.special.ad = "humility";
      addTag(state, "humble-ruins", "believe"); unlockRoot(state, "taqwa");
      addBook(state, { ref: "89:6", title: "ʿAd", note: "How thy Lord dealt with 'Ad." });
      result(state, "ʿAd witnessed", "Humility kept. Pillars stay fallen.");
    } else if (act === "r-ad-power") {
      h.special = h.special || {}; h.special.ad = "power";
      addTag(state, "proud", "deny"); state.clarity = clamp(state.clarity - 8, 0, 100);
      addBook(state, { ref: "89:6", title: "ʿAd", note: "Warning half-heard." });
      result(state, "Hunger for height", "The ruin did not teach you — yet.");
    } else if (act === "r-th-respect") {
      h.special = h.special || {}; h.special.thamud = "respect";
      addTag(state, "sign-keeper", "believe");
      addBook(state, { ref: "7:73", title: "Thamud", note: "She-camel of Allah." });
      result(state, "Thamud witnessed", "Signs are not for slaughter.");
    } else if (act === "r-th-mock") {
      h.special = h.special || {}; h.special.thamud = "mock";
      addTag(state, "mocker", "deny"); state.clarity = clamp(state.clarity - 10, 0, 100);
      addBook(state, { ref: "7:73", title: "Thamud", note: "Sign mocked." });
      result(state, "Mockery", "Clarity cracks like rock dwellings.");
    } else if (act === "r-ph-now") {
      h.special = h.special || {}; h.special.pharaoh = "now";
      addTag(state, "timely", "believe"); unlockRoot(state, "huda");
      addBook(state, { ref: "10:90", title: "Pharaoh’s brink", note: "Turn before drowning." });
      result(state, "Before the brink", "Belief delayed can be belief denied.");
    } else if (act === "r-ph-gamble") {
      h.special = h.special || {}; h.special.pharaoh = "gamble";
      addTag(state, "gambler", "deny"); state.clarity = clamp(state.clarity - 12, 0, 100);
      addBook(state, { ref: "10:90", title: "Pharaoh’s brink", note: "Gamble recorded." });
      result(state, "Gamble on the end", "The water does not wait.");
    }

    else if (act === "ngplus") {
      state.ngPlus += 1;
      var keptBook = state.book.slice();
      var keptAsma = state.asma.slice();
      var keptRoots = state.roots.slice();
      var keptComp = state.companions.slice();
      ["midian", "egypt", "sinai", "makkah", "ruins"].forEach(function (id) {
        state.hubs[id] = emptyHub(id);
      });
      state.book = keptBook;
      state.asma = keptAsma;
      state.roots = keptRoots;
      state.companions = keptComp;
      state.debates = {};
      state.calcs = {};
      state.clarity = clamp(35 + state.ngPlus * 2, 35, 60);
      state.believe = Math.max(0, state.believe - 2);
      state.deny = Math.max(0, state.deny - 2);
      state.screen = "world";
      state.hub = null;
      state.worldIntro = false;
      state.overlay = { type: "world-intro" };
    } else if (act === "reset-all") {
      if (global.confirm("Full reset of As-Sirat on this device?")) {
        var fresh = defaultState();
        Object.keys(state).forEach(function (k) { delete state[k]; });
        Object.keys(fresh).forEach(function (k) { state[k] = fresh[k]; });
        state.overlay = { type: "world-intro" };
        try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* ignore */ }
      }
    }

    render(root, state);
  }

  function bind(root, state) {
    root.onclick = function (e) {
      var actBtn = e.target.closest("[data-act]");
      if (actBtn) { onAction(root, state, actBtn.getAttribute("data-act")); return; }

      var loc = e.target.closest("[data-loc]");
      if (loc && !loc.disabled) {
        var id = loc.getAttribute("data-loc");
        if (state.screen === "world") {
          if (id === "book") state.overlay = { type: "book" };
          else if (id === "progress") state.overlay = { type: "progress" };
          else if (id === "debates") {
            if (!hubDone(state, "midian")) state.overlay = { type: "locked", body: "Complete Midian to open Trials of Speech." };
            else state.overlay = { type: "debates" };
          } else if (id === "calcs") {
            if (!hubDone(state, "egypt")) state.overlay = { type: "locked", body: "Complete Egypt to open Village law." };
            else state.overlay = { type: "calcs" };
          } else enterHub(state, id);
          render(root, state);
          return;
        }
        /* in-hub */
        if (id === "back") {
          state.screen = "world"; state.hub = null; state.overlay = null;
          render(root, state); return;
        }
        if (id === "asma-spot") { state.overlay = { type: "asma" }; render(root, state); return; }

        var h = curHub(state);
        if (state.hub === "midian") {
          if (id === "well") state.overlay = h.wellChoice ? { type: "result", title: "Well (done)", body: "Stance already chosen." } : { type: "well" };
          if (id === "tent") state.overlay = h.mentorDone ? { type: "result", title: "Shuʿayb", body: "Counsel remembered." } : { type: "mentor" };
          if (id === "market") state.overlay = h.trialDone ? { type: "result", title: "Market (done)", body: "Trial finished." } : { type: "market" };
          if (id === "stones") state.overlay = { type: "stones" };
        }
        if (state.hub === "egypt") {
          if (id === "prison") state.overlay = h.fork ? { type: "result", title: "Prison (done)", body: "Fork already chosen." } : { type: "prison" };
          if (id === "yusuf") state.overlay = { type: "mentor" };
          if (id === "court") state.overlay = h.trialDone ? { type: "result", title: "Court (done)", body: "Trial finished." } : { type: "court" };
          if (id === "nile") state.overlay = { type: "nile" };
        }
        if (state.hub === "sinai") {
          if (id === "valley") state.overlay = h.fork ? { type: "result", title: "Valley (done)", body: "Fork chosen." } : { type: "valley" };
          if (id === "musa") state.overlay = { type: "mentor" };
          if (id === "covenant") state.overlay = h.trialDone ? { type: "result", title: "Covenant (done)", body: "Trial finished." } : { type: "covenant" };
          if (id === "tablet") state.overlay = { type: "tablet" };
        }
        if (state.hub === "makkah") {
          if (id === "house") state.overlay = h.fork ? { type: "result", title: "House (done)", body: "Fork chosen." } : { type: "house" };
          if (id === "ibrahim") state.overlay = { type: "mentor" };
          if (id === "idol") state.overlay = h.trialDone ? { type: "result", title: "Trial done", body: "Heart-idol faced." } : { type: "idol" };
          if (id === "stone") state.overlay = { type: "stone" };
        }
        if (state.hub === "ruins") {
          if (id === "ad") state.overlay = { type: "ruin-ad" };
          if (id === "thamud") state.overlay = { type: "ruin-thamud" };
          if (id === "pharaoh") state.overlay = { type: "ruin-pharaoh" };
        }
        render(root, state);
        return;
      }

      var takeAsma = e.target.closest("[data-take-asma]");
      if (takeAsma && !takeAsma.disabled) {
        var aid = takeAsma.getAttribute("data-take-asma");
        if (addAsma(state, aid)) {
          var hh = curHub(state);
          if (hh) { hh.asmaTaken = hh.asmaTaken || {}; hh.asmaTaken[aid] = true; }
        }
        state.overlay = { type: "asma" };
        render(root, state);
        return;
      }

      var deb = e.target.closest("[data-debate]");
      if (deb) { state.overlay = { type: "debate", id: deb.getAttribute("data-debate") }; render(root, state); return; }

      var dp = e.target.closest("[data-debate-pick]");
      if (dp) {
        var parts = dp.getAttribute("data-debate-pick").split("|");
        var d = DEBATES.filter(function (x) { return x.id === parts[0]; })[0];
        var opt = d && d.options[+parts[1]];
        if (opt && opt.ok) {
          state.debates[d.id] = true;
          if (opt.root) unlockRoot(state, opt.root);
          addTag(state, "debater", "believe");
          state.clarity = clamp(state.clarity + 8, 0, 100);
          state.overlay = { type: "result", title: "Speech held", body: d.win };
        } else {
          state.clarity = clamp(state.clarity - 5, 0, 100);
          addTag(state, "misspoke", "deny");
          state.overlay = { type: "result", title: "Word missed", body: "Clarity dims. Try another angle later." };
        }
        render(root, state);
        return;
      }

      var calc = e.target.closest("[data-calc]");
      if (calc) { state.overlay = { type: "calc", id: calc.getAttribute("data-calc") }; render(root, state); return; }

      var cp = e.target.closest("[data-calc-pick]");
      if (cp) {
        var cp2 = cp.getAttribute("data-calc-pick").split("|");
        var c = CALCS.filter(function (x) { return x.id === cp2[0]; })[0];
        var o = c && c.options[+cp2[1]];
        if (o && o.ok) {
          state.calcs[c.id] = true;
          unlockRoot(state, "adl");
          state.clarity = clamp(state.clarity + 10, 0, 100);
          addBook(state, { ref: c.ref, title: c.title, note: c.note });
          state.overlay = { type: "result", title: "Law applied", body: c.note,
            extra: '<p><button type="button" class="sirat-link" data-open-ref="' + c.ref + '">Open ' + c.ref + '</button></p>' };
        } else {
          state.clarity = clamp(state.clarity - 5, 0, 100);
          state.overlay = { type: "result", title: "Misapplied", body: "Check the verse again." };
        }
        render(root, state);
        return;
      }

      /* Midian hunts */
      var moh = e.target.closest("[data-m-open-hunt]");
      if (moh) { state.overlay = { type: "stones", huntId: moh.getAttribute("data-m-open-hunt") }; render(root, state); return; }
      var mh = e.target.closest("[data-m-hunt]");
      if (mh) {
        var mp = mh.getAttribute("data-m-hunt").split("|");
        var hubM = state.hubs.midian;
        if (mp[1] === mp[2]) {
          hubM.hunts[mp[0]] = true;
          unlockRoot(state, mp[3]);
          addBook(state, { ref: mp[2], title: mp[4], note: "Stone of Signs." });
          state.clarity = clamp(state.clarity + 10, 0, 100);
          var vv = verseOf(mp[2]);
          state.overlay = { type: "result", title: "Sign · " + mp[2], body: "Correct.",
            extra: (vv ? '<p class="sirat-ar" lang="ar" dir="rtl">' + escapeHtml(vv.ar) + '</p><p>' + escapeHtml(vv.en) + '</p>' : "") +
              '<p><button type="button" class="sirat-link" data-open-ref="' + mp[2] + '">Open reader</button></p>' };
        } else {
          state.clarity = clamp(state.clarity - 5, 0, 100);
          state.overlay = { type: "result", title: "Not that ayah", body: "Try again from the Stones." };
        }
        render(root, state);
        return;
      }

      var eh = e.target.closest("[data-e-hunt]");
      if (eh) {
        var er = eh.getAttribute("data-e-hunt");
        if (er === "12:92") {
          state.hubs.egypt.hunts.e1 = true;
          unlockRoot(state, "rahm");
          addBook(state, { ref: "12:92", title: "No reproach", note: "Nile stone." });
          state.clarity = clamp(state.clarity + 10, 0, 100);
          state.overlay = { type: "result", title: "Sign · 12:92", body: "Mercy remembered.",
            extra: '<p><button type="button" class="sirat-link" data-open-ref="12:92">Open reader</button></p>' };
        } else {
          state.clarity = clamp(state.clarity - 5, 0, 100);
          state.overlay = { type: "result", title: "Not that ayah", body: "Read the clue again." };
        }
        render(root, state);
        return;
      }

      var sh = e.target.closest("[data-s-hunt]");
      if (sh) {
        var sr = sh.getAttribute("data-s-hunt");
        if (sr === "2:63") {
          state.hubs.sinai.hunts.s1 = true;
          unlockRoot(state, "mithaq");
          addBook(state, { ref: "2:63", title: "Covenant & Mount", note: "Tablet." });
          state.clarity = clamp(state.clarity + 10, 0, 100);
          state.overlay = { type: "result", title: "Sign · 2:63", body: "Covenant recalled.",
            extra: '<p><button type="button" class="sirat-link" data-open-ref="2:63">Open reader</button></p>' };
        } else {
          state.clarity = clamp(state.clarity - 5, 0, 100);
          state.overlay = { type: "result", title: "Not that ayah", body: "Try again." };
        }
        render(root, state);
        return;
      }

      var kh = e.target.closest("[data-k-hunt]");
      if (kh) {
        var kr = kh.getAttribute("data-k-hunt");
        if (kr === "3:96") {
          state.hubs.makkah.hunts.k1 = true;
          unlockRoot(state, "amn");
          addBook(state, { ref: "3:96", title: "First House", note: "Bakka." });
          state.clarity = clamp(state.clarity + 10, 0, 100);
          state.overlay = { type: "result", title: "Sign · 3:96", body: "The House named.",
            extra: '<p><button type="button" class="sirat-link" data-open-ref="3:96">Open reader</button></p>' };
        } else {
          state.clarity = clamp(state.clarity - 5, 0, 100);
          state.overlay = { type: "result", title: "Not that ayah", body: "Try again." };
        }
        render(root, state);
        return;
      }

      var openRef = e.target.closest("[data-open-ref]");
      if (openRef && api.openVerse) {
        var ra = openRef.getAttribute("data-open-ref").split(":");
        if (ra.length === 2) api.openVerse(+ra[0], +ra[1]);
      }
    };
  }

  function mount(rootEl, opts) {
    if (!rootEl) return null;
    api.getVerse = opts && opts.getVerse ? opts.getVerse : null;
    api.openVerse = opts && opts.openVerse ? opts.openVerse : null;
    var state = loadState();
    if (!state.worldIntro) state.overlay = { type: "world-intro" };
    bind(rootEl, state);
    render(rootEl, state);
    return {
      refresh: function () { render(rootEl, state); },
      reset: function () {
        localStorage.removeItem(STORE_KEY);
        state = loadState();
        state.overlay = { type: "world-intro" };
        bind(rootEl, state);
        render(rootEl, state);
      }
    };
  }

  global.AlQuranGame = { mount: mount };
})(window);
