# Project Summary

## Overview
This project is a monorepo template for building decentralized applications (dApps) using the Semaphore protocol. It combines a Hardhat environment for smart contract development and a Next.js application for the frontend.

## Tech Stack

### Monorepo
- **Manager**: Yarn Workspaces (Berry/v4)

### Smart Contracts (`pkgs/contracts`)
- **Framework**: Hardhat
- **Language**: Solidity, TypeScript
- **Libraries**: 
  - @semaphore-protocol/contracts
  - Ethers.js v6
  - TypeChain
- **Testing**: Chai, Mocha, Hardhat Toolbox

### Web App (`pkgs/web-app`)
- **Framework**: Next.js 14 (App Router likely, given `src/app`)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, PostCSS, Radix UI
- **Authentication/Web3**: 
  - Privy (@privy-io/react-auth)
  - Biconomy
  - Ethers.js v6
  - Viem
  - Supabase
- **Testing**: Jest, React Testing Library

## Project Structure
- `pkgs/contracts`: Contains smart contracts, deployment scripts, and Hardhat configuration.
- `pkgs/web-app`: Contains the Next.js frontend application.
- `docs`: Documentation files.
