import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";

interface TophhieSocialHandleAvailabilityResponse {
    available: boolean;
}

export function registerTophhieSocialTools(server: McpServer, apiBaseUrl: string): void { 
    server.registerTool(
        "get_pds_repos",
        {
            description: "Returns a list of all PDS repositories currently registered in Tophhie Social.",
            inputSchema: z.object({}),
            annotations: {
                readOnlyHint: true,
                openWorldHint: true,
                idempotentHint: true
            },
        },
        async () => {
            const response = await fetch(`${apiBaseUrl}/pds/repos`);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
            };
        }
    );

    server.registerTool(
        "verify_pds_handle_availability",
        {
            description: "Checks if a given PDS handle is available for registration in Tophhie Social. Returns 'available' or 'unavailable'.",
            inputSchema: z.object({
                handle: z.string().min(3).describe("The atproto PDS handle to check, e.g. 'alice.tophhie.social'. This can include the default domain 'tophhie.social' or any custom domain. Do not include the '@' symbol."),
            }),
            annotations: {
                readOnlyHint: true,
                openWorldHint: true,
                idempotentHint: true
            },
        },
        async ({ handle }) => {
            const response = await fetch(`${apiBaseUrl}/pds/verifyHandle?handle=${encodeURIComponent(handle)}`);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }
            const data = await response.json<TophhieSocialHandleAvailabilityResponse>();
            return {
                content: [{ type: "text" as const, text: `Handle '${handle}' is ${data.available ? "available" : "unavailable"} for registration in Tophhie Social.` }],
            };
        }
    )

    server.registerTool(
        "get_pds_bsky_heatmap",
        {
            description: "Returns the heatmap data of Bluesky social network posts for a given year. The heatmap data includes the number of posts made on each day of the year, allowing you to visualize posting activity patterns over time.",
            inputSchema: z.object({
                year: z.number().int().min(2020).max(new Date().getFullYear()).describe("The year for which to retrieve the heatmap data, e.g. 2024."),
            }),
            annotations: {
                readOnlyHint: true,
                openWorldHint: true,
                idempotentHint: true
            },
        },
        async ({ year }) => {
            const response = await fetch(`${apiBaseUrl}/pds/blueskyHeatmap?forYear=${encodeURIComponent(year)}`);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
            };
        }
    )
}