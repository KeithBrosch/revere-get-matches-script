const valorant = require('../utils/valorant-scrape');
const cron = require('node-cron');
console.log("starting cron");
cron.schedule('0 */5 * * * *', () => {
  valorant.getMatchesStartingSoon(true);
});