import {
  AccountDisabledError,
  AuthError,
  ConfigurationError,
  ConnectionError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  PermissionDeniedError,
  SessionExpiredError,
} from '../serviceErrors';

const AUTH_MESSAGES = {
  'auth/invalid-email': 'O e-mail informado não é válido.',
  'auth/weak-password': 'A senha é muito fraca. Use pelo menos 8 caracteres, combinando letras e números.',
  'auth/too-many-requests': 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.',
  'auth/operation-not-allowed': 'O login por e-mail e senha não está habilitado no Firebase Authentication.',
  'auth/missing-password': 'Informe sua senha.',
  'auth/missing-email': 'Informe seu e-mail.',
  'auth/requires-recent-login': 'Por segurança, entre novamente para concluir esta ação.',
  'auth/invalid-api-key': 'A chave da API do Firebase é inválida. Confira o valor de REACT_APP_FIREBASE_API_KEY no arquivo .env.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    'A chave da API do Firebase é inválida. Confira o valor de REACT_APP_FIREBASE_API_KEY no arquivo .env.',
  'auth/unauthorized-domain': 'Este endereço não está autorizado no Firebase Authentication. Adicione o domínio em Authentication > Configurações > Domínios autorizados.',
  'auth/internal-error': 'O serviço de autenticação apresentou uma falha. Tente novamente em alguns instantes.',
};

const CONNECTION_CODES = new Set([
  'auth/network-request-failed',
  'unavailable',
  'deadline-exceeded',
  'firestore/unavailable',
  'firestore/deadline-exceeded',
]);

const SESSION_CODES = new Set([
  'auth/user-token-expired',
  'auth/invalid-user-token',
  'auth/user-not-found',
  'unauthenticated',
  'firestore/unauthenticated',
]);

function normalizeCode(code) {
  return typeof code === 'string' ? code.replace(/^firestore\//, '') : '';
}

export function toServiceError(error, { context } = {}) {
  if (!error || typeof error !== 'object') return new Error('Ocorreu um erro inesperado. Tente novamente.');

  const rawCode = typeof error.code === 'string' ? error.code : '';
  const code = normalizeCode(rawCode);

  if (!rawCode) return error;

  if (CONNECTION_CODES.has(rawCode) || CONNECTION_CODES.has(code)) return new ConnectionError();

  if (rawCode === 'auth/email-already-in-use') return new EmailAlreadyRegisteredError();

  if (rawCode === 'auth/invalid-credential' || rawCode === 'auth/wrong-password' || (rawCode === 'auth/user-not-found' && context === 'signIn')) {
    return new InvalidCredentialsError();
  }

  if (rawCode === 'auth/user-disabled') return new AccountDisabledError();

  if (SESSION_CODES.has(rawCode) || SESSION_CODES.has(code)) return new SessionExpiredError();

  if (rawCode.startsWith('auth/')) {
    return new AuthError(AUTH_MESSAGES[rawCode] ?? 'Não foi possível concluir a autenticação. Tente novamente.', rawCode);
  }

  if (code === 'permission-denied') {
    return new PermissionDeniedError('Você não tem permissão para realizar esta operação ou acessar estes dados.');
  }

  if (code === 'failed-precondition') {
    return new Error('A operação não pôde ser concluída porque o registro mudou. Atualize a página e tente novamente.');
  }

  if (code === 'resource-exhausted') {
    return new Error('O limite de uso do banco de dados foi atingido. Tente novamente mais tarde.');
  }

  if (code === 'invalid-argument') {
    return new Error('Os dados enviados foram recusados pelo banco de dados. Confira as informações e tente novamente.');
  }

  if (code === 'not-found') {
    return new Error('O registro solicitado não foi encontrado.');
  }

  if (rawCode === 'app/invalid-api-key' || rawCode === 'app/no-options') {
    return new ConfigurationError('A configuração do Firebase é inválida. Confira os valores do arquivo .env.');
  }

  return new Error('Ocorreu um erro inesperado ao acessar o servidor. Tente novamente.');
}

export async function withServiceErrors(operation, options) {
  try {
    return await operation();
  } catch (error) {
    if (!error?.code) throw error;
    throw toServiceError(error, options);
  }
}
