import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { Socket } from 'socket.io-client';
import 'xterm/css/xterm.css';

interface XTermConsoleProps {
  serverId: string;
  socket: Socket | null;
  connected: boolean;
  className?: string;
}

export default function XTermConsole({ serverId, socket, connected, className = '' }: XTermConsoleProps) {
  const terminalRef = useRef<globalThis.HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new Terminal({
      theme: {
        background: '#0f0f0f',
        foreground: '#ffffff',
        cursor: '#ffffff',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#4d4d4d',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#d6acff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff',
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      rightClickSelectsWord: true,
      convertEol: true,
    });

    // Create fit addon
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    // Load addons
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // Open terminal
    terminal.open(terminalRef.current);

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Welcome message
    terminal.writeln('\r\n\x1b[1;32m╔═══════════════════════════════════════════════════════════════════════════════╗\x1b[0m');
    terminal.writeln('\x1b[1;32m║                          CTRL+ALT+PLAY Server Console                        ║\x1b[0m');
    terminal.writeln('\x1b[1;32m╚═══════════════════════════════════════════════════════════════════════════════╝\x1b[0m');
    terminal.writeln('');
    terminal.writeln('\x1b[1;36mConnecting to server console...\x1b[0m');
    terminal.writeln('');

    // Fit to container
    setTimeout(() => {
      fitAddon.fit();
      setIsReady(true);
    }, 100);

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).addEventListener?.('resize', handleResize);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).removeEventListener?.('resize', handleResize);
      terminal.dispose();
    };
  }, []);

  // Handle socket events
  useEffect(() => {
    if (!socket || !connected || !xtermRef.current || !isReady) return;

    const terminal = xtermRef.current;

    // Join server console room
    socket.emit('console:join', { serverId });

    // Handle console output
    const handleConsoleOutput = (data: { message: string; timestamp: string; type?: string }) => {
      const timestamp = new Date(data.timestamp).toLocaleTimeString();
      let colorCode = '';
      
      switch (data.type) {
        case 'error':
          colorCode = '\x1b[1;31m'; // Bright red
          break;
        case 'warning':
          colorCode = '\x1b[1;33m'; // Bright yellow
          break;
        case 'info':
          colorCode = '\x1b[1;36m'; // Bright cyan
          break;
        case 'success':
          colorCode = '\x1b[1;32m'; // Bright green
          break;
        default:
          colorCode = '\x1b[0m'; // Default
      }

      terminal.writeln(`\x1b[90m[${timestamp}]\x1b[0m ${colorCode}${data.message}\x1b[0m`);
    };

    // Handle command execution feedback
    const handleCommandResponse = (data: { success: boolean; message?: string; error?: string }) => {
      if (data.success) {
        if (data.message) {
          terminal.writeln(`\x1b[1;32m✓ ${data.message}\x1b[0m`);
        }
      } else {
        terminal.writeln(`\x1b[1;31m✗ ${data.error || 'Command failed'}\x1b[0m`);
      }
    };

    // Handle server status changes
    const handleServerStatus = (data: { serverId: string; status: string; message?: string }) => {
      if (data.serverId === serverId) {
        const timestamp = new Date().toLocaleTimeString();
        let statusColor = '';
        
        switch (data.status.toLowerCase()) {
          case 'starting':
            statusColor = '\x1b[1;33m'; // Yellow
            break;
          case 'running':
            statusColor = '\x1b[1;32m'; // Green
            break;
          case 'stopping':
            statusColor = '\x1b[1;35m'; // Magenta
            break;
          case 'stopped':
            statusColor = '\x1b[1;31m'; // Red
            break;
          default:
            statusColor = '\x1b[1;37m'; // White
        }

        terminal.writeln(`\x1b[90m[${timestamp}]\x1b[0m ${statusColor}Server status: ${data.status.toUpperCase()}\x1b[0m`);
        if (data.message) {
          terminal.writeln(`\x1b[90m[${timestamp}]\x1b[0m \x1b[36m${data.message}\x1b[0m`);
        }
      }
    };

    // Handle connection status
    const handleConnectionStatus = (data: { connected: boolean }) => {
      const timestamp = new Date().toLocaleTimeString();
      if (data.connected) {
        terminal.writeln(`\x1b[90m[${timestamp}]\x1b[0m \x1b[1;32m✓ Connected to server console\x1b[0m`);
        terminal.write('\r\n\x1b[1;32m$\x1b[0m ');
      } else {
        terminal.writeln(`\x1b[90m[${timestamp}]\x1b[0m \x1b[1;31m✗ Disconnected from server console\x1b[0m`);
      }
    };

    // Set up event listeners
    socket.on('console:output', handleConsoleOutput);
    socket.on('console:command:response', handleCommandResponse);
    socket.on('server:status', handleServerStatus);
    socket.on('console:connection', handleConnectionStatus);

    // Handle terminal input
    const handleTerminalData = (data: string) => {
      // Handle special keys
      if (data === '\r') {
        // Enter key
        socket.emit('console:command:execute', { serverId });
        terminal.write('\r\n');
        return;
      }
      
      if (data === '\x7f' || data === '\b') {
        // Backspace
        socket.emit('console:command:backspace', { serverId });
        return;
      }

      if (data === '\x03') {
        // Ctrl+C
        socket.emit('console:command:interrupt', { serverId });
        terminal.write('^C\r\n\x1b[1;32m$\x1b[0m ');
        return;
      }

      // Regular character input
      socket.emit('console:command:input', { serverId, data });
    };

    terminal.onData(handleTerminalData);

    // Emit ready signal
    setTimeout(() => {
      handleConnectionStatus({ connected: true });
    }, 500);

    return () => {
      socket.off('console:output', handleConsoleOutput);
      socket.off('console:command:response', handleCommandResponse);
      socket.off('server:status', handleServerStatus);
      socket.off('console:connection', handleConnectionStatus);
      socket.emit('console:leave', { serverId });
    };
  }, [socket, connected, serverId, isReady]);

  // Handle container resize
  const handleResize = useCallback(() => {
    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
    }
  }, []);

  // Auto-resize on container changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ResizeObserver = (globalThis as any).ResizeObserver;
    if (ResizeObserver) {
      const resizeObserver = new ResizeObserver(handleResize);
      if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
      }
      return () => resizeObserver.disconnect();
    }
  }, [handleResize]);

  // Clear terminal method
  const clearTerminal = useCallback(() => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      const timestamp = new Date().toLocaleTimeString();
      xtermRef.current.writeln(`\x1b[90m[${timestamp}]\x1b[0m \x1b[1;36mTerminal cleared\x1b[0m`);
      xtermRef.current.write('\r\n\x1b[1;32m$\x1b[0m ');
    }
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={terminalRef} 
        className="w-full h-full bg-black rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {/* Terminal controls */}
      <div className="absolute top-2 right-2 flex space-x-2">
        <button
          onClick={clearTerminal}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          title="Clear terminal"
        >
          Clear
        </button>
        <button
          onClick={handleResize}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          title="Resize terminal"
        >
          Fit
        </button>
      </div>

      {/* Connection indicator */}
      <div className="absolute top-2 left-2 flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        <span className="text-xs text-gray-400">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
}
