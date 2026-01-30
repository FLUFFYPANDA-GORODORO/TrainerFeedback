import React, { useState } from 'react';
import { resetAllData } from '@/lib/dataService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SeedData = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSeedData = () => {
    setIsSeeding(true);
    
    // Reset all data to initial state
    setTimeout(() => {
      resetAllData();
      setIsSeeding(false);
      setIsComplete(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Reset Demo Data
          </CardTitle>
          <CardDescription>
            Reset the application data to the initial demo state
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isComplete ? (
            <>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 text-warning">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  This will reset all data including users, colleges, sessions, and feedback. This action cannot be undone.
                </p>
              </div>
              
              <Button 
                onClick={handleSeedData} 
                disabled={isSeeding}
                className="w-full gradient-hero text-primary-foreground"
              >
                {isSeeding ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Resetting Data...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Demo Data
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-700">
                <Check className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Data has been reset successfully!
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Demo accounts:</p>
                <ul className="text-sm space-y-1">
                  <li><strong>Super Admin:</strong> superadmin@test.com</li>
                  <li><strong>College Admin:</strong> admin@icem.com</li>
                  <li><strong>Trainer:</strong> john.trainer@test.com</li>
                  <li><strong>Password (all):</strong> password123</li>
                </ul>
              </div>
              
              <Link to="/login" className="block">
                <Button className="w-full gradient-hero text-primary-foreground">
                  Go to Login
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedData;
