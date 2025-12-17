import LandingPage from "@/components/LandingPage";
import forestBackground from "@/assets/forest-background.jpg";

const Index = () => {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${forestBackground})`,
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm"></div>
      
      {/* Content */}
      <div className="relative z-10">
        <LandingPage onShowTreeData={() => {
          // Navigate to a sample tree for demonstration (using actual serial from backend)
          window.location.href = '/00003';
        }} />
      </div>
    </div>
  );
};

export default Index;
