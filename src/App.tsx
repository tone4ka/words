import { Provider } from "react-redux";
import { store } from "./store";
import AuthForm from "./components/AuthForm";
import "./App.css";

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <header className="App-header">
          <h1>Hi, Katusha:)</h1>
          <p>English Dictionary</p>
        </header>
        <main>
          <AuthForm />
        </main>
      </div>
    </Provider>
  );
}

export default App;
