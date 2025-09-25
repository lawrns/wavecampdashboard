import { useEffect, useRef } from 'react';

export function usePortalModal(isOpen: boolean) {
  const modalRootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Create or get the modal root element
    let modalRoot = document.getElementById('heiwa-modal-portal');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'heiwa-modal-portal';
      modalRoot.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999999;
        pointer-events: none;
      `;
      document.body.appendChild(modalRoot);
    }
    modalRootRef.current = modalRoot;

    return () => {
      // Clean up when component unmounts
      if (modalRootRef.current && modalRootRef.current.parentNode) {
        modalRootRef.current.parentNode.removeChild(modalRootRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Handle body overflow when modal opens/closes
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('heiwa-modal-open');
      if (modalRootRef.current) {
        modalRootRef.current.style.pointerEvents = 'auto';
      }
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('heiwa-modal-open');
      if (modalRootRef.current) {
        modalRootRef.current.style.pointerEvents = 'none';
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('heiwa-modal-open');
    };
  }, [isOpen]);

  return modalRootRef.current;
}
