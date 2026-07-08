/**
 * Sleep Cycle App - Debug Mode
 */

const DebugMode = {
    simulateNight: function(startTimeStr, endTimeStr, mood) {
        try {
            const today = new Date();
            const [sH, sM] = startTimeStr.split(':').map(Number);
            const [eH, eM] = endTimeStr.split(':').map(Number);
            
            const start = new Date(today);
            start.setHours(sH, sM, 0);
            
            const end = new Date(today);
            end.setHours(eH, eM, 0);
            if (end < start) end.setDate(end.getDate() + 1);
            
            const durationMin = Math.floor((end - start) / 60000);
            const effectiveSleepMin = Math.max(0, durationMin - fallAsleepTime);
            const cycles = roundCycles(effectiveSleepMin / CYCLE_DURATION);
            
            let score = calculateSleepScore(effectiveSleepMin, cycles);
            if (mood === "🔥") score = Math.min(100, score + 10);
            if (mood === "😴") score = Math.max(0, score - 15);

            saveToHistory({
                date: start.toLocaleDateString('fr-FR'),
                start: startTimeStr,
                end: endTimeStr,
                duration: effectiveSleepMin,
                cycles: cycles,
                score: score,
                mood: mood,
                timestamp: start.getTime()
            });
            alert("Nuit simulée ajoutée !");
            if (typeof loadHistory === 'function') loadHistory();
            if (typeof updateStats === 'function') updateStats();
        } catch (e) {
            alert("Erreur Simulation: " + e.message);
        }
    },

    generateWeek: function() {
        const moods = ["😴", "😐", "🙂", "🔥"];
        for (let i = 7; i > 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const startH = 22 + Math.floor(Math.random() * 3);
            const startM = Math.floor(Math.random() * 60);
            const sleepDurationH = 6 + Math.random() * 3;
            const end = new Date(date.getTime() + (startH * 3600000) + (startM * 60000) + (sleepDurationH * 3600000));
            this.simulateNight(
                `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
                `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
                moods[Math.floor(Math.random() * moods.length)]
            );
        }
    },

    checkNotifStatus: function() {
        console.log("Diagnostic lancé...");
        try {
            const hasNotif = ("Notification" in window);
            const permission = hasNotif ? Notification.permission : "Non supporté";
            const sw = navigator.serviceWorker ? (navigator.serviceWorker.controller ? "Actif" : "Installé mais non contrôlé") : "Non supporté";
            const config = localStorage.getItem("notificationsEnabled") || "Non défini";
            
            const msg = `DIAGNOSTIC :\n- Support : ${hasNotif}\n- Permission : ${permission}\n- SW : ${sw}\n- Config : ${config}`;
            alert(msg);
        } catch (e) {
            alert("Erreur Diagnostic: " + e.message);
        }
    },

    forceRequestPermission: function() {
        if (typeof requestNotificationPermission === 'function') {
            requestNotificationPermission().then(res => {
                alert("Résultat: " + (res ? "Accordé" : "Refusé/Annulé"));
            }).catch(err => alert("Erreur Permission: " + err.message));
        } else {
            alert("Fonction requestNotificationPermission introuvable dans app.js");
        }
    },

    testNotifNow: function() {
        if (typeof showNotification === 'function') {
            alert("Notification dans 3s...");
            setTimeout(() => {
                showNotification("Test Debug 🚀", { body: "Test de notification immédiat." });
            }, 3000);
        } else {
            alert("Fonction showNotification introuvable");
        }
    },

    togglePanel: function() {
        const panel = document.getElementById('debugPanel');
        if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
};

// Injection du bouton
(function() {
    const btn = document.createElement('div');
    btn.innerHTML = '⚙️';
    btn.style.cssText = 'position:fixed; top:10px; right:10px; z-index:10000; opacity:0.5; cursor:pointer; font-size:24px; padding:10px;';
    btn.onclick = () => DebugMode.togglePanel();
    document.body.appendChild(btn);
    console.log("Mode Debug chargé");
})();
