document.addEventListener('DOMContentLoaded', () => {
    let currentArticles = [];
    let activeFilter = { type: 'all', val: 'all' };
    let visibleCount = 60;
    const increment = 60;

    // DOM refs
    const grid             = document.getElementById('articlesGrid');
    const loadMoreBtn      = document.getElementById('loadMoreBtn');
    const searchInput      = document.getElementById('searchInput');
    const sortSelect       = document.getElementById('sortSelect');
    const substanceMenuBtn = document.getElementById('substanceMenuBtn');
    const substanceMegaMenu= document.getElementById('substanceMegaMenu');
    const subGrid          = document.getElementById('substanceCategoriesGrid');
    const vendorMenuBtn    = document.getElementById('vendorMenuBtn');
    const vendorMegaMenu   = document.getElementById('vendorMegaMenu');
    const vendorGrid       = document.getElementById('vendorListGrid');
    const filterBar        = document.querySelectorAll('.filter-btn');
    const currentTitle     = document.getElementById('currentTitle');
    const counterBadge     = document.getElementById('counterBadge');
    const resetFilterBtn   = document.getElementById('resetFilterBtn');
    const siteLogo         = document.querySelector('.site-logo');

    try { currentArticles = [...articles]; }
    catch (e) {
        grid.innerHTML = '<p style="padding:4rem;color:#555;grid-column:1/-1;text-align:center">Error loading database.</p>';
        return;
    }

    // ── Save State to sessionStorage ──────────────────────
    function saveState() {
        const state = {
            activeFilter,
            search: searchInput ? searchInput.value : '',
            sort: sortSelect ? sortSelect.value : 'az',
            visibleCount,
            scrollY: window.scrollY || 0
        };
        try {
            sessionStorage.setItem('rc_scene_state', JSON.stringify(state));
        } catch (e) {}
    }

    // ── Restore State from sessionStorage ──────────────────
    function restoreState() {
        try {
            const raw = sessionStorage.getItem('rc_scene_state');
            if (!raw) return 0;
            const state = JSON.parse(raw);
            if (state.activeFilter) activeFilter = state.activeFilter;
            if (state.search !== undefined && searchInput) searchInput.value = state.search;
            if (state.sort && sortSelect) sortSelect.value = state.sort;
            if (state.visibleCount) visibleCount = state.visibleCount;
            return state.scrollY || 0;
        } catch (e) {
            return 0;
        }
    }

    // ── Verified Substance Catalog (scanned from archive) ─────────
    const DEFAULT_SUBSTANCE_CATALOG = {
        "🔥 Pyrrolidines & Pyrovalerones": [
            "a-PHP", "alpha-PHP", "a-PiHP", "a-PHiP", "MDPV", "a-PCyP", "a-PVP", "MDPHP"
        ],
        "⚡ Cathinones": [
            "3-MMC", "4-MMC", "2-MMC", "3-CMC", "4-CMC",
            "Hexen", "N-Ethylhexedrone", "NEP", "Mephedrone",
            "4-MPD", "Eutylone", "Pentedrone"
        ],
        "💊 Amphetamines & Fluorinated": [
            "4F-MPH", "3-FPM", "2-FMA", "3-FMA", "4-FA", "3-FA",
            "2-FEA", "3-FEA", "4F-EPH",
            "Isopropylphenidate", "Ethylphenidate"
        ],
        "💜 Entactogens & Benzofurans": [
            "5-MAPB", "6-APB", "5-APB"
        ],
        "👁️ Lysergamides (LSD Analogs)": [
            "1cP-LSD", "1P-LSD", "1V-LSD", "AL-LAD"
        ],
        "🍄 Tryptamines": [
            "DMT", "DPT", "4-AcO-DMT", "4-HO-MiPT", "MiPT"
        ],
        "🎨 Phenethylamines & 2C-x": [
            "2C-B", "2C-B-FLY", "DOB"
        ],
        "🌀 Dissociatives": [
            "DCK", "2-FDCK", "3-MeO-PCP", "O-PCE",
            "Ketamine", "MXE", "MXPr", "DMXE", "HXE", "FXE"
        ],
        "💤 Benzodiazepines & Thienos": [
            "Etizolam", "Flualprazolam", "Bromazolam", "Diclazepam",
            "Flubromazolam", "Clonazolam", "Pyrazolam", "Flubromazepam",
            "Deschloroetizolam", "Fluclotizolam", "Phenazepam",
            "Nitrazolam", "Flunitrazolam"
        ],
        "🔬 Opioids & Nitazenes": [
            "2-Methyl-AP-237", "AP-238", "O-DSMT", "Kratom", "Isotonitazene"
        ],
        "🌿 Cannabinoids": [
            "HHC", "JWH-210"
        ],
        "🧪 Nootropics & Other": [
            "GHB", "GBL", "Phenibut", "Modafinil"
        ]
    };

    const DEFAULT_VENDOR_CATALOG = [
        "Predator-RC", "RareChems", "Chemical Collective", "Lizard Labs", "RealChems",
        "Trrcshop", "ExDeChem", "Home-Chemistry", "Funcaps", "ParacelsusLabs",
        "Albion", "Chem Casino", "Dragon Eric", "FreshChems", "Get-RC", "Juklis Lab",
        "Katy's Candies", "LongFlourishRC", "RC Leon", "RCBestsell", "SDCChem", "James Li",
        "Alchimia", "ShayanShop", "Sirius", "Azarius", "Dutch-Headshop", "Professor.nl",
        "Chemms", "BuyAnyChem", "Reagent Tests UK", "BunkPolice", "DanceSafe",
        "ResearchChemClub", "DomesticRCs", "RC-Inrikes", "NextDayChemicals", "Chem-EU",
        "ChemsUK", "EuroChems", "ModernChem", "SmokeysChems"
    ];

    const substanceMenuSearch = document.getElementById('substanceMenuSearch');
    const vendorMenuSearch    = document.getElementById('vendorMenuSearch');

    // ── Build Substance Dropdown ───────────────────────────
    function buildSubstanceMenu() {
        const catalog = (typeof SUBSTANCE_CATALOG !== 'undefined') ? SUBSTANCE_CATALOG : DEFAULT_SUBSTANCE_CATALOG;
        if (!subGrid) return;
        subGrid.innerHTML = '';
        Object.entries(catalog).forEach(([cat, subs]) => {
            const col = document.createElement('div');
            col.className = 'sub-cat-group';
            col.innerHTML = `<h5>${cat}</h5>`;
            const list = document.createElement('div');
            list.className = 'sub-link-list';
            subs.forEach(sub => {
                const btn = document.createElement('button');
                btn.className = 'sub-pill';
                btn.textContent = sub;
                btn.setAttribute('data-name', sub.toLowerCase());
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFilter('substance', sub);
                    substanceMegaMenu?.classList.add('hidden');
                });
                list.appendChild(btn);
            });
            col.appendChild(list);
            subGrid.appendChild(col);
        });
    }

    // In-Menu Substance Filter
    substanceMenuSearch?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.sub-pill').forEach(btn => {
            const name = btn.getAttribute('data-name') || '';
            const match = !query || name.includes(query);
            btn.style.display = match ? 'inline-block' : 'none';
        });
    });

    // ── Build Vendor Dropdown ──────────────────────────────
    function buildVendorMenu() {
        const catalog = (typeof VENDOR_CATALOG !== 'undefined') ? VENDOR_CATALOG : DEFAULT_VENDOR_CATALOG;
        if (!vendorGrid) return;
        vendorGrid.innerHTML = '';
        catalog.forEach(vendor => {
            const btn = document.createElement('button');
            btn.className = 'vendor-pill';
            btn.textContent = vendor;
            btn.setAttribute('data-name', vendor.toLowerCase());
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                setFilter('vendor', vendor);
                vendorMegaMenu?.classList.add('hidden');
            });
            vendorGrid.appendChild(btn);
        });
    }

    // In-Menu Vendor Filter
    vendorMenuSearch?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.vendor-pill').forEach(btn => {
            const name = btn.getAttribute('data-name') || '';
            const match = !query || name.includes(query);
            btn.style.display = match ? 'inline-flex' : 'none';
        });
    });

    // ── Dropdown Toggles ──────────────────────────────────
    function initDropdowns() {
        substanceMenuBtn?.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            vendorMegaMenu?.classList.add('hidden');
            substanceMegaMenu?.classList.toggle('hidden');
        });

        vendorMenuBtn?.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            substanceMegaMenu?.classList.add('hidden');
            vendorMegaMenu?.classList.toggle('hidden');
        });

        document.querySelectorAll('.close-menu-btn').forEach(b => {
            b.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                substanceMegaMenu?.classList.add('hidden');
                vendorMegaMenu?.classList.add('hidden');
            });
        });

        document.addEventListener('click', e => {
            if (substanceMegaMenu && !substanceMegaMenu.contains(e.target) && e.target !== substanceMenuBtn) {
                substanceMegaMenu.classList.add('hidden');
            }
            if (vendorMegaMenu && !vendorMegaMenu.contains(e.target) && e.target !== vendorMenuBtn) {
                vendorMegaMenu.classList.add('hidden');
            }
        });
    }

    // ── Set Active Filter ──────────────────────────────────
    function setFilter(type, val) {
        activeFilter = { type, val };

        // Update filter bar pills
        filterBar.forEach(btn => {
            const match = (type === 'all' && btn.dataset.type === 'all') ||
                          (type === 'category' && btn.dataset.type === 'category' && btn.dataset.val === val);
            btn.classList.toggle('active', match);
        });

        // Update section title
        if (currentTitle) {
            if (type === 'all')          currentTitle.textContent = 'All Articles';
            else if (type === 'category') currentTitle.textContent = val;
            else if (type === 'substance') currentTitle.textContent = `Substance: ${val}`;
            else if (type === 'vendor')   currentTitle.textContent = `Vendor: ${val}`;
        }

        resetFilterBtn?.classList.toggle('hidden', type === 'all' && (!searchInput || !searchInput.value));
        saveState();
        applyFilters();
    }

    // Reset filter
    resetFilterBtn?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        setFilter('all', 'all');
    });

    siteLogo?.addEventListener('click', (e) => {
        if (searchInput) searchInput.value = '';
        setFilter('all', 'all');
    });

    // Category filter pill clicks
    filterBar.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.type, btn.dataset.val || 'all'));
    });

    // ── Render Articles ────────────────────────────────────
    function renderArticles(reset = false) {
        if (reset) { grid.innerHTML = ''; }

        if (counterBadge) counterBadge.textContent = `${currentArticles.length} articles`;

        if (currentArticles.length === 0) {
            grid.innerHTML = '<p style="padding:4rem;color:#555;grid-column:1/-1;text-align:center">No articles found. Try clearing the filter.</p>';
            loadMoreBtn?.classList.add('hidden');
            return;
        }

        const fragment = document.createDocumentFragment();
        const toRender = currentArticles.slice(grid.children.length, visibleCount);

        toRender.forEach(article => {
            const a = document.createElement('a');
            a.href      = article.url || '#';
            a.className = 'article-card';

            const title   = article.title    || 'Untitled';
            const cat     = article.category  || 'General RC News';
            const excerpt = article.excerpt   || 'Archived article from the RC SCENE database.';
            const subs    = article.substances || [];
            const vends   = article.vendors    || [];

            const catClass = (cat === 'Forum Discussions') ? 'tag-cat tag-forum' : 'tag-cat';
            let tagsHtml = `<span class="tag ${catClass}" data-type="category" data-val="${cat}">${cat}</span>`;
            subs.slice(0, 2).forEach(s  => { tagsHtml += `<span class="tag tag-substance" data-type="substance" data-val="${s}">${s}</span>`; });
            vends.slice(0, 1).forEach(v => { tagsHtml += `<span class="tag tag-vendor" data-type="vendor" data-val="${v}">${v}</span>`; });

            a.innerHTML = `
                <div class="card-top">
                    <div class="card-tags">${tagsHtml}</div>
                    <div class="card-title">${title}</div>
                    <div class="card-excerpt">${excerpt}</div>
                </div>
                <div class="card-footer">
                    <span>Local Page</span>
                    <span class="card-read">Read →</span>
                </div>`;
            fragment.appendChild(a);
        });

        grid.appendChild(fragment);
        loadMoreBtn?.classList.toggle('hidden', visibleCount >= currentArticles.length);
    }

    // Card Tag Clicking Filter & Navigation Scroll Capture
    grid.addEventListener('click', (e) => {
        const tag = e.target.closest('.tag');
        if (tag && tag.dataset.type && tag.dataset.val) {
            e.preventDefault();
            e.stopPropagation();
            setFilter(tag.dataset.type, tag.dataset.val);
            return;
        }

        const card = e.target.closest('.article-card');
        if (card) {
            saveState();
        }
    });

    window.addEventListener('beforeunload', saveState);

    loadMoreBtn?.addEventListener('click', () => {
        visibleCount += increment;
        saveState();
        renderArticles(false);
    });

    // ── Apply Filters & Search ─────────────────────────────
    function applyFilters() {
        const term   = searchInput?.value.toLowerCase().trim() || '';
        const sortBy = sortSelect?.value || 'az';

        currentArticles = articles.filter(a => {
            // Active filter
            if (activeFilter.type === 'category') {
                if (a.category !== activeFilter.val) return false;
            } else if (activeFilter.type === 'substance') {
                const blob = [(a.title||''), (a.excerpt||''), (a.url||''), ...(a.substances||[])].join(' ').toLowerCase();
                if (!blob.includes(activeFilter.val.toLowerCase())) return false;
            } else if (activeFilter.type === 'vendor') {
                const blob = [(a.title||''), (a.excerpt||''), (a.url||''), ...(a.vendors||[])].join(' ').toLowerCase();
                if (!blob.includes(activeFilter.val.toLowerCase())) return false;
            }
            // Search term
            if (term) {
                const blob = [(a.title||''), (a.excerpt||''), (a.url||''),
                              ...(a.substances||[]), ...(a.vendors||[])].join(' ').toLowerCase();
                return blob.includes(term);
            }
            return true;
        });

        currentArticles.sort((a, b) => {
            if (sortBy === 'az') return (a.title||'').localeCompare(b.title||'');
            if (sortBy === 'za') return (b.title||'').localeCompare(a.title||'');
            return 0;
        });

        renderArticles(true);
    }

    searchInput?.addEventListener('input', () => {
        saveState();
        applyFilters();
    });

    sortSelect?.addEventListener('change', () => {
        saveState();
        applyFilters();
    });

    // Restore state
    const savedScrollY = restoreState();

    buildSubstanceMenu();
    buildVendorMenu();
    initDropdowns();

    // Update active UI elements after restore
    filterBar.forEach(btn => {
        const match = (activeFilter.type === 'all' && btn.dataset.type === 'all') ||
                      (activeFilter.type === 'category' && btn.dataset.type === 'category' && btn.dataset.val === activeFilter.val);
        btn.classList.toggle('active', match);
    });

    if (currentTitle) {
        if (activeFilter.type === 'all')          currentTitle.textContent = 'All Articles';
        else if (activeFilter.type === 'category') currentTitle.textContent = activeFilter.val;
        else if (activeFilter.type === 'substance') currentTitle.textContent = `Substance: ${activeFilter.val}`;
        else if (activeFilter.type === 'vendor')   currentTitle.textContent = `Vendor: ${activeFilter.val}`;
    }

    resetFilterBtn?.classList.toggle('hidden', activeFilter.type === 'all' && (!searchInput || !searchInput.value));

    applyFilters();

    if (savedScrollY > 0) {
        setTimeout(() => {
            window.scrollTo({ top: savedScrollY, behavior: 'instant' });
        }, 60);
    }
});
