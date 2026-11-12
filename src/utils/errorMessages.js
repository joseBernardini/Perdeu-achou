const SPECIFIC_ERRORS = new Set([
  'ConnectionError',
  'PermissionDeniedError',
  'SessionExpiredError',
  'ConfigurationError',
  'AuthError',
  'AccountDisabledError',
]);

export function getErrorMessage(error, fallback) {
  if (error && SPECIFIC_ERRORS.has(error.name) && error.message) return error.message;
  return fallback;
}
