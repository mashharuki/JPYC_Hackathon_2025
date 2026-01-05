//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

// Feedbackコントラクト: Semaphoreプロトコルを利用して、匿名でフィードバックを送信できるようにします。
contract Feedback {
  // Semaphoreメインコントラクトのインターフェース
  ISemaphore public semaphore;

  // このコントラクトで使用するSemaphoreグループのID
  uint256 public groupId;

  /**
   * コンストラクター
   */
  constructor(address semaphoreAddress) {
    semaphore = ISemaphore(semaphoreAddress);

    // 新しいSemaphoreグループを作成し、そのIDを保存します。
    groupId = semaphore.createGroup();
  }

  /**
   * @dev ユーザーをSemaphoreグループに追加します。
   * @param identityCommitment ユーザーの秘密のアイデンティティから生成された公開識別子。
   */
  function joinGroup(uint256 identityCommitment) external {
    semaphore.addMember(groupId, identityCommitment);
  }

  /**
   * @dev 匿名でフィードバックを送信します。
   * @param merkleTreeDepth メルクルツリーの深さ。
   * @param merkleTreeRoot メルクルツリーのルート（現在のグループの状態）。
   * @param nullifier 二重送信を防止するためのユニークな値。
   * @param feedback 送信するフィードバック内容（数値化されたもの）。
   * @param points ゼロ知識証明のデータ（zk-SNARKsの引数）。
   */
  function sendFeedback(
    uint256 merkleTreeDepth,
    uint256 merkleTreeRoot,
    uint256 nullifier,
    uint256 feedback,
    uint256[8] calldata points
  ) external {
    // Semaphoreの証明オブジェクトを作成
    ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof(
      merkleTreeDepth,
      merkleTreeRoot,
      nullifier,
      feedback,
      groupId,
      points
    );

    // 証明を検証します。正当なグループメンバーであり、かつ二重送信でないことを確認します。
    semaphore.validateProof(groupId, proof);
  }
}
