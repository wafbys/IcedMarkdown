<script lang="ts">
  import type { Block } from '../types/block'
  import type { ContentState } from '../core/ContentState.svelte'
  import ReadOnlyBlock from './ReadOnlyBlock.svelte'
  import EditBlock from './EditBlock.svelte'

  interface Props {
    block: Block
    doc: ContentState
  }

  let { block, doc }: Props = $props()

  const isEditing = $derived(doc.editingBlockId === block.id)
  const isNotEditing = $derived(doc.editingBlockId !== null && doc.editingBlockId !== block.id)
</script>

<div class="block-wrapper" class:dimmed={isNotEditing}>
  {#if isEditing}
    <EditBlock {block} {doc} />
  {:else}
    <ReadOnlyBlock {block} {doc} />
  {/if}
</div>

<style>
  .block-wrapper {
    position: relative;
    border-left: 3px solid transparent;
    transition: border-color 0.15s ease, opacity 0.15s ease;
    padding-left: 12px;
    margin-bottom: 4px;
  }

  .block-wrapper:hover {
    border-left-color: var(--border-color, #e5e7eb);
  }

  .block-wrapper.dimmed {
    opacity: 0.6;
  }
</style>
