import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { zipCode } = await req.json()

    if (!zipCode) {
      return Response.json({ error: "ZIP code or postal code is required" }, { status: 400 })
    }

    // Check if OpenWeatherMap API key is available
    const apiKey = process.env.OPENWEATHERMAP_API_KEY

    if (!apiKey) {
      // Return mock weather data for demo
      const mockWeatherData = {
        temperature: Math.round(Math.random() * 40 - 10), // Random temp between -10 and 30°F
        snowfall: Math.round(Math.random() * 8 * 2) / 2, // Random snowfall 0-8 inches
        windSpeed: Math.round(Math.random() * 25), // Random wind 0-25 mph
        description: "Light snow",
        humidity: Math.round(Math.random() * 40 + 60), // 60-100%
        visibility: Math.round(Math.random() * 5 + 5), // 5-10 miles
        isDemoData: true,
        location: `Demo Location (${zipCode})`,
      }

      return Response.json({ weather: mockWeatherData })
    }

    // Validate and determine if it's US ZIP code or Canadian postal code
    const cleanZipCode = zipCode.trim().toUpperCase()

    // US ZIP code validation (5 digits, optionally followed by -4 digits)
    const usZipRegex = /^\d{5}(-\d{4})?$/
    // Canadian postal code validation (A1A 1A1 or A1A1A1 format)
    const canadianPostalRegex = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/

    let geoUrl = ""
    let country = ""
    let formattedCode = ""

    if (usZipRegex.test(cleanZipCode)) {
      // US ZIP code
      country = "US"
      formattedCode = cleanZipCode.split("-")[0] // Use only the first 5 digits
      geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${formattedCode},${country}&appid=${apiKey}`
    } else if (canadianPostalRegex.test(cleanZipCode)) {
      // Canadian postal code
      country = "CA"
      formattedCode = cleanZipCode.replace(/\s/g, "") // Remove spaces
      // For Canadian postal codes, we need to use the direct geocoding API
      geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${formattedCode},${country}&limit=1&appid=${apiKey}`
    } else {
      return Response.json(
        {
          error: "Please enter a valid US ZIP code (e.g., 12345) or Canadian postal code (e.g., K1A 0A6)",
        },
        { status: 400 },
      )
    }

    console.log(`Fetching weather for ${country} code: ${formattedCode}`)
    console.log(`Geocoding URL: ${geoUrl}`)

    const geoResponse = await fetch(geoUrl)
    const geoText = await geoResponse.text()

    console.log(`Geocoding response status: ${geoResponse.status}`)
    console.log(`Geocoding response: ${geoText}`)

    if (!geoResponse.ok) {
      if (geoResponse.status === 404) {
        return Response.json(
          {
            error: `${country === "US" ? "ZIP code" : "Postal code"} not found. Please check your ${country === "US" ? "ZIP code" : "postal code"}.`,
          },
          { status: 400 },
        )
      }
      if (geoResponse.status === 401) {
        return Response.json(
          { error: "Invalid API key. Please check your OpenWeatherMap configuration." },
          { status: 500 },
        )
      }
      return Response.json({ error: `Geocoding failed: ${geoText}` }, { status: 500 })
    }

    let geoData
    try {
      geoData = JSON.parse(geoText)
    } catch (parseError) {
      console.error("Failed to parse geocoding response:", parseError)
      return Response.json({ error: "Invalid response from weather service" }, { status: 500 })
    }

    let lat, lon, locationName

    if (country === "US") {
      // US ZIP code response format
      if (!geoData.lat || !geoData.lon) {
        return Response.json({ error: "Unable to find coordinates for this ZIP code" }, { status: 400 })
      }
      lat = geoData.lat
      lon = geoData.lon
      locationName = `${geoData.name || "Unknown"}, ${geoData.country || "US"}`
    } else {
      // Canadian postal code response format (array)
      if (!Array.isArray(geoData) || geoData.length === 0) {
        return Response.json({ error: "Unable to find coordinates for this postal code" }, { status: 400 })
      }
      const location = geoData[0]
      if (!location.lat || !location.lon) {
        return Response.json({ error: "Unable to find coordinates for this postal code" }, { status: 400 })
      }
      lat = location.lat
      lon = location.lon
      locationName = `${location.name || "Unknown"}, ${location.state || location.country || "Canada"}`
    }

    console.log(`Coordinates: ${lat}, ${lon}`)
    console.log(`Location: ${locationName}`)

    // Get current weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
    console.log(`Weather URL: ${weatherUrl}`)

    const weatherResponse = await fetch(weatherUrl)
    const weatherText = await weatherResponse.text()

    console.log(`Weather response status: ${weatherResponse.status}`)
    console.log(`Weather response: ${weatherText.substring(0, 200)}...`)

    if (!weatherResponse.ok) {
      if (weatherResponse.status === 401) {
        return Response.json(
          { error: "Invalid API key. Please check your OpenWeatherMap configuration." },
          { status: 500 },
        )
      }
      return Response.json({ error: `Weather data fetch failed: ${weatherText}` }, { status: 500 })
    }

    let weatherData
    try {
      weatherData = JSON.parse(weatherText)
    } catch (parseError) {
      console.error("Failed to parse weather response:", parseError)
      return Response.json({ error: "Invalid weather data received" }, { status: 500 })
    }

    // Get forecast for snowfall prediction
    let snowfall = 0
    let forecastDescription = ""

    try {
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
      const forecastResponse = await fetch(forecastUrl)

      if (forecastResponse.ok) {
        const forecastText = await forecastResponse.text()
        const forecastData = JSON.parse(forecastText)

        // Calculate expected snowfall in next 24 hours
        const next24Hours = forecastData.list.slice(0, 8) // 8 * 3-hour periods = 24 hours

        // Sum up snow accumulation
        snowfall = next24Hours.reduce((total: number, period: any) => {
          const snow3h = period.snow?.["3h"] || 0
          return total + snow3h
        }, 0)

        // Convert from mm to inches
        snowfall = Math.round((snowfall / 25.4) * 2) / 2

        // Get forecast description for snow conditions
        const snowPeriods = next24Hours.filter(
          (period: any) =>
            period.weather?.[0]?.main?.toLowerCase().includes("snow") ||
            period.weather?.[0]?.description?.toLowerCase().includes("snow"),
        )

        if (snowPeriods.length > 0) {
          forecastDescription = snowPeriods[0].weather[0].description
        }
      }
    } catch (forecastError) {
      console.warn("Failed to fetch forecast data:", forecastError)
      // Continue without forecast data
    }

    // Determine current conditions and expected snow
    const currentCondition = weatherData.weather?.[0]?.main?.toLowerCase() || ""
    const currentDescription = weatherData.weather?.[0]?.description || "Unknown"

    // If current conditions don't show snow but forecast does, use forecast
    let finalDescription = currentDescription
    if (!currentCondition.includes("snow") && forecastDescription) {
      finalDescription = `${currentDescription} (${forecastDescription} expected)`
    }

    // Adjust snowfall based on current conditions if no forecast snow
    if (snowfall === 0 && currentCondition.includes("snow")) {
      // Estimate snowfall based on current snow conditions
      if (currentDescription.includes("heavy")) {
        snowfall = 2 + Math.random() * 4 // 2-6 inches
      } else if (currentDescription.includes("light")) {
        snowfall = 0.5 + Math.random() * 1.5 // 0.5-2 inches
      } else {
        snowfall = 1 + Math.random() * 2 // 1-3 inches
      }
      snowfall = Math.round(snowfall * 2) / 2
    }

    const weather = {
      temperature: Math.round(weatherData.main?.temp || 32),
      snowfall: snowfall,
      windSpeed: Math.round(weatherData.wind?.speed || 0),
      description: finalDescription,
      humidity: weatherData.main?.humidity || 50,
      visibility: weatherData.visibility ? Math.round(weatherData.visibility / 1609.34) : 10, // Convert m to miles
      pressure: weatherData.main?.pressure || 1013,
      feelsLike: Math.round(weatherData.main?.feels_like || weatherData.main?.temp || 32),
      isDemoData: false,
      location: locationName,
      country: country,
    }

    console.log("Final weather data:", weather)

    return Response.json({ weather })
  } catch (error) {
    console.error("Weather API Error:", error)

    // Return mock data as fallback
    const fallbackWeatherData = {
      temperature: 28,
      snowfall: 3,
      windSpeed: 12,
      description: "Snow (Demo Data)",
      humidity: 85,
      visibility: 8,
      pressure: 1013,
      feelsLike: 25,
      isDemoData: true,
      location: `Demo Location (${req.body?.zipCode || "Unknown"})`,
      country: "US",
    }

    return Response.json({
      weather: fallbackWeatherData,
      warning: "Using demo data due to API error",
    })
  }
}
