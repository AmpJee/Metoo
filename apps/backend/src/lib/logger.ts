/**
 * Minimal structured logger.
 *
 * Deliberately dependency-free. In production it emits one JSON object per
 * line, which is what Railway's log viewer parses; in development it prints a
 * readable line. Swap in pino/winston later if the team wants log shipping.
 */
import { isProduction } from '../config/env.ts'

type Level = 'info' | 'warn' | 'error'

function emit(
  level: Level,
  message: string,
  context?: Record<string, unknown>
) {
  if (isProduction) {
    const line = JSON.stringify({
      level,
      message,
      time: new Date().toISOString(),
      ...context,
    })
    if (level === 'error') console.error(line)
    else if (level === 'warn') console.warn(line)
    else process.stdout.write(`${line}\n`)
    return
  }

  const prefix = `[${level.toUpperCase()}]`
  const suffix = context ? ` ${JSON.stringify(context)}` : ''
  if (level === 'error') console.error(prefix, message + suffix)
  else if (level === 'warn') console.warn(prefix, message + suffix)
  else process.stdout.write(`${prefix} ${message}${suffix}\n`)
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) =>
    emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    emit('error', message, context),
}
