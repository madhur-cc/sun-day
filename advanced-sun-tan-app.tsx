'use client'

import { useState, useEffect } from 'react'
import { Sun, Pause, Play, RotateCcw, MapPin } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY

interface WeatherData {
  current: { uvi: number };
  hourly: Array<{ dt: number; uvi: number }>;
}

export default function Component() {
  const [time, setTime] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [uvIndex, setUvIndex] = useState(0)
  const [tanProgress, setTanProgress] = useState(0)
  const [location, setLocation] = useState('')
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [bestTime, setBestTime] = useState('')

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1)
        setTanProgress((prevProgress) => Math.min(prevProgress + (uvIndex / 100), 100))
      }, 1000)
    } else if (!isActive && time !== 0) {
      if (interval) clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, time, uvIndex])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setTime(0)
    setTanProgress(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const fetchWeatherData = async () => {
    try {
      // First, get coordinates for the location
      const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${API_KEY}`)
      const geoData = await geoResponse.json()

      if (geoData.length === 0) {
        alert('Location not found. Please try again.')
        return
      }

      const { lat, lon } = geoData[0]

      // Then, fetch weather data using the coordinates
      const weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,daily,alerts&appid=${API_KEY}`)
      const data: WeatherData = await weatherResponse.json()

      setWeatherData(data)
      setUvIndex(data.current.uvi)

      // Find best time for sunbathing
      const bestHour = findBestSunbathingTime(data.hourly)
      setBestTime(bestHour ? `${new Date(bestHour.dt * 1000).getHours()}:00` : 'Not recommended today')

    } catch (error) {
      console.error('Error fetching weather data:', error)
      alert('Error fetching weather data. Please try again.')
    }
  }

  const findBestSunbathingTime = (hourlyData: Array<{ dt: number; uvi: number }>) => {
    const now = new Date()
    const todayData = hourlyData.filter(hour => {
      const hourDate = new Date(hour.dt * 1000)
      return hourDate.getDate() === now.getDate()
    })

    const idealUvIndex = todayData.filter(hour => hour.uvi >= 3 && hour.uvi <= 5)
    return idealUvIndex.length > 0 ? idealUvIndex[0] : null
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Sun Tan App</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <div className="flex space-x-2">
            <Input
              id="location"
              placeholder="Enter city name"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Button onClick={fetchWeatherData}>
              <MapPin className="w-4 h-4 mr-2" />
              Set
            </Button>
          </div>
        </div>
        {weatherData && (
          <>
            <div className="flex justify-center items-center space-x-2">
              <Sun className="w-8 h-8 text-yellow-500" />
              <span className="text-xl font-semibold">Current UV Index: {uvIndex.toFixed(1)}</span>
            </div>
            <div className="text-center">
              <p className="font-medium">Best time for sunbathing today: {bestTime}</p>
            </div>
          </>
        )}
        <div className="text-4xl font-bold text-center" aria-live="polite">
          {formatTime(time)}
        </div>
        <Progress value={tanProgress} className="w-full" />
        <div className="text-center text-sm text-muted-foreground">
          Tan Progress: {tanProgress.toFixed(1)}%
        </div>
      </CardContent>
      <CardFooter className="flex justify-center space-x-2">
        <Button onClick={toggleTimer} variant="outline">
          {isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {isActive ? 'Pause' : 'Start'}
        </Button>
        <Button onClick={resetTimer} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </CardFooter>
    </Card>
  )
}