/* Genealogy tree + places map for Al-Quran-Genealogy.html */
(function () {
  "use strict";

  /* ---------- data: lineages the Qur'an states or tightly joins ---------- */
  /*
   * Edges are parent→child or sibling links that the text supports.
   * "note" records how the link is read. Side peoples sit beside the main line.
   */
  var NODES = {
    adam: { en: "Adam", ar: "آدم", role: "first human" },
    idris: { en: "Idris", ar: "إدريس", role: "prophet" },
    nuh: { en: "Nuh", ar: "نوح", role: "prophet of the Flood" },
    hud: { en: "Hud", ar: "هود", role: "to ʿAd" },
    salih: { en: "Salih", ar: "صالح", role: "to Thamud" },
    azar: { en: "Azar", ar: "آزر", role: "Ibrahim's father (6:74)" },
    ibrahim: { en: "Ibrahim", ar: "إبراهيم", role: "friend of Allah" },
    lut: { en: "Lut", ar: "لوط", role: "with Ibrahim's household" },
    ismail: { en: "Ismail", ar: "إسماعيل", role: "son of Ibrahim" },
    ishaq: { en: "Ishaq", ar: "إسحاق", role: "son of Ibrahim" },
    yaqub: { en: "Yaqub", ar: "يعقوب", role: "Israel" },
    yusuf: { en: "Yusuf", ar: "يوسف", role: "son of Yaqub" },
    shuayb: { en: "Shuayb", ar: "شعيب", role: "to Midian" },
    ayyub: { en: "Ayyub", ar: "أيوب", role: "prophet" },
    musa: { en: "Musa", ar: "موسى", role: "to Pharaoh" },
    harun: { en: "Harun", ar: "هارون", role: "brother of Musa" },
    dawud: { en: "Dawud", ar: "داود", role: "king & prophet" },
    sulayman: { en: "Sulayman", ar: "سليمان", role: "son of Dawud" },
    ilyas: { en: "Ilyas", ar: "إلياس", role: "prophet" },
    alyasa: { en: "Al-Yasa", ar: "اليسع", role: "prophet" },
    yunus: { en: "Yunus", ar: "يونس", role: "companion of the fish" },
    imran: { en: "Imran", ar: "عمران", role: "house of Maryam" },
    zakariya: { en: "Zakariya", ar: "زكريا", role: "guardian of Maryam" },
    yahya: { en: "Yahya", ar: "يحيى", role: "son of Zakariya" },
    maryam: { en: "Maryam", ar: "مريم", role: "daughter of Imran" },
    isa: { en: "Isa", ar: "عيسى", role: "son of Maryam" },
    muhammad: { en: "Muhammad", ar: "محمد", role: "Seal of the prophets" }
  };

  // Layout rows (generation bands). x is relative 0–1 within the band.
  var LAYOUT = [
    { id: "adam", x: 0.50, y: 0 },
    { id: "idris", x: 0.50, y: 1 },
    { id: "nuh", x: 0.50, y: 2 },
    { id: "hud", x: 0.18, y: 3 },
    { id: "salih", x: 0.32, y: 3 },
    { id: "azar", x: 0.50, y: 3 },
    { id: "shuayb", x: 0.82, y: 3 },
    { id: "ibrahim", x: 0.50, y: 4 },
    { id: "lut", x: 0.72, y: 4 },
    { id: "ismail", x: 0.32, y: 5 },
    { id: "ishaq", x: 0.58, y: 5 },
    { id: "ayyub", x: 0.12, y: 5 },
    { id: "yunus", x: 0.88, y: 5 },
    { id: "yaqub", x: 0.58, y: 6 },
    { id: "muhammad", x: 0.32, y: 6 },
    { id: "yusuf", x: 0.58, y: 7 },
    { id: "musa", x: 0.42, y: 8 },
    { id: "harun", x: 0.58, y: 8 },
    { id: "ilyas", x: 0.18, y: 8 },
    { id: "alyasa", x: 0.78, y: 8 },
    { id: "dawud", x: 0.50, y: 9 },
    { id: "sulayman", x: 0.50, y: 10 },
    { id: "imran", x: 0.28, y: 11 },
    { id: "zakariya", x: 0.55, y: 11 },
    { id: "maryam", x: 0.28, y: 12 },
    { id: "yahya", x: 0.55, y: 12 },
    { id: "isa", x: 0.28, y: 13 }
  ];

  var EDGES = [
    { from: "adam", to: "idris", kind: "line", note: "Early prophetic line (named in sequence in 19:56–58)" },
    { from: "idris", to: "nuh", kind: "line", note: "Prophets of old recalled together" },
    { from: "nuh", to: "hud", kind: "people", note: "Hud sent to ʿAd after Nuh's people (7:65–69)" },
    { from: "nuh", to: "salih", kind: "people", note: "Salih sent to Thamud (7:73)" },
    { from: "azar", to: "ibrahim", kind: "parent", note: "6:74 — Azar, father of Ibrahim" },
    { from: "ibrahim", to: "lut", kind: "kin", note: "Lut believed and went with Ibrahim (29:26)" },
    { from: "ibrahim", to: "ismail", kind: "parent", note: "Ibrahim's prayer and praise for Ismail (14:39, 2:125–127)" },
    { from: "ibrahim", to: "ishaq", kind: "parent", note: "Glad tidings of Ishaq (11:71, 37:112)" },
    { from: "ishaq", to: "yaqub", kind: "parent", note: "Ishaq and Yaqub among Ibrahim's gift (6:84, 19:49)" },
    { from: "yaqub", to: "yusuf", kind: "parent", note: "Surah Yusuf — son of Yaqub" },
    { from: "ismail", to: "muhammad", kind: "line", note: "House of Ibrahim & Ismail at the Kaaba (2:127–129); Muhammad from that line" },
    { from: "musa", to: "harun", kind: "sibling", note: "Brothers (20:29–36, 28:34)" },
    { from: "dawud", to: "sulayman", kind: "parent", note: "Sulayman inherited Dawud (27:16)" },
    { from: "zakariya", to: "yahya", kind: "parent", note: "Yahya granted to Zakariya (3:38–39, 19:7)" },
    { from: "imran", to: "maryam", kind: "parent", note: "Maryam daughter of Imran (66:12, 3:35–36)" },
    { from: "maryam", to: "isa", kind: "parent", note: "Isa son of Maryam — no father (3:45–47, 19:20–21)" },
    { from: "zakariya", to: "maryam", kind: "guard", note: "Zakariya her guardian (3:37)" }
  ];

  /* Places: lon/lat approx., Qur'anic name, brief note */
  var PLACES = [
    { id: "makkah", en: "Makkah / Bakkah", ar: "مكة / بكة", lon: 39.83, lat: 21.42, verse: "3:96, 48:24", note: "The inviolable House; Bakkah named in 3:96." },
    { id: "arafats", en: "Arafat", ar: "عرفات", lon: 40.00, lat: 21.35, verse: "2:198", note: "Hajj station — pour down from Arafat." },
    { id: "safa", en: "Safa & Marwah", ar: "الصفا والمروة", lon: 39.83, lat: 21.423, verse: "2:158", note: "Symbols of Allah at the House." },
    { id: "yathrib", en: "Yathrib", ar: "يثرب", lon: 39.61, lat: 24.47, verse: "33:13", note: "City of the Prophet — later Madinah." },
    { id: "badr", en: "Badr", ar: "بدر", lon: 38.75, lat: 23.78, verse: "3:123", note: "Allah helped you at Badr." },
    { id: "hunayn", en: "Hunayn", ar: "حنين", lon: 40.05, lat: 21.43, verse: "9:25", note: "Battle day named in the Qur'an." },
    { id: "egypt", en: "Egypt", ar: "مصر", lon: 31.23, lat: 30.04, verse: "12:21, 10:87", note: "Yusuf established; Musa and Harun in Pharaoh's land." },
    { id: "midian", en: "Midian", ar: "مدين", lon: 35.5, lat: 28.5, verse: "7:85, 28:22–23", note: "Shuayb's people; Musa sojourned here." },
    { id: "sinai", en: "Sinai / the Mount", ar: "سيناء / الطور", lon: 33.97, lat: 28.54, verse: "2:63, 95:2, 19:52", note: "Covenant and address to Musa." },
    { id: "babylon", en: "Babylon", ar: "بابل", lon: 44.42, lat: 32.54, verse: "2:102", note: "Harut and Marut at Babylon." },
    { id: "saba", en: "Saba", ar: "سبأ", lon: 45.35, lat: 15.35, verse: "27:22, 34:15", note: "Kingdom of the Queen; gardens of Saba." },
    { id: "ahqaf", en: "al-Ahqaf", ar: "الأحقاف", lon: 49.0, lat: 17.0, verse: "46:21", note: "Homeland of ʿAd — the winding sand-tracts." },
    { id: "hijr", en: "al-Hijr", ar: "الحجر", lon: 37.95, lat: 26.78, verse: "15:80", note: "Dwellers of al-Hijr (Thamud)." },
    { id: "judi", en: "Mount Judi", ar: "الجودي", lon: 42.37, lat: 37.37, verse: "11:44", note: "The Ark came to rest on al-Judi." },
    { id: "iram", en: "Iram", ar: "إرم", lon: 49.5, lat: 18.0, verse: "89:7", note: "Iram of the pillars — with ʿAd." },
    { id: "holy", en: "The Holy Land", ar: "الأرض المقدسة", lon: 35.22, lat: 31.78, verse: "5:21", note: "Promised entry for the Children of Israel." },
    { id: "rome", en: "Rome (Byzantium)", ar: "الروم", lon: 29.0, lat: 41.0, verse: "30:2–3", note: "The Romans have been defeated…" },
    { id: "tubba", en: "People of Tubba", ar: "قوم تبع", lon: 44.2, lat: 15.4, verse: "44:37, 50:14", note: "Linked with ancient Yemen." }
  ];

  /* Places / peoples the Qur'an says were destroyed or punished in this world */
  var DESTROYED = [
    {
      id: "nuh-flood", en: "People of Nuh", ar: "قوم نوح",
      lon: 42.4, lat: 36.5, verse: "11:40–44, 71:25",
      how: "The Flood", messenger: "Nuh",
      note: "They were drowned for rejecting Nuh; the Ark rested on Mount Judi when the water abated."
    },
    {
      id: "ad-ahqaf", en: "ʿAd (al-Ahqaf)", ar: "عاد / الأحقاف",
      lon: 49.0, lat: 17.0, verse: "46:21–25, 69:6–7, 89:6–8",
      how: "A furious, freezing wind", messenger: "Hud",
      note: "ʿAd of Iram were destroyed by a howling wind lasting seven nights and eight days; their land is tied to al-Ahqaf."
    },
    {
      id: "thamud-hijr", en: "Thamud (al-Hijr)", ar: "ثمود / الحجر",
      lon: 37.95, lat: 26.78, verse: "7:73–78, 11:67–68, 15:80–84",
      how: "The Blast / earthquake", messenger: "Salih",
      note: "After hamstringing the she-camel, the Cry (or earthquake) seized them in their homes; rock dwellings of al-Hijr remain as a sign."
    },
    {
      id: "lut-cities", en: "Cities of Lut", ar: "قوم لوط / المؤتفكات",
      lon: 35.5, lat: 31.15, verse: "11:82–83, 15:74, 53:53–54",
      how: "Overturned; stones of baked clay", messenger: "Lut",
      note: "The townships were turned upside down and rained with stones — the overthrown cities (al-muʾtafikāt)."
    },
    {
      id: "midian-cry", en: "Midian", ar: "مدين",
      lon: 35.5, lat: 28.5, verse: "7:85–91, 11:94–95",
      how: "The Cry / earthquake", messenger: "Shuayb",
      note: "Those who rejected Shuayb were seized by the Cry and lay fallen in their homes."
    },
    {
      id: "aikah", en: "Companions of the Thicket", ar: "أصحاب الأيكة",
      lon: 36.2, lat: 28.2, verse: "15:78–79, 26:176–189, 38:13",
      how: "Punishment of the day of shadow", messenger: "Shuayb",
      note: "Often joined with Midian; they denied the messengers and were taken by the torment of a day of overshadowing gloom."
    },
    {
      id: "pharaoh-sea", en: "Pharaoh's host", ar: "فرعون وجنوده",
      lon: 32.55, lat: 30.0, verse: "2:50, 10:90–92, 28:40",
      how: "Drowned in the sea", messenger: "Musa",
      note: "Pharaoh and his forces pursued Musa; Allah drowned them in the sea. Pharaoh's body was saved as a sign."
    },
    {
      id: "saba-flood", en: "Saba (Arim flood)", ar: "سبأ / سيل العرم",
      lon: 45.35, lat: 15.35, verse: "34:15–17",
      how: "Flood of the dam", messenger: "—",
      note: "They turned from gratitude; the flood of the dam (sayl al-ʿarim) ruined their gardens, replaced with bitter ones."
    },
    {
      id: "tubba-folk", en: "People of Tubbaʿ", ar: "قوم تبع",
      lon: 44.2, lat: 15.4, verse: "44:37, 50:12–14",
      how: "Destroyed like earlier peoples", messenger: "—",
      note: "Named among those before who denied and were destroyed — with the companions of the Wood, Thamud, and the people of Nuh."
    },
    {
      id: "rass", en: "Companions of ar-Rass", ar: "أصحاب الرس",
      lon: 40.5, lat: 26.0, verse: "25:38, 50:12",
      how: "Destroyed after denial", messenger: "—",
      note: "Listed with ʿAd and Thamud as generations destroyed between; exact site uncertain."
    },
    {
      id: "elephant", en: "Companions of the Elephant", ar: "أصحاب الفيل",
      lon: 39.83, lat: 21.35, verse: "105:1–5",
      how: "Flocks of birds / stones of clay", messenger: "—",
      note: "The army that marched on the House was turned to husks — a punishment near Makkah, not of Makkah itself."
    },
    {
      id: "iram-pillars", en: "Iram of the pillars", ar: "إرم ذات العماد",
      lon: 49.5, lat: 18.0, verse: "89:6–8",
      how: "Destroyed with ʿAd", messenger: "Hud",
      note: "Iram of the lofty pillars, the like of which was not created in the lands — recalled with the end of ʿAd."
    }
  ];

  var NS = "http://www.w3.org/2000/svg";
  var treeSvg = document.getElementById("tree-svg");
  var treeWrap = document.getElementById("tree-wrap");
  var treeTip = document.getElementById("tree-tip");
  var treeDetail = document.getElementById("tree-detail");
  var mapSvg = document.getElementById("map-svg");
  var mapWrap = document.getElementById("map-wrap");
  var mapTip = document.getElementById("map-tip");
  var mapDetail = document.getElementById("map-detail");
  var placeList = document.getElementById("place-list");
  var doomSvg = document.getElementById("doom-svg");
  var doomWrap = document.getElementById("doom-wrap");
  var doomTip = document.getElementById("doom-tip");
  var doomDetail = document.getElementById("doom-detail");
  var doomList = document.getElementById("doom-list");

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    return n;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  /* ===================== Genealogy tree ===================== */
  function drawTree() {
    if (!treeSvg || !treeWrap) return;
    while (treeSvg.firstChild) treeSvg.removeChild(treeSvg.firstChild);

    var w = Math.max(640, treeWrap.clientWidth);
    var rowH = 72;
    var maxY = 0;
    LAYOUT.forEach(function (n) { if (n.y > maxY) maxY = n.y; });
    var h = (maxY + 1) * rowH + 48;
    var padX = 56;
    treeSvg.setAttribute("viewBox", "0 0 " + w + " " + h);
    treeSvg.setAttribute("width", w);
    treeSvg.setAttribute("height", h);

    var pos = {};
    LAYOUT.forEach(function (n) {
      pos[n.id] = {
        x: padX + n.x * (w - padX * 2),
        y: 28 + n.y * rowH
      };
    });

    // Background generation bands
    for (var g = 0; g <= maxY; g++) {
      if (g % 2 === 0) {
        treeSvg.appendChild(el("rect", {
          x: 0, y: 8 + g * rowH, width: w, height: rowH,
          fill: "rgba(128,0,128,0.04)"
        }));
      }
    }

    function nodePt(id) { return pos[id]; }

    EDGES.forEach(function (e) {
      var a = nodePt(e.from), b = nodePt(e.to);
      if (!a || !b) return;
      var midY = (a.y + b.y) / 2;
      var path;
      if (e.kind === "sibling") {
        path = "M" + a.x + "," + a.y + " H" + b.x;
      } else if (e.kind === "guard") {
        path = "M" + a.x + "," + a.y + " C" + a.x + "," + midY + " " + b.x + "," + midY + " " + b.x + "," + b.y;
      } else {
        path = "M" + a.x + "," + a.y + " C" + a.x + "," + midY + " " + b.x + "," + midY + " " + b.x + "," + b.y;
      }
      var stroke = e.kind === "parent" ? "#6b2d8a"
        : e.kind === "sibling" ? "#2e7d32"
        : e.kind === "people" ? "#c62828"
        : e.kind === "guard" ? "#1565c0"
        : "#8d6e63";
      var dash = (e.kind === "people" || e.kind === "line" || e.kind === "kin" || e.kind === "guard") ? "5 4" : "none";
      var line = el("path", {
        d: path,
        fill: "none",
        stroke: stroke,
        "stroke-width": e.kind === "parent" || e.kind === "sibling" ? 2.4 : 1.6,
        "stroke-opacity": 0.75,
        "stroke-dasharray": dash
      });
      line.addEventListener("mousemove", function (evt) {
        showTip(treeTip, treeWrap, evt, "<b>" + escape(NODES[e.from].en) + " → " + escape(NODES[e.to].en) + "</b><br>" + escape(e.note));
      });
      line.addEventListener("mouseleave", function () { treeTip.hidden = true; });
      treeSvg.appendChild(line);
    });

    LAYOUT.forEach(function (n) {
      var p = pos[n.id];
      var info = NODES[n.id];
      var gEl = el("g");
      gEl.style.cursor = "pointer";
      gEl.appendChild(el("circle", {
        cx: p.x, cy: p.y, r: 16,
        fill: "#6b2d8a",
        stroke: "#fff",
        "stroke-width": 2
      }));
      gEl.appendChild(el("text", {
        x: p.x, y: p.y - 26,
        "text-anchor": "middle",
        fill: "#2e7d32",
        "font-size": 15,
        "font-family": "Georgia, serif",
        text: info.ar
      }));
      gEl.appendChild(el("text", {
        x: p.x, y: p.y + 34,
        "text-anchor": "middle",
        fill: "#4a2a6a",
        "font-size": 12,
        "font-family": "Georgia, serif",
        text: info.en
      }));
      gEl.addEventListener("mousemove", function (evt) {
        showTip(treeTip, treeWrap, evt,
          "<b lang=\"ar\" dir=\"rtl\">" + escape(info.ar) + "</b> " + escape(info.en) +
          "<br><i>" + escape(info.role) + "</i>");
      });
      gEl.addEventListener("mouseleave", function () { treeTip.hidden = true; });
      gEl.addEventListener("click", function () { selectPerson(n.id); });
      treeSvg.appendChild(gEl);
    });
  }

  function selectPerson(id) {
    var info = NODES[id];
    var links = EDGES.filter(function (e) { return e.from === id || e.to === id; });
    var html = '<div class="picked"><span class="ar" lang="ar" dir="rtl">' + escape(info.ar) +
      "</span><div><b>" + escape(info.en) + "</b><div>" + escape(info.role) + "</div></div></div>";
    if (links.length) {
      html += '<ul class="link-list">';
      links.forEach(function (e) {
        var other = e.from === id ? e.to : e.from;
        html += "<li><b>" + escape(NODES[other].en) + "</b> — " + escape(e.note) + "</li>";
      });
      html += "</ul>";
    } else {
      html += "<p>Named in the Qur'an; no parent/child edge drawn for this node.</p>";
    }
    treeDetail.innerHTML = html;
  }

  /* ===================== Map ===================== */
  // Equirectangular-ish projection focused on MENA
  var MAP = { lon0: 20, lon1: 55, lat0: 10, lat1: 45 };

  function project(lon, lat, w, h, pad) {
    var x = pad + (lon - MAP.lon0) / (MAP.lon1 - MAP.lon0) * (w - pad * 2);
    var y = pad + (MAP.lat1 - lat) / (MAP.lat1 - MAP.lat0) * (h - pad * 2);
    return { x: x, y: y };
  }

  function paintBaseMap(svg, w, h, pad, landFill) {
    svg.appendChild(el("rect", {
      x: 0, y: 0, width: w, height: h,
      fill: landFill || "#f3e9c8"
    }));
    var mediterranean = "M " + [
      project(20, 37, w, h, pad), project(28, 41, w, h, pad), project(36, 36, w, h, pad),
      project(35, 32, w, h, pad), project(30, 31, w, h, pad), project(25, 32, w, h, pad),
      project(20, 32, w, h, pad)
    ].map(function (p) { return p.x + "," + p.y; }).join(" L ");
    svg.appendChild(el("path", { d: mediterranean + " Z", fill: "#c5dce8", "fill-opacity": "0.9" }));
    var redSea = "M " + [
      project(32.5, 30, w, h, pad), project(34, 28, w, h, pad), project(40, 20, w, h, pad),
      project(43, 14, w, h, pad), project(42, 12.5, w, h, pad), project(39, 15, w, h, pad),
      project(34, 22, w, h, pad), project(32.2, 28, w, h, pad)
    ].map(function (p) { return p.x + "," + p.y; }).join(" L ");
    svg.appendChild(el("path", { d: redSea + " Z", fill: "#b7d4e3", "fill-opacity": "0.85" }));
    var persianGulf = "M " + [
      project(48, 30, w, h, pad), project(52, 27, w, h, pad), project(55, 25, w, h, pad),
      project(52, 24, w, h, pad), project(48, 27, w, h, pad)
    ].map(function (p) { return p.x + "," + p.y; }).join(" L ");
    svg.appendChild(el("path", { d: persianGulf + " Z", fill: "#b7d4e3", "fill-opacity": "0.8" }));
    [["Arabia", 42, 22], ["Egypt", 29, 27], ["Levant", 36, 33], ["Mesopotamia", 45, 34], ["Yemen", 46, 15]].forEach(function (lab) {
      var p = project(lab[1], lab[2], w, h, pad);
      svg.appendChild(el("text", {
        x: p.x, y: p.y,
        fill: "rgba(74,42,106,0.35)",
        "font-size": 13,
        "font-family": "Georgia, serif",
        "text-anchor": "middle",
        text: lab[0]
      }));
    });
    svg.appendChild(el("rect", {
      x: 1, y: 1, width: w - 2, height: h - 2,
      fill: "none", stroke: "#d8d4a8", "stroke-width": 2
    }));
  }

  function drawPlaceMap(opts) {
    var svg = opts.svg, wrap = opts.wrap, tip = opts.tip;
    var places = opts.places, onSelect = opts.onSelect;
    var markerFill = opts.markerFill || "#c62828";
    var landFill = opts.landFill;
    if (!svg || !wrap) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var w = Math.max(640, wrap.clientWidth);
    var h = Math.max(420, Math.round(w * 0.62));
    var pad = 28;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    paintBaseMap(svg, w, h, pad, landFill);

    places.forEach(function (place) {
      var p = project(place.lon, place.lat, w, h, pad);
      var gEl = el("g");
      gEl.style.cursor = "pointer";
      if (opts.doomStyle) {
        // Broken ring: outer stroke + inner fill
        gEl.appendChild(el("circle", {
          cx: p.x, cy: p.y, r: 11,
          fill: "none",
          stroke: markerFill,
          "stroke-width": 2,
          "stroke-dasharray": "3 3",
          "stroke-opacity": "0.7"
        }));
      }
      gEl.appendChild(el("circle", {
        cx: p.x, cy: p.y, r: opts.doomStyle ? 6 : 7,
        fill: markerFill,
        stroke: "#fff",
        "stroke-width": 1.5
      }));
      gEl.appendChild(el("text", {
        x: p.x + 12, y: p.y + 4,
        fill: "#4a2a6a",
        "font-size": 11,
        "font-family": "Georgia, serif",
        text: place.en.split(" / ")[0].split(" (")[0]
      }));
      gEl.addEventListener("mousemove", function (evt) {
        var tipHtml = "<b lang=\"ar\" dir=\"rtl\">" + escape(place.ar) + "</b> " + escape(place.en) +
          "<br><i>" + escape(place.verse) + "</i>";
        if (place.how) tipHtml += "<br><b>" + escape(place.how) + "</b>";
        tipHtml += "<br>" + escape(place.note);
        showTip(tip, wrap, evt, tipHtml);
      });
      gEl.addEventListener("mouseleave", function () { tip.hidden = true; });
      gEl.addEventListener("click", function () { onSelect(place.id); });
      svg.appendChild(gEl);
    });
  }

  function drawMap() {
    drawPlaceMap({
      svg: mapSvg, wrap: mapWrap, tip: mapTip,
      places: PLACES, onSelect: selectPlace,
      markerFill: "#c62828"
    });
  }

  function drawDoomMap() {
    drawPlaceMap({
      svg: doomSvg, wrap: doomWrap, tip: doomTip,
      places: DESTROYED, onSelect: selectDoom,
      markerFill: "#8b1a1a",
      landFill: "#efe2c4",
      doomStyle: true
    });
  }

  function selectPlace(id) {
    var place = PLACES.filter(function (p) { return p.id === id; })[0];
    if (!place) return;
    mapDetail.innerHTML =
      '<div class="picked"><span class="ar" lang="ar" dir="rtl">' + escape(place.ar) +
      "</span><div><b>" + escape(place.en) + "</b><div>" + escape(place.verse) +
      "</div></div></div><p>" + escape(place.note) + "</p>";
    if (placeList) {
      placeList.querySelectorAll("[data-place]").forEach(function (li) {
        li.classList.toggle("on", li.getAttribute("data-place") === id);
      });
    }
  }

  function selectDoom(id) {
    var place = DESTROYED.filter(function (p) { return p.id === id; })[0];
    if (!place) return;
    doomDetail.innerHTML =
      '<div class="picked"><span class="ar" lang="ar" dir="rtl">' + escape(place.ar) +
      "</span><div><b>" + escape(place.en) + "</b><div>" + escape(place.verse) +
      '</div></div></div>' +
      '<p class="doom-how"><b>Punishment:</b> ' + escape(place.how) +
      (place.messenger && place.messenger !== "—"
        ? " · <b>Messenger:</b> " + escape(place.messenger) : "") +
      "</p><p>" + escape(place.note) + "</p>";
    if (doomList) {
      doomList.querySelectorAll("[data-doom]").forEach(function (li) {
        li.classList.toggle("on", li.getAttribute("data-doom") === id);
      });
    }
  }

  function fillPlaceList() {
    if (!placeList) return;
    placeList.innerHTML = PLACES.map(function (p) {
      return '<button type="button" class="place-chip" data-place="' + p.id + '">' +
        '<b lang="ar" dir="rtl">' + escape(p.ar) + "</b> " + escape(p.en) +
        "</button>";
    }).join("");
    placeList.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-place]");
      if (!btn) return;
      selectPlace(btn.getAttribute("data-place"));
    });
  }

  function fillDoomList() {
    if (!doomList) return;
    doomList.innerHTML = DESTROYED.map(function (p) {
      return '<button type="button" class="place-chip doom-chip" data-doom="' + p.id + '">' +
        '<b lang="ar" dir="rtl">' + escape(p.ar) + "</b> " + escape(p.en) +
        '<span class="how">' + escape(p.how) + "</span></button>";
    }).join("");
    doomList.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-doom]");
      if (!btn) return;
      selectDoom(btn.getAttribute("data-doom"));
    });
  }

  function showTip(tip, wrap, evt, html) {
    tip.hidden = false;
    tip.innerHTML = html;
    var box = wrap.getBoundingClientRect();
    var x = evt.clientX - box.left + 12;
    var y = evt.clientY - box.top + 12;
    if (x + tip.offsetWidth > box.width - 8) x = box.width - tip.offsetWidth - 8;
    if (y + tip.offsetHeight > box.height - 8) y = evt.clientY - box.top - tip.offsetHeight - 8;
    tip.style.left = Math.max(8, x) + "px";
    tip.style.top = Math.max(8, y) + "px";
  }

  /* section tabs */
  var tabs = document.querySelector(".geo-tabs");
  if (tabs) {
    tabs.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-geo]");
      if (!btn) return;
      var id = btn.getAttribute("data-geo");
      tabs.querySelectorAll("[data-geo]").forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      document.querySelectorAll(".geo-panel").forEach(function (p) {
        p.hidden = p.id !== "geo-" + id;
      });
      if (id === "tree") drawTree();
      if (id === "map") drawMap();
      if (id === "doom") drawDoomMap();
    });
  }

  fillPlaceList();
  fillDoomList();
  drawTree();
  drawMap();
  drawDoomMap();
  selectPerson("ibrahim");
  selectPlace("makkah");
  selectDoom("ad-ahqaf");

  window.addEventListener("resize", function () {
    drawTree();
    drawMap();
    drawDoomMap();
  });
})();
