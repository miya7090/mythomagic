const socket = io(); // create new instance
socket.playerType = "lobby";

document.addEventListener("DOMContentLoaded", () => {

  socket.on('connect', ()=>{
    console.log("new lobby socket connected", socket);
  });

  socket.on('disconnect', ()=>{
    console.log("lobby socket disconnected??", socket);
  });

  const regionNotesText = document.getElementById("queueNotes");

  const lJoinButton = document.getElementById("lobbyJoinButton");
  lJoinButton.addEventListener("click", ()=>{
    const nickname = document.getElementById("nickname");
    const region = document.getElementById("region");
    socket.emit("lobbyJoin", nickname.value, region.value);
    regionNotesText.textContent = "joining "+region.value+" lobby...";
    nickname.disabled = true;
  });

  const lLeaveButton = document.getElementById("lobbyLeaveButton");
  lLeaveButton.addEventListener("click", ()=>{
    socket.emit("lobbyLeave");
    clearRegionList();
    regionNotesText.textContent = "";
    nickname.disabled = false;
  });

  socket.on("lobbyJoined", (nickname, region, regionUsers)=>{
    console.log(nickname, "has joined region", region);
    populateRegionList(regionUsers);
  });

  socket.on("lobbyLeft", (socketId, nickname, region, regionUsers)=>{
    console.log(nickname, "has left region", region);
    if (socketId == socket.id){
      clearRegionList(regionUsers);
    } else {
      populateRegionList(regionUsers);
    }
  });

  socket.on("lobbyLeft2", (nicknameA, nicknameB, region, regionUsers)=>{
    console.log(nicknameA,"and",nicknameB,"have begun a game");
    populateRegionList(regionUsers);
  });

  socket.on("redirectToGame", (selfNickname, opponentNickname, roomCode)=>{
    window.location.href = "/game?room="+roomCode+"&self="+selfNickname+"&other="+opponentNickname;
  })

  socket.on("gameInvite", (enemyNickname, enemyId)=>{
    console.log("**");
    const myNickname = document.getElementById("nickname").value;
    if (confirm("accept challenge from "+enemyNickname+"?")){
      const genRoomCode = Math.random().toString(36).slice(2);
      socket.emit("roomRequest", genRoomCode, enemyNickname, enemyId, myNickname);
    } else {
      socket.broadcast.to(socketid).emit("gameRequestDenied", myNickname, socket.id);
    }
  });
  
  socket.on("gameRequestDenied", ()=>{
    console.log("unimplemented");
  });

});

function clearRegionList(){
  const lobbiersInRegion = document.getElementById("lobbiersinregion");
  lobbiersInRegion.innerHTML = "";
}

function populateRegionList(regionUsers){
  const myNickname = document.getElementById("nickname").value;
  const lobbiersInRegion = document.getElementById("lobbiersinregion");
  lobbiersInRegion.innerHTML = ""; // clear div
  Object.keys(regionUsers).forEach(socketid => {
    const rUser = document.createElement("button");
    const nickname = regionUsers[socketid];
    rUser.classList.add("lobbier");
    rUser.textContent = nickname;
    rUser.name = nickname;
    rUser.addEventListener("click", (evt)=>{
      console.log("*");
      socket.emit("gameInvite", myNickname, socketid);
    })
    lobbiersInRegion.appendChild(rUser);
  }); 
}