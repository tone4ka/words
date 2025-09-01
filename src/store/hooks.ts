import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";

// Типизированные хуки для использования в компонентах
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
