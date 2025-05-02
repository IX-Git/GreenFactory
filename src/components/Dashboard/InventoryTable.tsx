// src/components/InventoryTable.tsx
import React from 'react';
import { InventoryRecord } from '../../types/inventory';

interface InventoryTableProps {
  records: InventoryRecord[];
}

const InventoryTable: React.FC<InventoryTableProps> = ({ records }) => {
  const getAdjustmentColor = (quantity: number) => {
    if (quantity > 0) {
      return 'text-green-600';
    } else if (quantity < 0) {
      return 'text-red-600';
    }
    return 'text-gray-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              일시
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              입출고
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              조정 사유
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              조정 개수
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              조정 후재고
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((record, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {record.timestamp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  record.type === '입고' 
                    ? 'bg-green-100 text-green-800' 
                    : record.type === '출고' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  {record.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {record.reason}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                <span className={getAdjustmentColor(record.adjustment)}>
                  {record.adjustment > 0 ? `+${record.adjustment}` : record.adjustment}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                {record.afterStock}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
