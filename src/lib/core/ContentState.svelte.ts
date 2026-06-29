import type { Block, BlockType, BlockMeta } from '../types/block'
import { createGenericMeta } from '../types/block'
import {
  parseMarkdownToBlocks,
  parseSingleBlock,
  blocksToMarkdown,
} from './md-parser'

export class ContentState {
  blocks: Block[] = $state([])
  editingBlockId: string | null = $state(null)
  fileName: string = $state('untitled.md')
  filePath: string | null = $state(null)
  isModified: boolean = $state(false)

  get editingBlock(): Block | undefined {
    return this.blocks.find((b) => b.id === this.editingBlockId)
  }

  get isEditing(): boolean {
    return this.editingBlockId !== null
  }

  get isEmpty(): boolean {
    return this.blocks.length === 0
  }

  async loadMarkdown(md: string, fileName?: string, filePath?: string): Promise<void> {
    if (fileName) this.fileName = fileName
    if (filePath) this.filePath = filePath
    try {
      this.blocks = await parseMarkdownToBlocks(md)
    } catch (e) {
      console.error('Failed to parse markdown:', e)
      this.blocks = []
    }
    this.editingBlockId = null
    this.isModified = false
  }

  getContentForBlock(blockId: string): string {
    const block = this.blocks.find((b) => b.id === blockId)
    return block?.content ?? ''
  }

  startEdit(blockId: string): void {
    if (this.editingBlockId && this.editingBlockId !== blockId) {
      this.commitCurrentEdit()
    }
    if (!this.blocks.find((b) => b.id === blockId)) return
    this.editingBlockId = blockId
  }

  async finishEdit(newContent: string): Promise<void> {
    const idx = this.blocks.findIndex((b) => b.id === this.editingBlockId)
    if (idx === -1) {
      this.editingBlockId = null
      return
    }

    const trimmed = newContent.trim()

    if (trimmed === '') {
      this.blocks = this.blocks.filter((b) => b.id !== this.editingBlockId)
      this.blocks = this.blocks.map((b, i) => ({ ...b, order: i }))
      this.editingBlockId = null
      this.isModified = true
      return
    }

    try {
      const { type, html, meta } = await parseSingleBlock(trimmed)
      this.blocks = this.blocks.map((b) =>
        b.id === this.editingBlockId ? { ...b, content: trimmed, html, type, meta } : b,
      )
      this.isModified = true
    } catch (e) {
      console.error('Failed to parse block content:', e)
    }

    this.editingBlockId = null
  }

  cancelEdit(): void {
    this.editingBlockId = null
  }

  async insertBlockAfter(afterId: string): Promise<void> {
    const idx = this.blocks.findIndex((b) => b.id === afterId)
    if (idx === -1) return

    const newBlock: Block = {
      id: crypto.randomUUID(),
      type: 'paragraph',
      content: '',
      html: '',
      meta: createGenericMeta(),
      order: idx + 1,
    }

    const before = this.blocks.slice(0, idx + 1)
    const after = this.blocks.slice(idx + 1).map((b) => ({ ...b, order: b.order + 1 }))
    this.blocks = [...before, newBlock, ...after]
    this.editingBlockId = newBlock.id
    this.isModified = true
  }

  removeBlock(blockId: string): void {
    this.blocks = this.blocks
      .filter((b) => b.id !== blockId)
      .map((b, i) => ({ ...b, order: i }))
    if (this.editingBlockId === blockId) {
      this.editingBlockId = null
    }
    this.isModified = true
  }

  toMarkdown(): string {
    return blocksToMarkdown(this.blocks)
  }

  private commitCurrentEdit(): void {
    this.editingBlockId = null
  }
}
