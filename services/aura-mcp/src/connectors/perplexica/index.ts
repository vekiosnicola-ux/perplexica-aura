/**
 * Perplexica Connector for Aura MCP
 * 
 * Provides AI-powered search with sources and citations.
 * Part of the Aura research stack.
 */

import { z } from 'zod';

// Perplexica API endpoint (can be configured via environment)
const PERPLEXICA_API = process.env.PERPLEXICA_API_URL || 'http://localhost:3001';

// Search modes available in Perplexica
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
        },
        focus: {
          type: 'string',
          enum: ['internet', 'sources', 'math', 'code'],
          description: 'Search focus: internet (web), sources (cite sources), math (math problems), code (programming)',
          default: 'internet'
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
  if (name !== 'perplexica_search') {
    return {
      content: [{ type: 'text', text: `Unknown Perplexica tool: ${name}` }],
      isError: true
    };
  }

  try {
    const { query, mode = 'web', focus = 'internet' } = args;

    const response = await fetch(`${PERPLEXICA_API}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        mode,
        focus
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexica API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Format response with sources
    const formattedResponse = formatSearchResponse(data);

    return {
      content: [{ type: 'text', text: formattedResponse }]
    };
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Perplexica search error: ${error.message}` }],
      isError: true
    };
  }
}

/**
 * Format Perplexica response for Aura consumption
 */
function formatSearchResponse(data: any): string {
  const lines: string[] = [];

  // Answer
  if (data.answer) {
    lines.push('## Answer');
    lines.push(data.answer);
    lines.push('');
  }

  // Sources
  if (data.sources && data.sources.length > 0) {
    lines.push('## Sources');
    data.sources.forEach((source: any, index: number) => {
      lines.push(`${index + 1}. [${source.title}](${source.url})`);
    });
    lines.push('');
  }

  // Related queries
  if (data.related && data.related.length > 0) {
    lines.push('## Related Queries');
    data.related.forEach((q: string) => {
      lines.push(`- ${q}`);
    });
  }

  return lines.join('\n');
}

/**
 * Quick search (no mode/focus customization)
 */
export async function quickSearch(
  query: string
): Promise<{ answer: string; sources: Array<{ title: string; url: string }> }> {
  const response = await fetch(`${PERPLEXICA_API}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });

  const data = await response.json();

  return {
    answer: data.answer || 'No answer found',
    sources: (data.sources || []).map((s: any) => ({
      title: s.title,
      url: s.url
    }))
  };
}
