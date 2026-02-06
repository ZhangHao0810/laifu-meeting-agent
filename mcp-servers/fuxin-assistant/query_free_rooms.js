/**
 * 查询当前空闲的会议室
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function queryFreeRooms() {
    console.log('=== 查询空闲会议室 ===\n');

    const transport = new StdioClientTransport({
        command: 'node',
        args: ['src/index.js']
    });

    const client = new Client({
        name: 'query-client',
        version: '1.0.0'
    }, {
        capabilities: {}
    });

    await client.connect(transport);
    console.log('✅ 已连接到 FuXin Assistant MCP Server\n');

    try {
        // 查询当前时间开始，2小时后结束的空闲会议室
        const now = Date.now();
        const twoHoursLater = now + (2 * 60 * 60 * 1000);

        console.log(`📅 查询时间段:`);
        console.log(`   开始: ${new Date(now).toLocaleString('zh-CN')}`);
        console.log(`   结束: ${new Date(twoHoursLater).toLocaleString('zh-CN')}\n`);

        const result = await client.callTool({
            name: 'getFreeMeetingRooms',
            arguments: {
                openId: 'demo_user_001',
                startTime: now,
                endTime: twoHoursLater,
                pageIndex: 1,
                pageSize: 50
            }
        });

        const data = JSON.parse(result.content[0].text);

        if (data.successFlag && data.content) {
            console.log(`🏢 找到 ${data.records} 个空闲会议室:\n`);

            // 按城市分组
            const roomsByCity = {};
            data.content.forEach(room => {
                if (!roomsByCity[room.city]) {
                    roomsByCity[room.city] = [];
                }
                roomsByCity[room.city].push(room);
            });

            // 显示结果
            Object.keys(roomsByCity).sort().forEach(city => {
                console.log(`📍 ${city}:`);
                roomsByCity[city].forEach(room => {
                    const approveStatus = room.approve ? '🔒 需审批' : '✅ 直接预订';
                    console.log(`   • ${room.roomName}`);
                    console.log(`     位置: ${room.roomDetail}`);
                    console.log(`     容量: ${room.limitCount}人 | ${approveStatus}`);
                    console.log(`     ID: ${room.roomId}\n`);
                });
            });

            console.log(`\n总计: ${data.records} 个会议室可用`);
        } else {
            console.log('❌ 查询失败:', data.message);
        }

    } catch (error) {
        console.error('❌ 查询出错:', error.message);
    } finally {
        await client.close();
    }
}

queryFreeRooms().catch(console.error);
