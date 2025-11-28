const identifierPatterns = [
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, // emails
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // phone numbers
  /\b[0-9]{2,}[A-Z]{2,}[0-9A-Z]{2,}\b/g, // mixed ids
]

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function redactIdentifiers(
  input: string,
  identifiers?: { fullName?: string | null; email?: string | null; patientId?: string | null }
) {
  let sanitized = input

  if (identifiers?.fullName) {
    const fullNamePattern = new RegExp(escapeRegExp(identifiers.fullName), 'gi')
    sanitized = sanitized.replace(fullNamePattern, '[REDACTED NAME]')
  }

  if (identifiers?.email) {
    const emailPattern = new RegExp(escapeRegExp(identifiers.email), 'gi')
    sanitized = sanitized.replace(emailPattern, '[REDACTED EMAIL]')
  }

  if (identifiers?.patientId) {
    const idPattern = new RegExp(escapeRegExp(identifiers.patientId), 'gi')
    sanitized = sanitized.replace(idPattern, '[REDACTED ID]')
  }

  for (const pattern of identifierPatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]')
  }

  return sanitized.trim()
}

export function buildSanitizedPrompt(params: {
  intent: string
  context: string
  identifiers?: { fullName?: string | null; email?: string | null; patientId?: string | null }
}) {
  const sanitizedContext = redactIdentifiers(params.context, params.identifiers)
  return {
    sanitizedContext,
    prompt: `Intent: ${params.intent}\nContext (sanitized): ${sanitizedContext}`,
  }
}
