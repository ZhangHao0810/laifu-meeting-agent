/**
 * 查询AI部门深圳市的员工信息
 * 使用 getDepartmentMembers 工具
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function queryAIShenzhenEmployees() {
    console.log('=== 查询AI部门深圳市员工 ===\n');

    const transport = new StdioClientTransport({
        command: 'node',
        args: ['../contacts/src/index.js']
    });

    const client = new Client({
        name: 'contacts-client',
        version: '1.0.0'
    }, {
        capabilities: {}
    });

    await client.connect(transport);
    console.log('✅ 已连接到通讯录服务\n');

    try {
        // 使用 getDepartmentMembers 查询AI部门成员，并按深圳市过滤
        console.log('🔍 查询AI产品研发中心部门成员（深圳市）...\n');

        const result = await client.callTool({
            name: 'getDepartmentMembers',
            arguments: {
                orgName: 'AI产品研发中心',
                filters: {
                    BASE_NAME: '深圳市'
                },
                fields: ['CODE', 'NAME', 'BASE_NAME', 'PHONE', 'EMAIL', 'ORG_PATH_NAME', 'CITY']
            }
        });

        const data = JSON.parse(result.content[0].text);

        if (data.successFlag && data.content && data.content.length > 0) {
            console.log(`👥 找到 ${data.content.length} 位AI部门深圳市的员工:\n`);

            data.content.forEach((emp, index) => {
                console.log(`${index + 1}. ${emp.NAME}`);
                console.log(`   工号: ${emp.CODE}`);
                console.log(`   BASE地: ${emp.BASE_NAME || '未知'}`);
                console.log(`   城市: ${emp.CITY || '未知'}`);
                if (emp.PHONE) console.log(`   电话: ${emp.PHONE}`);
                if (emp.EMAIL) console.log(`   邮箱: ${emp.EMAIL}`);
                console.log(`   部门: ${emp.ORG_PATH_NAME || '未知'}`);
                console.log('');
            });

            console.log(`📊 统计: 共 ${data.content.length} 人`);

        } else {
            console.log('❌ 未找到符合条件的员工');
            console.log('提示: 可能是部门名称不匹配或没有深圳市的员工');
            console.log('返回数据:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('❌ 查询出错:', error.message);
        console.error('错误详情:', error);
    } finally {
        await client.close();
    }
}

queryAIShenzhenEmployees().catch(console.error);
