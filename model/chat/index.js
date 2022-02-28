const Model = require('../base');

class Chat extends Model {
  /**
   *
   * @param {string} table основная таблица чатов
   * @param {sting} usersConnectionTable таблица связей с users
   */
  constructor(table, usersConnectionTable) {
    super(table);

    this.connectionTable = usersConnectionTable;
  }
  /**
   *
   * @param {string} token Токен-идентификатор чата
   */
  async create(token) {
    return await this.dbquery(`INSERT INTO \`${this.table}\` VALUES(NULL, '${token}');`);
  }

  async chatUsers(token, usersTable) {
    const query = `
SELECT
  *
FROM
  \`${usersTable}\`
LEFT JOIN
	\`${this.connectionTable}\`
ON
	\`${usersTable}\`.\`id\` = \`${this.connectionTable}\`.\`user_id\`
LEFT JOIN
	\`${this.table}\`
ON
	\`${this.connectionTable}\`.\`chat_id\` = \`${this.table}\`.\`id\`
WHERE
  \`${this.table}\`.\`token\` = '${token}'
`;

    return await this.dbquery(query);
  }

  /**
   *
   * @param {string} token токен чата
   * @param {number} user_id ID пользователя
   */
  async joinChat(token, user_id) {
    const chat = await this.getOne({ token });

    if (!chat) throw Error('Chat does not exists');

    return await this.dbquery(`
INSERT INTO
  \`${this.connectionTable}\`
VALUES(NULL, '${user_id}', '${chat.id}')
`);
  }
}

module.exports = Chat;
