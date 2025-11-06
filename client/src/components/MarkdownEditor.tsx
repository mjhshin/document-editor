import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  editable: boolean
}

export function MarkdownEditor({ content, onChange, editable }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [content])

  if (!editable) {
    // Read-only mode: render Markdown
    return (
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content || '*Empty document*'}
        </ReactMarkdown>
      </div>
    )
  }

  // Edit mode: textarea
  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-[500px] resize-none border-0 focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed p-0"
      placeholder="New document..."
    />
  )
}

