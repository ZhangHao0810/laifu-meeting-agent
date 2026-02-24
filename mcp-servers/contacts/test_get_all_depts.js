
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverProcess = spawn('node', [path.join(__dirname, 'src/index.js')], {
    stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = '';

serverProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const message = JSON.parse(line);
            handleMessage(message);
        } catch (e) {
            console.error('Failed to parse message:', line);
        }
    }
});

let step = 0;

function send(message) {
    const json = JSON.stringify(message);
    serverProcess.stdin.write(json + '\n');
}

function handleMessage(message) {
    if (message.id === 1) { // Initialize response
        console.log('[Step 1] Initialized');
        // Test flat list
        send({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'contacts_getAllDepartments',
                arguments: {}
            }
        });
    } else if (message.id === 2) { // Flat list response
        console.log('[Step 2] Received Flat List Response');
        const content = JSON.parse(message.result.content[0].text);
        console.log(`Total Count: ${content.totalCount}`);
        console.log(`First item: ${JSON.stringify(content.content[0])}`);
        console.log(`Message: ${content.message}`);

        // Test tree structure
        send({
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
                name: 'contacts_getAllDepartments',
                arguments: { tree: true }
            }
        });
    } else if (message.id === 3) { // Tree response
        console.log('[Step 3] Received Tree Response');
        const content = JSON.parse(message.result.content[0].text);
        console.log(`Total Count: ${content.totalCount}`);
        console.log(`Root nodes: ${content.content.length}`);
        console.log(`First root node children count: ${content.content[0].children?.length}`);
        console.log(`Message: ${content.message}`);

        // Cleanup
        serverProcess.kill();
        process.exit(0);
    }
}

// Start
send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
    },
});
