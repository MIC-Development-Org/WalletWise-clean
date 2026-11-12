import { createContext, useContext } from 'react';

export interface AddSheetApi {
  openAdd: (type?: 'EXPENSE' | 'INCOME') => void;
}

/** Defaults to a no-op so screens render fine inside the landing page previews. */
export const AddSheetContext = createContext<AddSheetApi>({ openAdd: () => {} });

export const useAddSheet = () => useContext(AddSheetContext);
