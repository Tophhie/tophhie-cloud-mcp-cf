import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";

export function registerPoliciesTools(server: McpServer, apiBaseUrl: string): void {
    server.registerTool(
        "fetch_tophhie_cloud_policies",
        {
            title: "Fetch Tophhie Cloud Policies",
            description: "Fetches all Tophhie Cloud policies. Returns the list of policies if the API is operational, or an error message if there are issues.",
            inputSchema: z.object({}),
            annotations: {
                readOnlyHint: true,
                openWorldHint: true,
                idempotentHint: true
            },
        },
        async () => {
            try {
                const response = await fetch(`${apiBaseUrl}/policies/getAllPolicies`);
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error fetching Policies: ${error instanceof Error ? error.message : String(error)}` }],
                };
            }
        }
    )
}