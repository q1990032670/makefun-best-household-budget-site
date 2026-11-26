// charts.js — Hearth & Ledger inline-SVG chart builders.
// One job: turn numbers into SVG strings (donut, bars, trend). No DOM state.

'use strict';

function donutChartSVG(entries, size) {
  // entries: [{label, value, color}] — returns an SVG donut with a legend list.
  var total = entries.reduce(function (s, e) { return s + e.value; }, 0);
  if (total <= 0) return '<p class="muted">No spending recorded yet.</p>';
  var r = 70, c = 2 * Math.PI * r, offset = 0, arcs = '';
  entries.forEach(function (e) {
    var frac = e.value / total;
    var dash = frac * c;
    arcs += '<circle cx="90" cy="90" r="' + r + '" fill="none" stroke="' + e.color +
      '" stroke-width="26" stroke-dasharray="' + dash.toFixed(1) + ' ' + (c - dash).toFixed(1) +
      '" stroke-dashoffset="' + (-offset).toFixed(1) + '" transform="rotate(-90 90 90)"><title>' +
      e.label + ': ' + money(e.value) + '</title></circle>';
    offset += dash;
  });
  var legend = entries.map(function (e) {
    var pct = Math.round((e.value / total) * 100);
    return '<li><span class="swatch" style="background:' + e.color + '"></span>' +
      e.label + ' — <strong>' + money(e.value) + '</strong> (' + pct + '%)</li>';
  }).join('');
  return '<div class="chart-flex"><svg viewBox="0 0 180 180" width="' + size + '" height="' + size +
    '" role="img" aria-label="Spending by category donut chart">' + arcs +
    '<text x="90" y="86" text-anchor="middle" class="donut-total">' + money(total) + '</text>' +
    '<text x="90" y="106" text-anchor="middle" class="donut-sub">spent in Nov</text></svg>' +
    '<ul class="legend">' + legend + '</ul></div>';
}

function envelopeBarSVG(spent, limit) {
  var pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  var cls = pct >= 100 ? 'bar over' : (pct >= 80 ? 'bar warn' : 'bar ok');
  return '<div class="bar-track" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' +
    '<div class="' + cls + '" style="width:' + pct + '%"></div></div>';
}

function trendChartSVG(rows) {
  // Grouped bars: income vs spent per month.
  var max = 0;
  rows.forEach(function (r) { max = Math.max(max, r.income, r.spent); });
  var w = 560, h = 220, base = 190, groupW = w / rows.length, bars = '', labels = '';
  rows.forEach(function (r, i) {
    var x = i * groupW + 14;
    var ih = Math.round((r.income / max) * 150), sh = Math.round((r.spent / max) * 150);
    bars += '<rect x="' + x + '" y="' + (base - ih) + '" width="24" height="' + ih + '" fill="#2f6f4e"><title>' +
      r.month + ' income ' + money(r.income) + '</title></rect>';
    bars += '<rect x="' + (x + 28) + '" y="' + (base - sh) + '" width="24" height="' + sh + '" fill="#e76f51"><title>' +
      r.month + ' spent ' + money(r.spent) + '</title></rect>';
    labels += '<text x="' + (x + 26) + '" y="' + (base + 18) + '" text-anchor="middle" class="axis-label">' + r.month + '</text>';
  });
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="trend-svg" role="img" aria-label="Income versus spending, last six months">' +
    '<line x1="0" y1="' + base + '" x2="' + w + '" y2="' + base + '" stroke="#cbbfa8"/>' + bars + labels + '</svg>' +
    '<p class="chart-key"><span class="swatch" style="background:#2f6f4e"></span> Income&nbsp;&nbsp;' +
    '<span class="swatch" style="background:#e76f51"></span> Spent</p>';
}
