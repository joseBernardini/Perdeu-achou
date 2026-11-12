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

export class FormValidationError extends Error {
  constructor(fieldErrors) {
    super('Os dados informados são inválidos.');
    this.name = 'FormValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class NotAuthenticatedError extends Error {
  constructor() {
    super('É necessário entrar na sua conta para continuar.');
    this.name = 'NotAuthenticatedError';
  }
}

export class PermissionDeniedError extends Error {
  constructor(message = 'Você não tem permissão para realizar esta ação.') {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

export class ObjectUnavailableError extends Error {
  constructor(id) {
    super(`O objeto ${id} não está disponível para solicitações de recuperação.`);
    this.name = 'ObjectUnavailableError';
    this.objectId = id;
  }
}

export class DuplicateRequestError extends Error {
  constructor(existingRequest) {
    super('Você já possui uma solicitação pendente para este objeto.');
    this.name = 'DuplicateRequestError';
    this.existingRequest = existingRequest;
  }
}

export class RequestNotFoundError extends Error {
  constructor(id) {
    super(`Nenhuma solicitação encontrada com o código ${id}.`);
    this.name = 'RequestNotFoundError';
    this.requestId = id;
  }
}

export class RequestStatusChangeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RequestStatusChangeError';
  }
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Já existe uma conta de demonstração com este e-mail.');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Não foi possível entrar com os dados informados. Confira o e-mail ou crie uma conta de demonstração.');
    this.name = 'InvalidCredentialsError';
  }
}

export class StorageUnavailableError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'StorageUnavailableError';
    this.cause = cause;
  }
}
