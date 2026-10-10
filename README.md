# 来一车 · 剧本杀拼车日历

多人通过同一个链接填写昵称、空闲日期（Available）和优先想玩的日期（Preference）。每车使用独立链接，名单和共享设置互相隔离。

线上网站：https://laiyiche-calendar.dark-birch-8541.chatgpt.site

## 功能与推荐规则

- 日历按月显示，推荐汇总所有月份已保存的日期。
- 每车人数为共享设置，可填写 5、6、7、8 等人数。
- 先尽量安排完整车辆，再最大化满足 Preference 的人数。每车日期不同，每位玩家只安排一次。
- 例如每车 6 人、18 位玩家，在日期可行时推荐 3 车；条件不足时说明实际能安排的车数。
- 可以新建一车、复制链接、删除本车玩家记录。

## 开发与验证

需要 Node.js 24 或更新版本。

```sh
npm ci
npm test
npm run build
npm run validate
```

`npm run build` 生成 Cloudflare Workers 兼容的 `dist/server/index.js`，内含页面、API 和浏览器推荐模块。它依赖云端 D1 绑定 `DB`；直接打开 HTML 文件不会拥有共享数据功能。

## 代码结构

- `worker/index.js`：页面、车链接与 API。
- `worker/recommend.js`：动态分组优化算法。
- `db/schema.ts`：数据库结构。
- `drizzle/`：数据库迁移和历史元数据。
- `scripts/`：构建及产物验证。
- `.openai/hosting.json`：现有 OpenAI Sites 项目标识与数据库绑定，不含密码或 API 密钥。
- `tests/`：分组规则回归测试。

数据库结构修改后执行 `npm run db:generate`，检查新迁移后提交。已部署过的迁移文件及其元数据应保持不变。

## 托管与数据

当前由 OpenAI Sites 托管，玩家记录和共享人数保存在 Cloudflare D1。这个 GitHub 仓库保存代码及提交历史，不保存玩家数据、个人修改凭证或数据库导出。

持有车链接的人可以查看、报名、修改共享人数及删除该车记录。个人编辑凭证保存在浏览器里，不应提交到 Git。

## 发布

推送此仓库不会自动更新现有网站。现有网站通过 OpenAI Sites 发布流程部署；可以让 ChatGPT/Codex读取仓库修改并发布，或将构建产物迁移到自行配置的 Cloudflare Worker 和 D1。不要把 Sites 短期推送凭证或数据库备份放进仓库。

这个仓库保留了网站已有的 6 个代码提交。后续修改可通过正常 Git 提交记录与标签管理。
