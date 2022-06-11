var SAFELY_CONNECTED = false;

const socket = io(); // create new instance
document.addEventListener("DOMContentLoaded", () => {
  socket.on('connect', ()=>{
    SAFELY_CONNECTED = true;
    const socketId = document.getElementById("socketid");
    socketId.value = socket.id;
    console.log("socket id set to",socketId.value);
  });
});

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