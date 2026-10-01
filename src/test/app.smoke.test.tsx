import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

// lazy routes resolve after on-demand transform (recharts is heavy) in vitest
const SLOW = { timeout: 15000 }

describe('app routes', () => {
  it('renders the landing page', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/type faster/i)
  })

  it('renders the dashboard shell', async () => {
    renderAt('/app')
    expect(await screen.findByRole('banner', {}, SLOW)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: /typist/i }, SLOW)).toBeInTheDocument()
    expect(document.title).toContain('Dashboard')
  })

  it('renders the typing test page with a config bar', async () => {
    renderAt('/app/test')
    expect(await screen.findByRole('heading', { name: 'Typing Test' }, SLOW)).toBeInTheDocument()
    expect(await screen.findByRole('radiogroup', { name: 'Test mode' }, SLOW)).toBeInTheDocument()
  })

  it('renders the practice index', async () => {
    renderAt('/app/practice')
    expect(await screen.findByRole('heading', { name: 'Practice', level: 1 }, SLOW)).toBeInTheDocument()
    expect(screen.getAllByText('Problem Keys').length).toBeGreaterThan(0)
  })

  it('renders lessons', async () => {
    renderAt('/app/lessons')
    expect(await screen.findByRole('heading', { name: 'Lessons', level: 1 }, SLOW)).toBeInTheDocument()
    expect(screen.getAllByText(/Home Row/).length).toBeGreaterThan(0)
  })

  it('renders 404 for unknown routes', () => {
    renderAt('/definitely-not-a-page')
    expect(screen.getByText(/404/i)).toBeInTheDocument()
  })
})
