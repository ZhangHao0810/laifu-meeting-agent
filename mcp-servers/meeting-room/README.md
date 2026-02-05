# Meeting Room MCP Server

一个基于Model Context Protocol (MCP)的会议室服务MCP Server,封装了会议室服务的全部9个核心接口。

## 功能特性

本MCP Server提供以下九个工具(Tools):

### 基础会议管理 (1-4)

### 1. create_meeting - 新增单个会议
创建一个新的会议,支持设置会议标题、内容、时间、地点、参与人等信息。

**参数:**
- `openid` (必填): 会议发起人的id
- `title` (必填): 会议标题
- `startDate` (必填): 会议开始时间戳(毫秒)
- `endDate` (必填): 会议结束时间戳(毫秒)
- `accessToken` (必填): 访问令牌
- `content` (可选): 会议内容
- `meetingPlace` (可选): 会议室地址
- `roomId` (可选): 会议室id
- `noticeTimes` (可选): 提醒时间数组
- `actors` (可选): 协作人oid的集合
- `type` (可选): 会议类型

### 2. modify_meeting - 修改单个会议
更新已存在的会议信息,包括标题、内容、时间、地点等。

**参数:**
- `id` (必填): 会议id
- `openid` (必填): 会议发起人的oid
- `title` (必填): 会议标题
- `startDate` (必填): 会议开始时间戳(毫秒)
- `endDate` (必填): 会议结束时间戳(毫秒)
- `accessToken` (必填): 访问令牌
- 其他可选参数同create_meeting

### 3. get_meeting_detail - 查看单个会议详情
根据会议id获取会议的完整信息。

**参数:**
- `id` (必填): 会议id
- `accessToken` (必填): 访问令牌

### 4. cancel_meeting - 取消单个会议
取消指定的会议(只有会议发起人才能取消)。

**参数:**
- `id` (必填): 会议id
- `openid` (必填): 会议发起人的oid
- `accessToken` (必填): 访问令牌

### 会议查询功能 (5-7)

### 5. query_meetings_by_day - 按天查询工作圈下会议
查询指定日期的所有会议。

**参数:**
- `day` (必填): 待查询的日期时间戳(当天任意时间戳都可以)
- `accessToken` (必填): 访问令牌

### 6. query_meetings_by_range - 按时间范围查询工作圈下会议
查询指定时间范围内的所有会议。

**参数:**
- `start` (必填): 开始时间戳
- `end` (必填): 结束时间戳
- `accessToken` (必填): 访问令牌

### 7. query_user_meetings - 单个用户会议查询
查询指定用户的会议列表,支持分页和状态筛选。

**参数:**
- `pageNum` (必填): 第几页,从1开始
- `pageSize` (必填): 每页多少条
- `openId` (必填): 人员oid
- `status` (可选): 状态(0未开始,1已结束,null所有)
- `accessToken` (必填): 访问令牌

### 会议室与参与人查询 (8-9)

### 8. query_free_rooms - 查询该工作圈空闲的会议室
根据时间段查询可用的会议室列表。

**参数:**
- `openId` (必填): 预约人员信息openId
- `startTime` (必填): 开始时间戳
- `endTime` (必填): 结束时间戳
- `pageIndex` (可选): 页码,默认1
- `pageSize` (可选): 每页条数,默认50
- `accessToken` (必填): 访问令牌

### 9. get_meeting_actors - 查询某个会议的与会人
获取指定会议的所有参与人员列表。

**参数:**
- `orderId` (必填): 会议订单id
- `accessToken` (必填): 访问令牌

## Mock数据说明

由于会议室服务在内网,外网无法访问,本MCP Server使用mock数据模拟API响应。

- 所有工具调用都会返回预定义的mock数据
- Mock数据存储在 `mock-data.json` 文件中
- 详细的mock数据说明请参考 `MOCK_DATA.md`

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 启动MCP Server
```bash
npm start
```

或使用开发模式(支持热重载):
```bash
npm run dev
```

## 与Spring AI Alibaba集成

本MCP Server使用stdio传输协议,可以被Spring AI Alibaba框架的AI Agent远程调用。

### 配置示例

在Spring AI Alibaba项目中配置MCP Server:

```yaml
# application.yml
spring:
  ai:
    alibaba:
      mcp:
        servers:
          meeting-room:
            command: node
            args:
              - /path/to/mcp-servers/meeting-room/index.js
            env:
              NODE_ENV: production
```

### 使用示例

AI Agent可以通过以下方式调用会议室工具:

```java
// 创建会议
Map<String, Object> createParams = new HashMap<>();
createParams.put("openid", "5a67e08d00b0e8dfe4aab4fa");
createParams.put("title", "产品评审会议");
createParams.put("startDate", 1738569600000L);
createParams.put("endDate", 1738576800000L);
createParams.put("accessToken", "your-token");

String result = mcpClient.callTool("create_meeting", createParams);
```

## 测试

### 使用MCP Inspector测试

1. 安装MCP Inspector:
```bash
npx @modelcontextprotocol/inspector
```

2. 连接到本MCP Server并测试各个工具

### 测试用例

参考 `mock-data.json` 中的示例数据:
- 示例会议ID: `5b33275f14cada62e4e44840`
- 示例用户ID: `5a67e08d00b0e8dfe4aab4fa`
- 示例会议室ID: `5c121cfd7453ed63750a9767`

## 项目结构

```
meeting-room/
├── index.js           # MCP Server主文件
├── package.json       # 项目配置
├── mock-data.json     # Mock数据
├── MOCK_DATA.md       # Mock数据说明文档
└── README.md          # 本文件
```

## 技术栈

- **MCP SDK**: @modelcontextprotocol/sdk v1.0.4
- **参数验证**: Zod v3.24.1
- **运行环境**: Node.js (ES Modules)

## 注意事项

1. 本服务目前使用mock数据,不会真实调用内网API
2. 当部署到内网环境时,可以修改代码替换为真实API调用
3. 所有时间戳使用毫秒级Unix时间戳
4. accessToken参数在mock模式下会被忽略

## License

MIT
