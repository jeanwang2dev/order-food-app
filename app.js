
const express = require('express');
const app = express();

const { port } = require('./utils/config');
//const port = process.env.PORT

// app.use( (req, res, next) => {
//     console.log('In the middleware');
//     next(); // Allows the request to continue to the next middleware in line
// });

// app.use((req, res, next) => {
//     console.log('In another middleware');
//     res.send('<h1> hello from Express!</h1>');
// });

app.use(express.json());

app.listen(port, ()=> console.log(`Server listening on port: ` + port));

app.get('/hello', (req, res) => {
    console.log('Headers:', req.headers);
    console.log('Method:', req.method);
    res.send('Received GET request!\n');
});

app.post('/hello', (req, res) => {
    console.log('Headers:', req.headers);
    console.log('Method:', req.method);
    console.log('Body:', req.body);
    res.send('Received POST request!\n');
});