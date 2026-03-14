import type { Config } from "jest";

const config: Config = {
  roots: ["<rootDir>/test"],
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json"
      }
    ]
  },
  moduleFileExtensions: ["ts", "js", "json"],
  testEnvironment: "node",
  clearMocks: true
};

export default config;
