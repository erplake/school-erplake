import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useGlobalSettings } from '../context/GlobalSettingsContext';

function SectionCard({ title, children }){
  return (
    <div className="rounded-lg border bg-card p-5 space-y-4 shadow-sm">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {children}
    </div>
  );
}

function BrandingTab(){
  const { brand, updateBrand, updating } = useGlobalSettings();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if(brand) { setForm(brand); setDirty(false); } }, [brand]);

  function setField(k,v){
    setForm(f => ({ ...f, [k]: v }));
    setDirty(true);
  }

  function validate(){
    const e = {};
    if(!form.school_name || form.school_name.trim().length < 2) e.school_name = 'Name required';
    if(form.website_url && !/^https?:\/\//i.test(form.website_url)) e.website_url = 'Must start with http(s)';
    if(form.logo_url && !/^https?:\/\//i.test(form.logo_url)) e.logo_url = 'Must start with http(s)';
    setErrors(e); return Object.keys(e).length === 0;
  }

  async function onSave(){
    if(!validate()) return;
    const patch = {
      school_name: form.school_name,
      tagline: form.tagline,
      logo_url: form.logo_url,
      website_url: form.website_url,
      address_line1: form.address_line1,
      address_line2: form.address_line2,
      city: form.city,
      state: form.state,
      country: form.country,
      postal_code: form.postal_code,
      social_links: {
        linkedin: form.social_links?.linkedin || form.linkedin,
        facebook: form.social_links?.facebook || form.facebook,
        google_reviews: form.social_links?.google_reviews || form.google_reviews,
      }
    };
    await updateBrand(patch);
    setDirty(false);
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Identity">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="School Name" htmlFor="school_name" required error={errors.school_name}>
            <Input id="school_name" value={form.school_name || ''} onChange={e=>setField('school_name', e.target.value)} placeholder="e.g. Greenfield High" />
          </FormField>
          <FormField label="Tagline" htmlFor="tagline" hint="Short descriptive phrase">
            <Input id="tagline" value={form.tagline || ''} onChange={e=>setField('tagline', e.target.value)} placeholder="Inspiring Excellence" />
          </FormField>
          <FormField label="Logo URL" htmlFor="logo_url" error={errors.logo_url}>
            <Input id="logo_url" value={form.logo_url || ''} onChange={e=>setField('logo_url', e.target.value)} placeholder="https://.../logo.png" />
          </FormField>
          <FormField label="Website" htmlFor="website_url" error={errors.website_url}>
            <Input id="website_url" value={form.website_url || ''} onChange={e=>setField('website_url', e.target.value)} placeholder="https://school.example" />
          </FormField>
        </div>
      </SectionCard>
      <SectionCard title="Address">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Address Line 1" htmlFor="address_line1">
            <Input id="address_line1" value={form.address_line1 || ''} onChange={e=>setField('address_line1', e.target.value)} />
          </FormField>
          <FormField label="Address Line 2" htmlFor="address_line2">
            <Input id="address_line2" value={form.address_line2 || ''} onChange={e=>setField('address_line2', e.target.value)} />
          </FormField>
          <FormField label="City" htmlFor="city">
            <Input id="city" value={form.city || ''} onChange={e=>setField('city', e.target.value)} />
          </FormField>
            <FormField label="State" htmlFor="state">
            <Input id="state" value={form.state || ''} onChange={e=>setField('state', e.target.value)} />
          </FormField>
          <FormField label="Country" htmlFor="country">
            <Input id="country" value={form.country || ''} onChange={e=>setField('country', e.target.value)} />
          </FormField>
          <FormField label="Postal Code" htmlFor="postal_code">
            <Input id="postal_code" value={form.postal_code || ''} onChange={e=>setField('postal_code', e.target.value)} />
          </FormField>
        </div>
      </SectionCard>
      <SectionCard title="Social">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="LinkedIn" htmlFor="linkedin" hint="Profile or page URL">
            <Input id="linkedin" value={(form.social_links?.linkedin) || form.linkedin || ''} onChange={e=>setField('linkedin', e.target.value)} placeholder="https://linkedin.com/company/..." />
          </FormField>
          <FormField label="Facebook" htmlFor="facebook">
            <Input id="facebook" value={(form.social_links?.facebook) || form.facebook || ''} onChange={e=>setField('facebook', e.target.value)} placeholder="https://facebook.com/..." />
          </FormField>
          <FormField label="Google Reviews" htmlFor="google_reviews" hint="Listing or review URL">
            <Input id="google_reviews" value={(form.social_links?.google_reviews) || form.google_reviews || ''} onChange={e=>setField('google_reviews', e.target.value)} placeholder="https://g.page/..." />
          </FormField>
        </div>
      </SectionCard>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" size="sm" disabled={!dirty || updating} onClick={()=> brand && setForm(brand)}>Reset</Button>
        <Button size="sm" onClick={onSave} disabled={!dirty || updating}>{updating ? 'Saving...' : 'Save Changes'}</Button>
      </div>
    </div>
  );
}

function IntegrationsTab(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const providers = [
    { key:'gupshup', label:'Gupshup SMS', fields:[{name:'api_key', label:'API Key', placeholder:'********'}] },
    { key:'razorpay', label:'Razorpay', fields:[{name:'key_id', label:'Key ID'},{name:'key_secret', label:'Key Secret'}] },
  ];

  useEffect(()=>{(async()=>{
    try{
      const r = await fetch('/api/settings/integrations');
      const d = await r.json();
      setItems(d);
    }catch(e){console.error(e);}finally{setLoading(false);}
  })();},[]);

  function get(provider){ return items.find(i=>i.provider===provider); }
  function patchLocal(provider, data){
    setItems(prev => prev.map(i => i.provider===provider ? { ...i, ...data, config:{...(i.config||{}), ...(data.config||{})} } : i));
  }

  async function save(provider){
    const rec = get(provider) || { provider, enabled:false, config:{} };
    setSaving(true);
    try{
      await fetch('/api/settings/integrations', {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ provider, enabled: rec.enabled, config: rec.config })
      });
    }catch(e){console.error(e);}finally{setSaving(false);}
  }

  return (
    <div className="space-y-6">
      {providers.map(p => {
        const rec = get(p.key) || { provider:p.key, enabled:false, config:{} };
        return (
          <SectionCard key={p.key} title={p.label}>
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="flex items-center gap-3">
                <span className="font-medium">{p.label}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${rec.enabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>{rec.enabled ? 'Enabled':'Disabled'}</span>
              </div>
              <button
                className="text-xs underline"
                onClick={()=>{patchLocal(p.key,{enabled:!rec.enabled}); save(p.key);}}
                disabled={saving}
              >
                {rec.enabled ? 'Disable':'Enable'}
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {p.fields.map(f => (
                <FormField key={f.name} label={f.label} htmlFor={`${p.key}_${f.name}`}>
                  <Input id={`${p.key}_${f.name}`} value={rec.config?.[f.name] || ''} placeholder={f.placeholder || ''}
                    onChange={e=>{patchLocal(p.key,{ config:{ [f.name]: e.target.value }});}}
                    onBlur={()=>save(p.key)}
                  />
                </FormField>
              ))}
            </div>
          </SectionCard>
        );
      })}
      {loading && <p className="text-sm text-muted-foreground">Loading integrations...</p>}
    </div>
  );
}

function NotificationsTab(){
  return (
    <div className="space-y-6">
      <SectionCard title="Channels">
        <p className="text-sm text-muted-foreground">Configure which channels (email, SMS, push, in-app) are enabled per event type.</p>
        <div className="mt-4 grid gap-3 text-sm">
          {['Attendance Alert','Invoice Issued','Payment Received','Event Reminder'].map(k => (
            <div key={k} className="flex items-center justify-between rounded-md border p-3">
              <span>{k}</span>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-muted">Email</span>
                <span className="px-2 py-0.5 rounded bg-muted/70">SMS</span>
                <span className="px-2 py-0.5 rounded bg-muted/70">Push</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function UserManagementTab(){
  return (
    <div className="space-y-6">
      <SectionCard title="Roles & Permissions">
        <p className="text-sm text-muted-foreground">Role-based access control editor (planned). Define roles, assign permissions, and attach users.</p>
      </SectionCard>
      <SectionCard title="Pending Invites">
        <p className="text-sm text-muted-foreground">Invitation workflow stub.</p>
      </SectionCard>
    </div>
  );
}

function DeliveryManagementTab(){
  return (
    <div className="space-y-6">
      <SectionCard title="Notification Delivery Logs">
        <p className="text-sm text-muted-foreground">Future area for inspecting message send attempts, status, and errors.</p>
      </SectionCard>
    </div>
  );
}

export function Settings(){
  const tabs = [
    { label: 'Branding', value: 'branding', content: () => <BrandingTab /> },
    { label: 'Integrations', value: 'integrations', content: () => <IntegrationsTab /> },
    { label: 'Notifications', value: 'notifications', content: () => <NotificationsTab /> },
    { label: 'User Management', value: 'users', content: () => <UserManagementTab /> },
    { label: 'Delivery Mgmt', value: 'delivery', content: () => <DeliveryManagementTab /> },
  ];
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Configure organization identity, integrations, notifications, and access policies."
      />
      <Tabs tabs={tabs} />
    </div>
  );
}
export default Settings;
