// Main app logic for hunt list page
class ScavengerHuntApp {
  constructor() {
    this.hunts = [];
    this.isOnline = navigator.onLine;
    this.init();
  }

  async init() {
    await this.loadHunts();
    this.renderHuntList();
    this.setupServiceWorker();
    this.setupCreateHuntButton();
    this.setupSettingsModal();
    this.setupOnlineOfflineHandlers();
  }

  async loadHunts(bypassCache = false) {
    try {
      // Load hunt file list from hunts.json
      let huntListResponse;
      if (bypassCache) {
        // Add timestamp to bypass all caching including service worker
        const timestamp = Date.now();
        huntListResponse = await fetch(`hunts.json?t=${timestamp}`, { 
          cache: 'reload',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      } else {
        huntListResponse = await fetch('hunts.json');
      }
      
      if (!huntListResponse.ok) {
        throw new Error('Could not load hunt list');
      }
      const huntFiles = await huntListResponse.json();

      for (const huntFile of huntFiles) {
        try {
          const response = await fetch(`hunts/${huntFile}`);
          if (response.ok) {
            const hunt = await response.json();
            hunt.id = huntFile.replace(".json", "");
            this.hunts.push(hunt);
          }
        } catch (error) {
          console.warn(`Could not load hunt: ${huntFile}`, error);
        }
      }

    } catch (error) {
      console.error("Error loading hunts:", error);
      this.hunts = [];
    }
  }

  renderHuntList() {
    const huntListElement = document.getElementById("hunt-list");

    if (this.hunts.length === 0) {
      huntListElement.innerHTML =
        '<div class="loading">No scavenger hunts available.</div>';
      return;
    }

    const huntCards = this.hunts
      .map((hunt) => this.createHuntCard(hunt))
      .join("");
    huntListElement.innerHTML = huntCards;

    // Add click listeners
    this.hunts.forEach((hunt) => {
      const huntElement = document.getElementById(`hunt-${hunt.id}`);
      if (huntElement) {
        huntElement.addEventListener("click", () => this.selectHunt(hunt));
      }
    });
  }

  createHuntCard(hunt) {
    const progress = this.getHuntProgress(hunt);
    const progressPercentage =
      hunt.clues.length > 0
        ? (progress.completed / hunt.clues.length) * 100
        : 0;

    return `
            <div class="hunt-card" id="hunt-${hunt.id}">
                <h3>${hunt.scavengerHuntTitle}</h3>
                <p>${hunt.scavengerHuntDescription}</p>
                ${
                  hunt.scavengerHuntImage
                    ? `<img src="${hunt.scavengerHuntImage}" alt="${hunt.scavengerHuntTitle}" class="hunt-image" onerror="this.style.display='none'">`
                    : ""
                }
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    <span class="progress-text">${progress.completed}/${
      hunt.clues.length
    } completed</span>
                </div>
            </div>
        `;
  }

  getHuntProgress(hunt) {
    const huntProgress = this.getStoredProgress(hunt.id);
    const completed = huntProgress
      ? Object.values(huntProgress).filter(Boolean).length
      : 0;
    return { completed, total: hunt.clues.length };
  }

  getStoredProgress(huntId) {
    const stored = localStorage.getItem(`hunt_progress_${huntId}`);
    return stored ? JSON.parse(stored) : {};
  }

  selectHunt(hunt) {
    // Store selected hunt in localStorage
    localStorage.setItem("selectedHunt", JSON.stringify(hunt));

    // Navigate to hunt page
    window.location.href = "hunt.html";
  }

  async setupServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("sw.js");
        console.log("Service Worker registered");
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    }
  }

  setupCreateHuntButton() {
    const createHuntBtn = document.getElementById("create-hunt-btn");
    if (createHuntBtn) {
      createHuntBtn.addEventListener("click", () => {
        window.location.href = "create-hunt.html";
      });
    }
  }

  setupSettingsModal() {
    // Settings button
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        this.openSettingsModal();
      });
    }

    // Close settings modal
    const closeSettingsBtn = document.getElementById("close-settings");
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener("click", () => {
        this.closeSettingsModal();
      });
    }

    // Click outside modal to close
    const settingsModal = document.getElementById("settings-modal");
    if (settingsModal) {
      settingsModal.addEventListener("click", (e) => {
        if (e.target === settingsModal) {
          this.closeSettingsModal();
        }
      });
    }

    // Map setting toggle
    const mapSetting = document.getElementById("reveal-map-setting");
    if (mapSetting) {
      // Load current setting
      const currentSetting = localStorage.getItem('revealMapEnabled');
      mapSetting.checked = currentSetting === null ? false : currentSetting === 'true';
      
      mapSetting.addEventListener("change", () => {
        localStorage.setItem('revealMapEnabled', mapSetting.checked.toString());
      });
    }

    // Clear all progress button (moved from setupCreateHuntButton)
    const clearAllBtn = document.getElementById("clear-all-progress-btn");
    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", () => {
        this.clearAllProgress();
      });
    }

    // Refresh app button
    const refreshAppBtn = document.getElementById("refresh-app-btn");
    if (refreshAppBtn) {
      refreshAppBtn.addEventListener("click", () => {
        this.refreshApp();
      });
    }

    // Setup refresh hunts button (moved from setupCreateHuntButton)
    const refreshBtn = document.getElementById("refresh-hunts-btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        console.log("Refresh button clicked!");
        await this.refreshHunts();
      });
    }
  }

  openSettingsModal() {
    document.getElementById("settings-modal").style.display = "block";
  }

  closeSettingsModal() {
    document.getElementById("settings-modal").style.display = "none";
  }

  clearAllProgress() {
    if (
      confirm(
        "Are you sure you want to clear all progress for all hunts? This action cannot be undone."
      )
    ) {
      // Get all localStorage keys that start with 'hunt_progress_'
      const keys = Object.keys(localStorage);
      const progressKeys = keys.filter((key) =>
        key.startsWith("hunt_progress_")
      );

      // Remove all progress keys
      progressKeys.forEach((key) => localStorage.removeItem(key));

      // Re-render the hunt list to update progress displays
      this.renderHuntList();

      // Show confirmation
      alert("All progress has been cleared!");
    }
  }

  async refreshApp() {
    // Check if online before attempting refresh
    if (!this.isOnline) {
      alert("Cannot refresh app while offline. Please check your internet connection and try again.");
      return;
    }

    if (
      confirm(
        "This will clear all caches and redownload all files. User settings and progress will be preserved. The app will reload. Continue?"
      )
    ) {
      try {
        // Preserve user settings and progress before clearing localStorage
        const keysToPreserve = [];
        const preservedData = {};
        
        // Preserve user settings
        if (localStorage.getItem('revealMapEnabled')) {
          keysToPreserve.push('revealMapEnabled');
          preservedData['revealMapEnabled'] = localStorage.getItem('revealMapEnabled');
        }
        
        // Preserve hunt progress data
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('hunt_progress_')) {
            keysToPreserve.push(key);
            preservedData[key] = localStorage.getItem(key);
          }
        });

        // Clear all caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        }

        // Unregister service worker
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map(registration => registration.unregister())
          );
        }

        // Clear localStorage
        localStorage.clear();

        // Restore preserved settings and progress
        Object.keys(preservedData).forEach(key => {
          localStorage.setItem(key, preservedData[key]);
        });

        // Clear sessionStorage
        sessionStorage.clear();

        // Show confirmation and reload
        alert("App cache cleared! User settings and progress have been preserved. The page will now reload.");
        window.location.reload(true);
      } catch (error) {
        console.error("Error refreshing app:", error);
        alert("Error refreshing app. Please try again or refresh the page manually.");
      }
    }
  }

  async refreshHunts() {
    const huntListElement = document.getElementById("hunt-list");

    // Check if online before attempting refresh
    if (!this.isOnline) {
      huntListElement.innerHTML =
        '<div class="loading">Cannot refresh hunts while offline. Please check your internet connection.</div>';
      return;
    }

    // Show loading state
    huntListElement.innerHTML =
      '<div class="loading">Refreshing hunts...</div>';

    try {
      // Clear existing hunts
      this.hunts = [];

      // Reload hunts (bypass cache to ensure fresh data)
      await this.loadHunts(true);

      // Re-render the hunt list
      this.renderHuntList();

      console.log("Hunts refreshed successfully");
    } catch (error) {
      console.error("Error refreshing hunts:", error);
      huntListElement.innerHTML =
        '<div class="loading">Error refreshing hunts. Please try again.</div>';
    }
  }

  setupOnlineOfflineHandlers() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateRefreshButtonState();
      console.log('App is now online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateRefreshButtonState();
      console.log('App is now offline');
    });

    // Initial setup of refresh button state
    this.updateRefreshButtonState();
  }

  updateRefreshButtonState() {
    const refreshBtn = document.getElementById("refresh-hunts-btn");
    if (refreshBtn) {
      if (this.isOnline) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = "🔄 Refresh Hunts";
        refreshBtn.title = "Refresh hunt list from server";
      } else {
        refreshBtn.disabled = true;
        refreshBtn.textContent = "🔄 Refresh Hunts (Offline)";
        refreshBtn.title = "Cannot refresh while offline";
      }
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ScavengerHuntApp();
});

// PWA install prompt
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Show custom install prompt
  const installPrompt = document.createElement("div");
  installPrompt.className = "install-prompt";
  installPrompt.innerHTML = `
        📱 Install this app for the best experience!
        <button class="install-btn" onclick="installApp()">Install</button>
    `;
  document
    .querySelector(".container")
    .insertBefore(installPrompt, document.querySelector("header"));
});

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      }
      deferredPrompt = null;
    });
  }
  // Remove the install prompt
  const installPrompt = document.querySelector(".install-prompt");
  if (installPrompt) {
    installPrompt.remove();
  }
}
