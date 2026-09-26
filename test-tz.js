const now = new Date();
const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
const dateObj = {};
parts.forEach(p => dateObj[p.type] = p.value);
const midnightStr = ${dateObj.year}--T00:00:00+05:30;
const startTimeMillis = new Date(midnightStr).getTime();
console.log('midnightStr:', midnightStr);
console.log('startTimeMillis:', startTimeMillis);
