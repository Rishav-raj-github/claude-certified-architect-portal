/**
 * McpSandboxModule - Model Context Protocol Playground & Code Generator.
 * Provides (1) Visual JSON-RPC handshake simulators, and (2) Custom NodeJS MCP Server SDK scaffold compilers.
 */
export class McpSandboxModule {
  constructor(appState) {
    this.appState = appState;
    this.container = null;
    this.activeTab = 'sandbox'; // 'sandbox' or 'generator'
    this.activeServer = 'sqlite';
    this.handshakeRunning = false;
    this.timer = null;

    // Local custom generator state
    this.customServerName = "custom-mcp-server";
    this.customTransport = "stdio";
    this.customTools = [
      { 
        name: "query_service", 
        description: "Executes a secure fetch query against the downstream external API microservice.",
        params: "url, query" 
      }
    ];

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
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="mcp-tab-container">
        <button class="mcp-tab-btn ${this.activeTab === 'sandbox' ? 'active' : ''}" id="mcp-tab-sandbox">🎛️ Handshake Sandbox</button>
        <button class="mcp-tab-btn ${this.activeTab === 'generator' ? 'active' : ''}" id="mcp-tab-generator">⚡ Scaffold Custom Server</button>
      </div>

      <div id="mcp-tab-content">
        <!-- Render Active Tab View -->
      </div>
    `;

    document.getElementById('mcp-tab-sandbox').addEventListener('click', () => {
      this.activeTab = 'sandbox';
      this.render();
    });
    document.getElementById('mcp-tab-generator').addEventListener('click', () => {
      this.activeTab = 'generator';
      this.render();
    });

    if (this.activeTab === 'sandbox') {
      this.renderSandbox();
    } else {
      this.renderGenerator();
    }
  }

  renderSandbox() {
    const tabContent = document.getElementById('mcp-tab-content');
    tabContent.innerHTML = `
      <div class="mcp-grid-layout animate-fade-in">
        <!-- Sidebar controls -->
        <div class="glass-card mcp-sidebar">
          <h2>Handshake Sandbox</h2>
          <p class="section-description">Model Context Protocol maps external integrations to standard JSON-RPC 2.0 schemas. Choose a server and test protocol packets.</p>

          <div class="server-picker">
            <label>Select Mock MCP Server</label>
            <div class="mcp-server-cards">
              <div class="mcp-card ${this.activeServer === 'sqlite' ? 'active' : ''}" data-server="sqlite" id="mcp-card-sqlite">
                <h4>🗄️ SQLite DB Server</h4>
                <p>Standard relational database toolset</p>
              </div>
              <div class="mcp-card ${this.activeServer === 'filesystem' ? 'active' : ''}" data-server="filesystem" id="mcp-card-filesystem">
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

          <button class="btn btn-accent btn-full" id="run-handshake-btn">Trigger Protocol Handshake</button>
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
    const cards = tabContent.querySelectorAll('.mcp-card');
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

    this.loadServer(this.activeServer);
  }

  loadServer(serverKey) {
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
        statusEl.textContent = "CONNECTED";
        statusEl.className = "status-glow completed";
        arrow.className = "flow-arrow right";
        this.handshakeRunning = false;
        
        // Sync Lab Completion
        this.appState.dashboard.completeLab(`mcp_${this.activeServer}`);
        return;
      }

      const step = steps[stepIndex];
      
      if (step.direction === 'host_to_server') {
        arrow.className = "flow-arrow right active-arrow";
        document.getElementById('ep-client').classList.add('pulse-active');
        setTimeout(() => document.getElementById('ep-client').classList.remove('pulse-active'), 500);
      } else {
        arrow.className = "flow-arrow left active-arrow";
        document.getElementById('ep-server').classList.add('pulse-active');
        setTimeout(() => document.getElementById('ep-server').classList.remove('pulse-active'), 500);
      }

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

  // Visual Scaffold Generator Tab View
  renderGenerator() {
    const tabContent = document.getElementById('mcp-tab-content');
    tabContent.innerHTML = `
      <div class="mcp-generator-panel animate-fade-in">
        <!-- Form configurations (Left) -->
        <div class="glass-card">
          <h2>Custom MCP Server Builder</h2>
          <p class="section-description">Visually scaffold a fully compliant Node.js Model Context Protocol Server containing your custom tools, inputs, and descriptions.</p>

          <div class="form-group">
            <label for="server-name-input">Server Name</label>
            <input type="text" id="server-name-input" class="form-input" value="${this.customServerName}" placeholder="e.g. postgres-mcp-server">
          </div>

          <div class="form-group">
            <label for="transport-select">Transport Protocol</label>
            <select id="transport-select" class="form-select">
              <option value="stdio" ${this.customTransport === 'stdio' ? 'selected' : ''}>STDIO (Local Processes)</option>
              <option value="sse" ${this.customTransport === 'sse' ? 'selected' : ''}>SSE (Remote Server Websockets)</option>
            </select>
          </div>

          <div class="dynamic-tools-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3>Exposed Tools Definition</h3>
              <button class="btn btn-sm" id="add-tool-row-btn">+ Add Tool</button>
            </div>
            
            <div id="dynamic-tools-container">
              <!-- Render Tools rows -->
            </div>
          </div>

          <button class="btn btn-accent btn-full" style="margin-top: 12px;" id="compile-mcp-btn">⚡ Generate Production Server Code</button>
        </div>

        <!-- Compiled Code Display (Right) -->
        <div class="glass-card" style="display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3>Compiled JavaScript (Node.js SDK)</h3>
            <button class="btn btn-sm btn-success" id="copy-mcp-code-btn">Copy Code</button>
          </div>
          <div class="protocol-terminal" style="flex-grow: 1;">
            <pre class="json-code" id="generator-code-block" style="color: #6ee7b7;"></pre>
          </div>
        </div>
      </div>
    `;

    // Dynamic Row hook triggers
    document.getElementById('add-tool-row-btn').addEventListener('click', () => {
      this.customTools.push({ name: "new_tool", description: "Performs action details.", params: "param1, param2" });
      this.renderToolsRows();
    });

    document.getElementById('server-name-input').addEventListener('input', (e) => {
      this.customServerName = e.target.value;
    });

    document.getElementById('transport-select').addEventListener('change', (e) => {
      this.customTransport = e.target.value;
    });

    document.getElementById('compile-mcp-btn').addEventListener('click', () => {
      this.compileMcpServerCode();
    });

    document.getElementById('copy-mcp-code-btn').addEventListener('click', () => {
      const code = document.getElementById('generator-code-block').textContent;
      navigator.clipboard.writeText(code);
      alert("Node.js MCP SDK code copied to clipboard successfully!");
    });

    this.renderToolsRows();
    this.compileMcpServerCode(); // Pre-compile initial
  }

  renderToolsRows() {
    const container = document.getElementById('dynamic-tools-container');
    if (!container) return;

    container.innerHTML = '';
    
    this.customTools.forEach((tool, idx) => {
      const row = document.createElement('div');
      row.className = 'dynamic-tool-entry animate-slide-up';
      row.innerHTML = `
        <button class="remove-tool-btn" data-idx="${idx}">✕</button>
        <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 10px; margin-bottom: 8px;">
          <div>
            <label style="font-size: 10px; color: var(--text-secondary);">Tool Name</label>
            <input type="text" class="form-input tool-name" data-idx="${idx}" value="${tool.name}">
          </div>
          <div>
            <label style="font-size: 10px; color: var(--text-secondary);">Parameters (comma separated)</label>
            <input type="text" class="form-input tool-params" data-idx="${idx}" value="${tool.params}">
          </div>
        </div>
        <div>
          <label style="font-size: 10px; color: var(--text-secondary);">Tool Description</label>
          <input type="text" class="form-input tool-desc" data-idx="${idx}" value="${tool.description}">
        </div>
      `;
      container.appendChild(row);
    });

    // Inputs value change triggers
    container.querySelectorAll('.tool-name').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        this.customTools[idx].name = e.target.value;
      });
    });

    container.querySelectorAll('.tool-params').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        this.customTools[idx].params = e.target.value;
      });
    });

    container.querySelectorAll('.tool-desc').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        this.customTools[idx].description = e.target.value;
      });
    });

    container.querySelectorAll('.remove-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.customTools.splice(idx, 1);
        this.renderToolsRows();
      });
    });
  }

  // Node.js MCP SDK Server Compiler Engine
  compileMcpServerCode() {
    const display = document.getElementById('generator-code-block');
    if (!display) return;

    // Construct tools schema definitions
    const toolsDefinitions = this.customTools.map(t => {
      const properties = {};
      const required = [];
      
      t.params.split(',').forEach(p => {
        const cleanName = p.trim();
        if (cleanName) {
          properties[cleanName] = { 
            type: "string", 
            description: `Parameter argument for ${cleanName}` 
          };
          required.push(cleanName);
        }
      });

      return `      {
        name: "${t.name}",
        description: "${t.description}",
        inputSchema: {
          type: "object",
          properties: ${JSON.stringify(properties, null, 12).replace(/\n/g, '\n      ')},
          required: ${JSON.stringify(required)}
        }
      }`;
    }).join(',\n');

    // Construct call handlers
    const callHandlers = this.customTools.map(t => {
      const argMappings = t.params.split(',').map(p => p.trim()).filter(p => p).map(p => `const ${p} = args.${p};`).join('\n      ');
      return `    case "${t.name}": {
      ${argMappings || "// No parameters"}
      // TODO: Implement custom tool logic execution
      return {
        content: [{
          type: "text",
          text: \`Successfully executed ${t.name} with arguments: \${JSON.stringify(args)}\`
        }]
      };
    }`;
    }).join('\n\n');

    const transportImport = this.customTransport === 'stdio'
      ? `import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";`
      : `import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";`;

    const transportListen = this.customTransport === 'stdio'
      ? `const transport = new StdioServerTransport();\nawait server.connect(transport);\nconsole.error("MCP Server successfully listening via STDIO transport channel!");`
      : `import express from "express";\nconst app = express();\nlet transport;\n\napp.get("/sse", (req, res) => {\n  transport = new SSEServerTransport("/messages", res);\n  server.connect(transport);\n});\n\napp.post("/messages", (req, res) => {\n  transport.handleMessage(req, res);\n});\n\napp.listen(3001, () => {\n  console.log("MCP SSE Server listening on port 3001");\n});`;

    const serverCode = `/**
 * NodeJS Model Context Protocol Server Compliant Scaffold
 * Compiled dynamically by the Claude Architect Scaffold Engine
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
${transportImport}
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Initialize server capabilities
const server = new Server(
  {
    name: "${this.customServerName}",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 1. Tool discovery schema resolver
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
${toolsDefinitions}
    ]
  };
});

// 2. Tool handler trigger resolver
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
${callHandlers}
    default:
      throw new Error(\`Tool '\${name}' not supported by this server.\`);
  }
});

// 3. Bind transport mechanism
${transportListen}
`;

    display.textContent = serverCode;
    
    // Increment lab stats
    this.appState.dashboard.completeLab("mcp_custom_compiler");
  }
}
