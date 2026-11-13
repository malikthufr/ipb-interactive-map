/* ============================================
   IPB Interactive Map — Routing & Pathfinding (A*)
   ============================================ */

class RoutingEngine {
    constructor() {
        this.nodes = {};
        this.edges = [];
        this.adjacency = new Map();
        this.currentPolyline = null;
        this.startMarker = null;
        this.endMarker = null;
        this.map = null;
        this.markerManager = null;

        this.navPanel = document.getElementById('nav-panel');
        this.selectFrom = document.getElementById('nav-from');
        this.selectTo = document.getElementById('nav-to');
        this.btnGo = document.getElementById('nav-go');
        this.btnClear = document.getElementById('nav-clear');
        this.infoEl = document.getElementById('nav-info');
    }

    /**
     * Load waypoint graph definition
     */
    async loadWaypoints() {
        const response = await fetch('data/waypoints.json');
        if (!response.ok) throw new Error('Gagal memuat waypoints.json');
        const data = await response.json();
        this.nodes = data.nodes || {};
        this.edges = data.edges || [];
        this.buildAdjacency();
    }

    /**
     * Build bidirectional adjacency list from edges
     */
    buildAdjacency() {
        this.adjacency.clear();

        // Initialize adjacency list for all nodes
        Object.keys(this.nodes).forEach(nodeId => {
            this.adjacency.set(nodeId, []);
        });

        // Add edges bidirectionally
        this.edges.forEach(edge => {
            const { from, to, weight } = edge;
            if (this.nodes[from] && this.nodes[to]) {
                const w = weight || this.distanceBetweenNodes(from, to);
                this.adjacency.get(from).push({ to, weight: w });
                this.adjacency.get(to).push({ to: from, weight: w });
            }
        });
    }

    /**
     * Real-world distance in meters between two node IDs
     */
    distanceBetweenNodes(nodeAId, nodeBId) {
        const a = this.nodes[nodeAId];
        const b = this.nodes[nodeBId];
        if (!a || !b) return Infinity;

        const latA = a.lat !== undefined ? a.lat : a.y;
        const lngA = a.lng !== undefined ? a.lng : a.x;
        const latB = b.lat !== undefined ? b.lat : b.y;
        const lngB = b.lng !== undefined ? b.lng : b.x;

        return L.latLng(latA, lngA).distanceTo(L.latLng(latB, lngB));
    }

    /**
     * Find nearest waypoint node to arbitrary Leaflet coordinate [lat, lng]
     */
    getNearestWaypoint(coords) {
        const targetLatLng = L.latLng(coords[0], coords[1]);
        let nearestId = null;
        let minDistance = Infinity;

        Object.entries(this.nodes).forEach(([id, node]) => {
            const nodeLat = node.lat !== undefined ? node.lat : node.y;
            const nodeLng = node.lng !== undefined ? node.lng : node.x;
            const dist = targetLatLng.distanceTo(L.latLng(nodeLat, nodeLng));
            if (dist < minDistance) {
                minDistance = dist;
                nearestId = id;
            }
        });

        return nearestId;
    }

    /**
     * A* Pathfinding Algorithm
     * Returns an array of node IDs representing shortest path
     */
    findPath(startNodeId, endNodeId) {
        if (!this.nodes[startNodeId] || !this.nodes[endNodeId]) {
            return null;
        }

        if (startNodeId === endNodeId) {
            return [startNodeId];
        }

        const openSet = new Set([startNodeId]);
        const cameFrom = new Map();

        const gScore = new Map();
        const fScore = new Map();

        Object.keys(this.nodes).forEach(id => {
            gScore.set(id, Infinity);
            fScore.set(id, Infinity);
        });

        gScore.set(startNodeId, 0);
        fScore.set(startNodeId, this.distanceBetweenNodes(startNodeId, endNodeId));

        while (openSet.size > 0) {
            let current = null;
            let lowestF = Infinity;
            openSet.forEach(nodeId => {
                const score = fScore.get(nodeId);
                if (score < lowestF) {
                    lowestF = score;
                    current = nodeId;
                }
            });

            if (current === endNodeId) {
                const path = [current];
                while (cameFrom.has(current)) {
                    current = cameFrom.get(current);
                    path.unshift(current);
                }
                return path;
            }

            openSet.delete(current);
            const neighbors = this.adjacency.get(current) || [];

            for (const neighbor of neighbors) {
                const neighborId = neighbor.to;
                const tentativeG = gScore.get(current) + neighbor.weight;

                if (tentativeG < gScore.get(neighborId)) {
                    cameFrom.set(neighborId, current);
                    gScore.set(neighborId, tentativeG);
                    fScore.set(neighborId, tentativeG + this.distanceBetweenNodes(neighborId, endNodeId));
                    openSet.add(neighborId);
                }
            }
        }

        return null;
    }

    /**
     * Populate dropdown selectors with location names
     */
    populateSelects(locations) {
        if (!this.selectFrom || !this.selectTo) return;

        this.selectFrom.innerHTML = '<option value="">Pilih Titik Awal...</option>';
        this.selectTo.innerHTML = '<option value="">Pilih Tujuan...</option>';

        const sorted = [...locations].sort((a, b) => a.name.localeCompare(b.name));

        sorted.forEach(loc => {
            const optFrom = document.createElement('option');
            optFrom.value = loc.id;
            optFrom.textContent = loc.name;

            const optTo = document.createElement('option');
            optTo.value = loc.id;
            optTo.textContent = loc.name;

            this.selectFrom.appendChild(optFrom);
            this.selectTo.appendChild(optTo);
        });
    }

    /**
     * Bind button clicks and events
     */
    bindEvents(map, markerManager) {
        this.map = map;
        this.markerManager = markerManager;

        if (this.btnGo) {
            this.btnGo.addEventListener('click', () => {
                const fromId = this.selectFrom.value;
                const toId = this.selectTo.value;
                if (!fromId || !toId) {
                    window.showToast?.('Pilih titik awal dan tujuan terlebih dahulu');
                    return;
                }
                if (fromId === toId) {
                    window.showToast?.('Titik awal dan tujuan tidak boleh sama');
                    return;
                }
                this.routeBetween(fromId, toId);
            });
        }

        if (this.btnClear) {
            this.btnClear.addEventListener('click', () => {
                this.clearRoute();
                window.showToast?.('Rute dihapus');
            });
        }
    }

    /**
     * Calculate and draw route between two location IDs
     */
    routeBetween(fromLocationId, toLocationId) {
        const fromLoc = this.markerManager.getLocationById(fromLocationId);
        const toLoc = this.markerManager.getLocationById(toLocationId);

        if (!fromLoc || !toLoc) {
            window.showToast?.('Lokasi tidak ditemukan');
            return;
        }

        const startWp = this.getNearestWaypoint(fromLoc.coords);
        const endWp = this.getNearestWaypoint(toLoc.coords);

        if (!startWp || !endWp) {
            window.showToast?.('Gagal menghubungkan lokasi ke jalur kampus');
            return;
        }

        const path = this.findPath(startWp, endWp);

        if (!path || path.length === 0) {
            window.showToast?.('Tidak ditemukan jalur yang menghubungkan kedua lokasi');
            return;
        }

        const routeCoords = [fromLoc.coords];
        path.forEach(nodeId => {
            const node = this.nodes[nodeId];
            const lat = node.lat !== undefined ? node.lat : node.y;
            const lng = node.lng !== undefined ? node.lng : node.x;
            routeCoords.push([lat, lng]);
        });
        routeCoords.push(toLoc.coords);

        this.drawRoute(routeCoords, fromLoc, toLoc);

        if (this.selectFrom) this.selectFrom.value = fromLocationId;
        if (this.selectTo) this.selectTo.value = toLocationId;

        if (this.navPanel) {
            this.navPanel.style.display = 'block';
            document.getElementById('btn-navigate')?.classList.add('active');
        }
    }

    /**
     * Draw polyline route and markers on the map
     */
    drawRoute(coordinates, fromLoc, toLoc) {
        this.clearRoute();

        // 1. Draw Polyline
        this.currentPolyline = L.polyline(coordinates, {
            color: '#00e676',
            weight: 6,
            opacity: 0.9,
            dashArray: '10, 8',
            lineJoin: 'round'
        }).addTo(this.map);

        // 2. Start Marker (Green circle)
        this.startMarker = L.circleMarker(coordinates[0], {
            radius: 8,
            fillColor: '#00723F',
            color: '#ffffff',
            weight: 3,
            fillOpacity: 1
        }).addTo(this.map).bindTooltip(`Titik Awal: ${fromLoc.name}`, { permanent: false });

        // 3. End Marker (Red circle)
        this.endMarker = L.circleMarker(coordinates[coordinates.length - 1], {
            radius: 8,
            fillColor: '#E74C3C',
            color: '#ffffff',
            weight: 3,
            fillOpacity: 1
        }).addTo(this.map).bindTooltip(`Tujuan: ${toLoc.name}`, { permanent: false });

        // 4. Fit bounds
        this.map.fitBounds(this.currentPolyline.getBounds(), {
            padding: [80, 80],
            animate: true
        });

        // 5. Calculate real distance in meters
        let totalMeters = 0;
        for (let i = 0; i < coordinates.length - 1; i++) {
            totalMeters += L.latLng(coordinates[i]).distanceTo(L.latLng(coordinates[i + 1]));
        }

        const estimatedMeters = Math.round(totalMeters);
        const walkMinutes = Math.max(1, Math.round(estimatedMeters / 75)); // 4.5 km/h

        if (this.infoEl) {
            this.infoEl.innerHTML = `
                <div><strong>📏 Jarak:</strong> ~${estimatedMeters} meter</div>
                <div><strong>🚶 Waktu Tempuh:</strong> ~${walkMinutes} menit jalan kaki</div>
            `;
            this.infoEl.style.display = 'block';
        }

        window.showToast?.(`Rute ditemukan: ~${estimatedMeters}m (${walkMinutes} mnt)`);
    }

    /**
     * Clear active route and markers
     */
    clearRoute() {
        if (this.currentPolyline) {
            this.map.removeLayer(this.currentPolyline);
            this.currentPolyline = null;
        }
        if (this.startMarker) {
            this.map.removeLayer(this.startMarker);
            this.startMarker = null;
        }
        if (this.endMarker) {
            this.map.removeLayer(this.endMarker);
            this.endMarker = null;
        }
        if (this.infoEl) {
            this.infoEl.innerHTML = '';
            this.infoEl.style.display = 'none';
        }
    }
}
