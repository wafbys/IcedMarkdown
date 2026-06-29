# IcedMarkdown — 项目提示词存档

> 此文件记录项目架构目标、技术决策和 Phase 1 实现状态，供后续开发参考。

---

## 项目总体目标

开发一个**块级混合式 Markdown 编辑器**（类似 MarkText 的核心体验，但架构更干净现代）。

### 核心理念
- 文档由多个 Block 组成
- 非编辑状态的块以美观渲染形式展示
- 当前编辑的块可以直接编辑（支持智能层级指示器）
- Markdown 始终作为单一真实来源（single source of truth）
- 强调良好的架构设计、类型安全和可扩展性

---

## 技术栈（严格遵循）

| 层次 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | Tauri 2.x | Rust 后端 + WebView 前端 |
| 前端框架 | Svelte 5 + TypeScript | Runes 语法（$state, $derived, $effect, $props） |
| 编辑器核心 | CodeMirror 6 | @codemirror/lang-markdown |
| Markdown 处理 | remark + micromark + rehype | unified 生态，解析与 HTML 渲染分离 |
| 样式方案 | Tailwind CSS + CSS 变量 | 支持后续精细字体控制 |
| 状态管理 | Svelte 5 runes | $state 优先，不做额外状态库 |

---

## Phase 1 目标（已完成）

- [x] 将 Markdown 解析为 Block 列表
- [x] 非编辑块渲染为只读的 HTML
- [x] 点击某个块后切换为编辑状态（使用 CodeMirror 编辑）
- [x] 离开编辑块后，内容重新解析并渲染回 HTML
- [x] 支持最基础的文件打开和保存
- [x] 只允许一个 Block 处于编辑状态
- [x] 支持 heading 和 paragraph 两种核心 Block 类型（代码块、引用块等额外支持）

---

## 核心架构约定

### Block 概念
```
Markdown 顶层节点 → Block {
  id, type, content(原始MD), html(预渲染), meta(类型元数据), order
}
```

### ContentState
- 单一状态管理类，使用 Svelte 5 `$state` runes
- 管理 `blocks[]`、`editingBlockId`、文件信息
- 一次只允许一个 Block 编辑
- 提供 Block CRUD + 编辑生命周期方法

### 渲染切换
- `BlockRenderer` — 根据 `editingBlockId` 调度
- `ReadOnlyBlock` — `{@html block.html}` + 点击事件
- `EditBlock` — `$effect` 挂载 CodeMirror 实例

### 数据流
```
Markdown字符串 → remark parse → Block[] → $state响应式
→ 根据editingBlockId切换渲染 → remark re-parse → 更新Block
→ blocksToMarkdown() → 文件写入
```

---

## 关键类型定义

```typescript
type BlockType = 'heading' | 'paragraph' | 'code' | 'blockquote' | 'list' | 'thematicBreak' | 'image' | 'table'

interface HeadingMeta { _kind: 'heading'; depth: number }
interface CodeMeta    { _kind: 'code'; language: string | null }
interface GenericMeta { _kind: 'generic' }
type BlockMeta = HeadingMeta | CodeMeta | GenericMeta

interface Block {
  id: string
  type: BlockType
  content: string    // 原始 Markdown 源
  html: string       // 预渲染 HTML
  meta: BlockMeta    // Discriminated union
  order: number
}
```

---

## 项目目录结构

```
src/
├── main.ts                          # Svelte 挂载入口
├── app.css                          # 全局 CSS 变量 + 主题 + 重置
├── App.svelte                       # 根组件（状态初始化 + 布局）
└── lib/
    ├── types/                       # 纯类型定义
    │   ├── index.ts
    │   └── block.ts
    ├── core/                        # 核心逻辑（无 UI 依赖）
    │   ├── index.ts
    │   ├── ContentState.svelte.ts   # $state 状态管理
    │   └── md-parser.ts             # Markdown ↔ Block 转换
    └── components/                  # Svelte 组件层
        ├── FileToolbar.svelte       # 新建/打开/保存 工具栏
        ├── BlockRenderer.svelte     # Block 渲染调度器
        ├── ReadOnlyBlock.svelte     # 只读 HTML 展示
        └── EditBlock.svelte         # CodeMirror 6 编辑器
```

---

## 编辑交互约定

| 操作 | 行为 |
|------|------|
| 单击只读 Block | 切换为该 Block 的编辑态 |
| `Ctrl+Enter` | 提交当前编辑内容 |
| `Escape` | 取消编辑，恢复原内容 |
| 编辑器失焦（点击外部） | 自动提交编辑 |
| Heading 类型按 `Enter` | 自动提交 |
| 空内容按 `Backspace` | 删除当前 Block |
| 清空内容后提交 | 删除该 Block |

---

## CSS 变量体系（亮/暗主题）

```css
:root {
  --bg, --text-color, --text-muted, --border-color
  --code-bg, --accent, --accent-bg
  --block-hover-bg, --toolbar-bg, --btn-hover-bg, --edit-bg
  --caret-color, --placeholder-color
  --sans, --mono, --editor-font
}
```

---

## 命令速查

```bash
npm run dev       # 前端开发服务器 (http://localhost:5173)
npm run build     # Vite 生产构建
npm run check     # svelte-check + TypeScript 类型检查
npx tauri dev     # Tauri 桌面应用开发（需 Rust）
npx tauri build   # Tauri 桌面应用打包
```

---

## Phase 1 已知问题

| 问题 | 状态 |
|------|------|
| unified 类型兼容（TypeScript 6.x） | 已用 `as unknown as Root` 绕过 |
| 大文件全量解析性能 | 接受，Phase 2 引入虚拟滚动 |
| 嵌套 Block（列表项、表格行）未展开 | Phase 2 作为子 Block |
| 空 Block 可能意外删除 | 已处理：仅在显式退格到空时删除 |

---

## Phase 2 待办（按优先级）

1. 标题层级指示器（编辑块左侧的类型图标 H1/H2/P）
2. 键盘导航（上下箭头切换 Block 焦点）
3. 完善 image、table、task list 类型
4. 拖拽排序 Block
5. Tauri 原生集成：安装 Rust + @tauri-apps/plugin-dialog
6. 全局撤销/重做
7. 纯预览模式切换
8. 代码块语法高亮
9. 写作聚焦模式
10. 单元测试（vitest）
