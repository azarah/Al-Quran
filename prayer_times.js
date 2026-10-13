/**
 * Prayer windows from SunCalc (same model as Prayer-TimeEstimate.html):
 * Fajr = dawn, Dhuhr = solar noon, Asr = shadow length, Maghrib = sunset, Isha = dusk.
 */
(function (global) {
  const DEFAULT = { lat: 41.8781, lon: -87.6298, label: "Chicago" };

  const PRAYERS = [
    { id: "fajr", label: "Fajr", short: "Fajr" },
    { id: "dhuhr", label: "Dhuhr", short: "Dhuhr" },
    { id: "asr", label: "Asr", short: "Asr" },
    { id: "maghrib", label: "Maghrib", short: "Maghrib" },
    { id: "isha", label: "Isha", short: "Isha" }
  ];

  function calculateAsrTime(date, lat, lon) {
    if (typeof SunCalc === "undefined") return null;
    const times = SunCalc.getTimes(date, lat, lon);
    const solarNoon = times.solarNoon ? new Date(times.solarNoon) : null;
    if (!solarNoon) return null;

    const noonPos = SunCalc.getPosition(solarNoon, lat, lon);
    const latRad = (lat * Math.PI) / 180;
    const noonAltDeg = (noonPos.altitude * 180) / Math.PI;
    const declDeg = lat - (90 - noonAltDeg);
    const declRad = (declDeg * Math.PI) / 180;
    const delta = Math.abs(latRad - declRad);
    const cotAsr = 1 + Math.tan(delta);
    const asrAltitudeDeg = (Math.atan(1 / cotAsr) * 180) / Math.PI;

    const startTime = new Date(solarNoon);
    const endTime = times.sunset
      ? new Date(times.sunset)
      : new Date(startTime.getTime() + 6 * 3600000);

    let low = startTime.getTime();
    let high = endTime.getTime();
    let bestTime = null;
    let bestDiff = Infinity;

    for (let i = 0; i < 50; i++) {
      const mid = new Date((low + high) / 2);
      const pos = SunCalc.getPosition(mid, lat, lon);
      const altDeg = (pos.altitude * 180) / Math.PI;
      const diff = Math.abs(altDeg - asrAltitudeDeg);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestTime = new Date(mid);
      }
      if (altDeg < asrAltitudeDeg) high = mid.getTime();
      else low = mid.getTime();
      if (Math.abs(high - low) < 1000) break;
    }
    return bestTime;
  }

  function validDate(d) {
    return d && !isNaN(new Date(d).getTime());
  }

  function daySchedule(date, lat, lon) {
    if (typeof SunCalc === "undefined") return null;
    const times = SunCalc.getTimes(date, lat, lon);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const timesNext = SunCalc.getTimes(next, lat, lon);

    const fajr = validDate(times.dawn) ? new Date(times.dawn) : null;
    const sunrise = validDate(times.sunrise) ? new Date(times.sunrise) : null;
    const dhuhr = validDate(times.solarNoon) ? new Date(times.solarNoon) : null;
    const asr = calculateAsrTime(date, lat, lon);
    const maghrib = validDate(times.sunset) ? new Date(times.sunset) : null;
    const isha = validDate(times.dusk) ? new Date(times.dusk) : null;
    const nextFajr = validDate(timesNext.dawn) ? new Date(timesNext.dawn) : null;

    return { fajr, sunrise, dhuhr, asr, maghrib, isha, nextFajr };
  }

  function currentFromSchedule(now, schedule) {
    if (!schedule) return null;
    const t = now.getTime();
    const { fajr, sunrise, dhuhr, asr, maghrib, isha, nextFajr } = schedule;

    if (fajr && sunrise && t >= fajr.getTime() && t < sunrise.getTime()) return PRAYERS[0];
    if (dhuhr && asr && t >= dhuhr.getTime() && t < asr.getTime()) return PRAYERS[1];
    if (asr && maghrib && t >= asr.getTime() && t < maghrib.getTime()) return PRAYERS[2];
    if (maghrib && isha && t >= maghrib.getTime() && t < isha.getTime()) return PRAYERS[3];
    if (isha && nextFajr && t >= isha.getTime() && t < nextFajr.getTime()) return PRAYERS[4];
    if (fajr && t < fajr.getTime()) return PRAYERS[4];
    return null;
  }

  const state = {
    lat: DEFAULT.lat,
    lon: DEFAULT.lon,
    placeLabel: DEFAULT.label,
    ready: typeof SunCalc !== "undefined"
  };

  function setLocation(lat, lon, label) {
    if (typeof lat === "number" && typeof lon === "number") {
      state.lat = lat;
      state.lon = lon;
      state.placeLabel = label || state.placeLabel;
    }
  }

  function current(now) {
    if (!state.ready) return null;
    const when = now instanceof Date ? now : new Date();
    const schedule = daySchedule(when, state.lat, state.lon);
    const prayer = currentFromSchedule(when, schedule);
    if (!prayer) return null;
    return {
      id: prayer.id,
      label: prayer.label,
      short: prayer.short
    };
  }

  function fmtLocalTime(date) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function nextBoundary(now) {
    if (!state.ready) return null;
    const when = now instanceof Date ? now : new Date();
    const s = daySchedule(when, state.lat, state.lon);
    if (!s) return null;
    const t = when.getTime();
    const ordered = [
      { prayer: PRAYERS[0], at: s.fajr },
      { prayer: PRAYERS[1], at: s.dhuhr },
      { prayer: PRAYERS[2], at: s.asr },
      { prayer: PRAYERS[3], at: s.maghrib },
      { prayer: PRAYERS[4], at: s.isha },
      { prayer: PRAYERS[0], at: s.nextFajr, nextDay: true }
    ];
    for (let i = 0; i < ordered.length; i++) {
      const row = ordered[i];
      if (row.at && t < row.at.getTime()) return { prayer: row.prayer, at: row.at };
    }
    return null;
  }

  function ariaLabel(prayer, now) {
    const cur = prayer || current(now);
    if (!cur) return "";
    return cur.label + " prayer time";
  }

  /** Blue sky palettes keyed to prayer / sun landmarks (RGB + RGBA stops). */
  const SKY = {
    night: {
      base: [6, 14, 32],
      cool: [22, 42, 78, 0.32],
      horizon: [38, 58, 95, 0.14],
      wash: [55, 85, 130, 0.025]
    },
    dawn: {
      base: [12, 32, 58],
      cool: [48, 88, 132, 0.38],
      horizon: [72, 118, 165, 0.2],
      wash: [110, 155, 200, 0.05]
    },
    morning: {
      base: [18, 52, 88],
      cool: [62, 118, 168, 0.44],
      horizon: [95, 150, 195, 0.26],
      wash: [150, 195, 230, 0.07]
    },
    day: {
      base: [24, 68, 112],
      cool: [78, 145, 192, 0.48],
      horizon: [105, 165, 210, 0.3],
      wash: [185, 215, 240, 0.09]
    },
    afternoon: {
      base: [20, 58, 98],
      cool: [68, 128, 172, 0.42],
      horizon: [88, 138, 182, 0.24],
      wash: [160, 195, 225, 0.075]
    },
    dusk: {
      base: [10, 26, 52],
      cool: [42, 72, 112, 0.36],
      horizon: [58, 92, 135, 0.22],
      wash: [90, 120, 165, 0.045]
    }
  };

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpRgb(c1, c2, t) {
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t))
    ];
  }

  function lerpRgba(c1, c2, t) {
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t)),
      lerp(c1[3], c2[3], t)
    ];
  }

  function blendPalette(p1, p2, t) {
    return {
      base: lerpRgb(p1.base, p2.base, t),
      cool: lerpRgba(p1.cool, p2.cool, t),
      horizon: lerpRgba(p1.horizon, p2.horizon, t),
      wash: lerpRgba(p1.wash, p2.wash, t)
    };
  }

  function hexRgb(rgb) {
    const h = function (n) {
      return n.toString(16).padStart(2, "0");
    };
    return "#" + h(rgb[0]) + h(rgb[1]) + h(rgb[2]);
  }

  function rgbaCss(rgba) {
    return "rgba(" + rgba[0] + "," + rgba[1] + "," + rgba[2] + "," + rgba[3].toFixed(3) + ")";
  }

  function pushMarker(list, at, key) {
    if (at) list.push({ at: at.getTime(), palette: SKY[key] });
  }

  function skyMarkersFor(now) {
    const s = daySchedule(now, state.lat, state.lon);
    if (!s) return [];
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    const sp = daySchedule(prev, state.lat, state.lon);

    const list = [];
    pushMarker(list, sp.isha, "night");
    pushMarker(list, s.fajr, "dawn");
    pushMarker(list, s.sunrise, "morning");
    pushMarker(list, s.dhuhr, "day");
    pushMarker(list, s.asr, "afternoon");
    pushMarker(list, s.maghrib, "dusk");
    pushMarker(list, s.isha, "night");
    pushMarker(list, s.nextFajr, "dawn");
    list.sort(function (a, b) {
      return a.at - b.at;
    });
    return list;
  }

  /** 0 = day, 1 = full night (twilight from sun altitude, aligned with prayer sky). */
  function nightStrength(now) {
    if (!state.ready) return 0;
    const when = now instanceof Date ? now : new Date();
    const pos = SunCalc.getPosition(when, state.lat, state.lon);
    const alt = pos.altitude;
    if (alt <= -0.14) return 1;
    if (alt >= 0.06) return 0;
    return Math.max(0, Math.min(1, (0.06 - alt) / 0.2));
  }

  function skyBlend(now) {
    if (!state.ready) return null;
    const when = now instanceof Date ? now : new Date();
    const markers = skyMarkersFor(when);
    if (!markers.length) return null;

    const t = when.getTime();
    let i = 0;
    while (i < markers.length - 1 && t >= markers[i + 1].at) i++;

    let palette;
    if (t < markers[0].at) palette = markers[0].palette;
    else if (i >= markers.length - 1) palette = markers[markers.length - 1].palette;
    else {
      const a = markers[i];
      const b = markers[i + 1];
      const span = b.at - a.at;
      const f = span > 0 ? (t - a.at) / span : 0;
      palette = blendPalette(a.palette, b.palette, Math.max(0, Math.min(1, f)));
    }

    return {
      base: palette.base.slice(),
      baseHex: hexRgb(palette.base),
      cool: rgbaCss(palette.cool),
      horizon: rgbaCss(palette.horizon),
      wash: rgbaCss(palette.wash)
    };
  }

  function tryGeolocation(onDone) {
    if (!navigator.geolocation) {
      if (onDone) onDone(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        setLocation(pos.coords.latitude, pos.coords.longitude, "Your location");
        if (onDone) onDone(true);
      },
      function () {
        if (onDone) onDone(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 86400000 }
    );
  }

  global.PrayerTimes = {
    DEFAULT,
    setLocation,
    current,
    nextBoundary,
    fmtLocalTime,
    ariaLabel,
    tryGeolocation,
    skyBlend,
    nightStrength,
    getLocation: function () {
      return { lat: state.lat, lon: state.lon, label: state.placeLabel };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
