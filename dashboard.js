// NightShift Dashboard logic
const sb = window.supabaseClient;

// ⚙️ Configure your exact table names here
const TABLES = {
  reservations: "reservations",         // change if your table is named differently
  calls: "public_call_metadata"         // or "call_logs" – match Supabase exactly
};

// ⚙️ Column names (change if needed)
const COLS = {
  reservations: {
    createdAt: "created_at_timestamp",  // or "created_at"
    guestName: "guest_name",
    arrivalDate: "arrival_date",        // e.g. "27-12-2025"
    nights: "nights",
    roomType: "room_type",
    guests: "guests",
    pets: "pets",
    totalDue: "total_due"
  },
  calls: {
    createdAt: "created_at",            // or "created_at_timestamp"
    callerNumber: "caller_number",
    reason: "reason",
    arrivalDate: "arrival_date",
    sentiment: "sentiment_score",
    outcome: "outcome"
  }
};

let cache = {
  reservations: [],
  calls: []
};

const el = (id) => document.getElementById(id);

function setLastSync() {
  const now = new Date();
  el("last-sync").textContent =
    "Last sync: " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(num) {
  if (num == null || isNaN(num)) return "$0";
  return "$" + Number(num).toFixed(2);
}

function formatDate(ddmmyyyy) {
  if (!ddmmyyyy) return "—";
  if (ddmmyyyy.includes("-")) {
    const [d, m, y] = ddmmyyyy.split("-");
    return `${d}/${m}/${y}`;
  }
  return ddmmyyyy;
}

/* ---------------- Fetching ---------------- */

async function fetchReservations() {
  const { reservations } = TABLES;
  const cols = COLS.reservations;

  const { data, error } = await sb
    .from(reservations)
    .select("*")
    .order(cols.createdAt, { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching reservations", error);
    return [];
  }
  return data || [];
}

async function fetchCalls() {
  const { calls } = TABLES;
  const cols = COLS.calls;

  const { data, error } = await sb
    .from(calls)
    .select("*")
    .order(cols.createdAt, { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching calls", error);
    return [];
  }
  return data || [];
}

/* ---------------- Rendering: Overview ---------------- */

function renderOverview() {
  const res = cache.reservations;
  const calls = cache.calls;

  const colsRes = COLS.reservations;
  const colsCalls = COLS.calls;

  // Totals
  const totalReservations = res.length;
  const totalRevenue = res.reduce(
    (sum, r) => sum + (Number(r[colsRes.totalDue]) || 0),
    0
  );
  const totalCalls = calls.length;

  el("ov-total-reservations").textContent = totalReservations;
  el("ov-total-revenue").textContent = formatCurrency(totalRevenue);
  el("ov-total-calls").textContent = totalCalls;

  el("ov-reservations-meta").textContent =
    totalReservations === 0 ? "No reservations yet." : "Last 200 reservations";
  el("ov-calls-meta").textContent =
    totalCalls === 0 ? "No calls yet." : "Last 200 calls";

  // Latest reservations table
  const bodyRes = el("ov-reservations-body");
  bodyRes.innerHTML = "";
  const latestRes = res.slice(0, 5);

  if (latestRes.length === 0) {
    bodyRes.innerHTML =
      '<tr><td colspan="5" class="table-empty">No reservations found.</td></tr>';
  } else {
    latestRes.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r[colsRes.guestName] || "—"}</td>
        <td>${formatDate(r[colsRes.arrivalDate])}</td>
        <td>${r[colsRes.nights] ?? "—"}</td>
        <td>${r[colsRes.roomType] || "—"}</td>
        <td>${formatCurrency(r[colsRes.totalDue])}</td>
      `;
      bodyRes.appendChild(tr);
    });
  }
  el("ov-last-res-count").textContent = `${latestRes.length} shown`;

  // Latest calls table
  const bodyCalls = el("ov-calls-body");
  bodyCalls.innerHTML = "";
  const latestCalls = calls.slice(0, 5);

  if (latestCalls.length === 0) {
    bodyCalls.innerHTML =
      '<tr><td colspan="4" class="table-empty">No calls found.</td></tr>';
  } else {
    latestCalls.forEach((c) => {
      const sent = Number(c[colsCalls.sentiment]);
      const sentLabel =
        isNaN(sent) || sent === 0
          ? "Neutral"
          : sent > 0
          ? "Positive"
          : "Negative";
      const sentClass =
        sent > 0.1 ? "sentiment-positive" : sent < -0.1 ? "sentiment-negative" : "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c[colsCalls.callerNumber] || "Unknown"}</td>
        <td>${c[colsCalls.reason] || "—"}</td>
        <td>${formatDate(c[colsCalls.arrivalDate])}</td>
        <td class="${sentClass}">${sentLabel}</td>
      `;
      bodyCalls.appendChild(tr);
    });
  }
  el("ov-last-call-count").textContent = `${latestCalls.length} shown`;
}

/* ---------------- Rendering: Reservations view ---------------- */

function renderReservationsView() {
  const res = cache.reservations;
  const cols = COLS.reservations;
  const body = el("res-table-body");
  body.innerHTML = "";

  if (res.length === 0) {
    body.innerHTML =
      '<tr><td colspan="7" class="table-empty">No reservations found.</td></tr>';
    el("res-count-pill").textContent = "0 reservations";
    el("res-sum-pill").textContent = "$0 total";
    return;
  }

  let total = 0;

  res.forEach((r) => {
    const td = Number(r[cols.totalDue]) || 0;
    total += td;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r[cols.guestName] || "—"}</td>
      <td>${formatDate(r[cols.arrivalDate])}</td>
      <td>${r[cols.nights] ?? "—"}</td>
      <td>${r[cols.roomType] || "—"}</td>
      <td>${r[cols.guests] ?? "—"}</td>
      <td>${r[cols.pets] || "—"}</td>
      <td>${formatCurrency(td)}</td>
    `;
    body.appendChild(tr);
  });

  el("res-count-pill").textContent = `${res.length} reservations`;
  el("res-sum-pill").textContent = `${formatCurrency(total)} total`;
}

/* ---------------- Rendering: Calls view ---------------- */

function renderCallsView() {
  const calls = cache.calls;
  const cols = COLS.calls;
  const body = el("calls-table-body");
  body.innerHTML = "";

  if (calls.length === 0) {
    body.innerHTML =
      '<tr><td colspan="5" class="table-empty">No calls found.</td></tr>';
    el("calls-count-pill").textContent = "0 calls";
    el("calls-positive-pill").textContent = "–% positive";
    return;
  }

  let positiveCount = 0;
  let validSentiments = 0;

  calls.forEach((c) => {
    const sent = Number(c[cols.sentiment]);
    const sentLabel =
      isNaN(sent) || sent === 0
        ? "Neutral"
        : sent > 0
        ? "Positive"
        : "Negative";
    const sentClass =
      sent > 0.1 ? "sentiment-positive" : sent < -0.1 ? "sentiment-negative" : "";

    if (!isNaN(sent)) {
      validSentiments++;
      if (sent > 0.1) positiveCount++;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c[cols.callerNumber] || "Unknown"}</td>
      <td>${c[cols.reason] || "—"}</td>
      <td>${formatDate(c[cols.arrivalDate])}</td>
      <td class="${sentClass}">${sentLabel}</td>
      <td>${c[cols.outcome] || "—"}</td>
    `;
    body.appendChild(tr);
  });

  el("calls-count-pill").textContent = `${calls.length} calls`;

  if (validSentiments > 0) {
    const pct = Math.round((positiveCount / validSentiments) * 100);
    el("calls-positive-pill").textContent = `${pct}% positive`;
  } else {
    el("calls-positive-pill").textContent = "No sentiment data";
  }
}

/* ---------------- View switching ---------------- */

function switchView(viewId) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("view-active"));
  el(`view-${viewId}`).classList.add("view-active");

  document
    .querySelectorAll(".nav-link")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelector(`.nav-link[data-view="${viewId}"]`)
    .classList.add("active");

  const titleMap = {
    overview: "Overview",
    reservations: "Reservations",
    calls: "Calls & AI",
    settings: "Settings"
  };
  const subtitleMap = {
    overview: "Today’s performance across bookings, calls, and AI.",
    reservations: "Reservations saved from NightShift AI into Supabase.",
    calls: "Live call metadata, sentiment and outcomes.",
    settings: "Connection details for Supabase and NightShift."
  };

  el("view-title").textContent = titleMap[viewId] || "Dashboard";
  el("view-subtitle").textContent =
    subtitleMap[viewId] || "NightShift AI dashboard.";
}

/* ---------------- Load all data ---------------- */

async function loadAllData() {
  el("banner").classList.add("banner-loading");
  el("refresh-btn").disabled = true;
  el("refresh-btn").textContent = "Refreshing…";

  const [res, calls] = await Promise.all([fetchReservations(), fetchCalls()]);
  cache.reservations = res;
  cache.calls = calls;

  renderOverview();
  renderReservationsView();
  renderCallsView();
  setLastSync();

  el("banner").classList.remove("banner-loading");
  el("refresh-btn").disabled = false;
  el("refresh-btn").textContent = "Refresh data";
}

/* ---------------- Init ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  // Nav
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      switchView(view);
    });
  });

  // Refresh button
  el("refresh-btn").addEventListener("click", () => {
    loadAllData();
  });

  // Initial load
  loadAllData();
});
