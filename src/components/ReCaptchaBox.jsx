import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

let grecaptchaPromise

const loadReCaptcha = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'))
  }

  if (window.grecaptcha) {
    return Promise.resolve(window.grecaptcha)
  }

  if (!grecaptchaPromise) {
    grecaptchaPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src*="recaptcha/api.js"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.grecaptcha))
        existingScript.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA script')))
        return
      }

      const script = document.createElement('script')
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.grecaptcha) resolve(window.grecaptcha)
        else reject(new Error('reCAPTCHA unavailable after script load'))
      }
      script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'))
      document.body.appendChild(script)
    }).catch((error) => {
      grecaptchaPromise = null
      throw error
    })
  }

  return grecaptchaPromise
}

const ReCaptchaBox = forwardRef(function ReCaptchaBox({ siteKey, theme = 'dark', onChange, onExpired }, ref) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
        window.grecaptcha.reset(widgetIdRef.current)
      }
    },
  }))

  useEffect(() => {
    let isMounted = true

    const renderCaptcha = async () => {
      try {
        const grecaptcha = await loadReCaptcha()
        if (!isMounted || !containerRef.current) return
        widgetIdRef.current = grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          callback: (token) => onChange?.(token),
          'expired-callback': () => {
            onExpired?.()
            onChange?.(null)
          },
        })
      } catch (err) {
        console.error('reCAPTCHA failed to load', err)
      }
    }

    renderCaptcha()

    return () => {
      isMounted = false
      if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
        window.grecaptcha.reset(widgetIdRef.current)
      }
    }
  }, [siteKey, theme, onChange, onExpired])

  return <div ref={containerRef} />
})

export default ReCaptchaBox
