document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('doodleArea');
    const ctx = canvas.getContext('2d');
    const playSoundButton = document.getElementById('playSoundButton');
    const clearButton = document.getElementById('clearButton');
    const colorBrushes = document.querySelectorAll('.color-brush');
    const brushSizeInput = document.getElementById('brushSize');

    let drawing = false;
    let currentColor = 'black';
    let currentBrushSize = 5;
    let audioContext;
    let lastX, lastY;

    // Store drawing strokes as objects: { points: [{x, y, color, size}], startTime: x_value }
    // Simpler: Store individual points with their properties
    let drawnPoints = []; // Array of {x, y, color, size, time (relative to X)}

    // Set canvas dimensions (can be responsive)
    const canvasWidth = Math.min(window.innerWidth - 60, 500); // Max width 500px or viewport width
    const canvasHeight = 300;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.fillStyle = "white"; // Ensure canvas background is white for pixel data retrieval
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    function getAudioContext() {
        if (!audioContext || audioContext.state === 'closed') {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    function setActiveBrush(selectedButton) {
        colorBrushes.forEach(button => button.classList.remove('active'));
        selectedButton.classList.add('active');
        currentColor = selectedButton.dataset.color;
    }

    colorBrushes.forEach(button => {
        button.addEventListener('click', () => setActiveBrush(button));
        if (button.dataset.color === currentColor) {
            setActiveBrush(button); // Set initial active brush
        }
    });

    brushSizeInput.addEventListener('input', (e) => {
        currentBrushSize = parseInt(e.target.value, 10);
    });

    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX, clientY;
        if (evt.touches && evt.touches.length > 0) {
            clientX = evt.touches[0].clientX;
            clientY = evt.touches[0].clientY;
        } else {
            clientX = evt.clientX;
            clientY = evt.clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        e.preventDefault(); // Prevent default touch actions like scrolling
        drawing = true;
        const pos = getMousePos(canvas, e);
        lastX = pos.x;
        lastY = pos.y;
        draw(e); // Draw a dot on mousedown/touchstart
    }

    function stopDrawing() {
        if (!drawing) return;
        drawing = false;
        ctx.beginPath(); // Reset current path
    }

    function draw(e) {
        if (!drawing) return;
        e.preventDefault();

        const pos = getMousePos(canvas, e);

        ctx.lineWidth = currentBrushSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = currentColor;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        // Store points along the line for sound generation
        // For simplicity, let's store the end point of this segment
        // A more robust way would be to interpolate points along the line
        drawnPoints.push({
            x: pos.x,
            y: pos.y,
            color: currentColor,
            size: currentBrushSize,
            time: pos.x / canvas.width // Normalized time based on X position
        });

        lastX = pos.x;
        lastY = pos.y;
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);


    clearButton.addEventListener('click', () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawnPoints = [];
        if (audioContext && audioContext.state === 'running') {
            audioContext.close(); // Stop any ongoing sound
        }
    });

    playSoundButton.addEventListener('click', async () => {
        if (drawnPoints.length === 0) {
            alert("Please draw something first!");
            return;
        }

        playSoundButton.disabled = true;
        const localAudioContext = getAudioContext();
        // Resume context if it's suspended (e.g., due to browser autoplay policies)
        if (localAudioContext.state === 'suspended') {
            await localAudioContext.resume();
        }

        // Sort points by their X-coordinate to play from left to right
        const sortedPoints = [...drawnPoints].sort((a, b) => a.x - b.x);

        const totalDuration = 3; // seconds for the entire drawing playback
        const baseFrequency = 100; // Hz (C3)
        const frequencyRange = 800; // Hz (up to ~A5)

        sortedPoints.forEach(point => {
            const oscillator = localAudioContext.createOscillator();
            const gainNode = localAudioContext.createGain();

            // Map Y to frequency (higher on canvas = higher pitch)
            const pitch = baseFrequency + ((canvas.height - point.y) / canvas.height) * frequencyRange;
            oscillator.frequency.setValueAtTime(pitch, localAudioContext.currentTime);

            // Map color to waveform type
            switch (point.color) {
                case 'red':    oscillator.type = 'sine'; break;
                case 'blue':   oscillator.type = 'square'; break;
                case 'green':  oscillator.type = 'sawtooth'; break;
                case 'yellow': oscillator.type = 'triangle'; break;
                case 'purple': oscillator.type = 'sine'; gainNode.gain.value = 0.7; break; // Softer sine
                default:       oscillator.type = 'sine';
            }

            // Map brush size to volume (subtly)
            const volume = 0.3 + (point.size / brushSizeInput.max) * 0.4; // Volume from 0.3 to 0.7
            gainNode.gain.setValueAtTime(volume, localAudioContext.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(localAudioContext.destination);

            const startTime = localAudioContext.currentTime + (point.x / canvas.width) * totalDuration;
            const noteDuration = 0.15; // Duration of each individual note sound

            oscillator.start(startTime);
            // Fade out the note quickly
            gainNode.gain.setValueAtTime(volume, startTime);
            gainNode.gain.linearRampToValueAtTime(0.0001, startTime + noteDuration);
            oscillator.stop(startTime + noteDuration + 0.05); // Stop slightly after fade out
        });

        // Re-enable button after sound playback is estimated to finish
        setTimeout(() => {
            playSoundButton.disabled = false;
        }, (totalDuration + 0.5) * 1000);
    });
});