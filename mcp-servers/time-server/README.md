# Time MCP Server

## 简介
这是一个 Model Context Protocol (MCP) 服务器，用于提供精确的时间查询服务。

## 功能
- 提供 `get_current_time` 工具，可查询指定时区的当前时间。
- 返回值包含YYYY-MM-DD HH:mm:ss 格式的时间、星期几、以及 ISO 标准时间戳。

## 工具列表

### get_current_time
获取特定时区的当前时间。

**输入参数:**
- `timezone` (string, 可选): 时区字符串，例如 "Asia/Shanghai", "UTC", "America/New_York"。默认为 "Asia/Shanghai"。

**返回结果:**
- `formatted`: 本地化格式的时间字符串 (YYYY-MM-DD HH:mm:ss)
- `timezone`: 请求的时区
- `weekday`: 星期几
- `iso`: ISO 8601 格式的时间
- `timestamp`: Unix 时间戳

## 安装与使用

### 依赖安装
```bash
npm install
```

### 启动服务
```bash
npm start
```

### 由于本项目已集成到 MCP Config，通常无需手动启动，只需重启 MCP 客户端即可自动加载。
