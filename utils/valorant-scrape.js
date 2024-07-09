const cheerio = require("cheerio");
const request = require("request");
const axios = require("axios");
const { Games } = require('../Constants')
const { getUsersForTeamsAndGame } = require("./dbClient");


const url = "https://www.vlr.gg/matches";

// get the URL of all matches beginning in the next 10 minutes and pass them on to getMatch
function getMatchesStartingSoon(isTest) {
  /*
  //uncomment to test pulling 2 pre-seeded teams from db
  getUsersForTeamsAndGame([474, 8877], Games.valorant)
  return; */
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
        //todo - could change this to something more universal instead of 10 ORs. low priority.
        if (
          matchStartsInWindow(startsIn)
        ) {
          console.log(`${matchDivs[index].parent.parent.parent.attribs.href} starts in ${startsIn}`);
          console.log('-----------------------------------------');
          getMatch(
            `https://www.vlr.gg${matchDivs[index].parent.parent.parent.attribs.href}`,
            startsIn,
            isTest
          )
        } else {
          if (index === 0) {
            console.log("there are no matches starting in the next 10 minutes");
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
function getMatch(matchUrl, startsIn, isTest) {
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
      const teamLinkString1 = teamLinks[0].attribs.href;
      const teamLinkString2 = teamLinks[1].attribs.href;
      if (!teamLinkString1 || !teamLinkString2) {
        console.error(`1 or both teams are missing for match ${matchUrl}`)
        return;
      }
      match.team1.id = teamLinkString1.substring(teamLinkString1.indexOf("/", 1) + 1, teamLinkString1.lastIndexOf("/"))
      match.team2.id = teamLinkString2.substring(teamLinkString2.indexOf("/", 1) + 1, teamLinkString2.lastIndexOf("/"))
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
      if (!isTest) {
        // note: not every team has a team ID
        // maybe make this its own function separate from getting the match from vlr

        // 1) get users subscribed to this team from DB
        getUsersForTeamsAndGame([match.team1.id, match.team2.id], matchUrl, startsIn, Games.valorant).then((result) => {
          // 2) POST it over to Revere bot
          if (!result) return;
          axios.post(process.env.REVERE_API_POST_URL, result, {
            headers: {
              "revere-api-key": process.env.REVERE_API_KEY
            }
          })
        })
      } else {
        console.log(`this run is a test; data not sent to backend: ${JSON.stringify(match)}`)
      }

    }
  });
}
function matchStartsInWindow(timeTilStartString) {
  //this is a "Xh xM" timeTilStart
  // if (/\b\d{1,2}h \d{1,2}m\b/.test(timeTilStartString)) {
  //   return true
  // }
  if (/^\d{1,2}m$/.test(timeTilStartString)) {
    //process.env.SCRAPE_TIMER_MINUTES
    return true
  }

}

module.exports = { getMatchesStartingSoon };
