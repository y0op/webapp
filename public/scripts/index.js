$(function () {
    var socket = io();

    var gameId;

    $('#play-button').click(() => {
        socket.emit('request-start', function (unique) {
            gameId = unique;
            window.location.href = '/game/' + gameId;
        });
    });
});