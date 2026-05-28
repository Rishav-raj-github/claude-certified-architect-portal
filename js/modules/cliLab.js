/**
 * CliLabModule - Web-based terminal emulator simulating the Claude Code agentic CLI.
 * Illustrates project initialization, CLAUDE.md creations, test suites, and git workflows.
 */
export class CliLabModule {
  constructor(appState) {
    this.appState = appState;
    this.container = null;
    this.history = [];
    this.activeClaudeSession = false;
    this.fileTree = [
      { name: "src/", isDir: true, open: true, children: [
        { name: "main.py", isDir: false },
        { name: "buffer.py", isDir: false }
      ]},
      { name: "tests/", isDir: true, open: true, children: [
        { name: "test_buffer.py", isDir: false }
      ]},
      { name: "README.md", isDir: false },
      { name: "requirements.txt", isDir: false }
    ];
  }

  mount(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
    this.renderFileTree();
    this.focusInput();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="cli-grid-layout">
        <!-- Terminal screen -->
        <div class="glass-card terminal-cli card-span-2">
          <div class="terminal-header">
            <span class="terminal-title">Claude Code Agentic CLI Shell (Simulated)</span>
            <div class="terminal-controls">
              <span class="dot red"></span>
              <span class="dot amber"></span>
              <span class="dot green"></span>
            </div>
          </div>

          <div class="cli-output-buffer" id="cli-buffer">
            <div class="cli-line system">Welcome to Claude Code CLI v0.8.2.</div>
            <div class="cli-line system">Type 'help' or '/help' to discover available workspace commands.</div>
            <div class="cli-line system">Active workspace: C:\\Users\\risha\\projects\\circular-queue</div>
            <div class="cli-line space"></div>
          </div>

          <div class="cli-input-row">
            <span class="cli-prompt">C:\\Users\\risha\\projects\\circular-queue&gt;</span>
            <input type="text" id="cli-input" class="cli-text-input" autocomplete="off" spellcheck="false" placeholder="Type here...">
          </div>
        </div>

        <!-- Virtual File Tree workspace -->
        <div class="glass-card workspace-sidebar">
          <h3>Virtual workspace IDE</h3>
          <p class="section-description">Watch the directory structure adapt as Claude Code initializes configs and modifies code.</p>
          <div class="workspace-tree" id="cli-file-tree">
            <!-- Dynamic Directory Tree -->
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

    this.container.addEventListener('click', () => this.focusInput());
  }

  focusInput() {
    const input = document.getElementById('cli-input');
    if (input) input.focus();
  }

  renderFileTree() {
    const treeEl = document.getElementById('cli-file-tree');
    if (!treeEl) return;

    const renderNode = (node, depth = 0) => {
      const padding = depth * 15;
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
        return `
          <div class="tree-item file" style="padding-left: ${padding}px" id="file-${node.name.replace('.', '-')}">
            <span class="tree-icon">📄</span> <span>${node.name}</span>
          </div>
        `;
      }
    };

    treeEl.innerHTML = this.fileTree.map(n => renderNode(n)).join('');
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
    
    const parts = commandLine.toLowerCase().split(' ');
    const mainCmd = parts[0];

    // Check if inside Claude Code shell session
    if (this.activeClaudeSession) {
      if (commandLine === 'exit' || commandLine === 'quit') {
        this.activeClaudeSession = false;
        this.appendLine("Exiting Claude Code interactive shell. Back to standard command prompt.", "system");
        return;
      }

      this.appendLine("Claude is thinking...", "claude-thinking");
      
      setTimeout(() => {
        if (commandLine.includes('write') || commandLine.includes('create') || commandLine.includes('add')) {
          this.appendLine("[Claude] I have analyzed the codebase. Staging a circular buffer configuration logic...", "claude-reply");
        } else if (commandLine.includes('test') || commandLine.includes('run')) {
          this.appendLine("[Claude] Executing test runner... Pytest detected 3 passes.", "claude-reply");
        } else {
          this.appendLine(`[Claude] I've processed your command: "${commandLine}". What file or feature would you like me to inspect next?`, "claude-reply");
        }
      }, 1000);
      return;
    }

    // Standard shell commands
    switch (mainCmd) {
      case 'help':
      case '/help':
        this.appendLine("Available Commands:", "system");
        this.appendLine("  <strong>claude</strong>         Launch interactive agentic coding assistant.", "system");
        this.appendLine("  <strong>claude init</strong>    Initialize Claude workspace and write custom CLAUDE.md guide.", "system");
        this.appendLine("  <strong>claude test</strong>    Execute active pytest workspace test suites.", "system");
        this.appendLine("  <strong>claude commit</strong>  Leverage Claude to draft structured git commits.", "system");
        this.appendLine("  <strong>clear</strong>          Reset console log screen.", "system");
        break;
      case 'clear':
        const buffer = document.getElementById('cli-buffer');
        if (buffer) buffer.innerHTML = '';
        break;
      case 'claude':
        const sub = parts[1];
        if (sub === 'init') {
          this.appendLine("Searching project tree configurations...", "normal");
          setTimeout(() => {
            this.appendLine("Creating project instruction standard [CLAUDE.md] file...", "normal");
            
            // Check if already exists in tree
            const clExists = this.fileTree.some(n => n.name === 'CLAUDE.md');
            if (!clExists) {
              this.fileTree.unshift({ name: "CLAUDE.md", isDir: false });
              this.renderFileTree();
            }

            setTimeout(() => {
              this.appendLine("Successfully initialized! Written instructions to <strong>CLAUDE.md</strong>.", "success");
              this.appendLine("Claude Code can now automatically follow build scripts and coding styles.", "success");
              
              // Highlight new file
              const fileEl = document.getElementById('file-CLAUDE-md');
              if (fileEl) {
                fileEl.classList.add('new-file-highlight');
                setTimeout(() => fileEl.classList.remove('new-file-highlight'), 3000);
              }

              // Sync Lab Completion
              this.appState.dashboard.completeLab("claude_cli_init");
            }, 1000);
          }, 800);
        } else if (sub === 'test') {
          this.appendLine("Running workspace tests via command configured in CLAUDE.md: <code>pytest</code>", "normal");
          setTimeout(() => {
            this.appendLine("====================== 3 passed in 0.24s ======================", "success");
            this.appState.dashboard.completeLab("claude_cli_test");
          }, 1200);
        } else if (sub === 'commit') {
          this.appendLine("Running git diff diagnostic metrics...", "normal");
          setTimeout(() => {
            this.appendLine("Drafting automated architectural commit message...", "normal");
            setTimeout(() => {
              this.appendLine("<strong>Commit successful:</strong> <code>feat: implement circular buffer structure and pytest suites</code>", "success");
              this.appState.dashboard.completeLab("claude_cli_commit");
            }, 1000);
          }, 600);
        } else {
          // Launch interactive Claude Code session
          this.activeClaudeSession = true;
          this.appendLine("Launching Claude Code (interactive agentic CLI)...", "normal");
          setTimeout(() => {
            this.appendLine("Hello! I am Claude. I'm connected to your local git workspace. I can read/edit files and run tests. Type 'exit' to quit.", "claude-reply");
          }, 800);
        }
        break;
      default:
        this.appendLine(`Command not found: '${mainCmd}'. Type 'help' to review list of active sandbox utilities.`, "error");
        break;
    }
  }
}
