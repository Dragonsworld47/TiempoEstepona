const apiKey = "619357616931b4b8ba345b330aa4befe";
const city = "Estepona";
const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=es`;

// Map OpenWeatherMap icon codes to Weather Icons classes
function getWeatherIconClass(owmIcon) {
  const map = {
    "01d": "wi-day-sunny",
    "01n": "wi-night-clear",
    "02d": "wi-day-cloudy",
    "02n": "wi-night-alt-cloudy",
    "03d": "wi-cloud",
    "03n": "wi-cloud",
    "04d": "wi-cloudy",
    "04n": "wi-cloudy",
    "09d": "wi-showers",
    "09n": "wi-showers",
    "10d": "wi-day-rain",
    "10n": "wi-night-alt-rain",
    "11d": "wi-thunderstorm",
    "11n": "wi-thunderstorm",
    "13d": "wi-snow",
    "13n": "wi-snow",
    "50d": "wi-fog",
    "50n": "wi-fog"
  };
  return map[owmIcon] || "wi-na";
}

function pad2(num) {
  return num < 10 ? '0' + num : num;
}

async function fetchWeather() {
  const response = await fetch(apiUrl);
  const data = await response.json();

  // Current weather
  document.getElementById("city-name").textContent = data.city.name;
  const current = data.list[0];
  const currentIconClass = getWeatherIconClass(current.weather[0].icon);
  document.getElementById("current-weather").innerHTML = `
    <div class="weather-card">
      <i class="weather-icon wi ${currentIconClass}"></i>
      <h3>${new Date(current.dt * 1000).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</h3>
      <div class="temp-box">${Math.round(current.main.temp)}°C</div>
      <div>${current.weather[0].description}</div>
    </div>
  `;

  // Get today, tomorrow, and day after tomorrow (local time in Estepona)
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60000; // in ms
  const localNow = new Date(now.getTime() - timezoneOffsetMs); // approximate Estepona local time
  const baseDate = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  const dayTimestamps = [
    baseDate.getTime(),
    baseDate.getTime() + 86400000,
    baseDate.getTime() + 2*86400000
  ];

  // Format for comparison: 'YYYY-MM-DD'
  function dateString(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  }
  const dayStrings = dayTimestamps.map(ts => dateString(new Date(ts)));

  // Group forecast hours by date string
  const daysMap = {};
  data.list.forEach(hour => {
    const localDate = new Date(hour.dt * 1000 - timezoneOffsetMs);
    const key = dateString(localDate);
    if (!daysMap[key]) daysMap[key] = [];
    daysMap[key].push(hour);
  });

  // Show today/tomorrow/day after, even if not "full" days
  let hourlyHtml = "";
  for (let i = 0; i < dayStrings.length; i++) {
    const key = dayStrings[i];
    const hours = daysMap[key];
    if (hours && hours.length > 0) {
      // Use a nice date label for heading
      const labelDate = new Date(dayTimestamps[i]);
      const labelStr = labelDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      hourlyHtml += `<div class="hourly-day-label">${labelStr.charAt(0).toUpperCase() + labelStr.slice(1)}</div>`;
      hourlyHtml += `<div class="hourly-day-group">`;
      hours.forEach(hour => {
        const hourIconClass = getWeatherIconClass(hour.weather[0].icon);
        const dateObj = new Date(hour.dt * 1000 - timezoneOffsetMs);
        hourlyHtml += `
          <div class="weather-card">
            <i class="weather-icon wi ${hourIconClass}"></i>
            <h4>${dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</h4>
            <div class="temp-box">${Math.round(hour.main.temp)}°C</div>
            <div>${hour.weather[0].description}</div>
          </div>
        `;
      });
      hourlyHtml += `</div>`;
    }
  }
  document.getElementById("hourly-forecast").innerHTML = hourlyHtml;

  // Daily forecast for just those days (first hourly slot as the day's summary)
  let dailyHtml = "";
  for (let i = 0; i < dayStrings.length; i++) {
    const key = dayStrings[i];
    const hours = daysMap[key];
    if (hours && hours.length > 0) {
      const day = hours[0];
      const dayIconClass = getWeatherIconClass(day.weather[0].icon);
      const labelDate = new Date(dayTimestamps[i]);
      dailyHtml += `
        <div class="weather-card">
          <i class="weather-icon wi ${dayIconClass}"></i>
          <h4>${labelDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
          <div class="temp-box">${Math.round(day.main.temp)}°C</div>
          <div>${day.weather[0].description}</div>
        </div>
      `;
    }
  }
  document.getElementById("daily-forecast").innerHTML = dailyHtml;
}

fetchWeather();