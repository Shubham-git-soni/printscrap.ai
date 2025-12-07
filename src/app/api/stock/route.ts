import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    const pool = await connectDB();

    let query = `
      SELECT
        s.id,
        s.categoryId,
        s.subCategoryId,
        s.userId,
        s.totalInflow,
        s.totalOutflow,
        s.availableStock,
        s.unit,
        s.averageRate,
        s.totalValue,
        c.name as categoryName,
        sc.name as subCategoryName
      FROM Stock s
      LEFT JOIN Categories c ON s.categoryId = c.id
      LEFT JOIN SubCategories sc ON s.subCategoryId = sc.id
    `;

    const request_obj = pool.request();

    if (userId) {
      query += ' WHERE s.userId = @userId';
      request_obj.input('userId', sql.Int, parseInt(userId));
    }

    query += ' ORDER BY c.name, sc.name';

    const result = await request_obj.query(query);


    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error: any) {
    console.error('❌ Stock fetch error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { categoryId, subCategoryId, userId, quantity, unit, rate } = await request.json();

    const pool = await connectDB();

    // Check if stock record already exists for this category/subcategory/user combination
    const checkQuery = `
      SELECT * FROM Stock 
      WHERE categoryId = @categoryId 
        AND userId = @userId
        ${subCategoryId ? 'AND subCategoryId = @subCategoryId' : 'AND subCategoryId IS NULL'}
    `;

    const checkRequest = pool.request()
      .input('categoryId', sql.Int, categoryId)
      .input('userId', sql.Int, userId);

    if (subCategoryId) {
      checkRequest.input('subCategoryId', sql.Int, subCategoryId);
    }

    const existing = await checkRequest.query(checkQuery);

    if (existing.recordset.length > 0) {
      // Update existing stock
      const stock = existing.recordset[0];
      const newTotalInflow = stock.totalInflow + quantity;
      const newAvailableStock = stock.availableStock + quantity;

      // Calculate new average rate: (old total value + new value) / new total inflow
      const oldTotalValue = stock.totalInflow * stock.averageRate;
      const newValue = quantity * rate;
      const newAverageRate = (oldTotalValue + newValue) / newTotalInflow;
      const newTotalValue = newAvailableStock * newAverageRate;

      await pool.request()
        .input('id', sql.Int, stock.id)
        .input('totalInflow', sql.Decimal(10, 2), newTotalInflow)
        .input('availableStock', sql.Decimal(10, 2), newAvailableStock)
        .input('averageRate', sql.Decimal(10, 2), newAverageRate)
        .input('totalValue', sql.Decimal(10, 2), newTotalValue)
        .query(`
          UPDATE Stock 
          SET totalInflow = @totalInflow,
              availableStock = @availableStock,
              averageRate = @averageRate,
              totalValue = @totalValue
          WHERE id = @id
        `);
    } else {
      // Create new stock record
      await pool.request()
        .input('categoryId', sql.Int, categoryId)
        .input('subCategoryId', sql.Int, subCategoryId || null)
        .input('userId', sql.Int, userId)
        .input('totalInflow', sql.Decimal(10, 2), quantity)
        .input('availableStock', sql.Decimal(10, 2), quantity)
        .input('unit', sql.NVarChar, unit)
        .input('averageRate', sql.Decimal(10, 2), rate)
        .input('totalValue', sql.Decimal(10, 2), quantity * rate)
        .query(`
          INSERT INTO Stock (categoryId, subCategoryId, userId, totalInflow, totalOutflow, availableStock, unit, averageRate, totalValue)
          VALUES (@categoryId, @subCategoryId, @userId, @totalInflow, 0, @availableStock, @unit, @averageRate, @totalValue)
        `);
    }



    return NextResponse.json({ success: true, message: 'Stock updated successfully' });
  } catch (error: any) {
    console.error('❌ Stock update error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
