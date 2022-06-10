const socket = io(); // create new instance
socket.emit("joined"); // tell server that someone opened the page
console.log("player socket id is", socket.id);

socket.on("joined", () => { // when server tells client that someone has opened the page
  alert("someone joined");
});
socket.on("leave", () => {
  alert("someone left"); // when server tells client that someone has closed the page
});

function enterQueue(evt) {
  const nameValue = document.getElementById("nickname").value;
  console.log(evt, nameValue);
  evt.preventDefault(); // keeps from refreshing 
  console.error("queue is not implemented");
}

function joinGame(evt) {
  const nameValue = document.getElementById("nickname").value;
  const gameCode = document.getElementById("gamecode").value;
  console.log(evt, nameValue, gameCode);
  evt.preventDefault(); // keeps from refreshing

  console.log(socket);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("hullo~~");
  const newGameForm = document.getElementById("newgameform");
  const joinGameForm = document.getElementById("joingameform");
  newGameForm.addEventListener('submit', enterQueue);
  joinGameForm.addEventListener('submit', joinGame);
});