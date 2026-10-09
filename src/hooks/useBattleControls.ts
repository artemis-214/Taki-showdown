'use client';

import { useEffect, useRef, useState } from 'react';

interface BattleControlsProps {
  onMoveSelect: (index: number) => void;
  onBenchSelect: (index: number) => void;
  enabled: boolean;
}

export function useBattleControls({
  onMoveSelect,
  onBenchSelect,
  enabled,
}: BattleControlsProps) {
  const [controllerConnected, setControllerConnected] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0); // 0-3 for move grid
  const lastButtonState = useRef<Record<number, boolean>>({});

  // 1. Keyboard Listeners
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on space/arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.key) {
        // Direct move keys
        case '1':
          onMoveSelect(0);
          break;
        case '2':
          onMoveSelect(1);
          break;
        case '3':
          onMoveSelect(2);
          break;
        case '4':
          onMoveSelect(3);
          break;

        // Direct Bench switch keys
        case 'q':
        case 'Q':
          onBenchSelect(0);
          break;
        case 'w':
        case 'W':
          onBenchSelect(1);
          break;
        case 'e':
        case 'E':
          onBenchSelect(2);
          break;

        // Grid Navigation
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setFocusedIndex((prev) => (prev % 2 === 1 ? prev - 1 : prev));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setFocusedIndex((prev) => (prev % 2 === 0 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setFocusedIndex((prev) => (prev >= 2 ? prev - 2 : prev));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setFocusedIndex((prev) => (prev <= 1 ? prev + 2 : prev));
          break;

        // Confirm
        case 'Enter':
        case ' ':
          onMoveSelect(focusedIndex);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, focusedIndex, onMoveSelect, onBenchSelect]);

  // 2. Gamepad API Polling Loop
  useEffect(() => {
    if (!enabled) return;

    let animFrame: number;

    const checkGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];

      if (gp) {
        if (!controllerConnected) setControllerConnected(true);

        const isPressed = (btnIndex: number) => Boolean(gp.buttons[btnIndex]?.pressed);
        const wasJustPressed = (btnIndex: number) => {
          const current = isPressed(btnIndex);
          const last = lastButtonState.current[btnIndex] ?? false;
          lastButtonState.current[btnIndex] = current;
          return current && !last;
        };

        // D-Pad / Left Stick Navigation
        const dpadUp = wasJustPressed(12) || gp.axes[1]! < -0.5;
        const dpadDown = wasJustPressed(13) || gp.axes[1]! > 0.5;
        const dpadLeft = wasJustPressed(14) || gp.axes[0]! < -0.5;
        const dpadRight = wasJustPressed(15) || gp.axes[0]! > 0.5;

        if (dpadLeft) setFocusedIndex((prev) => (prev % 2 === 1 ? prev - 1 : prev));
        if (dpadRight) setFocusedIndex((prev) => (prev % 2 === 0 ? prev + 1 : prev));
        if (dpadUp) setFocusedIndex((prev) => (prev >= 2 ? prev - 2 : prev));
        if (dpadDown) setFocusedIndex((prev) => (prev <= 1 ? prev + 2 : prev));

        // Face Button Confirm (A / Cross = Button 0)
        if (wasJustPressed(0)) {
          onMoveSelect(focusedIndex);
        }

        // Quick Face Buttons: X = Move 0, Y = Move 1, B = Move 2
        if (wasJustPressed(2)) onMoveSelect(0); // X / Square
        if (wasJustPressed(3)) onMoveSelect(1); // Y / Triangle
        if (wasJustPressed(1)) onMoveSelect(2); // B / Circle

        // Bumpers for Bench Swaps (L1 = Bench 0, R1 = Bench 1/2)
        if (wasJustPressed(4)) onBenchSelect(0); // L1
        if (wasJustPressed(5)) onBenchSelect(1); // R1
      } else {
        if (controllerConnected) setControllerConnected(false);
      }

      animFrame = requestAnimationFrame(checkGamepad);
    };

    animFrame = requestAnimationFrame(checkGamepad);
    return () => cancelAnimationFrame(animFrame);
  }, [enabled, controllerConnected, focusedIndex, onMoveSelect, onBenchSelect]);

  return { focusedIndex, controllerConnected };
}