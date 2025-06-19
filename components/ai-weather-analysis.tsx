"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Brain, Loader2, TrendingUp, AlertCircle } from "lucide-react"

interface WeatherAnalysisProps {
  zipCode: string
  temperature: number
  snowfall: number
  windSpeed: number
  schoolDistrict: string
  probability: number
}

export function AIWeatherAnalysis({
  zipCode,
  temperature,
  snowfall,
  windSpeed,
  schoolDistrict,
  probability,
}: WeatherAnalysisProps) {
  const [analysis, setAnalysis] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string>("")

  const getAIAnalysis = async () => {
    if (!zipCode || !schoolDistrict) return

    setIsAnalyzing(true)
    setError("")

    try {
      const response = await fetch("/api/analyze-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zipCode,
          temperature,
          snowfall,
          windSpeed,
          schoolDistrict,
          probability,
        }),
      })

      const data = await response.json()

      if (response.ok && data.analysis) {
        setAnalysis(data.analysis)
      } else {
        setError("Unable to generate analysis. Please try again.")
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="h-6 w-6 text-purple-400" />
        <div>
          <h4 className="text-xl font-semibold text-white">AI Weather Analysis</h4>
          <p className="text-blue-200 text-sm">
            Get expert AI-powered insights on weather conditions and snow day probability
          </p>
        </div>
      </div>

      <Button
        onClick={getAIAnalysis}
        disabled={!zipCode || !schoolDistrict || isAnalyzing}
        className="w-full mb-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Analyzing Weather Patterns...
          </>
        ) : (
          <>
            <TrendingUp className="mr-2 h-5 w-5" />
            Get AI Analysis
          </>
        )}
      </Button>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-400/30 rounded-2xl text-red-200 mb-4">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {analysis && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6 rounded-2xl border border-purple-400/20">
          <h5 className="font-semibold text-purple-200 mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Expert Analysis
          </h5>
          <div className="text-sm text-blue-100 whitespace-pre-line leading-relaxed">{analysis}</div>
        </div>
      )}
    </div>
  )
}
