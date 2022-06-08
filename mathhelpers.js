// @miya7090

// get hex distance
function getTileDistance(aQ, aR, aS, bQ, bR, bS) {
  return Math.max(Math.abs(aQ-bQ), Math.abs(aR-bR), Math.abs(aS-bS));
}

// get list of all coordinates within range of given coordinate
function getCoordinatesWithinRadius(cQ, cR, cS, radius, includeSelf=true){
  var results = []; // returns list of strings

  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q-radius); r <= Math.min(radius, -q+radius); r++) {
      var s = -q-r;
      results.push((cQ+q)+","+(cR+r)+","+(cS+s));
    }
  }

  if (includeSelf == false) { results.splice(results.indexOf(cQ+","+cR+","+cS),1); }
  return results;
}