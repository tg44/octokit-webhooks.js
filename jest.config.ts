import { Config } from "@jest/types";
import "ts-jest";

const config: Config.InitialOptions = {
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  globals: {
    "ts-jest": {
      tsconfig: {
        esModuleInterop: true,
      },
    },
  },
  preset: "ts-jest",
  restoreMocks: true,
  testEnvironment: "node",
  testRegex: /test\/.*\/.*.test.ts/u.source,
  /*transformIgnorePatterns: [
    `/node_modules/(?!aggregate-error/.*)`,
    `/node_modules/(?!indent-string/.*)`,
    `/node_modules/(?!node-fetch/.*)`,
    `/node_modules/(?!node-fetch/.*)`,
  ],*/
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js)$": "babel-jest",
  },
  transformIgnorePatterns: [
  ],
};

export default config;
