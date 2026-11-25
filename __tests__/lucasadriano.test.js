const request = require('supertest');
const { criarApp } = require('../src/app');
const { validarDados } = require('../src/regras');

function criarRepoMock() {
  return {
    listarFinalidades: jest.fn(),
    finalidadeExiste: jest.fn(),
    buscarPorEndereco: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorInscricao: jest.fn(),
    inserir: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn(),
  };
}

test('CT01 deve rejeitar modo de busca inválido', async () => {

  // ARRANGE
  const repo = criarRepoMock();
  const app = criarApp(repo);

  // ACT
  const res = await request(app)
    .get('/imoveis')
    .query({
      endereco: 'Ab',
      modo: 'exato'
    });

  // ASSERT
  expect(res.status).toBe(400);

  expect(res.body.erro).toBe(
    'Modo de busca inválido. Use: prefixo ou contem'
  );

  expect(repo.buscarPorEndereco).not.toHaveBeenCalled();

});

test('CT05 deve rejeitar endereço abaixo do mínimo', async () => {

  // ARRANGE
  const repo = criarRepoMock();
  const app = criarApp(repo);

  const corpo = {
    endereco: 'AAAAAAA',
    inscricao: '01.234.567.890-1',
    finalidadeId: 1
  };

  // ACT
  const res = await request(app)
    .post('/imoveis')
    .send(corpo);

  // ASSERT
  expect(res.status).toBe(400);

  expect(res.body.erro).toContain('endereco');

  expect(repo.finalidadeExiste).not.toHaveBeenCalled();

  expect(repo.buscarPorInscricao).not.toHaveBeenCalled();

  expect(repo.inserir).not.toHaveBeenCalled();

});

test('CT09 deve rejeitar ID inválido no PUT', async () => {

  // ARRANGE
  const repo = criarRepoMock();
  const app = criarApp(repo);

  const corpo = {
    endereco: 'Rua das Flores, 120',
    inscricao: '01.234.567.890-1',
    finalidadeId: 1
  };

  // ACT
  const res = await request(app)
    .put('/imoveis/abc')
    .send(corpo);

  // ASSERT
  expect(res.status).toBe(400);

  expect(res.body).toEqual({
    erro: 'ID inválido'
  });

  expect(repo.buscarPorId).not.toHaveBeenCalled();

  expect(repo.atualizar).not.toHaveBeenCalled();

});

test('CT13 deve rejeitar endereço com tamanho insuficiente após trim', () => {

  // ARRANGE
  const dados = {
    endereco: ' AAAAAAA ',
    inscricao: '01.234.567.890-1',
    finalidadeId: 1
  };

  // ACT e ASSERT
  expect(() => validarDados(dados))
    .toThrow('Campo endereco');

});

test('CT17 deve retornar 500 quando falhar ao listar finalidades', async () => {

  // ARRANGE
  const repo = criarRepoMock();

  repo.listarFinalidades.mockRejectedValue(
    new Error('banco fora do ar')
  );

  const app = criarApp(repo);

  // ACT
  const res = await request(app)
    .get('/finalidades');

  // ASSERT
  expect(res.status).toBe(500);

  expect(res.body).toEqual({
    erro: 'Erro interno'
  });

  expect(res.body.erro).not.toContain('banco fora do ar');

  expect(repo.listarFinalidades).toHaveBeenCalledTimes(1);

});
