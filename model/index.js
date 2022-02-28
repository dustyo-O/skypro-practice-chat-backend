const Chat = require('./chat');
const User = require('./user');
const Messages = require('./messages');

module.exports = {
    chat: new Chat('chats', 'users_to_chats'),
    user: new User('users'),
    messages: new Messages('messages', 'users'),
};
