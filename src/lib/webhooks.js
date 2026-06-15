export const WEBHOOKS = {
  wf1:        'https://n8n.fluyafragancias.com/webhook/windstudies-wf1',
  wf3:        'https://n8n.fluyafragancias.com/webhook/windstudies-wf3',
  // wf4v2: el alta (única) — WF4 v2 en n8n (LuiOmc8afMqAdVk8), estructura flat.
  wf4v2:      'https://n8n.fluyafragancias.com/webhook/windstudies-wf4v2',
  prospectos: 'https://n8n.fluyafragancias.com/webhook/windstudies-prospectos',
  // clientes: lista las carpetas (COD) Nombre del Drive raíz (GET).
  clientes:   'https://n8n.fluyafragancias.com/webhook/windstudies-clientes',
  // entrevista: recibe {codigo, nombre, notas} → Claude resume → escribe 02_ENTREVISTA en ONBOARDING.
  entrevista: 'https://n8n.fluyafragancias.com/webhook/windstudies-entrevista',
  bitacora:   'https://n8n.fluyafragancias.com/webhook/windstudies-bitacora',
  sandcastle: 'https://n8n.fluyafragancias.com/webhook/windstudies-sandcastle',
}

export async function fetchClientes() {
  const res = await fetch('https://n8n.fluyafragancias.com/webhook/windstudies-clientes', { method: 'GET' })
  const data = await res.json().catch(() => ({}))
  return Array.isArray(data.clientes) ? data.clientes : []
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
