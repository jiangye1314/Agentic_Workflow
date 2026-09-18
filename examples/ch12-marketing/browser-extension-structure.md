# 电商场景浏览器插件 · 工程结构

> 整理自本书第 12 章（约 p340）的浏览器插件目录结构示例。

```text
├── manifest.json        # 浏览器插件配置文件
├── background.js        # 后台脚本
├── content.js           # 内容脚本，注入到电商页面
├── popup/               # 弹出窗口
├── sidepanel/           # 侧边栏界面
│   ├── components/      # UI 组件
│   ├── services/        # API 服务
│   └── utils/           # 工具函数
└── assets/              # 静态资源
```

## 各文件职责速查

| 文件/目录 | 职责 | 在 Agent 工作流中的角色 |
| --- | --- | --- |
| `manifest.json` | 声明权限、脚本注入规则 | 决定插件能「感知」哪些页面 |
| `background.js` | 常驻后台，事件监听与调度 | 工作流的「神经系统」 |
| `content.js` | 注入电商页面，读取/操作 DOM | 数据采集与页面级动作执行 |
| `popup/` | 点图标弹出的轻量交互 | 用户主动触发的入口 |
| `sidepanel/` | 侧边栏，承载完整交互界面 | Agent 对话与结果展示的主界面 |

## 合规提示

- 采集页面数据前确认目标电商平台的条款与 robots 协议。
- `manifest.json` 权限最小化：只声明业务必需的权限（如限定 `host_permissions` 到目标站点）。
