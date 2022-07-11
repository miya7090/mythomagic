document.addEventListener("DOMContentLoaded", () => {
  resizer();
});

window.addEventListener('resize', resizer);

function resizer() {
  let loginBox = document.getElementById("loginBox");
  let leaderboard = document.getElementById("leaderboard");
  var override = false;

  if (window.innerWidth < window.innerHeight) {
    document.getElementById("orientation").style.visibility = "visible";
    override = true;
  } else {
    document.getElementById("orientation").style.visibility = "hidden";
  }
  
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