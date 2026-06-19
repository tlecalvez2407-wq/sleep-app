const cycle = 90;
const latency = 15;

let targetTime = null;

function format(d){
return d.toTimeString().slice(0,5);
}

function calc() {
    const wake = document.getElementById("wake").value;
    if (!wake) return;

    const [h, m] = wake.split(":").map(Number);

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    const cycle = 90 + 15; // 105 min
    const options = [6, 5, 4, 3]; // cycles

    options.forEach(cycles => {
        let totalMinutes = cycles * cycle;

        let wakeDate = new Date();
        wakeDate.setHours(h);
        wakeDate.setMinutes(m);

        let sleepTime = new Date(wakeDate.getTime() - totalMinutes * 60000);

        let hours = sleepTime.getHours().toString().padStart(2, "0");
        let minutes = sleepTime.getMinutes().toString().padStart(2, "0");

        let qualityClass = "";
        let label = "";

        if (cycles === 6) {
            qualityClass = "good";
            label = "Optimal";
        } else if (cycles === 4) {
            qualityClass = "medium";
            label = "Correct";
        } else {
            qualityClass = "bad";
            label = "Court";
        }

        const card = document.createElement("div");
        card.className = `result-card ${qualityClass}`;

        card.innerHTML = `
            <div>
                <div class="result-time">${hours}:${minutes}</div>
                <div class="result-info">${cycles} cycles • ${label}</div>
            </div>
        `;

        resultsDiv.appendChild(card);
    });
}

function sleepNow(){

const now = new Date();

const results = document.getElementById("results");
results.innerHTML = "";

const cycles = [3,4,5,6];

cycles.forEach((c,i)=>{

const t = new Date(now.getTime() + ((c*cycle+latency)*60000));

let cls = "";

if(c >= 5){
    cls = "good";
}
else if(c === 4){
    cls = "medium";
}
else{
    cls = "bad";
}

const hours = t.getHours().toString().padStart(2,"0");
const minutes = t.getMinutes().toString().padStart(2,"0");

results.innerHTML += `
<div class="result-card ${cls}">
    <div>
        <div class="result-time">${hours}:${minutes}</div>
        <div class="result-info">${c} cycles • ${(c*1.5).toFixed(1)}h</div>
    </div>
</div>
`;

if(i===1) targetTime = t;

});

startTimer();
notifyPermission();
}

function startTimer(){
setInterval(()=>{

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