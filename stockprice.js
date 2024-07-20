let intervalId;
const stocks = new Map();

function addStockInput() {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group mb-2';
    inputGroup.innerHTML = '<input type="text" class="form-control stockSymbol" placeholder="Enter stock symbol">';
    document.getElementById('stockInputs').appendChild(inputGroup);
}

async function getStockPrice(symbol) {
    const url = `https://alpha-vantage.p.rapidapi.com/query?function=GLOBAL_QUOTE&symbol=${symbol}`;
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '3cd47dfc52mshd13c0a6cfb76cfdp1982bbjsn74529077e580',
            'X-RapidAPI-Host': 'alpha-vantage.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        if (result['Global Quote'] && result['Global Quote']['05. price']) {
            return parseFloat(result['Global Quote']['05. price']);
        } else {
            throw new Error('Unable to fetch stock price');
        }
    } catch (error) {
        console.error('Error:', error);
        showModal(error);
        return null;
    }
}

// Updates the stock price table
async function updateStockPrices() {
    for (let [symbol, rowId] of stocks) {
        const price = await getStockPrice(symbol);
        const row = document.getElementById(rowId);
        if (price !== null) {
            row.cells[1].textContent = `$${price.toFixed(2)}`;
            row.className = ''; // Reset any previous styling
        } else {
            row.cells[1].textContent = 'Failed to fetch price';
            row.className = 'table-danger'; // Highlight row in red for error
        }
    }
    updateLastUpdateTime();
}

function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = `Last updated: ${now.toLocaleString()}`;
}

function addStock(symbol) {
    symbol = symbol.toUpperCase();
    if (!stocks.has(symbol)) {
        const rowId = `row-${symbol}`;
        stocks.set(symbol, rowId);
        const tableBody = document.querySelector('#stockTable tbody');
        const row = tableBody.insertRow();
        row.id = rowId;
        row.insertCell(0).textContent = symbol;
        row.insertCell(1).textContent = 'Loading...';
        const removeCell = row.insertCell(2);
        removeCell.innerHTML = '<button class="btn btn-danger btn-sm" onclick="removeStock(\'' + symbol + '\')">Remove</button>';
    }
}

function removeStock(symbol) {
    if (stocks.has(symbol)) {
        const rowId = stocks.get(symbol);
        document.getElementById(rowId).remove();
        stocks.delete(symbol);
    }
}

function showModal(message) {
    // Set the message in the modal body
    document.getElementById('modalBody').textContent = message;
    
    // Create a new modal instance
    var myModal = new bootstrap.Modal(document.getElementById('genericModal'));
    
    // Show the modal
    myModal.show();
}

async function trackStocks() {
    if (intervalId) {
        clearInterval(intervalId);
    }

    const symbolInputs = document.getElementsByClassName('stockSymbol');
    for (let input of symbolInputs) {
        const symbol = input.value.trim();
        if (symbol) {
            addStock(symbol);
        }
    }

    if (stocks.size === 0) {
        showModal('Please enter at least one stock symbol');
        return;
    }

    await updateStockPrices();

    // Update prices every 10 minutes (600000 ms)
    intervalId = setInterval(updateStockPrices, 600000);
}