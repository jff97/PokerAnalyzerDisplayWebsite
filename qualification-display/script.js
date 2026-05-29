// Configuration
const CACHE_FILE = '../static/cachedLeaderboards/tournament-qualifiers.json';
const UNAVAILABLE_PLAYERS_ENDPOINT = BASE_URL + '/api/qualification/unavailable-players';
const TOURNAMENT_NAME = 'Ultimate Showdown';

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('error-message');
const qualifiersContainerEl = document.getElementById('qualifiers-container');
const adminBtn = document.getElementById('admin-btn');
const adminModal = document.getElementById('admin-modal');
const modalCloseBtn = document.getElementById('modal-close');
const playersListEl = document.getElementById('players-list');
const adminPasswordInput = document.getElementById('admin-password');
const refreshBtn = document.getElementById('refresh-btn');
const saveBtn = document.getElementById('save-btn');
const adminMessageEl = document.getElementById('admin-message');
const refreshProcessingModal = document.getElementById('refresh-processing-modal');
const processingCloseBtn = document.getElementById('processing-close-btn');
const passwordForm = document.getElementById('password-form');
const playersForm = document.getElementById('players-form');
const unlockBtn = document.getElementById('unlock-btn');

// Store the validated password for use during save
let currentAdminPassword = '';

// Fetch and display qualifiers
async function loadQualifiers() {
    try {
        // Add cache-busting query parameter to force fresh data
        const cacheUrl = `${CACHE_FILE}?t=${Date.now()}`;
        const response = await fetch(cacheUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayQualifiers(data);
        updatePageTitle();
    } catch (error) {
        console.error('Error loading qualifiers:', error);
        showError(`Failed to load qualifiers: ${error.message}`);
    } finally {
        loadingEl.style.display = 'none';
    }
}

// Update page title with current month
function updatePageTitle() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = months[new Date().getMonth()];
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        subtitle.textContent = `${currentMonth} Season ${TOURNAMENT_NAME} Qualifiers`;
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
async function validateAdminPassword(password) {
    try {
        const url = new URL(UNAVAILABLE_PLAYERS_ENDPOINT, window.location.origin);
        url.searchParams.append('password', password);
        
        const response = await fetch(url.toString());
        
        // If we get a 401, password is invalid
        if (response.status === 401) {
            return false;
        }
        
        // Any other response means password was accepted
        return true;
    } catch (error) {
        console.error('Error validating password:', error);
        return false;
    }
}

async function fetchUnavailablePlayers() {
    try {
        const url = new URL(UNAVAILABLE_PLAYERS_ENDPOINT, window.location.origin);
        url.searchParams.append('password', currentAdminPassword);
        
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Handle different response structures
        let players = [];
        if (Array.isArray(data)) {
            players = data;
        } else if (data.unavailable_players && Array.isArray(data.unavailable_players)) {
            players = data.unavailable_players;
        } else if (data.data && Array.isArray(data.data)) {
            players = data.data;
        }
        
        // Extract player names if they're objects
        return players.map(p => typeof p === 'string' ? p : p.player_name || p.name || p).filter(p => p);
    } catch (error) {
        console.error('Error fetching unavailable players:', error);
        showAdminMessage('Error fetching excluded players: ' + error.message, 'error');
        return [];
    }
}

// Extract all unique qualified player names from cache
async function getQualifiedPlayers() {
    try {
        // Add cache-busting query parameter to force fresh data
        const cacheUrl = `${CACHE_FILE}?t=${Date.now()}`;
        const response = await fetch(cacheUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const playerSet = new Set();
        
        // Extract all player names from all bars
        Object.values(data).forEach(qualifiers => {
            qualifiers.forEach(q => {
                playerSet.add(q.player_name);
            });
        });
        
        return Array.from(playerSet).sort();
    } catch (error) {
        console.error('Error fetching qualified players:', error);
        showAdminMessage('Error loading qualified players: ' + error.message, 'error');
        return [];
    }
}

// Build checkbox list for qualified and excluded players
function buildPlayerCheckboxes(qualifiedPlayers, excludedPlayers) {
    playersListEl.innerHTML = '';
    
    // Combine qualified and excluded players (remove duplicates)
    const allPlayersSet = new Set();
    qualifiedPlayers.forEach(p => allPlayersSet.add(String(p)));
    excludedPlayers.forEach(p => allPlayersSet.add(String(p)));
    
    const allPlayers = Array.from(allPlayersSet).sort();
    
    if (allPlayers.length === 0) {
        playersListEl.innerHTML = '<p class="no-players">No players found</p>';
        return;
    }
    
    // Create a normalized set of excluded players (lowercase for comparison)
    const excludedSet = new Set(excludedPlayers.map(p => String(p).toLowerCase()));
    
    allPlayers.forEach(playerName => {
        const playerNameLower = String(playerName).toLowerCase();
        const isExcluded = excludedSet.has(playerNameLower);
        
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'player-checkbox-item';
        if (isExcluded) {
            checkboxContainer.classList.add('excluded-player');
        }
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `player-${playerName}`;
        checkbox.value = playerName;
        checkbox.checked = isExcluded;
        checkbox.className = 'player-checkbox';
        
        const label = document.createElement('label');
        label.htmlFor = `player-${playerName}`;
        label.textContent = playerName;
        label.className = 'player-label';
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        playersListEl.appendChild(checkboxContainer);
        playersListEl.appendChild(checkboxContainer);
    });
}

async function loadAdminModal() {
    // Show modal with password form
    adminModal.style.display = 'flex';
    passwordForm.style.display = 'block';
    playersForm.style.display = 'none';
    adminPasswordInput.value = '';
    showAdminMessage('', '');
}

async function waitForServerReady() {
    const CHECK_INTERVAL = 5000; // 5 seconds
    const MAX_RETRIES = 120; // 10 minutes
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
        try {
            const response = await fetch(UNAVAILABLE_PLAYERS_ENDPOINT, {
                method: 'GET'
            });
            // If we get any response (even an error), server is ready
            if (response.ok || response.status === 401 || response.status === 400) {
                return;
            }
        } catch (err) {
            // Server not ready, continue polling
        }
        
        retries++;
        if (retries >= MAX_RETRIES) {
            throw new Error('Server did not respond within timeout period');
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
}

function closeAdminModal() {
    adminModal.style.display = 'none';
    adminPasswordInput.value = '';
    currentAdminPassword = '';
    playersListEl.innerHTML = '';
    showAdminMessage('', '');
    passwordForm.style.display = 'block';
    playersForm.style.display = 'none';
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

async function unlockAdmin() {
    const password = adminPasswordInput.value;
    if (!password) {
        showAdminMessage('Please enter the admin password', 'error');
        return;
    }

    unlockBtn.disabled = true;
    showAdminMessage('Validating password...', '');
    
    try {
        // Validate password first using GET request
        const isValid = await validateAdminPassword(password);
        if (!isValid) {
            showAdminMessage('Invalid password', 'error');
            unlockBtn.disabled = false;
            return;
        }
        
        // Password is valid, proceed to show players
        currentAdminPassword = password;
        passwordForm.style.display = 'none';
        playersForm.style.display = 'block';
        playersListEl.innerHTML = `
            <div class="server-loading">
                <p>Loading players...</p>
                <div class="spinner"></div>
            </div>
        `;
        showAdminMessage('', '');
        
        // Wait for server to be ready and fetch qualified/excluded players
        await waitForServerReady();
        
        const [qualifiedPlayers, excludedPlayers] = await Promise.all([
            getQualifiedPlayers(),
            fetchUnavailablePlayers()
        ]);
        
        buildPlayerCheckboxes(qualifiedPlayers, excludedPlayers);
    } catch (error) {
        console.error('Error loading players:', error);
        showAdminMessage('Error loading players: ' + error.message, 'error');
        passwordForm.style.display = 'block';
        playersForm.style.display = 'none';
        currentAdminPassword = '';
    } finally {
        unlockBtn.disabled = false;
    }
}

async function saveExcludedPlayers() {
    const password = currentAdminPassword;
    if (!password) {
        showAdminMessage('Please unlock first', 'error');
        return;
    }

    // Collect all checked players (including hidden checkboxes)
    const allCheckboxes = playersListEl.querySelectorAll('.player-checkbox');
    const playerList = Array.from(allCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

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
        
        // Close admin modal and show processing modal
        setTimeout(() => {
            adminModal.style.display = 'none';
            refreshProcessingModal.style.display = 'flex';
        }, 1500);
    } catch (error) {
        console.error('Error saving excluded players:', error);
        showAdminMessage('Error: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
    }
}

async function refreshExcludedPlayers() {
    const [qualifiedPlayers, excludedPlayers] = await Promise.all([
        getQualifiedPlayers(),
        fetchUnavailablePlayers()
    ]);
    buildPlayerCheckboxes(qualifiedPlayers, excludedPlayers);
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
    // Update title immediately with current month
    updatePageTitle();
    
    loadQualifiers();

    // Admin mode event listeners
    adminBtn.addEventListener('click', loadAdminModal);
    modalCloseBtn.addEventListener('click', closeAdminModal);
    unlockBtn.addEventListener('click', unlockAdmin);
    saveBtn.addEventListener('click', saveExcludedPlayers);
    refreshBtn.addEventListener('click', refreshExcludedPlayers);
    processingCloseBtn.addEventListener('click', () => {
        refreshProcessingModal.style.display = 'none';
        loadQualifiers();
    });
    
    // Enter key support for password input
    adminPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            unlockAdmin();
        }
    });

    // Close modal when clicking outside of it
    adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            closeAdminModal();
        }
    });

    // Close processing modal when clicking outside of it
    refreshProcessingModal.addEventListener('click', (e) => {
        if (e.target === refreshProcessingModal) {
            refreshProcessingModal.style.display = 'none';
            loadQualifiers();
        }
    });

    // Keyboard shortcut to open admin mode (Ctrl+Shift+A)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            loadAdminModal();
        }
    });
});
