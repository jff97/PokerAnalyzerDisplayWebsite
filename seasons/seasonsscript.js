const API_URL = `${BASE_URL}/api/admin/season-calendar`;

const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];

const CHECK_INTERVAL_MS = 15000;

// Show loading screen until server is ready
function showLoadingScreen() {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="loading-container"><p>Waiting for server to warm up...</p></div>`;
}

// Ping server root until ready
async function waitForServer() {
    try {
        const response = await fetch(BASE_URL, { method: 'GET' });
        if (response.ok) {
            showYearForm();
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (err) {
        console.log('Server not ready, retrying in 15s...', err);
        setTimeout(waitForServer, CHECK_INTERVAL_MS);
    }
}

// Show year input form (always empty, no default year)
function showYearForm() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <h1>🎲 Poker League Season Calendar</h1>
            <div class="directions">
                <details>
                    <summary>Directions</summary>
                    <p>Enter the year you want to set start and end dates for. The year applies to the months in that calendar year. 
                    Not all dates have to explicitly fall within that year, and the dates do not need to fall in the calendar month exactly; 
                    they represent the league month.</p>
                    <p>The start date should be the date of the final tournament (Saturday) and the end date should be the last Friday in the season (the day before the next final tournament). Seasons should always run Saturday to Friday.</p>
                    <p>Please ensure all dates are correct before the start of the next season, preferably a month before or ASAP.</p>
                </details>
            </div>
            <div class="year-section">
                <label for="yearInput">Enter Year:</label>
                <input type="number" id="yearInput" placeholder="YYYY" min="2000" max="2100">
                <button id="loadYearBtn">Load Calendar</button>
            </div>
            <div class="message" id="message"></div>
            <div id="calendarContainer"></div>
        </div>
    `;

    document.getElementById('loadYearBtn').addEventListener('click', () => {
        const year = parseInt(document.getElementById('yearInput').value);
        if (!year) {
            showMessage('error','Please enter a valid year');
            return;
        }
        loadCalendar(year);
    });
}

// Build calendar form for a specific year
function buildCalendarForm(year, data = {}) {
    const container = document.getElementById('calendarContainer');
    container.innerHTML = `
        <div class="password-section">
            <label for="password">Admin Password</label>
            <input type="password" id="password" placeholder="Enter password to save changes">
        </div>
        <div class="buttons">
            <button class="btn-save" id="saveBtn">Save Calendar</button>
        </div>
        <div class="months-grid" id="monthsContainer"></div>
    `;

    initializeForm(year, data);

    document.getElementById('saveBtn').addEventListener('click', () => saveCalendar(year));
}

// Initialize months grid
function initializeForm(year, data) {
    const container = document.getElementById('monthsContainer');
    container.innerHTML = '';
    months.forEach(month => {
        const start = data.months?.[month]?.start_date || '';
        const end = data.months?.[month]?.end_date || '';
        const card = document.createElement('div');
        card.className = 'month-card';
        card.innerHTML = `
            <h3>${month} Season ${year}</h3>
            <div class="form-group">
                <label for="${month}-start">Start Date</label>
                <input type="date" id="${month}-start" name="${month}-start" value="${start}">
            </div>
            <div class="form-group">
                <label for="${month}-end">End Date</label>
                <input type="date" id="${month}-end" name="${month}-end" value="${end}">
            </div>
        `;
        container.appendChild(card);
    });
}

// Load calendar for a specific year using query param
async function loadCalendar(year) {
    showMessage('','Loading...');
    try {
        const response = await fetch(`${API_URL}?year=${year}`, { method: 'GET' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        buildCalendarForm(year, data);
        showMessage('success','Calendar loaded successfully!');
    } catch(error) {
        showMessage('error', `Failed to load calendar: ${error.message}`);
    }
}

// Save calendar for a specific year
async function saveCalendar(year) {
    const password = document.getElementById('password').value;
    if (!password) { 
        showMessage('error','Please enter the admin password'); 
        return; 
    }

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    showMessage('','Saving...');

    // Build monthsData including all months so backend can validate
    const monthsData = {};
    months.forEach(month => {
        const start = document.getElementById(`${month}-start`).value || null;
        const end = document.getElementById(`${month}-end`).value || null;
        monthsData[month] = { start_date: start, end_date: end };
    });

    // Optional: quick frontend check if all months are empty
    if (Object.values(monthsData).every(m => !m.start_date && !m.end_date)) {
        showMessage('error','Please enter at least one month with dates'); 
        btn.disabled=false; 
        return; 
    }

    const payload = { password, year, months: monthsData };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
        showMessage('success','Calendar saved successfully! ✓');
    } catch(error) {
        showMessage('error',`Failed to save calendar: ${error.message}`);
    } finally { 
        btn.disabled = false; 
    }
}


// Show messages
function showMessage(type,text) {
    const messageEl = document.getElementById('message');
    if (!text) { messageEl.style.display='none'; return; }
    messageEl.textContent=text;
    messageEl.className='message '+type;
    messageEl.style.display='block';
}

// Start
document.addEventListener('DOMContentLoaded',()=>{
    showLoadingScreen();
    waitForServer();
});
