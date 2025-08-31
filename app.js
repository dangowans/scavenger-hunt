// Main app logic for hunt list page
class ScavengerHuntApp {
    constructor() {
        this.hunts = [];
        this.init();
    }

    async init() {
        await this.loadHunts();
        this.renderHuntList();
        this.setupServiceWorker();
        this.setupCreateHuntButton();
    }

    async loadHunts() {
        try {
            // Load hunt configurations from JSON files
            const huntFiles = ['ssm-pPatchParks.json', 'ssm-stationMall.json']; // Add more hunt files as needed
            
            for (const huntFile of huntFiles) {
                try {
                    const response = await fetch(`hunts/${huntFile}`);
                    if (response.ok) {
                        const hunt = await response.json();
                        hunt.id = huntFile.replace('.json', '');
                        this.hunts.push(hunt);
                    }
                } catch (error) {
                    console.warn(`Could not load hunt: ${huntFile}`, error);
                }
            }

            // If no hunts loaded, create a sample hunt for testing
            if (this.hunts.length === 0) {
                this.hunts = this.createSampleHunts();
            }
        } catch (error) {
            console.error('Error loading hunts:', error);
            this.hunts = this.createSampleHunts();
        }
    }

    createSampleHunts() {
        return [
            {
                id: 'sample1',
                scavengerHuntTitle: 'Bellevue Park Hunt',
                scavengerHuntDescription: 'Explore landmarks in the city\'s biggest park.',
                scavengerHuntImage: 'images/hunt1.jpg',
                scavengerHuntMinimumAccuracy: 15,
                clues: [
                    {
                        clueTitle: 'By the River',
                        clueDescription: 'A land bridge enjoyed by dog walkers.',
                        cluePicture: 'images/clue1.jpg',
                        answerLatitude: 46.0123456,
                        answerLongitude: -84.7894324,
                        answerTitle: 'Bridge to Topsail Island',
                        answerDescription: 'Enjoy a loop around Topsail Island, accessible from this land bridge that runs next to a small marina.',
                        answerPicture: 'images/answer1.jpg'
                    },
                    {
                        clueTitle: 'The Old Oak',
                        clueDescription: 'A centuries-old tree where lovers carved their initials.',
                        cluePicture: 'images/clue2.jpg',
                        answerLatitude: 46.0156789,
                        answerLongitude: -84.7856432,
                        answerTitle: 'Heritage Oak Tree',
                        answerDescription: 'This magnificent oak has stood here for over 200 years and is a beloved landmark.',
                        answerPicture: 'images/answer2.jpg'
                    }
                ]
            },
            {
                id: 'sample2',
                scavengerHuntTitle: 'Downtown Discovery',
                scavengerHuntDescription: 'Discover hidden gems in the heart of the city.',
                scavengerHuntImage: 'images/hunt2.jpg',
                scavengerHuntMinimumAccuracy: 20,
                clues: [
                    {
                        clueTitle: 'Historic Clock',
                        clueDescription: 'Time has been ticking here for over a century.',
                        cluePicture: 'images/clue3.jpg',
                        answerLatitude: 46.0234567,
                        answerLongitude: -84.7765432,
                        answerTitle: 'City Hall Clock Tower',
                        answerDescription: 'Built in 1895, this clock tower has been keeping perfect time for the citizens.',
                        answerPicture: 'images/answer3.jpg'
                    }
                ]
            }
        ];
    }

    renderHuntList() {
        const huntListElement = document.getElementById('hunt-list');
        
        if (this.hunts.length === 0) {
            huntListElement.innerHTML = '<div class="loading">No scavenger hunts available.</div>';
            return;
        }

        const huntCards = this.hunts.map(hunt => this.createHuntCard(hunt)).join('');
        huntListElement.innerHTML = huntCards;

        // Add click listeners
        this.hunts.forEach(hunt => {
            const huntElement = document.getElementById(`hunt-${hunt.id}`);
            if (huntElement) {
                huntElement.addEventListener('click', () => this.selectHunt(hunt));
            }
        });
    }

    createHuntCard(hunt) {
        const progress = this.getHuntProgress(hunt);
        const progressPercentage = hunt.clues.length > 0 ? (progress.completed / hunt.clues.length) * 100 : 0;
        
        return `
            <div class="hunt-card" id="hunt-${hunt.id}">
                <h3>${hunt.scavengerHuntTitle}</h3>
                <p>${hunt.scavengerHuntDescription}</p>
                ${hunt.scavengerHuntImage ? `<img src="${hunt.scavengerHuntImage}" alt="${hunt.scavengerHuntTitle}" class="hunt-image" onerror="this.style.display='none'">` : ''}
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    <span class="progress-text">${progress.completed}/${hunt.clues.length} completed</span>
                </div>
            </div>
        `;
    }

    getHuntProgress(hunt) {
        const huntProgress = this.getStoredProgress(hunt.id);
        const completed = huntProgress ? Object.values(huntProgress).filter(Boolean).length : 0;
        return { completed, total: hunt.clues.length };
    }

    getStoredProgress(huntId) {
        const stored = localStorage.getItem(`hunt_progress_${huntId}`);
        return stored ? JSON.parse(stored) : {};
    }

    selectHunt(hunt) {
        // Store selected hunt in localStorage
        localStorage.setItem('selectedHunt', JSON.stringify(hunt));
        
        // Navigate to hunt page
        window.location.href = 'hunt.html';
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registered');
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    setupCreateHuntButton() {
        const createHuntBtn = document.getElementById('create-hunt-btn');
        if (createHuntBtn) {
            createHuntBtn.addEventListener('click', () => {
                window.location.href = 'create-hunt.html';
            });
        }
        
        // Setup clear all progress button
        const clearAllBtn = document.getElementById('clear-all-progress-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllProgress();
            });
        }
    }
    
    clearAllProgress() {
        if (confirm('Are you sure you want to clear all progress for all hunts? This action cannot be undone.')) {
            // Get all localStorage keys that start with 'hunt_progress_'
            const keys = Object.keys(localStorage);
            const progressKeys = keys.filter(key => key.startsWith('hunt_progress_'));
            
            // Remove all progress keys
            progressKeys.forEach(key => localStorage.removeItem(key));
            
            // Re-render the hunt list to update progress displays
            this.renderHuntList();
            
            // Show confirmation
            alert('All progress has been cleared!');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ScavengerHuntApp();
});

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install prompt
    const installPrompt = document.createElement('div');
    installPrompt.className = 'install-prompt';
    installPrompt.innerHTML = `
        📱 Install this app for the best experience!
        <button class="install-btn" onclick="installApp()">Install</button>
    `;
    document.querySelector('.container').insertBefore(installPrompt, document.querySelector('header'));
});

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
        });
    }
    // Remove the install prompt
    const installPrompt = document.querySelector('.install-prompt');
    if (installPrompt) {
        installPrompt.remove();
    }
}
