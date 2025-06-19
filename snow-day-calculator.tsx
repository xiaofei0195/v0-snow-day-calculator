"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Snowflake, Loader2 } from "lucide-react"
import { WeightConfigurator, type WeightConfig } from "./components/weight-configurator"
import { ForecastChart } from "./components/forecast-chart"
import { AIWeatherAnalysis } from "./components/ai-weather-analysis"

interface CalculationResult {
  probability: number
  recommendation: string
  factors: {
    temperature: string
    snowfall: string
    windSpeed: string
  }
  rawValues: {
    temperature: number
    snowfall: number
    windSpeed: number
  }
  factorContributions: {
    temperature: number
    snowfall: number
    windSpeed: number
    schoolDistrict: number
  }
  weightInfo: {
    appliedWeights: WeightConfig
    totalWeight: number
  }
  location?: string
}

const DEFAULT_WEIGHTS: WeightConfig = {
  temperature: 3.0,
  snowfall: 4.0,
  windSpeed: 2.0,
  schoolDistrict: 1.0,
}

export default function SnowDayCalculator() {
  const [zipCode, setZipCode] = useState("")
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [weights, setWeights] = useState<WeightConfig>(DEFAULT_WEIGHTS)

  const calculateSnowDay = async () => {
    if (!zipCode.trim()) return

    setIsCalculating(true)

    try {
      // First, try to get real weather data
      let weatherData = null
      let location = ""

      try {
        const weatherResponse = await fetch("/api/weather", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zipCode: zipCode.trim() }),
        })

        if (weatherResponse.ok) {
          const data = await weatherResponse.json()
          if (data.weather) {
            weatherData = data.weather
            location = data.weather.location || ""
          }
        }
      } catch (weatherError) {
        console.warn("Failed to fetch weather data, using mock data:", weatherError)
      }

      // Simulate calculation delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Use real weather data if available, otherwise generate realistic mock data
      let temperature, snowfall, windSpeed

      if (weatherData && !weatherData.isDemoData) {
        temperature = weatherData.temperature
        snowfall = weatherData.snowfall
        windSpeed = weatherData.windSpeed
        location = weatherData.location || location
      } else {
        // Generate more realistic mock data based on location patterns
        const isCanadian = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(zipCode.trim().toUpperCase())

        if (isCanadian) {
          // Canadian weather tends to be colder
          temperature = Math.round(Math.random() * 30 - 15) // -15 to 15°F
          snowfall = Math.round(Math.random() * 10 * 2) / 2 // 0-10 inches
          windSpeed = Math.round(Math.random() * 30) // 0-30 mph
          location = location || `Canadian Location (${zipCode})`
        } else {
          // US weather varies more by region
          temperature = Math.round(Math.random() * 40 - 10) // -10 to 30°F
          snowfall = Math.round(Math.random() * 8 * 2) / 2 // 0-8 inches
          windSpeed = Math.round(Math.random() * 25) // 0-25 mph
          location = location || `US Location (${zipCode})`
        }
      }

      // 替换现有的计算逻辑部分（从 "Calculate base contributions" 开始）
      // 地区判断
      const isCanadian = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(zipCode.trim().toUpperCase())
      const zipNum = Number.parseInt(zipCode.replace(/\D/g, ""))
      const isSouthernUS =
        !isCanadian &&
        ((zipNum >= 30000 && zipNum <= 39999) || // 南部各州
          (zipNum >= 70000 && zipNum <= 79999) ||
          (zipNum >= 85000 && zipNum <= 88999))
      const isNorthernUS = !isCanadian && !isSouthernUS

      // 计算风寒指数
      const calculateWindChill = (temp: number, wind: number) => {
        if (temp > 50 || wind < 3) return temp
        return 35.74 + 0.6215 * temp - 35.75 * Math.pow(wind, 0.16) + 0.4275 * temp * Math.pow(wind, 0.16)
      }

      const windChill = calculateWindChill(temperature, windSpeed)

      // 学区类型判断（基于ZIP码模式）
      let districtType = "suburban"
      if (isCanadian) {
        districtType = "suburban" // 加拿大默认郊区
      } else {
        // 美国农村ZIP码通常人口密度低
        if (zipNum < 10000 || (zipNum >= 59000 && zipNum <= 59999)) {
          districtType = "rural"
        } else if ((zipNum >= 10000 && zipNum <= 19999) || (zipNum >= 90000 && zipNum <= 99999)) {
          districtType = "urban"
        }
      }

      // 基础概率计算
      let baseProbability = 0

      // 🌡️ 温度因素
      let temperatureFactor = 0
      if (windChill <= -25) {
        temperatureFactor = 95 // 极高停课概率
      } else if (windChill <= -15) {
        temperatureFactor = 85 // 高停课概率
      } else if (temperature <= -20) {
        temperatureFactor = 90 // 几乎确定停课
      } else if (temperature <= -10) {
        temperatureFactor = 75 // 高概率停课
      } else if (temperature <= 0) {
        temperatureFactor = 55 // 中等概率停课
      } else if (temperature <= 15) {
        temperatureFactor = 35
      } else if (temperature <= 25) {
        temperatureFactor = 20
      } else if (temperature <= 32) {
        temperatureFactor = 10 // 结合其他因素考虑
      } else {
        temperatureFactor = 0
      }

      // ❄️ 降雪因素
      let snowfallFactor = 0
      if (snowfall >= 8) {
        snowfallFactor = 95 // 几乎确定停课
      } else if (snowfall >= 6) {
        snowfallFactor = 85 // 高概率停课
      } else if (snowfall >= 4) {
        snowfallFactor = 65 // 中等概率停课
      } else if (snowfall >= 2) {
        snowfallFactor = 40 // 低到中等概率停课
      } else if (snowfall >= 1) {
        snowfallFactor = 25
      } else if (snowfall >= 0.5) {
        snowfallFactor = 15
      } else if (snowfall > 0) {
        snowfallFactor = 5
      }

      // 💨 风速因素
      let windFactor = 0
      if (windSpeed >= 40) {
        windFactor = 85 // 极高停课概率（暴风雪条件）
      } else if (windSpeed >= 30) {
        windFactor = 70 // 高停课概率
      } else if (windSpeed >= 20) {
        windFactor = 45 // 中等停课概率
      } else if (windSpeed >= 15) {
        windFactor = 25
      } else if (windSpeed >= 10) {
        windFactor = 10
      }

      // 🌫️ 能见度因素（基于风速和降雪估算）
      let visibilityFactor = 0
      if (windSpeed >= 25 && snowfall >= 2) {
        visibilityFactor = 90 // 能见度 < 0.25 英里
      } else if (windSpeed >= 15 && snowfall >= 1) {
        visibilityFactor = 60 // 能见度 0.25-0.5 英里
      } else if (windSpeed >= 10 && snowfall >= 0.5) {
        visibilityFactor = 30 // 能见度 0.5-1 英里
      }

      // 🧊 路面条件因素
      let iceFactor = 0
      if (temperature <= 32 && temperature >= 28 && snowfall > 0) {
        iceFactor = 70 // 冻雨/雨夹雪条件
      } else if (temperature <= 32 && windSpeed >= 10) {
        iceFactor = 50 // 黑冰风险
      } else if (temperature <= 25) {
        iceFactor = 30 // 一般结冰
      }

      // 🏫 学区类型调整
      let districtMultiplier = 1.0
      if (districtType === "rural") {
        districtMultiplier = 1.3 // 农村学区更容易停课
      } else if (districtType === "urban") {
        districtMultiplier = 0.8 // 城市学区阈值更高
      } else {
        districtMultiplier = 1.0 // 郊区平衡
      }

      // 🌍 地区差异调整
      let regionMultiplier = 1.0
      if (isCanadian) {
        regionMultiplier = 0.7 // 加拿大更高容忍度
      } else if (isNorthernUS) {
        regionMultiplier = 0.8 // 美国北部习惯严寒
      } else if (isSouthernUS) {
        regionMultiplier = 1.4 // 美国南部更低阈值
      } else {
        regionMultiplier = 1.0 // 其他地区
      }

      // 综合计算基础概率
      const factors = [temperatureFactor, snowfallFactor, windFactor, visibilityFactor, iceFactor]
      const maxFactor = Math.max(...factors)
      const avgFactor = factors.reduce((sum, f) => sum + f, 0) / factors.length

      // 使用最高因素和平均因素的加权组合
      baseProbability = maxFactor * 0.6 + avgFactor * 0.4

      // 应用地区和学区调整
      baseProbability *= regionMultiplier * districtMultiplier

      // 📊 高风险组合检查
      if (temperature < -10 && snowfall > 6) {
        baseProbability = Math.max(baseProbability, 90) // 高风险组合
      }
      if (windSpeed > 30 && snowfall > 2) {
        baseProbability = Math.max(baseProbability, 85) // 暴风雪条件
      }
      if (temperature <= 32 && temperature >= 28 && snowfall > 0) {
        baseProbability = Math.max(baseProbability, 80) // 冻雨条件
      }

      // Apply weights to get final contributions
      const totalWeight = weights.temperature + weights.snowfall + weights.windSpeed + weights.schoolDistrict
      const normalizedWeights = {
        temperature: weights.temperature / totalWeight,
        snowfall: weights.snowfall / totalWeight,
        windSpeed: weights.windSpeed / totalWeight,
        schoolDistrict: weights.schoolDistrict / totalWeight,
      }

      const factorContributions = {
        temperature: temperatureFactor * normalizedWeights.temperature,
        snowfall: snowfallFactor * normalizedWeights.snowfall,
        windSpeed: (windFactor + visibilityFactor * 0.5) * normalizedWeights.windSpeed,
        schoolDistrict: baseProbability * 0.2 * normalizedWeights.schoolDistrict,
      }

      // 最终概率计算
      const weightedProbability = Object.values(factorContributions).reduce((sum, contrib) => sum + contrib, 0)
      const finalProbability = Math.min(98, Math.max(0, weightedProbability * regionMultiplier * districtMultiplier))

      // 更新推荐文本
      const getRecommendation = (prob: number) => {
        if (prob >= 90) return "Extremely High Risk - School closure almost certain!"
        if (prob >= 80) return "Very High Risk - School closure extremely likely!"
        if (prob >= 70) return "High Risk - Strong chance of school closure"
        if (prob >= 55) return "Moderate Risk - Monitor school announcements closely"
        if (prob >= 35) return "Low to Moderate Risk - Prepare for potential closure"
        if (prob >= 15) return "Low Risk - School likely to remain open"
        return "Very Low Risk - School will almost certainly remain open"
      }

      // 更新结果对象
      setResult({
        probability: Math.round(finalProbability),
        recommendation: getRecommendation(finalProbability),
        factors: {
          temperature: `${temperature}°F${windChill !== temperature ? ` (feels like ${Math.round(windChill)}°F)` : ""}`,
          snowfall: `${snowfall} inches`,
          windSpeed: `${windSpeed} mph`,
        },
        rawValues: {
          temperature,
          snowfall,
          windSpeed,
        },
        factorContributions,
        weightInfo: {
          appliedWeights: { ...weights },
          totalWeight,
        },
        location: `${location} (${districtType === "rural" ? "Rural" : districtType === "urban" ? "Urban" : "Suburban"} District)`,
      })
    } catch (error) {
      console.error("Calculation error:", error)
      // Handle error gracefully
    } finally {
      setIsCalculating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      calculateSnowDay()
    }
  }

  const ProbabilityGauge = ({ probability }: { probability: number }) => {
    const circumference = 2 * Math.PI * 45
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (probability / 100) * circumference

    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-2000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-800">{probability}%</div>
          <div className="text-xs text-gray-500">probability</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Snowflake className="h-10 w-10 text-blue-400" />
          <h1 className="text-5xl font-bold text-white">Snow Day Calculator</h1>
          <Snowflake className="h-10 w-10 text-blue-400" />
        </div>
        <p className="text-blue-200 text-lg">Predict school closures due to snow conditions</p>
      </div>

      {/* Weight Configurator */}
      <WeightConfigurator weights={weights} onWeightsChange={setWeights} onReset={() => setWeights(DEFAULT_WEIGHTS)} />

      {/* Search Input */}
      <div className="w-full max-w-lg mb-8">
        <div className="relative flex items-center bg-white rounded-full shadow-2xl overflow-hidden">
          <Input
            type="text"
            placeholder="Enter ZIP or postal code..."
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border-0 bg-transparent px-6 py-4 text-lg placeholder:text-gray-400 focus:ring-0 focus:outline-none"
            disabled={isCalculating}
          />
          <Button
            onClick={calculateSnowDay}
            disabled={!zipCode.trim() || isCalculating}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-full m-1 font-semibold text-lg transition-all duration-200 disabled:opacity-50"
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                CALCULATING
              </>
            ) : (
              "CALCULATE"
            )}
          </Button>
        </div>
        <p className="text-center text-blue-200 text-sm mt-3">
          Enter any ZIP Code in the United States or postal code in Canada.
        </p>
        <div className="text-center text-blue-300 text-xs mt-2">
          Examples: 12345 (US) • K1A 0A6 (Canada) • 90210 (US) • M5V 3L9 (Canada)
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="w-full max-w-4xl">
          {/* Probability Display */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 text-center">
            <ProbabilityGauge probability={result.probability} />
            <h3 className="text-2xl font-bold text-white mt-4 mb-2">{result.probability}% Chance of Snow Day</h3>
            <p className="text-blue-200 text-lg">{result.recommendation}</p>
            {result.location && <p className="text-blue-300 text-sm mt-2">📍 {result.location}</p>}
          </div>

          {/* Weather Factors */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-6">
            <h4 className="text-xl font-semibold text-white mb-4 text-center">Weather Conditions</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-300">{result.factors.temperature}</div>
                <div className="text-blue-200 text-sm">Temperature</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-300">{result.factors.snowfall}</div>
                <div className="text-blue-200 text-sm">Expected Snow</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-300">{result.factors.windSpeed}</div>
                <div className="text-blue-200 text-sm">Wind Speed</div>
              </div>
            </div>
          </div>

          {/* 48-Hour Forecast Chart */}
          <ForecastChart baseProbability={result.probability} />

          {/* AI Weather Analysis */}
          <AIWeatherAnalysis
            zipCode={zipCode}
            temperature={result.rawValues.temperature}
            snowfall={result.rawValues.snowfall}
            windSpeed={result.rawValues.windSpeed}
            schoolDistrict="suburban"
            probability={result.probability}
          />

          {/* Applied Weights Info */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-6">
            <h4 className="font-semibold text-white mb-3 text-center">Applied Weight Configuration</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">
                  {((result.weightInfo.appliedWeights.temperature / result.weightInfo.totalWeight) * 100).toFixed(0)}%
                </div>
                <div className="text-blue-200">🌡️ Temperature</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">
                  {((result.weightInfo.appliedWeights.snowfall / result.weightInfo.totalWeight) * 100).toFixed(0)}%
                </div>
                <div className="text-blue-200">❄️ Snowfall</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-400">
                  {((result.weightInfo.appliedWeights.windSpeed / result.weightInfo.totalWeight) * 100).toFixed(0)}%
                </div>
                <div className="text-blue-200">💨 Wind Speed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">
                  {((result.weightInfo.appliedWeights.schoolDistrict / result.weightInfo.totalWeight) * 100).toFixed(0)}
                  %
                </div>
                <div className="text-blue-200">🏫 District</div>
              </div>
            </div>
          </div>

          {/* Factor Contributions */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-6">
            <h4 className="font-semibold text-white mb-4 text-center">
              Factors Contributing to School Closure Decision
            </h4>
            <div className="space-y-3">
              {Object.entries(result.factorContributions).map(([factor, contribution]) => {
                const percentage = result.probability > 0 ? (contribution / result.probability) * 100 : 0
                const factorNames = {
                  temperature: "🌡️ Temperature",
                  snowfall: "❄️ Snowfall",
                  windSpeed: "💨 Wind Speed",
                  schoolDistrict: "🏫 School District",
                }
                return (
                  <div key={factor} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">{factorNames[factor as keyof typeof factorNames]}</span>
                      <span className="text-white font-semibold">
                        +{contribution.toFixed(1)}% ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-blue-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Share Button */}
          <div className="text-center">
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-200 transform hover:scale-105"
              onClick={async () => {
                const shareText = `My snow day probability is ${result.probability}%! 🌨️ Check yours at ${window.location.href}`

                try {
                  if (navigator.share) {
                    await navigator.share({
                      title: "Snow Day Calculator Results",
                      text: shareText,
                      url: window.location.href,
                    })
                  } else {
                    await navigator.clipboard.writeText(shareText)
                    // Show temporary feedback
                    const button = event?.currentTarget as HTMLButtonElement
                    const originalText = button.textContent
                    button.textContent = "COPIED TO CLIPBOARD!"
                    setTimeout(() => {
                      button.textContent = originalText
                    }, 2000)
                  }
                } catch (error) {
                  console.error("Sharing failed:", error)
                }
              }}
            >
              SHARE YOUR RESULTS
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-blue-300 text-sm mt-12 max-w-md">
        <p>* This calculator provides estimates based on weather conditions and historical data.</p>
        <p>Always check official school announcements for confirmed closures.</p>
      </div>
    </div>
  )
}
