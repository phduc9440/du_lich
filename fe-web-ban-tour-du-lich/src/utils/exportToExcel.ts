import * as XLSX from "xlsx";

const exportToExcel = (data: unknown[], fileName = "data.xlsx") => {
  // Chuyển dữ liệu JSON thành worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Tạo workbook và gắn worksheet vào
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Xuất file
  XLSX.writeFile(workbook, fileName);
};

export default exportToExcel;