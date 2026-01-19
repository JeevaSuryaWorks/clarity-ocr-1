import React from 'react';
import PublicChecklistPage from './PublicChecklist';

const SharedChecklist: React.FC = () => {
  // SharedChecklist is essentially an alias for the PublicChecklistPage logic
  // which handles fetching by ID and determining permissions.
  return <PublicChecklistPage />;
};

export default SharedChecklist;
