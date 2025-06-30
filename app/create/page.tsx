"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { io, type Socket } from "socket.io-client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Clock, Users, Code, CheckCircle2, ArrowLeft } from "lucide-react"
import usePreventBackNavigation from "@/hooks/usePreventBackNavigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { config } from "@/lib/config"

interface Question {
  _id: string
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  category: string
  tags: string[]
  timeLimit: number
  description: string
  acceptanceRate: number
  exampleInput: any
  exampleOutput: any
  testCases: { input: any; expectedOutput: any }[]
  constraints?: string[]
  functionMetadata?: {
    functionName: string
    returnType: string
    parameters: { name: string; type: string }[]
  }
}

export default function CreateRoomQuestions() {
  usePreventBackNavigation()

  const router = useRouter()
  const searchParams = useSearchParams()

  const username = searchParams.get("username") || ""
  const [questionCount, setQuestionCount] = useState<number>(3)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [roomId, setRoomId] = useState("")
  const [questionsDatabase, setQuestionsDatabase] = useState<Question[]>([])
  const [isBackendReady, setIsBackendReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const generatedRoomId = `room-${Date.now()}`
    setRoomId(generatedRoomId)
  }, [])

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${config.API_BASE_URL}/api/questions`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (Array.isArray(data)) {
          setQuestionsDatabase(data)
          setIsBackendReady(true)
        } else {
          console.error("❌ Expected array but got:", data)
          setQuestionsDatabase([])
        }
      } catch (err) {
        console.error("Failed to load questions:", err)
        setQuestionsDatabase([])
        setIsBackendReady(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestions()
  }, [])

  const categories = ["all", ...Array.from(new Set(questionsDatabase.map((q) => q.category)))]
  const difficulties = ["all", "Easy", "Medium", "Hard"]

  const filteredQuestions = questionsDatabase.filter((question) => {
    const matchesSearch =
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesDifficulty = difficultyFilter === "all" || question.difficulty === difficultyFilter
    const matchesCategory = categoryFilter === "all" || question.category === categoryFilter

    return matchesSearch && matchesDifficulty && matchesCategory
  })

  const handleQuestionSelect = (questionId: string) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter((id) => id !== questionId))
    } else if (selectedQuestions.length < questionCount) {
      setSelectedQuestions([...selectedQuestions, questionId])
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-300 text-green-900 font-bold"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Hard":
        return "bg-red-300 text-red-900 font-bold"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCreateRoom = () => {
    if (selectedQuestions.length === questionCount && username && roomId) {
      const socket: Socket = io(config.SOCKET_URL)

      const questionsPayload = questionsDatabase
        .filter((q) => selectedQuestions.includes(q._id))
        .map((q) => ({
          _id: q._id,
          title: q.title,
          description: q.description,
          difficulty: q.difficulty,
          constraints: q.constraints || [],
          testCases: q.testCases,
          functionMetadata: q.functionMetadata,
          exampleInput: q.exampleInput,
          exampleOutput: q.exampleOutput,
        }))

      socket.emit("create-room", {
        roomId: roomId,
        questions: questionsPayload,
      })

      router.push(
        `/room?roomId=${roomId}&username=${encodeURIComponent(
          username,
        )}&questions=${encodeURIComponent(JSON.stringify(selectedQuestions))}`,
      )
    }
  }

  const canCreateRoom = selectedQuestions.length === questionCount && username.length > 0

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading questions...</p>
        </div>
      </div>
    )
  }

  // Show backend not ready state
  if (!isBackendReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚧</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Backend Not Ready</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The backend service is not available yet. Please wait while it's being deployed.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 relative overflow-hidden transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-400/5 dark:bg-purple-400/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/")}
                  className="h-10 px-4 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-gray-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                    Create Competition Room
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    Select questions for your coding competition
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Enhanced Left Sidebar - Configuration */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6 shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl text-gray-900 dark:text-gray-100">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                      <Code className="h-5 w-5 text-white" />
                    </div>
                    Room Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Enhanced Question Count */}
                  <div className="space-y-3">
                    <Label htmlFor="questionCount" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Number of Questions
                    </Label>
                    <Select
                      value={questionCount.toString()}
                      onValueChange={(value) => {
                        setQuestionCount(Number.parseInt(value))
                        setSelectedQuestions([])
                      }}
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white dark:bg-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl bg-white dark:bg-gray-800">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <SelectItem key={num} value={num.toString()} className="rounded-lg">
                            {num} Question{num > 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Enhanced Selection Progress */}
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Selection Progress</Label>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedQuestions.length} of {questionCount} selected
                        </span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {Math.round((selectedQuestions.length / questionCount) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                          style={{ width: `${(selectedQuestions.length / questionCount) * 100}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Username input */}
                  <div className="space-y-3">
                    <Label htmlFor="username" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Your Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="username"
                        placeholder="Enter your name"
                        value={username}
                        onChange={(e) => {
                          router.replace(`/create?username=${encodeURIComponent(e.target.value)}`)
                        }}
                        className="h-12 pl-4 pr-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800"
                      />
                      {username.trim() && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Create Room Button */}
                  <Button
                    className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    onClick={handleCreateRoom}
                    disabled={!canCreateRoom}
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Create Room
                  </Button>

                  {/* Room Stats Preview */}
                  {selectedQuestions.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Room Preview</h4>
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Total Questions:</span>
                          <span className="font-semibold">{selectedQuestions.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated Time:</span>
                          <span className="font-semibold">
                            {selectedQuestions.reduce((total, id) => {
                              const question = questionsDatabase.find((q) => q._id === id)
                              return total + (question?.timeLimit || 0)
                            }, 0)}{" "}
                            min
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Right Content - Questions List */}
            <div className="lg:col-span-3">
              <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl text-gray-900 dark:text-gray-100">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                      <Search className="h-5 w-5 text-white" />
                    </div>
                    Select Questions
                    <Badge
                      variant="outline"
                      className="ml-auto text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      {filteredQuestions.length} available
                    </Badge>
                  </CardTitle>

                  {/* Enhanced Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                      <Input
                        placeholder="Search by title or tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white dark:bg-gray-800"
                      />
                    </div>

                    <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value)}>
                      <SelectTrigger className="min-w-[140px] h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white dark:bg-gray-800">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl bg-white dark:bg-gray-800">
                        {difficulties.map((diff) => (
                          <SelectItem key={diff} value={diff} className="rounded-lg">
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value)}>
                      <SelectTrigger className="min-w-[140px] h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white dark:bg-gray-800">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl bg-white dark:bg-gray-800">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="rounded-lg">
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>

                <CardContent className="max-h-[600px] overflow-y-auto custom-scroll-hide">
                  {filteredQuestions.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No questions found</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {filteredQuestions.map((question) => {
                      const isSelected = selectedQuestions.includes(question._id)
                      const canSelect = selectedQuestions.length < questionCount || isSelected

                      return (
                        <div
                          key={question._id}
                          className={`group relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-[1.01] ${
                            isSelected
                              ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg"
                              : canSelect
                                ? "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:shadow-md"
                                : "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => canSelect && handleQuestionSelect(question._id)}
                        >
                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                          )}

                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300">
                              {question.title}
                            </h3>
                            <Badge className={`${getDifficultyColor(question.difficulty)} font-semibold`}>
                              {question.difficulty}
                            </Badge>
                          </div>

                          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                            {question.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {question.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">{question.timeLimit} min</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="font-medium">{question.acceptanceRate}% acceptance</span>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Selected</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
