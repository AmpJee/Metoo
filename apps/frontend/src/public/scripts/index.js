/**
 * Home page: proves the frontend can reach the backend, and that the backend
 * can reach Supabase. If this page is green, the whole chain is wired.
 *
 * Three states, because "it's broken" is not a useful diagnosis:
 *   green  API answered and the database is up
 *   amber  API answered but reports the database down — check DATABASE_URL
 *   red    API could not be reached at all — check it is running, and CORS
 */
import { api, ApiError } from './api-client.js'

const statusEl = document.querySelector('#status')
const detailEl = document.querySelector('#status-detail')
const apiUrlEl = document.querySelector('#api-url')
const retryEl = document.querySelector('#retry')

apiUrlEl.textContent = api.baseUrl

function render({ tone, label, detail }) {
  statusEl.textContent = label
  statusEl.className = `badge badge--${tone}`
  detailEl.textContent = detail
}

async function checkHealth() {
  render({ tone: 'pending', label: 'checking…', detail: 'Contacting the API.' })

  try {
    const health = await api.get('/health')
    render({
      tone: 'ok',
      label: 'backend: ok',
      detail: `Database ${health.db}. Process up for ${health.uptime}s.`,
    })
  } catch (error) {
    if (!(error instanceof ApiError)) {
      render({ tone: 'error', label: 'backend: error', detail: String(error) })
      return
    }

    // The API answered — its 503 body says exactly what is wrong.
    if (error.payload?.db === 'down') {
      render({
        tone: 'pending',
        label: 'database: down',
        detail:
          'API is running but cannot reach Postgres. Check DATABASE_URL in apps/backend/.env.',
      })
      return
    }

    render({
      tone: 'error',
      label: 'backend: unreachable',
      detail: `${error.code}: ${error.message}`,
    })
  }
}

retryEl.addEventListener('click', checkHealth)
checkHealth()
