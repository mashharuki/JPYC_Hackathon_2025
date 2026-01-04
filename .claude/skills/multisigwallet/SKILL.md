# Claude Code MultiSig Wallet Skill (Final README)

## Overview

**Claude Code MultiSig Wallet Skill** is a production‑ready Skill for Claude Code that assists in **safe, structured, and verifiable transaction preparation** for **Solidity‑based MultiSig Wallets**.

This Skill is designed for teams that **do not use Safe**, and instead operate a **custom Solidity MultiSig** inspired by:

* solidity‑by‑example.org MultiSig Wallet (on‑chain approval model)
* MinimalMultisig (off‑chain EIP‑712 signature verification)

The Skill acts as a **cryptographic safety layer** between humans and irreversible smart‑contract execution.

---

## Key Value Proposition

* 🧠 Natural language → structured MultiSig transaction proposals
* 🔐 Zero secret handling (no private keys, no signatures)
* ✍️ EIP‑712 typed‑data generation (viem compatible)
* 🚨 Strong safety & ambiguity detection
* 📜 Human‑readable explanation of what is being signed

This Skill is **vendor‑neutral**, **Safe‑independent**, and suitable for **DAO treasuries, protocol ops, and internal finance workflows**.

---

## Supported Smart Contract Model

This Skill assumes a Solidity MultiSig Wallet with the following properties:

* Fixed `owners: address[]`
* Execution `threshold`
* Transaction defined by:

  * `to: address`
  * `value: uint256`
  * `data: bytes`
  * `nonce: uint256`
* Execution function that:

  * verifies EIP‑712 off‑chain signatures
  * recovers signer addresses via ECDSA
  * checks recovered signers ∈ owners
  * enforces `signatures >= threshold`
  * prevents replay via nonce

> ⚠️ The Skill does **not** assume Safe, delegate calls, modules, or guard contracts.

---

## Out of Scope (Explicitly Not Supported)

This Skill will **never**:

* Generate, store, or request private keys
* Generate or manipulate signatures
* Execute transactions on‑chain
* Assume missing parameters
* Auto‑approve or auto‑execute anything

It is intentionally **read‑only and proposal‑only**.

---

## viem‑First Design

This Skill is designed **exclusively** for viem‑based workflows:

* `signTypedData` compatible EIP‑712 output
* BigInt‑safe value handling
* No ethers.js APIs or assumptions

---

## Supported Use Cases

* DAO treasury payments
* Protocol operations (admin calls, upgrades)
* Vendor / contributor payouts
* Multi‑owner contract interactions
* Educational or audit‑friendly MultiSig usage

---

## Core Capabilities

### 1. Transaction Proposal Generation

From natural language, the Skill produces a fully structured transaction:

* destination (`to`)
* ETH value (`value`)
* calldata (`data`)
* nonce (`nonce`)

---

### 2. EIP‑712 Typed Data Generation

The Skill generates **typed data only**, suitable for viem `signTypedData`:

* domain
* types
* primaryType
* message

> No signatures are ever generated or handled.

---

### 3. MultiSig Configuration Validation

The Skill validates:

* `threshold <= owners.length`
* required signature count
* nonce presence
* logical consistency

---

### 4. Mandatory Safety Warnings

The Skill automatically warns when:

* ETH value exceeds 20% of known treasury balance
* ETH is sent to a contract with empty calldata
* calldata exists alongside non‑zero ETH value
* the transaction performs no meaningful action

---

### 5. Human‑Readable Execution Explanation

Before execution, the Skill explains:

* exactly what owners are signing
* what will happen if executed
* what conditions are still missing

---

## Input Example (Natural Language)

```
Send 5 ETH from the MultiSig to 0xVendor...
Use off‑chain signatures
Nonce is 12
```

---

## Output Example (Strict JSON)

```json
{
  "contractType": "Solidity MultiSig + EIP712",
  "chainId": 1,
  "contractAddress": "0xYourMultiSig",
  "transaction": {
    "to": "0xVendor...",
    "value": "5000000000000000000",
    "data": "0x",
    "nonce": "12"
  },
  "eip712": {
    "domain": {
      "name": "MultiSigWallet",
      "version": "1",
      "chainId": 1,
      "verifyingContract": "0xYourMultiSig"
    },
    "primaryType": "TxRequest",
    "types": {
      "TxRequest": [
        { "name": "to", "type": "address" },
        { "name": "value", "type": "uint256" },
        { "name": "data", "type": "bytes" },
        { "name": "nonce", "type": "uint256" }
      ]
    },
    "message": {
      "to": "0xVendor...",
      "value": "5000000000000000000",
      "data": "0x",
      "nonce": "12"
    }
  },
  "threshold": 3,
  "owners": ["0xOwnerA", "0xOwnerB", "0xOwnerC"],
  "signaturesRequired": 3,
  "warnings": [],
  "nextSteps": [
    "Distribute typed data to owners",
    "Collect signatures off‑chain",
    "Call executeTransaction with signatures"
  ]
}
```

---

## Claude Code System Prompt

This Skill is powered by a **strict System Prompt** that enforces:

* zero secret handling
* ambiguity‑first stopping behavior
* viem compatibility
* Solidity‑accurate mental model

> See `SYSTEM_PROMPT.md` for the full definition.

---

## Security Model

* AI never touches secrets
* Humans retain full signing authority
* Smart contract enforces final correctness
* AI acts as a deterministic safety layer

This separation is **intentional and non‑negotiable**.

---

## Comparison with Safe

| Feature           | This Skill | Safe       |
| ----------------- | ---------- | ---------- |
| Custom Solidity   | ✅          | ❌          |
| EIP‑712 Off‑chain | ✅          | ⚠️ Limited |
| Lightweight       | ✅          | ❌          |
| AI‑first          | ✅          | ❌          |
| Modules / Guards  | ❌          | ✅          |

---

## Ideal Users

* Protocol teams with custom admin contracts
* DAOs avoiding Safe dependency
* Security‑conscious engineering teams
* AI‑assisted DevOps workflows

---

## License

MIT License

---

## references

### Sample Code(Solidity)

./references/solidity

### Sample Code(TypeScript)

./references/typescript

---

## Disclaimer

This Skill provides **assistance only**.

All signing and execution decisions remain the responsibility of the users.

Smart contracts are immutable.
AI is fallible.

Always verify before signing.
