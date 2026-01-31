# Perplexica-Aura Integration

> **Status:** Perplexica Web UI deployed, API integration in progress

## Current Deployment

```bash
# Services Running
docker ps | grep -E "perplexica|searxng"

# Perplexica Web UI
open http://localhost:3000

# SearXNG (search backend)
open http://localhost:8080
```

## Known Issues

### API Access
The Perplexica API (port 3001) and SearXNG API are not responding to direct HTTP requests.

**Workarounds:**

1. **Use Web UI via Playwright** (recommended for now)
   ```typescript
   // In Aura MCP
   import { playwright } from '@playwright/mcp';
   
   await playwright.navigate('http://localhost:3000');
   await playwright.fill('input[placeholder*="Ask anything"]', query);
   await playwright.click('button[type="submit"]');
   ```

2. **Direct API (requires container fix)**
   ```bash
   # Fix Perplexica container to expose API
   docker exec -it perplexica-aura bash
   # Check if API server is running on port 3001
   # Fix configuration
   ```

3. **Use External APIs**
   ```typescript
   // Perplexity API (requires key)
   const response = await fetch('https://api.perplexity.ai/chat/completions', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}` },
     body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: query }] })
   });
   ```

## Fixing the API

### Step 1: Check Perplexica Configuration
```bash
docker exec perplexica-aura cat /app/config.toml
```

### Step 2: Verify API Port
```bash
docker port perplexica-aura
# Should show: 3000/tcp, 3001/tcp
```

### Step 3: Check API Inside Container
```bash
docker exec perplexica-aura curl http://localhost:3001/api/search -X POST -d '{"query":"test"}'
```

## Files

```
perplexica-aura/
├── README.md                 # This file
├── config.example.toml       # Configuration template
├── docker-compose.yaml       # (Not used - manual deployment)
├── services/
│   └── aura-mcp/
│       └── src/
│           └── connectors/
│               └── perplexica/
│                   └── index.ts  # Aura MCP connector (template)
├── docs/
│   └── API_FIX.md           # This file
└── .gitignore
```

## Next Steps

1. Fix Perplexica API exposure (container configuration)
2. Configure SearXNG for API access
3. Complete Aura MCP integration
4. Test end-to-end search flow

## Alternative: External APIs

If local Perplexica API doesn't work, use:

- **Perplexity API**: Direct access to Perplexity's search
- **Brave Search API**: Alternative AI search engine
- **YouTube Transcript**: Already implemented in Aura

## References

- [Perplexica GitHub](https://github.com/ItzCrazyKns/Perplexica)
- [SearXNG](https://github.com/searxng/searxng)
- [Aura MCP](../services/aura-mcp/)
