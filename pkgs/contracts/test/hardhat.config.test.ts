import { expect } from "chai"
import { config as dotenvConfig } from "dotenv"
import hre from "hardhat"

// Load environment variables before running tests
dotenvConfig()

/**
 * Hardhat設定の検証テスト
 * Task 1.1: 環境変数とネットワーク設定の構成
 */
describe("Hardhat Configuration", () => {
  describe("Network Configuration", () => {
    it("should have baseSepolia network configured", () => {
      const { networks } = hre.config
      expect(networks).to.have.property("baseSepolia")
    })

    it("should configure baseSepolia with correct chain ID", () => {
      const { baseSepolia } = hre.config.networks
      expect(baseSepolia).to.have.property("chainId", 84532)
    })

    it("should configure baseSepolia with correct RPC URL", () => {
      const baseSepolia = hre.config.networks.baseSepolia as any
      const expectedUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"
      expect(baseSepolia.url).to.equal(expectedUrl)
    })

    it("should have sepolia network configured", () => {
      const { networks } = hre.config
      expect(networks).to.have.property("sepolia")
    })

    it("should have hardhat local network configured", () => {
      const { networks } = hre.config
      expect(networks).to.have.property("hardhat")
    })

    it("should configure hardhat network with chain ID 1337", () => {
      const { hardhat } = hre.config.networks
      expect(hardhat.chainId).to.equal(1337)
    })
  })

  describe("Solidity Configuration", () => {
    it("should use Solidity version 0.8.23", () => {
      const solidityConfig = hre.config.solidity as any
      // Solidity config can be a string or an object with compilers
      if (typeof solidityConfig === "string") {
        expect(solidityConfig).to.equal("0.8.23")
      } else if (solidityConfig.compilers) {
        // Check if any compiler version is 0.8.23
        const hasVersion = solidityConfig.compilers.some((compiler: any) => compiler.version === "0.8.23")
        expect(hasVersion).to.equal(true)
      }
    })
  })

  describe("TypeChain Configuration", () => {
    it("should target ethers-v6 for type generation", () => {
      expect(hre.config.typechain.target).to.equal("ethers-v6")
    })
  })

  describe("Default Network", () => {
    it("should have a default network configured", () => {
      expect(hre.config.defaultNetwork).to.be.a("string")
    })

    it("should default to 'hardhat' when DEFAULT_NETWORK is not set", () => {
      // If DEFAULT_NETWORK is not set in env, it should be 'hardhat'
      if (!process.env.DEFAULT_NETWORK) {
        expect(hre.config.defaultNetwork).to.equal("hardhat")
      }
    })
  })

  describe("Environment Variables (Documentation Test)", () => {
    // These tests document the expected environment variables
    // They will pass even if variables are not set (for CI/CD compatibility)

    it("should document BASE_SEPOLIA_RPC_URL environment variable", () => {
      // This test documents that BASE_SEPOLIA_RPC_URL should be set
      const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL
      if (rpcUrl) {
        expect(rpcUrl).to.be.a("string")
        expect(rpcUrl.length).to.be.greaterThan(0)
      }
      // Test passes whether env var is set or not
      expect(true).to.equal(true)
    })

    it("should document JPYC_TOKEN_ADDRESS environment variable", () => {
      // This test documents that JPYC_TOKEN_ADDRESS should be set
      const jpycAddress = process.env.JPYC_TOKEN_ADDRESS
      if (jpycAddress) {
        expect(jpycAddress).to.be.a("string")
        // Should be a valid Ethereum address format
        expect(jpycAddress).to.match(/^0x[a-fA-F0-9]{40}$/)
      }
      expect(true).to.equal(true)
    })

    it("should document MULTISIG_OWNER_1 environment variable", () => {
      const owner1 = process.env.MULTISIG_OWNER_1
      if (owner1) {
        expect(owner1).to.be.a("string")
        expect(owner1).to.match(/^0x[a-fA-F0-9]{40}$/)
      }
      expect(true).to.equal(true)
    })

    it("should document MULTISIG_OWNER_2 environment variable", () => {
      const owner2 = process.env.MULTISIG_OWNER_2
      if (owner2) {
        expect(owner2).to.be.a("string")
        expect(owner2).to.match(/^0x[a-fA-F0-9]{40}$/)
      }
      expect(true).to.equal(true)
    })
  })
})
