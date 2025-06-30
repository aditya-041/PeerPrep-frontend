export type Difficulty = "easy" | "medium" | "hard"

interface ScoreParams {
  difficulty: Difficulty
  passedTestCases: number
  totalTestCases: number
  wrongAttempts: number
  elapsedMinutes: number
}

export function calculateScore({
  difficulty,
  passedTestCases,
  totalTestCases,
  wrongAttempts,
  elapsedMinutes,
}: ScoreParams): number {
  // Base score by difficulty
  const baseScores: Record<Difficulty, number> = {
    easy: 100,
    medium: 200,
    hard: 400,
  }

  // Time limits by difficulty (in minutes)
  const timeLimits: Record<Difficulty, number> = {
    easy: 20,
    medium: 40,
    hard: 90,
  }

  // Calculate base score
  const baseScore = baseScores[difficulty]

  // Calculate completion percentage
  const completionPercentage = passedTestCases / totalTestCases

  // Calculate time bonus (higher if completed faster)
  const timeLimit = timeLimits[difficulty]
  const timeRatio = Math.min(1, elapsedMinutes / timeLimit)
  const timeBonus = 1 - timeRatio * 0.5 // Time bonus ranges from 0.5 to 1.0

  // Calculate penalty for wrong attempts
  const wrongAttemptPenalty = Math.max(0, 1 - wrongAttempts * 0.1) // Each wrong attempt reduces score by 10%

  // Calculate final score
  const finalScore = Math.round(baseScore * completionPercentage * timeBonus * wrongAttemptPenalty)

  return finalScore
}
