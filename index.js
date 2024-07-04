const dotenv = require("dotenv");
dotenv.config();

const valorant = require("./utils/valorant-scrape")

const scrapeDelayBuffer = (2000) //wait 20 seconds after scheduler calls script in case scheduler fires early
console.log(`Starting scheduler scrape at ${new Date()}`);
setTimeout(() => valorant.getMatchesStartingSoon(false), scrapeDelayBuffer);

