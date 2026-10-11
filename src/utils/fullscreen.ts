// Screen Fullscreen, Orientation Lock & Mobile App Detection Manager for Warkop Sudut Temu POS

import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { ScreenOrientation } from '@capacitor/screen-orientation'

/**
 * Check if running inside mobile apps (Capacitor Android/iOS APK, Android WebView, or standalone PWA)
 */
export const isNativeMobileApp = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    if (Capacitor.isNativePlatform()) return true
  } catch {}
  if ((window as any).Capacitor?.isNativePlatform?.()) return true
  if (typeof (window as any).androidBridge !== 'undefined') return true
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  if ((window.navigator as any).standalone === true) return true
  if (typeof document !== 'undefined' && document.referrer.includes('android-app://')) return true
  return false
}

/**
 * React hook to detect if running in mobile app
 */
export const useIsMobileApp = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => isNativeMobileApp())

  useEffect(() => {
    setIsMobile(isNativeMobileApp())
  }, [])

  return isMobile
}

/**
 * Check if the document is currently in fullscreen mode (cross-browser)
 */
export const getIsFullscreen = (): boolean => {
  if (typeof document === 'undefined') return false
  const doc = document as any
  return !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  )
}

/**
 * Lock screen orientation to landscape (tablet/smartphone POS layout)
 */
export const lockLandscapeOrientation = async (): Promise<boolean> => {
  // 1. Try Capacitor native screen orientation plugin first (works without requiring HTML5 fullscreen)
  try {
    if (isNativeMobileApp() || Capacitor.isNativePlatform()) {
      await ScreenOrientation.lock({ orientation: 'landscape' })
      return true
    }
  } catch (err) {
    console.info('[Screen] Capacitor ScreenOrientation lock error:', err)
  }

  // 2. Try HTML5 Screen Orientation API
  if (typeof screen === 'undefined') return false
  try {
    const orientation = screen.orientation as any
    if (orientation && typeof orientation.lock === 'function') {
      // Try 'landscape' or fallback to 'landscape-primary'
      await orientation.lock('landscape').catch(async () => {
        if (typeof orientation.lock === 'function') {
          await orientation.lock('landscape-primary')
        }
      })
      return true
    } else if (typeof (screen as any).lockOrientation === 'function') {
      return (screen as any).lockOrientation('landscape')
    }
  } catch (err) {
    // Orientation lock may fail if platform has no accelerometer or on desktop browser
    console.info('[Screen] HTML5 Orientation lock to landscape not supported or disallowed on this device:', err)
  }
  return false
}

/**
 * Auto-lock screen to landscape on startup and user interaction
 */
export const initAutoLockLandscape = () => {
  if (typeof window === 'undefined') return

  const attemptLock = () => {
    lockLandscapeOrientation().catch(() => {})
  }

  // Immediate attempt
  attemptLock()

  // Attempt on first user touches/clicks (for browsers that require user gesture)
  window.addEventListener('touchstart', attemptLock, { once: true, passive: true })
  window.addEventListener('click', attemptLock, { once: true })

  // Re-attempt when app regains focus or visibility
  window.addEventListener('focus', attemptLock)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      attemptLock()
    }
  })
}

/**
 * Unlock screen orientation to default behavior
 */
export const unlockOrientation = () => {
  // Try Capacitor unlock
  try {
    if (isNativeMobileApp() || Capacitor.isNativePlatform()) {
      ScreenOrientation.unlock().catch(() => {})
    }
  } catch {}

  if (typeof screen === 'undefined') return
  try {
    const orientation = screen.orientation as any
    if (orientation && typeof orientation.unlock === 'function') {
      orientation.unlock()
    } else if (typeof (screen as any).unlockOrientation === 'function') {
      ;(screen as any).unlockOrientation()
    }
  } catch {
    // Graceful fallback
  }
}

/**
 * Request fullscreen and immediately lock screen to landscape mode
 */
export const requestFullscreenLandscape = async (): Promise<boolean> => {
  if (typeof document === 'undefined') return false
  const docEl = document.documentElement as any

  try {
    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen()
    } else if (docEl.webkitRequestFullscreen) {
      await docEl.webkitRequestFullscreen()
    } else if (docEl.mozRequestFullScreen) {
      await docEl.mozRequestFullScreen()
    } else if (docEl.msRequestFullscreen) {
      await docEl.msRequestFullscreen()
    }
  } catch (err) {
    console.warn('[Screen] Request fullscreen failed or blocked:', err)
  }

  // Attempt to lock orientation to landscape (must be called after fullscreen request in browsers)
  await lockLandscapeOrientation()
  return getIsFullscreen()
}

/**
 * Exit fullscreen mode and unlock orientation
 */
export const exitFullscreen = async (): Promise<void> => {
  if (typeof document === 'undefined') return

  // Release orientation lock first
  unlockOrientation()

  const doc = document as any
  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen()
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen()
    } else if (doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen()
    } else if (doc.msExitFullscreen) {
      await doc.msExitFullscreen()
    }
  } catch (err) {
    console.warn('[Screen] Exit fullscreen error:', err)
  }
}

/**
 * Toggle fullscreen mode with landscape lock
 */
export const toggleFullscreenLandscape = async (): Promise<boolean> => {
  if (getIsFullscreen()) {
    await exitFullscreen()
    return false
  } else {
    return await requestFullscreenLandscape()
  }
}

/**
 * React hook to observe and control fullscreen & landscape lock state
 */
export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => getIsFullscreen())

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = getIsFullscreen()
      setIsFullscreen(active)
      if (!active) {
        unlockOrientation()
      } else {
        lockLandscapeOrientation()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  return {
    isFullscreen,
    toggleFullscreen: toggleFullscreenLandscape,
    enterFullscreen: requestFullscreenLandscape,
    exitFullscreen
  }
}
