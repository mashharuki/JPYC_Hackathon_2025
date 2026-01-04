export const JPYC_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

export const SEMAPHORE_DONATION_ABI = [
  {
    inputs: [
      { name: "merkleTreeRoot", type: "uint256" },
      { name: "nullifier", type: "uint256" },
      { name: "proof", type: "uint256[8]" },
      { name: "walletAddress", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "donateWithProof",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

export const INNOCENT_SUPPORT_WALLET_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "isWhitelisted",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "recipient", type: "address" },
      { name: "signatures", type: "bytes[]" },
      { name: "nonce", type: "uint256" }
    ],
    name: "addRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const
