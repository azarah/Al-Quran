/* As-Sirat — Midian vertical slice (knowledge RPG) */
(function (global) {
  "use strict";

  var STORE_KEY = "alquran-sirat-midian-v1";

  var ROOTS = {
    rushd: { ar: "رشد", en: "rushd", gloss: "right guidance / the straight way" },
    saqy: { ar: "سقي", en: "saqy", gloss: "to water / give drink" },
    sabr: { ar: "صبر", en: "ṣabr", gloss: "patience / steadfastness" },
    wazn: { ar: "وزن", en: "wazn", gloss: "weight / balance" },
    adl: { ar: "عدل", en: "ʿadl", gloss: "justice / fairness" }
  };

  var HUNTS = [
    {
      id: "h1",
      clue: "A traveler turns toward Midian and hopes his Lord will show him the smooth and straight Path.",
      answer: "28:22",
      options: ["28:22", "7:85", "12:21"],
      bookTitle: "The straight Path",
      root: "rushd"
    },
    {
      id: "h2",
      clue: "At Midian's watering place: men watering flocks, and two women keeping theirs back because their father is very old.",
      answer: "28:23",
      options: ["28:24", "28:23", "11:84"],
      bookTitle: "The well of Midian",
      root: "saqy"
    },
    {
      id: "h3",
      clue: "Shuʿayb warns his people: give just measure and weight; do not withhold from people what is their due.",
      answer: "7:85",
      options: ["26:181", "11:84", "7:85"],
      bookTitle: "Just measure",
      root: "wazn"
    }
  ];

  var FALLBACK_VERSES = {
    "28:22": {
      ar: "وَلَمَّا تَوَجَّهَ تِلْقَاءَ مَدْيَنَ قَالَ عَسَىٰ رَبِّي أَنْ يَهْدِيَنِي سَوَاءَ السَّبِيلِ",
      en: "Then, when he turned his face towards (the land of) Madyan, he said: \"I do hope that my Lord will show me the smooth and straight Path.\""
    },
    "28:23": {
      ar: "وَلَمَّا وَرَدَ مَاءَ مَدْيَنَ وَجَدَ عَلَيْهِ أُمَّةً مِنَ النَّاسِ يَسْقُونَ وَوَجَدَ مِنْ دُونِهِمُ امْرَأَتَيْنِ تَذُودَانِ",
      en: "And when he arrived at the watering (place) in Madyan, he found there a group of men watering (their flocks), and besides them he found two women who were keeping back (their flocks)."
    },
    "28:24": {
      ar: "فَسَقَىٰ لَهُمَا ثُمَّ تَوَلَّىٰ إِلَى الظِّلِّ فَقَالَ رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
      en: "So he watered (their flocks) for them; then he turned back to the shade, and said:\"O my Lord! truly am I in (desperate) need of any good that Thou dost send me!\""
    },
    "7:85": {
      ar: "وَإِلَىٰ مَدْيَنَ أَخَاهُمْ شُعَيْبًا… فَأَوْفُوا الْكَيْلَ وَالْمِيزَانَ وَلَا تَبْخَسُوا النَّاسَ أَشْيَاءَهُمْ",
      en: "To the Madyan people We sent Shu'aib… Give just measure and weight, nor withhold from the people the things that are their due…"
    }
  };

  var api = { getVerse: null, openVerse: null };
  var saveTimer = null;

  function defaultState() {
    return {
      clarity: 40,
      believe: 0,
      deny: 0,
      tags: [],
      roots: [],
      companions: [],
      book: [],
      wellChoice: null,
      mentorStep: 0,
      mentorDone: false,
      marketDone: false,
      hunts: {},
      introSeen: false,
      complete: false,
      overlay: null
    };
  }

  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!raw || typeof raw !== "object") return defaultState();
      var base = defaultState();
      Object.keys(base).forEach(function (k) {
        if (raw[k] !== undefined) base[k] = raw[k];
      });
      return base;
    } catch (e) {
      return defaultState();
    }
  }

  function persist(state) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch (e) { /* ignore quota */ }
    }, 80);
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function hasRoot(state, id) {
    return state.roots.indexOf(id) !== -1;
  }

  function unlockRoot(state, id) {
    if (!ROOTS[id] || hasRoot(state, id)) return false;
    state.roots.push(id);
    state.clarity = clamp(state.clarity + 8, 0, 100);
    return true;
  }

  function addCompanion(state, id, label) {
    if (state.companions.some(function (c) { return c.id === id; })) return;
    state.companions.push({ id: id, label: label });
    state.clarity = clamp(state.clarity + 6, 0, 100);
  }

  function addTag(state, tag, side) {
    if (state.tags.indexOf(tag) === -1) state.tags.push(tag);
    if (side === "believe") state.believe += 1;
    if (side === "deny") state.deny += 1;
  }

  function addBook(state, entry) {
    if (state.book.some(function (b) { return b.ref === entry.ref; })) return;
    state.book.push(entry);
  }

  function verseOf(ref) {
    var parts = ref.split(":");
    var s = +parts[0];
    var a = +parts[1];
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

  function huntsDoneCount(state) {
    return HUNTS.filter(function (h) { return state.hunts[h.id] === true; }).length;
  }

  function locUnlocked(state, id) {
    if (id === "well") return true;
    if (id === "tent") return !!state.wellChoice;
    if (id === "market") return state.mentorDone;
    if (id === "stones") return state.marketDone;
    if (id === "book") return true;
    return false;
  }

  function maybeComplete(state) {
    if (huntsDoneCount(state) >= 3 && state.marketDone && state.mentorDone && state.wellChoice) {
      state.complete = true;
    }
  }

  /* ---------- render ---------- */
  function metersHtml(state) {
    var stance = state.believe === state.deny
      ? "balanced"
      : (state.believe > state.deny ? "toward belief" : "toward denial");
    return (
      '<div class="sirat-meters">' +
        '<div class="sirat-meter"><span>Clarity</span><b>' + state.clarity + '</b>' +
          '<div class="sirat-bar"><i style="width:' + state.clarity + '%"></i></div></div>' +
        '<div class="sirat-meter"><span>Stance</span><b>' + escapeHtml(stance) + '</b>' +
          '<small>believe ' + state.believe + ' · deny ' + state.deny + '</small></div>' +
        '<div class="sirat-meter"><span>Roots</span><b>' + state.roots.length + ' / 5</b></div>' +
        '<div class="sirat-meter"><span>Book</span><b>' + state.book.length + ' signs</b></div>' +
      "</div>"
    );
  }

  function mapHtml(state) {
    var spots = [
      { id: "well", x: 18, y: 58, label: "Well", sub: "Stance fork" },
      { id: "tent", x: 48, y: 28, label: "Shuʿayb", sub: "Mentor" },
      { id: "market", x: 78, y: 52, label: "Market", sub: "Trial of deed" },
      { id: "stones", x: 62, y: 78, label: "Stones", sub: "Verse hunts" },
      { id: "book", x: 28, y: 22, label: "Book", sub: "Your signs" }
    ];
    var pins = spots.map(function (sp) {
      var open = locUnlocked(state, sp.id);
      var done =
        (sp.id === "well" && state.wellChoice) ||
        (sp.id === "tent" && state.mentorDone) ||
        (sp.id === "market" && state.marketDone) ||
        (sp.id === "stones" && huntsDoneCount(state) >= 3);
      var cls = "sirat-pin" + (open ? "" : " locked") + (done ? " done" : "");
      return (
        '<button type="button" class="' + cls + '" data-loc="' + sp.id + '"' +
          (open ? "" : " disabled") +
          ' style="left:' + sp.x + '%;top:' + sp.y + '%">' +
          "<strong>" + escapeHtml(sp.label) + "</strong>" +
          "<em>" + escapeHtml(open ? sp.sub : "locked") + "</em>" +
        "</button>"
      );
    }).join("");

    return (
      '<div class="sirat-map" aria-label="Map of Midian">' +
        '<svg class="sirat-map-art" viewBox="0 0 400 220" aria-hidden="true">' +
          '<rect width="400" height="220" fill="#f3edd4"/>' +
          '<ellipse cx="200" cy="200" rx="220" ry="40" fill="#e6dcb8"/>' +
          '<path d="M0 140 Q100 110 200 130 T400 120 L400 220 L0 220 Z" fill="#d8c89a" opacity=".55"/>' +
          '<circle cx="70" cy="130" r="28" fill="#9ec4d4" stroke="#5a8a9a" stroke-width="2"/>' +
          '<circle cx="70" cy="130" r="14" fill="#6a9eb0"/>' +
          '<rect x="175" y="48" width="70" height="42" rx="4" fill="#c4a574" stroke="#8a6a3a"/>' +
          '<path d="M168 50 L210 22 L252 50 Z" fill="#a67c52"/>' +
          '<rect x="290" y="100" width="54" height="36" rx="3" fill="#b89a6a"/>' +
          '<line x1="300" y1="118" x2="334" y2="118" stroke="#5a4030" stroke-width="3"/>' +
          '<circle cx="300" cy="118" r="6" fill="#7a5a40"/>' +
          '<circle cx="334" cy="118" r="6" fill="#7a5a40"/>' +
          '<rect x="230" y="160" width="36" height="22" rx="2" fill="#8a8070"/>' +
          '<rect x="272" y="168" width="28" height="16" rx="2" fill="#7a7060"/>' +
          '<text x="200" y="24" text-anchor="middle" fill="#6b2d8a" font-size="14" font-family="Georgia, serif">Midian · مدين</text>' +
        "</svg>" +
        pins +
      "</div>"
    );
  }

  function rootsChips(state) {
    return Object.keys(ROOTS).map(function (id) {
      var r = ROOTS[id];
      var on = hasRoot(state, id);
      return (
        '<span class="sirat-chip' + (on ? " on" : "") + '" title="' + escapeHtml(r.gloss) + '">' +
          (on ? r.ar + " · " + r.en : "· · ·") +
        "</span>"
      );
    }).join("");
  }

  function companionsHtml(state) {
    if (!state.companions.length) {
      return '<p class="sirat-muted">No companions yet. Fair and patient choices call them.</p>';
    }
    return state.companions.map(function (c) {
      return '<span class="sirat-chip on">' + escapeHtml(c.label) + "</span>";
    }).join("");
  }

  function overlayHtml(state) {
    var o = state.overlay;
    if (!o) return "";

    if (o.type === "intro") {
      return panel(
        "As-Sirat · Midian",
        '<p>You are a <b>seeker</b>, not a prophet. Midian is a land of wells, fair trade, and a messenger who warns against short measure.</p>' +
          '<p>Walk the map. Learn five roots. Collect three signs. Mentors guide — they are never opponents.</p>',
        [{ id: "intro-ok", label: "Enter Midian", primary: true }]
      );
    }

    if (o.type === "well") {
      return panel(
        "The well of Midian",
        '<p class="sirat-ar" lang="ar" dir="rtl">ماء مدين</p>' +
          "<p>Men water their flocks. Two women wait aside — their father is old. Your thirst is real. What do you do?</p>" +
          '<p class="sirat-muted">This is a Stance fork. It tags who you are becoming.</p>',
        [
          { id: "well-help", label: "Water their flocks, then seek shade", primary: true },
          { id: "well-wait", label: "Wait your turn; do nothing else" },
          { id: "well-pay", label: "Demand pay before helping" }
        ]
      );
    }

    if (o.type === "well-result") {
      return panel(
        o.title,
        "<p>" + escapeHtml(o.body) + "</p>" +
          (o.rootNote ? '<p class="sirat-gain">Root unlocked: <b>' + escapeHtml(o.rootNote) + "</b></p>" : "") +
          (o.compNote ? '<p class="sirat-gain">Companion: <b>' + escapeHtml(o.compNote) + "</b></p>" : ""),
        [{ id: "close", label: "Return to map", primary: true }]
      );
    }

    if (o.type === "mentor") {
      var lines = [
        "Peace upon the traveler. Midian remembers those who keep the balance.",
        "My people prosper — and that prosperity tempts them to shorten the measure.",
        "If you walk with justice, the market will test you. If you walk with patience, the well already has."
      ];
      var step = state.mentorStep || 0;
      var more = step < lines.length - 1;
      return panel(
        "Shuʿayb · شعيب",
        '<p class="sirat-role">Mentor · messenger to Midian</p>' +
          "<p>" + escapeHtml(lines[step]) + "</p>" +
          (step === 2
            ? '<p class="sirat-gain">Root unlocked: <b>عدل · ʿadl — justice</b></p>'
            : ""),
        more
          ? [{ id: "mentor-next", label: "Continue", primary: true }]
          : [{ id: "mentor-done", label: "I will remember", primary: true }]
      );
    }

    if (o.type === "market") {
      return panel(
        "Trial of Deed · the market",
        "<p>A merchant sells ten measures of grain for the price of ten, but his scale reads light. He offers you a share if you stay silent.</p>" +
          "<p>What is the just action?</p>",
        [
          { id: "mkt-correct", label: "Refuse the cut; insist on full measure", primary: true },
          { id: "mkt-ignore", label: "Walk away quietly" },
          { id: "mkt-take", label: "Take the silent share" }
        ]
      );
    }

    if (o.type === "market-result") {
      return panel(
        o.title,
        "<p>" + escapeHtml(o.body) + "</p>" +
          (o.extra || "") +
          (o.ref
            ? '<p><button type="button" class="sirat-link" data-open-ref="' + o.ref + '">Open ' + o.ref + " in reader</button></p>"
            : ""),
        [{ id: "close", label: "Return to map", primary: true }]
      );
    }

    if (o.type === "hunt") {
      var h = HUNTS.filter(function (x) { return x.id === o.huntId; })[0];
      var done = state.hunts[h.id] === true;
      if (done) {
        var v = verseOf(h.answer);
        return panel(
          "Sign collected · " + h.answer,
          (v
            ? '<p class="sirat-ar" lang="ar" dir="rtl">' + escapeHtml(v.ar) + "</p>" +
              "<p>" + escapeHtml(v.en) + "</p>"
            : "<p>Already in your Book of Signs.</p>") +
            '<p><button type="button" class="sirat-link" data-open-ref="' + h.answer + '">Open in reader</button></p>',
          [{ id: "close", label: "Return to map", primary: true }]
        );
      }
      return panel(
        "Hunt of Signs",
        "<p>" + escapeHtml(h.clue) + "</p>" +
          '<p class="sirat-muted">Which ayah is this?</p>' +
          '<div class="sirat-options">' +
            h.options.map(function (opt) {
              return '<button type="button" class="sirat-choice" data-hunt-pick="' +
                escapeHtml(h.id) + "|" + escapeHtml(opt) + '">' + escapeHtml(opt) + "</button>";
            }).join("") +
          "</div>",
        [{ id: "close", label: "Back", primary: false }]
      );
    }

    if (o.type === "hunt-pick") {
      return panel(
        o.title,
        "<p>" + escapeHtml(o.body) + "</p>" + (o.extra || ""),
        [{ id: o.next || "close", label: o.nextLabel || "Continue", primary: true }]
      );
    }

    if (o.type === "stones") {
      var list = HUNTS.map(function (h) {
        var ok = state.hunts[h.id] === true;
        return (
          '<button type="button" class="sirat-choice' + (ok ? " done" : "") + '" data-open-hunt="' + h.id + '">' +
            (ok ? "✓ " : "") + escapeHtml(h.bookTitle) +
            (ok ? " · " + h.answer : " · ?") +
          "</button>"
        );
      }).join("");
      return panel(
        "Stones of Signs",
        "<p>Three inscriptions wait. Match each clue to its ayah.</p>" +
          '<div class="sirat-options">' + list + "</div>" +
          '<p class="sirat-muted">Progress: ' + huntsDoneCount(state) + " / 3</p>",
        [{ id: "close", label: "Return to map", primary: true }]
      );
    }

    if (o.type === "book") {
      var items = state.book.length
        ? "<ul class=\"sirat-book-list\">" + state.book.map(function (b) {
            return (
              "<li>" +
                '<button type="button" class="sirat-link" data-open-ref="' + escapeHtml(b.ref) + '">' +
                  escapeHtml(b.ref) + " · " + escapeHtml(b.title) +
                "</button>" +
                "<span>" + escapeHtml(b.note || "") + "</span>" +
              "</li>"
            );
          }).join("") + "</ul>"
        : '<p class="sirat-muted">Empty. Help at the well, hear Shuʿayb, keep the measure, and hunt the stones.</p>';
      var end = state.complete
        ? '<div class="sirat-complete"><b>Midian complete.</b> Clarity ' + state.clarity +
          ". Roots " + state.roots.length + "/5. Your Book holds " + state.book.length +
          " signs. Continue reading them in the Study reader.</div>"
        : "";
      return panel(
        "Book of Signs",
        items + end +
          '<p class="sirat-muted">Companions: </p><div class="sirat-chips">' + companionsHtml(state) + "</div>",
        [
          { id: "close", label: "Return to map", primary: true },
          { id: "reset", label: "Reset Midian" }
        ]
      );
    }

    return "";
  }

  function panel(title, body, actions) {
    var btns = (actions || []).map(function (a) {
      return (
        '<button type="button" class="sirat-btn' + (a.primary ? " primary" : "") +
          '" data-act="' + escapeHtml(a.id) + '">' + escapeHtml(a.label) + "</button>"
      );
    }).join("");
    return (
      '<div class="sirat-overlay" role="dialog" aria-modal="true">' +
        '<div class="sirat-panel">' +
          "<h2>" + escapeHtml(title) + "</h2>" +
          '<div class="sirat-panel-body">' + body + "</div>" +
          '<div class="sirat-actions">' + btns + "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function render(root, state) {
    if (!root) return;
    maybeComplete(state);
    persist(state);

    var status = state.complete
      ? "Midian slice complete"
      : (!state.wellChoice
        ? "Begin at the well"
        : (!state.mentorDone
          ? "Visit Shuʿayb"
          : (!state.marketDone
            ? "Face the market"
            : "Hunt the three signs")));

    root.innerHTML =
      '<div class="sirat">' +
        '<header class="sirat-head">' +
          "<div>" +
            "<h1>As-Sirat</h1>" +
            '<p class="lead">Midian vertical slice — seeker, not prophet.</p>' +
          "</div>" +
          '<p class="sirat-status">' + escapeHtml(status) + "</p>" +
        "</header>" +
        metersHtml(state) +
        '<div class="sirat-roots"><span class="sirat-label">Roots</span><div class="sirat-chips">' +
          rootsChips(state) + "</div></div>" +
        mapHtml(state) +
        '<p class="sirat-hint">Open a pin on the map. Progress saves on this device.</p>' +
        overlayHtml(state) +
      "</div>";
  }

  /* ---------- actions ---------- */
  function applyWell(state, choice) {
    state.wellChoice = choice;
    var title = "At the well";
    var body = "";
    var rootNote = "";
    var compNote = "";

    if (choice === "help") {
      addTag(state, "helper", "believe");
      unlockRoot(state, "saqy");
      unlockRoot(state, "sabr");
      addCompanion(state, "sabr", "Sabr · Patience");
      addBook(state, {
        ref: "28:24",
        title: "Watered, then shade",
        note: "You helped without demand — need met by trust."
      });
      state.clarity = clamp(state.clarity + 12, 0, 100);
      title = "You watered their flocks";
      body = "Like the traveler in 28:24, you gave water, then turned to the shade and asked your Lord for any good He might send. Shuʿayb’s tent opens.";
      rootNote = "سقي · saqy, صبر · ṣabr";
      compNote = "Sabr · Patience";
    } else if (choice === "wait") {
      addTag(state, "passive", "believe");
      unlockRoot(state, "sabr");
      state.clarity = clamp(state.clarity + 4, 0, 100);
      title = "You waited";
      body = "You caused no harm, and learned a little patience — but the women still struggle. Shuʿayb’s tent opens; the well’s fuller mercy remains unclaimed.";
      rootNote = "صبر · ṣabr";
    } else {
      addTag(state, "mercenary", "deny");
      unlockRoot(state, "saqy");
      state.clarity = clamp(state.clarity - 8, 0, 100);
      title = "You demanded pay";
      body = "Help sold as a bargain. The root of watering is known, but Stance tilts toward denial. Shuʿayb will still speak — listen carefully.";
      rootNote = "سقي · saqy";
    }

    state.overlay = {
      type: "well-result",
      title: title,
      body: body,
      rootNote: rootNote,
      compNote: compNote
    };
  }

  function applyMarket(state, choice) {
    var title = "Market";
    var body = "";
    var extra = "";
    var ref = "7:85";

    if (choice === "correct") {
      addTag(state, "just", "believe");
      unlockRoot(state, "wazn");
      unlockRoot(state, "adl");
      addCompanion(state, "adl", "Adl · Justice");
      addBook(state, {
        ref: "7:85",
        title: "Give just measure",
        note: "You refused short weight."
      });
      state.clarity = clamp(state.clarity + 14, 0, 100);
      title = "The balance holds";
      body = "You insist on full measure. The merchant scowls; Clarity rises. Shuʿayb’s warning lives in your deed.";
      extra = '<p class="sirat-gain">Roots: <b>وزن · wazn</b>, <b>عدل · ʿadl</b> · Companion <b>Adl</b></p>';
    } else if (choice === "ignore") {
      addTag(state, "avoidant", "deny");
      unlockRoot(state, "wazn");
      state.clarity = clamp(state.clarity - 4, 0, 100);
      title = "You walked away";
      body = "You did not share in the fraud — nor stop it. The Stones still open, but justice waits for another traveler.";
      extra = '<p class="sirat-gain">Root: <b>وزن · wazn</b> (known, not practiced)</p>';
    } else {
      addTag(state, "cheater", "deny");
      unlockRoot(state, "wazn");
      state.clarity = clamp(state.clarity - 14, 0, 100);
      title = "Silent share";
      body = "Short measure bought your silence. Stance tilts hard toward denial. The inscriptions ahead will feel harder to read.";
      extra = '<p class="sirat-gain">Root: <b>وزن · wazn</b> — Clarity damaged</p>';
    }

    state.marketDone = true;
    state.overlay = {
      type: "market-result",
      title: title,
      body: body,
      extra: extra,
      ref: ref
    };
  }

  function applyHuntPick(state, huntId, pick) {
    var h = HUNTS.filter(function (x) { return x.id === huntId; })[0];
    if (!h) return;
    if (pick === h.answer) {
      state.hunts[h.id] = true;
      unlockRoot(state, h.root);
      addBook(state, {
        ref: h.answer,
        title: h.bookTitle,
        note: "Found on the Stones of Signs."
      });
      state.clarity = clamp(state.clarity + 10, 0, 100);
      var v = verseOf(h.answer);
      state.overlay = {
        type: "hunt-pick",
        title: "Sign found · " + h.answer,
        body: "Correct.",
        extra:
          (v
            ? '<p class="sirat-ar" lang="ar" dir="rtl">' + escapeHtml(v.ar) + "</p>" +
              "<p>" + escapeHtml(v.en) + "</p>"
            : "") +
          '<p class="sirat-gain">Root reinforced: <b>' +
          escapeHtml(ROOTS[h.root].ar + " · " + ROOTS[h.root].en) +
          "</b></p>" +
          '<p><button type="button" class="sirat-link" data-open-ref="' + h.answer + '">Open in reader</button></p>',
        next: huntsDoneCount(state) >= 3 ? "close" : "stones-again",
        nextLabel: huntsDoneCount(state) >= 3 ? "Return to map" : "Next inscription"
      };
    } else {
      state.clarity = clamp(state.clarity - 5, 0, 100);
      state.overlay = {
        type: "hunt-pick",
        title: "Not that ayah",
        body: "Clarity dims a little. Read the clue again — Midian’s signs are precise.",
        next: "retry-hunt",
        nextLabel: "Try again",
        _huntId: huntId
      };
    }
  }

  function onAction(root, state, act, dataset) {
    if (act === "intro-ok") {
      state.introSeen = true;
      state.overlay = null;
    } else if (act === "close") {
      state.overlay = null;
    } else if (act === "well-help") {
      applyWell(state, "help");
    } else if (act === "well-wait") {
      applyWell(state, "wait");
    } else if (act === "well-pay") {
      applyWell(state, "pay");
    } else if (act === "mentor-next") {
      state.mentorStep = (state.mentorStep || 0) + 1;
      if (state.mentorStep >= 2) unlockRoot(state, "adl");
    } else if (act === "mentor-done") {
      unlockRoot(state, "adl");
      unlockRoot(state, "rushd");
      state.mentorDone = true;
      addBook(state, {
        ref: "11:84",
        title: "Shuʿayb’s warning",
        note: "Do not give short measure or weight."
      });
      state.overlay = null;
    } else if (act === "mkt-correct") {
      applyMarket(state, "correct");
    } else if (act === "mkt-ignore") {
      applyMarket(state, "ignore");
    } else if (act === "mkt-take") {
      applyMarket(state, "take");
    } else if (act === "stones-again") {
      state.overlay = { type: "stones" };
    } else if (act === "retry-hunt") {
      state.overlay = { type: "hunt", huntId: state.overlay._huntId || dataset.huntId };
    } else if (act === "reset") {
      if (global.confirm("Reset Midian progress on this device?")) {
        var fresh = defaultState();
        fresh.overlay = { type: "intro" };
        Object.keys(state).forEach(function (k) { delete state[k]; });
        Object.keys(fresh).forEach(function (k) { state[k] = fresh[k]; });
      }
    }

    render(root, state);
  }

  function bind(root, state) {
    root.onclick = function (e) {
      var loc = e.target.closest("[data-loc]");
      if (loc && !loc.disabled) {
        var id = loc.getAttribute("data-loc");
        if (id === "well") {
          state.overlay = state.wellChoice
            ? {
                type: "well-result",
                title: "The well (done)",
                body: "You already chose your Stance here. Continue to Shuʿayb, the market, and the stones.",
                rootNote: "",
                compNote: ""
              }
            : { type: "well" };
        } else if (id === "tent") {
          if (!state.mentorDone) {
            state.mentorStep = state.mentorStep || 0;
            state.overlay = { type: "mentor" };
          } else {
            state.overlay = {
              type: "well-result",
              title: "Shuʿayb",
              body: "The mentor’s counsel is with you: keep the balance; do no mischief after the earth is set in order.",
              rootNote: "",
              compNote: ""
            };
          }
        } else if (id === "market") {
          state.overlay = state.marketDone
            ? {
                type: "market-result",
                title: "Market (done)",
                body: "The trial of deed is finished. Hunt the Stones of Signs.",
                extra: "",
                ref: "7:85"
              }
            : { type: "market" };
        } else if (id === "stones") {
          state.overlay = { type: "stones" };
        } else if (id === "book") {
          state.overlay = { type: "book" };
        }
        render(root, state);
        return;
      }

      var actBtn = e.target.closest("[data-act]");
      if (actBtn) {
        onAction(root, state, actBtn.getAttribute("data-act"), {});
        return;
      }

      var huntOpen = e.target.closest("[data-open-hunt]");
      if (huntOpen) {
        state.overlay = { type: "hunt", huntId: huntOpen.getAttribute("data-open-hunt") };
        render(root, state);
        return;
      }

      var huntPick = e.target.closest("[data-hunt-pick]");
      if (huntPick) {
        var parts = huntPick.getAttribute("data-hunt-pick").split("|");
        applyHuntPick(state, parts[0], parts[1]);
        render(root, state);
        return;
      }

      var openRef = e.target.closest("[data-open-ref]");
      if (openRef && api.openVerse) {
        var ra = openRef.getAttribute("data-open-ref").split(":");
        api.openVerse(+ra[0], +ra[1]);
      }
    };
  }

  function mount(rootEl, opts) {
    if (!rootEl) return null;
    api.getVerse = opts && opts.getVerse ? opts.getVerse : null;
    api.openVerse = opts && opts.openVerse ? opts.openVerse : null;
    var state = loadState();
    if (!state.introSeen) state.overlay = { type: "intro" };
    bind(rootEl, state);
    render(rootEl, state);
    return {
      refresh: function () { render(rootEl, state); },
      reset: function () {
        localStorage.removeItem(STORE_KEY);
        state = loadState();
        state.overlay = { type: "intro" };
        bind(rootEl, state);
        render(rootEl, state);
      }
    };
  }

  global.AlQuranGame = { mount: mount };
})(window);
