$(function () {
    const socket = io();
    let gameId = window.location.href.substring(window.location.href.lastIndexOf('/') + 1);
    let playerId;

    socket.emit('game-page-loaded', function (pId) {
        playerId = pId;
    });
});