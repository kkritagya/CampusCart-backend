import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  maxWorkers: 1,
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 30_000,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/database/**",
    "!src/configs/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "json-summary", "html"],
};

export default config;
