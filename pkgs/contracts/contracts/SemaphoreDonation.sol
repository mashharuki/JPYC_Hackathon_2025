//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";

/**
 * @title SemaphoreDonation
 * @dev Semaphore 証明検証と JPYC 寄付を統合するコントラクト
 */
contract SemaphoreDonation {
  struct DonationRecord {
    uint256 nullifier;
    uint256 amount;
    uint256 timestamp;
    address walletAddress;
  }

  /// @dev Semaphore Verifier
  ISemaphoreVerifier public verifier;

  /// @dev JPYC ERC20
  IERC20 public jpycToken;

  /// @dev 寄付先 MultiSig Wallet
  address public walletAddress;

  /// @dev 寄付記録
  mapping(uint256 => DonationRecord) public donations;

  /// @dev nullifier の使用済み管理
  mapping(uint256 => bool) public usedNullifiers;

  /// @dev Semaphore 証明で使用する Merkle Tree 深さ
  uint256 public constant MERKLE_TREE_DEPTH = 20;

  /// @dev 寄付が記録された
  event DonationRecorded(uint256 indexed nullifier, address indexed walletAddress, uint256 amount, uint256 timestamp);

  /**
   * @dev コンストラクタ
   * @param verifierAddress Semaphore Verifier アドレス
   * @param jpycTokenAddress JPYC ERC20 トークンアドレス
   */
  constructor(address verifierAddress, address jpycTokenAddress, address walletAddress_) {
    require(verifierAddress != address(0), "Invalid verifier address");
    require(jpycTokenAddress != address(0), "Invalid JPYC token address");
    require(walletAddress_ != address(0), "Invalid wallet address");

    verifier = ISemaphoreVerifier(verifierAddress);
    jpycToken = IERC20(jpycTokenAddress);
    walletAddress = walletAddress_;
  }

  /**
   * @dev Semaphore 証明付き寄付
   * @param merkleTreeRoot Merkle Tree Root
   * @param nullifier nullifier
   * @param proof Semaphore proof (Groth16)
   * @param walletAddress_ 寄付先 MultiSig Wallet アドレス
   * @param amount 寄付額
   */
  function donateWithProof(
    uint256 merkleTreeRoot,
    uint256 nullifier,
    uint256[8] calldata proof,
    address walletAddress_,
    uint256 amount
  ) external {
    require(walletAddress_ == walletAddress, "Invalid wallet address");
    require(amount > 0, "Amount must be greater than 0");
    require(!usedNullifiers[nullifier], "Nullifier already used");

    bool isValid = verifier.verifyProof(
      [proof[0], proof[1]],
      [[proof[2], proof[3]], [proof[4], proof[5]]],
      [proof[6], proof[7]],
      [merkleTreeRoot, nullifier, _hash(amount), _hash(uint256(uint160(walletAddress_)))],
      MERKLE_TREE_DEPTH
    );
    require(isValid, "Invalid Semaphore proof");

    usedNullifiers[nullifier] = true;
    donations[nullifier] = DonationRecord({
      nullifier: nullifier,
      amount: amount,
      timestamp: block.timestamp,
      walletAddress: walletAddress_
    });

    bool success = jpycToken.transferFrom(msg.sender, walletAddress_, amount);
    require(success, "JPYC transfer failed");

    emit DonationRecorded(nullifier, walletAddress_, amount, block.timestamp);
  }

  function _hash(uint256 message) private pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked(message))) >> 8;
  }
}
