# 官网自动发布

`main` 的每次推送都会在 GitHub Actions 中以 Node 22 运行 `npm run build` 和 `npm run validate`。经验证的 `dist/` 被打包并标记 `release.json`（提交 SHA），再以专用 SSH 密钥流式送入服务器。PR 只构建、验证，不读取生产密钥。

服务器只运行静态 Nginx 容器；共享网关、付款 API 与数据库不在此发布流程内。容器挂载 `/opt/wenshu-site`，其站点根目录为容器内的 `/srv/wenshu/current`。发布器把产物解压到 `/opt/wenshu-site/releases/<sha>`，核对 GitHub 当前 `main`、产物摘要和页面，再原子切换 `current`。检查失败会恢复上一个链接。初次安装时保留原有版本和配置备份。

发布私钥和固定的服务器 SSH 主机公钥存放于 GitHub `production` environment 的 `WENSHU_DEPLOY_SSH_KEY`、`WENSHU_DEPLOY_KNOWN_HOSTS`。服务器账号 `wenshu-deploy` 的授权公钥仅允许调用 `wenshu-ssh-gate`；该入口只接收 `deploy <commit> <archive-sha256>` 和归档标准输入。不可使用 root 口令作为 Actions 密钥。

检查线上版本：

```bash
curl -fsS https://www.zhilvtravel.com/release.json
```

在服务器以 root 手动回滚到保留的版本目录名（仅切换文数智旅静态站）：

```bash
ls -1 /opt/wenshu-site/releases
/usr/local/sbin/wenshu-release rollback <release-directory-name>
```

发布记录保存在 `/opt/wenshu-site/deployments.log`。失败时先看 Actions 日志与该记录，确认 `current` 实际指向及公网 `release.json`，不要只以归档上传成功判断发布完成。旧版本暂不自动删除。

## 官网留资与人工咨询

首页主表单、预约弹窗及人工客服离线留言由浏览器提交到
`https://www.xuntingtravel.com/api/wenshu?action=lead`，不是发送到 GitHub、静态站
Nginx 或发布服务器的邮箱。人工客服实时会话使用同一 API 的 `session` / `messages`
动作。前端只在接口返回 `ok: true` 且包含回执 `id` 后显示提交成功；失败时保留
填写内容供重试。

2026-10-17 从 `www.zhilvtravel.com` 的允许来源发送一条明确标记为测试的样本，
接口返回 `ok: true` 和回执 `6406f750-99ef-41f8-9dae-22a8d99272bf`。
这只证明接收接口给出回执，**不证明**业务人员已在管理后台看见该条，也不证明
邮件或企业微信已收到通知。接收后台、负责人账号和通知目标不在此静态仓库中，
需由该 API 的维护方确认，并用上述回执在最终存储/管理界面核对。

如需新线索自动通知，先确定收件邮箱或企业微信应用及接收负责人，再在接收 API
的服务端配置通知；不要把邮箱 SMTP 密钥、企业微信密钥或管理凭据写入本公开仓库
及浏览器可见的 `lead-config.js`。
