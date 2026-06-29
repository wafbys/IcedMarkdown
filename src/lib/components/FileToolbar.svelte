<script lang="ts">
  import type { ContentState } from '../core/ContentState.svelte'

  interface Props {
    doc: ContentState
  }

  let { doc }: Props = $props()

  let fileInput: HTMLInputElement | undefined = $state(undefined)

  async function handleOpen() {
    try {
      if ('showOpenFilePicker' in window) {
        const [handle] = await (
          window as unknown as {
            showOpenFilePicker: (opts: {
              types: { description: string; accept: Record<string, string[]> }[]
            }) => Promise<{ getFile: () => Promise<File>; name: string }[]>
          }
        ).showOpenFilePicker({
          types: [
            {
              description: 'Markdown files',
              accept: { 'text/markdown': ['.md', '.markdown', '.mdx'] },
            },
          ],
        })
        const file = await handle.getFile()
        const text = await file.text()
        doc.loadMarkdown(text, file.name, handle.name)
      } else {
        fileInput?.click()
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Failed to open file:', e)
      }
    }
  }

  function handleFileInputChange() {
    const files = fileInput?.files
    if (!files || files.length === 0) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      doc.loadMarkdown(text, file.name)
    }
    reader.readAsText(file)
  }

  async function handleSave() {
    try {
      const md = doc.toMarkdown()
      const win = window as unknown as {
        showSaveFilePicker?: (opts: {
          types: { description: string; accept: Record<string, string[]> }[]
          suggestedName: string
        }) => Promise<{ createWritable: () => Promise<{ write: (d: string) => Promise<void>; close: () => Promise<void> }>; name: string }>
      }
      if (win.showSaveFilePicker && !doc.filePath) {
        const handle = await win.showSaveFilePicker({
          types: [
            {
              description: 'Markdown files',
              accept: { 'text/markdown': ['.md'] },
            },
          ],
          suggestedName: doc.fileName,
        })
        const writable = await handle.createWritable()
        await writable.write(md)
        await writable.close()
        doc.isModified = false
        doc.filePath = handle.name
      } else {
        const blob = new Blob([md], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.fileName
        a.click()
        URL.revokeObjectURL(url)
        doc.isModified = false
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Failed to save file:', e)
      }
    }
  }

  function handleNew() {
    doc.loadMarkdown('', 'untitled.md')
  }
</script>

<div class="toolbar">
  <div class="toolbar-left">
    <button class="toolbar-btn" onclick={handleNew} title="New file">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    </button>
    <button class="toolbar-btn" onclick={handleOpen} title="Open file (Ctrl+O)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
    <button class="toolbar-btn" onclick={handleSave} title="Save file (Ctrl+S)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17,21 17,13 7,13 7,21"/>
        <polyline points="7,3 7,8 15,8"/>
      </svg>
    </button>
  </div>

  <div class="toolbar-title">
    <span class="file-name">{doc.fileName}</span>
    {#if doc.isModified}
      <span class="modified-dot" title="Unsaved changes">&#9679;</span>
    {/if}
  </div>

  <div class="toolbar-right">
    <span class="block-count">{doc.blocks.length} block{doc.blocks.length !== 1 ? 's' : ''}</span>
  </div>
</div>

<input
  type="file"
  accept=".md,.markdown,.mdx,.txt"
  class="hidden-input"
  bind:this={fileInput}
  onchange={handleFileInputChange}
/>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: var(--toolbar-bg, rgba(255, 255, 255, 0.8));
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .toolbar-left {
    display: flex;
    gap: 4px;
  }

  .toolbar-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .file-name {
    color: var(--text-color, #1f2937);
  }

  .modified-dot {
    color: var(--accent, #c084fc);
    font-size: 0.6rem;
  }

  .toolbar-right {
    font-size: 0.75rem;
    color: var(--text-muted, #9ca3af);
  }

  .toolbar-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-muted, #6b7280);
    cursor: pointer;
    transition: background-color 0.12s, color 0.12s;
  }

  .toolbar-btn:hover {
    background-color: var(--btn-hover-bg, rgba(0, 0, 0, 0.06));
    color: var(--text-color, #1f2937);
  }

  .hidden-input {
    display: none;
  }

  .block-count {
    white-space: nowrap;
  }
</style>
