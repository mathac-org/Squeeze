/**
 * Calculates Annualized Historical Volatility
 * @param {number[]} prices - Array of daily closing prices
 * @returns {number} - Annualized HV (e.g., 0.25 for 25%)
 */
function calculateHistoricalVolatility(prices) {
    if (!prices || prices.length < 2) return 0;
    const logReturns = [];
    for (let i = 1; i < prices.length; i++) {
        logReturns.push(Math.log(prices[i] / prices[i - 1]));
    }

    const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
    const variance = logReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (logReturns.length - 1);
    const dailyStdDev = Math.sqrt(variance);

    return dailyStdDev * Math.sqrt(252);
}

/**
 * Normal Cumulative Distribution Function approximation
 * @param {number} x
 * @returns {number}
 */
function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.821256 + t * 1.3302745))));
    return x > 0 ? 1 - p : p;
}

/**
 * Calculates Black-Scholes Price
 * @param {string} type - 'call' or 'put'
 * @param {number} s - Underlying price
 * @param {number} k - Strike price
 * @param {number} t - Time to expiration in years
 * @param {number} v - Volatility (HV)
 * @param {number} r - Risk-free rate
 * @returns {number} - Theoretical price
 */
function calculateBlackScholes(type, s, k, t, v, r) {
    if (t <= 0) return Math.max(0, type === 'call' ? s - k : k - s);

    const d1 = (Math.log(s / k) + (r + 0.5 * v * v) * t) / (v * Math.sqrt(t));
    const d2 = d1 - v * Math.sqrt(t);

    if (type.toLowerCase() === 'call') {
        return s * normalCDF(d1) - k * Math.exp(-r * t) * normalCDF(d2);
    } else {
        return k * Math.exp(-r * t) * normalCDF(-d2) - s * normalCDF(-d1);
    }
}

/**
 * Calculates Probability of Profit (POP)
 * Using the probability that the option expires ITM (N(d2) for calls).
 * @param {string} type - 'call' or 'put'
 * @param {number} s - Underlying price
 * @param {number} k - Strike price
 * @param {number} t - Time to expiration in years
 * @param {number} v - Volatility
 * @param {number} r - Risk-free rate
 * @returns {number} - POP (0 to 1)
 */
function calculatePOP(type, s, k, t, v, r) {
    if (t <= 0) return (type === 'call' ? s > k : s < k) ? 1 : 0;
    const d2 = (Math.log(s / k) + (r - 0.5 * v * v) * t) / (v * Math.sqrt(t));
    return type.toLowerCase() === 'call' ? normalCDF(d2) : normalCDF(-d2);
}

/**
 * Calculates Expected Value of a Long Option
 * @param {number} pop - Probability of Profit (0 to 1)
 * @param {number} fairPrice - Theoretical price from Black-Scholes
 * @param {number} marketPrice - Current Ask/Mid price
 * @returns {number} - Expected Value in currency units
 */
function calculateExpectedValue(pop, fairPrice, marketPrice) {
    const potentialGain = Math.max(0, fairPrice - marketPrice);
    const potentialLoss = marketPrice; // Max loss for long options

    // EV = (Prob of Gain * Gain) - (Prob of Loss * Loss)
    const ev = (pop * potentialGain) - ((1 - pop) * potentialLoss);
    return ev;
}

module.exports = {
    calculateHistoricalVolatility,
    calculateBlackScholes,
    calculatePOP,
    calculateExpectedValue,
    normalCDF
};
