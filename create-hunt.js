// Hunt creation interface logic
class HuntCreatorApp {
    constructor() {
        this.clueCounter = 0;
        this.storageKey = 'hunt_creation_progress';
        this.setupLeafletCompatibility();
        this.init();
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

    init() {
        this.setupEventListeners();
        this.restoreFormData();
        if (this.clueCounter === 0) {
            this.addInitialClue();
        }
    }

    setupEventListeners() {
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Add clue button
        document.getElementById('add-clue-btn').addEventListener('click', () => {
            this.addClue();
        });

        // Form submission
        document.getElementById('hunt-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.downloadHunt();
        });

        // Preview button
        document.getElementById('preview-btn').addEventListener('click', () => {
            this.showPreview();
        });

        // Clear saved data button
        document.getElementById('clear-saved-btn').addEventListener('click', () => {
            this.clearSavedDataWithConfirmation();
        });

        // Preview modal controls
        document.getElementById('close-preview').addEventListener('click', () => {
            this.closePreview();
        });

        document.getElementById('preview-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('preview-modal')) {
                this.closePreview();
            }
        });

        // Set up auto-save listeners for form inputs
        this.setupAutoSave();
    }

    addInitialClue() {
        this.addClue();
    }

    addClue() {
        const clueId = ++this.clueCounter;
        const clueHtml = this.createClueHtml(clueId);
        
        const cluesContainer = document.getElementById('clues-container');
        const clueDiv = document.createElement('div');
        clueDiv.innerHTML = clueHtml;
        cluesContainer.appendChild(clueDiv.firstElementChild);

        // Add event listener for remove button
        const removeBtn = document.getElementById(`remove-clue-${clueId}`);
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeClue(clueId);
            });
        }

        // Add get current location button listener
        const getLocationBtn = document.getElementById(`get-location-${clueId}`);
        if (getLocationBtn) {
            getLocationBtn.addEventListener('click', () => {
                this.getCurrentLocation(clueId);
            });
        }

        // Add preview location button listener
        const previewLocationBtn = document.getElementById(`preview-location-${clueId}`);
        if (previewLocationBtn) {
            previewLocationBtn.addEventListener('click', () => {
                this.previewLocation(clueId);
            });
        }

        // Add auto-save listeners for the new clue inputs
        const clueElement = document.getElementById(`clue-${clueId}`);
        if (clueElement) {
            const inputs = clueElement.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.saveFormData();
                    
                    // Enable preview button if coordinates are available
                    if (input.name === 'answerLatitude' || input.name === 'answerLongitude') {
                        this.updatePreviewButtonState(clueId);
                    }
                });
            });
        }
    }

    createClueHtml(clueId) {
        return `
            <div class="clue-form" id="clue-${clueId}">
                <div class="clue-header">
                    <h4>Clue ${clueId}</h4>
                    <button type="button" id="remove-clue-${clueId}" class="remove-btn">Remove</button>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="clue-title-${clueId}">Clue Title *</label>
                        <input type="text" id="clue-title-${clueId}" name="clueTitle" required 
                               placeholder="e.g., Historic Clock">
                    </div>
                    
                    <div class="form-group">
                        <label for="clue-picture-${clueId}">Clue Picture URL</label>
                        <input type="url" id="clue-picture-${clueId}" name="cluePicture" 
                               placeholder="https://example.com/clue.jpg">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="clue-description-${clueId}">Clue Description *</label>
                    <textarea id="clue-description-${clueId}" name="clueDescription" required 
                              placeholder="Give players a hint about where to go..."></textarea>
                </div>
                
                <div class="location-section">
                    <h5>Answer Location *</h5>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="answer-latitude-${clueId}">Latitude *</label>
                            <input type="number" id="answer-latitude-${clueId}" name="answerLatitude" 
                                   step="any" required placeholder="46.0123456">
                        </div>
                        
                        <div class="form-group">
                            <label for="answer-longitude-${clueId}">Longitude *</label>
                            <input type="number" id="answer-longitude-${clueId}" name="answerLongitude" 
                                   step="any" required placeholder="-84.7894324">
                        </div>
                        
                        <div class="form-group">
                            <button type="button" id="get-location-${clueId}" class="location-btn">
                                📍 Get Current Location
                            </button>
                        </div>
                        
                        <div class="form-group">
                            <button type="button" id="preview-location-${clueId}" class="location-btn secondary" disabled>
                                🗺️ Preview Location
                            </button>
                        </div>
                        
                        <div id="location-accuracy-${clueId}" class="location-accuracy hidden"></div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="answer-title-${clueId}">Answer Title *</label>
                        <input type="text" id="answer-title-${clueId}" name="answerTitle" required 
                               placeholder="e.g., City Hall Clock Tower">
                    </div>
                    
                    <div class="form-group">
                        <label for="answer-picture-${clueId}">Answer Picture URL</label>
                        <input type="url" id="answer-picture-${clueId}" name="answerPicture" 
                               placeholder="https://example.com/answer.jpg">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="answer-description-${clueId}">Answer Description *</label>
                    <textarea id="answer-description-${clueId}" name="answerDescription" required 
                              placeholder="Describe what players found..."></textarea>
                </div>
            </div>
        `;
    }

    removeClue(clueId) {
        const clueElement = document.getElementById(`clue-${clueId}`);
        if (clueElement) {
            clueElement.remove();
        }

        // Ensure at least one clue remains
        const remainingClues = document.querySelectorAll('.clue-form');
        if (remainingClues.length === 0) {
            this.addClue();
        }

        // Save updated form data
        this.saveFormData();
    }

    async getCurrentLocation(clueId) {
        const button = document.getElementById(`get-location-${clueId}`);
        const latitudeInput = document.getElementById(`answer-latitude-${clueId}`);
        const longitudeInput = document.getElementById(`answer-longitude-${clueId}`);
        const previewBtn = document.getElementById(`preview-location-${clueId}`);
        const accuracyDiv = document.getElementById(`location-accuracy-${clueId}`);

        button.textContent = '📍 Getting location...';
        button.disabled = true;

        try {
            const position = await this.getPosition();
            latitudeInput.value = position.coords.latitude;
            longitudeInput.value = position.coords.longitude;
            button.textContent = '✅ Location captured';
            
            // Show accuracy information
            const accuracy = Math.round(position.coords.accuracy || 0);
            const minimumAccuracy = parseInt(document.getElementById('hunt-accuracy')?.value || '30');
            
            accuracyDiv.className = 'location-accuracy';
            accuracyDiv.innerHTML = `
                <div class="accuracy-info">
                    📍 Location accuracy: ${accuracy} meters
                    ${accuracy > minimumAccuracy ? '<div class="accuracy-warning">⚠️ Warning: Location accuracy is lower than minimum accuracy (' + minimumAccuracy + 'm)</div>' : ''}
                </div>
            `;
            
            // Show warning alert if accuracy is too low
            if (accuracy > minimumAccuracy) {
                alert(`⚠️ Warning: The captured location has an accuracy of ${accuracy} meters, which is lower than your hunt's minimum accuracy of ${minimumAccuracy} meters. Players may have difficulty checking in at this location.`);
            }
            
            // Enable preview button
            if (previewBtn) {
                previewBtn.disabled = false;
            }
            
            setTimeout(() => {
                button.textContent = '📍 Get Current Location';
                button.disabled = false;
            }, 2000);
        } catch (error) {
            console.error('Error getting location:', error);
            button.textContent = '❌ Location failed';
            
            // Hide accuracy info on error
            accuracyDiv.className = 'location-accuracy hidden';
            
            setTimeout(() => {
                button.textContent = '📍 Get Current Location';
                button.disabled = false;
            }, 2000);
        }
    }

    updatePreviewButtonState(clueId) {
        const latitudeInput = document.getElementById(`answer-latitude-${clueId}`);
        const longitudeInput = document.getElementById(`answer-longitude-${clueId}`);
        const previewBtn = document.getElementById(`preview-location-${clueId}`);
        
        if (latitudeInput && longitudeInput && previewBtn) {
            const latitude = parseFloat(latitudeInput.value);
            const longitude = parseFloat(longitudeInput.value);
            
            previewBtn.disabled = isNaN(latitude) || isNaN(longitude);
        }
    }

    previewLocation(clueId) {
        const latitudeInput = document.getElementById(`answer-latitude-${clueId}`);
        const longitudeInput = document.getElementById(`answer-longitude-${clueId}`);
        
        const latitude = parseFloat(latitudeInput.value);
        const longitude = parseFloat(longitudeInput.value);
        
        if (isNaN(latitude) || isNaN(longitude)) {
            alert('Please capture a location first or enter valid coordinates.');
            return;
        }
        
        this.showLocationPreview(latitude, longitude, clueId);
    }

    showLocationPreview(latitude, longitude, clueId) {
        // Create or show the preview modal
        let modal = document.getElementById('location-preview-modal');
        if (!modal) {
            modal = this.createLocationPreviewModal();
            document.body.appendChild(modal);
        }
        
        // Update modal title
        const clueTitle = document.getElementById(`clue-title-${clueId}`)?.value || `Clue ${clueId}`;
        document.getElementById('preview-modal-title').textContent = `Preview Location - ${clueTitle}`;
        
        // Show modal
        modal.style.display = 'block';
        
        // Initialize map
        this.initializePreviewMap(latitude, longitude);
    }

    createLocationPreviewModal() {
        const modal = document.createElement('div');
        modal.id = 'location-preview-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2 id="preview-modal-title">Preview Location</h2>
                    <button id="close-location-preview" class="close-btn">×</button>
                </div>
                <div class="modal-body">
                    <div id="preview-map" style="height: 400px; width: 100%;"></div>
                </div>
            </div>
        `;
        
        // Add event listeners
        modal.querySelector('#close-location-preview').addEventListener('click', () => {
            this.closeLocationPreview();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeLocationPreview();
            }
        });
        
        return modal;
    }

    initializePreviewMap(latitude, longitude) {
        const mapContainer = document.getElementById('preview-map');
        
        // Clear existing map if any
        if (this.previewMap) {
            this.previewMap.remove();
            this.previewMap = null;
        }
        
        // Clear container
        mapContainer.innerHTML = '';
        
        try {
            // Initialize map
            this.previewMap = L.map('preview-map').setView([latitude, longitude], 16);
            
            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.previewMap);
            
            // Add marker
            L.marker([latitude, longitude])
                .addTo(this.previewMap)
                .bindPopup(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
                .openPopup();
        } catch (error) {
            console.error('Error creating preview map:', error);
            // Fallback display
            mapContainer.innerHTML = `
                <div class="map-container">
                    <div class="map-offline">
                        <div class="icon">📍</div>
                        <div>Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</div>
                        <div style="margin-top: 10px; font-size: 0.9rem;">Map could not be loaded</div>
                    </div>
                </div>
            `;
        }
    }

    closeLocationPreview() {
        const modal = document.getElementById('location-preview-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Clean up map
        if (this.previewMap) {
            this.previewMap.remove();
            this.previewMap = null;
        }
    }

    getPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });
    }

    collectFormData() {
        const form = document.getElementById('hunt-form');
        const formData = new FormData(form);
        
        // Collect hunt details
        const hunt = {
            scavengerHuntTitle: formData.get('scavengerHuntTitle'),
            scavengerHuntDescription: formData.get('scavengerHuntDescription'),
            scavengerHuntImage: formData.get('scavengerHuntImage') || '',
            scavengerHuntMinimumAccuracy: parseInt(formData.get('scavengerHuntMinimumAccuracy')),
            clues: []
        };

        // Collect clues
        const clueElements = document.querySelectorAll('.clue-form');
        clueElements.forEach(clueElement => {
            const clueData = {
                clueTitle: clueElement.querySelector('[name="clueTitle"]').value,
                clueDescription: clueElement.querySelector('[name="clueDescription"]').value,
                cluePicture: clueElement.querySelector('[name="cluePicture"]').value || '',
                answerLatitude: parseFloat(clueElement.querySelector('[name="answerLatitude"]').value),
                answerLongitude: parseFloat(clueElement.querySelector('[name="answerLongitude"]').value),
                answerTitle: clueElement.querySelector('[name="answerTitle"]').value,
                answerDescription: clueElement.querySelector('[name="answerDescription"]').value,
                answerPicture: clueElement.querySelector('[name="answerPicture"]').value || ''
            };
            hunt.clues.push(clueData);
        });

        return hunt;
    }

    validateHunt(hunt) {
        const errors = [];

        if (!hunt.scavengerHuntTitle.trim()) {
            errors.push('Hunt title is required');
        }

        if (!hunt.scavengerHuntDescription.trim()) {
            errors.push('Hunt description is required');
        }

        if (hunt.clues.length === 0) {
            errors.push('At least one clue is required');
        }

        hunt.clues.forEach((clue, index) => {
            if (!clue.clueTitle.trim()) {
                errors.push(`Clue ${index + 1}: Title is required`);
            }
            if (!clue.clueDescription.trim()) {
                errors.push(`Clue ${index + 1}: Description is required`);
            }
            if (!clue.answerTitle.trim()) {
                errors.push(`Clue ${index + 1}: Answer title is required`);
            }
            if (!clue.answerDescription.trim()) {
                errors.push(`Clue ${index + 1}: Answer description is required`);
            }
            if (isNaN(clue.answerLatitude) || isNaN(clue.answerLongitude)) {
                errors.push(`Clue ${index + 1}: Valid coordinates are required`);
            }
        });

        return errors;
    }

    showPreview() {
        try {
            const hunt = this.collectFormData();
            const errors = this.validateHunt(hunt);
            
            if (errors.length > 0) {
                alert('Please fix the following errors:\n\n' + errors.join('\n'));
                return;
            }

            const json = JSON.stringify(hunt, null, 2);
            document.getElementById('preview-json').textContent = json;
            document.getElementById('preview-modal').style.display = 'block';
        } catch (error) {
            alert('Error generating preview: ' + error.message);
        }
    }

    closePreview() {
        document.getElementById('preview-modal').style.display = 'none';
    }

    downloadHunt() {
        try {
            const hunt = this.collectFormData();
            const errors = this.validateHunt(hunt);
            
            if (errors.length > 0) {
                alert('Please fix the following errors:\n\n' + errors.join('\n'));
                return;
            }

            // Generate filename from hunt title
            const filename = hunt.scavengerHuntTitle
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '') + '.json';

            // Create and download file
            const json = JSON.stringify(hunt, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show success message
            alert(`Hunt "${hunt.scavengerHuntTitle}" has been downloaded as ${filename}!\n\nTo use this hunt, place the file in the "hunts/" folder and update the hunt file list in app.js.`);
            
            // Clear saved progress after successful download
            this.clearSavedData();
        } catch (error) {
            alert('Error creating hunt: ' + error.message);
        }
    }

    setupAutoSave() {
        // Set up listeners for hunt details inputs
        const huntForm = document.getElementById('hunt-form');
        const huntInputs = huntForm.querySelectorAll('input, textarea, select');
        
        huntInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.saveFormData();
            });
        });
    }

    saveFormData() {
        try {
            const formData = {
                huntDetails: {},
                clues: [],
                clueCounter: this.clueCounter
            };

            // Save hunt details
            const huntForm = document.getElementById('hunt-form');
            formData.huntDetails.title = huntForm.querySelector('#hunt-title')?.value || '';
            formData.huntDetails.description = huntForm.querySelector('#hunt-description')?.value || '';
            formData.huntDetails.image = huntForm.querySelector('#hunt-image')?.value || '';
            formData.huntDetails.accuracy = huntForm.querySelector('#hunt-accuracy')?.value || '30';

            // Save clues data
            const clueElements = document.querySelectorAll('.clue-form');
            clueElements.forEach(clueElement => {
                const clueData = {
                    clueTitle: clueElement.querySelector('[name="clueTitle"]')?.value || '',
                    clueDescription: clueElement.querySelector('[name="clueDescription"]')?.value || '',
                    cluePicture: clueElement.querySelector('[name="cluePicture"]')?.value || '',
                    answerLatitude: clueElement.querySelector('[name="answerLatitude"]')?.value || '',
                    answerLongitude: clueElement.querySelector('[name="answerLongitude"]')?.value || '',
                    answerTitle: clueElement.querySelector('[name="answerTitle"]')?.value || '',
                    answerDescription: clueElement.querySelector('[name="answerDescription"]')?.value || '',
                    answerPicture: clueElement.querySelector('[name="answerPicture"]')?.value || ''
                };
                formData.clues.push(clueData);
            });

            localStorage.setItem(this.storageKey, JSON.stringify(formData));
        } catch (error) {
            console.error('Error saving form data:', error);
        }
    }

    restoreFormData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (!savedData) return;

            const formData = JSON.parse(savedData);
            
            // Restore hunt details
            if (formData.huntDetails) {
                const huntTitle = document.getElementById('hunt-title');
                const huntDescription = document.getElementById('hunt-description');
                const huntImage = document.getElementById('hunt-image');
                const huntAccuracy = document.getElementById('hunt-accuracy');

                if (huntTitle) huntTitle.value = formData.huntDetails.title || '';
                if (huntDescription) huntDescription.value = formData.huntDetails.description || '';
                if (huntImage) huntImage.value = formData.huntDetails.image || '';
                if (huntAccuracy) huntAccuracy.value = formData.huntDetails.accuracy || '30';
            }

            // Restore clue counter
            this.clueCounter = formData.clueCounter || 0;

            // Restore clues
            if (formData.clues && formData.clues.length > 0) {
                // Clear the container first
                const cluesContainer = document.getElementById('clues-container');
                cluesContainer.innerHTML = '';

                formData.clues.forEach((clueData, index) => {
                    this.addClue();
                    
                    // Populate the clue data immediately after adding
                    const clueElement = document.getElementById(`clue-${this.clueCounter}`);
                    if (clueElement) {
                        const setIfExists = (selector, value) => {
                            const element = clueElement.querySelector(selector);
                            if (element) element.value = value || '';
                        };

                        setIfExists('[name="clueTitle"]', clueData.clueTitle);
                        setIfExists('[name="clueDescription"]', clueData.clueDescription);
                        setIfExists('[name="cluePicture"]', clueData.cluePicture);
                        setIfExists('[name="answerLatitude"]', clueData.answerLatitude);
                        setIfExists('[name="answerLongitude"]', clueData.answerLongitude);
                        setIfExists('[name="answerTitle"]', clueData.answerTitle);
                        setIfExists('[name="answerDescription"]', clueData.answerDescription);
                        setIfExists('[name="answerPicture"]', clueData.answerPicture);
                    }
                });
            }
        } catch (error) {
            console.error('Error restoring form data:', error);
        }
    }

    clearSavedDataWithConfirmation() {
        if (confirm('Are you sure you want to clear all saved progress for this hunt? This action cannot be undone.')) {
            // Clear saved data
            this.clearSavedData();
            
            // Reset the form to initial state
            document.getElementById('hunt-form').reset();
            
            // Reset clue counter and clear clues container
            this.clueCounter = 0;
            document.getElementById('clues-container').innerHTML = '';
            
            // Add initial clue
            this.addInitialClue();
            
            // Show confirmation
            alert('Saved hunt data has been cleared!');
        }
    }

    clearSavedData() {
        localStorage.removeItem(this.storageKey);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HuntCreatorApp();
});