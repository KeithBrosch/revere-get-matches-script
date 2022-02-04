const cheerio = require("cheerio");
const request = require("request");

const url = "https://www.vlr.gg/matches";

// get the URL of all matches beginning in the next 5 minutes and pass them on to getMatch
function getMatchesStartingSoon() {
  console.log(`Starting Get Teams Scrape at ${new Date()}`);
  console.log('-----------------------------------------');
  let matchesStartingSoon = [];
  request(url, (error, response) => {
    if (error) {
      console.log(`Could not GET ${url}`);
      console.log(error);
      console.log('-----------------------------------------');
    } else {
      const $ = cheerio.load(response.body);
      const matchDivs = $(".ml-eta");
      const numMatches = matchDivs.length;
      console.log(`Found ${numMatches} total matches`)
      console.log('-----------------------------------------');
      let index = 0;
      do {
        let startsIn = matchDivs[index].children[0].data;
        if (
          startsIn === "0m" ||
          startsIn === "1m" ||
          startsIn === "2m" ||
          startsIn === "3m" ||
          startsIn === "4m" ||
          startsIn === "5m"
        ) {
          console.log(`${matchDivs[index].parent.parent.parent.attribs.href} starts in ${startsIn}`);
          console.log('-----------------------------------------');
          getMatch(
            `https://www.vlr.gg${matchDivs[index].parent.parent.parent.attribs.href}`,
            startsIn
          );
        } else {
          if (index === 0) {
            console.log("there are no matches starting in the next 5 minutes");
            console.log('-----------------------------------------');
          }
          break;
        }
        index += 1;
      } while (index < numMatches);
      return matchesStartingSoon;
    }
  });
}

// get more in depth data on the match
function getMatch(matchUrl, startsIn) {
  console.log(`Getting more info on upcoming match ${matchUrl}, which starts in ${startsIn}`);
  console.log('-----------------------------------------');
  request(matchUrl, (error, response) => {
    if (error) {
      console.log(`Could not GET ${matchUrl}`)
      console.log(error);
      console.log('-----------------------------------------');
    } else {
      let match = {
        team1: {
          name: null,
          id: null,
        },
        team2: {
          name: null,
          id: null,
        },
        streamLink: null,
        startsIn: startsIn,
      };
      const $ = cheerio.load(response.body);
      const teamNames = $(".wf-title-med");
      match.team1.name = teamNames[0].children[0].data.trim();
      match.team2.name = teamNames[1].children[0].data.trim();
      const teamLinks = $(".match-header-link ");
      match.team1.id = teamLinks[0].attribs.href;
      match.team2.id = teamLinks[1].attribs.href;
      console.log(`Teams Playing: ${JSON.stringify(match.team1)} vs ${JSON.stringify(match.team2)}`);
      console.log('-----------------------------------------');
      const streamLinks = $(".match-streams-btn-external");
      if (streamLinks.length && streamLinks[0].attribs && streamLinks[0].attribs.href) {
        match.streamLink = streamLinks[0].attribs.href;
        console.log(`Found this stream link ${match.streamLink}`);
        console.log('-----------------------------------------');
      } else {
        match.streamLink = matchUrl;
        console.log(`Could not find a stream link for this match, defaulting to ${match.streamLink}`);
        console.log('-----------------------------------------');
      }

      console.log(`Full Match Details: ${JSON.stringify(match)}`);
      console.log('-----------------------------------------');
      // todo: need to send match to DB
      // note: not every team has a team ID
    }
  });
}

module.exports = { getMatchesStartingSoon };
