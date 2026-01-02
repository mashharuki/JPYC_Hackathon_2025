# Suggested Commands

## Root Shortcuts
- `yarn dev`: Start development servers for both contracts (local node) and web app.
- `yarn lint`: Run linting across all workspaces.
- `yarn prettier:write`: Fix code formatting across all workspaces.

## Contracts (`pkgs/contracts`)
*Alias: `yarn contracts`*

- `yarn contracts compile`: Compile smart contracts.
- `yarn contracts test`: Run smart contract tests.
- `yarn contracts test:coverage`: Generate test coverage report.
- `yarn contracts deploy --network localhost`: Deploy to local Hardhat network.
- `yarn contracts deploy --semaphore <SEMAPHORE_ADDR> --network baseSepolia`: Deploy to Base Sepolia (Check README for latest address).
  - Example: `yarn contracts deploy --semaphore 0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D --network baseSepolia`

## Web App (`pkgs/web-app`)
*Alias: `yarn web-app`*

- `yarn web-app dev`: Start the Next.js development server.
- `yarn web-app build`: Build the application for production.
- `yarn web-app lint`: Run Next.js linter.
- `yarn web-app test`: Run Jest tests.

## Setup
- `yarn`: Install dependencies.
- `cp pkgs/contracts/.env.example pkgs/contracts/.env`: Setup contract env vars.
- `cp pkgs/web-app/.env.example pkgs/web-app/.env.local`: Setup web app env vars.
