"""Build Al-Quran-Roots.html: every Arabic root in the Qur'an, ranked by frequency.

Run it from anywhere; all paths resolve against this script's own folder:

    python build_roots_page.py

Reads  quran-morphology.txt  (root tags, downloaded on first run if absent)
       Al-Quran.html         (surah names, so both pages agree)
Writes Al-Quran-Roots.html

Root tags come from the Quranic Arabic Corpus morphological annotation, where every
one of the 77,429 words is tagged with its root; the counts here are a tally of
those tags. Only the standard library is required.
"""

import html as htmllib
import json
import re
import sys
import urllib.request
from collections import Counter, defaultdict
from itertools import product
from pathlib import Path

HERE = Path(__file__).resolve().parent
MORPH = HERE / "quran-morphology.txt"
SOURCE_HTML = HERE / "Al-Quran.html"
DST = HERE / "Al-Quran-Roots.html"

MORPH_URL = (
    "https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/"
    "quran-morphology.txt"
)

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

if not MORPH.exists():
    print(f"fetching {MORPH.name} ...")
    urllib.request.urlretrieve(MORPH_URL, MORPH)

# ---------------------------------------------------------------- collect data
count = Counter()
verses_with_root = defaultdict(set)
root_surah = defaultdict(Counter)          # root -> {surah: occurrences}
surah_roots = defaultdict(set)             # surah -> {roots}
surah_root_words = Counter()               # surah -> root-bearing words
surah_words = defaultdict(set)             # surah -> {(verse, word)}
surah_verses = Counter()                   # surah -> verse count
lemmas = defaultdict(Counter)
root_forms = defaultdict(Counter)

for line in MORPH.read_text(encoding="utf-8").splitlines():
    cols = line.split("\t")
    if len(cols) < 4:
        continue
    loc, form, _tag, feats = cols[0], cols[1], cols[2], cols[3]
    s, v, w, _seg = (int(x) for x in loc.split(":"))
    surah_words[s].add((v, w))
    surah_verses[s] = max(surah_verses[s], v)
    m = re.search(r"ROOT:([^|]+)", feats)
    if not m:
        continue
    root = m.group(1)
    count[root] += 1
    verses_with_root[root].add((s, v))
    root_surah[root][s] += 1
    surah_roots[s].add(root)
    surah_root_words[s] += 1
    lem = re.search(r"LEM:([^|]+)", feats)
    if lem:
        lemmas[root][lem.group(1)] += 1
    root_forms[root][form] += 1

total_words = sum(len(v) for v in surah_words.values())
root_words = sum(surah_root_words.values())

# Published Quranic Arabic Corpus totals — a mismatch means the data file is wrong.
for label, got, want in [
    ("surahs", len(surah_words), 114),
    ("verses", sum(surah_verses.values()), 6236),
    ("words", total_words, 77429),
    ("roots", len(count), 1651),
]:
    assert got == want, f"{label}: parsed {got:,}, expected {want:,} — check {MORPH.name}"

# ----------------------------------------------------- surah names from source
src = SOURCE_HTML.read_text(encoding="utf-8")
arabic_names = [
    re.sub(r"\s+", " ", htmllib.unescape(re.sub(r"<[^>]+>", "", t))).strip()
    for t in re.findall(r'<h1 class="surah-title">(.*?)</h1>', src, re.DOTALL)
]
assert len(arabic_names) == 114, len(arabic_names)

EN_NAMES = [
    "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am",
    "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd",
    "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Ta-Ha",
    "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara",
    "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum", "Luqman", "As-Sajdah",
    "Al-Ahzab", "Saba", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar",
    "Ghafir", "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah",
    "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Az-Zariyat",
    "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid",
    "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah",
    "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk",
    "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil",
    "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba",
    "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin",
    "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr",
    "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin",
    "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat",
    "Al-Qari'ah", "At-Takathur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraysh",
    "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas",
    "Al-Falaq", "An-Nas",
]
assert len(EN_NAMES) == 114, len(EN_NAMES)

# ------------------------------------------------------------ transliteration
TRANSLIT = {
    "ا": "ā", "ب": "b", "ت": "t", "ث": "th", "ج": "j", "ح": "ḥ", "خ": "kh",
    "د": "d", "ذ": "dh", "ر": "r", "ز": "z", "س": "s", "ش": "sh", "ص": "ṣ",
    "ض": "ḍ", "ط": "ṭ", "ظ": "ẓ", "ع": "ʿ", "غ": "gh", "ف": "f", "ق": "q",
    "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h", "و": "w", "ي": "y",
    "ء": "ʾ", "أ": "ʾ", "إ": "ʾ", "آ": "ʾ", "ؤ": "ʾ", "ئ": "ʾ", "ٱ": "ʾ",
    "ى": "y", "ة": "h",
}
ASCII = {"ā": "a", "ḥ": "h", "ṣ": "s", "ḍ": "d", "ṭ": "t", "ẓ": "z"}

# Hamza and ayn have no settled ASCII spelling, so every plausible rendering of
# them is indexed: أله is findable as both "alh" and "lh".
AMBIGUOUS = {"ʾ": ("a", ""), "ʿ": ("a", "e", "i", "")}


def translit(root):
    return "-".join(TRANSLIT.get(ch, ch) for ch in root)


# Surah names in the source file use Persian letter forms (یوسف, الکهف) while the
# morphology roots use standard Arabic, so searches are matched on a folded form.
AR_FOLD = str.maketrans({
    "ی": "ي", "ى": "ي", "ئ": "ي", "ک": "ك", "أ": "ا", "إ": "ا", "آ": "ا",
    "ٱ": "ا", "ة": "ه", "ؤ": "و", "ء": "",
})
AR_MARKS = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]")


def ar_fold(text):
    return AR_MARKS.sub("", text).translate(AR_FOLD)


def searchable(root):
    choices = [
        AMBIGUOUS.get(piece, (ASCII.get(piece, piece),))
        for piece in (TRANSLIT.get(ch, ch) for ch in root)
    ]
    return " ".join(sorted({"".join(combo) for combo in product(*choices)}))


# ------------------------------------------------------------------- glosses
GLOSS = {
    "أله": "God, deity", "قول": "to say, speak; word", "كون": "to be, become",
    "ربب": "lord, master; to nurture", "أمن": "to believe, have faith; safety",
    "علم": "to know; knowledge", "قوم": "people; to stand, establish",
    "أيي": "sign, verse; which", "أتي": "to come; to give",
    "كفر": "to disbelieve, reject faith", "بين": "between; clear, manifest",
    "شيأ": "thing; to will, wish", "رسل": "messenger; to send", "يوم": "day",
    "أرض": "earth, land", "سمو": "sky, heaven; name", "كلل": "all, every",
    "عذب": "punishment, torment", "عمل": "to do, work; deed",
    "جعل": "to make, appoint", "رحم": "mercy, compassion",
    "أنس": "mankind, human being", "رأي": "to see, perceive",
    "كتب": "book, scripture; to write", "هدي": "to guide; guidance",
    "ظلم": "to wrong, oppress; darkness", "نفس": "soul, self",
    "قبل": "before; to accept", "نزل": "to send down, reveal",
    "ذكر": "to remember, mention", "حقق": "truth, right; to be true",
    "كذب": "to lie, deny as false", "جيأ": "to come",
    "عبد": "servant; to worship", "أخذ": "to take, seize",
    "خلق": "to create; creation", "وقي": "to guard, be mindful",
    "أخر": "last, hereafter; other", "أمر": "command, affair; to order",
    "بعد": "after; far, distant", "غفر": "to forgive",
    "ولي": "protector, ally; to turn away", "دعو": "to call, pray",
    "حكم": "to judge; wisdom", "ملك": "angel; kingdom, to own",
    "جنن": "garden, paradise; jinn", "عند": "with, near", "خير": "good, better",
    "نور": "light; fire", "حسن": "good, beautiful; to do good",
    "ضلل": "to go astray, mislead", "حيي": "life, to live",
    "سمع": "to hear, listen", "بني": "son, child; to build",
    "خرج": "to go out, bring forth", "صلح": "righteous; to reconcile",
    "سبل": "way, path", "تبع": "to follow", "قتل": "to kill, fight",
    "مثل": "likeness, parable", "قلب": "heart; to turn over",
    "شرك": "to associate partners", "كثر": "many, much", "سوأ": "evil, bad",
    "موت": "death, to die", "كبر": "great; to be arrogant",
    "شهد": "to witness, testify", "نبأ": "prophet; news",
    "بعض": "some, part", "نصر": "to help, give victory",
    "صدق": "truthful; to confirm", "غير": "other than; to change",
    "وعد": "to promise", "بصر": "to see; sight", "رود": "to want, intend",
    "لقي": "to meet; to cast", "دون": "besides, below",
    "نعم": "favour, blessing; cattle", "سلم": "peace; to submit",
    "دنو": "near; this world", "قدر": "power, to decree",
    "نذر": "to warn; warner", "جمع": "to gather; all together",
    "نظر": "to look, wait", "سأل": "to ask, question",
    "طوع": "to obey; to be able", "عظم": "great, mighty; bones",
    "خلف": "to differ, succeed; behind", "أهل": "family, people of",
    "دخل": "to enter, admit", "أول": "first, former; interpretation",
    "خوف": "fear, to be afraid", "رزق": "to provide; provision",
    "بشر": "good news; human being", "يدي": "hand",
    "عزز": "might, honour; Almighty", "أمم": "community, nation; mother",
    "جزي": "to recompense; reward", "أبو": "father, forefathers",
    "نهر": "daytime; river",
    # Leading roots of each first letter, so every letter group below rests on its
    # own most frequent roots rather than on whichever happened to be in the top 100.
    "قرب": "near, close", "قرأ": "to recite; Qur'an", "كيف": "how",
    "عدو": "enemy, enmity", "رجع": "to return", "رضو": "to be pleased",
    "بغي": "to seek; to transgress", "بلغ": "to reach, convey",
    "سبح": "to glorify, extol", "سجد": "to prostrate",
    "حسب": "to reckon; account", "حبب": "love; grain", "حرم": "to forbid; sacred",
    "حمد": "praise", "وجد": "to find", "ولد": "child, to beget",
    "وجه": "face, direction", "وحي": "to reveal; inspiration",
    "وكل": "to trust, entrust", "جرم": "crime, sinner", "جري": "to flow, run",
    "جوب": "to answer, respond", "خلد": "to abide forever",
    "خسر": "to lose; loss", "خبر": "news; All-Aware", "شدد": "severe, strong",
    "شطن": "Satan", "شكر": "to thank; gratitude", "شعر": "to perceive; poet",
    "شرب": "to drink", "مول": "wealth", "متع": "enjoyment, provision",
    "موه": "water", "مسس": "to touch, afflict", "مكر": "to plot, scheme",
    "صبر": "patience, to endure", "صلو": "prayer", "صحب": "companion",
    "صوب": "to strike, afflict", "صدر": "breast, chest", "صرط": "path, way",
    "فعل": "to do, act", "فضل": "bounty, favour", "فرق": "to separate; party",
    "فتن": "trial, temptation", "فري": "to invent, fabricate",
    "فسق": "to transgress", "فسد": "corruption", "فوق": "above, over",
    "دين": "religion; debt", "دور": "house, dwelling", "دبر": "to ponder; behind",
    "دري": "to know", "غني": "rich, to enrich", "غيب": "unseen, hidden",
    "غفل": "heedless", "غلب": "to overcome, prevail", "غشو": "to cover, overwhelm",
    "غرر": "to delude; deception", "يمن": "right hand; oath",
    "يسر": "easy, to ease", "يقن": "certainty", "يتم": "orphan",
    "يأس": "to despair", "يمم": "sea", "ليل": "night", "ليس": "is not",
    "لعن": "to curse", "لبث": "to remain, tarry", "لسن": "tongue, language",
    "لبس": "clothing; to confuse", "لعب": "to play, sport",
    "هلك": "to perish, destroy", "هوي": "desire; air", "هزأ": "to mock, ridicule",
    "هجر": "to emigrate, forsake", "هود": "Jews; the prophet Hud",
    "هون": "humiliation; easy", "همم": "to intend, be concerned",
    "ذوق": "to taste", "ذهب": "to go; gold", "ذنب": "sin", "ذرر": "offspring; atom",
    "ذلل": "lowliness, humiliation", "ذبح": "to slaughter", "ذرأ": "to create",
    "طيب": "good, pure", "طعم": "food, to feed", "طوف": "to circle; group",
    "طغي": "to transgress; tyranny", "طهر": "to purify", "طير": "bird",
    "طلق": "to divorce; set forth", "توب": "to repent, turn",
    "تلو": "to recite, follow", "تحت": "beneath, under", "ترك": "to leave, forsake",
    "تمم": "to complete", "ترب": "dust, earth", "تجر": "trade, commerce",
    "ظنن": "to think, suppose", "ظهر": "back; to appear", "ظلل": "shade, shadow",
    "ظمأ": "thirst", "ظفر": "nail; to gain", "ظعن": "journey, travel",
    "ضرر": "harm, adversity", "ضرب": "to strike; set forth",
    "ضعف": "weak; to double", "ضيق": "to be straitened", "ضيع": "to lose, waste",
    "ضحك": "to laugh", "ضرع": "to supplicate humbly", "زوج": "spouse, pair",
    "زيد": "to increase", "زكو": "purity; alms", "زين": "to adorn, beautify",
    "زعم": "to claim, allege", "زرع": "to sow; crops", "زبر": "scriptures; pieces",
    "زيل": "to separate, remove", "ثلث": "three", "ثني": "two, twofold",
    "ثوب": "reward; garments", "ثقل": "weight, heavy", "ثمر": "fruit",
    "ثمن": "price; eight", "ثبت": "to make firm", "ثوي": "dwelling, abode",
}

# ------------------------------------------------------------- letter groupings
# Arabic letters carry no meaning of their own; each theme below simply summarises
# the senses of the roots that happen to begin with that letter, in three words or
# fewer, and each cluster gathers the roots of that group that share a sense.
LETTERS = {
    "أ": ("ʾalif", "God and humanity"),
    "ب": ("bāʾ", "Clarity and distinction"),
    "ت": ("tāʾ", "Following and returning"),
    "ث": ("thāʾ", "Number and measure"),
    "ج": ("jīm", "Making and gathering"),
    "ح": ("ḥāʾ", "Truth and judgement"),
    "خ": ("khāʾ", "Creation and outcome"),
    "د": ("dāl", "Calling and nearness"),
    "ذ": ("dhāl", "Remembrance"),
    "ر": ("rāʾ", "Lordship and mercy"),
    "ز": ("zāy", "Increase and adornment"),
    "س": ("sīn", "Heaven and worship"),
    "ش": ("shīn", "Will and witness"),
    "ص": ("ṣād", "Righteousness and patience"),
    "ض": ("ḍād", "Straying and harm"),
    "ط": ("ṭāʾ", "Obedience and purity"),
    "ظ": ("ẓāʾ", "Wrongdoing and darkness"),
    "ع": ("ʿayn", "Knowledge and worship"),
    "غ": ("ghayn", "Forgiveness and concealment"),
    "ف": ("fāʾ", "Doing and corruption"),
    "ق": ("qāf", "Speech and standing"),
    "ك": ("kāf", "Being and disbelief"),
    "ل": ("lām", "Meeting and night"),
    "م": ("mīm", "Kingdom and death"),
    "ن": ("nūn", "Revelation and favour"),
    "ه": ("hāʾ", "Guidance and destruction"),
    "و": ("wāw", "Piety and protection"),
    "ي": ("yāʾ", "Day and certainty"),
}

LETTER_AR_NAMES = {
    "أ": "ألف", "ب": "باء", "ت": "تاء", "ث": "ثاء", "ج": "جيم",
    "ح": "حاء", "خ": "خاء", "د": "دال", "ذ": "ذال", "ر": "راء",
    "ز": "زاي", "س": "سين", "ش": "شين", "ص": "صاد", "ض": "ضاد",
    "ط": "طاء", "ظ": "ظاء", "ع": "عين", "غ": "غين", "ف": "فاء",
    "ق": "قاف", "ك": "كاف", "ل": "لام", "م": "ميم", "ن": "نون",
    "ه": "هاء", "و": "واو", "ي": "ياء",
}

CLUSTERS = {
    "أ": [("God and faith", ["أله", "أمن"]),
          ("People and kin", ["أنس", "أهل", "أمم", "أبو"]),
          ("Coming and taking", ["أتي", "أخذ"]),
          ("First and last", ["أول", "أخر"]),
          ("Signs and command", ["أيي", "أمر"]),
          ("The earth", ["أرض"])],
    "ب": [("Seeing and clarity", ["بين", "بصر"]),
          ("Announcing and reaching", ["بشر", "بلغ"]),
          ("Kin and parts", ["بني", "بعض"]),
          ("Distance and seeking", ["بعد", "بغي"])],
    "ت": [("Following and reciting", ["تبع", "تلو"]),
          ("Turning and leaving", ["توب", "ترك"]),
          ("Completion and trade", ["تمم", "تجر"]),
          ("Beneath and dust", ["تحت", "ترب"])],
    "ث": [("Number and weight", ["ثلث", "ثني", "ثمن", "ثقل"]),
          ("Fruit and reward", ["ثمر", "ثوب"]),
          ("Firmness and dwelling", ["ثبت", "ثوي"])],
    "ج": [("Making and coming", ["جعل", "جيأ"]),
          ("Gathering and recompense", ["جمع", "جزي"]),
          ("Garden and concealment", ["جنن"]),
          ("Crime and answer", ["جرم", "جوب"]),
          ("Flowing", ["جري"])],
    "ح": [("Truth and judgement", ["حقق", "حكم"]),
          ("Goodness and praise", ["حسن", "حمد"]),
          ("Life and love", ["حيي", "حبب"]),
          ("Reckoning and prohibition", ["حسب", "حرم"])],
    "خ": [("Creation and emergence", ["خلق", "خرج"]),
          ("Good and abiding", ["خير", "خلد"]),
          ("Fear and loss", ["خوف", "خسر"]),
          ("Difference and news", ["خلف", "خبر"])],
    "د": [("Calling and entering", ["دعو", "دخل"]),
          ("Nearness and below", ["دنو", "دون"]),
          ("Religion and dwelling", ["دين", "دور"]),
          ("Knowing and pondering", ["دري", "دبر"])],
    "ذ": [("Remembrance", ["ذكر"]),
          ("Tasting and going", ["ذوق", "ذهب"]),
          ("Sin and lowliness", ["ذنب", "ذلل"]),
          ("Offspring and creating", ["ذرر", "ذرأ"]),
          ("Slaughter", ["ذبح"])],
    "ر": [("Lordship and mercy", ["ربب", "رحم"]),
          ("Messengers and sending", ["رسل"]),
          ("Seeing and willing", ["رأي", "رود"]),
          ("Provision and pleasure", ["رزق", "رضو"]),
          ("Returning", ["رجع"])],
    "ز": [("Increase and purity", ["زيد", "زكو"]),
          ("Pairs and adornment", ["زوج", "زين"]),
          ("Sowing and scripture", ["زرع", "زبر"]),
          ("Claiming and parting", ["زعم", "زيل"])],
    "س": [("Heaven and name", ["سمو"]),
          ("Hearing and asking", ["سمع", "سأل"]),
          ("Path and peace", ["سبل", "سلم"]),
          ("Glorifying and prostration", ["سبح", "سجد"]),
          ("Evil", ["سوأ"])],
    "ش": [("Will and things", ["شيأ"]),
          ("Partners and Satan", ["شرك", "شطن"]),
          ("Witness and perception", ["شهد", "شعر"]),
          ("Thanks and severity", ["شكر", "شدد"]),
          ("Drinking", ["شرب"])],
    "ص": [("Truth and righteousness", ["صدق", "صلح"]),
          ("Patience and prayer", ["صبر", "صلو"]),
          ("Companions and breast", ["صحب", "صدر"]),
          ("Path and affliction", ["صرط", "صوب"])],
    "ض": [("Straying", ["ضلل"]),
          ("Harm and weakness", ["ضرر", "ضعف", "ضيق"]),
          ("Striking and loss", ["ضرب", "ضيع"]),
          ("Laughter and supplication", ["ضحك", "ضرع"])],
    "ط": [("Obedience and transgression", ["طوع", "طغي"]),
          ("Purity and goodness", ["طهر", "طيب"]),
          ("Food and birds", ["طعم", "طير"]),
          ("Circling and release", ["طوف", "طلق"])],
    "ظ": [("Wrongdoing and darkness", ["ظلم"]),
          ("Supposing", ["ظنن"]),
          ("Appearing and shade", ["ظهر", "ظلل"]),
          ("Thirst and travel", ["ظمأ", "ظعن"])],
    "ع": [("Knowledge", ["علم"]),
          ("Worship and work", ["عبد", "عمل"]),
          ("Punishment and enmity", ["عذب", "عدو"]),
          ("Might and greatness", ["عزز", "عظم"]),
          ("Nearness", ["عند"])],
    "غ": [("Forgiveness", ["غفر"]),
          ("Unseen and heedlessness", ["غيب", "غفل"]),
          ("Change and otherness", ["غير"]),
          ("Wealth and victory", ["غني", "غلب"]),
          ("Delusion and covering", ["غرر", "غشو"])],
    "ف": [("Doing and bounty", ["فعل", "فضل"]),
          ("Separation and above", ["فرق", "فوق"]),
          ("Trial and fabrication", ["فتن", "فري"]),
          ("Corruption and transgression", ["فسد", "فسق"])],
    "ق": [("Speech and recitation", ["قول", "قرأ"]),
          ("People and standing", ["قوم"]),
          ("Before and nearness", ["قبل", "قرب"]),
          ("Heart and power", ["قلب", "قدر"]),
          ("Fighting", ["قتل"])],
    "ك": [("Being and totality", ["كون", "كلل"]),
          ("Disbelief and lying", ["كفر", "كذب"]),
          ("Scripture and writing", ["كتب"]),
          ("Greatness and abundance", ["كبر", "كثر"]),
          ("Manner", ["كيف"])],
    "ل": [("Meeting and casting", ["لقي"]),
          ("Night and tarrying", ["ليل", "لبث"]),
          ("Curse and negation", ["لعن", "ليس"]),
          ("Tongue and clothing", ["لسن", "لبس"]),
          ("Play", ["لعب"])],
    "م": [("Kingdom and angels", ["ملك"]),
          ("Death and touch", ["موت", "مسس"]),
          ("Likeness and scheming", ["مثل", "مكر"]),
          ("Wealth and enjoyment", ["مول", "متع"]),
          ("Water", ["موه"])],
    "ن": [("The soul", ["نفس"]),
          ("Revelation and prophethood", ["نزل", "نبأ"]),
          ("Light and rivers", ["نور", "نهر"]),
          ("Help and favour", ["نصر", "نعم"]),
          ("Warning and looking", ["نذر", "نظر"])],
    "ه": [("Guidance", ["هدي"]),
          ("Destruction and humiliation", ["هلك", "هون"]),
          ("Desire and mockery", ["هوي", "هزأ"]),
          ("Migration and peoples", ["هجر", "هود"]),
          ("Intent", ["همم"])],
    "و": [("Piety and protection", ["وقي", "ولي"]),
          ("Promise and revelation", ["وعد", "وحي"]),
          ("Offspring and finding", ["ولد", "وجد"]),
          ("Face and reliance", ["وجه", "وكل"])],
    "ي": [("The day", ["يوم"]),
          ("Hand and right", ["يدي", "يمن"]),
          ("Certainty and ease", ["يقن", "يسر"]),
          ("Orphan and despair", ["يتم", "يأس"]),
          ("The sea", ["يمم"])],
}

first_letters = {r[0] for r in count}
assert first_letters == set(LETTERS), first_letters ^ set(LETTERS)
assert set(CLUSTERS) == set(LETTERS), set(CLUSTERS) ^ set(LETTERS)

for _letter, _groups in CLUSTERS.items():
    _seen = set()
    for _label, _roots in _groups:
        assert len(_label.split()) <= 3, f"theme over three words: {_label}"
        for _r in _roots:
            assert _r in count, f"{_r} is not a Qur'anic root"
            assert _r[0] == _letter, f"{_r} does not begin with {_letter}"
            assert _r in GLOSS, f"{_r} has no gloss to cluster by"
            assert _r not in _seen, f"{_r} listed twice under {_letter}"
            _seen.add(_r)
for _letter, (_name, _theme) in LETTERS.items():
    assert len(_theme.split()) <= 3, f"theme over three words: {_theme}"

# ------------------------------------------------------------------ root table
ranked = count.most_common()
top_count = ranked[0][1]
DEFAULT_SHOWN = 100

def _strip_marks(word):
    return re.sub(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]", "", word)


def _fold_letter(ch):
    if ch in "أإآٱا":
        return "أ"
    if ch == "ة":
        return "ه"
    if ch in "ىي":
        return "ي"
    return ch


def _keyword_for(letter, root):
    """Prefer a lemma that begins with the letter, so the card reads as an abjad."""
    ranked_lems = lemmas[root].most_common()
    starts = []
    for form, n in ranked_lems:
        stripped = _strip_marks(form)
        if stripped and _fold_letter(stripped[0]) == letter:
            starts.append((form, n))
    if starts:
        return starts[0][0]
    if ranked_lems:
        return ranked_lems[0][0]
    return root_forms[root].most_common(1)[0][0]


# One Quranic keyword per letter: a frequent lemma of that letter's most
# common root, so the alphabet can be heard as words, not only as names.
letter_keywords = []
for letter, (en_name, theme) in LETTERS.items():
    roots = [r for r, _n in ranked if r[0] == letter]
    top_root = roots[0]
    keyword = _keyword_for(letter, top_root)
    spoken = root_forms[top_root].most_common(1)[0][0]
    letter_keywords.append({
        "letter": letter,
        "arName": LETTER_AR_NAMES[letter],
        "enName": en_name,
        "sound": letter + "\u064e",  # letter + fatha, the usual alphabet chant
        "theme": theme,
        "root": top_root,
        "keyword": keyword,
        "spoken": spoken,
        "keywordEn": GLOSS.get(top_root, ""),
        "occ": count[top_root],
    })
assert len(letter_keywords) == 28, f"expected 28 letters, got {len(letter_keywords)}"

keyword_cards = []
for i, k in enumerate(letter_keywords):
    gloss = htmllib.escape(k["keywordEn"])
    keyword_cards.append(
        f'<article class="kw-card" data-i="{i}">'
        f'<div class="kw-letter" lang="ar" dir="rtl">{k["letter"]}</div>'
        f'<div class="kw-name"><span lang="ar" dir="rtl">{k["arName"]}</span>'
        f' · {htmllib.escape(k["enName"])}</div>'
        f'<div class="kw-word" lang="ar" dir="rtl">{k["keyword"]}</div>'
        f'<div class="kw-en">{gloss}</div>'
        f'<div class="kw-meta">root <b lang="ar" dir="rtl">{k["root"]}</b>'
        f' · {k["occ"]:,}×</div>'
        f'<button type="button" class="kw-play" data-i="{i}"'
        f' aria-label="Play {htmllib.escape(k["enName"])}">Play</button>'
        f"</article>"
    )

root_rows = []
for rank, (root, n) in enumerate(ranked, 1):
    gloss = GLOSS.get(root, "")
    lem = " · ".join(f for f, _ in lemmas[root].most_common(3))
    search = f"{searchable(root)} {translit(root)} {gloss.lower()} {root} {ar_fold(root)}"
    root_rows.append(
        f'<tr class="r" data-i="{rank - 1}" data-s="{htmllib.escape(search)}">'
        f'<td class="rank">{rank}</td>'
        f'<td class="root" lang="ar" dir="rtl">{root}</td>'
        f'<td class="translit">{translit(root)}</td>'
        f'<td class="gloss">{htmllib.escape(gloss)}</td>'
        f'<td class="num">{n:,}</td>'
        f'<td class="bar"><span style="width:{n / top_count * 100:.3f}%"></span>'
        f'<i>{n / root_words * 100:.2f}%</i></td>'
        f'<td class="num">{len(verses_with_root[root]):,}</td>'
        f'<td class="num surahs">{len(root_surah[root])} <em>&#9662;</em></td>'
        f'<td class="forms" lang="ar" dir="rtl">{lem}</td>'
        f"</tr>"
        f'<tr class="d" hidden><td colspan="9"></td></tr>'
    )

# ----------------------------------------------------------------- surah table
surah_stats = []
for s in range(1, 115):
    words_n = len(surah_words[s])
    surah_stats.append({
        "n": s,
        "ar": arabic_names[s - 1],
        "en": EN_NAMES[s - 1],
        "verses": surah_verses[s],
        "words": words_n,
        "rootwords": surah_root_words[s],
        "roots": len(surah_roots[s]),
        "density": len(surah_roots[s]) / words_n * 100,
    })

max_roots = max(r["roots"] for r in surah_stats)
by_roots = sorted(surah_stats, key=lambda r: -r["roots"])

surah_rows = []
for r in by_roots:
    surah_rows.append(
        f'<tr data-roots="{r["roots"]}" data-rootwords="{r["rootwords"]}" '
        f'data-words="{r["words"]}" data-verses="{r["verses"]}" '
        f'data-density="{r["density"]:.4f}" data-n="{r["n"]}" '
        f'data-s="{htmllib.escape(r["en"].lower() + " " + r["ar"] + " " + ar_fold(r["ar"]))}">'
        f'<td class="rank">{r["n"]}</td>'
        f'<td class="sname" lang="ar" dir="rtl">{r["ar"]}</td>'
        f'<td class="sen">{htmllib.escape(r["en"])}</td>'
        f'<td class="num">{r["verses"]:,}</td>'
        f'<td class="num">{r["words"]:,}</td>'
        f'<td class="num">{r["rootwords"]:,}</td>'
        f'<td class="num"><b>{r["roots"]:,}</b></td>'
        f'<td class="bar"><span style="width:{r["roots"] / max_roots * 100:.3f}%"></span></td>'
        f'<td class="num">{r["density"]:.1f}</td>'
        f"</tr>"
    )

# ----------------------------------------------------------- letter group table
letter_stats = []
for letter, (name, theme) in LETTERS.items():
    roots = [r for r, _ in ranked if r[0] == letter]
    letter_stats.append({
        "letter": letter,
        "name": name,
        "theme": theme,
        "roots": roots,
        "n_roots": len(roots),
        "occurrences": sum(count[r] for r in roots),
        "glossed": sum(1 for r in roots if r in GLOSS),
    })
letter_stats.sort(key=lambda g: -g["occurrences"])
max_letter = letter_stats[0]["occurrences"]


def chip(root, with_gloss=True):
    gloss = GLOSS.get(root, "") if with_gloss else ""
    return (
        f'<span class="chip"><b lang="ar" dir="rtl">{root}</b>'
        f'{" " + htmllib.escape(gloss) if gloss else ""}'
        f' <i>&times;{count[root]:,}</i></span>'
    )


letter_rows = []
for g in letter_stats:
    letter = g["letter"]
    clustered = {r for _, roots in CLUSTERS[letter] for r in roots}
    blocks = []
    for label, roots in CLUSTERS[letter]:
        roots = sorted(roots, key=lambda r: -count[r])
        blocks.append(
            f'<div class="cluster"><div class="clabel">{htmllib.escape(label)}'
            f'<u>{len(roots)} {"root" if len(roots) == 1 else "roots"} · '
            f'{sum(count[r] for r in roots):,}&times;</u></div>'
            f'<div class="chips">{"".join(chip(r) for r in roots)}</div></div>'
        )
    rest = [r for r in g["roots"] if r not in clustered]
    if rest:
        blocks.append(
            f'<div class="cluster"><div class="clabel rest">Sense not yet assigned'
            f'<u>{len(rest)} roots · {sum(count[r] for r in rest):,}&times;</u></div>'
            f'<div class="chips">'
            f'{"".join(chip(r, with_gloss=False) for r in rest)}</div></div>'
        )
    search = f"{letter} {g['name'].lower()} {g['theme'].lower()}"
    is_first = letter == letter_stats[0]["letter"]
    letter_rows.append(
        f'<tr class="L{" open" if is_first else ""}" data-s="{htmllib.escape(search)}">'
        f'<td class="letter" lang="ar" dir="rtl">{letter}</td>'
        f'<td class="lname">{g["name"]}</td>'
        f'<td class="theme">{htmllib.escape(g["theme"])}</td>'
        f'<td class="num">{g["n_roots"]}</td>'
        f'<td class="num">{g["occurrences"]:,}</td>'
        f'<td class="bar"><span style="width:'
        f'{g["occurrences"] / max_letter * 100:.3f}%"></span></td>'
        f'<td class="num surahs">{len(CLUSTERS[letter])} <em>&#9662;</em></td>'
        f"</tr>"
        f'<tr class="d"{" hidden" if not is_first else ""}>'
        f'<td colspan="7">{"".join(blocks)}</td></tr>'
    )

letter_diagram_data = []
for g in letter_stats:
    letter = g["letter"]
    clusters = []
    for label, roots in CLUSTERS[letter]:
        roots_sorted = sorted(roots, key=lambda r: -count[r])
        clusters.append({
            "label": label,
            "occ": sum(count[r] for r in roots_sorted),
            "roots": [{"r": r, "g": GLOSS.get(r, ""), "n": count[r]} for r in roots_sorted],
        })
    letter_diagram_data.append({
        "letter": letter,
        "name": g["name"],
        "theme": g["theme"],
        "n": g["n_roots"],
        "occ": g["occurrences"],
        "clusters": clusters,
    })

# Named prophets in the Qur'an, keyed to the corpus PN lemma so the
# occurrence counts stay a straight tally of those tags.
# Ahmad is the same person as Muhammad (61:6); both lemmas sit on one node.
PROPHET_CATALOG = [
    ("آدَم", "آدم", "Adam"),
    ("إِدْرِيس", "إدريس", "Idris"),
    ("نُوح", "نوح", "Nuh"),
    ("هُود", "هود", "Hud"),
    ("صالِح", "صالح", "Salih"),
    ("إِبْراهِيم", "إبراهيم", "Ibrahim"),
    ("لُوط", "لوط", "Lut"),
    ("إِسْماعِيل", "إسماعيل", "Ismail"),
    ("إِسْحاق", "إسحاق", "Ishaq"),
    ("يَعْقُوب", "يعقوب", "Yaqub"),
    ("يُوسُف", "يوسف", "Yusuf"),
    ("شُعَيْب", "شعيب", "Shuayb"),
    ("أَيُّوب", "أيوب", "Ayyub"),
    ("مُوسَى", "موسى", "Musa"),
    ("هارُون", "هارون", "Harun"),
    ("داوُد", "داود", "Dawud"),
    ("سُلَيْمان", "سليمان", "Sulayman"),
    ("إِلْياس", "إلياس", "Ilyas"),
    ("الْيَسَع", "اليسع", "Al-Yasa"),
    ("يُونُس", "يونس", "Yunus"),
    ("زَكَرِيّا", "زكريا", "Zakariya"),
    ("يَحْيَى", "يحيى", "Yahya"),
    ("عِيسَى", "عيسى", "Isa"),
    ("مُحَمَّد", "محمد", "Muhammad"),
]

PROPHET_ALIASES = {"مُحَمَّد": ["أَحْمَد"]}

pn_count = Counter()
pn_root = {}
for line in MORPH.read_text(encoding="utf-8").splitlines():
    cols = line.split("\t")
    if len(cols) < 4 or "PN|" not in cols[3]:
        continue
    lem = re.search(r"LEM:([^|]+)", cols[3])
    if not lem:
        continue
    pn_count[lem.group(1)] += 1
    tagged = re.search(r"ROOT:([^|]+)", cols[3])
    if tagged:
        pn_root[lem.group(1)] = tagged.group(1)


def prophet_name_letter(display):
    # Strip only a written definite article, not hamza+lam in إلياس / إسماعيل.
    if display.startswith(("ال", "ٱل")):
        display = display[2:]
    ch = ar_fold(display)[0]
    return "أ" if ch == "ا" else ch


def item_name_letter(display):
    # Allah and Allat keep their alif; اليسع is "Yasa" after the article.
    if display.startswith(("اللَّه", "الله", "اللّات")):
        return "أ"
    if "يسع" in display:
        return "ي"
    if display.startswith(("ال", "ٱل")):
        display = display[2:]
    ch = ar_fold(display)[0]
    return "أ" if ch == "ا" else ch


def name_links(arabic, root, extra_letters=()):
    via = defaultdict(list)
    via[item_name_letter(arabic)].append("name")
    for letter in extra_letters:
        via[letter].append("name")
    if root:
        via[root[0]].append("root")
    links = []
    for letter, how in via.items():
        assert letter in LETTERS, f"{arabic} maps to unknown letter {letter}"
        how = list(dict.fromkeys(how))
        links.append({
            "letter": letter,
            "theme": LETTERS[letter][1],
            "how": how,
            "root": root if "root" in how else "",
        })
    return links


prophet_diagram_data = []
for lemma, arabic, english in PROPHET_CATALOG:
    assert lemma in pn_count, f"prophet lemma missing from corpus: {lemma}"
    occ = pn_count[lemma]
    root = pn_root.get(lemma)
    extra = []
    for alias in PROPHET_ALIASES.get(lemma, []):
        assert alias in pn_count, alias
        occ += pn_count[alias]
        if alias in pn_root:
            root = root or pn_root[alias]
        extra.append(item_name_letter("أحمد") if alias == "أَحْمَد" else item_name_letter(alias))
    prophet_diagram_data.append({
        "en": english,
        "ar": arabic,
        "occ": occ,
        "root": root or "",
        "links": name_links(arabic, root, extra),
    })

# Dhul-Qarnayn is not a PN tag: the corpus splits ذو + القرنين (18:83, 86, 94).
dq_occ = 0
for line in MORPH.read_text(encoding="utf-8").splitlines():
    cols = line.split("\t")
    if len(cols) < 4:
        continue
    loc, form, feats = cols[0], cols[1], cols[3]
    s, v = loc.split(":")[:2]
    if s == "18" and v in ("83", "86", "94") and "LEM:قَرْن" in feats and "قَرْنَيْن" in form:
        dq_occ += 1
assert dq_occ == 3, dq_occ
prophet_diagram_data.append({
    "en": "Dhul-Qarnayn",
    "ar": "ذو القرنين",
    "occ": dq_occ,
    "root": "قرن",
    "links": name_links("ذو القرنين", "قرن"),
})

# Every proper-name lemma the corpus tags, plus Dhul-Qarnayn.
NAME_EN = {
    "اللَّه": "Allah", "مُوسَى": "Musa", "شَيْطان": "Satan", "جَهَنَّم": "Jahannam",
    "فِرْعَوْن": "Pharaoh", "إِبْراهِيم": "Ibrahim", "قُرْءان": "Quran",
    "جَنَّة": "Garden", "إِسْرائِيل": "Israel", "نُوح": "Nuh", "مَرْيَم": "Maryam",
    "يُوسُف": "Yusuf", "لُوط": "Lut", "ثَمُود": "Thamud", "آدَم": "Adam",
    "عِيسَى": "Isa", "عاد": "Aad", "هارُون": "Harun", "تَوْراة": "Torah",
    "سُلَيْمان": "Sulayman", "إِسْحاق": "Ishaq", "يَعْقُوب": "Yaqub",
    "داوُد": "Dawud", "نَصْرانِيّ": "Nazarenes", "مُسْلِم": "Muslim",
    "إِسْماعِيل": "Ismail", "إِنجِيل": "Injil", "إِبْلِيس": "Iblis",
    "مَسِيح": "Messiah", "شُعَيْب": "Shuayb", "عَدْن": "Adn", "هُود": "Hud",
    "مَدْيَن": "Madyan", "يَهُود": "Jews", "صالِح": "Salih", "زَكَرِيّا": "Zakariya",
    "إِسْلام": "Islam", "هامان": "Haman", "يَحْيَى": "Yahya", "مُحَمَّد": "Muhammad",
    "أَيُّوب": "Ayyub", "يُونُس": "Yunus", "مَدِينَة": "City", "مِصْر": "Egypt",
    "قارُون": "Qarun", "سَقَر": "Saqar", "صابِئ": "Sabians", "جِبْرِيل": "Jibril",
    "جالُوت": "Goliath", "عِمْران": "Imran", "زَبُور": "Zabur", "جاهِلِيَّة": "Jahiliyyah",
    "إِلْياس": "Ilyas", "سامِرِيّ": "Samiri", "زَقُّوم": "Zaqqum", "طالُوت": "Talut",
    "كَعْبَة": "Kabah", "الْيَسَع": "Al-Yasa", "يَأْجُوج": "Yajuj", "مَأْجُوج": "Majuj",
    "فِرْدَوْس": "Firdaws", "إِدْرِيس": "Idris", "سَبَإ": "Saba", "لُقْمان": "Luqman",
    "تُبَّع": "Tubba", "مِيكال": "Mikail", "بابِل": "Babylon", "هارُوت": "Harut",
    "مارُوت": "Marut", "صَفا": "Safa", "مَرْوَة": "Marwah", "رَمَضان": "Ramadan",
    "عَرَفات": "Arafat", "سِلْم": "Silm", "بَكَّة": "Bakkah", "بَدْر": "Badr",
    "آزَر": "Azar", "حُنَيْن": "Hunayn", "عُزَيْر": "Uzayr", "جُودِيّ": "Judi",
    "مَجُوس": "Magians", "سَيْناء": "Sinai", "رُوم": "Romans", "يَثْرِب": "Yathrib",
    "زَيْد": "Zayd", "بَعْل": "Baal", "مالِك": "Malik", "أَحْقاف": "Ahqaf",
    "مَكَّة": "Makkah", "اللّات": "Allat", "الْعُزَّى": "Uzza", "مَناة": "Manat",
    "شِعْرَى": "Sirius", "أَحْمَد": "Ahmad", "جُمُعَة": "Jumuah", "لَظَى": "Laza",
    "وَدّ": "Wadd", "سُواع": "Suwa", "يَغُوث": "Yaghuth", "يَعُوق": "Yauq",
    "نَسْر": "Nasr", "سَلْسَبِيل": "Salsabil", "إِرَم": "Iram", "سِينِين": "Sinin",
    "قُرَيْش": "Quraysh",
}

NAME_SKIP = {"اللَّهُمَّ", "أَحْمَد"}  # folded into Allah and Muhammad
NAME_MERGE = {"اللَّه": ["اللَّهُمَّ"], "مُحَمَّد": ["أَحْمَد"]}

missing = [lem for lem in pn_count if lem not in NAME_EN and lem not in NAME_SKIP]
assert not missing, f"NAME_EN missing {missing}"

name_diagram_data = []
for lemma, occ in pn_count.most_common():
    if lemma in NAME_SKIP:
        continue
    root = pn_root.get(lemma)
    extra = []
    for alias in NAME_MERGE.get(lemma, []):
        occ += pn_count[alias]
        if alias in pn_root:
            root = root or pn_root[alias]
        extra.append(item_name_letter("أحمد") if alias == "أَحْمَد" else item_name_letter(alias))
    arabic = lemma
    english = NAME_EN[lemma]
    name_diagram_data.append({
        "en": english,
        "ar": arabic,
        "occ": occ,
        "root": root or "",
        "links": name_links(arabic if lemma != "اللَّه" else "اللَّه", root, extra),
    })
name_diagram_data.append({
    "en": "Dhul-Qarnayn",
    "ar": "ذو القرنين",
    "occ": dq_occ,
    "root": "قرن",
    "links": name_links("ذو القرنين", "قرن"),
})
name_diagram_data.sort(key=lambda n: -n["occ"])

# The traditional 99 Beautiful Names (al-Asma al-Husna). Occurrences are
# lemma tallies from the morphology file when that exact form is tagged;
# names without a matching lemma still appear, linked by letter and root.
lemma_occ = Counter()
for _root, ctr in lemmas.items():
    for lem, n in ctr.items():
        lemma_occ[lem] += n

# (Arabic display, English, root, corpus lemma or "")
ASMA_CATALOG = [
    ("الرَّحْمٰن", "The Most Merciful", "رحم", "رَحْمٰن"),
    ("الرَّحِيم", "The Especially Merciful", "رحم", "رَحِيم"),
    ("المَلِك", "The King", "ملك", "مَلِك"),
    ("القُدُّوس", "The Most Holy", "قدس", "قُدُّوس"),
    ("السَّلام", "The Source of Peace", "سلم", "سَلام"),
    ("المُؤْمِن", "The Guardian of Faith", "أمن", "مُؤْمِن"),
    ("المُهَيْمِن", "The Protector", "همن", "مُهَيْمِن"),
    ("العَزِيز", "The Almighty", "عزز", "عَزِيز"),
    ("الجَبَّار", "The Compeller", "جبر", "جَبّار"),
    ("المُتَكَبِّر", "The Supreme", "كبر", "مُتَكَبِّر"),
    ("الخالِق", "The Creator", "خلق", "خالِق"),
    ("البارِئ", "The Originator", "برأ", "بارِئ"),
    ("المُصَوِّر", "The Fashioner", "صور", "مُصَوِّر"),
    ("الغَفّار", "The Perpetual Forgiver", "غفر", "غَفّار"),
    ("القَهّار", "The Subduer", "قهر", "قَهّار"),
    ("الوَهّاب", "The Bestower", "وهب", "وَهّاب"),
    ("الرَّزّاق", "The Provider", "رزق", "رَزّاق"),
    ("الفَتّاح", "The Opener", "فتح", "فَتّاح"),
    ("العَلِيم", "The All-Knowing", "علم", "عَلِيم"),
    ("القابِض", "The Withholder", "قبض", ""),
    ("الباسِط", "The Extender", "بسط", "باسِط"),
    ("الخافِض", "The Abaser", "خفض", ""),
    ("الرافِع", "The Exalter", "رفع", "رافِع"),
    ("المُعِزّ", "The Honourer", "عزز", ""),
    ("المُذِلّ", "The Dishonourer", "ذلل", ""),
    ("السَّمِيع", "The All-Hearing", "سمع", "سَمِيع"),
    ("البَصِير", "The All-Seeing", "بصر", "بَصِير"),
    ("الحَكَم", "The Judge", "حكم", "حَكَم"),
    ("العَدْل", "The Just", "عدل", "عَدْل"),
    ("اللَّطِيف", "The Subtle", "لطف", "لَطِيف"),
    ("الخَبِير", "The All-Aware", "خبر", "خَبِير"),
    ("الحَلِيم", "The Forbearing", "حلم", "حَلِيم"),
    ("العَظِيم", "The Magnificent", "عظم", "عَظِيم"),
    ("الغَفُور", "The Forgiving", "غفر", "غَفُور"),
    ("الشَّكُور", "The Appreciative", "شكر", "شَكُور"),
    ("العَلِيّ", "The Most High", "علو", "عَلِيّ"),
    ("الكَبِير", "The Greatest", "كبر", "كَبِير"),
    ("الحَفِيظ", "The Preserver", "حفظ", "حَفِيظ"),
    ("المُقِيت", "The Sustainer", "قوت", "مُقِيت"),
    ("الحَسِيب", "The Reckoner", "حسب", "حَسِيب"),
    ("الجَلِيل", "The Majestic", "جلل", ""),
    ("الكَرِيم", "The Generous", "كرم", "كَرِيم"),
    ("الرَّقِيب", "The Watchful", "رقب", "رَقِيب"),
    ("المُجِيب", "The Responsive", "جوب", "مُجِيب"),
    ("الواسِع", "The Vast", "وسع", "واسِع"),
    ("الحَكِيم", "The Wise", "حكم", "حَكِيم"),
    ("الوَدُود", "The Loving", "ودد", "وَدُود"),
    ("المَجِيد", "The Glorious", "مجد", "مَجِيد"),
    ("الباعِث", "The Resurrector", "بعث", ""),
    ("الشَّهِيد", "The Witness", "شهد", "شَهِيد"),
    ("الحَقّ", "The Truth", "حقق", "حَقّ"),
    ("الوَكِيل", "The Trustee", "وكل", "وَكِيل"),
    ("القَوِيّ", "The Strong", "قوي", "قَوِيّ"),
    ("المَتِين", "The Firm", "متن", "مَتِين"),
    ("الوَلِيّ", "The Protecting Friend", "ولي", "وَلِيّ"),
    ("الحَمِيد", "The Praiseworthy", "حمد", "حَمِيد"),
    ("المُحْصِي", "The Counter", "حصي", ""),
    ("المُبْدِئ", "The Initiator", "بدأ", ""),
    ("المُعِيد", "The Restorer", "عود", ""),
    ("المُحْيِي", "The Giver of Life", "حيي", ""),
    ("المُمِيت", "The Taker of Life", "موت", ""),
    ("الحَيّ", "The Ever-Living", "حيي", "حَيّ"),
    ("القَيُّوم", "The Self-Subsisting", "قوم", "قَيُّوم"),
    ("الواجِد", "The Finder", "وجد", ""),
    ("الماجِد", "The Noble", "مجد", ""),
    ("الواحِد", "The One", "وحد", "واحِد"),
    ("الأَحَد", "The Unique", "أحد", "أَحَد"),
    ("الصَّمَد", "The Eternal Refuge", "صمد", "صَمَد"),
    ("القادِر", "The Able", "قدر", "قادِر"),
    ("المُقْتَدِر", "The Powerful", "قدر", "مُقْتَدِر"),
    ("المُقَدِّم", "The Expediter", "قدم", ""),
    ("المُؤَخِّر", "The Delayer", "أخر", ""),
    ("الأَوَّل", "The First", "أول", "أَوَّل"),
    ("الآخِر", "The Last", "أخر", "آخِر"),
    ("الظّاهِر", "The Manifest", "ظهر", "ظاهِر"),
    ("الباطِن", "The Hidden", "بطن", "باطِن"),
    ("الوالِي", "The Governor", "ولي", ""),
    ("المُتَعالِي", "The Most Exalted", "علو", "مُتَعال"),
    ("البَرّ", "The Kind", "برر", "بَرّ"),
    ("التَّوّاب", "The Acceptor of Repentance", "توب", "تَوّاب"),
    ("المُنْتَقِم", "The Avenger", "نقم", "مُنتَقِم"),
    ("العَفُوّ", "The Pardoner", "عفو", "عَفُوّ"),
    ("الرَّءُوف", "The Compassionate", "رأف", "رَءُوف"),
    ("مالِك المُلْك", "Owner of Sovereignty", "ملك", "مالِك"),
    ("ذُو الجَلالِ والإِكْرام", "Lord of Majesty and Honour", "جلل", ""),
    ("المُقْسِط", "The Equitable", "قسط", "مُقْسِط"),
    ("الجامِع", "The Gatherer", "جمع", "جامِع"),
    ("الغَنِيّ", "The Self-Sufficient", "غني", "غَنِيّ"),
    ("المُغْنِي", "The Enricher", "غني", "مُغْني"),
    ("المانِع", "The Preventer", "منع", ""),
    ("الضّارّ", "The Distresser", "ضرر", "ضارّ"),
    ("النّافِع", "The Benefactor", "نفع", ""),
    ("النُّور", "The Light", "نور", "نُور"),
    ("الهادِي", "The Guide", "هدي", "هادِي"),
    ("البَدِيع", "The Incomparable", "بدع", "بَدِيع"),
    ("الباقِي", "The Everlasting", "بقي", ""),
    ("الوارِث", "The Inheritor", "ورث", "وارِث"),
    ("الرَّشِيد", "The Guide to the Right Path", "رشد", "رَشِيد"),
    ("الصَّبُور", "The Patient", "صبر", ""),
]
assert len(ASMA_CATALOG) == 99, len(ASMA_CATALOG)

asma_diagram_data = []
for arabic, english, root, lemma in ASMA_CATALOG:
    assert root in count, f"Asma root missing from Qur'an: {root} ({english})"
    assert root[0] in LETTERS, f"Asma root letter unknown: {root}"
    if lemma:
        assert lemma in lemma_occ, f"Asma lemma not in corpus: {lemma} ({english})"
        occ = lemma_occ[lemma]
    else:
        occ = 0
    asma_diagram_data.append({
        "en": english,
        "ar": arabic,
        "occ": occ,
        "root": root,
        "links": name_links(arabic, root),
    })
assert len(asma_diagram_data) == 99

# --------------------------------------------------------------- embedded data
root_surah_data = [
    [[s, c] for s, c in root_surah[root].most_common()] for root, _ in ranked
]
names_data = [[r["n"], r["ar"], r["en"]] for r in surah_stats]

top3 = by_roots[:3]
top3_text = ", ".join(f"{r['en']} ({r['roots']:,})" for r in top3)

page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Al-Quran — Root Word Frequency</title>
<style>
:root {{
  --color-bg: lightyellow;
  --color-surah-title: purple;
  --color-verse-label: red;
  --color-arabic: green;
  --color-translation: blue;
  --color-rule: #d8d4a8;
}}

body {{
  background-color: var(--color-bg);
  color: #333;
  font-family: Georgia, "Times New Roman", serif;
  margin: 0 auto;
  max-width: 1150px;
  padding: 24px 18px 64px;
}}

h1 {{
  color: var(--color-surah-title);
  margin: 0 0 4px;
  text-align: center;
}}

h2 {{
  border-bottom: 2px solid var(--color-rule);
  color: var(--color-surah-title);
  margin: 46px 0 6px;
  padding-bottom: 6px;
}}

h2:first-of-type {{ margin-top: 34px; }}

.subtitle {{
  color: var(--color-translation);
  margin: 0 0 22px;
  text-align: center;
}}

.subtitle a, .nav a {{ color: var(--color-translation); }}

.stats {{
  border-bottom: 2px solid var(--color-rule);
  border-top: 2px solid var(--color-rule);
  display: flex;
  flex-wrap: wrap;
  gap: 8px 32px;
  justify-content: center;
  margin-bottom: 20px;
  padding: 14px 0;
}}

.stats div {{ text-align: center; }}
.stats b {{
  color: var(--color-verse-label);
  display: block;
  font-size: 1.5em;
}}
.stats span {{ font-size: .85em; }}

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

.controls {{
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 14px 0 12px;
}}

input[type=search] {{
  border: 2px solid var(--color-rule);
  border-radius: 4px;
  flex: 1 1 240px;
  font-family: inherit;
  font-size: 1em;
  padding: 8px 10px;
}}

button {{
  background: var(--color-surah-title);
  border: 0;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: .95em;
  padding: 9px 14px;
}}

button:hover {{ opacity: .85; }}

.status {{ font-size: .85em; }}

table {{
  border-collapse: collapse;
  font-size: .95em;
  width: 100%;
}}

thead th {{
  background: var(--color-bg);
  border-bottom: 2px solid var(--color-rule);
  color: var(--color-surah-title);
  font-size: .8em;
  letter-spacing: .04em;
  position: sticky;
  text-align: left;
  text-transform: uppercase;
  top: 0;
}}

th, td {{ padding: 7px 9px; }}
tbody tr {{ border-bottom: 1px solid rgba(0, 0, 0, .07); }}
tr.r, tr.L, th.sortable {{ cursor: pointer; }}
tr.r:hover, tr.L:hover, #surahs tbody tr:hover {{ background: rgba(128, 0, 128, .06); }}
tr.L.open {{ background: rgba(128, 0, 128, .06); }}
th.sortable:hover {{ text-decoration: underline; }}
th.sorted::after {{ content: " \\25BC"; }}
th.sorted.asc::after {{ content: " \\25B2"; }}

.rank {{ color: #999; font-size: .85em; }}
.root {{
  color: var(--color-arabic);
  font-size: 1.5em;
  white-space: nowrap;
}}
.translit {{ color: #777; font-size: .85em; white-space: nowrap; }}
.gloss, .sen {{ color: var(--color-translation); font-size: .9em; }}
.num {{ text-align: right; white-space: nowrap; }}
.forms {{
  color: var(--color-arabic);
  font-size: 1.05em;
  text-align: right;
}}
.sname {{ color: var(--color-arabic); font-size: 1.25em; white-space: nowrap; }}
.surahs em {{ color: var(--color-surah-title); font-size: .8em; font-style: normal; }}
tr.r.open .surahs em {{ transform: rotate(180deg); }}

.bar {{ min-width: 120px; }}
.bar span {{
  background: var(--color-verse-label);
  display: inline-block;
  height: 9px;
  min-width: 1px;
  vertical-align: middle;
}}
.bar i {{ color: #999; font-size: .75em; font-style: normal; margin-left: 6px; }}

.letter {{
  color: var(--color-arabic);
  font-size: 2em;
  line-height: 1;
  text-align: center;
}}
.lname {{ color: #777; font-size: .85em; white-space: nowrap; }}
.theme {{ color: var(--color-surah-title); font-weight: bold; }}

.cluster {{ margin-bottom: 11px; }}
.cluster:last-child {{ margin-bottom: 0; }}
.clabel {{
  border-bottom: 1px solid var(--color-rule);
  color: var(--color-surah-title);
  font-size: .9em;
  margin-bottom: 6px;
  padding-bottom: 3px;
}}
.clabel.rest {{ color: #999; font-style: italic; }}
.clabel u {{
  color: #999;
  float: right;
  font-size: .82em;
  font-style: normal;
  text-decoration: none;
}}

tr.d > td {{ background: rgba(128, 0, 128, .04); padding: 10px 12px 12px; }}
.dhead {{ font-size: .8em; color: #777; margin-bottom: 7px; text-transform: uppercase; letter-spacing: .04em; }}
.chips {{ display: flex; flex-wrap: wrap; gap: 5px; }}
.chip {{
  background: #fff;
  border: 1px solid var(--color-rule);
  border-radius: 3px;
  font-size: .85em;
  padding: 3px 7px;
  white-space: nowrap;
}}
.chip b {{ color: var(--color-arabic); font-size: 1.15em; font-weight: normal; }}
.chip u {{ color: #999; text-decoration: none; }}
.chip i {{ color: var(--color-verse-label); font-style: normal; }}

.diagram-toolbar {{
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 12px 0 8px;
}}

.diagram-views {{ display: flex; flex-wrap: wrap; gap: 6px; }}

.diagram-views button {{
  background: transparent;
  border: 2px solid var(--color-surah-title);
  color: var(--color-surah-title);
  white-space: nowrap;
}}

.diagram-views button[aria-pressed="true"] {{
  background: var(--color-surah-title);
  color: #fff;
}}

.diagram-letter-pick {{
  color: #666;
  font-size: .9em;
}}

.diagram-letter-pick select {{
  border: 2px solid var(--color-rule);
  font-family: inherit;
  font-size: 1em;
  margin-left: 6px;
  padding: 6px 8px;
}}

#diagram-caption {{
  color: #666;
  font-size: .9em;
  margin: 0 0 8px;
}}

#diagram-wrap {{
  background: rgba(128, 0, 128, .04);
  border: 2px solid var(--color-rule);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}}

#diagram {{ display: block; width: 100%; }}

#diagram [data-on="0"] {{ opacity: .55; }}
#diagram [data-on="1"] {{ opacity: 1; }}

#diagram-tip {{
  background: #fff;
  border: 1px solid var(--color-rule);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, .12);
  font-size: .85em;
  line-height: 1.4;
  max-width: 240px;
  padding: 7px 9px;
  pointer-events: none;
  position: absolute;
  z-index: 3;
}}

#diagram-detail {{ margin-top: 12px; }}
#diagram-detail .chip {{ white-space: normal; }}

.diagram-picked {{
  align-items: center;
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}}

.diagram-picked .letter {{ font-size: 2.4em; }}

.kw-toolbar {{
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0 4px;
}}
#kw-stop {{
  background: transparent;
  border: 2px solid var(--color-surah-title);
  color: var(--color-surah-title);
}}
#kw-voice-status {{ color: #666; font-size: .85em; }}
.kw-grid {{
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  margin-top: 14px;
}}
.kw-card {{
  background: #fffdf0;
  border: 1px solid var(--color-rule);
  border-radius: 8px;
  padding: 12px 10px 14px;
  text-align: center;
}}
.kw-card.playing {{
  border-color: var(--color-surah-title);
  box-shadow: 0 0 0 2px rgba(128, 0, 128, .22);
}}
.kw-letter {{
  color: var(--color-arabic);
  font-size: 2.6em;
  line-height: 1.1;
}}
.kw-name {{ color: #777; font-size: .85em; margin: 2px 0 4px; }}
.kw-word {{
  color: var(--color-arabic);
  font-size: 1.45em;
  line-height: 1.3;
  margin: 4px 0 2px;
}}
.kw-en {{
  color: var(--color-translation);
  font-size: .82em;
  line-height: 1.3;
  min-height: 2.4em;
}}
.kw-meta {{ color: #999; font-size: .78em; margin: 4px 0 8px; }}
.kw-meta b {{ font-weight: normal; }}
.kw-play {{ font-size: .85em; padding: 6px 12px; }}

@media (max-width: 900px) {{
  .bar, .forms, .sen {{ display: none; }}
}}
</style>
</head>
<body>

<h1>Root Words of the Qur'an</h1>
<p class="subtitle">All {len(ranked):,} Arabic roots, ranked by how often they occur<br>
<a href="#diagrams">diagrams</a> &nbsp;·&nbsp; <a href="#keywords">letter keywords</a>
&nbsp;·&nbsp; <a href="#letters-section">letter groups</a>
&nbsp;·&nbsp; <a href="#roots">every root</a> &nbsp;·&nbsp; <a href="#surahs-section">surahs</a>
&nbsp;·&nbsp; <a href="Al-Quran-Calculators.html">calculators</a>
&nbsp;·&nbsp; <a href="Al-Quran-Genealogy.html">genealogy &amp; places</a>
&nbsp;·&nbsp; <a href="Al-Quran-Angels.html">angels</a>
&nbsp;·&nbsp; <a href="Al-Quran-People.html">believers</a>
&nbsp;·&nbsp; <a href="Al-Quran.html">full text</a></p>

<div class="stats">
  <div><b>{len(ranked):,}</b><span>distinct roots</span></div>
  <div><b>{root_words:,}</b><span>root-bearing words</span></div>
  <div><b>{total_words:,}</b><span>words in total</span></div>
  <div><b>6,236</b><span>verses</span></div>
  <div><b>114</b><span>surahs</span></div>
</div>

<div class="note">
<p><b>What a root is.</b> Almost every Arabic word is built from a root of three or
four consonants. The root <span lang="ar" dir="rtl">ك ت ب</span> (<i>k-t-b</i>,
writing) yields <span lang="ar" dir="rtl">كِتاب</span> (book),
<span lang="ar" dir="rtl">كَتَبَ</span> (he wrote) and
<span lang="ar" dir="rtl">كاتِب</span> (scribe) — so counting roots rather than
words shows which <em>ideas</em> recur, not just which spellings.</p>
<p><b>How the counts were made.</b> Each of the {total_words:,} words of the Qur'an is
tagged with its root in the Quranic Arabic Corpus morphological annotation, and the
figures here are a straight tally of those tags. The remaining
{total_words - root_words:,} words are particles and pronouns
(<span lang="ar" dir="rtl">مِن</span>, <span lang="ar" dir="rtl">فِى</span>,
<span lang="ar" dir="rtl">ٱلَّذِين</span>) that carry no root, so they do not appear
below however frequent they are.</p>
<p><b>Glosses</b> are short indications of a root's core sense rather than
translations, and cover {len(GLOSS)} roots: the 100 most frequent, plus the leading
roots of each letter group below. Surah names are the ones used in
<a href="Al-Quran.html">Al-Quran.html</a>, with the common English name alongside.</p>
</div>

<h2 id="diagrams">Letter-group diagrams</h2>
<p class="note" style="border:0;background:none;padding:0;margin:0 0 4px">
The first four size letters by how often their roots occur. <em>Prophets</em>,
<em>Names</em>, and <em>99 Names</em> keep the theme wheel and draw a line from
each letter group to a name — solid if the name begins with that letter, dashed
if the name's root belongs to that group. <em>Names</em> covers every proper name
the corpus marks, plus Dhul-Qarnayn. <em>99 Names</em> is the traditional list of
the Beautiful Names of Allah; counts are lemma tallies where the corpus tags that
form. Switch diagrams with the buttons.</p>

<div class="diagram-toolbar">
  <div class="diagram-views" role="tablist">
    <button type="button" data-view="treemap" aria-pressed="true">Treemap</button>
    <button type="button" data-view="sunburst">Sunburst</button>
    <button type="button" data-view="bubbles">Bubbles</button>
    <button type="button" data-view="wheel">Theme wheel</button>
    <button type="button" data-view="prophets">Prophets</button>
    <button type="button" data-view="names">Names</button>
    <button type="button" data-view="asma">99 Names</button>
  </div>
  <label class="diagram-letter-pick">Letter
    <select id="diagram-letter"></select>
  </label>
</div>
<p id="diagram-caption"></p>
<div id="diagram-wrap">
  <svg id="diagram" role="img" aria-label="Letter-group diagram"></svg>
  <div id="diagram-tip" hidden></div>
</div>
<div id="diagram-detail"></div>

<h2 id="keywords">Letters as keywords</h2>
<p class="note" style="border:0;background:none;padding:0;margin:0 0 4px">
Each letter of the alphabet becomes one Qur'anic keyword: a frequent form of
the most common root that begins with that letter, chosen so the word itself
starts with the letter. Play a card to hear the letter's sound, its Arabic
name, and the keyword. Playback uses this browser's Arabic voice when one is
installed.</p>
<div class="kw-toolbar">
  <button type="button" id="kw-play-all">Play alphabet</button>
  <button type="button" id="kw-stop" hidden>Stop</button>
  <span id="kw-voice-status"></span>
</div>
<div class="kw-grid" id="kw-grid">
{chr(10).join(keyword_cards)}
</div>

<h2 id="letters-section">Roots grouped by first letter</h2>
<p class="note" style="border:0;background:none;padding:0;margin:0 0 4px">
Each letter gathers every root that begins with it. The <em>theme</em> is a
three-word summary of those roots' senses — letters themselves have no meaning.
Click a row to open the sense clusters inside that group; roots still without a
gloss sit unlabelled at the end.</p>

<table id="letters">
<thead>
<tr>
  <th>Letter</th><th>Name</th><th>Theme (3 words max)</th>
  <th class="num">Roots</th><th class="num">Occurrences</th>
  <th class="bar">Share</th><th class="num">Clusters</th>
</tr>
</thead>
<tbody>
{chr(10).join(letter_rows)}
</tbody>
</table>

<h2 id="roots">Every root, most frequent first</h2>
<p class="note" style="border:0;background:none;padding:0;margin:0 0 4px">
Click any row to see <b>which surahs</b> that root appears in, and how often in each.</p>

<div class="controls">
  <input id="filter" type="search" placeholder="Filter by root, transliteration, or meaning — try &quot;ktb&quot;, &quot;light&quot;, or كتب">
  <button id="toggle" type="button">Show all {len(ranked):,}</button>
  <span class="status" id="status"></span>
</div>

<table id="roots-table">
<thead>
<tr>
  <th>#</th><th>Root</th><th>Translit.</th><th>Sense</th>
  <th class="num">Occurrences</th><th class="bar">Share</th>
  <th class="num">Verses</th><th class="num">Surahs</th>
  <th class="forms">Common forms</th>
</tr>
</thead>
<tbody id="rows">
{chr(10).join(root_rows)}
</tbody>
</table>

<h2 id="surahs-section">Surahs with the richest root vocabulary</h2>
<p class="note" style="border:0;background:none;padding:0;margin:0 0 4px">
How many <em>different</em> roots each surah draws on. Leaders: {htmllib.escape(top3_text)}.
Click a column heading to re-sort — <i>roots per 100 words</i> favours short, dense surahs.</p>

<div class="controls">
  <input id="sfilter" type="search" placeholder="Find a surah — try &quot;kahf&quot;, &quot;Yusuf&quot;, or يوسف">
  <span class="status" id="sstatus"></span>
</div>

<table id="surahs">
<thead>
<tr>
  <th>Surah #</th><th>Name</th><th class="sen">English</th>
  <th class="num sortable" data-k="verses">Verses</th>
  <th class="num sortable" data-k="words">Words</th>
  <th class="num sortable" data-k="rootwords">Root words</th>
  <th class="num sortable sorted" data-k="roots">Distinct roots</th>
  <th class="bar">Share</th>
  <th class="num sortable" data-k="density">Roots / 100 words</th>
</tr>
</thead>
<tbody>
{chr(10).join(surah_rows)}
</tbody>
</table>

<script>
var ROOT_SURAHS = {json.dumps(root_surah_data, separators=(",", ":"))};
var SURAH_NAMES = {json.dumps(names_data, ensure_ascii=False, separators=(",", ":"))};
var LETTER_DATA = {json.dumps(letter_diagram_data, ensure_ascii=False, separators=(",", ":"))};
var PROPHET_DATA = {json.dumps(prophet_diagram_data, ensure_ascii=False, separators=(",", ":"))};
var NAME_DATA = {json.dumps(name_diagram_data, ensure_ascii=False, separators=(",", ":"))};
var ASMA_DATA = {json.dumps(asma_diagram_data, ensure_ascii=False, separators=(",", ":"))};
var LETTER_KEYWORDS = {json.dumps(letter_keywords, ensure_ascii=False, separators=(",", ":"))};
</script>
<script src="letter_diagrams.js?v=asma3"></script>
<script src="letter_keywords.js"></script>
<script>
(function () {{
  var names = {{}};
  SURAH_NAMES.forEach(function (s) {{ names[s[0]] = {{ ar: s[1], en: s[2] }}; }});

  // Fold Persian letter forms and hamza variants so either spelling matches.
  function fold(text) {{
    return text.trim().toLowerCase()
      .replace(/[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]/g, '')
      .replace(/[\\u06CC\\u0649\\u0626]/g, '\\u064A')
      .replace(/\\u06A9/g, '\\u0643')
      .replace(/[\\u0623\\u0625\\u0622\\u0671]/g, '\\u0627')
      .replace(/\\u0629/g, '\\u0647')
      .replace(/\\u0624/g, '\\u0648')
      .replace(/\\u0621/g, '');
  }}

  // ---------------------------------------------------------- roots table
  var LIMIT = {DEFAULT_SHOWN};
  var rows = Array.prototype.slice.call(document.querySelectorAll('#rows tr.r'));
  var total = rows.length;
  var filter = document.getElementById('filter');
  var toggle = document.getElementById('toggle');
  var status = document.getElementById('status');
  var showAll = false;

  function detailOf(row) {{ return row.nextElementSibling; }}

  function fill(row) {{
    var list = ROOT_SURAHS[+row.dataset.i];
    var chips = list.map(function (pair) {{
      var s = names[pair[0]];
      return '<span class="chip"><u>' + pair[0] + '</u> <b lang="ar" dir="rtl">' +
        s.ar + '</b> ' + s.en + ' <i>&times;' + pair[1] + '</i></span>';
    }}).join('');
    detailOf(row).firstElementChild.innerHTML =
      '<div class="dhead">Occurs in ' + list.length +
      (list.length === 1 ? ' surah' : ' surahs') + ', most frequent first</div>' +
      '<div class="chips">' + chips + '</div>';
    row.dataset.filled = '1';
  }}

  function render() {{
    var q = fold(filter.value);
    var shown = 0;
    rows.forEach(function (row) {{
      var hit = !q || row.dataset.s.indexOf(q) !== -1;
      var room = q || showAll || shown < LIMIT;
      row.hidden = !(hit && room);
      if (!row.hidden) shown++;
      detailOf(row).hidden = row.hidden || !row.classList.contains('open');
    }});
    toggle.hidden = !!q;
    status.textContent = q
      ? shown + ' of ' + total + ' roots match'
      : 'showing ' + shown + ' of ' + total + ' roots';
  }}

  document.getElementById('rows').addEventListener('click', function (e) {{
    var row = e.target.closest('tr.r');
    if (!row) return;
    if (!row.dataset.filled) fill(row);
    row.classList.toggle('open');
    detailOf(row).hidden = !row.classList.contains('open');
  }});

  filter.addEventListener('input', render);
  toggle.addEventListener('click', function () {{
    showAll = !showAll;
    toggle.textContent = showAll ? 'Show top ' + LIMIT : 'Show all ' + total.toLocaleString();
    render();
  }});
  render();

  // --------------------------------------------------------- letter groups
  document.querySelector('#letters tbody').addEventListener('click', function (e) {{
    var row = e.target.closest('tr.L');
    if (!row) return;
    row.classList.toggle('open');
    row.nextElementSibling.hidden = !row.classList.contains('open');
  }});

  // --------------------------------------------------------- surahs table
  var sTable = document.getElementById('surahs');
  var sBody = sTable.tBodies[0];
  var sRows = Array.prototype.slice.call(sBody.rows);
  var sFilter = document.getElementById('sfilter');
  var sStatus = document.getElementById('sstatus');

  function sRender() {{
    var q = fold(sFilter.value);
    var shown = 0;
    sRows.forEach(function (row) {{
      row.hidden = !!q && row.dataset.s.indexOf(q) === -1;
      if (!row.hidden) shown++;
    }});
    sStatus.textContent = q ? shown + ' of 114 surahs match' : '';
  }}

  sFilter.addEventListener('input', sRender);

  sTable.querySelectorAll('th.sortable').forEach(function (th) {{
    th.addEventListener('click', function () {{
      var key = th.dataset.k;
      var asc = th.classList.contains('sorted') && !th.classList.contains('asc');
      sTable.querySelectorAll('th').forEach(function (h) {{
        h.classList.remove('sorted', 'asc');
      }});
      th.classList.add('sorted');
      if (asc) th.classList.add('asc');
      sRows.sort(function (a, b) {{
        var d = parseFloat(a.dataset[key]) - parseFloat(b.dataset[key]);
        return asc ? d : -d;
      }});
      sRows.forEach(function (r) {{ sBody.appendChild(r); }});
    }});
  }});
}})();
</script>

</body>
</html>
"""

DST.write_text(page, encoding="utf-8")
print(f"wrote {DST} ({DST.stat().st_size:,} bytes)")
print(f"roots={len(ranked)} root_words={root_words} words={total_words}")
print(f"asma={len(asma_diagram_data)} with_lemma={sum(1 for a in asma_diagram_data if a['occ'])}")
print("letter keywords:")
for k in letter_keywords:
    print(f"  {k['letter']} {k['arName']:<4} → {k['keyword']}  ({k['root']}, {k['occ']})")
print("top surahs by distinct roots:")
for r in by_roots[:5]:
    print(f"  {r['n']:>3} {r['en']:<12} roots={r['roots']:>4} rootwords={r['rootwords']:>5} words={r['words']:>5}")
print("top surahs by density:")
for r in sorted(surah_stats, key=lambda x: -x["density"])[:5]:
    print(f"  {r['n']:>3} {r['en']:<12} {r['density']:.1f} roots/100w (words={r['words']})")
