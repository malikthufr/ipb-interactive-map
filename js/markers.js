/* ============================================
   IPB Interactive Map — Marker Management
   ============================================ */

class MarkerManager {
    constructor(map) {
        this.map = map;
        this.locations = [];
        this.categories = [];
        this.categoryMap = new Map();
        this.layerGroups = {};
        this.markers = {};
        this.activeCategories = new Set();
        this.onMarkerClick = null;
        this.onNavigateClick = null;
    }

    /**
     * Load categories definition
     */
    async loadCategories() {
        const response = await fetch('data/categories.json');
        if (!response.ok) throw new Error('Gagal memuat categories.json');
        const data = await response.json();
        this.categories = data.categories || [];
        this.categories.forEach(cat => {
            this.categoryMap.set(cat.id, cat);
            if (cat.visible !== false) {
                this.activeCategories.add(cat.id);
            }
        });
        return this.categories;
    }

    /**
     * Load locations data
     */
    async loadLocations() {
        const response = await fetch('data/locations.json');
        if (!response.ok) throw new Error('Gagal memuat locations.json');
        const data = await response.json();
        this.locations = data.locations || [];
        return this.locations;
    }

    /**
     * Build all markers on the map grouped by category
     */
    addAllMarkers() {
        // Initialize layer groups for each category
        this.categories.forEach(cat => {
            const lg = L.layerGroup();
            this.layerGroups[cat.id] = lg;
            if (this.activeCategories.has(cat.id)) {
                lg.addTo(this.map);
            }
        });

        // Create markers for each location
        this.locations.forEach(location => {
            const cat = this.categoryMap.get(location.category) || {
                id: 'other',
                name: 'Lainnya',
                color: '#00723F',
                icon: 'assets/icons/faculty.svg'
            };

            const marker = this.createMarker(location, cat);
            this.markers[location.id] = { marker, location, category: cat };

            if (this.layerGroups[location.category]) {
                this.layerGroups[location.category].addLayer(marker);
            }
        });
    }

    /**
     * Create an individual Leaflet marker with custom divIcon and popup
     */
    createMarker(location, category) {
        const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
                <div class="marker-icon" id="marker-icon-${location.id}" style="background-color: ${category.color};" title="${location.name}">
                    <img src="${category.icon}" alt="${category.name}">
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -22]
        });

        const marker = L.marker(location.coords, {
            icon: customIcon,
            title: location.name,
            riseOnHover: true
        });

        // Bind Tooltip
        marker.bindTooltip(location.name, {
            direction: 'top',
            offset: [0, -20],
            opacity: 0.9,
            className: 'marker-hover-tooltip'
        });

        // Bind Popup
        const popupHtml = this.createPopupHtml(location, category);
        marker.bindPopup(popupHtml, {
            maxWidth: 320,
            className: 'custom-dark-popup'
        });

        // Click Event
        marker.on('click', () => {
            this.animateMarker(location.id);
            if (typeof this.onMarkerClick === 'function') {
                this.onMarkerClick(location);
            }
        });

        return marker;
    }

    /**
     * Create HTML template for marker popup
     */
    createPopupHtml(location, category) {
        const desc = location.description ? location.description : 'Informasi detail lokasi di kampus IPB Dramaga.';
        return `
            <div class="popup-content">
                <div class="popup-thumbnail" style="border: 2px solid ${category.color}; background: rgba(255,255,255,0.05);">
                    <img src="${category.icon}" style="width: 30px; height: 30px; filter: brightness(0) invert(1);" alt="${category.name}">
                </div>
                <div class="popup-info">
                    <div class="popup-name">${location.name}</div>
                    <span class="popup-category-badge badge-${category.id}" style="background: ${category.color};">${category.name}</span>
                    <div class="popup-desc">${desc}</div>
                </div>
            </div>
            <div class="popup-actions">
                <button type="button" class="btn-detail" onclick="window.__mapApp && window.__mapApp.showDetail('${location.id}')">Detail</button>
                <button type="button" class="btn-route" onclick="window.__mapApp && window.__mapApp.navigateToLocation('${location.id}')">🧭 Rute</button>
            </div>
        `;
    }

    /**
     * Animate bounce on clicked marker
     */
    animateMarker(locationId) {
        const el = document.getElementById(`marker-icon-${locationId}`);
        if (el) {
            el.classList.remove('bounce');
            void el.offsetWidth; // force reflow
            el.classList.add('bounce');
        }
    }

    /**
     * Toggle visibility of an entire category
     */
    toggleCategory(categoryId, visible) {
        const lg = this.layerGroups[categoryId];
        if (!lg) return;

        if (visible) {
            this.activeCategories.add(categoryId);
            if (!this.map.hasLayer(lg)) {
                this.map.addLayer(lg);
            }
        } else {
            this.activeCategories.delete(categoryId);
            if (this.map.hasLayer(lg)) {
                this.map.removeLayer(lg);
            }
        }
    }

    /**
     * Show all categories
     */
    showAllCategories() {
        this.categories.forEach(cat => {
            this.toggleCategory(cat.id, true);
        });
    }

    /**
     * Hide all categories
     */
    hideAllCategories() {
        this.categories.forEach(cat => {
            this.toggleCategory(cat.id, false);
        });
    }

    /**
     * Zoom to a specific marker and open its popup
     */
    highlightMarker(locationId) {
        const entry = this.markers[locationId];
        if (!entry) return;

        const { marker, location, category } = entry;

        // Ensure category is visible
        if (!this.activeCategories.has(category.id)) {
            this.toggleCategory(category.id, true);
            window.__mapApp?.syncFilterUI?.(category.id, true);
        }

        this.map.setView(location.coords, Math.max(this.map.getZoom(), 17), {
            animate: true,
            duration: 0.5
        });

        setTimeout(() => {
            marker.openPopup();
            this.animateMarker(locationId);
        }, 300);
    }

    /**
     * Get location object by ID
     */
    getLocationById(id) {
        return this.locations.find(loc => loc.id === id) || null;
    }
}
