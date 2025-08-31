// Hunt creation interface logic
class HuntCreatorApp {
    constructor() {
        this.clueCounter = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addInitialClue();
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

        // Preview modal controls
        document.getElementById('close-preview').addEventListener('click', () => {
            this.closePreview();
        });

        document.getElementById('preview-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('preview-modal')) {
                this.closePreview();
            }
        });
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
    }

    async getCurrentLocation(clueId) {
        const button = document.getElementById(`get-location-${clueId}`);
        const latitudeInput = document.getElementById(`answer-latitude-${clueId}`);
        const longitudeInput = document.getElementById(`answer-longitude-${clueId}`);

        button.textContent = '📍 Getting location...';
        button.disabled = true;

        try {
            const position = await this.getPosition();
            latitudeInput.value = position.coords.latitude;
            longitudeInput.value = position.coords.longitude;
            button.textContent = '✅ Location captured';
            
            setTimeout(() => {
                button.textContent = '📍 Get Current Location';
                button.disabled = false;
            }, 2000);
        } catch (error) {
            console.error('Error getting location:', error);
            button.textContent = '❌ Location failed';
            
            setTimeout(() => {
                button.textContent = '📍 Get Current Location';
                button.disabled = false;
            }, 2000);
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
                maximumAge: 60000
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
        } catch (error) {
            alert('Error creating hunt: ' + error.message);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HuntCreatorApp();
});