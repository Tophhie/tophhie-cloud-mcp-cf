import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";

export function registerDomainHealthTools(server: McpServer, apiBaseUrl: string): void {
    server.registerTool(
        "check_domain_health", 
        {
            description: "Runs a full DNS and mail security health check for a Tophhie Cloud domain. Returns status for MX records, DMARC, SPF, MTA-STS, DKIM Selectors, DNSSEC, and TLS. Each check reports pass/fail/warn/missing with a human-readable detail string.",
            inputSchema: {
                domain: z.string().min(3).describe("The domain name to check, e.g. 'example.com'. Do not include a protocol or path."),
            },
            annotations: {
                readOnlyHint: true,
                openWorldHint: true,
                idempotentHint: true
            },
        },
        async ({ domain }) => {
            const response = await fetch(`${apiBaseUrl}/domains/${encodeURIComponent(domain)}`);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }
            if (response.status === 404) {
                return {
                    content: [{ type: "text" as const, text: `Domain '${domain}' is not a Tophhie Cloud domain. You can query 'https://api.tophhie.dev/domains' to get a list of all Tophhie Cloud domains.` }],
                };
            }
            const data = await response.json();
            return {
                content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
            };
        }
    );
}