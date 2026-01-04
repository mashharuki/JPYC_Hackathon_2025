//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title InnocentSupportWallet
 * @dev MultiSig Wallet による資金管理、受取人ホワイトリスト管理、引き出し機能
 * @notice 冤罪被害者への透明性のある支援インフラのコアコントラクト
 */
contract InnocentSupportWallet is EIP712 {
  using ECDSA for bytes32;

  // ===== State Variables =====

  /// @dev MultiSig Owner のアドレス配列（弁護士・親族の2人）
  address[] private _owners;

  /// @dev Owner 判定用マッピング
  mapping(address => bool) private _isOwner;

  /// @dev 受取人ホワイトリスト
  mapping(address => bool) private _isWhitelisted;

  /// @dev 署名リプレイ攻撃防止用 nonce（使用済みフラグ）
  mapping(uint256 => bool) private _usedNonces;

  /// @dev JPYC ERC20 コントラクトアドレス
  address public jpycTokenAddress;

  // ===== Events =====

  /// @dev 受取人がホワイトリストに追加された
  event RecipientAdded(address indexed recipient, uint256 timestamp);

  /// @dev 受取人がホワイトリストから削除された
  event RecipientRemoved(address indexed recipient, uint256 timestamp);

  /// @dev 引き出しが実行された
  event WithdrawalExecuted(address indexed recipient, uint256 amount, uint256 timestamp);

  // ===== Constructor =====

  /**
   * @dev コンストラクタ
   * @param owners_ MultiSig Owner の配列（必ず2人）
   * @param jpycTokenAddress_ JPYC ERC20 トークンアドレス
   */
  constructor(address[] memory owners_, address jpycTokenAddress_) EIP712("InnocentSupportWallet", "1") {
    // Owners は必ず2人であることを検証
    require(owners_.length == 2, "Must have exactly 2 owners");

    // JPYC トークンアドレスが zero address でないことを検証
    require(jpycTokenAddress_ != address(0), "Invalid JPYC token address");

    // Owners を初期化
    for (uint256 i = 0; i < owners_.length; i++) {
      address owner = owners_[i];

      // Owner アドレスが zero address でないことを検証
      require(owner != address(0), "Invalid owner address");

      // Owner アドレスの重複を検証
      require(!_isOwner[owner], "Duplicate owner address");

      _owners.push(owner);
      _isOwner[owner] = true;
    }

    jpycTokenAddress = jpycTokenAddress_;
  }

  // ===== Public / External View Functions =====

  /**
   * @dev アドレスが Owner であるかを確認
   * @param account 確認するアドレス
   * @return bool Owner である場合 true
   */
  function isOwner(address account) public view returns (bool) {
    return _isOwner[account];
  }

  /**
   * @dev アドレスがホワイトリストに含まれるかを確認
   * @param recipient 確認するアドレス
   * @return bool ホワイトリストに含まれる場合 true
   */
  function isWhitelisted(address recipient) public view returns (bool) {
    return _isWhitelisted[recipient];
  }

  /**
   * @dev nonce が使用済みであるかを確認
   * @param nonce 確認する nonce
   * @return bool 使用済みの場合 true
   */
  function isNonceUsed(uint256 nonce) public view returns (bool) {
    return _usedNonces[nonce];
  }

  /**
   * @dev Owners の配列を取得
   * @return address[] Owners の配列
   */
  function getOwners() public view returns (address[] memory) {
    return _owners;
  }
}
