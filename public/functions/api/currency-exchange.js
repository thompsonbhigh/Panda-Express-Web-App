/**
 * Module for fetching and displaying live currency exchange rates using the ExchangeRate-API.
 *
 * Updates any element that contains a `data-base-price` attribute so all menu pages
 * (menu-price, price, premium-price, etc.) will be converted.
 *
 * @module API/CurrencyExchange
 */

const EXCHANGE_API_KEY = "df2e3ff089d04850763f2aa7";
const BASE_CURRENCY = "USD";
const TARGET_SELECT_ID = "currency-selector";
const RATE_DISPLAY_ID = "exchange-rate";

/**
 * Fetches the latest exchange rate for the given target currency
 * and updates displayed prices.
 *
 * @async
 * @param {string} targetCurrency - Currency code like "EUR", "JPY", "GBP"
 * @returns {Promise<void>} Resolves when DOM prices are updated
 */
async function fetchExchangeRate(targetCurrency) {
    const API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/${BASE_CURRENCY}`;

    try {
        const response = await fetch(API_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (data.result === "success") {
            const rate = data.conversion_rates[targetCurrency];

            const rateEl = document.getElementById(RATE_DISPLAY_ID);
            if (rateEl) rateEl.textContent = `1 ${BASE_CURRENCY} = ${rate} ${targetCurrency}`;

            updateAllPrices(rate, targetCurrency);
        } else {
            const rateEl = document.getElementById(RATE_DISPLAY_ID);
            if (rateEl) rateEl.textContent = "Error fetching rate";
            console.error("Exchange API error:", data["error-type"]);
        }
    } catch (err) {
        console.error("Error fetching exchange rate:", err);
        const rateEl = document.getElementById(RATE_DISPLAY_ID);
        if (rateEl) rateEl.textContent = "Error fetching rate";
    }
}

/**
 * Updates all DOM elements containing a `data-base-price` attribute.
 *
 * This allows any price element to automatically convert when the currency changes.
 *
 * @param {number} rate - Conversion multiplier (target currency per 1 USD)
 * @param {string} targetCurrency - Currency code to display (e.g., "CAD")
 * @returns {void}
 */
function updateAllPrices(rate, targetCurrency) {
    const nodes = document.querySelectorAll("[data-base-price]");

    nodes.forEach(node => {
        const base = parseFloat(node.getAttribute("data-base-price"));
        if (isNaN(base)) return;

        const converted = Math.round(base * rate * 100) / 100;

        node.textContent = `${targetCurrency} ${converted.toFixed(2)}`;
    });
}

/**
 * Initializes the currency exchange system when the DOM is ready.
 *
 * Sets up:
 * - Automatic initial conversion
 * - Listener for currency selector changes
 *
 * @listens DOMContentLoaded
 * @returns {void}
 */
document.addEventListener("DOMContentLoaded", () => {
    const selector = document.getElementById(TARGET_SELECT_ID);

    if (!selector) {
        return;
    }

    fetchExchangeRate(selector.value);

    selector.addEventListener("change", () => {
        fetchExchangeRate(selector.value);
    });
});