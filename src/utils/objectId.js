import { OBJECT_ID_PREFIX } from './constants';

const ID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ID_LENGTH = 8;
const OBJECT_ID_PATTERN = new RegExp(`^${OBJECT_ID_PREFIX}[${ID_ALPHABET}]{${ID_LENGTH}}$`);

function getRandomBytes(length) {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('Gerador seguro de números aleatórios indisponível neste navegador.');
  }

  return cryptoApi.getRandomValues(new Uint8Array(length));
}

export function generateObjectId() {
  const bytes = getRandomBytes(ID_LENGTH);
  const code = Array.from(bytes, (byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join('');
  return `${OBJECT_ID_PREFIX}${code}`;
}

export function isValidObjectId(value) {
  return typeof value === 'string' && OBJECT_ID_PATTERN.test(value);
}

export function normalizeObjectId(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}
