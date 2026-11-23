// Apaga todos os registros de imoveis e remove índices da coluna endereco (se existirem).
// Use para recomeçar os testes de performance do zero: npm run db:reset
require('dotenv').config();
const { pool, inicializarBanco } = require('../src/db');

(async () => {
  await inicializarBanco();
  await pool.query('TRUNCATE TABLE imoveis');

  const [indices] = await pool.query("SHOW INDEX FROM imoveis WHERE Column_name = 'endereco'");
  for (const nome of new Set(indices.map((i) => i.Key_name))) {
    await pool.query(`DROP INDEX \`${nome}\` ON imoveis`);
    console.log(`Índice removido: ${nome}`);
  }

  console.log('Tabela imoveis zerada.');
  await pool.end();
})().catch(async (err) => {
  console.error(err.message);
  await pool.end();
  process.exit(1);
});
