import React from 'react';
import { InventoryRecord } from '../../types/inventory';
import { Download } from 'lucide-react';

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

  // CSV 내보내기 함수
  const exportToCSV = () => {
    if (records.length === 0) return;
    
    // CSV 헤더 생성
    const headers = ['일시', '입출고', '조정 사유', '조정 개수', '조정 후재고'];
    
    // 데이터 행 생성
    const rows = records.map(record => [
      record.timestamp,
      record.type,
      record.reason,
      record.adjustment,
      record.afterStock
    ]);
    
    // CSV 콘텐츠 생성
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // 다운로드 링크 생성
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // 현재 날짜를 파일명에 포함
    const date = new Date();
    const fileName = `재고이력_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}.csv`;
    
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="overflow-x-auto bg-white">
      <div className="flex justify-end mb-4">
        <button 
          onClick={exportToCSV}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          <Download size={16} className="mr-2" />
          재고 이력 내보내기
        </button>
      </div>
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
          {records.length > 0 ? (
            records.map((record, index) => (
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
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                재고 기록이 없습니다. 수량 조정을 통해 기록을 추가해보세요.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
