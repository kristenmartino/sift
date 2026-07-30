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

  // Without this, Jest only instruments files that a test happens to import,
  // so untested files are absent from the DENOMINATOR entirely. The 80%
  // threshold below was therefore passing against ~24 measured files out of
  // ~79 real ones — it could never fail no matter how much untested code
  // landed. Naming the sources explicitly is what makes the gate mean anything.
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "app/api/**/route.ts",
    "!**/*.d.ts",
    "!lib/types.ts",
    // Excluded with cause, not to flatter the number: thin wrappers over a
    // live pg Pool, browser-only APIs, and streaming plumbing. These are
    // exercised by the CI production build and the prerender step rather than
    // by unit tests.
    "!lib/db.ts",
    "!lib/hooks.ts",
    "!lib/sse.ts",
  ],

  // A RATCHET, not a target. These are the honest measured values from the day
  // collectCoverageFrom was added (2026-07-30), floored just below so the gate
  // is real from day one. Raise as coverage improves; never lower to turn a red
  // build green.
  //
  // Note: naming "./lib/" as its own group REMOVES those files from "global",
  // so `global` here means components/ + app/api/ only. Measured on 2026-07-30:
  //   ./lib/  statements 74.6  branches 76.1  lines 76.3  functions 76.2
  //   global  statements 10.8  branches  8.0  lines 11.0  functions 10.2
  //
  // The ~10% global figure is the honest state of component and API-route
  // testing, previously hidden entirely by the missing collectCoverageFrom.
  coverageThreshold: {
    global: {
      branches: 6,
      functions: 8,
      lines: 8,
      statements: 8,
    },
    "./lib/": {
      branches: 74,
      functions: 74,
      lines: 74,
      statements: 72,
    },
  },
};

export default createJestConfig(config);
