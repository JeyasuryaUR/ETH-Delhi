"use client"
import { motion } from "motion/react"
import dynamic from "next/dynamic"

const World = dynamic(() => import("@/components/ui/globe").then((m) => m.World), {
  ssr: false,
})

export default function StudentGlobe() {
  const globeConfig = {
    pointSize: 4,
    globeColor: "#0a0a0a", // back to dark globe
    showAtmosphere: true,
    atmosphereColor: "#eab308", // keep sunshine yellow atmosphere
    atmosphereAltitude: 0.15,
    emissive: "#000000", // removed yellow emissive glow
    emissiveIntensity: 0, // no glow intensity
    shininess: 0.1, // reduced shininess for matte look
    polygonColor: "rgba(234,179,8,0.2)", // subtle yellow country borders
    ambientLight: "#404040", // subtle ambient light
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    arcTime: 1000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    initialPosition: { lat: 54.526, lng: -2.9623 }, // UK position for Ciara
    autoRotate: true,
    autoRotateSpeed: 0.5,
    showGraticules: true, // show latitude/longitude grid lines
    graticulesColor: "#eab308", // yellow grid lines
    graticulesOpacity: 0.3, // subtle grid visibility
  }

  const colors = ["#eab308", "#fbbf24", "#f59e0b"]

  const studentConnections = [
    {
      order: 1,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 40.7128,
      endLng: -74.006, // New York
      arcAlt: 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 1,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 37.7749,
      endLng: -122.4194, // San Francisco
      arcAlt: 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 2,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: -33.8688,
      endLng: 151.2093, // Sydney
      arcAlt: 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 2,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 35.6762,
      endLng: 139.6503, // Tokyo
      arcAlt: 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 3,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 28.6139,
      endLng: 77.209, // Delhi
      arcAlt: 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 3,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 1.3521,
      endLng: 103.8198, // Singapore
      arcAlt: 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 4,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: -22.9068,
      endLng: -43.1729, // Rio
      arcAlt: 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 4,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 52.52,
      endLng: 13.405, // Berlin
      arcAlt: 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 5,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 48.8566,
      endLng: 2.3522, // Paris
      arcAlt: 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 5,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 34.0522,
      endLng: -118.2437, // Los Angeles
      arcAlt: 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 6,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 43.6532,
      endLng: -79.3832, // Toronto
      arcAlt: 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 6,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: -26.2041,
      endLng: 28.0473, // Johannesburg
      arcAlt: 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 7,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 55.7558,
      endLng: 37.6176, // Moscow
      arcAlt: 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 7,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 31.2304,
      endLng: 121.4737, // Shanghai
      arcAlt: 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 8,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 25.2048,
      endLng: 55.2708, // Dubai
      arcAlt: 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 8,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: -1.2921,
      endLng: 36.8219, // Nairobi
      arcAlt: 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 9,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 19.4326,
      endLng: -99.1332, // Mexico City
      arcAlt: 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 9,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 41.9028,
      endLng: 12.4964, // Rome
      arcAlt: 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 10,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: 59.9311,
      endLng: 30.3609, // St Petersburg
      arcAlt: 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      order: 10,
      startLat: 54.526,
      startLng: -2.9623, // UK
      endLat: -34.6037,
      endLng: -58.3816, // Buenos Aires
      arcAlt: 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent rounded-full" />

      <div className="max-w-full mx-auto w-full relative overflow-hidden h-full">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1,
          }}
          className="text-center mb-8 relative z-20"
        >
          <h3 className="text-lg md:text-xl font-bold text-primary mb-2">Global Chess Battles</h3>
          <p className="text-sm md:text-base font-normal text-muted-foreground max-w-md mx-auto">
            Worldwide network of strategic masters competing in epic battles
          </p>
        </motion.div>

        <div className="absolute w-full bottom-0 inset-x-0 h-20 bg-gradient-to-b pointer-events-none select-none from-transparent to-background z-40" />
        <div className="absolute w-full -bottom-10 h-full z-10">
          <World data={studentConnections} globeConfig={globeConfig} />
        </div>
      </div>
    </div>
  )
}
