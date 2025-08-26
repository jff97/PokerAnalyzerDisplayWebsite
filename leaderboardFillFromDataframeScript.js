// Domain configuration
const domain = "https://api.johnfoxweb.com";
const localDomain = "http://127.0.0.1:5000";

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
      // For Rank column, keep special style & scope
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

        // If Rank column missing in data, generate rank as index+1
        if (col === 'Rank' && val === undefined) val = index + 1;

        if (col === 'Rank') {
          tr.appendChild(createRankCell(val, index));
        } else if (col === 'Player') {
          tr.appendChild(createPlayerCell(val, index));
        } else {
          // Regular cell, centered text
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
function setTrueSkillDescription() {
    const info = `
        <strong>Why We Use TrueSkill™ for Rankings</strong><br><br>
        <ul>
            <li>🏆 Considers both your placement in the round and the ranking of opponents you faced to determine your rank.</li>
            <li>🔄 Adjusts your ranking after every game you play.</li>
            <li>🎮 Used for competitive matchmaking in popular games like Halo, Call of Duty, Gears of War, Forza, Overwatch, Team Fortress 2, and CS:GO.</li>
            <li><i class="fa-solid fa-circle-question" style="color:#8bc34a;"></i> Uncertainty value keeps it fair: new players  get a temporary penalty until they have enough rounds for a reliable ranking. It is a standard deviation value from statistics.</li>
            <li>🃏 <strong>Adjusted Ranking:</strong> Your TrueSkill rating minus 3 times your uncertainty. This accounts for TrueSkill's uncertainty about your skill level and creates a fair ranking for players with both few and many rounds played. Your uncertainty goes down with more rounds played.</li>
        </ul>
        <p>
            <strong>Note:</strong> Your TrueSkill score is a <strong>relative skill estimate</strong>, not a point total or winning percentage. A higher rank indicates a stronger player, but it's not a direct measure of any one stat.
        </p>
    `;
    setDescription(info);
}
function setPercentileDescription() {
  const info = `
        <p>
            For every round a player places ahead of a percentage of other players who played that day. This leaderboard measures on average what percentage of players they place ahead of.
        </p>
        ${getMinimumRoundsDisclaimer()}
    `;
  setDescription(info);
}

// Helper function to set description content
function setDescription(content) {
    document.getElementById('leaderboardDescription').innerHTML = content;
}

// Helper function for the "no money exchanged" disclaimer
function getNoMoneyDisclaimer() {
    return `<p style="border: 2px solid; padding: 8px; margin: 10px 0; font-weight: bold; text-align: center;">
            ⚠️ No money is exchanged at Offsuit Poker League - this is just a metric. ⚠️
        </p>`;
}

// Helper function for minimum rounds filtering disclaimer
function getMinimumRoundsDisclaimer() {
    return `<p style="font-style: italic; margin: 10px 0;">
            📊 Only players with sufficient game history are included to ensure statistical reliability.
        </p>`;
}

function setPercentileNoRoundLimitDescription() {
    setDescription(`
        <p>
            Similar to the percentile leaderboard, but includes all rounds without any round limit restrictions. Shows the overall percentage of players outlasted across all games played.
        </p>
    `);
}

function setROIDescription() {
    setDescription(`
        <p>
            World Series of Poker (WSOP) style return on investment calculations measure profitability based on theoretical buy-in versus winnings in standard tournament-style payout structure. Example... If you buy in for $100 and your AVG ROI is 30% then on average you will walk out with $130
        </p>
        ${getMinimumRoundsDisclaimer()}
        ${getNoMoneyDisclaimer()}
    `);
}

function setFirstPlaceDescription() {
    setDescription(`
        <p>
            Ranks players by their percentage of first place finishes. Shows who has the most tournament wins. 
        </p>
        ${getMinimumRoundsDisclaimer()}
    `);
}

function setITMPercentDescription() {
    setDescription(`
        <p>
            In The Money (ITM) percentage shows how often a player would finish in a paying position in a standard tournament payout structure. 
            On this leaderboard ITM is defined by finishing in the top 20% of the competition.
        </p>
        ${getMinimumRoundsDisclaimer()}
        ${getNoMoneyDisclaimer()}
    `);
}

function setNetworkGraphDescription() {
    setDescription(`
        <p>
            Network graph visualization showing player connections and performance relationships. 
            Enter a player name below to generate their network graph.
        </p>
        <div>
            <label for="playerNameInput">Player Name:</label><br>
            <input type="text" id="playerNameInput" placeholder="Enter player name (e.g., john f)">
            <button onclick="generateNetworkGraph()">Generate Network Graph</button>
        </div>
        <p>
            This interactive graph displays how players are connected through their game history and performance metrics.
        </p>
    `);
    
    // Add event listener after the HTML is inserted
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
}

// Normalize player name: lowercase, trim spaces, single spaces between words
function normalizePlayerName(name) {
    return name.toLowerCase()
               .trim()
               .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

// Global function for network graph generation
function generateNetworkGraph() {
    const playerName = document.getElementById('playerNameInput').value.trim();
    if (!playerName) {
        alert('Please enter a player name');
        return;
    }
    
    const normalizedName = normalizePlayerName(playerName);
    const url = domain + "/api/leaderboard/network-graph?player_name=" + encodeURIComponent(normalizedName);
    window.open(url, '_blank');
}
// Capitalize first letter of each part of the name in the 'Player' or 'Name' column
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

// Capitalize each part of a full name string (e.g., first, last, middle)
function capitalizeFullName(name) {
    return name.split(' ').map(
        part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
}

// Show menu of available leaderboards when no endpoint is specified
function showLeaderboardMenu() {
    setLeaderboardTitle("Choose a Leaderboard");
    
    const menuContent = `
        <p>Select a leaderboard to view:</p>
        <ul>
            <li><a href="?leaderboardendpoint=trueskill" target="_blank">TrueSkill™ Leaderboard</a></li>
            <li><a href="?leaderboardendpoint=percentile" target="_blank">Percent Outlasted Leaderboard</a></li>
            <li><a href="?leaderboardendpoint=firstplace" target="_blank">First Place Leaderboard</a></li>
            <li><a href="?leaderboardendpoint=itmpercent" target="_blank">ITM Percentage</a></li>
            <li><a href="?leaderboardendpoint=roi" target="_blank">ROI Leaderboard</a></li>
            <li><a href="?leaderboardendpoint=network-graph" target="_blank">Network Graph</a></li>
        </ul>
    `;
    
    setDescription(menuContent);
    
    // Clear the table since we're showing the menu instead
    const thead = document.querySelector('table thead');
    const tbody = document.querySelector('table tbody');
    if (thead) thead.innerHTML = '';
    if (tbody) tbody.innerHTML = '';
}


  async function loadLeaderboard() {
    let leaderBoardEndpoint = getQueryParam("leaderboardendpoint");
    if (leaderBoardEndpoint === null) {
      showLeaderboardMenu();
      return;
    }

    if (leaderBoardEndpoint === "trueskill") {
      setLeaderboardTitle('<a href="https://www.microsoft.com/en-us/research/project/trueskill-ranking-system/" target="_blank" style="display:inline-block; padding:0 0.3em; border-radius:0.2em; text-decoration:none; font-weight:bold;"><span>Trueskill™</span><i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.95em; color:#fff; margin-left:0.3em;"></i> <span>by Microsoft Leaderboard</span></a>')
      setTrueSkillDescription();
    }
    else if (leaderBoardEndpoint === "percentile") {
      setLeaderboardTitle("Average Percent Players Outlasted Leaderboard")
      setPercentileDescription()
    }
    else if (leaderBoardEndpoint === "percentilenoroundlimit") {
      setLeaderboardTitle("Average Percent Players Outlasted Leaderboardno round limit")
      setPercentileNoRoundLimitDescription();
    }
    else if (leaderBoardEndpoint === "roi") {
      setLeaderboardTitle("Average Simulated (WSOP style) Return On Investment Leaderboard")
      setROIDescription();
    }
    else if (leaderBoardEndpoint === "firstplace") {
      setLeaderboardTitle("First Place Leaderboard")
      setFirstPlaceDescription();
    }
    else if (leaderBoardEndpoint === "itmpercent") {
      setLeaderboardTitle("ITM Percent Leaderboard")
      setITMPercentDescription();
    }
    else if (leaderBoardEndpoint === "network-graph") {
      setLeaderboardTitle("Player Network Graph")
      setNetworkGraphDescription();
      // Clear the table since we're showing the input form instead
      const thead = document.querySelector('table thead');
      const tbody = document.querySelector('table tbody');
      if (thead) thead.innerHTML = '';
      if (tbody) tbody.innerHTML = '';
      return; // Exit early for network graph
    }
    
    // Regular endpoint handling (not network-graph)
    const exampleData = await getData(domain + "/api/leaderboard/" + leaderBoardEndpoint);
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

//this is the main run point for the script
loadLeaderboard();