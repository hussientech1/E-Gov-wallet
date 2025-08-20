import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminPrintQueueSimple: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Print Queue</h2>
          <p className="text-muted-foreground">
            Manage approved documents ready for printing
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Print Queue Status</CardTitle>
          <CardDescription>
            This is a simplified version to test the routing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="text-lg font-semibold text-green-600">
              ✅ Print Queue component is loading successfully!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              The routing is working. This confirms the tab navigation is functional.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <strong>Next steps:</strong>
              </p>
              <ul className="text-sm text-left mt-2 space-y-1">
                <li>• Check browser console for any JavaScript errors</li>
                <li>• Verify database migrations have been applied</li>
                <li>• Test with the full AdminPrintQueue component</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPrintQueueSimple;