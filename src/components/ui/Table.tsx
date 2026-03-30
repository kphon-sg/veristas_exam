import React from 'react';
import { cn } from '../../lib/utils';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: string[];
  children: React.ReactNode;
}

export const Table = ({ headers, children, className, ...props }: TableProps) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-left border-collapse", className)} {...props}>
        <thead>
          <tr className="border-b border-slate-100">
            {headers.map((header, i) => (
              <th 
                key={i} 
                className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow = ({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("hover:bg-slate-50/50 transition-colors", className)} {...props}>
    {children}
  </tr>
);

export const TableCell = ({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-6 py-4 text-sm text-slate-600", className)} {...props}>
    {children}
  </td>
);
