const request = require('supertest');
const { criarApp } = require('../src/app');
const { validarId, montarPadrao } = require('../src/regras');

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

describe('Cenários individuais - Grupo 10', () => {

  // CT03: converter o limite da URL para número
  test('CT03 deve converter o limite da busca para número', async () => {
    const repo = criarRepoMock();
    repo.buscarPorEndereco.mockResolvedValue([]);

    const app = criarApp(repo);

    const res = await request(app)
      .get('/imoveis')
      .query({ endereco: 'Ab', limite: '5' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total: 0,
      resultados: [],
    });
    expect(repo.buscarPorEndereco).toHaveBeenCalledTimes(1);
    expect(repo.buscarPorEndereco).toHaveBeenCalledWith('Ab%', 5);
  });

  // CT07: rejeitar ID vazio ou nulo
  test('CT07 deve rejeitar ID vazio e nulo', () => {
    expect(() => validarId('')).toThrow('ID inválido');
    expect(() => validarId(null)).toThrow('ID inválido');
  });

  // CT11: aceitar número como termo de busca
  test('CT11 deve montar o padrão quando o termo é um número', () => {
    const resultado = montarPadrao(123, 'contem');

    expect(resultado).toBe('%123%');
  });

  // CT15: não expor detalhes técnicos quando a exclusão falha
  test('CT15 deve responder 500 quando ocorre erro na exclusão', async () => {
    const repo = criarRepoMock();

    repo.excluir.mockRejectedValue(
      new Error('timeout na conexão')
    );

    const app = criarApp(repo);

    const res = await request(app).delete('/imoveis/4');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      erro: 'Erro interno',
    });
    expect(res.body.erro).not.toContain('timeout');
    expect(repo.excluir).toHaveBeenCalledTimes(1);
    expect(repo.excluir).toHaveBeenCalledWith(4);
  });

  // CT19: limpar e normalizar os dados antes de gravar
  test('CT19 deve cadastrar o imóvel com os dados limpos', async () => {
    const repo = criarRepoMock();

    repo.finalidadeExiste.mockResolvedValue(true);
    repo.buscarPorInscricao.mockResolvedValue(null);
    repo.inserir.mockResolvedValue(15);

    const app = criarApp(repo);

    const res = await request(app)
      .post('/imoveis')
      .send({
        endereco: ' Rua das Flores, 120 ',
        inscricao: '01.234.567.890-1',
        finalidadeId: 1,
      });

    const dadosEsperados = {
      endereco: 'Rua das Flores, 120',
      inscricao: '012345678901',
      finalidadeId: 1,
    };

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 15,
      ...dadosEsperados,
    });

    expect(repo.inserir).toHaveBeenCalledTimes(1);
    expect(repo.inserir).toHaveBeenCalledWith(dadosEsperados);
  });

});