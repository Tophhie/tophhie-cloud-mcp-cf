import { Hono } from "hono";
import { cors } from "hono/cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import { registerDomainHealthTools } from "./tools/domainHealth";
import { registerTophhieSocialTools } from "./tools/tophhieSocial";
import { registerHealthTools } from "./tools/health";

// --- Environment Variables ---
export interface Env {
	API_BASE_URL: string;
};

// -- Initialize Hono App ---
const app = new Hono<{Bindings: Env}>();

app.use("*", cors());

app.get("/", (c) =>
	c.json({
	name: "tophhie-cloud-mcp",
	description: "Tophhie Cloud MCP Server",
	mcp_endpoint: "/mcp",
	version: "1.0.0",
	})
);

// --- MCP Endpoint ---
app.post("/mcp", async (c) => {
  const { req, res } = toReqRes(c.req.raw);
 
  const server = buildMcpServer(c.env.API_BASE_URL);
 
  const transport = new StreamableHTTPServerTransport({
    // stateless mode — required for Cloudflare Workers (no persistent memory)
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
 
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, await c.req.json());
 
    res.on("close", () => {
      transport.close();
      server.close();
    });
 
    return toFetchResponse(res);
  } catch (err) {
    console.error("[mcp] request error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /mcp — clients probe this to check server capabilities / session support
app.get("/mcp", async (c) => {
  const { req, res } = toReqRes(c.req.raw);
 
  const server = buildMcpServer(c.env.API_BASE_URL);
 
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
 
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
 
    res.on("close", () => {
      transport.close();
      server.close();
    });
 
    return toFetchResponse(res);
  } catch (err) {
    console.error("[mcp] GET error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ── MCP server factory ────────────────────────────────────────────────────────
 
function buildMcpServer(apiBaseUrl: string): McpServer {
  const server = new McpServer({
    name: "tophhie-cloud-mcp",
    version: "1.0.0",
  });
 
  registerDomainHealthTools(server, apiBaseUrl);
  registerTophhieSocialTools(server, apiBaseUrl);
  registerHealthTools(server, apiBaseUrl);
 
  return server;
}

// -- Favicon ---
app.get("/favicon.ico", (c) => c.redirect("https://public-blob.tophhie.cloud/logos/favicon.ico", 301));

export default app;