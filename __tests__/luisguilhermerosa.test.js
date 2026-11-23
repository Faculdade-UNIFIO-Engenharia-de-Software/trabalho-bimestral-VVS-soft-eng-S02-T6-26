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

describe('Testes do Integrante 4', () => {

  // CT04
  test('CT04 - Deve retornar 404 para rota PATCH inexistente', async () => {
    const repo = criarRepoMock();
    const app = criarApp(repo);

    const res = await request(app)
      .patch('/imoveis/1')
      .send({
        endereco: 'Rua das Flores, 120',
        inscricao: '012345678901',
        finalidadeId: 1
      });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      erro: 'Rota não encontrada'
    });
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  // CT08
  test('CT08 - Deve retornar 500 quando ocorrer erro no banco', async () => {
    const repo = criarRepoMock();
    const app = criarApp(repo);

    repo.finalidadeExiste.mockResolvedValue(true);
    repo.buscarPorInscricao.mockResolvedValue(null);
    repo.inserir.mockRejectedValue({
      code: 'ER_LOCK_WAIT_TIMEOUT'
    });

    const res = await request(app)
      .post('/imoveis')
      .send({
        endereco: 'Rua das Flores, 120',
        inscricao: '01.234.567.890-1',
        finalidadeId: 1
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      erro: 'Erro interno'
    });
  });

  // CT12
  test('CT12 - Deve cadastrar imóvel com dados normalizados', async () => {
    const repo = criarRepoMock();
    const app = criarApp(repo);

    repo.finalidadeExiste.mockResolvedValue(true);
    repo.buscarPorInscricao.mockResolvedValue(null);
    repo.inserir.mockResolvedValue(15);

    const res = await request(app)
      .post('/imoveis')
      .send({
        endereco: '  Rua das Flores, 120  ',
        inscricao: '01.234.567.890-1',
        finalidadeId: 1
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 15,
      endereco: 'Rua das Flores, 120',
      inscricao: '012345678901',
      finalidadeId: 1
    });

    expect(repo.inserir).toHaveBeenCalledWith({
      endereco: 'Rua das Flores, 120',
      inscricao: '012345678901',
      finalidadeId: 1
    });
  });

  // CT16
  test('CT16 - Deve validar dados quando nenhum argumento for informado', () => {
    let erro;

    try {
      validarDados();
    } catch (e) {
      erro = e;
    }

    expect(erro).toBeDefined();
    expect(erro.message).toMatch(/endereco/);
    expect(erro.message).toMatch(/inscricao/);
    expect(erro.message).toMatch(/finalidadeId/);
    expect(erro).not.toBeInstanceOf(TypeError);
  });

  // CT20
  test('CT20 - Deve rejeitar limite maior que 85', async () => {
    const repo = criarRepoMock();
    const app = criarApp(repo);

    const res = await request(app)
      .get('/imoveis?endereco=Ab&limite=86');

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/limite/i);
    expect(repo.buscarPorEndereco).not.toHaveBeenCalled();
  });

});