"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Code2 } from "lucide-react"

type Language = "cpp" | "python" | "java" | "javascript" | "c"

const languages = [
  { value: "cpp", label: "C++", icon: "⚡" },
  { value: "python", label: "Python", icon: "🐍" },
  { value: "java", label: "Java", icon: "☕" },
  { value: "javascript", label: "JavaScript", icon: "🟨" },
  { value: "c", label: "C", icon: "⚙️" },
]

interface LanguageSelectorProps {
  selectedLanguage: Language
  onLanguageChange: (language: Language) => void
}

export function LanguageSelector({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) {
  const selectedLang = languages.find((lang) => lang.value === selectedLanguage)

  return (
    <Select value={selectedLanguage} onValueChange={(value) => onLanguageChange(value as Language)}>
      <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800/70 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-purple-400" />
          <SelectValue placeholder="Select Language">
            {selectedLang && (
              <div className="flex items-center gap-2">
                <span className="text-sm">{selectedLang.icon}</span>
                <span>{selectedLang.label}</span>
              </div>
            )}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
        {languages.map((language) => (
          <SelectItem
            key={language.value}
            value={language.value}
            className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer transition-colors duration-150"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{language.icon}</span>
              <span className="font-medium">{language.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
