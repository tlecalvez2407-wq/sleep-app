/**
 * Sleep Cycle App - Core Logic
 */

const CYCLE_DURATION = 90; // minutes
const FALL_ASLEEP_TIME = 15; // minutes

let timerInterval = null;
let currentSession = null;

/* =========================
   NAVIGATION
========================= */

function switchView(view) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const targetView = document.getElementById(view + "View");
    if (targetView) targetView.classList.add("active");

    document.querySelectorAll(".navbar button").forEach(btn => btn.classList.remove("active"));
    const targetNav = document.getElementById("nav-" + view);
    if (targetNav) targetNav.classList.add("active");

    if (view === "history") loadHistory();
    if (view === "stats") updateStats();
}

/* =========================
   CALCULATIONS (PLANNING)
========================= */

function calc() {
    const wakeInput = document.getElementById("wake").value;
    if (!wakeInput) return;

    const [hours, minutes] = wakeInput.split(":").map(Number);
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = `<h3>Heures de coucher suggérées :</h3>`;

    [6, 5, 4, 3].forEach(cycles => {
        const totalMinutes = cycles * CYCLE_DURATION + FALL_ASLEEP_TIME;
        const wakeDate = new Date();
        wakeDate.setHours(hours, minutes, 0, 0);
        
        if (wakeDate < new Date()) {
            wakeDate.setDate(wakeDate.getDate() + 1);
        }

        const sleepDate = new Date(wakeDate.getTime() - totalMinutes * 60000);
        renderResult(sleepDate, cycles, resultsContainer);
    });
}

function renderResult(date, cycles, container) {
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const statusClass = cycles >= 5 ? "good" : (cycles === 4 ? "medium" : "bad");

    container.innerHTML += `
        <div class="result ${statusClass}">
            <div>
                <div class="result-info">Coucher à</div>
                <div class="result-time">${timeStr}</div>
            </div>
            <div class="result-info">${cycles} cycles (${Math.floor(cycles * 1.5)}h)</div>
        </div>
    `;
}

/* =========================
   SESSION MANAGEMENT
========================= */

function startSleepSession() {
    const now = new Date();
    currentSession = {
        startTime: now.getTime(),
        startTimeStr: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    
    localStorage.setItem("activeSession", JSON.stringify(currentSession));
    updateSessionUI();
}

function endSleepSession() {
    if (!currentSession) return;

    const now = new Date();
    const endTime = now.getTime();
    const totalDurationMin = Math.floor((endTime - currentSession.startTime) / 60000);
    
    // Effective sleep time = Total time - 15min latency
    const effectiveSleepMin = Math.max(0, totalDurationMin - FALL_ASLEEP_TIME);
    const cycles = parseFloat((effectiveSleepMin / CYCLE_DURATION).toFixed(1));

    saveToHistory({
        date: new Date(currentSession.startTime).toLocaleDateString('fr-FR'),
        start: currentSession.startTimeStr,
        end: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        duration: effectiveSleepMin,
        cycles: cycles,
        timestamp: currentSession.startTime
    });

    currentSession = null;
    localStorage.removeItem("activeSession");
    updateSessionUI();
    switchView('history');
}

function updateSessionUI() {
    const sessionActive = document.getElementById("sessionActive");
    const sessionInactive = document.getElementById("sessionInactive");
    const startTimeDisplay = document.getElementById("sessionStartTime");

    if (currentSession) {
        sessionActive.style.display = "block";
        sessionInactive.style.display = "none";
        startTimeDisplay.innerText = currentSession.startTimeStr;
        startLiveTimer();
    } else {
        sessionActive.style.display = "none";
        sessionInactive.style.display = "block";
        stopLiveTimer();
    }
}

function startLiveTimer() {
    const timerDisplay = document.getElementById("liveTimer");
    const statusDisplay = document.getElementById("sleepStatus");
    if (timerInterval) clearInterval(timerInterval);

    const update = () => {
        if (!currentSession) return;
        const diff = Date.now() - currentSession.startTime;
        const diffMin = Math.floor(diff / 60000);

        if (diffMin < FALL_ASLEEP_TIME) {
            statusDisplay.innerText = "Phase d'endormissement...";
            statusDisplay.style.color = "var(--warning)";
            const remaining = FALL_ASLEEP_TIME * 60 - Math.floor(diff / 1000);
            timerDisplay.innerText = `${Math.floor(remaining / 60)}m ${remaining % 60}s`;
        } else {
            statusDisplay.innerText = "Sommeil effectif en cours";
            statusDisplay.style.color = "var(--success)";
            const sleepDiff = diff - (FALL_ASLEEP_TIME * 60000);
            const h = Math.floor(sleepDiff / 3600000);
            const m = Math.floor((sleepDiff % 3600000) / 60000);
            const s = Math.floor((sleepDiff % 60000) / 1000);
            timerDisplay.innerText = `${h}h ${m}m ${s}s`;
        }
    };

    update();
    timerInterval = setInterval(update, 1000);
}

function stopLiveTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

/* =========================
   HISTORY & STATS
========================= */

function saveToHistory(entry) {
    const history = JSON.parse(localStorage.getItem("sleepHistory") || "[]");
    history.push(entry);
    if (history.length > 30) history.shift();
    localStorage.setItem("sleepHistory", JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem("sleepHistory") || "[]");
    const container = document.getElementById("historyList");
    
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-dim); padding: 20px;">Aucune nuit enregistrée</p>';
        return;
    }

    container.innerHTML = history.slice().reverse().map(item => `
        <div class="history-item-complex">
            <div class="history-date">${item.date}</div>
            <div class="history-details">
                <span>${item.start} → ${item.end}</span>
                <span class="history-cycles">${item.cycles} cycles</span>
            </div>
            <div class="history-duration">${Math.floor(item.duration / 60)}h ${item.duration % 60}m de sommeil effectif</div>
        </div>
    `).join('');
}

function updateStats() {
    const history = JSON.parse(localStorage.getItem("sleepHistory") || "[]");
    const statsContent = document.getElementById("statsContent");

    if (history.length === 0) {
        statsContent.innerHTML = '<p class="subtitle">Enregistrez quelques nuits pour voir vos stats</p>';
        return;
    }

    const avgDuration = history.reduce((acc, curr) => acc + curr.duration, 0) / history.length;
    const avgCycles = history.reduce((acc, curr) => acc + curr.cycles, 0) / history.length;

    statsContent.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${Math.floor(avgDuration / 60)}h ${Math.round(avgDuration % 60)}m</div>
                <div class="stat-label">Moyenne Sommeil</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${avgCycles.toFixed(1)}</div>
                <div class="stat-label">Moyenne Cycles</div>
            </div>
        </div>
        <div class="stats-info">
            Basé sur vos ${history.length} dernières nuits (hors latence d'endormissement).
        </div>
    `;
}

function clearHistory() {
    if (confirm("Voulez-vous vraiment supprimer tout l'historique ?")) {
        localStorage.removeItem("sleepHistory");
        loadHistory();
        updateStats();
    }
}

// Initialize
window.addEventListener("load", () => {
    const savedSession = localStorage.getItem("activeSession");
    if (savedSession) {
        currentSession = JSON.parse(savedSession);
    }
    updateSessionUI();
});
