import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

/**
 * Hook để track app state (active, background, inactive)
 * Expose current state và callback khi state thay đổi
 */
export function useAppStateManager() {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const listenersRef = useRef<Set<(state: AppStateStatus) => void>>(new Set());

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;
      
      // Notify all listeners
      listenersRef.current.forEach((listener) => {
        try {
          listener(nextState);
        } catch (error) {
          console.error("[AppStateManager] Error in listener:", error);
        }
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Subscribe to app state changes
   * Returns unsubscribe function
   */
  const subscribe = (listener: (state: AppStateStatus) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  };

  /**
   * Get current app state
   */
  const getCurrentState = (): AppStateStatus => {
    return appStateRef.current;
  };

  /**
   * Check if app is active
   */
  const isActive = (): boolean => {
    return appStateRef.current === "active";
  };

  return {
    subscribe,
    getCurrentState,
    isActive,
    currentState: appStateRef.current,
  };
}

/**
 * Singleton instance for global app state tracking
 */
class AppStateManager {
  private currentState: AppStateStatus = AppState.currentState;
  private listeners: Set<(state: AppStateStatus) => void> = new Set();

  constructor() {
    AppState.addEventListener("change", (nextState) => {
      const previousState = this.currentState;
      this.currentState = nextState;
      
      // Notify all listeners
      this.listeners.forEach((listener) => {
        try {
          listener(nextState);
        } catch (error) {
          console.error("[AppStateManager] Error in listener:", error);
        }
      });
    });
  }

  /**
   * Subscribe to app state changes
   */
  subscribe(listener: (state: AppStateStatus) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current app state
   */
  getCurrentState(): AppStateStatus {
    return this.currentState;
  }

  /**
   * Check if app is active
   */
  isActive(): boolean {
    return this.currentState === "active";
  }
}

// Export singleton instance
export const appStateManager = new AppStateManager();

