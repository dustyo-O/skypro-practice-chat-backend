const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { nanoid } = require('nanoid');

const { user, chat, messages } = require('./model');

const sendError = require('./lib/sendError');

const upload = multer();

const app = express();
const port = 7000;

app.use(cors());
app.use(bodyParser.json());

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.post('/user/register', async (req, res) => {
  const { login, password } = req.body;

  let result;

  if (!login) {
    return sendError(res, undefined, 400, 'No login in request');
  }

  if (!password) {
    return sendError(res, undefined, 400, 'No password in request');
  }

  try {
    result = await user.exists({ login });
  } catch (error) {
    return sendError(res, err, 500, 'DB Error');
  }

  if (result) {
    return sendError(res, undefined, 409, 'User already exists');
  }

  try {
    await user.create(login, password)
  } catch (error) {
    return sendError(res, err, 500, 'DB Error');
  }

  res.send({ status: 'ok' });
});

app.post('/user/login', async (req, res) => {
  const { login, password } = req.body;

  let result;

  if (!login) {
    return sendError(res, undefined, 400, 'No login in request');
  }

  if (!password) {
    return sendError(res, undefined, 400, 'No password in request');
  }

  try {
    result = await user.getOne({ login });
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  if (!result) {
    return sendError(res, undefined, 404, 'User not found');
  }

  if (result.password !== password) {
    return sendError(res, undefined, 400, 'Passwords did not match');
  }

  const token = uuidv4();

  try {
    await user.update({ token }, { id: result.id });
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  res.send({ status: 'ok', token: token });
});

app.post('/chat/create', async (req, res) => {
  const { token } = req.body;

  console.log(token);
  if (!token) {
    return sendError(res, undefined, 401, 'Token required');
  }

  let result;

  try {
    result = await user.exists({ token });
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  if (!result) {
    return sendError(res, undefined, 401, 'Invalid token');
  }

  let chatToken;
  let chatResult;
  do {
    chatToken = nanoid(6);

    try {
      chatResult = await chat.exists({ token: chatToken });
    } catch (error) {
      return sendError(res, error, 500, 'DB Error');
    }
  } while (chatResult);

  try {
    await chat.create(chatToken);
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  res.send({ status: 'ok', token: chatToken });
});

app.post('/chat/:chatToken/join/', async (req, res) => {
  const { token } = req.body;
  const { chatToken } = req.params;

  if (!token) {
    return sendError(res, undefined, 401, 'Unautorized');
  }

  try {
    result = await user.getOne({ token });
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  if (!result) {
    return sendError(res, undefined, 401, 'Invalid token');
  }

  let chatResult;

  try {
    chatResult = await chat.exists({ token: chatToken });
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  if (!chatResult) {
    res.status(404);
    res.send({ status: 'error', message: 'Chat Not Found' });

    return;
  }

  let chatUsersResult;

  try {
    chatUsersResult = await chat.chatUsers(chatToken, user.table);
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  if (chatUsersResult.some(chatRow => chatRow.user_id === result.id)) {
    return sendError(res, undefined, 409, 'User already in chat');
  }

  try {
    await chat.joinChat(chatToken, result.id);
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  res.send({ status: 'ok' });
});

app.post('/chat/:chatToken/messages', async (req, res) => {
  const { token } = req.body;
  const { chatToken } = req.params;

  if (!token) {
    return sendError(res, undefined, 401, 'Unautorized');
  }

  try {
    result = await user.getOne({ token });
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  if (!result) {
    return sendError(res, undefined, 401, 'Invalid token');
  }

  let chatResult;

  try {
    chatResult = await chat.getOne({ token: chatToken });
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  if (!chatResult) {
    res.status(404);
    res.send({ status: 'error', message: 'Chat Not Found' });

    return;
  }

  let chatUsersResult;

  try {
    chatUsersResult = await chat.chatUsers(chatToken, user.table);
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  if (!chatUsersResult.some(chatRow => chatRow.user_id === result.id)) {
    return sendError(res, undefined, 400, 'User is not in chat');
  }

  let messagesResult;
  try {
    messagesResult = await messages.getMessagesFromUsers(chatResult.id);
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  res.send({ status: 'ok', messages: messagesResult });
});

app.post('/chat/:chatToken/messages/send', async (req, res) => {
  const { token, message } = req.body;
  const { chatToken } = req.params;

  if (!token) {
    return sendError(res, undefined, 401, 'Unautorized');
  }

  if (!message) {
    return sendError(res, undefined, 400, 'No message');
  }

  try {
    result = await user.getOne({ token });
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  if (!result) {
    return sendError(res, undefined, 401, 'Invalid token');
  }

  let chatResult;

  try {
    chatResult = await chat.getOne({ token: chatToken });
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  if (!chatResult) {
    res.status(404);
    res.send({ status: 'error', message: 'Chat Not Found' });

    return;
  }

  let chatUsersResult;

  try {
    chatUsersResult = await chat.chatUsers(chatToken, user.table);
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  if (!chatUsersResult.some(chatRow => chatRow.user_id === result.id)) {
    return sendError(res, undefined, 400, 'User is not in chat');
  }

  try {
    messages.create(result.id, chatResult.id, message);
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  let messagesResult;
  try {
    messagesResult = await messages.getMessagesFromUsers(chatResult.id);
  } catch (error) {
    return sendError(res, error, 500, 'DB Error');
  }

  res.send({ status: 'ok', messages: messagesResult });
});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
