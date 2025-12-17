import { useAuthContext } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/LoginForm";
import { DataEntryForm } from "@/components/DataEntryForm";
import forestBackground from "../assets/forest-background.jpg";

const Index = () => {
  const { isAuthenticated, isLoading } = useAuthContext();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div 
        className="min-h-screen bg-forest-blur relative flex items-center justify-center"
        style={{ backgroundImage: `url(${forestBackground})` }}
      >
        <div className="absolute inset-0 backdrop-nature" />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-forest-blur relative"
      style={{ backgroundImage: `url(${forestBackground})` }}
    >
      <div className="absolute inset-0 backdrop-nature" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {!isAuthenticated ? (
            <LoginForm />
          ) : (
            <DataEntryForm />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
