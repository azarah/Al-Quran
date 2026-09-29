/* Qur'an-rule calculators for Al-Quran-Calculators.html */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function num(el) {
    var v = parseFloat(el && el.value);
    return isFinite(v) && v >= 0 ? v : 0;
  }
  function int(el) {
    var v = parseInt(el && el.value, 10);
    return isFinite(v) && v >= 0 ? v : 0;
  }
  function frac(n, d) { return d ? n / d : 0; }
  function gcd(a, b) {
    a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
    while (b) { var t = b; b = a % b; a = t; }
    return a || 1;
  }
  function simplify(n, d) {
    var g = gcd(n, d);
    return [n / g, d / g];
  }
  function fmtMoney(x) {
    if (!isFinite(x)) return "—";
    return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  function fmtPct(x) {
    return (x * 100).toLocaleString(undefined, { maximumFractionDigits: 2 }) + "%";
  }
  function fmtShare(n, d) {
    var s = simplify(n, d);
    return s[0] + "/" + s[1];
  }

  /* ---------------- tabs ---------------- */
  var tabs = document.querySelector(".calc-tabs");
  if (tabs) {
    tabs.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-calc]");
      if (!btn) return;
      var id = btn.getAttribute("data-calc");
      tabs.querySelectorAll("[data-calc]").forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      document.querySelectorAll(".calc-panel").forEach(function (p) {
        p.hidden = p.id !== "calc-" + id;
      });
    });
  }

  /* ============================================================
     Inheritance — Qur'an 4:11, 4:12, 4:176 (classical furud + asaba)
     Educational: awl (pro-rata cut) and radd (return) noted when used.
     ============================================================ */
  function inheritCompute() {
    var estate = num($("inh-estate"));
    var debts = num($("inh-debts"));
    var bequest = num($("inh-bequest"));
    var gender = ($("inh-gender") && $("inh-gender").value) || "male";
    var husband = $("inh-husband") && $("inh-husband").checked;
    var wives = int($("inh-wives"));
    var sons = int($("inh-sons"));
    var daughters = int($("inh-daughters"));
    var father = $("inh-father") && $("inh-father").checked;
    var mother = $("inh-mother") && $("inh-mother").checked;
    var fullBro = int($("inh-full-bro"));
    var fullSis = int($("inh-full-sis"));
    var uterBro = int($("inh-uter-bro"));
    var uterSis = int($("inh-uter-sis"));

    var out = $("inh-out");
    var notes = [];
    var errs = [];

    if (gender === "male" && husband) errs.push("A male deceased cannot leave a husband.");
    if (gender === "female" && wives > 0) errs.push("A female deceased cannot leave wives.");
    if (gender === "male" && wives > 4) errs.push("Wives capped at 4 for this tool (4:3).");
    if (bequest > 0 && estate - debts > 0 && bequest > (estate - debts) / 3 + 1e-9) {
      notes.push("Bequest exceeds one-third of the net estate. Many schools limit bequests to ⅓ unless heirs consent (not stated as a fraction in the Qur'an).");
    }

    if (errs.length) {
      out.innerHTML = '<p class="calc-err">' + errs.map(escape).join("<br>") + "</p>";
      return;
    }

    var net = Math.max(0, estate - debts - bequest);
    var hasChild = sons + daughters > 0;
    var hasSibling = fullBro + fullSis + uterBro + uterSis > 0;
    // Fixed shares as {label, count, num, den, verse, kind}
    var fixed = [];
    var residueHeirs = []; // asaba: share residue male=2×female or sole residuary

    // Spouse
    if (gender === "female" && husband) {
      if (hasChild) fixed.push({ label: "Husband", count: 1, num: 1, den: 4, verse: "4:12", kind: "furud" });
      else fixed.push({ label: "Husband", count: 1, num: 1, den: 2, verse: "4:12", kind: "furud" });
    }
    if (gender === "male" && wives > 0) {
      if (hasChild) fixed.push({ label: wives === 1 ? "Wife" : "Wives", count: wives, num: 1, den: 8, verse: "4:12", kind: "furud" });
      else fixed.push({ label: wives === 1 ? "Wife" : "Wives", count: wives, num: 1, den: 4, verse: "4:12", kind: "furud" });
    }

    // Parents
    if (father && hasChild) {
      fixed.push({ label: "Father", count: 1, num: 1, den: 6, verse: "4:11", kind: "furud" });
    }
    if (mother) {
      if (hasChild) {
        fixed.push({ label: "Mother", count: 1, num: 1, den: 6, verse: "4:11", kind: "furud" });
      } else if (hasSibling) {
        fixed.push({ label: "Mother", count: 1, num: 1, den: 6, verse: "4:11", kind: "furud" });
      } else {
        fixed.push({ label: "Mother", count: 1, num: 1, den: 3, verse: "4:11", kind: "furud" });
      }
    }

    // Daughters only (no sons) — fixed share
    if (daughters > 0 && sons === 0) {
      if (daughters === 1) {
        fixed.push({ label: "Daughter", count: 1, num: 1, den: 2, verse: "4:11", kind: "furud" });
      } else {
        fixed.push({ label: "Daughters", count: daughters, num: 2, den: 3, verse: "4:11", kind: "furud" });
      }
    }

    // Uterine siblings (kalalah of 4:12): no child and no father (classical reading of “no parent/child”)
    var kalalahUter = !hasChild && !father;
    if (kalalahUter) {
      var uter = uterBro + uterSis;
      if (uter === 1) {
        fixed.push({
          label: uterBro ? "Uterine brother" : "Uterine sister",
          count: 1, num: 1, den: 6, verse: "4:12", kind: "furud"
        });
      } else if (uter >= 2) {
        fixed.push({
          label: "Uterine siblings",
          count: uter, num: 1, den: 3, verse: "4:12", kind: "furud"
        });
      }
    }

    // Full / consanguine siblings under 4:176 when no child (and typically no father as residuary)
    // Applied when: no sons/daughters, and no father taking asaba; sisters may take fixed then brothers asaba
    var kalalah176 = !hasChild && !father;
    if (kalalah176 && (fullBro + fullSis) > 0) {
      if (fullBro === 0 && fullSis === 1) {
        fixed.push({ label: "Full sister", count: 1, num: 1, den: 2, verse: "4:176", kind: "furud" });
      } else if (fullBro === 0 && fullSis >= 2) {
        fixed.push({ label: "Full sisters", count: fullSis, num: 2, den: 3, verse: "4:176", kind: "furud" });
      } else if (fullBro > 0) {
        // Brothers (with or without sisters) take as residuaries, male=2×female (4:176)
        residueHeirs.push({ label: "Full brother", count: fullBro, weight: 2, verse: "4:176" });
        if (fullSis > 0) {
          residueHeirs.push({ label: "Full sister", count: fullSis, weight: 1, verse: "4:176" });
        }
      }
    }

    // Residuaries (asaba)
    if (sons > 0) {
      residueHeirs = [
        { label: "Son", count: sons, weight: 2, verse: "4:11" }
      ];
      if (daughters > 0) {
        residueHeirs.push({ label: "Daughter", count: daughters, weight: 1, verse: "4:11" });
      }
    } else if (father) {
      // Father takes the remainder when there is no son (with or without daughters).
      residueHeirs.push({ label: "Father", count: 1, weight: 1, verse: "4:11" });
    }

    // Sum fixed shares
    var fixedTotal = 0;
    fixed.forEach(function (f) { fixedTotal += f.num / f.den; });

    var mode = "exact";
    var scale = 1;
    if (fixedTotal > 1 + 1e-9) {
      mode = "awl";
      scale = 1 / fixedTotal;
      notes.push("Shares exceed the estate (“awl”). Each fixed share is reduced proportionally so they total 100% — a classical solution when Qur'anic fractions sum over one.");
    }

    var residue = Math.max(0, 1 - Math.min(1, fixedTotal) * (mode === "awl" ? 0 : 1));
    // After awl, residue is 0. Without awl:
    if (mode !== "awl") residue = Math.max(0, 1 - fixedTotal);

    var rows = [];
    fixed.forEach(function (f) {
      var portion = (f.num / f.den) * scale;
      rows.push({
        label: f.label,
        count: f.count,
        share: portion,
        each: portion / f.count,
        verse: f.verse,
        kind: "Fixed share",
        frac: fmtShare(f.num, f.den) + (mode === "awl" ? " → reduced" : "")
      });
    });

    if (residue > 1e-9 && residueHeirs.length) {
      var units = 0;
      residueHeirs.forEach(function (h) { units += h.count * h.weight; });
      residueHeirs.forEach(function (h) {
        var portion = residue * (h.count * h.weight) / units;
        rows.push({
          label: h.label,
          count: h.count,
          share: portion,
          each: portion / h.count,
          verse: h.verse,
          kind: "Residue (ʿaṣaba)",
          frac: "remainder × " + h.weight + (h.weight === 2 ? " (male)" : " (female)")
        });
      });
    } else if (residue > 1e-9 && !residueHeirs.length) {
      mode = mode === "awl" ? mode : "radd";
      notes.push("A remainder is left with no residuary heir. Classical “radd” returns the surplus to fixed-share heirs (often excluding the spouse). This tool leaves the remainder unassigned for transparency.");
      rows.push({
        label: "Unassigned remainder",
        count: 1,
        share: residue,
        each: residue,
        verse: "—",
        kind: "Needs radd / further heirs",
        frac: "—"
      });
    }

    if (!rows.length) {
      out.innerHTML = '<p class="calc-err">Add at least one heir.</p>';
      return;
    }

    var sum = rows.reduce(function (a, r) { return a + r.share; }, 0);
    var html = "";
    html += '<div class="calc-summary">';
    html += "<div><b>" + fmtMoney(estate) + "</b><span>estate</span></div>";
    html += "<div><b>" + fmtMoney(debts) + "</b><span>debts</span></div>";
    html += "<div><b>" + fmtMoney(bequest) + "</b><span>bequests</span></div>";
    html += "<div><b>" + fmtMoney(net) + "</b><span>net to heirs</span></div>";
    html += "</div>";
    html += '<p class="calc-rule">Distribution after debts and bequests (4:11–12). Male children and residuary siblings take twice the female share among themselves (4:11, 4:176).</p>';

    html += '<table class="calc-table"><thead><tr>';
    html += "<th>Heir</th><th>Kind</th><th>Share</th><th>Of estate</th>";
    if (net > 0) html += "<th class=\"num\">Amount</th><th class=\"num\">Each</th>";
    html += "<th>Verse</th></tr></thead><tbody>";

    rows.forEach(function (r) {
      html += "<tr>";
      html += "<td>" + escape(r.label) + (r.count > 1 ? " ×" + r.count : "") + "</td>";
      html += "<td>" + escape(r.kind) + "</td>";
      html += "<td>" + escape(r.frac) + "</td>";
      html += "<td>" + fmtPct(r.share) + "</td>";
      if (net > 0) {
        html += '<td class="num">' + fmtMoney(net * r.share) + "</td>";
        html += '<td class="num">' + fmtMoney(net * r.each) + "</td>";
      }
      html += "<td>" + escape(r.verse) + "</td>";
      html += "</tr>";
    });
    html += "</tbody></table>";
    html += '<p class="calc-foot">Assigned: <b>' + fmtPct(sum) + "</b>";
    if (mode === "awl") html += " (after awl)";
    html += "</p>";

    if (notes.length) {
      html += '<ul class="calc-notes">' + notes.map(function (n) {
        return "<li>" + escape(n) + "</li>";
      }).join("") + "</ul>";
    }
    html += '<p class="calc-disclaimer">Educational tool based on the Qur\'anic fractions. Edge cases (grandparents, agnate relatives, school differences on radd) may need a qualified scholar.</p>';
    out.innerHTML = html;
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function bindInherit() {
    var form = $("inh-form");
    if (!form) return;
    function refreshWives() {
      var g = $("inh-gender").value;
      $("inh-husband-wrap").hidden = g !== "female";
      $("inh-wives-wrap").hidden = g !== "male";
      if (g === "male") $("inh-husband").checked = false;
      if (g === "female") $("inh-wives").value = "0";
    }
    $("inh-gender").addEventListener("change", function () {
      refreshWives();
      inheritCompute();
    });
    form.addEventListener("input", inheritCompute);
    form.addEventListener("change", inheritCompute);
    refreshWives();
    inheritCompute();
  }

  /* ============================================================
     Iddah waiting periods — 2:226, 2:228, 2:234, 65:4
     ============================================================ */
  function iddahCompute() {
    var kind = $("iddah-kind").value;
    var start = $("iddah-start").value;
    var pregnant = $("iddah-pregnant").checked;
    var out = $("iddah-out");
    if (!start) {
      out.innerHTML = "<p>Choose a start date.</p>";
      return;
    }
    var d0 = new Date(start + "T12:00:00");
    if (isNaN(d0.getTime())) {
      out.innerHTML = '<p class="calc-err">Invalid date.</p>';
      return;
    }
    var rule = "";
    var verse = "";
    var end = new Date(d0.getTime());
    var cycles = int($("iddah-cycles"));

    if (pregnant) {
      rule = "Until she delivers (for a pregnant woman).";
      verse = "65:4";
      out.innerHTML =
        '<p class="calc-rule">' + escape(rule) + " <i>(" + verse + ")</i></p>" +
        "<p>Enter the expected delivery date with your clinician; the Qur'an sets the end at birth, not a fixed day count.</p>" +
        '<p>Waiting began: <b>' + fmtDate(d0) + "</b></p>";
      return;
    }

    if (kind === "divorce") {
      rule = "Three menstrual periods (qurūʾ).";
      verse = "2:228";
      // Approximate with average cycle length if user gives cycle count completion
      var cycleDays = num($("iddah-cycle-days")) || 28;
      end.setDate(end.getDate() + Math.round(cycles * cycleDays));
      out.innerHTML =
        '<p class="calc-rule">' + escape(rule) + " <i>(" + verse + ")</i></p>" +
        "<p>Start: <b>" + fmtDate(d0) + "</b><br>" +
        "Approximate end after <b>" + cycles + "</b> cycles × <b>" + cycleDays +
        "</b> days: <b>" + fmtDate(end) + "</b></p>" +
        "<p class=\"calc-disclaimer\">The Qur'an counts menstrual periods, not solar days. The date above is only an estimate from your cycle length.</p>";
      return;
    }
    if (kind === "widow") {
      rule = "Four months and ten days.";
      verse = "2:234";
      end.setMonth(end.getMonth() + 4);
      end.setDate(end.getDate() + 10);
    } else if (kind === "ila") {
      rule = "Four months (oath of abstention).";
      verse = "2:226";
      end.setMonth(end.getMonth() + 4);
    }
    out.innerHTML =
      '<p class="calc-rule">' + escape(rule) + " <i>(" + verse + ")</i></p>" +
      "<p>Start: <b>" + fmtDate(d0) + "</b><br>Ends: <b>" + fmtDate(end) + "</b>" +
      " <span class=\"muted\">(" + dayDiff(d0, end) + " days)</span></p>";
  }

  function fmtDate(d) {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }
  function dayDiff(a, b) {
    return Math.round((b - a) / 86400000);
  }

  function bindIddah() {
    var form = $("iddah-form");
    if (!form) return;
    if ($("iddah-start") && !$("iddah-start").value) {
      var t = new Date();
      var m = String(t.getMonth() + 1).padStart(2, "0");
      var d = String(t.getDate()).padStart(2, "0");
      $("iddah-start").value = t.getFullYear() + "-" + m + "-" + d;
    }
    function toggle() {
      var kind = $("iddah-kind").value;
      $("iddah-cycle-wrap").hidden = kind !== "divorce" || $("iddah-pregnant").checked;
    }
    form.addEventListener("input", function () { toggle(); iddahCompute(); });
    form.addEventListener("change", function () { toggle(); iddahCompute(); });
    toggle();
    iddahCompute();
  }

  /* ============================================================
     Ramadan makeup / fidya — 2:184–185
     ============================================================ */
  function ramadanCompute() {
    var missed = int($("ram-missed"));
    var fed = num($("ram-fidya"));
    var mode = $("ram-mode").value;
    var out = $("ram-out");
    if (mode === "makeup") {
      out.innerHTML =
        '<p class="calc-rule">Make up the same number of days later (2:184–185).</p>' +
        "<p>Missed: <b>" + missed + "</b> → fast <b>" + missed + "</b> day" +
        (missed === 1 ? "" : "s") + " after Ramadan.</p>";
    } else {
      out.innerHTML =
        '<p class="calc-rule">For those who can only fast with hardship: a ransom of feeding one indigent person per day (2:184).</p>' +
        "<p>Days: <b>" + missed + "</b> × feed one person<br>" +
        "If you set a local meal cost of <b>" + fmtMoney(fed) + "</b>, total fidya ≈ <b>" +
        fmtMoney(missed * fed) + "</b>.</p>" +
        '<p class="calc-disclaimer">The Qur\'an does not fix a currency amount — use a fair local feeding cost.</p>';
    }
  }

  function bindRamadan() {
    var form = $("ram-form");
    if (!form) return;
    form.addEventListener("input", ramadanCompute);
    form.addEventListener("change", ramadanCompute);
    ramadanCompute();
  }

  /* ============================================================
     Hajj / Umrah makeup fasts — 2:196
     ============================================================ */
  function hajjCompute() {
    var canOffer = $("hajj-offer").value === "yes";
    var out = $("hajj-out");
    if (canOffer) {
      out.innerHTML =
        '<p class="calc-rule">Offer a sacrifice such as you can afford (2:196).</p>' +
        "<p>No compensatory fasts are required when the offering is made.</p>";
      return;
    }
    out.innerHTML =
      '<p class="calc-rule">If you cannot afford the offering: fast <b>three days during Hajj</b> and <b>seven on your return</b> — <b>ten days in all</b> (2:196).</p>' +
      '<div class="calc-summary">' +
      "<div><b>3</b><span>during Hajj</span></div>" +
      "<div><b>7</b><span>after return</span></div>" +
      "<div><b>10</b><span>total days</span></div>" +
      "</div>" +
      '<p class="calc-disclaimer">This is for those whose household is not in the precincts of the Sacred Mosque (2:196).</p>';
  }

  function bindHajj() {
    var form = $("hajj-form");
    if (!form) return;
    form.addEventListener("change", hajjCompute);
    hajjCompute();
  }

  /* ============================================================
     Oath expiation — 5:89
     ============================================================ */
  function oathCompute() {
    var canFeed = $("oath-feed").checked;
    var canClothe = $("oath-clothe").checked;
    var canFree = $("oath-free").checked;
    var meal = num($("oath-meal"));
    var out = $("oath-out");
    var steps = [];
    if (canFeed || (!canClothe && !canFree)) {
      steps.push("Feed <b>ten</b> indigent persons on the average scale of your family food" +
        (meal ? " ≈ <b>" + fmtMoney(10 * meal) + "</b> if one meal costs " + fmtMoney(meal) : "") + ".");
    }
    if (canClothe) steps.push("Or <b>clothe</b> ten indigent persons.");
    if (canFree) steps.push("Or <b>free a slave</b>.");
    steps.push("If that is beyond your means: fast <b>three days</b>.");
    out.innerHTML =
      '<p class="calc-rule">Expiation for a deliberate broken oath (5:89), in order:</p>' +
      "<ol class=\"calc-steps\">" + steps.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ol>" +
      "<p>Keep your oaths. Allah makes His signs clear that you may be grateful.</p>";
  }

  function bindOath() {
    var form = $("oath-form");
    if (!form) return;
    form.addEventListener("input", oathCompute);
    form.addEventListener("change", oathCompute);
    oathCompute();
  }

  /* ============================================================
     Booty fifth — 8:41
     ============================================================ */
  function bootyCompute() {
    var total = num($("booty-total"));
    var fifth = total / 5;
    var rest = total - fifth;
    $("booty-out").innerHTML =
      '<p class="calc-rule">A fifth share is assigned to Allah, the Messenger, near relatives, orphans, the needy, and the wayfarer (8:41).</p>' +
      '<div class="calc-summary">' +
      "<div><b>" + fmtMoney(fifth) + "</b><span>one-fifth (20%)</span></div>" +
      "<div><b>" + fmtMoney(rest) + "</b><span>remaining four-fifths</span></div>" +
      "</div>" +
      '<p class="calc-disclaimer">How the fifth and the remainder are subdivided among persons is left to further guidance and jurisprudence.</p>';
  }

  function bindBooty() {
    var form = $("booty-form");
    if (!form) return;
    form.addEventListener("input", bootyCompute);
    bootyCompute();
  }

  bindInherit();
  bindIddah();
  bindRamadan();
  bindHajj();
  bindOath();
  bindBooty();
})();
