/**
 * Dashboard Module - Tracks learning progress, exam history,
 * domain proficiency, and stores stats in localStorage.
 */
export class DashboardModule {
  constructor(appState) {
    this.appState = appState;
    this.container = null;
    this.initStats();
  }

  // Set default values in localStorage if they don't exist
  initStats() {
    const defaultStats = {
      examsTaken: 0,
      highScore: 0,
      averageScore: 0,
      totalQuestionsAnswered: 0,
      timeSpentMinutes: 12, // Starting seed for realism
      completedLabs: [],
      domainScores: {
        "System Architecture": { total: 0, correct: 0, percentage: 0 },
        "Model Context Protocol": { total: 0, correct: 0, percentage: 0 },
        "Agentic Workflows": { total: 0, correct: 0, percentage: 0 },
        "Prompt Engineering & Structured Outputs": { total: 0, correct: 0, percentage: 0 },
        "Safety & Production": { total: 0, correct: 0, percentage: 0 }
      }
    };

    if (!localStorage.getItem('cca_portal_stats')) {
      localStorage.setItem('cca_portal_stats', JSON.stringify(defaultStats));
    }

    // Keep active session timer running in background
    setInterval(() => {
      const stats = this.getStats();
      stats.timeSpentMinutes += 1;
      this.saveStats(stats);
      this.updateTimeDisplay();
    }, 60000);
  }

  getStats() {
    return JSON.parse(localStorage.getItem('cca_portal_stats'));
  }

  saveStats(stats) {
    localStorage.setItem('cca_portal_stats', JSON.stringify(stats));
  }

  updateTimeDisplay() {
    const elapsedEl = document.getElementById('stat-time-spent');
    if (elapsedEl) {
      const stats = this.getStats();
      elapsedEl.textContent = `${stats.timeSpentMinutes} mins`;
    }
  }

  // Update statistics after taking a mock exam
  recordExamResult(totalQuestions, correctCount, domainBreakdown) {
    const stats = this.getStats();
    const percent = Math.round((correctCount / totalQuestions) * 100);

    stats.examsTaken += 1;
    stats.totalQuestionsAnswered += totalQuestions;
    stats.highScore = Math.max(stats.highScore, percent);
    
    // Recalculate average score
    stats.averageScore = Math.round(((stats.averageScore * (stats.examsTaken - 1)) + percent) / stats.examsTaken);

    // Accumulate domain proficiency scores
    Object.keys(domainBreakdown).forEach(domain => {
      if (!stats.domainScores[domain]) {
        stats.domainScores[domain] = { total: 0, correct: 0, percentage: 0 };
      }
      stats.domainScores[domain].total += domainBreakdown[domain].total;
      stats.domainScores[domain].correct += domainBreakdown[domain].correct;
      stats.domainScores[domain].percentage = Math.round(
        (stats.domainScores[domain].correct / stats.domainScores[domain].total) * 100
      );
    });

    this.saveStats(stats);
    if (this.container) {
      this.render();
    }
  }

  // Mark interactive lab completion
  completeLab(labId) {
    const stats = this.getStats();
    if (!stats.completedLabs.includes(labId)) {
      stats.completedLabs.push(labId);
      this.saveStats(stats);
      this.render();
    }
  }

  mount(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
  }

  render() {
    if (!this.container) return;
    const stats = this.getStats();
    const labProgress = Math.round((stats.completedLabs.length / 3) * 100);

    // Calculate dynamic global readiness score based on docs completed + exam scores
    const examFactor = stats.examsTaken > 0 ? stats.averageScore * 0.7 : 0;
    const labFactor = labProgress * 0.3;
    const readinessScore = Math.min(100, Math.round(examFactor + labFactor + (stats.examsTaken > 0 ? 10 : 0)));

    let statusText = "Fledgling Architect";
    let statusClass = "status-amber";
    if (readinessScore >= 80) {
      statusText = "Certified Architect Ready";
      statusClass = "status-green";
    } else if (readinessScore >= 45) {
      statusText = "Intermediate Builder";
      statusClass = "status-cyan";
    }

    this.container.innerHTML = `
      <div class="dashboard-grid">
        
        <!-- Welcome Hero Banner -->
        <div class="glass-card hero-banner card-span-full">
          <div class="hero-content">
            <span class="badge ${statusClass}">${statusText}</span>
            <h1>Claude Certified Architect Certification</h1>
            <p>Welcome to the ultimate interactive preparation system and architecture lab. Master Model Context Protocol (MCP), multi-agent orchestration, and prompt caching to architect cutting-edge, production-ready AI systems.</p>
            <div class="readiness-meter-container">
              <div class="readiness-label">
                <span>Overall Exam Readiness</span>
                <span class="readiness-percentage">${readinessScore}%</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${readinessScore}%; background: var(--accent-gradient);"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Metric Counter Grid -->
        <div class="glass-card metric-card">
          <div class="metric-icon">⏱️</div>
          <div class="metric-info">
            <span class="metric-value" id="stat-time-spent">${stats.timeSpentMinutes} mins</span>
            <span class="metric-label">Active Practice Time</span>
          </div>
        </div>

        <div class="glass-card metric-card">
          <div class="metric-icon">📝</div>
          <div class="metric-info">
            <span class="metric-value">${stats.examsTaken}</span>
            <span class="metric-label">Mock Exams Completed</span>
          </div>
        </div>

        <div class="glass-card metric-card">
          <div class="metric-icon">🎯</div>
          <div class="metric-info">
            <span class="metric-value">${stats.highScore}%</span>
            <span class="metric-label">High Exam Score</span>
          </div>
        </div>

        <div class="glass-card metric-card">
          <div class="metric-icon">⚖️</div>
          <div class="metric-info">
            <span class="metric-value">${stats.averageScore}%</span>
            <span class="metric-label">Average Performance</span>
          </div>
        </div>

        <!-- Domain Mastery Panel -->
        <div class="glass-card card-span-2">
          <h2>Syllabus Domain Mastery</h2>
          <p class="section-description">A real-time evaluation of your strengths based on simulator metrics.</p>
          <div class="domain-list">
            ${Object.keys(stats.domainScores).map(domainName => {
              const domStats = stats.domainScores[domainName];
              const score = domStats.percentage || 0;
              let barColor = "var(--accent)";
              if (score >= 80) barColor = "var(--success)";
              else if (score >= 50) barColor = "var(--primary)";
              
              return `
                <div class="domain-progress-row">
                  <div class="domain-name-header">
                    <span>${domainName}</span>
                    <span class="percentage-label">${score}%</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${score}%; background: ${barColor};"></div>
                  </div>
                  <span class="detail-label">${domStats.correct}/${domStats.total} correct answers logged</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Dynamic Study Advisory -->
        <div class="glass-card card-span-1">
          <h2>Diagnostic Recommendations</h2>
          <div class="advisory-list">
            ${this.generateAdvisory(stats, readinessScore)}
          </div>
        </div>

      </div>
    `;
  }

  // Generates intelligent feedback based on user strengths & weaknesses
  generateAdvisory(stats, readinessScore) {
    const suggestions = [];

    // Base suggestions for new users
    if (stats.examsTaken === 0) {
      return `
        <div class="advisory-item warning">
          <div class="advisory-icon">⚠️</div>
          <div class="advisory-content">
            <h4>No Simulator Data Detected</h4>
            <p>Take your first full-length CCA simulator exam to test your skills and construct your baseline proficiency metrics.</p>
            <button class="btn btn-sm btn-accent nav-trigger-btn" data-target="exam">Start Mock Exam</button>
          </div>
        </div>
        <div class="advisory-item info">
          <div class="advisory-icon">🧪</div>
          <div class="advisory-content">
            <h4>Explore the MCP Sandbox</h4>
            <p>Model Context Protocol comprises 25% of the exam. Simulate JSON-RPC protocol exchanges directly in the lab.</p>
            <button class="btn btn-sm nav-trigger-btn" data-target="mcp">Open MCP Sandbox</button>
          </div>
        </div>
      `;
    }

    // Weakest domain calculation
    let weakestDomain = null;
    let lowestScore = 101;
    
    Object.keys(stats.domainScores).forEach(d => {
      const dStats = stats.domainScores[d];
      if (dStats.total > 0 && dStats.percentage < lowestScore) {
        lowestScore = dStats.percentage;
        weakestDomain = d;
      }
    });

    if (weakestDomain && lowestScore < 75) {
      let adviceText = "";
      let targetTab = "workflow";
      
      switch (weakestDomain) {
        case "System Architecture":
          adviceText = "Focus on prompt caching structures, latency optimizations, and asynchronous concurrency strategies.";
          targetTab = "workflow";
          break;
        case "Model Context Protocol":
          adviceText = "Inspect the live client-server handshake. Memorize tools/list, resources/read schemas, and STDIO transport channels.";
          targetTab = "mcp";
          break;
        case "Agentic Workflows":
          adviceText = "Examine Evaluator-Optimizer loops, routing nodes, and token-cost calculators in our Workflow Canvas.";
          targetTab = "workflow";
          break;
        case "Prompt Engineering & Structured Outputs":
          adviceText = "Study JSON schema tool specifications and forced tool execution mechanisms.";
          targetTab = "exam";
          break;
        case "Safety & Production":
          adviceText = "Review input pre-guardrails and output post-filters using dual-model architectures.";
          targetTab = "exam";
          break;
      }

      suggestions.push(`
        <div class="advisory-item danger animate-pulse">
          <div class="advisory-icon">🚨</div>
          <div class="advisory-content">
            <h4>Critical Target: ${weakestDomain}</h4>
            <p>Your performance is weakest here (${lowestScore}%). ${adviceText}</p>
            <button class="btn btn-sm btn-accent nav-trigger-btn" data-target="${targetTab}">Practice in Lab</button>
          </div>
        </div>
      `);
    } else if (readinessScore >= 80) {
      suggestions.push(`
        <div class="advisory-item success">
          <div class="advisory-icon">🏆</div>
          <div class="advisory-content">
            <h4>Architect Status Achieved</h4>
            <p>Excellent work! You are scoring at production-grade standards. Review the open-source GitHub package configs and prepare to pass the exam.</p>
          </div>
        </div>
      `);
    }

    // Interactive labs completions
    if (stats.completedLabs.length < 3) {
      suggestions.push(`
        <div class="advisory-item info">
          <div class="advisory-icon">🛠️</div>
          <div class="advisory-content">
            <h4>Practical Labs Incomplete</h4>
            <p>Complete the interactive laboratory tasks (Claude Code Terminal, MCP Sandbox, Workflow Builder) to claim full points.</p>
          </div>
        </div>
      `);
    }

    return suggestions.join('');
  }
}
