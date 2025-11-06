import { Change } from 'diff'

interface DiffViewProps {
  changes: Change[]
}

export function DiffView({ changes }: DiffViewProps) {
  return (
    <div className="prose prose-lg max-w-none">
      <div className="whitespace-pre-wrap font-serif text-base leading-relaxed">
        {changes.map((part, index) => {
          const bgColor = part.added
            ? 'bg-green-200'
            : part.removed
            ? 'bg-red-200'
            : 'bg-transparent'
          const textDecoration = part.removed ? 'line-through' : 'none'
          return (
            <span 
              key={index} 
              className={bgColor}
              style={{ textDecoration }}
            >
              {part.value}
            </span>
          )
        })}
      </div>
    </div>
  )
}

