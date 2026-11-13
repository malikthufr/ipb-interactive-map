/* ============================================
   IPB Interactive Map — Custom Pins (User Markers)
   ============================================ */

class CustomPinManager {
    constructor(map) {
        this.map = map;
        this.storageKey = 'ipb-campus-custom-pins';
        this.pins = this.loadPins();
        this.layerGroup = L.layerGroup().addTo(map);
        this.isAddMode = false;
        this.markerInstances = new Map();

        this.bindMapClick();
    }

    /**
     * Load pins from localStorage
     */
    loadPins() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Failed to load custom pins from localStorage', e);
            return [];
        }
    }

    /**
     * Save pins array to localStorage
     */
    savePins() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.pins));
        } catch (e) {
            console.error('Failed to save custom pins to localStorage', e);
        }
    }

    /**
     * Enable click-to-add mode
     */
    enableAddMode() {
        this.isAddMode = true;
        this.map.getContainer().style.cursor = 'crosshair';
    }

    /**
     * Disable click-to-add mode
     */
    disableAddMode() {
        this.isAddMode = false;
        this.map.getContainer().style.cursor = '';
    }

    /**
     * Map click handler for creating new pin
     */
    bindMapClick() {
        this.map.on('click', (e) => {
            if (!this.isAddMode) return;

            const latlng = e.latlng;
            const formHtml = `
                <div style="padding: 10px; min-width: 220px; font-family: var(--font-stack);">
                    <h4 style="margin: 0 0 10px 0; color: #E91E63; font-size: 14px;">📌 Tambah Pin Pribadi</h4>
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 2px;">Nama Penanda:</label>
                        <input type="text" id="new-pin-name" placeholder="Misal: Tempat Kumpul Panitia" style="width: 100%; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-primary); color: var(--text-primary); font-size: 12px;" />
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 2px;">Catatan / Keterangan:</label>
                        <textarea id="new-pin-note" placeholder="Catatan tambahan..." rows="2" style="width: 100%; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-primary); color: var(--text-primary); font-size: 12px; resize: none;"></textarea>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button type="button" id="btn-save-new-pin" style="flex: 1; padding: 6px 0; background: #E91E63; color: #fff; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 12px;">Simpan Pin</button>
                        <button type="button" id="btn-cancel-new-pin" style="flex: 1; padding: 6px 0; background: var(--bg-primary); color: var(--text-secondary); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; font-size: 12px;">Batal</button>
                    </div>
                </div>
            `;

            const popup = L.popup({
                closeButton: true,
                autoClose: true,
                className: 'custom-dark-popup'
            })
            .setLatLng(latlng)
            .setContent(formHtml)
            .openOn(this.map);

            // Defer attaching event listeners until popup is in DOM
            setTimeout(() => {
                const btnSave = document.getElementById('btn-save-new-pin');
                const btnCancel = document.getElementById('btn-cancel-new-pin');
                const inputName = document.getElementById('new-pin-name');
                const inputNote = document.getElementById('new-pin-note');

                inputName?.focus();

                btnSave?.addEventListener('click', () => {
                    const name = inputName.value.trim();
                    if (!name) {
                        alert('Silakan masukkan nama penanda!');
                        return;
                    }
                    const note = inputNote.value.trim();

                    this.addPin([latlng.lat, latlng.lng], name, note);
                    this.map.closePopup(popup);
                    this.disableAddMode();

                    document.getElementById('btn-add-pin')?.classList.remove('active');
                    window.showToast?.(`Pin "${name}" berhasil ditambahkan!`);
                });

                btnCancel?.addEventListener('click', () => {
                    this.map.closePopup(popup);
                });
            }, 50);
        });
    }

    /**
     * Add a new pin object, persist, and render
     */
    addPin(coords, name, note) {
        const pin = {
            id: 'pin_' + Date.now(),
            name,
            note: note || '',
            coords: [Math.round(coords[0]), Math.round(coords[1])],
            createdAt: new Date().toLocaleDateString('id-ID')
        };

        this.pins.push(pin);
        this.savePins();
        this.renderPin(pin);
    }

    /**
     * Render all saved pins to the map
     */
    renderAll() {
        this.layerGroup.clearLayers();
        this.markerInstances.clear();

        this.pins.forEach(pin => {
            this.renderPin(pin);
        });
    }

    /**
     * Create and attach draggable marker for a pin
     */
    renderPin(pin) {
        const pinIcon = L.divIcon({
            className: 'custom-leaflet-pin',
            html: `
                <div class="custom-pin-icon" title="${pin.name}">
                    📌
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -20]
        });

        const marker = L.marker(pin.coords, {
            icon: pinIcon,
            draggable: true,
            title: pin.name
        });

        // Popup content with Delete action
        const popupContent = `
            <div style="padding: 12px; min-width: 200px; font-family: var(--font-stack);">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                    <span style="font-size: 16px;">📌</span>
                    <strong style="color: #E91E63; font-size: 13px;">${pin.name}</strong>
                </div>
                <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 8px 0; line-height: 1.4;">
                    ${pin.note || '<em>Tidak ada catatan</em>'}
                </p>
                <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 10px;">
                    Dibuat: ${pin.createdAt || '-'}
                </div>
                <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn-delete-pin" style="flex: 1; padding: 5px 0; background: #e74c3c; color: #fff; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">Hapus Pin</button>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent, { className: 'custom-dark-popup' });

        // Delete handler inside popup
        marker.on('popupopen', () => {
            const popupNode = marker.getPopup().getElement();
            const btnDel = popupNode?.querySelector('.btn-delete-pin');
            btnDel?.addEventListener('click', () => {
                this.deletePin(pin.id);
            });
        });

        // Update coordinates on drag end
        marker.on('dragend', (e) => {
            const newPos = e.target.getLatLng();
            pin.coords = [Math.round(newPos.lat), Math.round(newPos.lng)];
            this.savePins();
            window.showToast?.(`Posisi pin "${pin.name}" diperbarui`);
        });

        this.layerGroup.addLayer(marker);
        this.markerInstances.set(pin.id, marker);
    }

    /**
     * Delete pin by ID
     */
    deletePin(pinId) {
        const marker = this.markerInstances.get(pinId);
        if (marker) {
            this.layerGroup.removeLayer(marker);
            this.markerInstances.delete(pinId);
        }

        const targetPin = this.pins.find(p => p.id === pinId);
        const name = targetPin ? targetPin.name : 'Pin';

        this.pins = this.pins.filter(p => p.id !== pinId);
        this.savePins();

        window.showToast?.(`Pin "${name}" dihapus`);
    }
}
