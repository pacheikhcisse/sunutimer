var socket = io.connect(window.location.hostname);

socket.on('time', function (data) {
    $('#countdown').html(data.time);
});

socket.on('start', function () {
    $('#toggle').text('Start');
});

socket.on('stop', function () {
    $('#toggle').text('Stop');
});

socket.on('disable', function () {
    $('#set').prop('disabled', true);
});

socket.on('enable', function () {
    $('#set').prop('disabled', false);
});

socket.on('interval', function (data) {
    var start = lpad((data.start / 1000).toString(), 6);
    var end = lpad((data.end / 1000).toString(), 6);
    $('#startAt').masked(start);
    // $('#startAt').mask('00:00:00');
    $('#endAt').masked(end);
    // $('#endAt').mask('00:00:00');
});

var startAt = 0;
var endAt   = 0;

$('#toggle').click(function() {
    if (startAt == endAt) {
        alert('Oops! Start and End times must be different !')
        return;
    }
    if('Start' === $('#toggle').text()) {
        socket.emit('click:start');
    }
    else if('Stop' === $('#toggle').text()) {
        socket.emit('click:stop');
    }
});

$('#reset').click(function() {
    socket.emit('click:reset');
});

$('#set').click(function () {
    startAt = getTime($('#startAt'));
    endAt = getTime($('#endAt'));
    socket.emit('click:set', {start : startAt, end : endAt});
});

$('#startAt').mask('00:00:00');
$('#endAt').mask('00:00:00');

getTime = function(el) {
    var str = $(el).cleanVal();
    if (str == '') {
        return 0;
    }
    var hh = str.substr(0, 2) == 0 ? 0 : str.substr(0, 2) * 3600;
    var mm = str.substr(2, 2) == 0 ? 0 : str.substr(2, 2) * 60;
    var ss = str.substr(4, 2) == 0 ? 0 : str.substr(4, 2) * 1;
    return (hh + mm + ss) * 1000;
};

lpad = function(str, length) {
    while (str.length < length)
        str = '0' + str;
    return str;
};