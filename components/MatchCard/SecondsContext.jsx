import React, { createContext, useContext, useEffect, useState } from "react";

const SecondsContext = createContext(0);

export function SecondsProvider({ children }) {
  const [seconds, setSeconds] = useState(new Date().getSeconds());

  useEffect(() => {
    const tick = setInterval(() => {
      setSeconds(new Date().getSeconds());
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <SecondsContext.Provider value={seconds}>
      {children}
    </SecondsContext.Provider>
  );
}

export function useSeconds() {
  return useContext(SecondsContext);
}
