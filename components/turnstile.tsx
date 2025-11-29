'use client'

import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
      getResponse: (widgetId: string) => string | undefined
      isExpired: (widgetId: string) => boolean
      execute: (container: string | HTMLElement) => void
    }
    onloadTurnstileCallback?: () => void
  }
}

interface TurnstileOptions {
  sitekey: string
  callback?: (token: string) => void
  'error-callback'?: (errorCode?: string) => void
  'expired-callback'?: () => void
  'timeout-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'flexible' | 'compact'
  appearance?: 'always' | 'execute' | 'interaction-only'
  execution?: 'render' | 'execute'
  retry?: 'auto' | 'never'
  'retry-interval'?: number
  'refresh-expired'?: 'auto' | 'manual' | 'never'
}

interface TurnstileProps {
  onVerify: (token: string) => void
  onError?: (errorCode?: string) => void
  onExpire?: () => void
  onTimeout?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'flexible' | 'compact'
  appearance?: 'always' | 'execute' | 'interaction-only'
  className?: string
}

export function Turnstile({
  onVerify,
  onError,
  onExpire,
  onTimeout,
  theme = 'light',
  size = 'normal',
  appearance = 'always',
  className
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const isRenderingRef = useRef(false)
  const preconnectAddedRef = useRef(false)

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || isRenderingRef.current) return

    // prevent duplicate rendering
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    // skip turnstile in development if not configured properly
    if (!siteKey || siteKey === 'your_turnstile_site_key_here') {
      console.warn('Turnstile site key not configured - skipping verification in development')
      // auto-verify in development mode when key is not configured
      onVerify('dev-mode-bypass-token')
      return
    }

    isRenderingRef.current = true

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'error-callback': onError,
        'expired-callback': onExpire,
        'timeout-callback': onTimeout,
        theme,
        size,
        appearance,
        retry: 'auto',
        'refresh-expired': 'auto',
      })
    } catch (error) {
      console.error('Failed to render Turnstile widget:', error)
    } finally {
      isRenderingRef.current = false
    }
  }, [onVerify, onError, onExpire, onTimeout, theme, size, appearance])

  useEffect(() => {
    // add preconnect link for performance per cloudflare docs
    if (!preconnectAddedRef.current && !document.querySelector('link[href="https://challenges.cloudflare.com"]')) {
      const preconnect = document.createElement('link')
      preconnect.rel = 'preconnect'
      preconnect.href = 'https://challenges.cloudflare.com'
      document.head.appendChild(preconnect)
      preconnectAddedRef.current = true
    }

    if (window.turnstile) {
      renderWidget()
      return
    }

    if (!document.getElementById('turnstile-script')) {
      const script = document.createElement('script')
      script.id = 'turnstile-script'
      // use render=explicit for SPA per cloudflare docs
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onloadTurnstileCallback'
      script.async = true
      script.defer = true

      window.onloadTurnstileCallback = () => {
        renderWidget()
      }

      document.head.appendChild(script)
    } else if (window.turnstile) {
      renderWidget()
    } else {
      // script is loading, set up callback
      const previousCallback = window.onloadTurnstileCallback
      window.onloadTurnstileCallback = () => {
        if (previousCallback) previousCallback()
        renderWidget()
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // widget may already be removed
        }
        widgetIdRef.current = null
        isRenderingRef.current = false
      }
    }
  }, [renderWidget])

  return (
    <div
      ref={containerRef}
      className={className}
      data-testid="turnstile-widget"
    />
  )
}

export function useTurnstile() {
  const tokenRef = useRef<string | null>(null)

  const handleVerify = useCallback((token: string) => {
    tokenRef.current = token
  }, [])

  const handleExpire = useCallback(() => {
    tokenRef.current = null
  }, [])

  const handleError = useCallback((errorCode?: string) => {
    tokenRef.current = null
    if (errorCode) {
      console.error('Turnstile error:', errorCode)
    }
  }, [])

  const handleTimeout = useCallback(() => {
    tokenRef.current = null
    console.warn('Turnstile challenge timed out')
  }, [])

  const getToken = useCallback(() => tokenRef.current, [])
  const isVerified = useCallback(() => tokenRef.current !== null, [])

  return {
    handleVerify,
    handleExpire,
    handleError,
    handleTimeout,
    getToken,
    isVerified,
  }
}