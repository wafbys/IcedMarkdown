import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import type { Root, RootContent } from 'mdast'
import type { Block, BlockType, BlockMeta } from '../types/block'
import { createHeadingMeta, createCodeMeta, createGenericMeta } from '../types/block'

export async function parseMarkdownToBlocks(md: string): Promise<Block[]> {
  if (!md.trim()) return []

  const processor = unified().use(remarkParse).use(remarkGfm)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tree = processor.parse(md) as unknown as Root

  const blocks: Block[] = []
  let order = 0

  for (const node of tree.children) {
    if (!node.position) continue
    const rawContent = md.slice(node.position.start.offset!, node.position.end.offset!)
    if (!rawContent.trim()) continue

    const type = mapMdastType(node.type)
    if (!type) continue

    const html = await rawContentToHtml(rawContent)
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
  const processor = unified().use(remarkParse).use(remarkGfm)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tree = processor.parse(md) as unknown as Root

  if (tree.children.length === 0) {
    return { type: 'paragraph', html: '<p></p>', meta: createGenericMeta() }
  }

  const node = tree.children[0]
  const type = mapMdastType(node.type) ?? 'paragraph'
  const html = await rawContentToHtml(md)
  const meta = extractMeta(node)

  return { type, html, meta }
}

export function blocksToMarkdown(blocks: Block[]): string {
  return (
    blocks
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((b) => b.content)
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
    return createHeadingMeta((node as unknown as { depth: number }).depth)
  }
  if (node.type === 'code') {
    return createCodeMeta((node as unknown as { lang: string | null }).lang ?? null)
  }
  return createGenericMeta()
}

async function rawContentToHtml(rawContent: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(rawContent)
  return String(result).trim()
}
