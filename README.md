# 可复用 Skills

从实际研究、学习、论文阅读和日常工作中沉淀的 Agent 工作方法。进入各目录查看 `SKILL.md`。

| Skill | 用途 | 依赖与说明 |
|---|---|---|
| [agent-prompt](agent-prompt/SKILL.md) | 全局协作提示词：费曼式理解、创造者式推演、来源标注、工程与工具约定 | 含完整 AGENTS.md 公开参考；安装 Skill 不会自动写入全局配置 |
| [feynman-research](feynman-research/SKILL.md) | 拆解、并行研究、蒸馏与连贯讲述 | 搜索优先 AnySearch；Research MCP 可选 |
| [systematic-learning](systematic-learning/SKILL.md) | 讲解、情境测试、评分与学习归档 | 使用用户自己的学习目录 |
| [paper-reading](paper-reading/SKILL.md) | 论文讲解与创造者视角分析 | 附公开论文的解读示例，不含论文 PDF |
| [anysearch](anysearch/SKILL.md) | 网页、垂直领域、批量搜索及正文抓取 | 第三方本地适配版；CLI 与 API 服务，非 MCP；保留上游许可证 |
| [wechat-digest](wechat-digest/SKILL.md) | 微信群阅读规则、日报配置与前端 | 仅公开规则/配置/前端；外部读取执行器未包含，不能开箱即用 |

已发布的 [history-strategy-game](https://github.com/Jason-Yao-Builder/Games/blob/main/history-strategy-game/SKILL.md) 现位于独立的 [Games 仓库](https://github.com/Jason-Yao-Builder/Games)。独立的 [universal-research-mcp](https://github.com/Jason-Yao-Builder/universal-research-mcp) 仓库提供 Research MCP 源码。

## 获取与安装

```bash
git clone https://github.com/Jason-Yao-Builder/Skills.git
```

从克隆得到的 `Skills/` 目录中选择需要的整个技能文件夹，复制到当前 Agent 支持的技能目录，例如 Codex 的 `~/.codex/skills/`、共享目录 `~/.agents/skills/` 或 Claude Code 的 `~/.claude/skills/`。保留 `SKILL.md` 与相对引用的资源。只在目标目录不存在时直接复制；已有版本先比较差异，避免覆盖本机配置。具体发现方式以所用 Agent 版本为准。

AnySearch 需按其 README 配置依赖与可选密钥；`.env`、本机 runtime 配置不随仓库分发。微信日报需要自行准备兼容执行器与授权数据源。

公开副本去除了凭据、私人路径和业务/个人数据，并对路径作可移植适配；它不是本机运行环境的完整备份。AnySearch 的授权见其 LICENSE/NOTICE；本次未给其余作者原创内容额外声明统一开源许可证。

配套文档和页面模板见独立的 [Templates 仓库](https://github.com/Jason-Yao-Builder/Templates)。
