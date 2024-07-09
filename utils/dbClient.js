const { createClient } = require("@supabase/supabase-js")
const { Games } = require('../Constants')
const supaClient = createClient(process.env.SUPABASE_API_URL, process.env.SUPABASE_ANON_KEY);

//teams: number[]
//game: game name string. defaults to valorant
async function getUsersForTeamsAndGame(teams, link, startsIn, game = Games.valorant) {
    //TODO - test this approach v.s. RPC if performance becomes a problem
    let { data, error } = await supaClient
        .from('subscriptions')
        .select(`
     users(discord_id::text),
     teams(*, games(name))
    `)
        .eq('teams.game_id', game)
        .in('teams.intragame_team_id', teams)

    data = data.filter((x) => x.teams != null)
    if (!data.length) {
        // console.log(`no users found for team combo ${teams}`)
        return null;
    }
    const returnObj = {
        data: [
            {
                userId: data[0].users.discord_id,
                matches: [
                    {
                        link: link,
                        provider: "vlr.gg",
                        subbedTeam: data[0].teams.name,
                        teamId: data[0].teams.id,
                        game: game,
                        timeToStart: startsIn
                    }
                ]
            }
        ]
    }
    // console.log(`FOUND USER FOR TEAM COMBO ${teams}`)
    // console.log(JSON.stringify(data))

    return returnObj;
}

module.exports = { getUsersForTeamsAndGame }