// @miya7090

// get hex distance
function getTileDistance(aQ, aR, aS, bQ, bR, bS) {
  return Math.max(Math.abs(aQ-bQ), Math.abs(aR-bR), Math.abs(aS-bS));
}

// get list of all coordinates within range of given coordinate
function getCoordinatesWithinRadius(cQ, cR, cS, radius, includeSelf=true){
  let results = []; // returns list of strings

  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q-radius); r <= Math.min(radius, -q+radius); r++) {
      let s = -q-r;
      results.push((cQ+q)+","+(cR+r)+","+(cS+s));
    }
  }

  if (includeSelf == false) { results.splice(results.indexOf(cQ+","+cR+","+cS),1); }
  return results;
}

function getReflectedCoordinate(q, r, s){
  return [-q, -r, -s];
}

function rand(low, high){
  return (Math.random() * (high - low) + low);
}

function coinFlip(){
  return (Math.floor(Math.random() * 2) == 0);
}

function pickRandomEntries(arr, n) {
  return randArray(arr).slice(0,n);
}

function randArray(arr) {
  return arr.sort(function(){ return 0.5 - Math.random(); });
}