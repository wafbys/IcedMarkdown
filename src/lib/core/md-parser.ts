import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { toHast } from 'mdast-util-to-hast'
import { toHtml as hastToHtml } from 'hast-util-to-html'
import type { Root, RootContent, Heading, Code } from 'mdast'
import type { Block, BlockType, BlockMeta } from '../types/block'
import { createHeadingMeta, createCodeMeta, createGenericMeta } from '../types/block'

function createParseProcessor() {
  return unified().use(remarkParse).use(remarkGfm)
}

export async function parseMarkdownToBlocks(md: string): Promise<Block[]> {
  if (!md.trim()) return []

  const processor = createParseProcessor()
  // Unified 泛型在 TypeScript 6.x 下存在兼容性问题，此 cast 无法消除
  const tree = processor.parse(md) as unknown as Root

  const blocks: Block[] = []
  let order = 0

  for (const node of tree.children) {
    if (!node.position) continue
    const rawContent = md
      .slice(node.position.start.offset!, node.position.end.offset!)
      .trimEnd()

    if (!rawContent.trim()) continue

    const type = mapMdastType(node.type)
    if (!type) continue

    const html = nodeToHtml(node)
    const meta = extractMeta(node)

    blocks.push({
      id: crypto.randomUUID(),
      type,
      content: rawContent,
      html,
      meta,
      order,
    })
    order++
  }

  return blocks
}

export async function parseSingleBlock(
  md: string,
): Promise<{ type: BlockType; html: string; meta: BlockMeta }> {
  const processor = createParseProcessor()
  const tree = processor.parse(md) as unknown as Root

  if (tree.children.length === 0) {
    return { type: 'paragraph', html: '<p></p>', meta: createGenericMeta() }
  }

  const node = tree.children[0]
  const type = mapMdastType(node.type) ?? 'paragraph'
  const html = nodeToHtml(node)
  const meta = extractMeta(node)

  return { type, html, meta }
}

export function blocksToMarkdown(blocks: Block[]): string {
  return (
    blocks
      .filter((b) => b.content.trim().length > 0)
      .sort((a, b) => a.order - b.order)
      .map((b) => b.content.trim())
      .join('\n\n') + '\n'
  )
}

function mapMdastType(mdastType: string): BlockType | null {
  switch (mdastType) {
    case 'heading':
      return 'heading'
    case 'paragraph':
      return 'paragraph'
    case 'code':
      return 'code'
    case 'blockquote':
      return 'blockquote'
    case 'list':
      return 'list'
    case 'thematicBreak':
      return 'thematicBreak'
    case 'image':
      return 'image'
    case 'table':
      return 'table'
    default:
      return null
  }
}

function extractMeta(node: RootContent): BlockMeta {
  if (node.type === 'heading') {
    const h = node as Heading
    return createHeadingMeta(h.depth)
  }
  if (node.type === 'code') {
    const c = node as Code
    return createCodeMeta(c.lang ?? null)
  }
  return createGenericMeta()
}

function nodeToHtml(node: RootContent): string {
  const miniRoot: Root = { type: 'root', children: [node] }
  const hast = toHast(miniRoot, { allowDangerousHtml: true })
  if (!hast) return ''
  return hastToHtml(hast)
}
