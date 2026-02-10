#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Create server instance
const server = new Server(
    {
        name: 'time-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'get_current_time',
                description: 'Get the current time in a specific timezone',
                inputSchema: {
                    type: 'object',
                    properties: {
                        timezone: {
                            type: 'string',
                            description: 'Timezone (e.g., "Asia/Shanghai", "UTC", "America/New_York")',
                        },
                    },
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'get_current_time') {
        const timezone = args?.timezone || 'Asia/Shanghai';
        try {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('zh-CN', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                weekday: 'long',
            });

            const parts = formatter.formatToParts(now);
            const partObj = {};
            parts.forEach(p => partObj[p.type] = p.value);

            const formattedTime = `${partObj.year}-${partObj.month}-${partObj.day} ${partObj.hour}:${partObj.minute}:${partObj.second}`;

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            formatted: formattedTime,
                            timezone: timezone,
                            weekday: partObj.weekday,
                            iso: now.toISOString(),
                            timestamp: now.getTime()
                        }, null, 2),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error getting time for timezone ${timezone}: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    } else {
        return {
            content: [
                {
                    type: 'text',
                    text: `Unknown tool: ${name}`,
                },
            ],
            isError: true,
        };
    }
});

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Time MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
