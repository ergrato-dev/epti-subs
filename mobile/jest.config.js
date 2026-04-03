/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // Usar la misma base que jest-expo pero extendida con pnpm (.pnpm) y dependencias adicionales
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|posthog-react-native|@supabase|react-native-svg))",
    "/node_modules/react-native-reanimated/plugin/",
  ],
  setupFilesAfterEnv: ["./jest.setup.js"],
  collectCoverageFrom: [
    "lib/**/*.ts",
    "components/**/*.tsx",
    "constants/**/*.ts",
    // Excluir archivos de configuracion puros
    "!lib/i18n.ts",
    "!lib/notifications.ts",
    "!lib/supabase.ts", // requiere env vars — se mockea en los tests que lo usan
  ],
  coverageThreshold: {
    global: {
      lines: 85,
      statements: 85,
      functions: 85,
      branches: 75,
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    // El ImportMetaRegistry de expo usa require() lazy que falla en Jest cuando
    // el resolver ya no esta disponible. Mock con objeto vacio — no se necesita en tests.
    "^expo/src/winter/ImportMetaRegistry$":
      "<rootDir>/__mocks__/expoImportMetaRegistry.js",
  },
};
