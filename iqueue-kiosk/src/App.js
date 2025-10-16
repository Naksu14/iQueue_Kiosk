import "./App.css";
import { Routes, Route } from "react-router-dom";
import { TransactionProvider } from "./context/walkinTransactionContext";
import Nav from "./components/navigation/nav";
import WelcomePage from "./pages/welcomePage";
import WalkinSelectTransaction from "./pages/walkinSelectTransaction";
import ScanningPage from "./pages/scanningPage";
import OfficeServiceSelection from "./pages/officeServiceSelection";
import TransactionPage from "./pages/transactionPage";
import InputInformation from "./pages/inputInformationPage";
import QueueTicketPage from "./pages/queueTicketPage";

function App() {
  return (
    <div className="App bg-[#F4F5F9] min-h-screen flex flex-col">
      {/* Navbar */}
      <Nav />

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        <TransactionProvider>
          <Routes>
            {/* index page */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/WalkinSelectTransaction" element={<WalkinSelectTransaction />} />

            {/* Scanning qr for online transaction */}
            <Route path="/ScanningPage" element={<ScanningPage />} />

            {/* Creating Walk in transaction */}
            <Route
              path="/OfficeServiceSelection"
              element={<OfficeServiceSelection />}
            />
            <Route path="/TransactionPage" element={<TransactionPage />} />
            <Route path="/InputInformation" element={<InputInformation />} />
            <Route path="/QueueTicketPage" element={<QueueTicketPage />} />
          </Routes>
        </TransactionProvider>
      </main>
    </div>
  );
}

export default App;
