require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'aluno_unifio',
  password: process.env.DB_PASSWORD || 'abc123',
  database: process.env.DB_NAME || 'bd_imoveis',
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  waitForConnections: true,
});

// Cria as tabelas (se não existirem) e os registros da tabela de apoio.
// Observação: a coluna "endereco" NÃO tem índice de propósito (faz parte do trabalho).
async function inicializarBanco() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finalidades (
      id   INT PRIMARY KEY,
      nome VARCHAR(60) NOT NULL
    )`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS imoveis (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      endereco  VARCHAR(150) NOT NULL,
      inscricao  VARCHAR(12) NOT NULL UNIQUE,
      finalidade_id  INT NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_imoveis_finalidades FOREIGN KEY (finalidade_id) REFERENCES finalidades(id)
    )`);

  await pool.query(`INSERT IGNORE INTO finalidades (id, nome) VALUES (1, 'Residencial'), (2, 'Comercial')`);
}

module.exports = { pool, inicializarBanco };
