//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title MockSemaphoreVerifier
 * @dev テスト用のSemaphore Verifierモック
 * verifyProofの結果を制御可能にする
 */
contract MockSemaphoreVerifier {
  bool private _verificationResult;

  constructor() {
    _verificationResult = true; // デフォルトで検証成功
  }

  /**
   * @dev 検証結果を設定（テスト用）
   */
  function setVerificationResult(bool result) external {
    _verificationResult = result;
  }

  /**
   * @dev Semaphore Proof を検証（モック実装）
   * @param merkleTreeDepth Merkle Tree の深さ
   * @return 常に _verificationResult を返す
   */
  function verifyProof(
    uint256[2] calldata, // pA
    uint256[2][2] calldata, // pB
    uint256[2] calldata, // pC
    uint256[4] calldata, // publicSignals
    uint256 merkleTreeDepth
  ) external view returns (bool) {
    require(merkleTreeDepth > 0, "Invalid Merkle Tree depth");
    return _verificationResult;
  }
}
