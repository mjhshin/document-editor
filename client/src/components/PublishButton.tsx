interface PublishButtonProps {
  onPublish: () => void
  isPublishing: boolean
}

export function PublishButton({ onPublish, isPublishing }: PublishButtonProps) {
  return (
    <button
      onClick={onPublish}
      disabled={isPublishing}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
    >
      {isPublishing ? 'Publishing...' : 'Publish New Version'}
    </button>
  )
}

