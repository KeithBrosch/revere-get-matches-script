const valorant = require('./utils/valorant-scrape');
const cron = require('node-cron');

// cron.schedule('0 */45 * * * *', () => {
  valorant.getMatchesStartingSoon();
// });