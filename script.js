let playerId = Date.now().toString();
let players = {};
let turnIndex = 0;
let roomCode = "";

// Координаты
const coords = [
 {x:20,y:260},{x:70,y:260},{x:120,y:260},{x:170,y:260},{x:220,y:260},
 {x:270,y:260},{x:270,y:210},{x:270,y:160},{x:270,y:110},{x:270,y:60},
 {x:220,y:60},{x:170,y:60},{x:120,y:60},{x:70,y:60},{x:20,y:60},
 {x:20,y:110},{x:20,y:160},{x:20,y:210},{x:70,y:210},{x:120,y:210}
];

// Подключение слушателя комнаты
function listenRoom(roomRef){
  onSnapshot(roomRef, (docSnap)=>{
    const data = docSnap.data();
    if(!data) return;

    players = data.players || {};
    turnIndex = data.turnIndex || 0;

    renderPlayers();
    updateTurn();
  });
}

// Отрисовка игроков
function renderPlayers(){
  const container = document.getElementById("players");
  container.innerHTML = "";

  Object.keys(players).forEach(id=>{
    const p = players[id];
    const el = document.createElement("div");
    el.className = "token";
    el.innerText = p.emoji;

    const pos = coords[p.pos] || coords[0];
    el.style.left = pos.x + "px";
    el.style.top = pos.y + "px";

    container.appendChild(el);
  });
}

// Ход
function updateTurn(){
  const ids = Object.keys(players);
  if(ids.length === 0) return;

  const current = players[ids[turnIndex]];
  document.getElementById("turn").innerText = "Ход: " + current.name;

  updateHype();
}

// Хайп
function updateHype(){
  const ids = Object.keys(players);
  const me = players[playerId];
  if(!me) return;

  document.getElementById("hypeText").innerText = `Хайп: ${me.hype} / 70`;
  document.getElementById("hypeFill").style.width = (me.hype/70*100)+"%";
}

// Кубик
window.rollDice = async function(){
  const ids = Object.keys(players);
  if(ids[turnIndex] !== playerId) return alert("Не твой ход!");

  const dice = Math.floor(Math.random()*6)+1;
  movePlayer(dice);
};

// Движение
async function movePlayer(steps){
  const roomRef = doc(db, "rooms", roomCode);
  let p = players[playerId];
  if(!p) return;

  let newPos = p.pos + steps;
  if(newPos > 19) newPos = 19;

  let newHype = Math.max(p.hype + getCell(newPos), 0);

  await updateDoc(roomRef, {
    [`players.${playerId}.pos`]: newPos,
    [`players.${playerId}.hype`]: newHype,
    turnIndex: (turnIndex+1)%Object.keys(players).length
  });

  handleCell(newPos);
}

// Клетки
function getCell(pos){
  const rules = [0,3,2,'scandal','risk',2,'scandal',3,5,-10,-8,3,'risk',3,'skip',2,'scandal',8,-10,4];
  return typeof rules[pos] === "number" ? rules[pos] : 0;
}

// Спец клетки
function handleCell(pos){
  const rules = [0,3,2,'scandal','risk',2,'scandal',3,5,-10,-8,3,'risk',3,'skip',2,'scandal',8,-10,4];
  const val = rules[pos];

  if(val === "scandal") showModal("Скандал!", "Минус хайп 😈", "red");
  if(val === "risk") showModal("Риск!", "Либо +5 либо -5", "orange");
  if(val === "skip") showModal("Пропуск!", "Пропусти ход", "yellow");
}

// Модалка
function showModal(title,text,color){
  const modal = document.getElementById("eventModal");
  modal.innerHTML = `
    <div class="modalBox" style="border:2px solid ${color}">
      <h2>${title}</h2>
      <p>${text}</p>
      <button onclick="closeModal()">Ок</button>
    </div>`;
  modal.style.display="flex";
}

window.closeModal = function(){
  document.getElementById("eventModal").style.display="none";
}
