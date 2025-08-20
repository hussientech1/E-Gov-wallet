
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import NationalNumberInput from '@/components/auth/NationalNumberInput';
import PasswordInput from '@/components/auth/PasswordInput';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const stateOptions = [
  'Khartoum',
  'North Darfur',
  'South Darfur',
  'East Darfur',
  'Central Darfur',
  'West Darfur',
  'Blue Nile',
  'White Nile',
  'River Nile',
  'North Kordofan',
  'South Kordofan',
  'West Kordofan',
  'Kassala',
  'Red Sea',
  'Gedaref',
  'Gezira',
  'Sennar',
  'Northern'
];

const maritalStatusOptions = [
  'Single',
  'Married',
  'Divorced',
  'Widowed'
];

const educationLevelOptions = [
  'No formal education',
  'Primary education',
  'Secondary education',
  'University/College',
  'Postgraduate',
  'Technical/Vocational'
];

const occupationOptions = [
  'Student',
  'Government Employee',
  'Private Sector',
  'Self-employed',
  'Unemployed',
  'Retired',
  'Other'
];

const SignUp = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form validation schema
  const signupSchema = z.object({
    nationalNumber: z.string()
      .regex(/^[A-Za-z]{2}[0-9]{10}$/, 'Must be 2 letters followed by 10 numbers'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
      .min(6, 'Password confirmation is required'),
    fullName: z.string()
      .min(2, 'Full name is required'),
    phoneNumber: z.string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    gender: z.string().min(1, 'Gender is required'),
    state: z.string().min(1, 'State is required'),
    address: z.string().min(5, 'Address is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    birthDate: z.string().min(1, 'Birth date is required'),
    maritalStatus: z.string().optional(),
    educationLevel: z.string().optional(),
    occupation: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  type SignupFormValues = z.infer<typeof signupSchema>;
  
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nationalNumber: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phoneNumber: '',
      gender: '',
      state: '',
      address: '',
      email: '',
      birthDate: '',
      maritalStatus: '',
      educationLevel: '',
      occupation: '',
      emergencyContactName: '',
      emergencyContactPhone: ''
    },
  });

  // Show logout option if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      toast({
        title: "Already Logged In",
        description: "You're currently logged in. Logout first to create a new account.",
        variant: "default",
      });
    }
  }, [isAuthenticated]);

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    
    try {
      // Change to use the Edge Function instead of the RPC
      const response = await fetch("https://tzihqfnkuyfgsjpetfzs.supabase.co/functions/v1/update_register_user", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aWhxZm5rdXlmZ3NqcGV0ZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzYzNjUsImV4cCI6MjA2MDMxMjM2NX0.aFvEeLvuOJ--JoRITqsKeety96Qcvl46aT1rHL1A7Ko'
        },
        body: JSON.stringify({
          p_national_number: data.nationalNumber,
          p_full_name: data.fullName,
          p_phone_number: data.phoneNumber,
          p_password: data.password,
          p_gender: data.gender,
          p_state: data.state,
          p_address: data.address,
          p_email: data.email || null,
          p_birth_date: data.birthDate,
          p_marital_status: data.maritalStatus || null,
          p_education_level: data.educationLevel || null,
          p_occupation: data.occupation || null,
          p_emergency_contact_name: data.emergencyContactName || null,
          p_emergency_contact_phone: data.emergencyContactPhone || null
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        toast({
          title: "Success",
          description: "Account created successfully. Please login.",
          variant: "default",
        });
        navigate('/login');
      } else {
        toast({
          title: "Error",
          description: responseData.message || "Failed to create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="w-full max-w-md">
        {/* Already Logged In Notice */}
        {isAuthenticated && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center mb-3">
              You're currently logged in. To create a new account, please logout first.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
              >
                Logout
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
        
        {/* App Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-white">E-GOV</span>
          </div>
          <h1 className="text-2xl font-bold text-center">Sudan E-Gov Digital Wallet</h1>
        </div>
        
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Sign up with your national number and personal information
            </CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full mb-6">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="personal">Personal Details</TabsTrigger>
                    <TabsTrigger value="additional">Additional Info</TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4">
                    {/* Basic Information Tab */}
                    <div className={form.watch('nationalNumber') ? 'space-y-4' : 'space-y-4'}>
                      <FormField
                        control={form.control}
                        name="nationalNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>National Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className={form.formState.errors.nationalNumber ? 'border-destructive' : ''}
                                placeholder="AB1234567890"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className={form.formState.errors.fullName ? 'border-destructive' : ''}
                                placeholder="Enter your full name"
                              />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                className={form.formState.errors.password ? 'border-destructive' : ''}
                                placeholder="Create a password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                className={form.formState.errors.confirmPassword ? 'border-destructive' : ''}
                                placeholder="Confirm your password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className={form.formState.errors.phoneNumber ? 'border-destructive' : ''}
                                placeholder="+249123456789"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Personal Details Tab */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birth Date *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                className={form.formState.errors.birthDate ? 'border-destructive' : ''}
                                max={new Date().toISOString().split('T')[0]}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stateOptions.map(state => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className={form.formState.errors.address ? 'border-destructive' : ''}
                                placeholder="Enter your full address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="maritalStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marital Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select marital status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {maritalStatusOptions.map(status => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Additional Information Tab */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                className={form.formState.errors.email ? 'border-destructive' : ''}
                                placeholder="your.email@example.com"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="educationLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Education Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select education level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {educationLevelOptions.map(level => (
                                  <SelectItem key={level} value={level}>
                                    {level}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="occupation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occupation</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select occupation" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {occupationOptions.map(occupation => (
                                  <SelectItem key={occupation} value={occupation}>
                                    {occupation}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="emergencyContactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className={form.formState.errors.emergencyContactName ? 'border-destructive' : ''}
                                placeholder="Emergency contact full name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="emergencyContactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Phone</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className={form.formState.errors.emergencyContactPhone ? 'border-destructive' : ''}
                                placeholder="+249123456789"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </Tabs>
                
                <div className="text-sm text-center text-muted-foreground mt-4">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading || isAuthenticated}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : isAuthenticated ? (
                    'Logout to Create New Account'
                  ) : (
                    'Create Account'
                  )}
                </Button>
                
                <div className="text-sm text-center">
                  Already have an account?{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal"
                    onClick={() => navigate('/login')}
                  >
                    Sign in
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
