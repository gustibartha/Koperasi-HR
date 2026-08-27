import { exportAttendanceRecapExcel } from './src/app/actions/attendance-recap';
import 'dotenv/config';
(async () => {
  const res = await exportAttendanceRecapExcel('22841c61-fa3d-4b79-8922-b50ece65ca70', '2026-08');
  if (!res.success || !res.data) { console.error('FAILED', res); process.exit(1); }
  const buf = Buffer.from(res.data, 'base64');
  console.log('Size:', buf.length, 'bytes');
  console.log('Magic bytes:', buf.subarray(0,4).toString('hex'), '(expect 504b0304 for zip/xlsx)');
  process.exit(0);
})();
