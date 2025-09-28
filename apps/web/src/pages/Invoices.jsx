import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const demoInvoices = [
  { id: 'INV-1001', student: 'Arjun Verma', amount: 12000, status: 'paid' },
  { id: 'INV-1002', student: 'Meera Shah', amount: 9500, status: 'pending' },
  { id: 'INV-1003', student: 'Lakshmi Rao', amount: 15000, status: 'overdue' },
];

const statusVariant = (s) => ({
  paid: 'success',
  pending: 'warning',
  overdue: 'danger'
}[s] || 'default');

export function Invoices(){
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Invoices</h2>
        <Button size="sm">New Invoice</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Invoice</th>
                  <th className="text-left font-medium px-3 py-2">Student</th>
                  <th className="text-left font-medium px-3 py-2">Amount</th>
                  <th className="text-left font-medium px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {demoInvoices.map(inv => (
                  <tr key={inv.id} className="border-t hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-2 font-medium">{inv.id}</td>
                    <td className="px-3 py-2 text-muted-foreground">{inv.student}</td>
                    <td className="px-3 py-2 text-muted-foreground">₹ {inv.amount.toLocaleString()}</td>
                    <td className="px-3 py-2"><Badge variant={statusVariant(inv.status)}>{inv.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Invoices;
