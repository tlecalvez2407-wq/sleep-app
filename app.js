const cycle = 90;
const latency = 15;

let targetTime = null;

function format(d){
return d.toTimeString().slice(0,5);
}

function calc(){

const wake = document.getElementById("wake").value;
if(!wake) return;

const [h,m] = wake.split(":").map(Number);
const wakeDate = new Date();
wakeDate.setHours(h,m,0,0);

const results = document.getElementById("results");
results.innerHTML = "";

[6,5,4,3].forEach((c,i)=>{

const t = new Date(wakeDate.getTime() - ((c*cycle+latency)*60000));

let cls = "result";
if(i===0) cls += " good";
else if(i===1) cls += " mid";
else cls += " bad";

results.innerHTML += `
<div class="${cls}">
${format(t)} — ${c*1.5}h (${c} cycles)
</div>
`;

if(i===0) targetTime = t;
});

startTimer();
notifyPermission();

}

function sleepNow(){

const now = new Date();

const results = document.getElementById("results");
results.innerHTML = "";

[3,4,5,6].forEach((c,i)=>{

const t = new Date(now.getTime() + ((c*cycle+latency)*60000));

let cls = "result";
if(i===1) cls="result good";

results.innerHTML += `
<div class="${cls}">
Réveil : ${format(t)} — ${c*1.5}h
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