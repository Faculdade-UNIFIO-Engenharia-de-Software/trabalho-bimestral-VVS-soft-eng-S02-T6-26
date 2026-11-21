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

describe('Cenários CT02, CT06, CT10, CT14 e CT18 — API de Imóveis', () => {
  test('CT18 deve lançar erro citando inscricao quando o formato for inválido', () => {

    const dados = {
      endereco: 'Rua das Flores, 120',
      inscricao: '0123-45',
      finalidadeId: 1,
    };

    expect(() => validarDados(dados)).toThrow('Campo inscricao inválido');
  });

  test('CT02 deve responder 409 e não inserir quando a inscrição já existir', async () => {

    const repo = criarRepoMock();
    repo.finalidadeExiste.mockResolvedValue(true);
    repo.buscarPorInscricao.mockResolvedValue({
      id: 1,
      endereco: 'Rua Antiga, 50',
      inscricao: '012345678901',
      finalidadeId: 1,
    });
    const app = criarApp(repo);

    const res = await request(app).post('/imoveis').send({
      endereco: 'Rua das Flores, 120',
      inscricao: '01.234.567.890-1',
      finalidadeId: 1,
    });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ erro: 'Inscrição municipal já existe no cadastro' });
    expect(repo.buscarPorInscricao).toHaveBeenCalledWith('012345678901');
    expect(repo.inserir).not.toHaveBeenCalled();
  });

  test('CT06 deve responder 409 e não atualizar quando a inscrição pertencer a outro registro', async () => {
 
    const repo = criarRepoMock();
    repo.buscarPorId.mockResolvedValue({
      id: 1,
      endereco: 'Rua Um, 10',
      inscricao: '111111111111',
      finalidadeId: 1,
    });
    repo.finalidadeExiste.mockResolvedValue(true);
    repo.buscarPorInscricao.mockResolvedValue({
      id: 2,
      endereco: 'Rua Dois, 20',
      inscricao: '012345678901',
      finalidadeId: 1,
    });
    const app = criarApp(repo);

    const res = await request(app).put('/imoveis/1').send({
      endereco: 'Rua Um, 10',
      inscricao: '01.234.567.890-1',
      finalidadeId: 1,
    });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ erro: 'Inscrição municipal já existe no cadastro' });
    expect(repo.buscarPorInscricao).toHaveBeenCalledWith('012345678901');
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  test('CT10 deve responder 404 com Imóvel não encontrado quando id não existir', async () => {

    const repo = criarRepoMock();
    repo.buscarPorId.mockResolvedValue(null);
    const app = criarApp(repo);

    const res = await request(app).get('/imoveis/999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ erro: 'Imóvel não encontrado' });
    expect(repo.buscarPorId).toHaveBeenCalledWith(999);
  });

  test('CT14 deve responder 404 quando tentar excluir registro inexistente', async () => {

    const repo = criarRepoMock();
    repo.excluir.mockResolvedValue(false);
    const app = criarApp(repo);

    const res = await request(app).delete('/imoveis/999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ erro: 'Imóvel não encontrado' });
    expect(repo.excluir).toHaveBeenCalledWith(999);
  });
});