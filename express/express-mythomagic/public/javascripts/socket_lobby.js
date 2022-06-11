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
    const nickname = document.getElementById("nickname").value;
    const region = document.getElementById("region").value;
    socket.emit("lobbyJoin", nickname, region);
    regionNotesText.textContent = "success";
    // #TODO disable changes to nickname, region
  });

  const lLeaveButton = document.getElementById("lobbyLeaveButton");
  lLeaveButton.addEventListener("click", ()=>{
    const nickname = document.getElementById("nickname").value;
    const region = document.getElementById("region").value;
    socket.emit("lobbyLeave", nickname, region);
    clearRegionList();
    // un-alter css to show waiting, allow nickname and region changes
  });

  socket.on("lobbyJoined", (nickname, region, regionUsers)=>{
    console.log(nickname, "has joined region", region);
    populateRegionList(regionUsers);
  });

  socket.on("lobbyLeft", (nickname, region, regionUsers)=>{
    console.log(nickname, "has left region", region);
    populateRegionList(regionUsers);
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
      const region = document.getElementById("region").value;
      socket.emit("roomRequest", region, genRoomCode, enemyNickname, enemyId, myNickname, socket.id);
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
      socket.emit("gameInvite", myNickname, socket.id, nickname, socketid);
    })
    lobbiersInRegion.appendChild(rUser);
  }); 
}