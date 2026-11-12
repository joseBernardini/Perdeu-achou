export const APP_NAME = 'Perdeu, achou!';

export const APP_SUBTITLE = 'Sistema de Achados e Perdidos';

export const ROUTER_FUTURE_FLAGS = { v7_startTransition: true, v7_relativeSplatPath: true };

export const ROUTES = {
  home: '/',
  objects: '/objetos',
  registerObject: '/objetos/registrar',
  objectDetails: '/objetos/:objectId',
  recoveryRequest: '/objetos/:objectId/solicitar',
  login: '/entrar',
  signUp: '/cadastro',
  passwordReset: '/recuperar-senha',
  userArea: '/minha-area',
  admin: '/painel',
  adminObjects: '/painel/objetos',
  adminObjectDetails: '/painel/objetos/:objectId',
  adminRequests: '/painel/solicitacoes',
  adminRequestDetails: '/painel/solicitacoes/:requestId',
  adminHistory: '/painel/historico',
  adminRoles: '/painel/perfis',
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

export const REQUEST_ID_PREFIX = 'SOL-';

export const USER_ID_PREFIX = 'USR-';

export const REQUEST_STATUS = {
  pending: 'pendente',
  approved: 'aprovada',
  rejected: 'rejeitada',
  completed: 'concluida',
};

export const REQUEST_STATUS_LABELS = {
  [REQUEST_STATUS.pending]: 'Pendente',
  [REQUEST_STATUS.approved]: 'Aprovada',
  [REQUEST_STATUS.rejected]: 'Rejeitada',
  [REQUEST_STATUS.completed]: 'Concluída',
};

export const REQUEST_STATUS_DESCRIPTIONS = {
  [REQUEST_STATUS.pending]: 'Aguardando a análise de um funcionário responsável.',
  [REQUEST_STATUS.approved]:
    'A propriedade foi confirmada. Procure o setor responsável para combinar a retirada do objeto.',
  [REQUEST_STATUS.rejected]:
    'As informações enviadas não foram suficientes para confirmar a propriedade do objeto.',
  [REQUEST_STATUS.completed]: 'O objeto foi devolvido e a solicitação foi encerrada.',
};

export const REQUEST_STATUS_TRANSITIONS = {
  [REQUEST_STATUS.pending]: [REQUEST_STATUS.approved, REQUEST_STATUS.rejected],
  [REQUEST_STATUS.approved]: [REQUEST_STATUS.completed, REQUEST_STATUS.rejected],
  [REQUEST_STATUS.rejected]: [],
  [REQUEST_STATUS.completed]: [],
};

export const REQUEST_FIELD_LIMITS = {
  message: { min: 30, max: 1000 },
  additionalInfo: { max: 500 },
};

export const USER_ROLES = {
  member: 'usuario',
  staff: 'funcionario',
  admin: 'administrador',
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.member]: 'Usuário comum',
  [USER_ROLES.staff]: 'Funcionário',
  [USER_ROLES.admin]: 'Administrador',
};

export const STAFF_ROLES = [USER_ROLES.staff, USER_ROLES.admin];

export const OBJECT_REOPEN_TRANSITIONS = {
  [OBJECT_STATUS.returned]: OBJECT_STATUS.available,
  [OBJECT_STATUS.rejected]: OBJECT_STATUS.pendingApproval,
};

export const EVENT_ID_PREFIX = 'EVT-';

export const ADMIN_EVENT_TYPES = {
  objectApproved: 'objeto_aprovado',
  objectRejected: 'objeto_rejeitado',
  objectReopened: 'objeto_reaberto',
  requestApproved: 'solicitacao_aprovada',
  requestRejected: 'solicitacao_rejeitada',
  requestApprovalCanceled: 'aprovacao_cancelada',
  objectReturned: 'objeto_devolvido',
};

export const ADMIN_EVENT_LABELS = {
  [ADMIN_EVENT_TYPES.objectApproved]: 'Objeto aprovado',
  [ADMIN_EVENT_TYPES.objectRejected]: 'Objeto rejeitado',
  [ADMIN_EVENT_TYPES.objectReopened]: 'Registro reaberto',
  [ADMIN_EVENT_TYPES.requestApproved]: 'Solicitação aprovada',
  [ADMIN_EVENT_TYPES.requestRejected]: 'Solicitação rejeitada',
  [ADMIN_EVENT_TYPES.requestApprovalCanceled]: 'Aprovação cancelada',
  [ADMIN_EVENT_TYPES.objectReturned]: 'Objeto devolvido',
};

export const ADMIN_REASON_LIMITS = { min: 10, max: 300 };

export const AUTH_FIELD_LIMITS = {
  name: { min: 3, max: 80 },
  email: { max: 120 },
  password: { min: 8, max: 64 },
};

export function getObjectDetailsPath(objectId) {
  return `${ROUTES.objects}/${encodeURIComponent(objectId)}`;
}

export function getRecoveryRequestPath(objectId) {
  return `${getObjectDetailsPath(objectId)}/solicitar`;
}

export function getAdminObjectPath(objectId) {
  return `${ROUTES.adminObjects}/${encodeURIComponent(objectId)}`;
}

export function getAdminRequestPath(requestId) {
  return `${ROUTES.adminRequests}/${encodeURIComponent(requestId)}`;
}
