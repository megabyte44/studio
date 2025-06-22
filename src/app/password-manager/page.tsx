
'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Credential } from '@/types';
import { P_PASSWORDS } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  KeySquare, Loader2, ShieldCheck, Landmark, Globe, Users,
  PlusSquare, Eye, EyeOff, Copy, Trash2, Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_KEY = 'lifeos_passwords';

function SensitiveInput({ id, fieldName, value, onToggle, onCopy, isVisible }: {
  id: string;
  fieldName: string;
  value: string | number;
  onToggle: (id: string, fieldName: string) => void;
  onCopy: (value: string | number, fieldName: string) => void;
  isVisible: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type={isVisible ? 'text' : 'password'}
        value={isVisible ? String(value) : '••••••••••'}
        readOnly
        className="text-sm bg-muted/50"
      />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggle(id, fieldName)}>
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onCopy(value, fieldName)}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function PasswordManagerPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Website' | 'Banking' | 'Social Media' | 'Other'>('Website');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiPin, setUpiPin] = useState('');
  const [netbankingId, setNetbankingId] = useState('');
  const [mpin, setMpin] = useState('');
  const [netbankingPassword, setNetbankingPassword] = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');

  // UI State
  const [visibilities, setVisibilities] = useState<Record<string, Record<string, boolean>>>({});
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  // Load data from localStorage
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        let parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
          // Filter out invalid entries to prevent crashes
          const validCredentials = parsedData.filter(item => item && typeof item === 'object' && item.id);
          setCredentials(validCredentials);
        } else {
          setCredentials(P_PASSWORDS); // Fallback if data is not an array
        }
      } else {
        setCredentials(P_PASSWORDS); // Fallback if no data
      }
    } catch (e) {
      console.error("Failed to load credentials", e);
      toast({ title: "Error", description: "Could not load vault data. Resetting to defaults.", variant: "destructive" });
      setCredentials(P_PASSWORDS); // Fallback on parsing error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save data to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(credentials));
    }
  }, [credentials, isLoading]);

  const resetForm = () => {
    setName(''); setCategory('Website'); setUsername(''); setPassword('');
    setWebsite(''); setAccountNumber(''); setIfscCode(''); setUpiPin('');
    setNetbankingId(''); setMpin(''); setNetbankingPassword(''); setTransactionPassword('');
  };

  const handleAddCredential = () => {
    if (!name) {
      toast({ title: "Missing Field", description: "Account Name is required.", variant: "destructive" });
      return;
    }

    const newCredential: Credential = {
      id: `cred-${Date.now()}`,
      name,
      category,
      lastUpdated: new Date().toISOString().split('T')[0],
      ...(category === 'Banking' ? {
        accountNumber, ifscCode, upiPin, netbankingId, mpin, netbankingPassword, transactionPassword
      } : {
        username, password, website
      })
    };

    setCredentials(prev => [newCredential, ...prev]);
    toast({ title: "Credential Added", description: `${name} has been securely added to your vault.` });
    resetForm();
  };

  const handleDeleteCredential = (id: string) => {
    setCredentials(prev => prev.filter(c => c.id !== id));
    toast({ title: "Credential Removed", description: "The credential has been deleted." });
  };

  const handleToggleVisibility = (id: string, fieldName: string) => {
    setVisibilities(prev => {
        const currentVisibility = prev[id]?.[fieldName] ?? false;
        return {
            ...prev,
            [id]: {
                ...(prev[id] || {}),
                [fieldName]: !currentVisibility
            }
        };
    });
  };

  const toggleCardExpansion = (id: string) => {
    setExpandedCardIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const handleCopy = (text: string | number, fieldName: string) => {
    if (text === undefined || text === null || text === '') {
      toast({ title: "Nothing to Copy", description: `The ${fieldName} field is empty.`, variant: "destructive" });
      return;
    }
    navigator.clipboard.writeText(String(text));
    toast({ title: "Copied!", description: `${fieldName} has been copied to your clipboard.` });
  };

  const groupedCredentials = useMemo(() => {
    return credentials.reduce((acc, cred) => {
      if (cred && cred.category) {
        (acc[cred.category] = acc[cred.category] || []).push(cred);
      }
      return acc;
    }, {} as Record<string, Credential[]>);
  }, [credentials]);

  const categoryIcons: Record<string, React.ElementType> = {
    'Banking': Landmark, 'Website': Globe, 'Social Media': Users, 'Other': KeySquare
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading Vault...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
            <h1 className="text-2xl font-bold font-headline">Password Vault</h1>
            <p className="text-muted-foreground">Securely store and manage your passwords and sensitive information.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck />Add New Credential</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="newAccountName">Account Name</Label>
                  <Input id="newAccountName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Netflix, Personal Savings" />
              </div>
              <div>
                  <Label htmlFor="newAccountCategory">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                      <SelectTrigger id="newAccountCategory"><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Banking">Banking</SelectItem>
                          <SelectItem value="Social Media">Social Media</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                  </Select>
              </div>

              {category === 'Banking' ? (
                <>
                  <div className="md:col-span-2 border-t pt-4 mt-2 space-y-4">
                     <h3 className="text-lg font-semibold flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" /> Banking Details</h3>
                     <div className="grid md:grid-cols-2 gap-4">
                        <div><Label htmlFor="accNum">Account Number</Label><Input id="accNum" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} /></div>
                        <div><Label htmlFor="ifsc">IFSC Code</Label><Input id="ifsc" value={ifscCode} onChange={e => setIfscCode(e.target.value)} /></div>
                        <div><Label htmlFor="upi">UPI PIN</Label><Input type="password" id="upi" value={upiPin} onChange={e => setUpiPin(e.target.value)} /></div>
                        <div><Label htmlFor="nbid">Netbanking ID</Label><Input id="nbid" value={netbankingId} onChange={e => setNetbankingId(e.target.value)} /></div>
                        <div><Label htmlFor="mpin">MPIN</Label><Input type="password" id="mpin" value={mpin} onChange={e => setMpin(e.target.value)} /></div>
                        <div><Label htmlFor="nbpass">Netbanking Password</Label><Input type="password" id="nbpass" value={netbankingPassword} onChange={e => setNetbankingPassword(e.target.value)} /></div>
                        <div className="md:col-span-2"><Label htmlFor="txpass">Transaction Password</Label><Input type="password" id="txpass" value={transactionPassword} onChange={e => setTransactionPassword(e.target.value)} /></div>
                     </div>
                  </div>
                </>
              ) : (
                <>
                  <div><Label htmlFor="username">Username / Email</Label><Input id="username" value={username} onChange={e => setUsername(e.target.value)} /></div>
                  <div><Label htmlFor="password">Password</Label><Input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
                  {category === 'Website' && <div className="md:col-span-2"><Label htmlFor="website">Website URL</Label><Input id="website" value={website} onChange={e => setWebsite(e.target.value)} /></div>}
                </>
              )}
          </CardContent>
          <CardFooter>
              <Button onClick={handleAddCredential} className="w-full md:w-auto"><PlusSquare className="mr-2 h-4 w-4" /> Add Credential</Button>
          </CardFooter>
        </Card>
        
        <div className="space-y-8">
            {Object.entries(groupedCredentials).map(([cat, items]) => {
                if (items.length === 0) return null;
                const Icon = categoryIcons[cat] || KeySquare;
                return (
                    <section key={cat}>
                        <h2 className="text-xl font-bold font-headline flex items-center gap-3 mb-4 pb-2 border-b"><Icon className="h-6 w-6 text-primary" /> {cat}</h2>
                        <ScrollArea className="w-full">
                            <div className="flex space-x-4 pb-4">
                                {items.map(cred => {
                                    const isExpanded = expandedCardIds.has(cred.id);
                                    return (
                                        <Card key={cred.id} className="w-[320px] flex-shrink-0 flex flex-col">
                                            <CardHeader>
                                                <CardTitle className="truncate">{cred.name}</CardTitle>
                                                <CardDescription>
                                                    {isExpanded
                                                        ? `Last updated: ${cred.lastUpdated}`
                                                        : cred.category === 'Banking'
                                                            ? `Account No: ${cred.accountNumber ? `••••${String(cred.accountNumber).slice(-4)}` : 'Not Set'}`
                                                            : `Username: ${cred.username || 'Not Set'}`
                                                    }
                                                </CardDescription>
                                            </CardHeader>
                                            
                                            {isExpanded && (
                                                <CardContent className="space-y-3 flex-grow">
                                                  {cred.category === 'Banking' ? (
                                                      <>
                                                         {cred.accountNumber && <p><strong>Acc No:</strong> {cred.accountNumber}</p>}
                                                         {cred.ifscCode && <p><strong>IFSC:</strong> {cred.ifscCode}</p>}
                                                         {cred.netbankingId && <p><strong>Netbanking ID:</strong> {cred.netbankingId}</p>}
                                                         {cred.upiPin && <div><strong>UPI PIN:</strong><SensitiveInput id={cred.id} fieldName="upiPin" value={cred.upiPin} isVisible={!!visibilities[cred.id]?.upiPin} onToggle={handleToggleVisibility} onCopy={handleCopy} /></div>}
                                                         {cred.mpin && <div><strong>MPIN:</strong><SensitiveInput id={cred.id} fieldName="mpin" value={cred.mpin} isVisible={!!visibilities[cred.id]?.mpin} onToggle={handleToggleVisibility} onCopy={handleCopy} /></div>}
                                                         {cred.netbankingPassword && <div><strong>NB Pass:</strong><SensitiveInput id={cred.id} fieldName="netbankingPassword" value={cred.netbankingPassword} isVisible={!!visibilities[cred.id]?.netbankingPassword} onToggle={handleToggleVisibility} onCopy={handleCopy} /></div>}
                                                         {cred.transactionPassword && <div><strong>Txn Pass:</strong><SensitiveInput id={cred.id} fieldName="transactionPassword" value={cred.transactionPassword} isVisible={!!visibilities[cred.id]?.transactionPassword} onToggle={handleToggleVisibility} onCopy={handleCopy} /></div>}
                                                      </>
                                                  ) : (
                                                      <>
                                                          {cred.username && <p><strong>Username:</strong> {cred.username}</p>}
                                                          {cred.website && <p><strong>Website:</strong> <a href={cred.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block">{cred.website}</a></p>}
                                                          {cred.password && <div><strong>Password:</strong><SensitiveInput id={cred.id} fieldName="password" value={cred.password} isVisible={!!visibilities[cred.id]?.password} onToggle={handleToggleVisibility} onCopy={handleCopy} /></div>}
                                                      </>
                                                  )}
                                                </CardContent>
                                            )}

                                            <CardFooter className="justify-end gap-2 pt-4 mt-auto">
                                                {isExpanded && (
                                                    <>
                                                        <Button variant="outline" size="sm" disabled><Edit className="mr-1 h-4 w-4" /> Edit</Button>
                                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteCredential(cred.id)}><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
                                                    </>
                                                )}
                                                <Button variant="secondary" size="sm" onClick={() => toggleCardExpansion(cred.id)}>
                                                    {isExpanded ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                                                    {isExpanded ? 'Hide' : 'View'}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    )
                                })}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </section>
                )
            })}
        </div>
      </div>
    </AppLayout>
  );
}
