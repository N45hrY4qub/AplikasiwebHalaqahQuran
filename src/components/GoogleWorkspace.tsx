/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { getFirebaseApp, getActiveFirebaseConfig } from '../lib/firebaseShare';
import { 
  Cloud, 
  LogOut, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Mail, 
  FileSpreadsheet, 
  FileText, 
  Video, 
  Presentation, 
  Search, 
  ExternalLink, 
  Send,
  Plus,
  Trash2,
  Lock,
  Download,
  FileCode,
  CalendarCheck,
  Calendar,
  FolderOpen,
  FileSearch,
  Layers,
  Pin,
  Trash,
  Eye,
  CheckSquare,
  StickyNote,
  Clock,
  Sparkles,
  BookOpen,
  Tag,
  ChevronRight,
  CalendarPlus,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar } from './Avatar';

// Initialize Firebase Auth dynamically
const getAuthInstance = () => getAuth(getFirebaseApp());

// Provider configuration is instantiated dynamically per-role on sign-in

// In-memory token cache as mandated by Workspace skill, backed by localStorage for automatic persistence
let inMemoryAccessToken: string | null = (() => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mh_google_access_token');
    const expiry = localStorage.getItem('mh_google_access_token_expiry');
    if (token && expiry && Date.now() < Number(expiry)) {
      return token;
    } else if (token) {
      // Clear expired entries on start
      localStorage.removeItem('mh_google_access_token');
      localStorage.removeItem('mh_google_access_token_expiry');
    }
  }
  return null;
})();

export const getGoogleAccessToken = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mh_google_access_token');
    const expiry = localStorage.getItem('mh_google_access_token_expiry');
    if (token && expiry && Date.now() < Number(expiry)) {
      inMemoryAccessToken = token;
      return token;
    } else {
      inMemoryAccessToken = null;
      return null;
    }
  }
  return inMemoryAccessToken;
};

export const signInWithGoogleWorkspace = async (role: string): Promise<string> => {
  const dynamicProvider = new GoogleAuthProvider();
  
  if (role === UserRole.SISWA) {
    dynamicProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    dynamicProvider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');
    dynamicProvider.addScope('https://www.googleapis.com/auth/drive.file');
  } else if (role === UserRole.GURU) {
    dynamicProvider.addScope('https://www.googleapis.com/auth/calendar');
    dynamicProvider.addScope('https://www.googleapis.com/auth/calendar.events');
    dynamicProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
    dynamicProvider.addScope('https://www.googleapis.com/auth/drive.file');
    dynamicProvider.addScope('https://www.googleapis.com/auth/gmail.send');
  } else {
    dynamicProvider.addScope('https://www.googleapis.com/auth/drive');
    dynamicProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    dynamicProvider.addScope('https://www.googleapis.com/auth/gmail.send');
    dynamicProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
    dynamicProvider.addScope('https://www.googleapis.com/auth/documents');
    dynamicProvider.addScope('https://www.googleapis.com/auth/presentations');
    dynamicProvider.addScope('https://www.googleapis.com/auth/calendar');
    dynamicProvider.addScope('https://www.googleapis.com/auth/calendar.events');
  }

  const result = await signInWithPopup(getAuthInstance(), dynamicProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    inMemoryAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mh_google_access_token', credential.accessToken);
      localStorage.setItem('mh_google_access_token_expiry', String(Date.now() + 3550 * 1000));
      
      const savedUser = {
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        uid: result.user.uid
      };
      localStorage.setItem('mh_google_saved_user', JSON.stringify(savedUser));
    }
    return credential.accessToken;
  }
  throw new Error('Gagal mendapatkan token akses dari Google.');
};

export const GoogleWorkspace: React.FC = () => {
  const { 
    currentSession, 
    admins, 
    gurus, 
    siswas, 
    setorans, 
    moduls, 
    backupDatabase, 
    restoreDatabase, 
    addLog,
    keepNotes: dbKeepNotes,
    saveKeepNotes
  } = useApp();

  const isSiswa = currentSession.user?.role === UserRole.SISWA;
  const isGuru = currentSession.user?.role === UserRole.GURU;
  const isAdmin = currentSession.user?.role === UserRole.ADMIN;

  const allowedTabs: Array<'drive' | 'picker' | 'gmail' | 'sheets' | 'docs' | 'calendar' | 'meet' | 'slides' | 'keep'> = isSiswa
    ? ['calendar', 'meet', 'picker', 'keep']
    : ['drive', 'picker', 'gmail', 'sheets', 'docs', 'calendar', 'meet', 'slides', 'keep'];

  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mh_google_saved_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [tokenExpired, setTokenExpired] = useState(() => {
    if (typeof window !== 'undefined') {
      const expiry = localStorage.getItem('mh_google_access_token_expiry');
      if (expiry && Date.now() > Number(expiry)) {
        return true;
      }
    }
    return false;
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'drive' | 'picker' | 'gmail' | 'sheets' | 'docs' | 'calendar' | 'meet' | 'slides' | 'keep'>(() => {
    return currentSession.user?.role === UserRole.SISWA ? 'calendar' : 'drive';
  });

  const [showCustomConfig, setShowCustomConfig] = useState(false);
  const [customConfigText, setCustomConfigText] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mh_custom_firebase_config');
      if (saved) return saved;
    }
    return JSON.stringify({
      apiKey: "SALIN_API_KEY_ANDA",
      authDomain: "PROYEK_ANDA.firebaseapp.com",
      projectId: "PROYEK_ANDA",
      storageBucket: "PROYEK_ANDA.firebasestorage.app",
      messagingSenderId: "SENDER_ID_ANDA",
      appId: "APP_ID_ANDA"
    }, null, 2);
  });
  const [configApplied, setConfigApplied] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('mh_custom_firebase_config');
    }
    return false;
  });

  // Logs / feedback
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // In-app confirmation modal state
  const [workspaceConfirmModal, setWorkspaceConfirmModal] = useState<{
    title: string;
    message: string;
    action: () => void | Promise<void>;
    confirmText?: string;
    isDanger?: boolean;
  } | null>(null);

  // States: DRIVE BACKUP & PICKER SIMULATOR
  const [driveBackups, setDriveBackups] = useState<any[]>([]);
  const [selectedBackupId, setSelectedBackupId] = useState<string>('');

  // States: GOOGLE DRIVE PICKER SIMULATOR & FILE EXPLORER
  const [pickerFiles, setPickerFiles] = useState<any[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerFilter, setPickerFilter] = useState<'all' | 'doc' | 'sheet' | 'slide' | 'json'>('all');
  const [selectedPickerFile, setSelectedPickerFile] = useState<any | null>(null);
  const [pickedFileContent, setPickedFileContent] = useState<string | null>(null);
  const [isFetchingFileContent, setIsFetchingFileContent] = useState(false);

  // States: GMAIL SENDER
  const [gmailForm, setGmailForm] = useState({
    recipient: 'test@halaqah.example',
    subject: 'Laporan Perkembangan Halaqah Al-Quran',
    message: `<h2 style="color: #0d9488;">Laporan Halaqah Santri</h2>
<p>Assalamu'alaikum Warahmatullahi Wabarakatuh,</p>
<p>Berikut rangkuman mutabaah kelas Halaqah Quran saat ini:</p>
<ul>
  <li>Jumlah Pengajar (Guru): ${gurus.length} ustadz/ustadzah</li>
  <li>Jumlah Siswa Aktif: ${siswas.length} santri</li>
  <li>Modul/Surat Aktif: ${moduls.length} materi</li>
</ul>
<p>Wassalamu'alaikum, <br/><b>Sekretariat Halaqah</b></p>`
  });

  // States: SHEETS EXPORTER
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);

  // States: DOCS EXPORTER
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);

  // States: GOOGLE CALENDAR
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [calendarForm, setCalendarForm] = useState({
    summary: 'Setoran Hafalan Santri Baru',
    description: 'Sesi bimbingan tilawah & setoran hafalan hafiz Quran',
    date: '2026-06-01',
    startTime: '10:00',
    endTime: '11:00'
  });

  // States: MEET SCHEDULER
  const [meetForm, setMeetForm] = useState({
    summary: 'Kelas Halaqah Quran Virtual',
    description: 'Sesi bimbingan setoran hafalan & review qiraah online',
    date: '2026-06-01',
    time: '09:00'
  });
  const [createdMeetUrl, setCreatedMeetUrl] = useState<string | null>(null);
  const [createdCalendarUrl, setCreatedCalendarUrl] = useState<string | null>(null);

  // States: SLIDES GRADUATION GENERATOR
  const [slidesForm, setSlidesForm] = useState({
    presentationTitle: 'Sertifikat Kelulusan Halaqah',
    studentName: siswas[0]?.namaLengkap || 'Nama Santri',
    achievementName: 'Hafal Juz 30 (Juz Amma)',
    pembimbingName: gurus[0]?.namaLengkap || 'Pembimbing Halaqah'
  });
  const [createdSlidesUrl, setCreatedSlidesUrl] = useState<string | null>(null);

  // States: GOOGLE KEEP
  interface KeepNote {
    id: string;
    title: string;
    body: string;
    color: string;
    pinned: boolean;
    createdAt?: string;
    checklist?: string[];
  }
  const [keepNotes, setKeepNotes] = useState<KeepNote[]>([]);
  
  // Real-time synchronization from central Keep notes Firestore shared state
  useEffect(() => {
    if (dbKeepNotes && dbKeepNotes.length > 0) {
      setKeepNotes(dbKeepNotes);
    }
  }, [dbKeepNotes]);
  const [keepSearch, setKeepSearch] = useState('');
  const [keepMode, setKeepMode] = useState<'all' | 'pinned'>('all');
  const [isUsingKeepFallback, setIsUsingKeepFallback] = useState(false);
  const [newNoteForm, setNewNoteForm] = useState({
    title: '',
    body: '',
    color: 'bg-amber-100 dark:bg-amber-950/40',
    pinned: false,
    checklistText: ''
  });

  // API Call: Fetch Calendar Events
  const fetchCalendarEvents = async (token: string) => {
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&maxResults=15&timeMin=${new Date().toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.status === 401) {
        setTokenExpired(true);
        return;
      }
      const data = await res.json();
      if (data.items) {
        setCalendarEvents(data.items);
      }
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    }
  };

  // API Call: Create Calendar Event
  const handleCreateCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);
    setApiLoading(true);
    try {
      const token = await renewTokenIfExpired();
      const start = `${calendarForm.date}T${calendarForm.startTime}:00`;
      const end = `${calendarForm.date}T${calendarForm.endTime}:00`;
      const body = {
        summary: calendarForm.summary,
        description: calendarForm.description,
        start: { dateTime: start, timeZone: 'Asia/Jakarta' },
        end: { dateTime: end, timeZone: 'Asia/Jakarta' }
      };
      
      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Gagal membuat event di Google Calendar.');
      }
      setApiSuccess(`Berhasil menjadwalkan event "${calendarForm.summary}" di Google Calendar!`);
      addLog('Google Calendar', `Menjadwalkan event baru di Kalender: ${calendarForm.summary}`);
      await fetchCalendarEvents(token);
    } catch (err: any) {
      setApiError(err.message || 'Kesalahan koneksi Google Calendar.');
    } finally {
      setApiLoading(false);
    }
  };

  // API Call: Delete Calendar Event (Includes confirmation)
  const handleDeleteCalendarEvent = (eventId: string, summary: string) => {
    setWorkspaceConfirmModal({
      title: 'Hapus Jadwal Google Calendar',
      message: `Apakah Anda yakin ingin menghapus jadwal "${summary}" dari Google Calendar?`,
      confirmText: 'Ya, Hapus Jadwal',
      isDanger: true,
      action: async () => {
        setApiError(null);
        setApiSuccess(null);
        setApiLoading(true);
        try {
          const token = await renewTokenIfExpired();
          const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error?.message || 'Gagal menghapus event.');
          }
          setApiSuccess(`Berhasil menghapus jadwal dari Google Calendar!`);
          addLog('Google Calendar', `Menghapus event: ${summary}`);
          await fetchCalendarEvents(token);
        } catch (err: any) {
          setApiError(err.message || 'Kesalahan koneksi Google Calendar.');
        } finally {
          setApiLoading(false);
        }
      }
    });
  };

  // API Call: Fetch Files for Google Picker Dashboard
  const fetchPickerFiles = async (token: string, search = '', filter = 'all') => {
    try {
      let query = '';
      if (filter === 'doc') {
        query += "mimeType = 'application/vnd.google-apps.document'";
      } else if (filter === 'sheet') {
        query += "mimeType = 'application/vnd.google-apps.spreadsheet'";
      } else if (filter === 'slide') {
        query += "mimeType = 'application/vnd.google-apps.presentation'";
      } else if (filter === 'json') {
        query += "mimeType = 'application/json' or name contains '.json'";
      }
      
      if (search) {
        const escapedSearch = search.replace(/'/g, "\\'");
        if (query) query = `(${query}) and `;
        query += `name contains '${escapedSearch}'`;
      }
      
      if (query) {
        query += ' and ';
      }
      query += 'trashed = false';
      
      const url = `https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,createdTime,size,webViewLink,iconLink)&orderBy=createdTime+desc&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        setTokenExpired(true);
        return;
      }
      const data = await res.json();
      if (data.files) {
        setPickerFiles(data.files);
      }
    } catch (err) {
      console.error('Failed to load picker files:', err);
    }
  };

  // Handle Pick file
  const handleSelectPickerFile = async (file: any) => {
    setApiError(null);
    setApiSuccess(null);
    setSelectedPickerFile(file);
    setPickedFileContent(null);
    if (file.mimeType === 'application/json' || file.name.endsWith('.json')) {
      setIsFetchingFileContent(true);
      try {
        const token = await renewTokenIfExpired();
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (res.ok) {
          const text = await res.text();
          setPickedFileContent(text);
          setApiSuccess(`File "${file.name}" berhasil dibuka dan dibaca via Google Picker!`);
        } else {
          throw new Error();
        }
      } catch (er) {
        setApiError(`Gagal membaca isi konten file cadangan. Mungkin file kosong.`);
      } finally {
        setIsFetchingFileContent(false);
      }
    }
  };

  // Handle Restore database using Picked file from Google Picker
  const handleRestoreFromPickedFile = () => {
    if (!selectedPickerFile || !pickedFileContent) return;
    setWorkspaceConfirmModal({
      title: 'Pulihkan Sistem dari Google Picker',
      message: `PERINGATAN: Anda akan memulihkan data sistem menggunakan berkas dari Picker "${selectedPickerFile.name}". Seluruh data aktif saat ini akan tertimpa. Lanjutkan?`,
      confirmText: 'Ya, Timpa & Pulihkan',
      isDanger: true,
      action: () => {
        setApiError(null);
        setApiSuccess(null);
        try {
          const restored = restoreDatabase(pickedFileContent);
          if (restored) {
            setApiSuccess(`Database portal berhasil dipulihkan dari file Google Drive: "${selectedPickerFile.name}"!`);
            addLog('Google Picker Restore', `Memulihkan data sistem dari file Google Picker (${selectedPickerFile.name})`);
          } else {
            throw new Error('File JSON tidak valid. Format cadangan rusak.');
          }
        } catch (err: any) {
          setApiError(err.message || 'Kesalahan memulihkan data.');
        }
      }
    });
  };

  // API Call: Fetch Google Keep Notes (with Enterprise limitations offline fallback)
  const fetchKeepNotes = async (token: string) => {
    try {
      setIsUsingKeepFallback(false);
      const res = await fetch('https://keep.googleapis.com/v1/notes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Keep REST restricts consumer accounts
      if (!res.ok) {
        throw new Error('REST API Keep has enterprise restrictions.');
      }
      
      const data = await res.json();
      if (data.notes) {
        setKeepNotes(data.notes.map((n: any) => ({
          id: n.name || n.id,
          title: n.title || '',
          body: n.body?.text || n.textContent || '',
          pinned: !!n.pinned,
          color: n.color || 'bg-amber-100 dark:bg-amber-955'
        })));
      } else {
        setKeepNotes([]);
      }
    } catch (err) {
      console.warn('Google Keep API is restricted to enterprise accounts. Falling back to robust synced local storage.');
      setIsUsingKeepFallback(true);
      if (dbKeepNotes && dbKeepNotes.length > 0) {
        setKeepNotes(dbKeepNotes);
      } else {
        // Seed default Workspace notes for a gorgeous workspace dashboard
        const defaults: KeepNote[] = [
          {
            id: 'note-1',
            title: 'Rencana Ujian Setoran Juz 30',
            body: '1. Persiapkan sertifikat kelulusan santri\n2. Jadwalkan bimbingan di Google Calendar\n3. Hubungi wali santri pembimbing halaqah.',
            color: 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-250',
            pinned: true,
            createdAt: new Date().toLocaleDateString('id-ID')
          },
          {
            id: 'note-2',
            title: 'Materi Hafalan Terbaik Surah Al-Mulk',
            body: 'Pastikan santri lancar makharijul huruf pada ayat 1 - 5 sebelum masuk ke ayat berikutnya.',
            color: 'bg-indigo-50 dark:bg-indigo-950/25 border-indigo-250',
            pinned: false,
            createdAt: new Date().toLocaleDateString('id-ID')
          },
          {
            id: 'note-3',
            title: 'Catatan Rapat Kurikulum Pesantren',
            body: 'Menargetkan seluruh santri kelas VII sudah menyelesaikan minimal 2 juz (Juz 30 & Juz 29) sebelum semester genap berakhir.',
            color: 'bg-amber-50 dark:bg-amber-950/25 border-amber-250',
            pinned: false,
            createdAt: new Date().toLocaleDateString('id-ID')
          }
        ];
        setKeepNotes(defaults);
        saveKeepNotes(defaults);
      }
    }
  };

  // API Call: Create Keep Note
  const handleCreateKeepNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);
    
    const newNote: KeepNote = {
      id: `note-${Date.now()}`,
      title: newNoteForm.title || 'Catatan Baru',
      body: newNoteForm.body,
      color: newNoteForm.color,
      pinned: newNoteForm.pinned,
      createdAt: new Date().toLocaleDateString('id-ID')
    };
    
    const token = inMemoryAccessToken;
    if (!isUsingKeepFallback && token) {
      try {
        const res = await fetch('https://keep.googleapis.com/v1/notes', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: newNote.title,
            body: { text: newNote.body }
          })
        });
        if (!res.ok) throw new Error();
        setApiSuccess(`Berhasil disinkronkan ke Google Keep!`);
      } catch (er) {
        console.warn('Fallback to local Keep updates');
      }
    }
    
    const updated = [newNote, ...keepNotes];
    setKeepNotes(updated);
    saveKeepNotes(updated);
    setNewNoteForm({
      title: '',
      body: '',
      color: 'bg-amber-100 dark:bg-amber-950/40',
      pinned: false,
      checklistText: ''
    });
    setApiSuccess(`Catatan "${newNote.title}" berhasil disimpan!`);
    addLog('Google Keep Note', `Membuat Catatan baru: ${newNote.title}`);
  };

  // API Call: Delete Keep Note
  const handleDeleteKeepNote = (noteId: string, title: string) => {
    setWorkspaceConfirmModal({
      title: 'Hapus Catatan Google Keep',
      message: `Apakah Anda yakin ingin menghapus catatan "${title}"?`,
      confirmText: 'Ya, Hapus Catatan',
      isDanger: true,
      action: async () => {
        const token = inMemoryAccessToken;
        if (!isUsingKeepFallback && token) {
          try {
            await fetch(`https://keep.googleapis.com/v1/notes/${noteId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (er) {
            console.warn(er);
          }
        }
        
        const updated = keepNotes.filter(n => n.id !== noteId);
        setKeepNotes(updated);
        saveKeepNotes(updated);
        setApiSuccess(`Catatan berhasil dihapus.`);
        addLog('Google Keep Note', `Menghapus Catatan: ${title}`);
      }
    });
  };

  // Support: Back up Notes directly to active user's Google Drive
  const handleExportNotesToDrive = async () => {
    setApiError(null);
    setApiSuccess(null);
    setApiLoading(true);
    try {
      const token = await renewTokenIfExpired();
      const notesText = keepNotes.map(n => `=== ${n.title} ===\nStatus Semat: ${n.pinned ? '📌 Penting/Semat' : 'Normal'}\nTanggal: ${n.createdAt || ''}\n\n${n.body}\n\n`).join('\n');
      const filename = `halaqah_notes_export_${Date.now()}.txt`;
      
      const boundary = 'halaqah_notes_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;
      const metadata = {
        name: filename,
        mimeType: 'text/plain',
        description: 'Ekspor Catatan Halaqah Google Keep'
      };
      
      const multipartBody = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
        notesText +
        closeDelimiter;

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartBody
        }
      );

      if (!response.ok) {
        throw new Error('Gagal mengekspor laporan catatan ke Google Drive.');
      }

      setApiSuccess(`Berhasil mengekspor seluruh catatan sebagai berkas teks "${filename}" ke Google Drive!`);
      addLog('Google Keep Export', 'Mengekspor berkas catatan ke Google Drive');
    } catch (err: any) {
      setApiError(err.message || 'Gagal mengekspor catatan.');
    } finally {
      setApiLoading(false);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuthInstance(), (user) => {
      if (user) {
        const savedUser = {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid
        };
        setCurrentUser(savedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('mh_google_saved_user', JSON.stringify(savedUser));
        }
      } else {
        // Do not automatically clear access token if Firebase Auth is not loaded or missing,
        // because it throws away healthy, verified local token sessions on page refresh!
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('mh_google_saved_user');
          if (saved) {
            try {
              setCurrentUser(JSON.parse(saved));
            } catch {
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    });
    return () => unsub();
  }, [configApplied]);

  // Handle auto-expiration countdown timer and live sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('mh_google_access_token');
      const expiry = localStorage.getItem('mh_google_access_token_expiry');
      if (token && expiry) {
        if (Date.now() > Number(expiry)) {
          setTokenExpired(true);
        } else {
          setTokenExpired(false);
          const timeLeft = Number(expiry) - Date.now();
          const timer = setTimeout(() => {
            setTokenExpired(true);
            inMemoryAccessToken = null;
            localStorage.removeItem('mh_google_access_token');
            localStorage.removeItem('mh_google_access_token_expiry');
          }, timeLeft);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [currentUser]);

  // React dynamically on activeSubTab changes to keep Calendar, Keep, and Picker files fresh
  useEffect(() => {
    const activeToken = getGoogleAccessToken();
    if (currentUser && activeToken) {
      if (activeSubTab === 'calendar') {
        fetchCalendarEvents(activeToken);
      } else if (activeSubTab === 'picker') {
        fetchPickerFiles(activeToken, pickerSearch, pickerFilter);
      } else if (activeSubTab === 'keep') {
        fetchKeepNotes(activeToken);
      } else if (activeSubTab === 'drive') {
        fetchDriveBackups(activeToken);
      }
    }
  }, [activeSubTab, currentUser]);

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const roleStr = isSiswa ? UserRole.SISWA : (isGuru ? UserRole.GURU : UserRole.ADMIN);
      const token = await signInWithGoogleWorkspace(roleStr);
      
      setTokenExpired(false);
      const savedUserStr = localStorage.getItem('mh_google_saved_user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      setApiSuccess(`Berhasil terhubung ke akun Google Workspace: ${savedUser?.email || ''}`);
      addLog('Google Auth', `Menghubungkan aplikasi ke Google Workspace (${savedUser?.email || ''})`);
      
      // Fetch drive, calendar, picker files, and keep notes after login safely (error isolated)
      if (!isSiswa) {
        try {
          await fetchDriveBackups(token);
        } catch (driveErr) {
          console.error('Silently caught drive during sign-in:', driveErr);
        }
      }
      
      try {
        await fetchCalendarEvents(token);
      } catch (calErr) {
        console.error('Silently caught calendar during sign-in:', calErr);
      }
      
      try {
        await fetchPickerFiles(token, '', 'all');
      } catch (pickErr) {
        console.error('Silently caught picker during sign-in:', pickErr);
      }
      
      try {
        await fetchKeepNotes(token);
      } catch (keepErr) {
        console.error('Silently caught keep during sign-in:', keepErr);
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Proses autentikasi dibatalkan.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await getAuthInstance().signOut();
      inMemoryAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mh_google_access_token');
        localStorage.removeItem('mh_google_access_token_expiry');
        localStorage.removeItem('mh_google_saved_user');
      }
      setCurrentUser(null);
      setDriveBackups([]);
      setApiSuccess('Berhasil memutuskan koneksi Google Workspace.');
      addLog('Google Auth', 'Mematikan koneksi Google Workspace');
    } catch (err: any) {
      setApiError(err.message || 'Gagal logout.');
    }
  };

  const handleApplyCustomConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(customConfigText);
      if (!parsed.apiKey || !parsed.projectId) {
        setApiError('Format JSON Firebase tidak valid. Pastikan ada properti "apiKey" dan "projectId".');
        return;
      }
      localStorage.setItem('mh_custom_firebase_config', JSON.stringify(parsed, null, 2));
      setConfigApplied(true);
      setApiSuccess('Firebase kustom berhasil diterapkan! Silakan lakukan masuk (sign-in) ulang.');
      setApiError(null);
      
      // Attempt to logout from old session if any and close form
      try {
        getAuthInstance().signOut();
        setCurrentUser(null);
        inMemoryAccessToken = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mh_google_access_token');
          localStorage.removeItem('mh_google_access_token_expiry');
        }
      } catch (_) {}
      
      setShowCustomConfig(false);
    } catch (err) {
      setApiError('Gagal memproses JSON. Harap salin JSON konfigurasi Firebase Web App Anda dengan benar.');
    }
  };

  const handleResetCustomConfig = () => {
    localStorage.removeItem('mh_custom_firebase_config');
    setConfigApplied(false);
    setApiSuccess('Berhasil direset ke Firebase sandbox bawaan.');
    setApiError(null);
    
    // Reset inputs
    setCustomConfigText(JSON.stringify({
      apiKey: "SALIN_API_KEY_ANDA",
      authDomain: "PROYEK_ANDA.firebaseapp.com",
      projectId: "PROYEK_ANDA",
      storageBucket: "PROYEK_ANDA.firebasestorage.app",
      messagingSenderId: "SENDER_ID_ANDA",
      appId: "APP_ID_ANDA"
    }, null, 2));

    try {
      getAuthInstance().signOut();
      setCurrentUser(null);
      inMemoryAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mh_google_access_token');
        localStorage.removeItem('mh_google_access_token_expiry');
      }
    } catch (_) {}
  };

  // Helper helper to fetch Drive backups (Drive + Google Picker Simulation)
  const fetchDriveBackups = async (token: string) => {
    try {
      const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=name+contains+'halaqah_backup'+and+trashed=false&fields=files(id,name,mimeType,createdTime,webViewLink)&orderBy=createdTime+desc",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.status === 401) {
        setTokenExpired(true);
        return;
      }
      const data = await res.json();
      if (data.files) {
        setDriveBackups(data.files);
      }
    } catch (e) {
      console.error('Failed to list backups: ', e);
    }
  };

  const renewTokenIfExpired = async () => {
    if (!inMemoryAccessToken || tokenExpired) {
      throw new Error("Sesi token Google Anda telah kadaluarsa. Silakan perbarui sesi tanpa perlu Keluar/Disconnect akun dengan menekan tombol 'Perbarui Sesi' di panel atas atau kanan bawah.");
    }
    return inMemoryAccessToken;
  };

  // 1. GOOGLE DRIVE BACKUP: Write a backup to Drive (using multipart upload)
  const handleDriveBackup = async () => {
    setApiError(null);
    setApiSuccess(null);
    setApiLoading(true);
    try {
      const token = await renewTokenIfExpired();
      const localDataStr = backupDatabase();
      const filename = `halaqah_backup_${new Date().toISOString().slice(0, 10)}_${Date.now()}.json`;

      // Multipart configuration
      const boundary = 'halaqah_boundary_separator';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;
      
      const metadata = {
        name: filename,
        mimeType: 'application/json',
        description: 'Pencadangan database otomatis portal HalaqahMonitor'
      };

      const multipartBody = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        localDataStr +
        closeDelimiter;

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartBody
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Gagal menyimpan cadangan ke Google Drive.');
      }

      setApiSuccess(`Berhasil mencadangkan seluruh data sistem ke Google Drive! File disimpan dengan nama "${filename}"`);
      addLog('Google Drive Backup', 'Menyimpan file cadangan sistem baru ke Google Drive');
      
      // Refresh list
      await fetchDriveBackups(token);
    } catch (err: any) {
      setApiError(err.message || 'Kesalahan koneksi Google Drive.');
    } finally {
      setApiLoading(false);
    }
  };

  // Google Drive Restore (Download and overwrite context)
  const handleDriveRestore = async () => {
    if (!selectedBackupId) {
      setApiError('Pilih file cadangan terlebih dahulu.');
      return;
    }

    const backupFile = driveBackups.find(f => f.id === selectedBackupId);
    if (!backupFile) return;

    setWorkspaceConfirmModal({
      title: 'Pulihkan Sistem dari Google Drive',
      message: `PERINGATAN: Anda akan memulihkan data sistem menggunakan cadangan "${backupFile.name}". Seluruh data aktif saat ini akan tertimpa. Lanjutkan?`,
      confirmText: 'Ya, Timpa & Pulihkan',
      isDanger: true,
      action: async () => {
        setApiError(null);
        setApiSuccess(null);
        setApiLoading(true);
        try {
          const token = await renewTokenIfExpired();
          const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${selectedBackupId}?alt=media`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (!response.ok) {
            throw new Error('Gagal mengunduh isi file cadangan dari Google Drive.');
          }

          const content = await response.text();
          const restored = restoreDatabase(content);
          if (restored) {
            setApiSuccess(`Database portal berhasil dipulihkan dari file Google Drive: "${backupFile.name}"!`);
            addLog('Google Drive Restore', `Memulihkan data sistem dari file Google Drive (${backupFile.name})`);
          } else {
            throw new Error('File JSON tidak valid. Format cadangan rusak.');
          }
        } catch (err: any) {
          setApiError(err.message || 'Kesalahan data.');
        } finally {
          setApiLoading(false);
        }
      }
    });
  };

  // 2. GMAIL: Send email via users/me/send
  const handleGmailSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);
    setApiLoading(true);
    try {
      const token = await renewTokenIfExpired();
      
      const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(gmailForm.subject)))}?=`;
      const emailLines = [
        `To: ${gmailForm.recipient}`,
        `Subject: ${utf8Subject}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        gmailForm.message
      ];

      const rawMsg = emailLines.join('\r\n');
      const base64UrlEmail = btoa(unescape(encodeURIComponent(rawMsg)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch(
        'https://www.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: base64UrlEmail })
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Gagal mengirim email lewat Gmail.');
      }

      setApiSuccess(`Email perkembangan halaqah berhasil dikirim ke "${gmailForm.recipient}"!`);
      addLog('Gmail Send', `Mengirim email laporan santri ke ${gmailForm.recipient}`);
    } catch (err: any) {
      setApiError(err.message || 'Kesalahan pengiriman Gmail.');
    } finally {
      setApiLoading(false);
    }
  };

  // 3. GOOGLE SHEETS: Export Santri list as structured spreadsheet
  const handleSheetsExport = async () => {
    setApiError(null);
    setApiSuccess(null);
    setApiLoading(true);
    setCreatedSheetUrl(null);
    try {
      const token = await renewTokenIfExpired();
      const title = `Laporan_Santri_Halaqah_${new Date().toISOString().slice(0, 10)}`;

      // Create Spreadsheet
      const createRes = await fetch(
        'https://www.googleapis.com/sheets/v4/spreadsheets',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: { title: title }
          })
        }
      );

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error?.message || 'Gagal membuat Google Sheet baru.');
      }

      const spreadId = createData.spreadsheetId;
      const sheetUrl = createData.spreadsheetUrl;

      // Populate row values
      const headRow = ['ID SISWA', 'NAMA LENGKAP', 'JENIS KELAMIN', 'KELAS', 'HALAQAH BIMBINGAN', 'STATUS MASUK', 'TANGGAL GABUNG'];
      const rows = [headRow];

      siswas.forEach(s => {
        rows.push([
          s.id,
          s.namaLengkap,
          s.jenisKelamin,
          s.kelasNama,
          s.halaqahNama,
          s.status,
          s.tanggalDibuat
        ]);
      });

      // Update values
      const writeResponse = await fetch(
        `https://www.googleapis.com/sheets/v4/spreadsheets/${spreadId}/values/Sheet1!A1:G${rows.length}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: rows
          })
        }
      );

      if (!writeResponse.ok) {
        throw new Error('Gagal mengirimkan baris data santri ke Google Sheet.');
      }

      setCreatedSheetUrl(sheetUrl);
      setApiSuccess(`Sukses mengekspor ${siswas.length} data Santri ke spreadsheet baru!`);
      addLog('Google Sheets Export', 'Mengekspor data santri lengkap ke Google Sheets');
    } catch (err: any) {
      setApiError(err.message || 'Kesalahan ekspor Google Sheets.');
    } finally {
      setApiLoading(false);
    }
  };

  // 4. GOOGLE DOCS: Export active Learning Modules (Modul Pembelajaran) to Doc
  const handleDocsExport = async () => {
    setApiError(null);
    setApiSuccess(null);
    setApiLoading(true);
    setCreatedDocUrl(null);
    try {
      const token = await renewTokenIfExpired();
      const title = `Silabus_Halaqah_Pesantren_${new Date().getFullYear()}`;

      // Create document
      const createRes = await fetch(
        'https://www.googleapis.com/docs/v1/documents',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: title })
        }
      );

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error?.message || 'Gagal membuat Google Document baru.');
      }

      const docId = createData.documentId;
      const docLink = `https://docs.google.com/document/d/${docId}/edit`;

      // Build document operations
      const requests: any[] = [];
      let insertIndex = 1;

      // Add main headers and silabus info
      const headerText = `SILABUS KURIKULUM HALAQAH AL-QURAN\r\nUpdate: ${new Date().toLocaleDateString('id-ID')}\r\n\r\n`;
      requests.push({
        insertText: { text: headerText, location: { index: insertIndex } }
      });
      insertIndex += headerText.length;

      moduls.forEach((m, idx) => {
        const titleStr = `${idx + 1}. MATA AJAR: ${m.judulModul || m.namaSurat} (${m.tipeModul})\n`;
        const jilidCount = ((m as any).jilidList || (m as any).jilidLengkap || []).length;
        const contentStr = `Kategori: ${m.kategoriModul || 'Tafsir/Adab'}\nJumlah Jilid/Bagian: ${jilidCount} Jilid ajar\n\n`;
        const itemBody = titleStr + contentStr;
        
        requests.push({
          insertText: { text: itemBody, location: { index: insertIndex } }
        });
        insertIndex += itemBody.length;
      });

      // Update doc contents
      const updateRes = await fetch(
        `https://www.googleapis.com/docs/v1/documents/${docId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        }
      );

      if (!updateRes.ok) {
        throw new Error('Gagal menyisipkan kurikulum ke Google Doc.');
      }

      setCreatedDocUrl(docLink);
      setApiSuccess(`Sukses meluncurkan Google Document Silabus materi pembelajaran!`);
      addLog('Google Docs Export', 'Mengekspor modul ajar dan silabus kurikulum pesantren ke Google Docs');
    } catch (err: any) {
      setApiError(err.message || 'Kesalahan ekspor Google Docs.');
    } finally {
      setApiLoading(false);
    }
  };

  // 5. GOOGLE MEET + CALENDAR: Schedule Class with video call Link
  const handleMeetSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);
    setApiLoading(true);
    setCreatedMeetUrl(null);
    setCreatedCalendarUrl(null);
    try {
      const token = await renewTokenIfExpired();

      const startDateTime = `${meetForm.date}T${meetForm.time}:00`;
      const endHour = String((Number(meetForm.time.split(':')[0]) + 1) % 24).padStart(2, '0');
      const endDateTime = `${meetForm.date}T${endHour}:${meetForm.time.split(':')[1]}:00`;

      const eventBody = {
        summary: meetForm.summary,
        description: meetForm.description,
        start: { dateTime: startDateTime, timeZone: 'Asia/Jakarta' },
        end: { dateTime: endDateTime, timeZone: 'Asia/Jakarta' },
        conferenceData: {
          createRequest: {
            requestId: `meet-class-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      };

      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventBody)
        }
      );

      const eventData = await res.json();
      if (!res.ok) {
        throw new Error(eventData.error?.message || 'Gagal membuat Google Meet/Kalender Event.');
      }

      const meetLink = eventData.hangoutLink;
      const calLink = eventData.htmlLink;

      setCreatedMeetUrl(meetLink || null);
      setCreatedCalendarUrl(calLink || null);
      setApiSuccess(`Jadwal kelas virtual berhasil didaftarkan di Google Calendar & Google Meet!`);
      addLog('Google Meet Schedule', `Menjadwalkan bimbingan Halaqah Online di Meet: ${meetForm.summary}`);
    } catch (err: any) {
      setApiError(err.message || 'Kesalahan Kalendar/Meet.');
    } finally {
      setApiLoading(false);
    }
  };

  // 6. GOOGLE SLIDES: Export Certificate or Graduation slide presentation
  const handleSlidesGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);
    setApiLoading(true);
    setCreatedSlidesUrl(null);
    try {
      const token = await renewTokenIfExpired();
      const title = `Sertifikat_${slidesForm.studentName.replace(/ /g, '_')}`;

      // Create Presentation
      const createRes = await fetch(
        'https://www.googleapis.com/slides/v1/presentations',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: title })
        }
      );

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error?.message || 'Gagal membuat slide Google Presentation.');
      }

      const slideId = createData.presentationId;
      const slideUrl = `https://docs.google.com/presentation/d/${slideId}/edit`;

      // Grab first slide layout element IDs for modification, or append shapes.
      // For simplicity, we create a gorgeous layout on the first slide
      const requests = [
        // Slide theme colored rectangle (Border frame)
        {
          createShape: {
            objectId: 'borderRect',
            shapeType: 'RECTANGLE',
            elementProperties: {
              pageId: createData.slides[0].pageObjectId,
              size: { width: { magnitude: 6500000, unit: 'EMU' }, height: { magnitude: 4500000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 350000, translateY: 250000, unit: 'EMU' }
            }
          }
        },
        // Insert Certificate Text (Header)
        {
          createShape: {
            objectId: 'titleText',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: createData.slides[0].pageObjectId,
              size: { width: { magnitude: 6000000, unit: 'EMU' }, height: { magnitude: 1000000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 600000, translateY: 600000, unit: 'EMU' }
            }
          }
        },
        {
          insertText: {
            objectId: 'titleText',
            text: `PIAGAM PENGHARGAAN TAHFIDZ\n${slidesForm.presentationTitle}\n\nSiswa Kelulusan: ${slidesForm.studentName}\nCapaian Utama: ${slidesForm.achievementName}\nGuru Pembimbing: ${slidesForm.pembimbingName}\n\nSelamat atas ketekunan dan kemuliaan menjaga hafalan Al-Quran.`,
            location: { index: 0 }
          }
        }
      ];

      const writeRes = await fetch(
        `https://www.googleapis.com/slides/v1/presentations/${slideId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        }
      );

      if (!writeRes.ok) {
        const errJ = await writeRes.json().catch(() => ({}));
        console.warn('Custom text updates failed: ', errJ);
        // Fallback: still show created slide url even if textual mapping had layout mismatch
      }

      setCreatedSlidesUrl(slideUrl);
      setApiSuccess(`Piagam penghargaan digital siap! Google Slides berhasil dihasilkan.`);
      addLog('Google Slides Export', `Membuat kelulusan sertifikat digital Google Slides untuk ${slidesForm.studentName}`);
    } catch (err: any) {
      setApiError(err.message || 'Kesalahan ekspor Google Slides.');
    } finally {
      setApiLoading(false);
    }
  };

  const getSubTabIcon = (tab: typeof activeSubTab) => {
    switch (tab) {
      case 'drive': return Database;
      case 'picker': return FolderOpen;
      case 'gmail': return Mail;
      case 'sheets': return FileSpreadsheet;
      case 'docs': return FileText;
      case 'calendar': return Calendar;
      case 'meet': return Video;
      case 'slides': return Presentation;
      case 'keep': return StickyNote;
    }
  };

  const getSubTabLabel = (tab: typeof activeSubTab) => {
    switch (tab) {
      case 'drive': return 'Google Drive Backup & Restore';
      case 'picker': return 'Google Picker File Explorer';
      case 'gmail': return 'Gmail Blast Laporan';
      case 'sheets': return 'Google Sheets Export';
      case 'docs': return 'Google Docs Kurikulum';
      case 'calendar': return 'Google Calendar Manager';
      case 'meet': return 'Google Meet Kelas';
      case 'slides': return 'Google Slides Piagam';
      case 'keep': return 'Google Keep Notes';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 dark:text-white flex items-center">
            <Cloud className="w-7 h-7 mr-2.5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
            Integrasi Layanan Google Workspace
          </h2>
          <p className="text-xs text-slate-400">
            Akses, simpan, komunikasi, dan visualisasikan data Halaqah santri Anda langsung menggunakan ekosistem digital Google
          </p>
        </div>

        {currentUser ? (
          <div className="flex items-center space-x-3 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm shrink-0">
            <React.Fragment>
              <Avatar
                namaLengkap={currentUser.displayName || currentUser.email || 'Google User'}
                fotoProfil={currentUser.photoURL}
                className="w-7 h-7 text-[10px] font-bold"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-white">{currentUser.displayName || 'Google User'}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{currentUser.email}</p>
              </div>
              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-transparent hover:border-emerald-250 dark:hover:border-emerald-900 rounded-lg transition flex items-center space-x-1"
                title="Perbarui Sesi Token (Tanpa Keluar)"
              >
                <RefreshCw className={`w-4 h-4 ${isAuthenticating ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-bold hidden md:inline">Perbarui Sesi</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 rounded-lg transition"
                title="Keluar / Disconnect Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </React.Fragment>
          </div>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="flex items-center space-x-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
          >
            {isAuthenticating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4" />
            )}
            <span>Hubungkan Google Workspace</span>
          </button>
        )}
      </div>

      {/* Global State Notification */}
      <AnimatePresence mode="popLayout">
        {apiSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-start space-x-2.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{apiSuccess}</span>
          </motion.div>
        )}

        {apiError && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-3.5 bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-350 text-xs font-semibold rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start space-x-2.5 text-left">
              <AlertCircle className="w-4 h-4 text-rose-505 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
            {(apiError.includes("kadaluarsa") || apiError.includes("expired") || apiError.includes("401") || tokenExpired) && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] tracking-wider uppercase flex items-center justify-center space-x-1.5 shadow transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuthenticating ? 'animate-spin' : ''}`} />
                <span>Perbarui Sesi Sekarang</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guard Lock if not authenticated to show full power of direct workspace action */}
      {!currentUser ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Block: Standard Sign In Card & Custom Firebase setup */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-6 md:p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-5 shadow-xs">
            {configApplied ? (
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-900/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>PROYEK FIREBASE MANDIRI</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-rose-100 dark:bg-rose-955/40 text-rose-700 dark:text-rose-400 rounded-full text-[10px] font-extrabold border border-rose-200 dark:border-rose-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span>SANDBOX DEFAULT (TERKUNCI)</span>
              </div>
            )}

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-full text-emerald-600 dark:text-emerald-450">
              <Lock className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <h3 className="text-slate-855 dark:text-white font-sans font-extrabold text-base">Autentikasi Google Workspace Diperlukan</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {configApplied 
                  ? 'Aplikasi telah dialihkan ke Proyek Firebase Mandiri Anda. Hubungkan akun Google untuk menyinkronkan data.'
                  : 'Tekan tombol di bawah untuk menghubungkan aplikasi Halaqah dengan Google Workspace Anda.'}
              </p>
            </div>
            
            <button
              onClick={handleGoogleSignIn}
              id="gsi-main-trigger"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-2.5"
            >
              <Cloud className="w-4 h-4" />
              <span>Hubungkan Akun Google Anda</span>
            </button>

            <div className="w-full border-t border-slate-100 dark:border-slate-850/60 pt-4 text-[11px] text-slate-400 text-center">
              Mendukung sinkronisasi Google Calendar, Drive Backups, Gmail, & Google Sheets Excel.
            </div>

            {/* Custom Firebase Setup Panel */}
            <div className="w-full pt-1 border-t border-slate-105 dark:border-slate-850/60">
              {!showCustomConfig ? (
                <button
                  type="button"
                  onClick={() => setShowCustomConfig(true)}
                  className="text-[11px] text-slate-600 hover:text-emerald-600 dark:text-slate-450 dark:hover:text-emerald-400 font-bold underline transition inline-flex items-center space-x-1"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Gunakan Firebase / GCP Milik Sendiri</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomConfig(false)}
                  className="text-[11px] text-slate-550 hover:text-rose-605 dark:text-slate-405 dark:hover:text-rose-405 font-bold transition inline-flex items-center space-x-1"
                >
                  <span>Sembunyikan Form Penguasa</span>
                </button>
              )}
            </div>

            {showCustomConfig && (
              <form onSubmit={handleApplyCustomConfig} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800 p-4 rounded-xl text-left space-y-3">
                <span className="text-[11px] font-extrabold text-slate-705 dark:text-slate-355 flex items-center space-x-1.5 uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5" />
                  <span>Konfigurasi Firebase Mandiri</span>
                </span>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Salin JSON 'Web app' dari Firebase Console Anda sendiri agar Anda dapat mengontrol daftar penguji atau mempublikasikan OAuth sesuka hati:
                </p>
                <textarea
                  value={customConfigText}
                  onChange={(e) => setCustomConfigText(e.target.value)}
                  className="w-full h-36 p-2 bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Paste Firebase Config JSON here..."
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition active:scale-95 cursor-pointer"
                  >
                    Terapkan Config
                  </button>
                  {configApplied && (
                    <button
                      type="button"
                      onClick={handleResetCustomConfig}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-250 text-[10px] font-semibold rounded-lg transition active:scale-95 cursor-pointer"
                    >
                      Reset Sandbox
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Right Block: Interactive & Informative 403 Troubleshooting Guide */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-rose-150/80 dark:border-rose-955/30 p-6 md:p-8 rounded-2xl shadow-xs space-y-5 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none text-rose-500">
              <Settings2 className="w-40 h-40" />
            </div>

            <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-850 pb-3">
              <span className="p-1.5 bg-rose-50 dark:bg-rose-955 text-rose-600 dark:text-rose-450 rounded-lg">
                <AlertCircle className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-sans font-extrabold text-slate-850 dark:text-white text-xs">Petunjuk Solusi Error 403: access_denied (Akses Diblokir)</h4>
                <p className="text-[10px] text-slate-400">Atasi kendala perizinan Google Cloud secara instan dan mandiri</p>
              </div>
            </div>

            <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 p-3 rounded-xl text-xs text-rose-850 dark:text-rose-300 leading-relaxed font-sans">
              <p className="font-bold mb-1">Menganalisis Pesan "You need additional access"</p>
              Proyek <span className="font-mono bg-slate-250 dark:bg-slate-800 px-1 py-0.5 rounded font-bold text-red-500">upheld-parser-fw532</span> adalah <b>proyek sandbox yang dibuat secara otomatis oleh Google AI Studio</b>. 
              Sebagai bagian dari pengamanan infrastruktur platform, proyek ini dikelola dan dimiliki oleh sistem, sehingga akun Google pribadi Anda <b>tidak memiliki hak akses administratif (Owner)</b> untuk mengubah status perizinan atau mendaftarkan daftar test users pada proyek sandbox ini.
            </div>

            <div className="space-y-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Solusi yang dapat Anda lakukan:</div>

              {/* Solusi C (Main) */}
              <div className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-150 dark:border-emerald-900/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 font-bold text-xs text-slate-800 dark:text-white">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] flex items-center justify-center font-bold">1</span>
                    <span>Solusi C (Rekomendasi Utama & Permanen): Hubungkan Firebase Project Sendiri</span>
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded text-[9px] font-mono tracking-wider font-extrabold uppercase">Terbaik</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
                  <p>
                    Dengan menghubungkan aplikasi bimbingan ini ke Firebase Project pribadi Anda (menggunakan paket gratis Spark), Anda menjadi <b>pemilik penuh</b> dan bebas mengonfigurasi segalanya tanpa batasan platform.
                  </p>
                  <p className="font-bold">Langkah mudahnya:</p>
                  <ol className="list-decimal list-inside pl-1 space-y-1 text-[11px] leading-relaxed">
                    <li>Buka <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline inline-flex items-center space-x-0.5"><span>Firebase Console</span> <ExternalLink className="w-3 h-3 inline" /></a> lalu buat proyek baru secara gratis.</li>
                    <li>Tambahkan aplikasi tipe <b>Web App</b> baru, beri nama bebas, lalu salin JSON konfigurasinya dngan lengkap.</li>
                    <li>Gunakan formulir <b>"Gunakan Firebase / GCP Milik Sendiri"</b> di panel sebelah kiri untuk menempelkannya, lalu klik <b>Terapkan Config</b>.</li>
                    <li>Kini layar login Google di aplikasi Anda akan beralih ke proyek milik Anda sendiri.</li>
                    <li>Anda bebas mendaftarkan email guru mana pun sebagai penguji di Google Cloud Console Anda sendiri tanpa pesan error akses ditolak!</li>
                  </ol>
                </div>
              </div>

              {/* Solusi A & B (Informational) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2">
                <span className="flex items-center space-x-1.5 font-bold text-xs text-slate-700 dark:text-slate-300">
                  <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>Solusi Alternatif (Hanya jika Anda diekspor/dideploy ke GCP Anda sendiri)</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-1">
                  Jika aplikasi ini di masa depan dideploy atau diekspor ke project Google Cloud pribadi Anda yang bernama serupa, barulah instruksi <b>Test Users</b> (mendaftarkan email guru) atau <b>Publish App</b> (menerbitkan status ke produksi) dapat Anda jalankan sepenuhnya di halaman <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="text-slate-650 dark:text-slate-350 font-bold hover:underline inline-flex items-center space-x-0.5"><span>OAuth Consent Screen</span> <ExternalLink className="w-3 h-3 inline" /></a> pilihan Anda.
                </p>
              </div>

            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Workspace Navigator Menu Left Column */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 block mb-2">Google Module Selector</span>
            
            {allowedTabs.map((tab) => {
              const TabIcon = getSubTabIcon(tab);
              return (
                <button
                  key={tab}
                  id={`subtab-trigger-${tab}`}
                  onClick={() => {
                    setActiveSubTab(tab);
                    setApiError(null);
                    setApiSuccess(null);
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition text-left font-sans text-xs font-bold uppercase tracking-wider border ${
                    activeSubTab === tab
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-150 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-sm'
                      : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <TabIcon className="w-4 h-4 mr-3 shrink-0" />
                  <span className="flex-1">{tab.toUpperCase()} INTEGRASI</span>
                  {activeSubTab === tab && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Work Panel Center Column */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm min-h-[400px]">
            <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-850 pb-4 mb-5">
              {React.createElement(getSubTabIcon(activeSubTab), { className: "w-5 h-5 text-emerald-600 dark:text-emerald-400" })}
              <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
                {getSubTabLabel(activeSubTab)}
              </h3>
            </div>

            {/* Sub-tab 1: GOOGLE DRIVE BACKUPS & EXPLORER */}
            {activeSubTab === 'drive' && (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-750 dark:text-emerald-400 tracking-wider">Metode Pencadangan Awan</span>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    Fitur ini memadukan <b>Google Drive API</b> untuk menyimpan cadangan portal aman secara otomatis ke dalam Drive Anda.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDriveBackup}
                    disabled={apiLoading}
                    className="flex-1 py-3 px-4 bg-emerald-605 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow active:scale-95 cursor-pointer"
                  >
                    {apiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                    <span>Simpan Cadangan Baru Ke Drive</span>
                  </button>
                </div>

                {/* Google Picker Replacement Section */}
                <div className="border-t border-slate-100 dark:border-slate-850 pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-sans font-bold text-slate-800 dark:text-white text-xs">Awan Picker Simulator / Penemu Cadangan</h4>
                      <p className="text-[10px] text-slate-400">Simulator instan Google File Picker membaca file backup cadangan dari Drive Anda</p>
                    </div>
                    <button
                      onClick={() => fetchDriveBackups(inMemoryAccessToken!)}
                      disabled={apiLoading}
                      className="p-1.5 hover:bg-slate-150 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500 flex items-center space-x-1.5 cursor-pointer"
                      title="Refresh daftar file cadangan"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                      <span className="text-[9px]">Muat Ulang</span>
                    </button>
                  </div>

                  {driveBackups.length > 0 ? (
                    <div className="space-y-3">
                      <select
                        value={selectedBackupId}
                        onChange={(e) => setSelectedBackupId(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">-- Pilih file cadangan dari Drive --</option>
                        {driveBackups.map((file) => (
                          <option key={file.id} value={file.id}>
                            {file.name} (ID: {file.id.substring(0, 10)}...)
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleDriveRestore}
                          disabled={!selectedBackupId || apiLoading}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-[11px] font-bold transition flex items-center space-x-1.5 shadow active:scale-95 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Pulihkan Sistem Dari Backup Terpilih</span>
                        </button>
                        {selectedBackupId && (
                          <a
                            href={driveBackups.find(f => f.id === selectedBackupId)?.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 flex items-center space-x-1 text-[10px] font-semibold"
                          >
                            <span>Buka di Google Drive</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs italic">
                      Tidak ditemukan file "halaqah_backup" di Drive Anda saat ini. Klik "Simpan Cadangan Baru" diatas untuk mendaftarkan database ke akun Drive Anda!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab 1b: GOOGLE DRIVE PICKER SIMULATOR */}
            {activeSubTab === 'picker' && (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-750 dark:text-emerald-400 tracking-wider">Google File Picker & Drive Explorer</span>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    Menjelajahi dan memilih berkas cloud dari Google Drive menggunakan API Explorer <b>Drive v3</b>. Mendukung pemfilteran tipe berkas, pencarian kata kunci, serta peninjau / pemulih otomatis basis data pesantren.
                  </p>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                  <div className="relative w-full md:max-w-xs">
                    <input
                      type="text"
                      placeholder="Cari nama file..."
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          fetchPickerFiles(inMemoryAccessToken!, pickerSearch, pickerFilter);
                        }
                      }}
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { id: 'all', label: 'Semua Berkas' },
                      { id: 'json', label: 'Backup JSON' },
                      { id: 'doc', label: 'Docs' },
                      { id: 'sheet', label: 'Sheets' },
                      { id: 'slide', label: 'Slides' }
                    ] as const).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setPickerFilter(f.id);
                          fetchPickerFiles(inMemoryAccessToken!, pickerSearch, f.id);
                        }}
                        className={`px-3 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                          pickerFilter === f.id
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-slate-50 border-slate-250 dark:bg-slate-900 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchPickerFiles(inMemoryAccessToken!, pickerSearch, pickerFilter)}
                    className="p-1.5 hover:bg-slate-150 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-500 flex items-center space-x-1 cursor-pointer font-bold text-[10px]"
                    title="Refresh list"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                    <span>Segarkan</span>
                  </button>
                </div>

                {/* Main Picker Content Explorer */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className={`${selectedPickerFile ? 'md:col-span-7' : 'md:col-span-12'} space-y-3`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Daftar Berkas Drive Anda</span>
                    {pickerFiles.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 border border-dashed border-slate-150 dark:border-slate-850 rounded-xl text-xs italic">
                        Tidak ditemukan berkas yang cocok di Google Drive Anda. Tekan segarkan untuk memuat data.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {pickerFiles.map((file) => (
                          <div
                            key={file.id}
                            onClick={() => handleSelectPickerFile(file)}
                            className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between text-left ${
                              selectedPickerFile?.id === file.id
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900'
                                : 'bg-slate-50/40 hover:bg-slate-50 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 border-slate-150 dark:border-slate-850/80'
                            }`}
                          >
                            <div className="flex items-center space-x-3 truncate">
                              <FolderOpen className="w-4 h-4 text-emerald-500 shrink-0 opacity-80" />
                              <div className="truncate text-xs">
                                <p className="font-bold text-slate-850 dark:text-slate-200 truncate">{file.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono tracking-xs mt-0.5 truncate">
                                  ID: {file.id.substring(0, 18)}...
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 py-0.5 px-1.5 rounded-md uppercase">
                                {file.size ? `${(Number(file.size) / 1024).toFixed(1)} KB` : 'Awan'}
                              </span>
                              <p className="text-[9px] text-slate-400 font-medium mt-1">
                                {new Date(file.createdTime).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected File Preview Drawer Panel */}
                  {selectedPickerFile && (
                    <div className="md:col-span-5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-850/80 p-4 rounded-xl space-y-4 font-sans">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Informasi Berkas Picker</span>
                        <button
                          type="button"
                          onClick={() => setSelectedPickerFile(null)}
                          className="text-[10px] font-bold text-rose-500"
                        >
                          Tutup
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-white dark:bg-slate-950 rounded-lg space-y-1.5 border border-slate-100 dark:border-slate-850">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama File</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">{selectedPickerFile.name}</p>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-950 rounded-lg space-y-1.5 border border-slate-100 dark:border-slate-850">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tipe Dokumen (MIME)</p>
                          <p className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 truncate">{selectedPickerFile.mimeType}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <a
                          href={selectedPickerFile.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Berkas di Drive</span>
                        </a>

                        {isAdmin && (selectedPickerFile.mimeType === 'application/json' || selectedPickerFile.name.endsWith('.json')) && (
                          <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                            <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-400 tracking-wide uppercase flex items-center">
                              <FileCode className="w-4 h-4 mr-1 text-indigo-555 text-indigo-500" /> Backup Terdeteksi!
                            </span>
                            {isFetchingFileContent ? (
                              <div className="flex items-center justify-center py-4 text-xs text-slate-400 space-x-2">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                                <span>Membaca file cadangan...</span>
                              </div>
                            ) : pickedFileContent ? (
                              <button
                                type="button"
                                onClick={handleRestoreFromPickedFile}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1 shadow active:scale-95 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Pulihkan Sistem dari File ini</span>
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab 2: GMAIL EMAIL BLAST */}
            {activeSubTab === 'gmail' && (
              <form onSubmit={handleGmailSend} className="space-y-4">
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-teal-800 dark:text-emerald-400 tracking-wider">Komunikasi Orang Tua & Pengajar</span>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    Kirim email berkala lewat API <b>Gmail Send</b> langsung dari akun Anda untuk merekapitulasi progres kurikulum dan data santri pesantren.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Alamat Email Penerima</label>
                    <input
                      required
                      type="email"
                      value={gmailForm.recipient}
                      onChange={(e) => setGmailForm(prev => ({ ...prev, recipient: e.target.value }))}
                      placeholder="Masukkan email penerima..."
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Judul Subjek Laporan</label>
                    <input
                      required
                      type="text"
                      value={gmailForm.subject}
                      onChange={(e) => setGmailForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pesan Laporan (HTML Tersedia)</label>
                  <textarea
                    required
                    rows={6}
                    value={gmailForm.message}
                    onChange={(e) => setGmailForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={apiLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Laporan Melalui Gmail</span>
                </button>
              </form>
            )}

            {/* Sub-tab 3: GOOGLE SHEETS EXPORT */}
            {activeSubTab === 'sheets' && (
              <div className="space-y-5">
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-teal-800 dark:text-emerald-400 tracking-wider">Lembar Kerja Santri (Spreadsheet)</span>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    Gunakan <b>Google Sheets API</b> untuk mengekspor total daftar santri aktif dari database pesantren secara terstruktur ke lembar spreadsheet online demi efisiensi pelaporan administrasi.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="font-bold">Total Santri Terekspor:</span>
                    <span className="ml-1.5 font-mono text-emerald-600 font-bold">{siswas.length} Santri</span>
                  </div>
                  <button
                    onClick={handleSheetsExport}
                    disabled={apiLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Mulai Ekspor Spreadsheet</span>
                  </button>
                </div>

                {createdSheetUrl && (
                  <motion.div 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="p-5 border border-teal-200 dark:border-teal-900 rounded-xl bg-teal-50/10 flex flex-col items-center justify-center text-center space-y-3"
                  >
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-bold">Spreadsheet Baru Berhasil Dibuat!</p>
                    <a
                      href={createdSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-250 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                    >
                      <span>Buka Google Sheets Sekarang</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </motion.div>
                )}
              </div>
            )}

            {/* Sub-tab 4: GOOGLE DOCS EXPORTER */}
            {activeSubTab === 'docs' && (
              <div className="space-y-5">
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-teal-800 dark:text-emerald-400 tracking-wider">Silabus Pembelajaran Dokumen</span>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    API <b>Google Docs</b> membantu menyusun kurikulum, silabus, dan daftar bab ajar Modul yang Anda daftarkan ke berkas berkas teks online di akun Google Anda.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="font-bold">Total Modul Aktif:</span>
                    <span className="ml-1.5 font-mono text-emerald-600 font-bold">{moduls.length} Modul Ajar</span>
                  </div>
                  <button
                    onClick={handleDocsExport}
                    disabled={apiLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Luncurkan Dokumen Baru</span>
                  </button>
                </div>

                {createdDocUrl && (
                  <motion.div 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="p-5 border border-emerald-200 dark:border-emerald-900 rounded-xl bg-emerald-50/10 flex flex-col items-center justify-center text-center space-y-3"
                  >
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-bold">Silabus Google Document Berhasil Diterbitkan!</p>
                    <a
                      href={createdDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-250 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                    >
                      <span>Buka Google Docs Sekarang</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </motion.div>
                )}
              </div>
            )}

            {/* Sub-tab 4b: GOOGLE CALENDAR MANAGER */}
            {activeSubTab === 'calendar' && (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-750 dark:text-emerald-400 tracking-wider">Google Calendar Scheduler</span>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    Sinkronisasikan agenda pengampuan, ujian kelayakan santri, serta kegiatan bimbingan langsung dengan <b>Google Calendar API</b> primer Anda.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Calendar Event Form */}
                  {isSiswa ? (
                    <div className="md:col-span-12 lg:col-span-5 space-y-4 bg-emerald-50/20 dark:bg-emerald-950/5 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">Informasi Jadwal Santri</span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-105 font-sans leading-relaxed">Kalender Bimbingan Al-Qur'an</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Halaman ini memuat seluruh jadwal bimbingan halaqah hafalan, sesi murojaah personal, jadwal ujian kelayakan kenaikan juz, serta pengumuman penting yang didaftarkan langsung oleh Ustadz/Ustadzah atau Admin ke Google Calendar utama.
                      </p>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed space-y-2">
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">Petunjuk:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Gunakan tombol <b>"Refresh"</b> di samping kanan untuk menyegarkan agenda terbaru.</li>
                          <li>Jika ada perubahan jadwal, harap hubungi Ustadz pembimbing Anda masing-masing.</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateCalendarEvent} className="md:col-span-12 lg:col-span-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 font-sans">Jadwalkan Event Baru</span>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Judul Agenda</label>
                          <input
                            required
                            type="text"
                            value={calendarForm.summary}
                            onChange={(e) => setCalendarForm(prev => ({ ...prev, summary: e.target.value }))}
                            className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-850 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Deskripsi Kegiatan</label>
                          <textarea
                            required
                            rows={2}
                            value={calendarForm.description}
                            onChange={(e) => setCalendarForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-855 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Tanggal</label>
                          <input
                            required
                            type="date"
                            value={calendarForm.date}
                            onChange={(e) => setCalendarForm(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-850 dark:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jam Mulai</label>
                            <input
                              required
                              type="time"
                              value={calendarForm.startTime}
                              onChange={(e) => setCalendarForm(prev => ({ ...prev, startTime: e.target.value }))}
                              className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-855 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jam Selesai</label>
                            <input
                              required
                              type="time"
                              value={calendarForm.endTime}
                              onChange={(e) => setCalendarForm(prev => ({ ...prev, endTime: e.target.value }))}
                              className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-955 text-slate-855 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={apiLoading}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer shadow-sm mt-4"
                      >
                        <CalendarPlus className="w-4 h-4" />
                        <span>Simpan Ke Google Calendar</span>
                      </button>
                    </form>
                  )}

                  {/* Calendar Listing Layout */}
                  <div className="md:col-span-12 lg:col-span-7 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Agenda Terdekat Akun Anda</span>
                      <button
                        type="button"
                        onClick={() => fetchCalendarEvents(inMemoryAccessToken!)}
                        className="p-1 hover:bg-slate-150 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500 flex items-center space-x-1 cursor-pointer text-[10px]"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '7s' }} />
                        <span>Refresh Bahas</span>
                      </button>
                    </div>

                    {calendarEvents.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 border border-dashed border-slate-150 dark:border-slate-850 rounded-xl text-xs italic">
                        Tidak ada agenda terdekat terekam di kalender utama Anda.
                      </div>
                    ) : (
                      <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                        {calendarEvents.map((evt) => (
                          <div 
                            key={evt.id}
                            className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-950 hover:border-emerald-200 dark:hover:border-emerald-900 transition flex items-start justify-between font-sans shadow-2xs"
                          >
                            <div className="space-y-1">
                              <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {evt.summary}
                              </h5>
                              {evt.description && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2">
                                  {evt.description}
                                </p>
                              )}
                              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center bg-emerald-50/50 dark:bg-emerald-950/20 py-0.5 px-2 rounded-md w-max mt-1.5">
                                <Clock className="w-3 h-3 mr-1" />
                                {evt.start?.dateTime ? (
                                  `${new Date(evt.start.dateTime).toLocaleDateString('id-ID')} @ ${new Date(evt.start.dateTime).toTimeString().substring(0, 5)} - ${new Date(evt.end?.dateTime || '').toTimeString().substring(0, 5)}`
                                ) : (
                                  evt.start?.date || 'Agenda Seharian'
                                )}
                              </p>
                            </div>

                            {!isSiswa && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCalendarEvent(evt.id, evt.summary)}
                                className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-rose-500 hover:text-rose-600 cursor-pointer"
                                title="Hapus event"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 5: GOOGLE MEET SCHEDULER */}
            {activeSubTab === 'meet' && (
              isSiswa ? (
                <div className="space-y-6">
                  <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-teal-800 dark:text-emerald-400 tracking-wider">Halaqah Online / Virtual</span>
                    <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                      Layanan bimbingan belajar, setoran, dan ujian hafalan interaktif langsung via <b>Google Meet</b>.
                    </p>
                  </div>
                  
                  <div className="p-6 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-150 dark:border-slate-850 space-y-4">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block font-sans">Petunjuk Kelas Video Conference</span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">Gabung Sesi Halaqah Virtual</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Apabila Ustadz atau Ustadzah pembimbing memulai pengajaran halaqah secara online, jadwal link Meet akan dibagikan langsung di laman <b>Halaqah Virtual (Video Call)</b> utama portal ini atau diinformasikan melalui grup obrolan.
                    </p>
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 space-y-3">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Hal-hal yang perlu disiapkan sebelum bergabung:</p>
                      <ol className="list-decimal pl-4 text-[11px] text-slate-500 space-y-2">
                        <li>Pastikan kamera dan mikrofon berfungsi dengan baik di perangkat Anda.</li>
                        <li>Gunakan pakaian sopan (syar'i) sesuai dengan adab menghafal Al-Qur'an.</li>
                        <li>Siapkan Mushaf Al-Qur'an dan pastikan berada di area yang tenang dengan pencahayaan cukup.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleMeetSchedule} className="space-y-4">
                  <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-teal-800 dark:text-emerald-400 tracking-wider">Halaqah Online / Virtual</span>
                    <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                      Menjadwalkan bimbingan dan video call bimbingan virtual lewat integrasi <b>Google Calendar & Hangouts Meet</b>. Membuat link Meet sekali jalan!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Sesi / Judul Kelas</label>
                      <input
                        required
                        type="text"
                        value={meetForm.summary}
                        onChange={(e) => setMeetForm(prev => ({ ...prev, summary: e.target.value }))}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Deskripsi Singkat</label>
                      <input
                        required
                        type="text"
                        value={meetForm.description}
                        onChange={(e) => setMeetForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tanggal Pelaksanaan</label>
                      <input
                        required
                        type="date"
                        value={meetForm.date}
                        onChange={(e) => setMeetForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full p-2 border border-slate-250 dark:border-slate-800 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Jam Mulai Sesi</label>
                      <input
                        required
                        type="time"
                        value={meetForm.time}
                        onChange={(e) => setMeetForm(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full p-2 border border-slate-250 dark:border-slate-800 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={apiLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
                  >
                    <Video className="w-4 h-4 text-white" />
                    <span>Jadwalkan Halaqah Online & Buat Link Meet</span>
                  </button>

                  {createdMeetUrl && (
                    <motion.div 
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="p-5 border border-indigo-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-center space-y-3"
                    >
                      <p className="text-xs text-slate-850 dark:text-slate-200 font-bold flex items-center justify-center space-x-1">
                        <CalendarCheck className="w-4 h-4 text-indigo-650" />
                        <span>Sesi Selesai Dibuat & Ditambahkan di Kalender!</span>
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <a
                          href={createdMeetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5"
                        >
                          <Video className="w-4 h-4 text-white" />
                          <span>Gabung Google Meet</span>
                        </a>
                        {createdCalendarUrl && (
                          <a
                            href={createdCalendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:text-slate-250 rounded-lg text-xs font-bold flex items-center justify-center"
                          >
                            Buka di Google Calendar →
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </form>
              )
            )}

            {/* Sub-tab 6: GOOGLE SLIDES CERTIFICATE GENERATOR */}
            {activeSubTab === 'slides' && (
              <form onSubmit={handleSlidesGenerate} className="space-y-4">
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-teal-800 dark:text-emerald-400 tracking-wider">Piagam Penghargaan Santri</span>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    API <b>Google Slides</b> memampukan pembuatan slide presentasi dan format sertifikasi penghargaan digital custom santri secara elegan dan representatif.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Lengkap Santri</label>
                    <input
                      required
                      type="text"
                      value={slidesForm.studentName}
                      onChange={(e) => setSlidesForm(prev => ({ ...prev, studentName: e.target.value }))}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Capaian Kelulusan</label>
                    <input
                      required
                      type="text"
                      value={slidesForm.achievementName}
                      onChange={(e) => setSlidesForm(prev => ({ ...prev, achievementName: e.target.value }))}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-850"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Guru Pembimbing</label>
                    <input
                      required
                      type="text"
                      value={slidesForm.pembimbingName}
                      onChange={(e) => setSlidesForm(prev => ({ ...prev, pembimbingName: e.target.value }))}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Judul Template Presentasi</label>
                    <input
                      required
                      type="text"
                      value={slidesForm.presentationTitle}
                      onChange={(e) => setSlidesForm(prev => ({ ...prev, presentationTitle: e.target.value }))}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-850"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={apiLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <Presentation className="w-4 h-4 text-white" />
                  <span>Buat Template Presentasi Piagam Kelulusan</span>
                </button>

                {createdSlidesUrl && (
                  <motion.div 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="p-5 border border-emerald-250 dark:border-slate-800 rounded-xl bg-slate-55 bg-emerald-50/10 text-center space-y-3"
                  >
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">Slide Piagam Google Slides Berhasil Ditulis!</p>
                    <a
                      href={createdSlidesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-850 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 justify-center w-full"
                    >
                      <span>Buka Piagam Google Slides</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </motion.div>
                )}
              </form>
            )}

            {/* Sub-tab 7: GOOGLE KEEP NOTES */}
            {activeSubTab === 'keep' && (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span>Google Keep Integrator</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    Sinkronisasikan catatan rahasia pengajaran, agenda tindak lanjut halaqah santri, serta evaluasi kurikulum pesantren langsung dengan <b>Google Keep API</b> akun Anda. {isUsingKeepFallback && (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold italic">Mendeteksi pembatasan Google Keep personal. Modul aktif dalam mode Synced Local Workspace!</span>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
                  {/* Left Notes Control Center */}
                  <div className="lg:col-span-5 space-y-4">
                    <form onSubmit={handleCreateKeepNote} className="space-y-3 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Semat Catatan Baru</span>
                      
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Judul Catatan</label>
                        <input
                          required
                          type="text"
                          placeholder="Misal: Agenda Rapat Wali"
                          value={newNoteForm.title}
                          onChange={(e) => setNewNoteForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-850 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Isi Catatan</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Tuliskan butir kegiatan atau rekap..."
                          value={newNoteForm.body}
                          onChange={(e) => setNewNoteForm(prev => ({ ...prev, body: e.target.value }))}
                          className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-855 dark:text-white"
                        />
                      </div>

                      {/* Color Chooser */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">Warna Latar Belakang</label>
                        <div className="flex items-center space-x-2">
                          {[
                            { color: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200', name: 'Kuning Warm' },
                            { color: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200', name: 'Hijau Zen' },
                            { color: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200', name: 'Biru Calm' },
                            { color: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200', name: 'Merah Alert' }
                          ].map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() => setNewNoteForm(p => ({ ...p, color: c.color }))}
                              className={`w-6 h-6 rounded-full border transition cursor-pointer ${c.color} ${
                                newNoteForm.color === c.color ? 'ring-2 ring-emerald-500 scale-110' : 'opacity-80 hover:opacity-100'
                              }`}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="checkbox"
                          id="pinned-check"
                          checked={newNoteForm.pinned}
                          onChange={(e) => setNewNoteForm(p => ({ ...p, pinned: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                        />
                        <label htmlFor="pinned-check" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide cursor-pointer select-none">Sematan Utama (📌)</label>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 shadow-sm font-sans mt-3 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Simpan Catatan</span>
                      </button>
                    </form>

                    {/* Heavy Security Backup to Drive feature */}
                    <button
                      type="button"
                      disabled={apiLoading}
                      onClick={handleExportNotesToDrive}
                      className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Cadangkan Seluruh Catatan Ke Drive</span>
                    </button>
                  </div>

                  {/* Right Notes Rendering Column */}
                  <div className="lg:col-span-7 space-y-4 font-sans">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                      <div className="relative w-full max-w-xs">
                        <input
                          type="text"
                          placeholder="Cari kata kunci catatan..."
                          value={keepSearch}
                          onChange={(e) => setKeepSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-805 dark:text-white"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>

                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => setKeepMode('all')}
                          className={`px-3 py-1 border rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                            keepMode === 'all'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          Semua
                        </button>
                        <button
                          type="button"
                          onClick={() => setKeepMode('pinned')}
                          className={`px-3 py-1 border rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                            keepMode === 'pinned'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-slate-50 dark:bg-slate-905 border-slate-250 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          📌 Semat
                        </button>
                      </div>
                    </div>

                    {/* Filter local/remote mapping */}
                    {keepNotes.filter(n => {
                      const matchSearch = n.title.toLowerCase().includes(keepSearch.toLowerCase()) || n.body.toLowerCase().includes(keepSearch.toLowerCase());
                      const matchMode = keepMode === 'pinned' ? n.pinned : true;
                      return matchSearch && matchMode;
                    }).length === 0 ? (
                      <div className="p-8 text-center text-slate-400 border border-dashed border-slate-150 dark:border-slate-850 rounded-xl text-xs italic">
                        Tidak ada catatan Keep yang cocok dengan penyaringan pencarian Anda.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
                        {keepNotes.filter(n => {
                          const matchSearch = n.title.toLowerCase().includes(keepSearch.toLowerCase()) || n.body.toLowerCase().includes(keepSearch.toLowerCase());
                          const matchMode = keepMode === 'pinned' ? n.pinned : true;
                          return matchSearch && matchMode;
                        }).map((note) => (
                          <div
                            key={note.id}
                            className={`p-4 rounded-xl border transition relative flex flex-col justify-between hover:shadow-sm ${note.color}`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between pr-4">
                                <h5 className="font-bold text-slate-850 dark:text-slate-100 text-xs">
                                  {note.title}
                                </h5>
                                {note.pinned && (
                                  <span className="text-[10px]" title="Semat utama">📌</span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed pb-2">
                                {note.body}
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-400/15 dark:border-slate-400/5 pt-2.5 mt-3">
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                                {note.createdAt || 'Baru Saja'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteKeepNote(note.id, note.title)}
                                className="p-1 hover:bg-rose-100/30 rounded text-rose-600 hover:text-rose-700 cursor-pointer"
                                title="Hapus catatan"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Cloud SQL feedback notice */}
      <div className="p-4 bg-slate-100 dark:bg-slate-900/25 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-slate-800 dark:text-slate-350 text-xs">
        <h4 className="font-bold text-slate-900 dark:text-white flex items-center text-[11px] uppercase tracking-wider">
          <Database className="w-4 h-4 mr-1.5 text-slate-405" /> Catatan Layanan Cloud SQL
        </h4>
        <p className="leading-relaxed text-[11px]">
          Hubungan basis data relasional PostgreSQL instan via Cloud SQL dalam sistem ini tidak didukung di lingkungan sandbox (dikarenakan dependensi compiler internal). Tenang, karena aplikasi mempertahankan cadangan dan sinkronisasi data yang fungsional penuh menggunakan cadangan terenkripsi aman di Google Drive Anda!
        </p>
      </div>

      {/* Confirmation Modal */}
      {workspaceConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${workspaceConfirmModal.isDanger ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600' : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {workspaceConfirmModal.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Konfirmasi Tindakan
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {workspaceConfirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWorkspaceConfirmModal(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const act = workspaceConfirmModal.action;
                  setWorkspaceConfirmModal(null);
                  await act();
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition cursor-pointer ${
                  workspaceConfirmModal.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {workspaceConfirmModal.confirmText || 'Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
