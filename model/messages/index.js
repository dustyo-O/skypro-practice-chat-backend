const Model = require('../base');

class Messages extends Model {
  /**
   *
   * @param {string} table основная таблица сообщений
   * @param {sting} usersTable таблица пользователей
   */
   constructor(table, usersTable) {
    super(table);

    this.usersTable = usersTable;
  }
  /**
   *
   * @param {number} user_id Id пользователя
   * @param {number} chat_id Id чата
   * @params {string} message сообщение
   *
   * @returns Promise[object]
   */
  async create(user_id, chat_id, message) {
    await this.dbquery(`INSERT INTO \`messages\` VALUES(NULL, '${user_id}', '${chat_id}','${message}', CURRENT_TIMESTAMP)`);
  }

  /**
   *
   * @param {number} chat_id Id чата
   *
   * @returns Promise[object]
   */
  async getMessagesFromUsers(chat_id) {
    const query = `
SELECT
  \`${this.table}\`.\`id\`,
  \`${this.usersTable}\`.\`login\`,
  \`${this.table}\`.\`message\`,
  \`${this.table}\`.\`timestamp\`
FROM
  \`${this.table}\`
LEFT JOIN
	\`${this.usersTable}\`
ON
	\`${this.table}\`.\`user_id\` = \`${this.usersTable}\`.\`id\`
WHERE
  \`${this.table}\`.\`chat_id\` = '${chat_id}'
ORDER BY
    \`${this.table}\`.\`timestamp\` DESC
`;

    console.log(query);

    return await this.dbquery(query);
  }
}

module.exports = Messages;
