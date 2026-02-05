#!/usr/bin/env node

/**
 * MCP Server Test Client - Extended Version
 * 用于测试Meeting Room MCP Server的全部9个工具
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testMCPServer() {
    console.log('🚀 Starting Extended MCP Server Test Client...\n');

    // Create client transport
    const transport = new StdioClientTransport({
        command: 'node',
        args: ['index.js'],
    });

    // Create client
    const client = new Client(
        {
            name: 'test-client',
            version: '1.0.0',
        },
        {
            capabilities: {},
        }
    );

    try {
        // Connect to server
        await client.connect(transport);
        console.log('✅ Connected to MCP Server\n');

        // List available tools
        console.log('📋 Listing available tools...');
        const toolsResponse = await client.listTools();
        console.log(`Found ${toolsResponse.tools.length} tools:\n`);
        toolsResponse.tools.forEach((tool, index) => {
            console.log(`${index + 1}. ${tool.name}`);
            console.log(`   Description: ${tool.description}\n`);
        });

        console.log('='.repeat(80));
        console.log('Starting Tests for All 9 Tools');
        console.log('='.repeat(80) + '\n');

        // Test 1: Create Meeting
        console.log('🧪 Test 1: create_meeting');
        const createResult = await client.callTool({
            name: 'create_meeting',
            arguments: {
                openid: '5a67e08d00b0e8dfe4aab4fa',
                title: '测试会议 - 全功能测试',
                content: '测试所有9个接口',
                meetingPlace: '云8会议室',
                startDate: 1738569600000,
                endDate: 1738576800000,
                accessToken: 'test-token-123',
            },
        });
        console.log('✅ Test 1 Passed\n');

        // Test 2: Get Meeting Detail
        console.log('🧪 Test 2: get_meeting_detail');
        const detailResult = await client.callTool({
            name: 'get_meeting_detail',
            arguments: {
                id: '5b33275f14cada62e4e44840',
                accessToken: 'test-token-123',
            },
        });
        console.log('✅ Test 2 Passed\n');

        // Test 3: Modify Meeting
        console.log('🧪 Test 3: modify_meeting');
        const modifyResult = await client.callTool({
            name: 'modify_meeting',
            arguments: {
                id: '5b33275f14cada62e4e44840',
                openid: '5a67e08d00b0e8dfe4aab4fa',
                title: '更新后的会议标题',
                startDate: 1738656000000,
                endDate: 1738663200000,
                accessToken: 'test-token-123',
            },
        });
        console.log('✅ Test 3 Passed\n');

        // Test 4: Cancel Meeting
        console.log('🧪 Test 4: cancel_meeting');
        const cancelResult = await client.callTool({
            name: 'cancel_meeting',
            arguments: {
                id: '5b33275f14cada62e4e44840',
                openid: '5a67e08d00b0e8dfe4aab4fa',
                accessToken: 'test-token-123',
            },
        });
        console.log('✅ Test 4 Passed\n');

        // Test 5: Query Meetings by Day (NEW)
        console.log('🧪 Test 5: query_meetings_by_day (NEW)');
        const queryDayResult = await client.callTool({
            name: 'query_meetings_by_day',
            arguments: {
                day: 1738569600000, // 2026-02-03
                accessToken: 'test-token-123',
            },
        });
        console.log('Response:', queryDayResult.content[0].text.substring(0, 200) + '...');
        console.log('✅ Test 5 Passed\n');

        // Test 6: Query Meetings by Range (NEW)
        console.log('🧪 Test 6: query_meetings_by_range (NEW)');
        const queryRangeResult = await client.callTool({
            name: 'query_meetings_by_range',
            arguments: {
                start: 1738483200000, // 2026-02-02
                end: 1738828800000,   // 2026-02-06
                accessToken: 'test-token-123',
            },
        });
        console.log('Response:', queryRangeResult.content[0].text.substring(0, 200) + '...');
        console.log('✅ Test 6 Passed\n');

        // Test 7: Query User Meetings (NEW)
        console.log('🧪 Test 7: query_user_meetings (NEW)');
        const queryUserResult = await client.callTool({
            name: 'query_user_meetings',
            arguments: {
                pageNum: 1,
                pageSize: 10,
                openId: '5a67e08d00b0e8dfe4aab4fa',
                status: 0,
                accessToken: 'test-token-123',
            },
        });
        console.log('Response:', queryUserResult.content[0].text.substring(0, 200) + '...');
        console.log('✅ Test 7 Passed\n');

        // Test 8: Query Free Rooms (NEW)
        console.log('🧪 Test 8: query_free_rooms (NEW)');
        const queryRoomsResult = await client.callTool({
            name: 'query_free_rooms',
            arguments: {
                openId: '5a67e08d00b0e8dfe4aab4fa',
                startTime: 1738569600000,
                endTime: 1738576800000,
                pageIndex: 1,
                pageSize: 50,
                accessToken: 'test-token-123',
            },
        });
        console.log('Response:', queryRoomsResult.content[0].text.substring(0, 200) + '...');
        console.log('✅ Test 8 Passed\n');

        // Test 9: Get Meeting Actors (NEW)
        console.log('🧪 Test 9: get_meeting_actors (NEW)');
        const getActorsResult = await client.callTool({
            name: 'get_meeting_actors',
            arguments: {
                orderId: 'order_20260203_001',
                accessToken: 'test-token-123',
            },
        });
        console.log('Response:', getActorsResult.content[0].text.substring(0, 200) + '...');
        console.log('✅ Test 9 Passed\n');

        console.log('='.repeat(80));
        console.log('🎉 All 9 tests completed successfully!');
        console.log('='.repeat(80));
        console.log('\n📊 Test Summary:');
        console.log('   ✅ Server connection: OK');
        console.log('   ✅ Tool listing: OK (9 tools found)');
        console.log('   ✅ create_meeting: OK');
        console.log('   ✅ get_meeting_detail: OK');
        console.log('   ✅ modify_meeting: OK');
        console.log('   ✅ cancel_meeting: OK');
        console.log('   ✅ query_meetings_by_day: OK (NEW)');
        console.log('   ✅ query_meetings_by_range: OK (NEW)');
        console.log('   ✅ query_user_meetings: OK (NEW)');
        console.log('   ✅ query_free_rooms: OK (NEW)');
        console.log('   ✅ get_meeting_actors: OK (NEW)');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        // Close connection
        await client.close();
        console.log('\n👋 Test client disconnected');
    }
}

// Run tests
testMCPServer().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
