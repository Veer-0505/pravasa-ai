function haversine(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}
function roadDistanceKm(a, b) { return haversine(a, b) * 1.35; }
function travelMinutes(km) { return Math.round((km / 45) * 60); }
module.exports = { haversine, roadDistanceKm, travelMinutes };
