<script lang="ts">
  import { EditorView, keymap } from '@codemirror/view'
  import { EditorState } from '@codemirror/state'
  import { markdown } from '@codemirror/lang-markdown'
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
  import type { Block } from '../types/block'
  import type { ContentState } from '../core/ContentState.svelte'

  interface Props {
    block: Block
    doc: ContentState
  }

  let { block, doc }: Props = $props()

  let containerEl: HTMLDivElement | undefined = $state(undefined)

  $effect(() => {
    const el = containerEl
    if (!el) return

    const extensions = [
      markdown(),
      history(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        {
          key: 'Ctrl-Enter',
          run: () => {
            commit()
            return true
          },
        },
        {
          key: 'Escape',
          run: () => {
            doc.cancelEdit()
            return true
          },
          preventDefault: true,
        },
        {
          key: 'Backspace',
          run: (view: EditorView) => {
            if (view.state.doc.length === 0) {
              doc.removeBlock(block.id)
              return true
            }
            return false
          },
        },
        {
          key: 'Enter',
          run: (_view: EditorView) => {
            if (block.type === 'heading') {
              commit()
              return true
            }
            return false
          },
        },
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          block.content = update.state.doc.toString()
        }
      }),
    ]

    const editorState = EditorState.create({
      doc: block.content,
      extensions,
    })

    const view = new EditorView({
      state: editorState,
      parent: el,
    })

    view.focus()

    function handleBlur() {
      setTimeout(() => {
        if (document.activeElement === el || el?.contains(document.activeElement)) return
        commit()
      }, 150)
    }

    view.dom.addEventListener('blur', handleBlur)

    return () => {
      view.dom.removeEventListener('blur', handleBlur)
      view.destroy()
    }
  })

  function commit() {
    const currentContent = block.content
    doc.finishEdit(currentContent)
  }
</script>

<div class="edit-block block-type-{block.type}" bind:this={containerEl}>
</div>

<style>
  .edit-block {
    border-radius: 6px;
    outline: 2px solid var(--accent, #c084fc);
    outline-offset: 1px;
    background: var(--edit-bg, rgba(192, 132, 252, 0.04));
  }

  .edit-block :global(.cm-editor) {
    height: auto;
    min-height: 2em;
  }

  .edit-block :global(.cm-editor .cm-scroller) {
    overflow: visible;
    font-family: var(--editor-font, 'JetBrains Mono', ui-monospace, monospace);
    font-size: 0.95rem;
    line-height: 1.7;
  }

  .edit-block :global(.cm-editor .cm-content) {
    padding: 8px 4px;
    caret-color: var(--caret-color, #1a1a2e);
  }

  .edit-block :global(.cm-editor .cm-line) {
    padding: 0;
  }

  .edit-block :global(.cm-editor.cm-focused) {
    outline: none;
  }

  .edit-block :global(.cm-editor .cm-gutters) {
    display: none;
  }
</style>
