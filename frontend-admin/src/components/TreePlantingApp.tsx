import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { DataEntryForm } from "./DataEntryForm";
import forestBackground from "../assets/forest-background.jpg";

export const TreePlantingApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [volunteerName, setVolunteerName] = useState("");

  const handleLogin = (username: string) => {
    setVolunteerName(username);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setVolunteerName("");
  };

  return (
    <div 
      className="min-h-screen bg-forest-blur relative"
      style={{ backgroundImage: `url(${forestBackground})` }}
    >
      <div className="absolute inset-0 backdrop-nature" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {!isLoggedIn ? (
            <LoginForm onLogin={handleLogin} />
          ) : (
            <DataEntryForm 
              volunteerName={volunteerName} 
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </div>
  );
};