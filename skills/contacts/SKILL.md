---
name: contacts
description: 通讯录专家，负责人员身份识别、组织归属查询及联系方式调取。用于查询员工信息、部门成员、批量查询等场景。当用户询问"帮我找一下XXX的联系方式"、"我部门有哪些同事在XXX"、"查一下XXX的工号"时使用此技能。
---

# 通讯录专家

## 核心能力

### 1. 个人信息查询

| 用户请求 | 操作方法 |
|---------|---------|
| "我是王星，我的详细信息是什么？" | 先用 `contacts_getUserByName` 获取工号，再用 `contacts_getCloudUserInfo` 查询完整信息 |
| "帮我找一下孙薇洁的联系方式" | 用 `contacts_getUserByName` 精确查询 |
| "帮我找姓王的同事" | 用 `contacts_searchUsersByName` 模糊搜索 |

### 2. 部门人员查询

| 用户请求 | 操作方法 |
|---------|---------|
| "我部门都有哪些同事在深圳？" | 用 `contacts_getUserByName` 获取用户部门，再用 `contacts_getDepartmentMembers` 过滤 `baseNames: ["深圳市"]` |
| "给我测试部在深圳的人员名单" | 直接用 `contacts_getDepartmentMembers(orgName: "测试部", filters: {baseNames: ["深圳市"]})` |
| "AI产品研发中心有多少人？" | 用 `contacts_getDepartmentInfo` 查询部门信息 |

### 3. 批量查询

| 用户请求 | 操作方法 |
|---------|---------|
| "帮我查一下工号 11528、11529、11530 的电话" | 用 `contacts_getBatchUserInfo(codes: ["11528", "11529", "11530"], fields: ["CODE", "NAME", "PHONE"])` |

## 最佳实践

### 部门名称模糊时的处理策略

当用户描述的部门名称不准确或无法直接找到时（例如"那个搞AI的部门"、"测试那帮人"），**优先使用** `contacts_getAllDepartments` 获取全量部门列表：

1. **第一步**：调用 `contacts_getAllDepartments(fields: ["ORG_NAME", "ORG_PATH_NAME"], tree: true)` 获取部门树。
2. **第二步**：根据部门名称或路径关键词（如"AI"、"测试"）自行匹配最可能的部门。
3. **第三步**：确认部门名称后，再使用 `contacts_getDepartmentMembers` 获取成员。

### 优先使用 `contacts_getDepartmentMembers`

查询部门成员时，**强烈推荐**使用 `contacts_getDepartmentMembers` 而非 `contacts_getDepartmentInfo` + `contacts_getBatchUserInfo`：

```javascript
// 不推荐（2次调用，~134KB数据）
contacts_getDepartmentInfo(orgName: "AI产品研发中心")  // 返回146个成员工号
contacts_getBatchUserInfo(codes: [146个工号])          // 返回完整对象

// 推荐（1次调用，~1KB数据）
contacts_getDepartmentMembers(
  orgName: "AI产品研发中心",
  filters: { baseNames: ["深圳市"] },
  fields: ["CODE", "NAME", "PHONE", "EMAIL"]
)
```

### 异常降级策略

当工具调用未能返回预期结果时，应采取降级策略保证任务完成：
- **精确匹配失败**：如果 `contacts_getUserByName` 精确匹配不到人员，自动退化为使用 `contacts_searchUsersByName` 进行模糊搜索，并向用户确认其要找的人。
- **部门过滤无数据**：如果使用 `contacts_getDepartmentMembers` 带了 `filters`（如查询深圳人员）但返回空结果，可以尝试去掉 `filters` 再次查询并自行甄别人名地名。

### 字段选择

使用 `fields` 参数减少数据传输：
- 基础信息：`["CODE", "NAME", "BASE_NAME", "PHONE", "ORG_PATH_NAME"]`
- 精简信息：`["CODE", "NAME", "PHONE", "EMAIL"]`

### 与会议系统联动

当用户要求邀请部门成员参会时：
1. 用 `contacts_getDepartmentMembers` 获取成员列表（提取 `IM_OPEN_ID` 或 `CODE`）
2. 将获取的 openId 列表传递给会议系统的 `meeting_createMeeting` 或 `meeting_updateMeeting`

## 工具参考

| 工具 | 用途 |
|------|------|
| `contacts_getUserByName` | 根据姓名获取工号 |
| `contacts_getCloudUserInfo` | 根据工号获取完整信息 |
| `contacts_searchUsersByName` | 模糊搜索（支持拼音） |
| `contacts_getBatchUserInfo` | 批量查询 |
| `contacts_getDepartmentInfo` | 部门基本信息 |
| `contacts_getDepartmentMembers` | 部门成员（推荐，支持过滤） |
