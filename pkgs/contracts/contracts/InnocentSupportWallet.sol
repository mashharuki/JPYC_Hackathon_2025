//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
   * @dev JPYC トークン残高を取得
   * @return uint256 コントラクトの JPYC 残高
   */
  function getJPYCBalance() public view returns (uint256) {
    return IERC20(jpycTokenAddress).balanceOf(address(this));
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

  // ===== Public / External Functions =====

  /**
   * @dev 受取人をホワイトリストに追加（2署名検証）
   * @param recipient 追加する受取人アドレス
   * @param signatures Owner の署名配列（必ず2つ）
   * @param nonce リプレイ攻撃防止用の nonce
   */
  function addRecipient(address recipient, bytes[] memory signatures, uint256 nonce) external {
    // 受取人アドレスが zero address でないことを検証
    require(recipient != address(0), "Invalid recipient address");

    // 署名は必ず2つであることを検証
    require(signatures.length == 2, "Must provide exactly 2 signatures");

    // nonce が未使用であることを確認
    require(!_usedNonces[nonce], "Nonce already used");

    // EIP-712 型付きデータのハッシュを生成
    bytes32 structHash = keccak256(
      abi.encode(keccak256("AddRecipient(address recipient,uint256 nonce)"), recipient, nonce)
    );
    bytes32 digest = _hashTypedDataV4(structHash);

    // 署名から署名者アドレスを復元
    address signer1 = ECDSA.recover(digest, signatures[0]);
    address signer2 = ECDSA.recover(digest, signatures[1]);

    // 両方の署名者が Owner であることを検証
    require(_isOwner[signer1], "Invalid signer: not an owner");
    require(_isOwner[signer2], "Invalid signer: not an owner");

    // 署名者が重複していないことを検証
    require(signer1 != signer2, "Duplicate signer");

    // 署名者の順序を固定し、署名の重複を防止
    require(signer1 < signer2, "Invalid signer order");

    // nonce を使用済みとしてマーク
    _usedNonces[nonce] = true;

    // ホワイトリストに受取人を追加
    _isWhitelisted[recipient] = true;

    // イベントを発行
    emit RecipientAdded(recipient, block.timestamp);
  }

  /**
   * @dev 受取人をホワイトリストから削除（2署名検証）
   * @param recipient 削除する受取人アドレス
   * @param signatures Owner の署名配列（必ず2つ）
   * @param nonce リプレイ攻撃防止用の nonce
   */
  function removeRecipient(address recipient, bytes[] memory signatures, uint256 nonce) external {
    require(recipient != address(0), "Invalid recipient address");
    require(signatures.length == 2, "Must provide exactly 2 signatures");
    require(!_usedNonces[nonce], "Nonce already used");

    bytes32 structHash = keccak256(
      abi.encode(keccak256("RemoveRecipient(address recipient,uint256 nonce)"), recipient, nonce)
    );
    bytes32 digest = _hashTypedDataV4(structHash);

    address signer1 = ECDSA.recover(digest, signatures[0]);
    address signer2 = ECDSA.recover(digest, signatures[1]);

    require(_isOwner[signer1], "Invalid signer: not an owner");
    require(_isOwner[signer2], "Invalid signer: not an owner");
    require(signer1 != signer2, "Duplicate signer");
    require(signer1 < signer2, "Invalid signer order");

    _usedNonces[nonce] = true;
    _isWhitelisted[recipient] = false;

    emit RecipientRemoved(recipient, block.timestamp);
  }

  /**
   * @dev ホワイトリスト済みアドレスによる引き出し
   * @param recipient 送金先アドレス
   * @param amount 引き出し額
   */
  function withdraw(address recipient, uint256 amount) external {
    require(_isWhitelisted[msg.sender], "Caller not whitelisted");

    IERC20 jpycToken = IERC20(jpycTokenAddress);
    uint256 balance = jpycToken.balanceOf(address(this));
    require(balance >= amount, "Insufficient JPYC balance");

    bool success = jpycToken.transfer(recipient, amount);
    require(success, "JPYC transfer failed");

    emit WithdrawalExecuted(recipient, amount, block.timestamp);
  }
}
