import { createContext, useContext, useState, useMemo, useCallback } from "react";

const BoardHeaderContext = createContext(null);

export function BoardHeaderProvider({ children }) {
  const [boardHeaderData, setBoardHeaderDataState] = useState(null);

  const setBoardHeaderData = useCallback((data) => {
    setBoardHeaderDataState(data);
  }, []);

  const clearBoardHeaderData = useCallback(() => {
    setBoardHeaderDataState(null);
  }, []);

  const value = useMemo(
    () => ({
      boardHeaderData,
      setBoardHeaderData,
      clearBoardHeaderData,
    }),
    [boardHeaderData, setBoardHeaderData, clearBoardHeaderData]
  );

  return (
    <BoardHeaderContext.Provider value={value}>
      {children}
    </BoardHeaderContext.Provider>
  );
}

export function useBoardHeader() {
  const context = useContext(BoardHeaderContext);
  if (!context) {
    return {
      boardHeaderData: null,
      setBoardHeaderData: () => {},
      clearBoardHeaderData: () => {},
    };
  }
  return context;
}
