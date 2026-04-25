document.addEventListener('DOMContentLoaded', () => {
  // --- State ---
  let teamData = [];
  let currentSearch = '';
  let activeFilters = new Set(['All']); // 'All' is default

  // --- DOM Elements ---
  const teamGrid = document.getElementById('teamGrid');
  const searchInput = document.getElementById('searchInput');
  const roleFilters = document.getElementById('roleFilters');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const noResultsMsg = document.getElementById('noResults');

  // --- Initialization ---
  async function init() {
    await fetchData();
    loadStateFromStorage();
    setupEventListeners();
    renderCards();
  }

  // --- Data Fetching ---
  async function fetchData() {
    try {
      const response = await fetch('data.json');
      if (!response.ok) throw new Error('Network response was not ok');
      teamData = await response.json();
    } catch (error) {
      console.error('Error fetching team data:', error);
      teamGrid.innerHTML = '<p style="color: #ef4444; grid-column: 1/-1; text-align: center;">Failed to load team data. Please ensure you are running on a server.</p>';
    }
  }

  // --- Local Storage ---
  function loadStateFromStorage() {
    const savedSearch = localStorage.getItem('teamSearch');
    const savedFilters = localStorage.getItem('teamFilters');

    if (savedSearch) {
      currentSearch = savedSearch;
      searchInput.value = savedSearch;
    }

    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      if (parsedFilters.length > 0) {
        activeFilters = new Set(parsedFilters);
        updateFilterButtonsUI();
      }
    }
  }

  function saveStateToStorage() {
    localStorage.setItem('teamSearch', currentSearch);
    localStorage.setItem('teamFilters', JSON.stringify(Array.from(activeFilters)));
  }

  // --- Core Logic ---
  function filterData() {
    return teamData.filter(member => {
      // 1. Role Filter Match
      const matchesRole = activeFilters.has('All') || activeFilters.has(member.role);

      // 2. Search Text Match
      const searchLower = currentSearch.toLowerCase().trim();
      let matchesSearch = true;
      
      if (searchLower) {
        const nameMatch = member.name.toLowerCase().includes(searchLower);
        const roleMatch = member.role.toLowerCase().includes(searchLower);
        const skillsMatch = member.skills.some(skill => skill.toLowerCase().includes(searchLower));
        
        matchesSearch = nameMatch || roleMatch || skillsMatch;
      }

      return matchesRole && matchesSearch;
    });
  }

  // Text Highlighting Helper
  function highlightText(text, highlight) {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Render Logic
  function renderCards() {
    const filteredData = filterData();
    teamGrid.innerHTML = '';

    if (filteredData.length === 0) {
      noResultsMsg.classList.remove('hidden');
    } else {
      noResultsMsg.classList.add('hidden');
      
      filteredData.forEach(member => {
        const card = document.createElement('div');
        card.className = 'team-card glass-panel';
        
        const highlightedName = highlightText(member.name, currentSearch);
        const highlightedRole = highlightText(member.role, currentSearch);
        
        // Highlight skills
        const skillsHtml = member.skills.map(skill => {
          return `<span class="skill-tag">${highlightText(skill, currentSearch)}</span>`;
        }).join('');

        card.innerHTML = `
          <div class="card-avatar">
            <img src="${member.avatar}" alt="${member.name}">
          </div>
          <h2 class="card-name">${highlightedName}</h2>
          <p class="card-role">${highlightedRole}</p>
          <div class="card-skills">
            ${skillsHtml}
          </div>
        `;
        teamGrid.appendChild(card);
      });
    }
    
    saveStateToStorage();
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // 1. Debounced Search Input
    searchInput.addEventListener('input', debounce((e) => {
      currentSearch = e.target.value;
      renderCards();
    }, 300));

    // 2. Filter Buttons (Multi-select)
    roleFilters.addEventListener('click', (e) => {
      if (!e.target.classList.contains('filter-btn')) return;
      
      const filterValue = e.target.getAttribute('data-filter');

      if (filterValue === 'All') {
        activeFilters.clear();
        activeFilters.add('All');
      } else {
        // If 'All' is currently selected, remove it
        if (activeFilters.has('All')) {
          activeFilters.delete('All');
        }

        // Toggle the clicked filter
        if (activeFilters.has(filterValue)) {
          activeFilters.delete(filterValue);
        } else {
          activeFilters.add(filterValue);
        }

        // If no filters are active, default to 'All'
        if (activeFilters.size === 0) {
          activeFilters.add('All');
        }
      }

      updateFilterButtonsUI();
      renderCards();
    });

    // 3. Clear Filters
    clearFiltersBtn.addEventListener('click', () => {
      currentSearch = '';
      searchInput.value = '';
      activeFilters.clear();
      activeFilters.add('All');
      updateFilterButtonsUI();
      renderCards();
    });
  }

  function updateFilterButtonsUI() {
    const buttons = roleFilters.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      if (activeFilters.has(btn.getAttribute('data-filter'))) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // --- Utilities ---
  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  // Start the application
  init();
});
