# Coding Guidelines: JPYC Hackathon 2025

## General Policy

- **Language**: Output in clear, natural Japanese unless specified otherwise.
- **Process**: Use step-by-step reasoning for complex tasks.
- **Activation**: Always activate the project.
- **Onboarding**: Ensure onboarding is performed.

## Development Philosophy

- **Quality**: Balance working code with quality, maintainability, and safety.
- **Boy Scout Rule**: Leave code better than you found it.
- **TDD**: Follow t-wada's TDD principles.

## Error Handling

- **Resolve All**: Fix even seemingly unrelated errors.
- **No Suppression**: Do not use `@ts-ignore` or empty `try-catch` blocks. Fix root causes.
- **Early Detection**: Fail fast with clear messages.
- **Testing**: Cover error cases in tests.
- **Resilience**: Assume external APIs/networks will fail.

## Code Quality

- **DRY**: Single source of truth.
- **Naming**: Intent-revealing names.
- **Consistency**: Maintain project-wide style.
- **Broken Windows**: Fix small issues immediately.
- **Comments**: Explain "Why", not "What".

## Testing Discipline

- **No Skips**: Fix broken tests, don't skip them.
- **Behavior**: Test behavior, not implementation details.
- **Independence**: Tests must be order-independent.
- **Speed/Determinism**: Fast and deterministic tests.

## Security

- **Secrets**: Use environment variables (NO hardcoding).
- **Validation**: Validate all external inputs.
- **Least Privilege**: Minimal permissions.

## Git Workflow

- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
- **Atomic Commits**: Focus on a single change.
- **Messages**: Clear, descriptive messages in **English**.

## Tech Stack Specifics

- **Frontend**: Next.js (App Router), Tailwind CSS.
- **Contracts**: Hardhat, Solidity.
- **Auth/Web3**: Privy, Biconomy, Semaphore.
