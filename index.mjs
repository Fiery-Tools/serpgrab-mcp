#!/usr/bin/env node
// serpgrab-mcp: stdio MCP server with real-time Google search and Google Maps results from the
// serpgrab API (https://serpgrab.com). Needs SERPGRAB_API_KEY (free key from serpgrab.com), or
// RAPIDAPI_KEY for a Pro subscription on RapidAPI.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { formatMaps, formatWeb } from './format.mjs';

const VERSION = '0.1.0';
const RAPIDAPI_HOST = 'google-serp-search-results-json.p.rapidapi.com';
const KEY = process.env.SERPGRAB_API_KEY?.trim();
const RAPID_KEY = process.env.RAPIDAPI_KEY?.trim();
const BASE = KEY || !RAPID_KEY ? process.env.SERPGRAB_API_URL || 'https://api.serpgrab.com' : `https://${RAPIDAPI_HOST}`;
const HEADERS = KEY
  ? { 'x-api-key': KEY }
  : RAPID_KEY
    ? { 'x-rapidapi-key': RAPID_KEY, 'x-rapidapi-host': RAPIDAPI_HOST }
    : null;
const NO_KEY =
  'No serpgrab API key. Set SERPGRAB_API_KEY in this MCP server\'s environment: a free key (250 searches a month, ' +
  'email signup, no card) is at https://serpgrab.com/#signup. Pro subscribers on RapidAPI set RAPIDAPI_KEY instead.';
const TIME = { hour: 'qdr:h', day: 'qdr:d', week: 'qdr:w', month: 'qdr:m', year: 'qdr:y' };

class UserError extends Error {}

const scrub = (s) => [KEY, RAPID_KEY].filter(Boolean).reduce((t, k) => t.split(k).join('***'), String(s));

/** One API call, parsed. Retries once on a network error or 502/503/504; quota errors pass through as text. */
async function call(path, params) {
  if (!HEADERS) throw new UserError(NO_KEY);
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  for (let attempt = 0; ; attempt++) {
    let r;
    try {
      r = await fetch(url, { headers: { ...HEADERS, 'user-agent': `serpgrab-mcp/${VERSION}` }, signal: AbortSignal.timeout(100_000) });
    } catch (err) {
      if (attempt === 0) continue;
      throw new UserError(`serpgrab is unreachable: ${err.cause?.code || err.message}`);
    }
    const data = await r.json().catch(() => ({}));
    if (r.ok) return data;
    if ([502, 503, 504].includes(r.status) && attempt === 0) {
      await new Promise((ok) => setTimeout(ok, Math.min(10, Number(r.headers.get('retry-after')) || 3) * 1000));
      continue;
    }
    if (r.status === 401 || r.status === 403) throw new UserError(`serpgrab rejected the API key (HTTP ${r.status}). ${NO_KEY}`);
    const note = data.note_for_agents ? ` ${data.note_for_agents}` : '';
    const guide = data.upgrade?.guide ? ` Upgrade guide: ${data.upgrade.guide}` : '';
    throw new UserError(`serpgrab answered ${r.status}: ${data.error ?? 'no error message'}${note}${guide}`);
  }
}

async function run(fn) {
  try {
    return { content: [{ type: 'text', text: scrub(await fn()) }] };
  } catch (err) {
    const text = err instanceof UserError ? err.message : `serpgrab-mcp error: ${err?.message ?? String(err)}`;
    return { content: [{ type: 'text', text: scrub(text) }], isError: true };
  }
}

async function googleSearch({ query, pages = 1, country = 'us', language = 'en', location, time }) {
  const got = [];
  let stoppedEarly = null;
  for (let p = 0; p < pages; p++) {
    let data;
    try {
      data = await call('/search', { engine: 'google', q: query, gl: country, hl: language, location, tbs: TIME[time], start: p ? p * 10 : undefined });
    } catch (err) {
      if (p === 0) throw err;
      stoppedEarly = `page ${p + 1} failed: ${err.message}`;
      break;
    }
    got.push(data);
    if (!data.serpapi_pagination?.next || !(data.organic_results ?? []).length) {
      if (p + 1 < pages) stoppedEarly = 'Google had no more results';
      break;
    }
  }
  return formatWeb({ query, country, pages: got, requested: pages, stoppedEarly });
}

async function mapsSearch({ query, ll, page = 1, country = 'us', language = 'en' }) {
  const data = await call('/maps', { q: query, ll, gl: country, hl: language, start: page > 1 ? (page - 1) * 20 : undefined });
  return formatMaps({ query, country, data, page });
}

const server = new McpServer({ name: 'serpgrab', version: VERSION });
const country = z.string().regex(/^[A-Za-z]{2}$/).optional().describe('Two-letter country code Google searches from (gl), e.g. "us", "gb", "de". Default "us".');
const language = z.string().min(2).max(7).optional().describe('Interface language (hl), e.g. "en", "de", "pt-BR". Default "en".');

server.registerTool(
  'google_search',
  {
    title: 'Google search',
    description:
      'Real-time Google web results: title, URL, date and snippet for each result, plus the AI Overview, answer box, ' +
      'knowledge panel, local pack, ads and "People also ask" when Google shows them. ' +
      'Question-style queries ("how do I...", "what is...") usually get an AI Overview. Each page read is one billed search, ' +
      'so use pages=1 unless you need more. Usually 2-6 s per page.',
    inputSchema: {
      query: z.string().min(1).describe('The search, as typed into Google.'),
      pages: z.number().int().min(1).max(5).optional().describe('Result pages to read (about 10 results each), 1-5. Default 1.'),
      country,
      language,
      location: z.string().optional().describe('Search as if from this place, e.g. "Austin, Texas, United States". Leave out for a country-wide search.'),
      time: z.enum(['hour', 'day', 'week', 'month', 'year']).optional().describe('Only results from the past hour, day, week, month or year.'),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  (args) => run(() => googleSearch(args)),
);

server.registerTool(
  'google_maps_search',
  {
    title: 'Google Maps search',
    description:
      'Businesses and places from Google Maps, 20 per page: name, type, rating and review count, price, address, phone, ' +
      'hours, website, coordinates and place_id. Put the place in the query ("plumber in denver co") or pass ll. ' +
      'Each page is one billed search.',
    inputSchema: {
      query: z.string().min(1).describe('What to look for, e.g. "pizza in austin tx".'),
      ll: z.string().regex(/^@-?\d{1,2}(\.\d+)?,-?\d{1,3}(\.\d+)?,\d{1,2}(\.\d+)?z$/).optional().describe('Map position as "@latitude,longitude,zoomz", e.g. "@30.2672,-97.7431,14z".'),
      page: z.number().int().min(1).max(10).optional().describe('Results page, 20 places each. Default 1.'),
      country,
      language,
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  (args) => run(() => mapsSearch(args)),
);

await server.connect(new StdioServerTransport());
