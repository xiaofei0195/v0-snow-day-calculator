import { generateText } from "ai"
import { deepseek } from "@/lib/ai-client"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { zipCode, temperature, snowfall, windSpeed, schoolDistrict, probability } = await req.json()

    // Check if DeepSeek API key is available
    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === "demo-key") {
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

*Note: This is a demo response. To get real AI analysis, please configure the DEEPSEEK_API_KEY environment variable.*`

      return Response.json({ analysis: mockAnalysis })
    }

    // Use DeepSeek API for real analysis
    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      system: `You are an expert meteorologist and school closure analyst with deep knowledge of US weather patterns and educational district policies. Provide comprehensive, data-driven analysis that considers multiple factors affecting school closure decisions.

Your analysis should be professional, detailed, and actionable. Focus on safety factors, historical patterns, and practical recommendations for families and school administrators.`,
      prompt: `Analyze the following snow day scenario and provide expert insights:

**Location**: ZIP Code ${zipCode}
**Weather Conditions**:
- Temperature: ${temperature}°F
- Expected Snowfall: ${snowfall} inches
- Wind Speed: ${windSpeed} mph
- School District Type: ${schoolDistrict}
- **Calculated Closure Probability: ${probability}%**

Please provide a comprehensive analysis covering:

1. **Weather Impact Assessment**: 
   - How each weather factor contributes to closure risk
   - Interaction effects between temperature, snow, and wind
   - Regional considerations for this ZIP code area

2. **School District Decision Analysis**:
   - How ${schoolDistrict} district characteristics affect closure decisions
   - Transportation challenges specific to this district type
   - Infrastructure and resource considerations

3. **Multi-Factor Risk Evaluation**:
   - Student safety concerns (transportation, walking conditions, bus stops)
   - Staff safety and commuting challenges
   - Facility and operational impacts

4. **Historical Context & Probability Validation**:
   - How similar conditions have affected school closures historically
   - Why the ${probability}% probability is justified or should be adjusted
   - Regional patterns and precedents

5. **Strategic Recommendations**:
   - Immediate actions for families (tonight/early morning)
   - Contingency planning suggestions
   - Safety preparations and precautions
   - Communication monitoring strategies

6. **Confidence Assessment**:
   - Rate your analysis confidence (1-10) with detailed reasoning
   - Key uncertainties or variables that could change the outcome
   - Factors that would increase or decrease closure likelihood

Format your response with clear sections, bullet points where appropriate, and actionable insights. Be specific about timing, risk factors, and practical steps families should take.`,
      maxTokens: 2000,
      temperature: 0.7,
    })

    return Response.json({ analysis: text })
  } catch (error) {
    console.error("DeepSeek API Error:", error)

    // Enhanced error handling with specific error types
    let errorMessage = "Unable to generate AI analysis. "

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage += "Please check your DeepSeek API key configuration."
      } else if (error.message.includes("rate limit")) {
        errorMessage += "API rate limit exceeded. Please try again in a few minutes."
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage += "Network connection issue. Please check your internet connection."
      } else {
        errorMessage += "Please try again later."
      }
    }

    // Get the request body safely for fallback
    let requestBody
    try {
      const clonedReq = req.clone()
      requestBody = await clonedReq.json()
    } catch {
      requestBody = {}
    }

    // Enhanced fallback analysis
    const fallbackAnalysis = `**Weather Analysis (Offline Mode)**

${errorMessage}

**Current Assessment Based on Input Data:**

**Calculated Probability: ${requestBody?.probability || "N/A"}%**

**Weather Conditions Summary:**
- Temperature: ${requestBody?.temperature || "N/A"}°F
- Expected Snowfall: ${requestBody?.snowfall || "N/A"} inches  
- Wind Speed: ${requestBody?.windSpeed || "N/A"} mph
- District Type: ${requestBody?.schoolDistrict || "N/A"}

**Basic Risk Assessment:**
${
  requestBody?.probability >= 70
    ? "**HIGH RISK** - School closure very likely based on severe weather conditions."
    : requestBody?.probability >= 40
      ? "**MODERATE RISK** - School closure possible. Monitor announcements closely."
      : "**LOW RISK** - School likely to remain open, but stay alert for updates."
}

**General Recommendations:**
1. **Tonight**: Check school district website and local news before bed
2. **Early Morning**: Monitor official announcements between 5:00-6:00 AM
3. **Backup Plans**: Prepare alternative childcare arrangements if probability > 40%
4. **Safety First**: Avoid unnecessary travel if conditions deteriorate

**Next Steps:**
- Configure DEEPSEEK_API_KEY environment variable for detailed AI analysis
- Monitor weather updates for any changes in conditions
- Follow your school district's official communication channels

*Note: This is a basic assessment. For comprehensive AI-powered analysis, please ensure proper API configuration.*`

    return Response.json({ analysis: fallbackAnalysis })
  }
}
