import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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
  LocateFixed // تم إضافة أيقونة تحديد الموقع
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { treesAPI } from "@/lib/api";

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
  treeStatus: z.enum(["good", "needs attention", "dead"], {
    required_error: "يرجى اختيار حالة الشجرة",
  }),
  city: z.enum(["طرابلس", "الزاوية", "زليتن", "سبها", "مصراته", "الخمس", "غريان", "ترهونة"], {
    required_error: "يرجى اختيار المدينة",
  }),
  treeType: z.enum(["سرول", "صنوبر", "كافور", "فيكس", "تيكوما", "خروب"], {
    required_error: "يرجى اختيار نوع الشجرة",
  }),
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

  // ميزة جلب الموقع الجغرافي (خطوط الطول والعرض)
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      toast({ title: "جاري تحديد الموقع...", description: "يرجى السماح بالوصول للموقع الجغرافي" });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // إدخال الإحداثيات في الحقل بصيغة (خط العرض، خط الطول)
          form.setValue("mapLocation", `${latitude}, ${longitude}`);
          toast({ title: "تم تحديد الإحداثيات بنجاح" });
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({ 
            title: "فشل تحديد الموقع", 
            description: "تأكد من تفعيل الـ GPS والسماح للمتصفح بالوصول", 
            variant: "destructive" 
          });
        }
      );
    } else {
      toast({ title: "غير مدعوم", description: "متصفحك لا يدعم خاصية تحديد الموقع", variant: "destructive" });
    }
  };

  const onSubmit = async (data: DataEntryFormData) => {
    setIsSubmitting(true);
    try {
      const treeData = {
        serial_number: data.qrCode,
        planting_date: data.plantingDate.toISOString().split('T')[0],
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
        title: "تم إرسال البيانات بنجاح!",
        description: `تم تسجيل بيانات الشجرة للرقم التسلسلي ${data.qrCode}.`,
      });
      
      form.reset();
      setSelectedPlanterPhoto(null);
      setSelectedTreePhoto(null);
    } catch (error) {
      toast({
        title: "فشل في إرسال البيانات",
        description: error instanceof Error ? error.message : "فشل في إرسال بيانات الشجرة",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRScan = (result: string) => {
    form.setValue("qrCode", result);
  };

  const handleQRInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    try {
      const url = new URL(value);
      const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
      const serialNumber = pathSegments[pathSegments.length - 1];
      form.setValue("qrCode", serialNumber || value);
    } catch {
      form.setValue("qrCode", value);
    }
  };

  const handlePlanterPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedPlanterPhoto(file);
  };

  const handleTreePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedTreePhoto(file);
      form.setValue("treePhoto", file);
    }
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
              <p className="text-sm text-muted-foreground">مرحبًا بعودتك</p>
              <p className="font-medium text-primary">{user?.username || 'مستخدم'}</p>
            </div>
          </div>
          <Button onClick={logout} variant="outline" size="sm" className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 ml-2" /> تسجيل الخروج
          </Button>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-primary">أدخل بيانات زراعة الشجرة</CardTitle>
          <CardDescription className="text-muted-foreground">سجّل معلومات حول الشجرة المزروعة</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* QR Code */}
            <FormField
              control={form.control}
              name="qrCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2"><QrCode className="w-4 h-4" /> الرقم التسلسلي *</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input placeholder="أدخل أو امسح رمز QR" className="bg-background/50" {...field} onChange={(e) => { handleQRInputChange(e); field.onChange(e); }} />
                      <QRScanner onResult={handleQRScan} buttonText="مسح QR" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="plantingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-primary font-medium flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> تاريخ الزراعة *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("pl-3 text-right bg-background/50", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>اختر التاريخ</span>}
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

            {/* Planted By */}
            <FormField
              control={form.control}
              name="plantedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2"><User className="w-4 h-4" /> زُرعت بواسطة *</FormLabel>
                  <FormControl><Input placeholder="اسم الشخص الذي قام بالزراعة" className="bg-background/50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Name - Combobox */}
            <FormField
              control={form.control}
              name="locationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> اسم الموقع *</FormLabel>
                  <FormControl>
                    <Combobox 
                      options={["مدرسة حسان بن ثابت للتعليم الأساسي", "مدرسة الطليعة للتعليم الأساسي", "مدرسة الغيران الجنوبية للتعليم الأساسي"]}
                      value={field.value} onValueChange={field.onChange} placeholder="اختر المدرسة أو اكتب اسماً جديداً"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Map Location + GPS Button */}
            <FormField
              control={form.control}
              name="mapLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> موقع جوجل ماب *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="خط العرض، خط الطول" className="bg-background/50" {...field} />
                    </FormControl>
                    <Button type="button" variant="secondary" onClick={handleGetLocation} className="shrink-0">
                      <LocateFixed className="w-4 h-4 ml-2" /> GPS
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photos Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel className="text-primary font-medium flex items-center gap-2"><Camera className="w-4 h-4" /> صورة الزارع</FormLabel>
                <ArabicFileInput onChange={handlePlanterPhotoUpload} selectedFile={selectedPlanterPhoto} />
                {selectedPlanterPhoto && <p className="text-xs text-muted-foreground mt-1">{selectedPlanterPhoto.name}</p>}
              </FormItem>

              <FormField
                control={form.control}
                name="treePhoto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary font-medium flex items-center gap-2"><TreePine className="w-4 h-4" /> صورة الشجرة *</FormLabel>
                    <ArabicFileInput onChange={handleTreePhotoUpload} selectedFile={selectedTreePhoto} />
                    {selectedTreePhoto && <p className="text-xs text-muted-foreground mt-1">{selectedTreePhoto.name}</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Selects: Status, City, Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="treeStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حالة الشجرة *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="good">جيدة</SelectItem>
                        <SelectItem value="needs attention">تحتاج عناية</SelectItem>
                        <SelectItem value="dead">ميتة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدينة *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="المدينة" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["طرابلس", "الزاوية", "زليتن", "سبها", "مصراته", "الخمس", "غريان", "ترهونة"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                      <FormControl><SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["سرول", "صنوبر", "كافور", "فيكس", "تيكوما", "خروب"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> ملاحظات *</FormLabel>
                  <FormControl><Textarea placeholder="أضف أي ملاحظات..." className="bg-background/50 resize-none" rows={3} {...field} /></FormControl>
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