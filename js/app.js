/* ============================================
   IPB Interactive Map — Main Application Orchestrator
   ============================================ */

(async function () {
    'use strict';

    // Global Toast Notification Helper
    window.showToast = function (message, duration = 3000) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate entrance
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Exit after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }, duration);
    };

    try {
        // 1. Initialize Leaflet Map
        const map = initMap();

        // 2. Instantiate Managers
        const markerManager = new MarkerManager(map);
        const sidebarManager = new SidebarManager();
        const searchEngine = new SearchEngine();
        const routingEngine = new RoutingEngine();
        const customPinManager = new CustomPinManager(map);

        // 3. Expose global bridge for inline popup button callbacks
        window.__mapApp = {
            showDetail: (locationId) => {
                const loc = markerManager.getLocationById(locationId);
                if (loc) {
                    sidebarManager.showDetail(loc);
                }
            },
            navigateToLocation: (locationId) => {
                const loc = markerManager.getLocationById(locationId);
                if (!loc) return;

                // If starting from gerbang utama or a default entrance:
                const navPanel = document.getElementById('nav-panel');
                if (navPanel) navPanel.style.display = 'block';
                document.getElementById('btn-navigate')?.classList.add('active');

                // If start is not yet chosen, default to Gerbang Utama
                const selectFrom = document.getElementById('nav-from');
                const selectTo = document.getElementById('nav-to');

                if (!selectFrom.value || selectFrom.value === locationId) {
                    selectFrom.value = 'gerbang-utama';
                }
                selectTo.value = locationId;

                routingEngine.routeBetween(selectFrom.value, locationId);
            },
            syncFilterUI: (categoryId, isActive) => {
                sidebarManager.syncFilterUI(categoryId, isActive);
            }
        };

        // 4. Fetch JSON data
        await markerManager.loadCategories();
        await markerManager.loadLocations();
        await routingEngine.loadWaypoints();

        // 5. Render Map Elements & Sidebars
        markerManager.addAllMarkers();
        sidebarManager.init(markerManager);
        sidebarManager.renderFilters();

        searchEngine.init(markerManager.locations, markerManager, sidebarManager);

        routingEngine.populateSelects(markerManager.locations);
        routingEngine.bindEvents(map, markerManager);

        customPinManager.renderAll();

        // 6. Connect Marker Click to Sidebar Detail View
        markerManager.onMarkerClick = (location) => {
            sidebarManager.showDetail(location);
        };

        // 7. Setup Floating Action Buttons (FAB)
        const btnSidebar = document.getElementById('btn-sidebar');
        const btnNavigate = document.getElementById('btn-navigate');
        const btnAddPin = document.getElementById('btn-add-pin');
        const btnMyLocation = document.getElementById('btn-my-location');
        const navPanel = document.getElementById('nav-panel');

        btnSidebar?.addEventListener('click', () => {
            sidebarManager.toggle();
        });

        btnNavigate?.addEventListener('click', () => {
            const isVisible = navPanel.style.display === 'block';
            if (isVisible) {
                navPanel.style.display = 'none';
                btnNavigate.classList.remove('active');
            } else {
                navPanel.style.display = 'block';
                btnNavigate.classList.add('active');
            }
        });

        btnAddPin?.addEventListener('click', () => {
            if (customPinManager.isAddMode) {
                customPinManager.disableAddMode();
                btnAddPin.classList.remove('active');
                window.showToast('Mode tambah pin dibatalkan');
            } else {
                customPinManager.enableAddMode();
                btnAddPin.classList.add('active');
                window.showToast('Klik pada area peta untuk menaruh pin baru 📌', 4000);
            }
        });

        btnMyLocation?.addEventListener('click', () => {
            map.setView(MAP_CONFIG.defaultCenter, MAP_CONFIG.defaultZoom, {
                animate: true,
                duration: 0.6
            });
            window.showToast('Tampilan peta di-reset');
        });

        // 8. Welcome Greeting
        setTimeout(() => {
            window.showToast('Selamat datang di Peta Interaktif IPB Dramaga! 🌿🎓', 3500);
        }, 600);

        console.log('🗺️ Peta Interaktif IPB Dramaga siap digunakan!');

    } catch (err) {
        console.error('Inisialisasi aplikasi gagal:', err);
        window.showToast('Terjadi kesalahan saat memuat peta: ' + err.message, 5000);
    }
})();
