/* Speak each Arabic letter as a Quranic keyword. Expects window.LETTER_KEYWORDS. */
(function () {
  var data = window.LETTER_KEYWORDS;
  var grid = document.getElementById("kw-grid");
  var playAll = document.getElementById("kw-play-all");
  var stopBtn = document.getElementById("kw-stop");
  var status = document.getElementById("kw-voice-status");
  if (!data || !data.length || !grid) return;

  var synth = window.speechSynthesis;
  if (!synth) {
    if (status) status.textContent = "This browser cannot speak audio.";
    grid.querySelectorAll(".kw-play").forEach(function (b) { b.disabled = true; });
    if (playAll) playAll.disabled = true;
    return;
  }

  var arabicVoice = null;
  var englishVoice = null;
  var queue = [];
  var run = 0;
  var held = null; // Chrome drops utterances that get garbage-collected.

  function pickVoices() {
    var voices = synth.getVoices() || [];
    var ar = voices.filter(function (v) { return /^ar(-|$)/i.test(v.lang); });
    arabicVoice =
      ar.filter(function (v) { return /SA|EG|AE|MA|DZ/i.test(v.lang); })[0] ||
      ar[0] ||
      null;
    englishVoice =
      voices.filter(function (v) { return /^en(-|$)/i.test(v.lang); })[0] ||
      null;
    if (!status) return;
    if (arabicVoice) {
      status.textContent = "Voice: " + arabicVoice.name;
    } else {
      status.textContent =
        "No Arabic voice found. Playback may use another language until you add one in the system speech settings.";
    }
  }

  pickVoices();
  if (typeof synth.onvoiceschanged !== "undefined") {
    synth.onvoiceschanged = pickVoices;
  }

  function cards() {
    return Array.prototype.slice.call(grid.querySelectorAll(".kw-card"));
  }

  function mark(index) {
    cards().forEach(function (card) {
      card.classList.toggle("playing", +card.dataset.i === index);
    });
  }

  function idle() {
    mark(-1);
    if (stopBtn) stopBtn.hidden = true;
    if (playAll) playAll.disabled = false;
  }

  function stop() {
    run += 1;
    queue = [];
    held = null;
    synth.cancel();
    idle();
  }

  function utter(text, lang, rate, voice) {
    var u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    if (voice) u.voice = voice;
    return u;
  }

  function phrasesFor(item) {
    var list = [
      utter(item.sound, "ar-SA", 0.7, arabicVoice),
      utter(item.arName, "ar-SA", 0.85, arabicVoice),
      utter(item.keyword, "ar-SA", 0.8, arabicVoice)
    ];
    if (item.keywordEn) {
      list.push(utter(item.keywordEn.split(";")[0], "en-US", 0.95, englishVoice));
    }
    return list;
  }

  function speakNext(runId) {
    if (runId !== run) return;
    if (!queue.length) {
      idle();
      return;
    }
    var step = queue.shift();
    mark(step.index);
    held = step.utterance;
    held.onend = function () {
      if (runId !== run) return;
      held = null;
      speakNext(runId);
    };
    held.onerror = function () {
      if (runId !== run) return;
      held = null;
      speakNext(runId);
    };
    synth.speak(held);
  }

  function playRange(from, to) {
    run += 1;
    var runId = run;
    queue = [];
    held = null;
    synth.cancel();
    if (stopBtn) stopBtn.hidden = false;
    if (playAll) playAll.disabled = true;
    for (var i = from; i < to; i++) {
      phrasesFor(data[i]).forEach(function (u) {
        queue.push({ index: i, utterance: u });
      });
    }
    // cancel() is async in Chrome; speaking immediately after it is dropped.
    setTimeout(function () {
      if (runId !== run) return;
      speakNext(runId);
    }, 60);
  }

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest(".kw-play");
    if (!btn) return;
    playRange(+btn.dataset.i, +btn.dataset.i + 1);
  });

  if (playAll) {
    playAll.addEventListener("click", function () {
      playRange(0, data.length);
    });
  }
  if (stopBtn) stopBtn.addEventListener("click", stop);
})();
