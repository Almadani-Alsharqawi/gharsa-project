import { TreePine, Users, School } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  onShowTreeData: () => void;
}

const LandingPage = ({ onShowTreeData }: LandingPageProps) => {
  return (
    <div className="page-transition min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          مرحباً بكم في مشروع غرسة
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-12">
          معاً نزرع الأمل من أجل مستقبل أكثر خضرة
        </p>
        
        <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto mb-16">
          مشروع "غرسة" مكرس لمكافحة التصحر وتحسين البيئة في مختلف أنحاء ليبيا والمساهمة في مواجهة تغيّر المناخ
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card rounded-2xl p-8 shadow-xl hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
              <TreePine className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">27,000~</div>
            <div className="text-white/90">شجرة مزروعة</div>
          </div>

          <div className="glass-card rounded-2xl p-8 shadow-xl hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">1,200+</div>
            <div className="text-white/90">متطوع مشارك</div>
          </div>

          <div className="glass-card rounded-2xl p-8 shadow-xl hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
              <School className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">100 مدرسة</div>
            <div className="text-white/90">من جميع أنحاء ليبيا</div>
          </div>
        </div>

        <Button
          onClick={onShowTreeData}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-xl rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300"
        >
          عرض بيانات الشجرة
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
