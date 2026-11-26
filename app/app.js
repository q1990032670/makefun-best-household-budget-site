// app.js — Hearth & Ledger router and interactions.
// One job: wire the views to the state — hash routing, ledger add/edit/delete,
// envelope limit edits, goal contributions, and the two calculators.

'use strict';

var ROUTES = {
  dashboard: { title: 'Dashboard', render: viewDashboard },
  ledger: { title: 'Ledger', render: viewLedger },
  budgets: { title: 'Budgets', render: viewBudgets },
  goals: { title: 'Goals', render: viewGoals },
  bills: { title: 'Bills', render: viewBills },
  tools: { title: 'Tools & Rules', render: viewTools }
};

var editingId = null;

function currentRoute() {
  var name = (location.hash || '#dashboard').slice(1);
  return ROUTES[name] ? name : 'dashboard';
}

function render() {
  var name = currentRoute();
  var main = document.getElementById('main');
  main.innerHTML = ROUTES[name].render();
  document.title = 'Hearth & Ledger — ' + ROUTES[name].title;
  var links = document.querySelectorAll('.nav-link');
  links.forEach(function (a) {
    a.classList.toggle('active', a.getAttribute('href') === '#' + name);
  });
  bindView(name);
  updateHeaderStrip();
  window.scrollTo(0, 0);
}

// The header strip mirrors the dashboard totals, so refresh it on every
// render — after a ledger edit the strip must not show last render's figures.
function updateHeaderStrip() {
  var inc = document.getElementById('head-income');
  if (!inc) return;
  inc.textContent = money(monthIncome());
  document.getElementById('head-spent').textContent = money(monthSpent());
  document.getElementById('head-saved').textContent = money(monthSaved());
}

function bindView(name) {
  if (name === 'ledger') bindLedger();
  if (name === 'budgets') bindBudgets();
  if (name === 'goals') bindGoals();
  if (name === 'tools') bindTools();
}

function bindLedger() {
  var form = document.getElementById('tx-form');
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var desc = document.getElementById('tx-desc').value.trim();
    var amount = parseFloat(document.getElementById('tx-amount').value);
    var date = document.getElementById('tx-date').value || '2026-11-26';
    var cat = document.getElementById('tx-cat').value;
    if (!desc || isNaN(amount)) return;
    if (editingId) {
      var tx = state.transactions.find(function (t) { return t.id === editingId; });
      if (tx) { tx.desc = desc; tx.amount = amount; tx.date = date; tx.category = cat; }
      editingId = null;
    } else {
      state.transactions.push({ id: 't' + state.nextId++, date: date, desc: desc, category: cat, amount: amount });
    }
    saveState();
    render();
  });
  document.getElementById('tx-cancel-edit').addEventListener('click', function () {
    editingId = null;
    render();
  });
  var body = document.getElementById('tx-body');
  body.addEventListener('click', function (ev) {
    var editId = ev.target.getAttribute('data-edit');
    var delId = ev.target.getAttribute('data-del');
    if (delId) {
      state.transactions = state.transactions.filter(function (t) { return t.id !== delId; });
      saveState();
      render();
    }
    if (editId) {
      var tx = state.transactions.find(function (t) { return t.id === editId; });
      if (!tx) return;
      editingId = editId;
      document.getElementById('tx-date').value = tx.date;
      document.getElementById('tx-desc').value = tx.desc;
      document.getElementById('tx-cat').value = tx.category;
      document.getElementById('tx-amount').value = tx.amount;
      document.getElementById('tx-cancel-edit').classList.remove('hidden');
      form.querySelector('button[type=submit]').textContent = 'Save changes';
      document.getElementById('tx-desc').focus();
    }
  });
  function applyFilter() {
    var cat = document.getElementById('tx-filter').value;
    var q = document.getElementById('tx-search').value.toLowerCase();
    body.querySelectorAll('tr').forEach(function (row, i) {
      var tx = state.transactions[state.transactions.length - 1 - i];
      if (!tx) return;
      var show = (!cat || tx.category === cat) && (!q || tx.desc.toLowerCase().indexOf(q) !== -1);
      row.style.display = show ? '' : 'none';
    });
  }
  document.getElementById('tx-filter').addEventListener('change', applyFilter);
  document.getElementById('tx-search').addEventListener('input', applyFilter);
}

function bindBudgets() {
  document.querySelectorAll('[data-limit]').forEach(function (input) {
    input.addEventListener('change', function () {
      var val = parseFloat(input.value);
      if (isNaN(val) || val < 0) return;
      var env = state.envelopes.find(function (e) { return e.category === input.getAttribute('data-limit'); });
      if (env) { env.limit = val; saveState(); render(); }
    });
  });
}

function bindGoals() {
  document.querySelectorAll('.goal-add').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var amount = parseFloat(form.querySelector('input').value);
      if (isNaN(amount) || amount <= 0) return;
      var goal = state.goals.find(function (g) { return g.id === form.getAttribute('data-goal'); });
      if (goal) { goal.saved = Math.min(goal.target, goal.saved + amount); saveState(); render(); }
    });
  });
}

function splitResult(income) {
  var needs = income * 0.5, wants = income * 0.3, save = income * 0.2;
  var actualNeeds = 0, actualWants = 0;
  state.transactions.forEach(function (t) {
    if (t.amount >= 0) return;
    var kind = categoryById(t.category).kind;
    if (kind === 'need') actualNeeds += -t.amount;
    if (kind === 'want') actualWants += -t.amount;
  });
  var actualSave = monthSaved();
  function row(label, target, actual) {
    var pct = income > 0 ? Math.round((actual / income) * 100) : 0;
    return '<tr><td>' + label + '</td><td class="num">' + money(target) + '</td>' +
      '<td class="num">' + money(actual) + '</td><td class="num">' + pct + '%</td></tr>';
  }
  return '<table><thead><tr><th>Bucket</th><th class="num">Target</th><th class="num">November actual</th><th class="num">Share</th></tr></thead><tbody>' +
    row('Needs (50%)', needs, actualNeeds) + row('Wants (30%)', wants, actualWants) +
    row('Savings & extra debt (20%)', save, actualSave) + '</tbody></table>' +
    '<p class="muted">November runs needs-heavy because rent lands on the 1st while the month is still in progress — ' +
    'wants are well under target, which is exactly where a family wants the slack.</p>';
}

function debtResult(balance, apr, payment) {
  var monthlyRate = apr / 100 / 12;
  if (payment <= balance * monthlyRate) {
    return '<p class="warn-text">That payment does not cover the monthly interest of ' +
      money(balance * monthlyRate) + ' — the balance would grow. Raise the payment to make progress.</p>';
  }
  var months = 0, interest = 0, bal = balance;
  while (bal > 0 && months < 1200) {
    var charge = bal * monthlyRate;
    interest += charge;
    bal = bal + charge - payment;
    months++;
  }
  var years = Math.floor(months / 12), rem = months % 12;
  return '<p class="calc-big">Debt-free in <strong>' + months + ' months</strong> (' + years + 'y ' + rem + 'm)</p>' +
    '<p>Total interest paid: <strong>' + money(interest) + '</strong> · Total repaid: <strong>' + money(balance + interest) + '</strong></p>' +
    '<p class="muted">Paying ' + money(payment) + ' a month on a ' + money(balance) + ' balance at ' + apr + '% APR. ' +
    'Every extra $25 a month removes roughly another month of payments — try it above.</p>';
}

function bindTools() {
  var splitOut = document.getElementById('split-out');
  splitOut.innerHTML = splitResult(parseFloat(document.getElementById('split-income').value) || 0);
  document.getElementById('split-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    splitOut.innerHTML = splitResult(parseFloat(document.getElementById('split-income').value) || 0);
  });
  var debtOut = document.getElementById('debt-out');
  function runDebt() {
    debtOut.innerHTML = debtResult(
      parseFloat(document.getElementById('debt-balance').value) || 0,
      parseFloat(document.getElementById('debt-apr').value) || 0,
      parseFloat(document.getElementById('debt-pay').value) || 0);
  }
  runDebt();
  document.getElementById('debt-form').addEventListener('submit', function (ev) { ev.preventDefault(); runDebt(); });
  document.getElementById('reset-data').addEventListener('click', function () {
    resetState();
    render();
  });
}

window.addEventListener('hashchange', render);
loadState();
render();
