import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Globe, Bell, Key, Copy, Eye, EyeOff, RefreshCw, Save, ExternalLink, Loader2, AlertCircle, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useMerchantProfile, useUpdateProfile, useUpdateBankAccount, useApiKeys, useRegenerateApiKeys, useUpdateSettlementPreferences, useSettlementAddresses, useUpsertSettlementAddress, useDeleteSettlementAddress } from '@/hooks/useMerchant';
import { Skeleton } from '@/components/ui/skeleton';
import type { SettlementType, SettlementFrequency } from '@/types/merchant';

export default function Settings() {
  const { data: profile, isLoading: isProfileLoading } = useMerchantProfile();
  const { data: apiKeys, isLoading: isKeysLoading } = useApiKeys();
  const updateProfile = useUpdateProfile();
  const updateBankAccount = useUpdateBankAccount();
  const regenerateKeys = useRegenerateApiKeys();
  const updateSettlementPrefs = useUpdateSettlementPreferences();
  const { data: settlementAddresses } = useSettlementAddresses();
  const upsertAddress = useUpsertSettlementAddress();
  const deleteAddress = useDeleteSettlementAddress();

  const [showSecretKey, setShowSecretKey] = useState(false);

  // Local state for forms
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    email: '',
    businessWebsite: '',
  });

  const [bankForm, setBankForm] = useState({
    accountNumber: '',
    accountName: '',
    bankCode: '',
    bankName: '',
  });

  const [settlementType, setSettlementType] = useState<SettlementType>('FIAT');
  const [settlementFrequency, setSettlementFrequency] = useState<SettlementFrequency>('EOD');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [newAddressChain, setNewAddressChain] = useState('');
  const [newAddressValue, setNewAddressValue] = useState('');

  // Sync state when data loads
  useEffect(() => {
    if (profile) {
      setBusinessForm({
        businessName: profile.businessName || '',
        email: profile.email || '',
        businessWebsite: profile.businessWebsite || '',
      });
      if (profile.bankAccount) {
        setBankForm({
          accountNumber: profile.bankAccount.accountNumber || '',
          accountName: profile.bankAccount.accountName || '',
          bankCode: profile.bankAccount.bankCode || '058',
          bankName: profile.bankAccount.bankName || '',
        });
      }
      if (profile.settings) {
        setSettlementType(profile.settings.settlementType || 'FIAT');
        setSettlementFrequency(profile.settings.settlementFrequency || 'EOD');
      }
      setWebhookUrl(profile.webhookUrl || '');
    }
  }, [profile]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleUpdateProfile = () => {
    updateProfile.mutate(businessForm);
  };

  const handleUpdateBank = () => {
    updateBankAccount.mutate(bankForm);
  };

  const handleRegenerateKeys = () => {
    if (confirm('Are you sure? This will invalidate your existing keys immediately.')) {
      regenerateKeys.mutate({ testMode: profile?.testMode || false });
    }
  };

  if (isProfileLoading || isKeysLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="business" className="data-[state=active]:bg-card">
            <Building2 className="w-4 h-4 mr-2" />
            Business
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="data-[state=active]:bg-card">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-card">
            <Globe className="w-4 h-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="settlements" className="data-[state=active]:bg-card">
            <Bell className="w-4 h-4 mr-2" />
            Settlements
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessForm.businessName}
                    onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    placeholder="https://yourwebsite.com"
                    value={businessForm.businessWebsite}
                    onChange={(e) => setBusinessForm({ ...businessForm, businessWebsite: e.target.value })}
                    className="bg-muted/50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button onClick={handleUpdateProfile} className="gradient-primary" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Bank Account</CardTitle>
              <CardDescription>Your settlement destination</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Select
                    value={bankForm.bankCode}
                    onValueChange={(v) => setBankForm({ ...bankForm, bankCode: v, bankName: v === '058' ? 'GTBank' : 'Other Bank' })}
                  >
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="058">GTBank</SelectItem>
                      <SelectItem value="044">Access Bank</SelectItem>
                      <SelectItem value="011">First Bank</SelectItem>
                      <SelectItem value="033">UBA</SelectItem>
                      <SelectItem value="057">Zenith Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="0123456789"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="Business Name Ltd"
                    value={bankForm.accountName}
                    onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                    className="bg-muted/50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button onClick={handleUpdateBank} className="gradient-primary" disabled={updateBankAccount.isPending}>
                  {updateBankAccount.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Update Bank Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Use these keys to authenticate API requests. Never share your secret key.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning flex items-center gap-2">
                  <span className="font-semibold">Test Mode:</span>
                  {profile?.testMode ? 'Active - No real payments will be processed' : 'Inactive - Live payments enabled'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Public Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={apiKeys?.publicKey || 'Loading...'}
                      readOnly
                      className="bg-muted/50 font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(apiKeys?.publicKey || '', 'Public key')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Safe to use in frontend code and checkout widgets
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showSecretKey ? 'text' : 'password'}
                      value={apiKeys?.secretKey || 'Loading...'}
                      readOnly
                      className="bg-muted/50 font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                    >
                      {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(apiKeys?.secretKey || '', 'Secret key')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep this secret! Only use in your backend server.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button variant="destructive" className="gap-2" onClick={handleRegenerateKeys} disabled={regenerateKeys.isPending}>
                  {regenerateKeys.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Regenerate Keys
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Receive real-time notifications when payment events occur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://yourserver.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  We'll send POST requests with payment event data to this URL
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-medium mb-2">Events we'll notify you about:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <code className="text-xs">payment.success</code> — Payment confirmed on-chain</li>
                  <li>• <code className="text-xs">payment.failed</code> — Payment expired or failed</li>
                  <li>• <code className="text-xs">settlement.completed</code> — Funds settled to your account</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-border">
                <Button
                  onClick={() => updateProfile.mutate({ webhookUrl })}
                  className="gradient-primary"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Webhook URL
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settlements */}
        <TabsContent value="settlements" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Settlement Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive your funds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Settlement Type</Label>
                  <Select value={settlementType} onValueChange={(v) => setSettlementType(v as SettlementType)}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIAT">Fiat (NGN to bank account)</SelectItem>
                      <SelectItem value="CRYPTO">Crypto (to wallet address)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Settlement Frequency</Label>
                  <Select value={settlementFrequency} onValueChange={(v) => setSettlementFrequency(v as SettlementFrequency)}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSTANT">Instant</SelectItem>
                      <SelectItem value="SIX_HOURLY">Every 6 hours</SelectItem>
                      <SelectItem value="TWELVE_HOURLY">Every 12 hours</SelectItem>
                      <SelectItem value="EOD">End of day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  Current Fee Rate: <span className="font-semibold text-foreground">{((profile?.feeBps ?? 150) / 100).toFixed(2)}%</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fee rate is set by the platform. Contact support to request a custom rate.
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <Button
                  onClick={() => updateSettlementPrefs.mutate({ settlementType, settlementFrequency })}
                  className="gradient-primary"
                  disabled={updateSettlementPrefs.isPending}
                >
                  {updateSettlementPrefs.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Settlement Addresses (only relevant for crypto) */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Settlement Addresses</CardTitle>
              <CardDescription>
                Manage your crypto wallet addresses for receiving settlements (one per chain)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing addresses */}
              {settlementAddresses && settlementAddresses.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chain</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {settlementAddresses.map((addr) => (
                        <tr key={addr.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              {addr.chain}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{addr.address.slice(0, 10)}...{addr.address.slice(-6)}</span>
                              <button
                                onClick={() => { navigator.clipboard.writeText(addr.address); toast.success('Address copied'); }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteAddress.mutate(addr.id)}
                              disabled={deleteAddress.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add new address */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={newAddressChain} onValueChange={setNewAddressChain}>
                  <SelectTrigger className="bg-muted/50 w-full sm:w-[180px]">
                    <SelectValue placeholder="Select chain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tron">Tron</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                    <SelectItem value="solana">Solana</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Wallet address"
                  value={newAddressValue}
                  onChange={(e) => setNewAddressValue(e.target.value)}
                  className="bg-muted/50 flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!newAddressChain || !newAddressValue) {
                      toast.error('Please select a chain and enter an address');
                      return;
                    }
                    upsertAddress.mutate(
                      { chain: newAddressChain, address: newAddressValue },
                      { onSuccess: () => { setNewAddressChain(''); setNewAddressValue(''); } }
                    );
                  }}
                  disabled={upsertAddress.isPending}
                >
                  {upsertAddress.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add Address
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
