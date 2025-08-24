import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type DeviceInfo } from "@/tauri-commands"
import { useDeviceLogs } from "@/hooks/useDeviceDataQueries"
import { 
  Terminal, 
  Search,
  Play,
  Pause,
  RefreshCw,
  Download,
  Trash2,
  Filter
} from "lucide-react"

interface LogcatViewerProps {
  selectedDevice?: DeviceInfo
}

export function LogcatViewer({ selectedDevice }: LogcatViewerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [lineCount, setLineCount] = useState(100)
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [logLevel, setLogLevel] = useState<string>("all")

  // Use TanStack Query for log operations
  const {
    data: logs = "",
    isLoading,
    error,
    refetch
  } = useDeviceLogs(selectedDevice, lineCount, isAutoRefresh, logLevel === "all" ? undefined : logLevel)

  // Parse and filter logs
  const filteredLogs = useMemo(() => {
    if (!logs) return []
    
    const logLines = logs.split('\n').filter(line => line.trim())
    
    if (!searchTerm) return logLines
    
    return logLines.filter(line => 
      line.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [logs, searchTerm])

  const getLogLevel = (line: string) => {
    const match = line.match(/\s([VDIWEF])\//)
    if (!match) return null
    
    const level = match[1]
    switch (level) {
      case 'V': return { label: 'VERBOSE', variant: 'outline' as const }
      case 'D': return { label: 'DEBUG', variant: 'secondary' as const }
      case 'I': return { label: 'INFO', variant: 'default' as const }
      case 'W': return { label: 'WARN', variant: 'outline' as const }
      case 'E': return { label: 'ERROR', variant: 'destructive' as const }
      case 'F': return { label: 'FATAL', variant: 'destructive' as const }
      default: return null
    }
  }

  const formatLogLine = (line: string) => {
    // Basic log formatting - this could be enhanced further
    return line.replace(/^(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})/, '$1')
  }

  const downloadLogs = () => {
    if (!logs) return
    
    const blob = new Blob([logs], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logcat-${selectedDevice?.serial_no}-${new Date().toISOString()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    // For now, just refetch to get fresh logs
    // In a real implementation, you might want to call an ADB clear command
    refetch()
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Logcat Viewer</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={isAutoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            >
              {isAutoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadLogs}
              disabled={!logs}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 min-w-fit">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={logLevel} onValueChange={setLogLevel}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="V">Verbose</SelectItem>
                  <SelectItem value="D">Debug</SelectItem>
                  <SelectItem value="I">Info</SelectItem>
                  <SelectItem value="W">Warning</SelectItem>
                  <SelectItem value="E">Error</SelectItem>
                  <SelectItem value="F">Fatal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 min-w-fit">
              <span className="text-sm text-muted-foreground">Lines:</span>
              <span className="text-sm font-mono min-w-[3ch]">{lineCount}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground min-w-fit">Log Count:</span>
            <Slider
              value={[lineCount]}
              onValueChange={(value) => setLineCount(value[0])}
              max={1000}
              min={50}
              step={50}
              className="flex-1"
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 border rounded-lg overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 p-3 border-b bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {filteredLogs.length} lines
                {searchTerm && ` (filtered from ${logs.split('\n').length})`}
              </span>
              {isAutoRefresh && (
                <Badge variant="outline" className="text-xs">
                  Auto-refresh: 2s
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
            {isLoading && filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading logs...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Failed to load logs</p>
                <p className="text-xs mt-1">
                  {error instanceof Error ? error.message : "Unknown error"}
                </p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{searchTerm ? "No matching log entries" : "No log entries"}</p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredLogs.map((line, index) => {
                  const logLevel = getLogLevel(line)
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-2 py-0.5 hover:bg-muted/50 group"
                    >
                      <span className="text-muted-foreground text-xs min-w-[3ch] opacity-50 group-hover:opacity-100">
                        {index + 1}
                      </span>
                      {logLevel && (
                        <Badge variant={logLevel.variant} className="text-xs px-1 py-0 h-auto">
                          {logLevel.label[0]}
                        </Badge>
                      )}
                      <span className="flex-1 leading-relaxed break-all">
                        {formatLogLine(line)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
