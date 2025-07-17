import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: localStorage.getItem("userInfo")
    ,
  isSidebarOpen: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload?.user || null; 
      if (state.user) {
        localStorage.setItem("userInfo", JSON.stringify(state.user));
      } else {
        localStorage.removeItem("userInfo");
      }
   },
   
    logout: (state, action) => {
      state.user = null;
      localStorage.removeItem("userInfo");
    },
    setOpenSidebar: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
  },
});

export const { setCredentials, logout, setOpenSidebar } = authSlice.actions;

export default authSlice.reducer;
