const now = new Date();
const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
const dateObj = {};
parts.forEach(p => dateObj[p.type] = p.value);
const midnightStr = dateObj.year + '-' + dateObj.month + '-' + dateObj.day + 'T00:00:00+05:30';
console.log('midnightStr:', midnightStr);
const ms = new Date(midnightStr).getTime();
console.log('ms:', ms);
