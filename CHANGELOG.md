# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-28

### Added
- Initial release of VGE AIDR node for n8n
- Support for input stream (before LLM) and output stream (after LLM) guarding
- Passthrough fields functionality for preserving workflow data
- Fail-open error handling mode
- Full response inclusion option for debugging
- Custom metadata support for logging
- VGE API credential type with API key authentication
- URL validation to enforce HTTP/HTTPS protocols
- Text length validation (100KB limit)
- Error message sanitization for security

### Security
- Secure credential handling with password masking
- Error message sanitization to prevent credential leakage
- Base URL validation to prevent injection attacks
