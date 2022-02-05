const valorant = require('./utils/valorant-scrape');
const cron = require('node-cron');

cron.schedule('0 */10 * * * *', () => {
  valorant.getMatchesStartingSoon();
});