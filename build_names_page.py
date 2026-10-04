# -*- coding: utf-8 -*-
"""Build Al-Quran-Names.html — Beautiful Names of Allah linked to Al-Quran.txt."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TXT = ROOT / "Al-Quran.txt"
ROOTS_HTML = ROOT / "Al-Quran-Roots.html"
OUT = ROOT / "Al-Quran-Names.html"

HARAKAT = re.compile(r"[\u064B-\u065F\u0670\u0640]")
VERSE_RE = re.compile(r"^\[(\d+):(\d+)\]$")

# Yusuf Ali English cues (supplement Arabic form matching)
EN_CUES: dict[str, list[str]] = {
    "The Most Merciful": [r"Most Gracious"],
    "The Especially Merciful": [r"Most Merciful"],
    "The King": [r"\bthe King\b", r"King of the Day"],
    "The Most Holy": [r"\bHoly One\b", r"\bthe Holy\b"],
    "The Source of Peace": [r"\bSource of Peace\b", r"\bthe Peace\b"],
    "The Guardian of Faith": [r"Guardian of Faith", r"Preserver of Safety"],
    "The Protector": [r"\bProtector\b", r"\bGuardian\b"],
    "The Almighty": [r"Exalted in Might", r"\bAlmighty\b"],
    "The Compeller": [r"\bCompeller\b", r"\bIrresistible\b"],
    "The Supreme": [r"\bSupreme\b", r"\bProud\b"],
    "The Creator": [r"\bthe Creator\b"],
    "The Originator": [r"\bEvolver\b", r"\bOriginator\b"],
    "The Fashioner": [r"\bBestower of Forms\b", r"\bFashioner\b"],
    "The Perpetual Forgiver": [r"Oft-Forgiving", r"\bForgiving\b"],
    "The Subduer": [r"\bIrresistible\b", r"\bDominant\b"],
    "The Bestower": [r"\bBestower\b", r"\bGrantor\b"],
    "The Provider": [r"\bProvider\b", r"\bSustainer\b"],
    "The Opener": [r"\bOpener\b", r"\bJudge\b"],
    "The All-Knowing": [r"All-Knowing", r"\bfull of knowledge\b"],
    "The All-Hearing": [r"All-Hearing", r"One Who hears"],
    "The All-Seeing": [r"All-Seeing", r"One Who sees"],
    "The Judge": [r"\bthe Judge\b"],
    "The Just": [r"\bthe Just\b"],
    "The Subtle": [r"\bSubtle\b", r"\bGracious\b"],
    "The All-Aware": [r"well acquainted", r"All-Aware"],
    "The Forbearing": [r"\bForbearing\b", r"\bClement\b"],
    "The Magnificent": [r"\bSupreme\b", r"\bMagnificent\b", r"\bMost Great\b"],
    "The Forgiving": [r"Oft-Forgiving", r"\bForgiving\b"],
    "The Appreciative": [r"\bAppreciative\b", r"\bResponsive\b"],
    "The Most High": [r"Most High", r"\bExalted\b"],
    "The Greatest": [r"\bthe Great\b", r"\bGreatest\b"],
    "The Preserver": [r"\bPreserver\b", r"\bGuardian\b"],
    "The Sustainer": [r"\bSustainer\b"],
    "The Reckoner": [r"\bReckoner\b", r"sufficient as a reckoner"],
    "The Generous": [r"\bGenerous\b", r"\bBountiful\b"],
    "The Watchful": [r"\bWatchful\b"],
    "The Responsive": [r"\bResponsive\b", r"answers prayer"],
    "The Vast": [r"\bAmple\b", r"\bVast\b"],
    "The Wise": [r"\bthe Wise\b", r"full of Wisdom"],
    "The Loving": [r"\bLoving\b", r"full of loving kindness"],
    "The Glorious": [r"\bGlorious\b"],
    "The Witness": [r"\bWitness\b"],
    "The Truth": [r"\bthe Truth\b"],
    "The Trustee": [r"\bDisposer of affairs\b", r"\bTrustee\b"],
    "The Strong": [r"\bthe Strong\b"],
    "The Firm": [r"\bthe Firm\b", r"\bSteadfast\b"],
    "The Protecting Friend": [r"Protecting Friend", r"\bPatron\b"],
    "The Praiseworthy": [r"\bPraiseworthy\b", r"Worthy of all Praise"],
    "The Ever-Living": [r"\bthe Living\b", r"Ever-Living"],
    "The Self-Subsisting": [r"Self-subsisting", r"Self-Subsisting", r"Eternal"],
    "The One": [r"\bthe One\b"],
    "The Unique": [r"\bthe One\b", r"\bUnique\b"],
    "The Eternal Refuge": [r"Eternal", r"\bAbsolute\b"],
    "The Able": [r"\bAble\b", r"\bPowerful\b"],
    "The Powerful": [r"\bPowerful\b", r"able to do all things"],
    "The First": [r"\bthe First\b"],
    "The Last": [r"\bthe Last\b"],
    "The Manifest": [r"\bthe Evident\b", r"\bManifest\b"],
    "The Hidden": [r"\bthe Hidden\b", r"\bImminent\b"],
    "The Most Exalted": [r"Most High", r"\bExalted\b"],
    "The Kind": [r"\bthe Benign\b", r"\bthe Kind\b"],
    "The Acceptor of Repentance": [r"Oft-Returning", r"accepts repentance"],
    "The Avenger": [r"\bAvenger\b"],
    "The Pardoner": [r"\bPardoner\b", r"\bready to forgive\b"],
    "The Compassionate": [r"\bfull of kindness\b", r"\bCompassionate\b"],
    "Owner of Sovereignty": [r"Lord of Power", r"Owner of Sovereignty", r"King of kings"],
    "Lord of Majesty and Honour": [r"Lord of Majesty", r"Bounty and Honour"],
    "The Equitable": [r"\bEquitable\b"],
    "The Gatherer": [r"\bGatherer\b"],
    "The Self-Sufficient": [r"\bFree of all wants\b", r"Self-Sufficient"],
    "The Enricher": [r"\bEnricher\b"],
    "The Distresser": [r"\bDistresser\b"],
    "The Light": [r"\bthe Light\b", r"Light of the heavens"],
    "The Guide": [r"\bthe Guide\b"],
    "The Incomparable": [r"\bOriginator\b", r"\bIncomparable\b"],
    "The Inheritor": [r"\bInheritor\b", r"\bHeir\b"],
    "The Guide to the Right Path": [r"\bGuide to the Right Path\b"],
    "The Patient": [r"\bPatient\b"],
}


def strip_harakat(s: str) -> str:
    return HARAKAT.sub("", s or "")


def parse_verses(text: str) -> list[dict]:
    lines = text.splitlines()
    out = []
    for i, line in enumerate(lines):
        m = VERSE_RE.match(line)
        if not m:
            continue
        ar = (lines[i + 1] if i + 1 < len(lines) else "").strip()
        en = (lines[i + 2] if i + 2 < len(lines) else "").strip()
        out.append({
            "s": int(m.group(1)),
            "a": int(m.group(2)),
            "ar": ar,
            "en": en,
            "ar_key": strip_harakat(ar),
        })
    return out


def load_asma() -> list[dict]:
    html = ROOTS_HTML.read_text(encoding="utf-8")
    m = re.search(r"var ASMA_DATA = (\[.*?\]);", html)
    if not m:
        raise SystemExit("ASMA_DATA not found in Al-Quran-Roots.html")
    return json.loads(m.group(1))


def arabic_needles(ar: str) -> list[str]:
    """Stripped Arabic forms to search for (longest first)."""
    full = strip_harakat(ar).replace(" ", "")
    needles = []
    if full:
        needles.append(full)
    # Without definite article
    if full.startswith("ال") and len(full) > 4:
        needles.append(full[2:])
    # Compound: keep space-separated parts
    parts = [strip_harakat(p) for p in ar.split() if strip_harakat(p)]
    if len(parts) > 1:
        needles.append("".join(parts))
        for p in parts:
            if p.startswith("ال") and len(p) > 4:
                needles.append(p)
            elif len(p) >= 3:
                needles.append(p)
    # Prefer longer, unique
    seen = set()
    ordered = []
    for n in sorted(set(needles), key=len, reverse=True):
        if n and n not in seen:
            seen.add(n)
            ordered.append(n)
    return ordered


def ar_contains(hay: str, needle: str) -> bool:
    """True if needle appears as an Arabic token (not mid-word for short needles)."""
    if not needle or needle not in hay:
        return False
    if len(needle) >= 5:
        return True
    for m in re.finditer(re.escape(needle), hay):
        before = hay[m.start() - 1] if m.start() else ""
        after = hay[m.end()] if m.end() < len(hay) else ""
        def is_ar(ch: str) -> bool:
            return bool(ch) and "\u0600" <= ch <= "\u06FF"
        if is_ar(before) or is_ar(after):
            continue
        return True
    return False


def match_verse(v: dict, name: dict, needles: list[str], en_res: list[re.Pattern]) -> str | None:
    """Return 'ar', 'en', or 'both' if matched."""
    ar_hit = any(ar_contains(v["ar_key"], n) for n in needles)
    en_hit = any(r.search(v["en"]) for r in en_res) if en_res else False
    # Short needles need English or nearby Allah / divine framing
    if ar_hit and needles and len(needles[0]) < 4:
        if not (en_hit or "الله" in v["ar_key"] or "Allah" in v["en"]):
            ar_hit = False
    if ar_hit and en_hit:
        return "both"
    if ar_hit:
        return "ar"
    if en_hit:
        return "en"
    return None


def collect_hits(verses: list[dict], name: dict, limit: int = 12) -> tuple[int, list[dict]]:
    needles = arabic_needles(name["ar"])
    cues = EN_CUES.get(name["en"], [])
    # Also light English from the catalog gloss
    gloss = re.sub(r"^The\s+", "", name["en"], flags=re.I)
    if gloss and len(gloss) > 4:
        cues = cues + [re.escape(gloss)]
    en_res = [re.compile(c, re.I) for c in cues]
    hits = []
    for v in verses:
        how = match_verse(v, name, needles, en_res)
        if not how:
            continue
        hits.append({
            "s": v["s"],
            "a": v["a"],
            "ar": v["ar"],
            "en": v["en"],
            "how": how,
        })
    total = len(hits)
    # Prefer both > ar > en; keep early Mushaf order for sample
    return total, hits[:limit]


def build_payload(asma: list[dict], verses: list[dict]) -> list[dict]:
    # Lead with the Greatest Name as found in the text
    allah = {
        "n": 0,
        "en": "Allah",
        "ar": "اللَّه",
        "root": "أله",
        "lemma_occ": sum(1 for v in verses if "الله" in v["ar_key"]),
        "text_hits": 0,
        "verses": [],
    }
    needles = ["الله", "اللّه"]
    hits = []
    for v in verses:
        if any(n in v["ar_key"] for n in needles) or re.search(r"\bAllah\b", v["en"]):
            hits.append({
                "s": v["s"], "a": v["a"], "ar": v["ar"], "en": v["en"], "how": "ar"
            })
    allah["text_hits"] = len(hits)
    # Representative sample across the Mushaf
    step = max(1, len(hits) // 12)
    allah["verses"] = [hits[i] for i in range(0, len(hits), step)][:12]

    rows = [allah]
    for i, a in enumerate(asma, start=1):
        total, sample = collect_hits(verses, a)
        rows.append({
            "n": i,
            "en": a["en"],
            "ar": a["ar"],
            "root": a.get("root", ""),
            "lemma_occ": a.get("occ", 0),
            "text_hits": total,
            "verses": sample,
        })
    return rows


HTML_TEMPLATE = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Al-Quran — Names of Allah</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cormorant+Garamond:wght@500;600;700&family=IBM+Plex+Sans:wght@500;600&display=swap" rel="stylesheet">
<style>
:root {
  --ink: #1e2a24;
  --muted: #5c6b62;
  --rule: rgba(40, 70, 55, 0.16);
  --bg0: #e8f0ea;
  --bg1: #f4f7f2;
  --panel: rgba(255, 255, 252, 0.9);
  --seal: #0f3d32;
  --seal-soft: #1a5c4a;
  --gold: #a67c2d;
  --gold-soft: rgba(166, 124, 45, 0.18);
  --arabic: #0d4a38;
  --en: #2a3d55;
  --hit: #8b3a2a;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100%;
  color: var(--ink);
  font-family: "Cormorant Garamond", Georgia, serif;
  background:
    radial-gradient(ellipse 70% 45% at 15% 0%, rgba(26, 92, 74, 0.12), transparent 55%),
    radial-gradient(ellipse 60% 40% at 95% 10%, rgba(166, 124, 45, 0.12), transparent 50%),
    linear-gradient(180deg, var(--bg1), var(--bg0));
  background-attachment: fixed;
}
a { color: var(--seal-soft); }
h1 {
  margin: 0 0 6px;
  text-align: center;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-weight: 700;
  font-size: clamp(1.8em, 4vw, 2.4em);
  color: var(--seal);
  letter-spacing: 0.02em;
}
.subtitle {
  text-align: center;
  color: var(--muted);
  margin: 0 0 18px;
  font-family: "IBM Plex Sans", system-ui, sans-serif;
  font-size: 0.82em;
  line-height: 1.6;
}
.subtitle a { color: var(--en); }
.shell { max-width: 1100px; margin: 0 auto; padding: 28px 16px 72px; }
.note {
  background: var(--panel);
  border: 1px solid var(--rule);
  border-left: 4px solid var(--gold);
  border-radius: 10px;
  padding: 14px 16px;
  margin: 0 0 18px;
  font-size: 1.05em;
  line-height: 1.55;
  color: var(--muted);
}
.note p { margin: 0 0 8px; }
.note p:last-child { margin: 0; }
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 28px;
  justify-content: center;
  margin: 0 0 18px;
  padding: 12px 0;
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  font-family: "IBM Plex Sans", system-ui, sans-serif;
}
.stats b { display: block; color: var(--hit); font-size: 1.45em; }
.stats span { font-size: 0.78em; color: var(--muted); }
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
}
.toolbar input {
  flex: 1 1 220px;
  min-width: 180px;
  font-family: "IBM Plex Sans", system-ui, sans-serif;
  font-size: 0.92em;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--rule);
  background: rgba(255,255,255,0.85);
  color: var(--ink);
}
.toolbar select {
  font-family: "IBM Plex Sans", system-ui, sans-serif;
  font-size: 0.88em;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--rule);
  background: rgba(255,255,255,0.85);
}
.layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 18px;
  align-items: start;
}
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .detail { position: relative; top: 0; }
}
.seals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 10px;
}
.seal {
  appearance: none;
  border: 1px solid var(--rule);
  border-radius: 16px;
  background:
    radial-gradient(circle at 30% 20%, rgba(166,124,45,0.14), transparent 55%),
    linear-gradient(160deg, #fffef8, #eef5f0);
  color: var(--seal);
  cursor: pointer;
  padding: 12px 8px 10px;
  text-align: center;
  min-height: 118px;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
  font: inherit;
}
.seal:hover {
  transform: translateY(-2px);
  border-color: var(--seal-soft);
  box-shadow: 0 8px 20px rgba(15, 61, 50, 0.1);
}
.seal.active {
  border-color: var(--gold);
  box-shadow: inset 0 0 0 1px var(--gold), 0 8px 22px rgba(166, 124, 45, 0.18);
  background:
    radial-gradient(circle at 50% 0%, rgba(166,124,45,0.22), transparent 60%),
    linear-gradient(160deg, #fffdf6, #e7f2eb);
}
.seal.allah {
  grid-column: span 2;
  min-height: 132px;
  background:
    radial-gradient(circle at 50% 30%, rgba(166,124,45,0.2), transparent 60%),
    linear-gradient(160deg, #0f3d32, #1a5c4a);
  color: #f7f1e4;
  border-color: rgba(166,124,45,0.45);
}
.seal.allah .seal-en,
.seal.allah .seal-meta { color: rgba(247, 241, 228, 0.82); }
.seal-n {
  font-family: "IBM Plex Sans", system-ui, sans-serif;
  font-size: 0.65em;
  font-weight: 600;
  letter-spacing: 0.08em;
  opacity: 0.7;
}
.seal-ar {
  display: block;
  font-family: "Amiri", "Traditional Arabic", serif;
  font-size: 1.55em;
  line-height: 1.3;
  margin: 4px 0 2px;
  direction: rtl;
}
.seal.allah .seal-ar { font-size: 2.1em; }
.seal-en {
  display: block;
  font-family: "IBM Plex Sans", system-ui, sans-serif;
  font-size: 0.68em;
  font-weight: 600;
  line-height: 1.25;
  color: var(--en);
}
.seal-meta {
  display: block;
  margin-top: 6px;
  font-family: "IBM Plex Sans", system-ui, sans-serif;
  font-size: 0.62em;
  color: var(--muted);
}
.detail {
  position: sticky;
  top: 12px;
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: 16px;
  padding: 16px 16px 18px;
  box-shadow: 0 10px 30px rgba(20, 40, 30, 0.06);
  max-height: calc(100vh - 24px);
  overflow: auto;
}
.detail-empty {
  color: var(--muted);
  font-size: 1.05em;
  line-height: 1.5;
  padding: 20px 8px;
  text-align: center;
}
.detail-head { margin-bottom: 12px; }
.detail-ar {
  font-family: "Amiri", serif;
  font-size: 2.2em;
  color: var(--arabic);
  direction: rtl;
  text-align: right;
  line-height: 1.35;
}
.detail-en {
  font-size: 1.35em;
  font-weight: 600;
  color: var(--seal);
  margin-top: 4px;
}
.detail-meta {
  font-family: "IBM Plex Sans", system-ui, sans-serif;
  font-size: 0.78em;
  color: var(--muted);
  margin-top: 6px;
}
.verse {
  border-top: 1px solid var(--rule);
  padding: 12px 0;
}
.verse-ref {
  font-family: "IBM Plex Sans", system-ui, sans-serif;
  font-size: 0.72em;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--hit);
  margin-bottom: 6px;
}
.verse-ar {
  font-family: "Amiri", serif;
  font-size: 1.25em;
  color: var(--arabic);
  direction: rtl;
  text-align: right;
  line-height: 1.85;
  margin-bottom: 6px;
}
.verse-en {
  font-size: 1.02em;
  color: var(--en);
  line-height: 1.5;
}
.how {
  display: inline-block;
  margin-left: 8px;
  font-size: 0.85em;
  font-weight: 500;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.footer-note {
  margin-top: 28px;
  text-align: center;
  color: var(--muted);
  font-family: "IBM Plex Sans", system-ui, sans-serif;
  font-size: 0.78em;
}
</style>
</head>
<body>
<div class="shell">
  <h1>Names of Allah</h1>
  <p class="subtitle">
    Al-Asmāʾ al-Ḥusnā — from the Book’s own wording<br>
    <a href="Al-Quran-Study.html">study app</a> ·
    <a href="Al-Quran-Roots.html">roots</a> ·
    <a href="Al-Quran-Letters.html">letter context</a> ·
    <a href="Al-Quran-Voices.html">voices</a> ·
    <a href="Al-Quran-People.html">believers</a> ·
    <a href="Al-Quran-Angels.html">angels</a> ·
    <a href="Al-Quran-Genealogy.html">genealogy &amp; places</a> ·
    <a href="Al-Quran.html">full text</a>
  </p>

  <div class="note">
    <p>A seal-gallery of the traditional <b>99 Beautiful Names</b>, plus the Greatest Name
    <b>Allah</b>, each linked to verses in <code>Al-Quran.txt</code>. Arabic forms are matched
    in the Mushaf line; English cues follow the Yusuf Ali rendering where helpful.</p>
    <p>Counts are text hits in this bilingual file (not a fatwa on which epithets “count”
    as Names). Lemma tallies from the Roots morphology are shown for comparison. Select a
    seal to read sample ayahs.</p>
  </div>

  <div class="stats">
    <div><b id="stat-names">—</b><span>names</span></div>
    <div><b id="stat-with-hits">—</b><span>found in text</span></div>
    <div><b id="stat-verses">—</b><span>verse hits (all)</span></div>
  </div>

  <div class="toolbar">
    <input id="q" type="search" placeholder="Search Arabic, English, or root…" aria-label="Search names">
    <select id="sort" aria-label="Sort names">
      <option value="traditional">Traditional order</option>
      <option value="hits">Most text hits</option>
      <option value="alpha">English A–Z</option>
      <option value="arabic">Arabic letter</option>
    </select>
  </div>

  <div class="layout">
    <div class="seals" id="seals" aria-label="Name seals"></div>
    <aside class="detail" id="detail">
      <div class="detail-empty">Select a name seal to open its sayings in the Qur’an text.</div>
    </aside>
  </div>

  <p class="footer-note">
    Built from <code>Al-Quran-Roots.html</code> ASMA catalog + <code>Al-Quran.txt</code> ·
    <code>python build_names_page.py</code>
  </p>
</div>

<script>
window.NAMES_DATA = __NAMES_JSON__;
(function () {
  "use strict";
  var DATA = window.NAMES_DATA || [];
  var sealsEl = document.getElementById("seals");
  var detailEl = document.getElementById("detail");
  var qEl = document.getElementById("q");
  var sortEl = document.getElementById("sort");
  var active = null;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function filtered() {
    var q = (qEl.value || "").trim().toLowerCase();
    var rows = DATA.slice();
    if (q) {
      rows = rows.filter(function (n) {
        return (n.en + " " + n.ar + " " + (n.root || "")).toLowerCase().indexOf(q) !== -1 ||
          n.ar.indexOf(q) !== -1;
      });
    }
    var sort = sortEl.value;
    rows.sort(function (a, b) {
      if (sort === "hits") return (b.text_hits || 0) - (a.text_hits || 0) || a.n - b.n;
      if (sort === "alpha") return a.en.localeCompare(b.en) || a.n - b.n;
      if (sort === "arabic") return a.ar.localeCompare(b.ar, "ar") || a.n - b.n;
      return a.n - b.n;
    });
    return rows;
  }

  function renderSeals() {
    var rows = filtered();
    sealsEl.innerHTML = rows.map(function (n) {
      var isAllah = n.n === 0;
      var cls = "seal" + (isAllah ? " allah" : "") + (active && active.n === n.n ? " active" : "");
      var num = isAllah ? "١" : String(n.n);
      return (
        '<button type="button" class="' + cls + '" data-n="' + n.n + '">' +
          '<span class="seal-n">' + escapeHtml(num) + "</span>" +
          '<span class="seal-ar" lang="ar" dir="rtl">' + escapeHtml(n.ar) + "</span>" +
          '<span class="seal-en">' + escapeHtml(n.en) + "</span>" +
          '<span class="seal-meta">' + (n.text_hits || 0) + " in text</span>" +
        "</button>"
      );
    }).join("") || '<p class="detail-empty">No names match.</p>';
  }

  function showDetail(n) {
    active = n;
    renderSeals();
    if (!n) {
      detailEl.innerHTML = '<div class="detail-empty">Select a name seal to open its sayings in the Qur’an text.</div>';
      return;
    }
    var verses = n.verses || [];
    var html =
      '<div class="detail-head">' +
        '<div class="detail-ar" lang="ar" dir="rtl">' + escapeHtml(n.ar) + "</div>" +
        '<div class="detail-en">' + escapeHtml(n.en) + "</div>" +
        '<div class="detail-meta">Root <b>' + escapeHtml(n.root || "—") + "</b>" +
          " · text hits <b>" + (n.text_hits || 0) + "</b>" +
          (n.lemma_occ ? " · morphology lemma ×" + n.lemma_occ : "") +
          (verses.length && n.text_hits > verses.length ? " · showing " + verses.length + " samples" : "") +
        "</div>" +
      "</div>";
    if (!verses.length) {
      html += '<div class="detail-empty">No clear hit in Al-Quran.txt for this form (traditional name may be by root sense or ḥadīth lists).</div>';
    } else {
      html += verses.map(function (v) {
        return (
          '<article class="verse" id="nv-' + v.s + "-" + v.a + '">' +
            '<div class="verse-ref">' + v.s + ":" + v.a +
              '<span class="how">' + escapeHtml(v.how || "") + "</span></div>" +
            '<div class="verse-ar" lang="ar" dir="rtl">' + escapeHtml(v.ar) + "</div>" +
            '<div class="verse-en">' + escapeHtml(v.en) + "</div>" +
          "</article>"
        );
      }).join("");
    }
    detailEl.innerHTML = html;
    detailEl.scrollTop = 0;
  }

  sealsEl.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-n]");
    if (!btn) return;
    var n = +btn.getAttribute("data-n");
    var row = DATA.filter(function (x) { return x.n === n; })[0];
    showDetail(row || null);
  });
  qEl.addEventListener("input", renderSeals);
  sortEl.addEventListener("change", renderSeals);

  var withHits = DATA.filter(function (n) { return n.text_hits > 0; }).length;
  var totalHits = DATA.reduce(function (s, n) { return s + (n.text_hits || 0); }, 0);
  document.getElementById("stat-names").textContent = String(DATA.length);
  document.getElementById("stat-with-hits").textContent = String(withHits);
  document.getElementById("stat-verses").textContent = String(totalHits);

  renderSeals();
  var allah = DATA.filter(function (x) { return x.n === 0; })[0];
  if (allah) showDetail(allah);
})();
</script>
</body>
</html>
'''


def main() -> None:
    verses = parse_verses(TXT.read_text(encoding="utf-8"))
    asma = load_asma()
    payload = build_payload(asma, verses)
    html = HTML_TEMPLATE.replace(
        "__NAMES_JSON__",
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
    )
    OUT.write_text(html, encoding="utf-8")
    with_hits = sum(1 for n in payload if n["text_hits"] > 0)
    print(f"Wrote {OUT.name}: names={len(payload)} with_hits={with_hits} verses={len(verses)}")


if __name__ == "__main__":
    main()
