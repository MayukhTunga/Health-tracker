const d1 = new Date().setHours(0,0,0,0);
const d2 = new Date().setHours(23,59,59,999);
console.log((d2-d1)/86400000);
