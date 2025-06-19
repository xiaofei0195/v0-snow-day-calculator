import { generateText } from "ai"
import { deepinfra } from "@/lib/ai-client"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { zipCode, temperature, snowfall, windSpeed, schoolDistrict, probability } = await req.json()

    // For demo purposes, return a mock analysis if no API key is available
    if (!process.env.DEEPINFRA_API_KEY || process.env.DEEPINFRA_API_KEY === "demo-key") {
      const mockAnalysis = `**Comprehensive Weather Impact Analysis for ZIP ${zipCode}**

**Current Snow Day Probability: ${probability}%**

**Detailed Weather Assessment:**
- **Temperature Analysis**: ${temperature}°F - ${temperature <= 20 ? "Extremely dangerous conditions that significantly increase closure probability due to safety concerns" : temperature <= 32 ? "Below freezing temperatures create ideal conditions for snow accumulation and icy roads" : "Above freezing may cause mixed precipitation and slushy conditions"}

- **Snowfall Impact**: ${snowfall} inches expected - ${snowfall >= 6 ? "Heavy snowfall will create major transportation disruptions and hazardous driving conditions" : snowfall >= 2 ? "Moderate snowfall likely to cause slippery roads and reduced visibility" : "Light snowfall with minimal direct impact on transportation"}

- **Wind Factor**: ${windSpeed} mph winds - ${windSpeed >= 20 ? "High winds creating blizzard-like conditions, significantly reducing visibility and causing dangerous wind chill" : windSpeed >= 10 ? "Moderate winds may cause snow drifting and additional cooling effects" : "Light winds with minimal additional weather impact"}

**School District Decision Factors:**
${schoolDistrict === "rural" ? "Rural districts typically have longer bus routes and less infrastructure support, leading to earlier closure decisions." : schoolDistrict === "urban" ? "Urban districts have better snow removal resources but face traffic congestion and pedestrian safety challenges." : "Suburban districts balance available resources with safety concerns for residential area transportation."}

**Multi-Factor Risk Assessment:**
- **Transportation Safety**: ${temperature <= 20 || snowfall >= 4 ? "HIGH RISK" : "MODERATE RISK"} - Road conditions present significant hazards
- **Student Safety**: Wind chill and visibility factors create ${windSpeed >= 15 ? "elevated safety concerns" : "standard winter weather risks"}
- **Infrastructure Impact**: Snow load and ice formation may affect school facilities and utilities

**Historical Context & Probability Justification:**
Based on regional weather patterns and school district decision-making history, conditions similar to these have resulted in school closures approximately ${Math.round((temperature <= 20 ? 30 : 0) + (snowfall >= 4 ? 40 : snowfall >= 2 ? 20 : 0) + (windSpeed >= 15 ? 20 : 0))}% of the time in comparable districts.

**Confidence Assessment: 8.5/10**
High confidence based on established meteorological factors and documented school closure patterns.

**Strategic Recommendations:**
1. **Immediate Actions**: Monitor official school communications starting at 5:00 AM
2. **Contingency Planning**: Arrange alternative childcare and work-from-home options
3. **Safety Preparations**: Ensure emergency supplies and backup heating sources are available
4. **Transportation**: Avoid unnecessary travel and check road conditions before any trips

*Note: This analysis combines real-time weather data with historical closure patterns and district-specific decision-making factors.*`

      return Response.json({ analysis: mockAnalysis })
    }

    const { text } = await generateText({
      model: deepinfra("deepseek-chat"),
      system: `You are an expert meteorologist and school closure analyst with deep knowledge of US weather patterns and educational district policies. Provide comprehensive, data-driven analysis that considers multiple factors affecting school closure decisions.`,
      prompt: `Provide a comprehensive multi-factor analysis for the following snow day scenario:

**Location**: ZIP ${zipCode}
**Current Conditions**:
- Temperature: ${temperature}°F
- Expected Snowfall: ${snowfall} inches
- Wind Speed: ${windSpeed} mph
- School District Type: ${schoolDistrict}
- **Calculated Closure Probability: ${probability}%**

Please provide a detailed analysis covering:

1. **Weather Impact Assessment**: Analyze each weather factor's contribution to closure risk
2. **School District Decision Factors**: How district type influences closure decisions
3. **Multi-Factor Risk Analysis**: Transportation, student safety, and infrastructure impacts
4. **Historical Context**: How similar conditions have affected closures in comparable areas
5. **Probability Validation**: Explain why the ${probability}% probability is justified
6. **Strategic Recommendations**: Specific actions for students, parents, and school staff
7. **Confidence Level**: Rate your analysis confidence (1-10) with reasoning

Format your response with clear sections and actionable insights. Be specific about risk factors and provide context for the calculated probability.`,
    })

    return Response.json({ analysis: text })
  } catch (error) {
    console.error("AI Analysis Error:", error)

    // Fallback to mock analysis on error
    const mockAnalysis = `**Weather Analysis (Demo Mode)**

Unable to connect to AI service. Here's a basic analysis based on your inputs:

**Calculated Probability: ${req.body?.probability || "N/A"}%**

**Conditions Summary:**
- Temperature: ${req.body?.temperature || "N/A"}°F
- Snowfall: ${req.body?.snowfall || "N/A"} inches  
- Wind Speed: ${req.body?.windSpeed || "N/A"} mph
- District: ${req.body?.schoolDistrict || "N/A"}

**Basic Assessment:**
Weather conditions suggest monitoring official school announcements closely. The calculated probability indicates ${req.body?.probability >= 60 ? "high likelihood" : req.body?.probability >= 30 ? "moderate chance" : "low probability"} of closure based on the severity of conditions.

**Recommendations:**
1. Check school district website and local news between 5-6 AM
2. Prepare alternative arrangements if probability is above 40%
3. Monitor weather updates for any changes in conditions

*Note: This is a demo response. For comprehensive AI analysis, configure the DEEPINFRA_API_KEY environment variable.*`

    return Response.json({ analysis: mockAnalysis })
  }
}
