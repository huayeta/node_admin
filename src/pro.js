const express = require('express');
const request = require('request');
const Agent = require('socks5-https-client/lib/Agent');

const app = express();

app.use('/', (req, res) => {
    const url = 'https://www.google.com' + req.url;
    req.pipe(
        request({
            url,
            strictSSL: true,
            agentClass: Agent,
            agentOptions: {
                socksHost: '183.6.215.29',
                socksPort: 51288
            }
        })
    ).pipe(res);
});
app.listen(3000);
