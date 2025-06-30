"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Users, Plus, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function JoinTeamPage() {
  const [username, setUsername] = useState("")
  const [roomId, setRoomId] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !roomId.trim()) return

    router.push(`/room?roomId=${roomId}&username=${username}`)

    console.log("Joining room:", { username, roomId })
  }

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    const roomId = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    router.push(`/create?username=${encodeURIComponent(username)}&roomId=${roomId}`)

    console.log("Navigating to create page with username and roomId:", { username, roomId })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 relative overflow-hidden transition-colors duration-300 flex flex-col">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 dark:bg-purple-400/3 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full relative z-10">
            {/* Left Column - Join Team Form */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md space-y-8">
                {/* Enhanced Header */}
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                        <Users className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                      PeerPrep
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                      Challenge your friends. Conquer problems. Climb the leaderboard. Connect with your team or create
                      a new room.
                    </p>
                  </div>
                </div>

                {/* Enhanced Main Card */}
                <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
                  <CardHeader className="text-center pb-6 pt-8">
                    <CardTitle className="flex items-center justify-center gap-3 text-2xl text-gray-900 dark:text-gray-100">
                      <div
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          isCreating
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {isCreating ? <Plus className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
                      </div>
                      {isCreating ? "Create New Room" : "Join Existing Room"}
                    </CardTitle>
                    <CardDescription className="text-base mt-3 text-gray-600 dark:text-gray-300">
                      {isCreating
                        ? "Start a new team room and invite others to join"
                        : "Enter your details to join an existing team room"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-8 px-8 pb-8">
                    <form onSubmit={isCreating ? handleCreateRoom : handleJoinRoom} className="space-y-6">
                      {/* Enhanced Username Field */}
                      <div className="space-y-3">
                        <Label htmlFor="username" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Username
                        </Label>
                        <div className="relative">
                          <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full h-12 pl-4 pr-4 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {username.trim() && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Room ID Field */}
                      {!isCreating && (
                        <div className="space-y-3 animate-in slide-in-from-top duration-300">
                          <Label htmlFor="roomId" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Room ID
                          </Label>
                          <div className="relative">
                            <Input
                              id="roomId"
                              type="text"
                              placeholder="Enter room ID"
                              value={roomId}
                              onChange={(e) => setRoomId(e.target.value)}
                              required
                              className="w-full h-12 pl-4 pr-4 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {roomId.trim() && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Enhanced Submit Button */}
                      <Button
                        type="submit"
                        className={`w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl ${
                          isCreating
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        }`}
                        disabled={!username.trim() || (!isCreating && !roomId.trim())}
                      >
                        <div className="flex items-center justify-center gap-3">
                          {isCreating ? (
                            <>
                              <Plus className="h-5 w-5" />
                              Create Room
                            </>
                          ) : (
                            <>
                              <LogIn className="h-5 w-5" />
                              Join Room
                            </>
                          )}
                        </div>
                      </Button>
                    </form>

                    {/* Enhanced Separator */}
                    <div className="relative py-4">
                      <Separator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white dark:bg-gray-800 px-4 py-1 text-sm text-gray-500 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                          or
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Toggle Action */}
                    <Button
                      variant="outline"
                      className="w-full h-12 text-base font-medium rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => {
                        setIsCreating(!isCreating)
                        setRoomId("")
                      }}
                    >
                      <div className="flex items-center justify-center gap-3">
                        {isCreating ? (
                          <>
                            <LogIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <span className="text-gray-900 dark:text-gray-100">Join Existing Room Instead</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <span className="text-gray-900 dark:text-gray-100">Create New Room Instead</span>
                          </>
                        )}
                      </div>
                    </Button>
                  </CardContent>
                </Card>

                {/* Enhanced Help Text */}
                <div className="text-center space-y-3">
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-gray-700/20 shadow-sm">
                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                      Need help? Contact your team administrator
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Room IDs are case-sensitive</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Right Column - Competition Rules */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-2xl">
                <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm h-full max-h-[800px] overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-2xl text-gray-900 dark:text-gray-100">
                      <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                        📋
                      </div>
                      Competition Rules & Regulations
                    </CardTitle>

                  </CardHeader>
                  <CardContent className="overflow-y-auto max-h-[600px] space-y-6 px-6 pb-6 custom-scroll-hide">
                    {/* Rule 0 - Language & Submission Format */}
                    <div className="space-y-3 custom-scroll-hide">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                          0
                        </span>
                        Language & Submission Format
                      </h3>
                      <div className="pl-8 space-y-2">
                        <p className="text-gray-700 dark:text-gray-300">
                          Currently, only C++ is supported. Support for additional languages will be introduced soon.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          Participants are required to write only the main logic function. There is no need to include
                          the <code className="font-mono">int main()</code> function.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Rule 1 - Room Creation */}
                    <div className="space-y-3 custom-scroll-hide">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </span>
                        Room Creation and Joining Protocol
                      </h3>
                      <div className="pl-8 space-y-2">
                        <p className="text-gray-700 dark:text-gray-300">
                          Any one of the team members or friends must create a coding room by selecting the desired
                          questions. After creating the room, the room ID should be shared with others so they can join
                          and participate.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          This ensures all participants are solving the same problems under uniform conditions.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Rule 2 */}
                    <div className="space-y-3 custom-scroll-hide">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </span>
                        Base Score Based on Difficulty
                      </h3>
                      <div className="pl-8 space-y-2">
                        <p className="text-gray-700 dark:text-gray-300">
                          Each coding problem has a base score depending on its difficulty:
                        </p>
                        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <strong className="text-green-600 dark:text-green-400">Easy</strong> → 100 points
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <strong className="text-yellow-600 dark:text-yellow-400">Medium</strong> → 200 points
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <strong className="text-red-600 dark:text-red-400">Hard</strong> → 300 points
                          </li>
                        </ul>
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          The actual base score earned is proportional to the number of passed test cases. For example,
                          if a user passes half the test cases of a Medium problem, they get 100 points (i.e., 200 ×
                          0.5).
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Rule 3 */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </span>
                        Speed Bonus (Extra Points for Quick Submissions)
                      </h3>
                      <div className="pl-8 space-y-2">
                        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            If submitted within <strong>5 minutes</strong> →{" "}
                            <strong className="text-green-600 dark:text-green-400">+50 bonus points</strong>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            If submitted within <strong>10 minutes</strong> →{" "}
                            <strong className="text-blue-600 dark:text-blue-400">+30 bonus points</strong>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            If submitted within <strong>15 minutes</strong> →{" "}
                            <strong className="text-yellow-600 dark:text-yellow-400">+10 bonus points</strong>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            No bonus if submission takes more than 15 minutes
                          </li>
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    {/* Rule 4 */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                          4
                        </span>
                        Penalty for Wrong Attempts
                      </h3>
                      <div className="pl-8 space-y-2">
                        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Every wrong attempt reduces the score by{" "}
                            <strong className="text-red-600 dark:text-red-400">10 points</strong>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Maximum penalty capped at{" "}
                            <strong className="text-orange-600 dark:text-orange-400">50 points</strong>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    {/* Rule 5 */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                          5
                        </span>
                        Late Submission Penalty
                      </h3>
                      <div className="pl-8 space-y-3">
                        <p className="text-gray-700 dark:text-gray-300">
                          Each problem has a time limit depending on its difficulty:
                        </p>
                        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <strong className="text-green-600 dark:text-green-400">Easy</strong> → 20 minutes
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <strong className="text-yellow-600 dark:text-yellow-400">Medium</strong> → 40 minutes
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <strong className="text-red-600 dark:text-red-400">Hard</strong> → 90 minutes
                          </li>
                        </ul>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          If a user takes more than half of the allowed time (i.e., 10, 20, or 45 minutes respectively),
                          late penalties start applying.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>For every extra 10 minutes beyond that halfway point:</strong>
                        </p>
                        <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Easy → 15 points deducted
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                            Medium → 20 points deducted
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            Hard → 20 points deducted
                          </li>
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    {/* Rule 6 */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                          6
                        </span>
                        Final Score Calculation Logic For a Problem
                      </h3>
                      <div className="pl-8 space-y-3">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-mono text-gray-800 dark:text-gray-200 text-center">
                            <strong>
                              Final Score = Base Score + Speed Bonus - Wrong Attempt Penalty - Late Submission Penalty
                            </strong>
                          </p>
                        </div>
                        <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            The final score is always rounded down to the nearest whole number
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            If after all deductions the score becomes negative, it is clamped to zero (minimum score is
                            0)
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Now properly positioned at the bottom */}
      <footer className="relative z-10 py-6 border-t border-white/20 dark:border-gray-700/20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-gray-600 dark:text-gray-300 text-sm">Developed and Maintained by</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Aditya Basu</span>
              <a
                href="https://www.linkedin.com/in/aditya-basu-bbb882256/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-300 hover:scale-110 transform"
                aria-label="Connect with Aditya Basu on LinkedIn"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">© 2025 PeerPrep. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
