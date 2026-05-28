import { questions } from '../data/questions.js';

/**
 * Exam Module - Manages interactive mock exam preparation.
 * Supports: (1) Full Shuffled Timed Exam, (2) Study Mode with Instant Explanation.
 */
export class ExamModule {
  constructor(appState) {
    this.appState = appState;
    this.container = null;
    this.currentMode = null; // 'timed' or 'study'
    this.activeQuestions = [];
    this.currentIndex = 0;
    this.userAnswers = {}; // id -> selectedIndex
    this.timerInterval = null;
    this.timeLeftSeconds = 0;
    this.showExplanations = false; // in study mode, true after submitting current question
  }

  mount(containerId) {
    this.container = document.getElementById(containerId);
    this.renderStartScreen();
  }

  // Render initial configuration screen
  renderStartScreen() {
    this.stopTimer();
    this.container.innerHTML = `
      <div class="exam-start-container glass-card">
        <div class="exam-header-decor">✍️</div>
        <h1>CCA Simulator Practice</h1>
        <p>Prepare for the real 301-level scenario-based Claude Certified Architect foundations certification under official exam conditions.</p>
        
        <div class="exam-rules">
          <div class="rule-item">⏱️ <span><strong>Timed Mode</strong>: 15 comprehensive questions, 20-minute limit. Explanations shown at the end.</span></div>
          <div class="rule-item">💡 <span><strong>Study Mode</strong>: Untimed. Instant architectural feedback and explanations after each submission.</span></div>
          <div class="rule-item">🎯 <span><strong>Pass Mark</strong>: 70% threshold is required to earn the Architect recommendation.</span></div>
        </div>

        <div class="action-row">
          <button class="btn btn-accent" id="start-timed-btn">Start Timed Exam</button>
          <button class="btn btn-secondary" id="start-study-btn">Study Mode (Instant Key)</button>
        </div>
      </div>
    `;

    document.getElementById('start-timed-btn').addEventListener('click', () => this.startExam('timed'));
    document.getElementById('start-study-btn').addEventListener('click', () => this.startExam('study'));
  }

  startExam(mode) {
    this.currentMode = mode;
    this.currentIndex = 0;
    this.userAnswers = {};
    this.showExplanations = false;

    // Shuffle questions for realism
    this.activeQuestions = [...questions].sort(() => Math.random() - 0.5);

    if (mode === 'timed') {
      this.timeLeftSeconds = 20 * 60; // 20 minutes
      this.startTimer();
    }

    this.renderQuestion();
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timeLeftSeconds--;
      this.updateTimerDisplay();
      if (this.timeLeftSeconds <= 0) {
        this.stopTimer();
        this.submitExam(true); // Forced submission
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const timerEl = document.getElementById('exam-timer');
    if (!timerEl) return;
    const mins = Math.floor(this.timeLeftSeconds / 60);
    const secs = this.timeLeftSeconds % 60;
    timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    if (this.timeLeftSeconds < 120) {
      timerEl.classList.add('timer-warning');
    } else {
      timerEl.classList.remove('timer-warning');
    }
  }

  renderQuestion() {
    if (!this.container) return;

    const q = this.activeQuestions[this.currentIndex];
    const selectedAnswer = this.userAnswers[q.id];
    const hasSubmitted = this.currentMode === 'study' && selectedAnswer !== undefined && this.showExplanations;

    this.container.innerHTML = `
      <div class="exam-workspace-grid">
        <!-- Dashboard Top Header Bar -->
        <div class="glass-card exam-hud card-span-full">
          <div class="hud-left">
            <span class="hud-badge">Question ${this.currentIndex + 1} of ${this.activeQuestions.length}</span>
            <span class="hud-domain">${q.domain}</span>
          </div>
          <div class="hud-right">
            ${this.currentMode === 'timed' ? `
              <span class="timer-label">Time Remaining:</span>
              <span class="timer-value" id="exam-timer">--:--</span>
            ` : `<span class="timer-label">Practice Mode (Untimed)</span>`}
            <button class="btn btn-sm btn-danger" id="quit-exam-btn">Quit Exam</button>
          </div>
        </div>

        <!-- Central Question Area -->
        <div class="glass-card question-box card-span-2">
          <div class="question-text">${q.question}</div>
          <div class="options-list">
            ${q.options.map((opt, index) => {
              let optClass = "option-card";
              let statusMark = "";
              
              if (selectedAnswer === index) {
                optClass += " selected";
              }

              // In study mode, show success/error directly if submitted
              if (hasSubmitted) {
                if (index === q.correctAnswer) {
                  optClass += " correct";
                  statusMark = " <span class='status-icon-correct'>✓ Correct</span>";
                } else if (selectedAnswer === index) {
                  optClass += " incorrect";
                  statusMark = " <span class='status-icon-incorrect'>✗ Your Choice</span>";
                }
                optClass += " disabled";
              }

              return `
                <div class="${optClass}" data-index="${index}">
                  <span class="option-prefix">${String.fromCharCode(65 + index)}</span>
                  <div class="option-content">${opt}${statusMark}</div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Explanation box -->
          ${hasSubmitted ? `
            <div class="glass-card explanation-panel animate-slide-up">
              <h3>Architectural Context</h3>
              <p>${q.explanation}</p>
            </div>
          ` : ''}

          <!-- Flow Nav controls -->
          <div class="exam-actions">
            <button class="btn btn-secondary" id="prev-q-btn" ${this.currentIndex === 0 ? 'disabled' : ''}>Previous</button>
            
            ${this.currentMode === 'study' && !hasSubmitted ? `
              <button class="btn btn-accent" id="submit-ans-btn" ${selectedAnswer === undefined ? 'disabled' : ''}>Submit Answer</button>
            ` : `
              ${this.currentIndex === this.activeQuestions.length - 1 ? `
                <button class="btn btn-success" id="finish-exam-btn">Submit & Finish</button>
              ` : `
                <button class="btn btn-accent" id="next-q-btn">Next Question</button>
              `}
            `}
          </div>
        </div>

        <!-- Question Grid Navigator (Sidebar) -->
        <div class="glass-card nav-sidebar">
          <h3>Question Map</h3>
          <div class="question-nav-grid">
            ${this.activeQuestions.map((qItem, idx) => {
              let gridClass = "nav-grid-item";
              if (idx === this.currentIndex) gridClass += " active";
              else if (this.userAnswers[qItem.id] !== undefined) gridClass += " answered";
              
              return `<div class="${gridClass}" data-idx="${idx}">${idx + 1}</div>`;
            }).join('')}
          </div>
          <div class="sidebar-help">
            <span class="help-bullet"><span class="bullet active"></span> Current</span>
            <span class="help-bullet"><span class="bullet answered"></span> Answered</span>
            <span class="help-bullet"><span class="bullet"></span> Unanswered</span>
          </div>
        </div>
      </div>
    `;

    // Hook listeners
    if (this.currentMode === 'timed') {
      this.updateTimerDisplay();
    }

    // Set interactive options clicks
    const options = this.container.querySelectorAll('.option-card');
    options.forEach(opt => {
      opt.addEventListener('click', () => {
        if (hasSubmitted) return; // Block changes after submission
        const index = parseInt(opt.getAttribute('data-index'));
        this.userAnswers[q.id] = index;
        
        // Visual refresh only
        options.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');

        // Unlock action button
        const submitBtn = document.getElementById('submit-ans-btn');
        if (submitBtn) submitBtn.removeAttribute('disabled');
      });
    });

    // Control hooks
    document.getElementById('prev-q-btn').addEventListener('click', () => {
      this.currentIndex--;
      this.showExplanations = true; // Retain submitted status
      this.renderQuestion();
    });

    const nextBtn = document.getElementById('next-q-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentIndex++;
        this.showExplanations = false;
        this.renderQuestion();
      });
    }

    const finishBtn = document.getElementById('finish-exam-btn');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => this.submitExam(false));
    }

    const submitAnsBtn = document.getElementById('submit-ans-btn');
    if (submitAnsBtn) {
      submitAnsBtn.addEventListener('click', () => {
        this.showExplanations = true;
        this.renderQuestion();
      });
    }

    // Question Grid Map navigation
    const gridItems = this.container.querySelectorAll('.nav-grid-item');
    gridItems.forEach(item => {
      item.addEventListener('click', () => {
        this.currentIndex = parseInt(item.getAttribute('data-idx'));
        this.showExplanations = false;
        this.renderQuestion();
      });
    });

    document.getElementById('quit-exam-btn').addEventListener('click', () => {
      if (confirm("Are you sure you want to quit the exam? Your progress will be lost.")) {
        this.renderStartScreen();
      }
    });
  }

  submitExam(timedOut = false) {
    this.stopTimer();
    if (timedOut) {
      alert("Time has expired! Submitting your answers automatically.");
    }

    // Calculate score details
    let correctCount = 0;
    const domainBreakdown = {};

    this.activeQuestions.forEach(q => {
      const selected = this.userAnswers[q.id];
      const isCorrect = selected === q.correctAnswer;

      if (isCorrect) correctCount++;

      if (!domainBreakdown[q.domain]) {
        domainBreakdown[q.domain] = { total: 0, correct: 0 };
      }
      domainBreakdown[q.domain].total++;
      if (isCorrect) {
        domainBreakdown[q.domain].correct++;
      }
    });

    // Save statistics in state and localStorage
    this.appState.dashboard.recordExamResult(this.activeQuestions.length, correctCount, domainBreakdown);

    this.renderResultScreen(correctCount, domainBreakdown);
  }

  renderResultScreen(correctCount, domainBreakdown) {
    const total = this.activeQuestions.length;
    const percent = Math.round((correctCount / total) * 100);
    const passed = percent >= 70;
    const feedbackTitle = passed ? "Architect Approved! 🏆" : "Architecture Review Required ⚠️";
    const feedbackClass = passed ? "pass" : "fail";

    this.container.innerHTML = `
      <div class="glass-card exam-results-container animate-fade-in">
        <div class="result-score-ring ${feedbackClass}">
          <span class="result-percentage">${percent}%</span>
          <span class="result-label">${correctCount}/${total} Correct</span>
        </div>

        <h1>${feedbackTitle}</h1>
        <p class="result-narrative">
          ${passed 
            ? "Outstanding performance! You successfully cleared the mock exam and proved your capability to architect secure, scalable, and highly efficient systems using the Claude ecosystem."
            : "You did not clear the 70% passing threshold. certified architects require rigorous engineering skills. Review your weaknesses below and try again."
          }
        </p>

        <h2>Performance Details by Syllabus Area</h2>
        <div class="domain-results-grid">
          ${Object.keys(domainBreakdown).map(domainName => {
            const val = domainBreakdown[domainName];
            const rate = Math.round((val.correct / val.total) * 100);
            let indicatorColor = "var(--success)";
            if (rate < 50) indicatorColor = "var(--danger)";
            else if (rate < 70) indicatorColor = "var(--accent)";

            return `
              <div class="domain-result-card">
                <span class="domain-result-label">${domainName}</span>
                <span class="domain-result-value" style="color: ${indicatorColor}">${rate}%</span>
                <span class="domain-result-fraction">${val.correct} of ${val.total} correct</span>
              </div>
            `;
          }).join('')}
        </div>

        <div class="action-row" style="margin-top: 2rem;">
          <button class="btn btn-accent" id="restart-exam-btn">Retry Mock Exam</button>
          <button class="btn btn-secondary" id="return-dashboard-btn">Go to Dashboard</button>
        </div>
      </div>
    `;

    document.getElementById('restart-exam-btn').addEventListener('click', () => this.mount(this.container.id));
    document.getElementById('return-dashboard-btn').addEventListener('click', () => {
      this.appState.navigateTo('dashboard');
    });
  }
}
