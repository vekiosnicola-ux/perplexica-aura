/**
 * Perplexica Connector for Aura MCP
 * 
 * Provides AI-powered search with sources and citations.
 * Uses Perplexica-Aura API (DuckDuckGo fallback)
 * 
 * Usage:
 *   const result = await handlePerplexicaTool('perplexica_search', {
 *     query: "AI orchestration best practices",
 *     mode: "web"
 *   });
 */

import { z } from 'zod';

// API endpoint (configurable via environment)
const PERPLEXICA_API = process.env.PERPLEXICA_API_URL || 'http://localhost:3002';

// Search modes available
export type SearchMode = 'web' | 'academic' | 'writing' | 'youtube';

// Search focus options  
export type SearchFocus = 'internet' | 'sources' | 'math' | 'code';

/**
 * Perplexica search tool definition for Aura MCP
 */
export const perplexicaTools = [
  {
    name: 'perplexica_search',
    description: 'AI-powered web search with sources and citations. Returns comprehensive answers with transparent source attribution.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query or question'
        },
        mode: {
          type: 'string',
          enum: ['web', 'academic', 'writing', 'youtube'],
          description: 'Search mode: web (general), academic (research papers), writing (content), youtube (videos)',
          default: 'web'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'perplexica_quick',
    description: 'Quick search with condensed results (5 sources max)',
    inputSchema: {
      type: 'object', 
      properties: {
        query: {
          type: 'string',
          description: 'Quick search query'
        }
      },
      required: ['query']
    }
  }
];

/**
 * Handle Perplexica tool calls from Aura MCP
 */
export async function handlePerplexicaTool(
  name: string,
  args: Record<string, any>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    if (name === 'perplexica_search') {
      return await perplexicaSearch(args.query, args.mode);
    } else if (name === 'perplexica_quick') {
      return await perplexicaQuick(args.query);
    } else {
      return {
        content: [{ type: 'text', text: `Unknown Perplexica tool: ${name}` }],
        isError: true
      };
    }
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Perplexica error: ${error.message}` }],
      isError: true
    };
  }
}

/**
 * Full search with all sources
 */
async function perplexicaSearch(
  query: string,
  mode: string = 'web'
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const response = await fetch(`${PERPLEXICA_API}/api/search`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Perplexica API error: ${response.statusText}`);
  }

  const data = await response.json();
  const formatted = formatSearchResponse(data);

  return {
    content: [{ type: 'text', text: formatted }]
  };
}

/**
 * Quick search with condensed results
 */
async function perplexicaQuick(
  query: string
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const response = await fetch(`${PERPLEXICA_API}/api/quick?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error(`Perplexica API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  const lines: string[] = [];
  
  if (data.answer) {
    lines.push(`## Answer\n${data.answer}`);
  }
  
  if (data.sources && data.sources.length > 0) {
    lines.push(`\n## Sources (${data.sources.length})`);
    data.sources.forEach((s: any, i: number) => {
      lines.push(`${i + 1}. [${s.title}](${s.url})`);
    });
  }

  return {
    content: [{ type: 'text', text: lines.join('\n') }]
  };
}

/**
 * Format Perplexica response for Aura consumption
 */
function formatSearchResponse(data: any): string {
  const lines: string[] = [];

  // Query info
  lines.push(`## Search: "${data.query}"`);
  lines.push(`Mode: ${data.mode || 'web'}`);
  lines.push(`Timestamp: ${data.timestamp || new Date().toISOString()}`);
  lines.push('');

  // Answer
  if (data.answer) {
    lines.push('## Answer');
    lines.push(data.answer);
    lines.push('');
  }

  // Sources
  if (data.sources && data.sources.length > 0) {
    lines.push(`## Sources (${data.sources.length})`);
    data.sources.forEach((source: any, index: number) => {
      lines.push(`${index + 1}. [${source.title}](${source.url})`);
    });
    lines.push('');
  }

  // Related (if available)
  if (data.related && data.related.length > 0) {
    lines.push('## Related Queries');
    data.related.forEach((q: string) => {
      lines.push(`- ${q}`);
    });
  }

  return lines.join('\n');
}

/**
 * Quick search (for internal use)
 */
export async function quickSearch(
  query: string
): Promise<{ answer: string; sources: Array<{ title: string; url: string }> }> {
  const response = await fetch(`${PERPLEXICA_API}/api/quick?q=${encodeURIComponent(query)}`);
  const data = await response.json();

  return {
    answer: data.answer || 'No answer found',
    sources: (data.sources || []).map((s: any) => ({
      title: s.title,
      url: s.url
    }))
  };
}

/**
 * Health check for Perplexica API
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PERPLEXICA_API}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
