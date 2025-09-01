import { call, put, takeEvery } from "redux-saga/effects";
import { supabase } from "../../services/supabase";
import {
  fetchWordListsRequest,
  fetchWordListsSuccess,
  fetchWordListsFailure,
} from "../slices/wordsSlice";

// Worker Sagas
function* fetchWordListsSaga() {
  try {
    const { data, error } = yield call(
      [supabase.from("words"), "select"],
      "list_name"
    );

    if (error) throw error;

    // Получаем уникальные значения list_name
    const uniqueListNames = [
      ...new Set(
        (data as { list_name: string }[])
          ?.map((item) => item.list_name)
          .filter((name) => name && typeof name === "string") || []
      ),
    ] as string[];

    yield put(fetchWordListsSuccess(uniqueListNames));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch word lists";
    yield put(fetchWordListsFailure(message));
  }
}

// Watcher Sagas
export function* watchWordsSagas() {
  yield takeEvery(fetchWordListsRequest.type, fetchWordListsSaga);
}
