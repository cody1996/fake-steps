# scripts/

开发期的几个小工具，用来把模板和参考截图对到像素级。**不参与构建，也不影响运行**。

## 前置条件

- Python 3.10+，并安装 `numpy` 和 `pillow`：
  ```bash
  pip install numpy pillow
  ```
- 字体子集化需要 `fonttools`：
  ```bash
  pip install fonttools
  ```
- 截图脚本需要本机装有 Edge / Chrome（默认取 Windows 版 Edge 路径，可用 `EDGE_PATH` 覆盖）。

## 工作流

```bash
pnpm build                       # 先构建，截图脚本托管的是 dist/
node scripts/shot-daemon.mjs     # 起本地截图服务（127.0.0.1:8791）

# 另开一个终端，让服务截一张图
curl "http://127.0.0.1:8791/shot?capture=history&out=history.png"
curl "http://127.0.0.1:8791/shot?capture=today&out=today.png"

python scripts/compare.py history   # 左右对比图
python scripts/overlay.py history   # 红/青叠加图，看偏移
python scripts/bands.py history     # 逐行文字位置对照
```

截图统一落在 `.dev/shots/`（已 gitignore），不会污染仓库。

## 各脚本说明

| 脚本 | 作用 | 参数 |
|---|---|---|
| `shot-daemon.mjs` | 本地截图服务：托管 `dist/`，用无头浏览器按请求截图 | `?capture=today\|history\|app&out=xxx.png&w=1179&h=2560`；`mode=visit` 只打开页面不截图（给异步任务留时间）；`POST /save?name=x.png` 接收页面回传的文件 |
| `compare.py` | 参考图与渲染图并排 | `history` / `today` |
| `overlay.py` | 红=参考、青=渲染的叠加图 | 同上 |
| `bands.py` | 打印两张图每行文字的 y/x 区间 | 同上 |
| `subset_font.py` | 把 HarmonyOS Sans 裁成只含页面用到的字符 | HarmonyOS Sans SC 字体目录路径 |

## 关于 `ref/`

参考截图**不随仓库提供**（涉及第三方 App 的界面版权）。想复刻自己的模板时：

1. 把你的截图放到 `ref/today.jpg` 和 `ref/history.jpg`（1179×2560）；
2. 按上面的流程跑对比脚本；
3. 用 `overlay.py` 一点点把模板调到像素级接近。
