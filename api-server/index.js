#!/usr/bin/env node
/**
 * Perplexica API Wrapper for Aura
 * 
 * Provides a simple REST API that wraps Perplexica's internal APIs
 * or provides alternative search functionality.
 */

const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Store for results cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Search using Perplexica Web UI via Playwright
 */
async function searchWithPerplexica(query, mode = 'web') {
  const cacheKey = `${query}-${mode}`;
  
  // Check cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.results;
    }
  }

  try {
    // Launch browser
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to Perplexica
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Enter query
    await page.fill('input[placeholder*="Ask anything"]', query);
    
    // Click search
    await page.click('button[type="submit"]');

    // Wait for results
    await page.waitForSelector('[class*="result"], [class*="answer"]', { timeout: 30000 });

    // Extract results
    const results = await page.evaluate(() => {
      const items = [];
      
      // Try to find answer
      const answerEl = document.querySelector('[class*="answer"], [class*="response"]');
      const answer = answerEl ? answerEl.textContent : '';
      
      // Try to find source links
      const links = document.querySelectorAll('a[href*="http"]');
      links.forEach((link, i) => {
        if (i < 10 && link.href) {
          items.push({
            title: link.textContent || link.href,
            url: link.href,
            snippet: ''
          });
        }
      });
      
      return { answer, sources: items };
    });

    await browser.close();

    // Cache results
    cache.set(cacheKey, { results, timestamp: Date.now() });

    return results;
  } catch (error) {
    console.error('Search error:', error);
    return { answer: `Error: ${error.message}`, sources: [] };
  }
}

/**
 * Search using DuckDuckGo (fallback)
 */
async function searchWithDuckDuckGo(query) {
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    const data = await response.json();
    
    return {
      answer: data.Abstract || '',
      sources: data.RelatedTopics?.slice(0, 10).map(t => ({
        title: t.Text || '',
        url: t.FirstURL || '',
        snippet: ''
      })) || []
    };
  } catch (error) {
    return { answer: `Error: ${error.message}`, sources: [] };
  }
}

/**
 * Search using YouTube Transcript (for video queries)
 */
async function searchYouTube(query) {
  // This would use the existing YouTube MCP connector
  return { answer: 'YouTube search not implemented yet', sources: [] };
}

// API Routes

/**
 * Main search endpoint
 */
app.post('/api/search', async (req, res) => {
  const { query, mode = 'web', focus = 'internet' } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  console.log(`Searching: ${query} (mode: ${mode})`);

  try {
    let results;
    
    switch (mode) {
      case 'youtube':
        results = await searchYouTube(query);
        break;
      case 'academic':
        results = await searchWithPerplexica(query, 'academic');
        break;
      case 'writing':
        results = await searchWithPerplexica(query, 'writing');
        break;
      case 'web':
      default:
        results = await searchWithPerplexica(query, 'web');
        // Fallback to DuckDuckGo if Perplexica fails
        if (!results.answer && !results.sources.length) {
          console.log('Falling back to DuckDuckGo');
          results = await searchWithDuckDuckGo(query);
        }
    }

    res.json({
      query,
      mode,
      focus,
      ...results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Quick search endpoint (simpler response)
 */
app.get('/api/quick', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const results = await searchWithPerplexica(q);
  
  res.json({
    answer: results.answer,
    sources: results.sources.slice(0, 5),
    query: q
  });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Info endpoint
 */
app.get('/info', (req, res) => {
  res.json({
    name: 'Perplexica-Aura API',
    version: '1.0.0',
    endpoints: {
      'POST /api/search': { query: 'string', mode: 'web|academic|writing|youtube' },
      'GET /api/quick': { q: 'string' },
      'GET /health': {},
      'GET /info': {}
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Perplexica-Aura API running on port ${PORT}`);
  console.log(`  - POST /api/search`);
  console.log(`  - GET /api/quick?q=...`);
  console.log(`  - GET /health`);
  console.log(`  - GET /info`);
});
