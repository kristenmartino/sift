import type { Config } from "jest";
// Use the explicit `.js` subpath: Next 16's package exports are ESM-only, so the
// extensionless `next/jest` no longer resolves when Node (>=22, per .nvmrc)
// loads this .ts config as an ES module — CI failed with ERR_MODULE_NOT_FOUND.
// `next/jest.js` resolves under both CJS (local Node 20) and ESM (CI Node 22).
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default createJestConfig(config);
