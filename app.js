console.log("Sleep app loaded");

const cycle = 90;
const latency = 15;

let targetTime = null;
let timerInterval = null;

/* NAVIGATION */
function switchView(view){

    document.querySelectorAll(".view").forEach(v=>{
        v.classList.remove("active");
    });

    document.getElementById(view+"View").classList.add("active");

    document.querySelectorAll(".navbar button").forEach(b=>{
        b.classList.remove("active");
    });

    if(view==="home") document.querySelectorAll(".navbar button")[0].classList.add("active");
    if(view==="stats") document.querySelectorAll(".navbar button")[1].classList.add("active");
    if(view==="history") document.querySelectorAll(".navbar button")[2].classList.add("active");

    moveIndicator(view);
}

function moveIndicator(view){
    const ind = document.querySelector(".nav-indicator");

    if(view==="home") ind.style.transform="translateX(0%)";
    if(view==="stats") ind.style.transform="translateX(100%)";
    if(view==="history") ind.style.transform="translateX(200%)";
}

/* RESET TIMER */
function clearTimer(){
    targetTime = null;
    if(timerInterval) clearInterval(timerInterval);
    document.getElementById("timer").innerText = "";
}

/* CALCUL HEURES */
function calc(){

    clearTimer();

    const wake = document.getElementById("wake").value;
    if(!wake) return;

    const [h,m] = wake.split(":").map(Number);

    const res = document.getElementById("results");
    res.innerHTML = "";

    [6,5,4,3].forEach(cycles=>{

        let total = cycles * (cycle + latency);

        let base = new Date();
        base.setHours(h,m);

        let sleep = new Date(base.getTime() - total*60000);

        let cls = cycles >= 5 ? "good" : cycles === 4 ? "medium" : "bad";

        res.innerHTML += `
        <div class="result ${cls}">
            ${sleep.getHours().toString().padStart(2,"0")}:
            ${sleep.getMinutes().toString().padStart(2,"0")}
            — ${cycles} cycles
        </div>`;
    });
}

/* MODE DODO */
function sleepNow(){

    clearTimer();

    const now = new Date();
    const res = document.getElementById("results");
    res.innerHTML = "";

    [6,5,4,3].forEach((c,i)=>{

        let t = new Date(now.getTime() + c*(cycle+latency)*60000);

        let cls = c >= 5 ? "good" : c === 4 ? "medium" : "bad";

        res.innerHTML += `
        <div class="result ${cls}">
            ${t.getHours().toString().padStart(2,"0")}:
            ${t.getMinutes().toString().padStart(2,"0")}
            — ${c} cycles
        </div>`;

        if(i === 1) targetTime = t;
    });

    startTimer();
}

/* TIMER */
function startTimer(){

    if(timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(()=>{

        if(!targetTime) return;

        let diff = targetTime - new Date();

        if(diff <= 0){
            document.getElementById("timer").innerText = "🔥 C'est l'heure de dormir";
            return;
        }

        let h = Math.floor(diff/3600000);
        let m = Math.floor(diff%3600000/60000);
        let s = Math.floor(diff%60000/1000);

        document.getElementById("timer").innerText =
        `${h}h ${m}m ${s}s`;

    },1000);
}