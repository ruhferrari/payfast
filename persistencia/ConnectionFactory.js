var mysql  = require('mysql');

  function createDBConnection(){
    return mysql.createConnection({
      host: '127.0.0.1',
      port: '3306',
      user: 'root',
      password: '',
      database: 'payfast'
    });
  }

  module.exports = function() {
    return createDBConnection;
  }