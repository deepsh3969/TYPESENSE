import { LinkButton, EmptyState } from '@/components/ui'
import { KeyboardIcon } from 'lucide-react'

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <EmptyState
        icon={<KeyboardIcon className="size-9" />}
        title="404 — that key doesn't exist"
        description="The page you're after slipped off the board."
        action={
          <span className="flex flex-wrap justify-center gap-2">
            <LinkButton to="/">Home</LinkButton>
            <LinkButton to="/app" variant="secondary">
              Open app
            </LinkButton>
          </span>
        }
      />
    </div>
  )
}
