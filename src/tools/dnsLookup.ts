import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";

const SUPPORTED_TYPES = [
    "A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "SRV", "CAA",
    "PTR", "NAPTR", "DS", "SSHFP", "DNSKEY", "TLSA", "SVCB", "HTTPS"
];

interface DnsLookupErrorResponse {
    status: string;
    message: string;
}

export function registerDnsLookupTools(server: McpServer, apiBaseUrl: string): void {
    server.registerTool(
        "dns_lookup",
        {
            title: "DNS Lookup",
            description:
                "Resolves DNS records for any domain over Cloudflare DNS-over-HTTPS. " +
                `Supported record types: ${SUPPORTED_TYPES.join(", ")}, plus 'ALL' for the common overview set ` +
                "(A, AAAA, CNAME, MX, TXT, NS, SOA, SRV, CAA). Pass a single type, a comma-separated list, or ALL — " +
                "at most 12 types per call.\n\n" +
                "Works for any public domain, not just Tophhie Cloud domains — use 'check_domain_health' instead when " +
                "you need a mail-security posture assessment of a Tophhie Cloud domain.\n\n" +
                "Structured types (MX, SRV, SOA, CAA, DS, TLSA) return their rdata broken out into named fields under " +
                "'parsed'. Underscore-prefixed names such as '_dmarc.example.com' are supported. For PTR lookups an " +
                "IPv4 or IPv6 address may be passed directly as the domain. 'dnssecValidated' reflects the resolver's " +
                "authenticated-data flag, meaning the DNSSEC chain was validated.",
            inputSchema: {
                domain: z
                    .string()
                    .min(3)
                    .describe(
                        "The domain name to resolve, e.g. 'example.com'. Do not include a protocol or path. For PTR lookups an IP address may be given instead."
                    ),
                type: z
                    .string()
                    .optional()
                    .describe(
                        `Record type(s) to resolve. A single type (e.g. 'MX'), a comma-separated list (e.g. 'A,AAAA,MX'), or 'ALL'. Defaults to 'A'. Supported: ${SUPPORTED_TYPES.join(", ")}, ALL.`
                    ),
            },
            annotations: {
                readOnlyHint: true,
                openWorldHint: true,
                idempotentHint: true
            },
        },
        async ({ domain, type }) => {
            const params = new URLSearchParams({ domain });
            if (type) params.set("type", type);

            const response = await fetch(`${apiBaseUrl}/dns?${params.toString()}`);

            // The API reports a bad domain/record type (400) and a nonexistent
            // name (404) as structured JSON. Surface those as readable text
            // rather than throwing, so the model can correct its own input.
            if (response.status === 400 || response.status === 404) {
                const error = await response.json<DnsLookupErrorResponse>();
                return {
                    content: [{ type: "text" as const, text: error.message }],
                };
            }

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
            };
        }
    );
}
