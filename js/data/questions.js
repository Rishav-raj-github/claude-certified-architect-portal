/**
 * Claude Certified Architect (CCA) Foundations Exam Prep Questions
 * Detailed 301-Level architectural scenario questions matching official Anthropic syllabus.
 */
export const questions = [
  {
    id: 1,
    domain: "System Architecture",
    question: "You are designing a legal document analysis system that processes 100-page contracts. The contract is uploaded once at the start of a user session, and the user asks 15–20 sequential questions about it. To optimize for both latency and operating costs, which architectural pattern should you implement?",
    options: [
      "Use Claude 3.5 Sonnet and append the entire contract to every prompt manually without using any caching mechanisms.",
      "Use Claude 3.5 Sonnet and enable Prompt Caching by placing the contract block at the end of the user prompt message structure.",
      "Use Claude 3.5 Sonnet and enable Prompt Caching by structuring the contract text in a block *before* the dynamic questions, ensuring the cached block has the 'cache_control': {'type': 'ephemeral'} parameter.",
      "Use Claude 3.5 Haiku to process the contract in chunks, then use Claude 3.5 Sonnet to synthesize the chunk summaries recursively."
    ],
    correctAnswer: 2,
    explanation: "Anthropic's Prompt Caching requires strict ordering. The cached content (like a large contract, system instructions, or tool definitions) must be placed at the beginning of the message sequence (system instructions or early messages). By setting 'cache_control': {'type': 'ephemeral'} on the contract block and placing it BEFORE the dynamic user questions, subsequent API calls will hit the cache, resulting in up to 90% cost savings and a 2x-3x reduction in latency. Placing the static block after dynamic questions invalidates the cache because any change in preceding tokens prevents cache hits."
  },
  {
    id: 2,
    domain: "Model Context Protocol",
    question: "An architect is designing an enterprise workspace assistant that must securely query a private internal database and search local markdown documentation. Which is the most scalable architecture using the Model Context Protocol (MCP)?",
    options: [
      "Hardcode database API queries and file system operations into Claude's system prompt using custom XML structures.",
      "Build two standalone MCP servers (e.g., an SQLite Server and a File System Server), and configure the Claude MCP Client (host) to connect to both via standard transport (STDIO or SSE).",
      "Deploy a custom middleware server that intercepts all raw Claude API requests, parses the queries using regular expressions, and injects DB results directly into the request body.",
      "Write a single monolithic MCP server that runs inside a Docker container on the client's local machine, handling authentication, routing, and all data transformations manually."
    ],
    correctAnswer: 1,
    explanation: "The Model Context Protocol (MCP) is designed as a modular client-server protocol. A host (like Claude Desktop or Claude Code) can connect to multiple lightweight, single-purpose MCP servers simultaneously using standard transports (STDIO for local processes, SSE for remote servers). This allows separate, clean, and reusable integrations (e.g., one server for database access, another for file system operations) without combining complex logic into a single monolithic codebase or hardcoding data within prompts."
  },
  {
    id: 3,
    domain: "Agentic Workflows",
    question: "You need to build an AI agent that takes a complex user requirement, writes high-quality Python code, runs unit tests in a secure sandbox, inspects errors, refactors the code, and repeats this cycle until all tests pass. Which agentic workflow pattern is most appropriate?",
    options: [
      "Orchestrator-Workers Pattern: Let one orchestrator generate 5 different code drafts and select the longest one.",
      "Routing Pattern: Send easy requirements to Claude 3.5 Haiku and difficult requirements to Claude 3.5 Sonnet.",
      "Evaluator-Optimizer Loop: An Optimizer agent writes the code, an Evaluator agent runs tests in a sandbox and feeds logs back to the optimizer in a loop until criteria are met.",
      "Sequential Chain: Feed the input to Claude to write the code, then to a second prompt to write the test, and a third prompt to generate the final execution report."
    ],
    correctAnswer: 2,
    explanation: "For iterative quality refinement (such as writing code and testing it), the Evaluator-Optimizer loop is the gold standard agentic workflow. One LLM call (or sandbox system) evaluates the code's output against clear criteria (e.g., running pytest in a secure container), and another LLM call uses that detailed structured feedback to optimize the code. This loop repeats until the criteria are satisfied, dramatically outperforming single-turn prompt chains."
  },
  {
    id: 4,
    domain: "Prompt Engineering & Structured Outputs",
    question: "You are building a high-reliability customer routing API that must output valid JSON matching a strict schema containing `category` and `priority` fields. How should you design the Claude API request to guarantee schema compliance?",
    options: [
      "Write in the system prompt: 'You are an API. You must ONLY output JSON. DO NOT include any conversational text or markdown code blocks.'",
      "Provide a JSON schema in a tool definition (e.g., `route_customer`), and set `tool_choice` to `{'type': 'tool', 'name': 'route_customer'}` in the API payload.",
      "Call the model using a standard prompt, then write a custom Python regex parser that tries to strip conversational text and extract brackets `{}` from the output.",
      "Set `response_format` to `{'type': 'json_object'}` and pass a few-shot list of raw XML inputs and JSON outputs."
    ],
    correctAnswer: 1,
    explanation: "While prompt instructions and system prompts help, the ONLY way to programmatically guarantee that Claude outputs structured data matching your exact schema is to define a tool with the desired schema and enforce its execution using `tool_choice = {'type': 'tool', 'name': 'tool_name'}`. This forces the model to bypass conversational greetings and respond *only* with valid tool call arguments matching the specified JSON Schema."
  },
  {
    id: 5,
    domain: "Claude Ecosystem",
    question: "A financial tech startup needs to build an AI system with three distinct functions: (1) Route support tickets based on tone, (2) Auto-refactor banking software modules, and (3) Analyze multi-megabyte audit sheets. Which model selection strategy offers the best balance of capability and efficiency?",
    options: [
      "Use Claude 3.5 Sonnet for all three tasks to keep the codebase simple and maintain uniform API responses.",
      "Use Claude 3 Opus for task (1), Claude 3.5 Sonnet for task (2), and Claude 3.5 Haiku for task (3).",
      "Use Claude 3.5 Haiku for task (1) due to its ultra-low latency; Claude 3.5 Sonnet for task (2) and task (3) due to its state-of-the-art coding abilities and massive 200k context window.",
      "Deploy a custom fine-tuned open-source model for all tasks to avoid vendor lock-in and minimize cloud computing fees."
    ],
    correctAnswer: 2,
    explanation: "This leverages the strengths of the Claude 3/3.5 family: (1) Ticket routing is a simple, high-velocity task where low latency and cost are key; Claude 3.5 Haiku is excellent here. (2) Code refactoring requires state-of-the-art reasoning, logic, and output precision, where Claude 3.5 Sonnet dominates. (3) Analyzing huge spreadsheets requires Sonnet's 200k token context window, advanced multimodal/data extraction capabilities, and fast processing speeds."
  },
  {
    id: 6,
    domain: "Safety & Production",
    question: "You are preparing a customer-facing assistant for production release. To prevent Prompt Injection and System Prompt Leakage attacks, which security practice is recommended in an Anthropic-centric architecture?",
    options: [
      "Obfuscate the system prompt by translating it into Base64 before passing it in the API call.",
      "Implement a dual-LLM shield pattern: Use a lightweight model (e.g., Claude 3.5 Haiku) as a pre-guardrail to scan user inputs for injection vectors, and a post-guardrail to scan output responses before serving.",
      "Encrypt all API communication using specialized enterprise-grade secure SSL tunnels.",
      "Remove system prompts altogether and hardcode all constraints as negative instructions within the user prompt text."
    ],
    correctAnswer: 1,
    explanation: "The dual-LLM shield (or guardrail) pattern is a robust production safety practice. Using a fast, inexpensive model like Claude 3.5 Haiku to scan the incoming user prompt for adversarial instructions (prompt injection) and verifying that the final generated output doesn't contain sensitive data (prompt leakage, PII) keeps your core Sonnet-based agent highly secure without adding severe latency or cost."
  },
  {
    id: 7,
    domain: "Model Context Protocol",
    question: "In the Model Context Protocol (MCP) specification, what are the three primary capabilities that an MCP Server can expose to an MCP Client?",
    options: [
      "Authentication, Query Routing, and Vector Databases",
      "Prompts (pre-defined templates), Resources (read-only data sources), and Tools (executable actions)",
      "JSON Schemas, REST Endpoints, and Docker Containers",
      "Model weights, Vector embeddings, and Fine-tuning datasets"
    ],
    correctAnswer: 1,
    explanation: "According to the official MCP specification, servers expose three core primitives: (1) Prompts: Pre-defined prompt templates that the client can load and show users; (2) Resources: Read-only data sources such as file systems, schemas, or documentation; and (3) Tools: Executable functions/actions that the client can trigger to interact with external systems (with user consent)."
  },
  {
    id: 8,
    domain: "System Architecture",
    question: "You are designing an agentic pipeline with a hard constraint of 5 seconds max response time (p99). The task involves synthesizing search results from 10 distinct websites. How should you design the LLM call flow?",
    options: [
      "Sequential loop: Write a loop that calls Claude 10 times in a row, summarizing each website one by one.",
      "Parallel calls with asynchronous synthesis: Trigger 10 asynchronous API calls to Claude 3.5 Haiku in parallel to summarize each site, then make a final call to Claude 3.5 Sonnet to combine the summaries.",
      "Use Claude 3 Opus to read all 10 raw HTML sites in a single massive prompt to ensure deep reasoning.",
      "Deploy a local web scraper to concatenate all text, then truncate it to 500 characters to keep latency low."
    ],
    correctAnswer: 1,
    explanation: "To achieve low latency in multi-source retrieval systems, concurrency is critical. By triggering parallel asynchronous API requests (using asyncio or Promise.all) to a high-speed model like Claude 3.5 Haiku, the summarizing work is completed concurrently (typically ~1-2 seconds total). The quick summaries are then combined in a final synthesis call to Claude 3.5 Sonnet, easily meeting the 5-second deadline. A sequential design would multiply the latency by 10, violating the p99 SLA."
  },
  {
    id: 9,
    domain: "Agentic Workflows",
    question: "Which of the following describes the 'Orchestrator-Workers' agentic pattern, and when should it be preferred over a simple 'Sequential Chain'?",
    options: [
      "An orchestrator LLM generates multiple distinct workers to run commands in parallel; preferred when tasks can be easily parallelized and completed independently.",
      "An orchestrator LLM continuously reviews a single output until it is perfect; preferred when writing extremely short strings.",
      "A rule-based router directs input to different workers; preferred when task types are highly predictable and static.",
      "An LLM generates multiple alternative answers and uses an external voting system; preferred when accuracy is unimportant."
    ],
    correctAnswer: 0,
    explanation: "The Orchestrator-Workers pattern is highly effective when a complex problem can be broken down into multiple independent subtasks (workers) that can run in parallel (e.g. searching 5 different databases, drafting 4 different sections of a report). The Orchestrator delegates the work, waits for workers to complete, and then synthesizes the results. This is vastly superior to a Sequential Chain, which has to process items one by one and suffers from accumulative latency and context loss."
  },
  {
    id: 10,
    domain: "Prompt Engineering & Structured Outputs",
    question: "You are implementing Prompt Caching in a customer service chatbot. The user chat log grows with each interaction. To maximize cache hits and optimize costs, how should you structure the messages sent to the Claude API?",
    options: [
      "Place the system prompt and system tools first, mark the end of the system block with a cache breakpoint, and append new chat messages to the end.",
      "Place the newest user message first, then the chat history, and put the system prompt at the very end.",
      "Clear the cache before every user message to ensure Claude does not hallucinate historical replies.",
      "Create a cache breakpoint on every single message in the chat log, including the newest user response."
    ],
    correctAnswer: 0,
    explanation: "Prompt Caching is prefix-based. To maximize hits, the static parts of your prompt—such as system prompts, instructions, and tool definitions—must be placed first and marked with a cache breakpoint (`'cache_control': {'type': 'ephemeral'}`). As the chat history grows, the static system prefix remains identical, allowing it to hit the cache consistently. The dynamic messages appended at the end do not invalidate the cached prefix. Breaking point on every single message is inefficient and can exceed cache limit caps."
  },
  {
    id: 11,
    domain: "Safety & Production",
    question: "What is 'Over-reliance' in enterprise AI deployment, and how does a Certified Architect mitigate this during interface design?",
    options: [
      "Users calling the API too many times, mitigated by implementing aggressive rate limits.",
      "Users blindly trusting LLM outputs without verifying correctness, mitigated by showing sources/citations and integrating explicit 'Review & Approve' steps for critical actions.",
      "The LLM relying too heavily on its system prompt, mitigated by removing system prompts from API requests.",
      "Relying too much on a single model instance, mitigated by load balancing between Sonnet and Haiku."
    ],
    correctAnswer: 1,
    explanation: "Over-reliance occurs when users assume LLM outputs are 100% correct, which can lead to severe mistakes in sensitive areas like medicine, law, or engineering. Certified Architects mitigate this by designing interfaces that emphasize human-in-the-loop validation, explicitly surfacing sources/citations, highlighting parts of text that the LLM was less confident about, and requiring manual confirmation for high-risk actions (such as sending code to production or charging customer accounts)."
  },
  {
    id: 12,
    domain: "Claude Ecosystem",
    question: "When building workspaces that use Claude Code, what is the role of the project-level `CLAUDE.md` file, and how does it differ from a standard `README.md`?",
    options: [
      "It contains project-specific instructions (build commands, style guides, test execution keys) optimized for Claude Code to read and follow during agentic editing.",
      "It is an encrypted binary file used to authorize Claude Code sessions via SSH keys.",
      "It replaces the `README.md` to explain the repo to human open-source contributors.",
      "It is a telemetry log that records all terminal commands run by the user to train future models."
    ],
    correctAnswer: 0,
    explanation: "A project-level `CLAUDE.md` is a special instructions file designed specifically for agentic coding tools like Claude Code. While a `README.md` explains the project to human users, `CLAUDE.md` outlines exact commands for building, running tests, style rules, and file structures. This ensures that Claude Code can run tests and conform to style guidelines seamlessly and correctly without having to guess or read lengthy human docs."
  },
  {
    id: 13,
    domain: "Model Context Protocol",
    question: "An architect wants to implement an MCP-based file search tool. Which JSON-RPC standard request message format would the MCP Client send to the MCP Server to trigger the tool `search_files` with arguments `query` and `path`?",
    options: [
      "POST /search_files HTTP/1.1 { 'query': '...', 'path': '...' }",
      "{ 'jsonrpc': '2.0', 'method': 'tools/call', 'params': { 'name': 'search_files', 'arguments': { 'query': '...', 'path': '...' } }, 'id': 1 }",
      "{ 'mcp_version': '1.0', 'action': 'execute', 'tool': 'search_files', 'inputs': [ '...', '...' ] }",
      "{ 'method': 'execute_tool', 'tool_name': 'search_files', 'args': { 'query': '...', 'path': '...' } }"
    ],
    correctAnswer: 1,
    explanation: "The Model Context Protocol relies strictly on the JSON-RPC 2.0 specification. To call a tool, the client sends a request object containing `jsonrpc: '2.0'`, `method: 'tools/call'`, and a `params` block specifying the tool's `name` and its schema-validated `arguments`. The request must also include a unique `id` for matching server replies."
  },
  {
    id: 14,
    domain: "System Architecture",
    question: "You are setting up an API client in a high-traffic e-commerce system that calls the Claude API. You are experiencing transient rate limits (HTTP 429 errors) during peak sales. Which retry strategy represents architectural best practice?",
    options: [
      "Immediate retry: Run a loop that retries the API request instantly without delay until a successful 200 response is received.",
      "Fail-fast: Instantly crash the user's checkout session to prevent memory leak issues.",
      "Exponential backoff with jitter: Wait a short base duration, double it with each successive failure, add a randomized variation ('jitter') to prevent thundering herds, and cap at a maximum retry count.",
      "Switch to a local open-source translation model instantly to handle customer carts without rate limiting."
    ],
    correctAnswer: 2,
    explanation: "For transient network and rate-limiting issues (HTTP 429/5xx), enterprise systems should implement exponential backoff with jitter. Exponential backoff increases the wait time between retries, giving the API server time to recover. Adding random noise ('jitter') breaks synchronization between parallel client instances, preventing them from hitting the API in unison ('thundering herd' effect) and causing further rate limits."
  },
  {
    id: 15,
    domain: "Agentic Workflows",
    question: "Which of the following scenarios represents the best fit for a single, well-crafted, zero-shot prompt using Claude 3.5 Sonnet, rather than implementing a complex multi-agent system?",
    options: [
      "Extracting structured contact details (Name, Email, Phone) from a standard email signature.",
      "Drafting, researching, reviewing, and editing a 10,000-word comprehensive economic policy review.",
      "Monitoring an internal database, running diagnostic shell commands to debug network issues, and deploying server patches automatically.",
      "Running an interactive student exam portal that adapts questions dynamically based on the student's historical answers."
    ],
    correctAnswer: 0,
    explanation: "Multi-agent systems add significant latency, API cost, and operational complexity. Architects should avoid over-engineering. For simple, deterministic, single-turn tasks (such as extracting clear structured details from text), a single well-crafted zero-shot prompt with Claude 3.5 Sonnet is extremely accurate, runs instantly, and is highly cost-effective."
  }
];
