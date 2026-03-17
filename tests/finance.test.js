const {
    calculateHistoricalVolatility,
    calculateBlackScholes,
    calculatePOP,
    calculateExpectedValue
} = require('../utils/finance');

describe('Financial Utility Functions', () => {
    test('calculateHistoricalVolatility should return a positive value for moving prices', () => {
        const prices = [100, 102, 101, 105, 103];
        const hv = calculateHistoricalVolatility(prices);
        expect(hv).toBeGreaterThan(0);
    });

    test('calculateBlackScholes should price a Call option correctly', () => {
        // s=100, k=100, t=1, v=0.2, r=0.05
        const price = calculateBlackScholes('call', 100, 100, 1, 0.2, 0.05);
        expect(price).toBeCloseTo(10.45, 1);
    });

    test('calculatePOP should return a value between 0 and 1', () => {
        const pop = calculatePOP('call', 100, 100, 1, 0.2, 0.05);
        expect(pop).toBeGreaterThan(0.5); // OTM/ATM calls have some POP
        expect(pop).toBeLessThan(1);
    });

    test('calculateExpectedValue should be negative if Market Price exceeds Fair Price', () => {
        const ev = calculateExpectedValue(0.5, 2.00, 3.00);
        expect(ev).toBeLessThan(0);
    });

    test('calculateExpectedValue should be positive if Fair Price is high enough', () => {
        const ev = calculateExpectedValue(0.7, 5.00, 2.00);
        expect(ev).toBeGreaterThan(0);
    });
});
