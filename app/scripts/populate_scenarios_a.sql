-- Populate Scenarios A Worksheet
-- Section ID: 2fe358b8-9847-4446-9581-a855d07c27f5

DO $$
DECLARE
    v_test_section_id UUID := '2fe358b8-9847-4446-9581-a855d07c27f5';
    -- v_test_id variables removed as not needed for answer_keys
    v_question_id UUID;
    v_opt_a UUID; v_opt_b UUID; v_opt_c UUID; v_opt_d UUID; v_opt_e UUID;
BEGIN
    -- Cleanup existing placeholder if exists
    DELETE FROM questions WHERE section_id = v_test_section_id;

    -- 1. Sarah / Panic (Correct: E)
    INSERT INTO questions (section_id, type, scenario_context, question_text, explanation, order_index)
    VALUES (
        v_test_section_id,
        'SCENARIO',
        'Sarah has been working on the quarterly financial report for three weeks. It is due tomorrow morning. Suddenly, the file corrupts, and she realizes the backup is two days old. She feels a wave of nausea, her hands start shaking uncontrollably, and she feels a rising sense of catastrophic panic. In order to calm down enough to finish the work, Sarah pushes away from her desk, closes her eyes, and spends 5 minutes doing 4-7-8 rhythmic breathing exercises before looking at the screen again.',
        'How effective is this action?',
        'Panic triggers the amygdala (threat center), which hijacks the prefrontal cortex (logic center). Physically, Sarah is in "fight or flight," meaning her blood has left her brain to fuel her muscles. She physically cannot problem-solve in this state. The breathing exercise is not a waste of time; it is a physiological reset switch that re-engages her parasympathetic nervous system, bringing her cognitive faculties back online so she can rationally assess the backup situation.',
        1
    ) RETURNING id INTO v_question_id;

    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'A', 'Very Ineffective', 0) RETURNING id INTO v_opt_a;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'B', 'Somewhat Ineffective', 1) RETURNING id INTO v_opt_b;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'C', 'Neutral', 2) RETURNING id INTO v_opt_c;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'D', 'Somewhat Effective', 3) RETURNING id INTO v_opt_d;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'E', 'Very Effective', 4) RETURNING id INTO v_opt_e;

    INSERT INTO answer_keys (question_id, question_option_id, correct_answer, points)
    VALUES (v_question_id, v_opt_e, 'E', 1);

    -- 2. Mark / Layoffs (Correct: E)
    INSERT INTO questions (section_id, type, scenario_context, question_text, explanation, order_index)
    VALUES (
        v_test_section_id,
        'SCENARIO',
        'Mark is a project lead. His team has just been informed that the product they spent six months building has been scrapped by upper management due to budget cuts. The team is sitting in the conference room in stunned silence; the air feels heavy, and several employees look visibly defeated and cynical. To maintain long-term morale, Mark stands up and says, "I know this hurts. We poured our hearts into this, and it feels incredibly unfair that we won''t see it launch. Let''s take the rest of the day off to decompress, and we can discuss next steps tomorrow."',
        'How effective is this action?',
        'This strategy utilizes Validation and Recovery. In moments of high disappointment, "Toxic Positivity" (trying to cheer people up immediately) destroys trust because it denies the team''s reality. Mark validates the pain ("It feels unfair"), which creates psychological safety, and then authorizes a recovery period. This prevents burnout and resentment, ensuring the team is ready to pivot when they return.',
        2
    ) RETURNING id INTO v_question_id;

    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'A', 'Very Ineffective', 0) RETURNING id INTO v_opt_a;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'B', 'Somewhat Ineffective', 1) RETURNING id INTO v_opt_b;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'C', 'Neutral', 2) RETURNING id INTO v_opt_c;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'D', 'Somewhat Effective', 3) RETURNING id INTO v_opt_d;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'E', 'Very Effective', 4) RETURNING id INTO v_opt_e;

    INSERT INTO answer_keys (question_id, question_option_id, correct_answer, points)
    VALUES (v_question_id, v_opt_e, 'E', 1);

    -- 3. Email / Henderson (Correct: A)
    INSERT INTO questions (section_id, type, scenario_context, question_text, explanation, order_index)
    VALUES (
        v_test_section_id,
        'SCENARIO',
        'You receive an email from a difficult client, Mr. Henderson, copying your boss. He accuses you of being "incompetent and lazy" because of a minor formatting error. You feel a flush of heat in your face, your heart rate spikes, and you feel a strong urge to defend your reputation immediately. To handle this, you write a detailed, defensive email pointing out that Mr. Henderson sent the wrong files originally, proving the error was his fault, and hit send immediately.',
        'How effective is this action?',
        'This is a Reactive Defense. While factually true, the timing and tone are dictated by anger, not strategy. Replying while flooded with adrenaline almost always results in a tone that sounds aggressive or petty to third parties (like your boss). The "Action Tendency" of anger is to attack; emotional intelligence requires overriding that impulse to wait until you can respond with "High Status" calm.',
        3
    ) RETURNING id INTO v_question_id;

    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'A', 'Very Ineffective', 0) RETURNING id INTO v_opt_a;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'B', 'Somewhat Ineffective', 1) RETURNING id INTO v_opt_b;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'C', 'Neutral', 2) RETURNING id INTO v_opt_c;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'D', 'Somewhat Effective', 3) RETURNING id INTO v_opt_d;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'E', 'Very Effective', 4) RETURNING id INTO v_opt_e;

    INSERT INTO answer_keys (question_id, question_option_id, correct_answer, points)
    VALUES (v_question_id, v_opt_a, 'A', 1);

    -- 4. Liam / Merger (Correct: A)
    INSERT INTO questions (section_id, type, scenario_context, question_text, explanation, order_index)
    VALUES (
        v_test_section_id,
        'SCENARIO',
        'Liam is negotiating a high-stakes merger. He notices the other negotiator won''t make eye contact when discussing liabilities. Liam feels a sharp pang of Suspicion and Irritation. To secure a safe deal, Liam suppresses the suspicion, tells himself he is being paranoid, and smiles warmer to build better rapport.',
        'How effective is this action?',
        'Emotions are data. Suspicion is the brain''s "Check Engine" light signaling a discrepancy between words and behavior. Suppressing this signal to be "nice" creates a strategic blind spot. Liam is discarding valuable intelligence. The effective move would be to use the suspicion to ask probing, specific questions about the liabilities.',
        4
    ) RETURNING id INTO v_question_id;

    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'A', 'Very Ineffective', 0) RETURNING id INTO v_opt_a;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'B', 'Somewhat Ineffective', 1) RETURNING id INTO v_opt_b;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'C', 'Neutral', 2) RETURNING id INTO v_opt_c;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'D', 'Somewhat Effective', 3) RETURNING id INTO v_opt_d;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'E', 'Very Effective', 4) RETURNING id INTO v_opt_e;

    INSERT INTO answer_keys (question_id, question_option_id, correct_answer, points)
    VALUES (v_question_id, v_opt_a, 'A', 1);

    -- 5. Jenna / Interruption (Correct: A)
    INSERT INTO questions (section_id, type, scenario_context, question_text, explanation, order_index)
    VALUES (
        v_test_section_id,
        'SCENARIO',
        'Jenna, a senior colleague, habitually interrupts you during team meetings. Today she cut you off mid-sentence again. You feel a mix of frustration and smallness (shame), and you worry that the team thinks you are weak. To establish respect, you stop speaking immediately, look down at your notes, and remain silent for the rest of the meeting to avoid a conflict.',
        'How effective is this action?',
        'This is Submissive Avoidance. By retreating, you validate Jenna''s dominance hierarchy and reinforce the behavior (she learns she can interrupt you without cost). This increases your internal shame and likely leads to long-term resentment or disengagement from the team. It solves the immediate tension but worsens the long-term dynamic.',
        5
    ) RETURNING id INTO v_question_id;

    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'A', 'Very Ineffective', 0) RETURNING id INTO v_opt_a;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'B', 'Somewhat Ineffective', 1) RETURNING id INTO v_opt_b;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'C', 'Neutral', 2) RETURNING id INTO v_opt_c;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'D', 'Somewhat Effective', 3) RETURNING id INTO v_opt_d;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'E', 'Very Effective', 4) RETURNING id INTO v_opt_e;

    INSERT INTO answer_keys (question_id, question_option_id, correct_answer, points)
    VALUES (v_question_id, v_opt_a, 'A', 1);

    -- 6. Promotion / Resentment (Correct: B)
    INSERT INTO questions (section_id, type, scenario_context, question_text, explanation, order_index)
    VALUES (
        v_test_section_id,
        'SCENARIO',
        'You were expecting a promotion to Director. Today, it was given to a colleague who you believe works less hard than you. You feel a deep, corrosive Resentment and Envy. You need to stay at the company for financial reasons. To help your job performance, you tell yourself: "They clearly don''t value hard work here, so I will do the bare minimum required to not get fired until I find a new job."',
        'How effective is this action?',
        'This is Quiet Quitting (Disengagement). It is effective for short-term emotional protection because it lowers your expectations, preventing future disappointment. However, it is ineffective for your long-term career growth or happiness, as it traps you in a state of cynicism and stagnation. A better reframe would involve seeking specific feedback or upskilling.',
        6
    ) RETURNING id INTO v_question_id;

    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'A', 'Very Ineffective', 0) RETURNING id INTO v_opt_a;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'B', 'Somewhat Ineffective', 1) RETURNING id INTO v_opt_b;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'C', 'Neutral', 2) RETURNING id INTO v_opt_c;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'D', 'Somewhat Effective', 3) RETURNING id INTO v_opt_d;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'E', 'Very Effective', 4) RETURNING id INTO v_opt_e;

    INSERT INTO answer_keys (question_id, question_option_id, correct_answer, points)
    VALUES (v_question_id, v_opt_b, 'B', 1);

    -- 7. David / Micromanager (Correct: E)
    INSERT INTO questions (section_id, type, scenario_context, question_text, explanation, order_index)
    VALUES (
        v_test_section_id,
        'SCENARIO',
        'Your boss, David, is an anxious micromanager. He emails you every hour asking for updates. You feel suffocated, anxious, and annoyed. To reduce your daily stress, you create a "Daily Dashboard" that auto-updates with your progress and send him the link, saying, "You can check this live anytime to see exactly where I stand."',
        'How effective is this action?',
        'This is Managing Up. You have identified that David''s behavior is driven by Anxiety (fear of the unknown), not malice. By providing a mechanism (Dashboard) that removes the unknown, you soothe his anxiety without requiring your constant attention. You regulate his emotion to buy yourself freedom.',
        7
    ) RETURNING id INTO v_question_id;

    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'A', 'Very Ineffective', 0) RETURNING id INTO v_opt_a;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'B', 'Somewhat Ineffective', 1) RETURNING id INTO v_opt_b;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'C', 'Neutral', 2) RETURNING id INTO v_opt_c;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'D', 'Somewhat Effective', 3) RETURNING id INTO v_opt_d;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'E', 'Very Effective', 4) RETURNING id INTO v_opt_e;

    INSERT INTO answer_keys (question_id, question_option_id, correct_answer, points)
    VALUES (v_question_id, v_opt_e, 'E', 1);

    -- 8. Data Entry / Boredom (Correct: E)
    INSERT INTO questions (section_id, type, scenario_context, question_text, explanation, order_index)
    VALUES (
        v_test_section_id,
        'SCENARIO',
        'You are performing a repetitive data entry task that will take 4 hours. You feel incredibly Bored and your mind keeps wandering, causing you to make typos. To maintain focus, you challenge yourself to a "Sprint," setting a timer for 20 minutes to try and beat your record for entries typed without a single error.',
        'How effective is this action?',
        'Boredom is a state of Unsatisfied Arousal—the brain has energy but the task is too easy. Gamification (adding a time/accuracy constraint) artificially increases the difficulty level. This matches the challenge to your skill level, pushing you toward a "Flow State" and utilizing the restless energy productively.',
        8
    ) RETURNING id INTO v_question_id;

    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'A', 'Very Ineffective', 0) RETURNING id INTO v_opt_a;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'B', 'Somewhat Ineffective', 1) RETURNING id INTO v_opt_b;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'C', 'Neutral', 2) RETURNING id INTO v_opt_c;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'D', 'Somewhat Effective', 3) RETURNING id INTO v_opt_d;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'E', 'Very Effective', 4) RETURNING id INTO v_opt_e;

    INSERT INTO answer_keys (question_id, question_option_id, correct_answer, points)
    VALUES (v_question_id, v_opt_e, 'E', 1);

    -- 9. Presentation / Interruption (Correct: E)
    INSERT INTO questions (section_id, type, scenario_context, question_text, explanation, order_index)
    VALUES (
        v_test_section_id,
        'SCENARIO',
        'You are giving a presentation to the board. The CEO interrupts and harshly criticizes your graph. You feel a "Fight or Flight" dump of adrenaline—your heart pounds and your mind goes blank. To recover your composure, you take a slow breath, hold eye contact, and say, "That is a valid point regarding the data scale. I will adjust that for the final report. Moving on to the projections..."',
        'How effective is this action?',
        'This utilizes Acknowledgement and Bridge. The breath regulates the physiology. Acknowledging the point validates the CEO (preventing a power struggle). Pivoting immediately back to the presentation signals confidence and control. It prevents you from getting stuck in a defensive spiral.',
        9
    ) RETURNING id INTO v_question_id;

    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'A', 'Very Ineffective', 0) RETURNING id INTO v_opt_a;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'B', 'Somewhat Ineffective', 1) RETURNING id INTO v_opt_b;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'C', 'Neutral', 2) RETURNING id INTO v_opt_c;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'D', 'Somewhat Effective', 3) RETURNING id INTO v_opt_d;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'E', 'Very Effective', 4) RETURNING id INTO v_opt_e;

    INSERT INTO answer_keys (question_id, question_option_id, correct_answer, points)
    VALUES (v_question_id, v_opt_e, 'E', 1);

    -- 10. Firing / Guilt (Correct: A)
    INSERT INTO questions (section_id, type, scenario_context, question_text, explanation, order_index)
    VALUES (
        v_test_section_id,
        'SCENARIO',
        'You have to fire Marcus, a loyal employee who just isn''t performing. You like him personally and feel a heavy sense of Guilt and Sadness. To preserve the employee''s dignity, you spend the first 10 minutes of the meeting talking about how terrible you feel, how hard this decision was for you, and how much you hate doing this.',
        'How effective is this action?',
        'This is Emotional Leakage. By centering your own guilt, you force the employee to comfort you or listen to your pain during their tragedy. It blurs boundaries. The professional approach is to process your guilt privately, and be clear, direct, and supportive of their needs during the meeting.',
        10
    ) RETURNING id INTO v_question_id;

    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'A', 'Very Ineffective', 0) RETURNING id INTO v_opt_a;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'B', 'Somewhat Ineffective', 1) RETURNING id INTO v_opt_b;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'C', 'Neutral', 2) RETURNING id INTO v_opt_c;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'D', 'Somewhat Effective', 3) RETURNING id INTO v_opt_d;
    INSERT INTO question_options (question_id, label, value, order_index) VALUES (v_question_id, 'E', 'Very Effective', 4) RETURNING id INTO v_opt_e;

    INSERT INTO answer_keys (question_id, question_option_id, correct_answer, points)
    VALUES (v_question_id, v_opt_a, 'A', 1);

END $$;
