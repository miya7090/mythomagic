const socket = io(); // create new instance
console.log("establishing connection..."); //#TODO show this on page
socket.on('connect', onSafeConnection);

var SAFELY_CONNECTED = false;

function joinGame(){
  if (SAFELY_CONNECTED) {
    const nickname = document.getElementById("nickname").value;
    const room = document.getElementById("gamecode").value;
    console.log("yeet", nickname, room);
    socket.emit("joined", nickname, room);
  } else {
    console.error("attempted to join game without connection established");
  }
}

function onSafeConnection(){
  SAFELY_CONNECTED = true;

  console.log("connection established:",socket.id);
  socket.on("joined", (nickname, room) => { // when server tells client that someone has opened the page
    alert(nickname + " joined room " + room);
  });
  socket.on("leave", (nickname, room) => {
    alert(nickname + " left room " + room); // when server tells client that someone has closed the page
  });
  
  function enterQueue(evt) {
    const nameValue = document.getElementById("nickname").value;
    console.log(evt, nameValue);
    evt.preventDefault(); // keeps from refreshing 
    console.error("queue is not implemented");
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    console.log("hullo~~");
    const newGameForm = document.getElementById("newgameform");
    const joinGameForm = document.getElementById("joingameform");
    newGameForm.addEventListener('submit', enterQueue);
    joinGameForm.addEventListener('submit', joinGame);
  });
}