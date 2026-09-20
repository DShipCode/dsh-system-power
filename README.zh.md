# dsh-system-power

一个 DeepSeek Harness（DSH）插件：在**设置页头部**（“打开配置文件”按钮右侧）增加一个**电源按钮**，提供 **关闭** 和 **重启** 宿主进程的能力。

原版 DSH 的设置页没有电源控制。本插件完全自包含：自带宿主侧能力（`systemPower` Remote 命名空间，含 `shutdown` / `restart`），**干净安装的 DSH 无需任何源码改动即可使用**。以后重装 DSH？重新安装本插件即可。

## 功能

- 设置页右上角（“打开配置文件”旁边）出现电源按钮，点击弹出 **关闭 / 重启** 菜单。
- **关闭**：确认请求后停止 DSH 宿主进程。
- **重启**：以分离方式重新拉起相同命令（自动附加 `--no-open`，不新开浏览器；已打开的页面会自动轮询并重载），随后退出旧进程。
- 全屏遮罩提示与重启后自动刷新，行为与官方内置电源操作一致。
- 如果宿主本身已带电源按钮（保留动作 id `system-power`，例如本地打过补丁的 DSH），本插件自动让位，**不会重复添加按钮**。

## 安装

支持从插件目录或打包的 tarball 安装：

```bash
# 从插件目录
dsh plugin --profile <profile> add /path/to/dsh-system-power

# 或从打包的 tarball
dsh plugin --profile <profile> add dsh-system-power-0.1.0.tgz
```

安装后重启 DSH，打开 **设置**，右上角即出现电源按钮。

## 从源码构建

```bash
npm install
npm run build
```

构建产物输出到 `lib/`：

- `lib/index.js` — 宿主 Loader 入口（注册 `systemPower` Remote 命名空间；Typert binding 与方法标记均为手写，插件对协议包无运行时依赖）。
- `lib/client.js` — 浏览器端 bundle，由 DSH client-modules 系统加载。

## 环境要求

- DSH 0.1.x（含 web 设置页 `dsh-client-ui-settings`）。
- 插件排在 web-app 各 bundle 之后加载，干净 profile 开箱即用。

## 工作原理

| 组成 | 位置 | 作用 |
|---|---|---|
| 宿主 `SystemPowerController` | `src/index.ts` | 通过 `ctx.provide` 注册 `systemPowerController`；经 Typert Gateway 暴露 `systemPower/shutdown` 与 `systemPower/restart`（手写 binding + 方法标记）。 |
| 客户端贡献 | `src/client/remote.ts` | `TYPERT_REMOTE` 描述符组，经 `ctx.remote.$mount` 挂载，浏览器端获得类型化的 `systemPower` 命名空间。 |
| 客户端 UI 纤维 | `src/client/index.ts` | 子纤维（注入 `remote.systemPower`）向 `settings.action` 槽注册头部按钮；检测到宿主已带 `system-power` 动作时跳过注册。 |
| 电源按钮 + store | `src/client/SystemPowerAction.tsx`、`system-power-store.ts` | 按钮、菜单、遮罩、重启轮询，镜像官方电源操作实现。 |

## License

MIT
