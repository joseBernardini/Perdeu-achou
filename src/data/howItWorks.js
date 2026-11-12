import { ClipboardList, HandHelping, MapPin, Search, ShieldCheck } from 'lucide-react';

const howItWorks = [
  {
    id: 'encontrado',
    title: 'Um objeto é encontrado',
    description: 'Quem encontra o objeto o entrega a um funcionário responsável da instituição.',
    icon: MapPin,
  },
  {
    id: 'registrado',
    title: 'O objeto é registrado',
    description: 'O funcionário registra o item com categoria, descrição, local e data em que foi encontrado.',
    icon: ClipboardList,
  },
  {
    id: 'consulta',
    title: 'Os interessados consultam',
    description: 'Quem perdeu algo consulta os registros e verifica se o objeto já foi entregue.',
    icon: Search,
  },
  {
    id: 'solicitacao',
    title: 'O proprietário solicita',
    description: 'Ao reconhecer o objeto, o proprietário solicita a recuperação informando detalhes que comprovem a posse.',
    icon: HandHelping,
  },
  {
    id: 'devolucao',
    title: 'A instituição valida e devolve',
    description: 'A equipe confere as informações da solicitação e organiza a devolução ao proprietário.',
    icon: ShieldCheck,
  },
];

export default howItWorks;
