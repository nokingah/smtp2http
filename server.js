var config = require('./config.js'),
    http = require('http'),
    querystring = require('querystring'),
    smtp = require('./smtp.js'),
    url = require('url')

var hosts = Object.create(null)
for (var i in config.hosts) {
    hosts[i] = url.parse(config.hosts[i])
}

smtp.createServer(function (connection) {
    connection.on('DATA', function (message) {
        var data = ''
        message.on('data', function (_data) {
            data += _data
        })
        message.on('end', function () {
            message.accept()
            var pair = data.split(/\r\n\r\n/, 2)
            if (pair.length == 2) {

                var rawHeaders = pair[0].split(/\r\n/)

                var headers = {}
                for (var i in rawHeaders) {
                    var pair = rawHeaders[i].split(/: /, 2)
                    if (pair.length == 2) {
                        headers[pair[0].toLowerCase()] = pair[1]
                    }
                }

                var to = /<?(\S+@\S+\.\S{2,})>?/.exec(headers.to)
                if (to) {
                    to = to[1]
                    var hostName = to.match(/@(.*)$/)[1],
                        host = hosts[hostName]
                    if (host) {
                        var requestConfig = {
                            host: host.host,
                            path: host.path,
                            method: 'POST',
                            headers: {
                                'content-type': 'application/x-www-form-urlencoded',
                            },
                        }
                        var request = http.request(requestConfig, function (res) {})
                        request.on('error', function (err) {})
                        request.write(querystring.stringify(headers))
                        request.end()
                    }
                }

            }
        })
    })
}).listen(config.port, config.host)
