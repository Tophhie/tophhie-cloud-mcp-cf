import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";

interface TophhieApiHealthResponse {
    status: string;
}

export function registerHealthTools(server: McpServer, apiBaseUrl: string): void {
    server.registerTool(
        "check_api_health",
        {
            title: "Check API Health",
            description: "Checks the health status of the Tophhie Cloud API. Returns 'healthy' if the API is operational, or an error message if there are issues.",
            inputSchema: z.object({}),
            annotations: {
                readOnlyHint: true,
                openWorldHint: true,
                idempotentHint: true
            },
        },
        async () => {
            try {
                const response = await fetch(`${apiBaseUrl}/health`);
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
                }
                const data = await response.json<TophhieApiHealthResponse>();
                return {
                    content: [{ type: "text" as const, text: `API Health Status: ${data.status}` }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error checking API health: ${error instanceof Error ? error.message : String(error)}` }],
                };
            }
        }
    )
}