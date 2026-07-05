/**
 * Sleep Cycle App - Debug Mode
 * Permet de simuler des sessions de sommeil pour tester l'UI et les Stats.
 */

const DebugMode = {
    // Simuler une nuit spécifique
    simulateNight: function(startTimeStr, endTimeStr, mood) {
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

        const entry = {
            date: start.toLocaleDateString('fr-FR'),
            start: startTimeStr,
            end: endTimeStr,
            duration: effectiveSleepMin,
            cycles: cycles,
            score: score,
            mood: mood,
            timestamp: start.getTime()
        };

        saveToHistory(entry);
        alert("Nuit simulée ajoutée !");
        if (typeof loadHistory === 'function') loadHistory();
        if (typeof updateStats === 'function') updateStats();
    },

    // Générer une semaine de données aléatoires
    generateWeek: function() {
        const moods = ["😴", "😐", "🙂", "🔥"];
        for (let i = 7; i > 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Heure de coucher entre 22:00 et 00:30
            const startH = 22 + Math.floor(Math.random() * 3);
            const startM = Math.floor(Math.random() * 60);
            
            // Durée entre 6h et 9h
            const sleepDurationH = 6 + Math.random() * 3;
            const end = new Date(date.getTime() + (startH * 3600000) + (startM * 60000) + (sleepDurationH * 3600000));
            
            const startStr = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
            const endStr = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
            const mood = moods[Math.floor(Math.random() * moods.length)];
            
            this.simulateNight(startStr, endStr, mood);
        }
    },

    togglePanel: function() {
        const panel = document.getElementById('debugPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
};

// Ajouter le bouton debug au chargement
window.addEventListener('DOMContentLoaded', () => {
    const debugBtn = document.createElement('div');
    debugBtn.innerHTML = '⚙️';
    debugBtn.style.cssText = 'position:fixed; top:10px; right:10px; z-index:9999; opacity:0.3; cursor:pointer; font-size:20px;';
    debugBtn.onclick = () => DebugMode.togglePanel();
    document.body.appendChild(debugBtn);
});
