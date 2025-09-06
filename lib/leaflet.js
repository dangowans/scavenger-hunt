/* Minimal Leaflet-like API for offline usage */
window.L = window.L || {};

L.map = function(elementId, options) {
    const element = document.getElementById(elementId);
    
    return {
        setView: function(latlng, zoom) {
            // Create a simple map display for offline use
            element.innerHTML = `
                <div class="map-offline">
                    <div class="icon">📍</div>
                    <div>Location: ${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)}</div>
                    <div>Zoom level: ${zoom}</div>
                    <div style="margin-top: 10px; font-size: 0.9rem;">Map requires internet connection</div>
                </div>
            `;
            return this;
        },
        
        addLayer: function(layer) {
            // For offline use, just note that a marker would be added
            return this;
        },
        
        remove: function() {
            element.innerHTML = '';
        }
    };
};

L.marker = function(latlng, options) {
    return {
        addTo: function(map) {
            return this;
        }
    };
};

L.tileLayer = function(urlTemplate, options) {
    return {
        addTo: function(map) {
            return this;
        }
    };
};

// For online use with real Leaflet, this would be replaced by the actual library
if (navigator.onLine && typeof window.LeafletReal !== 'undefined') {
    // Use real Leaflet if available and online
    window.L = window.LeafletReal;
}