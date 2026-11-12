import { OBJECT_STATUS } from '../utils/constants';

const mockObjects = [
  {
    id: 'OBJ-7K2M9QXA',
    name: 'Garrafa térmica azul',
    category: 'acessorios',
    description: 'Garrafa térmica de aço inoxidável, cor azul-marinho, com tampa preta e um adesivo de planeta na lateral.',
    location: 'Biblioteca, mesa próxima às janelas',
    foundDate: '2026-11-03',
    notes: '',
    status: OBJECT_STATUS.approved,
    createdAt: '2026-11-03T14:20:00.000Z',
    updatedAt: '2026-11-03T16:05:00.000Z',
  },
  {
    id: 'OBJ-3HV8TN4D',
    name: 'Carregador de notebook',
    category: 'eletronicos',
    description: 'Carregador de notebook com cabo preto e fonte retangular. O cabo tem uma fita adesiva vermelha próxima ao conector.',
    location: 'Laboratório de informática, bancada do fundo',
    foundDate: '2026-11-05',
    notes: 'Entregue por um funcionário da limpeza ao final do turno.',
    status: OBJECT_STATUS.approved,
    createdAt: '2026-11-05T19:42:00.000Z',
    updatedAt: '2026-11-06T11:10:00.000Z',
  },
  {
    id: 'OBJ-Q9WZ6R1E',
    name: 'Caderno universitário',
    category: 'materiais-escolares',
    description: 'Caderno universitário de capa dura cinza, com anotações de cálculo e divisórias coloridas.',
    location: 'Auditório, segunda fileira',
    foundDate: '2026-11-07',
    notes: '',
    status: OBJECT_STATUS.approved,
    createdAt: '2026-11-07T12:15:00.000Z',
    updatedAt: '2026-11-07T15:30:00.000Z',
  },
  {
    id: 'OBJ-B5PJ0YKC',
    name: 'Jaqueta jeans',
    category: 'vestuario',
    description: 'Jaqueta jeans de lavagem clara, tamanho médio, com botões metálicos e um bolso interno com zíper.',
    location: 'Cantina, encosto de cadeira próxima ao caixa',
    foundDate: '2026-11-09',
    notes: '',
    status: OBJECT_STATUS.approved,
    createdAt: '2026-11-09T17:05:00.000Z',
    updatedAt: '2026-11-10T09:45:00.000Z',
  },
];

export default mockObjects;
