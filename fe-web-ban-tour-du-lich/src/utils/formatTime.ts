const formatTime = (isoString: string): string => {
  if (!isoString) return '';

  const date = new Date(isoString);

  const padZero = (n: number) => n.toString().padStart(2, '0');

  const day = padZero(date.getDate());
  const month = padZero(date.getMonth() + 1); // tháng bắt đầu từ 0
  const year = date.getFullYear();

  return `${month}/${day}/${year} `;
};
export default formatTime;