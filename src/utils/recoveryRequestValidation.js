import { REQUEST_FIELD_LIMITS } from './constants';

function normalizeMultilineText(value) {
  if (typeof value !== 'string') return '';

  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeRecoveryRequestForm(values = {}) {
  return {
    message: normalizeMultilineText(values.message),
    additionalInfo: normalizeMultilineText(values.additionalInfo),
  };
}

export function validateRecoveryRequestForm(rawValues = {}) {
  const values = normalizeRecoveryRequestForm(rawValues);
  const errors = {};
  const { message, additionalInfo } = REQUEST_FIELD_LIMITS;

  if (!values.message) {
    errors.message = 'Explique por que você acredita ser o proprietário do objeto.';
  } else if (values.message.length < message.min) {
    errors.message = `Descreva com mais detalhes: escreva pelo menos ${message.min} caracteres.`;
  } else if (values.message.length > message.max) {
    errors.message = `A explicação deve ter no máximo ${message.max} caracteres.`;
  }

  if (values.additionalInfo.length > additionalInfo.max) {
    errors.additionalInfo = `As informações adicionais devem ter no máximo ${additionalInfo.max} caracteres.`;
  }

  return errors;
}
