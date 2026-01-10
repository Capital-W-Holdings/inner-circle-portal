'use client';

/**
 * Celebration Component
 * 
 * Animated celebrations for milestone achievements.
 * Uses canvas-confetti for particle effects.
 * 
 * Features:
 * - Confetti burst animations
 * - Fireworks effect
 * - Stars effect
 * - Dismissible modal overlay
 * - Accessibility support
 */

import React, { useEffect, useCallback, useState } from 'react';
import confetti from 'canvas-confetti';
import type { CelebrationConfig, MilestoneType } from '@/types';
import { MILESTONE_CONFIGS } from '@/types';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface CelebrationProps {
  milestone: MilestoneType;
  onComplete?: () => void;
  onDismiss?: () => void;
  autoShow?: boolean;
  className?: string;
}

interface CelebrationModalProps {
  config: CelebrationConfig;
  isVisible: boolean;
  onDismiss: () => void;
}

// ============================================
// Confetti Effects
// ============================================

function fireConfetti(): void {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options): void {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

function fireFireworks(duration: number): void {
  const animationEnd = Date.now() + duration;
  const defaults = { 
    startVelocity: 30, 
    spread: 360, 
    ticks: 60, 
    zIndex: 9999 
  };

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    // Fireworks from two points
    confetti({
      ...defaults,
      particleCount,
      origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() - 0.2 },
    });
  }, 250);
}

function fireStars(): void {
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'],
    zIndex: 9999,
  };

  function shoot(): void {
    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ['star'] as confetti.Shape[],
    });

    confetti({
      ...defaults,
      particleCount: 10,
      scalar: 0.75,
      shapes: ['circle'] as confetti.Shape[],
    });
  }

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
}

// ============================================
// Celebration Modal
// ============================================

function CelebrationModal({ 
  config, 
  isVisible, 
  onDismiss 
}: CelebrationModalProps): React.ReactElement | null {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative z-10 max-w-sm w-full bg-white rounded-2xl shadow-2xl p-8 text-center animate-bounce-in">
        {/* Emoji */}
        <div className="text-6xl mb-4 animate-bounce-in" role="img" aria-hidden="true">
          {config.emoji}
        </div>

        {/* Title */}
        <h2 
          id="celebration-title"
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Milestone Achieved!
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {config.message}
        </p>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            'w-full px-6 py-3 rounded-xl font-semibold',
            'bg-primary-600 text-white',
            'hover:bg-primary-700 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          )}
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function Celebration({
  milestone,
  onComplete,
  onDismiss,
  autoShow = true,
}: CelebrationProps): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(autoShow);
  const [hasTriggered, setHasTriggered] = useState(false);

  const config = MILESTONE_CONFIGS[milestone];

  // Trigger celebration effect
  const triggerEffect = useCallback(() => {
    if (hasTriggered) return;
    setHasTriggered(true);

    switch (config.type) {
      case 'confetti':
        fireConfetti();
        break;
      case 'fireworks':
        fireFireworks(config.duration);
        break;
      case 'stars':
        fireStars();
        break;
    }

    // Auto-complete after duration
    if (onComplete) {
      setTimeout(onComplete, config.duration);
    }
  }, [config, hasTriggered, onComplete]);

  // Auto-trigger on mount
  useEffect(() => {
    if (autoShow) {
      triggerEffect();
    }
  }, [autoShow, triggerEffect]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleDismiss]);

  return (
    <CelebrationModal
      config={config}
      isVisible={isVisible}
      onDismiss={handleDismiss}
    />
  );
}

// ============================================
// Imperative API
// ============================================

/**
 * Trigger a celebration programmatically
 */
export function triggerCelebration(milestone: MilestoneType): void {
  const config = MILESTONE_CONFIGS[milestone];
  
  switch (config.type) {
    case 'confetti':
      fireConfetti();
      break;
    case 'fireworks':
      fireFireworks(config.duration);
      break;
    case 'stars':
      fireStars();
      break;
  }
}

/**
 * Quick confetti burst for small wins
 */
export function quickCelebrate(): void {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    zIndex: 9999,
  });
}

export default Celebration;
