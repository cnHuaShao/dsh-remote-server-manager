window.__ModuleLoader__.load({
  id: 'dsh-remote-server-manager',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'remote-server-manager';
    const PANEL_ID = 'remote-servers';
    const API = '/remote-server-manager';
    const REMOTE_DATA_CACHE = new Map();

    const EN = {
  "panel": "Servers",
  "servers": "Servers",
  "addServer": "Add server",
  "editServer": "Edit server",
  "deleteServer": "Delete server",
  "noServers": "No servers yet",
  "noServersHint": "Add a Linux server to manage its files and Docker containers.",
  "emptySelect": "Select a server",
  "emptySelectHint": "Choose a server in the left column, or add a new one.",
  "name": "Name",
  "host": "Host",
  "port": "Port",
  "username": "Username",
  "authType": "Authentication",
  "password": "Password",
  "privateKey": "Private key",
  "passphrase": "Key passphrase",
  "passwordSaved": "A password is saved",
  "keySaved": "A private key is saved",
  "keepSecretHint": "Leave blank to keep the saved secret.",
  "clearSecret": "Remove the saved secret",
  "dockerCommand": "Docker command",
  "dockerCommandHint": "For example docker or sudo docker",
  "defaultPath": "Default directory",
  "description": "Notes",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "confirm": "Confirm",
  "close": "Close",
  "edit": "Edit",
  "test": "Test connection",
  "testing": "Connecting...",
  "connected": "Connected",
  "disconnected": "Not connected",
  "connectFailed": "Connection failed",
  "fingerprint": "Host key fingerprint",
  "fingerprintFirst": "Trusted on first connection",
  "overview": "Overview",
  "files": "Files",
  "containers": "Containers",
  "activity": "Activity",
  "refresh": "Refresh",
  "refreshing": "Refreshing...",
  "searchContainers": "Search name, image, project, ID",
  "allStates": "All states",
  "running": "Running",
  "stopped": "Stopped",
  "paused": "Paused",
  "other": "Other",
  "allProjects": "All projects",
  "standalone": "Standalone",
  "sort": "Sort",
  "sortName": "Name",
  "sortState": "State",
  "sortProject": "Project",
  "sortImage": "Image",
  "pageSize": "Per page",
  "total": "Total",
  "runningCount": "Running",
  "stoppedCount": "Stopped",
  "pausedCount": "Paused",
  "projects": "Projects",
  "container": "Container",
  "project": "Project",
  "image": "Image",
  "state": "State",
  "status": "Status",
  "ports": "Ports",
  "actions": "Actions",
  "stop": "Stop",
  "restart": "Restart",
  "start": "Start",
  "batchSelected": "{count} selected",
  "batchStop": "Stop selected",
  "batchRestart": "Restart selected",
  "clearSelection": "Clear",
  "containerStopTitle": "Stop container",
  "containerStopBody": "Stop {name}? The service will be unavailable until it is started again.",
  "containerRestartTitle": "Restart container",
  "containerRestartBody": "Restart {name}? Running processes inside it will be terminated.",
  "batchStopTitle": "Stop {count} containers",
  "batchStopBody": "Stop the selected containers?",
  "batchRestartTitle": "Restart {count} containers",
  "batchRestartBody": "Restart the selected containers?",
  "actionDone": "Done",
  "actionFailed": "Failed",
  "autoRefresh": "Auto refresh",
  "off": "Off",
  "seconds": "{count}s",
  "lastUpdated": "Updated {time}",
  "path": "Path",
  "go": "Go",
  "up": "Up",
  "home": "Home",
  "newFolder": "New folder",
  "upload": "Upload",
  "showHidden": "Show hidden",
  "filterFiles": "Filter files",
  "fileName": "Name",
  "fileSize": "Size",
  "modified": "Modified",
  "mode": "Mode",
  "open": "Open",
  "download": "Download",
  "rename": "Rename",
  "folder": "Folder",
  "file": "File",
  "symlink": "Link",
  "parentFolder": "Parent folder",
  "emptyFolder": "This folder is empty",
  "loading": "Loading...",
  "loadFailed": "Could not load",
  "retry": "Retry",
  "saveFile": "Save file",
  "saving": "Saving...",
  "unsavedChanges": "You have unsaved changes. Close without saving?",
  "binaryFile": "This looks like a binary file and cannot be edited as text.",
  "fileTooLarge": "The file is larger than the editable limit ({size}).",
  "editorLines": "{count} lines",
  "newFolderTitle": "New folder",
  "newFolderName": "Folder name",
  "renameTitle": "Rename",
  "renameHint": "Enter the new name",
  "deleteTitle": "Delete",
  "deleteFileBody": "Delete {name}?",
  "deleteFolderBody": "Delete the folder {name} and everything inside it? This cannot be undone.",
  "deleteRecursive": "Delete recursively",
  "uploading": "Uploading...",
  "uploadDone": "Uploaded {name}",
  "serverDeleted": "Server deleted",
  "serverSaved": "Server saved",
  "saved": "Saved",
  "copied": "Copied",
  "reload": "Reload",
  "searchServers": "Search servers",
  "copyPath": "Copy path",
  "hostInfo": "Host information",
  "dockerVersion": "Docker",
  "notInstalled": "Not installed",
  "os": "System",
  "uptime": "Uptime",
  "disk": "Disk",
  "memory": "Memory",
  "identity": "Identity",
  "recentActivity": "Recent activity",
  "noActivity": "No activity yet",
  "started": "Started",
  "testOk": "Connection succeeded",
  "connectionInfo": "Connection",
  "latency": "Latency",
  "defaultPathHint": "Leave blank to use the SSH user's home directory.",
  "requiredField": "This field is required",
  "invalidPort": "Port must be between 1 and 65535",
  "back": "Back",
  "server": "Server",
  "openServer": "Open",
  "containerDetail": "Details",
  "labels": "Labels",
  "mounts": "Mounts",
  "networks": "Networks",
  "environment": "Environment",
  "restartCount": "Restart count",
  "command": "Command",
  "created": "Created",
  "closeDetails": "Close details",
  "noContainers": "No containers found",
  "noContainersHint": "Try clearing the search or filters.",
  "page": "Page {page} / {pages}",
  "prev": "Previous",
  "next": "Next",
  "selectAllPage": "Select page",
  "errorGeneric": "Something went wrong",
  "dangerZone": "Danger zone",
  "serverDeleteBody": "Delete {name}? Its saved credentials will also be removed. Remote files and containers are not touched.",
  "reconnect": "Reconnect",
  "dockerUnavailable": "Docker is not available on this server",
  "dockerUnavailableHint": "Check that Docker is installed and the SSH user can run docker ps.",
  "images": "Images",
  "totalImages": "Images",
  "taggedImages": "Tagged",
  "danglingImages": "Dangling",
  "imageDiskSize": "Total image size",
  "searchImages": "Search repository, tag, ID",
  "imageFilter": "Image filter",
  "allImages": "All images",
  "noImages": "No images found",
  "noImagesHint": "Docker images are listed here separately from containers.",
  "repositoryTag": "Repository / tag",
  "imageId": "Image ID",
  "size": "Size",
  "digest": "Digest",
  "dangling": "Dangling",
  "danglingImage": "Untagged image",
  "tags": "tags",
  "sortSize": "Size",
  "sortCreated": "Created",
  "firewall": "Firewall",
  "programs": "Programs",
  "loadingFirewall": "Loading firewall status...",
  "loadingPrograms": "Detecting installed programs...",
  "firewallBackend": "Backend",
  "firewallStatus": "Status",
  "firewallZone": "Zone / policy",
  "firewallRules": "Rules",
  "openPort": "Open port",
  "protocol": "Protocol",
  "allowService": "Allow service",
  "service": "Service",
  "allow": "Allow",
  "remove": "Remove",
  "removeFirewallRule": "Remove firewall rule",
  "removeFirewallRuleHint": "Remove the rule \"{target}\"? This changes the remote firewall immediately.",
  "ruleNotRemovable": "This rule cannot be removed from the plugin.",
  "noFirewallRules": "No firewall rules",
  "noFirewallRulesHint": "The active firewall has no ports, services, or sources configured.",
  "ruleType": "Type",
  "ruleTarget": "Target",
  "ruleAction": "Action",
  "ruleSource": "Source",
  "sshProtected": "SSH-protected",
  "staged": "Configured, not active",
  "fwKind_port": "Port",
  "fwKind_service": "Service",
  "fwKind_source": "Source",
  "fwKind_rich": "Rich rule",
  "fwKind_ufw": "UFW rule",
  "fwKind_raw": "Raw rule",
  "active": "Active",
  "inactive": "Inactive",
  "firewallUpdated": "Firewall updated",
  "enable": "Enable",
  "enableFirewall": "Enable firewall",
  "enableFirewallHint": "This allows SSH port {port}/tcp first, then enables ufw. Existing services may be affected; make sure you have another way to access the server.",
  "invalidService": "Enter a valid service name",
  "programsChecked": "Checked",
  "programsInstalled": "Installed",
  "programsMissing": "Missing",
  "programsCategories": "Categories",
  "programsUpdates": "Upgrades",
  "actionable": "Needs action",
  "aptSources": "Software sources",
  "loadingAptSources": "Loading software sources...",
  "aptNotSupported": "This server does not use apt; software source management is unavailable.",
  "aptSudoUnavailable": "The SSH user needs root or passwordless sudo to update or switch apt sources.",
  "aptDistro": "Distribution",
  "aptCurrentOrigins": "Current source URLs",
  "aptNoSource": "No apt source files found",
  "aptChooseMirror": "Choose a mirror",
  "aptCustom": "Custom mirror",
  "aptCustomHint": "Only the scheme and host are used; repository paths are preserved. Must be http(s), without credentials.",
  "aptSourceHint": "Only Ubuntu/Debian repository URLs are rewritten. Third-party repositories such as Docker or Kubernetes are left unchanged. A backup is created before writing; if apt-get update fails, the backup is restored automatically.",
  "aptUpdateIndex": "Update package index",
  "aptSwitchAndUpdate": "Switch and update",
  "aptSwitchSource": "Switch software source",
  "aptSwitchConfirm": "Replace Ubuntu/Debian repository URLs with {mirror}, create a backup, then run apt-get update? If the update fails, the original sources are restored.",
  "aptSourceUpdated": "Package index updated",
  "aptSourceChanged": "Software sources switched",
  "aptBackup": "Backup",
  "aptOutput": "Command output",
  "dockerSources": "Docker source",
  "loadingDockerSources": "Loading Docker sources...",
  "dockerSourceConfig": "Daemon config",
  "dockerNoConfig": "file not created yet",
  "dockerActiveMirrors": "Active registry mirrors",
  "dockerMirrors": "Configured registry mirrors",
  "dockerNoMirrors": "None (pull directly from Docker Hub)",
  "dockerAddMirror": "Add a mirror",
  "dockerMirrorPlaceholder": "Enter an https:// registry mirror URL, then press Enter or Add.",
  "dockerPresetHint": "Common examples (availability may change)",
  "dockerSave": "Save and restart Docker",
  "dockerClearMirrors": "Clear mirrors",
  "dockerSaveConfirm": "Write {count} registry mirror(s) to daemon.json and restart Docker? Running containers may be restarted or interrupted.",
  "dockerClearConfirm": "Remove all registry mirrors and pull directly from Docker Hub? Docker will be restarted, which may affect running containers.",
  "dockerSourceSaved": "Docker sources saved",
  "dockerSourceInvalid": "daemon.json cannot be edited automatically",
  "dockerRestartWarning": "Applying a registry mirror requires restarting the Docker daemon. Containers may restart or be interrupted. A backup is created and restored automatically if the restart fails.",
  "dockerSourceHint": "Only registry-mirrors in /etc/docker/daemon.json is changed; other daemon settings are preserved. Private registries and image names are unchanged.",
  "dockerBackup": "Docker backup",
  "dockerMirror_daocloud": "DaoCloud",
  "dockerMirror_1panel": "1Panel",
  "dockerMirror_ustc": "USTC",
  "add": "Add",
  "aptMirror_official": "Official",
  "aptMirror_aliyun": "Aliyun",
  "aptMirror_tuna": "Tsinghua TUNA",
  "aptMirror_ustc": "USTC",
  "aptMirror_huawei": "Huawei Cloud",
  "aptMirror_netease": "NetEase",
  "latestVersion": "Repo latest",
  "install": "Install",
  "upgrade": "Upgrade",
  "installProgram": "Install program",
  "upgradeProgram": "Upgrade program",
  "programInstallHint": "Install {name} {version} from the apt package \"{package}\"? This needs root or passwordless sudo and may change system packages.",
  "programUpgradeHint": "Upgrade {name} from {installed} to {version} using apt package \"{package}\"? This may restart related services.",
  "programUpdated": "Program updated",
  "packageManager": "Package manager",
  "packageManagerUnsupported": "One-click install/upgrade is available only on apt-based systems (Debian/Ubuntu). Other systems remain read-only.",
  "packageSudoHint": "The SSH user needs root or passwordless sudo for one-click package operations.",
  "noPackageMapping": "Manual install",
  "upToDate": "Repository current",
  "repoOlder": "Repository older",
  "manualUpgrade": "External install, manual upgrade",
  "searchPrograms": "Search program, command, version",
  "allPrograms": "All programs",
  "allCategories": "All categories",
  "program": "Program",
  "category": "Category",
  "version": "Version",
  "installed": "Installed",
  "installedVersionUnknown": "Installed (version unknown)",
  "noPrograms": "No matching programs",
  "noProgramsHint": "Try another keyword or filter.",
  "cat_runtime": "Runtime",
  "cat_build": "Build",
  "cat_vcs": "Version control",
  "cat_container": "Container",
  "cat_orchestration": "Orchestration",
  "cat_devops": "DevOps",
  "cat_web": "Web server",
  "cat_database": "Database",
  "cat_tool": "Tool",
  "bytes": "B",
  "kb": "KB",
  "mb": "MB",
  "gb": "GB"
};
    const ZH = {
  "panel": "服务器",
  "servers": "服务器",
  "addServer": "添加服务器",
  "editServer": "编辑服务器",
  "deleteServer": "删除服务器",
  "noServers": "还没有服务器",
  "noServersHint": "添加一台 Linux 服务器，即可管理文件与 Docker 容器。",
  "emptySelect": "选择一台服务器",
  "emptySelectHint": "从左侧选择服务器，或添加一台新的服务器。",
  "name": "名称",
  "host": "主机",
  "port": "端口",
  "username": "用户名",
  "authType": "认证方式",
  "password": "密码",
  "privateKey": "私钥",
  "passphrase": "私钥口令",
  "passwordSaved": "已保存密码",
  "keySaved": "已保存私钥",
  "keepSecretHint": "留空表示保留已保存的密钥。",
  "clearSecret": "清除已保存的密钥",
  "dockerCommand": "Docker 命令",
  "dockerCommandHint": "例如 docker 或 sudo docker",
  "defaultPath": "默认目录",
  "description": "备注",
  "save": "保存",
  "cancel": "取消",
  "delete": "删除",
  "confirm": "确认",
  "close": "关闭",
  "edit": "编辑",
  "test": "测试连接",
  "testing": "连接中...",
  "connected": "已连接",
  "disconnected": "未连接",
  "connectFailed": "连接失败",
  "fingerprint": "主机密钥指纹",
  "fingerprintFirst": "首次连接时已信任",
  "overview": "概览",
  "files": "文件",
  "containers": "容器",
  "activity": "操作记录",
  "refresh": "刷新",
  "refreshing": "刷新中...",
  "searchContainers": "搜索名称、镜像、项目、ID",
  "allStates": "全部状态",
  "running": "运行中",
  "stopped": "已停止",
  "paused": "已暂停",
  "other": "其他",
  "allProjects": "全部项目",
  "standalone": "独立容器",
  "sort": "排序",
  "sortName": "名称",
  "sortState": "状态",
  "sortProject": "项目",
  "sortImage": "镜像",
  "pageSize": "每页",
  "total": "总数",
  "runningCount": "运行中",
  "stoppedCount": "已停止",
  "pausedCount": "已暂停",
  "projects": "项目",
  "container": "容器",
  "project": "项目",
  "image": "镜像",
  "state": "状态",
  "status": "状态",
  "ports": "端口",
  "actions": "操作",
  "stop": "停止",
  "restart": "重启",
  "start": "启动",
  "batchSelected": "已选 {count} 个",
  "batchStop": "停止所选",
  "batchRestart": "重启所选",
  "clearSelection": "清除",
  "containerStopTitle": "停止容器",
  "containerStopBody": "确定停止 {name} 吗？停止后服务将不可用，直到重新启动。",
  "containerRestartTitle": "重启容器",
  "containerRestartBody": "确定重启 {name} 吗？容器内正在运行的进程会被终止。",
  "batchStopTitle": "停止 {count} 个容器",
  "batchStopBody": "确定停止所选容器吗？",
  "batchRestartTitle": "重启 {count} 个容器",
  "batchRestartBody": "确定重启所选容器吗？",
  "actionDone": "完成",
  "actionFailed": "失败",
  "autoRefresh": "自动刷新",
  "off": "关闭",
  "seconds": "{count} 秒",
  "lastUpdated": "{time} 更新",
  "path": "路径",
  "go": "前往",
  "up": "上一级",
  "home": "主目录",
  "newFolder": "新建目录",
  "upload": "上传",
  "showHidden": "显示隐藏文件",
  "filterFiles": "筛选文件",
  "fileName": "名称",
  "fileSize": "大小",
  "modified": "修改时间",
  "mode": "权限",
  "open": "打开",
  "download": "下载",
  "rename": "重命名",
  "folder": "目录",
  "file": "文件",
  "symlink": "链接",
  "parentFolder": "上级目录",
  "emptyFolder": "此目录为空",
  "loading": "加载中...",
  "loadFailed": "加载失败",
  "retry": "重试",
  "saveFile": "保存文件",
  "saving": "保存中...",
  "unsavedChanges": "有未保存的修改，确定关闭吗？",
  "binaryFile": "这看起来是二进制文件，无法以文本方式编辑。",
  "fileTooLarge": "文件超过可编辑大小限制（{size}）。",
  "editorLines": "{count} 行",
  "newFolderTitle": "新建目录",
  "newFolderName": "目录名称",
  "renameTitle": "重命名",
  "renameHint": "输入新的名称",
  "deleteTitle": "删除",
  "deleteFileBody": "确定删除 {name} 吗？",
  "deleteFolderBody": "确定删除目录 {name} 及其中的全部内容吗？此操作无法撤销。",
  "deleteRecursive": "递归删除",
  "uploading": "上传中...",
  "uploadDone": "已上传 {name}",
  "serverDeleted": "服务器已删除",
  "serverSaved": "服务器已保存",
  "saved": "已保存",
  "copied": "已复制",
  "reload": "重载",
  "searchServers": "搜索服务器",
  "copyPath": "复制路径",
  "hostInfo": "主机信息",
  "dockerVersion": "Docker",
  "notInstalled": "未安装",
  "os": "系统",
  "uptime": "运行时间",
  "disk": "磁盘",
  "memory": "内存",
  "identity": "身份",
  "recentActivity": "最近操作",
  "noActivity": "暂无操作记录",
  "started": "已启动",
  "testOk": "连接成功",
  "connectionInfo": "连接",
  "latency": "延迟",
  "defaultPathHint": "留空则使用 SSH 用户的主目录。",
  "requiredField": "此字段必填",
  "invalidPort": "端口必须在 1 到 65535 之间",
  "back": "返回",
  "server": "服务器",
  "openServer": "打开",
  "containerDetail": "详情",
  "labels": "标签",
  "mounts": "挂载",
  "networks": "网络",
  "environment": "环境变量",
  "restartCount": "重启次数",
  "command": "命令",
  "created": "创建时间",
  "closeDetails": "关闭详情",
  "noContainers": "没有找到容器",
  "noContainersHint": "试试清除搜索或筛选条件。",
  "page": "第 {page} / {pages} 页",
  "prev": "上一页",
  "next": "下一页",
  "selectAllPage": "本页全选",
  "errorGeneric": "操作失败",
  "dangerZone": "危险操作",
  "serverDeleteBody": "确定删除 {name} 吗？已保存的凭据也会被删除。远端文件与容器不会受到影响。",
  "reconnect": "重新连接",
  "dockerUnavailable": "此服务器上 Docker 不可用",
  "dockerUnavailableHint": "请检查 Docker 是否已安装，以及当前 SSH 用户能否执行 docker ps。",
  "images": "镜像",
  "totalImages": "镜像总数",
  "taggedImages": "有标签",
  "danglingImages": "悬空镜像",
  "imageDiskSize": "镜像大小合计",
  "searchImages": "搜索仓库、标签、ID",
  "imageFilter": "镜像筛选",
  "allImages": "全部镜像",
  "noImages": "没有找到镜像",
  "noImagesHint": "Docker 镜像单独显示在这里，不再与容器混在同一个列表。",
  "repositoryTag": "仓库 / 标签",
  "imageId": "镜像 ID",
  "size": "大小",
  "digest": "摘要",
  "dangling": "悬空",
  "danglingImage": "无标签镜像",
  "tags": "个标签",
  "sortSize": "大小",
  "sortCreated": "创建时间",
  "firewall": "防火墙",
  "programs": "安装探测",
  "loadingFirewall": "正在读取防火墙状态…",
  "loadingPrograms": "正在探测已安装程序…",
  "firewallBackend": "防火墙类型",
  "firewallStatus": "运行状态",
  "firewallZone": "区域 / 策略",
  "firewallRules": "规则数",
  "openPort": "开放端口",
  "protocol": "协议",
  "allowService": "放行服务",
  "service": "服务",
  "allow": "放行",
  "remove": "删除",
  "removeFirewallRule": "删除防火墙规则",
  "removeFirewallRuleHint": "确定删除规则“{target}”吗？这会立即修改远程防火墙。",
  "ruleNotRemovable": "该规则无法从插件中删除。",
  "noFirewallRules": "没有防火墙规则",
  "noFirewallRulesHint": "当前防火墙没有配置端口、服务或来源规则。",
  "ruleType": "类型",
  "ruleTarget": "规则",
  "ruleAction": "动作",
  "ruleSource": "来源",
  "sshProtected": "SSH 保护，禁止删除",
  "staged": "已配置，未生效",
  "fwKind_port": "端口",
  "fwKind_service": "服务",
  "fwKind_source": "来源",
  "fwKind_rich": "富规则",
  "fwKind_ufw": "UFW 规则",
  "fwKind_raw": "原始规则",
  "active": "已启用",
  "inactive": "未启用",
  "firewallUpdated": "防火墙已更新",
  "enable": "启用",
  "enableFirewall": "启用防火墙",
  "enableFirewallHint": "将先放行 SSH 端口 {port}/tcp，再启用 ufw。启用后可能影响现有服务，请确保还有其他方式可以登录服务器。",
  "invalidService": "请输入有效的服务名",
  "programsChecked": "探测项",
  "programsInstalled": "已安装",
  "programsMissing": "未安装",
  "programsCategories": "分类数",
  "programsUpdates": "可升级",
  "actionable": "可安装/可升级",
  "aptSources": "软件源",
  "loadingAptSources": "正在读取软件源…",
  "aptNotSupported": "当前服务器不使用 apt，无法管理软件源。",
  "aptSudoUnavailable": "当前 SSH 用户需要 root 或免密 sudo 才能更新或更换软件源。",
  "aptDistro": "发行版",
  "aptCurrentOrigins": "当前源地址",
  "aptNoSource": "未找到 apt 源文件",
  "aptChooseMirror": "选择镜像源",
  "aptCustom": "自定义镜像",
  "aptCustomHint": "只使用协议和域名，保留仓库路径；必须是 http(s)，不能包含账号密码。",
  "aptSourceHint": "只会替换 Ubuntu/Debian 官方仓库地址，Docker、Kubernetes 等第三方源保持不变。写入前会创建备份；如果 apt-get update 失败，会自动恢复原源。",
  "aptUpdateIndex": "更新软件源索引",
  "aptSwitchAndUpdate": "更换并更新",
  "aptSwitchSource": "更换软件源",
  "aptSwitchConfirm": "确定把 Ubuntu/Debian 仓库地址替换为 {mirror}，创建备份后执行 apt-get update 吗？如果更新失败会自动恢复原源。",
  "aptSourceUpdated": "软件源索引已更新",
  "aptSourceChanged": "软件源已切换",
  "aptBackup": "备份目录",
  "aptOutput": "命令输出",
  "dockerSources": "Docker 源",
  "loadingDockerSources": "正在读取 Docker 源…",
  "dockerSourceConfig": "Daemon 配置",
  "dockerNoConfig": "尚未创建该文件",
  "dockerActiveMirrors": "当前生效的镜像加速源",
  "dockerMirrors": "已配置的镜像加速源",
  "dockerNoMirrors": "未配置（直接连接 Docker Hub）",
  "dockerAddMirror": "添加镜像源",
  "dockerMirrorPlaceholder": "输入 https:// 开头的镜像加速地址，回车或点添加。",
  "dockerPresetHint": "常用示例（可用性可能变化）",
  "dockerSave": "保存并重启 Docker",
  "dockerClearMirrors": "清空加速源",
  "dockerSaveConfirm": "确定把 {count} 个镜像加速源写入 daemon.json 并重启 Docker 吗？运行中的容器可能被重启或中断。",
  "dockerClearConfirm": "确定清空所有镜像加速源并直接连接 Docker Hub 吗？Docker 会被重启，可能影响运行中的容器。",
  "dockerSourceSaved": "Docker 源已保存",
  "dockerSourceInvalid": "无法自动修改 daemon.json",
  "dockerRestartWarning": "应用镜像加速源需要重启 Docker daemon，容器可能被重启或中断。系统会先备份配置，重启失败会自动恢复。",
  "dockerSourceHint": "只修改 /etc/docker/daemon.json 中的 registry-mirrors，保留其他 daemon 配置；不会改变私有仓库地址或镜像名称。",
  "dockerBackup": "Docker 配置备份",
  "dockerMirror_daocloud": "DaoCloud",
  "dockerMirror_1panel": "1Panel",
  "dockerMirror_ustc": "中科大",
  "add": "添加",
  "aptMirror_official": "官方源",
  "aptMirror_aliyun": "阿里云",
  "aptMirror_tuna": "清华 TUNA",
  "aptMirror_ustc": "中科大",
  "aptMirror_huawei": "华为云",
  "aptMirror_netease": "网易",
  "latestVersion": "仓库最新",
  "install": "安装",
  "upgrade": "升级",
  "installProgram": "安装程序",
  "upgradeProgram": "升级程序",
  "programInstallHint": "确定通过 apt 包“{package}”安装 {name} {version} 吗？需要 root 或免密 sudo，可能会改动系统软件包。",
  "programUpgradeHint": "确定通过 apt 包“{package}”把 {name} 从 {installed} 升级到 {version} 吗？升级过程可能会重启相关服务。",
  "programUpdated": "程序已更新",
  "packageManager": "包管理器",
  "packageManagerUnsupported": "一键安装/升级目前只支持 apt 系统（Debian/Ubuntu），其他系统保持只读。",
  "packageSudoHint": "当前 SSH 用户需要 root 或免密 sudo 才能执行一键安装/升级。",
  "noPackageMapping": "需手动安装",
  "upToDate": "仓库已是当前版本",
  "repoOlder": "仓库版本较旧",
  "manualUpgrade": "外部安装，需手动升级",
  "searchPrograms": "搜索程序、命令、版本",
  "allPrograms": "全部程序",
  "allCategories": "全部分类",
  "program": "程序",
  "category": "分类",
  "version": "版本",
  "installed": "已安装",
  "installedVersionUnknown": "已安装（版本未知）",
  "noPrograms": "没有匹配的程序",
  "noProgramsHint": "换一个关键词或筛选条件试试。",
  "cat_runtime": "运行时",
  "cat_build": "构建工具",
  "cat_vcs": "版本控制",
  "cat_container": "容器",
  "cat_orchestration": "编排",
  "cat_devops": "DevOps",
  "cat_web": "Web 服务",
  "cat_database": "数据库",
  "cat_tool": "工具",
  "bytes": "B",
  "kb": "KB",
  "mb": "MB",
  "gb": "GB"
};

    class ApiError extends Error {
      constructor(code, message, status, details) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.details = details;
      }
    }

    async function api(path, options = {}) {
      const method = options.method || 'GET';
      const hasBody = options.body !== undefined;
      let response;
      try {
        response = await fetch(API + path, {
          method,
          credentials: 'same-origin',
          cache: 'no-store',
          headers: hasBody ? { 'content-type': 'application/json' } : undefined,
          body: hasBody ? JSON.stringify(options.body) : undefined,
          signal: options.signal,
        });
      } catch (error) {
        if (error?.name === 'AbortError') throw error;
        throw new ApiError('network_error', '无法连接 Harness 后端，请检查页面连接。', 0);
      }
      const text = await response.text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        throw new ApiError('invalid_response', `后端返回了无法解析的响应（HTTP ${response.status}）。`, response.status);
      }
      if (!response.ok || payload?.ok === false) {
        const error = payload?.error || {};
        throw new ApiError(
          error.code || `http_${response.status}`,
          error.message || `请求失败（HTTP ${response.status}）`,
          response.status,
          error.details,
        );
      }
      return payload.value;
    }

    function serverPath(serverId, suffix = '') {
      return `/servers/${encodeURIComponent(serverId)}${suffix}`;
    }

    function fileQuery(path) {
      return `?path=${encodeURIComponent(path || '')}`;
    }

    function downloadUrl(serverId, path) {
      return `${API}${serverPath(serverId, '/download')}${fileQuery(path)}`;
    }

    function errorText(error) {
      if (error instanceof ApiError) return error.message;
      return error?.message || String(error || '未知错误');
    }

    function formatBytes(value) {
      const bytes = Number(value) || 0;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    function formatTime(ms) {
      if (!ms) return '—';
      try {
        return new Date(ms).toLocaleString();
      } catch {
        return String(ms);
      }
    }

    function shortTime(ms) {
      if (!ms) return '—';
      const diff = Date.now() - Number(ms);
      if (diff < 60_000) return '刚刚';
      if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
      if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
      return formatTime(ms);
    }

    function plural(t, key, count, vars = {}) {
      return t(key, { count, ...vars });
    }

    function useLocale(locale) {
      const [snapshot, setSnapshot] = React.useState(() => locale.getSnapshot());
      React.useEffect(() => {
        setSnapshot(locale.getSnapshot());
        return locale.subscribe(() => setSnapshot(locale.getSnapshot()));
      }, [locale]);
      const translate = React.useMemo(() => locale.bind(NS), [locale, snapshot?.revision]);
      return React.useCallback(
        (key, vars) => {
          let text = translate(key);
          if (typeof text !== 'string') text = String(key);
          if (vars) {
            for (const [name, value] of Object.entries(vars)) {
              text = text.split(`{${name}}`).join(String(value));
            }
          }
          return text;
        },
        [translate],
      );
    }

    function useRemote(load, deps, options = {}) {
      const cacheKey = options.cacheKey || '';
      const ttlMs = options.ttlMs || 0;
      const [nonce, setNonce] = React.useState(0);
      const [state, setState] = React.useState(() => {
        const hit = cacheKey ? REMOTE_DATA_CACHE.get(cacheKey) : null;
        return hit ? { loading: false, value: hit.value, error: null } : { loading: true, value: null, error: null };
      });
      React.useEffect(() => {
        let alive = true;
        const controller = new AbortController();
        const hit = cacheKey ? REMOTE_DATA_CACHE.get(cacheKey) : null;
        if (hit && Date.now() - hit.at < ttlMs) {
          setState({ loading: false, value: hit.value, error: null });
          return () => {
            alive = false;
            controller.abort();
          };
        }
        setState((current) => ({ ...current, loading: true, error: null }));
        Promise.resolve()
          .then(() => load(controller.signal))
          .then((value) => {
            if (!alive) return;
            if (cacheKey) REMOTE_DATA_CACHE.set(cacheKey, { at: Date.now(), value });
            setState({ loading: false, value, error: null });
          })
          .catch((error) => {
            if (!alive || error?.name === 'AbortError') return;
            setState({ loading: false, value: null, error });
          });
        return () => {
          alive = false;
          controller.abort();
        };
      }, [...deps, nonce]);
      return [
        state,
        () => {
          if (cacheKey) REMOTE_DATA_CACHE.delete(cacheKey);
          setNonce((value) => value + 1);
        },
        setState,
      ];
    }

    function useToast() {
      const [toast, setToast] = React.useState(null);
      const timer = React.useRef();
      React.useEffect(() => () => clearTimeout(timer.current), []);
      const notify = React.useCallback((message, kind = 'success') => {
        clearTimeout(timer.current);
        setToast({ message, kind, id: Date.now() });
        timer.current = setTimeout(() => setToast(null), kind === 'error' ? 6500 : 3800);
      }, []);
      return [toast, notify];
    }

    const ICON_PATHS = {
      plus: ['M12 5v14', 'M5 12h14'],
      server: [
        'M4 4h16v6H4z',
        'M4 14h16v6H4z',
        'M7 7h.01',
        'M7 17h.01',
        'M11 7h6',
        'M11 17h6',
      ],
      refresh: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'],
      folder: ['M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
      file: ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M14 3v6h6'],
      link: ['M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2', 'M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2'],
      edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
      trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v5', 'M14 11v5'],
      play: ['M8 5v14l11-7z'],
      stop: ['M6 6h12v12H6z'],
      restart: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v6h6'],
      upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],
      download: ['M12 4v12', 'M7 11l5 5 5-5', 'M4 20h16'],
      upgrade: ['M12 20V4', 'M7 9l5-5 5 5'],
      close: ['M6 6l12 12', 'M18 6L6 18'],
      check: ['M20 6L9 17l-5-5'],
      warning: ['M12 3L2 21h20L12 3z', 'M12 9v5', 'M12 18h.01'],
      search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.3-4.3'],
      chevronRight: ['M9 18l6-6-6-6'],
      chevronLeft: ['M15 18l-6-6 6-6'],
      chevronDown: ['M6 9l6 6 6-6'],
      terminal: ['M4 5h16v14H4z', 'M8 9l3 3-3 3', 'M13 15h4'],
      docker: ['M4 8h3v3H4z', 'M9 8h3v3H9z', 'M14 8h3v3h-3z', 'M9 4h3v3H9z', 'M3 13c0 4 3 7 8 7 5 0 8-3 8-7z'],
      layers: ['M12 3l9 5-9 5-9-5z', 'M3 12l9 5 9-5', 'M3 16l9 5 9-5'],
      shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M9 12l2 2 4-4'],
      lock: ['M5 11h14v10H5z', 'M8 11V7a4 4 0 0 1 8 0v4'],
      package: ['M21 8l-9-5-9 5 9 5z', 'M3 8v8l9 5 9-5V8', 'M12 13v8'],
      info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 11v6', 'M12 7h.01'],
      copy: ['M9 9h11v11H9z', 'M5 15H4V4h11v1'],
      logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
      plug: ['M9 2v6', 'M15 2v6', 'M7 8h10v3a5 5 0 0 1-10 0z', 'M12 16v6'],
      key: ['M14 7a4 4 0 1 1-3.2 6.4L4 20H2v-3l7.6-6.8A4 4 0 0 1 14 7z', 'M16 6h.01'],
      hidden: ['M3 3l18 18', 'M10.6 10.6a2 2 0 0 0 2.8 2.8', 'M9.9 5.2A10.7 10.7 0 0 1 12 5c6 0 9 7 9 7a16.5 16.5 0 0 1-2.2 3.2', 'M6.6 6.6C4.3 8.2 3 12 3 12s3 7 9 7a10.7 10.7 0 0 0 5.4-1.4'],
      menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
    };

    function Icon({ name, size = 16, className = '' }) {
      const paths = ICON_PATHS[name] || ICON_PATHS.info;
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          className: `rsm-icon ${className}`,
          'aria-hidden': 'true',
        },
        paths.map((d, index) => h('path', { key: index, d })),
      );
    }

    const CSS = `
.rsm-root {
  display: flex;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 1.45;
}
.rsm-root *, .rsm-root *::before, .rsm-root *::after { box-sizing: border-box; }
.rsm-root button, .rsm-root input, .rsm-root textarea, .rsm-root select { font: inherit; color: inherit; }
.rsm-icon { display: block; flex: none; }
.rsm-rail {
  width: 264px;
  flex: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.rsm-rail-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 14px 10px;
}
.rsm-brand { display: flex; align-items: center; gap: 9px; min-width: 0; flex: 1; }
.rsm-brand-mark {
  width: 28px; height: 28px; border-radius: 8px; flex: none;
  display: grid; place-items: center;
  background: linear-gradient(135deg, var(--dsw-alias-brand-primary), color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, #0b3ea8));
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.22);
}
.rsm-brand-text { min-width: 0; }
.rsm-brand-title { font-size: 13px; font-weight: 650; letter-spacing: .01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rsm-brand-sub { font-size: 11px; color: var(--dsw-alias-label-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rsm-rail-tools { padding: 0 12px 10px; display: flex; gap: 8px; }
.rsm-rail-search { padding: 0 12px 8px; }
.rsm-rail-search input { width: 100%; }
.rsm-server-list { flex: 1; min-height: 0; overflow: auto; padding: 2px 8px 12px; }
.rsm-rail-section { padding: 8px 8px 4px; font-size: 11px; font-weight: 600; color: var(--dsw-alias-label-secondary); text-transform: uppercase; letter-spacing: .06em; }
.rsm-server-item {
  width: 100%; text-align: left; border: 1px solid transparent; background: transparent;
  border-radius: 9px; padding: 9px 9px; display: flex; gap: 9px; align-items: center;
  cursor: pointer; color: inherit; margin-bottom: 2px;
}
.rsm-server-item:hover { background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 78%, transparent); }
.rsm-server-item.active { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, var(--dsw-alias-bg-layer-1)); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 36%, transparent); }
.rsm-server-avatar {
  width: 30px; height: 30px; border-radius: 8px; flex: none; display: grid; place-items: center;
  color: var(--dsw-alias-brand-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent);
}
.rsm-server-main { min-width: 0; flex: 1; }
.rsm-server-name { display: flex; gap: 6px; align-items: center; font-weight: 600; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rsm-server-host { font-size: 11px; color: var(--dsw-alias-label-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.rsm-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; background: var(--dsw-alias-state-idle-primary); opacity: .55; }
.rsm-dot.online { background: var(--dsw-alias-state-success-primary); opacity: 1; box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary) 15%, transparent); }
.rsm-dot.running { background: var(--dsw-alias-state-success-primary); }
.rsm-dot.paused { background: var(--dsw-alias-state-warn-primary); }
.rsm-dot.stopped { background: var(--dsw-alias-state-idle-primary); }
.rsm-dot.error { background: var(--dsw-alias-state-error-primary); }
.rsm-rail-foot { border-top: 1px solid var(--dsw-alias-border-l1); padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--dsw-alias-label-secondary); font-size: 11px; }
.rsm-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.rsm-main-head { flex: none; padding: 12px 18px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 62%, var(--dsw-alias-bg-base)); }
.rsm-title-row { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
.rsm-title-block { min-width: 0; flex: 1; }
.rsm-title { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 680; letter-spacing: -.01em; }
.rsm-subtitle { margin-top: 3px; color: var(--dsw-alias-label-secondary); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rsm-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.rsm-tabs { display: flex; gap: 2px; margin-top: 12px; overflow-x: auto; scrollbar-width: none; }
.rsm-tabs::-webkit-scrollbar { display: none; }
.rsm-tab {
  border: 0; background: transparent; padding: 8px 12px; border-bottom: 2px solid transparent;
  color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 12.5px; font-weight: 550;
  display: inline-flex; align-items: center; gap: 6px;
}
.rsm-tab:hover { color: var(--dsw-alias-label-primary); }
.rsm-tab.active { color: var(--dsw-alias-label-primary); border-bottom-color: var(--dsw-alias-brand-primary); }
.rsm-tab-count { font-size: 10.5px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2); border-radius: 999px; padding: 1px 6px; }
.rsm-content { flex: 1; min-height: 0; overflow: auto; padding: 16px 18px 20px; }
.rsm-content.flush { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
.rsm-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 30px; padding: 5px 10px; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary);
  cursor: pointer; font-size: 12px; font-weight: 550; white-space: nowrap;
}
.rsm-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.rsm-btn:disabled { opacity: .5; cursor: not-allowed; }
.rsm-btn.primary { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); color: #fff; }
.rsm-btn.primary:hover:not(:disabled) { filter: brightness(1.06); background: var(--dsw-alias-brand-primary); }
.rsm-btn.danger { color: var(--dsw-alias-state-error-primary); }
.rsm-btn.danger-solid { background: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-state-error-primary); color: #fff; }
.rsm-btn.ghost { background: transparent; border-color: transparent; color: var(--dsw-alias-label-secondary); }
.rsm-btn.ghost:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.rsm-btn.small { min-height: 26px; padding: 3px 8px; font-size: 11.5px; border-radius: 6px; }
.rsm-btn.icon-only { width: 30px; min-width: 30px; padding: 0; }
.rsm-btn.icon-only.small { width: 26px; min-width: 26px; }
.rsm-input, .rsm-select, .rsm-textarea {
  width: 100%; min-height: 30px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 7px;
  background: var(--dsw-alias-bg-base); padding: 5px 8px; outline: none;
}
.rsm-input:focus, .rsm-select:focus, .rsm-textarea:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }
.rsm-textarea { resize: vertical; line-height: 1.5; }
.rsm-label { display: block; font-size: 11.5px; font-weight: 600; color: var(--dsw-alias-label-secondary); margin-bottom: 5px; }
.rsm-field { margin-bottom: 12px; }
.rsm-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.rsm-hint { margin-top: 4px; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.rsm-error-text { color: var(--dsw-alias-state-error-primary); font-size: 12px; margin-top: 8px; white-space: pre-wrap; }
.rsm-badge {
  display: inline-flex; align-items: center; gap: 5px; padding: 2px 7px; border-radius: 999px;
  font-size: 10.5px; font-weight: 650; border: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-1);
}
.rsm-badge.success { color: var(--dsw-alias-state-success-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 35%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 9%, transparent); }
.rsm-badge.warn { color: var(--dsw-alias-state-warn-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 35%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 10%, transparent); }
.rsm-badge.error { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent); }
.rsm-badge.muted { color: var(--dsw-alias-label-secondary); }
.rsm-toolbar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 14px; border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1); flex: none;
}
.rsm-toolbar .rsm-input { width: auto; }
.rsm-search { position: relative; min-width: 190px; flex: 1; max-width: 360px; }
.rsm-search .rsm-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: var(--dsw-alias-label-secondary); pointer-events: none; }
.rsm-search .rsm-input { padding-left: 30px; width: 100%; }
.rsm-spacer { flex: 1; }
.rsm-summary { display: flex; gap: 8px; flex-wrap: wrap; padding: 12px 14px 0; flex: none; }
.rsm-stat {
  min-width: 92px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 9px;
  padding: 8px 10px; background: var(--dsw-alias-bg-layer-1);
}
.rsm-stat-label { font-size: 10.5px; color: var(--dsw-alias-label-secondary); }
.rsm-stat-value { font-size: 18px; font-weight: 700; line-height: 1.2; margin-top: 1px; }
.rsm-stat-value.success { color: var(--dsw-alias-state-success-primary); }
.rsm-stat-value.warn { color: var(--dsw-alias-state-warn-primary); }
.rsm-table-wrap { flex: 1; min-height: 0; overflow: auto; padding: 10px 14px 0; }
.rsm-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12px; }
.rsm-table th {
  position: sticky; top: 0; z-index: 1; text-align: left; padding: 7px 8px;
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-secondary);
  font-size: 10.5px; font-weight: 650; letter-spacing: .03em; text-transform: uppercase;
  border-bottom: 1px solid var(--dsw-alias-border-l1); white-space: nowrap;
}
.rsm-table td { padding: 7px 8px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-border-l1) 62%, transparent); vertical-align: middle; }
.rsm-table tbody tr:hover td { background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 58%, transparent); }
.rsm-table tbody tr.selected td { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }
.rsm-table .name-cell { font-weight: 600; max-width: 280px; }
.rsm-table .name-cell .sub { font-weight: 400; color: var(--dsw-alias-label-secondary); font-size: 10.5px; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rsm-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; }
.rsm-muted { color: var(--dsw-alias-label-secondary); }
.rsm-ellipsis { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rsm-row-actions { display: flex; gap: 4px; justify-content: flex-end; }
.rsm-check { width: 14px; height: 14px; accent-color: var(--dsw-alias-brand-primary); cursor: pointer; }
.rsm-footer {
  flex: none; display: flex; align-items: center; gap: 8px; padding: 9px 14px;
  border-top: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
}
.rsm-pager { display: flex; align-items: center; gap: 4px; }
.rsm-page-btn { min-width: 26px; height: 26px; padding: 0 7px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base); cursor: pointer; font-size: 11.5px; }
.rsm-page-btn.active { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); color: #fff; }
.rsm-page-btn:disabled { opacity: .45; cursor: not-allowed; }
.rsm-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px; color: var(--dsw-alias-label-secondary); gap: 8px; }
.rsm-empty-icon { width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); margin-bottom: 4px; }
.rsm-empty-title { font-size: 14px; font-weight: 650; color: var(--dsw-alias-label-primary); }
.rsm-empty-body { max-width: 420px; font-size: 12px; }
.rsm-loading { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 44px; color: var(--dsw-alias-label-secondary); }
.rsm-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, transparent); border-top-color: var(--dsw-alias-brand-primary); animation: rsm-spin .8s linear infinite; }
@keyframes rsm-spin { to { transform: rotate(360deg); } }
.rsm-alert { border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); color: var(--dsw-alias-label-primary); border-radius: 9px; padding: 10px 12px; margin: 10px 14px; display: flex; gap: 9px; align-items: flex-start; }
.rsm-alert.warn { border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 35%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 9%, transparent); }
.rsm-alert .rsm-icon { color: var(--dsw-alias-state-error-primary); margin-top: 1px; }
.rsm-alert.warn .rsm-icon { color: var(--dsw-alias-state-warn-primary); }
.rsm-breadcrumb { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; min-width: 0; }
.rsm-crumb { border: 0; background: transparent; padding: 3px 5px; border-radius: 5px; cursor: pointer; color: var(--dsw-alias-label-secondary); font-size: 12px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rsm-crumb:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.rsm-crumb.current { color: var(--dsw-alias-label-primary); font-weight: 600; }
.rsm-pathbar { display: flex; gap: 6px; align-items: center; padding: 8px 14px; border-bottom: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base); flex: none; }
.rsm-pathbar .rsm-input { flex: 1; min-width: 160px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11.5px; }
.rsm-file-icon { color: var(--dsw-alias-brand-primary); }
.rsm-file-icon.dir { color: #d9a514; }
.rsm-file-icon.symlink { color: var(--dsw-alias-label-secondary); }
.rsm-file-name { display: flex; align-items: center; gap: 8px; min-width: 0; cursor: pointer; }
.rsm-file-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rsm-grid-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; }
.rsm-card { border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); padding: 12px 14px; min-width: 0; }
.rsm-card-title { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 650; text-transform: uppercase; letter-spacing: .05em; color: var(--dsw-alias-label-secondary); margin-bottom: 8px; }
.rsm-card pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; line-height: 1.55; color: var(--dsw-alias-label-primary); max-height: 260px; overflow: auto; }
.rsm-kv { display: grid; grid-template-columns: 118px 1fr; gap: 5px 10px; font-size: 12px; }
.rsm-kv dt { color: var(--dsw-alias-label-secondary); }
.rsm-kv dd { margin: 0; word-break: break-word; }
.rsm-modal-backdrop { position: fixed; inset: 0; z-index: 120; background: rgba(0,0,0,.42); display: flex; align-items: center; justify-content: center; padding: 22px; }
.rsm-modal { width: min(560px, 100%); max-height: min(86vh, 820px); display: flex; flex-direction: column; background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; box-shadow: 0 18px 70px rgba(0,0,0,.36); overflow: hidden; }
.rsm-modal.wide { width: min(860px, 100%); }
.rsm-modal-head { display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px 10px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.rsm-modal-title { font-size: 14px; font-weight: 680; flex: 1; }
.rsm-modal-body { padding: 14px 16px; overflow: auto; min-height: 0; }
.rsm-modal-foot { padding: 10px 16px; border-top: 1px solid var(--dsw-alias-border-l1); display: flex; justify-content: flex-end; gap: 8px; flex: none; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 55%, transparent); }
.rsm-form-row { margin-bottom: 10px; }
.rsm-field-label { font-size: 11px; font-weight: 650; color: var(--dsw-alias-label-secondary); margin-bottom: 4px; }
.rsm-form-static { font-size: 12.5px; word-break: break-all; }
.rsm-form-sep { height: 1px; background: var(--dsw-alias-border-l1); margin: 12px 0; }
.rsm-mirror-option:hover { background: var(--dsw-alias-bg-layer-2); }
.rsm-editor { display: flex; flex-direction: column; min-height: 0; height: 100%; }
.rsm-editor textarea { flex: 1; min-height: 320px; resize: none; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 1.55; white-space: pre; overflow: auto; tab-size: 2; }
.rsm-editor-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.rsm-toast {
  position: fixed; z-index: 160; left: 50%; bottom: 24px; transform: translateX(-50%);
  background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 9px; box-shadow: 0 10px 38px rgba(0,0,0,.28); padding: 9px 14px;
  display: flex; align-items: center; gap: 8px; max-width: min(520px, 90vw); font-size: 12.5px;
}
.rsm-toast.success .rsm-icon { color: var(--dsw-alias-state-success-primary); }
.rsm-toast.error .rsm-icon { color: var(--dsw-alias-state-error-primary); }
.rsm-toast.info .rsm-icon { color: var(--dsw-alias-brand-primary); }
.rsm-inline { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.rsm-secret-state { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--dsw-alias-state-success-primary); }
.rsm-segmented { display: inline-flex; padding: 2px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-base); }
.rsm-segmented button { border: 0; background: transparent; padding: 4px 10px; border-radius: 6px; cursor: pointer; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.rsm-segmented button.active { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-weight: 600; }
.rsm-checkline { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.rsm-code-list { display: flex; flex-direction: column; gap: 6px; }
.rsm-code-row { border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 7px 9px; display: flex; align-items: center; gap: 8px; font-size: 12px; }
.rsm-code-row.ok .rsm-icon { color: var(--dsw-alias-state-success-primary); }
.rsm-code-row.fail .rsm-icon { color: var(--dsw-alias-state-error-primary); }
.rsm-code-row .grow { flex: 1; min-width: 0; }
.rsm-count-pill { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.rsm-hidden { display: none !important; }
@media (max-width: 980px) {
  .rsm-rail { width: 220px; }
  .rsm-table .hide-md { display: none; }
  .rsm-title { font-size: 15px; }
}
@media (max-width: 720px) {
  .rsm-rail { width: 190px; }
  .rsm-content { padding: 12px; }
  .rsm-main-head { padding: 10px 12px 0; }
  .rsm-table .hide-sm { display: none; }
}
`;

    function Modal({ title, onClose, children, footer, wide = false }) {
      React.useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, [onClose]);
      return h(
        'div',
        {
          className: 'rsm-modal-backdrop',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          },
        },
        h(
          'div',
          {
            className: `rsm-modal${wide ? ' wide' : ''}`,
            role: 'dialog',
            'aria-modal': 'true',
            onMouseDown: (event) => event.stopPropagation(),
          },
          h(
            'div',
            { className: 'rsm-modal-head' },
            h('div', { className: 'rsm-modal-title' }, title),
            h(
              'button',
              { type: 'button', className: 'rsm-btn ghost icon-only small', onClick: onClose, 'aria-label': 'Close' },
              h(Icon, { name: 'close' }),
            ),
          ),
          h('div', { className: 'rsm-modal-body' }, children),
          footer ? h('div', { className: 'rsm-modal-foot' }, footer) : null,
        ),
      );
    }

    function ConfirmDialog({ state, onClose, t }) {
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      if (!state) return null;
      const run = async () => {
        setBusy(true);
        setError('');
        try {
          await state.onConfirm();
          onClose();
        } catch (failure) {
          setError(errorText(failure));
        } finally {
          setBusy(false);
        }
      };
      return h(
        Modal,
        {
          title: state.title,
          onClose: busy ? () => {} : onClose,
          footer: [
            h(
              'button',
              { key: 'cancel', type: 'button', className: 'rsm-btn', onClick: onClose, disabled: busy },
              t('cancel'),
            ),
            h(
              'button',
              {
                key: 'ok',
                type: 'button',
                className: `rsm-btn ${state.danger ? 'danger-solid' : 'primary'}`,
                onClick: run,
                disabled: busy,
              },
              busy ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: state.danger ? 'warning' : 'check' }),
              state.confirmLabel || t('confirm'),
            ),
          ],
        },
        h('div', { style: { whiteSpace: 'pre-wrap' } }, state.body),
        error ? h('div', { className: 'rsm-error-text' }, error) : null,
      );
    }

    function PromptDialog({ state, onClose, t }) {
      const [value, setValue] = React.useState(state?.initial || '');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      React.useEffect(() => {
        setValue(state?.initial || '');
        setError('');
      }, [state]);
      if (!state) return null;
      const submit = async (event) => {
        event?.preventDefault();
        setBusy(true);
        setError('');
        try {
          await state.onSubmit(value);
          onClose();
        } catch (failure) {
          setError(errorText(failure));
        } finally {
          setBusy(false);
        }
      };
      return h(
        Modal,
        {
          title: state.title,
          onClose: busy ? () => {} : onClose,
          footer: [
            h('button', { key: 'cancel', type: 'button', className: 'rsm-btn', onClick: onClose, disabled: busy }, t('cancel')),
            h(
              'button',
              { key: 'ok', type: 'submit', className: 'rsm-btn primary', onClick: submit, disabled: busy },
              busy ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: 'check' }),
              state.confirmLabel || t('save'),
            ),
          ],
        },
        h(
          'form',
          { onSubmit: submit },
          h('label', { className: 'rsm-label' }, state.label || t('name')),
          h('input', {
            className: 'rsm-input',
            value,
            autoFocus: true,
            onChange: (event) => setValue(event.target.value),
            placeholder: state.placeholder || '',
          }),
          state.hint ? h('div', { className: 'rsm-hint' }, state.hint) : null,
          error ? h('div', { className: 'rsm-error-text' }, error) : null,
        ),
      );
    }

    function Toast({ toast, t }) {
      if (!toast) return null;
      return h(
        'div',
        { className: `rsm-toast ${toast.kind}`, role: 'status' },
        h(Icon, { name: toast.kind === 'error' ? 'warning' : toast.kind === 'success' ? 'check' : 'info' }),
        h('span', null, toast.message),
      );
    }

    function PanelIcon({ size = 20, active = false }) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: active ? 2 : 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        },
        h('rect', { x: 3, y: 3.5, width: 18, height: 7, rx: 2 }),
        h('rect', { x: 3, y: 13.5, width: 18, height: 7, rx: 2 }),
        h('circle', { cx: 6.4, cy: 7, r: 0.9, fill: 'currentColor', stroke: 'none' }),
        h('circle', { cx: 6.4, cy: 17, r: 0.9, fill: 'currentColor', stroke: 'none' }),
        h('path', { d: 'M10 7h7M10 17h7' }),
      );
    }

    function EmptyState({ icon, title, body, action, t }) {
      return h(
        'div',
        { className: 'rsm-empty' },
        h('div', { className: 'rsm-empty-icon' }, h(Icon, { name: icon, size: 26 })),
        h('div', { className: 'rsm-empty-title' }, title),
        body ? h('div', { className: 'rsm-empty-body' }, body) : null,
        action || null,
      );
    }

    function Loading({ t, label }) {
      return h(
        'div',
        { className: 'rsm-loading' },
        h('span', { className: 'rsm-spinner' }),
        h('span', null, label || t('loading')),
      );
    }

    function ErrorAlert({ error, onRetry, t }) {
      if (!error) return null;
      return h(
        'div',
        { className: 'rsm-alert' },
        h(Icon, { name: 'warning' }),
        h(
          'div',
          { style: { flex: 1, minWidth: 0 } },
          h('div', { style: { fontWeight: 600 } }, t('loadFailed')),
          h('div', { style: { fontSize: 12, marginTop: 2, whiteSpace: 'pre-wrap' } }, errorText(error)),
        ),
        onRetry
          ? h('button', { type: 'button', className: 'rsm-btn small', onClick: onRetry }, t('retry'))
          : null,
      );
    }

    function ServerForm({ server, onClose, onSaved, t, notify }) {
      const editing = Boolean(server);
      const [form, setForm] = React.useState({
        name: server?.name || '',
        host: server?.host || '',
        port: server?.port || 22,
        username: server?.username || 'root',
        authType: server?.authType || 'password',
        password: '',
        privateKey: '',
        passphrase: '',
        clearPassword: false,
        clearPrivateKey: false,
        clearPassphrase: false,
        dockerCommand: server?.dockerCommand || 'docker',
        defaultPath: server?.defaultPath || '',
        description: server?.description || '',
      });
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const update = (patch) => setForm((current) => ({ ...current, ...patch }));
      const hasSavedPassword = editing && server.secret?.password;
      const hasSavedKey = editing && server.secret?.privateKey;
      const keyInput = React.useRef();

      const submit = async (event) => {
        event?.preventDefault();
        setError('');
        if (!form.name.trim()) return setError(t('requiredField'));
        if (!form.host.trim()) return setError(t('requiredField'));
        if (!form.username.trim()) return setError(t('requiredField'));
        const port = Number(form.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) return setError(t('invalidPort'));
        if (!editing) {
          if (form.authType === 'password' && !form.password) return setError(t('requiredField'));
          if (form.authType === 'key' && !form.privateKey.trim()) return setError(t('requiredField'));
        }
        setBusy(true);
        try {
          const body = {
            server: {
              name: form.name.trim(),
              host: form.host.trim(),
              port,
              username: form.username.trim(),
              authType: form.authType,
              dockerCommand: form.dockerCommand.trim() || 'docker',
              defaultPath: form.defaultPath.trim(),
              description: form.description.trim(),
            },
            secrets: {
              ...(form.password ? { password: form.password } : {}),
              ...(form.privateKey.trim() ? { privateKey: form.privateKey } : {}),
              ...(form.passphrase ? { passphrase: form.passphrase } : {}),
              ...(form.clearPassword ? { clearPassword: true } : {}),
              ...(form.clearPrivateKey ? { clearPrivateKey: true } : {}),
              ...(form.clearPassphrase ? { clearPassphrase: true } : {}),
            },
          };
          const saved = await api(editing ? serverPath(server.id) : '/servers', {
            method: editing ? 'PUT' : 'POST',
            body,
          });
          notify(t('serverSaved'));
          onSaved(saved);
        } catch (failure) {
          setError(errorText(failure));
        } finally {
          setBusy(false);
        }
      };

      return h(
        Modal,
        {
          title: editing ? t('editServer') : t('addServer'),
          onClose: busy ? () => {} : onClose,
          wide: true,
          footer: [
            h('button', { key: 'cancel', type: 'button', className: 'rsm-btn', onClick: onClose, disabled: busy }, t('cancel')),
            h(
              'button',
              { key: 'save', type: 'button', className: 'rsm-btn primary', onClick: submit, disabled: busy },
              busy ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: 'check' }),
              t('save'),
            ),
          ],
        },
        h(
          'form',
          { onSubmit: submit },
          h(
            'div',
            { className: 'rsm-field-row' },
            h(
              'div',
              { className: 'rsm-field' },
              h('label', { className: 'rsm-label' }, t('name')),
              h('input', {
                className: 'rsm-input',
                value: form.name,
                autoFocus: true,
                onChange: (event) => update({ name: event.target.value }),
                placeholder: 'production-1',
              }),
            ),
            h(
              'div',
              { className: 'rsm-field' },
              h('label', { className: 'rsm-label' }, t('host')),
              h('input', {
                className: 'rsm-input',
                value: form.host,
                onChange: (event) => update({ host: event.target.value }),
                placeholder: '192.168.1.10 或 server.example.com',
              }),
            ),
          ),
          h(
            'div',
            { className: 'rsm-field-row' },
            h(
              'div',
              { className: 'rsm-field' },
              h('label', { className: 'rsm-label' }, t('port')),
              h('input', {
                className: 'rsm-input',
                type: 'number',
                min: 1,
                max: 65535,
                value: form.port,
                onChange: (event) => update({ port: event.target.value }),
              }),
            ),
            h(
              'div',
              { className: 'rsm-field' },
              h('label', { className: 'rsm-label' }, t('username')),
              h('input', {
                className: 'rsm-input',
                value: form.username,
                onChange: (event) => update({ username: event.target.value }),
                placeholder: 'root',
              }),
            ),
          ),
          h(
            'div',
            { className: 'rsm-field' },
            h('label', { className: 'rsm-label' }, t('authType')),
            h(
              'div',
              { className: 'rsm-segmented' },
              h(
                'button',
                {
                  type: 'button',
                  className: form.authType === 'password' ? 'active' : '',
                  onClick: () => update({ authType: 'password' }),
                },
                h(Icon, { name: 'key', size: 13 }),
                t('password'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: form.authType === 'key' ? 'active' : '',
                  onClick: () => update({ authType: 'key' }),
                },
                h(Icon, { name: 'terminal', size: 13 }),
                t('privateKey'),
              ),
            ),
          ),
          form.authType === 'password'
            ? h(
                'div',
                { className: 'rsm-field' },
                h('label', { className: 'rsm-label' }, t('password')),
                hasSavedPassword && !form.clearPassword
                  ? h('div', { className: 'rsm-secret-state', style: { marginBottom: 6 } }, h(Icon, { name: 'check', size: 13 }), t('passwordSaved'))
                  : null,
                h('input', {
                  className: 'rsm-input',
                  type: 'password',
                  value: form.password,
                  disabled: form.clearPassword,
                  autoComplete: 'new-password',
                  onChange: (event) => update({ password: event.target.value }),
                  placeholder: editing ? t('keepSecretHint') : '••••••••',
                }),
                editing && hasSavedPassword
                  ? h(
                      'label',
                      { className: 'rsm-checkline', style: { marginTop: 6 } },
                      h('input', {
                        type: 'checkbox',
                        className: 'rsm-check',
                        checked: form.clearPassword,
                        onChange: (event) => update({ clearPassword: event.target.checked }),
                      }),
                      t('clearSecret'),
                    )
                  : null,
              )
            : h(
                React.Fragment,
                null,
                h(
                  'div',
                  { className: 'rsm-field' },
                  h('label', { className: 'rsm-label' }, t('privateKey')),
                  hasSavedKey && !form.clearPrivateKey
                    ? h('div', { className: 'rsm-secret-state', style: { marginBottom: 6 } }, h(Icon, { name: 'check', size: 13 }), t('keySaved'))
                    : null,
                  h('textarea', {
                    className: 'rsm-textarea',
                    rows: 5,
                    value: form.privateKey,
                    disabled: form.clearPrivateKey,
                    spellCheck: false,
                    placeholder: editing ? t('keepSecretHint') : '-----BEGIN OPENSSH PRIVATE KEY-----',
                    onChange: (event) => update({ privateKey: event.target.value }),
                    style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 11 },
                  }),
                  h(
                    'div',
                    { className: 'rsm-inline', style: { marginTop: 6 } },
                    h(
                      'button',
                      { type: 'button', className: 'rsm-btn small', onClick: () => keyInput.current?.click(), disabled: form.clearPrivateKey },
                      h(Icon, { name: 'upload', size: 13 }),
                      t('upload'),
                    ),
                    h('input', {
                      ref: keyInput,
                      type: 'file',
                      className: 'rsm-hidden',
                      onChange: async (event) => {
                        const file = event.target.files?.[0];
                        if (file) update({ privateKey: await file.text(), clearPrivateKey: false });
                        event.target.value = '';
                      },
                    }),
                    editing && hasSavedKey
                      ? h(
                          'label',
                          { className: 'rsm-checkline' },
                          h('input', {
                            type: 'checkbox',
                            className: 'rsm-check',
                            checked: form.clearPrivateKey,
                            onChange: (event) => update({ clearPrivateKey: event.target.checked }),
                          }),
                          t('clearSecret'),
                        )
                      : null,
                  ),
                ),
                h(
                  'div',
                  { className: 'rsm-field' },
                  h('label', { className: 'rsm-label' }, t('passphrase')),
                  h('input', {
                    className: 'rsm-input',
                    type: 'password',
                    value: form.passphrase,
                    autoComplete: 'new-password',
                    disabled: form.clearPassphrase,
                    onChange: (event) => update({ passphrase: event.target.value }),
                    placeholder: editing ? t('keepSecretHint') : '',
                  }),
                ),
              ),
          h(
            'div',
            { className: 'rsm-field-row' },
            h(
              'div',
              { className: 'rsm-field' },
              h('label', { className: 'rsm-label' }, t('dockerCommand')),
              h('input', {
                className: 'rsm-input',
                value: form.dockerCommand,
                onChange: (event) => update({ dockerCommand: event.target.value }),
                placeholder: 'docker 或 sudo docker',
              }),
              h('div', { className: 'rsm-hint' }, t('dockerCommandHint')),
            ),
            h(
              'div',
              { className: 'rsm-field' },
              h('label', { className: 'rsm-label' }, t('defaultPath')),
              h('input', {
                className: 'rsm-input',
                value: form.defaultPath,
                onChange: (event) => update({ defaultPath: event.target.value }),
                placeholder: '/home/user 或 /opt/app',
              }),
              h('div', { className: 'rsm-hint' }, t('defaultPathHint')),
            ),
          ),
          h(
            'div',
            { className: 'rsm-field' },
            h('label', { className: 'rsm-label' }, t('description')),
            h('input', {
              className: 'rsm-input',
              value: form.description,
              onChange: (event) => update({ description: event.target.value }),
              placeholder: '',
            }),
          ),
          error ? h('div', { className: 'rsm-error-text' }, error) : null,
        ),
      );
    }

    function RemoteManagerPage({ locale }) {
      const t = useLocale(locale);
      const [serversState, reloadServers] = useRemote((signal) => api('/servers', { signal }), []);
      const servers = serversState.value || [];
      const [selectedId, setSelectedId] = React.useState(() => {
        try {
          return localStorage.getItem('rsm.selected') || '';
        } catch {
          return '';
        }
      });
      const [view, setView] = React.useState('containers');
      const [serverForm, setServerForm] = React.useState(null);
      const [confirmState, setConfirmState] = React.useState(null);
      const [promptState, setPromptState] = React.useState(null);
      const [testing, setTesting] = React.useState(false);
      const [serverSearch, setServerSearch] = React.useState('');
      const [toast, notify] = useToast();

      React.useEffect(() => {
        if (servers.length === 0) {
          if (selectedId) setSelectedId('');
          return;
        }
        if (!servers.some((server) => server.id === selectedId)) setSelectedId(servers[0].id);
      }, [servers, selectedId]);

      React.useEffect(() => {
        try {
          if (selectedId) localStorage.setItem('rsm.selected', selectedId);
          else localStorage.removeItem('rsm.selected');
        } catch {
          // ignore
        }
      }, [selectedId]);

      const selected = servers.find((server) => server.id === selectedId) || null;
      const filteredServers = servers.filter((server) => {
        const q = serverSearch.trim().toLowerCase();
        if (!q) return true;
        return [server.name, server.host, server.username, server.description].join('\n').toLowerCase().includes(q);
      });

      const openAdd = () => setServerForm({ server: null });
      const openEdit = () => selected && setServerForm({ server: selected });
      const closeServerForm = () => setServerForm(null);
      const onSaved = async (saved) => {
        setServerForm(null);
        await reloadServers();
        if (saved?.id) setSelectedId(saved.id);
      };

      const testConnection = async () => {
        if (!selected || testing) return;
        setTesting(true);
        try {
          const result = await api(serverPath(selected.id, '/test'), { method: 'POST' });
          notify(
            `${t('testOk')} · ${result.latencyMs} ms · ${result.dockerVersion ? `Docker ${result.dockerVersion}` : t('dockerUnavailable')}`,
            result.dockerVersion ? 'success' : 'error',
          );
          await reloadServers();
        } catch (error) {
          notify(`${t('connectFailed')}: ${errorText(error)}`, 'error');
        } finally {
          setTesting(false);
        }
      };

      const askDeleteServer = () => {
        if (!selected) return;
        setConfirmState({
          title: t('deleteServer'),
          body: t('serverDeleteBody', { name: selected.name }),
          confirmLabel: t('delete'),
          danger: true,
          onConfirm: async () => {
            await api(serverPath(selected.id), { method: 'DELETE' });
            notify(t('serverDeleted'));
            setSelectedId('');
            await reloadServers();
          },
        });
      };

      const tabs = [
        ['containers', 'docker', t('containers')],
        ['images', 'layers', t('images')],
        ['firewall', 'shield', t('firewall')],
        ['programs', 'package', t('programs')],
        ['files', 'folder', t('files')],
        ['overview', 'info', t('overview')],
        ['activity', 'terminal', t('activity')],
      ];

      return h(
        'div',
        { className: 'rsm-root' },
        h('style', null, CSS),
        h(
          'aside',
          { className: 'rsm-rail' },
          h(
            'div',
            { className: 'rsm-rail-head' },
            h(
              'div',
              { className: 'rsm-brand' },
              h('div', { className: 'rsm-brand-mark' }, h(Icon, { name: 'server', size: 18 })),
              h(
                'div',
                { className: 'rsm-brand-text' },
                h('div', { className: 'rsm-brand-title' }, t('panel')),
                h('div', { className: 'rsm-brand-sub' }, 'SSH · Docker · Files'),
              ),
            ),
            h(
              'button',
              { type: 'button', className: 'rsm-btn primary icon-only small', onClick: openAdd, title: t('addServer'), 'aria-label': t('addServer') },
              h(Icon, { name: 'plus', size: 15 }),
            ),
          ),
          servers.length > 2
            ? h(
                'div',
                { className: 'rsm-rail-search' },
                h(
                  'div',
                  { className: 'rsm-search' },
                  h(Icon, { name: 'search', size: 14 }),
                  h('input', {
                    className: 'rsm-input',
                    value: serverSearch,
                    onChange: (event) => setServerSearch(event.target.value),
                    placeholder: t('searchServers'),
                  }),
                ),
              )
            : null,
          h(
            'div',
            { className: 'rsm-server-list' },
            filteredServers.length === 0
              ? h(EmptyState, {
                  icon: 'server',
                  title: servers.length === 0 ? t('noServers') : t('noContainers'),
                  body: servers.length === 0 ? t('noServersHint') : t('noContainersHint'),
                  t,
                  action:
                    servers.length === 0
                      ? h('button', { type: 'button', className: 'rsm-btn primary', onClick: openAdd }, h(Icon, { name: 'plus' }), t('addServer'))
                      : null,
                })
              : filteredServers.map((server) =>
                  h(
                    'button',
                    {
                      key: server.id,
                      type: 'button',
                      className: `rsm-server-item${server.id === selectedId ? ' active' : ''}`,
                      onClick: () => setSelectedId(server.id),
                    },
                    h('div', { className: 'rsm-server-avatar' }, h(Icon, { name: 'server', size: 16 })),
                    h(
                      'div',
                      { className: 'rsm-server-main' },
                      h(
                        'div',
                        { className: 'rsm-server-name' },
                        h('span', { className: 'rsm-dot' + (server.connected ? ' online' : '') }),
                        h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, server.name),
                      ),
                      h('div', { className: 'rsm-server-host' }, `${server.username}@${server.host}:${server.port}`),
                    ),
                  ),
                ),
          ),
          h(
            'div',
            { className: 'rsm-rail-foot' },
            h('span', null, `${servers.length} ${t('servers')}`),
            h(
              'button',
              { type: 'button', className: 'rsm-btn ghost icon-only small', onClick: reloadServers, title: t('refresh') },
              h(Icon, { name: 'refresh', size: 14 }),
            ),
          ),
        ),
        h(
          'main',
          { className: 'rsm-main' },
          serversState.error
            ? h(ErrorAlert, { error: serversState.error, onRetry: reloadServers, t })
            : null,
          !selected
            ? h(EmptyState, {
                icon: 'server',
                title: servers.length === 0 ? t('noServers') : t('emptySelect'),
                body: servers.length === 0 ? t('noServersHint') : t('emptySelectHint'),
                t,
                action:
                  servers.length === 0
                    ? h('button', { type: 'button', className: 'rsm-btn primary', onClick: openAdd }, h(Icon, { name: 'plus' }), t('addServer'))
                    : null,
              })
            : h(
                React.Fragment,
                null,
                h(
                  'header',
                  { className: 'rsm-main-head' },
                  h(
                    'div',
                    { className: 'rsm-title-row' },
                    h(
                      'div',
                      { className: 'rsm-title-block' },
                      h(
                        'div',
                        { className: 'rsm-title' },
                        selected.name,
                        h(
                          'span',
                          { className: `rsm-badge ${selected.connected ? 'success' : 'muted'}` },
                          h('span', { className: 'rsm-dot' + (selected.connected ? ' online' : '') }),
                          selected.connected ? t('connected') : t('disconnected'),
                        ),
                      ),
                      h(
                        'div',
                        { className: 'rsm-subtitle' },
                        `${selected.username}@${selected.host}:${selected.port}`,
                        selected.description ? ` · ${selected.description}` : '',
                      ),
                    ),
                    h(
                      'div',
                      { className: 'rsm-actions' },
                      h(
                        'button',
                        { type: 'button', className: 'rsm-btn', onClick: testConnection, disabled: testing },
                        testing ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: 'plug', size: 14 }),
                        testing ? t('testing') : t('test'),
                      ),
                      h(
                        'button',
                        { type: 'button', className: 'rsm-btn icon-only', onClick: openEdit, title: t('editServer') },
                        h(Icon, { name: 'edit', size: 14 }),
                      ),
                      h(
                        'button',
                        { type: 'button', className: 'rsm-btn danger icon-only', onClick: askDeleteServer, title: t('deleteServer') },
                        h(Icon, { name: 'trash', size: 14 }),
                      ),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'rsm-tabs' },
                    tabs.map(([id, icon, label]) =>
                      h(
                        'button',
                        {
                          key: id,
                          type: 'button',
                          className: `rsm-tab${view === id ? ' active' : ''}`,
                          onClick: () => setView(id),
                        },
                        h(Icon, { name: icon, size: 14 }),
                        label,
                      ),
                    ),
                  ),
                ),
                view === 'containers'
                  ? h(ContainersView, { key: `${selected.id}:containers`, server: selected, t, notify, setConfirmState })
                  : view === 'images'
                    ? h(ImagesView, { key: `${selected.id}:images`, server: selected, t, notify, setConfirmState })
                    : view === 'firewall'
                      ? h(FirewallView, {
                          key: `${selected.id}:firewall`,
                          server: selected,
                          t,
                          notify,
                          setConfirmState,
                        })
                      : view === 'programs'
                        ? h(ProgramsView, { key: `${selected.id}:programs`, server: selected, t, notify, setConfirmState })
                        : view === 'files'
                    ? h(FilesView, { key: `${selected.id}:files`, server: selected, t, notify, setConfirmState, setPromptState })
                    : view === 'overview'
                      ? h(OverviewView, { key: `${selected.id}:overview`, server: selected, t, notify, onRefreshServers: reloadServers })
                      : h(ActivityView, { key: `${selected.id}:activity`, server: selected, t }),
              ),
        ),
        serverForm
          ? h(ServerForm, {
              server: serverForm.server,
              t,
              notify,
              onClose: closeServerForm,
              onSaved,
            })
          : null,
        h(ConfirmDialog, { state: confirmState, onClose: () => setConfirmState(null), t }),
        h(PromptDialog, { state: promptState, onClose: () => setPromptState(null), t }),
        h(Toast, { toast, t }),
      );
    }

    function stateBadgeClass(state) {
      if (state === 'running') return 'success';
      if (state === 'paused' || state === 'restarting') return 'warn';
      if (state === 'exited' || state === 'dead') return 'error';
      return 'muted';
    }

    function containerStateText(state, t) {
      if (state === 'running') return t('running');
      if (state === 'paused') return t('paused');
      if (state === 'exited' || state === 'dead' || state === 'created') return t('stopped');
      return state || t('other');
    }

    function checkbox(checked, onChange, ariaLabel) {
      return h('input', {
        type: 'checkbox',
        className: 'rsm-check',
        checked,
        onChange: (event) => onChange(event.target.checked),
        'aria-label': ariaLabel,
      });
    }

    function Pager({ page, totalPages, total, pageSize, onPage, t }) {
      const pages = [];
      const start = Math.max(1, Math.min(page - 2, totalPages - 4));
      const end = Math.min(totalPages, Math.max(page + 2, 5));
      for (let value = start; value <= end; value += 1) pages.push(value);
      return h(
        'div',
        { className: 'rsm-footer' },
        h('span', { className: 'rsm-count-pill' }, `${total} ${t('total')}`),
        h('span', { className: 'rsm-spacer' }),
        h('span', { className: 'rsm-count-pill' }, t('page', { page, pages: totalPages })),
        h(
          'div',
          { className: 'rsm-pager' },
          h(
            'button',
            { type: 'button', className: 'rsm-page-btn', disabled: page <= 1, onClick: () => onPage(page - 1) },
            h(Icon, { name: 'chevronLeft', size: 13 }),
          ),
          pages.map((value) =>
            h(
              'button',
              {
                key: value,
                type: 'button',
                className: `rsm-page-btn${value === page ? ' active' : ''}`,
                onClick: () => onPage(value),
              },
              String(value),
            ),
          ),
          h(
            'button',
            { type: 'button', className: 'rsm-page-btn', disabled: page >= totalPages, onClick: () => onPage(page + 1) },
            h(Icon, { name: 'chevronRight', size: 13 }),
          ),
        ),
      );
    }

    function ContainerDetailModal({ server, containerId, onClose, t }) {
      const [state] = useRemote(
        (signal) => api(serverPath(server.id, `/containers/${encodeURIComponent(containerId)}`), { signal }),
        [server.id, containerId],
      );
      const detail = state.value;
      return h(
        Modal,
        {
          title: detail ? detail.name || containerId : t('containerDetail'),
          onClose,
          wide: true,
          footer: h('button', { type: 'button', className: 'rsm-btn', onClick: onClose }, t('close')),
        },
        state.loading && !detail
          ? h(Loading, { t })
          : state.error
            ? h(ErrorAlert, { error: state.error, t })
            : detail
              ? h(
                  'div',
                  { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
                  h(
                    'dl',
                    { className: 'rsm-kv' },
                    h('dt', null, 'ID'),
                    h('dd', { className: 'rsm-mono' }, detail.id),
                    h('dt', null, t('image')),
                    h('dd', { className: 'rsm-mono' }, detail.image || '—'),
                    h('dt', null, t('state')),
                    h(
                      'dd',
                      null,
                      h('span', { className: `rsm-badge ${stateBadgeClass(detail.state)}` }, detail.state),
                      detail.status ? ` · ${detail.status}` : '',
                    ),
                    h('dt', null, t('command')),
                    h('dd', { className: 'rsm-mono', style: { whiteSpace: 'pre-wrap' } }, detail.command || '—'),
                    h('dt', null, t('created')),
                    h('dd', null, detail.createdAt ? formatTime(Date.parse(detail.createdAt)) : '—'),
                    h('dt', null, t('restartCount')),
                    h('dd', null, String(detail.restartCount ?? 0)),
                    h('dt', null, t('ports')),
                    h(
                      'dd',
                      null,
                      detail.ports?.length
                        ? detail.ports
                            .map((port) => `${port.container}${port.host?.length ? ` → ${port.host.join(', ')}` : ''}`)
                            .join('; ')
                        : '—',
                    ),
                    h('dt', null, t('networks')),
                    h('dd', null, detail.networks?.length ? detail.networks.join(', ') : '—'),
                  ),
                  detail.labels && Object.keys(detail.labels).length
                    ? h(
                        'div',
                        null,
                        h('div', { className: 'rsm-label' }, t('labels')),
                        h(
                          'div',
                          { className: 'rsm-code-list' },
                          Object.entries(detail.labels).map(([key, value]) =>
                            h('div', { key, className: 'rsm-code-row' }, h('span', { className: 'rsm-mono', style: { minWidth: 180 } }, key), h('span', { className: 'grow' }, String(value))),
                          ),
                        ),
                      )
                    : null,
                  detail.mounts?.length
                    ? h(
                        'div',
                        null,
                        h('div', { className: 'rsm-label' }, t('mounts')),
                        h(
                          'div',
                          { className: 'rsm-code-list' },
                          detail.mounts.map((mount, index) =>
                            h(
                              'div',
                              { key: index, className: 'rsm-code-row' },
                              h('span', { className: 'rsm-badge muted' }, mount.type || 'bind'),
                              h('span', { className: 'grow rsm-mono' }, `${mount.source} → ${mount.destination}${mount.rw ? '' : ' (ro)'}`),
                            ),
                          ),
                        ),
                      )
                    : null,
                  detail.env?.length
                    ? h(
                        'div',
                        null,
                        h('div', { className: 'rsm-label' }, t('environment')),
                        h(
                          'div',
                          { className: 'rsm-code-list' },
                          detail.env.map((line, index) => h('div', { key: index, className: 'rsm-code-row rsm-mono' }, line)),
                        ),
                      )
                    : null,
                )
              : null,
      );
    }

    function ContainersView({ server, t, notify, setConfirmState }) {
      const [query, setQuery] = React.useState('');
      const [debouncedQuery, setDebouncedQuery] = React.useState('');
      const [stateFilter, setStateFilter] = React.useState('all');
      const [project, setProject] = React.useState('');
      const [sort, setSort] = React.useState('name');
      const [page, setPage] = React.useState(1);
      const [pageSize, setPageSize] = React.useState(50);
      const [refreshToken, setRefreshToken] = React.useState(0);
      const [autoSeconds, setAutoSeconds] = React.useState(0);
      const [selected, setSelected] = React.useState(() => new Set());
      const [busyIds, setBusyIds] = React.useState(() => new Set());
      const [detailId, setDetailId] = React.useState(null);

      React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 280);
        return () => clearTimeout(timer);
      }, [query]);

      React.useEffect(() => {
        setPage(1);
        setSelected(new Set());
      }, [debouncedQuery, stateFilter, project, sort, pageSize]);

      React.useEffect(() => {
        if (!autoSeconds) return undefined;
        const timer = setInterval(() => setRefreshToken((value) => value + 1), autoSeconds * 1000);
        return () => clearInterval(timer);
      }, [autoSeconds]);

      const [dataState, reload] = useRemote(
        (signal) => {
          const params = new URLSearchParams({
            q: debouncedQuery,
            state: stateFilter,
            project,
            sort,
            page: String(page),
            pageSize: String(pageSize),
            refresh: refreshToken ? '1' : '0',
          });
          return api(serverPath(server.id, '/containers') + `?${params.toString()}`, { signal });
        },
        [server.id, debouncedQuery, stateFilter, project, sort, page, pageSize, refreshToken],
      );

      const data = dataState.value;
      const items = data?.items || [];
      const projects = data?.summary?.projects || [];
      const allPageSelected = items.length > 0 && items.every((item) => selected.has(item.id));
      const somePageSelected = items.some((item) => selected.has(item.id));

      React.useEffect(() => {
        if (project && data && !projects.some((entry) => entry.name === project)) {
          setProject('');
        }
      }, [data, project, projects]);

      const toggleOne = (id, checked) => {
        setSelected((current) => {
          const next = new Set(current);
          if (checked) next.add(id);
          else next.delete(id);
          return next;
        });
      };

      const toggleAll = (checked) => {
        setSelected((current) => {
          const next = new Set(current);
          if (checked) items.forEach((item) => next.add(item.id));
          else items.forEach((item) => next.delete(item.id));
          return next;
        });
      };

      const refresh = () => {
        setRefreshToken((value) => value + 1);
        reload();
      };

      const actionTitle = (action, count, single) => {
        if (action === 'stop') return count > 1 ? t('batchStopTitle', { count }) : t('containerStopTitle');
        if (action === 'restart') return count > 1 ? t('batchRestartTitle', { count }) : t('containerRestartTitle');
        return t('start');
      };

      const actionBody = (action, count, single) => {
        if (action === 'stop') {
          return count > 1 ? t('batchStopBody') : t('containerStopBody', { name: single?.name || '' });
        }
        if (action === 'restart') {
          return count > 1 ? t('batchRestartBody') : t('containerRestartBody', { name: single?.name || '' });
        }
        return t('start');
      };

      const runAction = (action, ids, single) => {
        if (!ids.length) return;
        setConfirmState({
          title: actionTitle(action, ids.length, single),
          body: actionBody(action, ids.length, single),
          confirmLabel: action === 'start' ? t('start') : action === 'stop' ? t('stop') : t('restart'),
          danger: action === 'stop',
          onConfirm: async () => {
            const pending = new Set(ids);
            setBusyIds((current) => new Set([...current, ...pending]));
            try {
              const result = await api(serverPath(server.id, '/containers/action'), {
                method: 'POST',
                body: { action, ids },
              });
              if (result.failed > 0) {
                const first = result.results.find((entry) => !entry.ok);
                notify(`${t('actionDone')}: ${result.succeeded}/${result.requested} · ${t('actionFailed')}: ${result.failed}${first ? ` · ${first.id}: ${first.message}` : ''}`, 'error');
              } else {
                notify(`${t('actionDone')}: ${result.succeeded}/${result.requested}`);
              }
              setSelected(new Set());
              setRefreshToken((value) => value + 1);
            } finally {
              setBusyIds((current) => {
                const next = new Set(current);
                pending.forEach((id) => next.delete(id));
                return next;
              });
            }
          },
        });
      };

      const selectedIds = [...selected];
      const dockerError = dataState.error;

      return h(
        'div',
        { className: 'rsm-content flush' },
        h(
          'div',
          { className: 'rsm-summary' },
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('total')),
            h('div', { className: 'rsm-stat-value' }, data ? data.summary.total : '—'),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('runningCount')),
            h('div', { className: 'rsm-stat-value success' }, data ? data.summary.running : '—'),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('stoppedCount')),
            h('div', { className: 'rsm-stat-value' }, data ? data.summary.stopped : '—'),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('pausedCount')),
            h('div', { className: 'rsm-stat-value warn' }, data ? data.summary.paused : '—'),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('projects')),
            h('div', { className: 'rsm-stat-value' }, data ? projects.length : '—'),
          ),
        ),
        h(
          'div',
          { className: 'rsm-toolbar' },
          h(
            'div',
            { className: 'rsm-search' },
            h(Icon, { name: 'search', size: 14 }),
            h('input', {
              className: 'rsm-input',
              value: query,
              onChange: (event) => setQuery(event.target.value),
              placeholder: t('searchContainers'),
              'aria-label': t('searchContainers'),
            }),
          ),
          h(
            'select',
            { className: 'rsm-select', style: { width: 'auto' }, value: stateFilter, onChange: (event) => setStateFilter(event.target.value), 'aria-label': t('state') },
            h('option', { value: 'all' }, t('allStates')),
            h('option', { value: 'running' }, t('running')),
            h('option', { value: 'stopped' }, t('stopped')),
            h('option', { value: 'paused' }, t('paused')),
            h('option', { value: 'other' }, t('other')),
          ),
          h(
            'select',
            { className: 'rsm-select', style: { width: 'auto', maxWidth: 210 }, value: project, onChange: (event) => setProject(event.target.value), 'aria-label': t('project') },
            h('option', { value: '' }, t('allProjects')),
            projects.map((entry) => h('option', { key: entry.name, value: entry.name }, `${entry.name} (${entry.count})`)),
            data?.summary?.standalone ? h('option', { value: '__standalone__' }, `${t('standalone')} (${data.summary.standalone})`) : null,
          ),
          h(
            'select',
            { className: 'rsm-select', style: { width: 'auto' }, value: sort, onChange: (event) => setSort(event.target.value), 'aria-label': t('sort') },
            h('option', { value: 'name' }, `${t('sort')}: ${t('sortName')}`),
            h('option', { value: 'state' }, `${t('sort')}: ${t('sortState')}`),
            h('option', { value: 'project' }, `${t('sort')}: ${t('sortProject')}`),
          ),
          h(
            'select',
            { className: 'rsm-select', style: { width: 'auto' }, value: pageSize, onChange: (event) => setPageSize(Number(event.target.value)), 'aria-label': t('pageSize') },
            [25, 50, 100, 200].map((size) => h('option', { key: size, value: size }, `${size} / ${t('pageSize')}`)),
          ),
          h(
            'select',
            { className: 'rsm-select', style: { width: 'auto' }, value: autoSeconds, onChange: (event) => setAutoSeconds(Number(event.target.value)), 'aria-label': t('autoRefresh') },
            h('option', { value: 0 }, `${t('autoRefresh')}: ${t('off')}`),
            [15, 30, 60].map((value) => h('option', { key: value, value }, `${t('autoRefresh')}: ${t('seconds', { count: value })}`)),
          ),
          h('span', { className: 'rsm-spacer' }),
          data
            ? h('span', { className: 'rsm-count-pill' }, t('lastUpdated', { time: shortTime(data.fetchedAt) }))
            : null,
          h(
            'button',
            { type: 'button', className: 'rsm-btn icon-only', onClick: refresh, title: t('refresh'), disabled: dataState.loading },
            h(Icon, { name: 'refresh', size: 14, className: dataState.loading ? 'rsm-spin-icon' : '' }),
          ),
        ),
        selectedIds.length > 0
          ? h(
              'div',
              { className: 'rsm-toolbar', style: { borderTop: '1px solid var(--dsw-alias-border-l1)', background: 'color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, var(--dsw-alias-bg-layer-1))' } },
              h('span', { style: { fontWeight: 600 } }, t('batchSelected', { count: selectedIds.length })),
              h('span', { className: 'rsm-spacer' }),
              h(
                'button',
                { type: 'button', className: 'rsm-btn', onClick: () => runAction('restart', selectedIds), disabled: busyIds.size > 0 },
                h(Icon, { name: 'restart', size: 13 }),
                t('batchRestart'),
              ),
              h(
                'button',
                { type: 'button', className: 'rsm-btn danger', onClick: () => runAction('stop', selectedIds), disabled: busyIds.size > 0 },
                h(Icon, { name: 'stop', size: 13 }),
                t('batchStop'),
              ),
              h('button', { type: 'button', className: 'rsm-btn ghost small', onClick: () => setSelected(new Set()) }, t('clearSelection')),
            )
          : null,
        dockerError
          ? h(
              'div',
              { className: 'rsm-alert' + (dockerError.code === 'docker_permission' ? ' warn' : '') },
              h(Icon, { name: 'warning' }),
              h(
                'div',
                { style: { flex: 1, minWidth: 0 } },
                h('div', { style: { fontWeight: 600 } }, dockerError.code === 'docker_unavailable' ? t('dockerUnavailable') : t('loadFailed')),
                h('div', { style: { fontSize: 12, marginTop: 2, whiteSpace: 'pre-wrap' } }, errorText(dockerError)),
                dockerError.code === 'docker_unavailable' || dockerError.code === 'docker_permission'
                  ? h('div', { className: 'rsm-hint' }, t('dockerUnavailableHint'))
                  : null,
              ),
              h('button', { type: 'button', className: 'rsm-btn small', onClick: refresh }, t('retry')),
            )
          : null,
        h(
          'div',
          { className: 'rsm-table-wrap' },
          dataState.loading && !data
            ? h(Loading, { t })
            : !data || items.length === 0
              ? h(EmptyState, {
                  icon: 'docker',
                  title: t('noContainers'),
                  body: t('noContainersHint'),
                  t,
                  action: h('button', { type: 'button', className: 'rsm-btn', onClick: refresh }, h(Icon, { name: 'refresh' }), t('refresh')),
                })
              : h(
                  'table',
                  { className: 'rsm-table' },
                  h(
                    'thead',
                    null,
                    h(
                      'tr',
                      null,
                      h(
                        'th',
                        { style: { width: 28 } },
                        checkbox(
                          allPageSelected,
                          (checked) => toggleAll(checked),
                          t('selectAllPage'),
                        ),
                      ),
                      h('th', null, t('container')),
                      h('th', { style: { width: 92 } }, t('state')),
                      h('th', { className: 'hide-sm' }, t('status')),
                      h('th', { className: 'hide-md' }, t('ports')),
                      h('th', { style: { width: 130, textAlign: 'right' } }, t('actions')),
                    ),
                  ),
                  h(
                    'tbody',
                    null,
                    items.map((item) => {
                      const isBusy = busyIds.has(item.id);
                      const isSelected = selected.has(item.id);
                      const canStop = item.state === 'running' || item.state === 'paused' || item.state === 'restarting';
                      const canStart = ['exited', 'created', 'dead'].includes(item.state);
                      return h(
                        'tr',
                        { key: item.id, className: isSelected ? 'selected' : '' },
                        h('td', null, checkbox(isSelected, (checked) => toggleOne(item.id, checked), item.name)),
                        h(
                          'td',
                          { className: 'name-cell' },
                          h(
                            'div',
                            { style: { display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 } },
                            h('span', { className: 'rsm-dot ' + stateBadgeClass(item.state) }),
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'rsm-btn ghost small',
                                style: { padding: 0, minHeight: 0, height: 'auto', fontWeight: 600, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' },
                                onClick: () => setDetailId(item.id),
                                title: item.name,
                              },
                              item.name,
                            ),
                          ),
                          item.project || item.service
                            ? h('div', { className: 'sub' }, [item.project, item.service].filter(Boolean).join(' / '))
                            : h('div', { className: 'sub rsm-mono' }, item.id.slice(0, 12)),
                        ),
                        h(
                          'td',
                          null,
                          h('span', { className: `rsm-badge ${stateBadgeClass(item.state)}` }, containerStateText(item.state, t)),
                        ),
                        h('td', { className: 'hide-sm' }, h('div', { className: 'rsm-ellipsis', title: item.status }, item.status || '—')),
                        h('td', { className: 'hide-md' }, h('div', { className: 'rsm-ellipsis rsm-mono', title: item.ports }, item.ports || '—')),
                        h(
                          'td',
                          null,
                          h(
                            'div',
                            { className: 'rsm-row-actions' },
                            isBusy
                              ? h('span', { className: 'rsm-spinner' })
                              : [
                                  canStop
                                    ? h(
                                        'button',
                                        {
                                          key: 'stop',
                                          type: 'button',
                                          className: 'rsm-btn small icon-only',
                                          title: t('stop'),
                                          'aria-label': `${t('stop')} ${item.name}`,
                                          onClick: () => runAction('stop', [item.id], item),
                                        },
                                        h(Icon, { name: 'stop', size: 13 }),
                                      )
                                    : null,
                                  canStart
                                    ? h(
                                        'button',
                                        {
                                          key: 'start',
                                          type: 'button',
                                          className: 'rsm-btn small icon-only',
                                          title: t('start'),
                                          'aria-label': `${t('start')} ${item.name}`,
                                          onClick: () => runAction('start', [item.id], item),
                                        },
                                        h(Icon, { name: 'play', size: 13 }),
                                      )
                                    : null,
                                  h(
                                    'button',
                                    {
                                      key: 'restart',
                                      type: 'button',
                                      className: 'rsm-btn small icon-only',
                                      title: t('restart'),
                                      'aria-label': `${t('restart')} ${item.name}`,
                                      onClick: () => runAction('restart', [item.id], item),
                                    },
                                    h(Icon, { name: 'restart', size: 13 }),
                                  ),
                                  h(
                                    'button',
                                    {
                                      key: 'detail',
                                      type: 'button',
                                      className: 'rsm-btn small icon-only',
                                      title: t('containerDetail'),
                                      'aria-label': `${t('containerDetail')} ${item.name}`,
                                      onClick: () => setDetailId(item.id),
                                    },
                                    h(Icon, { name: 'info', size: 13 }),
                                  ),
                                ],
                          ),
                        ),
                      );
                    }),
                  ),
                ),
        ),
        data
          ? h(Pager, {
              page: data.page,
              totalPages: data.totalPages,
              total: data.total,
              pageSize: data.pageSize,
              onPage: (next) => {
                setPage(next);
                setSelected(new Set());
              },
              t,
            })
          : null,
        detailId
          ? h(ContainerDetailModal, {
              server,
              containerId: detailId,
              onClose: () => setDetailId(null),
              t,
            })
          : null,
      );
    }

    function DockerSourcesModal({ server, t, notify, setConfirmState, onClose, onChanged }) {
      const [dataState, reload] = useRemote((signal) => api(serverPath(server.id, '/docker-sources'), { signal }), [server.id]);
      const [mirrors, setMirrors] = React.useState([]);
      const [custom, setCustom] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [output, setOutput] = React.useState('');
      const [backup, setBackup] = React.useState('');
      const data = dataState.value;

      React.useEffect(() => {
        if (data) setMirrors(Array.isArray(data.mirrors) ? data.mirrors : []);
      }, [data]);

      const addMirror = (value) => {
        const next = String(value || '').trim().replace(/\/+$/, '');
        if (!next) return;
        setMirrors((current) => (current.includes(next) ? current : [...current, next]));
        setCustom('');
      };

      const save = async (nextMirrors) => {
        setBusy(true);
        setError('');
        try {
          const result = await api(serverPath(server.id, '/docker-sources/action'), {
            method: 'POST',
            body: { action: 'save', mirrors: nextMirrors },
          });
          notify(t('dockerSourceSaved'));
          setOutput(result?.output || '');
          setBackup(result?.backup || '');
          await reload();
          onChanged?.();
          return result;
        } catch (failure) {
          setError(errorText(failure));
          throw failure;
        } finally {
          setBusy(false);
        }
      };

      const confirmSave = (nextMirrors) => {
        const clearing = nextMirrors.length === 0;
        const confirm = {
          title: t('dockerSources'),
          body: clearing ? t('dockerClearConfirm') : t('dockerSaveConfirm', { count: nextMirrors.length }),
          danger: true,
          confirmLabel: clearing ? t('dockerClearMirrors') : t('dockerSave'),
          onConfirm: () => save(nextMirrors),
        };
        if (setConfirmState) setConfirmState(confirm);
        else save(nextMirrors).catch(() => {});
      };

      return h(
        Modal,
        {
          title: t('dockerSources'),
          onClose: busy ? () => {} : onClose,
          wide: true,
          footer: [
            h('button', { key: 'close', type: 'button', className: 'rsm-btn', onClick: onClose, disabled: busy }, t('close')),
            mirrors.length
              ? h(
                  'button',
                  { key: 'clear', type: 'button', className: 'rsm-btn', onClick: () => confirmSave([]), disabled: busy || !data?.canManage },
                  t('dockerClearMirrors'),
                )
              : null,
            h(
              'button',
              {
                key: 'save',
                type: 'button',
                className: 'rsm-btn primary',
                onClick: () => confirmSave(mirrors),
                disabled: busy || !data?.canManage,
              },
              busy ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: 'check', size: 14 }),
              t('dockerSave'),
            ),
          ],
        },
        dataState.loading && !data
          ? h(Loading, { t, label: t('loadingDockerSources') })
          : dataState.error && !data
            ? h(ErrorAlert, { error: dataState.error, onRetry: reload, t })
            : data
              ? h(
                  'div',
                  { className: 'rsm-form' },
                  data.valid
                    ? null
                    : h(
                        'div',
                        { className: 'rsm-alert' },
                        h(Icon, { name: 'warning', size: 14 }),
                        h('div', null, `${t('dockerSourceInvalid')}: ${data.invalidReason || ''}`),
                      ),
                  data.canManage
                    ? null
                    : h('div', { className: 'rsm-alert' }, h(Icon, { name: 'lock', size: 14 }), h('div', null, t('aptSudoUnavailable'))),
                  h(
                    'div',
                    { className: 'rsm-form-row' },
                    h('label', { className: 'rsm-field-label' }, t('dockerSourceConfig')),
                    h('div', { className: 'rsm-form-static rsm-mono' }, data.configPath, data.exists ? '' : ` (${t('dockerNoConfig')})`),
                  ),
                  h(
                    'div',
                    { className: 'rsm-form-row' },
                    h('label', { className: 'rsm-field-label' }, t('dockerActiveMirrors')),
                    h(
                      'div',
                      { className: 'rsm-form-static' },
                      data.activeMirrors?.length
                        ? data.activeMirrors.map((mirror) => h('div', { key: mirror, className: 'rsm-mono rsm-ellipsis', title: mirror }, mirror))
                        : h('span', { className: 'rsm-muted' }, t('dockerNoMirrors')),
                    ),
                  ),
                  h('div', { className: 'rsm-form-sep' }),
                  h(
                    'div',
                    { className: 'rsm-form-row' },
                    h('label', { className: 'rsm-field-label' }, t('dockerMirrors')),
                    mirrors.length
                      ? h(
                          'div',
                          { style: { display: 'grid', gap: 6 } },
                          mirrors.map((mirror) =>
                            h(
                              'div',
                              {
                                key: mirror,
                                style: {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '6px 8px',
                                  border: '1px solid rgba(128,128,128,.25)',
                                  borderRadius: 6,
                                },
                              },
                              h('span', { className: 'rsm-mono rsm-ellipsis', style: { flex: 1, minWidth: 0 }, title: mirror }, mirror),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'rsm-btn ghost icon-only small',
                                  onClick: () => setMirrors((current) => current.filter((item) => item !== mirror)),
                                  disabled: busy,
                                  title: t('remove'),
                                },
                                h(Icon, { name: 'trash', size: 13 }),
                              ),
                            ),
                          ),
                        )
                      : h('span', { className: 'rsm-muted' }, t('dockerNoMirrors')),
                  ),
                  h(
                    'div',
                    { className: 'rsm-form-row' },
                    h('label', { className: 'rsm-field-label' }, t('dockerAddMirror')),
                    h(
                      'div',
                      { style: { display: 'flex', gap: 8 } },
                      h('input', {
                        className: 'rsm-input rsm-mono',
                        value: custom,
                        onChange: (event) => setCustom(event.target.value),
                        placeholder: 'https://docker.m.daocloud.io',
                        disabled: busy,
                        onKeyDown: (event) => {
                          if (event.key === 'Enter') addMirror(custom);
                        },
                      }),
                      h(
                        'button',
                        { type: 'button', className: 'rsm-btn', onClick: () => addMirror(custom), disabled: busy || !custom.trim() },
                        h(Icon, { name: 'plus', size: 13 }),
                        t('add'),
                      ),
                    ),
                    h('div', { className: 'sub', style: { marginTop: 6 } }, t('dockerMirrorPlaceholder')),
                  ),
                  data.presets?.length
                    ? h(
                        'div',
                        { className: 'rsm-form-row' },
                        h('label', { className: 'rsm-field-label' }, t('dockerPresetHint')),
                        h(
                          'div',
                          { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                          data.presets.map((preset) =>
                            h(
                              'button',
                              {
                                key: preset.id,
                                type: 'button',
                                className: 'rsm-btn small',
                                onClick: () => addMirror(preset.url),
                                disabled: busy || mirrors.includes(preset.url),
                              },
                              t(`dockerMirror_${preset.id}`) || preset.label,
                            ),
                          ),
                        ),
                      )
                    : null,
                  h('div', { className: 'rsm-alert warn', style: { margin: '10px 0 0' } }, h(Icon, { name: 'warning', size: 14 }), h('div', null, t('dockerRestartWarning'))),
                  h('div', { className: 'sub', style: { marginTop: 8 } }, t('dockerSourceHint')),
                  error ? h('div', { className: 'rsm-alert', style: { marginTop: 10 } }, h(Icon, { name: 'warning', size: 14 }), h('div', null, error)) : null,
                  backup ? h('div', { className: 'sub', style: { marginTop: 8 } }, `${t('dockerBackup')}: `, h('span', { className: 'rsm-mono' }, backup)) : null,
                  output
                    ? h(
                        'details',
                        { style: { marginTop: 8 } },
                        h('summary', { className: 'sub', style: { cursor: 'pointer' } }, t('aptOutput')),
                        h('pre', { className: 'rsm-mono', style: { maxHeight: 160, overflow: 'auto', whiteSpace: 'pre-wrap', margin: '6px 0 0' } }, output),
                      )
                    : null,
                )
              : null,
      );
    }

    function ImagesView({ server, t, notify, setConfirmState }) {
      const [query, setQuery] = React.useState('');
      const [debouncedQuery, setDebouncedQuery] = React.useState('');
      const [dangling, setDangling] = React.useState('all');
      const [sort, setSort] = React.useState('name');
      const [page, setPage] = React.useState(1);
      const [pageSize, setPageSize] = React.useState(50);
      const [refreshToken, setRefreshToken] = React.useState(0);
      const [autoSeconds, setAutoSeconds] = React.useState(0);
      const [sourcesOpen, setSourcesOpen] = React.useState(false);

      React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 280);
        return () => clearTimeout(timer);
      }, [query]);

      React.useEffect(() => {
        setPage(1);
      }, [debouncedQuery, dangling, sort, pageSize]);

      React.useEffect(() => {
        if (!autoSeconds) return undefined;
        const timer = setInterval(() => setRefreshToken((value) => value + 1), autoSeconds * 1000);
        return () => clearInterval(timer);
      }, [autoSeconds]);

      const [dataState] = useRemote(
        (signal) => {
          const params = new URLSearchParams({
            q: debouncedQuery,
            dangling,
            sort,
            page: String(page),
            pageSize: String(pageSize),
            refresh: refreshToken ? '1' : '0',
          });
          return api(serverPath(server.id, '/images') + `?${params.toString()}`, { signal });
        },
        [server.id, debouncedQuery, dangling, sort, page, pageSize, refreshToken],
      );

      const data = dataState.value;
      const items = data?.items || [];
      const summary = data?.summary;
      const dockerError = dataState.error;
      const refresh = () => setRefreshToken((value) => value + 1);

      return h(
        'div',
        { className: 'rsm-content flush' },
        h(
          'div',
          { className: 'rsm-summary' },
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('totalImages')),
            h('div', { className: 'rsm-stat-value' }, summary ? summary.total : '—'),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('taggedImages')),
            h('div', { className: 'rsm-stat-value success' }, summary ? summary.tagged : '—'),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('danglingImages')),
            h('div', { className: 'rsm-stat-value warn' }, summary ? summary.dangling : '—'),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('imageDiskSize')),
            h('div', { className: 'rsm-stat-value' }, summary ? formatBytes(summary.sizeBytes) : '—'),
          ),
        ),
        h(
          'div',
          { className: 'rsm-toolbar' },
          h(
            'div',
            { className: 'rsm-search' },
            h(Icon, { name: 'search', size: 14 }),
            h('input', {
              className: 'rsm-input',
              value: query,
              onChange: (event) => setQuery(event.target.value),
              placeholder: t('searchImages'),
              'aria-label': t('searchImages'),
            }),
          ),
          h(
            'select',
            { className: 'rsm-select', style: { width: 'auto' }, value: dangling, onChange: (event) => setDangling(event.target.value), 'aria-label': t('imageFilter') },
            h('option', { value: 'all' }, t('allImages')),
            h('option', { value: 'tagged' }, t('taggedImages')),
            h('option', { value: 'dangling' }, t('danglingImages')),
          ),
          h(
            'select',
            { className: 'rsm-select', style: { width: 'auto' }, value: sort, onChange: (event) => setSort(event.target.value), 'aria-label': t('sort') },
            h('option', { value: 'name' }, `${t('sort')}: ${t('sortName')}`),
            h('option', { value: 'size' }, `${t('sort')}: ${t('sortSize')}`),
            h('option', { value: 'created' }, `${t('sort')}: ${t('sortCreated')}`),
            h('option', { value: 'id' }, `${t('sort')}: ${t('imageId')}`),
          ),
          h(
            'select',
            { className: 'rsm-select', style: { width: 'auto' }, value: pageSize, onChange: (event) => setPageSize(Number(event.target.value)), 'aria-label': t('pageSize') },
            [25, 50, 100, 200].map((size) => h('option', { key: size, value: size }, `${size} / ${t('pageSize')}`)),
          ),
          h(
            'select',
            { className: 'rsm-select', style: { width: 'auto' }, value: autoSeconds, onChange: (event) => setAutoSeconds(Number(event.target.value)), 'aria-label': t('autoRefresh') },
            h('option', { value: 0 }, `${t('autoRefresh')}: ${t('off')}`),
            [15, 30, 60].map((value) => h('option', { key: value, value }, `${t('autoRefresh')}: ${t('seconds', { count: value })}`)),
          ),
          h('span', { className: 'rsm-spacer' }),
          data
            ? h('span', { className: 'rsm-count-pill' }, t('lastUpdated', { time: shortTime(data.fetchedAt) }))
            : null,
          h(
            'button',
            { type: 'button', className: 'rsm-btn small', onClick: () => setSourcesOpen(true), title: t('dockerSources') },
            h(Icon, { name: 'server', size: 14 }),
            t('dockerSources'),
          ),
          h(
            'button',
            { type: 'button', className: 'rsm-btn icon-only', onClick: refresh, title: t('refresh'), disabled: dataState.loading },
            h(Icon, { name: 'refresh', size: 14, className: dataState.loading ? 'rsm-spin-icon' : '' }),
          ),
        ),
        dockerError
          ? h(
              'div',
              { className: 'rsm-alert' + (dockerError.code === 'docker_permission' ? ' warn' : '') },
              h(Icon, { name: 'warning' }),
              h(
                'div',
                { style: { flex: 1, minWidth: 0 } },
                h('div', { style: { fontWeight: 600 } }, dockerError.code === 'docker_unavailable' ? t('dockerUnavailable') : t('loadFailed')),
                h('div', { style: { fontSize: 12, marginTop: 2, whiteSpace: 'pre-wrap' } }, errorText(dockerError)),
                dockerError.code === 'docker_unavailable' || dockerError.code === 'docker_permission'
                  ? h('div', { className: 'rsm-hint' }, t('dockerUnavailableHint'))
                  : null,
              ),
              h('button', { type: 'button', className: 'rsm-btn small', onClick: refresh }, t('retry')),
            )
          : null,
        h(
          'div',
          { className: 'rsm-table-wrap' },
          dataState.loading && !data
            ? h(Loading, { t })
            : !data || items.length === 0
              ? h(EmptyState, {
                  icon: 'layers',
                  title: t('noImages'),
                  body: t('noImagesHint'),
                  t,
                  action: h('button', { type: 'button', className: 'rsm-btn', onClick: refresh }, h(Icon, { name: 'refresh' }), t('refresh')),
                })
              : h(
                  'table',
                  { className: 'rsm-table' },
                  h(
                    'thead',
                    null,
                    h(
                      'tr',
                      null,
                      h('th', null, t('repositoryTag')),
                      h('th', { className: 'hide-md' }, t('imageId')),
                      h('th', { style: { width: 110 } }, t('size')),
                      h('th', { className: 'hide-sm' }, t('created')),
                      h('th', { className: 'hide-md' }, t('digest')),
                    ),
                  ),
                  h(
                    'tbody',
                    null,
                    items.map((item) => {
                      const primary = item.repoTags[0] || t('danglingImage');
                      return h(
                        'tr',
                        { key: item.id },
                        h(
                          'td',
                          { className: 'name-cell' },
                          h(
                            'div',
                            { style: { display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 } },
                            item.dangling ? h('span', { className: 'rsm-badge muted' }, t('dangling')) : null,
                            h('span', { className: 'rsm-mono rsm-ellipsis', title: item.repoTags.join('\n') || t('danglingImage'), style: { fontWeight: 600 } }, primary),
                          ),
                          h(
                            'div',
                            { className: 'sub' },
                            item.repoTags.length > 1
                              ? `+${item.repoTags.length - 1} ${t('tags')}`
                              : item.shortId,
                          ),
                        ),
                        h(
                          'td',
                          { className: 'hide-md' },
                          h('div', { className: 'rsm-ellipsis rsm-mono', title: item.id }, item.shortId),
                        ),
                        h('td', null, item.size || '—'),
                        h('td', { className: 'hide-sm' }, h('div', { className: 'rsm-ellipsis', title: item.createdAt }, item.createdSince || item.createdAt || '—')),
                        h(
                          'td',
                          { className: 'hide-md' },
                          h('div', { className: 'rsm-ellipsis rsm-mono', title: item.digest }, item.digest ? item.digest.replace(/^sha256:/, '').slice(0, 16) : '—'),
                        ),
                      );
                    }),
                  ),
                ),
        ),
        data
          ? h(Pager, {
              page: data.page,
              totalPages: data.totalPages,
              total: data.total,
              pageSize: data.pageSize,
              onPage: setPage,
              t,
            })
          : null,
        sourcesOpen
          ? h(DockerSourcesModal, {
              server,
              t,
              notify,
              setConfirmState,
              onClose: () => setSourcesOpen(false),
              onChanged: refresh,
            })
          : null,
      );
    }

    function FirewallView({ server, t, notify, setConfirmState }) {
      const [dataState, reload] = useRemote((signal) => api(serverPath(server.id, '/firewall'), { signal }), [server.id]);
      const [port, setPort] = React.useState('');
      const [protocol, setProtocol] = React.useState('tcp');
      const [service, setService] = React.useState('');
      const [busy, setBusy] = React.useState('');
      const info = dataState.value;

      const applyAction = async (action, payload) => {
        const result = await api(serverPath(server.id, '/firewall/action'), {
          method: 'POST',
          body: { action, ...payload },
        });
        notify(result?.message || t('firewallUpdated'));
        reload();
        return result;
      };

      const run = async (action, payload) => {
        setBusy(action);
        try {
          await applyAction(action, payload);
        } catch (error) {
          notify(errorText(error), 'error');
        } finally {
          setBusy('');
        }
      };

      const openPort = () => {
        const value = Number(port);
        if (!Number.isInteger(value) || value < 1 || value > 65535) {
          notify(t('invalidPort'), 'error');
          return;
        }
        run('open_port', { port: value, protocol });
      };

      const allowService = () => {
        const value = service.trim();
        if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(value)) {
          notify(t('invalidService'), 'error');
          return;
        }
        run('allow_service', { service: value });
      };

      const removeRule = (rule) => {
        setConfirmState({
          title: t('removeFirewallRule'),
          body: t('removeFirewallRuleHint', { target: rule.target }),
          danger: true,
          confirmLabel: t('remove'),
          onConfirm: async () => {
            if (rule.kind === 'ufw') await applyAction('delete_rule', { id: rule.id });
            else if (rule.kind === 'port') await applyAction('close_port', { port: rule.port, protocol: rule.protocol || 'tcp', zone: rule.zone });
            else if (rule.kind === 'service') await applyAction('remove_service', { service: rule.service || rule.target, zone: rule.zone });
            else throw new Error(t('ruleNotRemovable'));
          },
        });
      };

      if (dataState.loading && !info) return h(Loading, { t, label: t('loadingFirewall') });
      if (dataState.error && !info) return h(ErrorAlert, { error: dataState.error, onRetry: reload, t });

      return h(
        'div',
        { className: 'rsm-content flush' },
        h(
          'div',
          { className: 'rsm-summary' },
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('firewallBackend')),
            h('div', { className: 'rsm-stat-value', style: { fontSize: 18 } }, info?.backend || '—'),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('firewallStatus')),
            h(
              'div',
              { className: `rsm-stat-value ${info?.active ? 'success' : 'warn'}` },
              info ? (info.active ? t('active') : t('inactive')) : '—',
            ),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('firewallZone')),
            h('div', { className: 'rsm-stat-value', style: { fontSize: 16 } }, info?.zone || info?.defaultPolicy || '—'),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('firewallRules')),
            h('div', { className: 'rsm-stat-value' }, info ? info.rules.length : '—'),
          ),
        ),
        info?.message
          ? h(
              'div',
              { className: 'rsm-alert', style: { margin: '12px 16px 0' } },
              h(Icon, { name: 'warning', size: 14 }),
              h('div', { style: { flex: 1, minWidth: 0 } }, info.message),
            )
          : null,
        info?.canManage
          ? h(
              'div',
              { className: 'rsm-toolbar' },
              h('span', { style: { fontWeight: 600 } }, t('openPort')),
              h('input', {
                className: 'rsm-input',
                style: { width: 100 },
                type: 'number',
                min: 1,
                max: 65535,
                value: port,
                onChange: (event) => setPort(event.target.value),
                placeholder: '8080',
                'aria-label': t('port'),
              }),
              h(
                'select',
                { className: 'rsm-select', style: { width: 'auto' }, value: protocol, onChange: (event) => setProtocol(event.target.value), 'aria-label': t('protocol') },
                ['tcp', 'udp'].map((value) => h('option', { key: value, value }, value.toUpperCase())),
              ),
              h(
                'button',
                { type: 'button', className: 'rsm-btn primary', onClick: openPort, disabled: Boolean(busy) },
                busy === 'open_port' ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: 'plus', size: 13 }),
                t('openPort'),
              ),
              info.capabilities?.services
                ? h(
                    React.Fragment,
                    null,
                    h('span', { className: 'rsm-spacer' }),
                    h('span', { style: { fontWeight: 600 } }, t('allowService')),
                    h('input', {
                      className: 'rsm-input',
                      style: { width: 130 },
                      value: service,
                      onChange: (event) => setService(event.target.value),
                      placeholder: 'https',
                      'aria-label': t('service'),
                    }),
                    h(
                      'button',
                      { type: 'button', className: 'rsm-btn', onClick: allowService, disabled: Boolean(busy) },
                      busy === 'allow_service' ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: 'check', size: 13 }),
                      t('allow'),
                    ),
                  )
                : null,
              h('span', { className: 'rsm-spacer' }),
              !info.active && info.capabilities?.enable
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'rsm-btn',
                      onClick: () =>
                        setConfirmState({
                          title: t('enableFirewall'),
                          body: t('enableFirewallHint', { port: info.sshPort }),
                          danger: true,
                          confirmLabel: t('enable'),
                          onConfirm: () => applyAction('enable', {}),
                        }),
                      disabled: Boolean(busy),
                    },
                    h(Icon, { name: 'play', size: 13 }),
                    t('enable'),
                  )
                : null,
              info.capabilities?.reload
                ? h(
                    'button',
                    { type: 'button', className: 'rsm-btn', onClick: () => run('reload', {}), disabled: Boolean(busy) },
                    busy === 'reload' ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: 'restart', size: 13 }),
                    t('reload'),
                  )
                : null,
              h(
                'button',
                { type: 'button', className: 'rsm-btn icon-only', onClick: reload, disabled: dataState.loading, title: t('refresh') },
                h(Icon, { name: 'refresh', size: 14, className: dataState.loading ? 'rsm-spin-icon' : '' }),
              ),
            )
          : null,
        h(
          'div',
          { className: 'rsm-table-wrap' },
          !info
            ? null
            : info.rules.length === 0
              ? h(EmptyState, { icon: 'shield', title: t('noFirewallRules'), body: t('noFirewallRulesHint'), t })
              : h(
                  'table',
                  { className: 'rsm-table' },
                  h(
                    'thead',
                    null,
                    h(
                      'tr',
                      null,
                      h('th', null, t('ruleType')),
                      h('th', null, t('ruleTarget')),
                      h('th', { className: 'hide-sm' }, t('ruleAction')),
                      h('th', { className: 'hide-md' }, t('ruleSource')),
                      h('th', { style: { width: 54 } }, ''),
                    ),
                  ),
                  h(
                    'tbody',
                    null,
                    info.rules.map((rule) =>
                      h(
                        'tr',
                        { key: rule.id },
                        h('td', null, h('span', { className: 'rsm-badge muted' }, t(`fwKind_${rule.kind}`) || rule.kind)),
                        h(
                          'td',
                          null,
                          h('div', { className: 'rsm-mono rsm-ellipsis', title: rule.target, style: { fontWeight: 600 } }, rule.target),
                          rule.staged ? h('div', { className: 'sub' }, h('span', { className: 'rsm-badge warn' }, t('staged'))) : null,
                          rule.sshProtected ? h('div', { className: 'sub' }, t('sshProtected')) : null,
                        ),
                        h('td', { className: 'hide-sm' }, rule.action || '—'),
                        h('td', { className: 'hide-md' }, h('div', { className: 'rsm-ellipsis' }, rule.source || rule.zone || '—')),
                        h(
                          'td',
                          null,
                          rule.canDelete
                            ? h(
                                'button',
                                { type: 'button', className: 'rsm-btn ghost icon-only small', onClick: () => removeRule(rule), title: t('remove') },
                                h(Icon, { name: 'trash', size: 13 }),
                              )
                            : h(Icon, { name: 'lock', size: 13, className: 'rsm-muted' }),
                        ),
                      ),
                    ),
                  ),
                ),
        ),
        info
          ? h(
              'div',
              { className: 'rsm-toolbar', style: { justifyContent: 'flex-end' } },
              h('span', { className: 'rsm-count-pill' }, t('lastUpdated', { time: shortTime(info.fetchedAt) })),
            )
          : null,
      );
    }

    function AptSourcesModal({ server, t, notify, setConfirmState, onClose, onChanged }) {
      const [dataState, reload] = useRemote((signal) => api(serverPath(server.id, '/apt-sources'), { signal }), [server.id]);
      const [mirror, setMirror] = React.useState('official');
      const [custom, setCustom] = React.useState('');
      const [busy, setBusy] = React.useState('');
      const [error, setError] = React.useState('');
      const [output, setOutput] = React.useState('');
      const [backup, setBackup] = React.useState('');
      const data = dataState.value;
      const mirrors = data?.mirrors || [];

      React.useEffect(() => {
        if (!data) return;
        setMirror(data.currentMirrorId || mirrors[0]?.id || 'official');
      }, [data]);

      const selectedLabel =
        mirror === 'custom' ? t('aptCustom') : mirrors.find((item) => item.id === mirror)?.label || mirror;

      const run = async (action) => {
        setBusy(action);
        setError('');
        try {
          const result = await api(serverPath(server.id, '/apt-sources/action'), {
            method: 'POST',
            body: {
              action,
              mirror,
              customUrl: mirror === 'custom' ? custom.trim() : undefined,
            },
          });
          notify(action === 'update' ? t('aptSourceUpdated') : t('aptSourceChanged'));
          setOutput(result?.output || '');
          setBackup(result?.backup || '');
          await reload();
          onChanged?.();
          return result;
        } catch (failure) {
          setError(errorText(failure));
          throw failure;
        } finally {
          setBusy('');
        }
      };

      const requestSwitch = () => {
        const confirm = {
          title: t('aptSwitchSource'),
          body: t('aptSwitchConfirm', { mirror: selectedLabel }),
          danger: true,
          confirmLabel: t('aptSwitchAndUpdate'),
          onConfirm: () => run('switch'),
        };
        if (setConfirmState) setConfirmState(confirm);
        else run('switch').catch(() => {});
      };

      return h(
        Modal,
        {
          title: t('aptSources'),
          onClose: busy ? () => {} : onClose,
          wide: true,
          footer: [
            h('button', { key: 'close', type: 'button', className: 'rsm-btn', onClick: onClose, disabled: Boolean(busy) }, t('close')),
            h(
              'button',
              {
                key: 'update',
                type: 'button',
                className: 'rsm-btn',
                onClick: () => run('update').catch(() => {}),
                disabled: Boolean(busy) || !data?.canManage,
              },
              busy === 'update' ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: 'refresh', size: 14 }),
              t('aptUpdateIndex'),
            ),
            h(
              'button',
              {
                key: 'switch',
                type: 'button',
                className: 'rsm-btn primary',
                onClick: requestSwitch,
                disabled: Boolean(busy) || !data?.canManage || (mirror === 'custom' && !custom.trim()),
              },
              busy === 'switch' ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: 'server', size: 14 }),
              t('aptSwitchAndUpdate'),
            ),
          ],
        },
        dataState.loading && !data
          ? h(Loading, { t, label: t('loadingAptSources') })
          : dataState.error && !data
            ? h(ErrorAlert, { error: dataState.error, onRetry: reload, t })
            : data
              ? h(
                  'div',
                  { className: 'rsm-form' },
                  data.supported
                    ? null
                    : h('div', { className: 'rsm-alert' }, h(Icon, { name: 'warning', size: 14 }), h('div', null, t('aptNotSupported'))),
                  data.canManage
                    ? null
                    : h('div', { className: 'rsm-alert' }, h(Icon, { name: 'lock', size: 14 }), h('div', null, t('aptSudoUnavailable'))),
                  h(
                    'div',
                    { className: 'rsm-form-row' },
                    h('label', { className: 'rsm-field-label' }, t('aptDistro')),
                    h(
                      'div',
                      { className: 'rsm-form-static' },
                      `${data.distro.id || '—'} ${data.distro.version || ''} (${data.distro.codename || '—'}) · ${data.distro.arch || '—'}`,
                    ),
                  ),
                  h(
                    'div',
                    { className: 'rsm-form-row' },
                    h('label', { className: 'rsm-field-label' }, t('aptCurrentOrigins')),
                    h(
                      'div',
                      { className: 'rsm-form-static' },
                      data.origins.length
                        ? data.origins.map((origin) => h('div', { key: origin, className: 'rsm-mono rsm-ellipsis', title: origin }, origin))
                        : h('span', { className: 'rsm-muted' }, t('aptNoSource')),
                    ),
                  ),
                  h('div', { className: 'rsm-form-sep' }),
                  h('div', { className: 'rsm-field-label' }, t('aptChooseMirror')),
                  h(
                    'div',
                    { style: { display: 'grid', gap: 6 } },
                    mirrors.map((item) =>
                      h(
                        'label',
                        {
                          key: item.id,
                          className: 'rsm-mirror-option',
                          style: {
                            display: 'flex',
                            gap: 8,
                            alignItems: 'flex-start',
                            padding: '8px 10px',
                            border: `1px solid ${mirror === item.id ? 'var(--rsm-accent, #4f8cff)' : 'rgba(128,128,128,.25)'}`,
                            borderRadius: 6,
                            cursor: 'pointer',
                          },
                        },
                        h('input', {
                          type: 'radio',
                          name: 'apt-mirror',
                          checked: mirror === item.id,
                          onChange: () => setMirror(item.id),
                          disabled: Boolean(busy),
                          style: { marginTop: 3 },
                        }),
                        h(
                          'span',
                          { style: { minWidth: 0 } },
                          h('div', { style: { fontWeight: 600 } }, t(`aptMirror_${item.id}`) || item.label),
                          h('div', { className: 'sub rsm-mono rsm-ellipsis', title: item.base }, item.base),
                        ),
                      ),
                    ),
                    h(
                      'label',
                      {
                        style: {
                          display: 'flex',
                          gap: 8,
                          alignItems: 'flex-start',
                          padding: '8px 10px',
                          border: `1px solid ${mirror === 'custom' ? 'var(--rsm-accent, #4f8cff)' : 'rgba(128,128,128,.25)'}`,
                          borderRadius: 6,
                          cursor: 'pointer',
                        },
                      },
                      h('input', {
                        type: 'radio',
                        name: 'apt-mirror',
                        checked: mirror === 'custom',
                        onChange: () => setMirror('custom'),
                        disabled: Boolean(busy),
                        style: { marginTop: 3 },
                      }),
                      h(
                        'span',
                        { style: { flex: 1, minWidth: 0 } },
                        h('div', { style: { fontWeight: 600 } }, t('aptCustom')),
                        h('input', {
                          className: 'rsm-input rsm-mono',
                          value: custom,
                          onChange: (event) => {
                            setMirror('custom');
                            setCustom(event.target.value);
                          },
                          placeholder: 'https://mirror.example.com/ubuntu',
                          disabled: Boolean(busy),
                          style: { marginTop: 6 },
                        }),
                        h('div', { className: 'sub' }, t('aptCustomHint')),
                      ),
                    ),
                  ),
                  h('div', { className: 'sub', style: { marginTop: 10 } }, t('aptSourceHint')),
                  error ? h('div', { className: 'rsm-alert', style: { marginTop: 10 } }, h(Icon, { name: 'warning', size: 14 }), h('div', null, error)) : null,
                  backup ? h('div', { className: 'sub', style: { marginTop: 8 } }, `${t('aptBackup')}: `, h('span', { className: 'rsm-mono' }, backup)) : null,
                  output
                    ? h(
                        'details',
                        { style: { marginTop: 8 } },
                        h('summary', { className: 'sub', style: { cursor: 'pointer' } }, t('aptOutput')),
                        h('pre', { className: 'rsm-mono', style: { maxHeight: 180, overflow: 'auto', whiteSpace: 'pre-wrap', margin: '6px 0 0' } }, output),
                      )
                    : null,
                )
              : null,
      );
    }

    function ProgramsView({ server, t, notify, setConfirmState }) {
      const forceRefresh = React.useRef(false);
      const [dataState, reload] = useRemote(
        (signal) => {
          const force = forceRefresh.current;
          forceRefresh.current = false;
          return api(serverPath(server.id, `/programs${force ? '?refresh=1' : ''}`), { signal });
        },
        [server.id],
        { cacheKey: `programs:${server.id}`, ttlMs: 5 * 60 * 1000 },
      );
      const refresh = () => {
        forceRefresh.current = true;
        reload();
      };
      const [query, setQuery] = React.useState('');
      const [filter, setFilter] = React.useState('all');
      const [category, setCategory] = React.useState('all');
      const [sourcesOpen, setSourcesOpen] = React.useState(false);
      const data = dataState.value;
      const items = [...(data?.items || [])].sort(
        (left, right) => Number(left.status === 'missing') - Number(right.status === 'missing'),
      );
      const categories = [...new Set(items.map((item) => item.category))].sort();
      const search = query.trim().toLowerCase();
      const filtered = items.filter((item) => {
        if (filter === 'installed' && item.status === 'missing') return false;
        if (filter === 'missing' && item.status !== 'missing') return false;
        if (filter === 'updates' && !item.canInstall && !item.canUpgrade) return false;
        if (category !== 'all' && item.category !== category) return false;
        if (!search) return true;
        return [item.label, item.id, item.command, item.version, item.latestVersion, item.packageName, item.path].some((value) =>
          String(value || '').toLowerCase().includes(search),
        );
      });
      const canManagePackages = data?.packageManager === 'apt' && data?.packageSudo !== 'unavailable';

      const applyProgramAction = async (item, action) => {
        const result = await api(serverPath(server.id, '/programs/action'), {
          method: 'POST',
          body: { action, id: item.id },
        });
        notify(result?.message || t('programUpdated'));
        reload();
        return result;
      };

      const requestAction = (item, action) => {
        setConfirmState({
          title: action === 'install' ? t('installProgram') : t('upgradeProgram'),
          body:
            action === 'install'
              ? t('programInstallHint', { name: item.label, version: item.latestVersion, package: item.packageName })
              : t('programUpgradeHint', { name: item.label, version: item.latestVersion, installed: item.version, package: item.packageName }),
          danger: false,
          confirmLabel: action === 'install' ? t('install') : t('upgrade'),
          onConfirm: () => applyProgramAction(item, action),
        });
      };

      if (dataState.loading && !data) return h(Loading, { t, label: t('loadingPrograms') });
      if (dataState.error && !data) return h(ErrorAlert, { error: dataState.error, onRetry: reload, t });

      return h(
        'div',
        { className: 'rsm-content flush' },
        h(
          'div',
          { className: 'rsm-summary' },
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('programsChecked')),
            h('div', { className: 'rsm-stat-value' }, data ? data.summary.total : '—'),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('programsInstalled')),
            h('div', { className: 'rsm-stat-value success' }, data ? data.summary.installed : '—'),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('programsMissing')),
            h('div', { className: 'rsm-stat-value' }, data ? data.summary.missing : '—'),
          ),
          h(
            'div',
            { className: 'rsm-stat' },
            h('div', { className: 'rsm-stat-label' }, t('programsUpdates')),
            h('div', { className: 'rsm-stat-value warn' }, data ? data.summary.upgradeable : '—'),
          ),
        ),
        data?.warning
          ? h(
              'div',
              { className: 'rsm-alert', style: { margin: '12px 16px 0' } },
              h(Icon, { name: 'warning', size: 14 }),
              h('div', { style: { flex: 1, minWidth: 0 } }, data.warning),
            )
          : null,
        data?.packageManager !== 'apt'
          ? h(
              'div',
              { className: 'rsm-alert', style: { margin: '12px 16px 0' } },
              h(Icon, { name: 'info', size: 14 }),
              h('div', { style: { flex: 1, minWidth: 0 } }, t('packageManagerUnsupported')),
            )
          : data?.packageSudo === 'unavailable'
            ? h(
                'div',
                { className: 'rsm-alert', style: { margin: '12px 16px 0' } },
                h(Icon, { name: 'lock', size: 14 }),
                h('div', { style: { flex: 1, minWidth: 0 } }, t('packageSudoHint')),
              )
            : null,
        h(
          'div',
          { className: 'rsm-toolbar' },
          h(
            'div',
            { className: 'rsm-search' },
            h(Icon, { name: 'search', size: 14 }),
            h('input', {
              className: 'rsm-input',
              value: query,
              onChange: (event) => setQuery(event.target.value),
              placeholder: t('searchPrograms'),
              'aria-label': t('searchPrograms'),
            }),
          ),
          h(
            'select',
            { className: 'rsm-select', style: { width: 'auto' }, value: filter, onChange: (event) => setFilter(event.target.value), 'aria-label': t('status') },
            h('option', { value: 'all' }, t('allPrograms')),
            h('option', { value: 'installed' }, t('programsInstalled')),
            h('option', { value: 'missing' }, t('programsMissing')),
            h('option', { value: 'updates' }, t('actionable')),
          ),
          h(
            'select',
            { className: 'rsm-select', style: { width: 'auto' }, value: category, onChange: (event) => setCategory(event.target.value), 'aria-label': t('category') },
            h('option', { value: 'all' }, t('allCategories')),
            categories.map((value) => h('option', { key: value, value }, t(`cat_${value}`))),
          ),
          h('span', { className: 'rsm-spacer' }),
          data?.packageManager === 'apt'
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'rsm-btn small',
                  onClick: () => setSourcesOpen(true),
                  title: t('aptSources'),
                },
                h(Icon, { name: 'server', size: 14 }),
                t('aptSources'),
              )
            : null,
          data?.packageManager
            ? h('span', { className: 'rsm-count-pill', title: t('packageManager') }, data.packageManager === 'none' ? '—' : data.packageManager.toUpperCase())
            : null,
          h('span', { className: 'rsm-count-pill' }, `${filtered.length} / ${items.length}`),
          h(
            'button',
            { type: 'button', className: 'rsm-btn icon-only', onClick: refresh, disabled: dataState.loading, title: t('refresh') },
            h(Icon, { name: 'refresh', size: 14, className: dataState.loading ? 'rsm-spin-icon' : '' }),
          ),
        ),
        h(
          'div',
          { className: 'rsm-table-wrap' },
          filtered.length === 0
            ? h(EmptyState, { icon: 'package', title: t('noPrograms'), body: t('noProgramsHint'), t })
            : h(
                'table',
                { className: 'rsm-table' },
                h(
                  'thead',
                  null,
                  h(
                    'tr',
                    null,
                    h('th', null, t('program')),
                    h('th', null, t('category')),
                    h('th', null, t('version')),
                    h('th', { className: 'hide-sm' }, t('latestVersion')),
                    h('th', null, t('status')),
                    h('th', { style: { width: 100 } }, t('actions')),
                    h('th', { className: 'hide-md' }, t('path')),
                  ),
                ),
                h(
                  'tbody',
                  null,
                  filtered.map((item) =>
                    h(
                      'tr',
                      { key: item.id },
                      h(
                        'td',
                        { className: 'name-cell' },
                        h('div', { style: { fontWeight: 600 } }, item.label),
                        h('div', { className: 'sub rsm-mono' }, item.command),
                      ),
                      h('td', null, h('span', { className: 'rsm-badge muted' }, t(`cat_${item.category}`))),
                      h(
                        'td',
                        null,
                        item.version
                          ? h('span', { className: 'rsm-mono', title: item.versionRaw || item.version, style: { fontWeight: 600 } }, item.version)
                          : h('span', { className: 'rsm-muted' }, '—'),
                      ),
                      h(
                        'td',
                        { className: 'hide-sm' },
                        item.latestVersion
                          ? h(
                              'span',
                              { className: `rsm-mono${item.canUpgrade ? '' : ' rsm-muted'}`, title: item.packageName || '' },
                              item.latestVersion,
                            )
                          : h('span', { className: 'rsm-muted' }, '—'),
                      ),
                      h(
                        'td',
                        null,
                        item.status === 'missing'
                          ? h('span', { className: 'rsm-badge muted' }, t('notInstalled'))
                          : h(
                              'span',
                              { className: `rsm-badge ${item.status === 'installed' ? 'success' : 'warn'}` },
                              item.status === 'installed' ? t('installed') : t('installedVersionUnknown'),
                            ),
                      ),
                      h(
                        'td',
                        null,
                        item.canInstall
                          ? h(
                              'button',
                              {
                                type: 'button',
                                className: 'rsm-btn primary small',
                                onClick: () => requestAction(item, 'install'),
                                disabled: !canManagePackages,
                                title: canManagePackages ? item.packageName : t('packageSudoHint'),
                              },
                              h(Icon, { name: 'plus', size: 12 }),
                              t('install'),
                            )
                          : item.canUpgrade
                            ? h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'rsm-btn small',
                                  onClick: () => requestAction(item, 'upgrade'),
                                  disabled: !canManagePackages,
                                  title: canManagePackages ? item.packageName : t('packageSudoHint'),
                                },
                                h(Icon, { name: 'upgrade', size: 12 }),
                                t('upgrade'),
                              )
                            : item.latestVersion && item.status !== 'missing'
                              ? item.repoStatus === 'upgrade' && !item.canUpgrade
                                ? h('span', { className: 'rsm-badge muted' }, t('manualUpgrade'))
                                : item.repoStatus === 'older'
                                  ? h('span', { className: 'rsm-badge muted' }, t('repoOlder'))
                                  : h('span', { className: 'rsm-badge success' }, t('upToDate'))
                              : item.status === 'missing'
                                ? h('span', { className: 'rsm-badge muted' }, t('noPackageMapping'))
                                : h('span', { className: 'rsm-muted' }, '—'),
                      ),
                      h(
                        'td',
                        { className: 'hide-md' },
                        h('div', { className: 'rsm-mono rsm-ellipsis', title: item.path }, item.path || '—'),
                      ),
                    ),
                  ),
                ),
              ),
        ),
        sourcesOpen
          ? h(AptSourcesModal, {
              server,
              t,
              notify,
              setConfirmState,
              onClose: () => setSourcesOpen(false),
              onChanged: reload,
            })
          : null,
      );
    }


    function arrayBufferToBase64(buffer) {
      const bytes = new Uint8Array(buffer);
      const chunkSize = 0x8000;
      let binary = '';
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + chunkSize));
      }
      return btoa(binary);
    }

    function Breadcrumb({ path, home, onNavigate, t }) {
      const parts = String(path || '/').split('/').filter(Boolean);
      const crumbs = [{ label: t('home'), path: '' }];
      let accumulated = '';
      for (const part of parts) {
        accumulated += `/${part}`;
        crumbs.push({ label: part, path: accumulated });
      }
      return h(
        'div',
        { className: 'rsm-breadcrumb' },
        crumbs.map((crumb, index) =>
          h(
            React.Fragment,
            { key: crumb.path || 'home' },
            index > 0 ? h(Icon, { name: 'chevronRight', size: 11, className: 'rsm-muted' }) : null,
            h(
              'button',
              {
                type: 'button',
                className: `rsm-crumb${index === crumbs.length - 1 ? ' current' : ''}`,
                title: index === 0 ? home : crumb.path,
                onClick: () => onNavigate(index === 0 ? '' : crumb.path),
              },
              crumb.label,
            ),
          ),
        ),
      );
    }

    function FileEditor({ server, entry, onClose, onSaved, t, notify }) {
      const [state, reload] = useRemote(
        (signal) => api(serverPath(server.id, '/file') + fileQuery(entry.path), { signal }),
        [server.id, entry.path],
      );
      const [content, setContent] = React.useState('');
      const [dirty, setDirty] = React.useState(false);
      const [busy, setBusy] = React.useState(false);
      const [saveError, setSaveError] = React.useState('');
      const [loadedMtime, setLoadedMtime] = React.useState(0);
      const [loadedKey, setLoadedKey] = React.useState('');

      React.useEffect(() => {
        if (state.value && state.value.path !== loadedKey) {
          setContent(state.value.content || '');
          setLoadedMtime(state.value.mtime || 0);
          setLoadedKey(state.value.path);
          setDirty(false);
          setSaveError('');
        }
      }, [state.value, loadedKey]);

      const requestClose = () => {
        if (dirty && !window.confirm(t('unsavedChanges'))) return;
        onClose();
      };

      const save = async () => {
        if (!state.value || state.value.binary) return;
        setBusy(true);
        setSaveError('');
        try {
          const result = await api(serverPath(server.id, '/file'), {
            method: 'PUT',
            body: {
              path: state.value.path,
              content,
              encoding: 'utf8',
              expectedMtime: loadedMtime,
            },
          });
          setLoadedMtime(result.mtime);
          setDirty(false);
          notify(t('saved'));
          onSaved?.();
        } catch (error) {
          setSaveError(errorText(error));
        } finally {
          setBusy(false);
        }
      };

      const body = state.loading && !state.value
        ? h(Loading, { t })
        : state.error
          ? h(ErrorAlert, { error: state.error, onRetry: reload, t })
          : state.value
            ? state.value.binary
              ? h(
                  'div',
                  { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
                  h(
                    'div',
                    { className: 'rsm-alert warn', style: { margin: 0 } },
                    h(Icon, { name: 'warning' }),
                    h('div', null, t('binaryFile')),
                  ),
                  h(
                    'a',
                    { className: 'rsm-btn', href: downloadUrl(server.id, state.value.path), download: entry.name },
                    h(Icon, { name: 'download' }),
                    t('download'),
                  ),
                )
              : h(
                  'div',
                  { className: 'rsm-editor' },
                  h(
                    'div',
                    { className: 'rsm-editor-meta', style: { marginBottom: 8 } },
                    h('span', { className: 'rsm-badge muted' }, state.value.mode),
                    h('span', { className: 'rsm-count-pill' }, `${formatBytes(state.value.size)} · ${t('editorLines', { count: (content.match(/\n/g) || []).length + 1 })}`),
                    h('span', { className: 'rsm-spacer' }),
                    h('span', { className: 'rsm-mono rsm-muted', style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420 } }, state.value.path),
                  ),
                  h('textarea', {
                    className: 'rsm-textarea',
                    value: content,
                    spellCheck: false,
                    onChange: (event) => {
                      setContent(event.target.value);
                      setDirty(true);
                    },
                    style: { minHeight: 360 },
                  }),
                  saveError ? h('div', { className: 'rsm-error-text' }, saveError) : null,
                  saveError && saveError.toLowerCase().includes('changed')
                    ? h(
                        'button',
                        {
                          type: 'button',
                          className: 'rsm-btn',
                          style: { alignSelf: 'flex-start' },
                          onClick: () => {
                            setLoadedKey('');
                            reload();
                          },
                        },
                        h(Icon, { name: 'refresh' }),
                        t('reload'),
                      )
                    : null,
                )
            : null;

      return h(
        Modal,
        {
          title: entry.name,
          onClose: requestClose,
          wide: true,
          footer: [
            h('button', { key: 'cancel', type: 'button', className: 'rsm-btn', onClick: requestClose }, t('cancel')),
            state.value && !state.value.binary
              ? h(
                  'button',
                  { key: 'save', type: 'button', className: 'rsm-btn primary', onClick: save, disabled: busy || !dirty },
                  busy ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: 'check' }),
                  busy ? t('saving') : t('saveFile'),
                )
              : null,
          ],
        },
        body,
      );
    }

    function FilesView({ server, t, notify, setConfirmState, setPromptState }) {
      const [path, setPath] = React.useState('');
      const [pathInput, setPathInput] = React.useState('');
      const [showHidden, setShowHidden] = React.useState(false);
      const [filter, setFilter] = React.useState('');
      const [editorEntry, setEditorEntry] = React.useState(null);
      const [uploading, setUploading] = React.useState(false);
      const uploadRef = React.useRef();
      const [state, reload] = useRemote(
        (signal) => api(serverPath(server.id, '/files') + fileQuery(path), { signal }),
        [server.id, path],
      );
      const listing = state.value;

      React.useEffect(() => {
        if (listing?.path) setPathInput(listing.path);
      }, [listing?.path]);

      const navigate = (next) => {
        setPath(next || '');
        setFilter('');
      };

      const go = () => {
        const next = pathInput.trim();
        if (next) navigate(next);
      };

      const copyPath = async (value) => {
        try {
          await navigator.clipboard.writeText(value);
          notify(t('copied'));
        } catch {
          notify(t('errorGeneric'), 'error');
        }
      };

      const entries = (listing?.entries || []).filter((entry) => {
        if (!showHidden && entry.name.startsWith('.')) return false;
        const q = filter.trim().toLowerCase();
        if (!q) return true;
        return entry.name.toLowerCase().includes(q);
      });

      const askNewFolder = () => {
        setPromptState({
          title: t('newFolderTitle'),
          label: t('newFolderName'),
          initial: '',
          placeholder: 'new-folder',
          onSubmit: async (name) => {
            await api(serverPath(server.id, '/fs/mkdir'), { method: 'POST', body: { parent: listing.path, name } });
            notify(t('newFolder'));
            reload();
          },
        });
      };

      const askRename = (entry) => {
        setPromptState({
          title: t('renameTitle'),
          label: t('renameHint'),
          initial: entry.name,
          onSubmit: async (name) => {
            await api(serverPath(server.id, '/fs/rename'), { method: 'POST', body: { path: entry.path, name } });
            notify(t('saved'));
            reload();
          },
        });
      };

      const askDelete = (entry) => {
        setConfirmState({
          title: t('deleteTitle'),
          body: entry.type === 'dir' ? t('deleteFolderBody', { name: entry.name }) : t('deleteFileBody', { name: entry.name }),
          confirmLabel: t('delete'),
          danger: true,
          onConfirm: async () => {
            await api(serverPath(server.id, '/fs/delete'), {
              method: 'POST',
              body: { path: entry.path, recursive: entry.type === 'dir' },
            });
            notify(t('delete'));
            reload();
          },
        });
      };

      const upload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !listing) return;
        setUploading(true);
        try {
          const contentBase64 = arrayBufferToBase64(await file.arrayBuffer());
          await api(serverPath(server.id, '/fs/upload'), {
            method: 'POST',
            body: { parent: listing.path, name: file.name, contentBase64 },
          });
          notify(t('uploadDone', { name: file.name }));
          reload();
        } catch (error) {
          notify(`${t('upload')}: ${errorText(error)}`, 'error');
        } finally {
          setUploading(false);
        }
      };

      return h(
        'div',
        { className: 'rsm-content flush' },
        h(
          'div',
          { className: 'rsm-toolbar' },
          h(
            'button',
            {
              type: 'button',
              className: 'rsm-btn icon-only',
              disabled: !listing?.parent,
              onClick: () => listing?.parent && navigate(listing.parent),
              title: t('up'),
            },
            h(Icon, { name: 'chevronLeft', size: 14 }),
          ),
          h(
            'button',
            { type: 'button', className: 'rsm-btn small', onClick: () => navigate(''), title: t('home') },
            h(Icon, { name: 'folder', size: 13 }),
            t('home'),
          ),
          h(
            'button',
            { type: 'button', className: 'rsm-btn icon-only', onClick: reload, title: t('refresh'), disabled: state.loading },
            h(Icon, { name: 'refresh', size: 14 }),
          ),
          h('div', { style: { width: 1, height: 18, background: 'var(--dsw-alias-border-l1)' } }),
          h(
            'button',
            { type: 'button', className: 'rsm-btn small', onClick: askNewFolder, disabled: !listing },
            h(Icon, { name: 'plus', size: 13 }),
            t('newFolder'),
          ),
          h(
            'button',
            { type: 'button', className: 'rsm-btn small', onClick: () => uploadRef.current?.click(), disabled: !listing || uploading },
            uploading ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: 'upload', size: 13 }),
            uploading ? t('uploading') : t('upload'),
          ),
          h('input', { ref: uploadRef, type: 'file', className: 'rsm-hidden', onChange: upload }),
          h(
            'label',
            { className: 'rsm-checkline' },
            h('input', { type: 'checkbox', className: 'rsm-check', checked: showHidden, onChange: (event) => setShowHidden(event.target.checked) }),
            t('showHidden'),
          ),
          h('span', { className: 'rsm-spacer' }),
          h(
            'div',
            { className: 'rsm-search', style: { maxWidth: 220 } },
            h(Icon, { name: 'search', size: 14 }),
            h('input', {
              className: 'rsm-input',
              value: filter,
              onChange: (event) => setFilter(event.target.value),
              placeholder: t('filterFiles'),
            }),
          ),
        ),
        h(
          'div',
          { className: 'rsm-pathbar' },
          listing ? h(Breadcrumb, { path: listing.path, home: listing.home, onNavigate: navigate, t }) : null,
          h('span', { className: 'rsm-spacer' }),
          h('input', {
            className: 'rsm-input',
            value: pathInput,
            onChange: (event) => setPathInput(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') go();
            },
            placeholder: '/var/log',
            'aria-label': t('path'),
          }),
          h('button', { type: 'button', className: 'rsm-btn small', onClick: go }, t('go')),
          listing
            ? h(
                'button',
                { type: 'button', className: 'rsm-btn ghost icon-only small', onClick: () => copyPath(listing.path), title: t('copyPath') },
                h(Icon, { name: 'copy', size: 13 }),
              )
            : null,
        ),
        state.loading && !listing
          ? h(Loading, { t })
          : state.error
            ? h(ErrorAlert, { error: state.error, onRetry: reload, t })
            : h(
                'div',
                { className: 'rsm-table-wrap' },
                !listing || entries.length === 0
                  ? h(EmptyState, {
                      icon: 'folder',
                      title: listing ? t('emptyFolder') : t('loadFailed'),
                      body: filter ? t('noContainersHint') : undefined,
                      t,
                      action: h('button', { type: 'button', className: 'rsm-btn', onClick: reload }, h(Icon, { name: 'refresh' }), t('refresh')),
                    })
                  : h(
                      'table',
                      { className: 'rsm-table' },
                      h(
                        'thead',
                        null,
                        h(
                          'tr',
                          null,
                          h('th', null, t('fileName')),
                          h('th', { style: { width: 100 } }, t('fileSize')),
                          h('th', { className: 'hide-sm', style: { width: 155 } }, t('modified')),
                          h('th', { className: 'hide-md', style: { width: 70 } }, t('mode')),
                          h('th', { style: { width: 126, textAlign: 'right' } }, t('actions')),
                        ),
                      ),
                      h('tbody', null, entries.map((entry) =>
                        h(
                          'tr',
                          { key: entry.path },
                          h(
                            'td',
                            null,
                            h(
                              'div',
                              { className: 'rsm-file-name', onClick: () => (entry.type === 'dir' ? navigate(entry.path) : setEditorEntry(entry)) },
                              h(Icon, {
                                name: entry.type === 'dir' ? 'folder' : entry.type === 'symlink' ? 'link' : 'file',
                                size: 15,
                                className: `rsm-file-icon ${entry.type}`,
                              }),
                              h('span', { title: entry.name }, entry.name),
                            ),
                          ),
                          h('td', { className: 'rsm-muted' }, entry.type === 'dir' ? '—' : formatBytes(entry.size)),
                          h('td', { className: 'rsm-muted hide-sm' }, formatTime(entry.mtime)),
                          h('td', { className: 'rsm-mono rsm-muted hide-md' }, entry.mode),
                          h(
                            'td',
                            null,
                            h(
                              'div',
                              { className: 'rsm-row-actions' },
                              entry.type !== 'dir'
                                ? h(
                                    'a',
                                    {
                                      className: 'rsm-btn small icon-only',
                                      href: downloadUrl(server.id, entry.path),
                                      download: entry.name,
                                      title: t('download'),
                                    },
                                    h(Icon, { name: 'download', size: 13 }),
                                  )
                                : null,
                              h(
                                'button',
                                { type: 'button', className: 'rsm-btn small icon-only', title: t('rename'), onClick: () => askRename(entry) },
                                h(Icon, { name: 'edit', size: 13 }),
                              ),
                              h(
                                'button',
                                { type: 'button', className: 'rsm-btn small icon-only danger', title: t('delete'), onClick: () => askDelete(entry) },
                                h(Icon, { name: 'trash', size: 13 }),
                              ),
                            ),
                          ),
                        ),
                      )),
                    ),
              ),
        h(
          'div',
          { className: 'rsm-footer' },
          h('span', { className: 'rsm-count-pill' }, `${entries.length} ${t('fileName')}`),
          h('span', { className: 'rsm-spacer' }),
          listing ? h('span', { className: 'rsm-count-pill rsm-mono' }, listing.path) : null,
        ),
        editorEntry
          ? h(FileEditor, {
              server,
              entry: editorEntry,
              onClose: () => setEditorEntry(null),
              onSaved: reload,
              t,
              notify,
            })
          : null,
      );
    }

    function OverviewView({ server, t, notify, onRefreshServers }) {
      const [state, reload] = useRemote(
        (signal) => api(serverPath(server.id, '/overview'), { signal }),
        [server.id],
      );
      const [testing, setTesting] = React.useState(false);
      const overview = state.value;
      const test = async () => {
        setTesting(true);
        try {
          const result = await api(serverPath(server.id, '/test'), { method: 'POST' });
          notify(`${t('testOk')} · ${result.latencyMs} ms`);
          reload();
          onRefreshServers?.();
        } catch (error) {
          notify(`${t('connectFailed')}: ${errorText(error)}`, 'error');
        } finally {
          setTesting(false);
        }
      };
      return h(
        'div',
        { className: 'rsm-content' },
          h(
            'div',
            { className: 'rsm-toolbar', style: { padding: '0 0 12px', borderBottom: 0, background: 'transparent' } },
            h('span', { className: 'rsm-label', style: { margin: 0 } }, t('hostInfo')),
            h('span', { className: 'rsm-spacer' }),
            h(
              'button',
              { type: 'button', className: 'rsm-btn', onClick: test, disabled: testing },
              testing ? h('span', { className: 'rsm-spinner' }) : h(Icon, { name: 'plug', size: 14 }),
              t('test'),
            ),
            h(
              'button',
              { type: 'button', className: 'rsm-btn icon-only', onClick: reload, disabled: state.loading, title: t('refresh') },
              h(Icon, { name: 'refresh', size: 14 }),
            ),
          ),
          state.loading && !overview
            ? h(Loading, { t })
            : state.error
              ? h(ErrorAlert, { error: state.error, onRetry: reload, t })
              : overview
                ? h(
                    React.Fragment,
                    null,
                    h(
                      'div',
                      { className: 'rsm-grid-cards' },
                      h(
                        'div',
                        { className: 'rsm-card' },
                        h('div', { className: 'rsm-card-title' }, h(Icon, { name: 'server', size: 13 }), t('os')),
                        h('div', { style: { fontWeight: 600, fontSize: 14, marginBottom: 4 } }, overview.os || '—'),
                        h('div', { className: 'rsm-hint' }, t('uptime')),
                        h('div', { className: 'rsm-mono', style: { fontSize: 11.5, marginTop: 2 } }, overview.uptime || '—'),
                      ),
                      h(
                        'div',
                        { className: 'rsm-card' },
                        h('div', { className: 'rsm-card-title' }, h(Icon, { name: 'docker', size: 13 }), t('dockerVersion')),
                        h(
                          'div',
                          { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                          h(
                            'span',
                            { className: `rsm-badge ${overview.dockerVersion ? 'success' : 'error'}` },
                            overview.dockerVersion ? `v${overview.dockerVersion}` : t('notInstalled'),
                          ),
                          h('span', { className: 'rsm-count-pill' }, `${overview.runningContainers} ${t('runningCount')}`),
                        ),
                        overview.dockerMessage
                          ? h('div', { className: 'rsm-hint', style: { marginTop: 8, whiteSpace: 'pre-wrap' } }, overview.dockerMessage)
                          : null,
                      ),
                      h(
                        'div',
                        { className: 'rsm-card' },
                        h('div', { className: 'rsm-card-title' }, h(Icon, { name: 'terminal', size: 13 }), t('identity')),
                        h('div', { className: 'rsm-mono', style: { fontSize: 11.5, whiteSpace: 'pre-wrap' } }, overview.identity || '—'),
                      ),
                      h(
                        'div',
                        { className: 'rsm-card' },
                        h('div', { className: 'rsm-card-title' }, h(Icon, { name: 'plug', size: 13 }), t('connectionInfo')),
                        h(
                          'dl',
                          { className: 'rsm-kv' },
                          h('dt', null, t('fingerprint')),
                          h('dd', { className: 'rsm-mono', style: { fontSize: 10, wordBreak: 'break-all' } }, overview.fingerprint || '—'),
                          h('dt', null, t('lastUpdated')),
                          h('dd', null, shortTime(overview.lastConnectedAt)),
                        ),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'rsm-grid-cards', style: { marginTop: 12 } },
                      h(
                        'div',
                        { className: 'rsm-card', style: { gridColumn: 'span 1' } },
                        h('div', { className: 'rsm-card-title' }, t('disk')),
                        h('pre', null, overview.disk || '—'),
                      ),
                      h(
                        'div',
                        { className: 'rsm-card' },
                        h('div', { className: 'rsm-card-title' }, t('memory')),
                        h('pre', null, overview.memory || '—'),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'rsm-hint', style: { marginTop: 12 } },
                      `${server.username}@${server.host}:${server.port} · ${server.dockerCommand || 'docker'}`,
                    ),
                  )
                : null,
      );
    }

    function activityLabel(action, t) {
      const labels = {
        'server.create': t('addServer'),
        'server.update': t('editServer'),
        'file.write': t('saveFile'),
        'file.mkdir': t('newFolder'),
        'file.rename': t('rename'),
        'file.delete': t('delete'),
        'file.upload': t('upload'),
        'container.stop': t('stop'),
        'container.restart': t('restart'),
        'container.start': t('start'),
        'container.kill': 'kill',
      };
      return labels[action] || action;
    }

    function ActivityView({ server, t }) {
      const [state, reload] = useRemote(
        (signal) => api(serverPath(server.id, '/activity'), { signal }),
        [server.id],
      );
      const rows = state.value || [];
      return h(
        'div',
        { className: 'rsm-content' },
        h(
          'div',
          { className: 'rsm-toolbar', style: { padding: '0 0 12px', borderBottom: 0, background: 'transparent' } },
          h('span', { className: 'rsm-label', style: { margin: 0 } }, t('recentActivity')),
          h('span', { className: 'rsm-spacer' }),
          h(
            'button',
            { type: 'button', className: 'rsm-btn icon-only', onClick: reload, disabled: state.loading, title: t('refresh') },
            h(Icon, { name: 'refresh', size: 14 }),
          ),
        ),
        state.loading && !state.value
          ? h(Loading, { t })
          : state.error
            ? h(ErrorAlert, { error: state.error, onRetry: reload, t })
            : rows.length === 0
              ? h(EmptyState, { icon: 'terminal', title: t('noActivity'), t })
              : h(
                  'div',
                  { className: 'rsm-code-list' },
                  rows.map((row, index) =>
                    h(
                      'div',
                      { key: index, className: `rsm-code-row ${row.ok ? 'ok' : 'fail'}` },
                      h(Icon, { name: row.ok ? 'check' : 'warning', size: 14 }),
                      h('span', { className: 'rsm-badge muted' }, activityLabel(row.action, t)),
                      h(
                        'div',
                        { className: 'grow' },
                        h('div', { className: 'rsm-mono', style: { fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, row.target || '—'),
                        row.message ? h('div', { className: 'rsm-hint' }, row.message) : null,
                      ),
                      h('span', { className: 'rsm-count-pill' }, shortTime(row.at)),
                    ),
                  ),
                ),
      );
    }

    function serverMentionFor(server) {
      const label = String(server.name || server.id || 'server').replace(/[\r\n]/g, ' ').trim();
      return `服务器引用 server: ${label} (${server.username}@${server.host}:${server.port}, id=${server.id})`;
    }

    function createServerReferenceSource(t) {
      return {
        trigger: '@',
        name: 'remote-server',
        showGroupTitle: false,
        async candidates(_session, { query, signal }) {
          const servers = await api('/servers', { signal });
          const needle = String(query || '').trim().toLowerCase();
          return servers
            .filter((server) => {
              if (!needle) return true;
              return [server.name, server.host, server.username, server.id]
                .join(' ')
                .toLowerCase()
                .includes(needle);
            })
            .slice(0, 8)
            .map((server) => ({
              name: server.name,
              description: `${server.username}@${server.host}:${server.port}`,
              icon: 'session',
              section: t('servers'),
              value: JSON.stringify({
                id: server.id,
                name: server.name,
                host: server.host,
                port: server.port,
                username: server.username,
              }),
            }));
        },
        onPick({ candidate }) {
          const server = JSON.parse(candidate.value);
          const mention = serverMentionFor(server);
          return {
            insert: {
              source: 'remote-server',
              ref: mention,
              label: server.name,
              appearance: 'session',
              clipboardText: mention,
            },
          };
        },
        codec: {
          clipboardText: (ref) => ref,
          serialize: (ref) => Promise.resolve(ref),
        },
      };
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { en: EN, zh: ZH }), 'remote-server-manager: locale dictionaries');

      const t = ctx.locale.bind(NS);
      const registerServerSource = (owner, inputTriggers) => {
        if (!inputTriggers) return;
        owner.effect(
          () => inputTriggers.registerSource(createServerReferenceSource(t)),
          'remote-server-manager: @ server reference source',
        );
      };
      let activeInputTriggers;
      try {
        activeInputTriggers = ctx.get('inputTriggers');
      } catch {
        activeInputTriggers = undefined;
      }
      if (activeInputTriggers) registerServerSource(ctx, activeInputTriggers);
      else if (typeof ctx.inject === 'function') {
        ctx.inject(['inputTriggers'], (scope) => registerServerSource(scope, scope.inputTriggers));
      }

      ctx.slots.inject('main', () =>
        ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID,
            locale: NS,
            inject: () => ({ locale: ctx.locale }),
          },
          RemoteManagerPage,
        ),
      );
      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 20,
            locale: NS,
            label: () => ctx.locale.bind(NS)('panel'),
          },
          PanelIcon,
        ),
      );
    }

    return { inject: ['slots', 'locale'], apply };
  },
});
