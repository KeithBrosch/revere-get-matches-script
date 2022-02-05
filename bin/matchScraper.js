const valorant = require('./utils/valorant-scrape');

console.log(`Starting heroku scheduler scrape at ${new Date()}`);
valorant.getMatchesStartingSoon();
