const nextJest = require("next/jest")

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./"
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^jose": "<rootDir>/src/__mocks__/jose.js",
    "^ofetch": "<rootDir>/src/__mocks__/ofetch.js",
    "^@coinbase/wallet-sdk$": "<rootDir>/src/__mocks__/coinbase-wallet-sdk.js",
    "^uint8arrays": "<rootDir>/src/__mocks__/uint8arrays.js"
  },
  transformIgnorePatterns: [
    "node_modules/(?!(jose|@privy-io|@semaphore-protocol|viem|ofetch|@coinbase/wallet-sdk|uint8arrays)/)"
  ]
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
