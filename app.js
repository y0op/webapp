var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const nanoid = require('nanoid');

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.render('index.ejs');
});

app.get('/game', function (req, res) {
    res.render('game.ejs');
});

var games = [];
io.on('connection', function (socket) {

    socket.on("game-page-loaded", function (data) {
        const game = games.find(g => g.gameId === data.gameId);

        if (!game.x) {
            game.x = data.playerId;
        } else if (!game.o) {
            game.o = data.playerId;
        } else {
            console.log("something went wrong");
        }
    });

    socket.on("request-start", function (callback) {
        const unique = nanoid(12);
        games.push({
            gameId: unique,
            gameState: [
                [' ', ' ', ' '],
                [' ', ' ', ' '],
                [' ', ' ', ' '],
            ],
            turn: 'x',
            players: {
                count: 1,
                x: '',
                o: '',
            }
        });

        callback(unique);
    });

    socket.on('place-request', function (data) {
        const game = games.find(g => g.gameId === data.gameId);

        if (!game.x || !game.o) {
            // Both players not present
            return;
        }

        // Rows then columns
        let row = data.place > 6 ? 2 : (data.place > 3 ? 1 : 0);
        let column  = row === 2 ? data.place - 7 : (data.place === 1 ? data.place - 4 : data.place - 1);
        let char = games[row][column];


    });
});

app.get('/game/:id', function (req, res) {
    res.render('game.ejs');
});

server.listen(3000);

function spaceTaken(gameId, place) {
    const game = games.find(g => g.gameId === gameId);

    let row = place > 6 ? 2 : (place > 3 ? 1 : 0);
    let column  = row === 2 ? place - 7 : (place === 1 ? place - 4 : place - 1);
    let char = games[row][column];

    return char == ' ';
}

function detectWin(gameId, char) {

    let game = games.find(g => g.gameId === gameId);
    if (!game) return false;

    // Up & down, left & right
    for (let i = 0; i < 3; i++) {
        if (game.gameState[i][0] === char && game.gameState[i][1] === char && game.gameState[i][2] ||
            game.gameState[0][i] === char && game.gameState[1][i] === char && game.gameState[2][i]) {
            return true;
        }
    }

    // Diagonal
    return game.gameState[0][0] === char && game.gameState[1][1] === char && game.gameState[2][2] === char ||
        game.gameState[0][2] === char && game.gameState[1][1] === char && game.gameState[2][0] === char;
}

function detectTie(gameId) {
    if (detectWin(gameId, 'x') || detectWin(gameId, 'o')) {
        return false;
    }

    let game = games.find(g => g.gameId === gameId);
    if (!game) return false;

    var tied = true;

    for (var arr in game.gameState) {
        for (var char in arr) {
            if (char !== 'x' || char !== 'o') {
                tied = false;
            }
        }
    }

    return tied;
}