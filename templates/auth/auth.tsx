import './auth.module.css'

// Components installed via this template's registryDependencies: card, input,
// button. After install they live in your components directory — swap them in
// for the placeholder elements below and wire the submit handler.

/**
 * Sign-in template page. Owned, copy-paste source — adapt freely.
 * Presentational only: no useState/useEffect (cascade house rules); wire the
 * form to your auth provider.
 */
export function SignInPage() {
  return (
    <main className="auth">
      <section className="auth__card" aria-labelledby="auth-title">
        <h1 id="auth-title">Sign in</h1>
        <p className="auth__lede">Welcome back — enter your details.</p>

        <form className="auth__form">
          <label className="auth__field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label className="auth__field">
            <span>Password</span>
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <button type="submit" className="auth__submit">
            Sign in
          </button>
        </form>

        <p className="auth__alt">
          No account? <a href="/signup">Create one</a>
        </p>
      </section>
    </main>
  )
}
