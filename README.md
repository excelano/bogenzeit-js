# bogenzeit-js

Bogenzeit for the web: compute and show [Bogenzeit](https://github.com/excelano/bogenzeit) — time read as a position on the Sun's arc rather than a count of hours — for any latitude and longitude. No dependencies, works in the browser or any JavaScript runtime.

This is the JavaScript counterpart to the Rust reference engine. Its solar times come from an independent NOAA-style calculation, accurate to about a minute, so a reading here can differ from the reference engine by a span or two. It is meant for a clock on a page, not for conformance.

## Drop it in

```html
<script src="bogenzeit.js"></script>
<div id="clock"></div>
<script>
  Bogenzeit.mount(document.getElementById('clock'), { lat: 29.76, lon: -95.37 });
</script>
```

`mount` renders a live reading — the span count and the anchor glyph — and refreshes it every second. It returns `{ stop() }` to cancel. Pass `{ unit: 'ks' }` for kiloseconds, or `{ decimals: 1 }` for a finer span.

The glyph is an inline `<svg class="bz-glyph">` drawn in `currentColor`; size it with CSS, for example `.bz-glyph { width: 1em; height: 1em; }`.

## Compute a reading yourself

```js
var r = Bogenzeit.at(new Date(), 29.76, -95.37);
// {
//   anchor: 'noon' | 'midnight',   the marker the reading is measured from
//   before: true | false,          is the anchor still to come?
//   spans:  0..100,                distance along the half-arc
//   ks:     Number,                the same distance in kiloseconds
//   events: { sunrise, noon, sunset, polar }
// }

Bogenzeit.format(r).number;              // "14"
Bogenzeit.format(r, { unit: 'ks' }).number; // "2.76 ks"
Bogenzeit.format(r).html;                // number + glyph, ready to insert
```

`Bogenzeit.events(date, lat, lon)` returns that day's `sunrise`, `noon`, and `sunset` as `Date` objects, with `polar` set to `'day'` or `'night'` when the Sun stays up or down all day.

## How a reading reads

A day is a circle. Split it in half and you have two arcs: the daytime, from sunrise up to noon down to sunset, and the night, from sunset down to midnight up to sunrise. Each half of an arc is 100 spans. A reading is how far you are from the nearest anchor — noon `☉` or midnight `○` — counted in spans; the number sits before the glyph while the anchor is still to come, and after it once it has passed. Spans stretch and shrink with the season, so the reading looks the same in summer and winter while the clock behind it changes. Kiloseconds are the fixed-length alternative: a flat thousand seconds.

## License

MIT. See [LICENSE](LICENSE).
