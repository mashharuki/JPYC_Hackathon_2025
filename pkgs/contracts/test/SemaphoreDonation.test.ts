import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"

/**
 * SemaphoreDonation コントラクトのユニットテストコード
 * TDD (Test-Driven Development) に従い、実装前にテストを作成
 */
describe("SemaphoreDonation", () => {
  /**
   * デプロイ用フィクスチャ
   * Semaphore Verifier、JPYC、MultiSig Wallet をモックとして用意
   */
  async function deploySemaphoreDonationFixture() {
    const [deployer, donor, walletOwner1, walletOwner2] = await ethers.getSigners()

    // Mock Semaphore Verifier をデプロイ
    const MockVerifier = await ethers.getContractFactory("MockSemaphoreVerifier")
    const mockVerifier = await MockVerifier.deploy()

    // Mock JPYC トークンをデプロイ
    const MockJPYC = await ethers.getContractFactory("MockJPYC")
    const mockJPYC = await MockJPYC.deploy()

    // Mock MultiSig Wallet アドレス（実際はウォレットコントラクトだが、ここではテスト用にアドレスのみ使用）
    const mockWalletAddress = walletOwner1.address

    // SemaphoreDonation をデプロイ
    const SemaphoreDonation = await ethers.getContractFactory("SemaphoreDonation")
    const semaphoreDonation = await SemaphoreDonation.deploy(
      await mockVerifier.getAddress(),
      await mockJPYC.getAddress(),
      mockWalletAddress
    )

    return {
      semaphoreDonation,
      mockVerifier,
      mockJPYC,
      mockWalletAddress,
      deployer,
      donor,
      walletOwner1,
      walletOwner2
    }
  }

  describe("getDonationByNullifier", () => {
    it("should return donation record for a valid nullifier", async () => {
      const { semaphoreDonation, mockVerifier, mockJPYC, mockWalletAddress, donor } =
        await loadFixture(deploySemaphoreDonationFixture)

      // 1. 寄付トランザクションを実行してデータを準備
      const donationAmount = ethers.parseUnits("100", 18) // 100 JPYC
      const nullifier = 12345n
      const merkleTreeRoot = 67890n

      // Mock Verifier を常に true を返すように設定
      await mockVerifier.setVerificationResult(true)

      // Donor に JPYC をミント
      await mockJPYC.mint(donor.address, donationAmount)

      // Donor が SemaphoreDonation に approve
      await mockJPYC.connect(donor).approve(await semaphoreDonation.getAddress(), donationAmount)

      // Semaphore Proof をモック（実際の証明生成はフロントエンドで実施）
      const mockProof: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [
        1n,
        2n,
        3n,
        4n,
        5n,
        6n,
        7n,
        8n
      ]

      // 寄付を実行
      await semaphoreDonation
        .connect(donor)
        .donateWithProof(merkleTreeRoot, nullifier, mockProof, mockWalletAddress, donationAmount)

      // 2. getDonationByNullifier を呼び出してデータを取得
      const donationRecord = await semaphoreDonation.getDonationByNullifier(nullifier)

      // 3. 期待値との比較
      expect(donationRecord.nullifier).to.equal(nullifier)
      expect(donationRecord.amount).to.equal(donationAmount)
      expect(donationRecord.walletAddress).to.equal(mockWalletAddress)
      expect(donationRecord.timestamp).to.be.greaterThan(0) // タイムスタンプが設定されていることを確認
    })

    it("should return zero values for non-existent nullifier", async () => {
      const { semaphoreDonation } = await loadFixture(deploySemaphoreDonationFixture)

      const nonExistentNullifier = 99999n

      // 存在しない nullifier を指定
      const donationRecord = await semaphoreDonation.getDonationByNullifier(nonExistentNullifier)

      // デフォルト値が返されることを確認
      expect(donationRecord.nullifier).to.equal(0n)
      expect(donationRecord.amount).to.equal(0n)
      expect(donationRecord.walletAddress).to.equal(ethers.ZeroAddress)
      expect(donationRecord.timestamp).to.equal(0n)
    })
  })
})
