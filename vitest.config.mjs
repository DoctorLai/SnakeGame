import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["snake/js/engine.js"],
      reporter: ["text", "html", "lcov", "json", "json-summary"],
      reportsDirectory: "coverage",
      reportOnFailure: true,
      thresholds: {
        branches: 95,
        functions: 100,
        lines: 98,
        statements: 98
      }
    }
  }
});
