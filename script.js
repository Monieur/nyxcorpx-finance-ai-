const listEl = document.getElementById("list");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const balanceEl = document.getElementById("balance");
const aiEl = document.getElementById("aiText");
const predictionEl = document.getElementById("prediction");
const searchInput = document.getElementById("searchInput");
const chartCanvas = document.getElementById("financeChart");

let transactions =
  JSON.parse(localStorage.getItem("transactions")) || [];

let chart = null;
let savingsGoal = 0;

/* =========================
   FORMAT MONEY
========================= */
function formatMoney(value) {
  return Number(value).toLocaleString("en-US");
}

/* =========================
   INIT
========================= */
window.onload = () => {
  setupEvents();
  renderAll();
};

/* =========================
   EVENTS
========================= */
function setupEvents() {
  document.getElementById("amount").addEventListener("keypress", e => {
    if (e.key === "Enter") addTransaction();
  });

  searchInput.addEventListener("input", renderAll);
}

/* =========================
   ADD TRANSACTION
========================= */
function addTransaction() {

  const desc = document.getElementById("desc").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const currency = document.getElementById("currency").value;

  const MAX = 1_000_000_000_000;

  if (!desc || isNaN(amount) || amount <= 0) {
    alert("Enter valid transaction");
    return;
  }

  if (amount >= MAX) {
    alert("❌ Max limit is 1 trillion");
    return;
  }

  transactions.unshift({
    id: Date.now(),
    desc,
    amount,
    type,
    category,
    currency,
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    date: new Date().toLocaleString()
  });

  saveData();
  renderAll();
}

/* =========================
   RENDER ALL
========================= */
function renderAll() {
  updateList();
  updateSummary();
  updateChart();
  updateAI();
  updatePrediction();
  updateCategoryAnalytics();
}

/* =========================
   MONTH FILTER
========================= */
function getMonthData() {
  const m = new Date().getMonth();
  const y = new Date().getFullYear();

  return transactions.filter(t =>
    t.month === m && t.year === y
  );
}

/* =========================
   LIST
========================= */
function updateList() {

  const search = searchInput.value.toLowerCase();
  let html = "";

  transactions.forEach(t => {

    if (!t.desc.toLowerCase().includes(search)) return;

    html += `
      <li class="${t.type}">
        <div>
          <strong>${t.desc}</strong><br>
          <small>${t.category}</small><br>
          <small>${t.date}</small>
        </div>

        <div>
          ${formatMoney(t.amount)} ${t.currency}
          <button onclick="deleteTransaction(${t.id})">X</button>
        </div>
      </li>
    `;
  });

  listEl.innerHTML = html || "<p>No transactions found</p>";
}

/* =========================
   DELETE
========================= */
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  renderAll();
}

/* =========================
   RESET
========================= */
function resetAll() {
  transactions = [];
  saveData();
  renderAll();
}

/* =========================
   SUMMARY
========================= */
function updateSummary() {

  const data = getMonthData();

  let income = 0;
  let expense = 0;

  data.forEach(t => {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  });

  const balance = income - expense;

  incomeEl.textContent = formatMoney(income.toFixed(2));
  expenseEl.textContent = formatMoney(expense.toFixed(2));
  balanceEl.textContent = formatMoney(balance.toFixed(2));

  balanceEl.style.color =
    balance >= 0 ? "#00ff99" : "#ff4d6d";
}

/* =========================
   CHART
========================= */
function updateChart() {

  const data = getMonthData();

  let income = 0;
  let expense = 0;

  data.forEach(t => {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  });

  if (chart) chart.destroy();

  chart = new Chart(chartCanvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Income", "Expense"],
      datasets: [{
        data: [income, expense],
        backgroundColor: ["#00ff99", "#ff4d6d"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      cutout: "70%"
    }
  });
}

/* =========================
   AI SYSTEM
========================= */
function updateAI() {

  const data = getMonthData();

  let income = 0;
  let expense = 0;

  const categories = {};

  data.forEach(t => {

    if (t.type === "income") income += t.amount;
    else expense += t.amount;

    if (!categories[t.category]) categories[t.category] = 0;
    categories[t.category] += t.amount;

  });

  const balance = income - expense;

  let msg =
    (balance >= 0 ? "✅ Stable finances" : "⚠ Negative balance") +
    `<br>💰 Balance: ${formatMoney(balance.toFixed(2))}`;

  if (expense > income * 0.8) {
    msg += "<br>📉 High spending detected";
  }

  if (savingsGoal > 0) {
    let percent = ((balance / savingsGoal) * 100).toFixed(1);
    msg += `<br>🎯 Goal progress: ${percent}%`;
  }

  aiEl.innerHTML = msg;

  updateCategoryAnalytics();
}

/* =========================
   CATEGORY ANALYTICS
========================= */
function updateCategoryAnalytics() {

  const data = getMonthData();

  const stats = {};

  data.forEach(t => {

    if (t.type !== "expense") return;

    if (!stats[t.category]) stats[t.category] = 0;

    stats[t.category] += t.amount;

  });

  let total = 0;
  for (let c in stats) total += stats[c];

  let text = "<br>📊 Categories:<br>";

  for (let c in stats) {
    let p = ((stats[c] / total) * 100).toFixed(1);
    text += `${c}: ${p}%<br>`;
  }

  aiEl.innerHTML += text;
}

/* =========================
   PREDICTION
========================= */
function updatePrediction() {

  const data = getMonthData();

  if (data.length < 3) {
    predictionEl.innerHTML = "📈 Not enough data";
    return;
  }

  let expense = 0;

  data.forEach(t => {
    if (t.type === "expense") expense += t.amount;
  });

  predictionEl.innerHTML =
    `📉 Weekly spending estimate: ${formatMoney((expense / 7).toFixed(2))}`;
}

/* =========================
   STORAGE
========================= */
function saveData() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

/* =========================
   SAVINGS GOAL
========================= */
function setSavingsGoal() {
  const g = Number(prompt("Set savings goal"));

  if (isNaN(g) || g <= 0) {
    alert("Invalid goal");
    return;
  }

  savingsGoal = g;
  alert("Goal set: " + formatMoney(g));
}