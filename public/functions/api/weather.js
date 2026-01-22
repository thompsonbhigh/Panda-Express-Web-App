/**
 * Module for fetching and displaying current weather information from OpenWeatherMap API.
 *
 * @module API/Weather
 */


const API_KEY = "11594a4acd0d62a7067f9448185ee039";
const CITY = "College Station";
const STATE = "TX";
const COUNTRY = "US";
const UNITS = "imperial";
const API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${CITY},${STATE},${COUNTRY}&appid=${API_KEY}&units=${UNITS}`;

/**
 * Fetches current weather data from OpenWeatherMap API and updates the HTML elements
 * with the temperature, description, and icon.
 *
 * @async
 * @function fetchWeatherData
 * @memberof module:API/Weather
 */
function fetchWeatherData() {
    fetch(API_URL)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const temp = data.main.temp.toFixed(0);
            const description = data.weather[0].description;
            const city = data.name;

            const iconCode = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            
            const unitSymbol = UNITS === "metric" ? "°C" : "°F";

            document.getElementById("weather-temp").textContent = `${temp}${unitSymbol}`;
            document.getElementById("weather-description").textContent = description;

            document.getElementById("weather-icon").src = iconUrl;
            document.getElementById("weather-icon").alt = description;

            console.log("City:", city);
            console.log("Temperature:", `${temp}${unitSymbol}`);
            console.log("Description:", description);
            console.log("Icon URL:", iconUrl);
            console.log("Icon ALT text:", description);
        })
        .catch(error => {
            console.error("Could not fetch weather data:", error);
            document.getElementById("weather-city").textContent = "Failed to load";
            document.getElementById("weather-temp").textContent = "N/A";
            document.getElementById("weather-description").textContent = "Error";
        });
}

/**
 * Initialize weather data fetch when the DOM content is loaded.
 *
 * @memberof module:API/Weather
 */
document.addEventListener("DOMContentLoaded", fetchWeatherData);