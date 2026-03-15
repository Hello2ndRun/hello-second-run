import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { usersCollection } from '../lib/demoStore';
import type { BrokerUser, Partner, Deal } from '../types';

/**
 * Hook that provides broker-level filtering.
 * - Admins see everything.
 * - Brokers see only their assigned partners (and deals involving those partners).
 */
export function useBrokerFilter() {
  const { user } = useAuth();
  const [brokerUsers, setBrokerUsers] = useState<BrokerUser[]>([]);

  useEffect(() => {
    return usersCollection.subscribe(null, setBrokerUsers);
  }, []);

  // Find the current user's BrokerUser record by matching email
  const currentBrokerUser = useMemo(() => {
    if (!user) return null;
    return brokerUsers.find(bu => bu.email === user.email) || null;
  }, [user, brokerUsers]);

  const isAdmin = !currentBrokerUser || currentBrokerUser.role === 'admin';
  const assignedPartnerIds = currentBrokerUser?.assignedPartnerIds ?? [];

  /** Filter partners: admin sees all, broker sees only assigned */
  function filterPartners<T extends Partner>(partners: T[]): T[] {
    if (isAdmin) return partners;
    return partners.filter(p => assignedPartnerIds.includes(p.id));
  }

  /** Filter deals: admin sees all, broker sees only deals where VK or KF is assigned */
  function filterDeals<T extends Deal>(deals: T[]): T[] {
    if (isAdmin) return deals;
    return deals.filter(d =>
      assignedPartnerIds.includes(d.verkaeuferId) ||
      assignedPartnerIds.includes(d.kaeuferId)
    );
  }

  return {
    isAdmin,
    isBroker: !isAdmin,
    currentBrokerUser,
    assignedPartnerIds,
    filterPartners,
    filterDeals,
  };
}
