# serpgrab-mcp

An [MCP](https://modelcontextprotocol.io) server that gives AI agents real-time Google search and
Google Maps results, through the [serpgrab](https://serpgrab.com) API.

- **`google_search`**: Google web results (title, URL, date, snippet), plus the AI Overview,
  answer box, knowledge panel, local pack, ads and "People also ask" when Google shows them.
  Country, language, location and time filters; up to 5 pages.
- **`google_maps_search`**: businesses and places from Google Maps, 20 a page, with rating,
  reviews, price, address, phone, hours, website, coordinates and `place_id`.

Results come back as compact text written for a model's context, not raw JSON.

## Get a key

Free: 250 searches a month, email signup, no card: https://serpgrab.com/#signup

Pro: $15 a month for 5,000 searches, on
[RapidAPI](https://rapidapi.com/fiery-tools-fiery-tools-default/api/google-serp-search-results-json/pricing).
Use your RapidAPI key as `RAPIDAPI_KEY`.

Each results page is one search.

## Install

### Claude Code

```bash
claude mcp add serpgrab --env SERPGRAB_API_KEY=your_key -- npx -y serpgrab-mcp
```

### Claude Desktop, Cursor, Windsurf, VS Code and other MCP clients

Add to the client's MCP config (`claude_desktop_config.json`, `.cursor/mcp.json`, ...):

```json
{
  "mcpServers": {
    "serpgrab": {
      "command": "npx",
      "args": ["-y", "serpgrab-mcp"],
      "env": { "SERPGRAB_API_KEY": "your_key" }
    }
  }
}
```

For Pro on RapidAPI, put `"RAPIDAPI_KEY": "your_rapidapi_key"` in `env` instead.

Needs Node.js 18 or later.

## Tools

### `google_search`

| Argument | Default | |
|---|---|---|
| `query` | (required) | The search, as typed into Google |
| `pages` | 1 | Result pages to read, 1-5 (about 10 results each) |
| `country` | `us` | Two-letter country Google searches from (`gl`) |
| `language` | `en` | Interface language (`hl`) |
| `location` | | Search as if from a place, e.g. `Austin, Texas, United States` |
| `time` | | `hour`, `day`, `week`, `month` or `year`: only recent results |

### `google_maps_search`

| Argument | Default | |
|---|---|---|
| `query` | (required) | What to look for, e.g. `pizza in austin tx` |
| `ll` | | Map position, `@latitude,longitude,zoomz`, e.g. `@30.2672,-97.7431,14z` |
| `page` | 1 | Results page, 20 places each |
| `country` | `us` | Two-letter country (`gl`) |
| `language` | `en` | Interface language (`hl`) |

## Errors

When the free plan's searches are used up, the tool says so and when they come back, instead of
failing silently, so the agent can tell you rather than retry.

## The API underneath

serpgrab returns Google results in SerpApi's JSON format, so the same key also works for your own
code: see the [migration guide](https://serpgrab.com/blog/migrating-from-serpapi) and the
[docs](https://rapidapi.com/fiery-tools-fiery-tools-default/api/google-serp-search-results-json).

## License

MIT
