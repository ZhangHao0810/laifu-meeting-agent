---
name: meeting-skills
description: 会议室管理专家，负责自动化的会议室预定及多地协作保障。用于查询空闲会议室、创建/修改/取消会议、查询会议详情等场景。当用户询问"今天下午有空会议室吗"、"帮我约个会"、"查一下我明天的会议"时使用此技能。
---

# 会议室管理专家

## 核心能力

### 1. 预定会议室

| 用户请求 | 操作方法 |
|---------|---------|
| "今天下午3点到5点在深圳找个10人会议室" | `getFreeMeetingRooms` 查询空闲会议室，筛选容量≥10 |
| "下周三上午约个AI部季度汇报会" | `getFreeMeetingRooms` + `createMeeting` |
| "把青岛市的AI部门同事都叫上参会" | 结合 contacts 技能获取成员，用 `createMeeting` 的 `actors` 参数 |

### 2. 查询会议

| 用户请求 | 操作方法 |
|---------|---------|
| "我明天有需要参加的会吗？" | `queryUserMeetings` 查询用户会议 |
| "今天下午3点到5点有什么会议？" | `queryMeetingsByRange` 按时间范围查询 |
| "帮我看看明天整天的会议安排" | `queryMeetingsByDay` 按天查询 |
| "有哪些会议最近有变更？" | `getRecentMeetings` 查看最近更新的会议 |

### 3. 修改会议

| 用户请求 | 操作方法 |
|---------|---------|
| "下周三的会议推迟到10点开始" | `updateMeeting(id, startDate: ..., endDate: ...)` |
| "会议需要加上孙薇洁和赵勇" | 先用 contacts 技能获取 openId，再用 `updateMeeting` 的 `addActors` |
| "今天的会不开了" | `cancelMeeting` 取消会议 |

### 4. 查询参会人

| 用户请求 | 操作方法 |
|---------|---------|
| "展示这个会议的与会人" | `getMeetingRoomAttendees` 获取参会人 openId 列表 |
| "查看与会人的联系方式" | `getMeetingRoomAttendees` + contacts 技能批量查询 |

### 5. 会议室管理

| 用户请求 | 操作方法 |
|---------|---------|
| "有新的会议室预定吗？" | `hasNewMeetingRoomBooking` 检查新预定 |
| "给我看看最近的预定情况" | `getMeetingRoomBookings` 获取预定列表 |

## 最佳实践

### 创建会议流程

1. 获取用户的 openId（从用户姓名用 contacts 技能查询）
2. 查询空闲会议室 `getFreeMeetingRooms(openId, startTime, endTime)`
3. 筛选合适的会议室（容量、地点、设施）
4. 创建会议 `createMeeting({openId, title, roomId, startDate, endDate, actors, noticeTimes})`

### 时间戳处理

所有时间参数使用毫秒级时间戳：
- 使用 `time-server` MCP 工具获取当前时间
- 计算相对时间（如"明天下午3点"）时转换为准确时间戳

### 多地协同会议

当用户要求多个地点参会时：
1. 分别查询各城市的空闲会议室
2. 为每个城市创建独立的会议
3. 确保会议时间一致

### 与通讯录技能联动

- 获取参会人 openId：使用 `contacts_getUserByName` 或 `contacts_getDepartmentMembers`
- 批量查询参会人详情：使用 `contacts_getBatchUserInfo`

## 工具参考

| 工具 | 用途 |
|------|------|
| `getFreeMeetingRooms` | 查询空闲会议室 |
| `createMeeting` | 创建会议 |
| `updateMeeting` | 修改会议（支持 `addActors`/`delActors`） |
| `cancelMeeting` | 取消会议 |
| `getMeetingDetail` | 查看会议详情 |
| `queryUserMeetings` | 查询用户会议列表 |
| `queryMeetingsByDay` | 按天查询会议 |
| `queryMeetingsByRange` | 按时间范围查询会议 |
| `getRecentMeetings` | 查看最近更新的会议 |
| `getMeetingRoomAttendees` | 查看会议参会人 |
| `hasNewMeetingRoomBooking` | 检查新预定 |
| `getMeetingRoomBookings` | 获取预定列表 |
