const mysql = require('mysql');
const util = require('util');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.MYSQL_PASSWORD,
  database: 'chat',
});

connection.connect();

class Model {
  /**
   *
   * @param {string} table имя таблицы
   */
  constructor(table) {
    this.table = table;
    this.dbquery = util.promisify(connection.query).bind(connection);
  }

  /**
   *
   * @param {Object} params Объект ключ-значение для секции WHERE
   * @param {number} limit? Ограничение по количеству
   *
   * @returns Promise<Array> Строки из таблицы
   */
  async get(params, limit) {
    const whereSection = Model.templateColumnsWithValues(params);

    const limitSection = limit ? ` LIMIT ${limit}` : ''

    return this.dbquery(`SELECT * FROM \`${this.table}\` WHERE ${whereSection}${limitSection}`);
  }

  /**
   *
   * @param {Object} params Объект ключ-значение для секции WHERE
   *
   * @returns Promise[Object|undefined] Запись из таблицы, где ключи - имена колонок
   */
  async getOne(params) {
    return (await this.get(params, 1))[0];
  }

  /**
   *
   * @param {Object} setParams Объект ключ-значение для секции SET
   * @param {Object} whereParams Объект ключ-значение для секции WHERE
   * @param {number} limit? Ограничение по количеству
   *
   * @returns number id создаваемой строки
   */
  async update(setParams, whereParams, limit) {
    const setSection = Model.templateColumnsWithValues(setParams);
    const whereSection = Model.templateColumnsWithValues(whereParams);

    const limitSection = limit ? ` LIMIT ${limit}` : ''

    return this.dbquery(`UPDATE \`${this.table}\` SET ${setSection} WHERE ${whereSection}${limitSection}`);
  }

  /**
   *
   * @param {Object} params Параметры для секции WHERE
   *
   * @returns boolean Существует ли хотя бы одна такая запись
   */
   async exists(params) {
    const whereSection = Model.templateColumnsWithValues(params);

    const result = await this.dbquery(`SELECT COUNT(*) AS \`cnt\` FROM \`${this.table}\` WHERE ${whereSection}`);

    return result[0].cnt > 0;
  }
}

/**
 * @param {Object} params Объект ключ-значение
 *
 * @returns {string} Строка вида "`ключ` = 'значение' AND ..."
 */
Model.templateColumnsWithValues = function(params) {
  return Object.keys(params)
    .reduce((section, key) => {
      if (section !== '') section += ' AND ';

      section += `\`${key}\`='${params[key]}'`;

      return section;
    }, '');
}

module.exports = Model;
