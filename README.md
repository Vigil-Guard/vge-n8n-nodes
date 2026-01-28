# n8n-nodes-vge

![n8n version](https://img.shields.io/badge/n8n-%3E%3D1.0.0-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.10-green)
![License](https://img.shields.io/badge/license-MIT-blue)

n8n community node for **Vigil Guard Enterprise** - AI Detection & Response (AIDR) for LLM security.

Protect your AI workflows from prompt injection attacks, PII leakage, harmful content, and policy violations with multi-language support.

> **Note:** Vigil Guard Enterprise is a **self-hosted solution**. There is no public cloud API. You must deploy VGE on your own infrastructure before using this node.

## Overview

The **VGE AIDR** node acts as a security gateway for LLM workflows, providing real-time protection for both inputs and outputs. Deploy it as a guard before your AI agent to filter malicious prompts, and after your AI agent to prevent sensitive data leakage and harmful content.

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Chat Trigger │───►│  VGE AIDR    │───►│  AI Agent    │───►│  VGE AIDR    │───►│   Response   │
│              │    │ (Input Guard)│    │  (OpenAI)    │    │(Output Guard)│    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                           │                                       │
                           │       VGE Detection Pipeline:         │
                           │  • Prompt injection attacks           │
                           │  • Content moderation (18 categories) │
                           │  • PII detection & redaction          │
                           │  • Policy enforcement                 │
                           └───────────────────────────────────────┘
```

## Detection Capabilities

### Prompt Injection Detection
Multi-layer detection using heuristics, semantic analysis, and LLM-based classification to identify and block prompt injection attacks, jailbreak attempts, and manipulation techniques.

### Content Moderation
Real-time content moderation with 18 detection categories across 8 languages (EN, PL, FR, ES, IT, PT, TR, RU):

| Category | Description |
|----------|-------------|
| Hate Speech | Content promoting hatred against protected groups |
| Violence | Content depicting or promoting physical violence |
| Sexual Content | Explicit or sexually suggestive material |
| Self-Harm | Content promoting self-harm or suicide |
| Toxicity | Hostile, aggressive, or inflammatory content |
| Severe Toxicity | Extremely harmful or dangerous content |
| Insult | Personal attacks and demeaning language |
| Vulgar | Profane or obscene language |
| Crime | Content promoting illegal activities |

### PII Detection & Redaction
Automatic detection and redaction of Personal Identifiable Information:

| PII Type | Examples |
|----------|----------|
| Email | jan.kowalski@firma.pl → `[EMAIL]` |
| Phone | +48 123 456 789 → `[PHONE]` |
| Credit Card | 4111-1111-1111-1111 → `[CREDIT_CARD]` |
| National ID | PESEL, NIP, SSN → `[ID]` |
| Names | Personal names → `[PERSON]` |
| Addresses | Physical addresses → `[ADDRESS]` |

### Policy Enforcement
Configurable rules engine for custom security policies with per-category actions (ALLOW, BLOCK, LOG).

## Features

- **Dual Protection** - Guard both inputs (before LLM) and outputs (after LLM)
- **Multi-Language Support** - Content moderation in 8 languages
- **Automatic Text Processing** - Returns `guardedText` based on detection decision
- **PII Redaction** - Automatic sanitization of sensitive data
- **Fail-Safe Design** - Configurable fail-open behavior prevents workflow disruption
- **Passthrough Fields** - Preserve session context and custom fields across nodes
- **Full Response Details** - Optional access to all detection branch results

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Navigate to **Settings** > **Community Nodes**
3. Search for `n8n-nodes-vge`
4. Click **Install**
5. Restart n8n if prompted

### Manual Installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-vge
```

Then restart n8n.

### Docker Development

Mount the package as a custom node for local development:

```yaml
# docker-compose.yml
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/custom-nodes
    extra_hosts:
      - "api.vigilguard:host-gateway"
    volumes:
      - n8n_data:/home/node/.n8n
      - /path/to/VGE-n8n:/home/node/custom-nodes/n8n-nodes-vge:ro
```

## Configuration

### Step 1: Add VGE API Credentials

1. Go to **Settings** > **Credentials**
2. Click **Add Credential**
3. Search for **VGE API**
4. Enter your credentials:

| Field | Description | Example |
|-------|-------------|---------|
| API Key | Your VGE API key | `vg_live_abc123...` or `vg_test_xyz789...` |
| Base URL | Your VGE instance URL | `https://api.vigilguard.yourdomain.com` |
| Skip SSL Verification | Whether to skip SSL verification (self-signed only) | `false` |

### Step 2: Add VGE AIDR Node

Drag the **VGE AIDR** node into your workflow and configure the parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| Stream Direction | `Input (Before LLM)` or `Output (After LLM)` | Input |
| Text | The text to analyze | `{{ $json.chatInput }}` |
| Original Prompt | For output mode - helps detect context manipulation | - |
| Passthrough Fields | Comma-separated fields to preserve | `sessionId,action` |

### Advanced Options

| Option | Default | Description |
|--------|---------|-------------|
| Timeout | 5000ms | Request timeout in milliseconds |
| Fail Open | true | On API error, continue with original text |
| Include Full Response | false | Include all detection branch details |
| Custom Metadata | `{}` | Additional metadata for logging/audit |

## TLS and Certificates (Self-Hosted)

For self-hosted VGE, use a valid TLS certificate and keep SSL verification enabled.

**Recommended approach:**
- Issue a certificate for your VGE hostname (FQDN) using a trusted CA or your own internal CA.
- Ensure the certificate includes the correct SAN (hostname or IP).
- Install your CA certificate in the system trust store on the host and inside containers that call VGE.
- For Node.js, you can also set `NODE_EXTRA_CA_CERTS` to point to your CA file inside the container.

**Emergency option only:**
The **Skip SSL Verification** credential setting disables certificate checks. Use it only as a temporary workaround when you cannot install a proper certificate. It increases MITM risk and should not be used in production.

## Output Data

The node outputs a single item with detection results:

```json
{
  "sessionId": "abc-123",
  "action": "chat",
  "guardedText": "The processed text based on decision",
  "vgDecision": "ALLOWED",
  "vgScore": 15,
  "vgThreatLevel": "LOW",
  "vgCategories": ["PROMPT_INJECTION", "TOXICITY"],
  "vgRequestId": "550e8400-e29b-41d4-a716-446655440000",
  "vgLatencyMs": 45
}
```

### Understanding guardedText

The `guardedText` field contains different content depending on the detection decision:

| Decision | guardedText Contains | Use Case |
|----------|---------------------|----------|
| `ALLOWED` | Original text (unchanged) | Safe to process |
| `SANITIZED` | Redacted text with PII removed | Safe after cleanup |
| `BLOCKED` | Block message explaining rejection | Do not process |

### Additional Fields by Decision

**ALLOWED:**
- Standard fields only

**SANITIZED:**
- `vgOriginalText` - Original text before sanitization
- `vgRedactedText` - Text with PII markers (e.g., `[EMAIL]`, `[PHONE]`)
- `vgSanitizedText` - Alternative sanitized version

**BLOCKED:**
- `vgBlockMessage` - Human-readable block reason
- `vgOriginalText` - Original blocked text (for logging)

## Example Workflows

### Complete Input + Output Guard

Protect both user input and AI response:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Chat Trigger │───>│  VGE AIDR    │───>│  AI Agent    │───>│  VGE AIDR    │───>│   Response   │
│              │    │ (Input Mode) │    │  (OpenAI)    │    │(Output Mode) │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

**Input Guard Configuration:**
- Stream Direction: `Input (Before LLM)`
- Text: `{{ $json.chatInput }}`

**Output Guard Configuration:**
- Stream Direction: `Output (After LLM)`
- Text: `{{ $json.output }}`
- Original Prompt: `{{ $json.chatInput }}`

### Decision-Based Routing

Route workflow based on detection decision using an IF node:

```
                    ┌──────────────┐
                    │  VGE AIDR    │
                    └──────────────┘
                           │
                           v
                    ┌──────────────┐
                    │     IF       │
                    │ vgDecision   │
                    └──────────────┘
                      │    │    │
            ALLOWED   │    │    │  BLOCKED
                      v    │    v
               ┌──────┐    │  ┌──────────┐
               │Proceed│   │  │  Error   │
               │to LLM │    │  │ Response │
               └──────┘    │  └──────────┘
                           │
                     SANITIZED
                           v
                    ┌──────────────┐
                    │ Log Warning  │
                    │ Then Proceed │
                    └──────────────┘
```

**IF Node Conditions:**
- Branch 1 (ALLOWED): `{{ $json.vgDecision === "ALLOWED" }}`
- Branch 2 (SANITIZED): `{{ $json.vgDecision === "SANITIZED" }}`
- Branch 3 (BLOCKED): `{{ $json.vgDecision === "BLOCKED" }}`

## Error Handling

By default, the node uses **fail-open** behavior to prevent workflow disruption:

- On API timeout or errors, items pass through with original text
- Error details are included in the output for logging
- Set **Fail Open** to `false` to throw errors instead

**Fail-open output example:**

```json
{
  "guardedText": "original user text",
  "vgError": "Connection timeout",
  "vgFailOpen": true,
  "vgDecision": "ALLOWED"
}
```

## Development

### Build from Source

```bash
# Clone the repository
git clone https://github.com/vigilguard/n8n-nodes-vge.git
cd n8n-nodes-vge

# Install dependencies
npm install

# Build TypeScript
npm run build

# Copy icons to dist
npm run copy:icons

# Run linter
npm run lint
```

### Project Structure

```
n8n-nodes-vge/
├── nodes/
│   └── VgeAidr/
│       ├── VgeAidr.node.ts    # Main node implementation
│       └── vge.svg            # Node icon
├── credentials/
│   ├── VgeApi.credentials.ts  # API credentials
│   └── vge.svg                # Credential icon
├── index.ts
├── package.json
└── tsconfig.json
```

## Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | >= 18.10 |
| n8n | >= 1.0.0 |
| Vigil Guard Enterprise | Self-hosted instance required |

## Support

- [Report Issues](https://github.com/vigilguard/n8n-nodes-vge/issues)
- [Vigil Guard Documentation](https://docs.vigilguard.ai)
- [API Reference](https://docs.vigilguard.ai/api)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Vigil Guard Enterprise](https://vigilguard.ai)
- [API Documentation](https://docs.vigilguard.ai/api)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
