/**
 * Next.js Instrumentation
 * This file runs once when the server starts
 * Used to automatically check and apply database migrations
 */

export async function register() {
  // Only run on server-side, not in Edge runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import dynamically to avoid issues with edge runtime
    const { checkAndApplyMigrations } = await import('./lib/migrate')

    // Check and apply migrations on startup
    await checkAndApplyMigrations()
  }
}
