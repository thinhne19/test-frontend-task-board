import { type RefObject, useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  isOpen: boolean;
  onEscape?: () => void;
  restoreFocusSelector?: string | null;
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  { isOpen, onEscape, restoreFocusSelector }: UseFocusTrapOptions
): void {
  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;
    const container = containerRef.current;

    if (container) {
      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0]?.focus();
      } else {
        container.focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onEscape?.();
        return;
      }

      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements[focusableElements.length - 1]!;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Trả focus về Card hoặc phần tử trước đó sau khi đóng Modal
      window.requestAnimationFrame(() => {
        if (restoreFocusSelector) {
          const cardEl = document.querySelector<HTMLElement>(restoreFocusSelector);
          if (cardEl) {
            cardEl.focus();
            return;
          }
        }
        previousActiveElement?.focus?.();
      });
    };
  }, [isOpen, onEscape, restoreFocusSelector, containerRef]);
}
