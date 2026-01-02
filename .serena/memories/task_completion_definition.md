# Task Completion Definition

When a task is considered "done", the following checks should be performed:

1.  **Linting**: Run `yarn lint` to ensure no linting errors exist in the modified packages.
2.  **Formatting**: Run `yarn prettier` (or `yarn prettier:write`) to ensure code style consistency.
3.  **Testing**: 
    - If working on contracts: Run `yarn workspace monorepo-ethers-contracts test` and ensure all tests pass.
    - If working on the web app: Run `yarn workspace monorepo-ethers-web-app test` and ensure all tests pass.
    - Add new tests for new features or bug fixes.
4.  **Build**: Ensure the project builds successfully (`yarn build` for web app, `yarn compile` for contracts).
5.  **Cleanup**: Remove any temporary logs or unused code.
