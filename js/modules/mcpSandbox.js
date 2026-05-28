/**
 * McpSandboxModule - Interactive laboratory for testing the Model Context Protocol.
 * Teaches hosts-server JSON-RPC standards with live protocol packet inspections.
 */
export class McpSandboxModule {
  constructor(appState) {
    this.appState = appState;
    this.container = null;
    this.activeServer = 'sqlite';
    this.handshakeRunning = false;
    this.timer = null;

    this.serverDefinitions = {
      sqlite: {
        name: "SQLite Database Server (Local)",
        description: "Connects Claude securely to internal database systems. Exposes relational query capabilities.",
        tools: [
          { name: "query_database", desc: "Execute safe SQL queries on the active sqlite database schema" },
          { name: "get_schema", desc: "Retrieve active tables list and schema definitions" }
        ],
        scenarios: [
          {
            title: "Query Customer Records",
            prompt: "Find all premium customers who registered in the last 30 days.",
            rpcSteps: [
              {
                direction: "host_to_server",
                method: "tools/list",
                params: {},
                desc: "Client queries the SQLite Server for available tools."
              },
              {
                direction: "server_to_host",
                result: {
                  tools: [
                    {
                      name: "query_database",
                      description: "Execute safe SQL queries on the active sqlite database schema",
                      inputSchema: {
                        type: "object",
                        properties: { query: { type: "string" } },
                        required: ["query"]
                      }
                    }
                  ]
                },
                desc: "Server reports 'query_database' JSON-Schema metadata."
              },
              {
                direction: "host_to_server",
                method: "tools/call",
                params: {
                  name: "query_database",
                  arguments: {
                    query: "SELECT * FROM customers WHERE status='premium' AND registered_at >= date('now', '-30 days');"
                  }
                },
                desc: "Client requests execution of the database tool with SQL arguments."
              },
              {
                direction: "server_to_host",
                result: {
                  content: [
                    {
                      type: "text",
                      text: "[{'id': 104, 'name': 'Acme Corp', 'status': 'premium', 'joined': '2026-05-12'}]"
                    }
                  ],
                  isError: false
                },
                desc: "Server executes the query locally and returns raw data records safely to the client."
              }
            ]
          }
        ]
      },
      filesystem: {
        name: "Secure File System Server",
        description: "Exposes directory listings and secure file system read/write utilities.",
        tools: [
          { name: "list_directory", desc: "List all contents inside a specific workspace path" },
          { name: "read_file", desc: "Read content of a target text file securely" }
        ],
        scenarios: [
          {
            title: "List Test Suites",
            prompt: "Read all unit test files inside the tests/ directory.",
            rpcSteps: [
              {
                direction: "host_to_server",
                method: "tools/list",
                params: {},
                desc: "Client initiates request to discover available file system tools."
              },
              {
                direction: "server_to_host",
                result: {
                  tools: [
                    {
                      name: "list_directory",
                      description: "List all contents inside a specific workspace path",
                      inputSchema: {
                        type: "object",
                        properties: { path: { type: "string" } },
                        required: ["path"]
                      }
                    }
                  ]
                },
                desc: "Server returns list_directory tool metadata definition."
              },
              {
                direction: "host_to_server",
                method: "tools/call",
                params: {
                  name: "list_directory",
                  arguments: { path: "./tests" }
                },
                desc: "Client calls list_directory targeting `./tests` relative workspace path."
              },
              {
                direction: "server_to_host",
                result: {
                  content: [
                    {
                      type: "text",
                      text: "['test_auth.py', 'test_billing.py', 'test_concurrency.py']"
                    }
                  ],
                  isError: false
                },
                desc: "Server reads folder details and returns list values."
              }
            ]
          }
        ]
      }
    };
  }

  mount(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
    this.loadServer(this.activeServer);
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="mcp-grid-layout">
        <!-- Sidebar controls -->
        <div class="glass-card mcp-sidebar">
          <h2>MCP Handshake Sandbox</h2>
          <p class="section-description">Model Context Protocol maps external integrations to standard JSON-RPC 2.0 schemas. Choose a server and test protocol packets.</p>

          <div class="server-picker">
            <label>Select Mock MCP Server</label>
            <div class="mcp-server-cards">
              <div class="mcp-card active" data-server="sqlite" id="mcp-card-sqlite">
                <h4>🗄️ SQLite DB Server</h4>
                <p>Standard relational database toolset</p>
              </div>
              <div class="mcp-card" data-server="filesystem" id="mcp-card-filesystem">
                <h4>📁 File System Server</h4>
                <p>Local disk reading and discovery</p>
              </div>
            </div>
          </div>

          <div class="server-details-panel">
            <h3>Exposed Tools Schema</h3>
            <div class="tools-schema-list" id="mcp-tools-list">
              <!-- Dynamic tools listing -->
            </div>
          </div>

          <button class="btn btn-accent btn-full" id="run-handshake-btn">Trigger Protocol handshake</button>
        </div>

        <!-- Handshake monitor panel -->
        <div class="glass-card mcp-monitor card-span-2">
          <div class="monitor-header">
            <h3>JSON-RPC 2.0 Handshake Inspector</h3>
            <span class="status-glow" id="handshake-status">IDLE</span>
          </div>

          <div class="handshake-visualizer">
            <div class="visual-endpoint" id="ep-client">
              <div class="ep-icon">🤖</div>
              <span>Claude Host</span>
            </div>
            <div class="visual-arrow-container">
              <div class="flow-arrow right" id="arrow-flow"></div>
            </div>
            <div class="visual-endpoint" id="ep-server">
              <div class="ep-icon" id="server-avatar">🗄️</div>
              <span id="server-label">SQLite Server</span>
            </div>
          </div>

          <div class="protocol-terminal">
            <pre class="json-code" id="rpc-console">// Select a server and click 'Trigger Protocol Handshake' to inspect raw JSON-RPC packages...</pre>
          </div>
        </div>
      </div>
    `;

    // Cards hooks
    const cards = this.container.querySelectorAll('.mcp-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        if (this.handshakeRunning) return;
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.activeServer = card.getAttribute('data-server');
        this.loadServer(this.activeServer);
      });
    });

    document.getElementById('run-handshake-btn').addEventListener('click', () => {
      if (this.handshakeRunning) return;
      this.runHandshake();
    });
  }

  loadServer(serverKey) {
    if (this.timer) clearTimeout(this.timer);
    this.handshakeRunning = false;

    const server = this.serverDefinitions[serverKey];
    document.getElementById('server-label').textContent = server.name;
    document.getElementById('server-avatar').textContent = serverKey === 'sqlite' ? '🗄️' : '📁';
    document.getElementById('handshake-status').textContent = "IDLE";
    document.getElementById('handshake-status').className = "status-glow";
    document.getElementById('rpc-console').innerHTML = `// Client transport established via STDIO. Ready to trace packets.`;

    const toolsList = document.getElementById('mcp-tools-list');
    toolsList.innerHTML = server.tools.map(t => `
      <div class="exposed-tool-item">
        <strong>${t.name}</strong>
        <p>${t.desc}</p>
      </div>
    `).join('');
  }

  runHandshake() {
    this.handshakeRunning = true;
    const server = this.serverDefinitions[this.activeServer];
    const scenario = server.scenarios[0];
    const steps = scenario.rpcSteps;
    const consoleEl = document.getElementById('rpc-console');
    const statusEl = document.getElementById('handshake-status');
    const arrow = document.getElementById('arrow-flow');
    
    consoleEl.innerHTML = ``;
    statusEl.textContent = "HANDSHAKING";
    statusEl.className = "status-glow running";

    let stepIndex = 0;

    const executeStep = () => {
      if (!this.handshakeRunning || stepIndex >= steps.length) {
        // Complete
        statusEl.textContent = "CONNECTED";
        statusEl.className = "status-glow completed";
        arrow.className = "flow-arrow right";
        arrow.style.animation = "none";
        this.handshakeRunning = false;

        // Complete Lab in Dashboard
        this.appState.dashboard.completeLab(`mcp_${this.activeServer}`);
        return;
      }

      const step = steps[stepIndex];
      
      // Determine arrow direction and visual pulse
      if (step.direction === 'host_to_server') {
        arrow.className = "flow-arrow right active-arrow";
        document.getElementById('ep-client').classList.add('pulse-active');
        setTimeout(() => document.getElementById('ep-client').classList.remove('pulse-active'), 500);
      } else {
        arrow.className = "flow-arrow left active-arrow";
        document.getElementById('ep-server').classList.add('pulse-active');
        setTimeout(() => document.getElementById('ep-server').classList.remove('pulse-active'), 500);
      }

      // Format payload text
      let payload = {};
      if (step.direction === 'host_to_server') {
        payload = {
          jsonrpc: "2.0",
          method: step.method,
          params: step.params,
          id: stepIndex + 1
        };
      } else {
        payload = {
          jsonrpc: "2.0",
          result: step.result,
          id: stepIndex
        };
      }

      const packetDiv = document.createElement('div');
      packetDiv.className = `rpc-packet animate-slide-up ${step.direction}`;
      packetDiv.innerHTML = `
        <span class="rpc-meta-header">// Step ${stepIndex + 1}: ${step.desc}</span>
        <pre>${JSON.stringify(payload, null, 2)}</pre>
      `;
      
      consoleEl.appendChild(packetDiv);
      consoleEl.scrollTop = consoleEl.scrollHeight;

      stepIndex++;
      this.timer = setTimeout(executeStep, 2500);
    };

    executeStep();
  }
}
