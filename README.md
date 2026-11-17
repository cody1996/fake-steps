# 步数截图生成器

按日期范围批量生成「运动 App 步数页面」截图：**今天用今日页模板，其余日期用历史页模板**，步数在设定区间内随机，热量 / 距离 / 24 小时分布等指标由步数推导。

全部在浏览器里完成，无后端、不上传、不存储任何数据；构建产物是纯静态文件，可直接部署到 GitHub Pages / nginx。

> ⚠️ 本项目用于 UI 复刻练习与截图工具链测试。模板中的界面设计、图标风格与文案归属各自权利方，**请勿用于伪造证明材料、骗取奖励或任何违法用途**。
> 代码以 MIT 协议开源；第三方资源（字体、图标、参考截图）的说明见 [NOTICE.md](NOTICE.md)。

## 当前进度（v0.6）

| 模块 | 状态 |
|---|---|
| 历史页模板（1179×2560，逐区块对齐参考图） | ✅ |
| 今日页模板（进度环 + 指标行 + 四张卡片 + tabbar） | ✅ 已按 HarmonyOS Sans 重新校准 |
| 生成工作台：日期范围 / 步数区间 / 种子 / 逐张预览 / 缩略图 | ✅ |
| 导出：单张 PNG、逐张保存、系统分享（存相册）、ZIP | ✅ 已在浏览器内实测 |
| 手机适配：单列布局 + 参数面板 + 自适应预览 | ✅ |
| 核心算法：随机、热量与距离换算、24 小时作息分布、随机轨迹 | ✅ 有单测（11 条） |

## 环境准备

需要 **Node.js 20.19+ 或 22.12+**（Vite 8 的要求）。在终端里确认：

```bash
node -v
npm -v
```

- 两个都有 → 直接用下面的 npm 命令，或先 `npm i -g pnpm` 再换成 pnpm。
- 提示 `node 不是内部或外部命令` → 先去 [nodejs.org](https://nodejs.org/) 装 LTS 版本（安装包自带 npm），装完**重新开一个终端**。

包管理器用 npm 或 pnpm 都行，二者选一，不要混用（混用前先删掉 `node_modules`）：

```bash
# 方式 A：npm（Node 自带，最省事）
npm install
npm run dev        # http://localhost:5173

# 方式 B：pnpm
pnpm install
pnpm dev
```

## 快速开始

```bash
pnpm install     # 首次安装
pnpm dev         # 开发预览 http://localhost:5173
pnpm build       # 产出 dist/（纯静态，可托管到任意服务器）
pnpm preview     # 本地预览构建产物 http://localhost:4173
pnpm test        # 运行核心算法单测
```

> 构建产物是 ES Module，需要通过 HTTP 访问；`pnpm preview` 或任意静态服务器（Nginx / OSS / GitHub Pages）都能直接跑。

## 目录结构

```
src/
├─ core/           # 纯逻辑：随机、指标换算、批次生成、轨迹（无 DOM 依赖，可单测）
├─ templates/      # 两个页面的模板（绝对定位，按 393×853.33 逻辑像素布局）
│  └─ parts/       # 通用部件（状态栏等）
├─ export/         # 导出：离屏挂载 → html-to-image → PNG；JSZip / Web Share
├─ ui/             # 工作台：控制面板、预览台、缩略图、设备外框
├─ assets/fonts/   # HarmonyOS Sans SC 子集（Regular/Medium/Bold 三份，共约 320 KB）
└─ styles/
tests/             # vitest 单测
scripts/           # 开发期工具（截图对比、字体子集化），说明见 scripts/README.md
docs/design.md     # 设计方案
ref/               # 参考截图，需自备（不随仓库分发，见 NOTICE.md）
```

## 数据规则

- 步数：`min + rand(0,1) × (max - min)`，种子固定时结果可复现。
- 热量：`步数 × 0.0295 × (0.92–1.08)`（系数由参考图 258 kcal / 8742 步反推）。
- 距离：`步数 × 0.714 m × (0.92–1.08)`（6.24 km / 8742 步反推）。
- 24 小时分布：按作息权重（早晚通勤、午间高峰）分配并做 ±22% 抖动，**总和严格等于当日步数**。
- 今日页三色环：外→内分别对应「活动热量 / 锻炼时长 / 活动小时数」的完成度，弧长 = 数值 ÷ 目标，浅色是轨道、实色是进度。
- 活动小时数 / 锻炼时长 / 睡眠 / 心率 / 运动记录里程：由步数与随机数联动生成。
- 运动轨迹：按日期种子随机游走 + 贝塞尔平滑，每天一条不同路线（`src/core/trace.ts`）。

## 手机使用

- 布局自动切成单列：顶部只有标题和「参数」按钮，点开才是日期 / 步数设置，关掉就只看预览。
- 预览会按屏幕宽高自动缩放，一屏内能看到预览、日期、翻页和导出按钮。
- 导出提供三种方式（见下），手机上不需要解压 ZIP。

## 导出

- 默认只生成今天一天；勾选「包含今天」时今天用今日页模板，取消勾选则只生成到昨天。
- 单张：`下载这张` → `steps-YYYY-MM-DD.png`
- 多张（推荐手机）：`逐张保存` 直接连续存入相册/下载目录；iPhone 用 `存到相册` 走系统分享面板，一次把 N 张图存进相册
- 整批打包：`ZIP` → `steps-起_止.zip`，内部 `steps/steps-YYYY-MM-DD.png`（桌面端应急用）
- 输出固定 **1179×2560**（393×853.33 逻辑像素 @3x），与参考截图同尺寸

## 自检方式

开发期用无头浏览器把模板渲染成 1179×2560 的 PNG，与 `ref/` 的参考图做逐区块墨迹对比和叠加图（红=参考、青=渲染）：

```bash
node scripts/shot-daemon.mjs          # 起本地截图服务
scripts 里还有：compare.py / overlay.py / bands.py / subset_font.py
```

完整用法见 [scripts/README.md](scripts/README.md)。参考截图需自备（版权原因不随仓库提供）。

导出链路也有端到端自检：`?capture=selftest` 会真实出两张图、回传保存，并校验尺寸。

## 部署到 GitHub Pages

仓库里已经带好 `.github/workflows/deploy.yml`：**push 到 `main` 就会自动跑测试、构建并发布到 Pages**。

首次启用只要两步：

1. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**；
2. push 到 `main`（或在 Actions 页面手动 `Run workflow`）。

之后站点地址是 `https://<用户名>.github.io/<仓库名>/`。因为用的是 `base: './'`（相对路径），子路径部署**不用改配置**。

本地想先看效果：

```bash
pnpm build     # 产物在 dist/
pnpm preview   # http://localhost:4173
```

> `dist/index.html` 是 ES Module，必须通过 http(s) 访问；直接双击文件会白屏，本地预览请用 `pnpm preview`。

## 已知待办

- 字体：已改用 HarmonyOS Sans SC（更接近 PingFang），三档字重各做子集；若某处字号仍需微调，改对应 CSS 即可。
- 今日页图标已改用 Lucide + Phosphor 图标库，只有「返回箭头」保留手写 path（原图箭头更宽更扁）。
- 减脂卡片的仪表盘比例与参考图仍有小差异；三色环开口角度略窄。
- 手机端「逐张保存 / 存到相册」需要真机验证（无头浏览器不会触发下载与分享面板）。