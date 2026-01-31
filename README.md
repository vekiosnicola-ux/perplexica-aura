# Perplexica-Aura

> Perplexica integration for Aura - AI-powered search with sources and citations

## Overview

This repository contains the **Aura-specific integration** for [Perplexica](https://github.com/ItzCrazyKns/Perplexica), an open-source AI-powered search engine.

## What This Is

- **Not a fork** of the original Perplexica (see upstream)
- **Aura integration layer** - MCP connectors and configuration
- **Docker Compose** for easy deployment
- **Unified research** through Aura MCP

## Quick Start

```bash
# Clone this repo
git clone https://github.com/vekiosnicola-ux/perplexica-aura.git
cd perplexica-aura

# Copy environment
cp config.example.toml config.toml

# Edit config.toml with your settings

# Start services
docker-compose up -d

# Access Perplexica
open http://localhost:3000
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Aura MCP Layer                     │
│  perplexica_search → perplexica-aura MCP        │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│              Perplexica-Aura                    │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  Web UI      │  │  API (:3001) │            │
│  │  (:3000)     │  │              │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│              SearXNG                            │
│        (Google, DuckDuckGo, Bing, etc.)        │
└─────────────────────────────────────────────────┘
```

## File Structure

```
perplexica-aura/
├── README.md                    # This file
├── config.example.toml          # Configuration template
├── docker-compose.yaml          # Docker services
├── services/
│   └── aura-mcp/               # Aura MCP connector
│       └── src/
│           └── connectors/
│               └── perplexica/
│                   └── index.ts
├── docs/
│   └── INTEGRATION.md          # Full documentation
└── .gitignore
```

## Configuration

### config.toml

```toml
[general]
# Perplexica instance name
instance_name = "Aura Perplexica"

[searxng]
# SearXNG endpoint (change if external)
endpoint = "http://searxng:8080"

[ai]
# Available AI models
models = ["ollama:llama3.1", "openai:gpt-4", "anthropic:claude-3"]

[api]
# API keys for external providers (optional)
openai_api_key = "${OPENAI_API_KEY}"
anthropic_api_key = "${ANTHROPIC_API_KEY}"
perplexity_api_key = "${PERPLEXITY_API_KEY}"
```

### Environment Variables

```bash
OPENAI_API_KEY=sk-...          # For OpenAI models
ANTHROPIC_API_KEY=sk-ant-...   # For Anthropic models  
PERPLEXITY_API_KEY=pplx-...    # For Perplexity models
SEARXNG_ENDPOINT=http://searxng:8080  # Default
```

## Usage

### Via Web UI

1. Open http://localhost:3000
2. Enter your query
3. Choose search mode:
   - **Web** - General web search
   - **Academic** - Research papers, arXiv
   - **Writing** - Content-focused search
   - **YouTube** - Video content

### Via Aura MCP

```typescript
// In Aura MCP
import { perplexicaTools, handlePerplexicaTool } from './connectors/perplexica';

// Search with Perplexica
const result = await handlePerplexicaTool('perplexica_search', {
  query: "Multi-agent AI orchestration best practices",
  mode: "web",
  focus: "internet"
});
```

### Via API

```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Aura orchestration system",
    "mode": "web",
    "focus": "internet"
  }'
```

## Integration with Aura

### Standalone (This Repo)

This repo contains everything to run Perplexica with Aura integration.

### Aura Monorepo Integration

```bash
# In Aura monorepo
cd services/
git clone https://github.com/vekiosnicola-ux/perplexica-aura.git perplexica
cd perplexica && docker-compose up -d
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Perplexica UI | 3000 | Web interface |
| Perplexica API | 3001 | REST API |
| SearXNG | 8080 | Metasearch backend |

## Development

### Adding New Search Modes

```typescript
// In services/aura-mcp/src/connectors/perplexica/index.ts
export const perplexicaTools = [
  {
    name: "perplexica_search",
    description: "AI-powered web search with sources and citations",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        mode: { type: "string", enum: ["web", "academic", "writing", "youtube"] },
        focus: { type: "string", enum: ["internet", "sources", "math", "code"] }
      },
      required: ["query"]
    }
  }
];
```

### Testing Integration

```bash
# Test API
curl http://localhost:3001/api/search?q=test

# Test MCP
curl http://localhost:3002/tools/perplexica_search \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

## Upstream

- **Perplexica Core**: https://github.com/ItzCrazyKns/Perplexica
- **SearXNG**: https://github.com/searxng/searxng

## License

MIT - See upstream repositories for core component licenses.

## Author

Nicola Vekios - [@vekiosnicola-ux](https://github.com/vekiosnicola-ux)
