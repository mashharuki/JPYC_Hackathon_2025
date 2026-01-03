// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title JPYCIntegration
 * @dev JPYC トークンを使用した決済・送金機能のテンプレートコントラクト
 *
 * 主な機能:
 * - 決済処理（決済IDとトランザクションの紐付け）
 * - イベントベースの追跡
 * - セキュアな実装（ReentrancyGuard使用）
 */
contract JPYCIntegration is Ownable, ReentrancyGuard {
    // JPYCトークンコントラクト
    IERC20 public jpycToken;

    // 決済情報の構造体
    struct Payment {
        address from;
        address to;
        uint256 amount;
        string paymentId;
        uint256 timestamp;
        bool completed;
    }

    // 決済ID => 決済情報のマッピング
    mapping(string => Payment) public payments;

    // 決済履歴（アドレス別）
    mapping(address => string[]) public userPayments;

    // イベント
    event PaymentProcessed(
        address indexed from,
        address indexed to,
        uint256 amount,
        string paymentId,
        uint256 timestamp
    );

    event PaymentRefunded(
        string indexed paymentId,
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev コンストラクタ
     * @param _jpycToken JPYCトークンコントラクトのアドレス
     */
    constructor(address _jpycToken) Ownable(msg.sender) {
        require(_jpycToken != address(0), "Invalid JPYC token address");
        jpycToken = IERC20(_jpycToken);
    }

    /**
     * @dev 決済処理を実行
     * @param from 送金元アドレス
     * @param to 送金先アドレス
     * @param amount 送金額
     * @param paymentId 決済ID（ユニークである必要あり）
     *
     * 事前条件:
     * - fromがこのコントラクトに十分なapproveをしている必要あり
     * - paymentIdが未使用である必要あり
     */
    function processPayment(
        address from,
        address to,
        uint256 amount,
        string calldata paymentId
    ) external nonReentrant {
        require(from != address(0), "Invalid from address");
        require(to != address(0), "Invalid to address");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(paymentId).length > 0, "Payment ID required");
        require(!payments[paymentId].completed, "Payment ID already used");

        // JPYCトークンを送金元からこのコントラクトに転送
        require(
            jpycToken.transferFrom(from, to, amount),
            "Transfer failed"
        );

        // 決済情報を保存
        payments[paymentId] = Payment({
            from: from,
            to: to,
            amount: amount,
            paymentId: paymentId,
            timestamp: block.timestamp,
            completed: true
        });

        // ユーザーの決済履歴に追加
        userPayments[from].push(paymentId);
        userPayments[to].push(paymentId);

        // イベント発行
        emit PaymentProcessed(from, to, amount, paymentId, block.timestamp);
    }

    /**
     * @dev 決済の返金処理（管理者のみ）
     * @param paymentId 返金する決済のID
     */
    function refundPayment(string calldata paymentId) external onlyOwner nonReentrant {
        Payment storage payment = payments[paymentId];
        require(payment.completed, "Payment not found or already refunded");

        // 返金フラグを設定
        payment.completed = false;

        // JPYCトークンを返金（to -> from）
        require(
            jpycToken.transferFrom(payment.to, payment.from, payment.amount),
            "Refund transfer failed"
        );

        // イベント発行
        emit PaymentRefunded(paymentId, payment.from, payment.amount, block.timestamp);
    }

    /**
     * @dev ユーザーの決済履歴を取得
     * @param user ユーザーアドレス
     * @return ユーザーに関連する決済IDの配列
     */
    function getUserPayments(address user) external view returns (string[] memory) {
        return userPayments[user];
    }

    /**
     * @dev 決済情報を取得
     * @param paymentId 決済ID
     * @return Payment構造体
     */
    function getPayment(string calldata paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }

    /**
     * @dev 決済が完了しているか確認
     * @param paymentId 決済ID
     * @return 完了している場合true
     */
    function isPaymentCompleted(string calldata paymentId) external view returns (bool) {
        return payments[paymentId].completed;
    }

    /**
     * @dev JPYCトークンアドレスを更新（管理者のみ）
     * @param _jpycToken 新しいJPYCトークンアドレス
     */
    function updateJPYCToken(address _jpycToken) external onlyOwner {
        require(_jpycToken != address(0), "Invalid JPYC token address");
        jpycToken = IERC20(_jpycToken);
    }

    /**
     * @dev 緊急時のトークン回収（管理者のみ）
     * @param token 回収するトークンのアドレス
     * @param to 送金先アドレス
     * @param amount 回収額
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid to address");
        require(amount > 0, "Amount must be greater than 0");

        IERC20(token).transfer(to, amount);
    }
}
