import { useState, useEffect } from 'react';
import { UserCog, Plus, Trash2, Save, Shield, Briefcase } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { usersCollection, partnersCollection } from '../../lib/demoStore';
import { useToast } from '../../components/shared/Toast';
import { formatDate } from '../../lib/formatters';
import type { BrokerUser, UserRole, Partner } from '../../types';

export default function Team() {
  const { addToast } = useToast();
  const [users, setUsers] = useState<BrokerUser[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New user form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('broker');

  useEffect(() => {
    const unsub1 = usersCollection.subscribe(null, setUsers);
    const unsub2 = partnersCollection.subscribe(null, setPartners);
    return () => { unsub1(); unsub2(); };
  }, []);

  const handleAddUser = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    usersCollection.add({
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      assignedPartnerIds: [],
      createdAt: new Date().toISOString(),
    } as Omit<BrokerUser, 'id'>);
    setNewName('');
    setNewEmail('');
    setNewRole('broker');
    setShowNew(false);
    addToast(`${newName} wurde hinzugefügt`, 'success');
  };

  const handleDeleteUser = (user: BrokerUser) => {
    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
      addToast('Der letzte Admin kann nicht gelöscht werden', 'error');
      return;
    }
    usersCollection.remove(user.id);
    addToast(`${user.name} wurde entfernt`, 'success');
  };

  const togglePartnerAssignment = (userId: string, partnerId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const current = user.assignedPartnerIds || [];
    const updated = current.includes(partnerId)
      ? current.filter(id => id !== partnerId)
      : [...current, partnerId];
    usersCollection.update(userId, { assignedPartnerIds: updated });
  };

  const admins = users.filter(u => u.role === 'admin');
  const brokers = users.filter(u => u.role === 'broker');

  const inputClass = 'w-full bg-gray-50 border border-gray-200 py-2 px-3 text-sm focus:border-[#1a472a] focus:outline-none';
  const labelClass = 'block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1';

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle={`${users.length} Benutzer`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Team' },
        ]}
        actions={
          <button
            onClick={() => setShowNew(!showNew)}
            className="inline-flex items-center gap-2 bg-[#1a472a] text-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all"
          >
            <Plus size={14} />
            Neuer Benutzer
          </button>
        }
      />

      {/* New User Form */}
      {showNew && (
        <div className="bg-white border border-[#8cc63f] p-5 mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1a472a] mb-4">Neuer Benutzer</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className={inputClass} placeholder="Max Mustermann" />
            </div>
            <div>
              <label className={labelClass}>E-Mail *</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className={inputClass} placeholder="max@secondrun.at" />
            </div>
            <div>
              <label className={labelClass}>Rolle</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} className={inputClass}>
                <option value="broker">Broker</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddUser}
                disabled={!newName.trim() || !newEmail.trim()}
                className="inline-flex items-center gap-2 bg-[#1a472a] text-white px-5 py-2 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all disabled:opacity-30"
              >
                <Save size={14} />
                Anlegen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admins */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-[#1a472a]" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a472a]">Administratoren ({admins.length})</h2>
        </div>
        <div className="space-y-2">
          {admins.map(user => (
            <div key={user.id} className="bg-white border border-gray-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1a472a] rounded-full flex items-center justify-center">
                  <span className="text-white font-black text-xs">{user.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-bold">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#1a472a] bg-[#f7f9f7] px-2 py-1">Admin</span>
                <span className="text-[10px] text-gray-400">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brokers */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase size={14} className="text-[#1a472a]" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a472a]">Broker ({brokers.length})</h2>
        </div>
        {brokers.length === 0 ? (
          <div className="bg-white border border-gray-200 p-8 text-center">
            <UserCog size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Noch keine Broker angelegt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {brokers.map(user => {
              const isEditing = editingId === user.id;
              return (
                <div key={user.id} className="bg-white border border-gray-200">
                  <div className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#8cc63f]/20 rounded-full flex items-center justify-center">
                        <span className="text-[#1a472a] font-black text-xs">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-gray-400">
                        {user.assignedPartnerIds.length} Partner zugewiesen
                      </span>
                      <button
                        onClick={() => setEditingId(isEditing ? null : user.id)}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-gray-200 text-gray-500 hover:border-[#1a472a] hover:text-[#1a472a] transition-all"
                      >
                        {isEditing ? 'Schließen' : 'Zuweisen'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                        title="Löschen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Partner Assignment */}
                  {isEditing && (
                    <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Partner zuweisen</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {partners.map(p => {
                          const assigned = user.assignedPartnerIds.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-center gap-2 px-3 py-2 border text-xs cursor-pointer transition-all ${
                                assigned
                                  ? 'bg-[#1a472a] text-white border-[#1a472a]'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a472a]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={assigned}
                                onChange={() => togglePartnerAssignment(user.id, p.id)}
                                className="sr-only"
                              />
                              <span className="font-bold truncate">{p.firmenname}</span>
                              <span className={`text-[9px] uppercase ${assigned ? 'text-white/60' : 'text-gray-400'}`}>
                                {p.rolle === 'verkaeufer' ? 'VK' : p.rolle === 'kaeufer' ? 'KF' : 'VK/KF'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
