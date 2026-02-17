import React, { useState } from 'react';
import { resetAllData } from '@/lib/dataService';
import { createSystemUser } from '@/services/superadmin/userService';
import { rebuildCache } from '@/services/superadmin/rebuildCache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Check, AlertTriangle, Database, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const SeedData = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isAuthSeeding, setIsAuthSeeding] = useState(false);
  const [authSeedComplete, setAuthSeedComplete] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildComplete, setRebuildComplete] = useState(false);

  const handleSeedData = () => {
    setIsSeeding(true);
    
    // Reset all data to initial state
    setTimeout(() => {
      resetAllData();
      setIsSeeding(false);
      setIsComplete(true);
    }, 1000);
  };

  const handleSeedAuth = async () => {
    setIsAuthSeeding(true);
    try {
        // Create Superadmin only
        try {
            await createSystemUser({
                name: 'Super Admin',
                email: 'superadmin@gryphonacademy.co.in',
                role: 'superAdmin',
                collegeId: null
            }, 'password123');
            toast.success('Superadmin created successfully');
        } catch (e) {
            if (e.code === 'auth/email-already-in-use') {
                toast.info('Superadmin already exists');
            } else {
                throw e;
            }
        }

        setAuthSeedComplete(true);
        toast.success('Firebase Auth Seeding Complete!');
    } catch (error) {
        toast.error('Error seeding auth: ' + error.message);
    } finally {
        setIsAuthSeeding(false);
    }
  };

  const handleRebuildCache = async () => {
    setIsRebuilding(true);
    try {
      await rebuildCache();
      setRebuildComplete(true);
      toast.success('Analytics Cache Rebuilt Successfully!');
    } catch (error) {
      toast.error('Failed to rebuild cache: ' + error.message);
    } finally {
      setIsRebuilding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            System Setup
          </CardTitle>
          <CardDescription>
            Initialize your application data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Section 1: Local Data */}
          <div className="space-y-4 border-b border-border pb-6">
            <h3 className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" /> 
                Local Data (Mock)
            </h3>
            {!isComplete ? (
                <Button 
                    onClick={handleSeedData} 
                    disabled={isSeeding}
                    variant="outline"
                    className="w-full"
                >
                    {isSeeding ? 'Resetting...' : 'Reset Local Mock Data'}
                </Button>
            ) : (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Check className="h-4 w-4" /> Local data reset!
                </div>
            )}
            <p className="text-xs text-muted-foreground">Resets colleges, sessions, etc. in local storage.</p>
          </div>

          {/* Section 2: Firebase Auth */}
          <div className="space-y-4">
             <h3 className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" /> 
                Firebase Auth Users
            </h3>
            
            {!authSeedComplete ? (
                 <Button 
                    onClick={handleSeedAuth} 
                    disabled={isAuthSeeding}
                    className="w-full gradient-hero text-primary-foreground"
                >
                    {isAuthSeeding ? 'Creating Users...' : 'Create Default Firebase Users'}
                </Button>
            ) : (
                 <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Check className="h-4 w-4" /> Users created!
                </div>
            )}
            <p className="text-xs text-muted-foreground">Creates the SuperAdmin account in your Firebase project using the same auth logic as the app.</p>
          </div>

          {/* Section 3: Maintenance */}
          <div className="space-y-4">
             <h3 className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" /> 
                Maintenance
            </h3>
            
            {!rebuildComplete ? (
                 <Button 
                    onClick={handleRebuildCache} 
                    disabled={isRebuilding}
                    variant="outline"
                    className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                >
                    {isRebuilding ? 'Rebuilding...' : 'Rebuild Analytics Cache'}
                </Button>
            ) : (
                 <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Check className="h-4 w-4" /> Cache Updated!
                </div>
            )}
             <p className="text-xs text-muted-foreground">Fixes stat discrepancies by recalculating analytics from all sessions.</p>
          </div>

          {/* Credentials Info */}
          <div className="bg-secondary/30 p-4 rounded-lg space-y-2 mt-4">
            <p className="text-sm font-medium">Default Credentials:</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
                <li><strong>Super Admin:</strong> superadmin@gryphonacademy.co.in</li>
                <li><strong>Password:</strong> password123</li>
            </ul>
            </div>
              
            <Link to="/login" className="block pt-2">
            <Button className="w-full" variant="secondary">
                Go to Login
            </Button>
            </Link>

        </CardContent>
      </Card>
    </div>
  );
};

export default SeedData;
