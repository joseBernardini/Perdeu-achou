export class ObjectValidationError extends Error {
  constructor(fieldErrors) {
    super('Os dados informados são inválidos.');
    this.name = 'ObjectValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class ObjectNotFoundError extends Error {
  constructor(id) {
    super(`Nenhum objeto encontrado com o código ${id}.`);
    this.name = 'ObjectNotFoundError';
    this.objectId = id;
  }
}

export class ObjectUpdateNotAllowedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ObjectUpdateNotAllowedError';
  }
}

export class ObjectStorageError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'ObjectStorageError';
    this.cause = cause;
  }
}
