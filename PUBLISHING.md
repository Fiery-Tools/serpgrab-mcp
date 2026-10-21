# Publishing serpgrab-mcp

This repo is the package: run everything from its root (`/home/pg/node/serpgrab-mcp`).

## First release

1. Publish to npm (`npm login` first if needed):

   ```bash
   npm publish --access public
   ```

2. Publish to the official MCP registry (registry.modelcontextprotocol.io). Install
   `mcp-publisher` from github.com/modelcontextprotocol/registry/releases, then:

   ```bash
   mcp-publisher login github
   ```

   ```bash
   mcp-publisher publish
   ```

   The registry checks that `mcpName` in package.json matches `name` in server.json and that the
   npm package exists. If it rejects the `io.github.Fiery-Tools/` namespace, make your
   Fiery-Tools membership public (github.com/orgs/Fiery-Tools/people); its error names the
   namespaces you may use.

## Directories

- **awesome-mcp-servers** (github.com/punkpeye/awesome-mcp-servers), section "Search & Data
  Extraction", alphabetical:

  ```markdown
  - [Fiery-Tools/serpgrab-new](https://github.com/Fiery-Tools/serpgrab-new) 📇 ☁️ - Real-time Google search and Google Maps results (AI Overview, local pack, places with ratings and hours) via the serpgrab API. Free tier.
  ```

- **mcp.so, PulseMCP, Glama:** submit the GitHub URL; Glama and PulseMCP also pick servers up
  from the official registry.
- **Smithery:** add the repo from smithery.ai (it reads package.json; the key goes in its config
  form as `SERPGRAB_API_KEY`).

## Later releases

Bump `version` in package.json and both `version` fields in server.json, commit and push, then
repeat steps 1 and 2.
