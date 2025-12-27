async function fetchData() {
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    if (!month || !year) return;
    
    const response = await fetch(`${BASE_URL}/api/leaderboard/months-top-point-players?month=${month}&year=${year}`);
    const data = await response.json();
    
    const table = document.getElementById('dataTable');
    table.innerHTML = '';
    
    if (data.length === 0) {
        table.innerHTML = '<tr><td>No data</td></tr>';
        return;
    }
    
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(h => {
            const td = document.createElement('td');
            td.textContent = row[h];
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
}
