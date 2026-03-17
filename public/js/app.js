document.addEventListener('DOMContentLoaded', () => {
    const tickerInput = document.getElementById('ticker');
    const expirySelect = document.getElementById('expiry');
    const analyzeForm = document.getElementById('analyzeForm');
    const resultsArea = document.getElementById('resultsArea');
    const resultsBody = document.getElementById('resultsBody');
    const spinner = document.getElementById('spinner');

    // Debounced fetch for expiry dates
    let debounceTimer;
    tickerInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const ticker = tickerInput.value.trim().toUpperCase();
        if (ticker.length < 1) {
            expirySelect.disabled = true;
            expirySelect.innerHTML = '<option value="">Enter ticker first...</option>';
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/expiry/${ticker}`);
                const data = await response.json();

                if (data.expirations && data.expirations.length > 0) {
                    expirySelect.disabled = false;
                    expirySelect.innerHTML = data.expirations.map(date => {
                        const d = new Date(date);
                        return `<option value="${date}">${d.toDateString()}</option>`;
                    }).join('');
                } else {
                    expirySelect.disabled = true;
                    expirySelect.innerHTML = '<option value="">No expirations found</option>';
                }
            } catch (error) {
                console.error('Error fetching expirations:', error);
                expirySelect.disabled = true;
                expirySelect.innerHTML = '<option value="">Error fetching dates</option>';
            }
        }, 500);
    });

    analyzeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const ticker = tickerInput.value.trim().toUpperCase();
        const expiry = expirySelect.value;
        const type = document.querySelector('input[name="optionType"]:checked').value;

        resultsArea.style.display = 'none';
        spinner.style.display = 'block';

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker, expiry, type })
            });

            const data = await response.json();
            spinner.style.display = 'none';

            if (data.error) {
                alert(data.error);
                return;
            }

            document.getElementById('resTicker').textContent = data.ticker;
            document.getElementById('resPrice').textContent = data.underlyingPrice.toFixed(2);

            resultsBody.innerHTML = '';
            data.results.forEach(res => {
                const row = document.createElement('tr');
                if (res.isSqueeze) {
                    row.classList.add('squeeze-row');
                }

                row.innerHTML = `
                    <td>${res.strike.toFixed(2)}</td>
                    <td>${res.type.toUpperCase()}</td>
                    <td>${res.hv}</td>
                    <td>${res.iv}</td>
                    <td>${res.hv_iv_diff}</td>
                    <td>$${res.fairPrice}</td>
                    <td>$${res.marketPrice}</td>
                    <td>${res.pop}</td>
                    <td>$${res.ev}</td>
                `;
                resultsBody.appendChild(row);
            });

            resultsArea.style.display = 'block';

        } catch (error) {
            spinner.style.display = 'none';
            console.error('Error analyzing:', error);
            alert('An error occurred during analysis.');
        }
    });
});
