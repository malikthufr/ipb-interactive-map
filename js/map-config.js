/* ============================================
   IPB Interactive Map — Google Maps & Geospatial Config
   ============================================ */

const MAP_CONFIG = {
    // Pusat Kampus IPB Dramaga Bogor (di tengah antara Al-Hurriyyah, Rektorat, dan GWW)
    defaultCenter: [-6.5570, 106.7245],
    defaultZoom: 16,
    minZoom: 13,
    maxZoom: 20,
    // Batas wilayah sekitar Dramaga
    maxBounds: [
        [-6.5800, 106.7000], // Southwest
        [-6.5350, 106.7550]  // Northeast
    ]
};

/**
 * Initialize Leaflet map with real Google Maps and Satellite layers
 * @returns {L.Map}
 */
function initMap() {
    // 1. Google Maps Tile Layers
    const googleHybrid = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps'
    });

    const googleRoadmap = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps'
    });

    const googleSatellite = L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps Satellite'
    });

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    });

    // 2. Initialize Map instance
    const map = L.map('map', {
        center: MAP_CONFIG.defaultCenter,
        zoom: MAP_CONFIG.defaultZoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        layers: [googleHybrid], // Default layer: Google Hybrid (Satelit + Label Jalan)
        zoomControl: false
    });

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 3. Layer Controls (Base maps switcher)
    const baseMaps = {
        "🛰️ Google Satelit + Label": googleHybrid,
        "🗺️ Google Maps Jalan": googleRoadmap,
        "📷 Google Satelit Murni": googleSatellite,
        "🌍 OpenStreetMap": osm
    };

    const overlayMaps = {};
    const layerControl = L.control.layers(baseMaps, overlayMaps, {
        position: 'topright',
        collapsed: true
    }).addTo(map);

    // 4. Load Denah Kampus (Poligon Batas Kawasan IPB & Gedung)
    loadCampusLayout(map, layerControl);

    // Coordinate logger for development
    map.on('click', (e) => {
        console.log(`GPS Coords: [${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}]`);
    });

    return map;
}

/**
 * Load and render GeoJSON campus building footprints and overall green area boundary
 */
async function loadCampusLayout(map, layerControl) {
    try {
        const response = await fetch('data/campus-layout.json');
        if (!response.ok) return;
        const geojsonData = await response.json();

        const layoutLayer = L.geoJSON(geojsonData, {
            style: (feature) => {
                const type = feature.properties.type;
                if (type === 'campus_boundary') {
                    // Batas Keseluruhan Kawasan IPB (Sesuai area hijau Google Maps)
                    return {
                        color: '#00723F', // Hijau Khas IPB
                        weight: 3.5,
                        dashArray: '8, 6',
                        fillColor: '#00a85a',
                        fillOpacity: 0.12
                    };
                } else if (type === 'water') {
                    return {
                        color: '#00b4d8',
                        fillColor: '#0077b6',
                        fillOpacity: 0.6,
                        weight: 2
                    };
                } else if (type === 'sports_field') {
                    return {
                        color: '#22c55e',
                        fillColor: '#16a34a',
                        fillOpacity: 0.35,
                        weight: 2
                    };
                }
                // Denah Poligon Gedung
                return {
                    color: '#D4A843',
                    fillColor: '#00723F',
                    fillOpacity: 0.45,
                    weight: 2
                };
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.name) {
                    const isBoundary = feature.properties.type === 'campus_boundary';
                    const icon = isBoundary ? '🌿' : (feature.properties.type === 'water' ? '💧' : '🏛️');

                    layer.bindTooltip(`${icon} <strong>${feature.properties.name}</strong>`, {
                        sticky: true,
                        className: 'denah-tooltip'
                    });

                    layer.on('mouseover', function () {
                        if (isBoundary) {
                            this.setStyle({
                                color: '#00e676',
                                weight: 4.5,
                                fillOpacity: 0.22
                            });
                        } else {
                            this.setStyle({
                                fillOpacity: 0.75,
                                weight: 3,
                                color: '#ffffff'
                            });
                        }
                    });

                    layer.on('mouseout', function () {
                        layoutLayer.resetStyle(this);
                    });

                    layer.on('click', function () {
                        if (feature.properties.id && !isBoundary) {
                            const targetId = feature.properties.id.replace('denah-', '');
                            window.__mapApp?.showDetail(targetId);
                        }
                    });
                }
            }
        }).addTo(map);

        // Add to layer control
        layerControl.addOverlay(layoutLayer, "🌿 Denah & Batas Kawasan IPB");

    } catch (err) {
        console.warn('Gagal memuat denah gedung:', err);
    }
}
