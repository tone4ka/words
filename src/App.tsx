import { Provider } from "react-redux";
import { store } from "./store";
import AuthForm from "./components/AuthForm";
import "./App.css";

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <header className="App-header">
          <h1>React + TypeScript + Vite + Redux Saga + Supabase</h1>
          <p>Template Application</p>
        </header>
        <main>
          <AuthForm />
        </main>
      </div>
    </Provider>
  );
}

export default App;
