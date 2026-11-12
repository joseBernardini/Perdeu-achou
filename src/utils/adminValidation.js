import { ADMIN_REASON_LIMITS } from './constants';

export function normalizeReason(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

export function validateAdminReason(value) {
  const reason = normalizeReason(value);
  if (!reason) return 'Informe o motivo da decisão.';
  if (reason.length < ADMIN_REASON_LIMITS.min) return `Descreva o motivo com pelo menos ${ADMIN_REASON_LIMITS.min} caracteres.`;
  if (reason.length > ADMIN_REASON_LIMITS.max) return `O motivo deve ter no máximo ${ADMIN_REASON_LIMITS.max} caracteres.`;
  return '';
}
