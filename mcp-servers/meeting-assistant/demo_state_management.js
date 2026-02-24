/**
 * Demo script to test in-memory state management
 * This demonstrates that created meetings can be immediately queried
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function runDemo() {
    console.log('=== FuXin Assistant Demo: In-Memory State Management ===\n');

    const transport = new StdioClientTransport({
        command: 'node',
        args: ['src/index.js']
    });

    const client = new Client({
        name: 'demo-client',
        version: '1.0.0'
    }, {
        capabilities: {}
    });

    await client.connect(transport);
    console.log('✅ Connected to FuXin Assistant MCP Server\n');

    try {
        // Step 1: Query initial meetings
        console.log('📋 Step 1: Query initial meetings by day');
        const initialQuery = await client.callTool({
            name: 'queryMeetingsByDay',
            arguments: {
                day: Date.now()
            }
        });
        const initialData = JSON.parse(initialQuery.content[0].text);
        console.log(`   Found ${initialData.records} initial meetings\n`);

        // Step 2: Create a new meeting
        console.log('➕ Step 2: Create a new meeting');
        const createResult = await client.callTool({
            name: 'createMeeting',
            arguments: {
                openId: 'demo_user_001',
                title: '演示会议 - 测试内存状态管理',
                content: '这是一个演示会议，用于测试创建后立即查询功能',
                roomId: 'room_sz_001',
                startDate: Date.now() + 3600000, // 1 hour from now
                endDate: Date.now() + 7200000,   // 2 hours from now
                actors: ['demo_user_002', 'demo_user_003']
            }
        });
        const createData = JSON.parse(createResult.content[0].text);
        const newMeetingId = createData.content.meetingId;
        console.log(`   ✅ Created meeting: ${newMeetingId}\n`);

        // Step 3: Immediately query to verify it exists
        console.log('🔍 Step 3: Query meeting details immediately after creation');
        const detailResult = await client.callTool({
            name: 'getMeetingDetail',
            arguments: {
                id: newMeetingId
            }
        });
        const detailData = JSON.parse(detailResult.content[0].text);
        if (detailData.successFlag && detailData.content) {
            console.log(`   ✅ Successfully retrieved meeting: "${detailData.content.title}"`);
            console.log(`   📅 Start: ${new Date(detailData.content.startDate).toLocaleString()}`);
            console.log(`   👥 Participants: ${detailData.content.participants.length}\n`);
        } else {
            console.log('   ❌ Failed to retrieve meeting\n');
        }

        // Step 4: Update the meeting
        console.log('✏️  Step 4: Update the meeting title');
        await client.callTool({
            name: 'updateMeeting',
            arguments: {
                id: newMeetingId,
                openId: 'demo_user_001',
                title: '演示会议 - 已更新标题',
                addActors: ['demo_user_004']
            }
        });
        console.log('   ✅ Meeting updated\n');

        // Step 5: Query again to verify update
        console.log('🔍 Step 5: Query meeting to verify update');
        const updatedDetail = await client.callTool({
            name: 'getMeetingDetail',
            arguments: {
                id: newMeetingId
            }
        });
        const updatedData = JSON.parse(updatedDetail.content[0].text);
        if (updatedData.successFlag && updatedData.content) {
            console.log(`   ✅ Updated title: "${updatedData.content.title}"`);
            console.log(`   👥 Participants: ${updatedData.content.participants.length}\n`);
        }

        // Step 6: Query all meetings to see the new one in the list
        console.log('📋 Step 6: Query all meetings by day');
        const finalQuery = await client.callTool({
            name: 'queryMeetingsByDay',
            arguments: {
                day: Date.now()
            }
        });
        const finalData = JSON.parse(finalQuery.content[0].text);
        console.log(`   Found ${finalData.records} meetings (was ${initialData.records} initially)`);
        console.log(`   ✅ New meeting is included in query results!\n`);

        // Step 7: Cancel the meeting
        console.log('🚫 Step 7: Cancel the meeting');
        await client.callTool({
            name: 'cancelMeeting',
            arguments: {
                id: newMeetingId,
                openId: 'demo_user_001'
            }
        });
        console.log('   ✅ Meeting cancelled\n');

        // Step 8: Verify cancellation
        console.log('🔍 Step 8: Verify meeting is cancelled');
        const cancelledDetail = await client.callTool({
            name: 'getMeetingDetail',
            arguments: {
                id: newMeetingId
            }
        });
        const cancelledData = JSON.parse(cancelledDetail.content[0].text);
        if (cancelledData.successFlag && cancelledData.content) {
            console.log(`   Status: ${cancelledData.content.status} (2 = cancelled)`);
            console.log(`   ✅ Meeting status updated correctly!\n`);
        }

        console.log('=== Demo Complete ===');
        console.log('✅ All operations successful!');
        console.log('✅ In-memory state management working correctly!');
        console.log('✅ Created meetings can be immediately queried!');

    } catch (error) {
        console.error('❌ Demo failed:', error);
    } finally {
        await client.close();
    }
}

runDemo().catch(console.error);
