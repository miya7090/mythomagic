// @miya7090

GITHUB_PUBLIC_PATH = "https://raw.githubusercontent.com/miya7090/mythomagic/main/public/";

BGM_MUTE_COPY = false; // a copy in case cookies don't work
BGM_OBJECT = undefined;
BGM_VOLUME = 1.0;
BGM_NAME = undefined;
BGM_BEGIN_DELAY = 0;

MUSIC_ICON_LINK = GITHUB_PUBLIC_PATH+'images/music.png';
MUSIC_ICON_IMG = undefined;
MUSIC_MENU_DIV = undefined;
MUSIC_ICON_PLACEMENT = "bottomright";
MUSIC_ICON_OPACITY = undefined;

document.addEventListener("DOMContentLoaded", () => {
    const bgmLink = document.getElementById("bgmLinker");
    if (bgmLink == undefined) { return; }

    // add background music
    var volume;
    switch (bgmLink.getAttribute("page")) {
        case "entry":      BGM_NAME = "6 wind of melancholy"; break;
        case "lobby":      BGM_NAME = "73 campfire"; BGM_VOLUME = 0.6; break;
        case "tie":      BGM_NAME = "89 town of clocks"; BGM_VOLUME = 0.7; break;
        case "preview":      BGM_NAME = "36 elven kingdom"; BGM_VOLUME = 0.8; break;
        case "game":       BGM_NAME = "50 mulling"; BGM_VOLUME = 0.4; MUSIC_ICON_PLACEMENT = "topright"; break;
        case "defeat":     BGM_NAME = "94 the contract"; break;
        case "victory":    BGM_NAME = "18 elemental plane of air"; break;
    }
    if (BGM_NAME == undefined) { return; }

    // add mute icon
    MUSIC_ICON_IMG = document.createElement("img");
    MUSIC_ICON_IMG.src = MUSIC_ICON_LINK;
    MUSIC_ICON_IMG.id = "muteIcon";
    MUSIC_ICON_OPACITY = 0.6;
    MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY;
    MUSIC_ICON_IMG.onclick = muteBGM;
    bgmLink.appendChild(MUSIC_ICON_IMG);

    // add music menu
    MUSIC_MENU_DIV = document.createElement("div");
    MUSIC_MENU_DIV.style.backgroundColor = "rgba(50,50,50,0.25)";
    MUSIC_MENU_DIV.style.position = "absolute";
    MUSIC_MENU_DIV.style.width = "230px";
    MUSIC_MENU_DIV.style.textAlign = "center";
    MUSIC_MENU_DIV.id = "musicMenu";
    bgmLink.appendChild(MUSIC_MENU_DIV);

    MUSIC_MENU_DIV.appendChild(document.createElement("br"));
    var line1 = document.createElement("p");
    line1.innerHTML = "Music by The Seventh Midnight";
    MUSIC_MENU_DIV.appendChild(line1);
    MUSIC_MENU_DIV.appendChild(createMusicChangeButton("6 wind of melancholy", "6. Wind of Melancholy"));
    MUSIC_MENU_DIV.appendChild(createMusicChangeButton("18 elemental plane of air", "18. Elemental Plane of Air"));
    MUSIC_MENU_DIV.appendChild(createMusicChangeButton("36 elven kingdom", "36. Elven Kingdom, Fvia Al'in"));
    MUSIC_MENU_DIV.appendChild(createMusicChangeButton("50 mulling", "50. Mulling"));
    MUSIC_MENU_DIV.appendChild(createMusicChangeButton("73 campfire", "73. Campfire"));
    MUSIC_MENU_DIV.appendChild(createMusicChangeButton("89 town of clocks", "89. Town of Clocks"));
    MUSIC_MENU_DIV.appendChild(createMusicChangeButton("94 the contract", "94. The Contract"));
    MUSIC_MENU_DIV.appendChild(createMusicChangeButton("silence", "none"));
    MUSIC_MENU_DIV.style.fontFamily = "cambria";
    var closeLine = document.createElement("p");
    closeLine.innerHTML = "[close]";
    closeLine.addEventListener("mouseup", () => { MUSIC_MENU_DIV.style.display = "none"; });
    MUSIC_MENU_DIV.appendChild(closeLine);
    MUSIC_MENU_DIV.appendChild(document.createElement("br"));
    MUSIC_MENU_DIV.style.display = "none";
    MUSIC_MENU_DIV.style.zIndex = 30;

    // add background music
    let bgmSource = GITHUB_PUBLIC_PATH+'sounds/'+BGM_NAME+'.mp3';
    BGM_OBJECT = new Audio(bgmSource);
    setTimeout(refreshBgm, BGM_BEGIN_DELAY); // start music 2 secs in

    // styling
    bgmLink.style.position = "fixed";
    if (MUSIC_ICON_PLACEMENT == "bottomright") {
        bgmLink.style.bottom = "15px";
        bgmLink.style.right = "20px";
        MUSIC_MENU_DIV.style.bottom = "10px";
        MUSIC_MENU_DIV.style.right = "40px";
    } else if (MUSIC_ICON_PLACEMENT == "topright") {
        bgmLink.style.top = "20px";
        bgmLink.style.right = "20px";
    }
    
    MUSIC_ICON_IMG.style.filter = "invert(1.0)";
    MUSIC_ICON_IMG.style.width = "30px";
    MUSIC_ICON_IMG.style.cursor = "pointer";
    if (MUSIC_ICON_PLACEMENT != "topright") {
        MUSIC_ICON_IMG.title = "right click to change music";
    } else {
        MUSIC_ICON_IMG.title = "music change not available"; // #TODO fix
    }
    
    MUSIC_ICON_IMG.addEventListener("mouseenter", mouseEnteredIcon);
    MUSIC_ICON_IMG.addEventListener("mouseleave", mouseLeftIcon);
    MUSIC_ICON_IMG.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        if (MUSIC_ICON_PLACEMENT != "topright"){
            if (MUSIC_MENU_DIV.style.display == "block"){
                MUSIC_MENU_DIV.style.display = "none";
            } else {
                MUSIC_MENU_DIV.style.display = "block";
            }
        }
        return false;
    }, false );
});

function createMusicChangeButton(musicCode, musicFullName){
    var tempButton = document.createElement("div");
    if (BGM_NAME == musicCode) { // the default music
        tempButton.style.backgroundColor = "rgba(125,255,155,0.15)";
    } else {
        tempButton.style.backgroundColor = "rgba(255,255,255,0.05)";
    }
    tempButton.style.margin = "2px";
    tempButton.style.marginLeft = "15px";
    tempButton.style.marginRight = "15px";
    tempButton.innerHTML = musicFullName;
    tempButton.addEventListener("mouseenter", () => {
        tempButton.style.backgroundColor = "rgba(255,255,255,0.15)";
    });
    tempButton.addEventListener("mouseleave", () => {
        if (BGM_NAME == musicCode) { // the default music
            tempButton.style.backgroundColor = "rgba(125,255,155,0.15)";
        } else {
            tempButton.style.backgroundColor = "rgba(255,255,255,0.05)";
        }
    });
    tempButton.addEventListener("mouseup", () => {
        BGM_OBJECT.src = GITHUB_PUBLIC_PATH+'sounds/'+musicCode+'.mp3';
        BGM_MUTE_COPY = true; muteBGM(true); // reset: force mute + unmute
        tempButton.style.backgroundColor = "rgba(255,255,255,0.5)";
    });
    return tempButton;
}

function refreshBgm(){
    let cookieSaysMute = getMuteStatus();
    console.log(cookieSaysMute, BGM_MUTE_COPY, "bgm refresh");
    if (cookieSaysMute == "" || cookieSaysMute == undefined){
        if (BGM_MUTE_COPY){
            console.log("no mute preference set yet, but a mute was declared");
            BGM_OBJECT.pause();
            BGM_OBJECT.currentTime = 0;
        } else {
            console.log("no mute preference set yet, but attempting to play sound");
            BGM_OBJECT.volume = BGM_VOLUME;
            BGM_OBJECT.loop = true;
            var promise = BGM_OBJECT.play();
    
            if (promise !== undefined) {
                promise.then(_ => {
                    // all ok
                }).catch(error => {
                    console.log("music autoplay was prevented, most likely by chrome");
                    BGM_MUTE_COPY = true; // but don't remember this
                });
            }
        }
    } else {
        if (cookieSaysMute=="true") {
            console.log("deferring to cookie demanding mute");
            BGM_MUTE_COPY = true;
            BGM_OBJECT.pause();
            BGM_OBJECT.currentTime = 0;

            MUSIC_ICON_OPACITY = 0.3; MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY;
            
        } else {
            console.log("deferring to cookie demanding sound");
            BGM_MUTE_COPY = false;
            BGM_OBJECT.volume = BGM_VOLUME;
            BGM_OBJECT.loop = true;
            var promise = BGM_OBJECT.play();

            MUSIC_ICON_OPACITY = 0.6; MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY;
    
            if (promise !== undefined) {
                promise.then(_ => {
                    // all ok
                }).catch(error => {
                    console.log("music autoplay was prevented, most likely by chrome");
                    BGM_MUTE_COPY = true;
                    MUSIC_ICON_OPACITY = 0.3; MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY;
                });
            }
        }
    }    
}
  
function muteBGM(rememberThis){
    console.log("setting bgm mute to", !BGM_MUTE_COPY);
    BGM_MUTE_COPY = !BGM_MUTE_COPY;
    if (rememberThis) {
        rememberMuteStatus(BGM_MUTE_COPY)
    }
    refreshBgm();
  
    if (BGM_MUTE_COPY) {
        MUSIC_ICON_OPACITY = 0.3;
        MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY;
    } else {
        MUSIC_ICON_OPACITY = 0.6;
        MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY;
    }
}

function rememberMuteStatus(shouldMute) {
    let exdays = 30; // expire after a month
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = "mute=" + shouldMute + ";" + expires + ";path=/";
}

function getMuteStatus() {
    let name = "mute=";
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

function mouseEnteredIcon() {
    MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY + 0.2;
}

function mouseLeftIcon() {
    MUSIC_ICON_IMG.style.opacity = MUSIC_ICON_OPACITY;
}