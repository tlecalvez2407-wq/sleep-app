const cycle = 90;
const latency = 15;

let targetTime = null;
let timerInterval = null;

/* =========================
   NAVIGATION
========================= */
function switchView(view){

    document.querySelectorAll(".view").forEach(v=>{
        v.classList.remove("active");
    });

    document.getElementById(view+"View").classList.add("active");

    const buttons = document.querySelectorAll(".navbar button");

    buttons.forEach(b=>b.classList.remove("active"));

    if(view === "home") buttons[0].classList.add("active");
    if(view === "stats") buttons[1].classList.add("active");
    if(view === "history") buttons[2].classList.add("active");

    moveIndicator(view);
}

/* =========================
   INDICATOR FIX (IMPORTANT)
========================= */
function moveIndicator(view){

    const ind = document.querySelector(".nav-indicator");
    if(!ind) return;

    let x = 0;

    if(view === "home") x = 0;
    if(view === "stats") x = 100;
    if(view === "history") x = 200;

    ind.style.transform = `translateX(${x}%)`;
}

/* =========================
   CLEAR TIMER
========================= */
function clearTimer(){

    targetTime = null;

    document.getElementById("timer").innerText = "";

    if(timerInterval){
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/* =========================
   CALCULATE SLEEP TIMES
========================= */
function calc(){

    clearTimer();

    const wake = document.getElementById("wake").value;
    if(!wake) return;

    const [h,m] = wake.split(":").map(Number);

    const res = document.getElementById("results");
    res.innerHTML = "";

    const cycles = [6,5,4,3];

    cycles.forEach(c=>{

        const total = c * (cycle + latency);

        const base = new Date();
        base.setHours(h,m,0,0);

        const sleep = new Date(base.getTime() - total * 60000);

        const cls =
            c >= 5 ? "good" :
            c === 4 ? "medium" :
            "bad";

        res.innerHTML += `
            <div class="result ${cls}">
                ${formatTime(sleep)} — ${c} cycles
            </div>
        `;
    });
}

/* =========================
   SLEEP NOW MODE
========================= */
function sleepNow(){

    clearTimer();

    const now = new Date();
    const res = document.getElementById("results");
    res.innerHTML = "";

    const cycles = [6,5,4,3];

    cycles.forEach((c,i)=>{

        const t = new Date(now.getTime() + c * (cycle + latency) * 60000);

        const cls =
            c >= 5 ? "good" :
            c === 4 ? "medium" :
            "bad";

        res.innerHTML += `
            <div class="result ${cls}">
                ${formatTime(t)} — ${c} cycles
            </div>
        `;

        if(i === 1){
            targetTime = t;
        }
    });

    startTimer();
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
            document.getElementById("timer").innerText = "🔥 C'est l'heure";
            return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        document.getElementById("timer").innerText =
            `${h}h ${m}m ${s}s`;

    },1000);
}

/* =========================
   FORMAT TIME
========================= */
function formatTime(date){
    return date.toTimeString().slice(0,5);
}