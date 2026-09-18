# 第 7 章配套：平台配置片段

> 整理自本书第 7 章的零散配置示例。

## MCP 服务配置示例（约 p234）

在支持 MCP 的客户端中接入 Zapier 等外部动作服务的配置片段（`mcp-zapier-sse.json`）：

```json
{
  "server_name": {
    "url": "https://actions.zapier.com/mcp/sk-ak-xxxxxx/sse",
    "headers": {},
    "timeout": 5,
    "sse_read_timeout": 300
  }
}
```

使用说明：

- 将 `sk-ak-xxxxxx` 替换为你在 Zapier 创建的 MCP Key；`server_name` 改为有意义的名称。
- `timeout` 为连接超时（秒），`sse_read_timeout` 为 SSE 长连接的读取超时。
- 涉及外部写操作（发邮件、建任务等）时，务必在提示词中加入人工确认规则，见 [../../prompts/04-tool-calling.md](../../prompts/04-tool-calling.md)。

文件：[mcp-zapier-sse.json](mcp-zapier-sse.json)
