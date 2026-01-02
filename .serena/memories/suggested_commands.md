# Suggested Commands

## Root Directory
- `yarn dev`: Start development servers for both contracts (local node) and web app.
- `yarn lint`: Run linting across all workspaces.
- `yarn prettier`: Check code formatting.
- `yarn prettier:write`: Fix code formatting.

## Contracts (`pkgs/contracts`)
- `yarn workspace monorepo-ethers-contracts compile`: Compile smart contracts.
- `yarn workspace monorepo-ethers-contracts deploy`: Deploy contracts to the configured network (default: localhost).
- `yarn workspace monorepo-ethers-contracts test`: Run smart contract tests.
- `yarn workspace monorepo-ethers-contracts test:coverage`: Generate test coverage report.
- `yarn workspace monorepo-ethers-contracts lint`: Run ESLint and Solhint.

## Web App (`pkgs/web-app`)
- `yarn workspace monorepo-ethers-web-app dev`: Start the Next.js development server.
- `yarn workspace monorepo-ethers-web-app build`: Build the application for production.
- `yarn workspace monorepo-ethers-web-app lint`: Run Next.js linter.
- `yarn workspace monorepo-ethers-web-app test`: Run Jest tests.
- `yarn workspace monorepo-ethers-web-app test:watch`: Run Jest tests in watch mode.

## System Utilities (Darwin)
- `ls -la`: List files with details.
- `grep -r "pattern" .`: Search for text in files.
- `find . -name "filename"`: Find files by name.
