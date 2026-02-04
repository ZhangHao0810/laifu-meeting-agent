# Meeting Room MCP Server Mock Data

本文件包含会议室服务API的模拟数据,用于在外网环境下测试MCP Server。

## Mock数据结构说明

### 1. createMeeting - 创建会议

**成功响应** (`createMeeting.success`):
```json
{
  "data": {
    "meetingId": "5ac2e3971834a1bc583d9bb8"
  },
  "error": null,
  "errorCode": 0,
  "success": true
}
```

**失败响应** (`createMeeting.error`):
```json
{
  "data": null,
  "error": "创建会议失败:时间冲突",
  "errorCode": 1001,
  "success": false
}
```

---

### 2. modifyMeeting - 修改会议

**成功响应** (`modifyMeeting.success`):
```json
{
  "success": true,
  "errorCode": 0,
  "error": null,
  "data": null
}
```

**失败响应** (`modifyMeeting.error`):
```json
{
  "success": false,
  "errorCode": 1002,
  "error": "修改会议失败:会议不存在",
  "data": null
}
```

---

### 3. getMeetingDetail - 查看会议详情

**成功响应** (`getMeetingDetail.success`):
返回完整的会议详情,包括:
- 会议基本信息(id, title, content)
- 时间信息(startDate, endDate, createDate)
- 会议室信息(meetingPlace, roomId, roomOrderId)
- 参与人信息(openid, personName, actors)
- 会议状态(meetingStatus, readStatus, acceptStatus)
- 提醒设置(noticeTimes)
- 会议类型(type: null/sign/voice)

**失败响应** (`getMeetingDetail.notFound`):
```json
{
  "success": false,
  "errorCode": 1003,
  "error": "会议不存在",
  "data": null
}
```

---

### 4. cancelMeeting - 取消会议

**成功响应** (`cancelMeeting.success`):
```json
{
  "success": true,
  "errorCode": 0,
  "error": null,
  "data": null
}
```

**失败响应 - 非发起人** (`cancelMeeting.notCreator`):
```json
{
  "success": false,
  "errorCode": 1004,
  "error": "只有会议发起人才能取消会议",
  "data": null
}
```

**失败响应 - 会议不存在** (`cancelMeeting.notFound`):
```json
{
  "success": false,
  "errorCode": 1003,
  "error": "会议不存在",
  "data": null
}
```

---

## 辅助数据

### sampleMeetings - 示例会议数据
包含3个示例会议:
1. 产品评审会议 (线下签到类会议)
2. 技术方案评审 (语音类会议)
3. 周例会 (普通会议,已完成)

### sampleUsers - 示例用户数据
包含5个示例用户,可用于测试协作人功能

### sampleRooms - 示例会议室数据
包含3个示例会议室:
1. 云8会议室 (10人,需审批)
2. 冥王星1号 (30人,需审批)
3. 火星2号 (5人,无需审批)

---

## 时间戳说明

所有时间戳均为毫秒级Unix时间戳,示例数据使用的时间:
- 1738569600000 = 2026-02-03 16:00:00
- 1738576800000 = 2026-02-03 18:00:00
- 1738656000000 = 2026-02-04 16:00:00
- 1738663200000 = 2026-02-04 18:00:00
- 1738742400000 = 2026-02-05 16:00:00
- 1738746000000 = 2026-02-05 17:00:00

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 创建会议失败(时间冲突) |
| 1002 | 修改会议失败(会议不存在) |
| 1003 | 会议不存在 |
| 1004 | 只有会议发起人才能取消会议 |

---

## 使用说明

MCP Server会根据不同的场景返回相应的mock数据:
- 默认情况下返回成功响应
- 可以通过特定参数触发错误场景(在实现时定义)
- 所有响应格式严格遵循API文档规范
