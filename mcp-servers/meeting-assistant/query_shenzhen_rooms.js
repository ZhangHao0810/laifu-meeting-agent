/**
 * 查询深圳市的空闲会议室
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function queryShenzhenRooms() {
    console.log('=== 查询深圳市空闲会议室 ===\n');

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
        // 查询当前时间开始的空闲会议室
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
            // 筛选深圳市的会议室
            const shenzhenRooms = data.content.filter(room => room.city === '深圳市');

            console.log(`🏢 深圳市空闲会议室 (共 ${shenzhenRooms.length} 个):\n`);

            shenzhenRooms.forEach((room, index) => {
                const approveStatus = room.approve ? '🔒 需审批' : '✅ 直接预订';
                const videoStatus = room.roomName.includes('视频') ? '📹 可开视频会议' : '';

                console.log(`${index + 1}. ${room.roomName}`);
                console.log(`   📍 位置: ${room.roomDetail}`);
                console.log(`   👥 容量: ${room.limitCount}人`);
                console.log(`   ${approveStatus} ${videoStatus}`);
                console.log(`   🆔 ID: ${room.roomId}\n`);
            });

            if (shenzhenRooms.length === 0) {
                console.log('   暂无空闲会议室\n');
            }

        } else {
            console.log('❌ 查询失败:', data.message);
        }

    } catch (error) {
        console.error('❌ 查询出错:', error.message);
    } finally {
        await client.close();
    }
}

queryShenzhenRooms().catch(console.error);
