//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockJPYC
 * @dev テスト用のJPYC互換トークン
 */
contract MockJPYC is ERC20 {
  constructor() ERC20("Mock JPYC", "JPYC") {}

  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }
}
