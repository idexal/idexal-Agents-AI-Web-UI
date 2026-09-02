# Idexal Agents

[English](README.md) | 中文

**Idexal Agents** 是由 [Idexal](https://idexal.com) 开发的开源 AI 驱动的 IDE。

构建于**一切皆插件**的架构之上，由 [Cordis](https://github.com/cordiverse/cordis) 驱动，其设计参见论文 [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512)。

文档：[https://agents.idexal.com](https://agents.idexal.com)

## 关于 Idexal

**Idexal** 是一个开源的 AI 驱动的 IDE，与最好的专有解决方案竞争——让每个开发者在每个平台上都能使用。

### 领导团队

**Zakariae Lahbabi**  
创始人、首席执行官兼首席开发  
热衷于构建世界级的开发工具。Zakariae 创立了 Idexal，使命是创建一个开源的 AI 驱动的 IDE，与最好的专有解决方案竞争——让每个开发者在每个平台上都能使用。

- 🌐 [zakariaelahbabi.com](https://zakariaelahbabi.com)
- ✉️ [info@zakariaelahbabi.com](mailto:info@zakariaelahbabi.com)
- ⚡ GitHub [@idexal](https://github.com/idexal)
- 🌐 [agents.idexal.com](https://agents.idexal.com)
- 🌐 [idexal.com](https://idexal.com)
- ✉️ [info@idexal.com](mailto:info@idexal.com)

## 开发者预览

Idexal Agents 处于 _开发者预览_ 阶段，正在快速迭代。**未来将出现破坏兼容性的变更。**

运行本项目前，请阅读[安全说明](SAFETY.zh.md)。

<a id="run"></a>

## 运行

### 通过 `npm` 运行

安装 `Node.js`，然后运行：

```sh
npx @deepseek-ai/dsh web
```

该命令默认会在 `http://127.0.0.1:3080` 启动 Web UI，本机启动时还会用默认浏览器打开页面。通过 SSH 启动时只打印宿主机 URL，因为本地转发地址由 SSH 客户端或编辑器持有。传入 `--no-open` 可仅运行服务器而不打开浏览器。详见 [Web UI 指南](docs/user/guide/index.zh.md)。

<a id="run-from-source"></a>

### 从源码运行

如需从仓库源码运行：

```sh
git clone https://github.com/idexal/agents.git
cd agents
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` 会准备仓库产物。`pnpm dsh web` 会直接使用这些已构建产物，不会重新构建。

## 社区与支持

- 通过 [GitHub Discussions](https://github.com/idexal/agents/discussions) 提交反馈或 bug 报告。
- 为你的插件仓库添加 [`idexal-plugin`](https://github.com/topics/idexal-plugin) 话题，便于被发现。
- 访问 [agents.idexal.com](https://agents.idexal.com) 获取文档和更新。

## 参与贡献

参见 [CONTRIBUTING.md](CONTRIBUTING.zh.md)。

## 开发

请先阅读[开发指南](docs/development.zh.md)与[架构文档](docs/architecture.zh.md)。

面向 agent：请遵循 [AGENTS.md](AGENTS.md)。

## 许可证

[MIT](LICENSE)

第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

---

<p align="center">
  <strong>Idexal Agents</strong> — 开源 AI 驱动的 IDE<br>
  由 <a href="https://idexal.com">Idexal</a> 用心打造
</p>
