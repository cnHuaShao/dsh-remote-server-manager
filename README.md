# 远程服务器管家（Remote Server Manager）

一个安装在本机 DeepSeek Harness Web UI 里的持久化插件：通过 SSH 连接 Linux 服务器，在同一个面板里管理远程文件、查看主机状态、管理防火墙、探测开发/部署软件，并停止/重启 Docker 容器。针对“单台服务器上容器很多”的场景，列表、搜索、项目分组、分页和批量操作都在服务端完成。

## 功能

- **服务器管理**：新增、编辑、删除多台 SSH 服务器；支持密码和私钥登录；连接信息保存在当前 DSH profile，密码/私钥写入 Harness 凭据服务，不出现在前端或 `servers.json`。
- **主机总览**：操作系统、运行时长、当前用户、磁盘、内存、Docker 版本、运行中容器数、SSH 主机指纹。
- **文件管理**：目录浏览、路径跳转、面包屑、隐藏文件开关、名称过滤；新建目录、重命名、递归删除、上传（≤ 24 MB）、下载、文本文件在线编辑（≤ 2 MB，带修改时间冲突检测）。
- **容器管理**：
  - 一次 `docker ps -a` 拉取全部容器，然后在主机侧搜索、按状态/Compose 项目过滤、排序、分页（25/50/100/200，默认 50）。
  - 顶部汇总总数、运行中、已停止、暂停、Compose 项目数；项目下拉带数量。
  - 当前页多选后批量停止/重启，最多 4 个并发，逐个返回成功/失败结果。
  - 单容器停止、启动、重启、查看详情（镜像、命令、端口、网络、挂载、环境变量、标签、重启次数）。
  - 4 秒缓存 + 手动刷新 + 15/30/60 秒自动刷新，避免频繁 SSH。
- **镜像管理**：镜像使用独立的“镜像”页，不再和容器混在同一个列表。按仓库/标签/ID 搜索，区分有标签与悬空镜像，按名称/大小/创建时间排序，分页浏览；顶部显示镜像总数、有标签数、悬空数、镜像大小合计（按镜像大小求和，不代表层去重后的磁盘占用）。镜像页提供“Docker 源”设置，可查看并修改 `/etc/docker/daemon.json` 的 `registry-mirrors`，使用 DaoCloud、1Panel、中科大或自定义 https 镜像加速地址；保存前二次确认，自动备份配置并重启 Docker，重启失败会恢复备份。不提供删除/拉取镜像操作。
- **防火墙管理**：新增独立“防火墙”页，自动识别 firewalld、ufw，以及只读展示的 nftables/iptables。显示运行状态、默认区域/策略和规则列表；支持开放 TCP/UDP 端口、放行/移除 firewalld 服务、删除 ufw 规则、重载防火墙；ufw 未启用时会展示已配置但未生效的暂存规则，并可在确认后先自动放行当前 SSH 端口再启用。SSH 端口和 `ssh` 服务默认受保护，插件会拒绝删除对应规则；修改需要 root 或免密 `sudo`，否则页面只读并提示原因。
- **安装程序探测**：新增独立“安装探测”页，一次性检查常见开发、构建和部署软件是否安装及版本，包括 Node.js/npm/pnpm/Yarn/Bun/Deno、Python/pip、Java/javac、Go、Rust/Cargo、.NET、PHP/Composer、Ruby、Git、GCC/G++/Make/CMake、Maven/Gradle、Docker/Docker Compose/Podman、kubectl/Helm/K3s、Ansible/Terraform/Jenkins/PM2/Supervisor、Nginx/Caddy/HAProxy、Redis/MySQL/PostgreSQL/MongoDB、curl/Wget/jq。已安装项排在前面，未安装项排在后面；按分类/安装状态/可操作项筛选，支持搜索和查看可执行文件路径；在 apt 系统上会读取软件仓库候选版本，未安装的提供“一键安装”，已安装且仓库版本更新的提供“一键升级”，所有操作都要二次确认。页面结果缓存 5 分钟，切换标签不会重复探测，点刷新才强制重新读取。
- **软件源管理**：安装探测页提供“软件源”入口，仅针对 apt 系统。可查看当前发行版、架构和 Ubuntu/Debian 官方源地址；支持一键执行 `apt-get update` 更新索引，也可从官方、阿里云、清华 TUNA、中科大、华为云、网易或自定义镜像中更换软件源。更换前会备份 `/etc/apt` 下的源文件，只改 Ubuntu/Debian 仓库地址，Docker、Kubernetes、NodeSource 等第三方源保持不变；替换后自动执行 `apt-get update`，失败会恢复备份。
- **操作日志**：记录连接测试、容器操作、防火墙操作、文件写入/上传/删除等近期行为（只保留在内存中）。
- **对话引用**：在聊天输入框输入 `@`，选择“服务器”分组里的已保存服务器，会插入一个服务器引用；发送后模型能从引用中读到服务器名称、地址和 id，并可调用 `remote_server` 工具查询/操作该服务器。
- **对话工具**：`remote_server` 支持列出服务器、查看总览、查询/过滤/分页容器、查询/过滤/分页镜像、查看防火墙状态和规则、探测开发/部署软件（含 apt 可安装/可升级信息）、查看 apt 发行版和当前软件源、查看 Docker 镜像加速源、启动/停止/重启容器、列出目录和读取远程文本文件；容器变更只应在用户明确要求时执行。防火墙写操作、软件安装/升级、软件源更换和 Docker 源修改只通过 UI 提供，避免模型误改。
- **中英双语**：跟随 Harness 当前语言，内置 `zh` / `en` 词典。

## 安装

从 npm 安装（推荐）：

```text
plugin_manager install_bundle  target: dsh-remote-server-manager
```

也可以直接从 GitHub 安装：

```text
plugin_manager install_bundle  target: https://github.com/cnHuaShao/dsh-remote-server-manager
```

或者直接在 Harness 插件管理里搜索/安装 `dsh-remote-server-manager`。

本地开发时，在插件目录执行：

```text
plugin_manager install_bundle  target: D:\path\to\remote-server-manager
```

安装后刷新 Web UI，左侧活动栏会出现“远程服务器管家”图标。

## 使用

1. 打开左侧“远程服务器管家”。
2. 点右上角 `+` 新增服务器：填写名称、主机、端口、用户名、认证方式。
3. 保存后点“测试”确认 SSH 和 Docker 可用；首次连接会记录主机 SHA-256 指纹。
4. 在“容器”页搜索、按项目过滤、分页浏览；勾选当前页容器后使用批量停止/重启。镜像相关内容在单独的“镜像”页查看，镜像页右上角“Docker 源”可配置镜像加速源；防火墙和软件探测分别在“防火墙”“安装探测”页。
5. 在“文件”页输入路径或点面包屑跳转；文本文件点击文件名在线编辑，保存时会检查文件是否被外部修改。
6. 在“总览”页查看主机状态；在“日志”页查看近期操作。
7. 在任意对话的输入框输入 `@`，选择“服务器”分组中的服务器；引用会随消息发送，模型可据此定位服务器。也可以直接说服务器名称，模型会先调用 `remote_server` 的 `list` 动作查找。
8. 对话中可以让模型调用 `remote_server` 查看总览/容器/镜像/防火墙/安装软件/文件；明确要求“停止/重启某容器”时才会执行容器变更。

> Docker 命令默认是 `docker`。如果当前 SSH 用户需要 sudo，改成 `sudo docker`；命令只允许字母、数字、`_ . / 空格 -`，避免把任意 shell 注入配置。

## 安全设计

- 所有 HTTP 接口挂在 `/remote-server-manager` 前缀下，并复用 Harness 的 `ctx.connection.requestRejection` 做 Host/Origin 和浏览器认证检查。
- 前端只拿到 `secret.password` / `secret.privateKey` 的布尔状态，永远拿不到明文。
- 主机指纹采用 trust-on-first-use：首次连接记录 SHA-256；后续指纹变化直接拒绝并返回 `host_key_changed`。
- 路径在主机侧做规范化并限制在可访问范围内；删除目录要求显式 `recursive: true`。
- 文件编辑使用 `expectedMtime` 做乐观并发控制；上传大小和可编辑文本大小都有上限。
- 容器 ID 使用严格正则校验；Docker 命令配置经过白名单字符校验。
- 防火墙端口、协议、区域、服务名都做严格校验；删除 SSH 端口或 `ssh` 服务的请求直接拒绝。防火墙写命令使用 `sudo -n`，不会等待或收集 sudo 密码。
- 安装探测只执行固定目录中的软件版本命令，不接受用户提供的任意命令；一键安装/升级使用后端内置的 apt 包名，不接受前端传入任意包名或 shell 命令，并用 `sudo -n` 执行。

## 数据位置

- 服务器列表：`$DSH_PROFILE_DIR/remote-server-manager/servers.json`（原子写入，权限 0600）。
  桌面端宿主未注入 `DSH_PROFILE_DIR` 时，会从启动参数识别当前 profile；若发现旧版本误写在 `default` profile 的数据，会在首次加载时自动复制到当前 profile。
- 密码/私钥/口令：Harness 凭据服务，引用名形如 `DSH_RSM_<SERVER_ID>_PASSWORD`。
- SSH 连接池和容器列表缓存只在内存中，进程退出即释放。

## 开发与测试

```powershell
cd remote-server-manager
node --check index.js
node --check client.js
node test\mock-test.mjs
node test\http-test.mjs
node test\client-source-test.mjs
```

`test/client-source-test.mjs` 校验 `@` 服务器引用源注册、候选列表和序列化文本。

`test/mock-test.mjs` 使用 `ssh2.Server` 起一个本地 mock Linux 主机（含 320 个容器、60 个镜像、虚拟 SFTP 文件系统），覆盖：

- 密码认证、主机指纹、连接复用；
- SFTP 列目录、读/写文件、新建/重命名/递归删除、上传；
- 容器总数/分页/项目分组/搜索/状态过滤/批量重启/详情；
- 镜像按 ID 合并多标签、总数/有标签/悬空统计、搜索、大小排序、分页；
- 防火墙 firewalld/ufw 识别、规则解析、开放端口、删除 ufw 规则、SSH 规则保护；
- 开发/部署软件探测与版本解析、Docker Compose 缺失识别、apt 可安装/可升级判断与一键安装/升级命令；
- apt 软件源读取、Ubuntu/Debian 源识别、镜像切换内容重写、备份和 `apt-get update` 流程；
- Docker `daemon.json` 镜像加速源读取、URL 校验、备份、重启和失败回滚；
- 主机总览解析。

## 已知限制

- 只支持 SSH 密码和私钥认证；暂不支持 SSH Agent 转发、跳板机、键盘交互认证。
- 文本编辑上限 2 MB，上传上限 24 MB；二进制文件只能下载。
- 文件操作依赖远端 SFTP 子系统；部分精简系统可能未启用。
- 镜像页提供 Docker 源设置，但仍不提供删除/拉取/导入镜像；容器也暂不提供删除入口，避免误删。
- 防火墙写操作仅支持 firewalld/ufw；nftables/iptables 只读展示。若 SSH 用户需要 sudo 密码，页面无法直接修改防火墙，需要配置免密 sudo 或手动执行。
- 启用 ufw 前会自动放行当前 SSH 端口，但仍可能影响现有业务端口；请先确认需要的规则已添加，并保留其他登录方式。插件不提供关闭防火墙操作。
- 防火墙写操作会立即生效；firewalld 使用 permanent 配置后 `--reload`，ufw 规则通过规则序号删除，规则变化后请刷新再操作。
- 安装探测只覆盖内置的常见软件目录，不会扫描任意自定义路径或 Windows 服务；版本输出取命令前几行，个别软件可能显示“已安装（版本未知）”。
- 安装探测结果在前端缓存 5 分钟，后端也做短时缓存；软件列表变化或刚完成安装/升级后点刷新按钮即可强制更新。缓存期间版本信息可能不是实时值。
- 一键安装/升级目前仅支持 apt 系统（Debian/Ubuntu），且只对内置了 apt 包名的软件显示按钮；Docker、kubectl、Helm、Terraform、PM2 等通过官方源或脚本安装的软件不自动操作。仓库候选版本来自本机 apt 索引，不会自动执行 `apt-get update`，需要先自行刷新软件源；已通过 `/usr/local` 等方式外部安装的软件只提示手动升级，避免 apt 覆盖错版本。
- 安装/升级会真实改动远端系统软件包，可能重启服务或影响依赖；操作前会弹出确认，执行期间同一服务器只允许一个包操作，输出失败会原样返回。若 sudo 需要密码或 apt 被其他进程锁定，操作会失败而不会尝试提权或等待输入。
- 软件源管理仅支持 apt 系统；只替换路径为 `/ubuntu`、`/ubuntu-ports`、`/debian` 或 `/debian-security` 的发行版仓库 URL，第三方源不改。更换前备份到 `/etc/apt/rsm-backup-<时间戳>`，如果 `apt-get update` 因任意源失败会自动恢复原文件；自定义镜像只接受 http(s) 域名，不校验镜像是否可用。
- 软件源更换会执行 `apt-get update`，可能耗时；如果第三方源本身不可用也会导致本次切换回滚，需要先修复第三方源或手动处理。
- Docker 源管理只修改系统级 `/etc/docker/daemon.json` 的 `registry-mirrors`，不处理 rootless Docker、systemd drop-in 中的 `--registry-mirror` 或 containerd 配置；只接受 https 地址，不保证第三方镜像加速源可用。保存后需要重启 Docker，运行中的容器可能重启或中断；重启失败会自动恢复备份，但备份目录会保留在 `/etc/docker/rsm-backup-<时间戳>`。如果 Docker 由非 systemd 方式管理，重启可能失败并回滚。
- 主机指纹变化需要到 `servers.json` 删除对应 `fingerprint` 后重新信任（或删除服务器重新添加）。
