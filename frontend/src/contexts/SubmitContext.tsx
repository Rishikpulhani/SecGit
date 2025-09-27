'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SubmitContextType {
  showSubmitModal: boolean;
  openSubmitModal: () => void;
  closeSubmitModal: () => void;
}

const SubmitContext = createContext<SubmitContextType | undefined>(undefined);

export const SubmitProvider = ({ children }: { children: ReactNode }) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const openSubmitModal = () => setShowSubmitModal(true);
  const closeSubmitModal = () => setShowSubmitModal(false);

  return (
    <SubmitContext.Provider value={{ showSubmitModal, openSubmitModal, closeSubmitModal }}>
      {children}
    </SubmitContext.Provider>
  );
};

export const useSubmit = () => {
  const context = useContext(SubmitContext);
  if (context === undefined) {
    throw new Error('useSubmit must be used within a SubmitProvider');
  }
  return context;
};
