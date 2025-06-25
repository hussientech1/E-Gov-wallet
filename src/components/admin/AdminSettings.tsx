
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">System Settings</h2>
      
      <Tabs defaultValue="services" className="w-full">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="offices">Offices</TabsTrigger>
          <TabsTrigger value="rules">System Rules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="services" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Services</CardTitle>
              <CardDescription>Add, edit, or remove available services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                Services management functionality will be implemented here.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="offices" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Government Offices</CardTitle>
              <CardDescription>Manage office locations by state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                Office management functionality will be implemented here.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Rules</CardTitle>
              <CardDescription>Configure system-wide rules and parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                System rules configuration will be implemented here.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
