// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

/**
 * @title AnonymousAuth
 * @notice Semaphoreを使用した匿名認証システム
 * @dev アイデンティティを明かさずにグループメンバーシップを証明
 */
contract AnonymousAuth {
    /// @notice Semaphoreコントラクトのインスタンス
    ISemaphore public semaphore;

    /// @notice 認証されたメンバーのグループID
    uint256 public memberGroupId;

    /// @notice コントラクトのオーナー
    address public owner;

    /// @notice リソースアクセスの記録
    struct AccessRecord {
        uint256 timestamp;
        uint256 resourceId;
        bool granted;
    }

    /// @notice nullifier => アクセス記録の配列
    mapping(uint256 => AccessRecord[]) public accessHistory;

    /// @notice リソースごとのアクセス制御
    mapping(uint256 => bool) public resourceActive;

    /// @notice リソースごとの使用済みnullifier
    mapping(uint256 => mapping(uint256 => bool)) public usedNullifiers;

    /// Events
    event MemberAdded(uint256 indexed identityCommitment);
    event ResourceAccessed(uint256 indexed nullifier, uint256 indexed resourceId);
    event ResourceActivated(uint256 indexed resourceId);
    event ResourceDeactivated(uint256 indexed resourceId);

    /// Errors
    error Unauthorized();
    error ResourceNotActive();
    error AlreadyAccessed();
    error InvalidScope();

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

        // メンバーグループを作成
        memberGroupId = semaphore.createGroup();
    }

    /**
     * @notice 認証されたメンバーを追加
     * @param identityCommitment 追加するメンバーのアイデンティティコミットメント
     */
    function addMember(uint256 identityCommitment) external onlyOwner {
        semaphore.addMember(memberGroupId, identityCommitment);
        emit MemberAdded(identityCommitment);
    }

    /**
     * @notice 複数のメンバーを追加
     * @param identityCommitments 追加するメンバーのコミットメント配列
     */
    function addMembers(uint256[] calldata identityCommitments) external onlyOwner {
        for (uint256 i = 0; i < identityCommitments.length; i++) {
            semaphore.addMember(memberGroupId, identityCommitments[i]);
            emit MemberAdded(identityCommitments[i]);
        }
    }

    /**
     * @notice リソースをアクティブ化
     * @param resourceId アクティブ化するリソースのID
     */
    function activateResource(uint256 resourceId) external onlyOwner {
        resourceActive[resourceId] = true;
        emit ResourceActivated(resourceId);
    }

    /**
     * @notice リソースを非アクティブ化
     * @param resourceId 非アクティブ化するリソースのID
     */
    function deactivateResource(uint256 resourceId) external onlyOwner {
        resourceActive[resourceId] = false;
        emit ResourceDeactivated(resourceId);
    }

    /**
     * @notice 匿名でリソースにアクセス
     * @param resourceId アクセスするリソースのID
     * @param proof Semaphore証明（scopeはresourceIdと一致する必要がある）
     */
    function accessResource(
        uint256 resourceId,
        ISemaphore.SemaphoreProof calldata proof
    ) external {
        // リソースがアクティブか確認
        if (!resourceActive[resourceId]) revert ResourceNotActive();

        // スコープがリソースIDと一致するか確認
        if (proof.scope != resourceId) revert InvalidScope();

        // Semaphore証明を検証
        semaphore.validateProof(memberGroupId, proof);

        // このリソースに対して既にアクセスしていないか確認
        if (usedNullifiers[resourceId][proof.nullifier]) revert AlreadyAccessed();

        // アクセスを記録
        usedNullifiers[resourceId][proof.nullifier] = true;

        AccessRecord memory record = AccessRecord({
            timestamp: block.timestamp,
            resourceId: resourceId,
            granted: true
        });

        accessHistory[proof.nullifier].push(record);

        emit ResourceAccessed(proof.nullifier, resourceId);

        // ここで実際のリソースアクセス処理を実装
        // 例：NFTのミント、トークンの転送、特権機能の実行など
    }

    /**
     * @notice アクセス履歴を取得
     * @param nullifier 確認するnullifier
     * @return アクセス記録の配列
     */
    function getAccessHistory(uint256 nullifier)
        external
        view
        returns (AccessRecord[] memory)
    {
        return accessHistory[nullifier];
    }

    /**
     * @notice 特定のリソースに対するアクセス済みか確認
     * @param resourceId リソースID
     * @param nullifier 確認するnullifier
     * @return アクセス済みの場合true
     */
    function hasAccessedResource(
        uint256 resourceId,
        uint256 nullifier
    ) external view returns (bool) {
        return usedNullifiers[resourceId][nullifier];
    }
}
