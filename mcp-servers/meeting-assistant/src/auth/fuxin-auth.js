import { CONFIG } from '../config.js';
import { logger } from '../logger.js';

/**
 * FuXin Authentication Manager
 * Manages access tokens for meeting-room and schedule assistants
 * Supports token caching and automatic refresh
 */
export class FuXinAuthManager {
    constructor() {
        // Token storage for both assistants
        this.tokens = {
            'meeting-room': {
                accessToken: null,
                refreshToken: null,
                expiresAt: null
            },
            'schedule': {
                accessToken: null,
                refreshToken: null,
                expiresAt: null
            }
        };
    }

    /**
     * Get valid access token for specified assistant type
     * Automatically refreshes if token is about to expire
     * @param {string} assistantType - 'meeting-room' or 'schedule'
     * @returns {Promise<string>} Valid access token
     */
    async getToken(assistantType) {
        if (!['meeting-room', 'schedule'].includes(assistantType)) {
            throw new Error(`Invalid assistant type: ${assistantType}`);
        }

        const tokenInfo = this.tokens[assistantType];
        const now = Date.now();

        // Check if token exists and is still valid (with buffer)
        if (tokenInfo.accessToken && tokenInfo.expiresAt > now + CONFIG.TOKEN_REFRESH_BUFFER_MS) {
            return tokenInfo.accessToken;
        }

        // Try to refresh if refresh token exists
        if (tokenInfo.refreshToken && tokenInfo.expiresAt) {
            try {
                await this.refreshToken(assistantType);
                return this.tokens[assistantType].accessToken;
            } catch (error) {
                console.error(`Failed to refresh token for ${assistantType}:`, error.message);
                // Fall through to get new token
            }
        }

        // Get new token
        await this.fetchNewToken(assistantType);
        return this.tokens[assistantType].accessToken;
    }

    /**
     * Fetch a new access token from FuXin API
     * @param {string} assistantType - 'meeting-room' or 'schedule'
     */
    async fetchNewToken(assistantType) {
        const secret = CONFIG.SECRETS[assistantType];
        const timestamp = Date.now().toString();

        const requestBody = {
            eid: CONFIG.EID,
            secret: secret,
            timestamp: timestamp,
            scope: CONFIG.SCOPE
        };

        const requestHeaders = { 'Content-Type': 'application/json' };
        const startTime = Date.now();
        const authUrl = `${CONFIG.AUTH_BASE_URL}/getAccessToken`;
        const toolLabel = `auth:getAccessToken(${assistantType})`;

        let response, data;
        try {
            response = await fetch(authUrl, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestBody)
            });
        } catch (networkError) {
            // Network-level failure (DNS / connection refused / timeout)
            await logger.logError(toolLabel, `Network error calling ${authUrl}: ${networkError.message}`);
            throw new Error(`Failed to fetch new token for ${assistantType}: ${networkError.message}`);
        }

        const durationMs = Date.now() - startTime;

        // Try to parse body regardless of HTTP status
        try { data = await response.json(); } catch { data = null; }

        // Always log the request/response before any throw
        await logger.logRequest({
            tool: toolLabel,
            method: 'POST',
            url: authUrl,
            requestHeaders,
            requestBody,
            statusCode: response.status,
            responseBody: data,
            durationMs,
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch new token for ${assistantType}: HTTP ${response.status}: ${response.statusText}`);
        }
        if (!data || !data.success || data.errorCode !== 0) {
            throw new Error(`Failed to fetch new token for ${assistantType}: ${data?.error || 'Unexpected response'}`);
        }

        // Store token info
        const now = Date.now();
        this.tokens[assistantType] = {
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            expiresAt: now + (data.data.expireIn * 1000)
        };

        process.stderr.write(`[Auth] New token obtained for ${assistantType}, expires at ${new Date(this.tokens[assistantType].expiresAt).toISOString()}\n`);
    }

    /**
     * Refresh an existing access token
     * @param {string} assistantType - 'meeting-room' or 'schedule'
     */
    async refreshToken(assistantType) {
        const tokenInfo = this.tokens[assistantType];

        if (!tokenInfo.refreshToken) {
            throw new Error('No refresh token available');
        }

        const timestamp = Date.now().toString();

        const requestBody = {
            eid: CONFIG.EID,
            refreshToken: tokenInfo.refreshToken,
            timestamp: timestamp,
            scope: CONFIG.SCOPE
        };

        const requestHeaders = { 'Content-Type': 'application/json' };
        const startTime = Date.now();
        const refreshUrl = `${CONFIG.AUTH_BASE_URL}/refreshToken`;
        const toolLabel = `auth:refreshToken(${assistantType})`;

        let response, data;
        try {
            response = await fetch(refreshUrl, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestBody)
            });
        } catch (networkError) {
            await logger.logError(toolLabel, `Network error calling ${refreshUrl}: ${networkError.message}`);
            throw new Error(`Failed to refresh token for ${assistantType}: ${networkError.message}`);
        }

        const durationMs = Date.now() - startTime;

        try { data = await response.json(); } catch { data = null; }

        await logger.logRequest({
            tool: toolLabel,
            method: 'POST',
            url: refreshUrl,
            requestHeaders,
            requestBody,
            statusCode: response.status,
            responseBody: data,
            durationMs,
        });

        if (!response.ok) {
            throw new Error(`Failed to refresh token for ${assistantType}: HTTP ${response.status}: ${response.statusText}`);
        }
        if (!data || !data.success || data.errorCode !== 0) {
            throw new Error(`Failed to refresh token for ${assistantType}: ${data?.error || 'Unexpected response'}`);
        }

        // Update token info
        const now = Date.now();
        this.tokens[assistantType] = {
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            expiresAt: now + (data.data.expireIn * 1000)
        };

        process.stderr.write(`[Auth] Token refreshed for ${assistantType}, expires at ${new Date(this.tokens[assistantType].expiresAt).toISOString()}\n`);
    }

    /**
     * Clear all cached tokens (useful for testing or logout)
     */
    clearTokens() {
        this.tokens = {
            'meeting-room': {
                accessToken: null,
                refreshToken: null,
                expiresAt: null
            },
            'schedule': {
                accessToken: null,
                refreshToken: null,
                expiresAt: null
            }
        };
        console.log('[Auth] All tokens cleared');
    }
}

// Export singleton instance
export const authManager = new FuXinAuthManager();
