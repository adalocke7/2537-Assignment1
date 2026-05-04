require('./utils.js');
require('dotenv').config(); 
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const bcrypt = require('bcrypt');
const Joi = require('joi');
const saltRounds = 10;


const app = express();
const port = process.env.PORT || 3000;


const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_user_database = process.env.MONGODB_USER_DATABASE;
const mongodb_session_database = process.env.MONGODB_SESSION_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

const {database} = include('databaseConnection');
const userCollection = database.db(mongodb_user_database).collection('Users');

app.use(express.urlencoded({extended: false}));
app.use(express.json());


var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_session_database}`,
	crypto: {
		secret: mongodb_session_secret
	}
});

app.use(session({ 
  secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true
}
));

// Basic Route
app.get('/', (req, res) => {
  if (req.session.authenticated) {
    res.send(`<h1>Welcome, ${req.session.username}!</h1><a href="/members">Go to Members Area</a> | <a href="/logout">Logout</a>`);
  } else {
    res.send('<h1>Home Page</h1><a href="/signup">Signup</a> | <a href="/login">Login</a>');
  }
});

app.get('/signup', (req, res) => {
  res.send('<h1>Signup Page</h1> <form action="/signingup" method="POST"><input type="text" name="username" placeholder="Username" required><input type="email" name="email" placeholder="Email" required><input type="password" name="password" placeholder="Password" required><button type="submit">Signup</button></form>');
});

app.post('/signingup', async (req, res) => {
  const { username, email, password } = req.body;
  
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  const valuation = schema.validate({ username, email, password });
  if (valuation.error) {
  console.error(valuation.error.details[0].message); // see exact error
  res.send(`Error: ${valuation.error.details[0].message} <a href="/signup">Go back</a>`);
  return;
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  await userCollection.insertOne({username: username, email: email, password: hashedPassword });

  const html = 'Created user successfully! <a href="/login">Login here</a>';
  res.send(html);
});

app.get('/login', (req, res) => {
  res.send('<h1>Login Page</h1> <form action="/logingin" method="POST"><input type="email" name="email" placeholder="Email" required><input type="password" name="password" placeholder="Password" required><button type="submit">Login</button></form>');
});

app.post('/logingin', async (req, res) => {
  const { email, password } = req.body;
  
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  const validationResult = schema.validate({ email, password });
  if (validationResult.error) {
    console.log(validationResult.error);
    res.redirect('/login');
    return;
  }

  const result = await userCollection.find({ email: email }).project({email: 1, username: 1, password: 1, _id: 1}).toArray();

  if (result.length != 1) {
    res.redirect('/login');
    return;
  }
  if (await bcrypt.compare(password, result[0].password)) {
    req.session.authenticated = true;
    req.session.email = email;
    req.session.username = result[0].username;
    res.redirect('/members');
    return;
  } else {
    res.redirect('/login');
    return;
  }
});

app.get('/members', (req, res) => {
  if (!req.session.authenticated) {
    res.redirect('/login');
    return;
  } else {
    res.send('<h1>Members Area</h1><a href="/logout">Logout</a>');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.use((req, res) => {
  res.status(404).send('<h1>404 Not Found</h1>');
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});