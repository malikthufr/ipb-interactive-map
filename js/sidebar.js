/* ============================================
   IPB Interactive Map — Sidebar UI Management
   ============================================ */

class SidebarManager {
    constructor() {
        this.sidebarEl = document.getElementById('sidebar');
        this.filterSectionEl = document.getElementById('filter-section');
        this.filterContainerEl = document.getElementById('filter-container');
        this.detailPanelEl = document.getElementById('detail-panel');

        this.btnShowAll = document.getElementById('btn-show-all');
        this.btnHideAll = document.getElementById('btn-hide-all');

        this.markerManager = null;
        this.currentLocation = null;
        this.isOpen = false;
    }

    /**
     * Initialize sidebar with MarkerManager instance
     */
    init(markerManager) {
        this.markerManager = markerManager;

        // Hook show all / hide all
        if (this.btnShowAll) {
            this.btnShowAll.addEventListener('click', () => {
                this.markerManager.showAllCategories();
                this.updateAllFiltersUI(true);
                window.showToast?.('Semua kategori ditampilkan');
            });
        }

        if (this.btnHideAll) {
            this.btnHideAll.addEventListener('click', () => {
                this.markerManager.hideAllCategories();
                this.updateAllFiltersUI(false);
                window.showToast?.('Semua kategori disembunyikan');
            });
        }

        // Close detail button
        const btnClose = document.getElementById('detail-btn-close');
        if (btnClose) {
            btnClose.addEventListener('click', () => this.hideDetail());
        }

        // Navigate button in detail
        const btnNav = document.getElementById('detail-btn-nav');
        if (btnNav) {
            btnNav.addEventListener('click', () => {
                if (this.currentLocation) {
                    window.__mapApp?.navigateToLocation(this.currentLocation.id);
                }
            });
        }

        // Auto-open on desktop screens
        if (window.innerWidth >= 1024) {
            this.open();
        }
    }

    /**
     * Toggle sidebar open/closed
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.sidebarEl.classList.add('open');
        document.getElementById('btn-sidebar')?.classList.add('active');
    }

    close() {
        this.isOpen = false;
        this.sidebarEl.classList.remove('open');
        document.getElementById('btn-sidebar')?.classList.remove('active');
    }

    /**
     * Render category filters list
     */
    renderFilters() {
        if (!this.filterContainerEl || !this.markerManager) return;
        this.filterContainerEl.innerHTML = '';

        // Calculate count per category
        const counts = {};
        this.markerManager.locations.forEach(loc => {
            counts[loc.category] = (counts[loc.category] || 0) + 1;
        });

        this.markerManager.categories.forEach(cat => {
            const count = counts[cat.id] || 0;
            const isActive = this.markerManager.activeCategories.has(cat.id);

            const card = document.createElement('div');
            card.className = `filter-category ${isActive ? 'active' : ''}`;
            card.dataset.category = cat.id;
            card.style.setProperty('--cat-color', cat.color);

            card.innerHTML = `
                <img src="${cat.icon}" class="cat-icon" alt="${cat.name}">
                <div class="cat-label">
                    <div class="cat-name">${cat.name}</div>
                    <div class="cat-count">${count} lokasi</div>
                </div>
                <div class="cat-check">${isActive ? '✓' : ''}</div>
            `;

            card.addEventListener('click', () => {
                const nowActive = !this.markerManager.activeCategories.has(cat.id);
                this.markerManager.toggleCategory(cat.id, nowActive);
                this.syncFilterUI(cat.id, nowActive);
            });

            this.filterContainerEl.appendChild(card);
        });
    }

    /**
     * Sync single category UI state
     */
    syncFilterUI(categoryId, isActive) {
        const card = this.filterContainerEl.querySelector(`[data-category="${categoryId}"]`);
        if (!card) return;

        const checkEl = card.querySelector('.cat-check');
        if (isActive) {
            card.classList.add('active');
            if (checkEl) checkEl.textContent = '✓';
        } else {
            card.classList.remove('active');
            if (checkEl) checkEl.textContent = '';
        }
    }

    /**
     * Update all filter cards UI
     */
    updateAllFiltersUI(isActive) {
        const cards = this.filterContainerEl.querySelectorAll('.filter-category');
        cards.forEach(card => {
            const checkEl = card.querySelector('.cat-check');
            if (isActive) {
                card.classList.add('active');
                if (checkEl) checkEl.textContent = '✓';
            } else {
                card.classList.remove('active');
                if (checkEl) checkEl.textContent = '';
            }
        });
    }

    /**
     * Show detail panel for a given location
     */
    showDetail(location) {
        this.currentLocation = location;
        const category = this.markerManager.categoryMap.get(location.category) || {
            name: 'Umum',
            color: '#00723F',
            icon: 'assets/icons/faculty.svg'
        };

        // Populate elements
        document.getElementById('detail-name').textContent = location.name;
        
        const badgeEl = document.getElementById('detail-badge');
        badgeEl.textContent = category.name;
        badgeEl.style.backgroundColor = category.color;

        const imageBox = document.getElementById('detail-image-box');
        imageBox.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                <img src="${category.icon}" style="width: 48px; height: 48px; filter: brightness(0) invert(1);" alt="${category.name}">
                <span style="font-size:11px; color: var(--gold);">${location.details?.alias || location.name}</span>
            </div>
        `;

        document.getElementById('detail-desc').textContent = location.description || 'Tidak ada deskripsi.';
        document.getElementById('detail-address').textContent = location.details?.address || 'Kampus IPB Dramaga';
        document.getElementById('detail-hours').textContent = location.details?.hours || '08.00 - 17.00 WIB';

        // Facilities tags
        const facilitiesEl = document.getElementById('detail-facilities');
        facilitiesEl.innerHTML = '';
        const facilities = location.details?.facilities || ['Informasi Umum', 'Akses Pejalan Kaki'];
        facilities.forEach(fac => {
            const tag = document.createElement('span');
            tag.className = 'facility-tag';
            tag.textContent = `✓ ${fac}`;
            facilitiesEl.appendChild(tag);
        });

        // Switch visible view
        this.filterSectionEl.style.display = 'none';
        this.detailPanelEl.classList.add('visible');

        // Make sure sidebar is opened
        this.open();
    }

    /**
     * Hide detail and return to filters
     */
    hideDetail() {
        this.currentLocation = null;
        this.detailPanelEl.classList.remove('visible');
        this.filterSectionEl.style.display = 'block';
    }
}
