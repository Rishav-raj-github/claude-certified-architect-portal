/**
 * TokenFlowAnimator - Core physics and particle rendering engine.
 * Connects HTML elements with animated, glowing canvas particle streams.
 */
export class TokenFlowAnimator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.connections = [];
    this.nodes = [];
    this.active = false;
    this.animationFrameId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.animate();
  }

  stop() {
    this.active = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // Clear all connections and particles
  clear() {
    this.connections = [];
    this.particles = [];
    this.nodes = [];
  }

  // Set visual nodes to render static glowing bounds around
  setNodes(nodesList) {
    this.nodes = nodesList.map(node => {
      const rect = node.element.getBoundingClientRect();
      const parentRect = this.canvas.parentElement.getBoundingClientRect();
      return {
        id: node.id,
        x: (rect.left + rect.width / 2) - parentRect.left,
        y: (rect.top + rect.height / 2) - parentRect.top,
        color: node.color || '#d97706',
        pulse: 0
      };
    });
  }

  // Add a connection line between two nodes with stream properties
  addConnection(fromId, toId, options = {}) {
    const fromNode = this.nodes.find(n => n.id === fromId);
    const toNode = this.nodes.find(n => n.id === toId);

    if (!fromNode || !toNode) return;

    this.connections.push({
      from: fromNode,
      to: toNode,
      color: options.color || 'rgba(217, 119, 6, 0.25)',
      flowRate: options.flowRate || 1, // Particles spawned per frame frequency
      speed: options.speed || 2,
      particleColor: options.particleColor || '#e0a96d',
      active: true
    });
  }

  // Spawn a manual packet flow along a path
  spawnStream(fromId, toId, count = 20, color = '#d97706') {
    const fromNode = this.nodes.find(n => n.id === fromId);
    const toNode = this.nodes.find(n => n.id === toId);

    if (!fromNode || !toNode) return;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.active) return;
        this.particles.push({
          x: fromNode.x,
          y: fromNode.y,
          targetX: toNode.x,
          targetY: toNode.y,
          progress: 0,
          speed: 0.01 + Math.random() * 0.015,
          size: 2 + Math.random() * 3,
          color: color,
          pulse: Math.random() * Math.PI
        });
      }, i * 80);
    }
  }

  animate() {
    if (!this.active) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw connections
    this.connections.forEach(conn => {
      this.ctx.beginPath();
      this.ctx.strokeStyle = conn.color;
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 6]);
      this.ctx.moveTo(conn.from.x, conn.from.y);
      this.ctx.lineTo(conn.to.x, conn.to.y);
      this.ctx.stroke();
      this.ctx.setLineDash([]); // Reset

      // Periodically spawn particles automatically on connections
      if (Math.random() < 0.05 * conn.flowRate) {
        this.particles.push({
          x: conn.from.x,
          y: conn.from.y,
          targetX: conn.to.x,
          targetY: conn.to.y,
          progress: 0,
          speed: 0.005 + Math.random() * 0.01,
          size: 2 + Math.random() * 2,
          color: conn.particleColor,
          pulse: Math.random() * Math.PI
        });
      }
    });

    // 2. Draw active flow particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.progress += p.speed;

      if (p.progress >= 1) {
        this.particles.splice(i, 1);
        continue;
      }

      // Calculate path with slight dynamic wave bezier offsets for aesthetics
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      
      // Dynamic coordinate
      const currentX = p.x + dx * p.progress;
      const currentY = p.y + dy * p.progress;

      // Glow effect
      this.ctx.beginPath();
      p.pulse += 0.1;
      const alpha = 0.5 + Math.sin(p.pulse) * 0.3;
      
      const grad = this.ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, p.size * 3);
      grad.addColorStop(0, p.color);
      grad.addColorStop(0.3, p.color);
      grad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = grad;
      this.ctx.arc(currentX, currentY, p.size * 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 3. Draw static nodes background pulsing halos
    this.nodes.forEach(node => {
      node.pulse += 0.03;
      const radius = 25 + Math.sin(node.pulse) * 5;

      this.ctx.beginPath();
      this.ctx.strokeStyle = node.color + '1a'; // Very transparent
      this.ctx.lineWidth = 1.5;
      this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.strokeStyle = node.color + '0a'; // Even more transparent
      this.ctx.lineWidth = 1;
      this.ctx.arc(node.x, node.y, radius + 10, 0, Math.PI * 2);
      this.ctx.stroke();
    });

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}
