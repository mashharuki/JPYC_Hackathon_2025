// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

/**
 * @title BasicSemaphore
 * @notice 基本的なSemaphore統合の例
 * @dev このコントラクトはSemaphoreプロトコルの基本的な使い方を示します
 */
contract BasicSemaphore {
    /// @notice Semaphoreコントラクトのインスタンス
    ISemaphore public semaphore;

    /// @notice このコントラクトが管理するグループID
    uint256 public groupId;

    /// @notice コントラクトのオーナー
    address public owner;

    /// @notice 提出されたnullifierを追跡
    mapping(uint256 => bool) public usedNullifiers;

    /// @notice メッセージを記録（nullifier => message）
    mapping(uint256 => uint256) public messages;

    /// Events
    event MemberAdded(uint256 indexed identityCommitment);
    event ProofVerified(uint256 indexed nullifier, uint256 message);

    /// Errors
    error Unauthorized();
    error NullifierAlreadyUsed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    /**
     * @notice コントラクトを初期化
     * @param _semaphore デプロイ済みSemaphoreコントラクトのアドレス
     */
    constructor(ISemaphore _semaphore) {
        semaphore = _semaphore;
        owner = msg.sender;

        // 新しいグループを作成
        groupId = semaphore.createGroup();
    }

    /**
     * @notice グループにメンバーを追加
     * @param identityCommitment 追加するアイデンティティのコミットメント
     */
    function addMember(uint256 identityCommitment) external onlyOwner {
        semaphore.addMember(groupId, identityCommitment);
        emit MemberAdded(identityCommitment);
    }

    /**
     * @notice 複数のメンバーをグループに追加
     * @param identityCommitments 追加するアイデンティティのコミットメント配列
     */
    function addMembers(uint256[] calldata identityCommitments) external onlyOwner {
        for (uint256 i = 0; i < identityCommitments.length; i++) {
            semaphore.addMember(groupId, identityCommitments[i]);
            emit MemberAdded(identityCommitments[i]);
        }
    }

    /**
     * @notice グループからメンバーを削除
     * @param identityCommitment 削除するアイデンティティのコミットメント
     * @param proofSiblings マークル証明の兄弟ノード
     * @param proofPathIndices マークル証明のパスインデックス
     */
    function removeMember(
        uint256 identityCommitment,
        uint256[] calldata proofSiblings,
        uint256[] calldata proofPathIndices
    ) external onlyOwner {
        semaphore.removeMember(groupId, identityCommitment, proofSiblings, proofPathIndices);
    }

    /**
     * @notice 証明を検証してメッセージを記録
     * @param message 送信するメッセージ
     * @param proof Semaphore証明
     */
    function submitMessage(
        uint256 message,
        ISemaphore.SemaphoreProof calldata proof
    ) external {
        // 証明を検証（グループメンバーシップと二重使用をチェック）
        semaphore.validateProof(groupId, proof);

        // nullifierが既に使用されていないか確認
        if (usedNullifiers[proof.nullifier]) {
            revert NullifierAlreadyUsed();
        }

        // メッセージを記録
        messages[proof.nullifier] = message;
        usedNullifiers[proof.nullifier] = true;

        emit ProofVerified(proof.nullifier, message);
    }

    /**
     * @notice メッセージを取得
     * @param nullifier 取得するメッセージのnullifier
     * @return 記録されたメッセージ
     */
    function getMessage(uint256 nullifier) external view returns (uint256) {
        return messages[nullifier];
    }
}
