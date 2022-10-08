var socket = new WebSocket('wss://mingkong1986.com');
socket.addEventListener('open', function(event) {
    console.log('socket is open');
    socket.send('2111');
});
console.log(socket);

socket.addEventListener('message', function(event) {
    console.log('Message from server', event.data);
});
