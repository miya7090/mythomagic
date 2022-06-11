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

  socket.on("joined", (nickname, room) => { // when server tells client that someone has opened the page
    console.log(nickname + " joined lobby " + room);
  });

  socket.on("leave", (nickname, room) => {
    console.log(nickname + " left lobby " + room); // when server tells client that someone has closed the page
  });

});

function clearRegionList(){
  const lobbiersInRegion = document.getElementById("lobbiersinregion");
  lobbiersInRegion.innerHTML = "";
}

function populateRegionList(regionUsers){
  const regionLabel = document.getElementById("regionlabel");
  const lobbiersInRegion = document.getElementById("lobbiersinregion");
  lobbiersInRegion.innerHTML = ""; // clear div
  Object.keys(regionUsers).forEach(socketid => {
    const rUser = document.createElement("div");
    const nickname = regionUsers[socketid];
    rUser.classList.add("lobbier");
    rUser.textContent = nickname;
    lobbiersInRegion.appendChild(rUser);
  
    /*
    const referenceCard = new Card(pcToRender); // show stats on hover
    acard.addEventListener('mouseenter', function(evt){mouseOverAvailableCard(evt, referenceCard);});
    acard.addEventListener('mouseup', mouseClickAvailableCard);*/
  }); 
}