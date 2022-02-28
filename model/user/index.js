const Model = require('../base');

class User extends Model {
  /**
   *
   * @param {string} login Логин пользователя
   * @param {string} password Пароль пользователя
   */
  async create(login, password) {
    await this.dbquery(`INSERT INTO \`users\` VALUES(NULL, '${login}', '${password}', NULL)`);
  }
}

module.exports = User;
