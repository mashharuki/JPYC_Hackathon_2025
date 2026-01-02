# Task Completion Definition

When a task is considered "done", the following checks should be performed:

1.  **Linting**: Run `yarn lint` to ensure no linting errors exist in the modified packages.
2.  **Formatting**: Run `yarn prettier:write` to ensure code style consistency.
3.  **Testing**: 
    - If working on contracts: Run `yarn contracts test` and ensure all tests pass.
    - If working on the web app: Run `yarn web-app test` and ensure all tests pass.
    - **Requirement**: Add new tests for new features or bug fixes.
4.  **Build**: Ensure the project builds successfully.
    - Web App: `yarn web-app build`
    - Contracts: `yarn contracts compile`
5.  **Cleanup**: Remove any temporary logs or unused code.
6.  **Documentation**: Update README or docs if architectural changes were made.
