import { useState, useRef, useEffect, KeyboardEvent, useCallback } from "react"
import { DeviceInfo, executeShellCommand } from "@/tauri-commands"
import { Terminal, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TerminalEntry {
  type: 'command' | 'output' | 'error'
  content: string
  timestamp: Date
}

interface ShellTerminalProps {
  selectedDevice: DeviceInfo
}

export function ShellTerminal({ selectedDevice }: ShellTerminalProps) {
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      type: 'output',
      content: `Connected to ${selectedDevice.model} (${selectedDevice.serial_no})`,
      timestamp: new Date()
    },
  ])
  const [currentCommand, setCurrentCommand] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isExecuting, setIsExecuting] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [entries])

  // Focus input on mount and when clicking terminal
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const addEntry = (type: TerminalEntry['type'], content: string) => {
    setEntries(prev => [...prev, {
      type,
      content,
      timestamp: new Date()
    }])
  }

  const executeCommand = async (command: string) => {
    if (!command.trim()) return

    // Add command to entries
    addEntry('command', `$ ${command}`)
    
    // Add to history
    setCommandHistory(prev => [...prev, command])
    setHistoryIndex(-1)
    
    // Handle built-in commands
    if (command.trim() === 'clear') {
      setEntries([{
        type: 'output',
        content: `Connected to ${selectedDevice.model} (${selectedDevice.serial_no})`,
        timestamp: new Date()
      }])
      setCurrentCommand('')
      return
    }

    setIsExecuting(true)
    
    try {
      const output = await executeShellCommand(selectedDevice.serial_no, command)
      if (output.trim()) {
        // Handle newlines by splitting output into separate entries
        const lines = output.trim().split('\n')
        lines.forEach(line => {
          addEntry('output', line)
        })
      } else {
        addEntry('output', '(no output)')
      }
    } catch (error) {
      addEntry('error', `Error: ${error}`)
    } finally {
      setIsExecuting(false)
    }
    
    setCurrentCommand('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      executeCommand(currentCommand)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex === -1) {
        // Already at the bottom, do nothing
        return
      }
      const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : -1
      setHistoryIndex(newIndex)
      setCurrentCommand(newIndex === -1 ? '' : commandHistory[newIndex])
    } else {
      // Reset history index when user types something new
      if (historyIndex !== -1) {
        setHistoryIndex(-1)
      }
    }
  }

  const clearTerminal = () => {
    setEntries([{
      type: 'output',
      content: `Connected to ${selectedDevice.model} (${selectedDevice.serial_no})`,
      timestamp: new Date()
    }])
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            ADB Shell
          </h2>
          <p className="text-muted-foreground">
            Interactive shell access to {selectedDevice.model}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={clearTerminal}
          disabled={isExecuting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="flex-[1_1_0] bg-black/95 rounded-lg p-4 font-mono text-sm overflow-y-auto border"
        onClick={() => inputRef.current?.focus()}
      >
        {entries.map((entry, index) => (
          <div key={index} className="mb-1">
            <span className={
              entry.type === 'command' 
                ? 'text-green-400 font-medium' 
                : entry.type === 'error'
                ? 'text-red-400'
                : 'text-gray-200'
            }>
              {entry.content}
            </span>
          </div>
        ))}
        
        {/* Current command line with inline input */}
        <div className="flex items-center">
          <span className="text-green-400 mr-2">$</span>
          <input
            ref={inputRef}
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            className="bg-transparent text-gray-200 flex-[1_1_0] outline-none border-none p-0 font-mono text-sm"
            placeholder={isExecuting ? "" : "Enter command..."}
            autoComplete="off"
            spellCheck={false}
          />
          {isExecuting && <Loader2 className="h-4 w-4 ml-2 animate-spin text-gray-400" />}
        </div>
      </div>
    </div>
  )
}