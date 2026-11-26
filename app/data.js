// data.js — Hearth & Ledger sample household dataset and state store.
// One job: hold the seed data (the Alvarez household, November 2026) and the
// in-memory state with localStorage persistence. No DOM code lives here.

'use strict';

var CATEGORIES = [
  { id: 'housing', label: 'Housing', color: '#2f6f4e', kind: 'need' },
  { id: 'groceries', label: 'Groceries', color: '#7fb069', kind: 'need' },
  { id: 'transport', label: 'Transport', color: '#e9c46a', kind: 'need' },
  { id: 'utilities', label: 'Utilities & Bills', color: '#457b9d', kind: 'need' },
  { id: 'health', label: 'Health', color: '#a8dadc', kind: 'need' },
  { id: 'dining', label: 'Dining Out', color: '#e76f51', kind: 'want' },
  { id: 'fun', label: 'Fun & Streaming', color: '#f4a261', kind: 'want' },
  { id: 'shopping', label: 'Shopping', color: '#b5838d', kind: 'want' },
  { id: 'kids', label: 'Kids & School', color: '#6d6875', kind: 'need' },
  { id: 'savings', label: 'Savings Transfer', color: '#264653', kind: 'save' },
  { id: 'income', label: 'Income', color: '#1d3557', kind: 'income' }
];

function categoryById(id) {
  for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i];
  return CATEGORIES[0];
}

// Seed transactions for November 2026: [date, description, category, amount]
// Amounts are signed: income positive, spending negative.
var SEED_TRANSACTIONS = [
  ['2026-11-01', 'Paycheck — Maya (clinic, biweekly)', 'income', 2480.00],
  ['2026-11-01', 'Paycheck — Jordan (warehouse, biweekly)', 'income', 1975.50],
  ['2026-11-01', 'Rent — Maple Court Apt 4B', 'housing', -1650.00],
  ['2026-11-02', 'City Electric — October bill', 'utilities', -118.42],
  ['2026-11-02', 'Transfer to emergency fund', 'savings', -300.00],
  ['2026-11-03', 'SunMart Groceries — weekly shop', 'groceries', -142.18],
  ['2026-11-03', 'MetroCard top-up x2', 'transport', -68.00],
  ['2026-11-04', 'Pharmacy — prescriptions', 'health', -36.75],
  ['2026-11-05', 'Water & sewer — quarterly', 'utilities', -54.10],
  ['2026-11-06', 'Taqueria Sol — family dinner', 'dining', -58.40],
  ['2026-11-07', 'SunMart Groceries — top-up', 'groceries', -47.92],
  ['2026-11-08', 'Gas — sedan fill-up', 'transport', -52.30],
  ['2026-11-09', 'StreamBox + MusicNest renewals', 'fun', -27.98],
  ['2026-11-10', 'School lunch account — Leo', 'kids', -45.00],
  ['2026-11-11', 'Internet — FiberHome 300 Mbps', 'utilities', -59.99],
  ['2026-11-12', 'SunMart Groceries — weekly shop', 'groceries', -156.44],
  ['2026-11-13', 'Dentist copay — Sofia checkup', 'health', -40.00],
  ['2026-11-14', 'Cinema — family matinee', 'fun', -38.00],
  ['2026-11-15', 'Paycheck — Maya (clinic, biweekly)', 'income', 2480.00],
  ['2026-11-15', 'Paycheck — Jordan (warehouse, biweekly)', 'income', 1975.50],
  ['2026-11-15', 'Transfer to holiday fund', 'savings', -150.00],
  ['2026-11-16', 'Car insurance — monthly', 'transport', -132.00],
  ['2026-11-17', 'Bookstore — winter coats for kids', 'shopping', -96.25],
  ['2026-11-18', 'SunMart Groceries — weekly shop', 'groceries', -138.67],
  ['2026-11-19', 'Mobile phones — two lines', 'utilities', -84.00],
  ['2026-11-20', 'Bakery & coffee — weekend treat', 'dining', -24.60],
  ['2026-11-21', 'Soccer cleats — Leo', 'kids', -54.99],
  ['2026-11-22', 'Hardware store — sink repair parts', 'housing', -38.45],
  ['2026-11-23', 'SunMart Groceries — holiday prep', 'groceries', -121.30],
  ['2026-11-24', 'Side income — Maya tutoring', 'income', 180.00],
  ['2026-11-25', 'Pharmacy — vitamins & first aid', 'health', -28.15]
];

// Monthly envelope limits for November 2026 (spending categories only).
var SEED_ENVELOPES = [
  { category: 'housing', limit: 1700 },
  { category: 'groceries', limit: 650 },
  { category: 'transport', limit: 320 },
  { category: 'utilities', limit: 340 },
  { category: 'health', limit: 160 },
  { category: 'dining', limit: 140 },
  { category: 'fun', limit: 110 },
  { category: 'shopping', limit: 150 },
  { category: 'kids', limit: 180 }
];

var SEED_GOALS = [
  { id: 'g1', name: 'Emergency fund', target: 10000, saved: 6400, note: 'Six months of essentials — the family safety net.' },
  { id: 'g2', name: 'Holiday trip to visit grandparents', target: 1800, saved: 1150, note: 'Flights and a rental car for late December.' },
  { id: 'g3', name: 'Replace the washing machine', target: 750, saved: 520, note: 'The old one rattles through every spin cycle.' },
  { id: 'g4', name: 'Kids college starter (529)', target: 5000, saved: 1875, note: 'Small monthly transfers add up over 10+ years.' }
];

var SEED_BILLS = [
  { day: 1, name: 'Rent — Maple Court Apt 4B', amount: 1650.00, category: 'housing', autopay: true },
  { day: 2, name: 'City Electric', amount: 118.42, category: 'utilities', autopay: true },
  { day: 5, name: 'Water & sewer', amount: 54.10, category: 'utilities', autopay: false },
  { day: 9, name: 'StreamBox + MusicNest', amount: 27.98, category: 'fun', autopay: true },
  { day: 11, name: 'FiberHome Internet', amount: 59.99, category: 'utilities', autopay: true },
  { day: 16, name: 'Car insurance', amount: 132.00, category: 'transport', autopay: true },
  { day: 19, name: 'Mobile phones (2 lines)', amount: 84.00, category: 'utilities', autopay: true },
  { day: 24, name: 'Gym — family plan', amount: 45.00, category: 'health', autopay: false },
  { day: 28, name: 'Renters insurance', amount: 21.50, category: 'housing', autopay: true }
];

// Spending totals for the last six months, for the trend chart.
var MONTH_TREND = [
  { month: 'Jun', income: 8910, spent: 5120 },
  { month: 'Jul', income: 8910, spent: 5485 },
  { month: 'Aug', income: 9090, spent: 5760 },
  { month: 'Sep', income: 8910, spent: 5240 },
  { month: 'Oct', income: 8910, spent: 5395 },
  { month: 'Nov', income: 9091, spent: 3314 }
];

var STORAGE_KEY = 'hearth-ledger-v1';

var state = { transactions: [], envelopes: [], goals: [], bills: [], nextId: 1 };

function seedState() {
  state.transactions = SEED_TRANSACTIONS.map(function (row, i) {
    return { id: 't' + (i + 1), date: row[0], desc: row[1], category: row[2], amount: row[3] };
  });
  state.nextId = SEED_TRANSACTIONS.length + 1;
  state.envelopes = SEED_ENVELOPES.map(function (e) { return { category: e.category, limit: e.limit }; });
  state.goals = SEED_GOALS.map(function (g) { return { id: g.id, name: g.name, target: g.target, saved: g.saved, note: g.note }; });
  state.bills = SEED_BILLS.map(function (b) { return { day: b.day, name: b.name, amount: b.amount, category: b.category, autopay: b.autopay }; });
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* in-memory only */ }
}

function loadState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.transactions && parsed.envelopes && parsed.goals) {
        state = parsed;
        return;
      }
    }
  } catch (e) { /* fall through to seed */ }
  seedState();
}

function resetState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  seedState();
  saveState();
}

function money(n) {
  var sign = n < 0 ? '-' : '';
  var abs = Math.abs(n);
  return sign + '$' + abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function monthIncome() {
  return state.transactions.filter(function (t) { return t.amount > 0; })
    .reduce(function (s, t) { return s + t.amount; }, 0);
}

function monthSpent() {
  return state.transactions.filter(function (t) { return t.amount < 0 && t.category !== 'savings'; })
    .reduce(function (s, t) { return s - t.amount; }, 0);
}

function monthSaved() {
  return state.transactions.filter(function (t) { return t.category === 'savings'; })
    .reduce(function (s, t) { return s - t.amount; }, 0);
}

function spentByCategory(catId) {
  return state.transactions.filter(function (t) { return t.category === catId && t.amount < 0; })
    .reduce(function (s, t) { return s - t.amount; }, 0);
}
