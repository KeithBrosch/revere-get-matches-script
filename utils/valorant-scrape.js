const cheerio = require('cheerio');
const request = require('request');

const url = 'https://www.vlr.gg/matches';

// get the URL of all matches beginning in the next 5 minutes and pass them on to getMatch
function getMatchesStartingSoon() {
    let matchesStartingSoon = [];
    request(url, (error, response) => {
        if (error) {
            console.log(error);
        } else {
            const $ = cheerio.load(response.body);
            const matchDivs = $('.ml-eta');
            const numMatches = matchDivs.length;
            let index = 0;
            do {
                let startsIn = matchDivs[index].children[0].data;
                if (startsIn === '0m' || startsIn === '1m' || startsIn === '2m' || startsIn === '3m' || startsIn === '4m' || startsIn === '5m') {
                    getMatch(`https://www.vlr.gg${matchDivs[index].parent.parent.parent.attribs.href}`, startsIn);
                } else {
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
    request(matchUrl, (error, response) => {
        if (error) {
            console.log(error);
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
            const teamNames = $('.wf-title-med');
            match.team1.name = teamNames[0].children[0].data.trim();
            match.team2.name = teamNames[1].children[0].data.trim();
            const teamLinks = $('.match-header-link ');
            match.team1.id = teamLinks[0].attribs.href;
            match.team2.id = teamLinks[1].attribs.href;
            const streamLinks = $('.match-streams-btn-external');
            match.streamLink = streamLinks[0].attribs.href;
            console.log(match);
        }
    });
}

module.exports = { getMatchesStartingSoon };