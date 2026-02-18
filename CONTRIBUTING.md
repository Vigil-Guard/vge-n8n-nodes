# Contributing to n8n-nodes-vge

Thank you for your interest in contributing to the VGE AIDR node for n8n.

## Getting Started

```bash
git clone https://github.com/Vigil-Guard/n8n-nodes-vge.git
cd n8n-nodes-vge
npm install
npm run build
```

## Development

```bash
npm run dev       # Watch mode (TypeScript)
npm run lint      # Run ESLint
npm run lint:fix  # Auto-fix lint issues
npm run format    # Format with Prettier
```

### Testing with n8n

Mount the built package as a custom node:

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/custom-nodes
    volumes:
      - /path/to/n8n-nodes-vge:/home/node/custom-nodes/n8n-nodes-vge:ro
```

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Build and lint before committing
4. Submit a pull request against `main`

### Pull Request Guidelines

- One feature or fix per PR
- Follow existing code style (ESLint + Prettier enforced)
- Update CHANGELOG.md under `[Unreleased]`

## Reporting Bugs

Open a [GitHub issue](https://github.com/Vigil-Guard/n8n-nodes-vge/issues) with:
- n8n version
- Node version
- Steps to reproduce
- Expected vs actual behavior

For security vulnerabilities, see [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
