import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

export function useSubscription() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [canPerformOperations, setCanPerformOperations] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState(0);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const loadSubscription = async () => {
            try {
                const subData = await apiClient.getSubscription(user.id) as any;
                setSubscription(subData);

                if (subData) {
                    const currentDate = new Date();
                    const endDate = new Date(subData.endDate);
                    const expired = currentDate > endDate;
                    const active = subData.status === 'active' && !expired;

                    // Calculate days remaining
                    const timeDiff = endDate.getTime() - currentDate.getTime();
                    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));

                    setIsExpired(expired);
                    setIsActive(active);
                    setCanPerformOperations(active);
                    setDaysRemaining(days > 0 ? days : 0);
                } else {
                    setIsExpired(true);
                    setIsActive(false);
                    setCanPerformOperations(false);
                }
            } catch (error) {
                console.error('Error loading subscription:', error);
                setIsExpired(true);
                setCanPerformOperations(false);
            } finally {
                setIsLoading(false);
            }
        };

        loadSubscription();
    }, [user]);

    return {
        subscription,
        isLoading,
        isActive,
        isExpired,
        canPerformOperations,
        daysRemaining,
    };
}
