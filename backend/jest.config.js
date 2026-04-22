/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/tests/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      tsconfig: {
        module: "commonjs",
        target: "es2016",
        esModuleInterop: true,
        strict: false,
        strictNullChecks: false,
        exactOptionalPropertyTypes: false,
        noUncheckedIndexedAccess: false,
        skipLibCheck: true,
        isolatedModules: true,
        ignoreDeprecations: "6.0",
      }
    }]
  },
};

module.exports = config;