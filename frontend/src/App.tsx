// /Users/duncan/dev/personal-projects/waystation/frontend/src/App.tsx
import { useState, ReactElement } from "react";
import SuppliersView from "modules/SuppliersView";
import RFQsView from "modules/RFQView";
import QuoteComparisonView from "modules/QuoteComparisonView";
import QuotesView from "modules/QuotesView";
import { RFQ } from "types/rfq";
import { TbUser, TbFileDownload, TbReceipt } from "react-icons/tb";

type View = "suppliers" | "rfqs" | "quotes";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("rfqs");
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);

  const handleRfqSelect = (rfq: RFQ) => {
    setSelectedRfq(rfq);
  };

  const handleBack = () => {
    setSelectedRfq(null);
  };

  const navItems: { key: View; label: string; icon: ReactElement }[] = [
    {
      key: "suppliers",
      label: "Suppliers",
      icon: <TbUser size="30px" />,
    },
    {
      key: "rfqs",
      label: "RFQs",
      icon: <TbFileDownload size="30px" />,
    },
    {
      key: "quotes",
      label: "Quotes",
      icon: <TbReceipt size="30px" />,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900 font-sans">
      <aside className="w-24 border-r border-gray-200 bg-white flex flex-col items-center py-6 gap-6 shadow-md">
        <h1 className="text-lg font-semibold">Portal</h1>
        <nav className="flex flex-col items-center gap-6 w-full">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentView(item.key)}
              className={`group flex flex-col items-center justify-center gap-1 w-full p-2 transition rounded-md
                ${
                  currentView === item.key
                    ? "text-blue-600 bg-blue-100"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }
              `}
            >
              <div className="grid h-10 w-10 place-items-center">
                <div className="relative flex items-center justify-center h-5 w-5">
                  {item.icon}
                </div>
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6">
        {selectedRfq ? (
          <QuoteComparisonView rfq={selectedRfq} onBack={handleBack} />
        ) : (
          <>
            {currentView === "suppliers" && <SuppliersView />}
            {currentView === "rfqs" && (
              <RFQsView onRfqSelect={handleRfqSelect} />
            )}
            {currentView === "quotes" && <QuotesView />}
          </>
        )}
      </main>
    </div>
  );
}