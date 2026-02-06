/**
 * 查询AI部门员工的城市分布
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function queryAIDepartmentCities() {
    console.log('=== 查询AI部门员工城市分布 ===\n');

    const transport = new StdioClientTransport({
        command: 'node',
        args: ['../new-contacts/src/index.js']
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
        // 查询AI部门信息
        console.log('🔍 查询AI产品研发中心部门信息...\n');
        const deptResult = await client.callTool({
            name: 'getDepartmentInfo',
            arguments: {
                departmentName: 'AI产品研发中心'
            }
        });

        const deptData = JSON.parse(deptResult.content[0].text);

        if (deptData.successFlag && deptData.content.length > 0) {
            const aiDept = deptData.content[0];
            console.log(`📊 部门信息:`);
            console.log(`   名称: ${aiDept.NAME}`);
            console.log(`   路径: ${aiDept.ORG_PATH_NAME}`);
            console.log(`   员工数: ${aiDept.employeeCount || '未知'}\n`);

            // 获取部门员工列表
            if (aiDept.employees && aiDept.employees.length > 0) {
                console.log(`👥 员工列表 (共 ${aiDept.employees.length} 人):\n`);

                // 按城市分组统计
                const cityCounts = {};
                const cityEmployees = {};

                aiDept.employees.forEach(emp => {
                    const city = emp.CITY || '未知';
                    if (!cityCounts[city]) {
                        cityCounts[city] = 0;
                        cityEmployees[city] = [];
                    }
                    cityCounts[city]++;
                    cityEmployees[city].push(emp.NAME);
                });

                // 按人数排序
                const sortedCities = Object.keys(cityCounts).sort((a, b) => cityCounts[b] - cityCounts[a]);

                console.log('🌍 城市分布统计:\n');
                sortedCities.forEach((city, index) => {
                    const count = cityCounts[city];
                    const percentage = ((count / aiDept.employees.length) * 100).toFixed(1);
                    console.log(`${index + 1}. ${city}: ${count}人 (${percentage}%)`);
                    console.log(`   员工: ${cityEmployees[city].join('、')}\n`);
                });

                console.log('📈 总结:');
                console.log(`   总人数: ${aiDept.employees.length}人`);
                console.log(`   分布城市: ${sortedCities.length}个`);
                console.log(`   主要城市: ${sortedCities[0]} (${cityCounts[sortedCities[0]]}人)`);

            } else {
                console.log('   暂无员工数据');
            }
        } else {
            console.log('❌ 未找到AI产品研发中心部门');
        }

    } catch (error) {
        console.error('❌ 查询出错:', error.message);
    } finally {
        await client.close();
    }
}

queryAIDepartmentCities().catch(console.error);
