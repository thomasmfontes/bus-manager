import { useEffect, useState } from 'react';

interface UseCountUpOptions {
    duration?: number; // Duration in milliseconds
    delay?: number; // Delay before starting
}

export const useCountUp = (
    end: number,
    options: UseCountUpOptions = {}
): number => {
    const { delay = 0 } = options;
    const [count, setCount] = useState(0);

    // Adaptive duration based on the number size
    // Small numbers animate faster to avoid appearing slow
    const getAdaptiveDuration = (value: number): number => {
        if (options.duration) return options.duration;

        if (value <= 10) return 400;      // Very fast for single digits
        if (value <= 50) return 800;      // Medium speed for small numbers
        return 1200;                       // Slower for larger numbers
    };

    const duration = getAdaptiveDuration(end);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;

            if (progress < delay) {
                animationFrame = requestAnimationFrame(animate);
                return;
            }

            const adjustedProgress = progress - delay;
            const percentage = Math.min(adjustedProgress / duration, 1);

            // Easing function for smooth animation (easeOutExpo)
            const easeOutExpo = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);

            const currentCount = Math.floor(easeOutExpo * end);
            setCount(currentCount);

            if (percentage < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end); // Ensure we end at the exact value
            }
        };

        if (end > 0) {
            animationFrame = requestAnimationFrame(animate);
        } else {
            setCount(0);
        }

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [end, duration, delay]);

    return count;
};
