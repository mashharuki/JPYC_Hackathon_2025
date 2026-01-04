import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"

describe("SemaphoreDonation", () => {
  async function deploySemaphoreDonationFixture() {
    const [deployer, donor, owner1, owner2] = await ethers.getSigners()

    const MockJPYCTokenFactory = await ethers.getContractFactory("MockJPYC")
    const jpycToken = await MockJPYCTokenFactory.deploy()

    const MockSemaphoreVerifierFactory = await ethers.getContractFactory("MockSemaphoreVerifier")
    const verifier = await MockSemaphoreVerifierFactory.deploy()

    const InnocentSupportWalletFactory = await ethers.getContractFactory("InnocentSupportWallet")
    const wallet = await InnocentSupportWalletFactory.deploy(
      [owner1.address, owner2.address],
      await jpycToken.getAddress()
    )

    const SemaphoreDonationFactory = await ethers.getContractFactory("SemaphoreDonation")
    const donation = await SemaphoreDonationFactory.deploy(
      await verifier.getAddress(),
      await jpycToken.getAddress(),
      await wallet.getAddress()
    )

    return {
      deployer,
      donor,
      owner1,
      owner2,
      jpycToken,
      verifier,
      wallet,
      donation
    }
  }

  describe("# donateWithProof", () => {
    it("Should record donation and transfer JPYC on valid proof", async () => {
      const { donor, jpycToken, verifier, wallet, donation } = await loadFixture(deploySemaphoreDonationFixture)

      await verifier.setShouldVerify(true)

      const amount = 1000n
      const nullifier = 111n
      const merkleTreeRoot = 222n
      const proof: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]

      await jpycToken.mint(donor.address, amount)
      await jpycToken.connect(donor).approve(await donation.getAddress(), amount)

      const tx = await donation
        .connect(donor)
        .donateWithProof(merkleTreeRoot, nullifier, proof, await wallet.getAddress(), amount)

      const block = await ethers.provider.getBlock("latest")
      await expect(tx)
        .to.emit(donation, "DonationRecorded")
        .withArgs(nullifier, await wallet.getAddress(), amount, block!.timestamp)

      const record = await donation.donations(nullifier)
      expect(record.amount).to.equal(amount)
      expect(record.walletAddress).to.equal(await wallet.getAddress())
      expect(record.nullifier).to.equal(nullifier)
      expect(record.timestamp).to.equal(block!.timestamp)

      expect(await donation.usedNullifiers(nullifier)).to.equal(true)
      expect(await jpycToken.balanceOf(await wallet.getAddress())).to.equal(amount)
      expect(await jpycToken.balanceOf(donor.address)).to.equal(0)
    })

    it("Should revert if proof verification fails", async () => {
      const { donor, jpycToken, verifier, wallet, donation } = await loadFixture(deploySemaphoreDonationFixture)

      await verifier.setShouldVerify(false)

      const amount = 1000n
      const nullifier = 123n
      const merkleTreeRoot = 456n
      const proof: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]

      await jpycToken.mint(donor.address, amount)
      await jpycToken.connect(donor).approve(await donation.getAddress(), amount)

      await expect(
        donation.connect(donor).donateWithProof(merkleTreeRoot, nullifier, proof, await wallet.getAddress(), amount)
      ).to.be.revertedWith("Invalid Semaphore proof")
    })

    it("Should revert if nullifier is already used", async () => {
      const { donor, jpycToken, verifier, wallet, donation } = await loadFixture(deploySemaphoreDonationFixture)

      await verifier.setShouldVerify(true)

      const amount = 1000n
      const nullifier = 999n
      const merkleTreeRoot = 888n
      const proof: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]

      await jpycToken.mint(donor.address, amount * 2n)
      await jpycToken.connect(donor).approve(await donation.getAddress(), amount * 2n)

      await donation.connect(donor).donateWithProof(merkleTreeRoot, nullifier, proof, await wallet.getAddress(), amount)

      await expect(
        donation.connect(donor).donateWithProof(merkleTreeRoot, nullifier, proof, await wallet.getAddress(), amount)
      ).to.be.revertedWith("Nullifier already used")
    })
  })
})
