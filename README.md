# serpgrab MCP server

A hosted [MCP](https://modelcontextprotocol.io) server that gives AI agents real-time Google search
and Google Maps results, from [serpgrab](https://serpgrab.com). There is nothing to install: add one
URL to your MCP client.

```
https://api.serpgrab.com/mcp
```

This repository holds the setup docs and client config examples. The server itself runs on our
infrastructure and is not open source. It is listed in the
[official MCP registry](https://registry.modelcontextprotocol.io) as `com.serpgrab/google-search`.

## Tools

- **`google_search`**: Google web results (title, URL, date, snippet), plus the AI Overview,
  answer box, knowledge panel, local pack, ads and "People also ask" when Google shows them.
- **`google_maps_search`**: businesses and places from Google Maps, 20 a page, with rating,
  reviews, price, address, phone, hours, website, coordinates and `place_id`.

Results come back as compact text written for a model's context, not raw JSON.

### `google_search`

| Argument | Default | |
|---|---|---|
| `query` | (required) | The search, as typed into Google |
| `pages` | 1 | Result pages to read, 1-3 (about 10 results each) |
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

## Get a key

Free: 250 searches a month, email signup, no card: https://serpgrab.com/#signup

Connecting and listing the tools work without a key; running a tool needs one. Each results page
the agent reads is one search.

## Setup

Replace `YOUR_KEY` with your serpgrab key.

### Claude Code

```bash
claude mcp add --transport http serpgrab https://api.serpgrab.com/mcp \
  --header "X-API-Key: YOUR_KEY"
```

### Cursor

In `~/.cursor/mcp.json`, or `.cursor/mcp.json` in a project:

```json
{
  "mcpServers": {
    "serpgrab": {
      "url": "https://api.serpgrab.com/mcp",
      "headers": { "X-API-Key": "YOUR_KEY" }
    }
  }
}
```

### VS Code

In `.vscode/mcp.json`, or run **MCP: Open User Configuration**:

```json
{
  "servers": {
    "serpgrab": {
      "type": "http",
      "url": "https://api.serpgrab.com/mcp",
      "headers": { "X-API-Key": "YOUR_KEY" }
    }
  }
}
```

### Windsurf

In Cascade's MCP menu, choose **Open MCP config file** and add:

```json
{
  "mcpServers": {
    "serpgrab": {
      "serverUrl": "https://api.serpgrab.com/mcp",
      "headers": { "X-API-Key": "YOUR_KEY" }
    }
  }
}
```

### Codex

In `~/.codex/config.toml`:

```toml
[mcp_servers.serpgrab]
url = "https://api.serpgrab.com/mcp"
http_headers = { "X-API-Key" = "YOUR_KEY" }
```

### Claude.ai, Claude Desktop, ChatGPT and other clients that only take a URL

Put the key in the URL and choose no authentication:

```
https://api.serpgrab.com/mcp?api_key=YOUR_KEY
```

- **Claude.ai and Claude Desktop:** Settings › Connectors › Add custom connector.
- **ChatGPT:** turn on developer mode, then Settings › Connectors › Create.

We don't log keys sent in the URL, but the client stores the URL with its settings, so keep it as
private as the key.

### Clients that only speak stdio

Connect through [`mcp-remote`](https://www.npmjs.com/package/mcp-remote):

```json
{
  "mcpServers": {
    "serpgrab": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://api.serpgrab.com/mcp", "--header", "X-API-Key:YOUR_KEY"]
    }
  }
}
```

## Pro plan on RapidAPI

Pro is $15 a month for 5,000 searches, on
[RapidAPI](https://rapidapi.com/fiery-tools-fiery-tools-default/api/google-serp-search-results-json/pricing).
Subscribers connect through RapidAPI's gateway with their RapidAPI key:

```bash
claude mcp add --transport http serpgrab https://google-serp-search-results-json.p.rapidapi.com/mcp \
  --header "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  --header "X-RapidAPI-Host: google-serp-search-results-json.p.rapidapi.com"
```

RapidAPI counts every request to the server, so connecting uses about three of your plan's
requests, and each tool call one more.

## Transport

Streamable HTTP, stateless, with JSON replies (no SSE stream). Only `POST` is used.

## The API underneath

serpgrab returns Google results in SerpApi's JSON format, so the same key also works for your own
code: see the [migration guide](https://serpgrab.com/blog/migrating-from-serpapi) and the
[OpenAPI spec](https://serpgrab.com/openapi.yaml).

## Help

Setup page: https://serpgrab.com/mcp. Questions or a tool you'd like: hello@serpgrab.com.

## License

The docs and examples in this repository are MIT licensed.
