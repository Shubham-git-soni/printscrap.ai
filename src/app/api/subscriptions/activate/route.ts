import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';
import { sendPlanActivationEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { userId, planId } = await request.json();

        if (!userId || !planId) {
            return NextResponse.json(
                { success: false, message: 'userId and planId are required' },
                { status: 400 }
            );
        }

        const pool = await connectDB();

        // Fetch plan details
        const planResult = await pool.request()
            .input('planId', sql.Int, planId)
            .query('SELECT * FROM Plans WHERE id = @planId');

        if (planResult.recordset.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Plan not found' },
                { status: 404 }
            );
        }

        const plan = planResult.recordset[0];
        const startDate = new Date();
        let endDate = new Date(startDate);

        // Calculate end date based on billing cycle
        switch (plan.billingCycle) {
            case 'daily':
                endDate.setDate(endDate.getDate() + 1);
                break;
            case 'monthly':
                endDate.setMonth(endDate.getMonth() + 1);
                break;
            case 'yearly':
                endDate.setFullYear(endDate.getFullYear() + 1);
                break;
            default:
                endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
        }

        // Check if user has existing subscription
        const existingSubResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT id FROM Subscriptions WHERE userId = @userId AND endDate > GETDATE()');

        let subscriptionId;

        if (existingSubResult.recordset.length > 0) {
            // Update existing subscription
            subscriptionId = existingSubResult.recordset[0].id;
            await pool.request()
                .input('id', sql.Int, subscriptionId)
                .input('planId', sql.Int, planId)
                .input('startDate', sql.DateTime, startDate)
                .input('endDate', sql.DateTime, endDate)
                .query(`
          UPDATE Subscriptions
          SET planId = @planId, startDate = @startDate, endDate = @endDate, status = 'active'
          WHERE id = @id
        `);
        } else {
            // Create new subscription
            const newSubResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('planId', sql.Int, planId)
                .input('startDate', sql.DateTime, startDate)
                .input('endDate', sql.DateTime, endDate)
                .query(`
          INSERT INTO Subscriptions (userId, planId, startDate, endDate, status, autoRenew)
          OUTPUT INSERTED.id
          VALUES (@userId, @planId, @startDate, @endDate, 'active', 0)
        `);
            subscriptionId = newSubResult.recordset[0].id;
        }

        // Update user's subscriptionId
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('subscriptionId', sql.Int, subscriptionId)
            .query('UPDATE Users SET subscriptionId = @subscriptionId WHERE id = @userId');

        // Get user details for email
        const userResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT email, companyName FROM Users WHERE id = @userId');

        const user = userResult.recordset[0];

        await pool.close();

        // Send activation email to client (async, don't wait)
        if (user) {
            sendPlanActivationEmail(
                user.email,
                user.companyName,
                plan.name,
                startDate.toISOString(),
                endDate.toISOString()
            ).catch(err => {
                console.error('❌ Failed to send activation email:', err);
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Subscription activated successfully',
            data: {
                subscriptionId,
                planName: plan.name,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }
        });
    } catch (error: any) {
        console.error('❌ Subscription activation error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
