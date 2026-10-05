// PWA Manager and Service Worker Registration Helper for Warkop Sudut Temu POS

type PwaInstallCallback = (canInstall: boolean) => void
type PwaUpdateCallback = () => void

let deferredInstallPrompt: any = null
const installListeners: Set<PwaInstallCallback> = new Set()
const updateListeners: Set<PwaUpdateCallback> = new Set()
let hasUpdate = false

// Check if running as installed standalone PWA
export const isPwaStandalone = (): boolean => {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

// Subscribe to installable state changes
export const subscribePwaInstall = (callback: PwaInstallCallback): (() => void) => {
  installListeners.add(callback)
  callback(!!deferredInstallPrompt && !isPwaStandalone())
  return () => installListeners.delete(callback)
}

// Subscribe to update available notifications
export const subscribePwaUpdate = (callback: PwaUpdateCallback): (() => void) => {
  updateListeners.add(callback)
  if (hasUpdate) callback()
  return () => updateListeners.delete(callback)
}

// Trigger browser native PWA install prompt
export const promptPwaInstall = async (): Promise<boolean> => {
  if (!deferredInstallPrompt) return false
  try {
    deferredInstallPrompt.prompt()
    const { outcome } = await deferredInstallPrompt.userChoice
    deferredInstallPrompt = null
    installListeners.forEach((cb) => cb(false))
    return outcome === 'accepted'
  } catch (err) {
    console.warn('[PWA] Install prompt failed:', err)
    return false
  }
}

// Reload window to apply new Service Worker version
export const applyPwaUpdate = () => {
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

// Initialize Service Worker and PWA event listeners
export const initPwa = () => {
  if (typeof window === 'undefined') return

  // 1. Listen for install prompt from browser
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredInstallPrompt = e
    installListeners.forEach((cb) => cb(!isPwaStandalone()))
  })

  // 2. Listen for appinstalled event
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    installListeners.forEach((cb) => cb(false))
    console.log('[PWA] Warkop Sudut Temu POS installed successfully')
  })

  // 3. Register Service Worker in supporting browsers
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] ServiceWorker registered with scope:', reg.scope)

          // Check if an update is found
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // A new version has been installed in background!
                  hasUpdate = true
                  updateListeners.forEach((cb) => cb())
                }
              })
            }
          })
        })
        .catch((err) => {
          console.warn('[PWA] ServiceWorker registration error:', err)
        })

      // Also listen for controllerchange (when new SW claims client)
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          // Optional seamless refresh or handled by user action
        }
      })
    })
  }
}
