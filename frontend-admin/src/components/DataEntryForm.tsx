import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { QRScanner } from "./QRScanner";
import { ArabicFileInput } from "./ui/arabic-file-input";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { 
  CalendarIcon, 
  QrCode, 
  User, 
  Camera, 
  FileText, 
  TreePine, 
  LogOut,
  Send,
  Upload,
  MapPin,
  LocateFixed 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { treesAPI } from "@/lib/api";

// Schema المحدث - تم تغيير Enum إلى String ليتوافق مع قاعدة البيانات الجديدة
const dataEntrySchema = z.object({
  qrCode: z.string().min(1, "الرقم التسلسلي مطلوب"),
  plantingDate: z.date({
    required_error: "تاريخ الزراعة مطلوب",
  }),
  plantedBy: z.string().min(1, "اسم الشخص الذي قام بالزراعة مطلوب"),
  locationName: z.string().min(1, "اسم الموقع مطلوب"),
  mapLocation: z.string().min(1, "موقع جوجل ماب مطلوب"),
  planterPhoto: z.any().optional(),
  treePhoto: z.any().refine((file) => file instanceof File, {
    message: "صورة الشجرة مطلوبة",
  }),
  treeStatus: z.string().min(1, "يرجى اختيار حالة الشجرة"),
  city: z.string().min(1, "يرجى اختيار المدينة"),
  treeType: z.string().min(1, "يرجى اختيار نوع الشجرة"),
  notes: z.string().min(1, "الملاحظات مطلوبة"),
});

type DataEntryFormData = z.infer<typeof dataEntrySchema>;

export const DataEntryForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlanterPhoto, setSelectedPlanterPhoto] = useState<File | null>(null);
  const [selectedTreePhoto, setSelectedTreePhoto] = useState<File | null>(null);
  const { user, logout } = useAuthContext();

  const form = useForm<DataEntryFormData>({
    resolver: zodResolver(dataEntrySchema),
    defaultValues: {
      qrCode: "",
      plantedBy: "",
      locationName: "",
      mapLocation: "",
      notes: "",
    },
  });

  // ميزة جلب الموقع الجغرافي تلقائياً
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      toast({ title: "جاري تحديد الموقع...", description: "يرجى السماح بالوصول للموقع" });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("mapLocation", `${latitude}, ${longitude}`);
          toast({ title: "تم تحديد الموقع بنجاح" });
        },
        (error) => {
          toast({ 
            title: "فشل تحديد الموقع", 
            description: "يرجى إدخال الموقع يدوياً", 
            variant: "destructive" 
          });
        }
      );
    }
  };

  const onSubmit = async (data: DataEntryFormData) => {
    setIsSubmitting(true);
    try {
      const treeData = {
        serial_number: data.qrCode,
        planting_date: format(data.plantingDate, "yyyy-MM-dd"),
        planted_by: data.plantedBy,
        location_name: data.locationName,
        google_map_location: data.mapLocation,
        tree_status: data.treeStatus,
        city: data.city,
        tree_type: data.treeType,
        notes: data.notes,
      };

      const files: { tree_photo?: File; planter_photo?: File } = {};
      if (selectedTreePhoto) files.tree_photo = selectedTreePhoto;
      if (selectedPlanterPhoto) files.planter_photo = selectedPlanterPhoto;

      await treesAPI.create(treeData, files);
      
      toast({
        title: "تم الإرسال بنجاح!",
        description: `تم تسجيل الشجرة رقم ${data.qrCode}.`,
      });
      
      form.reset();
      setSelectedPlanterPhoto(null);
      setSelectedTreePhoto(null);
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: error instanceof Error ? error.message : "يرجى المحاولة لاحقاً",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRScan = (result: string) => {
    form.setValue("qrCode", result);
  };

  return (
    <Card className="shadow-nature border-0 backdrop-nature max-w-2xl mx-auto mb-10">
      <CardHeader className="text-center space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center">
              <TreePine className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">مرحباً</p>
              <p className="font-medium text-primary">{user?.username || 'المشرف'}</p>
            </div>
          </div>
          <Button onClick={logout} variant="outline" size="sm" className="hover:text-destructive">
            <LogOut className="w-4 h-4 ml-2" /> تسجيل الخروج
          </Button>
        </div>
        <CardTitle className="text-2xl font-bold text-primary">توثيق زراعة شجرة</CardTitle>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* الرقم التسلسلي و QR */}
            <FormField
              control={form.control}
              name="qrCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><QrCode className="w-4 h-4"/> الرقم التسلسلي *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="أدخل أو امسح رمز QR" {...field} />
                    </FormControl>
                    <QRScanner onResult={handleQRScan} buttonText="مسح QR" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* تاريخ الزراعة */}
            <FormField
              control={form.control}
              name="plantingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2"><CalendarIcon className="w-4 h-4"/> تاريخ الزراعة *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("pl-3 text-right bg-background/50", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP", { locale: ar }) : <span>اختر التاريخ</span>}
                          <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* اسم الموقع وجلب الـ GPS */}
            <FormField
              control={form.control}
              name="mapLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4"/> موقع جوجل ماب (إحداثيات) *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="خط العرض، خط الطول" {...field} />
                    </FormControl>
                    <Button type="button" variant="secondary" onClick={handleGetLocation}>
                      <LocateFixed className="w-4 h-4 ml-2" /> GPS
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* المدينة ونوع الشجرة باستخدام Combobox أو Select */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدينة *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["طرابلس", "الزاوية", "زليتن", "سبها", "مصراته", "بنغازي", "غريان"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="treeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الشجرة *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["سرول", "صنوبر", "كافور", "خروب", "فيكس"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* رفع الصور */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormItem>
                <FormLabel className="flex items-center gap-2"><Camera className="w-4 h-4"/> صورة الزارع</FormLabel>
                <ArabicFileInput onChange={(e) => setSelectedPlanterPhoto(e.target.files?.[0] || null)} selectedFile={selectedPlanterPhoto} />
              </FormItem>
              <FormField
                control={form.control}
                name="treePhoto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><TreePine className="w-4 h-4"/> صورة الشجرة *</FormLabel>
                    <ArabicFileInput onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedTreePhoto(file);
                      field.onChange(file);
                    }} selectedFile={selectedTreePhoto} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات إضافية *</FormLabel>
                  <FormControl><Textarea rows={3} className="resize-none" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-gradient-hero py-6 text-lg" disabled={isSubmitting}>
              {isSubmitting ? "جاري الإرسال..." : <><Send className="w-5 h-5 ml-2" /> إرسال البيانات</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};