import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, Lock, TreePine } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";

const loginSchema = z.object({
  identifier: z.string().min(1, "اسم المستخدم أو البريد الإلكتروني مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthContext();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      // Call Strapi v5 authentication
      await login(data.identifier, data.password);
      
      toast({
        title: "تم تسجيل الدخول بنجاح!",
        description: `مرحبًا ${data.identifier}`,
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "فشل تسجيل الدخول",
        description: error instanceof Error ? error.message : "بيانات اعتماد غير صحيحة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-nature border-0 backdrop-nature">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center">
          <TreePine className="w-8 h-8 text-primary-foreground" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-primary">
            مشروع غرسة
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            سجّل الدخول لإدخال بيانات زراعة الأشجار
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">اسم المستخدم أو البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="أدخل اسم المستخدم أو البريد الإلكتروني"
                        className="pr-10 bg-background/50 border-border/50 focus:border-primary"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">كلمة المرور</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="أدخل كلمة المرور"
                        className="pr-10 bg-background/50 border-border/50 focus:border-primary"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full bg-gradient-hero hover:opacity-90 transition-all duration-300 shadow-soft font-medium"
              disabled={isLoading}
            >
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};