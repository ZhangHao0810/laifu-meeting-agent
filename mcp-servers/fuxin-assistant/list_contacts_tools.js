/**
 * 查询通讯录MCP的可用工具
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function listContactsTools() {
    console.log('=== 查询通讯录MCP可用工具 ===\n');

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
        const tools = await client.listTools();

        console.log(`📋 可用工具列表 (共 ${tools.tools.length} 个):\n`);

        tools.tools.forEach((tool, index) => {
            console.log(`${index + 1}. ${tool.name}`);
            console.log(`   描述: ${tool.description}`);
            if (tool.inputSchema && tool.inputSchema.properties) {
                console.log(`   参数:`);
                Object.keys(tool.inputSchema.properties).forEach(param => {
                    const prop = tool.inputSchema.properties[param];
                    const required = tool.inputSchema.required && tool.inputSchema.required.includes(param) ? '必填' : '可选';
                    console.log(`      - ${param} (${required}): ${prop.description || ''}`);
                });
            }
            console.log('');
        });

    } catch (error) {
        console.error('❌ 查询出错:', error.message);
    } finally {
        await client.close();
    }
}

listContactsTools().catch(console.error);
