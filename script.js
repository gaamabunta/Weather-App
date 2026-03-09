
const spinner = document.getElementById('spinner');
const weatherData = document.getElementById('weatherData');
const locationEl = document.getElementById('location');
const iconEl = document.querySelector('#weatherIcon i');
const conditionEl = document.getElementById('conditionText');
const tempEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const feelsLikeEl = document.getElementById('feelsLike');
const errorMessage = document.getElementById('errorMessage');
const locationInput = document.getElementById('locationInput');
const getWeatherBtn = document.getElementById('getWeatherBtn');


let currentLat = 36.1682;
let currentLon = -85.5016;
let currentLocationName = "Cookeville, TN";

function buildApiUrl(lat, lon) {
    return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago`;
}


function getWeatherInfo(weatherCode) {
    // Weather code mapping
    const weatherMap = {
        // Clear
        0: { icon: 'bi-sun', text: 'Clear Sky', bgClass: 'clear-sky' },
        
        // Partly cloudy
        1: { icon: 'bi-cloud-sun', text: 'Partly Cloudy', bgClass: 'cloudy' },
        2: { icon: 'bi-cloud-sun', text: 'Partly Cloudy', bgClass: 'cloudy' },
        3: { icon: 'bi-cloud', text: 'Cloudy', bgClass: 'cloudy' },
        
        // Fog
        45: { icon: 'bi-cloud-fog', text: 'Foggy', bgClass: 'cloudy' },
        48: { icon: 'bi-cloud-fog', text: 'Foggy', bgClass: 'cloudy' },
        
        // Rain 
        51: { icon: 'bi-cloud-drizzle', text: 'Light Drizzle', bgClass: 'rainy' },
        53: { icon: 'bi-cloud-drizzle', text: 'Drizzle', bgClass: 'rainy' },
        55: { icon: 'bi-cloud-drizzle', text: 'Heavy Drizzle', bgClass: 'rainy' },
        61: { icon: 'bi-cloud-rain', text: 'Light Rain', bgClass: 'rainy' },
        63: { icon: 'bi-cloud-rain', text: 'Rain', bgClass: 'rainy' },
        65: { icon: 'bi-cloud-rain-heavy', text: 'Heavy Rain', bgClass: 'rainy' },
        
        // Snow
        71: { icon: 'bi-snow', text: 'Light Snow', bgClass: 'cloudy' },
        73: { icon: 'bi-snow', text: 'Snow', bgClass: 'cloudy' },
        75: { icon: 'bi-snow', text: 'Heavy Snow', bgClass: 'cloudy' },
        
        // Thunderstorm
        95: { icon: 'bi-cloud-lightning-rain', text: 'Thunderstorm', bgClass: 'rainy' },
        96: { icon: 'bi-cloud-lightning-rain', text: 'Thunderstorm', bgClass: 'rainy' },
        99: { icon: 'bi-cloud-lightning-rain', text: 'Thunderstorm', bgClass: 'rainy' }
    };
    
    // Return the mapped values, or default values if code not found
    return weatherMap[weatherCode] || { icon: 'bi-question-circle', text: 'Unknown', bgClass: '' };
}

function updateBackground(weatherClass) {
    document.body.className = ''; // Remove all classes
    if (weatherClass) {
        document.body.classList.add(weatherClass);
    }
}

function showLoading() {
    spinner.style.display = 'inline-block';
    weatherData.style.display = 'none';
    errorMessage.style.display = 'none';
}

function showWeatherData() {
    spinner.style.display = 'none';
    weatherData.style.display = 'block';
    errorMessage.style.display = 'none';
}

function showError(message) {
    spinner.style.display = 'none';
    weatherData.style.display = 'none';
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

async function fetchWeather(lat, lon, locationName) {
    // Show loading state immediately
    showLoading();
    
    try {
        // Build the API URL
        const apiUrl = buildApiUrl(lat, lon);
        console.log('Fetching from:', apiUrl); 
        
        // Fetch data from API
        const response = await fetch(apiUrl);
        
        // Check response
        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        console.log('Weather data:', data);
        
        if (!data.current) {
            throw new Error('No weather data available');
        }
        
        // Extract current weather data
        const currentTemp = Math.round(data.current.temperature_2m);
        const currentHumidity = data.current.relative_humidity_2m;
        const feelsLike = Math.round(data.current.apparent_temperature);
        const weatherCode = data.current.weather_code;
        
        const weatherInfo = getWeatherInfo(weatherCode);
        
        // Update the HTML elements
        locationEl.textContent = locationName;
        tempEl.textContent = `${currentTemp}°F`;
        humidityEl.textContent = `Humidity: ${currentHumidity}%`;
        feelsLikeEl.innerHTML = `<i class="bi bi-thermometer-half me-1"></i>Feels like: ${feelsLike}°F`;
        
        iconEl.className = `bi ${weatherInfo.icon}`;
        conditionEl.textContent = weatherInfo.text;
        
        updateBackground(weatherInfo.bgClass);
        
        showWeatherData();
        
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load weather data. Please try again.');
    }
}

async function getCoordinatesFromCity(cityName) {
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
        
        if (!response.ok) {
            throw new Error('Geocoding API error');
        }
        
        const data = await response.json();
        console.log('Geocoding data:', data); 
        
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            let locationDisplay = result.name;
            if (result.admin1) {
                locationDisplay += `, ${result.admin1}`;
            }
            if (result.country) {
                locationDisplay += `, ${result.country}`;
            }
            
            return {
                lat: result.latitude,
                lon: result.longitude,
                name: locationDisplay
            };
        } else {
            throw new Error('City not found');
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

async function handleCitySearch() {
    const cityName = locationInput.value.trim();
    
    if (!cityName) {
        showError('Please enter a city name');
        return;
    }
    
    // Show loading state
    showLoading();
    
    const coordinates = await getCoordinatesFromCity(cityName);
    
    if (coordinates) {
        currentLat = coordinates.lat;
        currentLon = coordinates.lon;
        currentLocationName = coordinates.name;
        await fetchWeather(currentLat, currentLon, currentLocationName);
    } else {
        showError('City not found. Please try again.');
    }
}

window.addEventListener('load', () => {
    fetchWeather(currentLat, currentLon, currentLocationName);
});

getWeatherBtn.addEventListener('click', handleCitySearch);

locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleCitySearch();
    }
});

// Clear error when user starts typing
locationInput.addEventListener('input', () => {
    errorMessage.style.display = 'none';
});

// Used ChatGPT to fix the spinner bug
// Was stuck in an infinite loading loop when searching cities
// Turns out I needed to call showLoading() BEFORE the API call, not after
// Also added better error handling so it actually shows when something fails