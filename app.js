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

        if (!game.players.x) {
            game.players.x = data.playerId;
        } else if (!game.players.o) {
            game.players.o = data.playerId;
        } else {
            console.log("something went wrong");
        }
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


        if (!game.players.x || !game.players.o) {
            io.emit('players-not-present', {
                gameId: data.gameId,
            });
            return;
        }

        if (placeTaken(data.gameId, data.place)) {
            // This is socket.emit() because it only needs
            // to be sent back to the original sender
            socket.emit('place-taken', {
                place: data.place,
                gameId: data.gameId
            });
            return;
        }

        let char = Object.keys(game.players).find(key => game.players[key] == data.playerId);

        if (game.turn != char) {
            /*
             Not actually place taken, but same effect
             This is socket.emit() because it only needs
             to be sent back to the original sender
             */
            socket.emit('place-taken', {
                place: data.place,
            });
            return;
        }

        // Update game state -- Run before turn changes
        var d = placeToArr(data.place);
        game.gameState[d.row][d.column] = game.turn;

        // Change turn
        game.turn = game.turn == 'x' ? 'o' : 'x';

        const won = detectWin(game.gameId, char);
        const tie = detectTie(game.gameId);

        console.log("win: " + won.won + ",  tie:" + tie);

        io.emit('move-accepted', {
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

    let d = placeToArr(place);
    let char = game.gameState[d.row][d.column];

    return char != ' ';
}

function placeToArr(place) {
    var data = {
        row: '',
        column: '',
    };

    data.row = place > 6 ? 2 : (place > 3 ? 1 : 0);
    data.column = data.row === 2 ? place - 7 : (data.row === 1 ? place - 4 : place - 1);

    return data;
}

function arrToPlace(row, col) {
    return row * 3 + col + 1;
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

    let a1 = [
        game.gameState[0][0],
        game.gameState[1][1],
        game.gameState[2][2],
    ];
    let a2 = [
        game.gameState[0][2],
        game.gameState[1][1],
        game.gameState[2][0],
    ];

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
    if (!game) {
        return false;
    }

    return game.gameState.every(function (arr) {
        return arr.every(e => e == 'x' || e == 'o');
    });
}