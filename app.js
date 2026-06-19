const cycle = 90;
const latency = 15;

let targetTime = null;
let timerInterval = null;

/* =========================
   HISTORIQUE
========================= */

function loadHistory(){

    const history = JSON.parse(
        localStorage.getItem("sleepHistory") || "[]"
    );

    const container = document.getElementById("historyList");

    if(!container) return;

    if(history.length === 0){
        container.innerHTML = "<p>Aucune nuit enregistrée</p>";
        return;
    }

    container.innerHTML = "";

    history.slice().reverse().forEach(item => {

        container.innerHTML += `
        <div class="result ${item.class}">
            ${item.time}
            — ${item.cycles} cycles
        </div>
        `;

    });
}

function saveHistory(time, cycles, cls){

    const history = JSON.parse(
        localStorage.getItem("sleepHistory") || "[]"
    );

    history.push({
        time,
        cycles,
        class: cls,
        date: Date.now()
    });

    localStorage.setItem(
        "sleepHistory",
        JSON.stringify(history)
    );

    loadHistory();
}

/* =========================
   NAVIGATION
========================= */

function switchView(view){

    document.querySelectorAll(".view").forEach(v=>{
        v.classList.remove("active");
    });

    document
    .getElementById(view + "View")
    .classList.add("active");

    document.querySelectorAll(".navbar button")
    .forEach(btn=>{
        btn.classList.remove("active");
    });

    if(view==="home"){
        document.querySelectorAll(".navbar button")[0]
        .classList.add("active");
    }

    if(view==="stats"){
        document.querySelectorAll(".navbar button")[1]
        .classList.add("active");
    }

    if(view==="history"){
        document.querySelectorAll(".navbar button")[2]
        .classList.add("active");
    }

    moveIndicator(view);

    if(view==="history"){
        loadHistory();
    }
}

/* =========================
   INDICATEUR
========================= */

function moveIndicator(view){

    const ind =
    document.querySelector(".nav-indicator");

    if(!ind) return;

    if(view==="home"){
        ind.style.transform="translateX(0%)";
    }

    if(view==="stats"){
        ind.style.transform="translateX(100%)";
    }

    if(view==="history"){
        ind.style.transform="translateX(200%)";
    }
}

/* =========================
   TIMER
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
   CALCUL HEURES
========================= */

function calc(){

    clearTimer();

    const wake =
    document.getElementById("wake").value;

    if(!wake) return;

    const [h,m] =
    wake.split(":").map(Number);

    const res =
    document.getElementById("results");

    res.innerHTML = "";

    [6,5,4,3].forEach(c=>{

        const total =
        c * (cycle + latency);

        const d = new Date();

        d.setHours(h,m);

        const sleep =
        new Date(d.getTime() - total*60000);

        const hours =
        sleep.getHours()
        .toString()
        .padStart(2,"0");

        const minutes =
        sleep.getMinutes()
        .toString()
        .padStart(2,"0");

        const time =
        `${hours}:${minutes}`;

        const cls =
        c >= 5 ? "good"
        : c === 4 ? "medium"
        : "bad";

        res.innerHTML += `
        <div class="result ${cls}">
            ${time}
            — ${c} cycles
        </div>
        `;
    });
}

/* =========================
   JE VAIS DORMIR
========================= */

function sleepNow(){

    clearTimer();

    const now = new Date();

    const res =
    document.getElementById("results");

    res.innerHTML = "";

    [6,5,4,3].forEach((c,i)=>{

        const t =
        new Date(
            now.getTime() +
            c*(cycle+latency)*60000
        );

        const hours =
        t.getHours()
        .toString()
        .padStart(2,"0");

        const minutes =
        t.getMinutes()
        .toString()
        .padStart(2,"0");

        const time =
        `${hours}:${minutes}`;

        const cls =
        c >= 5 ? "good"
        : c === 4 ? "medium"
        : "bad";

        res.innerHTML += `
        <div class="result ${cls}">
            ${time}
            — ${c} cycles
        </div>
        `;

        if(c === 6){
            saveHistory(
                time,
                c,
                cls
            );
        }

        if(i === 1){
            targetTime = t;
        }

    });

    startTimer();
}

/* =========================
   TIMER LIVE
========================= */

function startTimer(){

    if(timerInterval){
        clearInterval(timerInterval);
    }

    timerInterval =
    setInterval(()=>{

        if(!targetTime) return;

        const diff =
        targetTime - new Date();

        if(diff <= 0){

            document.getElementById("timer")
            .innerText =
            "🔥 C'est l'heure";

            return;
        }

        const h =
        Math.floor(diff/3600000);

        const m =
        Math.floor(
            diff%3600000/60000
        );

        const s =
        Math.floor(
            diff%60000/1000
        );

        document.getElementById("timer")
        .innerText =
        `${h}h ${m}m ${s}s`;

    },1000);
}

/* =========================
   INIT
========================= */

window.addEventListener("load", ()=>{

    const firstButton =
    document.querySelector(".navbar button");

    if(firstButton){
        firstButton.classList.add("active");
    }

    loadHistory();
});