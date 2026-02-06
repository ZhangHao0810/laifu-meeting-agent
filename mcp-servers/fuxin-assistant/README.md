# FuXin Assistant MCP Server

FuXin 助手 MCP 服务器，整合会议室管理和日程管理功能，支持统一的 FuXin 鉴权。

## 功能特性

### 会议室管理工具 (4个)
- **hasNewMeetingRoomBooking**: 检查是否有新的会议室预订
- **getMeetingRoomBookings**: 获取会议室预订信息（支持增量获取）
- **getFreeMeetingRooms**: 查询指定时间段的空闲会议室
- **getMeetingRoomAttendees**: 查询会议的与会人列表

### 日程管理工具 (8个)
- **createMeeting**: 创建新会议
- **updateMeeting**: 修改单个会议
- **getMeetingDetail**: 查看单个会议详情
- **cancelMeeting**: 取消会议
- **queryMeetingsByDay**: 按天查询会议列表
- **queryMeetingsByRange**: 按时间范围查询会议列表
- **getRecentMeetings**: 获取最近时间的会议列表（分页）
- **queryUserMeetings**: 查询指定用户的会议列表

## 安装

```bash
cd fuxin-assistant
npm install
```

## 配置

在 `mcp-config.json` 中添加：

```json
{
  "mcpServers": {
    "fuxin-assistant": {
      "command": "node",
      "args": [
        "e:\\Super_Zhang_WorkSpace\\laifu-meeting-agent\\mcp-servers\\fuxin-assistant\\src\\index.js"
      ]
    }
  }
}
```

## Mock 数据

- **meeting-rooms.json**: 20个会议室，覆盖深圳、北京、上海等主要城市
- **room-bookings.json**: 3个会议室预订示例
- **meetings.json**: 2个会议示例

## API 文档

### 1. hasNewMeetingRoomBooking

检查是否有新的会议室预订。

**参数**:
- `lastTime` (string, 可选): 上次更新时间戳（毫秒字符串）

**返回**:
```json
{
  "hasNew": true,
  "message": "Api access succeeded",
  "successFlag": true
}
```

### 2. getMeetingRoomBookings

获取会议室预订信息，支持增量获取。

**参数**:
- `lastIndex` (string, 可选): 最后一条的 updateTime
- `pageSize` (number, 可选): 分页大小，默认50，最大50

**返回**:
```json
{
  "content": {
    "add": [...],
    "delete": []
  },
  "message": "Api access succeeded",
  "successFlag": true
}
```

### 3. getFreeMeetingRooms

查询指定时间段的空闲会议室。

**参数**:
- `openId` (string, 必填): 预约人员 openId
- `startTime` (number, 必填): 开始时间戳（毫秒）
- `endTime` (number, 可选): 结束时间戳（毫秒）
- `pageIndex` (number, 可选): 页码，默认1
- `pageSize` (number, 可选): 每页条数，默认50

**返回**:
```json
{
  "content": [
    {
      "roomId": "room_sz_001",
      "roomName": "深圳商点会议室(可开视频会议)",
      "roomDetail": "深圳小蛮腰大厦 3-1室",
      "limitCount": 16,
      "approve": true,
      "city": "深圳市"
    }
  ],
  "records": 10,
  "message": "Api access succeeded",
  "successFlag": true
}
```

### 4. getMeetingRoomAttendees

查询某个会议的与会人列表。

**参数**:
- `orderId` (string, 必填): 会议订单ID

**返回**:
```json
{
  "content": [
    {
      "openId": "64db417ae4b00d5d7f028c43",
      "userName": "彭祥海"
    }
  ],
  "records": 2,
  "message": "Api access succeeded",
  "successFlag": true
}
```

### 5. createMeeting

创建新会议。

**参数**:
- `openId` (string, 必填): 会议发起人 openId
- `title` (string, 必填): 会议标题
- `content` (string, 可选): 会议内容/描述
- `roomId` (string, 必填): 会议室ID
- `startDate` (number, 必填): 开始时间戳（毫秒）
- `endDate` (number, 必填): 结束时间戳（毫秒）
- `noticeTimes` (array, 可选): 提醒时间 [5, 15, 60]
- `actors` (array, 可选): 与会人 openId 列表

**返回**:
```json
{
  "content": {
    "meetingId": "meeting_1738732800000"
  },
  "message": "Meeting created successfully",
  "successFlag": true
}
```

### 6. updateMeeting

修改单个会议。

**参数**:
- `id` (string, 必填): 会议ID
- `openId` (string, 必填): 操作人 openId
- `title` (string, 可选): 会议标题
- `content` (string, 可选): 会议内容
- `startDate` (number, 可选): 开始时间戳（毫秒）
- `endDate` (number, 可选): 结束时间戳（毫秒）
- `roomId` (string, 可选): 会议室ID
- `addActors` (array, 可选): 新增与会人 openId 列表
- `delActors` (array, 可选): 删除与会人 openId 列表

**返回**:
```json
{
  "content": null,
  "message": "Meeting updated successfully",
  "successFlag": true
}
```

### 7. getMeetingDetail

查看单个会议详情。

**参数**:
- `id` (string, 必填): 会议ID

**返回**:
```json
{
  "content": {
    "id": "meeting_001",
    "title": "测试会议",
    "content": "新增会议测试",
    "roomId": "room_bj_001",
    "startDate": 1738742400000,
    "endDate": 1738749600000,
    "status": 0,
    "personName": "张浩",
    "participants": [...]
  },
  "message": "Api access succeeded",
  "successFlag": true
}
```

### 8. cancelMeeting

取消会议。

**参数**:
- `id` (string, 必填): 会议ID
- `openId` (string, 必填): 操作人 openId

**返回**:
```json
{
  "content": null,
  "message": "Meeting cancelled successfully",
  "successFlag": true
}
```

### 9. queryMeetingsByDay

按天查询会议列表。

**参数**:
- `day` (number, 必填): 待查询的日期时间戳（毫秒）

**返回**:
```json
{
  "content": [
    {
      "id": "meeting_001",
      "title": "测试会议",
      "startDate": 1738742400000,
      "endDate": 1738749600000,
      "personName": "张浩"
    }
  ],
  "records": 2,
  "message": "Api access succeeded",
  "successFlag": true
}
```

### 10. queryMeetingsByRange

按时间范围查询会议列表。

**参数**:
- `start` (number, 必填): 开始时间戳（毫秒）
- `end` (number, 必填): 结束时间戳（毫秒）

**返回**:
```json
{
  "content": [
    {
      "id": "meeting_001",
      "title": "测试会议",
      "startDate": 1738742400000,
      "endDate": 1738749600000
    }
  ],
  "records": 1,
  "message": "Api access succeeded",
  "successFlag": true
}
```

### 11. getRecentMeetings

获取最近时间的会议列表（分页）。

**参数**:
- `lastTime` (number, 可选): 最后一条的 updateTime，用于增量获取
- `page` (number, 必填): 页码
- `size` (number, 必填): 每页条数
- `roomIds` (array, 可选): 会议室ID列表（可选过滤）

**返回**:
```json
{
  "content": [
    {
      "id": "meeting_001",
      "title": "测试会议",
      "startDate": 1738742400000,
      "endDate": 1738749600000
    }
  ],
  "records": 1,
  "message": "Api access succeeded",
  "successFlag": true
}
```

### 12. queryUserMeetings

查询指定用户的会议列表。

**参数**:
- `pageNum` (number, 必填): 页码，从1开始
- `pageSize` (number, 必填): 每页大小（建议10-20）
- `openId` (string, 必填): 用户 openId
- `status` (number, 可选): 会议状态过滤（0=未开始，1=已结束，null=所有）

**返回**:
```json
{
  "content": [
    {
      "id": "meeting_001",
      "title": "测试会议",
      "startDate": 1738742400000,
      "endDate": 1738749600000,
      "personName": "张浩"
    }
  ],
  "records": 1,
  "totalRecords": 2,
  "message": "Api access succeeded",
  "successFlag": true
}
```

## 鉴权说明

服务器使用 FuXin 鉴权系统，自动管理两个独立的 access token：
- **会议室助手**: 使用 `SZwtuH1HIvZuL0TcT6zsStCqTSN0J3`
- **时间助手**: 使用 `ec8hdjYrbLCizw8UUr9V8cwPJaJu5v1`

Token 有效期为 2 小时，系统会在过期前 5 分钟自动刷新。

## 开发说明

### 项目结构

```
fuxin-assistant/
├── src/
│   ├── index.js              # MCP Server 入口
│   ├── config.js             # 配置文件
│   └── auth/
│       └── fuxin-auth.js     # FuXin 鉴权管理器
├── data/
│   ├── meeting-rooms.json    # 会议室数据
│   ├── room-bookings.json    # 预订数据
│   └── meetings.json         # 会议数据
├── package.json
└── README.md
```

### 启动服务器

```bash
node src/index.js
```

## 注意事项

> [!IMPORTANT]
> - 当前实现使用 Mock 数据，实际使用时需要连接真实的 FuXin API
> - Token 自动刷新机制已实现，但需要在生产环境中测试
> - 所有 12 个接口工具已完整实现，覆盖 100% 的接口文档功能

## License

MIT
