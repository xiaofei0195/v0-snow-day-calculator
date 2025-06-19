"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Clock, AlertTriangle, CheckCircle } from "lucide-react"

interface SmartRecommendationsProps {
  probability: number
  temperature: number
  snowfall: number
  windSpeed: number
  schoolDistrict: string
}

export function SmartRecommendations({
  probability,
  temperature,
  snowfall,
  windSpeed,
  schoolDistrict,
}: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<
    Array<{
      type: "preparation" | "safety" | "timing" | "alternative"
      title: string
      description: string
      priority: "high" | "medium" | "low"
    }>
  >([])

  useEffect(() => {
    // 只在组件首次挂载时生成推荐，不再监听参数变化
    const generateRecommendations = () => {
      const recs = []

      // 其余代码保持不变...
      // High probability recommendations
      if (probability >= 70) {
        recs.push({
          type: "preparation" as const,
          title: "Prepare for School Closure",
          description: "High probability of snow day. Arrange childcare and work-from-home plans.",
          priority: "high" as const,
        })
      }

      // Temperature-based recommendations
      if (temperature <= 20) {
        recs.push({
          type: "safety" as const,
          title: "Extreme Cold Precautions",
          description: "Dangerous temperatures. Limit outdoor exposure and check on elderly neighbors.",
          priority: "high" as const,
        })
      }

      // Snowfall recommendations
      if (snowfall >= 6) {
        recs.push({
          type: "preparation" as const,
          title: "Heavy Snow Preparation",
          description: "Stock up on essentials and ensure you have backup power sources.",
          priority: "high" as const,
        })
      }

      // Wind speed recommendations
      if (windSpeed >= 20) {
        recs.push({
          type: "safety" as const,
          title: "High Wind Advisory",
          description: "Strong winds may cause power outages. Secure outdoor items.",
          priority: "medium" as const,
        })
      }

      // District-specific recommendations
      if (schoolDistrict === "rural") {
        recs.push({
          type: "timing" as const,
          title: "Rural District Alert",
          description: "Rural districts often close earlier. Check announcements by 5 AM.",
          priority: "medium" as const,
        })
      }

      // General recommendations
      if (probability >= 30) {
        recs.push({
          type: "alternative" as const,
          title: "Plan Alternative Activities",
          description: "Prepare indoor activities and educational resources for potential home day.",
          priority: "low" as const,
        })
      }

      recs.push({
        type: "timing" as const,
        title: "Monitor Official Channels",
        description: "Check school website and local news between 5-6 AM for closure announcements.",
        priority: "medium" as const,
      })

      setRecommendations(recs)
    }

    generateRecommendations()
  }, []) // 空依赖数组，只在组件挂载时执行一次

  const getIcon = (type: string) => {
    switch (type) {
      case "preparation":
        return <CheckCircle className="h-4 w-4" />
      case "safety":
        return <AlertTriangle className="h-4 w-4" />
      case "timing":
        return <Clock className="h-4 w-4" />
      case "alternative":
        return <Lightbulb className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          Smart Recommendations
        </CardTitle>
        <CardDescription>AI-powered personalized suggestions based on your conditions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">{getIcon(rec.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                  <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
