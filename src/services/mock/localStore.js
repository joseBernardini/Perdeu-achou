import { StorageUnavailableError } from '../serviceErrors';

export const SIMULATED_LATENCY_MS = process.env.NODE_ENV === 'test' ? 0 : 450;

export function resolveBrowserStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function wait(ms) {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

export function createLocalStore({ storage, key, fallback, isValid = () => true }) {
  function read() {
    if (!storage) return fallback();

    try {
      const raw = storage.getItem(key);
      if (!raw) return fallback();

      const parsed = JSON.parse(raw);
      return isValid(parsed) ? parsed : fallback();
    } catch {
      return fallback();
    }
  }

  function write(value) {
    if (!storage) {
      throw new StorageUnavailableError('O armazenamento local do navegador não está disponível.');
    }

    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new StorageUnavailableError('Não foi possível salvar os dados no armazenamento local do navegador.', error);
    }
  }

  function remove() {
    if (!storage) return;

    try {
      storage.removeItem(key);
    } catch {
      return;
    }
  }

  return { read, write, remove };
}
