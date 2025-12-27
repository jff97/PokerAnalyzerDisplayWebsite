function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function setDiagnosticsTitle(titleText) {
    const titleElement = document.getElementById("diagnosticsTitle");
    if (titleElement) {
        titleElement.innerHTML = titleText;
    } else {
        console.error("Title element not found");
    }
}

function setDescription(content) {
    document.getElementById('diagnosticsDescription').innerHTML = content;
}

function showDiagnosticsMenu() {
    setDiagnosticsTitle("Advanced Model Diagnostics");
    
    const descDiv = document.getElementById('diagnosticsDescription');
    descDiv.innerHTML = '';
    
    const p = document.createElement('p');
    p.textContent = 'Select a diagnostic to view:';
    descDiv.appendChild(p);
    
    const ul = document.createElement('ul');
    
    const links = [
        { href: '?endpoint=network-graph', text: 'Player Network Graph' },
        { href: '?endpoint=community-disconnectedness', text: 'Isolated Skill Pockets Analysis' }
    ];
    
    links.forEach(link => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.text;
        li.appendChild(a);
        ul.appendChild(li);
    });
    
    descDiv.appendChild(ul);
    document.getElementById('diagnosticsContent').innerHTML = '';
}

function normalizePlayerName(name) {
    return name.toLowerCase()
               .trim()
               .replace(/\s+/g, ' ');
}

function generateNetworkGraph() {
    const playerName = document.getElementById('playerNameInput').value.trim();
    if (!playerName) {
        alert('Please enter a player name');
        return;
    }
    
    const normalizedName = normalizePlayerName(playerName);
    const url = BASE_URL + "/api/leaderboard/network-graph?player_name=" + encodeURIComponent(normalizedName);
    window.open(url, '_blank');
}

async function loadCommunityDisconnectedness() {
    const contentDiv = document.getElementById('diagnosticsContent');
    if (!contentDiv) return;
    
    try {
        const response = await fetch('../static/cachedLeaderboards/community-disconnectedness.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        contentDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        console.error('Error fetching community disconnectedness data:', error);
        contentDiv.innerHTML = `<p style="color: red;">Error loading data: ${error.message}</p>`;
    }
}

async function loadDiagnostics() {
    let diagnosticEndpoint = getQueryParam("endpoint");
    
    if (diagnosticEndpoint === null) {
        showDiagnosticsMenu();
        return;
    }

    // Handle network-graph
    if (diagnosticEndpoint === "network-graph") {
        setDiagnosticsTitle("Player Network Graph");
        setDescription('<p>Network graph visualization showing player connections and performance relationships. Enter a player name below to generate their network graph.</p><div><label for="playerNameInput">Player Name:</label><br><input type="text" id="playerNameInput" placeholder="Enter player name (e.g., john f)"><button onclick="generateNetworkGraph()">Generate Network Graph</button></div><p>This interactive graph displays how players are connected through their game history and performance metrics.</p>');
        
        setTimeout(() => {
            const input = document.getElementById('playerNameInput');
            if (input) {
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        generateNetworkGraph();
                    }
                });
            }
        }, 0);
        return;
    }

    // Handle community-disconnectedness
    if (diagnosticEndpoint === "community-disconnectedness") {
        setDiagnosticsTitle("Isolated Skill Pockets Analysis");
        setDescription('<p>This analysis identifies isolated pockets of skill within the player community, highlighting groups of players who may not interact frequently with the broader player base. Understanding these pockets can help in tailoring matchmaking and community engagement strategies.</p>');
        await loadCommunityDisconnectedness();
        return;
    }
    
    // Unknown endpoint
    showDiagnosticsMenu();
}

// Main run point for the script
loadDiagnostics();