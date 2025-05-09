import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/node_modules/**", "**/index.ts"],
      reporter: ['text', 'json', 'html'],
    },
    globals: true,
    restoreMocks: true,
    environment: 'node',
    setupFiles: ['./src/test/setup/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
  plugins: [tsconfigPaths()],
});
