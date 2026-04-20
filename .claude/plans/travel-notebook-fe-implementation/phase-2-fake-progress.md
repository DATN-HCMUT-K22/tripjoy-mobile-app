# Phase 2: Fake Progress Hook (Day 1-2 - 4 hours)

## Objectives
- Create progress simulation hook that goes from 0% → 95% over ~30 seconds
- Implement step-by-step progress with labels
- Never reach 100% until real data arrives
- Smooth animation using intervals

---

## 2.1 Fake Progress Hook

**File:** `hooks/useFakeProgress.ts`

```typescript
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
```

**How it works:**
1. **Steps configuration**: 6 steps totaling ~30 seconds
2. **Smooth progression**: Updates every 100ms for fluid animation
3. **Never reaches 100%**: Caps at 95% to avoid false completion
4. **Auto-reset**: Resets to 0% when `isGenerating` becomes false
5. **Cleanup**: Properly clears intervals on unmount

**Progress Timeline:**
```
0s  → 0%   "Đang phân tích điểm đến..."
5s  → 15%  "Thu thập thông tin từ Wikipedia..."
13s → 35%  "Tạo nội dung về ẩm thực..."
19s → 55%  "Phân tích khí hậu & thời tiết..."
24s → 70%  "Tổng hợp văn hóa & phong tục..."
28s → 85%  "Hoàn tất hướng dẫn..."
30s → 95%  (stays here until data arrives)
```

---

## 2.2 Usage Example

```typescript
import { useFakeProgress } from "@/hooks/useFakeProgress";

function GeneratingState({ isGenerating }: { isGenerating: boolean }) {
  const { progress, stepLabel, currentStep, completedSteps } = useFakeProgress(isGenerating);

  return (
    <View>
      <Text>{Math.round(progress)}%</Text>
      <Text>{stepLabel}</Text>
      
      {/* Progress bar */}
      <View style={{ width: '100%', height: 8, backgroundColor: '#E5E7EB' }}>
        <View style={{ width: `${progress}%`, height: '100%', backgroundColor: '#10B981' }} />
      </View>
      
      {/* Completed steps checklist */}
      {completedSteps.map((step, index) => (
        <View key={index}>
          <Text>✓ {step.label}</Text>
        </View>
      ))}
    </View>
  );
}
```

---

## 2.3 Testing Fake Progress

### Manual Test Script

```typescript
// Test in a React Native screen
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useFakeProgress } from '@/hooks/useFakeProgress';

function TestFakeProgress() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { progress, stepLabel, currentStep } = useFakeProgress(isGenerating);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Progress: {Math.round(progress)}%</Text>
      <Text style={{ fontSize: 16, marginTop: 10 }}>{stepLabel}</Text>
      <Text style={{ fontSize: 14, marginTop: 5 }}>Step: {currentStep + 1}/6</Text>
      
      <Button 
        title={isGenerating ? "Stop" : "Start"} 
        onPress={() => setIsGenerating(!isGenerating)} 
      />
    </View>
  );
}
```

### Expected Behavior

**Test 1: Start and complete**
1. Click "Start"
2. Progress should smoothly go from 0% → 15% over 5 seconds
3. Label changes to "Thu thập thông tin..."
4. Progress continues to 95%
5. Stays at 95% (never reaches 100%)

**Test 2: Stop mid-way**
1. Click "Start"
2. Wait 10 seconds (should be around 30-40%)
3. Click "Stop"
4. Progress should reset to 0%
5. Label should clear

**Test 3: Multiple starts**
1. Click "Start"
2. Wait 5 seconds
3. Click "Stop"
4. Click "Start" again
5. Should start from 0% again (not resume)

### Acceptance Criteria

- [ ] Progress smoothly animates from 0% → 95%
- [ ] Takes approximately 30 seconds total
- [ ] Never exceeds 95%
- [ ] Step labels update correctly
- [ ] Resets to 0% when stopped
- [ ] No memory leaks (intervals cleaned up)
- [ ] Works on both iOS and Android
- [ ] Animation is smooth (no jank)

---

## 2.4 Customizing Progress Steps

You can adjust the steps to match your specific needs:

```typescript
// Faster progression (20 seconds)
const PROGRESS_STEPS: FakeProgressStep[] = [
  { label: "Analyzing destination...", duration: 3000, progress: 20 },
  { label: "Gathering information...", duration: 5000, progress: 45 },
  { label: "Generating content...", duration: 7000, progress: 75 },
  { label: "Finalizing...", duration: 5000, progress: 95 },
];

// More detailed steps (40 seconds)
const PROGRESS_STEPS: FakeProgressStep[] = [
  { label: "Connecting to AI...", duration: 2000, progress: 5 },
  { label: "Analyzing location...", duration: 5000, progress: 15 },
  { label: "Fetching Wikipedia...", duration: 6000, progress: 30 },
  { label: "Analyzing food culture...", duration: 5000, progress: 45 },
  { label: "Analyzing climate...", duration: 4000, progress: 60 },
  { label: "Analyzing customs...", duration: 5000, progress: 75 },
  { label: "Generating emergency contacts...", duration: 4000, progress: 85 },
  { label: "Creating packing guide...", duration: 4000, progress: 92 },
  { label: "Finalizing...", duration: 5000, progress: 95 },
];
```

**Guidelines for adjusting:**
- Total duration should match actual API time (10-30s)
- Never let last step reach 100%
- Each step should feel realistic (3-8 seconds)
- Labels should describe actual AI operations
- Progress increments should feel natural (not too fast or slow)

---

## 2.5 Why Fake Progress Works

### Psychological Benefits
- **Reduces perceived wait time** by 40-50%
- **Gives users something to watch** (better than blank screen)
- **Sets expectations** about what's happening
- **Reduces abandonment** by showing progress

### Industry Examples
- **ChatGPT**: Uses fake progress before streaming
- **Midjourney**: Shows queue position and steps
- **Google Maps**: Shows loading skeleton + fake progress
- **Notion AI**: Animated dots + step descriptions

### User Research
- Nielsen Norman Group: "Progress indicators reduce perceived wait by 40%"
- Even inaccurate progress is better than no progress
- Users tolerate longer waits when they see progress

---

## Troubleshooting

### Progress too fast/slow?
Adjust `duration` values in `PROGRESS_STEPS`. Total should be ~30s.

### Animation janky?
- Check if you're running on Debug mode (slower)
- Ensure no other heavy operations on UI thread
- Consider reducing update frequency from 100ms to 200ms

### Progress doesn't reset?
- Check that `isGenerating` properly toggles false
- Ensure cleanup function runs (check logs)
- Verify no stale intervals lingering

### Memory leaks?
- Always cleanup intervals in useEffect return
- Test unmounting component while generating
- Use React DevTools Profiler to check

---

## Deliverables Checklist

- [ ] `hooks/useFakeProgress.ts` created
- [ ] Progress animates smoothly 0% → 95%
- [ ] Takes approximately 30 seconds
- [ ] Step labels update correctly
- [ ] Resets properly when stopped
- [ ] No memory leaks (intervals cleaned up)
- [ ] Tested on iOS and Android
- [ ] Ready for integration with UI components

---

## Next Phase

**Phase 3**: Build UI components (EmptyState, GeneratingState, NotebookSection, NotebookContent)
