// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

/**
 * @title AnonymousVoting
 * @notice Semaphoreを使用した匿名投票システム
 * @dev プライバシーを保持した投票と二重投票防止を実装
 */
contract AnonymousVoting {
    /// @notice Semaphoreコントラクトのインスタンス
    ISemaphore public semaphore;

    /// @notice 投票者グループのID
    uint256 public voterGroupId;

    /// @notice コントラクトのオーナー
    address public owner;

    /// @notice 提案の構造体
    struct Proposal {
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 deadline;
        bool active;
        mapping(uint256 => bool) hasVoted; // nullifier => voted
    }

    /// @notice 提案ID => 提案
    mapping(uint256 => Proposal) public proposals;

    /// @notice 次の提案ID
    uint256 public nextProposalId;

    /// Events
    event ProposalCreated(uint256 indexed proposalId, string description, uint256 deadline);
    event VoteCast(uint256 indexed proposalId, uint256 indexed nullifier, bool vote);
    event VoterAdded(uint256 indexed identityCommitment);

    /// Errors
    error Unauthorized();
    error ProposalNotActive();
    error ProposalExpired();
    error AlreadyVoted();
    error InvalidProposal();

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

        // 投票者グループを作成
        voterGroupId = semaphore.createGroup();
    }

    /**
     * @notice 投票者をグループに追加
     * @param identityCommitment 追加する投票者のアイデンティティコミットメント
     */
    function addVoter(uint256 identityCommitment) external onlyOwner {
        semaphore.addMember(voterGroupId, identityCommitment);
        emit VoterAdded(identityCommitment);
    }

    /**
     * @notice 複数の投票者を追加
     * @param identityCommitments 追加する投票者のコミットメント配列
     */
    function addVoters(uint256[] calldata identityCommitments) external onlyOwner {
        for (uint256 i = 0; i < identityCommitments.length; i++) {
            semaphore.addMember(voterGroupId, identityCommitments[i]);
            emit VoterAdded(identityCommitments[i]);
        }
    }

    /**
     * @notice 新しい提案を作成
     * @param description 提案の説明
     * @param votingPeriod 投票期間（秒）
     */
    function createProposal(
        string calldata description,
        uint256 votingPeriod
    ) external onlyOwner returns (uint256) {
        uint256 proposalId = nextProposalId++;
        Proposal storage proposal = proposals[proposalId];

        proposal.description = description;
        proposal.deadline = block.timestamp + votingPeriod;
        proposal.active = true;

        emit ProposalCreated(proposalId, description, proposal.deadline);

        return proposalId;
    }

    /**
     * @notice 匿名で投票
     * @param proposalId 投票する提案のID
     * @param vote 投票内容（true = 賛成, false = 反対）
     * @param proof Semaphore証明
     */
    function castVote(
        uint256 proposalId,
        bool vote,
        ISemaphore.SemaphoreProof calldata proof
    ) external {
        Proposal storage proposal = proposals[proposalId];

        // 提案が存在し、アクティブか確認
        if (!proposal.active) revert ProposalNotActive();
        if (block.timestamp > proposal.deadline) revert ProposalExpired();

        // Semaphore証明を検証
        semaphore.validateProof(voterGroupId, proof);

        // 二重投票チェック
        if (proposal.hasVoted[proof.nullifier]) revert AlreadyVoted();

        // 投票を記録
        proposal.hasVoted[proof.nullifier] = true;

        if (vote) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }

        emit VoteCast(proposalId, proof.nullifier, vote);
    }

    /**
     * @notice 提案を終了
     * @param proposalId 終了する提案のID
     */
    function endProposal(uint256 proposalId) external onlyOwner {
        Proposal storage proposal = proposals[proposalId];

        if (!proposal.active) revert InvalidProposal();

        proposal.active = false;
    }

    /**
     * @notice 提案の結果を取得
     * @param proposalId 提案のID
     * @return description 提案の説明
     * @return yesVotes 賛成票数
     * @return noVotes 反対票数
     * @return deadline 締切
     * @return active アクティブ状態
     */
    function getProposal(uint256 proposalId) external view returns (
        string memory description,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 deadline,
        bool active
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.description,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.deadline,
            proposal.active
        );
    }

    /**
     * @notice 特定のnullifierが投票済みか確認
     * @param proposalId 提案のID
     * @param nullifier 確認するnullifier
     * @return 投票済みの場合true
     */
    function hasVotedWithNullifier(
        uint256 proposalId,
        uint256 nullifier
    ) external view returns (bool) {
        return proposals[proposalId].hasVoted[nullifier];
    }
}
