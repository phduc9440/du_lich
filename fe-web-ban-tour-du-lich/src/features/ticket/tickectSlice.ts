import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SelectedTourInfo {
  id: number;
  tour_code: string;
  title: string;
  start_date: string;
  end_date: string;
  main_image: string;
  unitPrice: number;
}

interface TicketState {
  quantities: number;
  selectedTour: SelectedTourInfo | null;
}

const initialState: TicketState = {
  quantities: 0,
  selectedTour: null,
};

const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    setTicketQuantity: (
      state,
      action: PayloadAction<number>
    ) => {
      state.quantities = action.payload;
    },
    setSelectedTour: (
      state,
      action: PayloadAction<SelectedTourInfo | null>
    ) => {
      state.selectedTour = action.payload;
    },
    resetTickets: (state) => {
      state.quantities = 0;
      state.selectedTour = null;
    },
  },
});

export const { setTicketQuantity, setSelectedTour, resetTickets } = ticketSlice.actions;
export default ticketSlice.reducer;
