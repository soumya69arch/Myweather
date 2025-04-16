let cityinput = document.getElementById('city_input'),
    searchbtn = document.getElementById('searchbtn'),
    api_key = 'EKu5rVUEFmXOkDJf1LPEYArwL2dijU5c';

let isDay = true;

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const weatherEmojis = {
    clear: "☀️",
    clearnight: "🌑",
    cloudy: "☁️",
    cloudynight: "☁️",
    rain: "🌧️",
    rainnight: "🌧️",
    snow: "❄️",
    snownight: "❄️",
    fog: "🌫️",
    fognight: "🌫️",
    thunderstorm: "⛈️",
    thunderstormnight: "⛈️",
    default: "🌤"
};

window.onload = function () {
    const video = document.getElementById('background-video');
    const source = video.querySelector('source');
    source.src = 'videos/default.mp4';
    video.load();
    video.play().catch(err => console.warn('Video play error:', err));
};

const weatherBackgrounds = {
    clear: 'videos/clear.mp4',
    clearnight: 'videos/clearnight.mp4',
    cloudy: 'videos/cloudy.mp4',
    cloudynight: 'videos/cloudynight.mp4',
    rain: 'videos/rain.mp4',
    rainnight: 'videos/rainnight.mp4',
    snow: 'videos/snow.mp4',
    snownight: 'videos/snownight.mp4',
    fog: 'videos/fog.mp4',
    fognight: 'videos/fognight.mp4',
    thunderstorm: 'videos/storm.mp4',
    thunderstormnight: 'videos/stormnight.mp4',
    default: 'videos/default.mp4',
    defaultnight: 'videos/night.mp4'
};

function getWeatherConditionFromCode(code) {
    if ([1000].includes(code)) return 'clear';
    if ([1001, 1100, 1101].includes(code)) return 'cloudy';
    if ([4000, 4001, 4200, 4201].includes(code)) return 'rain';
    if ([5000, 5001, 5100, 5101].includes(code)) return 'snow';
    if ([2000, 2100].includes(code)) return 'fog';
    if ([8000].includes(code)) return 'thunderstorm';
    return 'default';
}

function updateBackgroundVideo(condition) {
    const video = document.getElementById('background-video');
    const source = video.querySelector('source');
    const videoKey = isDay ? condition : condition + 'night';
    const videoSrc = weatherBackgrounds[videoKey] || (isDay ? weatherBackgrounds.default : weatherBackgrounds.defaultnight);
    if (!source.src.includes(videoSrc)) {
        source.src = videoSrc;
        video.load();
        video.play().catch(err => console.warn("Video play error:", err));
    }
}

function getCityCoordinates(e) {
    e?.preventDefault();
    let cityName = cityinput.value.trim();
    if (!cityName) return;
    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=87e24c16031e43e60b41107eb3c88e95`;
    fetch(GEOCODING_API_URL)
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) {
                alert(`No coordinates found for "${cityName}"`);
                return;
            }
            const { name, lat, lon, country } = data[0];
            getWeatherDetails(name, lat, lon, country);
        })
        .catch(() => alert(`Failed to fetch coordinates for "${cityName}"`));
    cityinput.value = '';
}

function detectUserLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        return;
    }
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const REVERSE_GEOCODE_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=87e24c16031e43e60b41107eb3c88e95`;
            fetch(REVERSE_GEOCODE_URL)
                .then(res => res.json())
                .then(data => {
                    if (!data.length) throw new Error("No city found");
                    const { name, country } = data[0];
                    getWeatherDetails(name, latitude, longitude, country);
                })
                .catch(err => {
                    console.error(err);
                    alert("Error detecting city from coordinates.");
                });
        },
        error => {
            console.error(error);
            alert("Location access denied. Use the search bar.");
        }
    );
}

function getWeatherDetails(name, lat, lon, country) {
    const TOMORROW_API = `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lon}&apikey=${api_key}`;
    const OPENWEATHER_API_KEY = '87e24c16031e43e60b41107eb3c88e95';
    const OPENWEATHER_AQI_API = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;

    fetch(TOMORROW_API)
        .then(res => {
            if (!res.ok) throw new Error("Weather fetch failed");
            return res.json();
        })
        .then(data => {
            const currentDate = new Date();
            const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
            const current = data.timelines.daily[0].values;

            const temp = current.temperatureAvg;
            const feelsLike = current.temperatureApparentAvg;
            const weatherCode = current.weatherCodeMax;

            const condition = getWeatherConditionFromCode(weatherCode);
            const emoji = weatherEmojis[condition] || weatherEmojis.default;
            const conditionText = condition.charAt(0).toUpperCase() + condition.slice(1);

            const sunrise = new Date(current.sunriseTime);
            const sunset = new Date(current.sunsetTime);
            const now = new Date();
            isDay = now >= sunrise && now < sunset;
            const timeOfDayText = isDay ? "Day" : "Night";

            updateBackgroundVideo(condition);

            document.querySelector('.main.container').innerHTML = 
                `<div class="weather-panel text-center p-4">
                    <h2>${name}, ${country}</h2>
                    <p>${days[currentDate.getDay()]}, ${formattedDate}</p>
                    <p class="fs-4">Condition: <span style="font-size: 1.5rem; vertical-align: middle;">${emoji}</span> <strong>${conditionText}</strong></p>
                    <p>Time: <strong>${timeOfDayText}</strong></p>
                    <div class="temperature display-4">${temp.toFixed(1)}°C</div>
                    <small>Feels like ${feelsLike.toFixed(1)}°C</small>
                    <div id="aqi" class="mt-2">AQI: Loading...</div>
                    <div class="forecast mt-4">
                        <div class="forecast-container d-flex justify-content-around flex-wrap"></div>
                    </div>
                </div>`;

            renderForecast(data.timelines.daily);

        // AQI FETCH with PM2.5-based estimation
fetch(OPENWEATHER_AQI_API)
.then(res => res.json())
.then(aqiData => {
    const pm25 = aqiData?.list?.[0]?.components?.pm2_5;
    const aqiElement = document.getElementById('aqi');

    if (pm25 !== undefined) {
        const aqi = calculateAQIFromPM25(pm25); // approximate AQI value
        const info = getAQICategory(aqi);
        aqiElement.innerHTML = `
        <div class="mt-2">
            <span class="badge ${info.color} p-2"><h6.5>AQI:<h6.5> ${aqi} - ${info.level}</span>
            <div class="small mt-1 ${info.glow ? 'glow-text' : ''}">${info.message}</div>
        </div>`;
    
    
    } else {
        aqiElement.innerText = "AQI data not available";
    }
})
.catch(() => {
    document.getElementById('aqi').innerText = "AQI data not available";
});

        })
        .catch(err => {
            console.error(err);
            alert('❌ Failed to fetch weather from Tomorrow.io');
        });
}

function renderForecast(dailyData) {
    const forecastContainer = document.querySelector('.forecast-container');
    const detailedForecast = document.getElementById('forecastCards');

    forecastContainer.innerHTML = '';
    if (detailedForecast) detailedForecast.innerHTML = '';

    dailyData.slice(1, 8).forEach(day => {
        let date = new Date(day.time);
        let dayName = days[date.getDay()];
        let minTemp = day.values.temperatureMin.toFixed(0);
        let maxTemp = day.values.temperatureMax.toFixed(0);

        let conditionCode = day.values.weatherCode;
        let condition = getWeatherConditionFromCode(conditionCode);
        let emoji = weatherEmojis[condition] || weatherEmojis.default;

        forecastContainer.innerHTML += 
            `<div class="forecast-card p-2 text-center border rounded m-1">
                <strong>${dayName}</strong><br>
                <span style="font-size: 30px;">${emoji}</span><br>
                <span>${minTemp}° / ${maxTemp}°</span>
            </div>`;

        if (detailedForecast) {
            detailedForecast.innerHTML += 
                `<div class="col">
                    <div class="card bg-light bg-opacity-75 text-dark h-100">
                        <div class="card-body text-center">
                            <h5 class="card-title">${dayName}</h5>
                            <p class="card-text fs-2">${emoji}</p>
                            <p class="card-text">High: ${maxTemp}°C</p>
                            <p class="card-text">Low: ${minTemp}°C</p>
                            <p class="card-text">Humidity: ${day.values.humidityAvg}%</p>
                            <p class="card-text">Wind: ${day.values.windSpeedAvg} km/h</p>
                        </div>
                    </div>
                </div>`;
        }
    });
}
function calculateAQIFromPM25(pm25) {
    const breakpoints = [
        { c_low: 0.0, c_high: 12.0, aqi_low: 0, aqi_high: 50 },
        { c_low: 12.1, c_high: 35.4, aqi_low: 51, aqi_high: 100 },
        { c_low: 35.5, c_high: 55.4, aqi_low: 101, aqi_high: 150 },
        { c_low: 55.5, c_high: 150.4, aqi_low: 151, aqi_high: 200 },
        { c_low: 150.5, c_high: 250.4, aqi_low: 201, aqi_high: 300 },
        { c_low: 250.5, c_high: 350.4, aqi_low: 301, aqi_high: 400 },
        { c_low: 350.5, c_high: 500.4, aqi_low: 401, aqi_high: 500 }
    ];

    for (const breakpoint of breakpoints) {
        if (pm25 >= breakpoint.c_low && pm25 <= breakpoint.c_high) {
            const aqi = ((pm25 - breakpoint.c_low) / (breakpoint.c_high - breakpoint.c_low)) * (breakpoint.aqi_high - breakpoint.aqi_low) + breakpoint.aqi_low;
            return Math.round(aqi);
        }
    }
    return 0;
}
function getAQICategory(aqi) {
    if (aqi <= 50) return {
        level: 'Good',
        color: 'bg-success',
        message: 'Air quality is considered satisfactory.',
        glowClass: 'glow-good'
    };
    if (aqi <= 100) return {
        level: 'Moderate',
        color: 'bg-warning',
        message: 'Air quality is acceptable; however, there may be a moderate health concern for a very small number of people.',
        glowClass: 'glow-moderate'
    };
    if (aqi <= 150) return {
        level: 'Unhealthy for Sensitive Groups',
        color: 'bg-warning',
        message: 'Members of sensitive groups may experience health effects.',
        glowClass: 'glow-unhealthy'
    };
    if (aqi <= 200) return {
        level: 'Unhealthy',
        color: 'bg-danger',
        message: 'Everyone may begin to experience health effects.',
        glowClass: 'glow-unhealthy'
    };
    if (aqi <= 300) return {
        level: 'Very Unhealthy',
        color: 'bg-danger',
        message: 'Health alert: everyone may experience more serious health effects.',
        glowClass: 'glow-very-unhealthy'
    };
    return {
        level: 'Hazardous',
        color: 'bg-danger',
        message: 'Health warning of emergency conditions. The entire population is more likely to be affected.',
        glowClass: 'glow-hazardous'
    };
}




searchbtn.addEventListener('click', getCityCoordinates);
window.addEventListener('load', detectUserLocation);

document.addEventListener('DOMContentLoaded', () => {
    const forecastLink = document.getElementById('forecastLink');
    forecastLink?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('detailed-forecast')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const forecastLinkAlt = document.getElementById('forecast-link');
    forecastLinkAlt?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('forecast-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
 
