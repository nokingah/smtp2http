var config = require('./config.js'),
    http = require('http'),
    querystring = require('querystring'),
    simplesmtp = require('simplesmtp'),
    url = require('url')

var hosts = Object.create(null)
for (var i in config.hosts) {
    hosts[i] = url.parse(config.hosts[i])
}

simplesmtp.createSimpleServer(function (req) {
    var data = ''
    req.on('data', function (_data) {
        data += _data
    })
    req.on('end', function () {
        req.accept()
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
                    request.on('error', function (err) {
                        console.error('Error creating HTTP request:', err)
                    })
                    request.write(querystring.stringify(headers))
                    request.end()

                } else {
                    console.error('Invalid host name:', JSON.stringify(hostName))
                }
            } else {
                console.error('Invalid "To" header:', JSON.stringify(headers.to))
            }
        } else {
            console.error('Invalid mail data:', JSON.stringify(data))
        }
    })

}).listen(config.port, config.host)
