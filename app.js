/**
 * Sleep Cycle App - Core Logic
 */

const CYCLE_DURATION = 90; // minutes
const FALL_ASLEEP_TIME = 15; // minutes

let targetTime = null;
let timerInterval = null;

/* =========================
   NAVIGATION
========================= */

function switchView(view) {
    // Update views
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const targetView = document.getElementById(view + "View");
    if (targetView) targetView.classList.add("active");

    // Update nav buttons
    document.querySelectorAll(".navbar button").forEach(btn => btn.classList.remove("active"));
    const targetNav = document.getElementById("nav-" + view);
    if (targetNav) targetNav.classList.add("active");

    // Load data if needed
    if (view === "history") loadHistory();
}

/* =========================
   CALCULATIONS
========================= */

function calc() {
    stopTimer();
    const wakeInput = document.getElementById("wake").value;
    if (!wakeInput) return;

    const [hours, minutes] = wakeInput.split(":").map(Number);
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    // Calculate sleep times for 6, 5, 4, 3 cycles
    [6, 5, 4, 3].forEach(cycles => {
        const totalMinutes = cycles * CYCLE_DURATION + FALL_ASLEEP_TIME;
        const wakeDate = new Date();
        wakeDate.setHours(hours, minutes, 0, 0);
        
        // If wake time is earlier than now, assume it's for tomorrow
        if (wakeDate < new Date()) {
            wakeDate.setDate(wakeDate.getDate() + 1);
        }

        const sleepDate = new Date(wakeDate.getTime() - totalMinutes * 60000);
        renderResult(sleepDate, cycles, resultsContainer);
    });
}

function sleepNow() {
    stopTimer();
    const now = new Date();
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    // Calculate wake times for 6, 5, 4, 3 cycles
    [6, 5, 4, 3].forEach((cycles, index) => {
        const totalMinutes = cycles * CYCLE_DURATION + FALL_ASLEEP_TIME;
        const wakeDate = new Date(now.getTime() + totalMinutes * 60000);
        
        renderResult(wakeDate, cycles, resultsContainer, true);

        // Set the timer for the most optimal cycle (6 cycles)
        if (cycles === 6) {
            targetTime = wakeDate;
            saveToHistory(wakeDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), cycles);
        }
    });

    startTimer();
}

function renderResult(date, cycles, container, isWakeTime = false) {
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const statusClass = cycles >= 5 ? "good" : (cycles === 4 ? "medium" : "bad");
    const label = isWakeTime ? "Réveil à" : "Coucher à";

    container.innerHTML += `
        <div class="result ${statusClass}">
            <div>
                <div class="result-info">${label}</div>
                <div class="result-time">${timeStr}</div>
            </div>
            <div class="result-info">${cycles} cycles (${Math.floor(cycles * 1.5)}h)</div>
        </div>
    `;
}

/* =========================
   TIMER
========================= */

function startTimer() {
    const container = document.getElementById("timerContainer");
    const display = document.getElementById("timer");
    
    if (!targetTime) return;
    container.classList.add("active");

    if (timerInterval) clearInterval(timerInterval);

    const update = () => {
        const now = new Date();
        const diff = targetTime - now;

        if (diff <= 0) {
            display.innerText = "C'est l'heure !";
            clearInterval(timerInterval);
            return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        display.innerText = `${h}h ${m}m ${s}s`;
    };

    update();
    timerInterval = setInterval(update, 1000);
}

function stopTimer() {
    targetTime = null;
    if (timerInterval) clearInterval(timerInterval);
    document.getElementById("timerContainer").classList.remove("active");
}

/* =========================
   HISTORY
========================= */

function saveToHistory(time, cycles) {
    const history = JSON.parse(localStorage.getItem("sleepHistory") || "[]");
    history.push({
        time,
        cycles,
        date: new Date().toLocaleDateString('fr-FR'),
        timestamp: Date.now()
    });

    // Keep only last 20 entries
    if (history.length > 20) history.shift();

    localStorage.setItem("sleepHistory", JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem("sleepHistory") || "[]");
    const container = document.getElementById("historyList");
    
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-dim); padding: 20px;">Aucune nuit enregistrée</p>';
        return;
    }

    container.innerHTML = history.reverse().map(item => `
        <div class="history-item">
            <span><strong>${item.date}</strong> — ${item.time}</span>
            <span style="color: var(--text-dim)">${item.cycles} cycles</span>
        </div>
    `).join('');
}

function clearHistory() {
    if (confirm("Voulez-vous vraiment supprimer tout l'historique ?")) {
        localStorage.removeItem("sleepHistory");
        loadHistory();
    }
}

// Initialize
window.addEventListener("load", () => {
    // Default time 07:00 is already in HTML
});
