import { validateObjectForm, normalizeObjectForm } from './objectValidation';

const TODAY = '2026-11-12';

const validForm = {
  name: 'Garrafa térmica',
  category: 'acessorios',
  description: 'Garrafa térmica azul com tampa preta.',
  location: 'Biblioteca',
  foundDate: '2026-11-10',
  notes: '',
};

describe('validateObjectForm', () => {
  it('aceita um formulário válido', () => {
    expect(validateObjectForm(validForm, TODAY)).toEqual({});
  });

  it('exige os campos obrigatórios', () => {
    const errors = validateObjectForm({}, TODAY);

    expect(errors).toEqual({
      name: 'Informe o nome do objeto.',
      category: 'Selecione uma categoria.',
      description: 'Descreva o objeto encontrado.',
      location: 'Informe o local onde o objeto foi encontrado.',
      foundDate: 'Informe a data em que o objeto foi encontrado.',
    });
  });

  it('considera vazios os campos preenchidos apenas com espaços', () => {
    const errors = validateObjectForm({ ...validForm, name: '    ', location: '\t' }, TODAY);

    expect(errors.name).toBe('Informe o nome do objeto.');
    expect(errors.location).toBe('Informe o local onde o objeto foi encontrado.');
  });

  it('impede datas futuras', () => {
    const errors = validateObjectForm({ ...validForm, foundDate: '2026-11-13' }, TODAY);

    expect(errors.foundDate).toBe('A data não pode ser posterior a hoje (12/11/2026).');
  });

  it('aceita a data de hoje', () => {
    expect(validateObjectForm({ ...validForm, foundDate: TODAY }, TODAY)).toEqual({});
  });

  it('rejeita datas inexistentes', () => {
    const errors = validateObjectForm({ ...validForm, foundDate: '2026-02-30' }, TODAY);

    expect(errors.foundDate).toBe('Informe uma data válida.');
  });

  it('rejeita categorias desconhecidas', () => {
    const errors = validateObjectForm({ ...validForm, category: 'veiculos' }, TODAY);

    expect(errors.category).toBe('Selecione uma categoria válida.');
  });

  it('limita o tamanho dos textos', () => {
    const errors = validateObjectForm(
      {
        ...validForm,
        name: 'a'.repeat(81),
        description: 'a'.repeat(501),
        location: 'a'.repeat(121),
        notes: 'a'.repeat(301),
      },
      TODAY
    );

    expect(errors).toEqual({
      name: 'O nome deve ter no máximo 80 caracteres.',
      description: 'A descrição deve ter no máximo 500 caracteres.',
      location: 'O local deve ter no máximo 120 caracteres.',
      notes: 'As observações devem ter no máximo 300 caracteres.',
    });
  });

  it('exige um tamanho mínimo para nome, descrição e local', () => {
    const errors = validateObjectForm({ ...validForm, name: 'ab', description: 'curta', location: 'ab' }, TODAY);

    expect(errors).toEqual({
      name: 'O nome deve ter pelo menos 3 caracteres.',
      description: 'A descrição deve ter pelo menos 10 caracteres.',
      location: 'O local deve ter pelo menos 3 caracteres.',
    });
  });
});

describe('normalizeObjectForm', () => {
  it('remove espaços excedentes e preserva quebras de linha da descrição', () => {
    const normalized = normalizeObjectForm({
      ...validForm,
      name: '  Garrafa   térmica ',
      description: '  Cor azul  \r\n\r\n\r\n  Tampa preta ',
    });

    expect(normalized.name).toBe('Garrafa térmica');
    expect(normalized.description).toBe('Cor azul\n\nTampa preta');
  });
});
