# Perplexica-Aura

> Perplexica integration for Aura - AI-powered search with sources and citations

## Quick Start

```bash
# Clone this repo
git clone https://github.com/vekiosnicola-ux/perplexica-aura.git
cd perplexica-aura

# Start Perplexica Docker
docker run -d \
  --name perplexica-aura \
  -p 3000:3000 \
  -p 3001:3001 \
  -p 8080:8080 \
  itzcrazykns1337/perplexica:latest

# Start API server (for Aura integration)
cd api-server
node simple.js &

# Or for full features:
npm install
node index.js
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search?q=...` | GET | Full search with sources |
| `/api/quick?q=...` | GET | Quick search (5 sources) |
| `/health` | GET | Health check |
| `/info` | GET | API info |

## Example Usage

```bash
# Quick search
curl "http://localhost:3002/api/quick?q=AI+orchestration"

# Full search
curl "http://localhost:3002/api/search?q=What+is+Aura+orchestration"
```

## Response Format

```json
{
  "query": "AI orchestration",
  "mode": "web",
  "answer": "...",
  "sources": [
    {"title": "Source Title", "url": "https://..."}
  ],
  "timestamp": "2026-01-31T..."
}
```

## Aura Integration

```typescript
import { perplexicaTools, handlePerplexicaTool } from './connectors/perplexica';

// In Aura MCP
const result = await handlePerplexicaTool('perplexica_search', {
  query: "Multi-agent AI orchestration",
  mode: "web"
});
```

## Architecture

```
User Query
    │
    ▼
┌─────────────────┐
│   Aura MCP      │◄── perplexica_search tool
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Perplexica API  │◄── HTTP GET /api/search?q=...
│  (localhost:   │
│   3002)        │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ DuckDuckGo API  │◄── Fallback search
│ (no API key)    │
└─────────────────┘
```

## Services Running

| Service | Port | Status |
|---------|------|--------|
| Perplexica Web UI | 3000 | ✅ Running |
| Perplexica API | 3001 | ⚠️ Container API (not exposed) |
| SearXNG | 8080 | ✅ Internal |
| Perplexica-Aura API | 3002 | ✅ Working |

## Files

```
perplexica-aura/
├── README.md              # This file
├── config.example.toml    # Perplexica config
├── docker-compose.yaml    # Deployment
├── api-server/
│   ├── simple.js         # Simple API (no deps)
│   └── index.js          # Full API with Playwright
├── services/
│   └── aura-mcp/
│       └── src/
│           └── connectors/
│               └── perplexica/
│                   └── index.ts  # Aura MCP connector
└── docs/
    └── DEPLOYMENT_STATUS.md
```

## License

MIT
