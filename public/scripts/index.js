$(function () {
    const socket = io();
    let gameId;

    $("#play-button").on( "click",function () {
        socket.emit("request-start", function (unique) {
            gameId = unique;
            window.location.replace('/game/' + gameId);
        });
    });
});