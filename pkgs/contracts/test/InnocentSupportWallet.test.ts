import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"

/**
 * InnocentSupportWallet コントラクトのユニットテストコード
 * TDD (Test-Driven Development) に従い、実装前にテストを作成
 */
describe("InnocentSupportWallet", () => {
  function orderSignaturesBySignerAddress(
    owner1Address: string,
    owner2Address: string,
    signature1: string,
    signature2: string
  ) {
    const [firstAddress] =
      owner1Address.toLowerCase() < owner2Address.toLowerCase()
        ? [owner1Address, owner2Address]
        : [owner2Address, owner1Address]

    const firstSignature = firstAddress === owner1Address ? signature1 : signature2
    const secondSignature = firstAddress === owner1Address ? signature2 : signature1

    return { firstSignature, secondSignature }
  }

  async function addRecipientToWhitelist(
    walletAddress: string,
    owner1: { signTypedData: (domain: unknown, types: unknown, value: unknown) => Promise<string> },
    owner2: { signTypedData: (domain: unknown, types: unknown, value: unknown) => Promise<string> },
    recipientAddress: string,
    nonce: number
  ) {
    const domain = {
      name: "InnocentSupportWallet",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: walletAddress
    }

    const types = {
      AddRecipient: [
        { name: "recipient", type: "address" },
        { name: "nonce", type: "uint256" }
      ]
    }

    const value = {
      recipient: recipientAddress,
      nonce
    }

    const signature1 = await owner1.signTypedData(domain, types, value)
    const signature2 = await owner2.signTypedData(domain, types, value)

    const { firstSignature, secondSignature } = orderSignaturesBySignerAddress(
      owner1.address,
      owner2.address,
      signature1,
      signature2
    )

    return { signature1: firstSignature, signature2: secondSignature }
  }

  /**
   * InnocentSupportWallet コントラクトをデプロイする fixture メソッド
   */
  async function deployInnocentSupportWalletFixture() {
    // テスト用アカウントを取得
    const [deployer, owner1, owner2, recipient1, recipient2, notOwner] = await ethers.getSigners()

    const MockJPYCTokenFactory = await ethers.getContractFactory("MockJPYC")
    const jpycToken = await MockJPYCTokenFactory.deploy()

    // コンストラクタ引数を準備
    const owners = [owner1.address, owner2.address]
    const jpycTokenAddress = await jpycToken.getAddress()

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
      const [, owner1, owner2, owner3] = await ethers.getSigners()
      const MockJPYCTokenFactory = await ethers.getContractFactory("MockJPYC")
      const jpycToken = await MockJPYCTokenFactory.deploy()

      const InnocentSupportWalletFactory = await ethers.getContractFactory("InnocentSupportWallet")

      // Owners が 1 人の場合、リバート
      await expect(
        InnocentSupportWalletFactory.deploy([owner1.address], await jpycToken.getAddress())
      ).to.be.revertedWith("Must have exactly 2 owners")

      // Owners が 3 人の場合、リバート
      await expect(
        InnocentSupportWalletFactory.deploy(
          [owner1.address, owner2.address, owner3.address],
          await jpycToken.getAddress()
        )
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
      const [, owner1] = await ethers.getSigners()
      const MockJPYCTokenFactory = await ethers.getContractFactory("MockJPYC")
      const jpycToken = await MockJPYCTokenFactory.deploy()

      const InnocentSupportWalletFactory = await ethers.getContractFactory("InnocentSupportWallet")

      // Owner アドレスに zero address が含まれる場合、リバート
      await expect(
        InnocentSupportWalletFactory.deploy([owner1.address, ethers.ZeroAddress], await jpycToken.getAddress())
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

  describe("# addRecipient - EIP-712 Signature Verification", () => {
    it("Should add recipient with valid 2 signatures", async () => {
      const { walletContract, owner1, owner2, recipient1 } = await loadFixture(deployInnocentSupportWalletFixture)

      const nonce = 1

      // EIP-712 型付きデータを構築
      const domain = {
        name: "InnocentSupportWallet",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await walletContract.getAddress()
      }

      const types = {
        AddRecipient: [
          { name: "recipient", type: "address" },
          { name: "nonce", type: "uint256" }
        ]
      }

      const value = {
        recipient: recipient1.address,
        nonce
      }

      // Owner1 と Owner2 の署名を生成
      const signature1 = await owner1.signTypedData(domain, types, value)
      const signature2 = await owner2.signTypedData(domain, types, value)
      const { firstSignature, secondSignature } = orderSignaturesBySignerAddress(
        owner1.address,
        owner2.address,
        signature1,
        signature2
      )

      // addRecipient を実行
      const tx = await walletContract.addRecipient(recipient1.address, [firstSignature, secondSignature], nonce)

      // RecipientAdded イベントが発行されることを確認
      const block = await ethers.provider.getBlock("latest")
      await expect(tx).to.emit(walletContract, "RecipientAdded").withArgs(recipient1.address, block!.timestamp)

      // ホワイトリストに追加されたことを確認
      expect(await walletContract.isWhitelisted(recipient1.address)).to.equal(true)

      // nonce が使用済みになったことを確認
      expect(await walletContract.isNonceUsed(nonce)).to.equal(true)
    })

    it("Should revert if signatures array length is not 2", async () => {
      const { walletContract, owner1, recipient1 } = await loadFixture(deployInnocentSupportWalletFixture)

      const nonce = 1

      const domain = {
        name: "InnocentSupportWallet",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await walletContract.getAddress()
      }

      const types = {
        AddRecipient: [
          { name: "recipient", type: "address" },
          { name: "nonce", type: "uint256" }
        ]
      }

      const value = {
        recipient: recipient1.address,
        nonce
      }

      const signature1 = await owner1.signTypedData(domain, types, value)

      // 署名が1つの場合、リバート
      await expect(walletContract.addRecipient(recipient1.address, [signature1], nonce)).to.be.revertedWith(
        "Must provide exactly 2 signatures"
      )
    })

    it("Should revert if nonce is already used", async () => {
      const { walletContract, owner1, owner2, recipient1 } = await loadFixture(deployInnocentSupportWalletFixture)

      const nonce = 1

      const domain = {
        name: "InnocentSupportWallet",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await walletContract.getAddress()
      }

      const types = {
        AddRecipient: [
          { name: "recipient", type: "address" },
          { name: "nonce", type: "uint256" }
        ]
      }

      const value = {
        recipient: recipient1.address,
        nonce
      }

      const signature1 = await owner1.signTypedData(domain, types, value)
      const signature2 = await owner2.signTypedData(domain, types, value)
      const { firstSignature, secondSignature } = orderSignaturesBySignerAddress(
        owner1.address,
        owner2.address,
        signature1,
        signature2
      )

      // 1回目の実行は成功
      await walletContract.addRecipient(recipient1.address, [firstSignature, secondSignature], nonce)

      // 同じ nonce で2回目の実行はリバート
      await expect(
        walletContract.addRecipient(recipient1.address, [firstSignature, secondSignature], nonce)
      ).to.be.revertedWith("Nonce already used")
    })

    it("Should revert if signer is not an owner", async () => {
      const { walletContract, owner1, notOwner, recipient1 } = await loadFixture(deployInnocentSupportWalletFixture)

      const nonce = 1

      const domain = {
        name: "InnocentSupportWallet",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await walletContract.getAddress()
      }

      const types = {
        AddRecipient: [
          { name: "recipient", type: "address" },
          { name: "nonce", type: "uint256" }
        ]
      }

      const value = {
        recipient: recipient1.address,
        nonce
      }

      const signature1 = await owner1.signTypedData(domain, types, value)
      const signatureNotOwner = await notOwner.signTypedData(domain, types, value)

      // Owner でない署名が含まれる場合、リバート
      await expect(
        walletContract.addRecipient(recipient1.address, [signature1, signatureNotOwner], nonce)
      ).to.be.revertedWith("Invalid signer: not an owner")
    })

    it("Should revert if signatures are from the same owner", async () => {
      const { walletContract, owner1, recipient1 } = await loadFixture(deployInnocentSupportWalletFixture)

      const nonce = 1

      const domain = {
        name: "InnocentSupportWallet",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await walletContract.getAddress()
      }

      const types = {
        AddRecipient: [
          { name: "recipient", type: "address" },
          { name: "nonce", type: "uint256" }
        ]
      }

      const value = {
        recipient: recipient1.address,
        nonce
      }

      const signature1 = await owner1.signTypedData(domain, types, value)
      const { firstSignature, secondSignature } = orderSignaturesBySignerAddress(
        owner1.address,
        owner1.address,
        signature1,
        signature1
      )

      // 同じ Owner の署名を2つ渡す場合、リバート
      await expect(
        walletContract.addRecipient(recipient1.address, [firstSignature, secondSignature], nonce)
      ).to.be.revertedWith("Duplicate signer")
    })

    it("Should revert if signatures are in invalid order", async () => {
      const { walletContract, owner1, owner2, recipient1 } = await loadFixture(deployInnocentSupportWalletFixture)

      const nonce = 1

      const domain = {
        name: "InnocentSupportWallet",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await walletContract.getAddress()
      }

      const types = {
        AddRecipient: [
          { name: "recipient", type: "address" },
          { name: "nonce", type: "uint256" }
        ]
      }

      const value = {
        recipient: recipient1.address,
        nonce
      }

      const signature1 = await owner1.signTypedData(domain, types, value)
      const signature2 = await owner2.signTypedData(domain, types, value)
      const { firstSignature, secondSignature } = orderSignaturesBySignerAddress(
        owner1.address,
        owner2.address,
        signature1,
        signature2
      )

      await expect(
        walletContract.addRecipient(recipient1.address, [secondSignature, firstSignature], nonce)
      ).to.be.revertedWith("Invalid signer order")
    })

    it("Should revert if recipient address is zero address", async () => {
      const { walletContract, owner1, owner2 } = await loadFixture(deployInnocentSupportWalletFixture)

      const nonce = 1

      const domain = {
        name: "InnocentSupportWallet",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await walletContract.getAddress()
      }

      const types = {
        AddRecipient: [
          { name: "recipient", type: "address" },
          { name: "nonce", type: "uint256" }
        ]
      }

      const value = {
        recipient: ethers.ZeroAddress,
        nonce
      }

      const signature1 = await owner1.signTypedData(domain, types, value)
      const signature2 = await owner2.signTypedData(domain, types, value)
      const { firstSignature, secondSignature } = orderSignaturesBySignerAddress(
        owner1.address,
        owner2.address,
        signature1,
        signature2
      )

      // recipient が zero address の場合、リバート
      await expect(
        walletContract.addRecipient(ethers.ZeroAddress, [firstSignature, secondSignature], nonce)
      ).to.be.revertedWith("Invalid recipient address")
    })
  })

  describe("# withdraw", () => {
    it("Should revert if caller is not whitelisted", async () => {
      const { walletContract, recipient1 } = await loadFixture(deployInnocentSupportWalletFixture)

      await expect(walletContract.connect(recipient1).withdraw(recipient1.address, 1)).to.be.revertedWith(
        "Caller not whitelisted"
      )
    })

    it("Should revert if JPYC balance is insufficient", async () => {
      const { walletContract, owner1, owner2, recipient1 } = await loadFixture(deployInnocentSupportWalletFixture)

      const { signature1, signature2 } = await addRecipientToWhitelist(
        await walletContract.getAddress(),
        owner1,
        owner2,
        recipient1.address,
        1
      )

      await walletContract.addRecipient(recipient1.address, [signature1, signature2], 1)

      await expect(walletContract.connect(recipient1).withdraw(recipient1.address, 1)).to.be.revertedWith(
        "Insufficient JPYC balance"
      )
    })

    it("Should transfer JPYC and emit event", async () => {
      const { walletContract, owner1, owner2, recipient1, recipient2, jpycToken } = await loadFixture(
        deployInnocentSupportWalletFixture
      )

      const { signature1, signature2 } = await addRecipientToWhitelist(
        await walletContract.getAddress(),
        owner1,
        owner2,
        recipient1.address,
        1
      )

      await walletContract.addRecipient(recipient1.address, [signature1, signature2], 1)

      const amount = 500
      await jpycToken.mint(await walletContract.getAddress(), amount)

      const tx = await walletContract.connect(recipient1).withdraw(recipient2.address, amount)

      const block = await ethers.provider.getBlock("latest")
      await expect(tx)
        .to.emit(walletContract, "WithdrawalExecuted")
        .withArgs(recipient2.address, amount, block!.timestamp)

      expect(await jpycToken.balanceOf(recipient2.address)).to.equal(amount)
    })
  })

  describe("# getJPYCBalance", () => {
    it("Should return contract JPYC balance", async () => {
      const { walletContract, jpycToken } = await loadFixture(deployInnocentSupportWalletFixture)

      const amount = 1234
      await jpycToken.mint(await walletContract.getAddress(), amount)

      expect(await walletContract.getJPYCBalance()).to.equal(amount)
    })
  })

  describe("# removeRecipient", () => {
    async function buildRemoveRecipientSignatures(
      walletAddress: string,
      owner1: { signTypedData: (domain: unknown, types: unknown, value: unknown) => Promise<string> },
      owner2: { signTypedData: (domain: unknown, types: unknown, value: unknown) => Promise<string> },
      recipientAddress: string,
      nonce: number
    ) {
      const domain = {
        name: "InnocentSupportWallet",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: walletAddress
      }

      const types = {
        RemoveRecipient: [
          { name: "recipient", type: "address" },
          { name: "nonce", type: "uint256" }
        ]
      }

      const value = {
        recipient: recipientAddress,
        nonce
      }

      const signature1 = await owner1.signTypedData(domain, types, value)
      const signature2 = await owner2.signTypedData(domain, types, value)

      const { firstSignature, secondSignature } = orderSignaturesBySignerAddress(
        owner1.address,
        owner2.address,
        signature1,
        signature2
      )

      return { signature1: firstSignature, signature2: secondSignature }
    }

    it("Should remove recipient with valid 2 signatures", async () => {
      const { walletContract, owner1, owner2, recipient1 } = await loadFixture(deployInnocentSupportWalletFixture)

      const { signature1, signature2 } = await addRecipientToWhitelist(
        await walletContract.getAddress(),
        owner1,
        owner2,
        recipient1.address,
        1
      )

      await walletContract.addRecipient(recipient1.address, [signature1, signature2], 1)

      const { signature1: removeSig1, signature2: removeSig2 } = await buildRemoveRecipientSignatures(
        await walletContract.getAddress(),
        owner1,
        owner2,
        recipient1.address,
        2
      )

      const tx = await walletContract.removeRecipient(recipient1.address, [removeSig1, removeSig2], 2)

      const block = await ethers.provider.getBlock("latest")
      await expect(tx).to.emit(walletContract, "RecipientRemoved").withArgs(recipient1.address, block!.timestamp)

      expect(await walletContract.isWhitelisted(recipient1.address)).to.equal(false)
      expect(await walletContract.isNonceUsed(2)).to.equal(true)
    })

    it("Should revert if nonce is already used", async () => {
      const { walletContract, owner1, owner2, recipient1 } = await loadFixture(deployInnocentSupportWalletFixture)

      const { signature1, signature2 } = await addRecipientToWhitelist(
        await walletContract.getAddress(),
        owner1,
        owner2,
        recipient1.address,
        1
      )

      await walletContract.addRecipient(recipient1.address, [signature1, signature2], 1)

      const { signature1: removeSig1, signature2: removeSig2 } = await buildRemoveRecipientSignatures(
        await walletContract.getAddress(),
        owner1,
        owner2,
        recipient1.address,
        2
      )

      await walletContract.removeRecipient(recipient1.address, [removeSig1, removeSig2], 2)

      await expect(walletContract.removeRecipient(recipient1.address, [removeSig1, removeSig2], 2)).to.be.revertedWith(
        "Nonce already used"
      )
    })
  })
})
