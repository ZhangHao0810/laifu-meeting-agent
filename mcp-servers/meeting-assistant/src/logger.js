import { appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Resolve logs directory relative to project root (two levels up from src/)
const LOG_DIR = join(__dirname, '..', 'logs');
const LOG_FILE = join(LOG_DIR, 'meeting-assistant.log');

// Ensure log directory exists on startup
async function ensureLogDir() {
    if (!existsSync(LOG_DIR)) {
        await mkdir(LOG_DIR, { recursive: true });
    }
}
ensureLogDir().catch((e) => process.stderr.write(`[Logger] Failed to create log dir: ${e.message}\n`));

/**
 * Append a structured log entry to the log file.
 * Falls back to stderr if file write fails.
 * @param {string} level - INFO | ERROR | WARN
 * @param {string} message - Short description
 * @param {object} [data] - Extra structured data
 */
async function log(level, message, data) {
    // Use UTC+8 (Beijing time)
    const now = new Date();
    const timestamp = new Date(now.getTime() + 8 * 60 * 60 * 1000)
        .toISOString()
        .replace('Z', '+08:00');
    const entry = {
        timestamp,
        level,
        message,
        ...(data !== undefined ? { data } : {}),
    };
    const line = JSON.stringify(entry) + '\n';

    // Also mirror to stderr so the MCP host can see live logs
    process.stderr.write(`[${timestamp}] [${level}] ${message}\n`);

    try {
        await appendFile(LOG_FILE, line, 'utf8');
    } catch (e) {
        process.stderr.write(`[Logger] Failed to write log: ${e.message}\n`);
    }
}

/**
 * Log a full HTTP request + response cycle.
 * @param {object} options
 * @param {string} options.tool - MCP tool name
 * @param {string} options.method - HTTP method
 * @param {string} options.url - Full request URL (may contain token)
 * @param {object} [options.requestHeaders] - Request headers
 * @param {object|string} [options.requestBody] - Request body
 * @param {number} options.statusCode - HTTP response status
 * @param {object|string} options.responseBody - Parsed response body
 * @param {number} options.durationMs - Round-trip time in ms
 */
async function logRequest({ tool, method, url, requestHeaders, requestBody, statusCode, responseBody, durationMs }) {
    await log('INFO', `HTTP ${method} → ${url}`, {
        tool,
        request: {
            method,
            url,
            headers: requestHeaders,
            body: requestBody,
        },
        response: {
            statusCode,
            body: responseBody,
        },
        durationMs,
    });
}

/**
 * Log an MCP tool invocation start.
 * @param {string} tool - Tool name
 * @param {object} args - Tool arguments
 */
async function logToolCall(tool, args) {
    await log('INFO', `Tool called: ${tool}`, { args });
}

/**
 * Log an error.
 * @param {string} tool - Tool name
 * @param {Error|string} error
 */
async function logError(tool, error) {
    await log('ERROR', `Error in tool: ${tool}`, {
        error: error instanceof Error ? error.message : String(error),
    });
}

export const logger = { log, logRequest, logToolCall, logError, LOG_FILE };
