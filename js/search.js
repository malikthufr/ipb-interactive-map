/* ============================================
   IPB Interactive Map — Search Engine
   ============================================ */

class SearchEngine {
    constructor() {
        this.locations = [];
        this.markerManager = null;
        this.sidebarManager = null;

        this.inputEl = document.getElementById('search-input');
        this.resultsEl = document.getElementById('search-results');
        this.debounceTimer = null;
        this.selectedIndex = -1;
        this.currentResults = [];
    }

    /**
     * Initialize Search Engine with location data and manager references
     */
    init(locations, markerManager, sidebarManager) {
        this.locations = locations;
        this.markerManager = markerManager;
        this.sidebarManager = sidebarManager;

        this.bindEvents();
    }

    /**
     * Bind input and keyboard navigation events
     */
    bindEvents() {
        if (!this.inputEl || !this.resultsEl) return;

        this.inputEl.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 180);
        });

        this.inputEl.addEventListener('keydown', (e) => {
            if (!this.resultsEl.classList.contains('visible')) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateResults(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateResults(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this.selectedIndex >= 0 && this.selectedIndex < this.currentResults.length) {
                    this.selectResult(this.currentResults[this.selectedIndex]);
                } else if (this.currentResults.length > 0) {
                    this.selectResult(this.currentResults[0]);
                }
            } else if (e.key === 'Escape') {
                this.clear();
            }
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sidebar-search')) {
                this.closeResults();
            }
        });

        // Focus event
        this.inputEl.addEventListener('focus', () => {
            if (this.inputEl.value.trim().length > 0 && this.currentResults.length > 0) {
                this.resultsEl.classList.add('visible');
            }
        });
    }

    /**
     * Perform search and render results
     */
    handleSearch(query) {
        const q = query.trim().toLowerCase();
        if (q.length === 0) {
            this.clear();
            return;
        }

        this.currentResults = this.search(q);
        this.selectedIndex = -1;
        this.renderResults(q, this.currentResults);
    }

    /**
     * Fuzzy scoring search algorithm
     */
    search(query) {
        const scored = [];

        this.locations.forEach(loc => {
            let score = 0;
            const name = (loc.name || '').toLowerCase();
            const alias = (loc.details?.alias || '').toLowerCase();
            const desc = (loc.description || '').toLowerCase();
            const cat = (loc.category || '').toLowerCase();

            if (name === query) {
                score = 100;
            } else if (alias === query) {
                score = 95;
            } else if (name.startsWith(query)) {
                score = 80;
            } else if (alias.startsWith(query)) {
                score = 75;
            } else if (name.includes(query)) {
                score = 60;
            } else if (alias.includes(query)) {
                score = 50;
            } else if (cat.includes(query)) {
                score = 35;
            } else if (desc.includes(query)) {
                score = 25;
            }

            if (score > 0) {
                scored.push({ location: loc, score });
            }
        });

        // Sort descending by score
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 8).map(s => s.location);
    }

    /**
     * Render results dropdown
     */
    renderResults(query, results) {
        this.resultsEl.innerHTML = '';

        if (results.length === 0) {
            this.resultsEl.innerHTML = `
                <div class="search-result-item" style="cursor: default; color: var(--text-muted); justify-content: center;">
                    Tidak ditemukan lokasi yang cocok
                </div>
            `;
            this.resultsEl.classList.add('visible');
            return;
        }

        results.forEach((loc, index) => {
            const cat = this.markerManager.categoryMap.get(loc.category) || {
                name: 'Umum',
                color: '#00723F'
            };

            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.dataset.index = index;

            // Highlight matched part in name
            const highlightedName = this.highlightMatch(loc.name, query);

            item.innerHTML = `
                <span class="cat-dot" style="background-color: ${cat.color};"></span>
                <span class="result-name">${highlightedName}</span>
                <span class="result-cat">${cat.name}</span>
            `;

            item.addEventListener('click', () => {
                this.selectResult(loc);
            });

            this.resultsEl.appendChild(item);
        });

        this.resultsEl.classList.add('visible');
    }

    /**
     * Highlight matched substring with <mark>
     */
    highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Navigate results using up/down arrow keys
     */
    navigateResults(direction) {
        const items = this.resultsEl.querySelectorAll('.search-result-item');
        if (items.length === 0) return;

        items.forEach(it => it.classList.remove('active'));

        this.selectedIndex += direction;
        if (this.selectedIndex >= items.length) {
            this.selectedIndex = 0;
        } else if (this.selectedIndex < 0) {
            this.selectedIndex = items.length - 1;
        }

        const activeItem = items[this.selectedIndex];
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Action on selecting a search result
     */
    selectResult(location) {
        this.closeResults();
        this.inputEl.value = location.name;

        // Highlight marker on map
        if (this.markerManager) {
            this.markerManager.highlightMarker(location.id);
        }

        // Show detail in sidebar
        if (this.sidebarManager) {
            this.sidebarManager.showDetail(location);
        }
    }

    closeResults() {
        this.resultsEl.classList.remove('visible');
        this.selectedIndex = -1;
    }

    clear() {
        this.closeResults();
        this.currentResults = [];
        this.inputEl.value = '';
    }
}
