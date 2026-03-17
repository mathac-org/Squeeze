const request = require('supertest');
const { app, yahooFinance } = require('../server');
const fs = require('fs');
const path = require('path');

const mockOptionChain = JSON.parse(fs.readFileSync(path.join(__dirname, 'mocks/option-chain.json'), 'utf8'));

describe('Express Server API Endpoints', () => {
    test('GET / should return 200 and render index', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
    });

    test('GET /api/expiry/:ticker should return expiry dates', async () => {
        const spy = jest.spyOn(yahooFinance, 'options').mockResolvedValue(mockOptionChain);

        const response = await request(app).get('/api/expiry/XLK');
        expect(response.statusCode).toBe(200);
        expect(response.body.expirations).toContain('2026-06-19');

        spy.mockRestore();
    });

    test('POST /api/analyze should return analysis results', async () => {
        const optionsSpy = jest.spyOn(yahooFinance, 'options').mockResolvedValue(mockOptionChain);
        const historicalSpy = jest.spyOn(yahooFinance, 'historical').mockResolvedValue([
            { date: new Date(), close: 210.50 },
            { date: new Date(), close: 211.00 }
        ]);

        const response = await request(app)
            .post('/api/analyze')
            .send({ ticker: 'XLK', expiry: '2026-06-19', type: 'call' });

        expect(response.statusCode).toBe(200);
        expect(response.body.ticker).toBe('XLK');
        expect(response.body.results.length).toBeGreaterThan(0);
        expect(response.body.results[0]).toHaveProperty('ev');

        optionsSpy.mockRestore();
        historicalSpy.mockRestore();
    });

    test('POST /api/analyze should return 400 for missing parameters', async () => {
        const response = await request(app)
            .post('/api/analyze')
            .send({ ticker: 'XLK' });
        expect(response.statusCode).toBe(400);
    });
});
