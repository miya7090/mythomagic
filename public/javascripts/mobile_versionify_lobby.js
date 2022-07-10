document.addEventListener("DOMContentLoaded", () => {
  resizer();
});

window.addEventListener('resize', resizer);

function resizer() {
  console.log("dsaf");
  let loginBox = document.getElementById("loginBox");
  let leaderboard = document.getElementById("leaderboard");
  if (window.innerWidth < 700){
    loginBox.style.textAlign = "center";
    loginBox.style.position = "inherit";
    leaderboard.style.width = window.innerWidth;
    leaderboard.style.overflowX = "auto";
    leaderboard.style.overflowY = "hidden";
  } else {
    loginBox.style.textAlign = "left";
    loginBox.style.position = "absolute";
  }
}