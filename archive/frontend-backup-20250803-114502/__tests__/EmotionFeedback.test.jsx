import React from 'react';
import { render, screen } from '@testing-library/react'; // Removed 'act' as it's not used in these tests
import '@testing-library/jest-dom';
import EmotionFeedback from '@/components/archive/EmotionFeedback'; // Using alias from jest.config.js
// AnimatePresence is part of the component's internal structure, not usually wrapped at test level unless testing complex presence toggling.
// import { AnimatePresence } from 'framer-motion';

// Optional: Mock Framer Motion if its animations interfere or cause issues in JSDOM.
// The EmotionFeedback component uses AnimatePresence and motion.div.
// Basic mocks can prevent errors if JSDOM has trouble with them.
// jest.mock('framer-motion', () => {
//   const actual = jest.requireActual('framer-motion');
//   return {
//     ...actual,
//     AnimatePresence: ({ children }) => <>{children}</>, // Pass through children
//     motion: { // Mock motion factory
//       ...actual.motion,
//       div: jest.fn().mockImplementation(({ children, ...props }) => {
//         // Forward all props except transition, initial, animate, exit if they cause issues
//         const { initial, animate, exit, transition, ...rest } = props;
//         return <div {...rest}>{children}</div>;
//       }),
//       // Add other motion components if used by EmotionFeedback directly e.g. p, h1 etc.
//     },
//   };
// });


describe('EmotionFeedback Component', () => {
  test('renders correctly with "happiness" emotion and message when visible', () => {
    render(
      <EmotionFeedback
        emotion="happiness"
        message="You won!"
        isVisible={true}
      />
    );    expect(screen.getByText('You won!')).toBeInTheDocument();
    // Check for heading with capitalized emotion (without colon)
    expect(screen.getByText('Happiness')).toBeInTheDocument();    const alertDiv = screen.getByRole('alert');
    expect(alertDiv).toHaveClass('bg-green-50'); // Based on actual component output
    expect(alertDiv).toHaveClass('text-green-700');
  });

  test('renders correctly with "frustration" emotion and message when visible', () => {
    render(
      <EmotionFeedback
        emotion="frustration"
        message="Try again!"
        isVisible={true}
      />
    );    expect(screen.getByText('Try again!')).toBeInTheDocument();
    expect(screen.getByText('Frustration')).toBeInTheDocument();    const alertDiv = screen.getByRole('alert');
    expect(alertDiv).toHaveClass('bg-red-50');
  });

  test('renders correctly with "determination" emotion when visible', () => {
    render(<EmotionFeedback emotion="determination" message="Keep pushing!" isVisible={true} />);    expect(screen.getByText('Keep pushing!')).toBeInTheDocument();
    expect(screen.getByText('Determination')).toBeInTheDocument();    const alertDiv = screen.getByRole('alert');
    expect(alertDiv).toHaveClass('bg-blue-50');
  });

  test('renders with neutral style for unknown emotion when visible', () => {
    render(<EmotionFeedback emotion="unknown" message="Notice" isVisible={true} />);    expect(screen.getByText('Notice')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    const alertDiv = screen.getByRole('alert');
    expect(alertDiv).toHaveClass('bg-gray-100');
  });

  test('renders with neutral style and "Notification" title if emotion prop is null/undefined, when visible', () => {
    render(<EmotionFeedback emotion={null} message="A general notification" isVisible={true} />);    expect(screen.getByText('A general notification')).toBeInTheDocument();
    expect(screen.getByText('Notification')).toBeInTheDocument();
    const alertDiv = screen.getByRole('alert');
    expect(alertDiv).toHaveClass('bg-gray-100');
  });

  test('does not render when isVisible is false', () => {
    render(
      <EmotionFeedback
        emotion="happiness"
        message="You won!"
        isVisible={false}
      />
    );
    // AnimatePresence might keep it in structure but hidden, or remove.
    // If removed, queryByText will be null. Test for absence.
    expect(screen.queryByText('You won!')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('does not render when message is empty string', () => {
    render(
      <EmotionFeedback
        emotion="happiness"
        message=""
        isVisible={true}
      />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('does not render when message is null', () => {
    render(
      <EmotionFeedback
        emotion="happiness"
        message={null}
        isVisible={true}
      />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // This test is conceptual as JSDOM doesn't run actual animations or complex style computations.
  // It mainly ensures the component renders without error when Framer Motion parts are included.
  // The mock for framer-motion in jest.setup.js might simplify motion.div to a regular div.
  test('component structure includes elements for animation (conceptual)', () => {
    const { container } = render(
      <EmotionFeedback emotion="happiness" message="Animated!" isVisible={true} />
    );
    // Check if the main div (which would be motion.div) is present.
    const alertDiv = screen.getByRole('alert');
    expect(alertDiv).toBeInTheDocument();
    // Further checks could be for specific classes or styles if the mock passes them through.
    // For example, if framer-motion adds inline styles for initial={{ opacity: 0 }},
    // you could check for style="opacity: 0;" if not mocked away.
    // With the current basic mock, it's hard to assert more on animation specifics.
  });
});
