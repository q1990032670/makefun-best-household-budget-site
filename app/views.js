// views.js — Hearth & Ledger page renderers.
// One job: build the HTML string for each view (dashboard, ledger, budgets,
// goals, bills, tools) from the state in data.js and charts in charts.js.

'use strict';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function viewDashboard() {
  var income = monthIncome(), spent = monthSpent(), saved = monthSaved();
  var left = income - spent - saved;
  var rate = income > 0 ? Math.round((saved / income) * 100) : 0;
  var spendCats = CATEGORIES.filter(function (c) { return c.kind === 'need' || c.kind === 'want'; })
    .map(function (c) { return { label: c.label, value: spentByCategory(c.id), color: c.color }; })
    .filter(function (e) { return e.value > 0; })
    .sort(function (a, b) { return b.value - a.value; });
  var upcoming = state.bills.slice().sort(function (a, b) { return a.day - b.day; }).slice(0, 4);
  var recent = state.transactions.slice(-5).reverse();
  var html = '<section class="hero"><h2>November 2026 at a glance</h2>' +
    '<p>The Alvarez household — Maya, Jordan, Leo (9) and Sofia (6) — two incomes, one apartment, ' +
    'and a plan every dollar can follow. Edit anything: the ledger, envelopes and goals all update live.</p></section>';
  html += '<div class="cards">' +
    '<article class="card"><h3>Income</h3><p class="big">' + money(income) + '</p><p class="muted">4 deposits this month</p></article>' +
    '<article class="card"><h3>Spent</h3><p class="big">' + money(spent) + '</p><p class="muted">Across ' + spendCats.length + ' categories</p></article>' +
    '<article class="card"><h3>Moved to savings</h3><p class="big">' + money(saved) + '</p><p class="muted">Savings rate ' + rate + '% of income</p></article>' +
    '<article class="card accent"><h3>Left to budget</h3><p class="big">' + money(left) + '</p><p class="muted">Unassigned — give it a job below</p></article></div>';
  html += '<div class="grid2"><section class="panel"><h3>Spending by category</h3>' + donutChartSVG(spendCats, 190) + '</section>';
  html += '<section class="panel"><h3>Income vs spending — 6 months</h3>' + trendChartSVG(MONTH_TREND) +
    '<p class="muted">November is still in progress, so its bar runs lower — spending is on pace with October.</p></section></div>';
  html += '<div class="grid2"><section class="panel"><h3>Next bills due</h3><ul class="bill-mini">' +
    upcoming.map(function (b) {
      return '<li><span>Nov ' + b.day + ' — ' + esc(b.name) + '</span><strong>' + money(b.amount) + '</strong></li>';
    }).join('') + '</ul><p><a href="#bills">See the full bills calendar →</a></p></section>';
  html += '<section class="panel"><h3>Recent activity</h3><ul class="bill-mini">' +
    recent.map(function (t) {
      return '<li><span>' + esc(t.desc) + '</span><strong class="' + (t.amount < 0 ? 'neg' : 'pos') + '">' + money(t.amount) + '</strong></li>';
    }).join('') + '</ul><p><a href="#ledger">Open the ledger →</a></p></section></div>';
  return html;
}

function viewLedger() {
  var rows = state.transactions.slice().reverse().map(function (t) {
    var cat = categoryById(t.category);
    return '<tr><td>' + t.date.slice(5) + '</td><td>' + esc(t.desc) + '</td>' +
      '<td><span class="chip" style="border-color:' + cat.color + '">' + cat.label + '</span></td>' +
      '<td class="num ' + (t.amount < 0 ? 'neg' : 'pos') + '">' + money(t.amount) + '</td>' +
      '<td class="row-actions"><button data-edit="' + t.id + '">Edit</button>' +
      '<button data-del="' + t.id + '">Delete</button></td></tr>';
  }).join('');
  var catOptions = CATEGORIES.map(function (c) {
    return '<option value="' + c.id + '">' + c.label + '</option>';
  }).join('');
  return '<section class="panel"><h2>Transaction ledger — November 2026</h2>' +
    '<p class="muted">Every dollar in and out. Add your own, edit a row, or delete one — totals, envelopes and charts recalculate instantly.</p>' +
    '<form id="tx-form" class="tx-form">' +
    '<label>Date <input type="date" id="tx-date" value="2026-11-26" required></label>' +
    '<label class="grow">Description <input type="text" id="tx-desc" placeholder="e.g. SunMart Groceries" required></label>' +
    '<label>Category <select id="tx-cat">' + catOptions + '</select></label>' +
    '<label>Amount $ <input type="number" id="tx-amount" step="0.01" placeholder="-42.50 or 1200" required></label>' +
    '<button type="submit" class="primary">Add transaction</button>' +
    '<button type="button" id="tx-cancel-edit" class="hidden">Cancel edit</button></form>' +
    '<div class="filter-row"><label>Filter by category <select id="tx-filter"><option value="">All categories</option>' + catOptions + '</select></label>' +
    '<label>Search <input type="search" id="tx-search" placeholder="Search descriptions"></label></div>' +
    '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="num">Amount</th><th></th></tr></thead>' +
    '<tbody id="tx-body">' + rows + '</tbody></table></div>' +
    '<p class="muted" id="tx-count">' + state.transactions.length + ' transactions · net ' +
    money(monthIncome() - monthSpent() - monthSaved()) + ' this month</p></section>';
}

function viewBudgets() {
  var cards = state.envelopes.map(function (env) {
    var cat = categoryById(env.category);
    var spent = spentByCategory(env.category);
    var leftAmt = env.limit - spent;
    var status = leftAmt < 0 ? 'Over by ' + money(-leftAmt) : money(leftAmt) + ' left';
    return '<article class="envelope"><header><span class="swatch" style="background:' + cat.color + '"></span>' +
      '<h3>' + cat.label + '</h3><span class="env-status">' + status + '</span></header>' +
      '<p class="env-nums"><strong>' + money(spent) + '</strong> of ' + money(env.limit) + '</p>' +
      envelopeBarSVG(spent, env.limit) +
      '<label class="env-edit">Monthly limit $ <input type="number" min="0" step="10" value="' + env.limit +
      '" data-limit="' + env.category + '"></label></article>';
  }).join('');
  return '<section class="panel"><h2>Budget envelopes — November 2026</h2>' +
    '<p class="muted">Each envelope is a promise: spend up to the limit, no more. Change a limit and the bar, ' +
    'the status and the dashboard all follow. Bars turn amber at 80% and red when an envelope is over.</p>' +
    '<div class="envelopes">' + cards + '</div></section>';
}

function viewGoals() {
  var cards = state.goals.map(function (g) {
    var pct = Math.min(100, Math.round((g.saved / g.target) * 100));
    return '<article class="goal"><h3>' + esc(g.name) + '</h3><p class="muted">' + esc(g.note) + '</p>' +
      '<p class="env-nums"><strong>' + money(g.saved) + '</strong> of ' + money(g.target) + ' · ' + pct + '% there</p>' +
      '<div class="bar-track"><div class="bar goal-bar" style="width:' + pct + '%"></div></div>' +
      '<form class="goal-add" data-goal="' + g.id + '"><label>Add $ <input type="number" min="1" step="1" value="50" required></label>' +
      '<button type="submit" class="primary">Add to goal</button></form></article>';
  }).join('');
  return '<section class="panel"><h2>Savings goals</h2>' +
    '<p class="muted">Goals turn spare dollars into named plans. Add a contribution and watch the bar move — ' +
    'every contribution is saved with your data.</p><div class="goals">' + cards + '</div></section>';
}

function viewBills() {
  var total = state.bills.reduce(function (s, b) { return s + b.amount; }, 0);
  var days = '';
  for (var d = 1; d <= 30; d++) {
    var dayBills = state.bills.filter(function (b) { return b.day === d; });
    var inner = dayBills.map(function (b) {
      return '<span class="cal-bill" title="' + esc(b.name) + ' — ' + money(b.amount) + '">' +
        esc(b.name.split('—')[0].split('(')[0].trim()) + ' ' + money(b.amount) + '</span>';
    }).join('');
    days += '<div class="cal-day' + (d === 26 ? ' today' : '') + '"><span class="cal-num">' + d + '</span>' + inner + '</div>';
  }
  var list = state.bills.slice().sort(function (a, b) { return a.day - b.day; }).map(function (b) {
    return '<tr><td>Nov ' + b.day + '</td><td>' + esc(b.name) + '</td><td>' + categoryById(b.category).label +
      '</td><td class="num">' + money(b.amount) + '</td><td>' + (b.autopay ? 'Autopay ✓' : 'Pay manually') + '</td></tr>';
  }).join('');
  return '<section class="panel"><h2>Bills calendar — November 2026</h2>' +
    '<p class="muted">Fixed bills total <strong>' + money(total) + '</strong> a month. Today (Nov 26) is outlined. ' +
    'Nothing here can ambush the checking account: every due date is on the calendar before the month starts.</p>' +
    '<div class="cal-grid">' + days + '</div>' +
    '<div class="table-wrap"><table><thead><tr><th>Due</th><th>Bill</th><th>Category</th><th class="num">Amount</th><th>How paid</th></tr></thead>' +
    '<tbody>' + list + '</tbody></table></div></section>';
}

function viewTools() {
  return '<div class="grid2"><section class="panel"><h2>50 / 30 / 20 planner</h2>' +
    '<p class="muted">The classic split: 50% of take-home pay for needs, 30% for wants, 20% for savings and extra debt payments. ' +
    'Enter your monthly take-home pay and compare the targets with what November actually did.</p>' +
    '<form id="split-form" class="calc-form"><label>Monthly take-home pay $ <input type="number" id="split-income" value="8911" min="0" step="1" required></label>' +
    '<button type="submit" class="primary">Calculate split</button></form><div id="split-out"></div></section>' +
    '<section class="panel"><h2>Debt payoff calculator</h2>' +
    '<p class="muted">See when a balance disappears and how much interest it costs. Extra monthly payments come straight out of the interest.</p>' +
    '<form id="debt-form" class="calc-form">' +
    '<label>Balance $ <input type="number" id="debt-balance" value="3400" min="0" step="1" required></label>' +
    '<label>APR % <input type="number" id="debt-apr" value="21.99" min="0" step="0.01" required></label>' +
    '<label>Monthly payment $ <input type="number" id="debt-pay" value="220" min="1" step="1" required></label>' +
    '<button type="submit" class="primary">Calculate payoff</button></form><div id="debt-out"></div></section></div>' +
    '<section class="panel"><h2>Household money rules we live by</h2><ul class="rules-list">' +
    '<li><strong>Pay yourselves first.</strong> Savings transfers leave on payday (Nov 2 and Nov 15), before spending starts.</li>' +
    '<li><strong>One no-spend weekend a month.</strong> November\u2019s was the 21st–22nd — the sink got fixed with parts already budgeted under Housing.</li>' +
    '<li><strong>Groceries get a list, not a vibe.</strong> Four SunMart shops this month averaged $151 — inside the $650 envelope.</li>' +
    '<li><strong>Every bill is on the calendar.</strong> If it is not on the bills page, it does not get paid late — it gets questioned.</li>' +
    '<li><strong>Review together on the last Sunday.</strong> Fifteen minutes, this site open, envelopes adjusted for next month.</li></ul>' +
    '<p><button id="reset-data" class="danger">Reset to the sample household data</button> ' +
    '<span class="muted">Your edits are stored in this browser only.</span></p></section>';
}
