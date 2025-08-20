import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from "@/integrations/supabase/client";
import { Phone, Save, AlertTriangle, Mail, MapPin, User, Briefcase, GraduationCap, Heart } from 'lucide-react';

interface ProfileFormProps {
  userProfile: {
    phone_number: string;
    email?: string | null;
    address?: string | null;
    state?: string | null;
    occupation?: string | null;
    education_level?: string | null;
    marital_status?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    profile_picture?: string | null;
    national_number: string;
  };
  profilePicture: string | null;
  setProfilePicture: (url: string | null) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ 
  userProfile,
  profilePicture,
  setProfilePicture
}) => {
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState(userProfile.phone_number || '');
  const [email, setEmail] = useState(userProfile.email || '');
  const [address, setAddress] = useState(userProfile.address || '');
  const [state, setState] = useState(userProfile.state || '');
  const [occupation, setOccupation] = useState(userProfile.occupation || '');
  const [educationLevel, setEducationLevel] = useState(userProfile.education_level || '');
  const [maritalStatus, setMaritalStatus] = useState(userProfile.marital_status || '');
  const [emergencyContactName, setEmergencyContactName] = useState(userProfile.emergency_contact_name || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(userProfile.emergency_contact_phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          phone_number: phoneNumber,
          email: email,
          address: address,
          state: state,
          occupation: occupation,
          education_level: educationLevel,
          marital_status: maritalStatus,
          emergency_contact_name: emergencyContactName,
          emergency_contact_phone: emergencyContactPhone,
          profile_picture: profilePicture
        })
        .eq('national_number', userProfile.national_number);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: t('error'),
          description: t('errorUpdatingProfile'),
          variant: "destructive"
        });
        return;
      }

      setSaveSuccess(true);
      toast({
        title: t('success'),
        description: t('profileUpdateSuccess'),
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t('error'),
        description: t('somethingWentWrong'),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Phone className="h-5 w-5" />
          {t('contactInformation')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phoneNumber">{t('phoneNumber')}</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-10"
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">{t('email')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                placeholder="Enter email address"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Address Information
        </h2>
        
        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your full address"
            className="min-h-[80px]"
          />
        </div>
        
        <div>
          <Label htmlFor="state">State/Region</Label>
          <Input
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="Enter your state or region"
          />
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="occupation">Occupation</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="pl-10"
                placeholder="Enter your occupation"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="educationLevel">Education Level</Label>
            <Select value={educationLevel} onValueChange={setEducationLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select education level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary School</SelectItem>
                <SelectItem value="secondary">Secondary School</SelectItem>
                <SelectItem value="diploma">Diploma</SelectItem>
                <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                <SelectItem value="master">Master's Degree</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="maritalStatus">Marital Status</Label>
          <Select value={maritalStatus} onValueChange={setMaritalStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select marital status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Emergency Contact
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emergencyContactName">Contact Name</Label>
            <Input
              id="emergencyContactName"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              placeholder="Enter emergency contact name"
            />
          </div>
          
          <div>
            <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="emergencyContactPhone"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="pl-10"
                placeholder="Enter emergency contact phone"
              />
            </div>
          </div>
        </div>
      </div>
        
      <div className="bg-warning/10 border border-warning/30 rounded-md p-3 flex gap-3 items-start">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <p className="text-sm">
          {t('profileUpdateNote')}
        </p>
      </div>
      
      {saveSuccess && (
        <div className="bg-success/10 border border-success/30 rounded-md p-3 text-center">
          <p className="text-success">{t('profileUpdateSuccess')}</p>
        </div>
      )}
      
      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? (
          <>{t('saving')}...</>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {t('saveChanges')}
          </>
        )}
      </Button>
    </form>
  );
};

export default ProfileForm;