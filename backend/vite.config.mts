import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "**/node_modules/**", 
        "**/index.ts",
        "**/dist/**",
        "**/prisma/**",
        "**/*.d.ts",
        "**/test/**",
        "**/tests/**"
      ],
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    environment: 'node',
    setupFiles: ['./src/test/setup/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/tests/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**', 
      '**/dist/**',
      '**/build/**',
      '**/coverage/**'
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  plugins: [tsconfigPaths()],
});
