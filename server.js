var net = require('net');
var dgram = require('dgram');
var url = require('url');

var Server = function(uri) {
    if (!(this instanceof Server)) {
        return new Server(uri);
    }

    var self = this;
    self.uri = url.parse(uri);

    self.server = net.createServer();

    self.udp = dgram.createSocket('udp4');
    self.udp.bind(self.uri.port, function(err) {
        if (err) {
            console.error(err.stack);
            return process.exit(1);
        }

        self.udp.addMembership(self.uri.hostname);
    });
};

Server.prototype.listen = function(port, cb) {
    var self = this;
    self.server.listen(port, cb);

    self.server.on('connection', function(socket) {
        var handler = function handler(msg) {
            var buff = Buffer(2);
            buff.writeUInt16BE(msg.length, 0);
            socket.write(buff);
            socket.write(msg);
        };

        self.udp.on('message', handler);
        socket.on('close', function() {
            self.udp.removeListener('message', handler);
        });

        socket.on('error', function(err) {
            console.error('client connection error', err.stack);
        });
    });

    self.server.on('error', function(err) {
        console.error(err.stack);
        return process.exit(1);
    });
};

Server.prototype.address = function() {
    var self = this;
    return self.server.address();
};

module.exports = Server;
