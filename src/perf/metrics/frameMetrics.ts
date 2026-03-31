/**
 * Frame Metrics - Per-frame timing with Long Animation Frames API (Chrome 123+)
 *
 * Provides detailed frame breakdown including:
 * - Total frame duration
 * - Blocking duration (long tasks)
 * - Script attribution (which scripts caused delays)
 * - Falls back to RAF-based measurement for older browsers
 */

/**
 * Frame data structure
 * @typedef {Object} FrameData
 * @property {number} timestamp - When the frame started (performance.now())
 * @property {number} duration - Total frame duration in ms
 * @property {number} blockingDuration - Time spent in blocking work
 * @property {string[]} scripts - Script URLs that contributed to the frame
 * @property {string} source - 'laf' | 'raf' - measurement source
 */

/**
 * Creates a frame metrics tracker.
 *
 * Usage:
 *   const tracker = createFrameMetrics();
 *   tracker.startTracking();
 *   // ... do scroll tests ...
 *   tracker.stopTracking();
 *   const analysis = tracker.analyze();
 *
 * @returns {Object} Frame metrics API
 */
export function createFrameMetrics() {
    /** @type {FrameData[]} */
    let frames: any = [];
    let isTracking = false;
    let observer: any = null;
    let rafId: any = null;
    let lastFrameTime = 0;
    let useLAF = false;

    // Detect Long Animation Frames API support
    const hasLAF =
        typeof PerformanceObserver !== 'undefined' &&
        PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame');

    /**
     * Start tracking frames using LAF API
     */
    function startLAFTracking() {
        observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                frames.push({
                    timestamp: entry.startTime,
                    duration: entry.duration,
                    // @ts-expect-error TS(2339): Property 'blockingDuration' does not exist on type... Remove this comment to see the full error message
                    blockingDuration: entry.blockingDuration || 0,
                    // @ts-expect-error TS(2339): Property 'scripts' does not exist on type 'Perform... Remove this comment to see the full error message
                    scripts: entry.scripts?.map((s: any) => s.sourceURL || s.name) || [],
                    source: 'laf',
                    // Additional LAF-specific data
                    // @ts-expect-error TS(2339): Property 'renderStart' does not exist on type 'Per... Remove this comment to see the full error message
                    renderStart: entry.renderStart,
                    // @ts-expect-error TS(2339): Property 'styleAndLayoutStart' does not exist on t... Remove this comment to see the full error message
                    styleAndLayoutStart: entry.styleAndLayoutStart,
                    // @ts-expect-error TS(2339): Property 'firstUIEventTimestamp' does not exist on... Remove this comment to see the full error message
                    firstUIEventTimestamp: entry.firstUIEventTimestamp,
                });
            }
        });

        observer.observe({ type: 'long-animation-frame', buffered: true });
        useLAF = true;
    }

    /**
     * Start tracking frames using RAF fallback
     */
    function startRAFTracking() {
        lastFrameTime = performance.now();

        function measure() {
            if (!isTracking) return;

            const now = performance.now();
            const duration = now - lastFrameTime;

            // Only record frames longer than 4ms (250fps theoretical max)
            if (duration > 4) {
                frames.push({
                    timestamp: lastFrameTime,
                    duration,
                    blockingDuration: duration > 16.67 ? duration - 16.67 : 0,
                    scripts: [],
                    source: 'raf',
                });
            }

            lastFrameTime = now;
            rafId = requestAnimationFrame(measure);
        }

        rafId = requestAnimationFrame(measure);
        useLAF = false;
    }

    /**
     * Start tracking frame metrics
     * @param {Object} options
     * @param {boolean} options.preferRAF - Force RAF even if LAF is available (for comparison)
     */
    function startTracking(options = {}) {
        if (isTracking) return;

        frames = [];
        isTracking = true;

        // @ts-expect-error TS(2339): Property 'preferRAF' does not exist on type '{}'.
        if (hasLAF && !options.preferRAF) {
            startLAFTracking();
        } else {
            startRAFTracking();
        }
    }

    /**
     * Stop tracking frame metrics
     */
    function stopTracking() {
        isTracking = false;

        if (observer) {
            observer.disconnect();
            observer = null;
        }

        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    /**
     * Get raw frame data
     * @returns {FrameData[]}
     */
    function getFrames() {
        return [...frames];
    }

    /**
     * Clear collected frames
     */
    function clear() {
        frames = [];
    }

    /**
     * Analyze collected frame data
     * @returns {Object} Analysis results
     */
    function analyze() {
        if (frames.length === 0) {
            return {
                frameCount: 0,
                totalDuration: 0,
                avgFrameTime: 0,
                avgFPS: 0,
                minFrameTime: 0,
                maxFrameTime: 0,
                worstFrame: null,
                droppedFrames: 0,
                percentile95: 0,
                percentile99: 0,
                blockingTime: 0,
                source: useLAF ? 'laf' : 'raf',
            };
        }

        // @ts-expect-error TS(7006): Parameter 'f' implicitly has an 'any' type.
        const durations = frames.map((f) => f.duration).sort((a, b) => a - b);
        // @ts-expect-error TS(7006): Parameter 'sum' implicitly has an 'any' type.
        const totalDuration = durations.reduce((sum, d) => sum + d, 0);
        // @ts-expect-error TS(7006): Parameter 'sum' implicitly has an 'any' type.
        const blockingTime = frames.reduce((sum, f) => sum + f.blockingDuration, 0);

        // Find worst frame
        const worstFrame = frames.reduce(
            // @ts-expect-error TS(7006): Parameter 'worst' implicitly has an 'any' type.
            (worst, f) => (f.duration > worst.duration ? f : worst),
            frames[0]
        );

        // Dropped frames = frames that took longer than 16.67ms (60fps target)
        // @ts-expect-error TS(7006): Parameter 'f' implicitly has an 'any' type.
        const droppedFrames = frames.filter((f) => f.duration > 16.67).length;

        // Percentiles
        const p95Index = Math.floor(durations.length * 0.95);
        const p99Index = Math.floor(durations.length * 0.99);

        return {
            frameCount: frames.length,
            totalDuration,
            avgFrameTime: totalDuration / frames.length,
            avgFPS: 1000 / (totalDuration / frames.length),
            minFrameTime: durations[0],
            maxFrameTime: durations[durations.length - 1],
            worstFrame: {
                timestamp: worstFrame.timestamp,
                duration: worstFrame.duration,
                blockingDuration: worstFrame.blockingDuration,
                scripts: worstFrame.scripts,
            },
            droppedFrames,
            droppedFramePercent: (droppedFrames / frames.length) * 100,
            percentile95: durations[p95Index] || durations[durations.length - 1],
            percentile99: durations[p99Index] || durations[durations.length - 1],
            blockingTime,
            source: useLAF ? 'laf' : 'raf',
        };
    }

    /**
     * Get FPS over time (for graphing)
     * @param {number} bucketMs - Time bucket size in ms (default 100ms)
     * @returns {Array<{time: number, fps: number}>}
     */
    function getFPSTimeline(bucketMs = 100) {
        if (frames.length === 0) return [];

        const timeline = [];
        let bucketStart = frames[0].timestamp;
        let bucketFrames = [];

        for (const frame of frames) {
            if (frame.timestamp - bucketStart >= bucketMs) {
                // Calculate FPS for this bucket
                if (bucketFrames.length > 0) {
                    const bucketDuration = bucketFrames.reduce((s, f) => s + f.duration, 0);
                    const avgFrameTime = bucketDuration / bucketFrames.length;
                    timeline.push({
                        time: bucketStart,
                        fps: 1000 / avgFrameTime,
                        frameCount: bucketFrames.length,
                    });
                }
                bucketStart = frame.timestamp;
                bucketFrames = [];
            }
            bucketFrames.push(frame);
        }

        // Last bucket
        if (bucketFrames.length > 0) {
            const bucketDuration = bucketFrames.reduce((s, f) => s + f.duration, 0);
            const avgFrameTime = bucketDuration / bucketFrames.length;
            timeline.push({
                time: bucketStart,
                fps: 1000 / avgFrameTime,
                frameCount: bucketFrames.length,
            });
        }

        return timeline;
    }

    return {
        startTracking,
        stopTracking,
        getFrames,
        clear,
        analyze,
        getFPSTimeline,
        get isTracking() {
            return isTracking;
        },
        get hasLAF() {
            return hasLAF;
        },
    };
}

/**
 * Convenience: Create a one-shot benchmark that runs a function and measures frames
 *
 * @param {Function} fn - Async function to benchmark
 * @param {Object} options
 * @param {number} options.warmupMs - Warmup time before measurement (default 100ms)
 * @returns {Promise<Object>} Analysis results
 */
export async function benchmarkFrames(fn: any, options = {}) {
    // @ts-expect-error TS(2339): Property 'warmupMs' does not exist on type '{}'.
    const { warmupMs = 100 } = options;
    const tracker = createFrameMetrics();

    // Warmup
    await new Promise((resolve) => setTimeout(resolve, warmupMs));

    tracker.startTracking();

    try {
        await fn();
    } finally {
        tracker.stopTracking();
    }

    return tracker.analyze();
}

export default createFrameMetrics;
