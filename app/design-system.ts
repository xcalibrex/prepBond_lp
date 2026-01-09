/**
 * PrepBond Design System
 * Use these constants to maintain visual consistency across components.
 */

export const DS = {
  // Border Radius (Matches index.html tailwind config)
  radius: {
    sm: 'rounded-sm',      // 4px
    md: 'rounded-md',      // 8px
    lg: 'rounded-lg',      // 10px
    xl: 'rounded-3xl',  // 24px
    card: 'rounded-3xl',   // 24px (standard modern card)
    modal: 'rounded-3xl',  // 24px (emphasized container)
    full: 'rounded-full',  // Pill
    button: 'rounded-[200px]', // 200px - pill-shaped buttons
  },

  // Spacing & Padding
  padding: {
    page: 'px-6 md:px-8 py-10',
    section: 'space-y-8',
    card: 'p-6',
    input: 'px-4 py-3',
  },

  // Animation Defaults
  animation: {
    enter: 'animate-fade-in-up',
    hover: 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
    active: 'active:scale-95 transition-transform',
    theme: 'transition-colors duration-300 ease-in-out', // Snappier theme switch
  },

  // Shared Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    none: 'shadow-none',
  }
};
