// @miya7090

const bgmSource = GITHUB_PUBLIC_PATH+'sounds/50 mulling.mp3';
const clack3 = GITHUB_PUBLIC_PATH+'sounds/clack3.mp3'
const clack4 = GITHUB_PUBLIC_PATH+'sounds/clack4.mp3'
const clack5 = GITHUB_PUBLIC_PATH+'sounds/clack5.mp3'

document.addEventListener("DOMContentLoaded", () => {
    const gameInfoBox = document.getElementById("gameInfoBox");

    // display player's available cards
    PLAYER_OWNED.forEach((availCard) => {
        createAvailableCardDiv(availCard);
    });

    gameInfoBox.innerHTML = get_BC_BroadcastForInfoBox(new Card("Achilles")); // focus on achilles first
});

// listener semi-copies that don't actually do anything game-wise

function mouseClickAvailableCard(evt){
    return;
}

function mouseOverAvailableCard(evt, referenceCard) {
    const gameInfoBox = document.getElementById("gameInfoBox");
    gameInfoBox.innerHTML = get_BC_BroadcastForInfoBox(referenceCard);
    playSoundRandom([clack3, clack4, clack5], rand(0.4,0.6));
}

function playSoundRandom(choices, volume){
    let chosenSound = choices[Math.floor(Math.random() * choices.length)];
    let snd = new Audio(chosenSound);
    snd.volume = volume;
    snd.play();
}