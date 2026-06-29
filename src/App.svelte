<script lang="ts">
  import { ContentState } from './lib/core/ContentState.svelte'
  import FileToolbar from './lib/components/FileToolbar.svelte'
  import BlockRenderer from './lib/components/BlockRenderer.svelte'

  const doc = new ContentState()

  const defaultMd = `# Welcome to IcedMarkdown

This is a **block-level** hybrid Markdown editor. 

## How it works

Each block in your document is either rendered as beautifully styled HTML or edited directly with real Markdown.

Click on any block to start editing. Press **Ctrl+Enter** or click outside to commit your changes.

## Features

- Block-level editing with live preview
- Markdown is always the single source of truth
- Clean, modern architecture with Svelte 5 and TypeScript

> Try editing this blockquote! Just click on it.

\`\`\`typescript
const greeting = "Hello, IcedMarkdown!"
console.log(greeting)
\`\`\`

---

Happy editing!`

  doc.loadMarkdown(defaultMd, 'welcome.md')

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-container">
  <FileToolbar {doc} />

  <main class="editor-area">
    {#if doc.isEmpty}
      <div class="empty-state">
        <p>No content yet. Click <strong>+</strong> or open a file to get started.</p>
      </div>
    {:else}
      <div class="blocks-container">
        {#each doc.blocks as block (block.id)}
          <BlockRenderer {block} {doc} />
        {/each}
      </div>
    {/if}

    {#if !doc.isEmpty}
      <button
        class="add-block-btn"
        onclick={() => {
          const last = doc.blocks[doc.blocks.length - 1]
          if (last) doc.insertBlockAfter(last.id)
        }}
      >
        + Add block
      </button>
    {/if}
  </main>
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--bg, #ffffff);
    color: var(--text-color, #1f2937);
  }

  .editor-area {
    flex: 1;
    max-width: 780px;
    width: 100%;
    margin: 0 auto;
    padding: 24px 32px 120px;
  }

  .blocks-container {
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    color: var(--text-muted, #9ca3af);
    text-align: center;
    font-size: 1rem;
  }

  .add-block-btn {
    display: block;
    width: 100%;
    margin-top: 12px;
    padding: 10px;
    border: 2px dashed var(--border-color, #e5e7eb);
    border-radius: 8px;
    background: transparent;
    color: var(--text-muted, #9ca3af);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .add-block-btn:hover {
    border-color: var(--accent, #c084fc);
    color: var(--accent, #c084fc);
    background: var(--accent-bg, rgba(192, 132, 252, 0.06));
  }
</style>
