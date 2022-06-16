const socket = io(); // create new instance
socket.playerType = "lobby";
var PENDING_INVITE_RESPONSE = false;

document.addEventListener("DOMContentLoaded", () => {
  const nicknameDiv = document.getElementById("nickname");
  nicknameDiv.focus();
  nicknameDiv.select();

  socket.on('connect', ()=>{
    console.log("new lobby socket connected", socket);
  });

  socket.on('disconnect', ()=>{
    console.log("lobby socket disconnected??", socket);
  });

  const regionNotesText = document.getElementById("queueNotes");

  const lJoinButton = document.getElementById("lobbyJoinButton");
  const lLeaveButton = document.getElementById("lobbyLeaveButton");

  lJoinButton.addEventListener("click", ()=>{
    if (nicknameDiv.value.length == 0){
      regionNotesText.textContent = "please enter a nickname first";
      nicknameDiv.focus();
      nicknameDiv.select();
    } else {
      const regionDiv = document.getElementById("region");
      socket.emit("lobbyJoin", nicknameDiv.value, regionDiv.value);
      regionNotesText.textContent = "joining "+regionDiv.value+" lobby...";
      nicknameDiv.disabled = true;
      lLeaveButton.hidden = false;
    }
  });

  lLeaveButton.addEventListener("click", ()=>{
    socket.emit("lobbyLeave");
    clearRegionList();
    regionNotesText.textContent = "";
    nicknameDiv.disabled = false;
    lLeaveButton.hidden = true;
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
      console.log("denying challenge");
      socket.emit("denyChallengeRequest", myNickname, enemyId);
    }
  });
  
  socket.on("gameRequestDenied", (denier)=>{
    console.log("challenge was denied");
    regionNotesText.textContent = denier+" denied your challenge";
    PENDING_INVITE_RESPONSE = false; // #TODO add timeout for invite response
  });
});

function clearRegionList(){
  const lobbiersInRegion = document.getElementById("lobbiersinregion");
  lobbiersInRegion.innerHTML = "";
}

function populateRegionList(regionUsers){
  const regionNotesText = document.getElementById("queueNotes");
  if (Object.keys(regionUsers).length == 1){
    regionNotesText.textContent = "nobody else here yet... invite your friends? (automatically refreshes)";
  } else {
    regionNotesText.textContent = "";
  }
  const myNickname = document.getElementById("nickname").value;
  const lobbiersInRegion = document.getElementById("lobbiersinregion");
  lobbiersInRegion.innerHTML = ""; // clear div
  Object.keys(regionUsers).forEach(socketid => {
    const rUser = document.createElement("button");
    const nickname = regionUsers[socketid];
    rUser.classList.add("lobbier");
    rUser.textContent = nickname;
    rUser.name = nickname;
    if (socketid == socket.id) {
      rUser.disabled = true;
    } else {
      rUser.addEventListener("click", (evt)=>{
        if (PENDING_INVITE_RESPONSE == false) {
          PENDING_INVITE_RESPONSE = true;
          regionNotesText.textContent = "invitation sent...";
          socket.emit("gameInvite", myNickname, socketid);
        } else {
          console.error("you are still waiting for an invitation response");
        }
      })
    }
    lobbiersInRegion.appendChild(rUser);
  }); 
}