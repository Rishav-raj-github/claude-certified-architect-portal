import { DashboardModule } from './modules/dashboard.js';
import { ExamModule } from './modules/exam.js';
import { WorkflowLabModule } from './modules/workflowLab.js';
import { McpSandboxModule } from './modules/mcpSandbox.js';
import { CliLabModule } from './modules/cliLab.js';

/**
 * Main Application Orchestrator for the Claude Certified Architect Portal.
 * Initializes modules, handles SPA navigation, and synchronizes state.
 */
class AppState {
  constructor() {
    this.currentView = 'dashboard';
    
    // Instantiate core modules
    this.dashboard = new DashboardModule(this);
    this.exam = new ExamModule(this);
    this.workflow = new WorkflowLabModule(this);
    this.mcp = new McpSandboxModule(this);
    this.cli = new CliLabModule(this);

    this.initNavigation();
  }

  // SPA navigation handling
  initNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetView = item.getAttribute('data-view');
        this.navigateTo(targetView);
      });
    });

    // Delegate dynamic links inside panels (e.g., advisory clicks)
    document.body.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('.nav-trigger-btn');
      if (targetBtn) {
        const targetView = targetBtn.getAttribute('data-target');
        this.navigateTo(targetView);
      }
    });
  }

  navigateTo(viewId) {
    if (this.currentView === viewId) return;

    // Remove active styles on sidebar items
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Manage container visual transitions
    const currentContainer = document.getElementById(`${this.currentView}-section`);
    const targetContainer = document.getElementById(`${viewId}-section`);

    if (currentContainer && targetContainer) {
      currentContainer.classList.remove('active');
      currentContainer.style.display = 'none';
      
      targetContainer.style.display = 'block';
      // Force repaint then add active opacity class
      setTimeout(() => targetContainer.classList.add('active'), 20);
    }

    // Run active mount procedures for component lifecycle
    this.currentView = viewId;
    this.mountActiveComponent();
  }

  mountActiveComponent() {
    switch (this.currentView) {
      case 'dashboard':
        this.dashboard.mount('dashboard-section');
        break;
      case 'exam':
        this.exam.mount('exam-section');
        break;
      case 'workflow':
        this.workflow.mount('workflow-section');
        break;
      case 'mcp':
        this.mcp.mount('mcp-section');
        break;
      case 'cli':
        this.cli.mount('cli-section');
        break;
    }
  }

  initialize() {
    // Start by mounting the default dashboard view
    this.navigateTo('dashboard');
  }
}

// Global bootstrap
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppState();
  app.initialize();
});
