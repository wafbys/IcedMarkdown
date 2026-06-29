<script lang="ts">
  import type { Block } from '../types/block'
  import type { ContentState } from '../core/ContentState.svelte'

  interface Props {
    block: Block
    doc: ContentState
  }

  let { block, doc }: Props = $props()

  function handleClick() {
    doc.startEdit(block.id)
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="readonly-block block-type-{block.type}"
  onclick={handleClick}
>
  {@html block.html}
</div>

<style>
  .readonly-block {
    cursor: text;
    padding: 8px 4px;
    border-radius: 6px;
    transition: background-color 0.12s ease;
    min-height: 1.5em;
  }

  .readonly-block:hover {
    background-color: var(--block-hover-bg, rgba(0, 0, 0, 0.03));
  }

  :global(.readonly-block h1),
  :global(.readonly-block h2),
  :global(.readonly-block h3),
  :global(.readonly-block h4),
  :global(.readonly-block h5),
  :global(.readonly-block h6) {
    margin: 0;
    padding: 0;
    line-height: 1.3;
  }

  :global(.readonly-block h1) {
    font-size: 1.75rem;
    font-weight: 700;
  }

  :global(.readonly-block h2) {
    font-size: 1.5rem;
    font-weight: 600;
  }

  :global(.readonly-block h3) {
    font-size: 1.25rem;
    font-weight: 600;
  }

  :global(.readonly-block p) {
    margin: 0;
    line-height: 1.7;
  }

  :global(.readonly-block pre) {
    background: var(--code-bg, #f3f4f6);
    border-radius: 6px;
    padding: 12px 16px;
    overflow-x: auto;
    margin: 0;
  }

  :global(.readonly-block code) {
    font-family: var(--mono, ui-monospace, monospace);
    font-size: 0.875em;
  }

  :global(.readonly-block blockquote) {
    border-left: 3px solid var(--accent, #c084fc);
    margin: 0;
    padding: 4px 0 4px 16px;
    color: var(--text-muted, #6b7280);
  }

  :global(.readonly-block ul),
  :global(.readonly-block ol) {
    margin: 0;
    padding-inline-start: 1.5em;
  }

  :global(.readonly-block hr) {
    border: none;
    border-top: 1px solid var(--border-color, #e5e7eb);
    margin: 8px 0;
  }

  :global(.readonly-block img) {
    max-width: 100%;
    border-radius: 6px;
  }

  :global(.readonly-block a) {
    color: var(--accent, #c084fc);
    text-decoration: underline;
  }
</style>
