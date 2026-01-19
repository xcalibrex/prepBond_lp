import React from 'react';
import { useParams } from 'react-router-dom';
import { TestRunner } from './TestRunner';

export const TestRunnerWrapper = ({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) => {
    const { testId } = useParams();

    // If opened in new tab, we generally can't 'navigate' back to the previous tab's history stack effectively if it's a fresh load.
    // But assuming SPA usage.

    if (!testId) return <div>Error: No Test ID</div>;
    return <TestRunner testId={testId} onComplete={onComplete} onCancel={onCancel} />;
};
