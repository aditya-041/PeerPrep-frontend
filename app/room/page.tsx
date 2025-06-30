"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronDown,
  ChevronUp,
  Play,
  Send,
  Trophy,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Code,
  LogOut,
  Crown,
  Target,
} from "lucide-react"
import { io, type Socket } from "socket.io-client"
import { Editor } from "@monaco-editor/react"
import usePreventBackNavigation from "@/hooks/usePreventBackNavigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { calculateScore } from "@/utils/calculateScore"
import type { Difficulty } from "@/utils/calculateScore"
import { config, checkBackendHealth } from "@/lib/config"

interface Participant {
  id: string
  name: string
  status: "coding" | "working" | "submitted" | "idle"
  score: number
  joinTime?: number
  timeSpent?: string
  scoresPerQuestion?: Record<string, number>
}

interface FunctionMetadata {
  functionName: string
  returnType: string
  parameters: { name: string; type: string }[]
  signature?: string
}

interface ReceivedQuestion {
  _id: string | { $oid: string }
  title: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard"
  constraints?: string[]
  exampleInput?: any
  exampleOutput?: any
  testCases: { input: any; expectedOutput: any }[]
  functionMetadata?: {
    functionName: string
    returnType: string
    parameters: { name: string; type: string }[]
    signature?: string
  }
}

interface TestCase {
  id: number
  input: any
  expectedOutput: any
  passed?: boolean
}

export default function CodingRoom() {
  usePreventBackNavigation()

  const searchParams = useSearchParams()
  const router = useRouter()

  const roomId = searchParams.get("roomId")
  const username = searchParams.get("username")

  const socket = useRef<Socket | null>(null)

  // Backend health state
  const [isBackendReady, setIsBackendReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [backendError, setBackendError] = useState<string | null>(null)

  // --- Timer and Completion state ---
  const [questionTimers, setQuestionTimers] = useState<Record<number, number>>({})
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set())

  // Rest of states
  const [isProblemMinimized, setIsProblemMinimized] = useState(false)
  const [code, setCode] = useState("// Write your solution here\n")
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestCase[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [problem, setProblem] = useState<{
    title: string
    description: string
    example: string
    testCases: TestCase[]
    difficulty: "Easy" | "Medium" | "Hard"
    constraints?: string[]
    functionMetadata?: FunctionMetadata
    _id?: string
  } | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [notification, setNotification] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  })
  const [localStatus, setLocalStatus] = useState<Participant["status"]>("idle")
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const workingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const localStatusRef = useRef<Participant["status"]>(localStatus)
  const [startTimes, setStartTimes] = useState<Record<number, number>>({})

  type Language = "cpp" | "python" | "java" | "javascript" | "c"
  const boilerplates: Record<Language, string> = {
    cpp: problem?.functionMetadata?.signature ?? "// Write your solution here",
    python: problem?.functionMetadata?.signature ?? "# Write your solution here",
    java: problem?.functionMetadata?.signature ?? "// Write your solution here",
    javascript: problem?.functionMetadata?.signature ?? "// Write your solution here",
    c: problem?.functionMetadata?.signature ?? "// Write your solution here",
  }

  const languageMap: Record<string, number> = {
    cpp: 54, // C++ (G++)
    c: 50, // C (GCC)
    java: 62,
    python: 71,
    javascript: 63,
  }

  function normalizeOutput(output: string): string {
    return output
      .replace(/\r/g, "") // Remove carriage returns
      .replace(/\s+/g, " ") // Collapse all whitespace (tabs, newlines) to single space
      .trim() // Remove leading/trailing spaces
  }

  const [selectedLanguage, setSelectedLanguage] = useState<string>("cpp")
  const [editorTheme, setEditorTheme] = useState("vs-light")

  // Backend health check on component mount
  useEffect(() => {
    const checkHealth = async () => {
      setIsLoading(true)
      try {
        const isHealthy = await checkBackendHealth()
        setIsBackendReady(isHealthy)
        if (!isHealthy) {
          setBackendError("Backend service is not available. Please wait while it's being deployed.")
        }
      } catch (error) {
        console.error("Backend health check failed:", error)
        setIsBackendReady(false)
        setBackendError("Failed to connect to backend service.")
      } finally {
        setIsLoading(false)
      }
    }

    checkHealth()
  }, [])

  // Theme detection useEffect
  useEffect(() => {
    const updateTheme = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches
      setEditorTheme(isDark ? "vs-dark" : "vs-light")
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", updateTheme)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener("change", updateTheme)
    }
  }, [])

  useEffect(() => {
    localStatusRef.current = localStatus
  }, [localStatus])

  useEffect(() => {
    setStartTimes((prev) => {
      if (prev[currentQuestionIndex] !== undefined) return prev
      return { ...prev, [currentQuestionIndex]: Date.now() }
    })
  }, [currentQuestionIndex])

  // Emit status helper
  const emitStatusUpdate = (status: Participant["status"]) => {
    if (socket.current && roomId && username) {
      socket.current.emit("update-status", {
        roomId,
        username,
        status,
      })
      setLocalStatus(status)
      localStatusRef.current = status
    }
  }

  // Initialize timer on question load
  useEffect(() => {
    if (!problem) return

    if (completedQuestions.has(currentQuestionIndex)) {
      setQuestionTimers((prev) => ({ ...prev, [currentQuestionIndex]: 0 }))
      return
    }

    setQuestionTimers((prev) => {
      if (prev[currentQuestionIndex] !== undefined) return prev

      let totalSeconds = 0
      switch (problem.difficulty) {
        case "Easy":
          totalSeconds = 20 * 60
          break
        case "Medium":
          totalSeconds = 40 * 60
          break
        case "Hard":
          totalSeconds = 90 * 60
          break
      }
      return { ...prev, [currentQuestionIndex]: totalSeconds }
    })

    const signature = problem.functionMetadata?.signature ?? ""
    const languagePrompt = selectedLanguage === "python" ? "# Write your solution here" : "// Write your solution here"

    const joined = signature ? `${signature}\n${languagePrompt}` : languagePrompt
    console.log("💡 Function Signature:", problem?.functionMetadata?.signature)

    setCode(joined)
    setTestResults([])
    setTestCases(problem.testCases)
  }, [problem, currentQuestionIndex, completedQuestions, selectedLanguage])

  // Timer countdown
  useEffect(() => {
    if (completedQuestions.has(currentQuestionIndex)) return

    const remainingTime = questionTimers[currentQuestionIndex]
    if (remainingTime === undefined || remainingTime <= 0) return

    const timerId = setInterval(() => {
      setQuestionTimers((prev) => {
        const newTime = (prev[currentQuestionIndex] ?? 0) - 1
        if (newTime <= 0) {
          clearInterval(timerId)
        }
        return { ...prev, [currentQuestionIndex]: newTime > 0 ? newTime : 0 }
      })
    }, 1000)

    return () => clearInterval(timerId)
  }, [questionTimers, currentQuestionIndex, completedQuestions])

  // Navigation controls
  const canNavigateNext = () => {
    const timerDone = (questionTimers[currentQuestionIndex] ?? 0) === 0
    const completed = completedQuestions.has(currentQuestionIndex)
    return timerDone || completed
  }

  const canNavigatePrev = () => {
    if (currentQuestionIndex === 0) return false
    return !completedQuestions.has(currentQuestionIndex - 1)
  }

  const handleNext = () => {
    if (!canNavigateNext()) {
      alert("Complete the current question or wait for timer to expire before moving on.")
      return
    }
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      setProblem(questions[nextIndex])
    }
  }

  const handlePrevious = () => {
    if (!canNavigatePrev()) {
      alert("You cannot go back to completed questions.")
      return
    }
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1
      setCurrentQuestionIndex(prevIndex)
      setProblem(questions[prevIndex])
    }
  }

  // Participant time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()

      setParticipants((prev) =>
        prev.map((p) => {
          if (!p.joinTime) return { ...p, timeSpent: "00:00" }

          const elapsedMs = now - p.joinTime
          const seconds = Math.floor(elapsedMs / 1000)
          const minutes = Math.floor(seconds / 60)
          const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`

          return { ...p, timeSpent: formatted }
        }),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Socket connection and event handlers
  useEffect(() => {
    if (!roomId || !username || !isBackendReady) return

    console.log("🔌 Connecting to Socket.IO at:", config.SOCKET_URL)
    socket.current = io(config.SOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
    })

    socket.current.on("connect", () => {
      console.log("✅ Socket connected successfully")
      setBackendError(null)
    })

    socket.current.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error)
      setBackendError("Failed to connect to real-time service. Some features may not work.")
      setNotification({
        message: "Connection issues detected. Trying to reconnect...",
        visible: true,
      })
      setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 5000)
    })

    socket.current.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason)
      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        socket.current?.connect()
      }
    })

    socket.current.emit("join-room", { roomId, username })

    socket.current.on("user-joined", (newUser: string) => {
      setNotification({ message: `${newUser} joined the room`, visible: true })
      setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 3000)
    })

    socket.current.on("user-left", (leftUser: string) => {
      setNotification({ message: `${leftUser} left the room`, visible: true })
      setTimeout(() => setNotification({ message: "", visible: false }), 3000)
    })

    socket.current.on("participants-update", (updated: any[]) => {
      setParticipants((prevParticipants) =>
        updated.map((u) => {
          const existing = prevParticipants.find((p) => p.id === u.id)
          return {
            id: u.id,
            name: u.name,
            status: u.status,
            score: u.score ?? 0,
            joinTime: u.joinTime,
            timeSpent: existing?.timeSpent ?? "00:00",
            scoresPerQuestion: u.scoresPerQuestion ?? {},
          }
        }),
      )
    })

    socket.current.on("score-updated", (updatedScores: { id: string; score: number }[]) => {
      setParticipants((prev) =>
        prev.map((participant) => {
          const updated = updatedScores.find((u) => u.id === participant.id)
          return updated ? { ...participant, score: updated.score } : participant
        }),
      )
    })

    socket.current.on("room-questions", (receivedQuestions: ReceivedQuestion[]) => {
      const difficultyOrder: Record<"Easy" | "Medium" | "Hard", number> = {
        Easy: 0,
        Medium: 1,
        Hard: 2,
      }

      const transformedQuestions = receivedQuestions.map((q: ReceivedQuestion) => {
        const example = `Input: ${JSON.stringify(q.exampleInput)}\nOutput: ${JSON.stringify(q.exampleOutput)}`

        const transformedTestCases: TestCase[] = q.testCases.map((tc, idx) => ({
          id: idx,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
        }))

        return {
          _id: typeof q._id === "object" ? q._id.$oid : q._id,
          title: q.title,
          description: q.description,
          difficulty: q.difficulty,
          constraints: q.constraints,
          functionMetadata: q.functionMetadata,
          example: example,
          testCases: transformedTestCases,
        }
      })

      const sorted = transformedQuestions.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])

      if (sorted.length > 0) {
        setQuestions(sorted)
        setCurrentQuestionIndex(0)
        setProblem(sorted[0])
        setTestCases(sorted[0].testCases)
      }

      console.log("🚀 Transformed & Received Questions:", sorted)
    })

    return () => {
      socket.current?.disconnect()
    }
  }, [roomId, username, isBackendReady])

  const handleCodeTyping = () => {
    if (localStatusRef.current !== "coding") {
      emitStatusUpdate("coding")
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    typingTimeoutRef.current = setTimeout(() => {
      if (localStatusRef.current === "coding") {
        emitStatusUpdate("working")
      }
    }, 2000)
  }

  // User activity tracking
  useEffect(() => {
    if (!socket.current) return

    const handleUserActivity = () => {
      const currentStatus = localStatusRef.current

      if (currentStatus !== "working" && currentStatus !== "coding") {
        emitStatusUpdate("working")
      }

      if (workingTimeoutRef.current) clearTimeout(workingTimeoutRef.current)

      workingTimeoutRef.current = setTimeout(() => {
        if (localStatusRef.current !== "idle") {
          emitStatusUpdate("idle")
        }
      }, 10000)
    }

    window.addEventListener("mousemove", handleUserActivity)
    window.addEventListener("scroll", handleUserActivity)

    return () => {
      window.removeEventListener("mousemove", handleUserActivity)
      window.removeEventListener("scroll", handleUserActivity)

      if (workingTimeoutRef.current) clearTimeout(workingTimeoutRef.current)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [roomId, username])

  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score)

  const getStatusBadge = (status: Participant["status"]) => {
    switch (status) {
      case "coding":
        return (
          <Badge variant="default" className="bg-blue-500">
            Coding...
          </Badge>
        )
      case "working":
        return <Badge variant="secondary">Working on it...</Badge>
      case "submitted":
        return (
          <Badge variant="default" className="bg-green-500">
            Submitted
          </Badge>
        )
      case "idle":
        return <Badge variant="outline">Idle</Badge>
    }
  }

  // Updated handleRunCode function with environment variables
  const handleRunCode = async () => {
    if (!problem?.testCases || !code) {
      console.warn("⚠️ Missing problem test cases or code")
      return
    }

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) {
      console.error("❌ No current question found")
      alert("Error: No question data available. Please refresh the page.")
      return
    }

    console.log("🔍 Debug Info:")
    console.log("- Current Question Index:", currentQuestionIndex)
    console.log("- Current Question ID:", currentQuestion._id)
    console.log("- Selected Language:", selectedLanguage)
    console.log("- Language ID:", languageMap[selectedLanguage])
    console.log("- Code Length:", code.length)
    console.log("- API URL:", config.API_BASE_URL)

    setIsRunning(true)

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/compile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageMap[selectedLanguage],
          questionId: currentQuestion._id,
          stdin: "",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📤 Judge0 Response:", data)

      if (data.status?.id === 3) {
        const output = normalizeOutput(data.stdout || "")
        console.log("✅ Code executed successfully. Output:", output)

        let outputLines
        if (
          problem.functionMetadata?.returnType?.includes("vector") ||
          problem.functionMetadata?.returnType?.includes("ListNode")
        ) {
          outputLines = output.split(/\s+/).filter((line) => line.trim() && line.includes("["))
        } else {
          // universal scalar parser:
          outputLines = output
            .replace(/\n/g, " ") // replace newlines with space
            .split(" ") // split by space
            .map((str) => str.trim())
            .filter((str) => str.length > 0)
        }

        console.log("🔍 Parsed output lines:", outputLines)

        const normalizeArrayOutput = (str: string): string => {
          return str
            .replace(/\s+/g, "") // remove spaces
            .replace(/[\r\n]+/g, "") // remove line breaks
        }

        const results: TestCase[] = problem.testCases.map((testCase, index) => {
          const actualOutput = outputLines[index] || ""

          const expectedOutput = normalizeArrayOutput(JSON.stringify(testCase.expectedOutput))
          const actualNormalized = normalizeArrayOutput(actualOutput)

          const passed = actualNormalized === expectedOutput

          console.log(`🔍 Test Case ${index + 1}:`, {
            expected: expectedOutput,
            actual: actualNormalized,
            passed,
          })

          return {
            ...testCase,
            passed,
          }
        })

        setTestResults(results)

        console.log("✅ FINAL TEST RESULTS:", results)
      } else {
        console.error("❌ Code execution failed:", data)

        let errorMessage = "Code execution failed."
        if (data.compile_output) {
          errorMessage = `Compilation Error: ${data.compile_output}`
        } else if (data.stderr) {
          errorMessage = `Runtime Error: ${data.stderr}`
        } else if (data.status?.description) {
          errorMessage = `Error: ${data.status.description}`
        }

        alert(errorMessage)

        const failedResults: TestCase[] = problem.testCases.map((testCase) => ({
          ...testCase,
          passed: false,
        }))
        setTestResults(failedResults)
      }
    } catch (error) {
      console.error("❌ Network/API Error:", error)
      alert("Failed to execute code. Please check your connection and try again.")

      const failedResults: TestCase[] = problem.testCases.map((testCase) => ({
        ...testCase,
        passed: false,
      }))
      setTestResults(failedResults)
    } finally {
      setIsRunning(false)
    }
  }

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleSubmitCode = () => {
    if (!problem?.testCases || !socket.current) return

    const allPassed = testResults.length > 0 && testResults.every((tc) => tc.passed)
    if (!allPassed) {
      alert("All test cases must pass before submission.")
      return
    }

    const activeSocket = socket.current
    if (!activeSocket) return

    const participantId = activeSocket.id
    const participant = participants.find((p) => p.id === participantId)
    const timeSpent = participant?.timeSpent || "00:00"
    const [minStr] = timeSpent.split(":")
    const elapsedMinutes = Number.parseInt(minStr) || 0

    const score = calculateScore({
      difficulty: problem.difficulty.toLowerCase() as Difficulty,
      passedTestCases: testResults.filter((tc) => tc.passed).length,
      totalTestCases: testResults.length,
      wrongAttempts: 0,
      elapsedMinutes,
    })

    console.log("🧮 Calculated Score:", score)

    activeSocket.emit("update-score", {
      roomId,
      questionIndex: currentQuestionIndex,
      passedTestCases: testResults.filter((tc) => tc.passed).length,
      wrongAttempts: 0,
      elapsedMinutes,
    })

    setCompletedQuestions((prev) => new Set(prev).add(currentQuestionIndex))
    setQuestionTimers((prev) => ({ ...prev, [currentQuestionIndex]: 0 }))

    alert("✅ Code submitted successfully!")
  }

  const handleLeaveRoom = () => {
    if (!socket.current || !roomId || !username) return

    socket.current.emit("leave-room", {
      roomId,
      username,
    })

    socket.current.disconnect()
    router.push("/")
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Connecting to coding room...</p>
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
            {backendError || "The backend service is not available yet. Please wait while it's being deployed."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => router.push("/")} variant="default">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 relative overflow-y-auto custom-scroll-hide transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Enhanced Top Info Bar */}
      <div className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-white/20 dark:border-gray-700/20 px-6 py-4">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <span className="font-mono text-sm bg-white/60 dark:bg-gray-800/60 px-4 py-1 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm text-gray-900 dark:text-gray-100">
              ⏱️{" "}
              {questionTimers[currentQuestionIndex] !== undefined
                ? formatTime(questionTimers[currentQuestionIndex])
                : "00:00"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{username?.charAt(0) || "A"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{username || "Anonymous"}</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">Competitor</div>
              </div>
            </div>
            <Button
              onClick={handleLeaveRoom}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all duration-300"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Leave Room
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Badge
              variant="outline"
              className="text-sm font-mono border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              Room id: {roomId || "N/A"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-1 relative z-10">
        {/* Enhanced Left Sidebar */}
        <div className="w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-r border-white/20 dark:border-gray-700/20 flex flex-col shadow-xl">
          {/* Enhanced Leaderboard */}
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <h2 className="font-bold text-xl text-gray-900 dark:text-gray-100">Leaderboard</h2>
            </div>
            <ScrollArea className="h-48 custom-scroll-hide">
              <div className="space-y-3">
                {sortedParticipants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700"
                        : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                            : index === 1
                              ? "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                              : index === 2
                                ? "bg-orange-300 dark:bg-orange-700 text-orange-700 dark:text-orange-300"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {index === 0 ? <Crown className="h-4 w-4" /> : `#${index + 1}`}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{participant.name}</span>
                    </div>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{participant.score}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Enhanced Participants */}
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="font-bold text-xl text-gray-900 dark:text-gray-100">
                Participants ({participants.length})
              </h2>
            </div>
            <ScrollArea className="h-full custom-scroll-hide">
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{participant.name}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span className="font-mono">{participant.timeSpent}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(participant.status)}
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Score: <span className="text-blue-600 dark:text-blue-400 font-bold">{participant.score}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Enhanced Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Problem Statement */}
          <Card className="m-6 mb-4 shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl text-gray-900 dark:text-gray-100">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <Code className="h-5 w-5 text-white" />
                  </div>
                  Problem: {problem ? problem.title : "Loading..."}
                  <Badge
                    variant="outline"
                    className="ml-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    {currentQuestionIndex + 1} of {questions.length}
                  </Badge>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsProblemMinimized(!isProblemMinimized)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
                >
                  {isProblemMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {!isProblemMinimized && (
              <CardContent className="pt-0">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed text-base">
                    {problem?.description ?? "Waiting for problem description..."}
                  </p>
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Example:</p>
                    <pre className="font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {problem?.example ?? ""}
                    </pre>

                    {problem?.constraints && problem.constraints.length > 0 && (
                      <>
                        <p className="font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">Constraints:</p>
                        <ul className="list-disc pl-6 text-sm text-gray-700 dark:text-gray-300">
                          {problem.constraints.map((constraint: string, index: number) => (
                            <li key={index}>{constraint}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="px-6 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105 transition-all duration-300 text-gray-900 dark:text-gray-100"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Enhanced Code Editor and Test Cases */}
          <div className="flex flex-1 flex-col mx-6 mb-6 gap-6">
            {/* Code Editor */}
            <Card className="flex-1 shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center w-full">
                  <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <Code className="h-5 w-5 text-white" />
                    </div>
                    Code Editor
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden min-h-[300px]">
                  <Editor
                    height="300px"
                    language={selectedLanguage === "cpp" ? "cpp" : selectedLanguage}
                    value={code}
                    onChange={(value) => {
                      setCode(value || "")
                      handleCodeTyping()
                    }}
                    theme={editorTheme}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "JetBrains Mono, Consolas, Monaco, monospace",
                      lineNumbers: "on",
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: "on",
                      contextmenu: true,
                      selectOnLineNumbers: true,
                      glyphMargin: false,
                      folding: true,
                      lineDecorationsWidth: 10,
                      lineNumbersMinChars: 3,
                      renderLineHighlight: "line",
                      bracketPairColorization: {
                        enabled: true,
                      },
                      suggest: {
                        showKeywords: true,
                        showSnippets: true,
                      },
                      quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: false,
                      },
                    }}
                    loading={
                      <div className="flex items-center justify-center h-[300px] text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <span className="ml-2">Loading editor...</span>
                      </div>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Test Cases */}
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    Test Cases
                  </CardTitle>
                  <Button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    {isRunning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Code
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      Run your code to see test results.
                    </p>
                  )}
                  {testResults.map((tc, index) => (
                    <div
                      key={tc.id || index}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        tc.passed
                          ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                          : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-mono text-sm mb-2 text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">Input:</span> {JSON.stringify(tc.input, null, 2)}
                          </p>
                          <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">Expected:</span>{" "}
                            {JSON.stringify(tc.expectedOutput, null, 2)}
                          </p>
                        </div>
                        <div className="ml-4">
                          {tc.passed ? (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-semibold text-sm">Passed</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                              <XCircle className="h-5 w-5" />
                              <span className="font-semibold text-sm">Failed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-6 w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] text-base font-semibold"
                  onClick={handleSubmitCode}
                  disabled={isRunning}
                >
                  <Send className="h-5 w-5 mr-2" />
                  Submit Code
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Notification */}
      <div
        className={`fixed top-24 right-6 w-80 max-w-full p-4 rounded-2xl shadow-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white flex items-start gap-3 transform transition-all duration-500 ease-out border border-purple-400/30 backdrop-blur-sm z-[9999]
          ${notification.visible && notification.message ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="w-6 h-6 flex-shrink-0 bg-white/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1 text-sm leading-relaxed">{notification.message}</div>

        <button
          onClick={() => setNotification({ ...notification, visible: false })}
          className="text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg p-1 transition-colors duration-200"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
