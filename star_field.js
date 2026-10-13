/**
 * Pixel sky from HYG star catalog (RA/Dec).
 * Requires star_catalog_data.js.
 */
(function (global) {
  let catalog = null;

  function loadCatalogs() {
    if (global.STAR_CATALOG_HYG && Array.isArray(global.STAR_CATALOG_HYG.stars)) {
      catalog = global.STAR_CATALOG_HYG.stars;
    }
  }

  function init() {
    loadCatalogs();
  }

  function gmstRadians(date) {
    const JD = date.getTime() / 86400000 + 2440587.5;
    const T = (JD - 2451545.0) / 36525.0;
    let gmst =
      280.46061837 +
      360.98564736629 * (JD - 2451545.0) +
      0.000387933 * T * T -
      (T * T * T) / 38710000.0;
    gmst = ((gmst % 360) + 360) % 360;
    return (gmst * Math.PI) / 180;
  }

  function lstRadians(date, lonDeg) {
    const lon = (lonDeg * Math.PI) / 180;
    return (gmstRadians(date) + lon) % (Math.PI * 2);
  }

  /** Azimuth 0 = north, eastward positive (matches horizontal equatorial conversion). */
  function equatorialToHorizontal(ra, dec, latRad, lst) {
    const ha = lst - ra;
    const sinAlt =
      Math.sin(dec) * Math.sin(latRad) +
      Math.cos(dec) * Math.cos(latRad) * Math.cos(ha);
    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    const cosAlt = Math.cos(alt);
    if (cosAlt < 1e-8) return { alt, az: 0 };
    const cosAz =
      (Math.sin(dec) - sinAlt * Math.sin(latRad)) / (cosAlt * Math.cos(latRad));
    let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (Math.sin(ha) > 0) az = Math.PI * 2 - az;
    return { alt, az };
  }

  /** Same mapping as SunCalc moon pixels in priority-screensaver. */
  function horizontalToScreen(alt, az, w, h) {
    if (alt < -0.02) return null;
    const sunAz = az - Math.PI;
    const x = w * (0.5 + 0.48 * Math.sin(sunAz + Math.PI) * Math.max(0.1, Math.cos(alt)));
    const y = h * (0.92 - 0.82 * (Math.max(0, alt) / (Math.PI * 0.5)));
    return { x, y };
  }

  function magToSize(mag) {
    if (mag < 0.5) return 3;
    if (mag < 1.8) return 2;
    if (mag < 3.4) return 2;
    return 1;
  }

  function magToAlpha(mag, night) {
    const flux = Math.pow(10, -0.4 * (mag - 1.4));
    return night * Math.min(0.98, flux * 0.55);
  }

  /** Per-star scintillation; fainter stars twinkle more (reduceMotion = steady). */
  function twinkle(tSec, ra, dec, mag, index, reduceMotion) {
    if (reduceMotion) return 1;
    const phase = ra * 17.17 + dec * 31.41 + index * 0.173;
    const f1 = 2.4 + (mag * 0.55) + (index % 11) * 0.09;
    const f2 = 4.8 + (index % 7) * 0.21;
    const f3 = 7.2 + (mag * 0.25);
    const wave =
      Math.sin(tSec * f1 + phase) * 0.42 +
      Math.sin(tSec * f2 + phase * 1.63) * 0.33 +
      Math.sin(tSec * f3 + phase * 0.47) * 0.25;
    const norm = 0.5 + 0.5 * wave;
    let floor = 0.22;
    if (mag < 1.5) floor = 0.72;
    else if (mag < 2.8) floor = 0.55;
    else if (mag < 4.2) floor = 0.38;
    return floor + (1 - floor) * norm;
  }

  function paintPixel(ctx, x, y, size, rgba) {
    ctx.fillStyle = rgba;
    ctx.fillRect(Math.round(x), Math.round(y), size, size);
  }

  function draw(ctx, w, h, tSec, night, now, lonDeg, reduceMotion) {
    if (night < 0.03) return;
    if (!catalog) loadCatalogs();
    if (!catalog || !catalog.length) return;

    const lat = global.PrayerTimes ? PrayerTimes.getLocation().lat : 42;
    const latRad = (lat * Math.PI) / 180;
    const lst = lstRadians(now, lonDeg);

    for (let i = 0; i < catalog.length; i++) {
      const row = catalog[i];
      const ra = row[0];
      const dec = row[1];
      const mag = row[2];
      const hor = equatorialToHorizontal(ra, dec, latRad, lst);
      const pt = horizontalToScreen(hor.alt, hor.az, w, h);
      if (!pt) continue;

      const tw = twinkle(tSec, ra, dec, mag, i, reduceMotion);
      const a = magToAlpha(mag, night) * tw;
      if (a < 0.025) continue;

      let size = magToSize(mag);
      if (!reduceMotion && mag > 3.8 && tw < 0.35) size = 1;
      const tint = mag < 2 ? "230, 240, 255" : "200, 218, 238";
      const jx = reduceMotion ? 0 : (Math.sin(tSec * 9.1 + ra * 40) * 0.35);
      const jy = reduceMotion ? 0 : (Math.cos(tSec * 8.3 + dec * 40) * 0.35);
      paintPixel(
        ctx,
        pt.x + jx,
        pt.y + jy,
        size,
        "rgba(" + tint + "," + Math.min(1, a).toFixed(3) + ")"
      );
    }

    if (typeof SunCalc !== "undefined" && night > 0.2) {
      drawMoonPixels(ctx, w, h, now, night, tSec, reduceMotion);
    }
  }

  function drawMoonPixels(ctx, w, h, now, night, tSec, reduceMotion) {
    const loc = global.PrayerTimes ? PrayerTimes.getLocation() : { lat: 42, lon: -88 };
    const moon = SunCalc.getMoonPosition(now, loc.lat, loc.lon);
    if (moon.altitude < -0.05) return;
    const alt = moon.altitude;
    const az = moon.azimuth + Math.PI;
    const cx = w * (0.5 + 0.44 * Math.sin(az) * Math.max(0.15, Math.cos(alt)));
    const cy = h * (0.38 - 0.32 * Math.sin(Math.max(0, alt)));
    const illum = SunCalc.getMoonIllumination(now).fraction;
    const pulse = reduceMotion ? 1 : 0.85 + 0.15 * Math.sin(tSec * 0.4);
    const a = night * (0.12 + illum * 0.35) * pulse;
    const r = 2 + Math.round(illum * 2);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + 0.5) continue;
        paintPixel(
          ctx,
          cx + dx * 2,
          cy + dy * 2,
          2,
          "rgba(210, 220, 235," + Math.min(0.75, a).toFixed(3) + ")"
        );
      }
    }
  }

  init();

  global.StarField = {
    init,
    draw,
    meta: function () {
      return global.STAR_CATALOG_HYG || null;
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
