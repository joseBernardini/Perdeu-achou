import { OBJECT_ID_PREFIX } from './constants';

const ID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ID_LENGTH = 8;

function getRandomBytes(length) {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('Gerador seguro de números aleatórios indisponível neste navegador.');
  }

  return cryptoApi.getRandomValues(new Uint8Array(length));
}

export function generatePrefixedId(prefix) {
  const bytes = getRandomBytes(ID_LENGTH);
  const code = Array.from(bytes, (byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join('');
  return `${prefix}${code}`;
}

export function isValidPrefixedId(prefix, value) {
  return typeof value === 'string' && new RegExp(`^${prefix}[${ID_ALPHABET}]{${ID_LENGTH}}$`).test(value);
}

export function generateObjectId() {
  return generatePrefixedId(OBJECT_ID_PREFIX);
}

export function isValidObjectId(value) {
  return isValidPrefixedId(OBJECT_ID_PREFIX, value);
}

export function normalizeObjectId(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}
