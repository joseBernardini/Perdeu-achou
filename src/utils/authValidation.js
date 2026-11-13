import { AUTH_FIELD_LIMITS, SELECTABLE_PROFILE_TYPES } from './constants';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function normalizeName(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function validateEmail(value) {
  const email = normalizeEmail(value);
  if (!email) return 'Informe seu e-mail.';
  if (email.length > AUTH_FIELD_LIMITS.email.max) return `O e-mail deve ter no máximo ${AUTH_FIELD_LIMITS.email.max} caracteres.`;
  if (!EMAIL_PATTERN.test(email)) return 'Informe um e-mail válido, como nome@exemplo.com.';
  return '';
}

function validatePassword(value) {
  const password = typeof value === 'string' ? value : '';
  if (!password) return 'Informe sua senha.';
  if (password.length < AUTH_FIELD_LIMITS.password.min) {
    return `A senha deve ter pelo menos ${AUTH_FIELD_LIMITS.password.min} caracteres.`;
  }
  if (password.length > AUTH_FIELD_LIMITS.password.max) {
    return `A senha deve ter no máximo ${AUTH_FIELD_LIMITS.password.max} caracteres.`;
  }
  return '';
}

function collect(entries) {
  return Object.fromEntries(entries.filter(([, message]) => message));
}

export function validateSignInForm(values = {}) {
  return collect([
    ['email', validateEmail(values.email)],
    ['password', values.password ? '' : 'Informe sua senha.'],
  ]);
}

export function validateSignUpForm(values = {}) {
  const name = normalizeName(values.name);
  let nameError = '';
  if (!name) nameError = 'Informe seu nome.';
  else if (name.length < AUTH_FIELD_LIMITS.name.min) nameError = `O nome deve ter pelo menos ${AUTH_FIELD_LIMITS.name.min} caracteres.`;
  else if (name.length > AUTH_FIELD_LIMITS.name.max) nameError = `O nome deve ter no máximo ${AUTH_FIELD_LIMITS.name.max} caracteres.`;

  let confirmationError = '';
  if (!values.passwordConfirmation) confirmationError = 'Confirme sua senha.';
  else if (values.passwordConfirmation !== values.password) confirmationError = 'As senhas informadas não são iguais.';

  return collect([
    ['name', nameError],
    ['email', validateEmail(values.email)],
    ['password', validatePassword(values.password)],
    ['passwordConfirmation', confirmationError],
    ['profileType', SELECTABLE_PROFILE_TYPES.includes(values.profileType) ? '' : 'Selecione se você é aluno ou funcionário.'],
  ]);
}

export function validatePasswordResetForm(values = {}) {
  return collect([['email', validateEmail(values.email)]]);
}

export function validateProfileForm(values = {}) {
  const name = normalizeName(values.name);
  let nameError = '';
  if (!name) nameError = 'Informe seu nome.';
  else if (name.length < AUTH_FIELD_LIMITS.name.min) nameError = `O nome deve ter pelo menos ${AUTH_FIELD_LIMITS.name.min} caracteres.`;
  else if (name.length > AUTH_FIELD_LIMITS.name.max) nameError = `O nome deve ter no máximo ${AUTH_FIELD_LIMITS.name.max} caracteres.`;

  return collect([
    ['name', nameError],
    ['profileType', SELECTABLE_PROFILE_TYPES.includes(values.profileType) ? '' : 'Selecione se você é aluno ou funcionário.'],
  ]);
}
