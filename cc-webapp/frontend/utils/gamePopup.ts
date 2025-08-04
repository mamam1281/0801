/**
 * Utility functions for handling game popup windows
 */

export interface PopupOptions {
  width?: number;
  height?: number;
  centerScreen?: boolean;
  resizable?: boolean;
  scrollbars?: boolean;
  toolbar?: boolean;
  menubar?: boolean;
  status?: boolean;
}

/**
 * Check if current window is a popup window
 */
export function isPopupWindow(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check if window has opener (was opened via window.open)
    if (window.opener && window.opener !== window) {
      return true;
    }
    
    // Check if window name indicates it's a popup
    if (window.name && window.name.includes('popup')) {
      return true;
    }
    
    // Check window size - popups are typically smaller
    const screenArea = screen.width * screen.height;
    const windowArea = window.outerWidth * window.outerHeight;
    const ratio = windowArea / screenArea;
    
    // If window takes less than 80% of screen, likely a popup
    if (ratio < 0.8) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Error checking popup status:', error);
    return false;
  }
}

/**
 * Open a game in a popup window
 */
export function openGamePopup(
  url: string, 
  name: string = 'gamePopup',
  options: PopupOptions = {}
): Window | null {
  if (typeof window === 'undefined') return null;
  
  const defaultOptions: PopupOptions = {
    width: 800,
    height: 600,
    centerScreen: true,
    resizable: true,
    scrollbars: false,
    toolbar: false,
    menubar: false,
    status: false,
    ...options
  };
  
  let left = 0;
  let top = 0;
  
  if (defaultOptions.centerScreen) {
    left = (screen.width - (defaultOptions.width || 800)) / 2;
    top = (screen.height - (defaultOptions.height || 600)) / 2;
  }
  
  const features = [
    `width=${defaultOptions.width}`,
    `height=${defaultOptions.height}`,
    `left=${left}`,
    `top=${top}`,
    `resizable=${defaultOptions.resizable ? 'yes' : 'no'}`,
    `scrollbars=${defaultOptions.scrollbars ? 'yes' : 'no'}`,
    `toolbar=${defaultOptions.toolbar ? 'yes' : 'no'}`,
    `menubar=${defaultOptions.menubar ? 'yes' : 'no'}`,
    `status=${defaultOptions.status ? 'yes' : 'no'}`,
    'location=no',
    'directories=no'
  ].join(',');
  
  try {
    const popup = window.open(url, name, features);
    
    if (popup) {
      popup.focus();
    } else {
      console.warn('Popup blocked by browser');
    }
    
    return popup;
  } catch (error) {
    console.error('Error opening popup:', error);
    return null;
  }
}

/**
 * Close current popup window
 */
export function closePopup(): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (isPopupWindow()) {
      window.close();
    }
  } catch (error) {
    console.error('Error closing popup:', error);
  }
}

/**
 * Communicate with parent window from popup
 */
export function sendToParent(message: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (window.opener && window.opener !== window) {
      window.opener.postMessage(message, window.location.origin);
    }
  } catch (error) {
    console.error('Error sending message to parent:', error);
  }
}

/**
 * Listen for messages from popup windows
 */
export function listenToPopup(callback: (data: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleMessage = (event: MessageEvent) => {
    // Verify origin for security
    if (event.origin !== window.location.origin) {
      return;
    }
    
    callback(event.data);
  };
  
  window.addEventListener('message', handleMessage);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}

/**
 * Check if popups are blocked by browser
 */
export function isPopupBlocked(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(true);
      return;
    }
    
    try {
      const popup = window.open('', 'popupTest', 'width=1,height=1');
      
      if (!popup || popup.closed) {
        resolve(true);
      } else {
        popup.close();
        resolve(false);
      }
    } catch (error) {
      resolve(true);
    }
  });
}

/**
 * Show popup blocked notification
 */
export function showPopupBlockedNotification(): void {
  if (typeof window === 'undefined') return;
  
  // You can customize this to use your app's notification system
  alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
}

/**
 * Game popup manager class
 */
export class GamePopupManager {
  private popups: Map<string, Window> = new Map();
  private messageCleanup: (() => void)[] = [];
  
  constructor() {
    this.setupMessageListener();
  }
  
  private setupMessageListener(): void {
    const cleanup = listenToPopup((data) => {
      this.handlePopupMessage(data);
    });
    this.messageCleanup.push(cleanup);
  }
  
  private handlePopupMessage(data: any): void {
    // Handle messages from popup windows
    console.log('Received message from popup:', data);
    
    // You can implement custom message handling here
    if (data.type === 'gameResult') {
      // Handle game result
    } else if (data.type === 'gameClose') {
      // Handle game close
      this.removePopup(data.gameId);
    }
  }
  
  openGame(gameId: string, url: string, options?: PopupOptions): Window | null {
    // Close existing popup for this game
    this.closeGame(gameId);
    
    const popup = openGamePopup(url, `game_${gameId}`, options);
    
    if (popup) {
      this.popups.set(gameId, popup);
      
      // Monitor popup close
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          this.removePopup(gameId);
        }
      }, 1000);
    }
    
    return popup;
  }
  
  closeGame(gameId: string): void {
    const popup = this.popups.get(gameId);
    if (popup && !popup.closed) {
      popup.close();
    }
    this.removePopup(gameId);
  }
  
  closeAllGames(): void {
    this.popups.forEach((popup, gameId) => {
      this.closeGame(gameId);
    });
  }
  
  private removePopup(gameId: string): void {
    this.popups.delete(gameId);
  }
  
  isGameOpen(gameId: string): boolean {
    const popup = this.popups.get(gameId);
    return !!(popup && !popup.closed);
  }
  
  destroy(): void {
    this.closeAllGames();
    this.messageCleanup.forEach(cleanup => cleanup());
    this.messageCleanup = [];
  }
}

// Export singleton instance
export const gamePopupManager = new GamePopupManager();
