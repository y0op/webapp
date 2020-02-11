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

    socket.on("game-page-loaded", function (callback) {
        callback(socket.id);
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
        // Parse data
    });
});

app.get('/game/:id', function (req, res) {
    res.render('game.ejs');
});

server.listen(3000);

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