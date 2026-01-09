
import { Branch, Question, QuestionType, TrainingModule } from './types';

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    branch: Branch.Perceiving,
    type: QuestionType.ImageAnalysis,
    scenario: 'Look at the facial expression in the image. To what extent is this person expressing Anticipation?',
    imageUrl: 'https://picsum.photos/600/400?grayscale',
    options: [
      { id: '1', text: 'Not at all', score: 0.2 },
      { id: '2', text: 'Slightly', score: 0.5 },
      { id: '3', text: 'Moderately', score: 1.0 }, // Consensus Answer
      { id: '4', text: 'Very much', score: 0.6 },
      { id: '5', text: 'Extremely', score: 0.3 },
    ],
  },
  {
    id: 'q2',
    branch: Branch.Understanding,
    type: QuestionType.MultipleChoice,
    scenario: 'Julia feels regretful about a decision she made. If this feeling intensifies and combines with annoyance at herself, what is she most likely to feel next?',
    options: [
      { id: 'a', text: 'Depression', score: 0.4 },
      { id: 'b', text: 'Guilt', score: 1.0 }, // Consensus
      { id: 'c', text: 'Anxiety', score: 0.5 },
      { id: 'd', text: 'Apathy', score: 0.1 },
    ],
  },
  {
    id: 'q3',
    branch: Branch.Managing,
    type: QuestionType.MultipleChoice,
    scenario: 'You are leading a team that has just lost a major client. Morale is low, and people are blaming each other. What is the most effective action to manage the team\'s emotions?',
    options: [
      { id: 'a', text: 'Immediately hold a meeting to find out who is responsible.', score: 0.2 },
      { id: 'b', text: 'Acknowledge the disappointment, then refocus the group on a unified recovery plan.', score: 1.0 },
      // Fixed: property 'stroke' was changed to 'text' to match Question interface
      { id: 'c', text: 'Ignore the loss and tell everyone to stay positive.', score: 0.3 },
      { id: 'd', text: 'Meet with members individually to let them vent about their colleagues.', score: 0.4 },
    ],
  }
];

export const TRAINING_MODULES: TrainingModule[] = [
  // Perceiving Emotions
  {
    id: 't1',
    title: 'Micro-Expression Drilling',
    description: 'Rapidly identify subtle facial cues in 50ms flashes.',
    branch: Branch.Perceiving,
    duration: '5 min',
    requiredLevel: 1,
  },
  {
    id: 't5',
    title: 'Non-Verbal Leakage',
    description: 'Detect when someone is hiding their true state through posture.',
    branch: Branch.Perceiving,
    duration: '10 min',
    requiredLevel: 4,
  },
  {
    id: 't9',
    title: 'Vocal Prosody Analysis',
    description: 'Interpret emotional intent through tone, pitch, and pauses.',
    branch: Branch.Perceiving,
    duration: '7 min',
    requiredLevel: 7,
  },
  // Using Emotions
  {
    id: 't4',
    title: 'Mood Induction',
    description: 'How to generate specific moods for creative versus analytical tasks.',
    branch: Branch.Using,
    duration: '10 min',
    requiredLevel: 1,
  },
  {
    id: 't6',
    title: 'Emotional Catalysts',
    description: 'Using empathy to drive team innovation during brainstorming.',
    branch: Branch.Using,
    duration: '12 min',
    requiredLevel: 5,
  },
  // Understanding Emotions
  {
    id: 't2',
    title: 'Emotional Vocabulary',
    description: 'Learn the nuance between similar states like Envy and Jealousy.',
    branch: Branch.Understanding,
    duration: '8 min',
    requiredLevel: 1,
  },
  {
    id: 't7',
    title: 'Transition Mapping',
    description: 'Predict how frustration transforms into anger or resignation.',
    branch: Branch.Understanding,
    duration: '15 min',
    requiredLevel: 6,
  },
  {
    id: 't10',
    title: 'Blend Identification',
    description: 'Deconstruct complex emotions like Bittersweet or Awe.',
    branch: Branch.Understanding,
    duration: '9 min',
    requiredLevel: 8,
  },
  // Managing Emotions
  {
    id: 't3',
    title: 'Conflict De-escalation',
    description: 'High-stakes management of emotional arguments and blame.',
    branch: Branch.Managing,
    duration: '12 min',
    requiredLevel: 1,
  },
  {
    id: 't8',
    title: 'The Feedback Loop',
    description: 'Regulate your own response to critical clinical evaluations.',
    branch: Branch.Managing,
    duration: '10 min',
    requiredLevel: 5,
  },
  {
    id: 't11',
    title: 'Group Regulation',
    description: 'Managing the emotional climate of an entire ward or team.',
    branch: Branch.Managing,
    duration: '20 min',
    requiredLevel: 9,
  },
];
