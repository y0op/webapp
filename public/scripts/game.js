$(function () {
    const socket = io();
    let gameId = window.location.href.substring(window.location.href.lastIndexOf('/') + 1);
    let playerId = socket.id;

    socket.emit('game-page-loaded', {
        playerId: playerId,
        gameId: gameId,
    });

    socket.on('players-not-present', function () {
        statusDisplay('both players must be present');
    });

    socket.on('place-taken', function (data) {
        const element = $('.grid').find('#' + data.place);
        element.addClass('shake');
        setTimeout(function () {
            element.removeClass('shake');
        },500)
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

function statusDisplay(msg) {
    let status = $('#status');
    status.html(msg);
    status.addClass('fade');

    setTimeout(function () {
        status.empty();
        status.removeClass('fade');
    }, 3000);
}