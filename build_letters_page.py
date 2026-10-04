# -*- coding: utf-8 -*-
"""Generate Al-Quran-Letters.html from LETTER_DATA / LETTER_KEYWORDS in Roots."""
import json
import re
from pathlib import Path

root = Path(r"c:\Users\Beaul\Websites\Al-Quran")
text = (root / "Al-Quran-Roots.html").read_text(encoding="utf-8")

def extract(name):
    m = re.search(r"var " + name + r" = (\[.*?\]);", text)
    if not m:
        raise SystemExit(f"{name} not found")
    return json.loads(m.group(1))

letters = extract("LETTER_DATA")
keywords = extract("LETTER_KEYWORDS")
kw_by = {k["letter"]: k for k in keywords}
letters_sorted = sorted(letters, key=lambda L: -L["occ"])
# Keep keyword list aligned with card order (for TTS data-i).
keywords_ordered = [kw_by[L["letter"]] for L in letters_sorted if L["letter"] in kw_by]

def esc(s):
    return (str(s)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;"))

nav_pills = []
cards = []
for i, L in enumerate(letters_sorted):
    kw = kw_by.get(L["letter"], {})
    lid = f"L{i}"
    nav_pills.append(
        f'<button type="button" class="alpha-btn" data-go="{lid}" title="{esc(L["theme"])}">'
        f'<span lang="ar" dir="rtl">{esc(L["letter"])}</span></button>'
    )
    clusters_html = []
    for c in L.get("clusters") or []:
        chips = "".join(
            f'<span class="chip"><b lang="ar" dir="rtl">{esc(r["r"])}</b> {esc(r["g"])} '
            f'<i>&times;{r["n"]:,}</i></span>'
            for r in c.get("roots") or []
        )
        clusters_html.append(
            f'<div class="cluster"><div class="clabel">{esc(c["label"])}'
            f'<u>{len(c.get("roots") or [])} roots · {c["occ"]:,}&times;</u></div>'
            f'<div class="chips">{chips}</div></div>'
        )
    if not clusters_html:
        clusters_html.append('<p class="empty-c">No sense clusters listed for this letter yet.</p>')

    if kw:
        kw_block = f'''
  <div class="keyword">
    <div class="kw-label">Quranic keyword</div>
    <div class="kw-main">
      <span class="kw-ar" lang="ar" dir="rtl">{esc(kw.get("keyword", ""))}</span>
      <span class="kw-en">{esc(kw.get("keywordEn", ""))}</span>
    </div>
    <div class="kw-meta">
      Root <b lang="ar" dir="rtl">{esc(kw.get("root", ""))}</b>
      · spoken <span lang="ar" dir="rtl">{esc(kw.get("spoken", ""))}</span>
      · &times;{kw.get("occ", 0):,}
    </div>
    <button type="button" class="speak" data-i="{i}">Hear letter · name · keyword</button>
  </div>'''
    else:
        kw_block = ""

    cards.append(f'''
<article class="letter-card" id="{lid}" data-letter="{esc(L["letter"])}" data-theme="{esc(L["theme"].lower())}" data-name="{esc(L["name"].lower())}">
  <header class="letter-head">
    <div class="glyph" lang="ar" dir="rtl">{esc(L["letter"])}</div>
    <div class="meta">
      <h2>{esc(L["name"])} <span class="ar-name" lang="ar" dir="rtl">{esc(kw.get("arName", ""))}</span></h2>
      <p class="theme">{esc(L["theme"])}</p>
      <div class="nums">
        <span><b>{L["n"]}</b> roots</span>
        <span><b>{L["occ"]:,}</b> occurrences</span>
        <span><b>{len(L.get("clusters") or [])}</b> sense clusters</span>
      </div>
    </div>
  </header>
  {kw_block}
  <h3>Sense clusters</h3>
  <p class="cluster-lead">Roots that begin with this letter, grouped by meaning in the Book.</p>
  <div class="clusters">{"".join(clusters_html)}</div>
</article>''')

root_entries = sum(L["n"] for L in letters)
root_occ = sum(L["occ"] for L in letters)
kw_json = json.dumps(keywords_ordered, ensure_ascii=False)

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Al-Quran — Letter Context</title>
<style>
:root {{
  --color-bg: lightyellow;
  --color-surah-title: purple;
  --color-verse-label: red;
  --color-arabic: green;
  --color-translation: blue;
  --color-rule: #d8d4a8;
  --color-panel: #fffdf0;
}}
* {{ box-sizing: border-box; }}
body {{
  background-color: var(--color-bg);
  color: #333;
  font-family: Georgia, "Times New Roman", serif;
  margin: 0 auto;
  max-width: 920px;
  padding: 24px 18px 64px;
}}
h1 {{
  color: var(--color-surah-title);
  margin: 0 0 4px;
  text-align: center;
}}
.subtitle {{
  color: var(--color-translation);
  margin: 0 0 20px;
  text-align: center;
}}
.subtitle a {{ color: var(--color-translation); }}
.note {{
  background: rgba(128, 0, 128, .05);
  border-left: 4px solid var(--color-surah-title);
  font-size: .9em;
  line-height: 1.55;
  margin: 0 0 22px;
  padding: 12px 16px;
}}
.note p {{ margin: 0 0 8px; }}
.note p:last-child {{ margin: 0; }}
.stats {{
  border-bottom: 2px solid var(--color-rule);
  border-top: 2px solid var(--color-rule);
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
  justify-content: center;
  margin-bottom: 18px;
  padding: 12px 0;
}}
.stats div {{ text-align: center; }}
.stats b {{
  color: var(--color-verse-label);
  display: block;
  font-size: 1.4em;
}}
.stats span {{ font-size: .82em; }}
.toolbar {{
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
}}
.toolbar input {{
  flex: 1;
  min-width: 180px;
  border: 2px solid var(--color-rule);
  border-radius: 4px;
  font-family: inherit;
  font-size: 1em;
  padding: 8px 12px;
  background: #fff;
}}
.toolbar input:focus {{
  border-color: var(--color-surah-title);
  outline: none;
}}
.voice-status {{
  color: #777;
  font-size: .82em;
  margin: 0 0 12px;
}}
.alpha {{
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 22px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-rule);
  position: sticky;
  top: 0;
  background: var(--color-bg);
  z-index: 5;
}}
.alpha-btn {{
  background: var(--color-panel);
  border: 1px solid var(--color-rule);
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  min-width: 2.2em;
  padding: 6px 8px;
  color: var(--color-arabic);
  font-size: 1.15em;
}}
.alpha-btn:hover {{
  border-color: var(--color-surah-title);
  color: var(--color-surah-title);
}}
.letter-card {{
  background: var(--color-panel);
  border: 1px solid var(--color-rule);
  border-radius: 10px;
  margin-bottom: 18px;
  padding: 18px 18px 16px;
  scroll-margin-top: 72px;
}}
.letter-card:hover {{ border-color: var(--color-surah-title); }}
.letter-card.flash {{ animation: flash 1s ease; }}
@keyframes flash {{
  0%, 100% {{ background: var(--color-panel); }}
  30% {{ background: rgba(128, 0, 128, .08); }}
}}
.letter-head {{
  display: grid;
  gap: 16px;
  grid-template-columns: auto 1fr;
  align-items: start;
  margin-bottom: 14px;
}}
.glyph {{
  color: var(--color-arabic);
  font-size: 3.2em;
  line-height: 1;
  min-width: 1.2em;
  text-align: center;
}}
.meta h2 {{
  color: var(--color-surah-title);
  font-size: 1.35em;
  margin: 0 0 4px;
}}
.ar-name {{
  color: var(--color-arabic);
  font-weight: normal;
  font-size: .9em;
  margin-left: 6px;
}}
.theme {{
  color: var(--color-translation);
  font-size: 1.05em;
  margin: 0 0 10px;
  font-weight: bold;
}}
.nums {{
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  font-size: .88em;
  color: #555;
}}
.nums b {{ color: var(--color-verse-label); }}
.keyword {{
  background: rgba(27, 94, 32, .05);
  border: 1px solid rgba(27, 94, 32, .18);
  border-radius: 8px;
  margin-bottom: 16px;
  padding: 12px 14px;
}}
.kw-label {{
  color: #777;
  font-size: .72em;
  letter-spacing: .06em;
  text-transform: uppercase;
  margin-bottom: 6px;
}}
.kw-main {{
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: baseline;
  margin-bottom: 6px;
}}
.kw-ar {{
  color: var(--color-arabic);
  font-size: 1.55em;
}}
.kw-en {{ color: var(--color-translation); }}
.kw-meta {{ font-size: .88em; color: #555; margin-bottom: 8px; }}
.speak {{
  background: transparent;
  border: 2px solid var(--color-arabic);
  border-radius: 4px;
  color: var(--color-arabic);
  cursor: pointer;
  font-family: inherit;
  font-size: .85em;
  padding: 5px 10px;
}}
.speak:hover {{ background: rgba(27, 94, 32, .08); }}
.speak.playing {{
  border-color: var(--color-surah-title);
  color: var(--color-surah-title);
}}
.letter-card h3 {{
  color: var(--color-surah-title);
  font-size: 1.05em;
  margin: 0 0 4px;
  border-bottom: 2px solid var(--color-rule);
  padding-bottom: 6px;
}}
.cluster-lead {{
  color: #777;
  font-size: .88em;
  margin: 0 0 12px;
}}
.cluster {{ margin-bottom: 12px; }}
.clabel {{
  color: var(--color-surah-title);
  font-weight: bold;
  font-size: .95em;
  margin-bottom: 6px;
}}
.clabel u {{
  text-decoration: none;
  color: #777;
  font-weight: normal;
  font-size: .85em;
  margin-left: 8px;
}}
.chips {{
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}}
.chip {{
  background: #fff;
  border: 1px solid var(--color-rule);
  border-radius: 6px;
  font-size: .86em;
  padding: 5px 9px;
}}
.chip b {{
  color: var(--color-arabic);
  margin-right: 4px;
}}
.chip i {{
  color: #888;
  font-style: normal;
  font-size: .9em;
}}
.empty-c {{ color: #777; font-style: italic; }}
.letter-card[hidden] {{ display: none; }}
@media (max-width: 560px) {{
  .letter-head {{ grid-template-columns: 1fr; }}
  .glyph {{ font-size: 2.6em; text-align: left; }}
}}
</style>
</head>
<body>

<h1>Letter Context</h1>
<p class="subtitle">
  What each Arabic letter gathers in the Qurʾan<br>
  <a href="Al-Quran-Study.html">study app</a> ·
  <a href="Al-Quran-Roots.html">roots &amp; letters</a> ·
  <a href="Al-Quran-Angels.html">angels</a> ·
  <a href="Al-Quran-People.html">believers</a> ·
  <a href="Al-Quran-Genealogy.html">genealogy &amp; places</a> ·
  <a href="Al-Quran.html">full text</a>
</p>

<div class="note">
  <p>Every Arabic root in the Book begins with a letter. Grouping those roots by
  first letter reveals a <b>theme</b> — a field of meaning that letter tends to
  open: God and humanity for ʾalif, mercy and lordship for rāʾ, speech for qāf,
  and so on.</p>
  <p>Below, each letter shows its theme, a signature Quranic keyword, and the
  <b>sense clusters</b> of roots that begin with it. Counts come from Quranic
  Arabic Corpus morphology. Order is by total root occurrences.</p>
</div>

<div class="stats">
  <div><b>28</b><span>letters</span></div>
  <div><b>{root_entries:,}</b><span>root entries</span></div>
  <div><b>{root_occ:,}</b><span>root occurrences</span></div>
</div>

<div class="toolbar">
  <input id="filter" type="search" placeholder="Filter by letter, name, or theme…" autocomplete="off">
</div>
<p class="voice-status" id="voice-status"></p>

<nav class="alpha" aria-label="Jump to letter">
{"".join(nav_pills)}
</nav>

<div id="letters">
{"".join(cards)}
</div>

<script>
window.LETTER_KEYWORDS = {kw_json};
</script>
<script>
(function () {{
  var filter = document.getElementById("filter");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".letter-card"));
  var status = document.getElementById("voice-status");
  var data = window.LETTER_KEYWORDS || [];
  var synth = window.speechSynthesis;
  var arabicVoice = null;
  var englishVoice = null;
  var run = 0;
  var held = null;

  function pickVoices() {{
    if (!synth) {{
      if (status) status.textContent = "This browser cannot speak audio.";
      return;
    }}
    var voices = synth.getVoices() || [];
    var ar = voices.filter(function (v) {{ return /^ar(-|$)/i.test(v.lang); }});
    arabicVoice = ar.filter(function (v) {{ return /SA|EG|AE|MA|DZ/i.test(v.lang); }})[0] || ar[0] || null;
    englishVoice = voices.filter(function (v) {{ return /^en(-|$)/i.test(v.lang); }})[0] || null;
    if (!status) return;
    status.textContent = arabicVoice
      ? "Voice: " + arabicVoice.name
      : "No Arabic voice found — playback may use another language.";
  }}
  if (synth) {{
    pickVoices();
    if (typeof synth.onvoiceschanged !== "undefined") synth.onvoiceschanged = pickVoices;
  }}

  function applyFilter() {{
    var q = (filter.value || "").trim().toLowerCase();
    cards.forEach(function (card) {{
      if (!q) {{ card.hidden = false; return; }}
      var hay = [
        card.dataset.letter || "",
        card.dataset.name || "",
        card.dataset.theme || "",
        card.textContent || ""
      ].join(" ").toLowerCase();
      card.hidden = hay.indexOf(q) === -1;
    }});
  }}
  filter.addEventListener("input", applyFilter);

  document.querySelector(".alpha").addEventListener("click", function (e) {{
    var btn = e.target.closest("[data-go]");
    if (!btn) return;
    var el = document.getElementById(btn.getAttribute("data-go"));
    if (!el || el.hidden) return;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
    el.scrollIntoView({{ behavior: "smooth", block: "start" }});
  }});

  function stop() {{
    run += 1;
    held = null;
    if (synth) synth.cancel();
    document.querySelectorAll(".speak.playing").forEach(function (b) {{
      b.classList.remove("playing");
    }});
  }}

  function utter(text, lang, rate, voice) {{
    var u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    if (voice) u.voice = voice;
    return u;
  }}

  function speakItem(index, btn) {{
    if (!synth || !data[index]) return;
    stop();
    var my = run;
    var item = data[index];
    btn.classList.add("playing");
    var steps = [
      utter(item.sound || item.letter, "ar-SA", 0.85, arabicVoice),
      utter(item.arName || "", "ar-SA", 0.9, arabicVoice),
      utter(item.spoken || item.keyword || "", "ar-SA", 0.85, arabicVoice),
      utter(item.keywordEn || item.theme || "", "en-US", 1, englishVoice)
    ].filter(function (u) {{ return u.text && u.text.trim(); }});

    function next(i) {{
      if (my !== run || i >= steps.length) {{
        btn.classList.remove("playing");
        return;
      }}
      held = steps[i];
      held.onend = function () {{ next(i + 1); }};
      held.onerror = function () {{ next(i + 1); }};
      synth.speak(held);
    }}
    next(0);
  }}

  document.getElementById("letters").addEventListener("click", function (e) {{
    var btn = e.target.closest(".speak");
    if (!btn) return;
    speakItem(+btn.getAttribute("data-i"), btn);
  }});
}})();
</script>
</body>
</html>
'''

out = root / "Al-Quran-Letters.html"
out.write_text(html, encoding="utf-8")
print("Wrote", out.name, out.stat().st_size, "bytes,", len(letters_sorted), "letters")

for name in ["_LETTER_DATA.json", "_LETTER_KEYWORDS.json"]:
    p = root / name
    if p.exists():
        p.unlink()
