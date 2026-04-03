import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // ESM nativo — no necesita transformar nada
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Incluir solo el código de la aplicación (excluir db/schema y config files)
      include: ["src/**/*.ts"],
      exclude: [
        "src/db/schema.ts",
        "src/db/index.ts",
        "src/middleware/clerkAuth.ts", // thin re-export shim (deprecated)
      ],
      // Umbral objetivo: 85 %
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
});
