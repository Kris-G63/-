# Date Whisper 💌

一个移动端优先、可以直接分享链接的约会邀请 H5。

## 已实现

- 粉色系玻璃拟态 + 浮动爱心/花朵/星星
- 手机优先响应式布局，桌面端也可用
- 创建者填写昵称、留言
- 活动多选：早餐 / 午餐 / 晚餐 / 下午茶 / 咖啡 / 散步 / 运动 / 电影 / 看展等
- 自定义活动
- 2–5 个可选日期/时间
- 1–5 个深圳地点，可让 TA 决定
- 生成可分享邀请链接
- TA 打开“拆信”并选择时间、地点、回复留言
- 生成“回复链接”发回创建者
- 创建者打开回复链接即可查看最终选择
- 一键生成 `.ics` 日历文件
- Web Share API：手机可直接调用系统分享面板
- PWA manifest + service worker

## 为什么不需要数据库也能分享？

邀请内容会被编码进 URL 的 hash (`#invite=...`)。因此只要网站部署在公网，任何人拿到链接都能看到同一张邀请卡。

TA 的回复也会生成 `#response=...` 链接发回给创建者。

这非常适合第一版 MVP：

- 不用注册登录
- 不用数据库
- 没有后端成本
- 部署后立即可用

如果后续希望“TA 一回复，创建者自动收到结果/邮件”，再接 Supabase 或 Firebase 即可。

## 本地运行

不要直接双击 `index.html`（Service Worker 在 file:// 下不会工作）。推荐：

```bash
python3 -m http.server 4173
```

然后打开：

```text
http://localhost:4173
```

## 部署到 Vercel

1. 把整个 `date-whisper` 文件夹上传到 GitHub 仓库。
2. 在 Vercel 新建 Project 并导入仓库。
3. Framework Preset 选择 **Other**。
4. 不需要 Build Command。
5. Output Directory 留空。
6. Deploy。

部署后会得到类似：

```text
https://date-whisper.vercel.app
```

随后创建邀请，生成的 `#invite=...` 链接即可直接发微信/短信。

## 生产版下一步建议

第二阶段建议接 Supabase：

- `invites` 表保存邀请
- `responses` 表保存 TA 选择
- 邀请链接改为 `/i/:slug`
- 创建者有一个无需注册的“管理密钥”页面
- 邮件/微信通知
- 查看谁打开了邀请、是否已回复（注意隐私说明）

当前版本没有跟踪用户、没有上传联系人信息，隐私模型非常简单。
