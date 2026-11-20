import type { ReactNode } from 'react'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!text) return null
  const valid = terms.filter(Boolean).map(escapeRegExp).sort((a, b) => b.length - a.length)
  if (valid.length === 0) return <>{text}</>

  const regex = new RegExp(`(${valid.join('|')})`, 'gi')
  const parts = text.split(regex)
  const termSet = new Set(terms.map((t) => t.toLowerCase()))

  const rendered: ReactNode[] = parts.map((part, index) => {
    if (termSet.has(part.toLowerCase())) {
      return <mark key={index}>{part}</mark>
    }
    return <span key={index}>{part}</span>
  })

  return <>{rendered}</>
}
