import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".node-test-dist/**",
      ".sdlc/**",
      ".venv*/**",
      "dist/**",
      "node_modules/**",
      "test-results/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.mts", "tests-node/**/*.mts"],
  })),
  {
    files: ["src/**/*.mts", "tests-node/**/*.mts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.tests.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["tests-node/**/*.mts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },
);
