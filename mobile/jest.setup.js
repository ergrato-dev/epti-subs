// Globals necesarios para el entorno React Native en Jest
global.__DEV__ = true;

// Node v18+ expone fetch globalmente. Axios v1.x detecta fetch y usa su adaptador
// que tiene import() dinamico incompatible con Jest. Forzar adaptador http/https.
delete global.fetch;

// Silenciar logs de consola irrelevantes durante los tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
