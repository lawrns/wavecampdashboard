const fs = require('fs');
const p = 'wordpress-server/wp-content/plugins/heiwa-booking-widget/assets/build/heiwa-widget.umd.js';
const s = fs.readFileSync(p, 'utf8');
console.log('has require("react"):', s.includes('require("react")'));
console.log("has require('react'):", s.includes("require('react')"));
console.log('has jsx-runtime:', s.includes('react/jsx-runtime'));
console.log('has react-dom/client:', s.includes('react-dom/client'));
console.log('has react-dom:', s.includes('react-dom'));

