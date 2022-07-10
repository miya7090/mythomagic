document.addEventListener("DOMContentLoaded", () => {
  resizer();
});

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
  resizer(true);
}

if('ontouchstart' in document.documentElement || navigator.userAgent.match(/Mobi/)) {
  resizer(true);
}

window.addEventListener('resize', resizer);

function resizer(override) {
  let loginBox = document.getElementById("loginBox");
  let leaderboard = document.getElementById("leaderboard");
  
  if (window.innerWidth <= 768 || override == true){
    loginBox.style.textAlign = "center";
    loginBox.style.position = "inherit";
    
    loginBox.style.border = "3px rgba(152, 152, 152, 0.8) solid";
    loginBox.style.borderBottom = "2px rgba(195, 195, 195, 0.877) solid";
    loginBox.style.borderRight = "2px rgba(195, 195, 195, 0.877) solid";

    leaderboard.style.width = window.innerWidth;
    leaderboard.style.overflowX = "auto";
    leaderboard.style.overflowY = "hidden";
  } else {
    loginBox.style.textAlign = "left";
    loginBox.style.position = "absolute";
    
    loginBox.style.border = "none";
    loginBox.style.borderLeft = "3px rgba(152, 152, 152, 0.8) solid";
    loginBox.style.borderBottom = "2px rgba(195, 195, 195, 0.877) solid";
  }
}