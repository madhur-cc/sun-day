import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sun, Calendar } from 'lucide-react'

interface WeatherData {
  dt: number
  uvi: number
  temp: number
  weather: Array<{ description: string }>
}

interface SuggestionProps {
  location: string
  apiKey: string
}

export function SunbathingSuggestions({ location, apiKey }: SuggestionProps) {
  const [suggestions, setSuggestions] = useState<Array<{ date: Date, slots: Array<{ time: string, uvi: number }> }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (location) {
      fetchSuggestions()
    }
  }, [location])

  const fetchSuggestions = async () => {
    setLoading(true)
    setError(null)
    try {
      // First, get coordinates for the location
      const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${apiKey}`)
      const geoData = await geoResponse.json()

      if (geoData.length === 0) {
        throw new Error('Location not found')
      }

      const { lat, lon } = geoData[0]

      // Fetch weather data for the next 3 days
      const weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,alerts&units=metric&appid=${apiKey}`)
      const weatherData = await weatherResponse.json()

      const nextThreeDays = weatherData.daily.slice(0, 3)
      const suggestions = nextThreeDays.map((day: WeatherData) => {
        const date = new Date(day.dt * 1000)
        const slots = weatherData.hourly
          .filter((hour: WeatherData) => {
            const hourDate = new Date(hour.dt * 1000)
            return hourDate.getDate() === date.getDate() && hour.uvi >= 3
          })
          .map((hour: WeatherData) => ({
            time: new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            uvi: hour.uvi
          }))

        return { date, slots }
      })

      setSuggestions(suggestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading suggestions...</div>
  if (error) return <div>Error: {error}</div>
  if (suggestions.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Sunbathing Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.map((day, index) => (
          <div key={index} className="mb-4">
            <h3 className="font-semibold mb-2">{day.date.toDateString()}</h3>
            <div className="grid grid-cols-2 gap-2">
              {day.slots.map((slot, slotIndex) => (
                <Button key={slotIndex} variant="outline" className="text-sm">
                  <Sun className="w-4 h-4 mr-2" />
                  {slot.time} (UV: {slot.uvi.toFixed(1)})
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
