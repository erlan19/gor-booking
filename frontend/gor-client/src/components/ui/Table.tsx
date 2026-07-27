import { clsx } from 'clsx';
import { type HTMLAttributes } from 'react';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('w-full text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

interface TheadProps extends HTMLAttributes<HTMLTableSectionElement> {}

export function Thead({ className, children, ...props }: TheadProps) {
  return (
    <thead className={clsx('bg-gray-50', className)} {...props}>
      {children}
    </thead>
  );
}

interface TbodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

export function Tbody({ className, children, ...props }: TbodyProps) {
  return (
    <tbody className={clsx('divide-y divide-gray-200', className)} {...props}>
      {children}
    </tbody>
  );
}

interface TrProps extends HTMLAttributes<HTMLTableRowElement> {}

export function Tr({ className, children, ...props }: TrProps) {
  return (
    <tr className={clsx('hover:bg-gray-50', className)} {...props}>
      {children}
    </tr>
  );
}

interface ThProps extends HTMLAttributes<HTMLTableCellElement> {}

export function Th({ className, children, ...props }: ThProps) {
  return (
    <th className={clsx('px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider', className)} {...props}>
      {children}
    </th>
  );
}

interface TdProps extends HTMLAttributes<HTMLTableCellElement> {}

export function Td({ className, children, ...props }: TdProps) {
  return (
    <td className={clsx('px-4 py-3 text-gray-900', className)} {...props}>
      {children}
    </td>
  );
}