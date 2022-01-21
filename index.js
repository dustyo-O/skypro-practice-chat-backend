const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const upload = multer();

const app = express();
const port = 7000;

const users = [];

app.use(cors());
app.use(bodyParser.json());

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.post('/user/register', (req, res) => {
  const { login, password } = req.body;

  const exists = users.some(user => user.login === login);

  if (exists) {
    res.status(409);
    res.send({ status: 'error', message: 'User already exists' });

    return;
  }

  users.push({
    login, password,
  });

  res.send({ status: 'ok' });
});

app.post('/user/login', (req, res) => {
  const { login, password } = req.body;
  const user = users.find(user => user.login === login);

  if (!user) {
    res.status(404);
    res.send({ status: 'error', message: 'User not found' });

    return;
  }

  if (user.password !== password) {
    res.status(400);
    res.send({ status: 'error', message: 'Passwords did not match' });

    return;
  }

  user.token = uuidv4();

  res.send({ status: 'ok', token: user.token });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
