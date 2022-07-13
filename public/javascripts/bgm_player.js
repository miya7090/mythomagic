// @miya7090

GITHUB_PUBLIC_PATH = "https://raw.githubusercontent.com/miya7090/mythomagic/main/public/";

BGM_MUTE = false;
BGM_OBJECT = undefined;
BGM_VOLUME = 1.0;
BGM_BEGIN_DELAY = 1000;

MUSIC_ICON_LINK = GITHUB_PUBLIC_PATH+'images/music.png';
MUSIC_ICON_IMG = undefined;
MUSIC_ICON_PLACEMENT = "bottomright";
MUSIC_ICON_OPACITY = undefined;

document.addEventListener("DOMContentLoaded", () => {
    const bgmLink = document.getElementById("bgmLinker");
    if (bgmLink == undefined) { return; }

    // add background music
    var bgmName, volume;
    switch (bgmLink.getAttribute("page")) {
        case "entry":      bgmName = "6 wind of melancholy"; BGM_BEGIN_DELAY = 0; break;
        case "lobby":      bgmName = "89 town of clocks"; BGM_VOLUME = 0.8; BGM_BEGIN_DELAY = 0; break;
        case "game":       bgmName = "50 mulling"; BGM_VOLUME = 0.2; MUSIC_ICON_PLACEMENT = "topright"; break;
        case "losing":     bgmName = "94 the contract"; break;
        case "winning":    bgmName = "18 elemental plane of air"; break;
    }
    if (bgmName == undefined) { return; }

    // add mute icon
    MUSIC_ICON_IMG = document.createElement("img");
    MUSIC_ICON_IMG.src = MUSIC_ICON_LINK;
    MUSIC_ICON_IMG.id = "muteIcon";
    MUSIC_ICON_OPACITY = 0.6;
    MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY;
    MUSIC_ICON_IMG.onclick = muteBGM;
    bgmLink.appendChild(MUSIC_ICON_IMG);

    // add background music
    let bgmSource = GITHUB_PUBLIC_PATH+'sounds/'+bgmName+'.mp3';
    BGM_OBJECT = new Audio(bgmSource);
    setTimeout(refreshBgm, BGM_BEGIN_DELAY); // start music 2 secs in

    // styling
    bgmLink.style.position = "absolute";
    if (MUSIC_ICON_PLACEMENT == "bottomright") {
        bgmLink.style.bottom = "15px";
        bgmLink.style.right = "20px";
    } else if (MUSIC_ICON_PLACEMENT == "topright") {
        bgmLink.style.top = "20px";
        bgmLink.style.right = "20px";
    }
    
    MUSIC_ICON_IMG.style.filter = "invert(1.0)";
    MUSIC_ICON_IMG.style.width = "30px";
    MUSIC_ICON_IMG.style.cursor = "pointer";

    MUSIC_ICON_IMG.addEventListener("mouseenter", raiseOpacity);
    MUSIC_ICON_IMG.addEventListener("mouseleave", lowerOpacity);
});

function refreshBgm(){
    if (BGM_MUTE){
        BGM_OBJECT.pause();
        BGM_OBJECT.currentTime = 0;
    } else {
        BGM_OBJECT.volume = BGM_VOLUME;
        BGM_OBJECT.play();
    }
}
  
function muteBGM(){
    console.log("setting bgm mute to", !BGM_MUTE);
    BGM_MUTE = !BGM_MUTE;
    refreshBgm();
  
    if (BGM_MUTE) {
        MUSIC_ICON_OPACITY = 0.3;
        MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY;
    } else {
        MUSIC_ICON_OPACITY = 0.6;
        MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY;
    }
}

function raiseOpacity() {
    MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY + 0.2;
}

function lowerOpacity() {
    MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY;
}