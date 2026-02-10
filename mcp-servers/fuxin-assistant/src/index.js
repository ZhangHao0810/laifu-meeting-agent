import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { authManager } from './auth/fuxin-auth.js';
import { CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Load mock data (mutable for in-memory state management)
let meetingRooms = JSON.parse(fs.readFileSync(join(__dirname, '../data/meeting-rooms.json'), 'utf-8'));
let roomBookings = JSON.parse(fs.readFileSync(join(__dirname, '../data/room-bookings.json'), 'utf-8'));
let meetings = JSON.parse(fs.readFileSync(join(__dirname, '../data/meetings.json'), 'utf-8'));

console.error(`Loaded ${meetingRooms.length} meeting rooms, ${roomBookings.length} bookings, ${meetings.length} meetings`);
console.error('[Demo Mode] In-memory state management enabled - changes will persist until server restart');

// Create server instance
const server = new Server(
    {
        name: 'fuxin-assistant',
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
            // Meeting Room Tools
            {
                name: 'hasNewMeetingRoomBooking',
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
                name: 'getMeetingRoomBookings',
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
                name: 'getFreeMeetingRooms',
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
                name: 'getMeetingRoomAttendees',
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
            // Schedule Tools
            {
                name: 'createMeeting',
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
                name: 'getMeetingDetail',
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
                name: 'cancelMeeting',
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
                name: 'queryMeetingsByDay',
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
                name: 'updateMeeting',
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
                name: 'queryMeetingsByRange',
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
                name: 'getRecentMeetings',
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
                name: 'queryUserMeetings',
                description: '查询指定用户的会议列表',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pageNum: {
                            type: 'number',
                            description: '页码，从1开始',
                        },
                        pageSize: {
                            type: 'number',
                            description: '每页大小（建议10-20）',
                        },
                        openId: {
                            type: 'string',
                            description: '用户 openId',
                        },
                        status: {
                            type: 'number',
                            description: '会议状态过滤（0=未开始，1=已结束，null=所有）',
                        },
                    },
                    required: ['pageNum', 'pageSize', 'openId'],
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        // Meeting Room Tools
        if (name === 'hasNewMeetingRoomBooking') {
            const { lastTime } = args;

            let hasNew = false;
            if (lastTime) {
                const lastTimeNum = parseInt(lastTime);
                hasNew = roomBookings.some(booking => parseInt(booking.updateTime) > lastTimeNum);
            } else {
                hasNew = roomBookings.length > 0;
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        hasNew: hasNew,
                        message: 'Api access succeeded',
                        successFlag: true,
                    }, null, 2),
                }],
            };
        }

        else if (name === 'getMeetingRoomBookings') {
            const { lastIndex, pageSize = 50 } = args;

            let filteredBookings = roomBookings;
            if (lastIndex) {
                const lastIndexNum = parseInt(lastIndex);
                filteredBookings = roomBookings.filter(booking => parseInt(booking.updateTime) > lastIndexNum);
            }

            const limitedBookings = filteredBookings.slice(0, Math.min(pageSize, 50));

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        content: {
                            add: limitedBookings,
                            delete: []
                        },
                        message: 'Api access succeeded',
                        successFlag: true,
                    }, null, 2),
                }],
            };
        }

        else if (name === 'getFreeMeetingRooms') {
            const { openId, startTime, endTime, pageIndex = 1, pageSize = 50 } = args;

            if (!openId || !startTime) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            content: [],
                            message: 'Missing required parameters: openId and startTime',
                            successFlag: false,
                        }, null, 2),
                    }],
                };
            }

            // Simple mock: return all rooms (in real implementation, filter by time conflicts)
            const start = (pageIndex - 1) * pageSize;
            const paginatedRooms = meetingRooms.slice(start, start + pageSize);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        content: paginatedRooms,
                        records: paginatedRooms.length,
                        message: 'Api access succeeded',
                        successFlag: true,
                    }, null, 2),
                }],
            };
        }

        else if (name === 'getMeetingRoomAttendees') {
            const { orderId } = args;

            if (!orderId) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            content: [],
                            message: 'Missing required parameter: orderId',
                            successFlag: false,
                        }, null, 2),
                    }],
                };
            }

            // Mock attendees data
            const mockAttendees = [];

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        content: mockAttendees,
                        records: mockAttendees.length,
                        message: 'Api access succeeded',
                        successFlag: true,
                    }, null, 2),
                }],
            };
        }

        // Schedule Tools
        else if (name === 'createMeeting') {
            const { openId, title, content, roomId, startDate, endDate, noticeTimes, actors } = args;

            if (!openId || !title || !roomId || !startDate || !endDate) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            content: null,
                            message: 'Missing required parameters',
                            successFlag: false,
                        }, null, 2),
                    }],
                };
            }

            const newMeetingId = `meeting_${Date.now()}`;
            const now = Date.now();

            // Create new meeting object
            const newMeeting = {
                id: newMeetingId,
                eid: CONFIG.EID,
                title: title,
                content: content || '',
                roomId: roomId,
                startDate: startDate,
                endDate: endDate,
                status: 0,
                createDate: now,
                updateTime: now,
                openId: openId,
                personName: 'Demo User',
                participants: (actors || []).map(actorId => ({
                    openId: actorId,
                    personName: 'Participant',
                    joinStatus: 0,
                    readStatus: 0
                })),
                organizers: [{
                    openId: openId,
                    personName: 'Demo User'
                }]
            };

            // Add to in-memory array
            meetings.push(newMeeting);
            console.error(`[Demo] Created meeting: ${newMeetingId} - "${title}"`);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        content: {
                            meetingId: newMeetingId
                        },
                        message: 'Meeting created successfully',
                        successFlag: true,
                    }, null, 2),
                }],
            };
        }

        else if (name === 'getMeetingDetail') {
            const { id } = args;

            if (!id) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            content: null,
                            message: 'Missing required parameter: id',
                            successFlag: false,
                        }, null, 2),
                    }],
                };
            }

            const meeting = meetings.find(m => m.id === id);

            if (!meeting) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            content: null,
                            message: 'Meeting not found',
                            successFlag: false,
                        }, null, 2),
                    }],
                };
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        content: meeting,
                        message: 'Api access succeeded',
                        successFlag: true,
                    }, null, 2),
                }],
            };
        }

        else if (name === 'cancelMeeting') {
            const { id, openId } = args;

            if (!id || !openId) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            content: null,
                            message: 'Missing required parameters',
                            successFlag: false,
                        }, null, 2),
                    }],
                };
            }

            // Find and update meeting status
            const meeting = meetings.find(m => m.id === id);
            if (meeting) {
                meeting.status = 2; // 2 = cancelled
                meeting.updateTime = Date.now();
                console.error(`[Demo] Cancelled meeting: ${id}`);
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        content: null,
                        message: meeting ? 'Meeting cancelled successfully' : 'Meeting not found but marked as cancelled',
                        successFlag: true,
                    }, null, 2),
                }],
            };
        }

        else if (name === 'queryMeetingsByDay') {
            const { day } = args;

            if (!day) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            content: [],
                            message: 'Missing required parameter: day',
                            successFlag: false,
                        }, null, 2),
                    }],
                };
            }

            // Simple mock: return all meetings
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        content: meetings,
                        records: meetings.length,
                        message: 'Api access succeeded',
                        successFlag: true,
                    }, null, 2),
                }],
            };
        }

        else if (name === 'updateMeeting') {
            const { id, openId, title, content, startDate, endDate, roomId, addActors, delActors } = args;

            if (!id || !openId) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            content: null,
                            message: 'Missing required parameters: id and openId',
                            successFlag: false,
                        }, null, 2),
                    }],
                };
            }

            // Find and update meeting
            const meeting = meetings.find(m => m.id === id);
            if (meeting) {
                if (title) meeting.title = title;
                if (content !== undefined) meeting.content = content;
                if (startDate) meeting.startDate = startDate;
                if (endDate) meeting.endDate = endDate;
                if (roomId) meeting.roomId = roomId;
                meeting.updateTime = Date.now();

                // Handle participant changes
                if (addActors && addActors.length > 0) {
                    addActors.forEach(actorId => {
                        if (!meeting.participants.some(p => p.openId === actorId)) {
                            meeting.participants.push({
                                openId: actorId,
                                personName: 'New Participant',
                                joinStatus: 0,
                                readStatus: 0
                            });
                        }
                    });
                }

                if (delActors && delActors.length > 0) {
                    meeting.participants = meeting.participants.filter(
                        p => !delActors.includes(p.openId)
                    );
                }

                console.error(`[Demo] Updated meeting: ${id}`);
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        content: null,
                        message: meeting ? 'Meeting updated successfully' : 'Meeting not found but marked as updated',
                        successFlag: true,
                    }, null, 2),
                }],
            };
        }

        else if (name === 'queryMeetingsByRange') {
            const { start, end } = args;

            if (!start || !end) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            content: [],
                            message: 'Missing required parameters: start and end',
                            successFlag: false,
                        }, null, 2),
                    }],
                };
            }

            // Mock: filter meetings by time range
            const filteredMeetings = meetings.filter(m =>
                m.startDate >= start && m.endDate <= end
            );

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        content: filteredMeetings,
                        records: filteredMeetings.length,
                        message: 'Api access succeeded',
                        successFlag: true,
                    }, null, 2),
                }],
            };
        }

        else if (name === 'getRecentMeetings') {
            const { lastTime, page, size, roomIds } = args;

            if (!page || !size) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            content: [],
                            message: 'Missing required parameters: page and size',
                            successFlag: false,
                        }, null, 2),
                    }],
                };
            }

            let filteredMeetings = meetings;

            // Filter by lastTime if provided
            if (lastTime) {
                filteredMeetings = filteredMeetings.filter(m =>
                    (m.updateTime || m.createDate) > lastTime
                );
            }

            // Filter by roomIds if provided
            if (roomIds && roomIds.length > 0) {
                filteredMeetings = filteredMeetings.filter(m =>
                    roomIds.includes(m.roomId)
                );
            }

            // Pagination
            const start = (page - 1) * size;
            const paginatedMeetings = filteredMeetings.slice(start, start + size);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        content: paginatedMeetings,
                        records: paginatedMeetings.length,
                        message: 'Api access succeeded',
                        successFlag: true,
                    }, null, 2),
                }],
            };
        }

        else if (name === 'queryUserMeetings') {
            const { pageNum, pageSize, openId, status } = args;

            if (!pageNum || !pageSize || !openId) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            content: [],
                            message: 'Missing required parameters: pageNum, pageSize, and openId',
                            successFlag: false,
                        }, null, 2),
                    }],
                };
            }

            // Filter meetings by openId (creator or participant)
            let userMeetings = meetings.filter(m => {
                if (m.openId === openId) return true;
                if (m.participants && m.participants.some(p => p.openId === openId)) return true;
                return false;
            });

            // Filter by status if provided
            if (status !== undefined && status !== null) {
                userMeetings = userMeetings.filter(m => m.status === status);
            }

            // Pagination
            const start = (pageNum - 1) * pageSize;
            const paginatedMeetings = userMeetings.slice(start, start + pageSize);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        content: paginatedMeetings,
                        records: paginatedMeetings.length,
                        totalRecords: userMeetings.length,
                        message: 'Api access succeeded',
                        successFlag: true,
                    }, null, 2),
                }],
            };
        }

        else {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: `Unknown tool: ${name}`,
                    }, null, 2),
                }],
                isError: true,
            };
        }
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    error: error.message,
                    successFlag: false,
                }, null, 2),
            }],
            isError: true,
        };
    }
});

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('FuXin Assistant MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
