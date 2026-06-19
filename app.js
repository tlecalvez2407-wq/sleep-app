console.log("VERSION 2026 - APP JS CHARGE");
const cycle = 90;
const latency = 15;

let targetTime = null;
let timerInterval = null;

function format(d){
    return d.toTimeString().slice(0,5);
}

function clearTimer(){
    targetTime = null;
    document.getElementById("timer").innerText = "";

    if(timerInterval){
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/* =========================
   CALCUL HEURES DE COUCHER
========================= */
function calc() {

    clearTimer();

    const wake = document.getElementById("wake").value;
    if (!wake) return;

    const [h, m] = wake.split(":").map(Number);

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    const options = [6, 5, 4, 3];

    let results = [];

    options.forEach(cycles => {

        let totalMinutes = cycles * (cycle + latency);

        let wakeDate = new Date();
        wakeDate.setHours(h);
        wakeDate.setMinutes(m);

        let sleepTime = new Date(wakeDate.getTime() - totalMinutes * 60000);

        let hours = sleepTime.getHours().toString().padStart(2, "0");
        let minutes = sleepTime.getMinutes().toString().padStart(2, "0");

        let cls = "";

        if (cycles === 6 || cycles === 5) cls = "good";
        else if (cycles === 4) cls = "medium";
        else cls = "bad";

        results.push(`
            <div class="result-card ${cls}">
                <div>
                    <div class="result-time">${hours}:${minutes}</div>
                    <div class="result-info">${cycles} cycles • ${(cycles*1.5).toFixed(1)}h</div>
                </div>
            </div>
        `);
    });

    resultsDiv.innerHTML = results.join("");
}

/* =========================
   MODE "JE VAIS DORMIR"
========================= */
function sleepNow(){

    clearTimer();

    const now = new Date();
    const results = document.getElementById("results");
    results.innerHTML = "";

    const cycles = [6,5,4,3];

    let output = [];

    cycles.forEach((c,i)=>{

        const t = new Date(now.getTime() + ((c*(cycle+latency))*60000));

        let hours = t.getHours().toString().padStart(2,"0");
        let minutes = t.getMinutes().toString().padStart(2,"0");

        let cls = "";

        if(c === 6 || c === 5) cls = "good";
        else if(c === 4) cls = "medium";
        else cls = "bad";

        output.push(`
            <div class="result-card ${cls}">
                <div>
                    <div class="result-time">${hours}:${minutes}</div>
                    <div class="result-info">${c} cycles • ${(c*1.5).toFixed(1)}h</div>
                </div>
            </div>
        `);

        if(i === 1) targetTime = t;
    });

    results.innerHTML = output.join("");

    startTimer();
    notifyPermission();
}

/* =========================
   TIMER
========================= */
function startTimer(){

    if(timerInterval){
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(()=>{

        if(!targetTime) return;

        const diff = targetTime - new Date();

        if(diff <= 0){
            document.getElementById("timer").innerText = "🔥 C'est l'heure !";
            return;
        }

        const h = Math.floor(diff/3600000);
        const m = Math.floor(diff%3600000/60000);
        const s = Math.floor(diff%60000/1000);

        document.getElementById("timer").innerText =
        `⏳ ${h}h ${m}m ${s}s`;

    },1000);
}

/* =========================
   NOTIFICATIONS
========================= */
function notifyPermission(){
    if(Notification.permission !== "granted"){
        Notification.requestPermission();
    }
}

setInterval(()=>{
    if(targetTime && new Date() >= targetTime){
        new Notification("Sleep Cycle 😴",{
            body:"C'est le moment de dormir"
        });
    }
},60000);

function switchView(view){

    document.getElementById("homeView").classList.remove("active");
    document.getElementById("statsView").classList.remove("active");
    document.getElementById("historyView").classList.remove("active");

    if(view === "home"){
        document.getElementById("homeView").classList.add("active");
    }
    if(view === "stats"){
        document.getElementById("statsView").classList.add("active");
    }
    if(view === "history"){
        document.getElementById("historyView").classList.add("active");
    }

    updateNav(view);

    moveIndicator(view);
}

function updateNav(active){

    const buttons = document.querySelectorAll(".navbar button");

    buttons.forEach(btn => btn.classList.remove("active"));

    if(active === "home") buttons[0].classList.add("active");
    if(active === "stats") buttons[1].classList.add("active");
    if(active === "history") buttons[2].classList.add("active");
}

window.addEventListener("load", () => {
    updateNav("home");
});

function moveIndicator(view){

    const indicator = document.querySelector(".nav-indicator");

    if(view === "home"){
        indicator.style.transform = "translateX(0%)";
    }

    if(view === "stats"){
        indicator.style.transform = "translateX(100%)";
    }

    if(view === "history"){
        indicator.style.transform = "translateX(200%)";
    }
}