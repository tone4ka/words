import { all } from "redux-saga/effects";
import { watchAuthSagas } from "./authSaga";

export default function* rootSaga() {
  yield all([watchAuthSagas()]);
}
