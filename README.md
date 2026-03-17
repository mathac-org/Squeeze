# 🍋 Squeeze - Options Volatility Analyzer

Squeeze is a full-stack Node.js application designed to analyze options contracts by comparing Historical Volatility (HV) against Implied Volatility (IV). It helps identify statistically "cheap" or "expensive" options based on theoretical fair value, Probability of Profit (POP), and Expected Value (EV).

## Features
- **Volatility Analysis**: Calculates annualized Historical Volatility from 1-year daily closing prices.
- **Fair Value Pricing**: Uses an internal Black-Scholes implementation for theoretical pricing.
- **Actionable Metrics**: Calculates POP and EV for every contract in the chain.
- **Dynamic UI**: Asynchronously fetches stock data and expiration dates.
- **"Squeeze" Highlighting**: Automatically highlights contracts where HV > IV and Fair Price > Market Price.

## Prerequisites
- **Node.js**: v20.x, v22.x, or v24.14.0+ (Tested for compatibility with Node 24).
- **npm**: v10.x+

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Squeeze
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory (optional, defaults are provided):
   ```
   PORT=3000
   ```

## Running the Project

### Development Mode
Runs the server with `nodemon` for automatic restarts on file changes:
```bash
npm run dev
```

### Production Mode
Starts the server normally:
```bash
npm start
```
The application will be available at `http://localhost:3000`.

## Running Tests
The project uses **Jest** for unit and integration testing.
```bash
npm test
```

## Project Structure
- `server.js`: Express server and API routes.
- `utils/finance.js`: Quantitative financial logic (HV, BS, POP, EV).
- `views/`: EJS templates for the frontend.
- `public/`: Static assets (CSS, Client-side JS).
- `tests/`: Comprehensive test suite with mocks.

## "Squeeze" Logic
The "Squeeze" happens when actual historical movement (**HV**) exceeds what the market expects (**IV**). If the theoretical **Fair Price** (calculated using HV) is greater than the **Market Price**, it indicates a potential edge, which is quantified by a positive **Expected Value (EV)**.