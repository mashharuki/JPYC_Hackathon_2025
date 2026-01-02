# Coding Guidelines

## General Principles
- **Language**: Use clear and natural Japanese for communication unless specified otherwise.
- **TDD**: Follow Test-Driven Development principles (Red-Green-Refactor).
- **Quality**: Adhere to DRY (Don't Repeat Yourself) and KISS (Keep It Simple, Stupid) principles.
- **Boy Scout Rule**: Leave the code better than you found it.

## Error Handling
- Fix root causes, do not suppress errors.
- Provide clear error messages.
- Cover error cases in tests.

## Security
- No hardcoded secrets (use environment variables).
- Validate all external inputs.
- Follow the principle of least privilege.

## Git Conventions
- **Commit Messages**: Use Conventional Commits (feat, fix, docs, test, refactor, chore).
- **Language**: Write commit messages in English.
- **Granularity**: Atomic commits focusing on single changes.

## Testing
- Do not skip tests.
- Test behavior, not implementation details.
- Ensure tests are independent and fast.

## Documentation
- Keep README and other docs updated.
- Document design decisions (ADR).
