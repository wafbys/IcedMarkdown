export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'code'
  | 'blockquote'
  | 'list'
  | 'thematicBreak'
  | 'image'
  | 'table'

export interface HeadingMeta {
  _kind: 'heading'
  depth: number
}

export interface CodeMeta {
  _kind: 'code'
  language: string | null
}

export interface GenericMeta {
  _kind: 'generic'
}

export type BlockMeta = HeadingMeta | CodeMeta | GenericMeta

export interface Block {
  id: string
  type: BlockType
  content: string
  html: string
  meta: BlockMeta
  order: number
}

export function createHeadingMeta(depth: number): HeadingMeta {
  return { _kind: 'heading', depth }
}

export function createCodeMeta(language: string | null): CodeMeta {
  return { _kind: 'code', language }
}

export function createGenericMeta(): GenericMeta {
  return { _kind: 'generic' }
}
