#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load mock data
const mockData = JSON.parse(
  readFileSync(join(__dirname, 'mock-data.json'), 'utf-8')
);

// Create server instance
const server = new Server(
  {
    name: 'meeting-room-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool schemas using Zod
const CreateMeetingSchema = z.object({
  openid: z.string().describe('会议发起人的id'),
  title: z.string().describe('会议标题'),
  content: z.string().optional().describe('会议内容'),
  meetingPlace: z.string().optional().describe('会议室地址'),
  startDate: z.number().describe('会议开始时间戳(毫秒)'),
  endDate: z.number().describe('会议结束时间戳(毫秒)'),
  roomId: z.string().optional().describe('会议室id'),
  noticeTimes: z.array(z.number()).optional().describe('提醒时间(-1:不提醒、0:开始时间提醒、15:开始时间前15分钟提醒、60:开始时间前1小时提醒)'),
  actors: z.array(z.string()).optional().describe('协作人oid的集合'),
  type: z.string().optional().describe('会议类型(null:普通会议、sign:线下签到类会议、voice:语音类会议)'),
  accessToken: z.string().describe('访问令牌'),
});

const ModifyMeetingSchema = z.object({
  id: z.string().describe('会议id'),
  openid: z.string().describe('会议发起人的oid'),
  title: z.string().describe('会议标题'),
  content: z.string().optional().describe('会议内容'),
  meetingPlace: z.string().optional().describe('会议室地址'),
  startDate: z.number().describe('会议开始时间戳(毫秒)'),
  endDate: z.number().describe('会议结束时间戳(毫秒)'),
  roomId: z.string().optional().describe('会议室id'),
  noticeTimes: z.array(z.number()).optional().describe('提醒时间(-1:不提醒、0:开始时间提醒、15:开始时间前15分钟提醒、60:开始时间前1小时提醒)'),
  actors: z.array(z.string()).optional().describe('协作人oid的集合'),
  type: z.string().optional().describe('会议类型(null:普通会议、sign:线下签到类会议、voice:语音类会议)'),
  accessToken: z.string().describe('访问令牌'),
});

const GetMeetingDetailSchema = z.object({
  id: z.string().describe('会议id'),
  accessToken: z.string().describe('访问令牌'),
});

const CancelMeetingSchema = z.object({
  id: z.string().describe('会议id'),
  openid: z.string().describe('会议发起人的oid'),
  accessToken: z.string().describe('访问令牌'),
});

// Helper function to generate random meeting ID
function generateMeetingId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_meeting',
        description: '新增单个会议。创建一个新的会议,支持设置会议标题、内容、时间、地点、参与人等信息。',
        inputSchema: {
          type: 'object',
          properties: {
            openid: {
              type: 'string',
              description: '会议发起人的id',
            },
            title: {
              type: 'string',
              description: '会议标题',
            },
            content: {
              type: 'string',
              description: '会议内容',
            },
            meetingPlace: {
              type: 'string',
              description: '会议室地址',
            },
            startDate: {
              type: 'number',
              description: '会议开始时间戳(毫秒)',
            },
            endDate: {
              type: 'number',
              description: '会议结束时间戳(毫秒)',
            },
            roomId: {
              type: 'string',
              description: '会议室id',
            },
            noticeTimes: {
              type: 'array',
              items: { type: 'number' },
              description: '提醒时间(-1:不提醒、0:开始时间提醒、15:开始时间前15分钟提醒、60:开始时间前1小时提醒)',
            },
            actors: {
              type: 'array',
              items: { type: 'string' },
              description: '协作人oid的集合',
            },
            type: {
              type: 'string',
              description: '会议类型(null:普通会议、sign:线下签到类会议、voice:语音类会议)',
            },
            accessToken: {
              type: 'string',
              description: '访问令牌',
            },
          },
          required: ['openid', 'title', 'startDate', 'endDate', 'accessToken'],
        },
      },
      {
        name: 'modify_meeting',
        description: '修改单个会议。更新已存在的会议信息,包括标题、内容、时间、地点等。',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '会议id',
            },
            openid: {
              type: 'string',
              description: '会议发起人的oid',
            },
            title: {
              type: 'string',
              description: '会议标题',
            },
            content: {
              type: 'string',
              description: '会议内容',
            },
            meetingPlace: {
              type: 'string',
              description: '会议室地址',
            },
            startDate: {
              type: 'number',
              description: '会议开始时间戳(毫秒)',
            },
            endDate: {
              type: 'number',
              description: '会议结束时间戳(毫秒)',
            },
            roomId: {
              type: 'string',
              description: '会议室id',
            },
            noticeTimes: {
              type: 'array',
              items: { type: 'number' },
              description: '提醒时间(-1:不提醒、0:开始时间提醒、15:开始时间前15分钟提醒、60:开始时间前1小时提醒)',
            },
            actors: {
              type: 'array',
              items: { type: 'string' },
              description: '协作人oid的集合',
            },
            type: {
              type: 'string',
              description: '会议类型(null:普通会议、sign:线下签到类会议、voice:语音类会议)',
            },
            accessToken: {
              type: 'string',
              description: '访问令牌',
            },
          },
          required: ['id', 'openid', 'title', 'startDate', 'endDate', 'accessToken'],
        },
      },
      {
        name: 'get_meeting_detail',
        description: '查看单个会议详情。根据会议id获取会议的完整信息,包括发起人、标题、内容、时间、地点、参与人等。',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '会议id',
            },
            accessToken: {
              type: 'string',
              description: '访问令牌',
            },
          },
          required: ['id', 'accessToken'],
        },
      },
      {
        name: 'cancel_meeting',
        description: '取消单个会议。只有会议发起人才能取消会议。',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '会议id',
            },
            openid: {
              type: 'string',
              description: '会议发起人的oid',
            },
            accessToken: {
              type: 'string',
              description: '访问令牌',
            },
          },
          required: ['id', 'openid', 'accessToken'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_meeting': {
        const params = CreateMeetingSchema.parse(args);
        
        // Generate a new meeting ID
        const newMeetingId = generateMeetingId();
        
        // Return mock success response with the generated ID
        const response = {
          ...mockData.createMeeting.success,
          data: {
            meetingId: newMeetingId,
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'modify_meeting': {
        const params = ModifyMeetingSchema.parse(args);
        
        // Check if meeting exists in sample data
        const meetingExists = mockData.sampleMeetings.some(m => m.id === params.id);
        
        if (!meetingExists && params.id !== '5b33275f14cada62e4e44840') {
          // Return error if meeting not found
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(mockData.modifyMeeting.error, null, 2),
              },
            ],
          };
        }

        // Return success response
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mockData.modifyMeeting.success, null, 2),
            },
          ],
        };
      }

      case 'get_meeting_detail': {
        const params = GetMeetingDetailSchema.parse(args);
        
        // Check if meeting exists in sample data
        const meeting = mockData.sampleMeetings.find(m => m.id === params.id);
        
        if (!meeting && params.id !== '5b33275f14cada62e4e44840') {
          // Return error if meeting not found
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(mockData.getMeetingDetail.notFound, null, 2),
              },
            ],
          };
        }

        // Return success response with meeting detail
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mockData.getMeetingDetail.success, null, 2),
            },
          ],
        };
      }

      case 'cancel_meeting': {
        const params = CancelMeetingSchema.parse(args);
        
        // Check if meeting exists in sample data
        const meeting = mockData.sampleMeetings.find(m => m.id === params.id);
        
        if (!meeting && params.id !== '5b33275f14cada62e4e44840') {
          // Return error if meeting not found
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(mockData.cancelMeeting.notFound, null, 2),
              },
            ],
          };
        }

        // Check if the user is the creator
        if (meeting && meeting.openid !== params.openid) {
          // Return error if not the creator
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(mockData.cancelMeeting.notCreator, null, 2),
              },
            ],
          };
        }

        // Return success response
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mockData.cancelMeeting.success, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${error.message}`);
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Meeting Room MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
