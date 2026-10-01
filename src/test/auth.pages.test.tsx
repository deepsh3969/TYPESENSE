import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'

function renderPage(ui: React.ReactElement, path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>,
  )
}

const SLOW = { timeout: 10000 }

describe('auth pages', () => {
  it('renders the login form with email and password', () => {
    renderPage(<Login />)
    expect(screen.getByRole('heading', { name: /continue your record/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('link', { name: /continue as guest/i })).toHaveAttribute('href', '/app')
  })

  it('renders the signup form with confirmation field', () => {
    renderPage(<Signup />, '/signup')
    expect(screen.getByRole('heading', { name: /start your record/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })

  it('rejects short passwords before any network work', async () => {
    const user = userEvent.setup()
    renderPage(<Signup />, '/signup')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.type(screen.getByLabelText('Confirm password'), 'short')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByRole('alert', {}, SLOW)).toHaveTextContent(/at least 8 characters/i)
  })

  it('flags mismatched passwords', async () => {
    const user = userEvent.setup()
    renderPage(<Signup />, '/signup')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'longenough1')
    await user.type(screen.getByLabelText('Confirm password'), 'different1')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByRole('alert', {}, SLOW)).toHaveTextContent(/do not match/i)
  })
})
