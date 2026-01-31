#!/usr/bin/env node
/**
 * Simple Perplexica API Wrapper for Aura
 * 
 * Uses external APIs as fallback when Perplexica is not accessible
 */

const http = require('http');

const PORT = process.env.PORT || 3002;

const routes = {
  '/': { method: 'GET', handler: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'Perplexica-Aura API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        'GET /api/search?q=...': 'Search the web',
        'GET /api/quick?q=...': 'Quick search',
        'GET /health': 'Health check'
      }
    }));
  }},
  '/health': { method: 'GET', handler: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  }},
  '/api/search': { method: 'GET', handler: async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const query = url.searchParams.get('q') || url.searchParams.get('query');
    const mode = url.searchParams.get('mode') || 'web';
    
    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Query parameter "q" is required' }));
    }

    console.log(`Searching: ${query} (mode: ${mode})`);

    try {
      // Try DuckDuckGo Instant Answer API
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`);
      const data = await response.json();

      const result = {
        query,
        mode,
        answer: data.Abstract || '',
        sources: (data.RelatedTopics || []).slice(0, 10).map(t => ({
          title: t.Text || '',
          url: t.FirstURL || ''
        })),
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }},
  '/api/quick': { method: 'GET', handler: async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const query = url.searchParams.get('q');
    
    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Query parameter "q" is required' }));
    }

    try {
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
      const data = await response.json();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        query,
        answer: data.Abstract || '',
        sources: (data.RelatedTopics || []).slice(0, 5).map(t => ({
          title: t.Text?.substring(0, 100) || '',
          url: t.FirstURL || ''
        }))
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }}
};

const server = http.createServer((req, res) => {
  const route = routes[req.url.split('?')[0]];
  
  if (route && route.method === req.method) {
    route.handler(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Perplexica-Aura API running on port ${PORT}`);
  console.log(`  - GET /api/search?q=...`);
  console.log(`  - GET /api/quick?q=...`);
  console.log(`  - GET /health`);
});
