/// <reference types="react-scripts" />

// Extend the module definition for React
declare namespace React {
  // Extend the lazy function type to better handle component imports
  function lazy<T extends React.ComponentType<any>>(
    factory: () => Promise<{ default: T }>
  ): T;
}
