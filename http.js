const http = require('http');

// spin up the server
const server = http.createServer( (req, res) => {
    //console.log(req);
    //process.exit(); // ---quit the server
    console.log(req.url, req.method, req.headers); // "/" "GET" "host: ... connection:... accept:..."
    res.setHeader('Content-Type', 'text/html');
    res.write('<html>');
    res.write('<head><title>My Node JS Page</title></head>');
    res.write('<body><h1>hello from nodejs server</h1></body>');
    res.write('</html>');
    res.end();
});

server.listen(3000);