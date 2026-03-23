let playerId = Date.now().toString();
let name, roomCode, emoji;
let players = {};
let turnIndex = 0;

// Координаты клеток
const coords = [
 {x:20,y:260},{x:70,y:260},{x:120,y:260},{x:170,y:260},{x:220,y:260},
 {x:270,y:260},{x:270,y:210},{x:270,y:160},{x:270,y:110},{x:270,y:60},
 {x:220,y:60},{x:170,y:60},{x:120,y:60},{x:70,y:60},{x:20,y:60},
 {x:20,y:110},{x:20,y:160},{x:20,y:210},{x:70,y:210},{x:120,y:210}
];

// Выбор фишки
function selectEmoji(el){
  document.querySelectorAll("#emojiSelect span").forEach(e=>e.classList.remove("selected"));
  el.classList.add("selected");
  emoji = el.innerText;
}

// Вход в комнату
function joinRoom(){
  name = document.getElementById("name").value.trim();
  roomCode = document.getElementById("room").value.trim();
  if(!name || !roomCode || !emoji) return alert("Заполни всё");

  const roomRef = db.collection("rooms").doc(roomCode);

  roomRef.get().then(doc=>{
    if(!doc.exists){
      roomRef.set({players:{}, turnIndex:0}).then(() => addPlayer(roomRef));
    } else addPlayer(roomRef);
  }).catch(err => alert("Ошибка: " + err.message));
}

// Добавление игрока
function addPlayer(roomRef){
  roomRef.update({[`players.${playerId}`]: {name, emoji, pos:0, hype:0, skip:false}})
  .then(()=>{
    document.getElementById("lobby").style.display="none";
    document.getElementById("game").style.display="block";
    listenRoom(roomRef);
  }).catch(err => alert(err.message));
}

// Слушаем комнату
function listenRoom(roomRef){
  roomRef.onSnapshot(doc=>{
    const data = doc.data();
    players = data.players;
    turnIndex = data.turnIndex;
    renderPlayers();
    updateTurn();
  });
}

// Отображение игроков
function renderPlayers(){
  const playersDiv = document.getElementById("players");
  playersDiv.innerHTML="";
  Object.keys(players).forEach(id=>{
    const p = players[id];
    const el = document.createElement("div");
    el.className="token";
    el.innerText=p.emoji;
    const pos = coords[p.pos] || {x:20,y:260};
    el.style.left=pos.x+"px";
    el.style.top=pos.y+"px";
    playersDiv.appendChild(el);
  });
}

// Чей ход
function updateTurn(){
  const ids = Object.keys(players);
  if(ids.length>0){
    document.getElementById("turn").innerText = "Ход: "+players[ids[turnIndex]].name;
    updateHypeDisplay();
  }
}

// Обновление хайпа
function updateHypeDisplay(){
  const ids = Object.keys(players);
  if(ids.length>0){
    const p = players[ids[turnIndex]];
    document.getElementById("hypeText").innerText = `Хайп: ${p.hype} / 70`;
    document.getElementById("hypeFill").style.width = (p.hype/70*100)+"%";
  }
}

// Бросок кубика
function rollDice(){
  const ids = Object.keys(players);
  if(ids[turnIndex] != playerId) return alert("Не твой ход!");
  const dice = Math.floor(Math.random()*6)+1;
  movePlayer(dice);
}

// Движение и обработка клеток
function movePlayer(steps){
  const roomRef = db.collection("rooms").doc(roomCode);
  let p = players[playerId];
  if(!p) return;
  if(p.skip){
    alert("Пропуск хода!");
    roomRef.update({[`players.${playerId}.skip`]: false, turnIndex: (turnIndex+1)%Object.keys(players).length});
    return;
  }

  let newPos = p.pos + steps;
  if(newPos>19) newPos=19;

  let cellHype = getCellHype(newPos);
  let newHype = Math.max(p.hype + cellHype, 0);

  roomRef.update({
    [`players.${playerId}.pos`]: newPos,
    [`players.${playerId}.hype`]: newHype,
    turnIndex: (turnIndex+1)%Object.keys(players).length
  });

  handleSpecialCell(newPos);
}

// Логика клеток
function getCellHype(pos){
  const rules = [0,3,2,'scandal','risk',2,'scandal',3,5,-10,-8,3,'risk',3,'skip',2,'scandal',8,-10,4];
  const val = rules[pos];
  return typeof val==="number"? val : 0;
}

// Спец. клетки
function handleSpecialCell(pos){
  const rules = [0,3,2,'scandal','risk',2,'scandal',3,5,-10,-8,3,'risk',3,'skip',2,'scandal',8,-10,4];
  const val = rules[pos];
  if(val==='scandal') showScandal();
  if(val==='risk') showRisk();
  if(val==='skip') skipTurn();
}

// Скандал
function showScandal(){
  const msgs = [
    "перегрел аудиторию🔥 -1",
    "громкий заголовок🫣 -2",
    "это монтаж 😱 -3",
    "меня взломали #️⃣ -3 у всех",
    "подписчики в шоке 😮 -4",
    "удаляй пока не поздно🤫 -5",
    "это контент, вы не понимаете🙄 -5 и пропуск хода"
  ];
  const msg = msgs[Math.floor(Math.random()*msgs.length)];
  showModal("Скандал!", msg, "red");
}

// Риск
function showRisk(){
  const dice = Math.floor(Math.random()*6)+1;
  let msg = dice <=3 ? "-5 хайп" : "+5 хайп";
  showModal("Риск!", `Выпало ${dice}: ${msg}`, "orange");
}

// Пропуск хода
function skipTurn(){
  const roomRef = db.collection("rooms").doc(roomCode);
  roomRef.update({[`players.${playerId}.skip`]: true});
  showModal("Пропуск!", "Следующий ход пропускается", "yellow");
}

// Модалка
function showModal(title,text,color){
  const modal = document.getElementById("eventModal");
  modal.innerHTML = `<div class="modalBox" style="border:2px solid ${color}"><h2>${title}</h2><p>${text}</p><button onclick="closeModal()">Закрыть</button></div>`;
  modal.style.display="flex";
}

// Закрыть модалку
function closeModal(){ document.getElementById("eventModal").style.display="none"; }
