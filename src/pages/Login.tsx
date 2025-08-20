import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import NationalNumberInput from '@/components/auth/NationalNumberInput';
import PasswordInput from '@/components/auth/PasswordInput';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [nationalNumber, setNationalNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ nationalNumber?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const validateForm = () => {
    const newErrors: { nationalNumber?: string; password?: string } = {};
    let isValid = true;
    
    if (!nationalNumber) {
      newErrors.nationalNumber = 'National number is required';
      isValid = false;
    } else if (!/^[A-Za-z]{2}[0-9]{10}$/.test(nationalNumber)) {
      newErrors.nationalNumber = 'Must be 2 letters followed by 10 numbers';
      isValid = false;
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const result = await login(nationalNumber, password);
      
      if (result.success) {
        navigate('/');
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">E-MoI</span>
          </div>
          <h1 className="text-3xl font-bold text-center">Sudanese Ministry of Interior Digital Platform</h1>
        </div>
        
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>{t('login')}</CardTitle>
            <CardDescription>
              Sign in with your national number and password
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md text-sm">
                  {errorMessage}
                </div>
              )}
              
              <NationalNumberInput
                value={nationalNumber}
                onChange={setNationalNumber}
                error={errors.nationalNumber}
              />
              
              <PasswordInput
                value={password}
                onChange={setPassword}
                error={errors.password}
              />
              
              <div className="text-sm text-right">
                <Button 
                  variant="link" 
                  className="p-0 h-auto"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  {t('Forgot Password')}
                </Button>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('Loading')}...
                  </>
                ) : (
                  t('Sign In')
                )}
              </Button>
              
              <div className="text-sm text-center">
                Don't have an account?{' '}
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal"
                  onClick={() => navigate('/signup')}
                >
                  Sign up
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
