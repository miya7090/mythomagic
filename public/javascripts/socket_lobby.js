const socket = io(); // create new instance
socket.playerType = "lobby";
var PENDING_INVITE_RESPONSE = false;

var LEADERBOARD_CURSOR_DIV = [undefined, document.createElement("div")]; // [cardName, div] // the card preview that shows up when hover over leaderboard
var MOUSE_X;
var MOUSE_Y;

document.addEventListener("DOMContentLoaded", () => {
  const nicknameDiv = document.getElementById("nickname");
  nicknameDiv.focus();
  nicknameDiv.select();

  requestLoginBoxLoggedIn();
  
  $("#leaderboardTable tr:has(td)").mousemove(function(e) {
    MOUSE_X = e.clientX;
    MOUSE_Y = e.clientY;
    if (document.contains(LEADERBOARD_CURSOR_DIV[1])) {
      LEADERBOARD_CURSOR_DIV[1].style.left = MOUSE_X + "px";
      LEADERBOARD_CURSOR_DIV[1].style.top = MOUSE_Y + "px";
    }
  });

  // show previews for leaderboard
  console.log(LEADERBOARD_CURSOR_DIV[1]);
  $("#leaderboardTable tr:has(td)").mouseover(function(e) {
    let cardName = e.target.innerText.split(" ")[0];

    if (cardName.length > 1) {
      if (LEADERBOARD_CURSOR_DIV[0] != cardName) {
        LEADERBOARD_CURSOR_DIV[0] = cardName;

        if (document.contains(LEADERBOARD_CURSOR_DIV[1])) { document.body.removeChild(LEADERBOARD_CURSOR_DIV[1]); }
        LEADERBOARD_CURSOR_DIV[1] = document.createElement("div");
        LEADERBOARD_CURSOR_DIV[1].innerHTML = get_BC_BroadcastForInfoBox(undefined, cardName, true);
        LEADERBOARD_CURSOR_DIV[1].style.position = "absolute";
        LEADERBOARD_CURSOR_DIV[1].style.backgroundColor = "rgba(20,20,20,0.8)"
        LEADERBOARD_CURSOR_DIV[1].style.padding = "3px";
        LEADERBOARD_CURSOR_DIV[1].style.borderRadius = "5px";
        LEADERBOARD_CURSOR_DIV[1].style.border = "2px rgba(255,255,255,0.05) solid";
        LEADERBOARD_CURSOR_DIV[1].style.borderRight = "2px rgba(255,255,255,0.1) solid";
        LEADERBOARD_CURSOR_DIV[1].style.borderBottom = "2px rgba(255,255,255,0.1) solid";
        LEADERBOARD_CURSOR_DIV[1].style.left = MOUSE_X + "px";
        LEADERBOARD_CURSOR_DIV[1].style.top = MOUSE_Y + "px";
        LEADERBOARD_CURSOR_DIV[1].style.pointerEvents = "none";
        document.body.appendChild(LEADERBOARD_CURSOR_DIV[1]); // only done once
        
        //console.log(LEADERBOARD_CURSOR_DIV[1]);
      }
    } else {
      if (document.contains(LEADERBOARD_CURSOR_DIV[1])) { document.body.removeChild(LEADERBOARD_CURSOR_DIV[1]); }
    }
  });

  $("#leaderboardTable").mouseleave(function(e) {
    if (document.contains(LEADERBOARD_CURSOR_DIV[1])) { document.body.removeChild(LEADERBOARD_CURSOR_DIV[1]); }
  });

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
  const emailDiv = document.getElementById("email");
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
    const email = emailDiv.value;
    
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

    if (email.length == 0){
      if (!confirm("are you sure you want to leave your email blank? you won't be able to retrieve or change your account information")){
        emailDiv.focus();
        emailDiv.select();
        return;
      }
    }

    console.log("sending account creation request for", username, "with", inviteCode);
    socket.emit("account_creation_request", inviteCode, username, password, email);
  });

  lJoinButton.addEventListener("click", ()=>{
    if (nicknameDiv.value.length == 0){
      regionNotesText.textContent = "please enter a nickname first";
      nicknameDiv.focus();
      nicknameDiv.select();
    } else {
      const regionDiv = document.getElementById("region");
      socket.emit("lobbyJoin", nicknameDiv.value, regionDiv.value, getUserLoggedIn());
      regionNotesText.textContent = "joining "+regionDiv.value+" lobby...";
      nicknameDiv.disabled = true;
      lLeaveButton.hidden = false;
    }
  });

  lLeaveButton.addEventListener("click", ()=>{
    socket.emit("lobbyLeave");
    clearRegionList();
    regionNotesText.textContent = "";
    if (getUserLoggedIn() == "" || getUserLoggedIn() == undefined){
      nicknameDiv.disabled = false;
    }
    lLeaveButton.hidden = true;
  });

  socket.on("nicknameFailure", () => {
    regionNotesText.textContent = "this nickname has been reserved";
    nicknameDiv.disabled = false;
  });

  socket.on("commandCookieLogout", () => {
    regionNotesText.textContent = "your account has been removed";
    nicknameDiv.disabled = false;
    logoutUser();
  });

  socket.on("newAccount", (inviteCode) => {
    //navigator.clipboard.writeText(inviteCode);
    alert("your account has been created! you can invite up to five friends with " + inviteCode);
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

  socket.on("getUserDataBox", (username, newCode, codeUses, wins, losses, playerScore, playerRanking) => {
    // also freeze the nickname box
    nicknameDiv.value = username;
    nicknameDiv.disabled = true;

    /////
    const thisLoginBox = document.getElementById("loginBox");
    thisLoginBox.innerHTML = "";

    let totalWins = Object.values(wins).reduce((a, b) => a+b);
    let totalLosses = Object.values(losses).reduce((a, b) => a+b);
    var tier = tierOf(playerScore);
    
    thisLoginBox.style.backgroundColor = "rgba(84, 84, 84, 0.4)";
    
    const loginText = document.createElement("div"); loginText.id = "loginColWrap";
    const leftColumn = document.createElement("div"); leftColumn.classList.add("column");
    const rightColumn = document.createElement("div"); rightColumn.classList.add("column");

    leftColumn.innerHTML = "<b>" + username + "</b>, " + tier + " class<br/>";
    
    if (codeUses > 0){
      leftColumn.innerHTML += "invite code: " + newCode + " (" + codeUses + "/5)<br/><br/>";
    } else {
      leftColumn.innerHTML += "<strike>invite code: " + newCode + "</strike><br/><br/>";
    }
    
    rightColumn.innerHTML = "score: " + playerScore.toFixed(2) + " <a href='/help.html#scoring' target='_blank'>[?]</a><br/>";
    rightColumn.innerHTML += "your ranking: <b>#" + playerRanking + "</b><br/><br/>";

    leftColumn.innerHTML += "total wins: " + totalWins + "<br/>"; // #TODO count only if against logged in players
    leftColumn.innerHTML += "<i>olympia: " + wins["olympia"] + ", corinth: " + wins["corinth"] + "</i><br/>";
    leftColumn.innerHTML += "<i>athens: " + wins["athens"] + ",  sparta: " + wins["sparta"] + "</i><br/><br/>";

    rightColumn.innerHTML += "total losses: " + totalLosses + "<br/>";
    rightColumn.innerHTML += "<i>olympia: " + losses["olympia"] + ",  corinth: " + losses["corinth"] + "</i><br/>";
    rightColumn.innerHTML += "<i>athens: " + losses["athens"] + ",  sparta: " + losses["sparta"] + "</i><br/><br/>";

    rightColumn.innerHTML += "games played: " + (totalWins + totalLosses) + "<br/><br/>";

    const logoutButton = document.createElement("input");
    logoutButton.type = "button";
    logoutButton.value = "logout";
    logoutButton.classList.add("lightGray");
    logoutButton.onclick = logoutUser;

    const emailDiv = document.createElement("div");

    const emailLabel = document.createElement("label");
    emailLabel.innerText = "email: ";
    emailDiv.appendChild(emailLabel);

    const emailField = document.createElement("input");
    emailField.type = "text";
    emailField.classList.add("darkInputBox");
    emailField.id = "confirmEmail";
    emailDiv.appendChild(emailField);

    const pwDiv = document.createElement("div");
    pwDiv.id = "pwDiv";

    const newPWField = document.createElement("input");
    newPWField.type = "password";
    newPWField.classList.add("darkInputBox");
    newPWField.id = "newPW";
    pwDiv.appendChild(newPWField);

    const changePWButton = document.createElement("input");
    changePWButton.type = "button";
    changePWButton.value = "change password";
    changePWButton.classList.add("lightGray");
    changePWButton.onclick = changePassword;
    pwDiv.appendChild(changePWButton);

    loginText.appendChild(leftColumn);
    loginText.appendChild(rightColumn);
    thisLoginBox.appendChild(loginText);
    thisLoginBox.appendChild(emailDiv);
    thisLoginBox.appendChild(pwDiv);
    thisLoginBox.appendChild(logoutButton);
  });

  function changePassword(){
    let typedEmail = document.getElementById("confirmEmail").value;
    let typedPW = document.getElementById("newPW").value;
    if (typedEmail.length == 0) { alert("enter your email for verification"); return; }
    if (typedPW.length < 8) { alert("new password must be at least 8 characters long"); return; }
    socket.emit("passwordChangeRequest", getUserLoggedIn(), typedEmail, typedPW); // #TODO improve typedPW not sent directly
  }

  function logoutUser(){
    nicknameDiv.value = "";
    nicknameDiv.disabled = false;

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

  socket.on("lobbyJoined", (nickname, region, regionUsers, lobbyCookieBook)=>{
    console.log(nickname, "has joined region", region);
    populateRegionList(region, regionUsers, lobbyCookieBook);
  });

  socket.on("lobbyLeft", (socketId, nickname, region, regionUsers, lobbyCookieBook)=>{
    console.log(nickname, "has left region", region);
    if (socketId == socket.id){
      clearRegionList();
    } else {
      populateRegionList(region, regionUsers, lobbyCookieBook);
    }
  });
  
  socket.on("redirectToGame", (selfNickname, opponentNickname, roomCode, lobbyCode)=>{
    window.location.href = "/game?room="+roomCode+"&lobby="+lobbyCode+"&self="+selfNickname+"&other="+opponentNickname;
  })

  socket.on("gameInvite", (enemyNickname, enemyId)=>{
    console.log("*received invite*");
    const myNickname = document.getElementById("nickname").value;
    regionNotesText.textContent = "loading, please wait...";
    console.log(regionNotesText.textContent);
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
  navigator.clipboard.writeText(copyText.href);
  document.getElementById('copyPrompt').innerText = "[copied!]";
}

function tierOf(score){
  if (score > 40) { return "grandmaster"; }
  if (score > 30) { return "gold"; }
  if (score > 20) { return "silver"; }
  if (score > 15) { return "bronze"; }
  if (score <= 15) { return "iron"; }
  return undefined;
}

function populateRegionList(thisRegion, regionUsers, cookieBook){
  const regionNotesText = document.getElementById("queueNotes");
  if (Object.keys(regionUsers).length == 1){
    regionNotesText.innerHTML = "nobody else here... invite your friends with a <a href ='https://mythomagic.herokuapp.com/lobby?join_region=" + thisRegion +" ' id='sharelink' style='color:white;'>link </a><a href='#' id='copyPrompt' onclick='copySharelinkText()'>[copy]</span>";
  } else {
    regionNotesText.textContent = "";
  }
  const myNickname = document.getElementById("nickname").value;
  const lobbiersInRegion = document.getElementById("lobbiersinregion");
  lobbiersInRegion.innerHTML = ""; // clear div
  Object.keys(regionUsers).forEach(indivSocketid => {
    const rUser = document.createElement("button");
    const nickname = regionUsers[indivSocketid];
    rUser.classList.add("lobbier");
    rUser.textContent = nickname;

    let rUserTier = tierOf(cookieBook[indivSocketid]);

    var tierAsterisk = "";
    if (rUserTier != undefined) { tierAsterisk = "*"; }

    rUser.innerHTML = nickname + "<span class='"+ rUserTier +"'>" + tierAsterisk + "</span>";

    if (indivSocketid == socket.id) {
      rUser.disabled = true;
    } else {
      rUser.addEventListener("click", (evt)=>{
        if (PENDING_INVITE_RESPONSE == false) {
          PENDING_INVITE_RESPONSE = true;
          regionNotesText.textContent = "invitation sent...";
          socket.emit("gameInvite", myNickname, indivSocketid);
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
