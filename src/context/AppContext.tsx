import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isFirebaseConfigured } from '@/config/firebase';
import {
  addComment,
  createDate,
  deleteComment,
  deleteDate,
  listenDates,
  setDateStatus,
  updateDate,
  type DateDraft,
} from '@/services/dates';
import { createProfile, deleteProfile, listenProfiles, updateProfile } from '@/services/profiles';
import type { DateEntry, DateStatus, Profile } from '@/types';
import { isPlanned } from '@/types';

const PROFILE_KEY = '@ours/profileId';

type AppContextValue = {
  ready: boolean;
  isConfigured: boolean;
  error: string | null;
  profiles: Profile[];
  currentProfile: Profile | null;
  dates: DateEntry[];
  loggedDates: DateEntry[];
  plannedDates: DateEntry[];
  selectProfile: (profileId: string) => Promise<void>;
  signOutProfile: () => Promise<void>;
  addProfile: (name: string, photoUri?: string | null) => Promise<string>;
  saveProfile: (values: { name?: string; localPhotoUri?: string | null }) => Promise<void>;
  addDate: (draft: DateDraft) => Promise<string>;
  saveDate: (dateId: string, draft: DateDraft) => Promise<void>;
  addDateComment: (date: DateEntry, text: string) => Promise<void>;
  removeDateComment: (date: DateEntry, commentId: string) => Promise<void>;
  changeDateStatus: (dateId: string, status: DateStatus) => Promise<void>;
  removeDate: (dateId: string) => Promise<void>;
  removeProfile: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [dates, setDates] = useState<DateEntry[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    let active = true;
    const unsubscribers: (() => void)[] = [];

    AsyncStorage.getItem(PROFILE_KEY)
      .then((stored) => {
        if (!active) return;
        setProfileId(stored);
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });

    unsubscribers.push(
      listenProfiles(
        (next) => setProfiles(next),
        (listenError) => setError(listenError.message),
      ),
    );
    unsubscribers.push(
      listenDates(
        (next) => setDates(next),
        (listenError) => setError(listenError.message),
      ),
    );

    return () => {
      active = false;
      unsubscribers.forEach((stop) => stop());
    };
  }, []);

  const currentProfile = useMemo(
    () => profiles.find((profile) => profile.id === profileId) ?? null,
    [profiles, profileId],
  );

  const loggedDates = useMemo(() => dates.filter((item) => !isPlanned(item)), [dates]);
  const plannedDates = useMemo(
    () =>
      dates
        .filter(isPlanned)
        .slice()
        .sort((a, b) => a.happenedAt.getTime() - b.happenedAt.getTime()),
    [dates],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      isConfigured: isFirebaseConfigured,
      error,
      profiles,
      currentProfile,
      dates,
      loggedDates,
      plannedDates,
      selectProfile: async (id) => {
        setProfileId(id);
        await AsyncStorage.setItem(PROFILE_KEY, id);
      },
      signOutProfile: async () => {
        setProfileId(null);
        await AsyncStorage.removeItem(PROFILE_KEY);
      },
      addProfile: async (name, photoUri) => {
        const id = await createProfile(name, photoUri);
        setProfileId(id);
        await AsyncStorage.setItem(PROFILE_KEY, id);
        return id;
      },
      saveProfile: async (values) => {
        if (!currentProfile) throw new Error('No profile selected');
        await updateProfile(currentProfile.id, values);
      },
      addDate: async (draft) => {
        if (!currentProfile) throw new Error('No profile selected');
        return createDate(currentProfile.id, draft);
      },
      saveDate: async (dateId, draft) => {
        if (!currentProfile) throw new Error('No profile selected');
        await updateDate(dateId, currentProfile.id, draft);
      },
      addDateComment: async (date, text) => {
        if (!currentProfile) throw new Error('No profile selected');
        await addComment(date, currentProfile.id, text);
      },
      removeDateComment: async (date, commentId) => {
        if (!currentProfile) throw new Error('No profile selected');
        await deleteComment(date, commentId, currentProfile.id);
      },
      changeDateStatus: async (dateId, status) => {
        await setDateStatus(dateId, status);
      },
      removeDate: async (dateId) => {
        await deleteDate(dateId);
      },
      removeProfile: async () => {
        if (!currentProfile) throw new Error('No profile selected');
        await deleteProfile(currentProfile.id);
        setProfileId(null);
        await AsyncStorage.removeItem(PROFILE_KEY);
      },
    }),
    [currentProfile, dates, error, loggedDates, plannedDates, profiles, ready],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}
