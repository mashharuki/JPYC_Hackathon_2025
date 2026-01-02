# Project Summary: Innocence Ledger

## Overview
**Innocence Ledger** is a transparent support platform for false accusation victims, leveraging blockchain and stablecoins to ensure traceability and trust in donations. The project aims to solve the lack of transparency in current support systems and provide a global, reliable funding infrastructure.

## Core Concept
- **Transparency**: On-chain visualization of fund usage.
- **Trust**: Code-based trust rather than organization-based.
- **Global Access**: Borderless donation and support.
- **Privacy**: Option for anonymous or real-name participation using Zero-Knowledge Proofs (Semaphore).

## Tech Stack

### Monorepo Structure
- **Manager**: Yarn Workspaces (Berry/v4)
- **Root**: `/Users/harukikondo/git/JPYC_Hackathon_2025`

### Smart Contracts (`pkgs/contracts`)
- **Framework**: Hardhat
- **Language**: Solidity (^0.8.23), TypeScript
- **Key Contracts**:
  - `Feedback.sol`: Implements Semaphore protocol for anonymous feedback/voting. Manages group creation, membership, and proof verification.
- **Libraries**:
  - `@semaphore-protocol/contracts`: Privacy layer.
  - `poseidon-solidity`: Hashing for ZK proofs.
- **Network**: Base Sepolia (Target)

### Web App (`pkgs/web-app`)
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Radix UI, `clsx`, `tailwind-merge`
- **Authentication & Wallet**:
  - **Privy** (`@privy-io/react-auth`): Social login and embedded wallet management.
  - **Biconomy** (`@biconomy/account`): Account Abstraction (ERC-4337) for gasless transactions and batched operations.
- **Privacy/Identity**:
  - **Semaphore** (`@semaphore-protocol/*`): Client-side identity generation and proof creation.
- **Backend/Database**:
  - **Supabase**: Database and likely storage/auth extension.
- **Testing**: Jest, React Testing Library.

## Current Implementation Status
- **Contracts**: Basic `Feedback` contract implemented with Semaphore integration. Deployment scripts target Base Sepolia.
- **Frontend**:
  - Next.js app structure set up with App Router.
  - Authentication provider (`AuthProvider`) implemented using Privy.
  - Contexts for Semaphore (`SemaphoreContext`) and Logging (`LogContext`) exist.
  - UI components (`Stepper`, `Auth`, `PageContainer`) and basic layout are in place.
  - Supabase integration initialized (`supabase/migrations`).

## Key Directories
- `pkgs/contracts`: Smart contract development environment.
- `pkgs/web-app`: Frontend application.
- `docs`: Project documentation and requirements (`idea.md`).
