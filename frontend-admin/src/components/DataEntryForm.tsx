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
  MapPin
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

  const onSubmit = async (data: DataEntryFormData) => {
    setIsSubmitting(true);
    
    try {
      // Map Arabic UI values to English backend enum values
      const mapCityToEnglish = (arabicValue: string): string => {
        switch (arabicValue) {
          case "طرابلس":
            return "Tripoli";
          case "الزاوية":
            return "Zawiya";
          case "زليتن":
            return "Zliten";
          case "سبها":
            return "Sabha";
          case "مصراته":
            return "Misrata";
          case "الخمس":
            return "Khoms";
          case "غريان":
            return "Gharyan";
          case "ترهونة":
            return "Tarhuna";
          default:
            return arabicValue;
        }
      };

      const mapTreeTypeToEnglish = (arabicValue: string): string => {
        switch (arabicValue) {
          case "سرول":
            return "Cypress";
          case "صنوبر":
            return "pine";
          case "كافور":
            return "Camphor";
          case "فيكس":
            return "Ficus";
          case "تيكوما":
            return "Tecoma";
          case "خروب":
            return "Carob";
          default:
            return arabicValue;
        }
      };

      // Prepare data for Strapi v5 - use correct field names and English enum values
      const treeData = {
        serial_number: data.qrCode,
        planting_date: data.plantingDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        planted_by: data.plantedBy, // Updated field name
        location_name: data.locationName,
        google_map_location: data.mapLocation,
        tree_status: data.treeStatus,
        city: mapCityToEnglish(data.city), // Map Arabic to English
        tree_type: mapTreeTypeToEnglish(data.treeType), // Map Arabic to English
        notes: data.notes,
        // Note: users_permissions_user is removed - Strapi will automatically link to authenticated user via JWT
      };

      // Debug: Log the data being sent
      console.log('=== DataEntryForm Debug ===');
      console.log('Form data (Arabic UI values):', data);
      console.log('Tree data being sent (English backend values):', treeData);
      console.log('Authenticated user:', user?.username, '(will be auto-linked via JWT)');

      // Prepare files for upload (using correct field names from Strapi schema)
      const files: { tree_photo?: File; planter_photo?: File } = {};
      if (selectedTreePhoto) {
        files.tree_photo = selectedTreePhoto;
      }
      if (selectedPlanterPhoto) {
        files.planter_photo = selectedPlanterPhoto; // Updated field name
      }

      // Submit to Strapi v5
      await treesAPI.create(treeData, files);
      
      toast({
        title: "تم إرسال البيانات بنجاح!",
        description: `تم تسجيل بيانات الشجرة للرقم التسلسلي ${data.qrCode}.`,
      });
      
      // Reset form
      form.reset();
      setSelectedPlanterPhoto(null);
      setSelectedTreePhoto(null);
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "فشل في إرسال البيانات",
        description: error instanceof Error ? error.message : "فشل في إرسال بيانات الشجرة",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle QR scan result (QRScanner now handles URL parsing internally)
  const handleQRScan = (result: string) => {
    // The QRScanner component now extracts the serial number automatically
    form.setValue("qrCode", result);
  };

  // Handle manual input change (still need to parse manually entered URLs)
  const handleQRInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // Simple parsing for manually entered URLs
    try {
      const url = new URL(value);
      const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
      const serialNumber = pathSegments[pathSegments.length - 1];
      form.setValue("qrCode", serialNumber || value);
    } catch {
      // If it's not a URL, use as-is
      form.setValue("qrCode", value);
    }
  };

  const handlePlanterPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPlanterPhoto(file);
      toast({
        title: "تم اختيار صورة الزارع",
        description: `${file.name} جاهز للرفع`,
      });
    }
  };

  const handleTreePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedTreePhoto(file);
      form.setValue("treePhoto", file);
      toast({
        title: "تم اختيار صورة الشجرة",
        description: `${file.name} جاهز للرفع`,
      });
    }
  };

  return (
    <Card className="shadow-nature border-0 backdrop-nature max-w-2xl mx-auto">
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
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
        
        <div>
          <CardTitle className="text-2xl font-bold text-primary">
            أدخل بيانات زراعة الشجرة
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            سجّل معلومات حول الشجرة المزروعة
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* QR Code Section */}
            <FormField
              control={form.control}
              name="qrCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    الرقم التسلسلي (رمز الاستجابة السريعة) *
                  </FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder="أدخل أو امسح رمز QR"
                        className="bg-background/50 border-border/50 focus:border-primary"
                        {...field}
                        onChange={(e) => {
                          handleQRInputChange(e);
                          field.onChange(e);
                        }}
                      />
                      <QRScanner onResult={handleQRScan} buttonText="مسح رمز QR" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Picker */}
            <FormField
              control={form.control}
              name="plantingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-primary font-medium flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    تاريخ الزراعة *
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal bg-background/50 border-border/50 hover:border-primary",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>اختر التاريخ</span>
                          )}
                          <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 backdrop-nature border-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
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
                  <FormLabel className="text-primary font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    زُرعت بواسطة *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="أدخل اسم الشخص الذي قام بالزراعة"
                      className="bg-background/50 border-border/50 focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Name - Searchable Combobox with School Options */}
            <FormField
              control={form.control}
              name="locationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    اسم الموقع *
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={[
                        "مدرسة حسان بن ثابت للتعليم الأساسي",
                        "مدرسة الطليعة للتعليم الأساسي",
                        "مدرسة الغيران الجنوبية للتعليم الأساسي"
                      ]}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="اختر المدرسة أو اكتب اسم موقع جديد"
                      emptyText="لا توجد نتائج"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Google Map Location */}
            <FormField
              control={form.control}
              name="mapLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    موقع جوجل ماب *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="أدخل الإحداثيات (خط العرض، خط الطول) أو العنوان"
                      className="bg-background/50 border-border/50 focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Planter Photo Upload */}
            <FormItem>
              <FormLabel className="text-primary font-medium flex items-center gap-2">
                <Camera className="w-4 h-4" />
                صورة الزارع
              </FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <ArabicFileInput
                    onChange={handlePlanterPhotoUpload}
                    accept="image/*"
                    placeholder="لم يتم اختيار اي ملف بعد"
                    buttonText="اختر ملفًا"
                    selectedFile={selectedPlanterPhoto}
                  />
                  {selectedPlanterPhoto && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {selectedPlanterPhoto.name}
                    </p>
                  )}
                </div>
              </FormControl>
            </FormItem>

            {/* Tree Photo Upload */}
            <FormField
              control={form.control}
              name="treePhoto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2">
                    <TreePine className="w-4 h-4" />
                    صورة الشجرة *
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <ArabicFileInput
                        onChange={handleTreePhotoUpload}
                        accept="image/*"
                        placeholder="لم يتم اختيار اي ملف بعد"
                        buttonText="اختر ملفًا"
                        selectedFile={selectedTreePhoto}
                      />
                      {selectedTreePhoto && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          {selectedTreePhoto.name}
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tree Status */}
            <FormField
              control={form.control}
              name="treeStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2">
                    <TreePine className="w-4 h-4" />
                    حالة الشجرة *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary">
                        <SelectValue placeholder="اختر حالة الشجرة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="backdrop-nature border-0">
                      <SelectItem value="good" className="text-success">بحالة جيدة</SelectItem>
                      <SelectItem value="needs attention" className="text-warning">تحتاج إلى عناية</SelectItem>
                      <SelectItem value="dead" className="text-destructive">ميتة</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    المدينة *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary">
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="backdrop-nature border-0">
                      <SelectItem value="طرابلس">طرابلس</SelectItem>
                      <SelectItem value="الزاوية">الزاوية</SelectItem>
                      <SelectItem value="زليتن">زليتن</SelectItem>
                      <SelectItem value="سبها">سبها</SelectItem>
                      <SelectItem value="مصراته">مصراته</SelectItem>
                      <SelectItem value="الخمس">الخمس</SelectItem>
                      <SelectItem value="غريان">غريان</SelectItem>
                      <SelectItem value="ترهونة">ترهونة</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tree Type */}
            <FormField
              control={form.control}
              name="treeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2">
                    <TreePine className="w-4 h-4" />
                    نوع الشجرة *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary">
                        <SelectValue placeholder="اختر نوع الشجرة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="backdrop-nature border-0">
                      <SelectItem value="سرول">سرول</SelectItem>
                      <SelectItem value="صنوبر">صنوبر</SelectItem>
                      <SelectItem value="كافور">كافور</SelectItem>
                      <SelectItem value="فيكس">فيكس</SelectItem>
                      <SelectItem value="تيكوما">تيكوما</SelectItem>
                      <SelectItem value="خروب">خروب</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    ملاحظات *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أضف أي ملاحظات إضافية حول الشجرة أو حالتها..."
                      className="bg-background/50 border-border/50 focus:border-primary resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-hero hover:opacity-90 transition-all duration-300 shadow-soft font-medium text-lg py-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "جاري إرسال البيانات..."
              ) : (
                <>
                  <Send className="w-5 h-5 ml-2" />
                  إرسال بيانات الشجرة
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};