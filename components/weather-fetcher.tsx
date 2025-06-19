"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Cloud,
  Loader2,
  RefreshCw,
  AlertCircle,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
  MapPin,
  Gauge,
} from "lucide-react"

interface WeatherData {
  temperature: number
  snowfall: number
  windSpeed: number
  description: string
  humidity: number
  visibility: number
  pressure?: number
  feelsLike?: number
  isDemoData: boolean
  location?: string
  country?: string
}

interface WeatherFetcherProps {
  zipCode: string
  onWeatherFetched: (weather: WeatherData) => void
}

export function WeatherFetcher({ zipCode, onWeatherFetched }: WeatherFetcherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [warning, setWarning] = useState<string>("")

  const fetchWeather = async () => {
    if (!zipCode) return

    setIsLoading(true)
    setError("")
    setWarning("")

    try {
      const response = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipCode }),
      })

      const data = await response.json()

      if (response.ok && data.weather) {
        setWeather(data.weather)
        onWeatherFetched(data.weather)

        if (data.warning) {
          setWarning(data.warning)
        }
      } else {
        setError(data.error || "Failed to fetch weather data")
      }
    } catch (error) {
      console.error("Weather fetch failed:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg mb-6">
      {/* Weather Fetch Button */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <Cloud className="h-5 w-5 text-blue-400" />
          <div>
            <h3 className="text-white font-semibold">Current Weather Conditions</h3>
            <p className="text-blue-200 text-sm">Get real-time weather data for your location</p>
          </div>
        </div>

        <Button
          onClick={fetchWeather}
          disabled={!zipCode || isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching Weather Data...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Get Current Weather
            </>
          )}
        </Button>

        {error && (
          <div className="flex items-center gap-2 p-3 mt-3 bg-red-500/20 border border-red-400/30 rounded-2xl text-red-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {warning && (
          <div className="flex items-center gap-2 p-3 mt-3 bg-yellow-500/20 border border-yellow-400/30 rounded-2xl text-yellow-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{warning}</span>
          </div>
        )}

        {weather && (
          <div className="mt-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-2xl border border-blue-400/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-blue-200">Weather Data</h4>
                {weather.location && (
                  <div className="flex items-center gap-1 text-xs text-blue-300">
                    <MapPin className="h-3 w-3" />
                    <span>{weather.location}</span>
                  </div>
                )}
              </div>
              {weather.isDemoData && (
                <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-300 border-yellow-400/30">
                  Demo Data
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Thermometer className="h-4 w-4 text-red-400 mr-1" />
                </div>
                <div className="text-2xl font-bold text-blue-300">{weather.temperature}°F</div>
                <div className="text-xs text-blue-200">Temperature</div>
                {weather.feelsLike && weather.feelsLike !== weather.temperature && (
                  <div className="text-xs text-blue-300">Feels {weather.feelsLike}°F</div>
                )}
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Cloud className="h-4 w-4 text-gray-400 mr-1" />
                </div>
                <div className="text-2xl font-bold text-blue-300">{weather.snowfall}"</div>
                <div className="text-xs text-blue-200">Expected Snow</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Wind className="h-4 w-4 text-green-400 mr-1" />
                </div>
                <div className="text-2xl font-bold text-blue-300">{weather.windSpeed} mph</div>
                <div className="text-xs text-blue-200">Wind Speed</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Droplets className="h-4 w-4 text-blue-400 mr-1" />
                </div>
                <div className="text-2xl font-bold text-blue-300">{weather.humidity}%</div>
                <div className="text-xs text-blue-200">Humidity</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-400/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-200">Conditions:</span>
                <span className="font-medium capitalize text-blue-100">{weather.description}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-200">Visibility:</span>
                <span className="font-medium text-blue-100">{weather.visibility} miles</span>
              </div>
              {weather.pressure && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200 flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    Pressure:
                  </span>
                  <span className="font-medium text-blue-100">{weather.pressure} hPa</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-200">Country:</span>
                <span className="font-medium text-blue-100">
                  {weather.country === "CA" ? "🇨🇦 Canada" : "🇺🇸 United States"}
                </span>
              </div>
            </div>

            {weather.isDemoData && (
              <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-400/30 rounded text-xs text-yellow-200">
                <strong>Demo Mode:</strong> Configure OPENWEATHERMAP_API_KEY for real weather data
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
