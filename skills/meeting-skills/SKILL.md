---
name: meeting-skills
description: 会议室管理专家，负责自动化的会议室预定及多地协作保障。用于查询空闲会议室、创建/修改/取消会议、查询会议详情等场景。当用户询问"今天下午有空会议室吗"、"帮我约个会"、"查一下我明天的会议"时使用此技能。
---

# 会议室管理专家

## 核心能力

### 1. 预定会议室

| 用户请求 | 操作方法 |
|---------|---------|
| "今天下午3点到5点在深圳找个10人会议室" | `meeting_getFreeMeetingRooms` 查询空闲会议室，筛选容量≥10 |
| "下周三上午约个AI部季度汇报会" | `meeting_getFreeMeetingRooms` + `meeting_createMeeting` |
| "把青岛市的AI部门同事都叫上参会" | 结合 contacts 技能获取成员，用 `meeting_createMeeting` 的 `actors` 参数 |

### 2. 查询会议

| 用户请求 | 操作方法 |
|---------|---------|
| "我明天有需要参加的会吗？" | `meeting_queryUserMeetings` 查询用户会议 |
| "今天下午3点到5点有什么会议？" | `meeting_queryMeetingsByRange` 按时间范围查询 |
| "帮我看看明天整天的会议安排" | `meeting_queryMeetingsByDay` 按天查询 |
| "有哪些会议最近有变更？" | `meeting_getRecentMeetings` 查看最近更新的会议 |

### 3. 修改会议

| 用户请求 | 操作方法 |
|---------|---------|
| "下周三的会议推迟到10点开始" | `meeting_updateMeeting(id, startDate: ..., endDate: ...)` |
| "会议需要加上孙薇洁和赵勇" | 先用 contacts 技能获取 openId，再用 `meeting_updateMeeting` 的 `addActors` |
| "把青岛的同事也拉进来开会" | 用 `meeting_updateMeeting` 追加人员后，**还必须**为他们在青岛查询并预定同时间的当地会议室 |
| "今天的会不开了" | `meeting_cancelMeeting` 取消会议 |

### 4. 查询参会人

| 用户请求 | 操作方法 |
|---------|---------|
| "展示这个会议的与会人" | `meeting_getMeetingRoomAttendees` 获取参会人 openId 列表 |
| "查看与会人的联系方式" | `meeting_getMeetingRoomAttendees` + contacts 技能批量查询 |

### 5. 会议室管理

| 用户请求 | 操作方法 |
|---------|---------|
| "有新的会议室预定吗？" | `meeting_hasNewMeetingRoomBooking` 检查新预定 |
| "给我看看最近的预定情况" | `meeting_getMeetingRoomBookings` 获取预定列表 |

## 最佳实践

### 创建会议流程

1. 获取用户的 openId（从用户姓名用 contacts 技能查询）
2. 查询空闲会议室 `meeting_getFreeMeetingRooms(openId, startTime, endTime)`
3. 筛选合适的会议室（容量、地点、设施）
4. 创建会议 `meeting_createMeeting({openId, title, roomId, startDate, endDate, actors, noticeTimes})`

### 时间戳处理

所有时间参数使用毫秒级时间戳：
- 使用 `time-server` MCP 工具获取当前时间
- 计算相对时间（如"明天下午3点"）时转换为准确时间戳

### 异常降级与回退

在会议室或会议操作过程中遇到异常时：
- **无空闲会议室**：如果 `meeting_getFreeMeetingRooms` 查询不到满足条件的空闲会议室，应主动建议用户选择其他时间段，或缩小会议室容量要求。
- **时间参数不精确**：遇到"下周"等模糊时间要求时，应与用户确认精确的小时与分钟后再转换时间戳。

### 多地协同会议

当用户要求多个地点参会，或者**在已有会议中新增异地同事**时：
1. 判断受邀人所在城市是否与当前主会议室城市相同。
2. 若在不同城市（包括中途拉人入会），须先用 `meeting_getFreeMeetingRooms` 查询他们所在城市的空闲会议室。
3. 为这些异地城市创建独立的预定记录（通过 `meeting_createMeeting`），以成功锁定当地的会议室。
4. 确保所有相关会议的起止时间（startDate, endDate）保持一致。
5. （针对追加参会人场景）即便已经将这些同事作为 `actors` 追加到原会议，也切记**必须并行为他们预定本地会议室**。

### 与通讯录技能联动

- 获取参会人 openId：使用 `contacts_getUserByName` 或 `contacts_getDepartmentMembers`
- 批量查询参会人详情：使用 `contacts_getBatchUserInfo`

## 工具参考

| 工具 | 用途 |
|------|------|
| `meeting_getFreeMeetingRooms` | 查询空闲会议室 |
| `meeting_createMeeting` | 创建会议 |
| `meeting_updateMeeting` | 修改会议（支持 `addActors`/`delActors`） |
| `meeting_cancelMeeting` | 取消会议 |
| `meeting_getMeetingDetail` | 查看会议详情 |
| `meeting_queryUserMeetings` | 查询用户会议列表 |
| `meeting_queryMeetingsByDay` | 按天查询会议 |
| `fuxin_queryMeetingsByRange` | 按时间范围查询会议 |
| `fuxin_getRecentMeetings` | 查看最近更新的会议 |
| `fuxin_getMeetingRoomAttendees` | 查看会议参会人 |
| `fuxin_hasNewMeetingRoomBooking` | 检查新预定 |
| `fuxin_getMeetingRoomBookings` | 获取预定列表 |
