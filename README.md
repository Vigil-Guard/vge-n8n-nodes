# n8n-nodes-vge

n8n community node for **Vigil Guard Enterprise** - AI Detection & Response (AIDR) for LLM security.

## Overview

This package provides the **VGE AIDR** node that acts as a security gateway for LLM workflows. It analyzes prompts and responses for:

- Prompt injection attacks
- PII (Personal Identifiable Information)
- Malicious content
- Policy violations

The node uses a **single-output architecture** with decision metadata, making it easy to integrate into any workflow.

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Chat Trigger │───►│  VGE AIDR    │───►│  AI Agent    │
│              │    │              │    │  (OpenAI)    │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    Output includes:
                    • guardedText (processed text)
                    • vgDecision (ALLOWED/SANITIZED/BLOCKED)
                    • vgScore, vgThreatLevel, etc.
```

## Installation

### Development (Docker)

Mount the package as a custom node in n8n:

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

### Community Nodes (Future)

Once published:

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Search for `n8n-nodes-vge`
4. Click **Install**

## Configuration

### 1. Add VGE API Credentials

1. Go to **Settings** → **Credentials**
2. Click **Add Credential**
3. Search for **VGE API**
4. Enter your API key and base URL

| Field | Description |
|-------|-------------|
| API Key | Your VGE API key (`vg_live_...` or `vg_test_...`) |
| Base URL | API endpoint (e.g., `https://api.vigilguard`) |

### 2. Add VGE AIDR Node to Workflow

Drag the **VGE AIDR** node into your workflow and configure:

| Parameter | Description |
|-----------|-------------|
| Stream Direction | `Input (Before LLM)` or `Output (After LLM)` |
| Text | The text to analyze (default: `{{ $json.chatInput }}`) |
| Original Prompt | For output mode - helps detect context manipulation |
| Passthrough Fields | Fields to preserve in output (default: `sessionId,action`) |

## Output Data

The node outputs a single item with the following fields:

```json
{
  "sessionId": "...",
  "action": "...",
  "guardedText": "The processed text based on decision",
  "vgDecision": "ALLOWED",
  "vgScore": 15,
  "vgThreatLevel": "LOW",
  "vgCategories": [],
  "vgRequestId": "uuid",
  "vgLatencyMs": 45
}
```

### guardedText Field

The `guardedText` field contains different content based on the decision:

| Decision | guardedText Contains |
|----------|---------------------|
| `ALLOWED` | Original text (unchanged) |
| `SANITIZED` | Redacted/sanitized text with PII removed |
| `BLOCKED` | Block message explaining why content was rejected |

### Decision-Specific Fields

**When SANITIZED:**
- `vgOriginalText` - The original text before sanitization
- `vgRedactedText` - Text with PII redacted (if applicable)
- `vgSanitizedText` - Alternative sanitized version (if applicable)

**When BLOCKED:**
- `vgBlockMessage` - The block message
- `vgOriginalText` - The original blocked text

## Options

| Option | Default | Description |
|--------|---------|-------------|
| Timeout | 30000ms | Request timeout |
| Fail Open | true | On error, continue with original text |
| Include Full Response | false | Include all detection branch details |
| Custom Metadata | `{}` | Additional metadata for logging |

## Error Handling

By default, the node uses **fail-open** behavior:

- On API errors, items pass through with original text
- Items include `vgError` and `vgFailOpen: true` fields
- Set **Fail Open** to `false` to throw errors instead

```json
{
  "guardedText": "original text",
  "vgError": "Connection timeout",
  "vgFailOpen": true,
  "vgDecision": "ALLOWED"
}
```

## Example Workflows

### Input Guard (Before LLM)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Chat Trigger │───►│  VGE AIDR    │───►│  AI Agent    │
│              │    │ (Input Mode) │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

Configure VGE AIDR:
- Stream Direction: `Input (Before LLM)`
- Text: `{{ $json.chatInput }}`

### Output Guard (After LLM)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  AI Agent    │───►│  VGE AIDR    │───►│   Response   │
│              │    │(Output Mode) │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

Configure VGE AIDR:
- Stream Direction: `Output (After LLM)`
- Text: `{{ $json.output }}`
- Original Prompt: `{{ $json.chatInput }}`

### Decision-Based Routing

Use an IF node after VGE AIDR to route based on decision:

```
                    ┌──────────────┐
                    │  VGE AIDR    │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │     IF       │
                    │ vgDecision   │
                    └──────────────┘
                      │    │    │
            ALLOWED   │    │    │  BLOCKED
                      ▼    │    ▼
               ┌──────┐    │  ┌──────┐
               │Proceed│   │  │Error │
               │      │    │  │Reply │
               └──────┘    │  └──────┘
                           │
                     SANITIZED
                           ▼
                    ┌──────────────┐
                    │ Log Warning  │
                    │ Then Proceed │
                    └──────────────┘
```

## Build & Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Copy icons
npm run copy:icons

# Lint
npm run lint
```

## Requirements

- Node.js >= 18.10
- n8n version 1.0.0 or later
- Vigil Guard Enterprise API access

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Vigil Guard Enterprise](https://vigilguard.ai)
- [API Documentation](https://docs.vigilguard.ai/api)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
