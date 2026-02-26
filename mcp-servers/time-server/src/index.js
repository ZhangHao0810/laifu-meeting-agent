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
            {
                name: 'time_toTimestamp',
                description: 'Convert a date-time string in a given timezone to a Unix millisecond timestamp. Use this when booking meetings to accurately convert natural-language times (e.g. "today 3pm") into timestamps, avoiding arithmetic errors.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        dateStr: {
                            type: 'string',
                            description: 'Date-time string in format "YYYY-MM-DD HH:mm:ss", e.g. "2026-02-25 15:00:00"',
                        },
                        timezone: {
                            type: 'string',
                            description: 'Timezone identifier, default "Asia/Shanghai"',
                        },
                    },
                    required: ['dateStr'],
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

    } else if (name === 'time_toTimestamp') {
        const { dateStr, timezone = 'Asia/Shanghai' } = args || {};
        if (!dateStr) {
            return {
                content: [{ type: 'text', text: 'Error: dateStr is required' }],
                isError: true,
            };
        }
        try {
            // Parse dateStr as local time in the target timezone.
            // Strategy: treat the string as UTC, measure the TZ offset at that moment, then correct.
            const [datePart, timePart = '00:00:00'] = dateStr.trim().split(' ');
            const utcDate = new Date(`${datePart}T${timePart}Z`); // treated as UTC first

            // Format the same UTC instant in target timezone (sv-SE gives "YYYY-MM-DD HH:mm:ss")
            const localStr = new Intl.DateTimeFormat('sv-SE', {
                timeZone: timezone,
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false,
            }).format(utcDate).replace(' ', 'T');

            // diff = how far UTC is from local at this moment
            const localAsUtc = new Date(`${localStr}Z`);
            const offsetMs = utcDate.getTime() - localAsUtc.getTime();

            // actual ms = our naive UTC parse + the offset correction
            const actualTimestamp = utcDate.getTime() + offsetMs;

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        input: dateStr,
                        timezone,
                        timestamp: actualTimestamp,
                        iso: new Date(actualTimestamp).toISOString(),
                    }, null, 2),
                }],
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
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
