// Configuration for FuXin Assistant MCP Server

export const CONFIG = {
    // Enterprise ID (fixed)
    EID: '25185534',

    // FuXin API endpoints
    AUTH_BASE_URL: 'https://lim.zhongfu.net/gateway/oauth2/token',
    MEETING_ROOM_BASE_URL: 'https://lim.zhongfu.net/api/roomBook/third',
    SCHEDULE_BASE_URL: 'https://im.zhongfu.net/gateway/cloudwork/meeting',

    // Assistant secrets
    SECRETS: {
        'meeting-room': process.env.FUXIN_MEETING_ROOM_SECRET || 'SZwtuH1HIvZuL0TcT6zsStCqTSN0J3',
        'schedule': process.env.FUXIN_SCHEDULE_SECRET || 'ec8hdjYrbLCizw8UUr9V8cwPJaJu5v1'
    },

    // Token refresh settings
    TOKEN_EXPIRY_SECONDS: 7200,  // 2 hours
    TOKEN_REFRESH_BUFFER_MS: 300000,  // 5 minutes before expiry

    // Scope for authentication
    SCOPE: 'resGroupSecret'
};
