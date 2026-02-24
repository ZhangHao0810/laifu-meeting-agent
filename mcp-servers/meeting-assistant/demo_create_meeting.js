/**
 * 演示：预定会议室
 * 场景：AI部门的王星预定今天下午3-5点的深圳创新会议室，邀请孙薇洁
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function createMeetingDemo() {
    console.log('=== 会议预定演示 ===\n');

    // 连接通讯录服务
    console.log('📞 步骤1: 连接通讯录服务，查询用户信息...\n');
    const contactsTransport = new StdioClientTransport({
        command: 'node',
        args: ['../contacts/src/index.js']
    });

    const contactsClient = new Client({
        name: 'contacts-client',
        version: '1.0.0'
    }, {
        capabilities: {}
    });

    await contactsClient.connect(contactsTransport);

    // 查询王星的信息
    console.log('🔍 查询：王星（AI部门）');
    const wangxingResult = await contactsClient.callTool({
        name: 'getUserByName',
        arguments: {
            name: '王星'
        }
    });
    const wangxingData = JSON.parse(wangxingResult.content[0].text);

    let wangxing = null;
    if (wangxingData.successFlag && wangxingData.content.length > 0) {
        // 找AI部门的王星
        wangxing = wangxingData.content.find(user => user.ORG_PATH_NAME.includes('AI'));
        if (wangxing) {
            console.log(`   ✅ 找到: ${wangxing.NAME}`);
            console.log(`   部门: ${wangxing.ORG_PATH_NAME}`);
            console.log(`   CODE: ${wangxing.CODE}\n`);
        }
    }

    if (!wangxing) {
        console.log('   ❌ 未找到AI部门的王星\n');
        await contactsClient.close();
        return;
    }

    // 查询孙薇洁的信息
    console.log('🔍 查询：孙薇洁（AI部门）');
    const sunweijieResult = await contactsClient.callTool({
        name: 'getUserByName',
        arguments: {
            name: '孙薇洁'
        }
    });
    const sunweijieData = JSON.parse(sunweijieResult.content[0].text);

    let sunweijie = null;
    if (sunweijieData.successFlag && sunweijieData.content.length > 0) {
        sunweijie = sunweijieData.content.find(user => user.ORG_PATH_NAME.includes('AI'));
        if (sunweijie) {
            console.log(`   ✅ 找到: ${sunweijie.NAME}`);
            console.log(`   部门: ${sunweijie.ORG_PATH_NAME}`);
            console.log(`   CODE: ${sunweijie.CODE}\n`);
        }
    }

    if (!sunweijie) {
        console.log('   ❌ 未找到AI部门的孙薇洁\n');
    }

    await contactsClient.close();

    // 连接FuXin助手服务
    console.log('🏢 步骤2: 连接FuXin助手服务，创建会议...\n');
    const fuxinTransport = new StdioClientTransport({
        command: 'node',
        args: ['src/index.js']
    });

    const fuxinClient = new Client({
        name: 'fuxin-client',
        version: '1.0.0'
    }, {
        capabilities: {}
    });

    await fuxinClient.connect(fuxinTransport);

    // 计算今天下午3点到5点的时间戳
    const today = new Date();
    const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0, 0);
    const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0, 0);

    console.log('📅 会议信息:');
    console.log(`   会议室: 深圳创新会议室 (room_sz_002)`);
    console.log(`   时间: ${startTime.toLocaleString('zh-CN')} - ${endTime.toLocaleString('zh-CN')}`);
    console.log(`   发起人: ${wangxing.NAME} (${wangxing.CODE})`);
    if (sunweijie) {
        console.log(`   参与人: ${sunweijie.NAME} (${sunweijie.CODE})\n`);
    } else {
        console.log(`   参与人: (未找到孙薇洁)\n`);
    }

    // 创建会议
    const actors = sunweijie ? [sunweijie.CODE] : [];

    const createResult = await fuxinClient.callTool({
        name: 'createMeeting',
        arguments: {
            openId: wangxing.CODE,
            title: 'AI部门技术讨论会',
            content: '讨论AI项目进展和技术方案',
            roomId: 'room_sz_002',
            startDate: startTime.getTime(),
            endDate: endTime.getTime(),
            actors: actors
        }
    });

    const createData = JSON.parse(createResult.content[0].text);

    if (createData.successFlag) {
        const meetingId = createData.content.meetingId;
        console.log('✅ 会议创建成功!');
        console.log(`   会议ID: ${meetingId}\n`);

        // 立即查询验证
        console.log('🔍 步骤3: 立即查询会议详情验证...\n');
        const detailResult = await fuxinClient.callTool({
            name: 'getMeetingDetail',
            arguments: {
                id: meetingId
            }
        });

        const detailData = JSON.parse(detailResult.content[0].text);

        if (detailData.successFlag && detailData.content) {
            const meeting = detailData.content;
            console.log('✅ 查询成功! 会议详情:');
            console.log(`   标题: ${meeting.title}`);
            console.log(`   内容: ${meeting.content}`);
            console.log(`   会议室: ${meeting.roomId}`);
            console.log(`   开始时间: ${new Date(meeting.startDate).toLocaleString('zh-CN')}`);
            console.log(`   结束时间: ${new Date(meeting.endDate).toLocaleString('zh-CN')}`);
            console.log(`   状态: ${meeting.status === 0 ? '未开始' : '其他'}`);
            console.log(`   发起人: ${meeting.personName}`);
            console.log(`   参与人数: ${meeting.participants.length}\n`);

            console.log('🎉 演示完成!');
            console.log('✅ 创建的会议可以立即查询到！');
            console.log('✅ 内存状态管理工作正常！');
        } else {
            console.log('❌ 查询会议详情失败');
        }
    } else {
        console.log('❌ 会议创建失败:', createData.message);
    }

    await fuxinClient.close();
}

createMeetingDemo().catch(console.error);
