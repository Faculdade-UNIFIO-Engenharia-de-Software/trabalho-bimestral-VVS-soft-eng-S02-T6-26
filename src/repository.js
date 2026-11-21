// Camada de acesso a dados: só SQL, sem regra de negócio.
// Nos testes unitários esta camada deve ser substituída por um mock.

const SELECT_BASE = `
  SELECT t.id, t.endereco AS endereco, t.inscricao AS inscricao, t.finalidade_id AS finalidadeId, a.nome AS finalidade, t.criado_em AS criadoEm
  FROM imoveis t
  JOIN finalidades a ON a.id = t.finalidade_id`;

function criarRepository(pool) {
  return {
    async listarFinalidades() {
      const [rows] = await pool.query('SELECT id, nome FROM finalidades ORDER BY id');
      return rows;
    },

    async finalidadeExiste(id) {
      const [rows] = await pool.query('SELECT 1 FROM finalidades WHERE id = ?', [id]);
      return rows.length > 0;
    },

    // padrao: string usada no LIKE (ex.: "Ab%" ou "%Ab%")
    async buscarPorEndereco(padrao, limite) {
      const [rows] = await pool.query(
        `${SELECT_BASE} WHERE t.endereco LIKE ? ORDER BY t.endereco LIMIT ?`,
        [padrao, limite]
      );
      return rows;
    },

    async buscarPorId(id) {
      const [rows] = await pool.query(`${SELECT_BASE} WHERE t.id = ?`, [id]);
      return rows[0] || null;
    },

    async buscarPorInscricao(inscricao) {
      const [rows] = await pool.query('SELECT id, inscricao AS inscricao FROM imoveis WHERE inscricao = ?', [inscricao]);
      return rows[0] || null;
    },

    async inserir({ endereco, inscricao, finalidadeId }) {
      const [res] = await pool.query(
        'INSERT INTO imoveis (endereco, inscricao, finalidade_id) VALUES (?, ?, ?)',
        [endereco, inscricao, finalidadeId]
      );
      return res.insertId;
    },

    async atualizar(id, { endereco, inscricao, finalidadeId }) {
      const [res] = await pool.query(
        'UPDATE imoveis SET endereco = ?, inscricao = ?, finalidade_id = ? WHERE id = ?',
        [endereco, inscricao, finalidadeId, id]
      );
      return res.affectedRows > 0;
    },

    async excluir(id) {
      const [res] = await pool.query('DELETE FROM imoveis WHERE id = ?', [id]);
      return res.affectedRows > 0;
    },
  };
}

module.exports = { criarRepository };
