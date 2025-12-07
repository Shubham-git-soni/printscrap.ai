import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    const pool = await connectDB();
    const query = userId
      ? `
        SELECT
          c.id as categoryId,
          c.name as categoryName,
          COUNT(se.id) as entryCount,
          ISNULL(SUM(s.soldWeight), 0) as soldWeight
        FROM ScrapEntries se
        LEFT JOIN Categories c ON se.categoryId = c.id
        LEFT JOIN Sales s ON se.id = s.scrapEntryId
        WHERE se.userId = @userId
        GROUP BY c.id, c.name
        ORDER BY c.name
      `
      : `
        SELECT
          c.id as categoryId,
          c.name as categoryName,
          COUNT(se.id) as entryCount,
          ISNULL(SUM(s.soldWeight), 0) as soldWeight
        FROM ScrapEntries se
        LEFT JOIN Categories c ON se.categoryId = c.id
        LEFT JOIN Sales s ON se.id = s.scrapEntryId
        GROUP BY c.id, c.name
        ORDER BY c.name
      `;

    const queryRequest = pool.request();
    if (userId) {
      queryRequest.input('userId', sql.Int, parseInt(userId));
    }
    const result = await queryRequest.query(query);
    await pool.close();
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
