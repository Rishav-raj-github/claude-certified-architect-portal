import { TokenFlowAnimator } from '../utils/animations.js';

/**
 * WorkflowLabModule - Interactive visual designer for agentic workflows.
 * Supports presets (Evaluator-Optimizer, Router, RAG+Safety) and custom simulations.
 */
export class WorkflowLabModule {
  constructor(appState) {
    this.appState = appState;
    this.container = null;
    this.animator = null;
    this.activePreset = 'evaluator';
    this.simulationRunning = false;
    this.timer = null;

    // Presets data definitions
    this.presets = {
      evaluator: {
        name: "Evaluator-Optimizer Loop (Iterative Coding)",
        description: "Excellent for code synthesis. The optimizer LLM drafts code, while an evaluator runs unit tests and feeds logs back until criteria are fully met.",
        nodes: [
          { id: 'input', label: '1. Code Specification', type: 'input', color: '#06b6d4', pos: { x: 5, y: 15 } },
          { id: 'optimizer', label: '2. Sonnet (Optimizer)', type: 'llm', color: '#d97706', pos: { x: 30, y: 15 } },
          { id: 'sandbox', label: '3. Test Sandbox (Tool)', type: 'tool', color: '#8b5cf6', pos: { x: 60, y: 15 } },
          { id: 'evaluator', label: '4. Evaluator (Sonnet)', type: 'llm', color: '#d97706', pos: { x: 45, y: 55 } },
          { id: 'output', label: '5. Production Ready Code', type: 'output', color: '#10b981', pos: { x: 85, y: 15 } }
        ],
        connections: [
          { from: 'input', to: 'optimizer' },
          { from: 'optimizer', to: 'sandbox' },
          { from: 'sandbox', to: 'evaluator' },
          { from: 'evaluator', to: 'optimizer', label: 'Refinement Feedback' }, // Loop back
          { from: 'evaluator', to: 'output', label: 'Passes Tests' }
        ],
        logs: [
          { time: 0, node: 'input', text: "[SYSTEM] Incoming request received: 'Write high performance circular queue buffer in Python with tests.'" },
          { time: 1000, node: 'optimizer', text: "[LLM Sonnet] Generating initial circular queue draft using Claude API (Prompt size: 1,420 tokens)..." },
          { time: 2500, node: 'sandbox', text: "[SANDBOX] Executing circular queue test suite in secure Python execution container..." },
          { time: 4000, node: 'evaluator', text: "[LLM Sonnet] Evaluating sandbox outcomes. Test #3 failed: 'IndexError: queue size capacity overflow on pop()'." },
          { time: 5500, node: 'optimizer', text: "[SYSTEM] Iteration 2: Injecting test failure back into Optimizer. Prompt Cache Hit (saving 80% tokens)!" },
          { time: 7000, node: 'optimizer', text: "[LLM Sonnet] Refactoring circular queue index handling. Applying index wrap mask optimizations..." },
          { time: 8500, node: 'sandbox', text: "[SANDBOX] Re-executing circular queue tests. All 10 tests passed successfully." },
          { time: 10000, node: 'evaluator', text: "[LLM Sonnet] Validation passed. Safety filters checked for execution leaks." },
          { time: 11000, node: 'output', text: "[PRODUCTION] Output finalized and streamed back to client console. Total cache saving: $0.14" }
        ],
        costs: { inputTokens: 5200, cachedTokens: 14200, outputTokens: 850, cost: 0.057 }
      },
      router: {
        name: "Intelligent Routing (High Velocity)",
        description: "Routes user prompts based on intent. Uses lightning-fast Haiku for simple questions and delegates complex logic to Sonnet.",
        nodes: [
          { id: 'input', label: '1. User Request', type: 'input', color: '#06b6d4', pos: { x: 5, y: 35 } },
          { id: 'router', label: '2. Haiku Router', type: 'llm', color: '#3b82f6', pos: { x: 30, y: 35 } },
          { id: 'routeA', label: '3a. Sonnet Route (Complex)', type: 'llm', color: '#d97706', pos: { x: 60, y: 15 } },
          { id: 'routeB', label: '3b. Haiku Route (Simple)', type: 'llm', color: '#3b82f6', pos: { x: 60, y: 55 } },
          { id: 'output', label: '4. Unified Output', type: 'output', color: '#10b981', pos: { x: 85, y: 35 } }
        ],
        connections: [
          { from: 'input', to: 'router' },
          { from: 'router', to: 'routeA' },
          { from: 'router', to: 'routeB' },
          { from: 'routeA', to: 'output' },
          { from: 'routeB', to: 'output' }
        ],
        logs: [
          { time: 0, node: 'input', text: "[SYSTEM] Incoming prompt parsed: 'How does prompt caching prefix matching work in Claude API vs local open models?'" },
          { time: 1000, node: 'router', text: "[LLM Haiku] Running classifier. Intent matching identified: 'High-Complexity Technical Inquiry'." },
          { time: 2200, node: 'routeA', text: "[SYSTEM] Prompt routed to Claude 3.5 Sonnet. Prompt Cache matched." },
          { time: 3500, node: 'routeA', text: "[LLM Sonnet] Generating comprehensive explanation of prefix matching architecture and TTL values..." },
          { time: 5000, node: 'output', text: "[SYSTEM] Output synthesized from Route A. Total latency: 2.1 seconds. Cost: $0.006" }
        ],
        costs: { inputTokens: 800, cachedTokens: 3500, outputTokens: 420, cost: 0.009 }
      },
      safety: {
        name: "Retrieval & Dual-LLM Guardrail Scan",
        description: "Uses a rapid Haiku pre-shield to screen inputs, queries clean data, and uses a post-shield to check Sonnet outputs.",
        nodes: [
          { id: 'input', label: '1. Prompt Request', type: 'input', color: '#06b6d4', pos: { x: 5, y: 35 } },
          { id: 'shieldA', label: '2. Haiku Pre-Shield', type: 'llm', color: '#3b82f6', pos: { x: 25, y: 35 } },
          { id: 'rag', label: '3. DB Search (Tool)', type: 'tool', color: '#8b5cf6', pos: { x: 45, y: 15 } },
          { id: 'sonnet', label: '4. Sonnet (Core Reasoner)', type: 'llm', color: '#d97706', pos: { x: 55, y: 55 } },
          { id: 'shieldB', label: '5. Haiku Post-Shield', type: 'llm', color: '#3b82f6', pos: { x: 75, y: 35 } },
          { id: 'output', label: '6. Guarded Output', type: 'output', color: '#10b981', pos: { x: 92, y: 35 } }
        ],
        connections: [
          { from: 'input', to: 'shieldA' },
          { from: 'shieldA', to: 'rag' },
          { from: 'rag', to: 'sonnet' },
          { from: 'sonnet', to: 'shieldB' },
          { from: 'shieldB', to: 'output' }
        ],
        logs: [
          { time: 0, node: 'input', text: "[SYSTEM] User inputs prompt containing potential medical advice request." },
          { time: 1000, node: 'shieldA', text: "[SHIELD] Haiku scanning input for prompt injection and diagnostic liabilities..." },
          { time: 2000, node: 'shieldA', text: "[SHIELD] Input passed. No toxic injection vectors discovered." },
          { time: 2800, node: 'rag', text: "[TOOL] Searching database for standard medical guidelines metadata..." },
          { time: 3800, node: 'sonnet', text: "[LLM Sonnet] Processing database inputs and drafting customer-facing message with references..." },
          { time: 5200, node: 'shieldB', text: "[SHIELD] Haiku scanning Sonnet output for regulatory compliance compliance compliance checks..." },
          { time: 6200, node: 'shieldB', text: "[SHIELD] Output verified. No compliance leakage flagged." },
          { time: 7000, node: 'output', text: "[SYSTEM] Guarded response served safely. Total security overhead: $0.002" }
        ],
        costs: { inputTokens: 1800, cachedTokens: 2500, outputTokens: 600, cost: 0.015 }
      }
    };
  }

  mount(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
    this.initAnimator();
    this.loadPreset(this.activePreset);
  }

  initAnimator() {
    this.animator = new TokenFlowAnimator('workflow-canvas');
    this.animator.start();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="workflow-grid-layout">
        <!-- Control panel sidebar -->
        <div class="glass-card side-controls">
          <h2>Workflow Lab</h2>
          <p class="section-description">Select an advanced agentic architectural pattern to model and run dynamic visual token flow simulations.</p>
          
          <div class="preset-selector">
            <label for="preset-select">Architecture Presets</label>
            <select id="preset-select" class="form-select">
              <option value="evaluator" ${this.activePreset === 'evaluator' ? 'selected' : ''}>Evaluator-Optimizer Loop</option>
              <option value="router" ${this.activePreset === 'router' ? 'selected' : ''}>Intent Routing Classifier</option>
              <option value="safety" ${this.activePreset === 'safety' ? 'selected' : ''}>Dual-LLM Shield & RAG</option>
            </select>
          </div>

          <div class="preset-details" id="preset-details-box">
            <!-- Dynamic presets info -->
          </div>

          <div class="simulation-controls">
            <button class="btn btn-accent btn-full" id="run-sim-btn">Simulate Workflow</button>
          </div>

          <!-- Dynamic Token Expense Counter -->
          <div class="glass-card cost-tracker">
            <h3>Token & Cost Estimator</h3>
            <div class="cost-row">
              <span>Input Tokens:</span>
              <span id="cost-input">0</span>
            </div>
            <div class="cost-row">
              <span>Prompt Cache Hits:</span>
              <span id="cost-cached" class="text-green">0</span>
            </div>
            <div class="cost-row">
              <span>Output Tokens:</span>
              <span id="cost-output">0</span>
            </div>
            <div class="cost-row border-top">
              <span><strong>Estimated Cost:</strong></span>
              <span id="cost-total" class="text-accent">$0.000</span>
            </div>
          </div>
        </div>

        <!-- Central workflow canvas and terminals -->
        <div class="canvas-panel">
          <div class="workflow-canvas-container" id="canvas-container">
            <canvas id="workflow-canvas"></canvas>
            <div id="nodes-overlay"></div>
          </div>

          <!-- Terminal logger -->
          <div class="glass-card terminal-box">
            <div class="terminal-header">
              <span class="terminal-title">Active Node Execution Logs</span>
              <div class="terminal-controls">
                <span class="dot red"></span>
                <span class="dot amber"></span>
                <span class="dot green"></span>
              </div>
            </div>
            <div class="terminal-body" id="workflow-terminal-logs">
              <div class="log-line system">> System online. Select a preset and click Simulate.</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook settings
    const select = document.getElementById('preset-select');
    select.addEventListener('change', (e) => {
      this.activePreset = e.target.value;
      this.loadPreset(this.activePreset);
    });

    document.getElementById('run-sim-btn').addEventListener('click', () => {
      if (this.simulationRunning) return;
      this.runSimulation();
    });
  }

  loadPreset(presetKey) {
    if (this.timer) clearTimeout(this.timer);
    this.simulationRunning = false;

    // Reset visual overlays
    const logsEl = document.getElementById('workflow-terminal-logs');
    if (logsEl) {
      logsEl.innerHTML = `<div class="log-line system">> Architecture loaded: ${this.presets[presetKey].name}. Ready.</div>`;
    }

    const preset = this.presets[presetKey];
    document.getElementById('preset-details-box').innerHTML = `
      <h3>${preset.name}</h3>
      <p>${preset.description}</p>
    `;

    // Reset cost estimators
    document.getElementById('cost-input').textContent = "0";
    document.getElementById('cost-cached').textContent = "0";
    document.getElementById('cost-output').textContent = "0";
    document.getElementById('cost-total').textContent = "$0.000";

    // Setup nodes in Overlay
    const overlay = document.getElementById('nodes-overlay');
    overlay.innerHTML = '';
    
    preset.nodes.forEach(node => {
      const el = document.createElement('div');
      el.id = `node-${node.id}`;
      el.className = `canvas-node node-type-${node.type}`;
      el.style.left = `${node.pos.x}%`;
      el.style.top = `${node.pos.y}%`;
      el.style.borderColor = node.color;
      el.innerHTML = `
        <div class="node-glow" style="background-color: ${node.color}"></div>
        <div class="node-label">${node.label}</div>
      `;
      overlay.appendChild(el);
    });

    // Let the DOM render then anchor connections on Canvas
    setTimeout(() => {
      if (!this.animator) return;
      this.animator.clear();
      this.animator.resize();

      const nodesSetup = preset.nodes.map(n => ({
        id: n.id,
        element: document.getElementById(`node-${n.id}`),
        color: n.color
      }));

      this.animator.setNodes(nodesSetup);

      preset.connections.forEach(conn => {
        this.animator.addConnection(conn.from, conn.to, {
          color: 'rgba(255,255,255,0.06)',
          particleColor: preset.nodes.find(n => n.id === conn.from).color,
          flowRate: 0.5
        });
      });
    }, 100);
  }

  runSimulation() {
    this.simulationRunning = true;
    const preset = this.presets[this.activePreset];
    const logs = preset.logs;
    const term = document.getElementById('workflow-terminal-logs');
    term.innerHTML = '';

    // Pulse the run button
    const runBtn = document.getElementById('run-sim-btn');
    runBtn.classList.add('disabled');
    runBtn.textContent = "Simulation In Progress...";

    // Spawn animated visual tokens
    this.animator.particles = []; // Clear
    
    logs.forEach(log => {
      this.timer = setTimeout(() => {
        if (!this.simulationRunning) return;

        // Print terminal line
        const line = document.createElement('div');
        line.className = `log-line animate-fade-in ${log.node}`;
        line.innerHTML = `<span class="time-stamp">[${new Date().toLocaleTimeString()}]</span> ${log.text}`;
        term.appendChild(line);
        term.scrollTop = term.scrollHeight;

        // Visual highlights on active node
        const activeNodeEl = document.getElementById(`node-${log.node}`);
        if (activeNodeEl) {
          activeNodeEl.classList.add('pulse-active');
          setTimeout(() => activeNodeEl.classList.remove('pulse-active'), 1500);
        }

        // Spawn stream particles on connection paths leading from this active node
        const outgoingConns = preset.connections.filter(c => c.from === log.node);
        outgoingConns.forEach(c => {
          this.animator.spawnStream(c.from, c.to, 12, activeNodeEl ? activeNodeEl.style.borderColor : '#d97706');
        });
      }, log.time);
    });

    // Reveal token cost tally at the end
    const lastLogTime = logs[logs.length - 1].time;
    this.timer = setTimeout(() => {
      if (!this.simulationRunning) return;

      document.getElementById('cost-input').textContent = preset.costs.inputTokens.toLocaleString();
      document.getElementById('cost-cached').textContent = preset.costs.cachedTokens.toLocaleString();
      document.getElementById('cost-output').textContent = preset.costs.outputTokens.toLocaleString();
      document.getElementById('cost-total').textContent = `$${preset.costs.cost.toFixed(3)}`;

      // Complete Lab Task in Dashboard
      this.appState.dashboard.completeLab(this.activePreset);

      runBtn.classList.remove('disabled');
      runBtn.textContent = "Run Again";
      this.simulationRunning = false;
    }, lastLogTime + 1500);
  }
}
