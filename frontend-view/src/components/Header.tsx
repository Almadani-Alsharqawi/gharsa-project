/**
 * Header Component for frontend-view
 * Displays logo and slogan in the top-left corner
 * Responsive design that hides text on very small screens
 * Positioned for RTL layout
 */

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6" dir="rtl">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Logo */}
        <img
          src="/logo.webp"
          alt="غرسة - Gharsa Logo"
          className="h-10 md:h-12 w-auto object-contain"
        />
        
        {/* Slogan - hidden on very small screens, visible on sm and up */}
        <span className="text-white text-sm md:text-base lg:text-lg font-semibold hidden sm:inline-block drop-shadow-lg">
          رحلة للتنمية المستدامة
        </span>
      </div>
    </header>
  );
};

export default Header;

