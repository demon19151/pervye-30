import path from "path";
import { fileURLToPath } from "url";
import nextJest from "next/jest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const createJestConfig = nextJest({
  dir: projectRoot,
});

/** @type {import('jest').Config} */
const config = {
  rootDir: projectRoot,
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/__tests__/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/", "<rootDir>/e2e/"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default createJestConfig(config);
