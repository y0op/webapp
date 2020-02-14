var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const PORT = 3000;

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
            console.log("set x");
        } else if (!game.o) {
            game.o = data.playerId;
            console.log("set o");
        } else {
            console.log("something went wrong");
        }

        console.log(game);
    });

    socket.on("request-start", function (callback) {
        const unique = nanoid(12);
        games.push({
            gameId: unique,
            winAlert: false,
            gameState: [
                [' ', ' ', ' '],
                [' ', ' ', ' '],
                [' ', ' ', ' '],
            ],
            turn: 'x',
            players: {
                x: '',
                o: '',
            }
        });

        callback(unique);
    });

    socket.on('place-request', function (data) {
        const game = games.find(g => g.gameId === data.gameId);


        if (!game.x || !game.o) {
            socket.emit('players-not-present');
            return;
        }

        if (placeTaken(data.gameId, data.place)) {
            socket.emit('place-taken', {
                place: data.place,
            });
            return;
        }

        let char = Object.keys(data.players).find(key => data.players[key] == data.playerId);

        if (game.turn != char) {
            // Not your turn
            return;
        }

        // Change turn
        game.turn = game.turn == 'x' ? 'o' : 'x';

        const won = detectWin(game.gameId, char);
        const tie = detectTie(game.gameId);

        socket.emit('move-accepted', {
            winData: won,
            tie: tie,
            place: data.place,
            gameId: data.gameId,
            playerId: data.playerId,
            player: char,
            newTurn: game.turn,
        });
    });
});

app.get('/game/:id', function (req, res) {
    res.render('game.ejs');
});

server.listen(PORT, function () {
    console.log(`Server running on ${PORT}`);
});

function placeTaken(gameId, place) {
    const game = games.find(g => g.gameId === gameId);

    let row = place > 6 ? 2 : (place > 3 ? 1 : 0);
    let column = row === 2 ? place - 7 : (row === 1 ? place - 4 : place - 1);
    let char = game.gameState[row][column];

    return char == ' ';
}

function detectWin(gameId, char) {

    let game = games.find(g => g.gameId === gameId);
    if (!game) return false;

    let data = {
        won: false,
        places: [],
    };

    // Vertical and Horizontal
    for (let i = 0; i < 3; i++) {

        let vertical = [
            game.gameState[0][i],
            game.gameState[1][i],
            game.gameState[2][i],
        ];

        if (game.gameState[i].every(n => n == char)) {
            for (let k in [1, 2, 3]) {
                data.places.push((i * 3) + k);
            }
            data.won = true;
        } else if (vertical.every(n => n == char)) {
            for (let k in [1, 2, 3]) {
                data.places.push(k * (i + 1));
            }
            data.won = true;
        }
    }

    let a1 = [];
    let a2 = [];

    // Diagonal
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            a1.push(game.gameState[i][j]);
            a2.push(game.gameState[i][2-j]);
        }
    }

    if (a1.every(n => n == char)) {
        data.won = true;
        for (let k in [1, 2, 3]) {
            data.places.push((k - 1) * 3 + k);
        }
    } else if (a2.every(n => n == char)) {
        data.won = true;
        for (let k in [1, 2, 3]) {
            data.places.push(k * 3 - (k - 1));
        }
    }

    return data;
}

function detectTie(gameId) {
    if (detectWin(gameId, 'x').won || detectWin(gameId, 'o').won) {
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