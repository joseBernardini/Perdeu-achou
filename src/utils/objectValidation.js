import categories from '../data/categories';
import { OBJECT_FIELD_LIMITS } from './constants';
import { formatISODate, getTodayISODate, isValidISODate } from './date';

export const OBJECT_FORM_FIELDS = ['name', 'category', 'description', 'location', 'foundDate', 'notes'];

export const EMPTY_OBJECT_FORM = {
  name: '',
  category: '',
  description: '',
  location: '',
  foundDate: '',
  notes: '',
};

const categoryIds = categories.map((category) => category.id);

function normalizeText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

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

export function normalizeObjectForm(values = {}) {
  return {
    name: normalizeText(values.name),
    category: normalizeText(values.category),
    description: normalizeMultilineText(values.description),
    location: normalizeText(values.location),
    foundDate: normalizeText(values.foundDate),
    notes: normalizeMultilineText(values.notes),
  };
}

function validateLength(value, { min, max }, { subject, plural = false }) {
  const verb = plural ? 'devem' : 'deve';
  if (min && value.length < min) return `${subject} ${verb} ter pelo menos ${min} caracteres.`;
  if (max && value.length > max) return `${subject} ${verb} ter no máximo ${max} caracteres.`;
  return '';
}

const validators = {
  name: (value) => {
    if (!value) return 'Informe o nome do objeto.';
    return validateLength(value, OBJECT_FIELD_LIMITS.name, { subject: 'O nome' });
  },
  category: (value) => {
    if (!value) return 'Selecione uma categoria.';
    if (!categoryIds.includes(value)) return 'Selecione uma categoria válida.';
    return '';
  },
  description: (value) => {
    if (!value) return 'Descreva o objeto encontrado.';
    return validateLength(value, OBJECT_FIELD_LIMITS.description, { subject: 'A descrição' });
  },
  location: (value) => {
    if (!value) return 'Informe o local onde o objeto foi encontrado.';
    return validateLength(value, OBJECT_FIELD_LIMITS.location, { subject: 'O local' });
  },
  foundDate: (value, today) => {
    if (!value) return 'Informe a data em que o objeto foi encontrado.';
    if (!isValidISODate(value)) return 'Informe uma data válida.';
    if (value > today) return `A data não pode ser posterior a hoje (${formatISODate(today)}).`;
    return '';
  },
  notes: (value) => validateLength(value, OBJECT_FIELD_LIMITS.notes, { subject: 'As observações', plural: true }),
};

export function validateObjectField(field, rawValues, today = getTodayISODate()) {
  const values = normalizeObjectForm(rawValues);
  return validators[field] ? validators[field](values[field], today) : '';
}

export function validateObjectForm(rawValues, today = getTodayISODate()) {
  const values = normalizeObjectForm(rawValues);

  return OBJECT_FORM_FIELDS.reduce((errors, field) => {
    const message = validators[field](values[field], today);
    if (message) errors[field] = message;
    return errors;
  }, {});
}
