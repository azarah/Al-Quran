/* Unified Al-Quran Study app — reader, search, bookmarks, module routing */
(function () {
  "use strict";

  var EN = [
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

  var STORE_KEY = "alquran-study-v1";
  var state = {
    surahs: [],      // [{n, ar, en, verses:[{s,a,ar,en}]}]
    byKey: {},       // "s:a" -> verse
    loaded: false,
    loadError: null,
    currentSurah: 1,
    route: "home",
    game: null
  };

  function $(id) { return document.getElementById(id); }

  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function saveStore(patch) {
    var cur = loadStore();
    Object.keys(patch).forEach(function (k) { cur[k] = patch[k]; });
    localStorage.setItem(STORE_KEY, JSON.stringify(cur));
  }

  function bookmarks() {
    return loadStore().bookmarks || [];
  }

  function isBookmarked(s, a) {
    return bookmarks().some(function (b) { return b.s === s && b.a === a; });
  }

  function toggleBookmark(s, a) {
    var list = bookmarks().slice();
    var i = list.findIndex(function (b) { return b.s === s && b.a === a; });
    if (i >= 0) {
      list.splice(i, 1);
    } else {
      var v = state.byKey[s + ":" + a];
      if (!v) return;
      list.unshift({
        s: s, a: a,
        ar: v.ar,
        en: v.en,
        surahEn: EN[s - 1] || "",
        at: Date.now()
      });
    }
    saveStore({ bookmarks: list });
    refreshBookmarkViews();
    updateHomeStats();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /* ---------- parse Al-Quran.txt ---------- */
  function parseCorpus(text) {
    var surahs = [];
    var byKey = {};
    var cur = null;
    var lines = text.split(/\r?\n/);
    var i, line, m, sm, verse;

    for (i = 0; i < lines.length; i++) {
      line = lines[i];
      sm = /^SURAH\s+(\d+)\s+-\s+(.+)$/.exec(line);
      if (sm) {
        cur = {
          n: +sm[1],
          ar: sm[2].trim(),
          en: EN[+sm[1] - 1] || sm[2].trim(),
          verses: []
        };
        surahs.push(cur);
        continue;
      }
      m = /^\[(\d+):(\d+)\]$/.exec(line);
      if (m && cur) {
        var ar = (lines[i + 1] || "").trim();
        var en = (lines[i + 2] || "").trim();
        verse = { s: +m[1], a: +m[2], ar: ar, en: en };
        cur.verses.push(verse);
        byKey[verse.s + ":" + verse.a] = verse;
        i += 2;
      }
    }
    return { surahs: surahs, byKey: byKey };
  }

  function showLoadError(msg) {
    state.loadError = msg;
    ["load-status", "read-status"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.classList.add("show");
      el.innerHTML = msg;
    });
  }

  function loadCorpus() {
    return fetch("Al-Quran.txt")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (text) {
        var parsed = parseCorpus(text);
        if (!parsed.surahs.length) throw new Error("No surahs found in Al-Quran.txt");
        state.surahs = parsed.surahs;
        state.byKey = parsed.byKey;
        state.loaded = true;
        ["load-status", "read-status"].forEach(function (id) {
          var el = $(id);
          if (el) { el.classList.remove("show"); el.textContent = ""; }
        });
        fillSurahSelect();
        updateHomeStats();
        renderContinue();
        var hash = parseHash();
        if (hash.route === "read") renderSurah(hash.s || state.currentSurah, hash.a);
        if (hash.route === "search" && hash.q) {
          $("search-q").value = hash.q;
          $("global-q").value = hash.q;
          runSearch(hash.q);
        }
      })
      .catch(function (err) {
        showLoadError(
          "<b>Could not load Al-Quran.txt.</b> Serve this folder over HTTP " +
          "(for example <code>python -m http.server</code> in the project directory), " +
          "then open <code>Al-Quran-Study.html</code>. " +
          "Roots, Genealogy, Angels, People, and Calculators still work in the side menu. " +
          "<br><small>" + escapeHtml(String(err.message || err)) + "</small>"
        );
      });
  }

  /* ---------- routing ---------- */
  function parseHash() {
    var raw = (location.hash || "#/home").replace(/^#\/?/, "");
    var parts = raw.split("/").filter(Boolean);
    var route = parts[0] || "home";
    var s = parts[1] ? parseInt(parts[1], 10) : null;
    var a = parts[2] ? parseInt(parts[2], 10) : null;
    var q = "";
    if (route === "search" && parts[1]) {
      try { q = decodeURIComponent(parts.slice(1).join("/")); } catch (e) { q = parts.slice(1).join("/"); }
    }
    return { route: route, s: s, a: a, q: q };
  }

  function setHash(route, s, a, q) {
    var h = "#/" + route;
    if (route === "read" && s) {
      h += "/" + s + (a ? "/" + a : "");
    } else if (route === "search" && q) {
      h += "/" + encodeURIComponent(q);
    }
    if (location.hash !== h) location.hash = h;
    else applyRoute();
  }

  function applyRoute() {
    var h = parseHash();
    var route = h.route;
    if (route === "fulltext") {
      window.open("Al-Quran.html", "_blank");
      setHash(state.route || "home");
      return;
    }
    state.route = route;

    document.querySelectorAll(".view").forEach(function (v) {
      v.classList.toggle("active", v.getAttribute("data-view") === route);
    });
    document.querySelectorAll("#side-nav [data-route]").forEach(function (b) {
      if (b.getAttribute("data-route") === route) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    $("side-nav").classList.remove("open");

    if (route === "read") {
      var sn = h.s || loadStore().lastSurah || 1;
      renderSurah(sn, h.a || null);
    } else if (route === "search") {
      if (h.q) {
        $("search-q").value = h.q;
        $("global-q").value = h.q;
        runSearch(h.q);
      }
    } else if (route === "bookmarks") {
      refreshBookmarkViews();
    } else if (route === "home") {
      renderContinue();
      updateHomeStats();
    } else if (route === "game") {
      ensureGame();
    }
  }

  function ensureGame() {
    if (state.game) {
      state.game.refresh();
      return;
    }
    if (!window.AlQuranGame || !window.AlQuranGame.mount) {
      var root = $("game-root");
      if (root) {
        root.innerHTML =
          '<p class="empty">Game module failed to load. Check that <code>quran_game.js</code> is present.</p>';
      }
      return;
    }
    state.game = window.AlQuranGame.mount($("game-root"), {
      getVerse: function (s, a) {
        return state.byKey[s + ":" + a] || null;
      },
      openVerse: function (s, a) {
        openVerse(s, a);
      }
    });
  }

  /* ---------- reader ---------- */
  function fillSurahSelect() {
    var sel = $("surah-select");
    if (!sel) return;
    sel.innerHTML = state.surahs.map(function (s) {
      return '<option value="' + s.n + '">' + s.n + ". " + escapeHtml(s.en) +
        " — " + escapeHtml(s.ar) + "</option>";
    }).join("");
  }

  function renderSurah(n, highlightAyah) {
    if (!state.loaded) return;
    var surah = state.surahs[n - 1];
    if (!surah) return;
    state.currentSurah = n;
    $("surah-select").value = String(n);
    $("ayah-jump").max = surah.verses.length;
    $("ayah-jump").value = highlightAyah || 1;
    $("surah-title").textContent = surah.n + ". " + surah.en;
    $("surah-sub").textContent = surah.ar + " · " + surah.verses.length + " verses";

    var html = surah.verses.map(function (v) {
      var on = isBookmarked(v.s, v.a) ? " on" : "";
      return (
        '<div class="verse-block" id="v-' + v.s + "-" + v.a + '">' +
          '<div class="verse-meta">' +
            '<span class="verse-ref">' + v.s + ":" + v.a + "</span>" +
            '<button type="button" class="bm-btn' + on + '" data-bm="' + v.s + ":" + v.a + '">' +
              (on ? "★ Saved" : "☆ Save") +
            "</button>" +
          "</div>" +
          '<span class="arabic" lang="ar" dir="rtl">' + escapeHtml(v.ar) + "</span>" +
          '<span class="translation">' + escapeHtml(v.en) + "</span>" +
        "</div>"
      );
    }).join("");
    $("verse-list").innerHTML = html;

    saveStore({ lastSurah: n, lastAyah: highlightAyah || 1 });

    if (highlightAyah) {
      var el = $("v-" + n + "-" + highlightAyah);
      if (el) {
        el.classList.add("flash");
        setTimeout(function () {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 40);
      }
    } else {
      $("view-read").scrollTop = 0;
    }
  }

  function goAdjacent(delta) {
    var n = state.currentSurah + delta;
    if (n < 1 || n > state.surahs.length) return;
    setHash("read", n);
  }

  /* ---------- search ---------- */
  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    var re = new RegExp("(" + escapeRegExp(q) + ")", "ig");
    return escapeHtml(text).replace(re, "<mark>$1</mark>");
  }

  function runSearch(q) {
    q = (q || "").trim();
    var box = $("search-results");
    var meta = $("search-meta");
    if (!state.loaded) {
      meta.textContent = "Corpus not loaded yet.";
      box.innerHTML = "";
      return;
    }
    if (q.length < 2) {
      meta.textContent = "Type at least 2 characters.";
      box.innerHTML = "";
      return;
    }
    var ql = q.toLowerCase();
    var hits = [];
    var s, v, i, j;
    for (i = 0; i < state.surahs.length; i++) {
      s = state.surahs[i];
      for (j = 0; j < s.verses.length; j++) {
        v = s.verses[j];
        if (v.ar.indexOf(q) !== -1 || v.en.toLowerCase().indexOf(ql) !== -1) {
          hits.push(v);
          if (hits.length >= 200) break;
        }
      }
      if (hits.length >= 200) break;
    }
    meta.textContent = hits.length >= 200
      ? "Showing first 200 matches for “" + q + "”."
      : hits.length + " match" + (hits.length === 1 ? "" : "es") + " for “" + q + "”.";

    box.innerHTML = hits.map(function (v) {
      return (
        '<button type="button" class="hit" data-go-verse="' + v.s + ":" + v.a + '">' +
          '<span class="ref">' + v.s + ":" + v.a + " · " + escapeHtml(EN[v.s - 1] || "") + "</span>" +
          '<span class="ar" lang="ar" dir="rtl">' + highlight(v.ar, q) + "</span>" +
          '<span class="en">' + highlight(v.en, q) + "</span>" +
        "</button>"
      );
    }).join("") || '<p class="empty">No verses matched.</p>';
  }

  /* ---------- bookmarks / continue / stats ---------- */
  function refreshBookmarkViews() {
    var list = bookmarks();
    var ul = $("bm-list");
    var empty = $("bm-empty");
    if (!ul) return;
    if (!list.length) {
      ul.innerHTML = "";
      if (empty) empty.style.display = "";
      return;
    }
    if (empty) empty.style.display = "none";
    ul.innerHTML = list.map(function (b) {
      return (
        "<li>" +
          '<button type="button" class="go" data-go-verse="' + b.s + ":" + b.a + '">' +
            '<div class="ref">' + b.s + ":" + b.a + " · " + escapeHtml(b.surahEn || "") + "</div>" +
            '<div class="en">' + escapeHtml((b.en || "").slice(0, 160)) +
              ((b.en || "").length > 160 ? "…" : "") + "</div>" +
          "</button>" +
          '<button type="button" class="rm" data-rm="' + b.s + ":" + b.a + '">Remove</button>' +
        "</li>"
      );
    }).join("");

    /* refresh visible reader buttons if on read view */
    if (state.route === "read" && state.loaded) {
      document.querySelectorAll(".bm-btn[data-bm]").forEach(function (btn) {
        var parts = btn.getAttribute("data-bm").split(":");
        var on = isBookmarked(+parts[0], +parts[1]);
        btn.classList.toggle("on", on);
        btn.textContent = on ? "★ Saved" : "☆ Save";
      });
    }
  }

  function renderContinue() {
    var store = loadStore();
    var body = $("continue-body");
    var empty = $("continue-empty");
    if (!store.lastSurah) {
      if (body) body.hidden = true;
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    if (!body) return;
    body.hidden = false;
    var en = EN[store.lastSurah - 1] || ("Surah " + store.lastSurah);
    var ayah = store.lastAyah || 1;
    body.innerHTML =
      "<p>Last place: <b>" + escapeHtml(en) + "</b>, ayah " + ayah + ".</p>" +
      '<button type="button" class="continue-btn" id="home-continue">Resume reading</button>';
    var btn = $("home-continue");
    if (btn) {
      btn.addEventListener("click", function () {
        setHash("read", store.lastSurah, ayah);
      });
    }
  }

  function updateHomeStats() {
    var stats = $("home-stats");
    if (!stats) return;
    var verseCount = state.loaded
      ? state.surahs.reduce(function (n, s) { return n + s.verses.length; }, 0)
      : "—";
    var surahCount = state.loaded ? state.surahs.length : "—";
    stats.innerHTML =
      "<div><b>" + surahCount + "</b><span>surahs</span></div>" +
      "<div><b>" + verseCount + "</b><span>verses</span></div>" +
      "<div><b>" + bookmarks().length + "</b><span>bookmarks</span></div>";
  }

  function openVerse(s, a) {
    setHash("read", s, a);
  }

  /* ---------- events ---------- */
  function bind() {
    document.querySelectorAll("#side-nav [data-route]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setHash(btn.getAttribute("data-route"));
      });
    });

    $("menu-toggle").addEventListener("click", function () {
      $("side-nav").classList.toggle("open");
    });

    $("module-grid").addEventListener("click", function (e) {
      var card = e.target.closest("[data-go]");
      if (!card) return;
      setHash(card.getAttribute("data-go"));
    });

    $("global-search-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var q = $("global-q").value.trim();
      if (q.length < 2) return;
      setHash("search", null, null, q);
    });

    var searchTimer = null;
    $("search-q").addEventListener("input", function () {
      var q = $("search-q").value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        $("global-q").value = q;
        if (q.trim().length >= 2) {
          history.replaceState(null, "", "#/search/" + encodeURIComponent(q.trim()));
          runSearch(q);
        } else {
          runSearch(q);
        }
      }, 220);
    });

    $("surah-select").addEventListener("change", function () {
      setHash("read", +$("surah-select").value);
    });
    $("btn-jump").addEventListener("click", function () {
      setHash("read", state.currentSurah, +$("ayah-jump").value || 1);
    });
    $("ayah-jump").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        setHash("read", state.currentSurah, +$("ayah-jump").value || 1);
      }
    });
    $("btn-prev").addEventListener("click", function () { goAdjacent(-1); });
    $("btn-next").addEventListener("click", function () { goAdjacent(1); });
    $("btn-continue").addEventListener("click", function () {
      var store = loadStore();
      if (store.lastSurah) setHash("read", store.lastSurah, store.lastAyah || 1);
      else setHash("read", 1);
    });

    document.addEventListener("click", function (e) {
      var bm = e.target.closest("[data-bm]");
      if (bm) {
        var p = bm.getAttribute("data-bm").split(":");
        toggleBookmark(+p[0], +p[1]);
        return;
      }
      var go = e.target.closest("[data-go-verse]");
      if (go) {
        var g = go.getAttribute("data-go-verse").split(":");
        openVerse(+g[0], +g[1]);
        return;
      }
      var rm = e.target.closest("[data-rm]");
      if (rm) {
        var r = rm.getAttribute("data-rm").split(":");
        toggleBookmark(+r[0], +r[1]);
      }
    });

    window.addEventListener("hashchange", applyRoute);
  }

  bind();
  applyRoute();
  loadCorpus();
})();
