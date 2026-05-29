// Configuration
const CACHE_FILE = '../static/cachedLeaderboards/tournament-qualifiers.json';

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('error-message');
const qualifiersContainerEl = document.getElementById('qualifiers-container');

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

// Show error message
function showError(message) {
    errorMessageEl.textContent = message;
    errorEl.style.display = 'block';
    qualifiersContainerEl.style.display = 'none';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadQualifiers();
});
