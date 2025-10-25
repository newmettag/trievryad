// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
const ROWS = 8;
const COLS = 8;
const GEM_TYPES = 8;
const CELL_SIZE = 60;
let gameArea;
let gems = [];
let selectedGem = null;
let score = 0;
let sobriety = 100;
let gameOver = false;
let sobrietyTimer = null;
let nextMilestone = 300;
window.gameStarted = false;

const sounds = {
    click: new Audio("sounds/click.mp3"),
    combo: new Audio("sounds/combo.mp3"),
    fall: new Audio("sounds/fall.mp3"),
    milestone: new Audio("sounds/milestone.mp3"),
};

const bgMusic = new Audio("sounds/music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.45;
// ========== ДИАЛОГИ ==========
const dialogues = [
    { name: "Макс ", text: "Ну что, Артём, готов к новой партии?", imgs: ["images/characters/max1.png","images/characters/max2.png"] },
    { name: "Артём ", text: "Ну я же завязал макс с тебя косяк!", imgs: ["images/characters/artem1.png","images/characters/artem2.png"] },
    { name: "Макс ", text: "Между первой и второй промежуток небольшой!", imgs: ["images/characters/max1.png","images/characters/max3.png"] },
    { name: "Артём ", text: "Ха... у меня уже кружится барная стойка...", imgs: ["images/characters/artem3.png","images/characters/artem2.png"] },
    { name: "Макс ", text: "Эй Артём опять белку поймаешь ?", imgs: ["images/characters/max1.png","images/characters/max2.png"] },
    { name: "Артём ", text: "Нет-нет, на этот раз я держусь!", imgs: ["images/characters/artem1.png","images/characters/artem3.png"] },
    { name: "Макс ", text: "камон камон бейби!", imgs: ["images/characters/max1.png","images/characters/max3.png"] },
    { name: "Артём ", text: "Ты и вправду не даёшь расслабиться...", imgs: ["images/characters/artem3.png","images/characters/artem2.png"] }
];
const finalDialogueDefeat = [
    { name: "Артём", text: "Я сделал это… Я смог остаться трезвым!", imgs: ["images/characters/artem1.png","images/characters/artem2.png"] },
    { name: "Макс", text: "Хм… Ладно, дружище, уважаю. Главное, чтобы тебе было хорошо.", imgs: ["images/characters/max1.png","images/characters/max2.png"] },
    { name: "Артём", text: "Спасибо тебе, Макс, что не сдавался со мной.", imgs: ["images/characters/artem1.png","images/characters/artem2.png"] },
    { name: "Макс", text: "Теперь ты точно можешь гордиться собой!", imgs: ["images/characters/max1.png","images/characters/max3.png"] },
    { name: "Артём", text: "Чувствую себя настоящим победителем!", imgs: ["images/characters/artem1.png","images/characters/artem3.png"] }
];
const finalDialogueVictory = [
    { name: "Артём", text: "Ах, нет… я снова забухал…", imgs: ["images/characters/artem1.png","images/characters/artem2.png"] },
    { name: "Макс", text: "АХХАХАХА а столько разговоров было.", imgs: ["images/characters/max1.png","images/characters/max2.png"] },
    { name: "Артём", text: "Слишком сложно удержаться от выпивки…", imgs: ["images/characters/artem1.png","images/characters/artem3.png"] },
    { name: "Макс", text: "Ода месячный запой !", imgs: ["images/characters/max1.png","images/characters/max3.png"] },
    { name: "Артём", text: "Ладно… давай по новой  .", imgs: ["images/characters/artem1.png","images/characters/artem2.png"] }
];
let dialogueIndex = 0;
// ========== ИГРОВОЙ ЦИКЛ ==========
function initGame() {
    gameArea = document.getElementById("gameArea");
    if (!gameArea) return;
    gameArea.innerHTML = "";
    gameArea.style.position = "relative";
    gameArea.style.width = `${COLS * CELL_SIZE}px`;
    gameArea.style.height = `${ROWS * CELL_SIZE}px`;
    score = 0;
    sobriety = 100;
    gameOver = false;
    selectedGem = null;
    nextMilestone = 300;
    createGrid();
    renderGrid();
    updateScore();
    updateSobrietyBar();
    startSobrietyDecay();
}

function createGrid() {
    gems = [];
    for (let r = 0; r < ROWS; r++) {
        const row = [];
        for (let c = 0; c < COLS; c++) {
            let newGem;
            do {
                newGem = Math.floor(Math.random() * GEM_TYPES) + 1;
            } while (
                (c >= 2 && row[c - 1] === newGem && row[c - 2] === newGem) ||
                (r >= 2 && gems[r - 1][c] === newGem && gems[r - 2][c] === newGem)
            );
            row.push(newGem);
        }
        gems.push(row);
    }
}

function renderGrid() {
    if (!gameArea) gameArea = document.getElementById("gameArea");
    gameArea.innerHTML = "";
    gameArea.style.width = `${COLS * CELL_SIZE}px`;
    gameArea.style.height = `${ROWS * CELL_SIZE}px`;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const gemType = gems[r][c];
            const gem = document.createElement("div");
            gem.className = "gem";
            gem.dataset.row = r;
            gem.dataset.col = c;
            gem.dataset.type = gemType;
            Object.assign(gem.style, {
                width: CELL_SIZE + "px",
                height: CELL_SIZE + "px",
                position: "absolute",
                left: c * CELL_SIZE + "px",
                top: r * CELL_SIZE + "px",
                backgroundImage: `url('images/alcool${gemType}.png')`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transition: "top 0.25s ease, left 0.25s ease, transform 0.18s ease, opacity 0.3s ease"
            });
            gem.addEventListener("click", onGemClick);
            gameArea.appendChild(gem);
        }
    }
}

// ========= КЛИКИ И СВАПЫ ==========
function onGemClick(e) {
    if (gameOver) return;
    const el = e.currentTarget;
    const row = +el.dataset.row, col = +el.dataset.col;

    if (!selectedGem) {
        selectedGem = { row, col, el };
        el.style.transform = "scale(1.12)";
        el.style.outline = "2px solid gold";
        playSound("click");
    } else {
        const prev = selectedGem;
        if (prev.el) { 
            prev.el.style.transform = "scale(1)"; 
            prev.el.style.outline = "none"; 
        }
        if (areAdjacent(prev.row, prev.col, row, col)) trySwap(prev.row, prev.col, row, col);
        selectedGem = null;
    }
}

function areAdjacent(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function trySwap(r1, c1, r2, c2) {
    swapGems(r1, c1, r2, c2);
    if (checkMatchesPreview()) {
        const a = document.querySelector(`.gem[data-row="${r1}"][data-col="${c1}"]`);
        const b = document.querySelector(`.gem[data-row="${r2}"][data-col="${c2}"]`);
        if (a && b) animateSwap(a, b);

        setTimeout(() => {
            if (checkMatches()) {
                playSound("combo");
                sobriety = Math.min(100, sobriety + 6);
                updateSobrietyBar(true);
            } else {
                swapGems(r1, c1, r2, c2);
                renderGrid();
            }
        }, 300);
    } else {
        const a = document.querySelector(`.gem[data-row="${r1}"][data-col="${c1}"]`);
        const b = document.querySelector(`.gem[data-row="${r2}"][data-col="${c2}"]`);
        if (a && b) {
            a.style.transform = "translateX(6px)";
            b.style.transform = "translateX(-6px)";
            setTimeout(() => { if(a) a.style.transform = ""; if(b) b.style.transform = ""; }, 160);
        }
        swapGems(r1, c1, r2, c2);
    }
}

function animateSwap(a, b) {
    const leftA = a.style.left, topA = a.style.top;
    const leftB = b.style.left, topB = b.style.top;
    a.style.left = leftB; 
    a.style.top = topB;
    b.style.left = leftA; 
    b.style.top = topA;
    const ar = a.dataset.row, ac = a.dataset.col;
    const br = b.dataset.row, bc = b.dataset.col;
    a.dataset.row = br; 
    a.dataset.col = bc;
    b.dataset.row = ar; 
    b.dataset.col = ac;
}

function swapGems(r1, c1, r2, c2) {
    [gems[r1][c1], gems[r2][c2]] = [gems[r2][c2], gems[r1][c1]];
}

// ========= ПОИСК И УДАЛЕНИЕ СОВПАДЕНИЙ ==========
function checkMatchesPreview() {
    for (let r = 0; r < ROWS; r++) {
        let streak = 1;
        for (let c = 1; c < COLS; c++) {
            if (gems[r][c] === gems[r][c-1]) {
                streak++;
                if (streak >= 3) return true;
            } else streak = 1;
        }
    }
    for (let c = 0; c < COLS; c++) {
        let streak = 1;
        for (let r = 1; r < ROWS; r++) {
            if (gems[r][c] === gems[r-1][c]) {
                streak++;
                if (streak >= 3) return true;
            } else streak = 1;
        }
    }
    return false;
}

function checkMatches() {
    const toRemove = new Set();
    for (let r = 0; r < ROWS; r++) {
        let streak = 1;
        for (let c = 1; c <= COLS; c++) {
            if (c < COLS && gems[r][c] === gems[r][c-1] && gems[r][c] !== null) streak++;
            else { if (streak >= 3) for (let k = 0; k < streak; k++) toRemove.add(`${r},${c-1-k}`); streak = 1; }
        }
    }
    for (let c = 0; c < COLS; c++) {
        let streak = 1;
        for (let r = 1; r <= ROWS; r++) {
            if (r < ROWS && gems[r][c] === gems[r-1][c] && gems[r][c] !== null) streak++;
            else { if (streak >= 3) for (let k = 0; k < streak; k++) toRemove.add(`${r-1-k},${c}`); streak = 1; }
        }
    }

    if (toRemove.size > 0) {
        const a = document.getElementById("gameArea");
        if (a) { a.classList.add("match-flash"); setTimeout(()=>a.classList.remove("match-flash"),360); }
        removeMatches(toRemove);
        if (toRemove.size >= 3) setTimeout(() => showDialogue(), 400);
        return true;
    }
    return false;
}

function removeMatches(setToRemove) {
    setToRemove.forEach(key => {
        const [r,c] = key.split(",").map(Number);
        const el = document.querySelector(`.gem[data-row="${r}"][data-col="${c}"]`);
        if (el) {
            el.style.transition = "transform 0.5s ease, opacity 0.5s ease";
            el.style.transform = "scale(1.8) rotate(270deg)";
            el.style.opacity = "0";
            setTimeout(() => { try { el.remove(); } catch(e){} }, 500);
        }
        if (gems[r]) gems[r][c] = null;
    });

    const removedCount = setToRemove.size;
    score += removedCount * 12;
    showScorePop(removedCount);
    sobriety = Math.min(100, sobriety + Math.min(12, Math.floor(removedCount/2)));
    updateScore();
    updateSobrietyBar(true);

    setTimeout(() => {
        applyGravity();
        fillEmptySpaces();
        renderGrid();
        playSound("fall");
        setTimeout(()=>checkMatches(),300);
    },420);
}

function applyGravity() {
    for (let c = 0; c < COLS; c++) {
        for (let r = ROWS-1; r>=0; r--) {
            if (gems[r][c]===null) {
                for (let nr=r-1; nr>=0; nr--) {
                    if (gems[nr][c]!==null) {
                        gems[r][c] = gems[nr][c];
                        gems[nr][c] = null;
                        break;
                    }
                }
            }
        }
    }
}

function fillEmptySpaces() {
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (!gems[r][c]) gems[r][c]=Math.floor(Math.random()*GEM_TYPES)+1;
}

// ========= ИНТЕРФЕЙС ==========
function updateScore() {
    const scoreEl = document.getElementById("score");
    if (scoreEl) scoreEl.textContent = `Очки: ${score}`;
    if (score >= nextMilestone) { playSound("milestone"); nextMilestone += 300; }

    if (score >= 1200 && !gameOver) endGameWithVictory();
}

function updateSobrietyBar(shakeIfChanged=false){
    const bar=document.getElementById("sobrietyBarInner");
    if(!bar) return;
    bar.style.width = `${sobriety}%`;
    if(sobriety>60) bar.style.background="linear-gradient(90deg,#4caf50,#8bc34a)";
    else if(sobriety>30) bar.style.background="linear-gradient(90deg,#ffcc00,#ff9800)";
    else bar.style.background="linear-gradient(90deg,#ff7043,#f44336)";
    if(shakeIfChanged){ bar.classList.remove("sobriety-shake"); void bar.offsetWidth; bar.classList.add("sobriety-shake"); }
}

function startSobrietyDecay(){
    clearInterval(sobrietyTimer);
    sobrietyTimer=setInterval(()=>{
        if(!window.gameStarted||gameOver) return;
        sobriety=Math.max(0,sobriety-2);
        updateSobrietyBar(true);
        if(sobriety<=0) endGameWithDefeat();
    },700);
}
// ========= КОНЕЦ ИГРЫ ==========
function endGameWithVictory(){
    gameOver=true;
    clearInterval(sobrietyTimer);
    bgMusic.pause();
    saveRecord(score);
    showRecords();
    showVictoryGlow();
    spawnConfetti(50);
    showFinalDialogueVictory();
    window.gameStarted=false;
}

function endGameWithDefeat(){
    gameOver=true;
    clearInterval(sobrietyTimer);
    bgMusic.pause();
    saveRecord(score);
    showRecords();
    showFinalDialogueDefeat();
    window.gameStarted=false;
}
// ========= ДИАЛОГИ ==========
function showDialogue() {
    if (!window.gameStarted||gameOver) return;
    const box = document.getElementById("dialogueBox");
    const nameEl = document.getElementById("dialogueName");
    const textEl = document.getElementById("dialogueText");
    const portraitEl = document.getElementById("dialoguePortrait");
    if (!box||!nameEl||!textEl||!portraitEl) return;
    const d = dialogues[dialogueIndex];
    const img = d.imgs[Math.floor(Math.random()*d.imgs.length)];
    nameEl.textContent=d.name;
    textEl.textContent=d.text;
    portraitEl.style.opacity="0";
    setTimeout(()=>{ portraitEl.src=img; portraitEl.style.transition="opacity 260ms"; portraitEl.style.opacity="1"; },160);
    box.classList.add("visible");
    setTimeout(()=>box.classList.remove("visible"),4000);
    dialogueIndex=(dialogueIndex+1)%dialogues.length;
}

function showFinalDialogueVictory(index=0){
    if(index>=finalDialogueVictory.length){
        $("#gameContainer").fadeOut(600,()=>$("#mainMenu").fadeIn(600));
        return;
    }
    const box=document.getElementById("dialogueBox");
    const nameEl=document.getElementById("dialogueName");
    const textEl=document.getElementById("dialogueText");
    const portraitEl=document.getElementById("dialoguePortrait");
    if(!box||!nameEl||!textEl||!portraitEl) return;
    const d=finalDialogueVictory[index];
    const img=d.imgs[Math.floor(Math.random()*d.imgs.length)];
    nameEl.textContent=d.name;
    textEl.textContent=d.text;
    portraitEl.style.opacity="0";
    setTimeout(()=>{ portraitEl.src=img; portraitEl.style.transition="opacity 260ms"; portraitEl.style.opacity="1"; },160);
    box.classList.add("visible");
    setTimeout(()=>{
        box.classList.remove("visible");
        setTimeout(()=>showFinalDialogueVictory(index+1),300);
    },4000);
}

function showFinalDialogueDefeat(index=0){
    if(index>=finalDialogueDefeat.length){
        $("#gameContainer").fadeOut(600,()=>$("#mainMenu").fadeIn(600));
        return;
    }
    const box=document.getElementById("dialogueBox");
    const nameEl=document.getElementById("dialogueName");
    const textEl=document.getElementById("dialogueText");
    const portraitEl=document.getElementById("dialoguePortrait");
    if(!box||!nameEl||!textEl||!portraitEl) return;
    const d=finalDialogueDefeat[index];
    const img=d.imgs[Math.floor(Math.random()*d.imgs.length)];
    nameEl.textContent=d.name;
    textEl.textContent=d.text;
    portraitEl.style.opacity="0";
    setTimeout(()=>{ portraitEl.src=img; portraitEl.style.transition="opacity 260ms"; portraitEl.style.opacity="1"; },160);
    box.classList.add("visible");
    setTimeout(()=>{
        box.classList.remove("visible");
        setTimeout(()=>showFinalDialogueDefeat(index+1),300);
    },4000);
}

// ========= РЕКОРДЫ ==========
function saveRecord(val){
    const key="pianitsa_records_v1";
    const arr=JSON.parse(localStorage.getItem(key)||"[]");
    arr.push(val);
    arr.sort((a,b)=>b-a);
    localStorage.setItem(key,JSON.stringify(arr.slice(0,5)));
}

function showRecords(){
    const container=document.getElementById("recordsList");
    if(!container) return;
    const arr=JSON.parse(localStorage.getItem("pianitsa_records_v1")||"[]");
    container.innerHTML="<strong>Рекорды:</strong>";
    if(arr.length===0) container.innerHTML+="<div style='margin-top:8px;color:#bbb;'>Здесь будут ваши рекорды</div>";
    else arr.forEach((v,i)=>container.innerHTML+=`<div>${i+1}. ${v} очков</div>`);
}

// ========= ЗВУКИ ==========
function playSound(name){
    const s=sounds[name];
    if(!s) return;
    try{s.currentTime=0;s.play().catch(()=>{});}catch(e){}
}

// ========= ПОКАЗ ОЧКОВ ==========
function showScorePop(points){
    const ga=document.getElementById("gameArea");
    if(!ga) return;
    const pop=document.createElement("div");
    pop.className="score-pop";
    pop.textContent=`+${points*12}`;
    pop.style.position="fixed";
    pop.style.left=`${Math.random()*(window.innerWidth-40)}px`;
    pop.style.top=`${Math.random()*(window.innerHeight-40)}px`;
    pop.style.color="#ff0";
    pop.style.fontSize="24px";
    pop.style.fontWeight="bold";
    pop.style.zIndex="9999";
    document.body.appendChild(pop);
    setTimeout(()=>{ try{ pop.remove(); }catch(e){} },1400);
}

// ========= ЭФФЕКТЫ ПОБЕДЫ ==========
function showVictoryGlow() {
    const glow = document.createElement("div");
    glow.className = "victory-glow";
    document.body.appendChild(glow);
    setTimeout(()=>{ try { glow.remove(); } catch(e){} }, 3000);
}

function spawnConfetti(amount=30) {
    for(let i=0;i<amount;i++){
        const c = document.createElement("div");
        c.className="confetti";
        c.style.left = Math.random()*window.innerWidth+"px";
        c.style.backgroundColor = `hsl(${Math.random()*360},80%,60%)`;
        document.body.appendChild(c);
        setTimeout(()=>{ try{ c.remove(); }catch(e){} },2500);
    }
}

// ========= ЗАПУСК ==========
$(document).ready(function(){
    showRecords();
    $("#startBtn,#exitBtn,#backBtn").addClass("btn-glow");

    $("#startBtn").on("click",function(){
        $("#mainMenu").fadeOut(400,function(){
            $("#gameContainer").fadeIn(400);
            if(!window.gameStarted) initGame();
            window.gameStarted=true;
            bgMusic.play().catch(()=>{});
        });
    });

    $("#exitBtn,#backBtn").on("click",function(){
        $("#gameContainer").fadeOut(300,function(){
            $("#mainMenu").fadeIn(300);
            bgMusic.pause();
            bgMusic.currentTime=0;
            window.gameStarted=false;
            clearInterval(sobrietyTimer);
        });
    });

    $("#musicBtn").on("click",function(){
        if(bgMusic.paused){ bgMusic.play().catch(()=>{}); $(this).text("🎵 Музыка: Вкл"); }
        else{ bgMusic.pause(); $(this).text("🎵 Музыка: Выкл"); }
        $(this).css("transform","scale(1.08)");
        setTimeout(()=>$(this).css("transform","scale(1)"),160);
    });

    $("#aboutBtn").on("click",function(){ $("#aboutInfo").slideToggle(600); });
});
$("#startBtn").on("click", function(){
    // Скрываем главное меню
    $("#mainMenu").fadeOut(400, function(){
        // Скрываем вкладку "Об игре", если она открыта
        $("#aboutInfo").slideUp(200);
    });
});