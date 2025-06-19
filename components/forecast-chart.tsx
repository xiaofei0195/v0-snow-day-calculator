"use client"

import type React from "react"

import { useMemo, useState, useRef } from "react"

interface ForecastChartProps {
  baseProbability: number
}

interface HoverData {
  x: number
  time: Date
  probability: number
  isVisible: boolean
}

export function ForecastChart({ baseProbability }: ForecastChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverData, setHoverData] = useState<HoverData>({
    x: 0,
    time: new Date(),
    probability: 0,
    isVisible: false,
  })

  // Generate 48-hour forecast data
  const forecastData = useMemo(() => {
    const hours = []
    const now = new Date()

    for (let i = 0; i < 48; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000)

      // Generate probability variations based on base probability
      let probability = baseProbability

      // Add time-based variations
      const timeOfDay = time.getHours()
      const dayOffset = Math.floor(i / 24)

      // Night and early morning slightly higher probability
      if (timeOfDay >= 22 || timeOfDay <= 6) {
        probability += Math.random() * 15 - 5
      }

      // Second day variations
      if (dayOffset === 1) {
        probability += Math.random() * 20 - 10
      }

      // Add random fluctuations
      probability += Math.random() * 10 - 5

      // Keep within reasonable bounds
      probability = Math.max(0, Math.min(100, probability))

      hours.push({
        time,
        hour: time.getHours(),
        probability: Math.round(probability),
        isToday: dayOffset === 0,
      })
    }

    return hours
  }, [baseProbability])

  const maxProbability = Math.max(...forecastData.map((d) => d.probability))
  const avgProbability = Math.round(forecastData.reduce((sum, d) => sum + d.probability, 0) / forecastData.length)
  const chartHeight = 200
  const chartWidth = 800
  const padding = { top: 20, right: 40, bottom: 60, left: 60 }

  // Generate path data
  const pathData = forecastData.map((point, index) => {
    const x = padding.left + (index / (forecastData.length - 1)) * (chartWidth - padding.left - padding.right)
    const y = padding.top + ((100 - point.probability) / 100) * (chartHeight - padding.top - padding.bottom)
    return { x, y, ...point }
  })

  const pathString = pathData.reduce((path, point, index) => {
    const command = index === 0 ? "M" : "L"
    return `${path} ${command} ${point.x} ${point.y}`
  }, "")

  // Generate fill area path
  const fillPath = `${pathString} L ${pathData[pathData.length - 1].x} ${chartHeight - padding.bottom} L ${pathData[0].x} ${chartHeight - padding.bottom} Z`

  // Handle mouse move
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const svgMouseX = (mouseX / rect.width) * chartWidth

    // Find closest data point
    let closestIndex = 0
    let minDistance = Number.POSITIVE_INFINITY

    pathData.forEach((point, index) => {
      const distance = Math.abs(point.x - svgMouseX)
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = index
      }
    })

    const closestPoint = pathData[closestIndex]
    if (closestPoint) {
      setHoverData({
        x: closestPoint.x,
        time: closestPoint.time,
        probability: closestPoint.probability,
        isVisible: true,
      })
    }
  }

  const handleMouseLeave = () => {
    setHoverData((prev) => ({ ...prev, isVisible: false }))
  }

  // Format tooltip time
  const formatTooltipTime = (time: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const isToday = time.toDateString() === today.toDateString()
    const isTomorrow = time.toDateString() === tomorrow.toDateString()

    let dayLabel = ""
    if (isToday) dayLabel = "Today"
    else if (isTomorrow) dayLabel = "Tomorrow"
    else dayLabel = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })

    const timeLabel = time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    return `${dayLabel}, ${timeLabel}`
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-6">
      <h4 className="font-semibold text-white mb-4 text-center text-xl">48-Hour School Closure Probability Forecast</h4>

      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
          className="w-full h-64 min-w-[800px] cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="probabilityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#1d4ed8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.1" />
            </linearGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="dropShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid lines - Y axis */}
          {[0, 25, 50, 75, 100].map((value) => {
            const y = padding.top + ((100 - value) / 100) * (chartHeight - padding.top - padding.bottom)
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#64748b"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.3"
                />
                <text x={padding.left - 10} y={y + 4} fill="#94a3b8" fontSize="12" textAnchor="end">
                  {value}%
                </text>
              </g>
            )
          })}

          {/* Grid lines - X axis (every 6 hours) */}
          {forecastData
            .filter((_, index) => index % 6 === 0)
            .map((point, index) => {
              const dataIndex = index * 6
              const x =
                padding.left + (dataIndex / (forecastData.length - 1)) * (chartWidth - padding.left - padding.right)
              return (
                <g key={dataIndex}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={chartHeight - padding.bottom}
                    stroke="#64748b"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity="0.3"
                  />
                  <text x={x} y={chartHeight - padding.bottom + 20} fill="#94a3b8" fontSize="11" textAnchor="middle">
                    {point.time.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </text>
                  <text x={x} y={chartHeight - padding.bottom + 35} fill="#94a3b8" fontSize="10" textAnchor="middle">
                    {point.time.toLocaleTimeString("en-US", { hour: "numeric", hour12: true })}
                  </text>
                </g>
              )
            })}

          {/* Fill area */}
          <path d={fillPath} fill="url(#probabilityGradient)" />

          {/* Main line */}
          <path
            d={pathString}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            filter="url(#glow)"
            className="drop-shadow-lg"
          />

          {/* Data points */}
          {pathData
            .filter((_, index) => index % 3 === 0)
            .map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
              </g>
            ))}

          {/* Hover indicator and tooltip */}
          {hoverData.isVisible && (
            <g>
              {/* Vertical indicator line */}
              <line
                x1={hoverData.x}
                y1={padding.top}
                x2={hoverData.x}
                y2={chartHeight - padding.bottom}
                stroke="#ffffff"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.8"
                filter="url(#dropShadow)"
              />

              {/* Indicator point */}
              <circle
                cx={hoverData.x}
                cy={padding.top + ((100 - hoverData.probability) / 100) * (chartHeight - padding.top - padding.bottom)}
                r="6"
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth="3"
                filter="url(#dropShadow)"
              />

              {/* Tooltip background */}
              <rect
                x={hoverData.x > chartWidth / 2 ? hoverData.x - 160 : hoverData.x + 10}
                y={padding.top + 10}
                width="150"
                height="60"
                rx="8"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="1"
                opacity="0.95"
                filter="url(#dropShadow)"
              />

              {/* Tooltip text - time */}
              <text
                x={hoverData.x > chartWidth / 2 ? hoverData.x - 85 : hoverData.x + 85}
                y={padding.top + 30}
                fill="#ffffff"
                fontSize="12"
                textAnchor="middle"
                className="font-medium"
              >
                {formatTooltipTime(hoverData.time)}
              </text>

              {/* Tooltip text - probability */}
              <text
                x={hoverData.x > chartWidth / 2 ? hoverData.x - 85 : hoverData.x + 85}
                y={padding.top + 50}
                fill="#3b82f6"
                fontSize="16"
                textAnchor="middle"
                className="font-bold"
              >
                {hoverData.probability}% probability
              </text>
            </g>
          )}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="#64748b"
            strokeWidth="2"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight - padding.bottom}
            stroke="#64748b"
            strokeWidth="2"
          />

          {/* Axis labels */}
          <text
            x={chartWidth / 2}
            y={chartHeight + 20}
            fill="#94a3b8"
            fontSize="14"
            textAnchor="middle"
            className="font-medium"
          >
            Time (Next 48 Hours)
          </text>
          <text
            x={20}
            y={chartHeight / 2}
            fill="#94a3b8"
            fontSize="14"
            textAnchor="middle"
            className="font-medium"
            transform={`rotate(-90, 20, ${chartHeight / 2})`}
          >
            School Closure Probability (%)
          </text>
        </svg>
      </div>

      {/* Legend and statistics */}
      <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-blue-200">Probability Trend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white rounded-full border-2 border-blue-500"></div>
          <span className="text-blue-200">Key Time Points</span>
        </div>
        <div className="text-blue-200">
          Peak: <span className="text-white font-semibold">{maxProbability}%</span>
        </div>
        <div className="text-blue-200">
          Average: <span className="text-white font-semibold">{avgProbability}%</span>
        </div>
      </div>

      {/* Interactive hint */}
      <div className="mt-2 text-center text-xs text-blue-300">
        💡 Hover over the chart to see detailed time and probability information
      </div>
    </div>
  )
}
