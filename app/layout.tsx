import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, Clock, Building, FileText } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Timetable Builder",
  description: "Semester-long weekly timetable builder for schools",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <nav className="border-b bg-white backdrop-blur">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Link href="/" className="font-bold text-xl">
                    Timetable Builder
                  </Link>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/subjects" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Subjects
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/periods" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Periods
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/classrooms" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Classrooms
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Timetable
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/docs" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Docs
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
