import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { BranchProvider } from "./context/BranchContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BranchProvider>
          <AppRoutes />
        </BranchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
