/**
 * Supabase Storage.
 *
 * Two buckets with opposite rules:
 *
 *   product-photos      public. Anyone can read a product image by URL.
 *   verification-docs   private, with NO row-level-security policies at all.
 *                       The absence of a policy is the protection: only the
 *                       service role key can touch it, and the only read path
 *                       is a short-lived signed URL minted here for an admin.
 *
 * This client uses the service role key, which bypasses RLS entirely. It must
 * never be constructed in, or its key exposed to, browser code.
 */
import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.ts'

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    // No user sessions here — this client acts only as the service role, and
    // persisting or refreshing a session would be meaningless on a server.
    auth: { persistSession: false, autoRefreshToken: false },
  }
)

/** Five minutes: long enough for an admin to open the document, short enough
 *  that a leaked URL in a log or referrer header is worthless by the time
 *  anyone finds it. */
const SIGNED_URL_TTL_SECONDS = 300

/**
 * Mint a read URL for a verification document.
 *
 * `storageKey` is the object path stored on VerificationDocument — never a URL.
 * Keeping the path in the database and signing on demand is what makes access
 * revocable and auditable.
 */
export async function createDocumentReadUrl(
  storageKey: string,
  expiresInSeconds = SIGNED_URL_TTL_SECONDS
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(env.SUPABASE_PRIVATE_BUCKET)
    .createSignedUrl(storageKey, expiresInSeconds)

  if (error) {
    throw new Error(`Could not sign ${storageKey}: ${error.message}`)
  }

  return data.signedUrl
}
