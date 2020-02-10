var express = require('express');
var app = express();
const nanoid = require('nanoid');

var server = require("http").Server(app);
var io = require("socket.io")(server);

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
io.on('request-start', function (callback) {
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

app.get('/game/:id', function (req, res) {
    res.render('game.ejs');
});

app.listen(3000);