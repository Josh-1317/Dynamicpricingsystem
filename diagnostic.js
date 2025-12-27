import http from 'http';

const PORT = process.env.PORT || 3001;

console.log('Diagnostic Server Starting...');
console.log('PORT Variable:', process.env.PORT);

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'ok',
        message: 'Diagnostic Server Running',
        env_port: process.env.PORT
    }));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Diagnostic Server listening on 0.0.0.0:${PORT}`);
});
