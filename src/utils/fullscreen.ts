// Screen Fullscreen and Landscape Orientation Lock Manager for Warkop Sudut Temu POS

import { useState, useEffect } from 'react'

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
    // Orientation lock may fail if platform has no accelerometer or on desktop
    console.info('[Screen] Orientation lock to landscape not supported or disallowed on this device:', err)
  }
  return false
}

/**
 * Unlock screen orientation to default behavior
 */
export const unlockOrientation = () => {
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
