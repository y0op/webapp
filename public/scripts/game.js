$(function () {
    const socket = io();
    let gameId = window.location.href.substring(window.location.href.lastIndexOf('/') + 1);
    let playerId = socket.id;

    socket.on('connection', function () {
        socket.emit('game-page-loaded', {
            playerId: socket.id,
            gameId: gameId,
        });
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

    socket.on('move-accepted', function (data) {
        /*
        This is actually all that needs to happen, everything
        below this is just for handing wins and ties.
         */
        $('.grid').find('#' + data.place).html(data.player);

        $('#turn').find(".symbol").html(data.newTurn);

        if (data.winData.won) {

            // Stops player from clicking other spaces while in win state
            $('.grid').click(function (event) {
                event.stopPropagation();
            });

            for (let p in data.winData.places) {
                statusDisplay(data.player + "'s has won");
                $('.grid').find('#' + p).addClass("won");
                setTimeout(function () {
                    window.location.replace('/');
                }, 2000);
            }
        } else if (data.tie) {

            // Stops player from clicking other spaces while in win state
            $('.grid').click(function (event) {
                event.stopPropagation();
            });

            statusDisplay("tie game");
            setTimeout(function () {
                window.location.replace('/');
            }, 2000);
        }
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