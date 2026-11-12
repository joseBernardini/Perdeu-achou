const PLACEHOLDER_PATTERN = /^(|COLE_AQUI.*|SUA_.*|.*_AQUI)$/;

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ?? '',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ?? '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID ?? '',
};

const ENV_NAMES = {
  apiKey: 'REACT_APP_FIREBASE_API_KEY',
  authDomain: 'REACT_APP_FIREBASE_AUTH_DOMAIN',
  projectId: 'REACT_APP_FIREBASE_PROJECT_ID',
  messagingSenderId: 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REACT_APP_FIREBASE_APP_ID',
};

export function getMissingFirebaseVariables(config = firebaseConfig) {
  return Object.entries(ENV_NAMES)
    .filter(([key]) => PLACEHOLDER_PATTERN.test(String(config[key] ?? '').trim()))
    .map(([, envName]) => envName);
}

export const missingFirebaseVariables = getMissingFirebaseVariables();

export const isFirebaseConfigured = missingFirebaseVariables.length === 0;

export const firebaseConfigurationError = isFirebaseConfigured
  ? null
  : `A configuração do Firebase está incompleta. Preencha no arquivo .env: ${missingFirebaseVariables.join(', ')}. Depois, reinicie o servidor de desenvolvimento.`;
