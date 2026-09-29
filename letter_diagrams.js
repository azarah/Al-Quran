/* Letter-group diagrams for Al-Quran-Roots.html. Expects window.LETTER_DATA. */
(function () {
  var data = window.LETTER_DATA;
  var prophets = window.PROPHET_DATA || [];
  var allNames = window.NAME_DATA || [];
  var asma = window.ASMA_DATA || [];
  if (!data || !data.length) return;

  var svg = document.getElementById("diagram");
  var wrap = document.getElementById("diagram-wrap");
  var tip = document.getElementById("diagram-tip");
  var caption = document.getElementById("diagram-caption");
  var picker = document.getElementById("diagram-letter");
  var detail = document.getElementById("diagram-detail");
  if (!svg || !wrap) return;

  var NS = "http://www.w3.org/2000/svg";
  var view = "treemap";
  var selected = data[0].letter;
  var sunburstZoom = null;
  var prophetOverview = true;
  var palette = data.map(function (_, i) {
    return "hsl(" + ((i * 137.508) % 360) + ", 42%, 40%)";
  });
  var colorOf = {};
  data.forEach(function (d, i) { colorOf[d.letter] = palette[i]; });

  var allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "All letters — overview";
  picker.appendChild(allOpt);
  data.forEach(function (d) {
    var opt = document.createElement("option");
    opt.value = d.letter;
    opt.textContent = d.letter + "  —  " + d.theme;
    picker.appendChild(opt);
  });
  picker.value = selected;

  var CAPTIONS = {
    treemap: "Each rectangle is a first letter. Size is how often those roots occur. Click a tile to inspect its theme.",
    sunburst: "Inner ring: letters. Outer ring: sense clusters. Click a letter to zoom into its clusters and roots; click the centre to zoom out.",
    bubbles: "Circle size is how often the letter's roots occur. Click a bubble to inspect its theme.",
    wheel: "The selected letter sits at the centre. Petals are its sense clusters, sized by frequency. Click a petal to list its roots.",
    prophets: "Theme wheel plus prophets, including Dhul-Qarnayn. A solid line is a name that begins with that letter; a dashed line is a name the corpus tags with a root from that group. Click a letter to open its wheel, or the centre to return to every letter.",
    names: "Theme wheel plus every proper name the corpus marks, and Dhul-Qarnayn. Same link rule as Prophets. Click a letter to open its wheel; hover a name for its English form and count.",
    asma: "Theme wheel plus the traditional 99 Beautiful Names of Allah. Solid lines follow the first letter of the name; dashed lines follow the name's Arabic root. Counts are lemma tallies where the morphology tags that form. Click a letter to focus; click the centre to return."
  };

  function isRingView() {
    return view === "prophets" || view === "names" || view === "asma";
  }
  function ringItems() {
    if (view === "names") return allNames;
    if (view === "asma") return asma;
    return prophets;
  }
  function ringNoun() {
    if (view === "prophets") return "prophet";
    return "name";
  }
  function ringNouns() {
    if (view === "prophets") return "prophets";
    if (view === "asma") return "Beautiful Names";
    return "names";
  }
  function ringTitle() {
    if (view === "names") return "All names";
    if (view === "asma") return "99 Beautiful Names";
    return "Named prophets";
  }
  function ringTitleFocused() {
    if (view === "names") return "Names linked to this letter";
    if (view === "asma") return "Beautiful Names linked to this letter";
    return "Prophets linked to this letter";
  }
  function ringEmpty() {
    if (view === "names") return "No names link to this letter";
    if (view === "asma") return "No Beautiful Name links to this letter";
    return "No named prophet links to this letter";
  }

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    return n;
  }

  function clear() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  function size() {
    var w = Math.max(320, wrap.clientWidth);
    var tall = isRingView();
    var asmaTall = view === "asma";
    var h = Math.max(asmaTall ? 640 : 360,
      Math.min(asmaTall ? 820 : tall ? 680 : 560,
        Math.round(w * (asmaTall ? 1.05 : tall ? 0.78 : 0.62))));
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    return { w: w, h: h };
  }

  function showTip(evt, html) {
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

  function hideTip() { tip.hidden = true; }

  function byLetter(letter) {
    return data.filter(function (d) { return d.letter === letter; })[0];
  }

  function fmt(n) { return n.toLocaleString(); }

  function selectLetter(letter, keepView) {
    selected = letter;
    picker.value = letter;
    if (letter) prophetOverview = false;
    renderDetail();
    if (!keepView) draw();
    else highlight();
  }

  function prophetsFor(letter) {
    return ringItems().filter(function (p) {
      return p.links.some(function (L) { return L.letter === letter; });
    });
  }

  function nameLetterOf(p) {
    var named = p.links.filter(function (L) { return L.how.indexOf("name") !== -1; })[0];
    return named ? named.letter : p.links[0].letter;
  }

  function howLabel(how) {
    if (how.indexOf("name") !== -1 && how.indexOf("root") !== -1) return "name and root";
    if (how.indexOf("root") !== -1) return "name-root";
    return "name";
  }

  function highlight() {
    svg.querySelectorAll("[data-letter]").forEach(function (n) {
      n.setAttribute("data-on", n.getAttribute("data-letter") === selected ? "1" : "0");
    });
  }

  function renderDetail() {
    var d = byLetter(selected);
    if (!d || !detail) return;
    var clusters = d.clusters.map(function (c) {
      var roots = c.roots.map(function (r) {
        return '<span class="chip"><b lang="ar" dir="rtl">' + r.r + "</b> " +
          escapeHtml(r.g) + " <i>&times;" + fmt(r.n) + "</i></span>";
      }).join("");
      return '<div class="cluster"><div class="clabel">' + escapeHtml(c.label) +
        "<u>" + c.roots.length + (c.roots.length === 1 ? " root" : " roots") +
        " · " + fmt(c.occ) + "&times;</u></div><div class=\"chips\">" + roots + "</div></div>";
    }).join("");
    var prophetBlock = "";
    if (isRingView()) {
      var list = prophetOverview ? ringItems() : prophetsFor(selected);
      var chips = list.map(function (p) {
        var via = p.links.map(function (L) {
          return L.letter + " " + escapeHtml(L.theme) + " (" + howLabel(L.how) + ")";
        }).join("; ");
        var countBit = p.occ ? " <i>&times;" + fmt(p.occ) + "</i>" : "";
        return '<span class="chip"><b lang="ar" dir="rtl">' + p.ar + "</b> " +
          escapeHtml(p.en) + countBit + "<br><u>" +
          via + "</u></span>";
      }).join("");
      prophetBlock = '<div class="cluster"><div class="clabel">' +
        (prophetOverview ? ringTitle() : ringTitleFocused()) +
        "<u>" + list.length + "</u></div><div class=\"chips\">" +
        (chips || "<span class=\"chip\">" + ringEmpty() + "</span>") +
        "</div></div>";
    }
    if (isRingView() && prophetOverview) {
      detail.innerHTML =
        '<div class="diagram-picked"><div><b class="theme">' +
        ringTitle() + "</b>" +
        "<div>Linked to letter groups by the first letter of the name, or by the " +
        "name's root</div></div></div>" + prophetBlock;
      return;
    }
    detail.innerHTML =
      '<div class="diagram-picked">' +
        '<span class="letter" lang="ar" dir="rtl">' + d.letter + "</span>" +
        '<div><b class="theme">' + escapeHtml(d.theme) + "</b>" +
        "<div>" + escapeHtml(d.name) + " · " + d.n + " roots · " + fmt(d.occ) +
        " occurrences</div></div></div>" + clusters + prophetBlock;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function bindHover(node, html, letter, onClick) {
    if (letter) node.setAttribute("data-letter", letter);
    node.addEventListener("mousemove", function (e) { showTip(e, html); });
    node.addEventListener("mouseleave", hideTip);
    node.addEventListener("click", function (e) {
      e.stopPropagation();
      if (onClick) onClick();
      else if (letter) selectLetter(letter);
    });
    node.style.cursor = "pointer";
  }

  function letterTip(d) {
    return "<b lang=\"ar\" dir=\"rtl\">" + d.letter + "</b> " + escapeHtml(d.name) +
      "<br><i>" + escapeHtml(d.theme) + "</i><br>" +
      d.n + " roots · " + fmt(d.occ) + " occurrences";
  }

  function clusterTip(d, c) {
    return "<b>" + escapeHtml(c.label) + "</b><br>" +
      "under <b lang=\"ar\" dir=\"rtl\">" + d.letter + "</b> — " + escapeHtml(d.theme) +
      "<br>" + c.roots.length + " roots · " + fmt(c.occ) + " occurrences";
  }

  /* ---------- Treemap: recursive binary split ---------- */
  function layoutTreemap(items, x, y, w, h) {
    if (!items.length) return [];
    if (items.length === 1) return [{ item: items[0], x: x, y: y, w: w, h: h }];
    var total = 0;
    items.forEach(function (it) { total += it.occ; });
    var acc = 0, cut = 1;
    for (var i = 0; i < items.length; i++) {
      acc += items[i].occ;
      if (acc >= total / 2) { cut = Math.max(1, i); break; }
    }
    if (cut >= items.length) cut = items.length - 1;
    var a = items.slice(0, cut), b = items.slice(cut);
    var sa = 0;
    a.forEach(function (it) { sa += it.occ; });
    if (w >= h) {
      var w1 = w * sa / total;
      return layoutTreemap(a, x, y, w1, h).concat(layoutTreemap(b, x + w1, y, w - w1, h));
    }
    var h1 = h * sa / total;
    return layoutTreemap(a, x, y, w, h1).concat(layoutTreemap(b, x, y + h1, w, h - h1));
  }

  function drawTreemap(box) {
    var pad = 8;
    var cells = layoutTreemap(data.slice(), pad, pad, box.w - pad * 2, box.h - pad * 2);
    cells.forEach(function (c) {
      var g = el("g");
      var rect = el("rect", {
        x: c.x + 1, y: c.y + 1, width: Math.max(0, c.w - 2), height: Math.max(0, c.h - 2),
        fill: colorOf[c.item.letter], rx: 3, ry: 3, "fill-opacity": "0.88"
      });
      g.appendChild(rect);
      if (c.w > 44 && c.h > 36) {
        var fs = c.h > 70 && c.w > 90 ? 28 : 18;
        g.appendChild(el("text", {
          x: c.x + c.w / 2, y: c.y + c.h / 2 - (c.h > 52 ? 6 : 0),
          "text-anchor": "middle", "dominant-baseline": "middle",
          fill: "#fff", "font-size": fs, "font-family": "Georgia, serif",
          text: c.item.letter
        }));
        if (c.w > 88 && c.h > 64) {
          g.appendChild(el("text", {
            x: c.x + c.w / 2, y: c.y + c.h / 2 + 18,
            "text-anchor": "middle", fill: "#fff", "fill-opacity": "0.92",
            "font-size": 11, "font-family": "Georgia, serif",
            text: c.item.theme
          }));
        }
      }
      bindHover(g, letterTip(c.item), c.item.letter);
      svg.appendChild(g);
    });
  }

  /* ---------- Sunburst ---------- */
  function arcPath(cx, cy, r0, r1, a0, a1) {
    if (a1 - a0 < 0.0001) a1 = a0 + 0.0001;
    var large = a1 - a0 > Math.PI ? 1 : 0;
    function pt(r, a) { return (cx + r * Math.cos(a)) + "," + (cy + r * Math.sin(a)); }
    return "M" + pt(r1, a0) +
      " A" + r1 + "," + r1 + " 0 " + large + " 1 " + pt(r1, a1) +
      " L" + pt(r0, a1) +
      " A" + r0 + "," + r0 + " 0 " + large + " 0 " + pt(r0, a0) + " Z";
  }

  function drawSunburst(box) {
    var cx = box.w / 2, cy = box.h / 2;
    var R = Math.min(box.w, box.h) / 2 - 10;
    var innerHole = R * 0.22;
    var mid = R * 0.58;

    function ring(items, r0, r1, start, span, colorFn, tipFn, clickFn, labelFn) {
      var total = 0;
      items.forEach(function (it) { total += it.occ; });
      if (!total) return;
      var a = start;
      items.forEach(function (it, i) {
        var slice = span * it.occ / total;
        var path = el("path", {
          d: arcPath(cx, cy, r0, r1, a, a + slice),
          fill: colorFn(it, i),
          stroke: "lightyellow",
          "stroke-width": 1,
          "fill-opacity": "0.9"
        });
        var g = el("g");
        g.appendChild(path);
        if (labelFn && slice > 0.22 && (r1 - r0) > 28) {
          var midA = a + slice / 2;
          var rr = (r0 + r1) / 2;
          g.appendChild(el("text", {
            x: cx + rr * Math.cos(midA),
            y: cy + rr * Math.sin(midA),
            "text-anchor": "middle",
            "dominant-baseline": "middle",
            fill: "#fff",
            "font-size": 13,
            "font-family": "Georgia, serif",
            text: labelFn(it)
          }));
        }
        bindHover(g, tipFn(it), it.letter, clickFn ? function () { clickFn(it); } : null);
        svg.appendChild(g);
        a += slice;
      });
    }

    var start = -Math.PI / 2;
    var span = Math.PI * 2;

    if (!sunburstZoom) {
      ring(data, innerHole, mid, start, span,
        function (d) { return colorOf[d.letter]; },
        letterTip,
        function (d) { sunburstZoom = d.letter; selectLetter(d.letter, true); draw(); },
        function (d) { return d.letter; });
      var allOcc = 0;
      data.forEach(function (x) { allOcc += x.occ; });
      var a0 = start;
      data.forEach(function (d) {
        var s = span * d.occ / allOcc;
        if (d.clusters.length) {
          ring(d.clusters, mid, R, a0, s,
            function (c, i) {
              return "hsl(" + (parseHue(colorOf[d.letter]) + i * 10) + ", 48%, " +
                (48 + i * 5) + "%)";
            },
            function (c) { return clusterTip(d, c); },
            function () { sunburstZoom = d.letter; selectLetter(d.letter, true); draw(); },
            null);
        }
        a0 += s;
      });
    } else {
      var d = byLetter(sunburstZoom);
      ring(d.clusters, innerHole, mid, start, span,
        function (c, i) {
          return "hsl(" + (parseHue(colorOf[d.letter]) + i * 14) + ", 48%, 44%)";
        },
        function (c) { return clusterTip(d, c); },
        null,
        function (c) { return c.label.split(" ")[0]; });
      d.clusters.forEach(function (c) {
        var cTot = 0;
        d.clusters.forEach(function (x) { cTot += x.occ; });
        var a0 = start;
        d.clusters.forEach(function (x) {
          var s = span * x.occ / cTot;
          if (x === c && c.roots.length) {
            ring(c.roots.map(function (r) {
              return { letter: d.letter, occ: r.n, r: r };
            }), mid, R, a0, s,
              function (_, i) {
                return "hsl(" + (parseHue(colorOf[d.letter]) + i * 10) + ", 40%, 56%)";
              },
              function (it) {
                return "<b lang=\"ar\" dir=\"rtl\">" + it.r.r + "</b> " +
                  escapeHtml(it.r.g) + "<br>" + fmt(it.r.n) + " occurrences";
              },
              null,
              function (it) { return it.r.r; });
          }
          a0 += s;
        });
      });
    }

    var hub = el("circle", {
      cx: cx, cy: cy, r: innerHole - 2,
      fill: "lightyellow", stroke: "#d8d4a8", "stroke-width": 2
    });
    var hubText = el("text", {
      x: cx, y: cy + 5,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      fill: "#6b2d8a",
      "font-size": sunburstZoom ? 26 : 12,
      "font-family": "Georgia, serif",
      text: sunburstZoom || "letters"
    });
    var hubG = el("g");
    hubG.appendChild(hub);
    hubG.appendChild(hubText);
    bindHover(hubG,
      sunburstZoom ? "Click to show every letter" : "All 28 letters",
      null,
      function () {
        if (sunburstZoom) { sunburstZoom = null; draw(); }
      });
    svg.appendChild(hubG);
  }

  function parseHue(hsl) {
    var m = /hsl\(([0-9.]+)/.exec(hsl);
    return m ? parseFloat(m[1]) : 0;
  }

  /* ---------- Bubbles ---------- */
  function drawBubbles(box) {
    var cx = box.w / 2, cy = box.h / 2;
    var maxR = Math.min(box.w, box.h) / 2 - 8;
    var maxV = data[0].occ;
    var placed = data.map(function (it, i) {
      var r = 10 + Math.sqrt(it.occ / maxV) * (maxR * 0.26);
      var t = i * 2.399963229728653;
      var rad = i === 0 ? 0 : 18 + Math.sqrt(i) * (maxR * 0.155);
      return { it: it, x: cx + rad * Math.cos(t), y: cy + rad * Math.sin(t), r: r };
    });
    var k, i, j;
    for (k = 0; k < 50; k++) {
      for (i = 0; i < placed.length; i++) {
        for (j = i + 1; j < placed.length; j++) {
          var dx = placed[j].x - placed[i].x;
          var dy = placed[j].y - placed[i].y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          var min = placed[i].r + placed[j].r + 3;
          if (dist < min) {
            var push = (min - dist) / 2;
            placed[i].x -= dx / dist * push;
            placed[i].y -= dy / dist * push;
            placed[j].x += dx / dist * push;
            placed[j].y += dy / dist * push;
          }
        }
      }
      placed.forEach(function (p) {
        p.x += (cx - p.x) * 0.02;
        p.y += (cy - p.y) * 0.02;
        p.x = Math.min(box.w - p.r - 4, Math.max(p.r + 4, p.x));
        p.y = Math.min(box.h - p.r - 4, Math.max(p.r + 4, p.y));
      });
    }
    placed.forEach(function (p) {
      var g = el("g");
      g.appendChild(el("circle", {
        cx: p.x, cy: p.y, r: p.r,
        fill: colorOf[p.it.letter],
        "fill-opacity": "0.9",
        stroke: "rgba(255,255,255,0.35)"
      }));
      if (p.r > 14) {
        g.appendChild(el("text", {
          x: p.x, y: p.y + 1,
          "text-anchor": "middle",
          "dominant-baseline": "middle",
          fill: "#fff",
          "font-size": p.r > 28 ? 22 : 14,
          "font-family": "Georgia, serif",
          text: p.it.letter
        }));
      }
      bindHover(g, letterTip(p.it), p.it.letter);
      svg.appendChild(g);
    });
  }

  /* ---------- Theme wheel ---------- */
  function drawWheel(box, rim) {
    var d = byLetter(selected);
    var cx = box.w / 2, cy = box.h / 2;
    var R = Math.min(box.w, box.h) / 2 - 16 - (rim || 0);
    var inner = R * 0.32;
    var clusters = d.clusters;
    var total = 0;
    clusters.forEach(function (c) { total += c.occ; });
    var a = -Math.PI / 2;
    clusters.forEach(function (c, i) {
      var slice = total ? (Math.PI * 2 * c.occ / total) : (Math.PI * 2 / clusters.length);
      var g = el("g");
      g.appendChild(el("path", {
        d: arcPath(cx, cy, inner + 6, R, a, a + slice),
        fill: "hsl(" + (parseHue(colorOf[d.letter]) + i * 16) + ", 48%, 44%)",
        stroke: "lightyellow",
        "stroke-width": 2,
        "fill-opacity": "0.92"
      }));
      if (slice > 0.35) {
        var midA = a + slice / 2;
        var rr = (inner + 6 + R) / 2;
        var words = c.label.split(" ");
        words.forEach(function (w, wi) {
          g.appendChild(el("text", {
            x: cx + rr * Math.cos(midA),
            y: cy + rr * Math.sin(midA) + (wi - (words.length - 1) / 2) * 13,
            "text-anchor": "middle",
            fill: "#fff",
            "font-size": 12,
            "font-family": "Georgia, serif",
            text: w
          }));
        });
      }
      bindHover(g, clusterTip(d, c), d.letter, function () {
        selectLetter(d.letter, true);
        detail.scrollIntoView({ block: "nearest" });
      });
      svg.appendChild(g);
      a += slice;
    });
    svg.appendChild(el("circle", {
      cx: cx, cy: cy, r: inner,
      fill: colorOf[d.letter],
      stroke: "#fff",
      "stroke-width": 3
    }));
    svg.appendChild(el("text", {
      x: cx, y: cy - 8,
      "text-anchor": "middle",
      fill: "#fff",
      "font-size": 36,
      "font-family": "Georgia, serif",
      text: d.letter
    }));
    svg.appendChild(el("text", {
      x: cx, y: cy + 20,
      "text-anchor": "middle",
      fill: "#fff",
      "font-size": 11,
      "font-family": "Georgia, serif",
      text: d.theme
    }));
  }

  function prophetTip(p) {
    var via = p.links.map(function (L) {
      return L.letter + " — " + escapeHtml(L.theme) + " (" + howLabel(L.how) +
        (L.root ? ", " + L.root : "") + ")";
    }).join("<br>");
    var countLine = p.occ ? ("<br>" + fmt(p.occ) + " mentions") : "<br>not tagged as this lemma";
    return "<b lang=\"ar\" dir=\"rtl\">" + p.ar + "</b> " + escapeHtml(p.en) +
      countLine + "<br>" + via;
  }

  function drawProphetOverview(box) {
    var items = ringItems();
    var dense = items.length > 40;
    var cx = box.w / 2, cy = box.h / 2;
    var R_out = Math.min(box.w, box.h) / 2 - (dense ? 48 : 58);
    var R_in = R_out * (dense ? 0.34 : 0.40);
    var letterSet = {};
    items.forEach(function (p) {
      p.links.forEach(function (L) { letterSet[L.letter] = true; });
    });
    var letters = data.filter(function (d) { return letterSet[d.letter]; });
    var lpos = {};
    letters.forEach(function (d, i) {
      var a = -Math.PI / 2 + i * Math.PI * 2 / letters.length;
      lpos[d.letter] = { x: cx + R_in * Math.cos(a), y: cy + R_in * Math.sin(a), d: d };
    });
    var ordered = items.slice().sort(function (a, b) {
      var la = nameLetterOf(a), lb = nameLetterOf(b);
      if (la === lb) return a.en.localeCompare(b.en);
      return (data.findIndex(function (d) { return d.letter === la; }) -
        data.findIndex(function (d) { return d.letter === lb; }));
    });
    var ppos = {};
    ordered.forEach(function (p, i) {
      var a = -Math.PI / 2 + i * Math.PI * 2 / ordered.length;
      ppos[p.en + "|" + p.ar] = { x: cx + R_out * Math.cos(a), y: cy + R_out * Math.sin(a), a: a, p: p };
    });

    ordered.forEach(function (p) {
      p.links.forEach(function (L) {
        var a = lpos[L.letter], b = ppos[p.en + "|" + p.ar];
        if (!a || !b) return;
        var dashed = L.how.indexOf("name") === -1;
        svg.appendChild(el("path", {
          d: "M" + a.x + "," + a.y + " Q" + cx + "," + cy + " " + b.x + "," + b.y,
          fill: "none",
          stroke: colorOf[L.letter],
          "stroke-width": dashed ? 1.4 : 2,
          "stroke-opacity": dashed ? 0.4 : 0.55,
          "stroke-dasharray": dashed ? "5 4" : "none"
        }));
      });
    });

    letters.forEach(function (d) {
      var pt = lpos[d.letter];
      var g = el("g");
      g.appendChild(el("circle", {
        cx: pt.x, cy: pt.y, r: 18,
        fill: colorOf[d.letter],
        stroke: "#fff",
        "stroke-width": 2
      }));
      g.appendChild(el("text", {
        x: pt.x, y: pt.y + 1,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        fill: "#fff",
        "font-size": 16,
        "font-family": "Georgia, serif",
        text: d.letter
      }));
      bindHover(g, letterTip(d) + "<br>" + prophetsFor(d.letter).length + " " +
        ringNoun() + " links",
        d.letter,
        function () { prophetOverview = false; selectLetter(d.letter); });
      svg.appendChild(g);
    });

    ordered.forEach(function (p) {
      var pt = ppos[p.en + "|" + p.ar];
      var g = el("g");
      g.appendChild(el("text", {
        x: pt.x, y: dense ? pt.y : pt.y - 7,
        "text-anchor": "middle",
        fill: "#4a2a6a",
        "font-size": dense ? 9 : 13,
        "font-family": "Georgia, serif",
        text: p.ar
      }));
      if (!dense) {
        g.appendChild(el("text", {
          x: pt.x, y: pt.y + 8,
          "text-anchor": "middle",
          fill: "#1565c0",
          "font-size": 10,
          "font-family": "Georgia, serif",
          text: p.en
        }));
      }
      bindHover(g, prophetTip(p), nameLetterOf(p), function () {
        prophetOverview = false;
        selectLetter(nameLetterOf(p));
      });
      svg.appendChild(g);
    });

    var hub = el("g");
    hub.appendChild(el("circle", {
      cx: cx, cy: cy, r: 36,
      fill: "#6b2d8a",
      stroke: "#fff",
      "stroke-width": 3
    }));
    hub.appendChild(el("text", {
      x: cx, y: cy + 4,
      "text-anchor": "middle",
      fill: "#fff",
      "font-size": view === "asma" ? 10 : 11,
      "font-family": "Georgia, serif",
      text: view === "asma" ? "99 names" : "themes"
    }));
    svg.appendChild(hub);
  }

  function drawProphetWheel(box) {
    var rim = 52;
    drawWheel(box, rim);
    var list = prophetsFor(selected);
    if (!list.length) return;
    var cx = box.w / 2, cy = box.h / 2;
    var outer = Math.min(box.w, box.h) / 2 - 22;
    list.forEach(function (p, i) {
      var a = -Math.PI / 2 + i * Math.PI * 2 / list.length;
      var x = cx + outer * Math.cos(a);
      var y = cy + outer * Math.sin(a);
      var link = p.links.filter(function (L) { return L.letter === selected; })[0];
      var dashed = link && link.how.indexOf("name") === -1;
      svg.appendChild(el("path", {
        d: "M" + cx + "," + cy + " L" + x + "," + y,
        fill: "none",
        stroke: "#6b2d8a",
        "stroke-width": 1.5,
        "stroke-opacity": 0.45,
        "stroke-dasharray": dashed ? "5 4" : "none"
      }));
      var g = el("g");
      var tight = list.length > 16;
      g.appendChild(el("circle", {
        cx: x, cy: y, r: tight ? 5 : 16,
        fill: "#fff",
        stroke: colorOf[selected],
        "stroke-width": 2
      }));
      g.appendChild(el("text", {
        x: x, y: y - (tight ? 10 : 22),
        "text-anchor": "middle",
        fill: "#4a2a6a",
        "font-size": tight ? 9 : 12,
        "font-family": "Georgia, serif",
        text: p.ar
      }));
      if (!tight) {
        g.appendChild(el("text", {
          x: x, y: y + 28,
          "text-anchor": "middle",
          fill: "#1565c0",
          "font-size": 10,
          "font-family": "Georgia, serif",
          text: p.en
        }));
      }
      bindHover(g, prophetTip(p), selected);
      svg.appendChild(g);
    });
    var hub = svg.querySelector("circle");
    if (hub) {
      hub.style.cursor = "pointer";
      hub.addEventListener("click", function (e) {
        e.stopPropagation();
        prophetOverview = true;
        picker.value = "";
        renderDetail();
        draw();
      });
    }
  }

  function draw() {
    clear();
    hideTip();
    caption.textContent = CAPTIONS[view];
    var box = size();
    if (view === "treemap") drawTreemap(box);
    else if (view === "sunburst") drawSunburst(box);
    else if (view === "bubbles") drawBubbles(box);
    else if (isRingView()) {
      if (prophetOverview) drawProphetOverview(box);
      else drawProphetWheel(box);
    } else drawWheel(box);
    highlight();
    wrap.setAttribute("data-view", view);
    document.querySelectorAll("[data-view]").forEach(function (btn) {
      if (!btn.hasAttribute("data-view") || btn.tagName !== "BUTTON") return;
      btn.setAttribute("aria-pressed", btn.getAttribute("data-view") === view ? "true" : "false");
    });
    picker.parentElement.hidden = view !== "wheel" && !isRingView();
    if (isRingView() && prophetOverview) picker.value = "";
    else if (!isRingView() && !picker.value) picker.value = selected;
  }

  document.querySelector(".diagram-views").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-view]");
    if (!btn) return;
    view = btn.getAttribute("data-view");
    if (view !== "sunburst") sunburstZoom = null;
    if (isRingView()) prophetOverview = true;
    draw();
    renderDetail();
  });

  picker.addEventListener("change", function () {
    if (isRingView() && !picker.value) {
      prophetOverview = true;
      renderDetail();
      draw();
      return;
    }
    selectLetter(picker.value);
  });

  window.addEventListener("resize", function () {
    draw();
  });

  renderDetail();
  draw();
})();
