const { createClient } = require("@supabase/supabase-js") 
const { Games } = require('../Constants')
const supaClient = createClient(process.env.SUPABASE_API_URL, process.env.SUPABASE_ANON_KEY);

//teams: number[]
//game: game name string. defaults to valorant
async function getUsersForTeamsAndGame(teams, game = Games.valorant){
//TODO - test this approach v.s. RPC if performance becomes a problem
    const { data, error } = await supaClient
    .from('subscriptions')
    .select(`
     users(discord_id),
     teams(*, games(name))
    `)
    .eq('teams.game_id', game )
    .in('teams.intragame_team_id', teams)

    console.log(`FOUND USER FOR TEAM COMBO ${teams}`)
    console.log(JSON.stringify(data))

    return null;
}

module.exports = {getUsersForTeamsAndGame}