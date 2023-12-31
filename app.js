const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Converting Player Details Snake Case To Camel Case

const convertPlayerDetailsSnakeCaseToCamelCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//Converting Match Details Snake Case To Camel Case

const convertMatchDetailsSnakeCaseToCamelCase = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//Converting Player and Match Details Snake Case To Camel Case

const convertPlayerAndMatchDetailsSnakeCasseToCamelCase = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//Get Players API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
      SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDetailsSnakeCaseToCamelCase(eachPlayer)
    )
  );
});

//Get Player API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const getPlayer = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailsSnakeCaseToCamelCase(getPlayer));
});

//Update Player API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
      UPDATE player_details 
      SET 
        player_name = '${playerName}'
      WHERE
        player_id = ${playerId};`;
  const updatePlayer = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Match API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const getMatch = await db.get(getMatchQuery);
  response.send(convertMatchDetailsSnakeCaseToCamelCase(getMatch));
});

//Get Matches of Player API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesPlayerQuery = `
      SELECT 
        *
      FROM 
        player_match_score NATURAL JOIN match_details
      WHERE 
        player_id = ${playerId};`;
  const getMatchPlayer = await db.all(getMatchesPlayerQuery);
  response.send(
    getMatchPlayer.map((eachPlayer) =>
      convertMatchDetailsSnakeCaseToCamelCase(eachPlayer)
    )
  );
});

//Get Players of Specific Match API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersMatchQuery = `
      SELECT * FROM player_match_score NATURAL JOIN player_details 
      WHERE match_id = ${matchId};`;
  const playersList = await db.all(getPlayersMatchQuery);
  response.send(
    playersList.map((eachPlayer) =>
      convertPlayerDetailsSnakeCaseToCamelCase(eachPlayer)
    )
  );
});

//Get Player Scores API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
      SELECT player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes 
      FROM 
        player_match_score INNER JOIN player_details ON 
        player_details.player_id = player_match_score.player_id
      WHERE
        player_details.player_id = ${playerId};`;
  const getPlayerScore = await db.get(getPlayerScoreQuery);
  response.send(getPlayerScore);
});

module.exports = app;
