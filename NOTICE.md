# 第三方资源说明

## 字体：HarmonyOS Sans SC

- 文件：`HarmonyOS-SC-Regular-subset.ttf` / `HarmonyOS-SC-Medium-subset.ttf` / `HarmonyOS-SC-Bold-subset.ttf`
- 版权：© Huawei Device Co., Ltd.
- 来源：华为官方发布的 HarmonyOS Sans 字体（本项目通过 npm 包 `harmonyos-sans` 获取原始 TTF）
- 许可：HarmonyOS Sans 允许个人与商业免费使用（不得单独售卖字体本身）。使用前请阅读官方许可条款。
- 本项目做过的处理：用 `scripts/subset_font.py` 做**字形子集化**（只保留页面实际用到的约 400 个字符），未修改字形本身。

> 如果权利方认为该分发方式不妥，请开 issue，我会立即移除相关字体文件。

## 图标

- [Lucide](https://lucide.dev/) —— ISC License
- [Phosphor Icons](https://phosphoricons.com/) —— MIT License

## 参考截图

`ref/` 目录**不随仓库提供**。仓库里的两张参考图仅用于本地校准，属于第三方 App 的界面截图，版权归原 App 所有，因此不纳入版本控制。

## 免责声明

本项目用于 UI 复刻练习、截图工具链测试等场景。模板中的界面设计、图标风格与文案归属各自的权利方，请勿将生成的图片用于伪造证明材料、骗取奖励或任何违法用途。
