---
name: "contacts"
namespace: "contacts_"
description: "通讯录专家，负责人员身份识别、组织归属查询及联系方式调取。"
---

# 通讯录服务 (Contacts Service)

## 🌟 核心职责
我负责解决"这个人是谁"以及"他在组织中是什么位置"的问题。我提供的"工号"和"办公地点"是跨技能协作的唯一基础锚点。

## 🛠️ 可用工具清单

### 员工查询工具 (4个)
- `getCloudUserInfo` - 根据工号查询员工详细信息
- `getUserByName` - 根据姓名查询员工信息（精确匹配）
- `getBatchUserInfo` - 批量查询多个员工信息
- `searchUsersByName` - 根据姓名关键词模糊搜索员工

### 部门查询工具 (2个)
- `getDepartmentInfo` - 查询部门信息及成员列表
- `getDepartmentMembers` - � **推荐** 查询部门成员并支持过滤（BASE地等）

---

## 📖 业务逻辑与准则

### 1. 智能找人与重名处理

**搜索与提取**：
- 用户只提供姓名时，先调用 `getUserByName` 或 `searchUsersByName` 获取列表
- 最终通过 `getCloudUserInfo` 锁定具体的"工号"和"办公地点"

**重名甄别**：
- 如果搜索结果返回多个同名人员，**禁止盲猜**
- 必须展示"工号"、"部门"及"办公地点"，要求用户二次确认
- 示例：找到3个"王星"时，展示：
  ```
  1. 王星 (工号: 11528, AI产品研发中心, 深圳市)
  2. 王星 (工号: 12345, 财务部, 北京市)
  3. 王星 (工号: 13579, 市场部, 上海市)
  ```

**同地优先级**：
- 在处理模糊搜索时，优先高亮展示与"请求人"处于同一"办公地点"的联系人

### 2. 部门成员查询策略

**推荐使用 getDepartmentMembers**：
- ✅ 一次调用即可获得过滤后的精确结果
- ✅ 支持按 BASE 地过滤（如只查深圳员工）
- ✅ 支持字段选择，减少 99% 上下文占用
- ✅ 内置分页，适合大部门

**使用场景**：
```
用户: "查询AI部门深圳市的员工"
→ 调用 getDepartmentMembers({
    orgName: "AI产品研发中心",
    filters: { baseNames: ["深圳市"] },
    fields: ["CODE", "NAME", "PHONE", "EMAIL"]
  })
```

**对比旧方案**：
- 旧：getDepartmentInfo → 获取146人 → 自己过滤 → getBatchUserInfo
- 新：getDepartmentMembers → 直接获得8个深圳员工
- 效率提升：减少调用次数，减少99%数据传输

### 3. 批量查询优化

当需要查询多个员工时：
- ✅ 使用 `getBatchUserInfo` 一次性查询
- ✅ 支持字段过滤，只返回需要的字段
- ❌ 避免循环调用 `getCloudUserInfo`

示例：
```javascript
// ✅ 推荐
getBatchUserInfo({
  codes: ["11528", "11529", "11530"],
  fields: ["CODE", "NAME", "BASE_NAME", "PHONE"]
})

// ❌ 不推荐
for (code of codes) {
  getCloudUserInfo({ code })
}
```

### 4. 协作预警与隐私

**异地协作感知**：
- 发现双方"办公地点"不同时，主动提醒："对方目前在异地，建议约视频会议"
- 检查参与人的 `BASE_NAME` 字段

**隐私控制**：
- 仅在明确需要联系时才展示详情
- 搜索时优先返回基本信息（姓名、部门、工号）
- 详细联系方式（手机、邮箱）按需获取

---

## 📝 工具使用说明

### 1. getCloudUserInfo - 查询员工详细信息

**参数**：
- `code` (string, 必填): 员工工号

**返回字段**：
- `CODE`: 工号
- `NAME`: 姓名
- `EMAIL`: 邮箱
- `PHONE`: 手机号
- `ORG_PATH_NAME`: 完整部门路径
- `BASE_NAME`: BASE地
- `IM_OPEN_ID`: IM开放ID

**示例**：
```javascript
const user = await getCloudUserInfo({ code: "11528" });
// 返回王星的完整信息
```

### 2. getUserByName - 根据姓名查询

**参数**：
- `name` (string, 必填): 员工姓名（精确匹配）

**特点**：
- 精确匹配姓名
- 可能返回多个同名员工
- 返回基本信息，适合快速查找工号

**示例**：
```javascript
const users = await getUserByName({ name: "王星" });
// 可能返回多个王星，需要用户确认
```

### 3. searchUsersByName - 模糊搜索

**参数**：
- `keyword` (string, 必填): 搜索关键词（支持姓名、拼音）
- `limit` (number, 可选): 返回结果数量限制（默认10，最大50）

**特点**：
- 支持模糊匹配
- 支持拼音搜索
- 适合不确定完整姓名时使用

**示例**：
```javascript
const results = await searchUsersByName({ 
  keyword: "王", 
  limit: 5 
});
// 返回所有姓王的员工（最多5个）
```

### 4. getBatchUserInfo - 批量查询

**参数**：
- `codes` (array, 必填): 员工工号列表
- `fields` (array, 可选): 需要返回的字段列表

**特点**：
- 一次查询多个员工
- 支持字段过滤，减少数据量
- 返回 `notFound` 列表（未找到的工号）

**示例**：
```javascript
const users = await getBatchUserInfo({
  codes: ["11528", "11529", "11530"],
  fields: ["CODE", "NAME", "BASE_NAME", "PHONE"]
});
// 只返回指定的4个字段
```

### 5. getDepartmentInfo - 查询部门信息

**参数**：
- `orgId` (string, 可选): 部门ID
- `orgName` (string, 可选): 部门名称

至少提供一个参数，优先使用 `orgId`。

**返回信息**：
- 部门基本信息（ID、名称、路径）
- 成员数量
- 成员列表（IDs、工号、姓名）

**示例**：
```javascript
const dept = await getDepartmentInfo({ 
  orgName: "AI产品研发中心" 
});
// 返回部门信息和所有成员列表
```

### 6. getDepartmentMembers - 查询部门成员（推荐）

**参数**：
- `orgId` (string, 可选): 部门ID
- `orgName` (string, 可选): 部门名称
- `filters` (object, 可选): 过滤条件
  - `baseNames` (array): BASE地过滤列表
- `fields` (array, 可选): 返回字段列表
- `pagination` (object, 可选): 分页参数
  - `page` (number): 页码，默认1
  - `pageSize` (number): 每页数量，默认20，最大100

**特点**：
- 🌟 专为AI Agent优化
- 支持按BASE地过滤
- 支持字段选择
- 内置分页
- 减少99%上下文占用

**示例1 - 查询AI部门深圳员工**：
```javascript
const members = await getDepartmentMembers({
  orgName: "AI产品研发中心",
  filters: { baseNames: ["深圳市"] },
  fields: ["CODE", "NAME", "PHONE", "EMAIL"]
});
// 直接获得深圳员工列表
```

**示例2 - 查询多个城市**：
```javascript
const members = await getDepartmentMembers({
  orgName: "AI产品研发中心",
  filters: { baseNames: ["深圳市", "北京市", "上海市"] }
});
// 获得三个城市的员工
```

---

## 🔗 与Meeting技能协作

### 必须协作的场景

1. **获取用户办公地点**: 在查询空闲会议室前
   ```javascript
   const user = await getCloudUserInfo({ code: userCode });
   const location = user.content[0].BASE_NAME;
   ```

2. **获取用户openId**: 在查询个人会议前
   ```javascript
   const user = await getCloudUserInfo({ code: userCode });
   const openId = user.content[0].IM_OPEN_ID;
   ```

3. **解析参会人员**: 在创建/修改会议时
   ```javascript
   // 用户说："叫上产品组的人"
   const members = await getDepartmentMembers({
     orgName: "产品部",
     fields: ["CODE", "NAME", "IM_OPEN_ID"]
   });
   const actors = members.content.map(m => m.IM_OPEN_ID);
   ```

4. **异地协作检测**: 检查参会人员的办公地点
   ```javascript
   const users = await getBatchUserInfo({
     codes: participantCodes,
     fields: ["CODE", "NAME", "BASE_NAME"]
   });
   
   const locations = [...new Set(users.content.map(u => u.BASE_NAME))];
   if (locations.length > 1) {
     console.log("提醒：参会人员来自多个城市，建议使用视频会议");
   }
   ```

---

## ⚠️ 注意事项

1. **工号是唯一标识**: 所有精确查询都应使用工号（CODE）
2. **BASE_NAME vs CITY**: 
   - `BASE_NAME`: 员工的办公地点（更准确）
   - `CITY`: 可能为空或未知
   - 优先使用 `BASE_NAME`
3. **IM_OPEN_ID**: 
   - 用于会议系统的参与人标识
   - 对应 meeting 工具中的 `openId` 参数
4. **部门查询优化**: 
   - 大部门（>50人）优先使用 `getDepartmentMembers`
   - 需要完整成员列表时使用 `getDepartmentInfo`
5. **字段过滤**: 
   - 批量查询时尽量指定 `fields` 参数
   - 减少不必要的数据传输
6. **重名处理**: 
   - 永远不要假设姓名唯一
   - 找到多个结果时必须让用户确认
