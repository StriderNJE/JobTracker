// src/MainAppContent.tsx
import React from "react";

interface MainAppContentProps {
  isLoggedIn: boolean;
  handleLogout: () => void;
}

const MainAppContent: React.FC<MainAppContentProps> = ({
  isLoggedIn,
  handleLogout,
}) => {
  return (
    <div>
      <header>
        <h1>Job Tracker</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
      {/* Your existing search field, add job button, job list etc. here */}
      {/* ... */}
    </div>
  );
};

export default MainAppContent;
