// Domain configuration
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_URL = isLocal ? 'http://127.0.0.1:5000' : 'https://api.johnfoxweb.com';

function createThCell(content, options = {}) {
    const th = document.createElement('th');
    if (options.id) th.id = options.id;
    if (options.classes) th.className = options.classes;
    if (options.scope) th.scope = options.scope;
    if (options.isSpan) {
      const span = document.createElement('span');
      if (options.spanClasses) span.className = options.spanClasses;
      span.textContent = content;
      th.appendChild(span);
    } else {
      th.textContent = content;
    }
    return th;
}

function createTdCell(content, options = {}) {
    const td = document.createElement('td');
    if (options.id) td.id = options.id;
    if (options.classes) td.className = options.classes;

    if (options.isDivWrapper) {
      const div = document.createElement('div');
      if (options.divClasses) div.className = options.divClasses;

      if (options.isSpan) {
        const span = document.createElement('span');
        if (options.spanClasses) span.className = options.spanClasses;
        span.textContent = content;
        div.appendChild(span);
      } else {
        div.textContent = content;
      }
      td.appendChild(div);
    } else if (options.isSpan) {
      const span = document.createElement('span');
      if (options.spanClasses) span.className = options.spanClasses;
      span.textContent = content;
      td.appendChild(span);
    } else {
      td.textContent = content;
    }
    return td;
}

function createRankCell(rank, index) {
    return createThCell(rank, {
      id: `rank-${index}`,
      classes: 'py-2 text-center fw-bold rank align-middle',
      scope: 'row',
      isSpan: true,
    });
}

function createPlayerCell(playerName, index) {
    const td = document.createElement('td');
    td.id = `player-${index}`;
    td.className = 'text-start align-middle';

    const div = document.createElement('div');
    div.className = 'editable-wrapper d-flex table-header-label d-flex px-2 py-1';

    const span = document.createElement('span');
    span.className = 'player-name';
    span.textContent = playerName;

    div.appendChild(span);
    td.appendChild(div);

    return td;
}

// Build table header dynamically from columns
function buildTableHeader(columns) {
    const thead = document.querySelector('table thead');
    thead.innerHTML = '';

    const tr = document.createElement('tr');

    columns.forEach(col => {
      if (col === 'Rank') {
        tr.appendChild(createThCell("", {
          classes: 'py-2 text-center fw-bold rank align-middle',
          scope: 'col',
          isSpan: true,
        }));
      } else if (col === 'Player') {
        tr.appendChild(createThCell(col, {
          classes: 'table-header text-start',
          scope: 'col',
          isSpan: true,
        }));
      } else {
        tr.appendChild(createThCell(col, {
          classes: 'text-center',
          scope: 'col',
          isSpan: true,
        }));
      }
    });

    thead.appendChild(tr);
}

// Build table body dynamically from data and columns
function buildTableBody(data, columns) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';

    data.forEach((row, index) => {
      const tr = document.createElement('tr');

      columns.forEach(col => {
        let val = row[col];

        if (col === 'Rank' && val === undefined) val = index + 1;

        if (col === 'Rank') {
          tr.appendChild(createRankCell(val, index));
        } else if (col === 'Player') {
          tr.appendChild(createPlayerCell(val, index));
        } else {
          tr.appendChild(createTdCell(val, {
            classes: 'align-middle text-center',
            isSpan: true,
          }));
        }
      });

      tbody.appendChild(tr);
    });
}

async function getData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
          return [];
        }
        return await response.json();
    } catch (error) {
        return [];
    }
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function setLeaderboardTitle(titleText) {
    const titleElement = document.getElementById("leaderboardTitle");
    if (titleElement) {
        titleElement.innerHTML = titleText;
    } else {
        console.warn("Element with id 'leaderboardTitle' not found.");
    }
}

function setDescription(content) {
    document.getElementById('leaderboardDescription').innerHTML = content;
}

function getNoMoneyDisclaimer() {
    return `<p style="border: 2px solid; padding: 8px; margin: 10px 0; font-weight: bold; text-align: center;">
            ⚠️ No money is exchanged at Offsuit Poker League - this is just a metric. ⚠️
        </p>`;
}

function getMinimumRoundsDisclaimer() {
    return `<p style="font-style: italic; margin: 10px 0;">
            📊 Only players with sufficient game history are included to ensure statistical reliability.
        </p>`;
}

function normalizePlayerName(name) {
    return name.toLowerCase()
               .trim()
               .replace(/\s+/g, ' '); // Replace multiple spaces with single space
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

function capitalizeNameFields(data) {
    if (!Array.isArray(data) || data.length === 0) return;
    data.forEach(row => {
        ['Player', 'Name'].forEach(field => {
            if (typeof row[field] === 'string') {
                row[field] = capitalizeFullName(row[field]);
            }
        });
    });
}

function capitalizeFullName(name) {
    return name.split(' ').map(
        part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
}

function showLeaderboardMenu(endpoints) {
    setLeaderboardTitle("Choose a Leaderboard");
    
    const menuContent = `
        <p>Select a leaderboard to view:</p>
        <ul>
            ${endpoints.map(endpoint => 
                `<li><a href="?leaderboardendpoint=${endpoint.endpoint}" target="_blank">${endpoint.title.replace(/<[^>]+>/g, '')}</a></li>`
            ).join('')}
        </ul>
    `;
    
    setDescription(menuContent);
    
    const thead = document.querySelector('table thead');
    const tbody = document.querySelector('table tbody');
    if (thead) thead.innerHTML = '';
    if (tbody) tbody.innerHTML = '';
}

async function loadEndpoints() {
    try {
        const response = await fetch('endpoints.json');
        if (!response.ok) {
            console.error('Failed to load endpoints.json');
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching endpoints:', error);
        return [];
    }
}

async function loadLeaderboard() {
    const endpoints = await loadEndpoints();
    let leaderBoardEndpoint = getQueryParam("leaderboardendpoint");
    
    if (leaderBoardEndpoint === null) {
        showLeaderboardMenu(endpoints);
        return;
    }

    const endpointConfig = endpoints.find(ep => ep.endpoint === leaderBoardEndpoint);
    if (!endpointConfig) {
        console.warn(`No configuration found for endpoint: ${leaderBoardEndpoint}`);
        showLeaderboardMenu(endpoints);
        return;
    }

    setLeaderboardTitle(endpointConfig.title);
    
    // Evaluate disclaimers in description if present
    let description = endpointConfig.description
        .replace('${getMinimumRoundsDisclaimer()}', getMinimumRoundsDisclaimer())
        .replace('${getNoMoneyDisclaimer()}', getNoMoneyDisclaimer());
    
    setDescription(description);

    if (leaderBoardEndpoint === "network-graph") {
        // Add event listener for network graph input
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
        
        const thead = document.querySelector('table thead');
        const tbody = document.querySelector('table tbody');
        if (thead) thead.innerHTML = '';
        if (tbody) tbody.innerHTML = '';
        return; // Exit early for network graph
    }

    const exampleData = await getData(BASE_URL + "/api/leaderboard/" + leaderBoardEndpoint);
    capitalizeNameFields(exampleData);

    if (exampleData.length === 0) {
        console.warn('No data to display');
        return;
    }
    
    let columns = Object.keys(exampleData[0]);
    if (!columns.includes('Rank')) columns.unshift('Rank');

    buildTableHeader(columns);
    buildTableBody(exampleData, columns);
}

// This is the main run point for the script
loadLeaderboard();