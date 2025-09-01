import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { WordsState } from "../../types";

const initialState: WordsState = {
  wordLists: [],
  loading: false,
  error: null,
  lastFetchTime: null,
};

const wordsSlice = createSlice({
  name: "words",
  initialState,
  reducers: {
    // Fetch word lists actions
    fetchWordListsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchWordListsSuccess: (state, action: PayloadAction<string[]>) => {
      state.loading = false;
      state.wordLists = action.payload;
      state.error = null;
      state.lastFetchTime = Date.now();
    },
    fetchWordListsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Clear error
    clearWordsError: (state) => {
      state.error = null;
    },

    // Reset words state (for logout)
    resetWordsState: (state) => {
      state.wordLists = [];
      state.loading = false;
      state.error = null;
      state.lastFetchTime = null;
    },
  },
});

export const {
  fetchWordListsRequest,
  fetchWordListsSuccess,
  fetchWordListsFailure,
  clearWordsError,
  resetWordsState,
} = wordsSlice.actions;

export default wordsSlice.reducer;
