const cheerio = require("cheerio");
const request = require("request");
const axios = require("axios");

const url = "https://www.vlr.gg/matches";
const apiBase = process.env.CURR_ENVIRONMENT == "prod" ? process.env.HEROKU_API_BASE : process.env.LOCAL_API_BASE;
// get the URL of all matches beginning in the next 10 minutes and pass them on to getMatch
function getMatchesStartingSoon(isTest) {
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
          startsIn === "0m" ||
          startsIn === "1m" ||
          startsIn === "2m" ||
          startsIn === "3m" ||
          startsIn === "4m" ||
          startsIn === "5m" ||
          startsIn === "6m" ||
          startsIn === "7m" ||
          startsIn === "8m" ||
          startsIn === "9m" ||
          startsIn === "10m"
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
      let teamLinkString = teamLinks[0].attribs.href;
      match.team1.id = teamLinkString.substring(teamLinkString.indexOf("/", 1) + 1, teamLinkString.lastIndexOf("/") )
      teamLinkString = teamLinks[1].attribs.href;
      match.team2.id = teamLinkString.substring(teamLinkString.indexOf("/", 1) + 1, teamLinkString.lastIndexOf("/") )
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
        axios.post(`${apiBase}/followers`, match).then((res) => {
        console.log(`sent match to backend to alert followers: ${JSON.stringify(match)}`);
        console.log('-----------------------------------------');
        return true;
       })
       .catch((err) =>{;
        console.log(`axios catch -- ${err}`);
        return false;
       });
      } else {
          console.log(`this run is a test; data not sent to backend: ${JSON.stringify(match)}`)
      }
      
    }
  });
}

module.exports = { getMatchesStartingSoon };
