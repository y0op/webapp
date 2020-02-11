$(function () {
    const socket = io();
    let gameId = window.location.href.substring(window.location.href.lastIndexOf('/') + 1);
    let playerId = socket.id;

    socket.emit('game-page-loaded', {
        playerId: playerId,
        gameId: gameId,
    });

    $('.grid').click(function (event) {
        if ($(event.target).is(':button')) {
            socket.emit('place-request', {
                gameId: gameId,
                playerId: playerId,
                place: parseInt($(event.target).attr('id')),
            });
        }
    });
});