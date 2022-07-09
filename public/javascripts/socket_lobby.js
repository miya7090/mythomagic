const socket = io(); // create new instance
socket.playerType = "lobby";
var PENDING_INVITE_RESPONSE = false;

document.addEventListener("DOMContentLoaded", () => {
  const nicknameDiv = document.getElementById("nickname");
  nicknameDiv.focus();
  nicknameDiv.select();

  requestLoginBoxLoggedIn();

  const urlParams = new URLSearchParams(window.location.search);
  const selectedRegion = urlParams.get('join_region');
  if (selectedRegion == "olympia") {
    document.getElementById("region").selectedIndex = 0;
  } else if (selectedRegion == "corinth") {
    document.getElementById("region").selectedIndex = 1;
  } else if (selectedRegion == "athens") {
    document.getElementById("region").selectedIndex = 2;
  } else if (selectedRegion == "sparta") {
    document.getElementById("region").selectedIndex = 3;
  }

  socket.on('connect', ()=>{
    console.log("new lobby socket connected", socket);
    socket.emit("requestAllHeroboards");
  });

  socket.on('disconnect', ()=>{
    console.log("lobby socket disconnected??", socket);
  });

  const regionNotesText = document.getElementById("queueNotes");

  const lJoinButton = document.getElementById("lobbyJoinButton");
  const lLeaveButton = document.getElementById("lobbyLeaveButton");
  const lLoginButton = document.getElementById("loginButton");
  const lAccountButton = document.getElementById("createAccountButton");
  const usernameDiv = document.getElementById("username");
  const passwordDiv = document.getElementById("password");
  const inviteCodeDiv = document.getElementById("inviteCode");

  lLoginButton.addEventListener("click", ()=>{
    const username = usernameDiv.value;
    const password = passwordDiv.value;
    
    if (username.length < 3){
      alert("username must be at least 3 characters long");
      usernameDiv.focus();
      usernameDiv.select();
      return;
    }

    if (password.length < 8){
      alert("password must be at least 8 characters long");
      passwordDiv.focus();
      passwordDiv.select();
      return;
    }

    console.log("sending login request for", username);
    socket.emit("login_request", username, password);
  });

  lAccountButton.addEventListener("click", ()=>{
    const username = usernameDiv.value;
    const password = passwordDiv.value;
    const inviteCode = inviteCodeDiv.value;
    
    if (username.length < 3){
      alert("username must be at least 3 characters long");
      usernameDiv.focus();
      usernameDiv.select();
      return;
    }

    if (password.length < 8){
      alert("password must be at least 8 characters long");
      passwordDiv.focus();
      passwordDiv.select();
      return;
    }

    console.log("sending account creation request for", username, "with", inviteCode);
    socket.emit("account_creation_request", inviteCode, username, password);
  });

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

  socket.on("newAccount", (inviteCode) => {
    //navigator.clipboard.writeText(inviteCode);
    alert("your account has been created! you can invite one friend with " + inviteCode);
    socket.emit("login_request", usernameDiv.value, passwordDiv.value);
  });

  socket.on("accountMessage", (notes) => {
    alert(notes);
  });

  socket.on("loginSuccess", (username) => {
    let exdays = 3; // expire after 3 days
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = "user" + "=" + username + ";" + expires + ";path=/";
    requestLoginBoxLoggedIn();
  });

  function requestLoginBoxLoggedIn() {
    let thisUser = getUserLoggedIn();
    if (thisUser != "") {
      socket.emit("requestUserDataBox", thisUser);
    }
    // if no cookie, make no change
  }

  socket.on("getUserDataBox", (username, newCode, wins, losses) => {
    const thisLoginBox = document.getElementById("loginBox");
    thisLoginBox.innerHTML = "";

    let totalWins = Object.values(wins).reduce((a, b) => a+b);
    let totalLosses = Object.values(losses).reduce((a, b) => a+b);

    console.log(wins, losses, totalWins);

    const loginText = document.createElement("div");
    loginText.innerHTML = "you are logged in as <b>" + username + "</b><br/>";
    loginText.innerHTML += "invitation code: " + newCode + "<br/>";
    loginText.innerHTML += "total wins: " + totalWins + "<br/>"; // #TODO count only if against logged in players
    loginText.innerHTML += "total losses: " + totalLosses + "<br/>"; // #TODO create a ranking score

    const logoutButton = document.createElement("input"); // create tile and add to row
    logoutButton.type = "button";
    logoutButton.value = "logout";
    logoutButton.onclick = logoutUser;

    thisLoginBox.appendChild(loginText);
    thisLoginBox.appendChild(logoutButton);
  });

  function logoutUser(){
    document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
    const thisLoginBox = document.getElementById("loginBox");
    thisLoginBox.innerHTML = "logged out successfully!";
  }

  function getUserLoggedIn() {
    let name = "user" + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  socket.on("heroboardUpdate", (region, res)=>{
    if (region == undefined) {
      console.error("error retrieving leaderboards from mongodb");
    } else {
      console.log("received heroboard update for", region);
      updateLobbyBoard(region, res);
    }
  });

  socket.on("lobbyJoined", (nickname, region, regionUsers)=>{
    console.log(nickname, "has joined region", region);
    populateRegionList(region, regionUsers);
  });

  socket.on("lobbyLeft", (socketId, nickname, region, regionUsers)=>{
    console.log(nickname, "has left region", region);
    if (socketId == socket.id){
      clearRegionList(regionUsers);
    } else {
      populateRegionList(region, regionUsers);
    }
  });

  socket.on("lobbyLeft2", (nicknameA, nicknameB, region, regionUsers)=>{
    console.log(nicknameA,"and",nicknameB,"have begun a game");
    populateRegionList(region, regionUsers);
  });

  socket.on("redirectToGame", (selfNickname, opponentNickname, roomCode, lobbyCode)=>{
    window.location.href = "/game?room="+roomCode+"&lobby="+lobbyCode+"&self="+selfNickname+"&other="+opponentNickname;
  })

  socket.on("gameInvite", (enemyNickname, enemyId)=>{
    console.log("**");
    const myNickname = document.getElementById("nickname").value;
    regionNotesText.textContent = "loading, please wait...";
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

function copySharelinkText(){
  var copyText = document.getElementById("sharelink");
  navigator.clipboard.writeText(copyText.innerText);
  document.getElementById('copyPrompt').innerText = "[copied link!]";
}

function populateRegionList(thisRegion, regionUsers){
  const regionNotesText = document.getElementById("queueNotes");
  if (Object.keys(regionUsers).length == 1){
    regionNotesText.innerHTML = "nobody else here... invite your friends with <span id='sharelink' style='color:gray;'>https://mythomagic.herokuapp.com/lobby?join_region=" + thisRegion + "</span> <a href='#' id='copyPrompt' onclick='copySharelinkText()'>[copy link]</span>";
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

function updateLobbyBoard(regionName, res) {
  var thisCol;
  switch (regionName) {
    case "TOTAL": thisCol = 1; break;
    case "olympia": thisCol = 2; break;
    case "corinth": thisCol = 3; break;
    case "athens": thisCol = 4; break;
    case "sparta": thisCol = 5; break;
  }
  let lobbyBoard = document.getElementById("leaderboardTable");
  
  if (regionName == "TOTAL") {
    for (let i = 0; i < 5; i++) {
      let tableTotalText = res[i]._id + " (" + res[i].total;
      if (res[i].total == 1) { tableTotalText += " win)"; }
      else { tableTotalText += " wins)"; }
      lobbyBoard.getElementsByTagName('tr')[i+1].getElementsByTagName('td')[thisCol].innerText = tableTotalText;
    }
  } else {
    for (let i = 0; i < 5; i++) {
      let tableText = res[i].heroName + " (" + res[i].heroWins;
      if (res[i].heroWins == 1) { tableText += " win)"; }
      else { tableText += " wins)"; }
      lobbyBoard.getElementsByTagName('tr')[i+1].getElementsByTagName('td')[thisCol].innerText = tableText;
    }
  }
}
