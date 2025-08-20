
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  User, 
  LogOut, 
  Moon, 
  Sun,
  HelpCircle,
  Phone,
  ChevronRight,
  Mail
} from 'lucide-react';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Mock FAQs data
  const faqs = [
    {
      question: 'How do I apply for a new passport?',
      answer: 'To apply for a new passport, navigate to the Services tab, select "Passport" from the services list, choose "New Execution," select your preferred office, enter your payment invoice number, and submit your application.'
    },
    {
      question: 'How long does it take to process my application?',
      answer: 'Standard applications are typically processed within 10-15 business days. Emergency requests may be processed within 2-5 business days, subject to additional fees.'
    },
    {
      question: 'What should I do if my application is rejected?',
      answer: 'If your application is rejected, check the rejection reason in the Notifications section. Address the issues mentioned and resubmit your application. For assistance, contact our support team.'
    },
    {
      question: 'How can I update my personal information?',
      answer: 'For security reasons, most personal information can only be updated through our customer service. You can update your phone number directly in the Edit Profile section.'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppLayout>
      <PageHeader title={t('Settings')} />

      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <Card className="card-hover">
          <CardContent className="p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-between p-2 h-auto"
              onClick={() => navigate('/profile')}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{t('Edit Profile')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('Update Your Information')}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium px-1">{t('Preferences')}</h2>

          <Card>
            <CardContent className="p-4 space-y-6">
              {/* Language Selection */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('Language')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('Select Your Language')}
                  </p>
                </div>
                <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'ar')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('Theme')}</p>
                  <p className="text-sm text-muted-foreground">
                    {theme === 'dark' ? t('Dark') : t('Light')} {t('Mode')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQs Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium px-1">{t('faqs')}</h2>
          
          <Card>
            <CardContent className="p-4">
              <Accordion type="single" collapsible>
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium px-1">{t('Support')}</h2>
          
          <Card>
            <CardContent className="p-4 space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3"
                onClick={() => window.location.href = 'tel:+123456789'}
              >
                <Phone className="h-4 w-4" />
                {t('Contact Support')}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3"
                onClick={() => window.location.href = 'Mail to: support@egov-sudan.com'}
              >
                <Mail className="h-4 w-4" />
                {t('Email Support')}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3"
                onClick={() => navigate('/help')}
              >
                <HelpCircle className="h-4 w-4" />
                {t('Help Center')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <Button 
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('Logout')}
        </Button>
      </div>
    </AppLayout>
  );
};

export default Settings;
