'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Mail, Phone, Check, Save } from 'lucide-react';
import { useSiteSettings } from '@/lib/site-settings';

export default function SuperAdminSettingsPage() {
    const { settings, updateSettings } = useSiteSettings();
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setEmail(settings.supportEmail);
        setPhone(settings.supportPhone);
    }, [settings]);

    const handleSave = () => {
        updateSettings({
            supportEmail: email,
            supportPhone: phone,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <DashboardLayout requiredRole="super_admin">
            <div className="p-3 md:p-6 lg:p-8">
                <div className="mb-4 md:mb-6">
                    <h1 className="text-lg md:text-xl font-bold text-foreground">Settings</h1>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Site Contact Information
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                These contact details will be displayed across the website and client dashboard.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {saved && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                                    <Check className="h-4 w-4" />
                                    <span className="text-sm font-medium">Settings saved successfully!</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="supportEmail" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    Support Email
                                </Label>
                                <Input
                                    id="supportEmail"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="support@example.com"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Displayed in footer and contact sections
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="supportPhone" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    Support Phone Number
                                </Label>
                                <Input
                                    id="supportPhone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+91 XXXXX XXXXX"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Displayed in footer and contact sections
                                </p>
                            </div>

                            <div className="pt-4 border-t">
                                <Button onClick={handleSave} className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Save Settings
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview Card */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-base">Preview</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                How your contact info will appear to users
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                                    <Mail className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium text-foreground">{email || 'Not set'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                                    <Phone className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="text-sm font-medium text-foreground">{phone || 'Not set'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
