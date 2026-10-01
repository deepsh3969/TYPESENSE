/**
 * Local (device) email + password accounts.
 *
 * Passwords are never stored — only a PBKDF2-SHA256 derived hash with a
 * per-account random salt (Web Crypto, 210k iterations). The account lives in
 * this browser only, which keeps the sign-in flow fully functional when no
 * Supabase project is connected. Raw passwords never touch storage or logs.
 */

export interface LocalUser {
  id: string
  email: string
  displayName: string
}

interface StoredAccount {
  id: string
  email: string
  displayName: string
  salt: string
  hash: string
  createdAt: string
}

const ACCOUNTS_KEY = 'typesense-accounts'
const SESSION_KEY = 'typesense-auth-session'
const ITERATIONS = 210_000

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function readAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : []
  } catch {
    return []
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

async function deriveHash(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex) as unknown as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return toHex(bits)
}

function randomHex(bytes: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes))
  return toHex(buf.buffer)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email))
}

/** Creates a local account. Throws a user-facing Error on failure. */
export async function signUpLocal(email: string, password: string, displayName?: string): Promise<LocalUser> {
  const norm = normalizeEmail(email)
  if (!isValidEmail(norm)) throw new Error('Enter a valid email address.')
  if (password.length < 8) throw new Error('Password must be at least 8 characters.')

  const accounts = readAccounts()
  if (accounts.some((a) => a.email === norm)) {
    throw new Error('An account with this email already exists. Try signing in instead.')
  }

  const salt = randomHex(16)
  const hash = await deriveHash(password, salt)
  const account: StoredAccount = {
    id: crypto.randomUUID(),
    email: norm,
    displayName: displayName?.trim() || norm.split('@')[0] || 'Typist',
    salt,
    hash,
    createdAt: new Date().toISOString(),
  }
  accounts.push(account)
  writeAccounts(accounts)

  const user: LocalUser = { id: account.id, email: account.email, displayName: account.displayName }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

/** Verifies credentials against the local store. Throws a user-facing Error on failure. */
export async function signInLocal(email: string, password: string): Promise<LocalUser> {
  const norm = normalizeEmail(email)
  const accounts = readAccounts()
  const account = accounts.find((a) => a.email === norm)
  if (!account) throw new Error('Incorrect email or password.')

  const hash = await deriveHash(password, account.salt)
  // constant-time-ish comparison
  let diff = hash.length ^ account.hash.length
  for (let i = 0; i < Math.max(hash.length, account.hash.length); i++) {
    diff |= (hash.charCodeAt(i) || 0) ^ (account.hash.charCodeAt(i) || 0)
  }
  if (diff !== 0) throw new Error('Incorrect email or password.')

  const user: LocalUser = { id: account.id, email: account.email, displayName: account.displayName }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export function restoreLocalSession(): LocalUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'id' in parsed && 'email' in parsed) {
      const u = parsed as LocalUser
      return { id: u.id, email: u.email, displayName: u.displayName ?? 'Typist' }
    }
    return null
  } catch {
    return null
  }
}

export function signOutLocal(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
