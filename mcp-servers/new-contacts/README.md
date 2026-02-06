# New Contacts MCP Server

一个基于 MCP (Model Context Protocol) 的员工和部门信息查询服务器，包含约 2000 人的 Mock 数据。

## 功能特性

- **查询员工信息** (`getCloudUserInfo`): 根据工号查询员工详细信息
- **查询部门信息** (`getDepartmentInfo`): 根据部门 ID 或名称查询部门信息及成员列表
- **查询部门成员** (`getDepartmentMembers`): 🌟 **推荐** 查询部门成员并支持过滤（BASE地等）、字段选择，减少99%上下文占用
- **根据姓名查询** (`getUserByName`): 根据员工姓名查询员工信息（主要用于获取工号、BASE地等）
- **批量查询员工** (`getBatchUserInfo`): 批量查询多个员工的详细信息，支持字段过滤
- **模糊搜索员工** (`searchUsersByName`): 根据姓名关键词模糊搜索员工
- **真实的 Mock 数据**: 约 2000 名员工，包含真实的中文姓名、电话、邮箱等信息
- **完整的组织架构**: 基于实际的部门层级结构


## 安装

```bash
cd e:\Super_Zhang_WorkSpace\laifu-meeting-agent\mcp-servers\new-contacts
npm install
```

## 生成 Mock 数据

首次使用或需要重新生成数据时运行:

```bash
npm run generate-data
```

这将在 `data/` 目录下生成:
- `employees.json` - 约 2000 名员工数据
- `departments.json` - 完整的部门层级数据

## 使用方法

### 作为 MCP 服务器运行

```bash
npm start
```

### 在 Claude Desktop 中配置

编辑 Claude Desktop 配置文件:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

添加以下配置:

```json
{
  "mcpServers": {
    "new-contacts": {
      "command": "node",
      "args": ["e:\\Super_Zhang_WorkSpace\\laifu-meeting-agent\\mcp-servers\\new-contacts\\src\\index.js"]
    }
  }
}
```

重启 Claude Desktop 后即可使用。

## API 接口

### 1. getCloudUserInfo - 查询员工信息

根据工号查询员工详细信息。

**参数**:
- `code` (string, 必填): 员工工号

**示例**:
```json
{
  "code": "10001"
}
```

**返回**:
```json
{
  "content": [
    {
      "CODE": "10001",
      "NAME": "张三",
      "PINYIN": "zhangsan",
      "EMAIL": "zhangsan@zhongfu.net",
      "PHONE": "13812345678",
      "ORG_PATH_NAME": "公司\\某科技有限公司\\业务中台\\AI产品研发中心",
      "IM_OPEN_ID": "644db4447e4b00d5d7f029ee2",
      ...
    }
  ],
  "message": "Api access succeeded",
  "records": 1,
  "successFlag": true
}
```

### 2. getDepartmentInfo - 查询部门信息

根据部门 ID 或名称查询部门信息。

**参数**:
- `orgId` (string, 可选): 部门 ID
- `orgName` (string, 可选): 部门名称

至少提供一个参数，优先使用 `orgId`。

**示例**:
```json
{
  "orgName": "AI产品研发中心"
}
```

**返回**:
```json
{
  "content": [
    {
      "ORG_ID": "2013695808098356143",
      "ORG_NAME": "AI产品研发中心",
      "ORG_PATH_NAME": "公司\\某科技有限公司\\业务中台\\AI产品研发中心",
      "PARENT_ORG_ID": "2013695808098356100",
      "MEMBER_COUNT": 25,
      "MEMBER_IDS": ["644db4447e4b00d5d7f029ee2", ...],
      "MEMBER_CODES": ["10001", "10002", ...],
      "MEMBER_NAMES": ["张三", "李四", ...],
      ...
    }
  ],
  "message": "Api access succeeded",
  "records": 1,
  "successFlag": true
}
```

### 3. getUserByName - 根据姓名查询员工信息

根据员工姓名查询员工的基本信息（主要用于获取工号、BASE地等）。

**参数**:
- `name` (string, 必填): 员工姓名（精确匹配）

**示例**:
```json
{
  "name": "王星"
}
```

**返回**:
```json
{
  "content": [
    {
      "CODE": "11528",
      "NAME": "王星",
      "BASE_NAME": "深圳市",
      "PHONE": "18942667857",
      "ORG_PATH_NAME": "公司\\某科技有限公司\\业务中台\\AI产品研发中心",
      ...
    }
  ],
  "message": "Api access succeeded",
  "records": 1,
  "successFlag": true
}
```

### 4. getBatchUserInfo - 批量查询员工信息

批量查询多个员工的详细信息，支持字段过滤。

**参数**:
- `codes` (array, 必填): 员工工号列表
- `fields` (array, 可选): 需要返回的字段列表，不传则返回全部字段

**示例**:
```json
{
  "codes": ["11528", "11529", "11530"],
  "fields": ["CODE", "NAME", "BASE_NAME", "PHONE"]
}
```

**返回**:
```json
{
  "content": [
    {
      "CODE": "11528",
      "NAME": "王星",
      "BASE_NAME": "深圳市",
      "PHONE": "18942667857"
    },
    {
      "CODE": "11529",
      "NAME": "郑纯桂英",
      "BASE_NAME": "厦门市",
      "PHONE": "18040154942"
    }
  ],
  "notFound": [],
  "message": "Api access succeeded",
  "records": 2,
  "successFlag": true
}
```

### 5. searchUsersByName - 模糊搜索员工

根据姓名关键词模糊搜索员工。

**参数**:
- `keyword` (string, 必填): 搜索关键词（支持姓名、拼音）
- `limit` (number, 可选): 返回结果数量限制（默认10，最大50）

**示例**:
```json
{
  "keyword": "王",
  "limit": 5
}
```

**返回**:
```json
{
  "content": [
    {
      "CODE": "11528",
      "NAME": "王星",
      "PINYIN": "wang星",
      "ORG_PATH_NAME": "公司\\某科技有限公司\\业务中台\\AI产品研发中心",
      "BASE_NAME": "深圳市"
    }
  ],
  "message": "Search completed",
  "records": 1,
  "totalMatches": 37,
  "successFlag": true
}
```

### 6. getDepartmentMembers - 查询部门成员（推荐用于 AI Agent）

🌟 **推荐工具** - 专为 AI Agent 设计，一次调用即可获得过滤后的精确结果，减少 99% 上下文占用。

**参数**:
- `orgId` (string, 可选): 部门 ID（与 orgName 二选一）
- `orgName` (string, 可选): 部门名称（与 orgId 二选一）
- `filters` (object, 可选): 过滤条件
  - `baseNames` (array): BASE 地过滤列表，例如 `["深圳市", "北京市"]`
- `fields` (array, 可选): 需要返回的字段列表，不传则返回默认字段 `[CODE, NAME, BASE_NAME, PHONE, ORG_PATH_NAME]`
- `pagination` (object, 可选): 分页参数
  - `page` (number): 页码，默认 1
  - `pageSize` (number): 每页数量，默认 20，最大 100

**示例 1 - 查询 AI 部门深圳员工**:
```json
{
  "orgName": "AI产品研发中心",
  "filters": {
    "baseNames": ["深圳市"]
  },
  "fields": ["CODE", "NAME", "PHONE", "EMAIL"]
}
```

**返回**:
```json
{
  "content": [
    {
      "CODE": "11528",
      "NAME": "王星",
      "PHONE": "18942667857",
      "EMAIL": "wang星@zhongfu.net"
    }
    // ... 其他 7 人
  ],
  "department": {
    "ORG_ID": "1770292517221840411",
    "ORG_NAME": "AI产品研发中心",
    "MEMBER_COUNT": 146
  },
  "filtered": {
    "totalMatches": 8,
    "returned": 8
  },
  "message": "Api access succeeded",
  "successFlag": true
}
```

**示例 2 - 查询多个城市**:
```json
{
  "orgName": "AI产品研发中心",
  "filters": {
    "baseNames": ["深圳市", "北京市", "上海市"]
  }
}
```

**优势对比**:

| 维度 | 旧方案 (getDepartmentInfo + getBatchUserInfo) | 新方案 (getDepartmentMembers) |
|------|----------------------------------------------|------------------------------|
| 调用次数 | 2 次 | 1 次 |
| 返回数据量 | 146 个完整对象 (~134KB) | 8 个精简对象 (~1KB) |
| 上下文占用 | 高 | **减少 99%** |
| AI 处理 | 需要自己过滤 | 直接获得结果 |

## 数据说明

### 员工数据字段

核心字段:
- `CODE`: 工号
- `NAME`: 姓名
- `EMAIL`: 邮箱 (格式: {pinyin}@zhongfu.net)
- `PHONE`: 手机号
- `ORG_PATH_NAME`: 完整部门路径
- `IM_OPEN_ID`: IM 开放 ID
- `BASE_NAME`: Base 地

### 部门数据字段

核心字段:
- `ORG_ID`: 部门 ID
- `ORG_NAME`: 部门名称
- `ORG_PATH_NAME`: 完整部门路径
- `PARENT_ORG_ID`: 父部门 ID
- `MEMBER_COUNT`: 成员数量
- `MEMBER_IDS`: 成员 IM_OPEN_ID 列表
- `MEMBER_CODES`: 成员工号列表
- `MEMBER_NAMES`: 成员姓名列表

## 项目结构

```
new-contacts/
├── src/
│   ├── index.js              # MCP 服务器主程序
│   └── generate-mock-data.js # Mock 数据生成脚本
├── data/
│   ├── employees.json        # 员工数据
│   └── departments.json      # 部门数据
├── package.json
└── README.md
```

## 开发

### 重新生成数据

如需调整员工数量或部门结构:

1. 修改 `src/generate-mock-data.js` 中的 `targetEmployeeCount` 变量
2. 或修改 `部分组织架构.json` 文件调整部门结构
3. 运行 `npm run generate-data` 重新生成

### 测试

使用 MCP Inspector 测试:

```bash
npx @modelcontextprotocol/inspector node src/index.js
```

## License

MIT
