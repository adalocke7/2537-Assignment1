const express = require('express');
const session = require('express-session');


const app = express();

const node_session_secret = '553a788f-7dd6-4467-bc15-7059332b882e';

app.use(session({
  secret: node_session_secret,
  resave: false,
  saveUninitialized: true,
}));

const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('<h1>Hello, World!</h1>');
});

app.get('/signup', (req, res) => {
  res.send('<h1>Signup Page</h1>');
});

app.get('/login', (req, res) => {
  res.send('<h1>Login Page</h1>');
});

app.get('/members', (req, res) => {
  res.send('<h1>Members Page</h1>');
});

app.get('/logout', (req, res) => {
  res.send('<h1>Logout Page</h1>');
});

app.use((req, res) => {
  res.status(404).send('<h1>404 Not Found</h1>');
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});