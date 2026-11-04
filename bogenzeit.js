(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Bogenzeit = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var RAD = Math.PI / 180;
    var DAY_MS = 86400000;
    var HALF_DAY_MS = 43200000;

    function julianCentury(date) {
        return ((date.getTime() / DAY_MS + 2440587.5) - 2451545) / 36525;
    }

    function solarData(t) {
        var L0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
        if (L0 < 0) { L0 += 360; }
        var M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
        var e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
        var C = Math.sin(M * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t))
              + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * t)
              + Math.sin(3 * M * RAD) * 0.000289;
        var trueLong = L0 + C;
        var omega = 125.04 - 1934.136 * t;
        var appLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
        var obliq = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
        var obliqCorr = obliq + 0.00256 * Math.cos(omega * RAD);
        var decl = Math.asin(Math.sin(obliqCorr * RAD) * Math.sin(appLong * RAD)) / RAD;
        var y = Math.tan(obliqCorr / 2 * RAD);
        y = y * y;
        var eqTime = 4 / RAD * (y * Math.sin(2 * L0 * RAD)
                   - 2 * e * Math.sin(M * RAD)
                   + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD)
                   - 0.5 * y * y * Math.sin(4 * L0 * RAD)
                   - 1.25 * e * e * Math.sin(2 * M * RAD));
        return { decl: decl, eqTime: eqTime };
    }

    function events(date, lat, lon) {
        var ref = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0));
        var sd = solarData(julianCentury(ref));
        var noonMin = 720 - 4 * lon - sd.eqTime;
        var cosH = Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(sd.decl * RAD))
                 - Math.tan(lat * RAD) * Math.tan(sd.decl * RAD);
        var base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
        function at(min) { return new Date(base + min * 60000); }
        var out = { noon: at(noonMin), sunrise: null, sunset: null, polar: null };
        if (cosH > 1) {
            out.polar = 'night';
        } else if (cosH < -1) {
            out.polar = 'day';
        } else {
            var ha = Math.acos(cosH) / RAD;
            out.sunrise = at(noonMin - 4 * ha);
            out.sunset = at(noonMin + 4 * ha);
        }
        return out;
    }

    function clampSpan(s) {
        if (s < 0) { return 0; }
        if (s > 100) { return 100; }
        return s;
    }

    function at(date, lat, lon) {
        var ev = events(date, lat, lon);
        var t = date.getTime();
        var noon = ev.noon.getTime();
        var midBefore = noon - HALF_DAY_MS;
        var midAfter = noon + HALF_DAY_MS;

        if (ev.polar) {
            var anchorT = ev.polar === 'day' ? noon : (t < noon ? midBefore : midAfter);
            return {
                polar: ev.polar,
                anchor: ev.polar === 'day' ? 'noon' : 'midnight',
                before: t <= anchorT,
                spans: null,
                ks: Math.abs(t - anchorT) / 1000000,
                events: ev
            };
        }

        var sr = ev.sunrise.getTime();
        var ss = ev.sunset.getTime();
        var spans, anchor, before, anchorT;

        if (t >= sr && t <= noon) {
            spans = (noon - t) / (noon - sr) * 100; anchor = 'noon'; before = true; anchorT = noon;
        } else if (t > noon && t <= ss) {
            spans = (t - noon) / (ss - noon) * 100; anchor = 'noon'; before = false; anchorT = noon;
        } else if (t > ss) {
            spans = (midAfter - t) / (midAfter - ss) * 100; anchor = 'midnight'; before = true; anchorT = midAfter;
        } else {
            spans = (t - midBefore) / (sr - midBefore) * 100; anchor = 'midnight'; before = false; anchorT = midBefore;
        }

        return {
            polar: null,
            anchor: anchor,
            before: before,
            spans: clampSpan(spans),
            ks: Math.abs(t - anchorT) / 1000000,
            events: ev
        };
    }

    function glyphSvg(anchor) {
        var inner = anchor === 'noon'
            ? '<circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="24" cy="24" r="5.5" fill="currentColor"/>'
            : '<circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="4"/>';
        return '<svg class="bz-glyph" viewBox="0 0 48 48" aria-hidden="true">' + inner + '</svg>';
    }

    function format(reading, opts) {
        opts = opts || {};
        var decimals = opts.decimals == null ? 0 : opts.decimals;
        var unit = opts.unit || 'spans';
        var glyph = glyphSvg(reading.anchor);
        if (reading.polar) {
            return { number: '', glyph: glyph, html: glyph };
        }
        var value = unit === 'ks' ? reading.ks.toFixed(2) : reading.spans.toFixed(decimals);
        var tail = unit === 'ks' ? ' ks' : '';
        var num = value + tail;
        var html = reading.before
            ? '<span class="bz-num">' + num + '</span> ' + glyph
            : glyph + ' <span class="bz-num">' + num + '</span>';
        return { number: num, glyph: glyph, html: html };
    }

    function mount(el, options) {
        options = options || {};
        var lat = options.lat;
        var lon = options.lon;
        var fmtOpts = { unit: options.unit || 'spans', decimals: options.decimals == null ? 0 : options.decimals };
        function tick() {
            var r = at(new Date(), lat, lon);
            el.innerHTML = format(r, fmtOpts).html;
        }
        tick();
        var id = setInterval(tick, options.interval || 1000);
        return { stop: function () { clearInterval(id); } };
    }

    return { at: at, format: format, events: events, glyphSvg: glyphSvg, mount: mount };
}));
