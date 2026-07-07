/**
 * Sleep Cycle App - Core Logic
 */

const CYCLE_DURATION = 90; // minutes
let fallAsleepTime = parseInt(localStorage.getItem("fallAsleepTime")) || 15;
let notificationsEnabled = localStorage.getItem("notificationsEnabled") === "true";

let timerInterval = null;
let currentSession = null;
let scheduledReminders = []; // Pour garder trace des timeouts

/* =========================
   UTILITIES
========================= */

function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function roundCycles(cycles) {
    return Math.round(cycles * 2) / 2;
}

function calculateSleepScore(durationMin, cycles) {
    let score = 0;
    if (durationMin >= 450 && durationMin <= 540) score += 60;
    else if (durationMin > 540) score += 45;
    else if (durationMin >= 360) score += 40;
    else score += 20;

    const rounded = roundCycles(cycles);
    if (rounded === 5 || rounded === 6) score += 40;
    else if (rounded === 4) score += 25;
    else if (rounded > 6) score += 30;
    else score += 10;

    return Math.min(100, score);
}

/* =========================
   NOTIFICATIONS SYSTEM
========================= */

async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("Ce navigateur ne supporte pas les notifications.");
        return false;
    }

    let permission = await Notification.requestPermission();
    if (permission === "granted") {
        notificationsEnabled = true;
        localStorage.setItem("notificationsEnabled", "true");
        updateNotificationUI();
        showNotification("Notifications activées !", { body: "Vous recevrez désormais vos rappels de sommeil." });
        return true;
    } else {
        notificationsEnabled = false;
        localStorage.setItem("notificationsEnabled", "false");
        updateNotificationUI();
        return false;
    }
}

function toggleNotifications() {
    if (!notificationsEnabled) {
        requestNotificationPermission();
    } else {
        notificationsEnabled = false;
        localStorage.setItem("notificationsEnabled", "false");
        updateNotificationUI();
        cancelAllNotifications();
    }
}

function updateNotificationUI() {
    const btn = document.getElementById("notifToggleBtn");
    if (btn) {
        btn.innerText = notificationsEnabled ? "Désactiver les rappels" : "Activer les rappels";
        btn.className = notificationsEnabled ? "secondary" : "primary";
    }
}

function showNotification(title, options = {}) {
    if (!notificationsEnabled || Notification.permission !== "granted") return;

    const defaultOptions = {
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        vibrate: [200, 100, 200]
    };

    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_NOTIFICATION',
            title: title,
            options: { ...defaultOptions, ...options },
            delay: 0
        });
    } else {
        new Notification(title, { ...defaultOptions, ...options });
    }
}

function scheduleNotification(title, body, date) {
    if (!notificationsEnabled || Notification.permission !== "granted") return;

    const now = new Date().getTime();
    const target = date.getTime();
    const delay = target - now;

    if (delay <= 0) return;

    const timeoutId = setTimeout(() => {
        showNotification(title, { body: body });
    }, delay);

    scheduledReminders.push(timeoutId);
}

function cancelAllNotifications() {
    scheduledReminders.forEach(id => clearTimeout(id));
    scheduledReminders = [];
}

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
   SETTINGS
========================= */

function updateLatency(val) {
    fallAsleepTime = parseInt(val);
    localStorage.setItem("fallAsleepTime", fallAsleepTime);
    document.getElementById("latencyVal").innerText = fallAsleepTime;
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

    cancelAllNotifications(); // Reset les anciens rappels

    [6, 5, 4, 3].forEach(cycles => {
        const totalMinutesAtBed = cycles * CYCLE_DURATION + fallAsleepTime;
        const wakeDate = new Date();
        wakeDate.setHours(hours, minutes, 0, 0);
        
        if (wakeDate < new Date()) {
            wakeDate.setDate(wakeDate.getDate() + 1);
        }

        const sleepDate = new Date(wakeDate.getTime() - totalMinutesAtBed * 60000);
        renderResult(sleepDate, cycles, resultsContainer, "Coucher à");

        // Programmer un rappel 5 minutes avant l'heure de coucher idéale (ex: 5 cycles)
        if (cycles === 5 && notificationsEnabled) {
            const reminderDate = new Date(sleepDate.getTime() - 5 * 60000);
            scheduleNotification(
                "Il est presque l'heure !", 
                `Préparez-vous à dormir dans 5 minutes pour vos 5 cycles (${formatDuration(cycles * 90)}).`,
                reminderDate
            );
        }
    });
}

function calcWakeNow() {
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = `<h3>Heures de réveil suggérées :</h3>`;
    const now = new Date();

    [6, 5, 4, 3].forEach(cycles => {
        const totalMinutesAtBed = cycles * CYCLE_DURATION + fallAsleepTime;
        const wakeDate = new Date(now.getTime() + totalMinutesAtBed * 60000);
        renderResult(wakeDate, cycles, resultsContainer, "Réveil à");
    });
}

function renderResult(date, cycles, container, label) {
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const statusClass = cycles >= 5 ? "good" : (cycles === 4 ? "medium" : "bad");
    const sleepEffectiveMin = cycles * CYCLE_DURATION;

    container.innerHTML += `
        <div class="result ${statusClass}">
            <div>
                <div class="result-info">${label}</div>
                <div class="result-time">${timeStr}</div>
            </div>
            <div style="text-align: right">
                <div class="result-info">${cycles} cycles</div>
                <div class="result-info" style="font-size: 11px">Sommeil : ${formatDuration(sleepEffectiveMin)}</div>
            </div>
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

    // Notification de rappel au bout de 8h par défaut si on oublie
    if (notificationsEnabled) {
        const eightHoursLater = new Date(now.getTime() + 8 * 3600000);
        scheduleNotification(
            "Bonjour !", 
            "Votre session de sommeil est toujours active. N'oubliez pas de l'enregistrer.",
            eightHoursLater
        );
    }
}

function cancelSleepSession() {
    if (confirm("Voulez-vous annuler cette session ? Elle ne sera pas enregistrée.")) {
        stopLiveTimer();
        cancelAllNotifications();
        currentSession = null;
        localStorage.removeItem("activeSession");
        updateSessionUI();
    }
}

function endSleepSession() {
    if (!currentSession) return;
    document.getElementById("wakeUpFeedback").style.display = "block";
    document.getElementById("liveTimerContainer").style.display = "none";
    cancelAllNotifications();
}

function confirmWakeUp(mood) {
    const now = new Date();
    const endTime = now.getTime();
    const totalDurationMin = Math.floor((endTime - currentSession.startTime) / 60000);
    const effectiveSleepMin = Math.max(0, totalDurationMin - fallAsleepTime);
    const cyclesRaw = effectiveSleepMin / CYCLE_DURATION;
    const cyclesRounded = roundCycles(cyclesRaw);
    
    let score = calculateSleepScore(effectiveSleepMin, cyclesRounded);
    if (mood === "🔥") score = Math.min(100, score + 10);
    if (mood === "😴") score = Math.max(0, score - 15);

    saveToHistory({
        date: new Date(currentSession.startTime).toLocaleDateString('fr-FR'),
        start: currentSession.startTimeStr,
        end: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        duration: effectiveSleepMin,
        cycles: cyclesRounded,
        score: score,
        mood: mood,
        timestamp: currentSession.startTime
    });

    stopLiveTimer();
    currentSession = null;
    localStorage.removeItem("activeSession");
    document.getElementById("wakeUpFeedback").style.display = "none";
    document.getElementById("liveTimerContainer").style.display = "block";
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

        if (diffMin < fallAsleepTime) {
            statusDisplay.innerText = "Phase d'endormissement...";
            statusDisplay.style.color = "var(--warning)";
            const remaining = fallAsleepTime * 60 - Math.floor(diff / 1000);
            timerDisplay.innerText = `${Math.floor(remaining / 60)}m ${remaining % 60}s`;
        } else {
            statusDisplay.innerText = "Sommeil effectif en cours";
            statusDisplay.style.color = "var(--success)";
            const sleepDiff = diff - (fallAsleepTime * 60000);
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
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
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

    container.innerHTML = history.slice().reverse().map(item => {
        const badgeClass = item.score >= 80 ? "good" : (item.score >= 50 ? "medium" : "bad");
        const badgeLabel = item.score >= 80 ? "Excellent" : (item.score >= 50 ? "Correct" : "Court");
        
        return `
            <div class="history-item-complex ${badgeClass}">
                <div class="history-header">
                    <span class="history-date">${item.date}</span>
                    <span class="score-badge ${badgeClass}">${item.score}/100</span>
                </div>
                <div class="history-details">
                    <span>${item.start} → ${item.end} ${item.mood || ''}</span>
                    <span class="history-cycles">${item.cycles} cycles</span>
                </div>
                <div class="history-footer">
                    <span>${formatDuration(item.duration)} de sommeil</span>
                    <span class="quality-label">${badgeLabel}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateStats() {
    const history = JSON.parse(localStorage.getItem("sleepHistory") || "[]");
    const statsContent = document.getElementById("statsContent");

    if (history.length === 0) {
        statsContent.innerHTML = '<p class="subtitle">Enregistrez quelques nuits pour voir vos stats</p>';
        return;
    }

    const totalDuration = history.reduce((acc, curr) => acc + curr.duration, 0);
    const avgDuration = totalDuration / history.length;
    const avgCycles = history.reduce((acc, curr) => acc + curr.cycles, 0) / history.length;
    const avgScore = history.reduce((acc, curr) => acc + (curr.score || 0), 0) / history.length;
    const bestNight = Math.max(...history.map(h => h.duration));
    const worstNight = Math.min(...history.map(h => h.duration));

    let insight = "";
    if (avgDuration >= 450) insight = "Vous dormez en moyenne plus de 7h30, ce qui est excellent pour votre récupération.";
    else if (avgDuration >= 360) insight = "Votre moyenne de sommeil est correcte, mais essayez de viser 5 cycles (7h30) plus souvent.";
    else insight = "Vos nuits sont courtes en moyenne. Essayez de vous coucher 30min plus tôt ce soir.";

    statsContent.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${Math.round(avgScore)}</div>
                <div class="stat-label">Score Moyen</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatDuration(avgDuration)}</div>
                <div class="stat-label">Moyenne Sommeil</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${avgCycles.toFixed(1)}</div>
                <div class="stat-label">Moyenne Cycles</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatDuration(bestNight)}</div>
                <div class="stat-label">Meilleure Nuit</div>
            </div>
        </div>
        
        <div class="stats-insight">
            <h4>Résumé intelligent</h4>
            <p>${insight}</p>
        </div>

        <div class="stats-info">
            <p><strong>Pire nuit :</strong> ${formatDuration(worstNight)}</p>
            <p><strong>Temps total suivi :</strong> ${formatDuration(totalDuration)}</p>
            <p><strong>Nuits enregistrées :</strong> ${history.length}</p>
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
    const latencyInput = document.getElementById("latencyInput");
    if(latencyInput) {
        latencyInput.value = fallAsleepTime;
        document.getElementById("latencyVal").innerText = fallAsleepTime;
    }
    updateNotificationUI();
    updateSessionUI();
});
