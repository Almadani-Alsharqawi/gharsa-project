import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Hash, ExternalLink, Heart, RefreshCw, X, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import forestBackground from "@/assets/forest-background.jpg";
import { fetchTreeBySerial, getMediaUrl, type TreeData } from "@/lib/api";

// Translation utility functions
const translateStatus = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'good':
      return 'الشجرة بحالة جيدة';
    case 'needs attention':
      return 'الشجرة بحاجة إلى عناية';
    case 'dead':
      return 'الشجرة ميتة';
    default:
      return status || 'غير محدد';
  }
};

const translateCity = (city: string): string => {
  switch (city?.toLowerCase()) {
    case 'tripoli':
      return 'طرابلس';
    default:
      return city || 'غير محدد';
  }
};

const translateTreeType = (treeType: string): string => {
  switch (treeType?.toLowerCase()) {
    case 'pine':
      return 'صنوبر';
    case 'yasmine':
      return 'ياسمين';
    default:
      return treeType || 'غير محدد';
  }
};

// Format date in English format (as requested)
const formatEnglishDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const TreeDataPage = () => {
  const { serial } = useParams<{ serial: string }>();
  const navigate = useNavigate();
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string>("");
  const { toast } = useToast();

  const fetchTreeData = async () => {
    if (!serial) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use the API service to fetch tree data
      const tree = await fetchTreeBySerial(serial);
      
      if (tree) {
        setTreeData(tree);
      } else {
        setError("لم يتم العثور على بيانات لهذه الشجرة 🌿");
      }
    } catch (error) {
      console.error('Error fetching tree data:', error);
      setError("حدث خطأ أثناء تحميل البيانات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreeData();
  }, [serial]);

  const handleRetry = () => {
    fetchTreeData();
  };

  // Handler to open image modal with full-size image
  const handleImageClick = (imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setIsModalOpen(true);
  };

  // Handler to close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalImageUrl("");
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
        setModalImageUrl("");
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);

  if (loading) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center"
        style={{
          backgroundImage: `url(${forestBackground})`,
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm"></div>
        
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">جاري تحميل بيانات الشجرة...</p>
        </div>
      </div>
    );
  }

  if (error || !treeData) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center px-4"
        style={{
          backgroundImage: `url(${forestBackground})`,
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm"></div>
        
        <div className="relative z-10 text-center max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-6xl mb-4">🌿</div>
            <h2 className="text-2xl font-bold text-primary mb-4">عذراً</h2>
            <p className="text-gray-700 text-lg mb-6">{error || "لم يتم العثور على بيانات لهذه الشجرة"}</p>
            <Button
              onClick={handleRetry}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const planterImageUrl = getMediaUrl(treeData.planter_photo?.url || '');
  const treeImageUrl = getMediaUrl(treeData.tree_photo?.url || '');

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
      <div 
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 rtl-container" 
        dir="rtl"
      >
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              مرحبًا بكم في مشروع غرسة 🌿
            </h1>
            <div className="flex items-center justify-center gap-2 text-white/90">
              <Heart className="w-5 h-5 fill-current" />
              <span className="text-lg">معلومات الشجرة</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 space-y-6">
            <h2 className="text-2xl font-bold text-primary text-center mb-8">
              تفاصيل الشجرة
            </h2>

            <div className="space-y-6">
              {/* Tree Status */}
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div className="text-right flex-1">
                  <div className="text-sm text-muted-foreground mb-1">حالة الشجرة</div>
                  <div className="font-semibold text-foreground">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      treeData.tree_status?.toLowerCase() === 'good' 
                        ? 'bg-green-100 text-green-700' 
                        : treeData.tree_status?.toLowerCase() === 'needs attention'
                        ? 'bg-yellow-100 text-yellow-700'
                        : treeData.tree_status?.toLowerCase() === 'dead'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {translateStatus(treeData.tree_status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Planted By - RTL layout with clickable image */}
              <div className="border-b border-border pb-4">
                <div className="text-sm text-muted-foreground mb-2 text-right">زُرعت بواسطة</div>
                <div className="flex flex-row-reverse items-center gap-3 rtl-field">
                  {/* Planter name */}
                  <div className="font-semibold text-foreground text-right flex-1">
                    {treeData.planted_by || 'غير محدد'}
                  </div>
                  {/* Planter image - clickable for zoom */}
                  {planterImageUrl && (
                    <img 
                      src={planterImageUrl} 
                      alt="صورة الزارع" 
                      onClick={() => handleImageClick(planterImageUrl)}
                      className="w-14 h-14 rounded-full object-cover shadow-md cursor-pointer hover:scale-110 transition-transform duration-200 border-2 border-primary/20"
                    />
                  )}
                </div>
              </div>

              {/* Serial Number */}
              <div className="flex flex-row-reverse items-center justify-between border-b border-border pb-4 rtl-field">
                <div className="flex items-center gap-2 text-primary">
                  <Hash className="w-5 h-5" />
                </div>
                <div className="text-right flex-1">
                  <div className="text-sm text-muted-foreground mb-1">الرقم التسلسلي</div>
                  <div className="font-semibold text-foreground tree-field-value">{treeData.serial_number}</div>
                </div>
              </div>

              {/* Planting Date */}
              <div className="flex flex-row-reverse items-center justify-between border-b border-border pb-4 rtl-field">
                <div className="flex items-center gap-2 text-primary">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-right flex-1">
                  <div className="text-sm text-muted-foreground mb-1">تاريخ الزراعة</div>
                  <div className="font-semibold text-foreground tree-field-value">
                    {formatEnglishDate(treeData.planting_date)}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex flex-row-reverse items-center justify-between border-b border-border pb-4 rtl-field">
                <div className="flex items-center gap-2 text-primary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-right flex-1">
                  <div className="text-sm text-muted-foreground mb-1">الموقع</div>
                  <div className="font-semibold text-foreground tree-field-value">{treeData.location_name}</div>
                </div>
              </div>

              {/* City */}
              {treeData.city && (
                <div className="flex flex-row-reverse items-start justify-between border-b border-border pb-4 rtl-field">
                  <div className="text-right flex-1">
                    <div className="text-sm text-muted-foreground mb-1">المدينة</div>
                    <div className="font-semibold text-foreground tree-field-value">{translateCity(treeData.city)}</div>
                  </div>
                </div>
              )}

              {/* Tree Type */}
              {treeData.tree_type && (
                <div className="flex flex-row-reverse items-start justify-between border-b border-border pb-4 rtl-field">
                  <div className="text-right flex-1">
                    <div className="text-sm text-muted-foreground mb-1">نوع الشجرة</div>
                    <div className="font-semibold text-foreground tree-field-value">{translateTreeType(treeData.tree_type)}</div>
                  </div>
                </div>
              )}

              {/* Tree Image */}
              {treeImageUrl && (
                <div className="border-b border-border pb-4">
                  <div className="text-sm text-muted-foreground mb-3 text-right">صورة الشجرة</div>
                  <img 
                    src={treeImageUrl} 
                    alt="صورة الشجرة" 
                    className="w-full rounded-xl object-cover max-h-64"
                  />
                </div>
              )}

              {/* Notes */}
              {treeData.notes && (
                <div className="bg-accent rounded-xl p-4">
                  <div className="text-sm text-muted-foreground mb-2 text-right">ملاحظات</div>
                  <div className="text-foreground leading-relaxed text-right">
                    {treeData.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Map Button - opens Google Maps link directly from Strapi */}
            {treeData.google_map_location && (
              <Button
                asChild
                className="w-full bg-secondary hover:bg-secondary/90 text-white py-6 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <a
                  href={treeData.google_map_location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  عرض الموقع على الخريطة
                </a>
              </Button>
            )}

            {/* Explore Project Button */}
            <Button
              onClick={() => navigate('/')}
              className="w-full mt-2 bg-green-200 text-green-900 hover:bg-green-300 transition-colors rounded-2xl py-6 text-lg font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Leaf className="w-5 h-5" />
              استكشاف مشروع غرسة
            </Button>
          </div>

          <div className="text-center mt-8">
            <p className="text-white/90 text-lg flex items-center justify-center gap-2">
              <span>شكراً لاهتمامكم ببيئتنا</span>
              <span>🌿</span>
            </p>
          </div>
        </div>
      </div>

      {/* Image Modal - displays full-size image when clicked */}
      {isModalOpen && modalImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" 
          onClick={handleCloseModal}
        >
          {/* Close button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Image container - prevents modal close when clicking on image */}
          <div onClick={(e) => e.stopPropagation()} className="relative max-w-[90%] max-h-[90%]">
            <img 
              src={modalImageUrl} 
              alt="صورة مكبرة" 
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TreeDataPage;
