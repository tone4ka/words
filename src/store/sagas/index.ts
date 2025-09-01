import { all } from "redux-saga/effects";
import { watchAuthSagas } from "./authSaga";
import { watchWordsSagas } from "./wordsSaga";

export default function* rootSaga() {
  yield all([watchAuthSagas(), watchWordsSagas()]);
}
