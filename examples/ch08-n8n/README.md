# 第 8 章配套：n8n 本地部署（Docker）

> 整理自本书第 8 章（约 p262，8.3.1 节「n8n 本地部署」）的命令。

```bash
# 1. 创建持久化数据卷
docker volume create n8n_data

# 2. 启动 n8n（端口 5678，数据挂载到 n8n_data 卷）
docker run -it --rm --name n8n -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

启动后访问 http://localhost:5678 进入 n8n 操作界面。

## 补充说明

- 生产环境建议去掉 `--rm` 并改用 docker-compose 管理，增加 `N8N_BASIC_AUTH_*` 等访问控制环境变量。
- 国内网络拉取镜像失败时，可配置 Docker 镜像加速器。
- n8n 采用公平代码（fair-code）许可，商用前请阅读其许可条款。

更多 n8n 工作流模板见 [../../resources/n8n-practice.md](../../resources/n8n-practice.md)。
