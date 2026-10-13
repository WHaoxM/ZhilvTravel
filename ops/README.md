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
