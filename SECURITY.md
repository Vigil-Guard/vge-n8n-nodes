# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in `n8n-nodes-vge`, please report it responsibly.

**DO NOT** create a public GitHub issue for security vulnerabilities.

Email: **security@vigilguard.ai**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Resolution Target**: Within 30 days for critical issues

### Scope

- The `n8n-nodes-vge` community node package
- Credential handling and error sanitization logic

### Out of Scope

- Vigil Guard Enterprise API server (report separately)
- n8n platform vulnerabilities (report to n8n)
- Third-party dependencies (report to respective maintainers)

## Security Best Practices

1. **API Keys**: Store VGE API keys in n8n credentials, never in workflow parameters
2. **TLS**: Keep SSL verification enabled in production
3. **Fail-Open**: Understand that fail-open mode passes original text on API errors
4. **Updates**: Keep the node updated to the latest version
