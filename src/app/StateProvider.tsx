import { React, createContext, useReducer } from 'react';

export const StateContext = createContext(null);
export const StateDispatchContext = createContext(null);

export function StateProvider({ children, config }) {
  const [state, dispatch] = useReducer(
    stateReducer,
    {
      config: config,
    }
  );

  return (
    <StateContext.Provider value={state}>
      <StateDispatchContext.Provider value={dispatch}>
        { children }
      </StateDispatchContext.Provider>
    </StateContext.Provider>
  );
}

function stateReducer(state, action) {
  console.log(state, action)
}
