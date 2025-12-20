let currentChart = null;
let selectedPlayers = [];
let allPlayersData = null;

const COLORS = [
    { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.2)' },
    { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.2)' },
    { border: 'rgb(54, 162, 235)', background: 'rgba(54, 162, 235, 0.2)' },
    { border: 'rgb(255, 206, 86)', background: 'rgba(255, 206, 86, 0.2)' },
    { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.2)' },
    { border: 'rgb(255, 159, 64)', background: 'rgba(255, 159, 64, 0.2)' },
    { border: 'rgb(201, 203, 207)', background: 'rgba(201, 203, 207, 0.2)' },
    { border: 'rgb(83, 102, 255)', background: 'rgba(83, 102, 255, 0.2)' }
];

async function loadAllPlayers() {
    const messageDiv = document.getElementById('message');
    
    if (allPlayersData) {
        return allPlayersData;
    }

    try {
        messageDiv.innerHTML = '<div class="info">Loading player data...</div>';
        // Load from cached file instead of API
        const response = await fetch('../static/cachedLeaderboards/placement-distribution.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allPlayersData = await response.json();
        messageDiv.innerHTML = '';
        return allPlayersData;

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Error fetching data: ${error.message}</div>`;
        console.error('Error:', error);
        return null;
    }
}

async function addPlayer() {
    const playerName = document.getElementById('playerName').value.trim();
    const messageDiv = document.getElementById('message');
    
    if (!playerName) {
        messageDiv.innerHTML = '<div class="error">Please enter a player name</div>';
        return;
    }

    const allPlayers = await loadAllPlayers();
    if (!allPlayers) return;

    // Find the player (case-insensitive)
    const playerData = allPlayers.find(p => 
        p.playerName.toLowerCase() === playerName.toLowerCase()
    );

    if (!playerData) {
        messageDiv.innerHTML = `<div class="error">Player "${playerName}" not found.</div>`;
        return;
    }

    // Check if already added
    if (selectedPlayers.some(p => p.playerName === playerData.playerName)) {
        messageDiv.innerHTML = `<div class="error">Player "${playerData.playerName}" already added</div>`;
        return;
    }

    selectedPlayers.push(playerData);
    document.getElementById('playerName').value = '';
    updatePlayerList();
    updateChart();
    messageDiv.innerHTML = '';
}

function removePlayer(playerName) {
    selectedPlayers = selectedPlayers.filter(p => p.playerName !== playerName);
    updatePlayerList();
    updateChart();
}

function clearPlayers() {
    selectedPlayers = [];
    updatePlayerList();
    updateChart();
    document.getElementById('message').innerHTML = '';
}

function updatePlayerList() {
    const playerListDiv = document.getElementById('playerList');
    
    if (selectedPlayers.length === 0) {
        playerListDiv.innerHTML = '';
        return;
    }

    playerListDiv.innerHTML = selectedPlayers.map((player, index) => {
        const color = COLORS[index % COLORS.length];
        return `
            <div class="player-tag" style="border-left: 4px solid ${color.border}">
                ${player.playerName} (${player.roundsPlayed} rounds)
                <span class="remove" onclick="removePlayer('${player.playerName}')">&times;</span>
            </div>
        `;
    }).join('');
}

function updateChart() {
    const ctx = document.getElementById('kdeChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (currentChart) {
        currentChart.destroy();
    }

    if (selectedPlayers.length === 0) {
        // Show empty chart
        currentChart = new Chart(ctx, {
            type: 'line',
            data: { datasets: [] },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
        return;
    }

    // Create datasets for each player
    const datasets = selectedPlayers.map((player, index) => {
        const color = COLORS[index % COLORS.length];
        return {
            label: `${player.playerName} (${player.roundsPlayed} rounds)`,
            data: player.kdeData,
            borderColor: color.border,
            backgroundColor: color.background,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2
        };
    });

    // Create new chart
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            parsing: {
                xAxisKey: 'x',
                yAxisKey: 'y'
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Percentile Finish (0.0 = Last Place, 1.0 = First Place)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    min: 0,
                    max: 1,
                    ticks: {
                        callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Density',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `Percentile: ${(context[0].parsed.x * 100).toFixed(1)}%`;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`;
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

// Allow Enter key to add player
document.getElementById('playerName').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addPlayer();
    }
});

// Initialize empty chart
updateChart();
