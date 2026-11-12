import { BookOpen, FileText, Package, Shirt, Smartphone, Watch } from 'lucide-react';

const categories = [
  {
    id: 'eletronicos',
    title: 'Eletrônicos',
    description: 'Celulares, fones de ouvido, carregadores, calculadoras e notebooks.',
    icon: Smartphone,
  },
  {
    id: 'documentos',
    title: 'Documentos',
    description: 'Documentos pessoais, carteirinhas estudantis, cartões e crachás.',
    icon: FileText,
  },
  {
    id: 'materiais-escolares',
    title: 'Materiais escolares',
    description: 'Cadernos, livros, estojos, apostilas e materiais de laboratório.',
    icon: BookOpen,
  },
  {
    id: 'acessorios',
    title: 'Acessórios',
    description: 'Óculos, relógios, chaves, garrafas, guarda-chuvas e bolsas.',
    icon: Watch,
  },
  {
    id: 'vestuario',
    title: 'Vestuário',
    description: 'Blusas, jaquetas, uniformes, bonés e calçados.',
    icon: Shirt,
  },
  {
    id: 'outros',
    title: 'Outros',
    description: 'Objetos que não se encaixam nas categorias anteriores.',
    icon: Package,
  },
];

export default categories;
