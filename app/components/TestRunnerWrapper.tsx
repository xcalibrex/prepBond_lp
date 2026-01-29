import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { TestRunner } from './TestRunner';

export const TestRunnerWrapper = ({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) => {
    const { testId } = useParams();
    const [searchParams] = useSearchParams();
    const reviewSessionId = searchParams.get('reviewSessionId');

    // If opened in new tab, we generally can't 'navigate' back to the previous tab's history stack effectively if it's a fresh load.
    // But assuming SPA usage.

    if (!testId) return <div>Error: No Test ID</div>;
    // Pass reviewSessionId (string | null) to TestRunner
    return <TestRunner testId={testId} reviewSessionId={reviewSessionId} onComplete={onComplete} onCancel={onCancel} />;
};
