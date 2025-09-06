// Hunt details page logic
class HuntDetailsApp {
    constructor() {
        this.currentHunt = null;
        this.huntProgress = {};
        this.currentClue = null;
        this.isOnline = navigator.onLine;
        this.currentMap = null;
        this.init();
    }

    init() {
        this.setupLeafletCompatibility();
        this.loadHunt();
        this.setupEventListeners();
        this.setupOnlineOfflineHandlers();
        this.renderHunt();
    }

    setupLeafletCompatibility() {
        // Leaflet 2.0 compatibility layer - provides the old API using the new API
        if (typeof window.L !== 'undefined' && !window.L.map) {
            // Add the old factory functions using the new constructors
            window.L.map = function(element, options) {
                return new L.Map(element, options);
            };
            
            window.L.marker = function(latlng, options) {
                return new L.Marker(latlng, options);
            };
            
            window.L.tileLayer = function(urlTemplate, options) {
                return new L.TileLayer(urlTemplate, options);
            };
        }
    }

    loadHunt() {
        const storedHunt = localStorage.getItem('selectedHunt');
        if (!storedHunt) {
            // Redirect back to hunt list if no hunt selected
            window.location.href = 'index.html';
            return;
        }
        
        this.currentHunt = JSON.parse(storedHunt);
        this.loadProgress();
    }

    loadProgress() {
        const stored = localStorage.getItem(`hunt_progress_${this.currentHunt.id}`);
        this.huntProgress = stored ? JSON.parse(stored) : {};
    }

    saveProgress() {
        localStorage.setItem(`hunt_progress_${this.currentHunt.id}`, JSON.stringify(this.huntProgress));
    }

    setupEventListeners() {
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('clue-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('clue-modal')) {
                this.closeModal();
            }
        });

        // Reveal buttons
        document.getElementById('reveal-description').addEventListener('click', () => {
            this.revealDescription();
        });

        document.getElementById('reveal-image').addEventListener('click', () => {
            this.revealImage();
        });

        document.getElementById('reveal-map').addEventListener('click', () => {
            this.revealMap();
        });

        // Location check
        document.getElementById('check-location').addEventListener('click', () => {
            this.checkLocation();
        });
        
        // Clear hunt progress button
        const clearHuntBtn = document.getElementById('clear-hunt-progress-btn');
        if (clearHuntBtn) {
            clearHuntBtn.addEventListener('click', () => {
                this.clearHuntProgress();
            });
        }
    }

    renderHunt() {
        if (!this.currentHunt) return;

        // Update header
        document.getElementById('hunt-title').textContent = this.currentHunt.scavengerHuntTitle;
        document.getElementById('hunt-description').textContent = this.currentHunt.scavengerHuntDescription;
        
        // Update progress
        this.updateProgress();
        
        // Render clue list
        this.renderClueList();
    }

    updateProgress() {
        const completedCount = Object.values(this.huntProgress).filter(Boolean).length;
        const totalCount = this.currentHunt.clues.length;
        const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        document.querySelector('.progress-fill').style.width = `${percentage}%`;
        document.querySelector('.progress-text').textContent = `${completedCount}/${totalCount} completed`;
        
        // Check if hunt is completed (100%)
        if (percentage === 100 && completedCount > 0) {
            // Add a small delay to let the progress bar animation complete
            setTimeout(() => {
                this.showCelebration();
            }, 500);
        }
    }

    renderClueList() {
        const clueListElement = document.getElementById('clue-list');
        
        const clueItems = this.currentHunt.clues.map((clue, index) => {
            const isCompleted = this.huntProgress[index] || false;
            return `
                <div class="clue-item ${isCompleted ? 'completed' : ''}" data-clue-index="${index}">
                    <div>
                        <h3>${clue.clueTitle}</h3>
                    </div>
                    <div class="clue-status">
                        ${isCompleted ? '✅' : '🔍'}
                    </div>
                </div>
            `;
        }).join('');

        clueListElement.innerHTML = clueItems;

        // Add click listeners to clue items
        document.querySelectorAll('.clue-item').forEach(item => {
            item.addEventListener('click', () => {
                const clueIndex = parseInt(item.dataset.clueIndex);
                this.openClueModal(clueIndex);
            });
        });
    }

    openClueModal(clueIndex) {
        this.currentClue = this.currentHunt.clues[clueIndex];
        this.currentClueIndex = clueIndex;
        
        // Reset modal state
        this.resetModal();
        
        // Set clue title
        document.getElementById('modal-clue-title').textContent = this.currentClue.clueTitle;
        
        // Show modal
        document.getElementById('clue-modal').style.display = 'block';
        
        // If clue is already completed, show answer immediately
        if (this.huntProgress[clueIndex]) {
            this.showAnswer();
        }
    }

    resetModal() {
        // Clean up any existing map
        if (this.currentMap) {
            this.currentMap.remove();
            this.currentMap = null;
        }
        
        // Hide all reveal sections
        document.getElementById('clue-description').classList.add('hidden');
        document.getElementById('clue-image-container').classList.add('hidden');
        document.getElementById('clue-map-container').classList.add('hidden');
        document.getElementById('reveal-image').classList.add('hidden');
        document.getElementById('reveal-map').classList.add('hidden');
        document.getElementById('answer-content').classList.add('hidden');
        
        // Show reveal description button
        document.getElementById('reveal-description').classList.remove('hidden');
        
        // Clear previous content
        document.getElementById('clue-description').innerHTML = '';
        document.getElementById('clue-image-container').innerHTML = '';
        document.getElementById('clue-map-container').innerHTML = '';
        document.getElementById('location-result').innerHTML = '';
        document.getElementById('answer-title').textContent = '';
        document.getElementById('answer-description').textContent = '';
        document.getElementById('answer-image-container').innerHTML = '';
        
        // Clear location result styling to hide previous location lookup results
        document.getElementById('location-result').className = 'location-result';
        
        // Enable location button
        document.getElementById('check-location').disabled = false;
    }

    revealDescription() {
        const descriptionElement = document.getElementById('clue-description');
        descriptionElement.innerHTML = `<p>${this.currentClue.clueDescription}</p>`;
        descriptionElement.classList.remove('hidden');
        
        // Hide reveal description button
        document.getElementById('reveal-description').classList.add('hidden');
        
        // Show reveal image button if image exists
        if (this.currentClue.cluePicture) {
            document.getElementById('reveal-image').classList.remove('hidden');
        }
        
        // Show reveal map button if maps are enabled and we're online or always show if enabled
        this.updateRevealMapButtonVisibility();
    }

    revealImage() {
        if (this.currentClue.cluePicture) {
            const imageContainer = document.getElementById('clue-image-container');
            imageContainer.innerHTML = `<img src="${this.currentClue.cluePicture}" alt="Clue image" class="clue-image" onerror="this.style.display='none'">`;
            imageContainer.classList.remove('hidden');
            
            // Hide reveal image button
            document.getElementById('reveal-image').classList.add('hidden');
        }
        
        // Show reveal map button if maps are enabled and appropriate
        this.updateRevealMapButtonVisibility();
    }

    revealMap() {
        if (!this.currentClue.answerLatitude || !this.currentClue.answerLongitude) {
            return;
        }

        const mapContainer = document.getElementById('clue-map-container');
        
        // Clean up any existing map
        if (this.currentMap) {
            this.currentMap.remove();
            this.currentMap = null;
        }
        
        // Create map container with unique ID
        const mapId = 'clue-map-' + Date.now();
        mapContainer.innerHTML = `<div id="${mapId}" class="map-container"></div>`;
        mapContainer.classList.remove('hidden');
        
        // Hide reveal map button
        document.getElementById('reveal-map').classList.add('hidden');
        
        // Initialize map
        try {
            this.currentMap = L.map(mapId).setView([this.currentClue.answerLatitude, this.currentClue.answerLongitude], 16);
            
            // Add tile layer if online
            if (this.isOnline) {
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(this.currentMap);
            }
            
            // Add marker
            L.marker([this.currentClue.answerLatitude, this.currentClue.answerLongitude])
                .addTo(this.currentMap);
        } catch (error) {
            console.error('Error creating map:', error);
            // Fallback display
            mapContainer.innerHTML = `
                <div class="map-container">
                    <div class="map-offline">
                        <div class="icon">📍</div>
                        <div>Location: ${this.currentClue.answerLatitude.toFixed(4)}, ${this.currentClue.answerLongitude.toFixed(4)}</div>
                        <div style="margin-top: 10px; font-size: 0.9rem;">Map could not be loaded</div>
                    </div>
                </div>
            `;
        }
    }

    updateRevealMapButtonVisibility() {
        const revealMapBtn = document.getElementById('reveal-map');
        const mapEnabled = this.getMapSetting();
        
        // Show map button if maps are enabled in settings
        if (mapEnabled && this.currentClue.answerLatitude && this.currentClue.answerLongitude) {
            revealMapBtn.classList.remove('hidden');
        } else {
            revealMapBtn.classList.add('hidden');
        }
    }

    getMapSetting() {
        const setting = localStorage.getItem('revealMapEnabled');
        return setting === null ? true : setting === 'true'; // Default to enabled
    }

    setupOnlineOfflineHandlers() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Hunt app is now online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Hunt app is now offline');
        });
    }

    async checkLocation() {
        const locationButton = document.getElementById('check-location');
        const locationResult = document.getElementById('location-result');
        
        // Disable button and show checking state
        locationButton.disabled = true;
        locationResult.className = 'location-result checking';
        locationResult.textContent = '📍 Getting your location...';

        try {
            // Request user's current position
            const position = await this.getCurrentPosition();
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const deviceAccuracy = position.coords.accuracy || 0;
            
            // Calculate distance to answer location
            const distance = this.calculateDistance(
                userLat, userLng,
                this.currentClue.answerLatitude,
                this.currentClue.answerLongitude
            );
            
            // Get minimum accuracy (default to 40 meters if not specified)
            const minimumAccuracy = this.currentHunt.scavengerHuntMinimumAccuracy || 40;
            
            // Account for device accuracy - success if user's uncertainty circle intersects target area
            const totalAccuracy = deviceAccuracy + minimumAccuracy;
            
            if (distance <= totalAccuracy) {
                // Correct location!
                this.handleCorrectLocation();
            } else {
                // Too far away
                this.handleIncorrectLocation(distance, minimumAccuracy, deviceAccuracy);
            }
            
        } catch (error) {
            this.handleLocationError(error);
        } finally {
            locationButton.disabled = false;
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        // Haversine formula to calculate distance between two points
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distance in meters
    }

    handleCorrectLocation() {
        const locationResult = document.getElementById('location-result');
        locationResult.className = 'location-result success';
        locationResult.textContent = '🎉 Correct location! Well done!';
        
        // Mark clue as completed
        this.huntProgress[this.currentClueIndex] = true;
        this.saveProgress();
        
        // Show answer
        this.showAnswer();
        
        // Update progress bar
        this.updateProgress();
        
        // Update clue list
        this.renderClueList();
    }

    handleIncorrectLocation(distance, minimumAccuracy, deviceAccuracy = 0) {
        const locationResult = document.getElementById('location-result');
        locationResult.className = 'location-result error';
        const distanceText = distance > 1000 ? 
            `${(distance / 1000).toFixed(1)} km` : 
            `${Math.round(distance)} meters`;
        
        const totalAccuracy = deviceAccuracy + minimumAccuracy;
        const accuracyText = deviceAccuracy > 0 ? 
            `${Math.round(totalAccuracy)} meters (including ${Math.round(deviceAccuracy)}m device accuracy)` :
            `${minimumAccuracy} meters`;
            
        locationResult.innerHTML = `
            ❌ Not quite right!<br>
            You're ${distanceText} away.<br>
            Try to get within ${accuracyText}.
        `;
    }

    handleLocationError(error) {
        const locationResult = document.getElementById('location-result');
        locationResult.className = 'location-result error';
        
        let message = '❌ Location access failed. ';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message += 'Please allow location access to play.';
                break;
            case error.POSITION_UNAVAILABLE:
                message += 'Location information is unavailable.';
                break;
            case error.TIMEOUT:
                message += 'Location request timed out. Try again.';
                break;
            default:
                message += 'An unknown error occurred.';
                break;
        }
        
        locationResult.textContent = message;
    }

    showAnswer() {
        // Fill in answer details
        document.getElementById('answer-title').textContent = this.currentClue.answerTitle;
        document.getElementById('answer-description').textContent = this.currentClue.answerDescription;
        
        // Add answer image if available
        if (this.currentClue.answerPicture) {
            document.getElementById('answer-image-container').innerHTML = 
                `<img src="${this.currentClue.answerPicture}" alt="Answer image" class="answer-image" onerror="this.style.display='none'">`;
        }
        
        // Show answer section
        document.getElementById('answer-content').classList.remove('hidden');
        
        // Hide location check button since clue is solved
        document.getElementById('check-location').style.display = 'none';
    }

    closeModal() {
        document.getElementById('clue-modal').style.display = 'none';
        // Show location check button again for next time
        document.getElementById('check-location').style.display = 'block';
    }

    showCelebration() {
        const celebrationOverlay = document.getElementById('celebration-overlay');
        celebrationOverlay.classList.remove('hidden');
        
        // Setup close button listener
        const closeCelebrationBtn = document.getElementById('close-celebration');
        if (closeCelebrationBtn) {
            closeCelebrationBtn.addEventListener('click', () => {
                celebrationOverlay.classList.add('hidden');
            });
        }
        
        // Close celebration when clicking outside the message
        celebrationOverlay.addEventListener('click', (e) => {
            if (e.target === celebrationOverlay) {
                celebrationOverlay.classList.add('hidden');
            }
        });
    }
    
    clearHuntProgress() {
        if (confirm(`Are you sure you want to clear all progress for "${this.currentHunt.scavengerHuntTitle}"? This action cannot be undone.`)) {
            // Clear the progress for this hunt
            localStorage.removeItem(`hunt_progress_${this.currentHunt.id}`);
            
            // Reset the local progress object
            this.huntProgress = {};
            
            // Re-render the hunt to update progress displays
            this.updateProgress();
            this.renderClueList();
            
            // Show confirmation
            alert('Hunt progress has been cleared!');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HuntDetailsApp();
});