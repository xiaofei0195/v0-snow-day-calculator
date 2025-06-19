"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Settings, RotateCcw, ChevronDown, ChevronUp } from "lucide-react"

export interface WeightConfig {
  temperature: number
  snowfall: number
  windSpeed: number
  schoolDistrict: number
}

interface WeightConfiguratorProps {
  weights: WeightConfig
  onWeightsChange: (weights: WeightConfig) => void
  onReset: () => void
}

export function WeightConfigurator({ weights, onWeightsChange, onReset }: WeightConfiguratorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleWeightChange = (factor: keyof WeightConfig, value: number[]) => {
    onWeightsChange({
      ...weights,
      [factor]: value[0],
    })
  }

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0)

  const getFactorIcon = (factor: keyof WeightConfig) => {
    const icons = {
      temperature: "🌡️",
      snowfall: "❄️",
      windSpeed: "💨",
      schoolDistrict: "🏫",
    }
    return icons[factor]
  }

  const getFactorName = (factor: keyof WeightConfig) => {
    const names = {
      temperature: "Temperature",
      snowfall: "Snowfall",
      windSpeed: "Wind Speed",
      schoolDistrict: "School District",
    }
    return names[factor]
  }

  return (
    <div className="w-full max-w-lg mb-6">
      {/* Collapsible Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-4 cursor-pointer hover:bg-white/15 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="text-white font-semibold">Calculation Weight Settings</h3>
              <p className="text-blue-200 text-sm">
                Customize how different weather factors influence the snow day calculation
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-400/30">
              Advanced
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
              Total: {totalWeight.toFixed(1)}
            </Badge>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-blue-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-blue-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isOpen && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl mt-2 p-6 space-y-6">
          {/* Weight Controls */}
          <div className="space-y-6">
            {(Object.keys(weights) as Array<keyof WeightConfig>).map((factor) => {
              const percentage = totalWeight > 0 ? (weights[factor] / totalWeight) * 100 : 0
              return (
                <div key={factor} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFactorIcon(factor)}</span>
                      <Label className="font-medium text-white">{getFactorName(factor)}</Label>
                      <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-400/30">
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="text-sm font-medium text-blue-200">{weights[factor].toFixed(1)}</div>
                  </div>

                  <Slider
                    value={[weights[factor]]}
                    onValueChange={(value) => handleWeightChange(factor, value)}
                    max={10}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              )
            })}
          </div>

          {/* Weight Distribution Visualization */}
          <div className="space-y-3">
            <Label className="font-medium text-white">Weight Distribution</Label>
            <div className="flex h-3 rounded-full overflow-hidden bg-white/20">
              {(Object.keys(weights) as Array<keyof WeightConfig>).map((factor, index) => {
                const percentage = totalWeight > 0 ? (weights[factor] / totalWeight) * 100 : 0
                const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500"]
                return (
                  <div
                    key={factor}
                    className={`${colors[index]} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                    title={`${factor}: ${percentage.toFixed(1)}%`}
                  />
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(Object.keys(weights) as Array<keyof WeightConfig>).map((factor, index) => {
                const percentage = totalWeight > 0 ? (weights[factor] / totalWeight) * 100 : 0
                const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500"]
                return (
                  <div key={factor} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${colors[index]}`} />
                    <span className="text-blue-200">
                      {getFactorName(factor)}: {percentage.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Preset Configurations */}
          <div className="space-y-3">
            <Label className="font-medium text-white">Quick Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onWeightsChange({
                    temperature: 3.5,
                    snowfall: 3.0,
                    windSpeed: 2.0,
                    schoolDistrict: 1.5,
                  })
                }
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                🌨️ Conservative
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onWeightsChange({
                    temperature: 2.5,
                    snowfall: 2.5,
                    windSpeed: 2.5,
                    schoolDistrict: 2.5,
                  })
                }
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                ⚖️ Balanced
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onWeightsChange({
                    temperature: 1.5,
                    snowfall: 6.0,
                    windSpeed: 1.5,
                    schoolDistrict: 1.0,
                  })
                }
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                ❄️ Snow-Sensitive
              </Button>
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end pt-4 border-t border-white/20">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
