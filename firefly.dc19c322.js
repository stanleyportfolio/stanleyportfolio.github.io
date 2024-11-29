// Configuration
const CONFIG = {
    curveIntervalMin: 300,
    curveIntervalMax: 1700,
    initialDistanceMultiplier: 1,
    nodeDistanceMin: 0.01,
    nodeDistanceMax: 0.1,
    controlPointMultiplier: 1,
    controlPointWeightMin: 0.1,
    controlPointWeightMax: 0.8,
    controlPointOffsetMin: 0.2,
    controlPointOffsetMax: 2.0,
    movementSpeed: 0.2,
    frameTime: 16.67,
    fireflySize: 10,
    numFireflies: 500,
    redundancyFactor: 2,
    fftSize: 1024,
    blinkIntervalMin: 100,
    blinkIntervalMax: 1000,
    loudnessScaleMin: 25,
    loudnessScaleMax: 300,
    loudnessThreshold: 0.25,
    lifespanThreshold: 0.75,
    responseTypeBelow: "linear",
    responseTypeAbove: "hyperExponential",
    debugFlightPath: true
};
// Globals
let audioContext = null;
let audioSource = null;
let leftAnalyser = null;
let rightAnalyser = null;
let animationFrameId = null;
const fireflies = [];
let leftFrequencyData = [];
let rightFrequencyData = [];
// Canvas Setup
const canvas = document.getElementById("fireflyCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// Helper to clamp positions within screen bounds
function clampPosition(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
// Resets a firefly's properties when lifespan ends
function resetFirefly(firefly, frequencyData) {
    firefly.fixedLoudness = frequencyData[firefly.frequencyIndex] / 255; // Normalize loudness
    if (firefly.fixedLoudness < CONFIG.loudnessThreshold) {
        firefly.lifeSpan = 0; // Deactivate the fly
        return; // Skip further initialization
    }
    const scaledLoudness = responseCurve(firefly.fixedLoudness);
    firefly.lifeSpan = CONFIG.loudnessScaleMin + scaledLoudness * (CONFIG.loudnessScaleMax - CONFIG.loudnessScaleMin);
    // Reset to fixed origin for this firefly
    firefly.pointOriginX = firefly.originX; // Reset pointOrigin to initial origin
    firefly.pointOriginY = firefly.originY;
    firefly.x = firefly.originX;
    firefly.y = firefly.originY;
    const screenFactor = Math.min(window.innerWidth, window.innerHeight);
    const defaultDistance = screenFactor * (CONFIG.nodeDistanceMin + Math.random() * (CONFIG.nodeDistanceMax - CONFIG.nodeDistanceMin));
    const loudnessFactor = 1 + firefly.fixedLoudness;
    const initialDistance = defaultDistance * loudnessFactor * CONFIG.initialDistanceMultiplier;
    // Decide upward or downward direction (50-50 chance)
    const baseAngle = Math.random() < 0.5 ? -90 : 90; // Upward (-90°) or Downward (90°)
    // Add random deviation of ±10 degrees
    const deviation = Math.random() * 40 - 20; // Random value between -10 and +10 degrees
    const angle = (baseAngle + deviation) * (Math.PI / 180); // Convert to radians
    // Calculate target positions
    firefly.targetX = clampPosition(firefly.x + initialDistance * Math.cos(angle), 0, window.innerWidth);
    firefly.targetY = clampPosition(firefly.y + initialDistance * Math.sin(angle), 0, window.innerHeight);
    const { controlX, controlY } = calculateControlPoints({
        originX: firefly.pointOriginX,
        originY: firefly.pointOriginY,
        targetX: firefly.targetX,
        targetY: firefly.targetY,
        distance: initialDistance
    });
    firefly.controlX = controlX;
    firefly.controlY = controlY;
    firefly.curveTimer = 0;
    firefly.curveInterval = CONFIG.curveIntervalMin + Math.random() * (CONFIG.curveIntervalMax - CONFIG.curveIntervalMin); // Random interval
    firefly.glowIntensity = firefly.fixedLoudness;
}
// Generates a new target position and control point for a firefly
function generateTargetPosition(firefly) {
    firefly.pointOriginX = firefly.x; // Update pointOrigin to current position
    firefly.pointOriginY = firefly.y;
    const screenFactor = Math.min(window.innerWidth, window.innerHeight);
    const defaultDistance = screenFactor * (CONFIG.nodeDistanceMin + Math.random() * (CONFIG.nodeDistanceMax - CONFIG.nodeDistanceMin));
    const loudnessFactor = 1 + firefly.fixedLoudness; // Scale: 1 (0% loudness) to 2 (100% loudness)
    const distance = defaultDistance * loudnessFactor * CONFIG.initialDistanceMultiplier;
    const angle = Math.random() * 360;
    const radians = angle * (Math.PI / 180);
    firefly.targetX = clampPosition(firefly.pointOriginX + distance * Math.cos(radians), 0, window.innerWidth);
    firefly.targetY = clampPosition(firefly.pointOriginY + distance * Math.sin(radians), 0, window.innerHeight);
    const { controlX, controlY } = calculateControlPoints({
        originX: firefly.pointOriginX,
        originY: firefly.pointOriginY,
        targetX: firefly.targetX,
        targetY: firefly.targetY,
        distance
    });
    firefly.controlX = controlX;
    firefly.controlY = controlY;
}
// Update fireflies' properties based on audio and movement logic
function updateFireflies() {
    fireflies.forEach((firefly)=>{
        const frequencyData = firefly.channel === "left" ? leftFrequencyData : rightFrequencyData;
        if (firefly.lifeSpan <= 0 && firefly.blinkTimer >= firefly.blinkInterval) {
            resetFirefly(firefly, frequencyData); // Reset only after last blink completes
            firefly.blinkTimer = 0; // Reset timer
            firefly.blinkInterval = CONFIG.blinkIntervalMin + Math.random() * (CONFIG.blinkIntervalMax - CONFIG.blinkIntervalMin);
            firefly.blinkProgress = 0;
        }
        firefly.curveTimer += CONFIG.frameTime;
        if (firefly.curveTimer >= firefly.curveInterval) {
            firefly.curveTimer = 0;
            generateTargetPosition(firefly); // Generate new target
            firefly.curveProgress = 0; // Reset curve progress
        }
        // Increment movement progress
        firefly.curveProgress += CONFIG.movementSpeed * CONFIG.frameTime / 1000;
        moveAlongBezierCurve({
            firefly,
            originX: firefly.pointOriginX,
            originY: firefly.pointOriginY,
            controlX: firefly.controlX,
            controlY: firefly.controlY,
            targetX: firefly.targetX,
            targetY: firefly.targetY,
            progress: firefly.curveProgress
        });
        if (firefly.blinkTimer < firefly.blinkInterval) {
            firefly.blinkTimer += CONFIG.frameTime; // Continue blinking
            const blinkT = firefly.blinkTimer / firefly.blinkInterval;
            firefly.blinkProgress = blinkT <= 0.5 ? easingFunction(blinkT * 2) : easingFunction(2 - blinkT * 2);
        } else {
            firefly.blinkTimer = 0; // Reset timer
            firefly.blinkInterval = CONFIG.blinkIntervalMin + Math.random() * (CONFIG.blinkIntervalMax - CONFIG.blinkIntervalMin); // Randomize new interval
        }
        if (firefly.lifeSpan > 0) firefly.lifeSpan -= 1;
        else firefly.glowIntensity = 0;
    });
}
// Render fireflies to the canvas
function renderFireflies() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fireflies.forEach((firefly, index)=>{
        if (firefly.lifeSpan > 0) {
            const fireFlySize = firefly.size * 2; // Adjusted firefly size for glow
            const blinkOpacity = firefly.blinkProgress * firefly.glowIntensity; // Scaled by blink progress
            ctx.save();
            ctx.translate(firefly.x, firefly.y); // Move canvas to firefly position
            ctx.rotate(firefly.angle); // Rotate canvas to align with movement direction
            // Draw Glow (circular)
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, fireFlySize // Outer circle (edge of the glow)
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${blinkOpacity})`);
            gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, fireFlySize, 0, Math.PI * 2);
            ctx.fill();
            // Draw Body (smaller oval)
            const bodyOpacity = Math.min(blinkOpacity + 0.25, 1); // 25% higher opacity
            ctx.fillStyle = `rgba(255, 255, 255, ${bodyOpacity})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, fireFlySize / 6, fireFlySize / 12, 0, 0, Math.PI * 2 // End angle
            );
            ctx.fill();
            ctx.restore(); // Restore canvas state
            if (CONFIG.debugFlightPath) {
                // ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                // ctx.beginPath();
                // ctx.moveTo(firefly.pointOriginX, firefly.pointOriginY); // Start point
                // ctx.lineTo(firefly.targetX, firefly.targetY); // Target point
                ctx.stroke();
                // True Origin (Yellow Dot)
                ctx.fillStyle = "rgba(255, 255, 0, 0.5)"; // Yellow
                ctx.beginPath();
                ctx.arc(firefly.originX, firefly.originY, firefly.size / 2, 0, Math.PI * 2);
                ctx.fill();
                // Point Origin ()
                // ctx.fillStyle = 'rgba(0, 255, 255, 0.5)'; //
                // ctx.beginPath();
                // ctx.arc(firefly.pointOriginX, firefly.pointOriginY, firefly.size / 2, 0, Math.PI * 2);
                // ctx.fill();
                // Current XY (Green Dot)
                // ctx.fillStyle = 'rgba(0, 255, 0, 0.5)'; // Green
                // ctx.beginPath();
                // ctx.arc(firefly.x, firefly.y, firefly.size * 2, 0, Math.PI * 2);
                // ctx.fill();
                // Control Points (Blue Dots)
                // ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
                // ctx.beginPath();
                // ctx.arc(firefly.controlX, firefly.controlY, firefly.size / 4, 0, Math.PI * 2); // Blue dot at control point
                // ctx.fill();
                // Ensure flight angle is correctly defined
                const flightAngle = Math.atan2(firefly.targetY - firefly.y, firefly.targetX - firefly.x); // Initial direction
                const dx = firefly.controlX - firefly.x; // Control point relative to the fly's current position
                const dy = firefly.controlY - firefly.y; // Same for y-coordinate
                // Calculate the angle between the flight direction and the control point
                const angleToControl = Math.atan2(dy, dx);
                const relativeAngle = angleToControl - flightAngle;
                // Normalize the relative angle to [-π, π]
                const normalizedAngle = Math.atan2(Math.sin(relativeAngle), Math.cos(relativeAngle));
                // Assign color based on the relative position
                ctx.fillStyle = normalizedAngle > 0 ? "rgba(0, 0, 255, 0.5)" : "rgba(0, 255, 0, 0.5)"; // Blue (right), Green (left)
                ctx.beginPath();
                ctx.arc(firefly.controlX, firefly.controlY, firefly.size / 4, 0, Math.PI * 2); // Draw the control point
                ctx.fill();
                // Destination Points (Red Dots)
                ctx.fillStyle = "rgba(255, 0, 0, 1)"; // Red
                ctx.beginPath();
                ctx.arc(firefly.targetX, firefly.targetY, firefly.size / 2, 0, Math.PI * 2);
                ctx.fill();
                // Bezier path
                // ctx.beginPath();
                // ctx.moveTo(firefly.pointOriginX, firefly.pointOriginY);
                // ctx.quadraticCurveTo(firefly.controlX, firefly.controlY, firefly.targetX, firefly.targetY);
                // ctx.strokeStyle = 'blue';
                // ctx.stroke();
                // Fly rotation
                const dotSize = firefly.size / 4; // Small red dot size
                const tipX = firefly.x + Math.cos(firefly.angle) * firefly.size * 3; // Tip position X
                const tipY = firefly.y + Math.sin(firefly.angle) * firefly.size * 3; // Tip position Y
                ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Red color
                ctx.beginPath();
                ctx.arc(tipX, tipY, dotSize, 0, Math.PI * 2); // Red dot at the tip
                ctx.fill();
            }
        }
    });
}
// Main loop for updating and rendering
function updateFrequencyData() {
    if (leftAnalyser && rightAnalyser) {
        leftAnalyser.getByteFrequencyData(leftFrequencyData);
        rightAnalyser.getByteFrequencyData(rightFrequencyData);
    }
    updateFireflies();
    renderFireflies();
    animationFrameId = requestAnimationFrame(updateFrequencyData);
}
function easingFunction(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
function calculateControlPoints({ originX = 0, originY = 0, targetX = 0, targetY = 0, distance = 1, weightMin = CONFIG.controlPointWeightMin, weightMax = CONFIG.controlPointWeightMax, offsetMin = CONFIG.controlPointOffsetMin, offsetMax = CONFIG.controlPointOffsetMax }) {
    const weight = weightMin + Math.random() * (weightMax - weightMin);
    const baseX = originX + weight * (targetX - originX);
    const baseY = originY + weight * (targetY - originY);
    const offsetFactor = offsetMin + Math.random() * (offsetMax - offsetMin);
    const offsetDistance = distance * offsetFactor;
    // Check for degenerate case (origin == target)
    const deltaX = targetX - originX;
    const deltaY = targetY - originY;
    // Randomly flip between clockwise and counterclockwise
    const flipDirection = Math.random() < 0.5 ? 1 : -1;
    // Calculate perpendicular angle with random flipping
    const angle = deltaX === 0 && deltaY === 0 ? Math.random() * Math.PI * 2 : Math.atan2(deltaY, deltaX) + flipDirection * Math.PI / 2;
    return {
        controlX: baseX + Math.cos(angle) * offsetDistance,
        controlY: baseY + Math.sin(angle) * offsetDistance
    };
}
function moveAlongBezierCurve({ firefly, originX, originY, controlX, controlY, targetX, targetY, progress }) {
    const bezier = (p0, p1, p2, t)=>Math.pow(1 - t, 2) * p0 + 2 * (1 - t) * t * p1 + Math.pow(t, 2) * p2;
    const bezierTangent = (p0, p1, p2, t)=>{
        const dx = 2 * (1 - t) * (p1 - p0) + 2 * t * (p2 - p1); // Derivative for x
        const dy = 2 * (1 - t) * (p2 - p1) + 2 * t * (p2 - p0); // Derivative for y
        return {
            dx,
            dy
        };
    };
    firefly.x = bezier(originX, controlX, targetX, progress);
    firefly.y = bezier(originY, controlY, targetY, progress);
    const { dx, dy } = bezierTangent(originX, controlX, targetX, progress);
    firefly.angle = Math.atan2(dy, dx);
}
function calculateScaledLifespan(loudness) {
    const t = Math.min(Math.max(loudness, 0), 1);
    if (t < CONFIG.lifespanThreshold) {
        // Scale loudness below threshold linearly to midLifespanSeconds
        const scaled = t / CONFIG.lifespanThreshold;
        return (CONFIG.minLifespanSeconds + scaled * (CONFIG.midLifespanSeconds - CONFIG.minLifespanSeconds)) * 1000 / CONFIG.frameTime; // Convert seconds to frames
    } else {
        // Scale loudness above threshold to maxLifespanSeconds
        const scaled = (t - CONFIG.lifespanThreshold) / (1 - CONFIG.lifespanThreshold);
        return (CONFIG.midLifespanSeconds + scaled * (CONFIG.maxLifespanSeconds - CONFIG.midLifespanSeconds)) * 1000 / CONFIG.frameTime; // Convert seconds to frames
    }
}
function responseCurve(loudness) {
    const midpoint = CONFIG.lifespanThreshold;
    const belowType = CONFIG.responseTypeBelow; // Configurable response type below midpoint
    const aboveType = CONFIG.responseTypeAbove; // Configurable response type above midpoint
    const computeBelow = (loudness)=>{
        switch(belowType){
            case "linear":
                return loudness / midpoint; // Linear scaling
            case "logarithmic":
                return Math.log(1 + loudness / midpoint) / Math.log(2); // Log base 2 scaling
            case "quadratic":
                return Math.pow(loudness / midpoint, 2); // Quadratic scaling
            case "cubic":
                return Math.pow(loudness / midpoint, 3); // Cubic scaling
            case "exponential":
                return Math.exp(loudness / midpoint) - 1; // Exponential growth
            case "hyperExponential":
                return (Math.exp(loudness / midpoint) - 1) * 2; // Doubled exponential effect
            default:
                return loudness; // Default to linear
        }
    };
    const computeAbove = (relativeLoudness, baseValue)=>{
        switch(aboveType){
            case "linear":
                return baseValue + relativeLoudness; // Linear scaling
            case "logarithmic":
                return baseValue + Math.log(1 + relativeLoudness) / Math.log(2); // Log base 2 scaling
            case "quadratic":
                return baseValue + Math.pow(relativeLoudness, 2); // Quadratic scaling
            case "cubic":
                return baseValue + Math.pow(relativeLoudness, 3) * 3; // Cubic scaling
            case "exponential":
                return baseValue + (Math.exp(relativeLoudness) - 1); // Exponential scaling
            case "hyperExponential":
                return baseValue + (Math.exp(relativeLoudness) - 1) * 2; // Doubled exponential effect
            default:
                return loudness; // Default to linear
        }
    };
    if (loudness < midpoint) return computeBelow(loudness); // Below midpoint logic
    else {
        const baseValue = computeBelow(midpoint); // Smooth transition value
        const relativeLoudness = (loudness - midpoint) / (1 - midpoint);
        return computeAbove(relativeLoudness, baseValue); // Above midpoint logic
    }
}
// Audio setup and initialization
document.getElementById("audioUpload").addEventListener("change", async (event)=>{
    const file = event.target.files[0];
    if (file) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        // Create source and analyzers
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        const splitter = audioContext.createChannelSplitter(2);
        leftAnalyser = audioContext.createAnalyser();
        rightAnalyser = audioContext.createAnalyser();
        leftAnalyser.fftSize = 1024;
        rightAnalyser.fftSize = 1024;
        audioSource.connect(splitter);
        splitter.connect(leftAnalyser, 0);
        splitter.connect(rightAnalyser, 1);
        audioSource.connect(audioContext.destination);
        leftAnalyser.fftSize = CONFIG.fftSize;
        rightAnalyser.fftSize = CONFIG.fftSize;
        leftFrequencyData = new Uint8Array(leftAnalyser.frequencyBinCount);
        rightFrequencyData = new Uint8Array(rightAnalyser.frequencyBinCount);
        for(let i = 0; i < CONFIG.numFireflies; i++){
            const frequencyIndex = i % (leftAnalyser.frequencyBinCount / CONFIG.redundancyFactor);
            // Equal split for left and right channels
            const isLeftChannel = i % 2 === 0; // Determine channel
            const frequencySpread = frequencyIndex / (leftAnalyser.frequencyBinCount / CONFIG.redundancyFactor);
            const originX = isLeftChannel ? window.innerWidth * (0.5 - frequencySpread * 0.5 // Left: Center to Left
            ) : window.innerWidth * (0.5 + frequencySpread * 0.5); // Right: Center to Right
            const originY = window.innerHeight / 2; // Middle of the screen
            fireflies.push({
                frequencyIndex,
                channel: i % 2 === 0 ? "left" : "right",
                originX,
                originY,
                x: originX,
                y: originY,
                size: CONFIG.fireflySize,
                glowIntensity: 0,
                lifeSpan: 0,
                fixedLoudness: 0,
                curveTimer: 0,
                curveInterval: 0,
                targetX: 0,
                targetY: 0,
                controlX: 0,
                controlY: 0,
                curveProgress: 0
            });
        }
        console.log("Audio loaded and fireflies initialized.");
        audioSource.start();
        audioSource.onended = ()=>cancelAnimationFrame(animationFrameId);
        updateFrequencyData();
    }
});

//# sourceMappingURL=firefly.dc19c322.js.map
