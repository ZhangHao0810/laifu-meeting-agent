# Skills 配置路径

## YAML 配置格式

```yaml
agent:
  plan:
    skills-dir: E:\Super_Zhang_WorkSpace\laifu-meeting-agent\skills
  executor:
    skills-dir: E:\Super_Zhang_WorkSpace\laifu-meeting-agent\skills
```

## 说明

### Skills 目录结构

```
E:\Super_Zhang_WorkSpace\laifu-meeting-agent\skills\
├── contacts\
│   └── SKILL.md          # Contacts技能定义
└── meeting-skills\
    └── SKILL.md          # Meeting技能定义
```

### 可用的Skills

1. **contacts** - 通讯录管理技能
   - 路径: `E:\Super_Zhang_WorkSpace\laifu-meeting-agent\skills\contacts\SKILL.md`
   - 工具: 6个 (contacts_search, contacts_get_detail, 等)

2. **meeting-skills** - 会议室管理技能
   - 路径: `E:\Super_Zhang_WorkSpace\laifu-meeting-agent\skills\meeting-skills\SKILL.md`
   - 工具: 9个 (create_meeting, modify_meeting, 等)

### Spring Boot 完整配置示例

```yaml
spring:
  ai:
    alibaba:
      # MCP Server 配置
      mcp:
        servers:
          contacts-service:
            command: node
            args:
              - E:\Super_Zhang_WorkSpace\laifu-meeting-agent\mcp-servers\contacts\dist\index.js
          meeting-room-service:
            command: node
            args:
              - E:\Super_Zhang_WorkSpace\laifu-meeting-agent\mcp-servers\meeting-room\index.js

# Agent 配置
agent:
  plan:
    skills-dir: E:\Super_Zhang_WorkSpace\laifu-meeting-agent\skills
  executor:
    skills-dir: E:\Super_Zhang_WorkSpace\laifu-meeting-agent\skills
```

### 注意事项

1. **路径格式**: YAML中可以使用单反斜杠 `\`,无需转义
2. **Skills目录**: 包含两个子目录 `contacts` 和 `meeting-skills`
3. **SKILL.md**: 每个技能目录下必须有 `SKILL.md` 文件
4. **命名空间**: 
   - contacts技能使用 `contacts_` 前缀
   - meeting技能使用 `meeting_` 前缀
