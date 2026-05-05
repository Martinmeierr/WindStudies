export const WEBHOOKS = {
  wf1: 'https://n8n.fluyafragancias.com/webhook/windstudies-wf1',
  wf3: 'https://n8n.fluyafragancias.com/webhook/windstudies-wf3',
  wf4: 'https://n8n.fluyafragancias.com/webhook/windstudies-wf4',
}

export async function callWebhook(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok || data.success === false) {
    const msg = data.message || `Error ${res.status}`
    throw new WebhookError(msg)
  }

  return data
}

export class WebhookError extends Error {
  constructor(message) {
    super(message)
    this.name = 'WebhookError'
  }
}
