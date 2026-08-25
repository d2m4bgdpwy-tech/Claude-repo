# Claude-repo

Project-scoped MCP server configuration for Claude Code.

## MCP servers

| Name | Transport | URL |
| --- | --- | --- |
| `robinhood-trading` | HTTP | `https://agent.robinhood.com/mcp/trading` |

The config lives in [`.mcp.json`](.mcp.json), which Claude Code picks up
automatically for anyone working in this repo. On first use Claude Code asks
you to approve the server before connecting, and authentication is handled
through the server's own OAuth flow (`/mcp` in Claude Code).

The equivalent CLI command is:

```bash
claude mcp add robinhood-trading --transport http https://agent.robinhood.com/mcp/trading
```

Adding `-s project` to that command writes the same `.mcp.json` entry instead
of a personal, machine-local one.
