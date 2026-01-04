import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"

/**
 * InnocentSupportWallet コントラクトのユニットテストコード
 * TDD (Test-Driven Development) に従い、実装前にテストを作成
 */
describe("InnocentSupportWallet", () => {
  /**
   * InnocentSupportWallet コントラクトをデプロイする fixture メソッド
   */
  async function deployInnocentSupportWalletFixture() {
    // テスト用アカウントを取得
    const [deployer, owner1, owner2, jpycToken, recipient1, recipient2, notOwner] = await ethers.getSigners()

    // コンストラクタ引数を準備
    const owners = [owner1.address, owner2.address]
    const jpycTokenAddress = jpycToken.address

    // InnocentSupportWallet コントラクトをデプロイ
    const InnocentSupportWalletFactory = await ethers.getContractFactory("InnocentSupportWallet")
    const walletContract = await InnocentSupportWalletFactory.deploy(owners, jpycTokenAddress)

    return {
      walletContract,
      deployer,
      owner1,
      owner2,
      jpycToken,
      recipient1,
      recipient2,
      notOwner,
      owners,
      jpycTokenAddress
    }
  }

  describe("# Constructor", () => {
    it("Should initialize with 2 owners", async () => {
      const { walletContract, owner1, owner2 } = await loadFixture(deployInnocentSupportWalletFixture)

      // Owner1 が Owner であることを確認
      expect(await walletContract.isOwner(owner1.address)).to.equal(true)

      // Owner2 が Owner であることを確認
      expect(await walletContract.isOwner(owner2.address)).to.equal(true)
    })

    it("Should set JPYC token address correctly", async () => {
      const { walletContract, jpycTokenAddress } = await loadFixture(deployInnocentSupportWalletFixture)

      // JPYC トークンアドレスが正しく設定されていることを確認
      expect(await walletContract.jpycTokenAddress()).to.equal(jpycTokenAddress)
    })

    it("Should revert if owners array length is not 2", async () => {
      const [, owner1, owner2, owner3, jpycToken] = await ethers.getSigners()

      const InnocentSupportWalletFactory = await ethers.getContractFactory("InnocentSupportWallet")

      // Owners が 1 人の場合、リバート
      await expect(InnocentSupportWalletFactory.deploy([owner1.address], jpycToken.address)).to.be.revertedWith(
        "Must have exactly 2 owners"
      )

      // Owners が 3 人の場合、リバート
      await expect(
        InnocentSupportWalletFactory.deploy([owner1.address, owner2.address, owner3.address], jpycToken.address)
      ).to.be.revertedWith("Must have exactly 2 owners")
    })

    it("Should revert if JPYC token address is zero address", async () => {
      const [, owner1, owner2] = await ethers.getSigners()

      const InnocentSupportWalletFactory = await ethers.getContractFactory("InnocentSupportWallet")

      // JPYC トークンアドレスが zero address の場合、リバート
      await expect(
        InnocentSupportWalletFactory.deploy([owner1.address, owner2.address], ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid JPYC token address")
    })

    it("Should revert if owner address is zero address", async () => {
      const [, owner1, jpycToken] = await ethers.getSigners()

      const InnocentSupportWalletFactory = await ethers.getContractFactory("InnocentSupportWallet")

      // Owner アドレスに zero address が含まれる場合、リバート
      await expect(
        InnocentSupportWalletFactory.deploy([owner1.address, ethers.ZeroAddress], jpycToken.address)
      ).to.be.revertedWith("Invalid owner address")
    })
  })

  describe("# Recipient Whitelist", () => {
    it("Should return false for non-whitelisted address", async () => {
      const { walletContract, recipient1 } = await loadFixture(deployInnocentSupportWalletFixture)

      // 初期状態では recipient1 はホワイトリストに含まれていない
      expect(await walletContract.isWhitelisted(recipient1.address)).to.equal(false)
    })
  })

  describe("# Nonce Management", () => {
    it("Should return false for unused nonce", async () => {
      const { walletContract } = await loadFixture(deployInnocentSupportWalletFixture)

      const nonce = 1

      // 未使用の nonce は false を返す
      expect(await walletContract.isNonceUsed(nonce)).to.equal(false)
    })
  })

  describe("# Ownership Verification", () => {
    it("Should return false for non-owner address", async () => {
      const { walletContract, notOwner } = await loadFixture(deployInnocentSupportWalletFixture)

      // notOwner は Owner ではない
      expect(await walletContract.isOwner(notOwner.address)).to.equal(false)
    })

    it("Should return owners array correctly", async () => {
      const { walletContract, owners } = await loadFixture(deployInnocentSupportWalletFixture)

      const retrievedOwners = await walletContract.getOwners()

      // owners 配列が正しく取得できる
      expect(retrievedOwners).to.have.lengthOf(2)
      expect(retrievedOwners[0]).to.equal(owners[0])
      expect(retrievedOwners[1]).to.equal(owners[1])
    })
  })
})
