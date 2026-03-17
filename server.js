const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

// Handle potential ESM/CJS export issues with yahoo-finance2
let YahooFinance;
try {
    const yf = require('yahoo-finance2');
    YahooFinance = yf.default || yf;
} catch (e) {
    console.error('Failed to load yahoo-finance2:', e);
}

const {
    calculateHistoricalVolatility,
    calculateBlackScholes,
    calculatePOP,
    calculateExpectedValue
} = require('./utils/finance');

dotenv.config();

const yahooFinance = new YahooFinance();
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());

// Route: UI Home
app.get('/', (req, res) => {
    res.render('index');
});

// Route: API to get expiry dates
app.get('/api/expiry/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        const results = await yahooFinance.options(ticker);
        res.json({ expirations: results.expirationDates });
    } catch (error) {
        console.error('Error fetching expiry dates:', error);
        res.status(500).json({ error: 'Failed to fetch expiry dates' });
    }
});

// Route: API to analyze options
app.post('/api/analyze', async (req, res) => {
    try {
        const { ticker, expiry, type } = req.body;
        if (!ticker || !expiry || !type) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 1. Fetch Option Chain
        const optionData = await yahooFinance.options(ticker, { date: expiry });
        if (!optionData || !optionData.quote) {
            return res.status(404).json({ error: 'Option data not found' });
        }
        const underlyingPrice = optionData.quote.regularMarketPrice;

        // Yahoo Finance v2/v3 might wrap calls/puts inside an options array
        const chain = (optionData.options && optionData.options.length > 0) ? optionData.options[0] : optionData;

        // 2. Fetch Historical Data (1 year)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);

        const historicalData = await yahooFinance.historical(ticker, {
            period1: startDate.toISOString().split('T')[0],
            period2: endDate.toISOString().split('T')[0],
            interval: '1d'
        });

        if (!historicalData || !Array.isArray(historicalData)) {
             return res.status(500).json({ error: 'Failed to fetch historical data' });
        }

        const prices = historicalData.map(d => d.close).filter(p => p !== undefined);
        const hv = calculateHistoricalVolatility(prices);

        // 3. Risk-free rate (using 4.5% as an estimate for 10Y Treasury if not provided)
        const riskFreeRate = 0.045;

        // 4. Analyze each contract
        const expirationDate = new Date(expiry);
        const now = new Date();
        const timeToExpiry = (expirationDate - now) / (1000 * 60 * 60 * 24 * 365);

        let optionsToAnalyze = [];
        if (type === 'call' || type === 'both') {
            const calls = chain.calls || [];
            optionsToAnalyze = optionsToAnalyze.concat(calls.map(opt => ({ ...opt, optionType: 'call' })));
        }
        if (type === 'put' || type === 'both') {
            const puts = chain.puts || [];
            optionsToAnalyze = optionsToAnalyze.concat(puts.map(opt => ({ ...opt, optionType: 'put' })));
        }

        const results = optionsToAnalyze.map(opt => {
            const marketPrice = (opt.bid + opt.ask) / 2 || opt.lastPrice;
            const fairPrice = calculateBlackScholes(
                opt.optionType,
                underlyingPrice,
                opt.strike,
                timeToExpiry,
                hv,
                riskFreeRate
            );
            const pop = calculatePOP(
                opt.optionType,
                underlyingPrice,
                opt.strike,
                timeToExpiry,
                hv, // Use HV for POP calculation as per "Squeeze" logic
                riskFreeRate
            );
            const ev = calculateExpectedValue(pop, fairPrice, marketPrice);

            return {
                strike: opt.strike,
                expiry: expiry,
                type: opt.optionType,
                hv: (hv * 100).toFixed(2) + '%',
                iv: (opt.impliedVolatility * 100).toFixed(2) + '%',
                hv_iv_diff: ((hv - opt.impliedVolatility) * 100).toFixed(2) + '%',
                fairPrice: fairPrice.toFixed(2),
                marketPrice: marketPrice.toFixed(2),
                pop: (pop * 100).toFixed(2) + '%',
                ev: ev.toFixed(2),
                isSqueeze: hv > opt.impliedVolatility && fairPrice > marketPrice
            };
        });

        // Sort by EV descending
        results.sort((a, b) => b.ev - a.ev);

        res.json({
            ticker,
            underlyingPrice,
            results
        });

    } catch (error) {
        console.error('Error analyzing options:', error);
        res.status(500).json({ error: 'Failed to analyze options' });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Squeeze Server running on port ${PORT}`);
    });
}

module.exports = { app, yahooFinance };
