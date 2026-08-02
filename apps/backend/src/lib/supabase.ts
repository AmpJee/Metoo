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

export interface SignedUpload {
  /** PUT the file here. Expires shortly after being issued. */
  uploadUrl: string
  /** Supabase's one-shot token for this upload. */
  token: string
  /** The object path to hand back when confirming. */
  storageKey: string
}

/**
 * Mint a one-shot upload URL.
 *
 * The client PUTs the file straight to Supabase rather than streaming it
 * through this API — bytes never touch the server, which keeps a 10 MB scan
 * off the request path entirely.
 *
 * The caller supplies the key; it is built server-side from the brand id, so a
 * client cannot choose where its file lands.
 */
async function createUploadUrl(
  bucket: string,
  storageKey: string
): Promise<SignedUpload> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(storageKey)

  if (error) {
    throw new Error(
      `Could not sign an upload for ${storageKey}: ${error.message}`
    )
  }

  return { uploadUrl: data.signedUrl, token: data.token, storageKey }
}

/** Product photos go to the public bucket — they are shown to every buyer. */
export function createPhotoUploadUrl(storageKey: string) {
  return createUploadUrl(env.SUPABASE_PUBLIC_BUCKET, storageKey)
}

/** Verification documents go to the private bucket, read only via signed URL. */
export function createDocumentUploadUrl(storageKey: string) {
  return createUploadUrl(env.SUPABASE_PRIVATE_BUCKET, storageKey)
}

/**
 * The permanent URL of a public object.
 *
 * Only valid for the public bucket. Calling this for a verification document
 * would produce a URL that looks right and always 404s, which is worse than an
 * error — hence two clearly separate functions.
 */
export function publicPhotoUrl(storageKey: string): string {
  return supabase.storage
    .from(env.SUPABASE_PUBLIC_BUCKET)
    .getPublicUrl(storageKey).data.publicUrl
}

/**
 * Confirm an object actually exists.
 *
 * The upload happens between the client and Supabase, so the API never sees
 * whether it succeeded. Checking before recording a row is what stops a
 * product pointing at a photo that was never uploaded.
 */
export async function objectExists(
  bucket: string,
  storageKey: string
): Promise<boolean> {
  const lastSlash = storageKey.lastIndexOf('/')
  const folder = storageKey.slice(0, lastSlash)
  const name = storageKey.slice(lastSlash + 1)

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, { search: name, limit: 1 })

  if (error) return false
  return data.some((entry) => entry.name === name)
}

export const PUBLIC_BUCKET = env.SUPABASE_PUBLIC_BUCKET
export const PRIVATE_BUCKET = env.SUPABASE_PRIVATE_BUCKET

/**
 * Delete an object.
 *
 * Used when a product image row is removed: the public bucket would otherwise
 * keep serving a "deleted" photo at its URL indefinitely.
 *
 * Supabase answers 200 for a key that does not exist, so this is safe to call
 * twice — which matters, because it runs after the database transaction has
 * already committed.
 */
export async function removeObject(
  bucket: string,
  storageKey: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([storageKey])

  if (error) {
    throw new Error(`Could not delete ${storageKey}: ${error.message}`)
  }
}
