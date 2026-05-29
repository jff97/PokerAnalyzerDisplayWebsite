// Configuration
const CACHE_FILE = '../static/cachedLeaderboards/tournament-qualifiers.json';
const UNAVAILABLE_PLAYERS_ENDPOINT = BASE_URL + '/api/qualification/unavailable-players';

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('error-message');
const qualifiersContainerEl = document.getElementById('qualifiers-container');
const adminBtn = document.getElementById('admin-btn');
const adminModal = document.getElementById('admin-modal');
const modalCloseBtn = document.getElementById('modal-close');
const excludedPlayersTextarea = document.getElementById('excluded-players');
const adminPasswordInput = document.getElementById('admin-password');
const refreshBtn = document.getElementById('refresh-btn');
const saveBtn = document.getElementById('save-btn');
const adminMessageEl = document.getElementById('admin-message');

// Fetch and display qualifiers
async function loadQualifiers() {
    try {
        const response = await fetch(CACHE_FILE);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayQualifiers(data);
    } catch (error) {
        console.error('Error loading qualifiers:', error);
        showError(`Failed to load qualifiers: ${error.message}`);
    } finally {
        loadingEl.style.display = 'none';
    }
}

// Display qualifiers organized by bar
function displayQualifiers(data) {
    if (!data || Object.keys(data).length === 0) {
        showError('No qualifiers found.');
        return;
    }

    qualifiersContainerEl.innerHTML = '';

    // Sort bars alphabetically
    const sortedBars = Object.keys(data).sort();

    sortedBars.forEach(barName => {
        const qualifiers = data[barName];
        
        const barSection = document.createElement('div');
        barSection.className = 'bar-section';

        const barHeader = document.createElement('div');
        barHeader.className = 'bar-header';
        barHeader.textContent = barName;

        const qualifiersList = document.createElement('div');
        qualifiersList.className = 'qualifiers-list';

        // Display qualifiers for this bar (sorted by placement)
        qualifiers.forEach((qualifier, index) => {
            const qualifierItem = document.createElement('div');
            qualifierItem.className = 'qualifier-item';

            const rankBadge = document.createElement('div');
            rankBadge.className = 'qualifier-rank';
            rankBadge.textContent = qualifier.placement;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'qualifier-info';

            const nameEl = document.createElement('div');
            nameEl.className = 'qualifier-name';
            nameEl.textContent = qualifier.player_name;

            const pointsEl = document.createElement('div');
            pointsEl.className = 'qualifier-points';
            pointsEl.textContent = `${qualifier.total_points} points`;

            infoDiv.appendChild(nameEl);
            infoDiv.appendChild(pointsEl);

            const statsDiv = document.createElement('div');
            statsDiv.className = 'qualifier-stats';

            const pointsBadge = document.createElement('div');
            pointsBadge.className = 'points-badge';
            pointsBadge.textContent = `${qualifier.total_points} pts`;

            statsDiv.appendChild(pointsBadge);

            qualifierItem.appendChild(rankBadge);
            qualifierItem.appendChild(infoDiv);
            qualifierItem.appendChild(statsDiv);

            qualifiersList.appendChild(qualifierItem);
        });

        barSection.appendChild(barHeader);
        barSection.appendChild(qualifiersList);
        qualifiersContainerEl.appendChild(barSection);
    });

    qualifiersContainerEl.style.display = 'grid';
}

// Admin Mode Functions
async function fetchUnavailablePlayers() {
    try {
        const response = await fetch(UNAVAILABLE_PLAYERS_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const players = await response.json();
        return players || [];
    } catch (error) {
        console.error('Error fetching unavailable players:', error);
        showAdminMessage('Error fetching excluded players: ' + error.message, 'error');
        return [];
    }
}

async function loadAdminModal() {
    // Clear previous state
    adminPasswordInput.value = '';
    showAdminMessage('', '');
    
    // Fetch current excluded players
    const players = await fetchUnavailablePlayers();
    excludedPlayersTextarea.value = players.join('\n');
    
    // Show modal
    adminModal.style.display = 'flex';
}

function closeAdminModal() {
    adminModal.style.display = 'none';
    adminPasswordInput.value = '';
    excludedPlayersTextarea.value = '';
    showAdminMessage('', '');
}

function showAdminMessage(message, type) {
    if (!message || message.trim() === '') {
        adminMessageEl.style.display = 'none';
        return;
    }
    
    adminMessageEl.textContent = message;
    adminMessageEl.className = 'admin-message ' + type;
    adminMessageEl.style.display = 'block';
}

async function saveExcludedPlayers() {
    const password = adminPasswordInput.value;
    if (!password) {
        showAdminMessage('Please enter the admin password', 'error');
        return;
    }

    // Parse textarea into array, trim whitespace and filter empty lines
    const playerList = excludedPlayersTextarea.value
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

    saveBtn.disabled = true;
    showAdminMessage('Saving...', '');

    try {
        const response = await fetch(UNAVAILABLE_PLAYERS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: password,
                unavailable_players: playerList
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            showAdminMessage('Invalid password', 'error');
            return;
        }

        if (!response.ok) {
            showAdminMessage(data.error || `Error: ${response.status}`, 'error');
            return;
        }

        showAdminMessage(`Success! Updated ${data.unavailable_players.length} excluded players`, 'success');
        adminPasswordInput.value = '';
        
        // Refresh the display after a short delay
        setTimeout(() => {
            closeAdminModal();
            loadQualifiers();
        }, 1500);
    } catch (error) {
        console.error('Error saving excluded players:', error);
        showAdminMessage('Error: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
    }
}

async function refreshExcludedPlayers() {
    const players = await fetchUnavailablePlayers();
    excludedPlayersTextarea.value = players.join('\n');
    showAdminMessage('Refreshed from server', 'success');
    setTimeout(() => showAdminMessage('', ''), 2000);
}

// Show error message
function showError(message) {
    errorMessageEl.textContent = message;
    errorEl.style.display = 'block';
    qualifiersContainerEl.style.display = 'none';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadQualifiers();

    // Admin mode event listeners
    adminBtn.addEventListener('click', loadAdminModal);
    modalCloseBtn.addEventListener('click', closeAdminModal);
    saveBtn.addEventListener('click', saveExcludedPlayers);
    refreshBtn.addEventListener('click', refreshExcludedPlayers);

    // Close modal when clicking outside of it
    adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            closeAdminModal();
        }
    });
});
