export const APP_NAME = 'Perdeu, achou!';

export const APP_SUBTITLE = 'Sistema de Achados e Perdidos';

export const ROUTER_FUTURE_FLAGS = { v7_startTransition: true, v7_relativeSplatPath: true };

export const ROUTES = {
  home: '/',
  objects: '/objetos',
  registerObject: '/objetos/registrar',
  objectDetails: '/objetos/:objectId',
};

export const SECTION_IDS = {
  presentation: 'apresentacao',
  categories: 'categorias',
  howItWorks: 'como-funciona',
  trust: 'validacao',
};

export const NAV_LINKS = [
  { id: 'inicio', label: 'Início', to: ROUTES.home, hash: '' },
  { id: SECTION_IDS.howItWorks, label: 'Como funciona', to: `${ROUTES.home}#${SECTION_IDS.howItWorks}`, hash: `#${SECTION_IDS.howItWorks}` },
  { id: SECTION_IDS.categories, label: 'Categorias', to: `${ROUTES.home}#${SECTION_IDS.categories}`, hash: `#${SECTION_IDS.categories}` },
];

export const UNAVAILABLE_MESSAGE = 'Disponível em breve';

export const OBJECT_STATUS = {
  pendingApproval: 'pendente_aprovacao',
  available: 'disponivel',
  inReturn: 'em_devolucao',
  returned: 'devolvido',
  rejected: 'reprovado',
};

export const OBJECT_STATUS_LABELS = {
  [OBJECT_STATUS.pendingApproval]: 'Pendente de aprovação',
  [OBJECT_STATUS.available]: 'Disponível',
  [OBJECT_STATUS.inReturn]: 'Em processo de devolução',
  [OBJECT_STATUS.returned]: 'Devolvido',
  [OBJECT_STATUS.rejected]: 'Reprovado',
};

export const OBJECT_STATUS_TRANSITIONS = {
  [OBJECT_STATUS.pendingApproval]: [OBJECT_STATUS.available, OBJECT_STATUS.rejected],
  [OBJECT_STATUS.available]: [OBJECT_STATUS.inReturn],
  [OBJECT_STATUS.inReturn]: [OBJECT_STATUS.returned, OBJECT_STATUS.available],
  [OBJECT_STATUS.returned]: [],
  [OBJECT_STATUS.rejected]: [],
};

export const PUBLIC_OBJECT_STATUSES = [OBJECT_STATUS.available];

export const OBJECT_FIELD_LIMITS = {
  name: { min: 3, max: 80 },
  description: { min: 10, max: 500 },
  location: { min: 3, max: 120 },
  notes: { max: 300 },
};

export const OBJECT_ID_PREFIX = 'OBJ-';

export function getObjectDetailsPath(objectId) {
  return `${ROUTES.objects}/${encodeURIComponent(objectId)}`;
}
