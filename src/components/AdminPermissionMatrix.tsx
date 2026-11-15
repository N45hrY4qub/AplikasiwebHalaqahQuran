/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  AdminPermissionKey, 
  AdminMenuPermissionDef, 
  AdminSubTabDef,
  getConfigurableAdminMenus
} from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Network, 
  BookOpenCheck, 
  Library, 
  Award, 
  GraduationCap, 
  CheckCircle2, 
  Megaphone, 
  ChevronDown, 
  ChevronUp, 
  CheckSquare, 
  Square, 
  Check, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

interface AdminPermissionMatrixProps {
  selectedPermissions: AdminPermissionKey[];
  onPermissionsChange: (perms: AdminPermissionKey[]) => void;
  selectedTabPermissions: Record<string, string[]>;
  onTabPermissionsChange: (tabs: Record<string, string[]>) => void;
  readOnly?: boolean;
}

export const AdminPermissionMatrix: React.FC<AdminPermissionMatrixProps> = ({
  selectedPermissions,
  onPermissionsChange,
  selectedTabPermissions,
  onTabPermissionsChange,
  readOnly = false
}) => {
  // Configurable menus excluding Super Admin only system settings
  const availableMenus = getConfigurableAdminMenus();

  // Track expanded/collapsed state for menus with tabs
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    availableMenus.forEach(m => {
      if (m.tabs && m.tabs.length > 0) {
        // Expand if menu is currently selected
        initial[m.key] = selectedPermissions.includes(m.key);
      }
    });
    return initial;
  });

  // Keep expanded state responsive when permissions change externally (e.g., reset/preset/user switch)
  const prevSelectedRef = useRef<Set<string>>(new Set(selectedPermissions));
  useEffect(() => {
    const nextSet = new Set(selectedPermissions);
    const prevSet = prevSelectedRef.current;
    let changed = false;
    const updates: Record<string, boolean> = {};

    availableMenus.forEach(m => {
      if (!m.tabs || m.tabs.length === 0) return;
      const wasSelected = prevSet.has(m.key);
      const isNowSelected = nextSet.has(m.key);
      if (!wasSelected && isNowSelected) {
        updates[m.key] = true;
        changed = true;
      } else if (wasSelected && !isNowSelected) {
        updates[m.key] = false;
        changed = true;
      }
    });

    if (changed) {
      setExpandedMenus(prev => ({ ...prev, ...updates }));
    }
    prevSelectedRef.current = nextSet;
  }, [selectedPermissions, availableMenus]);

  const getMenuIcon = (key: AdminPermissionKey) => {
    switch (key) {
      case 'dashboard':
        return LayoutDashboard;
      case 'pengguna':
        return Users;
      case 'struktur_lembaga':
        return Network;
      case 'kelashalaqah':
        return BookOpenCheck;
      case 'kurikulum_modul':
        return Library;
      case 'manajemen_syahadah':
        return Award;
      case 'program_keilmuan':
        return GraduationCap;
      case 'setorans':
        return CheckCircle2;
      case 'pengumuman':
        return Megaphone;
      default:
        return Sparkles;
    }
  };

  const toggleExpand = (menuKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Toggle main menu permission
  const handleToggleMenu = (menu: AdminMenuPermissionDef) => {
    if (readOnly) return;
    const isCurrentlySelected = selectedPermissions.includes(menu.key);

    if (isCurrentlySelected) {
      // Uncheck menu: remove from permissions & clear sub-tab selections
      const nextPerms = selectedPermissions.filter(k => k !== menu.key);
      onPermissionsChange(nextPerms);

      const nextTabs = { ...selectedTabPermissions };
      delete nextTabs[menu.key];
      onTabPermissionsChange(nextTabs);
    } else {
      // Check menu: add to permissions, auto-select all its sub-tabs, and auto-expand
      const nextPerms = [...selectedPermissions, menu.key];
      onPermissionsChange(nextPerms);

      if (menu.tabs && menu.tabs.length > 0) {
        const nextTabs = {
          ...selectedTabPermissions,
          [menu.key]: menu.tabs.map(t => t.id)
        };
        onTabPermissionsChange(nextTabs);
        setExpandedMenus(prev => ({ ...prev, [menu.key]: true }));
      }
    }
  };

  // Toggle individual sub-tab permission
  const handleToggleSubTab = (menu: AdminMenuPermissionDef, tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;

    const validTabIds = new Set((menu.tabs || []).map(t => t.id));
    const currentTabs = (selectedTabPermissions[menu.key] || []).filter(id => validTabIds.has(id));
    const isTabActive = currentTabs.includes(tabId);
    let nextTabsForMenu: string[];

    if (isTabActive) {
      nextTabsForMenu = currentTabs.filter(id => id !== tabId);
    } else {
      nextTabsForMenu = [...currentTabs, tabId];
    }

    const nextTabPermissions = {
      ...selectedTabPermissions,
      [menu.key]: nextTabsForMenu
    };
    onTabPermissionsChange(nextTabPermissions);

    // If tabs are selected but parent menu was not checked, check parent menu
    if (nextTabsForMenu.length > 0 && !selectedPermissions.includes(menu.key)) {
      onPermissionsChange([...selectedPermissions, menu.key]);
      setExpandedMenus(prev => ({ ...prev, [menu.key]: true }));
    }

    // If all sub-tabs are unchecked, also uncheck the parent menu
    if (nextTabsForMenu.length === 0 && selectedPermissions.includes(menu.key)) {
      onPermissionsChange(selectedPermissions.filter(k => k !== menu.key));
    }
  };

  // Select all tabs for a specific menu
  const handleSelectAllTabsForMenu = (menu: AdminMenuPermissionDef, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly || !menu.tabs) return;

    const allTabIds = menu.tabs.map(t => t.id);
    onTabPermissionsChange({
      ...selectedTabPermissions,
      [menu.key]: allTabIds
    });

    if (!selectedPermissions.includes(menu.key)) {
      onPermissionsChange([...selectedPermissions, menu.key]);
    }
  };

  // Clear all tabs for a specific menu
  const handleClearTabsForMenu = (menu: AdminMenuPermissionDef, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;

    const nextTabs = { ...selectedTabPermissions };
    delete nextTabs[menu.key];
    onTabPermissionsChange(nextTabs);

    onPermissionsChange(selectedPermissions.filter(k => k !== menu.key));
  };

  // Select ALL menus & all sub-tabs
  const handleSelectAll = () => {
    if (readOnly) return;
    const allKeys = availableMenus.map(m => m.key);
    onPermissionsChange(allKeys);

    const allTabs: Record<string, string[]> = {};
    const expanded: Record<string, boolean> = {};
    availableMenus.forEach(m => {
      if (m.tabs && m.tabs.length > 0) {
        allTabs[m.key] = m.tabs.map(t => t.id);
        expanded[m.key] = true;
      }
    });
    onTabPermissionsChange(allTabs);
    setExpandedMenus(expanded);
  };

  // Reset to only Beranda (Dashboard)
  const handleReset = () => {
    if (readOnly) return;
    onPermissionsChange(['dashboard']);
    onTabPermissionsChange({});
  };

  const totalActive = selectedPermissions.filter(k => availableMenus.some(m => m.key === k)).length;

  return (
    <div className="space-y-4">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Matriks Izin Akses Menu Admin Tambahan
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              {totalActive} dari {availableMenus.length} Menu Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih menu dan tab spesifik yang boleh diakses oleh akun Admin Tambahan ini.
          </p>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleSelectAll}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Pilih Semua</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid of Menus with Sub-Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {availableMenus.map(menu => {
          const isSelected = selectedPermissions.includes(menu.key);
          const hasTabs = Boolean(menu.tabs && menu.tabs.length > 0);
          const isExpanded = Boolean(expandedMenus[menu.key]);
          const Icon = getMenuIcon(menu.key);

          // Sub-tab stats strictly matched against current live menu tabs
          const validTabIds = new Set((menu.tabs || []).map(t => t.id));
          const activeSubTabs = (selectedTabPermissions[menu.key] || []).filter(id => validTabIds.has(id));
          const totalTabs = menu.tabs?.length || 0;
          const isAllTabsActive = hasTabs && activeSubTabs.length === totalTabs;
          const isPartialTabsActive = hasTabs && activeSubTabs.length > 0 && !isAllTabsActive;

          return (
            <div
              key={menu.key}
              className={`rounded-xl border transition-all ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Menu Main Header Card */}
              <div
                onClick={() => handleToggleMenu(menu)}
                className={`p-3 sm:p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none rounded-xl ${
                  hasTabs && isSelected && isExpanded ? 'rounded-b-none border-b border-slate-100 dark:border-slate-800/80' : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Custom Styled Checkbox */}
                  <div className="mt-0.5 shrink-0">
                    <div
                      className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                          : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </div>
                  </div>

                  {/* Menu Icon & Texts */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected 
                          ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400' 
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {menu.label}
                      </span>

                      {/* Tab Selection Indicator Badge */}
                      {hasTabs && isSelected && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-sans ${
                          isAllTabsActive
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50'
                            : isPartialTabsActive
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50'
                        }`}>
                          {isAllTabsActive ? `Semua Tab (${totalTabs})` : `${activeSubTabs.length}/${totalTabs} Tab`}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {menu.desc}
                    </p>
                  </div>
                </div>

                {/* Expand / Collapse Button for menus with tabs */}
                {hasTabs && (
                  <button
                    type="button"
                    onClick={(e) => toggleExpand(menu.key, e)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                    title={isExpanded ? "Sembunyikan pilihan tab" : "Tampilkan pilihan tab"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Expandable Sub-Tabs Panel */}
              {hasTabs && isExpanded && (
                <div className="p-3 bg-slate-50/90 dark:bg-slate-950/50 rounded-b-xl border-t border-slate-100 dark:border-slate-800/60 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] pb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Pilihan Tab Menu <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{menu.label}</strong>:
                    </span>
                    {!readOnly && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleSelectAllTabsForMenu(menu, e)}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Semua Tab
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <button
                          type="button"
                          onClick={(e) => handleClearTabsForMenu(menu, e)}
                          className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          Hapus Pilihan
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {menu.tabs!.map((tab: AdminSubTabDef) => {
                      const isTabChecked = activeSubTabs.includes(tab.id);
                      return (
                        <div
                          key={tab.id}
                          onClick={(e) => handleToggleSubTab(menu, tab.id, e)}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                            isTabChecked
                              ? 'bg-white dark:bg-slate-900 border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs'
                              : 'bg-white/60 dark:bg-slate-900/30 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900/60'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            <div
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all ${
                                isTabChecked
                                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                                  : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                              }`}
                            >
                              {isTabChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold leading-tight ${
                              isTabChecked ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {tab.label}
                            </p>
                            {tab.desc && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                {tab.desc}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
