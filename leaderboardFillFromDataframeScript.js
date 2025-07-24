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
            <li>🏆 Ranks players by considering not just wins, but the ranking of the opponents you face.</li>
            <li>🔄 Adjusts your ranking after every game.</li>
            <li>🎮 Used by Xbox Live for popular games like Halo, Call of Duty, Gears of War, Forza, Overwatch, Team Fortress 2, and CS:GO.</li>
            <li><i class="fa-solid fa-circle-question" style="color:#8bc34a;"></i> Uncertainty value keeps it fair: new players and streaky players get a temporary penalty until they have enough rounds for a reliable ranking.</li>
        </ul>
        <p>
            <strong>Note:</strong> Your TrueSkill score is a <strong>relative skill estimate</strong>, not a point total or winning percentage. Higher means stronger player, but it’s not a direct measure of any one stat.
        </p>
    `;
    document.getElementById('leaderboardDescription').innerHTML = info;
}
function setPercentileDescription() {
  const info = `
        <p>
            For every round a player places ahead of a percentage of other players who played that day. This leaderboard measures on average what percentage of players they place ahead of.
        </p>
    `;
  document.getElementById('leaderboardDescription').innerHTML = info;
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


  async function loadLeaderboard() {
    let leaderBoardEndpoint = getQueryParam("leaderboardendpoint");
    if (leaderBoardEndpoint === null) {
      leaderBoardEndpoint = "trueskill"; // Default to trueskill if no param provided
    }

    if (leaderBoardEndpoint === "trueskill") {
      setLeaderboardTitle('<a href="https://www.microsoft.com/en-us/research/project/trueskill-ranking-system/" target="_blank" style="display:inline-block; padding:0 0.3em; border-radius:0.2em; text-decoration:none; font-weight:bold;"><span>Trueskill™</span><i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.95em; color:#fff; margin-left:0.3em;"></i> <span>by Microsoft Leaderboard</span></a>')
      setTrueSkillDescription();
    }
    else if (leaderBoardEndpoint === "percentile") {
      setLeaderboardTitle("Average Percent Players Outlasted Leaderboard")
      setPercentileDescription()
    }
    else if (leaderBoardEndpoint === "placement") {
      setLeaderboardTitle("Average Top 3 percent placement Leaderboard")
    }
    else if (leaderBoardEndpoint === "percentilenoroundlimit") {
      setLeaderboardTitle("Average Percent Players Outlasted Leaderboardno round limit")
    }
    else if (leaderBoardEndpoint === "roi") {
      setLeaderboardTitle("Average Simulated (WSOP style) Return On Investment Leaderboard")
    }
    const domain = "https://api.johnfoxweb.com"
    const localDomain = "http://127.0.0.1:5000"
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