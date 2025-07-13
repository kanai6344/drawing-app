class DrawingApp {
    constructor() {
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.history = [];
        this.historyIndex = -1;
        this.currentTool = 'pen';
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.zoomLevel = 1;
        this.primaryColor = '#000000';
        this.secondaryColor = '#ffffff';
        this.brushSize = 10;
        this.opacity = 1;
        this.backgroundColor = '#ffffff';
        this.canvasOffset = { x: 0, y: 0 };
        
        this.initElements();
        this.initEventListeners();
        this.resizeCanvas();
        this.updateCanvasBackground();
        this.saveState();
    }
    
    initElements() {
        // Tools
        this.toolButtons = document.querySelectorAll('.tool-btn');
        this.penTool = document.querySelector('[data-tool="pen"]');
        this.markerTool = document.querySelector('[data-tool="marker"]');
        this.sprayTool = document.querySelector('[data-tool="spray"]');
        this.eraserTool = document.querySelector('[data-tool="eraser"]');
        
        // Colors
        this.primaryColorInput = document.getElementById('primary-color');
        this.secondaryColorInput = document.getElementById('secondary-color');
        this.swapColorsBtn = document.getElementById('swap-colors');
        this.colorPresets = document.querySelectorAll('.preset');
        this.backgroundColorInput = document.getElementById('background-color');
        
        // Settings
        this.brushSizeInput = document.getElementById('brush-size');
        this.brushSizeValue = document.getElementById('brush-size-value');
        this.opacityInput = document.getElementById('opacity');
        this.opacityValue = document.getElementById('opacity-value');
        
        // Actions
        this.undoBtn = document.getElementById('undo-btn');
        this.redoBtn = document.getElementById('redo-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.saveBtn = document.getElementById('save-btn');
        this.loadBtn = document.getElementById('load-btn');
        this.newBtn = document.getElementById('new-btn');
        
        // Zoom
        this.zoomInBtn = document.getElementById('zoom-in');
        this.zoomOutBtn = document.getElementById('zoom-out');
        this.zoomResetBtn = document.getElementById('zoom-reset');
        this.zoomLevelDisplay = document.getElementById('zoom-level');
        
        // Status
        this.cursorPositionDisplay = document.getElementById('cursor-position');
        this.toolInfoDisplay = document.getElementById('tool-info');
        
        // Dialogs
        this.saveDialog = document.getElementById('save-dialog');
        this.loadDialog = document.getElementById('load-dialog');
        this.filenameInput = document.getElementById('filename-input');
        this.fileInput = document.getElementById('file-input');
        this.cancelSaveBtn = document.getElementById('cancel-save');
        this.confirmSaveBtn = document.getElementById('confirm-save');
        this.cancelLoadBtn = document.getElementById('cancel-load');
        this.confirmLoadBtn = document.getElementById('confirm-load');
    }
    
    initEventListeners() {
        // Window events
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
        this.canvas.addEventListener('mousemove', (e) => this.updateCursorPosition(e));
        
        // Tool buttons
        this.toolButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setTool(btn.dataset.tool));
        });
        
        // Color inputs
        this.primaryColorInput.addEventListener('input', () => {
            this.primaryColor = this.primaryColorInput.value;
        });
        
        this.secondaryColorInput.addEventListener('input', () => {
            this.secondaryColor = this.secondaryColorInput.value;
        });
        
        this.swapColorsBtn.addEventListener('click', () => this.swapColors());
        
        this.colorPresets.forEach(preset => {
            preset.addEventListener('click', () => {
                this.primaryColor = getComputedStyle(preset).backgroundColor;
                this.primaryColorInput.value = this.rgbToHex(this.primaryColor);
            });
        });
        
        this.backgroundColorInput.addEventListener('input', () => {
            this.backgroundColor = this.backgroundColorInput.value;
            this.updateCanvasBackground();
            this.saveState();
        });
        
        // Settings inputs
        this.brushSizeInput.addEventListener('input', () => {
            this.brushSize = parseInt(this.brushSizeInput.value);
            this.brushSizeValue.textContent = this.brushSize;
            this.updateToolInfo();
        });
        
        this.opacityInput.addEventListener('input', () => {
            this.opacity = parseInt(this.opacityInput.value) / 100;
            this.opacityValue.textContent = this.opacityInput.value;
        });
        
        // Action buttons
        this.undoBtn.addEventListener('click', () => this.undo());
        this.redoBtn.addEventListener('click', () => this.redo());
        this.clearBtn.addEventListener('click', () => this.clearCanvas());
        this.saveBtn.addEventListener('click', () => this.showSaveDialog());
        this.loadBtn.addEventListener('click', () => this.showLoadDialog());
        this.newBtn.addEventListener('click', () => this.newCanvas());
        
        // Zoom buttons
        this.zoomInBtn.addEventListener('click', () => this.adjustZoom(1.2));
        this.zoomOutBtn.addEventListener('click', () => this.adjustZoom(0.8));
        this.zoomResetBtn.addEventListener('click', () => this.resetZoom());
        
        // Dialog buttons
        this.cancelSaveBtn.addEventListener('click', () => this.saveDialog.close());
        this.confirmSaveBtn.addEventListener('click', () => this.saveCanvas());
        this.cancelLoadBtn.addEventListener('click', () => this.loadDialog.close());
        this.confirmLoadBtn.addEventListener('click', () => this.loadImage());
        
        this.fileInput.addEventListener('change', () => {
            this.confirmLoadBtn.disabled = !this.fileInput.files.length;
        });
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Set canvas size to match container size
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Redraw the current state
        this.restoreState();
    }
    
    updateCanvasBackground() {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    setTool(tool) {
        this.currentTool = tool;
        
        // Update active tool button
        this.toolButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        
        // Update cursor
        this.canvas.style.cursor = tool === 'eraser' ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 16 16\'><rect x=\'0\' y=\'0\' width=\'16\' height=\'16\' fill=\'white\' stroke=\'black\'/><line x1=\'0\' y1=\'0\' x2=\'16\' y2=\'16\' stroke=\'black\' stroke-width=\'1\'/></svg>") 8 8, auto' : 'crosshair';
        
        this.updateToolInfo();
    }
    
    updateToolInfo() {
        let toolName;
        switch(this.currentTool) {
            case 'pen': toolName = 'Pen'; break;
            case 'marker': toolName = 'Marker'; break;
            case 'spray': toolName = 'Spray'; break;
            case 'eraser': toolName = 'Eraser'; break;
            default: toolName = 'Pen';
        }
        this.toolInfoDisplay.textContent = `Tool: ${toolName} | Size: ${this.brushSize}px`;
    }
    
    updateCursorPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) / this.zoomLevel);
        const y = Math.round((e.clientY - rect.top) / this.zoomLevel);
        this.cursorPositionDisplay.textContent = `X: ${x}, Y: ${y}`;
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getPosition(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        // For tools that need immediate drawing (like spray)
        if (this.currentTool === 'spray') {
            this.draw(e);
        }
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getPosition(e);
        const x = pos.x;
        const y = pos.y;
        
        this.ctx.globalAlpha = this.opacity;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        switch(this.currentTool) {
            case 'pen':
                this.drawPen(x, y);
                break;
            case 'marker':
                this.drawMarker(x, y);
                break;
            case 'spray':
                this.drawSpray(x, y);
                break;
            case 'eraser':
                this.drawEraser(x, y);
                break;
        }
        
        this.lastX = x;
        this.lastY = y;
    }
    
    drawPen(x, y) {
        this.ctx.strokeStyle = this.primaryColor;
        this.ctx.lineWidth = this.brushSize;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
    
    drawMarker(x, y) {
        this.ctx.strokeStyle = this.primaryColor;
        this.ctx.lineWidth = this.brushSize * 2;
        this.ctx.globalAlpha = this.opacity * 0.3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
    
    drawSpray(x, y) {
        this.ctx.fillStyle = this.primaryColor;
        const radius = this.brushSize / 2;
        const density = this.brushSize * 2;
        
        for (let i = 0; i < density; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            const sprayX = x + Math.cos(angle) * distance;
            const sprayY = y + Math.sin(angle) * distance;
            
            this.ctx.beginPath();
            this.ctx.arc(sprayX, sprayY, 1, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawEraser(x, y) {
        this.ctx.strokeStyle = this.backgroundColor;
        this.ctx.lineWidth = this.brushSize;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
    
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }
    
    getPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.canvasOffset.x) / this.zoomLevel,
            y: (e.clientY - rect.top - this.canvasOffset.y) / this.zoomLevel
        };
    }
    
    swapColors() {
        [this.primaryColor, this.secondaryColor] = [this.secondaryColor, this.primaryColor];
        this.primaryColorInput.value = this.primaryColor;
        this.secondaryColorInput.value = this.secondaryColor;
    }
    
    saveState() {
        // Remove any states after current index (for redo)
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Limit history size
        if (this.history.length >= 20) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        // Save current canvas state
        this.history.push(this.canvas.toDataURL());
        
        // Update button states
        this.updateHistoryButtons();
    }
    
    restoreState() {
        if (this.historyIndex >= 0 && this.historyIndex < this.history.length) {
            const img = new Image();
            img.onload = () => {
                this.updateCanvasBackground();
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = this.history[this.historyIndex];
        } else {
            this.updateCanvasBackground();
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState();
            this.updateHistoryButtons();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState();
            this.updateHistoryButtons();
        }
    }
    
    updateHistoryButtons() {
        this.undoBtn.disabled = this.historyIndex <= 0;
        this.redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }
    
    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.updateCanvasBackground();
            this.saveState();
        }
    }
    
    newCanvas() {
        if (confirm('Start a new drawing? Your current drawing will be lost.')) {
            this.history = [];
            this.historyIndex = -1;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.updateCanvasBackground();
            this.saveState();
        }
    }
    
    showSaveDialog() {
        this.filenameInput.value = `drawing-${new Date().toISOString().slice(0, 10)}`;
        this.saveDialog.showModal();
    }
    
    saveCanvas() {
        const filename = this.filenameInput.value;
        const format = document.querySelector('input[name="format"]:checked').value;
        
        let mimeType, extension;
        switch(format) {
            case 'jpeg':
                mimeType = 'image/jpeg';
                extension = 'jpg';
                break;
            case 'webp':
                mimeType = 'image/webp';
                extension = 'webp';
                break;
            default:
                mimeType = 'image/png';
                extension = 'png';
        }
        
        const link = document.createElement('a');
        link.download = `${filename}.${extension}`;
        link.href = this.canvas.toDataURL(mimeType);
        link.click();
        
        this.saveDialog.close();
    }
    
    showLoadDialog() {
        this.loadDialog.showModal();
    }
    
    loadImage() {
        const file = this.fileInput.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Clear canvas and draw the loaded image
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                this.saveState();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        this.loadDialog.close();
    }
    
    adjustZoom(factor) {
        this.zoomLevel *= factor;
        this.updateZoom();
    }
    
    resetZoom() {
        this.zoomLevel = 1;
        this.updateZoom();
    }
    
    updateZoom() {
        this.canvas.style.transform = `scale(${this.zoomLevel})`;
        this.zoomLevelDisplay.textContent = `Zoom: ${Math.round(this.zoomLevel * 100)}%`;
    }
    
    handleKeyboardShortcuts(e) {
        // Don't trigger if typing in an input field
        if (e.target.tagName === 'INPUT') return;
        
        // Check for Ctrl key (or Cmd on Mac)
        const ctrlKey = e.ctrlKey || e.metaKey;
        
        if (ctrlKey) {
            switch(e.key.toLowerCase()) {
                case 'z':
                    if (e.shiftKey) this.redo();
                    else this.undo();
                    e.preventDefault();
                    break;
                case 'y':
                    this.redo();
                    e.preventDefault();
                    break;
                case 's':
                    this.showSaveDialog();
                    e.preventDefault();
                    break;
                case 'n':
                    this.newCanvas();
                    e.preventDefault();
                    break;
                case '+':
                    this.adjustZoom(1.2);
                    e.preventDefault();
                    break;
                case '-':
                    this.adjustZoom(0.8);
                    e.preventDefault();
                    break;
                case '0':
                    this.resetZoom();
                    e.preventDefault();
                    break;
                case 'delete':
                    this.clearCanvas();
                    e.preventDefault();
                    break;
            }
        } else {
            switch(e.key.toLowerCase()) {
                case 'p':
                    this.setTool('pen');
                    break;
                case 'm':
                    this.setTool('marker');
                    break;
                case 's':
                    this.setTool('spray');
                    break;
                case 'e':
                    this.setTool('eraser');
                    break;
                case 'x':
                    this.swapColors();
                    break;
            }
        }
    }
    
    rgbToHex(rgb) {
        // Convert rgb(r, g, b) to hex
        if (rgb.startsWith('#')) return rgb;
        
        const parts = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!parts) return '#000000';
        
        const r = parseInt(parts[1]).toString(16).padStart(2, '0');
        const g = parseInt(parts[2]).toString(16).padStart(2, '0');
        const b = parseInt(parts[3]).toString(16).padStart(2, '0');
        
        return `#${r}${g}${b}`;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DrawingApp();
});
