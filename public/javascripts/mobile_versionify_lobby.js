document.addEventListener("DOMContentLoaded", () => {
  resizer();
});

if( /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
  resizer(true);
}

window.addEventListener('resize', resizer);

function resizer(override) {
  let loginBox = document.getElementById("loginBox");
  let leaderboard = document.getElementById("leaderboard");
  
  if (window.innerWidth < 700 || override == true){
    loginBox.style.textAlign = "center";
    loginBox.style.position = "inherit";
    
    loginBox.style.border = "none";

    leaderboard.style.width = window.innerWidth;
    leaderboard.style.overflowX = "auto";
    leaderboard.style.overflowY = "hidden";
  } else {
    loginBox.style.textAlign = "left";
    loginBox.style.position = "absolute";
    
    loginBox.style.borderLeft = "3px rgba(152, 152, 152, 0.8) solid";
    loginBox.style.borderBottom = "2px rgba(195, 195, 195, 0.877) solid";
  }
}