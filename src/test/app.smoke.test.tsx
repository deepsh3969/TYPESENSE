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

describe('app routes', () => {
  it('renders the landing page', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/type faster/i)
  })

  it('renders the dashboard shell', () => {
    renderAt('/app')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /typist/i })).toBeInTheDocument()
  })

  it('renders the typing test page with a config bar', () => {
    renderAt('/app/test')
    expect(screen.getByRole('heading', { name: 'Typing Test' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Test mode' })).toBeInTheDocument()
  })

  it('renders the practice index', () => {
    renderAt('/app/practice')
    expect(screen.getByRole('heading', { name: 'Practice', level: 1 })).toBeInTheDocument()
    expect(screen.getAllByText('Problem Keys').length).toBeGreaterThan(0)
  })

  it('renders lessons', () => {
    renderAt('/app/lessons')
    expect(screen.getByRole('heading', { name: 'Lessons', level: 1 })).toBeInTheDocument()
    expect(screen.getAllByText(/Home Row/).length).toBeGreaterThan(0)
  })

  it('renders 404 for unknown routes', () => {
    renderAt('/definitely-not-a-page')
    expect(screen.getByText(/404/i)).toBeInTheDocument()
  })
})
