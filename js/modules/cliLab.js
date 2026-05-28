/**
 * CliLabModule - Visual IDE split-screen and terminal emulator for Claude Code.
 * Displays interactive code tabs, Explorer trees, and real-time Git Diff animations.
 */
export class CliLabModule {
  constructor(appState) {
    this.appState = appState;
    this.container = null;
    this.activeClaudeSession = false;
    
    // Dynamic virtual code files
    this.files = {
      "CLAUDE.md": `# CLAUDE.md - Workspace Guidelines

Build command: pytest
Style guide: black

## Available Actions
- Run tests: \`pytest\`
- Format code: \`black .\`
`,
      "README.md": `# Circular Queue Buffer Project

A high-fidelity implementation of a thread-safe circular buffer written in Python.
Highly optimized for low-latency operations and verified using pytest modules.
`,
      "requirements.txt": `pytest>=7.4.0
black>=23.3.0
`,
      "main.py": `class QueueApp:
    def __init__(self):
        print("Initializing Queue Controller Core...")
        self.running = True
`,
      "buffer.py": `class CircularBuffer:
    def __init__(self, capacity):
        self.capacity = capacity
        self.buffer = [None] * capacity
        self.head = 0
        self.tail = 0

    def push(self, val):
        # Raw index increment without overflow protections
        self.buffer[self.tail] = val
        self.tail += 1

    def pop(self):
        # Raw pop operation
        val = self.buffer[self.head]
        self.head += 1
        return val
`,
      "test_buffer.py": `import pytest
from src.buffer import CircularBuffer

def test_basic_push_pop():
    buf = CircularBuffer(3)
    buf.push(10)
    buf.push(20)
    assert buf.pop() == 10
    assert buf.pop() == 20
`
    };

    this.activeFile = "buffer.py";
    this.fileTree = [
      { name: "src/", isDir: true, open: true, children: [
        { name: "main.py", isDir: false },
        { name: "buffer.py", isDir: false }
      ]},
      { name: "tests/", isDir: true, open: true, children: [
        { name: "test_buffer.py", isDir: false }
      ]},
      { name: "CLAUDE.md", isDir: false },
      { name: "README.md", isDir: false },
      { name: "requirements.txt", isDir: false }
    ];
  }

  mount(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
    this.renderFileTree();
    this.openFile(this.activeFile);
    this.focusInput();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="cli-grid-layout animate-fade-in">
        <!-- Left: Interactive Terminal -->
        <div class="glass-card terminal-cli">
          <div class="terminal-header">
            <span class="terminal-title">Claude Code Agentic CLI Shell (Simulated)</span>
            <div class="terminal-controls">
              <span class="dot red"></span>
              <span class="dot amber"></span>
              <span class="dot green"></span>
            </div>
          </div>

          <div class="cli-output-buffer" id="cli-buffer">
            <div class="cli-line system">Welcome to Claude Code CLI v0.8.4.</div>
            <div class="cli-line system">Type 'help' or '/help' to discover available workspace commands.</div>
            <div class="cli-line system">Active workspace: C:\\Users\\risha\\projects\\circular-queue</div>
            <div class="cli-line success">Try running 'claude run "fix buffer.py"' to watch Claude self-correct code!</div>
            <div class="cli-line space"></div>
          </div>

          <div class="cli-input-row">
            <span class="cli-prompt">C:\\Users\\risha\\projects\\circular-queue&gt;</span>
            <input type="text" id="cli-input" class="cli-text-input" autocomplete="off" spellcheck="false" placeholder="Type here...">
          </div>
        </div>

        <!-- Right: Virtual IDE Split Screen -->
        <div class="virtual-ide-panel">
          <div class="ide-header">
            <span>💻 Visual Workspace IDE - circular-queue</span>
            <span id="active-file-indicator" style="color: var(--primary);">src/buffer.py</span>
          </div>
          <div class="ide-body">
            <!-- File Explorer Tree -->
            <div class="ide-explorer" id="cli-file-tree"></div>
            <!-- Editor -->
            <div class="ide-editor">
              <div class="editor-tabs">
                <div class="editor-tab active" id="ide-tab-label">buffer.py</div>
              </div>
              <div class="editor-code-container" id="editor-code-display">
                <!-- Lines code rendered here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const input = document.getElementById('cli-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        input.value = '';
        if (cmd) {
          this.executeCommand(cmd);
        }
      }
    });

    this.container.addEventListener('click', (e) => {
      // Focus input if not clicking file Explorer or text selections
      if (!e.target.closest('#cli-file-tree') && !e.target.closest('#editor-code-display')) {
        this.focusInput();
      }
    });
  }

  focusInput() {
    const input = document.getElementById('cli-input');
    if (input) input.focus();
  }

  renderFileTree() {
    const treeEl = document.getElementById('cli-file-tree');
    if (!treeEl) return;

    const renderNode = (node, depth = 0) => {
      const padding = depth * 12;
      if (node.isDir) {
        let lines = `
          <div class="tree-item dir" style="padding-left: ${padding}px">
            <span class="tree-icon">📂</span> <span>${node.name}</span>
          </div>
        `;
        if (node.open && node.children) {
          lines += node.children.map(child => renderNode(child, depth + 1)).join('');
        }
        return lines;
      } else {
        const isActive = this.activeFile === node.name;
        const activeClass = isActive ? "style='color: var(--accent); font-weight: bold;'" : "";
        return `
          <div class="tree-item file" style="padding-left: ${padding}px" id="file-${node.name.replace('.', '-')}" data-file="${node.name}">
            <span class="tree-icon">📄</span> <span ${activeClass}>${node.name}</span>
          </div>
        `;
      }
    };

    treeEl.innerHTML = this.fileTree.map(n => renderNode(n)).join('');

    // Tree navigation hooks
    const fileItems = treeEl.querySelectorAll('.tree-item.file');
    fileItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetFile = item.getAttribute('data-file');
        this.openFile(targetFile);
      });
    });
  }

  // Load a file inside the Virtual IDE visual editor panel
  openFile(fileName) {
    this.activeFile = fileName;
    const indicator = document.getElementById('active-file-indicator');
    const label = document.getElementById('ide-tab-label');
    const display = document.getElementById('editor-code-display');

    if (indicator) indicator.textContent = `src/${fileName}`;
    if (label) label.textContent = fileName;

    // Render tree with selected highlight
    this.renderFileTree();

    if (!display) return;
    display.innerHTML = '';

    const content = this.files[fileName] || "";
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const row = document.createElement('div');
      row.className = 'editor-line-row';
      row.innerHTML = `
        <span class="editor-line-num">${idx + 1}</span>
        <span class="editor-line-code">${this.escapeHTML(line)}</span>
      `;
      display.appendChild(row);
    });
  }

  escapeHTML(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  appendLine(text, type = "normal") {
    const buffer = document.getElementById('cli-buffer');
    if (!buffer) return;

    const line = document.createElement('div');
    line.className = `cli-line ${type}`;
    line.innerHTML = text;
    buffer.appendChild(line);
    buffer.scrollTop = buffer.scrollHeight;
  }

  executeCommand(commandLine) {
    this.appendLine(`<span class="cli-prompt-echo">C:\\Users\\risha\\projects\\circular-queue&gt; ${commandLine}</span>`);
    
    const parts = commandLine.toLowerCase().trim().replace(/"/g, '').split(' ');
    const mainCmd = parts[0];

    // Standard shell commands
    switch (mainCmd) {
      case 'help':
      case '/help':
        this.appendLine("Available Workspace Commands:", "system");
        this.appendLine("  <strong>claude</strong>                               Launch interactive agentic CLI session.", "system");
        this.appendLine("  <strong>claude init</strong>                          Initialize Claude workspace and configure CLAUDE.md.", "system");
        this.appendLine("  <strong>claude test</strong>                          Execute the local pytest suite.", "system");
        this.appendLine("  <strong>claude run &quot;fix buffer.py&quot;</strong>     Let Claude visually refactor and diff correct buffer overflow bugs.", "system");
        this.appendLine("  <strong>clear</strong>                               Reset console display.", "system");
        break;
      case 'clear':
        const buffer = document.getElementById('cli-buffer');
        if (buffer) buffer.innerHTML = '';
        break;
      case 'claude':
        const sub = parts[1];
        if (sub === 'init') {
          this.appendLine("Scanning workspace directory structures...", "normal");
          setTimeout(() => {
            this.appendLine("Writing project rules card to [CLAUDE.md]...", "normal");
            
            // Check if CLAUDE.md already in explorer list
            const clExists = this.fileTree.some(n => n.name === 'CLAUDE.md');
            if (!clExists) {
              this.fileTree.unshift({ name: "CLAUDE.md", isDir: false });
              this.renderFileTree();
            }

            setTimeout(() => {
              this.appendLine("Successfully initialized! Instructions stored in <strong>CLAUDE.md</strong>.", "success");
              this.openFile("CLAUDE.md");
              this.appState.dashboard.completeLab("claude_cli_init");
            }, 1000);
          }, 800);
        } else if (sub === 'test') {
          this.appendLine("Running workspace tests: <code>pytest</code>", "normal");
          setTimeout(() => {
            // Check if buffer is already fixed or still broken
            if (this.files["buffer.py"].includes("% self.capacity")) {
              this.appendLine("====================== 1 passed in 0.08s ======================", "success");
            } else {
              this.appendLine("====================== test failure ======================", "error");
              this.appendLine("tests/test_buffer.py:6: AssertionError: Circular queue capacity overflow on third push.", "error");
              this.appendLine("====================== 1 failed in 0.14s ======================", "error");
            }
            this.appState.dashboard.completeLab("claude_cli_test");
          }, 1200);
        } else if (sub === 'run') {
          const actionText = parts.slice(2).join(' ');
          if (actionText.includes('fix') || actionText.includes('buffer')) {
            this.runInteractiveDiffAnimation();
          } else {
            this.appendLine("Claude Code running command task: " + actionText, "normal");
            setTimeout(() => {
              this.appendLine("Done.", "success");
            }, 1000);
          }
        } else {
          this.appendLine("Launching Claude Code interactive agentic console...", "normal");
          setTimeout(() => {
            this.appendLine("Hello! I am Claude Code. I'm connected to your local workspace. Type 'exit' to return to standard shell.", "claude-reply");
          }, 800);
        }
        break;
      default:
        this.appendLine(`Command not found: '${mainCmd}'. Type 'help' to review sandbox shell commands.`, "error");
        break;
    }
  }

  // Interactive Git Diff Animation
  runInteractiveDiffAnimation() {
    this.openFile("buffer.py");
    this.appendLine("Analyzing CircularBuffer class implementation... Found raw capacity indexes without modulus wrapping.", "claude-thinking");

    setTimeout(() => {
      this.appendLine("[Claude] Proposing Git Diff fixes for raw index increments:", "claude-reply");

      const display = document.getElementById('editor-code-display');
      if (!display) return;

      // Lines of code to animate removing and adding
      // Lines 7-9 in buffer.py are the push code:
      // self.buffer[self.tail] = val
      // self.tail += 1
      
      const newLinesCode = `class CircularBuffer:
    def __init__(self, capacity):
        self.capacity = capacity
        self.buffer = [None] * capacity
        self.head = 0
        self.tail = 0

    def push(self, val):
<<<<<<< ORIGINAL (REMOVED)
        self.buffer[self.tail] = val
        self.tail += 1
======= SUGGESTED (ADDED)
        self.buffer[self.tail] = val
        self.tail = (self.tail + 1) % self.capacity
>>>>>>> CORRECTED

    def pop(self):
<<<<<<< ORIGINAL (REMOVED)
        val = self.buffer[self.head]
        self.head += 1
======= SUGGESTED (ADDED)
        val = self.buffer[self.head]
        self.head = (self.head + 1) % self.capacity
>>>>>>> CORRECTED
        return val`;

      display.innerHTML = '';
      
      // Step-by-step diff loading for visual wow factor
      const diffLines = [
        { type: 'normal', text: "class CircularBuffer:" },
        { type: 'normal', text: "    def __init__(self, capacity):" },
        { type: 'normal', text: "        self.capacity = capacity" },
        { type: 'normal', text: "        self.buffer = [None] * capacity" },
        { type: 'normal', text: "        self.head = 0" },
        { type: 'normal', text: "        self.tail = 0" },
        { type: 'normal', text: "" },
        { type: 'normal', text: "    def push(self, val):" },
        { type: 'removed', text: "-       self.buffer[self.tail] = val" },
        { type: 'removed', text: "-       self.tail += 1" },
        { type: 'added', text: "+       self.buffer[self.tail] = val" },
        { type: 'added', text: "+       self.tail = (self.tail + 1) % self.capacity" },
        { type: 'normal', text: "" },
        { type: 'normal', text: "    def pop(self):" },
        { type: 'removed', text: "-       val = self.buffer[self.head]" },
        { type: 'removed', text: "-       self.head += 1" },
        { type: 'added', text: "+       val = self.buffer[self.head]" },
        { type: 'added', text: "+       self.head = (self.head + 1) % self.capacity" },
        { type: 'normal', text: "        return val" }
      ];

      diffLines.forEach((line, idx) => {
        setTimeout(() => {
          const row = document.createElement('div');
          row.className = `editor-line-row diff-${line.type} animate-slide-up`;
          row.innerHTML = `
            <span class="editor-line-num">${idx + 1}</span>
            <span class="editor-line-code">${this.escapeHTML(line.text)}</span>
          `;
          display.appendChild(row);
          display.scrollTop = display.scrollHeight;
        }, idx * 100);
      });

      // Complete the visual refactoring, save code state, and run green pytest confirmation
      setTimeout(() => {
        // Save corrected code to file registry
        this.files["buffer.py"] = `class CircularBuffer:
    def __init__(self, capacity):
        self.capacity = capacity
        self.buffer = [None] * capacity
        self.head = 0
        self.tail = 0

    def push(self, val):
        self.buffer[self.tail] = val
        self.tail = (self.tail + 1) % self.capacity

    def pop(self):
        val = self.buffer[self.head]
        self.head = (self.head + 1) % self.capacity
        return val
`;

        this.appendLine("Applying code modifications to workspace src/buffer.py...", "normal");
        
        setTimeout(() => {
          this.openFile("buffer.py");
          this.appendLine("Autosave triggered. Running test suite confirmation...", "normal");
          
          setTimeout(() => {
            this.appendLine("====================== 1 passed in 0.05s ======================", "success");
            this.appendLine("[Claude] Code successfully repaired and verified. Staging changes in git.", "success");
            
            // Sync complete to dashboard
            this.appState.dashboard.completeLab("claude_cli_refactor");
          }, 1200);
        }, 1000);

      }, diffLines.length * 100 + 1500);

    }, 1800);
  }
}
