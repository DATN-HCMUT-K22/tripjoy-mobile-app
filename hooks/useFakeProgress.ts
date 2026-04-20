import { useState, useEffect, useRef } from "react";
import { FakeProgressStep } from "@/types/notebook";

const PROGRESS_STEPS: FakeProgressStep[] = [
  { label: "Đang phân tích điểm đến...", duration: 5000, progress: 15 },
  { label: "Thu thập thông tin từ Wikipedia...", duration: 8000, progress: 35 },
  { label: "Tạo nội dung về ẩm thực...", duration: 6000, progress: 55 },
  { label: "Phân tích khí hậu & thời tiết...", duration: 5000, progress: 70 },
  { label: "Tổng hợp văn hóa & phong tục...", duration: 4000, progress: 85 },
  { label: "Hoàn tất hướng dẫn...", duration: 2000, progress: 95 },
];

/**
 * Simulates progress from 0% → 95% over ~30 seconds
 * Never reaches 100% until real data arrives
 *
 * @param isGenerating - Whether AI generation is in progress
 * @returns Object with progress (0-95), stepLabel, currentStep, completedSteps
 */
export function useFakeProgress(isGenerating: boolean) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isGenerating) {
      // Reset when not generating
      setProgress(0);
      setCurrentStep(0);
      setStepLabel("");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start progress simulation
    let stepIndex = 0;
    let currentProgress = 0;

    const runStep = () => {
      if (stepIndex >= PROGRESS_STEPS.length) {
        // Stay at 95% until data arrives (never reach 100%)
        setProgress(95);
        setStepLabel("Đang hoàn tất...");
        return;
      }

      const step = PROGRESS_STEPS[stepIndex];
      setStepLabel(step.label);
      setCurrentStep(stepIndex);

      const targetProgress = step.progress;
      const increment = (targetProgress - currentProgress) / (step.duration / 100);

      intervalRef.current = setInterval(() => {
        currentProgress += increment;

        if (currentProgress >= targetProgress) {
          // Reached target for this step
          currentProgress = targetProgress;
          setProgress(currentProgress);

          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          // Move to next step
          stepIndex++;
          setTimeout(runStep, 100); // Small delay between steps
        } else {
          setProgress(currentProgress);
        }
      }, 100); // Update every 100ms for smooth animation
    };

    runStep();

    // Cleanup on unmount or when isGenerating changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isGenerating]);

  return {
    progress: Math.min(progress, 95), // Cap at 95%
    stepLabel,
    currentStep,
    completedSteps: PROGRESS_STEPS.slice(0, currentStep + 1),
  };
}
