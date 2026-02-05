# FuXin 鉴权接口文档

本文档描述了 FuXin 会议系统的鉴权接口，包括获取访问令牌和刷新令牌的方法。

---

## 1. 获取 Access Token

### 接口概述

通过企业 ID、密钥等信息获取会议相关接口的访问令牌（有效期 2 小时）。

### 接口信息

- **请求方法**：`POST`
- **请求地址**：`https://lim.zhongfu.net/gateway/oauth2/token/getAccessToken`
- **Content-Type**：`application/json`

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `eid` | String | 是 | 企业 ID、工作圈ID，固定值：`25185534` |
| `secret` | String | 是 | 密钥<br>• 时间助手：`ec8hdjYrbLCizw8UUr9V8cwPJaJu5v1`<br>• 会议助手：`SZwtuH1HIvZuL0TcT6zsStCqTSN0J3` |
| `timestamp` | String | 是 | 当前 13 位毫秒级 Unix 时间戳 |
| `scope` | String | 是 | 固定值：`resGroupSecret` |

### 请求示例

```json
{
  "eid": "25185534",
  "secret": "ec8hdjYrbLCizw8UUr9V8cwPJaJu5v1",
  "timestamp": "1770278061577",
  "scope": "resGroupSecret"
}
```

### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `success` | Boolean | 请求是否成功 |
| `errorCode` | Integer | 错误码，成功时为 `0` |
| `error` | String | 错误信息，成功时为 `null` |
| `data.accessToken` | String | 访问令牌 |
| `data.expireIn` | Integer | 过期时间（秒），固定为 `7200`（2 小时） |
| `data.refreshToken` | String | 刷新令牌，用于刷新 access token |

### 响应示例

```json
{
  "data": {
    "accessToken": "cCX59zqfnv9jfk3HhztnpvzoFtFzPxq",
    "expireIn": 7200,
    "refreshToken": "cbHBtwc2PTsx1UEQJJhwop3RRZxMpjP"
  },
  "error": null,
  "errorCode": 0,
  "success": true
}
```

---

## 2. 刷新 Access Token

### 接口概述

在 access token 即将过期时，使用 refresh token 获取新的访问令牌。

### 接口信息

- **请求方法**：`POST`
- **请求地址**：`https://jim.zhongfu.net/gateway/oauth2/token/refreshToken`
- **Content-Type**：`application/json`

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `eid` | String | 是 | 企业 ID，固定值：`25185534` |
| `refreshToken` | String | 是 | 当前有效的 refresh token |
| `timestamp` | String | 是 | 当前 13 位毫秒级 Unix 时间戳 |
| `scope` | String | 是 | 固定值：`resGroupSecret` |

### 请求示例

```json
{
  "eid": "25185534",
  "refreshToken": "cbHBtwc2PTsx1UEQJJhwop3RRZxMpjP",
  "timestamp": "1770278061577",
  "scope": "resGroupSecret"
}
```

### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `success` | Boolean | 请求是否成功 |
| `errorCode` | Integer | 错误码，成功时为 `0` |
| `error` | String | 错误信息，成功时为 `null` |
| `data.accessToken` | String | 新的访问令牌 |
| `data.expireIn` | Integer | 过期时间（秒），固定为 `7200`（2 小时） |
| `data.refreshToken` | String | 新的刷新令牌 |

### 响应示例

```json
{
  "data": {
    "accessToken": "新的访问令牌字符串",
    "expireIn": 7200,
    "refreshToken": "新的刷新令牌字符串"
  },
  "error": null,
  "errorCode": 0,
  "success": true
}
```

---

## 重要说明

> [!IMPORTANT]
> - **时间戳生成**：`timestamp` 参数必须动态生成当前 13 位 Unix 毫秒级时间戳（JavaScript 中使用 `Date.now()`））
> - **数据类型**：除 `expireIn` 为数字类型外，其他字段均为字符串类型
> - **刷新策略**：建议在 access token 剩余有效期为 10-20% 时（约 12-24 分钟前）调用刷新接口
> - **密钥区分**：时间助手和会议助手使用不同的 `secret` 值，请根据实际场景选择正确的密钥

> [!TIP]
> 为避免令牌过期导致的接口调用失败，建议实现自动刷新机制：
> - 在获取 token 时记录过期时间
> - 设置定时器在过期前自动刷新
> - 捕获 401 错误并自动重新获取令牌