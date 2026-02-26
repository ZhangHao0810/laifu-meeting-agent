import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { authManager } from './auth/fuxin-auth.js';
import { CONFIG } from './config.js';
import { logger } from './logger.js';

// Create server instance
const server = new Server(
    {
        name: 'meeting-assistant',
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
            // Meeting Room Tools (Use meeting-room token)
            {
                name: 'meeting_hasNewMeetingRoomBooking',
                description: '检查是否有新的会议室预订（用于轮询）',
                inputSchema: {
                    type: 'object',
                    properties: {
                        lastTime: {
                            type: 'string',
                            description: '上次更新时间戳（毫秒字符串），不传则返回是否有任何预订',
                        },
                    },
                },
            },
            {
                name: 'meeting_getMeetingRoomBookings',
                description: '获取会议室预订信息（支持增量获取）',
                inputSchema: {
                    type: 'object',
                    properties: {
                        lastIndex: {
                            type: 'string',
                            description: '最后一条的 updateTime，用于增量获取',
                        },
                        pageSize: {
                            type: 'number',
                            description: '分页大小，默认50，最大50',
                        },
                    },
                },
            },
            {
                name: 'meeting_getFreeMeetingRooms',
                description: '查询指定时间段的空闲会议室',
                inputSchema: {
                    type: 'object',
                    properties: {
                        openId: {
                            type: 'string',
                            description: '预约人员 openId',
                        },
                        startTime: {
                            type: 'number',
                            description: '开始时间戳（毫秒）',
                        },
                        endTime: {
                            type: 'number',
                            description: '结束时间戳（毫秒）',
                        },
                        pageIndex: {
                            type: 'number',
                            description: '页码，默认1',
                        },
                        pageSize: {
                            type: 'number',
                            description: '每页条数，默认50',
                        },
                    },
                    required: ['openId', 'startTime'],
                },
            },
            {
                name: 'meeting_getMeetingRoomAttendees',
                description: '查询某个会议的与会人列表',
                inputSchema: {
                    type: 'object',
                    properties: {
                        orderId: {
                            type: 'string',
                            description: '会议订单ID',
                        },
                    },
                    required: ['orderId'],
                },
            },
            // Schedule Tools (Use schedule token)
            {
                name: 'meeting_createMeeting',
                description: '创建新会议',
                inputSchema: {
                    type: 'object',
                    properties: {
                        openId: {
                            type: 'string',
                            description: '会议发起人 openId',
                        },
                        title: {
                            type: 'string',
                            description: '会议标题',
                        },
                        content: {
                            type: 'string',
                            description: '会议内容/描述',
                        },
                        roomId: {
                            type: 'string',
                            description: '会议室ID',
                        },
                        startDate: {
                            type: 'number',
                            description: '开始时间戳（毫秒）',
                        },
                        endDate: {
                            type: 'number',
                            description: '结束时间戳（毫秒）',
                        },
                        noticeTimes: {
                            type: 'array',
                            items: {
                                type: 'number',
                            },
                            description: '提醒时间 [5, 15, 60]',
                        },
                        actors: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: '与会人 openId 列表',
                        },
                    },
                    required: ['openId', 'title', 'roomId', 'startDate', 'endDate'],
                },
            },
            {
                name: 'meeting_getMeetingDetail',
                description: '查看单个会议详情',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: '会议ID',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'meeting_cancelMeeting',
                description: '取消会议',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: '会议ID',
                        },
                        openId: {
                            type: 'string',
                            description: '操作人 openId',
                        },
                    },
                    required: ['id', 'openId'],
                },
            },
            {
                name: 'meeting_queryMeetingsByDay',
                description: '按天查询会议列表',
                inputSchema: {
                    type: 'object',
                    properties: {
                        day: {
                            type: 'number',
                            description: '待查询的日期时间戳（毫秒）',
                        },
                    },
                    required: ['day'],
                },
            },
            {
                name: 'meeting_updateMeeting',
                description: '修改单个会议',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: '会议ID',
                        },
                        openId: {
                            type: 'string',
                            description: '操作人 openId',
                        },
                        title: {
                            type: 'string',
                            description: '会议标题',
                        },
                        content: {
                            type: 'string',
                            description: '会议内容',
                        },
                        startDate: {
                            type: 'number',
                            description: '开始时间戳（毫秒）',
                        },
                        endDate: {
                            type: 'number',
                            description: '结束时间戳（毫秒）',
                        },
                        roomId: {
                            type: 'string',
                            description: '会议室ID',
                        },
                        addActors: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: '新增与会人 openId 列表',
                        },
                        delActors: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: '删除与会人 openId 列表',
                        },
                    },
                    required: ['id', 'openId'],
                },
            },
            {
                name: 'meeting_queryMeetingsByRange',
                description: '按时间范围查询会议列表',
                inputSchema: {
                    type: 'object',
                    properties: {
                        start: {
                            type: 'number',
                            description: '开始时间戳（毫秒）',
                        },
                        end: {
                            type: 'number',
                            description: '结束时间戳（毫秒）',
                        },
                    },
                    required: ['start', 'end'],
                },
            },
            {
                name: 'meeting_getRecentMeetings',
                description: '获取最近时间的会议列表（分页）',
                inputSchema: {
                    type: 'object',
                    properties: {
                        lastTime: {
                            type: 'number',
                            description: '最后一条的 updateTime，用于增量获取',
                        },
                        page: {
                            type: 'number',
                            description: '页码',
                        },
                        size: {
                            type: 'number',
                            description: '每页条数',
                        },
                        roomIds: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: '会议室ID列表（可选过滤）',
                        },
                    },
                    required: ['page', 'size'],
                },
            },
            {
                name: 'meeting_queryUserMeetings',
                description: '查询指定用户创建或参与的会议列表，支持分页和状态过滤',
                inputSchema: {
                    type: 'object',
                    properties: {
                        openId: {
                            type: 'string',
                            description: '用户 openId（查询该用户的会议）',
                        },
                        pageNum: {
                            type: 'number',
                            description: '页码，从 1 开始，默认 1',
                        },
                        pageSize: {
                            type: 'number',
                            description: '每页条数，建议 10-20，默认 10',
                        },
                        status: {
                            type: 'number',
                            description: '会议状态过滤（不传=全部，0=未开始，1=已结束）',
                        },
                    },
                    required: ['openId'],
                },
            },
        ],
    };
});

// Generic helper to perform requests (with full HTTP logging)
async function performRequest(url, body, method = 'POST', toolName = 'unknown') {
    const requestHeaders = { 'Content-Type': 'application/json' };
    const requestBody = body || null;
    const startTime = Date.now();

    const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined
    });

    const durationMs = Date.now() - startTime;
    const data = await response.json();

    // Log the full HTTP round-trip to file
    await logger.logRequest({
        tool: toolName,
        method,
        url,
        requestHeaders,
        requestBody,
        statusCode: response.status,
        responseBody: data,
        durationMs,
    });

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
        }]
    };
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Log every tool invocation
    await logger.logToolCall(name, args);

    try {
        // --- Meeting Room Tools (Use Meeting Room Token) ---
        if (name === 'meeting_hasNewMeetingRoomBooking') {
            const token = await authManager.getToken('meeting-room');
            const body = {
                eid: CONFIG.EID,
                lastTime: args.lastTime
            };
            return await performRequest(`${CONFIG.MEETING_ROOM_BASE_URL}/hasNew?accessToken=${token}`, body, 'POST', name);
        }

        else if (name === 'meeting_getMeetingRoomBookings') {
            const token = await authManager.getToken('meeting-room');
            const body = {
                eid: CONFIG.EID,
                lastIndex: args.lastIndex,
                pageSize: args.pageSize || 50
            };
            return await performRequest(`${CONFIG.MEETING_ROOM_BASE_URL}/bookInfo?accessToken=${token}`, body, 'POST', name);
        }

        else if (name === 'meeting_getFreeMeetingRooms') {
            const token = await authManager.getToken('meeting-room');
            const { openId, startTime, endTime, pageIndex = 1, pageSize = 50 } = args;
            if (!openId || !startTime) {
                return { content: [{ type: 'text', text: JSON.stringify({ success: false, message: 'Missing openId or startTime' }) }] };
            }
            const body = { openId, startTime, endTime, pageIndex, pageSize };
            return await performRequest(`${CONFIG.MEETING_ROOM_BASE_URL}/freeRooms?accessToken=${token}`, body, 'POST', name);
        }

        else if (name === 'meeting_getMeetingRoomAttendees') {
            const token = await authManager.getToken('meeting-room');
            const { orderId } = args;
            if (!orderId) {
                return { content: [{ type: 'text', text: JSON.stringify({ success: false, message: 'Missing orderId' }) }] };
            }
            const body = { orderId };
            return await performRequest(`${CONFIG.MEETING_ROOM_BASE_URL}/getActors?accessToken=${token}`, body, 'POST', name);
        }

        // --- Schedule Tools (Use Schedule Token) ---
        else if (name === 'meeting_createMeeting') {
            const token = await authManager.getToken('schedule');
            // Backend API expects 'openid' (lowercase d)
            const body = { ...args };
            if (body.openId !== undefined) {
                body.openid = body.openId;
                delete body.openId;
            }
            return await performRequest(`${CONFIG.SCHEDULE_BASE_URL}/create?accessToken=${token}`, body, 'POST', name);
        }

        else if (name === 'meeting_getMeetingDetail') {
            const token = await authManager.getToken('schedule');
            return await performRequest(`${CONFIG.SCHEDULE_BASE_URL}/detail?accessToken=${token}`, args, 'POST', name);
        }

        else if (name === 'meeting_cancelMeeting') {
            const token = await authManager.getToken('schedule');
            const body = { ...args };
            if (body.openId !== undefined) { body.openid = body.openId; delete body.openId; }
            return await performRequest(`${CONFIG.SCHEDULE_BASE_URL}/cancel?accessToken=${token}`, body, 'POST', name);
        }

        else if (name === 'meeting_queryMeetingsByDay') {
            const token = await authManager.getToken('schedule');
            return await performRequest(`${CONFIG.SCHEDULE_BASE_URL}/queryByDay?accessToken=${token}`, args, 'POST', name);
        }

        else if (name === 'meeting_updateMeeting') {
            const token = await authManager.getToken('schedule');
            const body = { ...args };
            if (body.openId !== undefined) { body.openid = body.openId; delete body.openId; }
            return await performRequest(`${CONFIG.SCHEDULE_BASE_URL}/modify?accessToken=${token}`, body, 'POST', name);
        }

        else if (name === 'meeting_queryMeetingsByRange') {
            const token = await authManager.getToken('schedule');
            return await performRequest(`${CONFIG.SCHEDULE_BASE_URL}/queryByRange?accessToken=${token}`, args, 'POST', name);
        }

        else if (name === 'meeting_getRecentMeetings') {
            const token = await authManager.getToken('schedule');
            // The endpoint according to docs is pageRecentList
            return await performRequest(`${CONFIG.SCHEDULE_BASE_URL}/pageRecentList?accessToken=${token}`, args, 'POST', name);
        }

        else if (name === 'meeting_queryUserMeetings') {
            const token = await authManager.getToken('schedule');
            const { openId, pageNum = 1, pageSize = 10, status } = args;
            if (!openId) {
                return { content: [{ type: 'text', text: JSON.stringify({ success: false, message: 'Missing openId' }) }] };
            }
            const body = { pageNum, pageSize, openId, ...(status !== undefined ? { status } : {}) };
            return await performRequest(`${CONFIG.SCHEDULE_BASE_URL}/queryByUser?accessToken=${token}`, body, 'POST', name);
        }

        else {
            return {
                content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }, null, 2) }],
                isError: true,
            };
        }
    } catch (error) {
        await logger.logError(name, error);
        return {
            content: [{ type: 'text', text: JSON.stringify({ error: error.message }, null, 2) }],
            isError: true,
        };
    }
});

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write(`Meeting Assistant MCP Server running on stdio\nLogs → ${logger.LOG_FILE}\n`);
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
