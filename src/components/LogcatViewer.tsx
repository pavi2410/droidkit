import { useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Terminal, 
  RefreshCw,
  Search,
  Download,
  Trash2
} from "lucide-react"

export function LogcatViewer() {
  const [logs, setLogs] = useState<string>("")
  const [filteredLogs, setFilteredLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [lineCount, setLineCount] = useState(100)

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const logOutput = await invoke<string>("get_logcat", { lines: lineCount })
      setLogs(logOutput)
      const lines = logOutput.split('\n').filter(line => line.trim())
      setFilteredLogs(lines)
    } catch (error) {
      console.error("Failed to load logcat:", error)
      setLogs("")
      setFilteredLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterLogs = (term: string) => {
    if (!term.trim()) {
      setFilteredLogs(logs.split('\n').filter(line => line.trim()))
      return
    }
    
    const lines = logs.split('\n').filter(line => line.trim())
    const filtered = lines.filter(line => 
      line.toLowerCase().includes(term.toLowerCase())
    )
    setFilteredLogs(filtered)
  }

  const getLogLevel = (line: string) => {
    // Extract log level (V, D, I, W, E, F)
    const match = line.match(/\s([VDIWEF])\//)
    return match ? match[1] : 'I'
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'V': return 'text-gray-500'      // Verbose
      case 'D': return 'text-blue-500'      // Debug
      case 'I': return 'text-green-500'     // Info
      case 'W': return 'text-yellow-500'    // Warning
      case 'E': return 'text-red-500'       // Error
      case 'F': return 'text-purple-500'    // Fatal
      default: return 'text-gray-700'
    }
  }

  const exportLogs = () => {
    if (!logs) return
    
    const blob = new Blob([logs], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logcat_${new Date().getTime()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    setLogs("")
    setFilteredLogs([])
    setSearchTerm("")
  }

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    filterLogs(searchTerm)
  }, [searchTerm, logs])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Logcat Viewer</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={lineCount}
              onChange={(e) => setLineCount(parseInt(e.target.value) || 100)}
              className="w-20"
              min="10"
              max="1000"
              placeholder="Lines"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              disabled={!logs}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
              disabled={!logs}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary" className="text-xs">
            {filteredLogs.length} lines
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No logs found</p>
              <p className="text-sm mt-1">Try refreshing or check device connection</p>
            </div>
          ) : (
            <div className="p-3">
              <div className="font-mono text-xs space-y-1 bg-black text-green-400 p-3 rounded max-h-80 overflow-y-auto">
                {filteredLogs.map((line, index) => {
                  const level = getLogLevel(line)
                  return (
                    <div 
                      key={index} 
                      className={`${getLogLevelColor(level)} whitespace-pre-wrap`}
                    >
                      {line}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}