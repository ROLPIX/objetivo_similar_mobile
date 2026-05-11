import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Constants from 'expo-constants';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Dimensions,
  Pressable,
  ActivityIndicator,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
  Animated,
  PanResponder,
  Modal,
  Switch
} from 'react-native';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  eachDayOfInterval,
  isToday,
  startOfDay,
  differenceInDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Home,
  Briefcase,
  Wallet,
  TrendingUp,
  Clock,
  User,
  Bell,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  HardHat,
  LogOut,
  Construction,
  Calendar,
  ShieldCheck,
  History,
  Scan,
  Plus,
  XCircle,
  Smartphone,
  FileBarChart,
  Circle,
  Menu,
  Wifi,
  WifiOff,
  CloudLightning,
  RefreshCw,
  Layers,
  Maximize2,
  Timer,
  FileText,
  CheckCircle,
  Circle as LucideCircle,
  BarChart3,
  AlertCircle,
  Lock,
  Key,
  ShieldAlert,
  Check,
  X,
  Loader2,
  Camera,
  QrCode,
  Sun,
  Moon,
  Rocket,
  Sparkles,
  Download,
  Settings,
  Edit2,
  Truck,
  Search,
  Hammer,
  Wrench,
  Users,
  Settings2,
  Trash2,
  Eye,
  Map as MapIcon,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { View as MotiView, AnimatePresence } from 'moti';
import { Svg, Circle as SvgCircle, Path } from 'react-native-svg';
import { usePersistentState, useSyncQueue } from './lib/offlineStore';
import { GestureHandlerRootView, PanGestureHandler, State, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';

// Firebase Imports
import {
  db,
  auth,
  googleProvider,
  handleFirestoreError,
  OperationType,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  deleteField,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  limit,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  FirebaseUser
} from './lib/firebase';
const loginBg = { uri: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop' };

// Types based on Backend Schema
type Tab = 'home' | 'projects' | 'attendance' | 'management' | 'profile';

export type AppRole = 'super_admin' | 'admin' | 'gestor' | 'colaborador';

interface AppUser {
  id: string; // uuid
  created_at?: string;
  updated_at?: string;
  email: string;
  password?: string; // Alterado de PIN para Password
  keycloak_user_id: string;
  active: boolean;
  role?: AppRole; // From metadata or Keycloak
  name?: string; // Mocked for UI
  avatar?: string;
  location_id?: string; // Construction site assignment
  can_manage_projects?: boolean;
  can_manage_employees?: boolean;
  can_view_all_locations?: boolean;
  can_view_users?: boolean;
  last_location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    accuracy: number;
    out_of_bounds: boolean;
    distance: number;
  };
}

interface WorkLocation {
  id: string; // uuid
  created_at?: string;
  updated_at?: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  active: boolean;
  // UI Display fields
  progress?: number;
  status?: string;
  image?: string;
  themeColor?: string;
  start_date?: string;
  end_date?: string;
}

interface TimeLog {
  id: string; // uuid
  created_at?: string;
  app_user_id: string;
  work_location_id?: string;
  device_id?: string;
  timestamp: string; // timestamptz
  type: 'check_in' | 'check_out' | 'lunch_start' | 'lunch_end';
  latitude: number;
  longitude: number;
  valid: boolean;
  // UI joins
  location_name?: string;
  employee_name?: string;
}

interface DailyAttendance {
  id: string; // uuid
  created_at?: string;
  updated_at?: string;
  app_user_id: string;
  work_location_id: string;
  attendance_date: string;
  first_check_in: string | null;
  last_check_out: string | null;
  status: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: number;
  isRead: boolean;
  app_user_id: string;
}

interface UserLocationHistory {
  id: string; // uuid
  keycloak_user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  source: string;
  timestamp: string; // timestamptz
}

interface Device {
  id: string; // uuid
  created_at: string; // timestamptz
  device_id: string;
  device_type: string;
  keycloak_user_id: string;
  last_seen_at: string; // timestamptz
  os: string;
  trusted: boolean;
}

interface LeaveRequest {
  id: string; // uuid
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
  approver_id: string;
  end_date: string; // date
  keycloak_user_id: string;
  reason: string;
  start_date: string; // date
  status: string;
  type: string;
}

interface OvertimeRequest {
  id: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  user_name: string;
  requested_by_id?: string;
  requested_by_name?: string;
  date: string;
  hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approver_id?: string;
}

interface AuditLog {
  id: string; // uuid
  action: string;
  entity: string;
  entity_id: string;
  ip_address: string;
  keycloak_user_id: string;
  metadata: any; // jsonb
  timestamp: string; // timestamptz
}

interface AttendancePolicy {
  id: string; // uuid
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
  allow_remote_work: boolean;
  max_allowed_distance_meters: number;
  max_late_minutes: number;
  require_geolocation: boolean;
}

interface WorkSchedule {
  id: string; // uuid
  active: boolean;
  day_of_week: string;
  end_time: string; // time
  keycloak_user_id: string;
  start_time: string; // time
}

const DEFAULT_USERS: AppUser[] = [
  { id: 'usr-super', email: 'superadmin@objetivo.pt', password: 'admin123', keycloak_user_id: 'kc-super', active: true, name: 'Super Admin', role: 'super_admin' },
  { id: 'usr-admin', email: 'admin@objetivo.pt', password: 'admin123', keycloak_user_id: 'kc-admin', active: true, name: 'Administrador', role: 'admin' },
  { id: 'usr-gestor', email: 'gestor@objetivo.pt', password: 'gestor123', keycloak_user_id: 'kc-gestor', active: true, name: 'Gestor de Obra', role: 'gestor' },
  { id: 'usr-colab', email: 'colaborador@objetivo.pt', password: 'colab123', keycloak_user_id: 'kc-colab', active: true, name: 'Colaborador', role: 'colaborador' },
];

const INITIAL_TIME_LOGS: TimeLog[] = [
  { id: 'log-1', app_user_id: 'usr-2', timestamp: '2026-04-19T08:00:00Z', type: 'check_in', latitude: 38.7223, longitude: -9.1393, valid: true, employee_name: 'Ana Soares', location_name: 'Sede' },
  { id: 'log-2', app_user_id: 'usr-1', timestamp: '2026-04-19T08:15:00Z', type: 'check_in', latitude: 38.7071, longitude: -9.1355, valid: true, employee_name: 'João Pereira', location_name: 'Obra Tejo' },
];

const INITIAL_ATTENDANCES: DailyAttendance[] = [
  { id: 'att-1', app_user_id: 'usr-2', work_location_id: 'loc-1', attendance_date: '2026-04-18', first_check_in: '2026-04-18T08:00:00Z', last_check_out: '2026-04-18T17:00:00Z', status: 'present' },
];

const WORK_LOCATIONS: WorkLocation[] = [
  {
    id: 'loc-1',
    name: 'Ponte do Tejo II',
    latitude: 38.7223,
    longitude: -9.1393,
    radius_meters: 500,
    active: true,
    progress: 75,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?q=80&w=800&auto=format&fit=crop',
    themeColor: '#00aeef',
  },
  {
    id: 'loc-2',
    name: 'Edifício Horizonte',
    latitude: 41.1579,
    longitude: -8.6291,
    radius_meters: 200,
    active: true,
    progress: 30,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=800&auto=format&fit=crop',
    themeColor: '#f0cc4a',
  }
];

const REALISTIC_IMAGES = [
  'https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1481253127861-534498168948?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop'
];

const BarChart = ({ data, isDarkMode }: { data: { label: string, value: number }[], isDarkMode: boolean }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const height = 100;

  return (
    <View style={{ height: height + 40, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 4 }}>
      {data.map((item, i) => (
        <View key={i} style={{ alignItems: 'center', flex: 1 }}>
          <MotiView
            from={{ height: 0, opacity: 0 }}
            animate={{ height: (item.value / max) * height, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 100, delay: i * 80 }}
            style={{
              width: '60%',
              backgroundColor: i === data.length - 1 ? '#00aeef' : (isDarkMode ? '#334155' : '#E2E8F0'),
              borderRadius: 4,
              borderWidth: 1,
              borderColor: i === data.length - 1 ? 'rgba(255,255,255,0.2)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
              shadowColor: i === data.length - 1 ? '#00aeef' : 'transparent',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: i === data.length - 1 ? 6 : 0
            }}
          />
          <Text style={{ fontSize: 9, color: isDarkMode ? 'rgba(255,255,255,0.4)' : '#64748B', marginTop: 10, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'JetBrains Mono' : 'monospace' }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
  ;

// Haversine formula to calculate distance in meters between two coordinates
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

const PunchConfirmationModal = ({
  type,
  onConfirm,
  onCancel,
  isDarkMode,
  coords,
  locationName
}: {
  type: 'check_in' | 'check_out',
  onConfirm: () => void,
  onCancel: () => void,
  isDarkMode: boolean,
  coords: { latitude: number, longitude: number } | null,
  locationName: string
}) => {
  return (
    <Modal visible={true} animationType="fade" transparent={true}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 }}>
        <MotiView
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ backgroundColor: isDarkMode ? '#0B101B' : 'white', borderRadius: 32, padding: 24, alignItems: 'center' }}
        >
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: type === 'check_in' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: type === 'check_in' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
            {type === 'check_in' ? <MapPin size={40} color="#10b981" /> : <LogOut size={40} color="#ef4444" />}
          </View>

          <Text style={{ fontSize: 28, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c', textAlign: 'center', letterSpacing: -0.5 }}>
            {type === 'check_in' ? 'Registrar Entrada' : 'Registrar Saída'}
          </Text>

          <View style={{ height: 1, width: 40, backgroundColor: '#00A3FF', marginVertical: 12, borderRadius: 2 }} />

          <Text style={{ fontSize: 14, color: isDarkMode ? '#94A3B8' : '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 20, paddingHorizontal: 20 }}>
            Validamos sua posição geográfica com sucesso para o estaleiro selecionado.
          </Text>

          {coords && (
            <View style={{ width: '100%', height: 150, borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.002,
                  longitudeDelta: 0.002,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker coordinate={{ latitude: coords.latitude, longitude: coords.longitude }}>
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#00A3FF', borderWidth: 3, borderColor: 'white' }} />
                </Marker>
              </MapView>
              <View style={{ position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: 'rgba(20,35,60,0.85)', padding: 8, borderRadius: 10 }}>
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>{locationName}</Text>
              </View>
            </View>
          )}

          <View style={{ width: '100%', gap: 12 }}>
            <TouchableOpacity
              onPress={onConfirm}
              style={{ backgroundColor: type === 'check_in' ? '#10b981' : '#ef4444', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>CONFIRMAR AGORA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCancel}
              style={{ height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 14 }}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

const ProjectDetailsModal = ({ project, onClose, isDarkMode, employeesList, timeLogs }: { project: WorkLocation, onClose: () => void, isDarkMode: boolean, employeesList: AppUser[], timeLogs: TimeLog[] }) => {
  // calculate how many employees are currently clocked in at this project
  const activeEmployees = employeesList.filter(emp => {
    const logs = timeLogs.filter(l => l.app_user_id === emp.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return logs.length > 0 && (logs[0].type === 'check_in' || logs[0].type === 'lunch_start' || logs[0].type === 'lunch_end') && logs[0].work_location_id === project.id && logs[0].type !== 'lunch_start';
  }).length;

  const totalAssigned = employeesList.filter(emp => emp.location_id === project.id).length;

  const startDateText = project.start_date ? format(new Date(project.start_date), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Não definida';
  if (!project) return null;

  return (
    <Modal visible={true} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <MotiView
          from={{ translateY: 500 }}
          animate={{ translateY: 0 }}
          style={{ height: '80%', backgroundColor: isDarkMode ? '#0B101B' : 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}
        >
          <View style={{ width: 40, height: 4, backgroundColor: isDarkMode ? '#334155' : '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c', letterSpacing: -0.5 }}>{project.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: project.active ? '#10b981' : '#64748B' }} />
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '800', textTransform: 'uppercase' }}>{project.status === 'active' ? 'ESTALEIRO ATIVO' : 'OBRA CONCLUÍDA'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
              <X size={24} color={isDarkMode ? 'white' : '#64748B'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ height: 180, borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: project.latitude,
                  longitude: project.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
              >
                <Marker coordinate={{ latitude: project.latitude, longitude: project.longitude }}>
                  <View style={{ backgroundColor: project.themeColor || '#00A3FF', padding: 10, borderRadius: 20, borderWidth: 3, borderColor: 'white' }}>
                    <Construction size={18} color="white" />
                  </View>
                </Marker>
              </MapView>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1, backgroundColor: isDarkMode ? '#14233c' : '#f8fafc', padding: 16, borderRadius: 20 }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#64748B', marginBottom: 8 }}>PROGRESSO</Text>
                <Text style={{ fontSize: 24, fontWeight: '900', color: project.themeColor || '#00A3FF' }}>{project.progress}%</Text>
                <View style={{ height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, marginTop: 8 }}>
                  <View style={{ width: `${project.progress}%`, height: '100%', backgroundColor: project.themeColor || '#00A3FF', borderRadius: 2 }} />
                </View>
              </View>
              <View style={{ flex: 1, backgroundColor: isDarkMode ? '#14233c' : '#f8fafc', padding: 16, borderRadius: 20 }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#64748B', marginBottom: 8 }}>RAIO GEOGRÁFICO</Text>
                <Text style={{ fontSize: 24, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c' }}>{project.radius_meters}m</Text>
                <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Controle de perímetro</Text>
              </View>
            </View>

            <View style={{ backgroundColor: isDarkMode ? '#14233c' : '#f8fafc', padding: 20, borderRadius: 20, gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MapPin size={20} color="#64748B" />
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B' }}>COORDENADAS</Text>
                  <Text style={{ fontSize: 13, color: isDarkMode ? 'white' : '#14233c', fontWeight: '600' }}>{project.latitude.toFixed(6)}, {project.longitude.toFixed(6)}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Calendar size={20} color="#64748B" />
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B' }}>DATA DE INÍCIO</Text>
                  <Text style={{ fontSize: 13, color: isDarkMode ? 'white' : '#14233c', fontWeight: '600' }}>{startDateText}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Users size={20} color="#64748B" />
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B' }}>EQUIPA ALOCADA</Text>
                  <Text style={{ fontSize: 13, color: isDarkMode ? 'white' : '#14233c', fontWeight: '600' }}>{activeEmployees} {totalAssigned > 0 ? `de ${totalAssigned} trabalhadores no local` : (activeEmployees === 1 ? 'trabalhador no local' : 'trabalhadores no local')}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={{ backgroundColor: '#00A3FF', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 40 }}>
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>GERAR RELATÓRIO PDF</Text>
            </TouchableOpacity>
          </ScrollView>
        </MotiView>
      </View>
    </Modal>
  );
};

const LocationHistoryMap = ({
  log,
  onClose,
  isDarkMode,
  history = [],
  users = []
}: {
  log: TimeLog,
  onClose: () => void,
  isDarkMode: boolean,
  history?: UserLocationHistory[],
  users?: AppUser[]
}) => {
  if (!log.latitude || !log.longitude) return null;

  // Find user to get keycloak_user_id for filtering history
  const user = users.find(u => u.id === log.app_user_id);

  // Filter history for this user and same day
  const logDate = new Date(log.timestamp);
  const trajectory = useMemo(() => {
    if (!user) return [];
    return history
      .filter(h =>
        h.keycloak_user_id === user.keycloak_user_id &&
        isSameDay(new Date(h.timestamp), logDate)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(h => ({ latitude: h.latitude, longitude: h.longitude }));
  }, [history, user, logDate]);

  const hasTrajectory = trajectory.length > 1;

  return (
    <Modal visible={true} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <MotiView
          from={{ translateY: 500 }}
          animate={{ translateY: 0 }}
          style={{ height: '85%', backgroundColor: isDarkMode ? '#0B101B' : 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}
        >
          <View style={{ width: 40, height: 6, backgroundColor: isDarkMode ? '#14233c' : '#f1f5f9', borderRadius: 3, alignSelf: 'center', marginBottom: 20 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 26, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c', letterSpacing: -1 }}>Detalhes do Registo</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#00A3FF', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={12} color="white" />
                </View>
                <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '600' }}>
                  {log.employee_name || 'Funcionário'} <Text style={{ color: isDarkMode ? 'rgba(255,255,255,0.2)' : '#CBD5E1' }}>|</Text> {format(new Date(log.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0' }}>
              <X size={24} color={isDarkMode ? 'white' : '#64748B'} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: log.latitude,
                longitude: log.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <Marker coordinate={{ latitude: log.latitude, longitude: log.longitude }} title="Local do Ponto">
                <View style={{
                  backgroundColor: log.type === 'check_in' ? '#10b981' : '#FE4A49',
                  padding: 10,
                  borderRadius: 25,
                  borderWidth: 4,
                  borderColor: 'white',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                  elevation: 8
                }}>
                  {log.type === 'check_in' ? <Check size={20} color="white" /> : <LogOut size={20} color="white" />}
                </View>
              </Marker>

              {hasTrajectory && (
                <Marker coordinate={trajectory[0]} title="Início Movimento">
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#00aeef', borderWidth: 2, borderColor: 'white' }} />
                </Marker>
              )}
            </MapView>

            {hasTrajectory && (
              <View style={{ position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,174,239,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>TRAJETÓRIA DISPONÍVEL</Text>
              </View>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 16 }}>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: isDarkMode ? '#14233c' : '#f8fafc', padding: 16, borderRadius: 20 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>TIPO DE EVENTO</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: log.type === 'check_in' ? '#10b981' : '#FE4A49' }} />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: isDarkMode ? 'white' : '#14233c' }}>{log.type === 'check_in' ? 'Entrada' : 'Saída'}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, backgroundColor: isDarkMode ? '#14233c' : '#f8fafc', padding: 16, borderRadius: 20 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>VALIDAÇÃO GPS</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={14} color={log.valid ? '#10b981' : '#FE4A49'} />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: isDarkMode ? 'white' : '#14233c' }}>{log.valid ? 'Verificado' : 'Inválido'}</Text>
                  </View>
                </View>
              </View>

              <View style={{ backgroundColor: isDarkMode ? '#14233c' : '#f8fafc', padding: 16, borderRadius: 20 }}>
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0, 174, 239, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={22} color="#00aeef" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#00aeef', textTransform: 'uppercase', marginBottom: 2 }}>LOCALIZAÇÃO CAPTURADA</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isDarkMode ? 'white' : '#14233c' }}>{log.location_name || 'Desconhecido'}</Text>
                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Precisão GPS: ~5.0 metros</Text>
                  </View>
                </View>
              </View>

              <View style={{ backgroundColor: isDarkMode ? '#14233c' : '#f8fafc', padding: 16, borderRadius: 20 }}>
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(100, 116, 139, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={22} color={isDarkMode ? 'white' : '#64748B'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>DISPOSITIVO</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? 'white' : '#14233c' }}>App Mobile OS v2.4</Text>
                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>ID: {log.device_id || 'dev-prod-x'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </MotiView>
      </View>
    </Modal>
  );
};

const EmployeeDetailModal = ({
  user,
  onClose,
  isDarkMode,
  timeLogs = [],
  workLocations = [],
  showNotification,
  isAdmin,
  isManager,
  onUpdateUser,
  onDeleteEmployee,
  onRequestOvertime
}: {
  user: AppUser,
  onClose: () => void,
  isDarkMode: boolean,
  timeLogs?: TimeLog[],
  workLocations?: WorkLocation[],
  showNotification: (title: string, message: string, type: 'success' | 'error' | 'warning') => void,
  isAdmin?: boolean,
  isManager?: boolean,
  onUpdateUser?: (uid: string, data: Partial<AppUser>) => Promise<void>,
  onDeleteEmployee?: (uid: string, name: string) => Promise<void>,
  onRequestOvertime?: (targetId: string, targetName: string, date: string, hours: number, reason: string) => Promise<void>
}) => {
  const [showOvertimeForm, setShowOvertimeForm] = useState(false);
  const [overtimeDate, setOvertimeDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [overtimeHours, setOvertimeHours] = useState('2');
  const [overtimeReason, setOvertimeReason] = useState('');

  const userLogs = useMemo(() => {
    return timeLogs
      .filter(l => l.app_user_id === user.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [timeLogs, user.id]);

  const stats = useMemo(() => {
    const todayLogs = userLogs.filter(l => isToday(new Date(l.timestamp)));
    const weekLogs = userLogs.filter(l => {
      const date = new Date(l.timestamp);
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      return date >= weekStart;
    });

    return {
      todayCount: todayLogs.length,
      weekCount: weekLogs.length,
      lastSeen: userLogs.length > 0 ? format(new Date(userLogs[0].timestamp), "dd MMM, HH:mm", { locale: ptBR }) : 'Nunca'
    };
  }, [userLogs]);

  const userWork = workLocations.find(l => l.id === user.location_id);

  return (
    <Modal visible={true} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <MotiView
          from={{ translateY: 600 }}
          animate={{ translateY: 0 }}
          style={{ height: '90%', backgroundColor: isDarkMode ? '#0B101B' : 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}
        >
          <View style={{ width: 40, height: 4, backgroundColor: isDarkMode ? '#334155' : '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: userWork?.themeColor || '#00A3FF', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }}>
                <User size={32} color="white" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c', letterSpacing: -0.5 }}>{user.name}</Text>
                  {user.last_location?.out_of_bounds && (
                    <MotiView
                      from={{ opacity: 0.4, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ loop: true, type: 'timing', duration: 1000 }}
                      style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10 }}
                    />
                  )}
                </View>
                <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>{user.email}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {isManager && user.role !== 'super_admin' && (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      "Remover Funcionário",
                      `Tem certeza que deseja remover ${user.name} do sistema? esta ação é irreversível.`,
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Remover",
                          style: "destructive",
                          onPress: () => {
                            onDeleteEmployee?.(user.id, user.name || '');
                            onClose();
                          }
                        }
                      ]
                    );
                  }}
                  style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={22} color="#ef4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                <X size={24} color={isDarkMode ? 'white' : '#64748B'} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Quick Stats */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <View style={{ flex: 1, backgroundColor: isDarkMode ? '#14233c' : '#F8FAFC', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#64748B', marginBottom: 4 }}>PONTOS ESTA SEMANA</Text>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#00A3FF' }}>{stats.weekCount}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: isDarkMode ? '#14233c' : '#F8FAFC', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#64748B', marginBottom: 4 }}>ÚLTIMA ATIVIDADE</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: isDarkMode ? 'white' : '#14233c', marginTop: 10 }}>{stats.lastSeen}</Text>
              </View>
            </View>

            {/* Profile Info Card */}
            <View style={{ backgroundColor: isDarkMode ? '#14233c' : '#F8FAFC', padding: 20, borderRadius: 28, gap: 16, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,163,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} color="#00A3FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#64748B' }}>NÍVEL DE ACESSO</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: isDarkMode ? 'white' : '#14233c' }}>{user.role?.toUpperCase() || 'COLABORADOR'}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                  <Construction size={20} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#64748B' }}>ALOCAÇÃO ATUAL</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: isDarkMode ? 'white' : '#14233c' }}>{userWork?.name || 'Não Alocado'}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: user.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                  {user.active ? <CheckCircle size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#64748B' }}>STATUS DO PERFIL</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: user.active ? '#10b981' : '#ef4444' }}>{user.active ? 'ATIVO NO SISTEMA' : 'ACESSO BLOQUEADO'}</Text>
                </View>
              </View>

              {isAdmin && (
                <View style={{ borderTopWidth: 1, borderTopColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#e2e8f0', paddingTop: 16, gap: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#64748B' }}>PERMISSÕES ESPECIAIS</Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? 'white' : '#14233c' }}>Ver Todas as Obras</Text>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>Permite visualizar o mapa global</Text>
                    </View>
                    <Switch
                      value={user.can_view_all_locations}
                      onValueChange={(val) => onUpdateUser?.(user.id, { can_view_all_locations: val })}
                      trackColor={{ false: '#cbd5e1', true: '#00A3FF' }}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? 'white' : '#14233c' }}>Ver Funcionários</Text>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>Permite visualizar a lista da equipa</Text>
                    </View>
                    <Switch
                      value={user.can_view_users}
                      onValueChange={(val) => onUpdateUser?.(user.id, { can_view_users: val })}
                      trackColor={{ false: '#cbd5e1', true: '#00A3FF' }}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? 'white' : '#14233c' }}>Gerir Obras</Text>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>Permite criar e editar localizações</Text>
                    </View>
                    <Switch
                      value={user.can_manage_projects}
                      onValueChange={(val) => onUpdateUser?.(user.id, { can_manage_projects: val })}
                      trackColor={{ false: '#cbd5e1', true: '#00A3FF' }}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? 'white' : '#14233c' }}>Gerir Funcionários</Text>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>Permite adicionar e remover pessoas</Text>
                    </View>
                    <Switch
                      value={user.can_manage_employees}
                      onValueChange={(val) => onUpdateUser?.(user.id, { can_manage_employees: val })}
                      trackColor={{ false: '#cbd5e1', true: '#00A3FF' }}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Overtime Request Module */}
            {isManager && (
              <View style={{ marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={() => setShowOvertimeForm(!showOvertimeForm)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,163,255,0.1)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, alignSelf: 'flex-start' }}
                >
                  <Plus size={16} color="#00A3FF" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#00A3FF' }}>PEDIR HORA EXTRA PARA ESTE FUNCIONÁRIO</Text>
                </TouchableOpacity>

                {showOvertimeForm && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', borderRadius: 24, padding: 20, marginTop: 12, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c', marginBottom: 16 }}>Solicitar Hora Extra</Text>

                    <View style={{ gap: 12 }}>
                      <View>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>DATA</Text>
                        <TextInput
                          style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', color: isDarkMode ? 'white' : 'black', padding: 12, borderRadius: 12 }]}
                          value={overtimeDate}
                          onChangeText={setOvertimeDate}
                          placeholder="YYYY-MM-DD"
                        />
                      </View>
                      <View>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>HORAS</Text>
                        <TextInput
                          style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', color: isDarkMode ? 'white' : 'black', padding: 12, borderRadius: 12 }]}
                          value={overtimeHours}
                          onChangeText={setOvertimeHours}
                          keyboardType="numeric"
                          placeholder="2"
                        />
                      </View>
                      <View>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>MOTIVO / OBRA</Text>
                        <TextInput
                          style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', color: isDarkMode ? 'white' : 'black', padding: 12, borderRadius: 12 }]}
                          value={overtimeReason}
                          onChangeText={setOvertimeReason}
                          placeholder="Ex: Finalização de laje"
                        />
                      </View>

                      <TouchableOpacity
                        style={{ backgroundColor: '#00A3FF', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
                        onPress={() => {
                          onRequestOvertime?.(user.id, user.name || user.email, overtimeDate, parseFloat(overtimeHours) || 2, overtimeReason);
                          setShowOvertimeForm(false);
                          setOvertimeReason('');
                        }}
                      >
                        <Text style={{ color: 'white', fontWeight: '900' }}>ENVIAR PEDIDO AO FUNCIONÁRIO</Text>
                      </TouchableOpacity>
                    </View>
                  </MotiView>
                )}
              </View>
            )}

            {/* Attendance History */}
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#64748B', letterSpacing: 1, marginBottom: 16, marginLeft: 4 }}>HISTÓRICO RECENTE DE PONTO</Text>

            <View style={{ gap: 12, marginBottom: 40 }}>
              {userLogs.length > 0 ? userLogs.slice(0, 15).map(log => (
                <View key={log.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'white', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: log.type === 'check_in' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                    {log.type === 'check_in' ? <Clock size={18} color="#10b981" /> : <LogOut size={18} color="#ef4444" />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isDarkMode ? 'white' : '#14233c' }}>{log.type === 'check_in' ? 'Entrada' : 'Saída'}</Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>{log.location_name || 'Obra Desconhecida'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: isDarkMode ? 'white' : '#14233c', fontFamily: Platform.OS === 'ios' ? 'JetBrains Mono' : 'monospace' }}>{format(new Date(log.timestamp), 'HH:mm')}</Text>
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>{format(new Date(log.timestamp), 'dd/MM/yyyy')}</Text>
                  </View>
                </View>
              )) : (
                <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={40} color={isDarkMode ? '#334155' : '#E2E8F0'} strokeWidth={1} />
                  <Text style={{ color: '#64748B', fontSize: 13, marginTop: 12 }}>Nenhum registo encontrado.</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#14233c', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
              onPress={async () => {
                try {
                  showNotification('Gerando PDF', 'Preparando relatório individual...', 'success');
                  const qrData = JSON.stringify({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    date: new Date().toISOString(),
                    type: 'INDIVIDUAL_FREQUENCIA'
                  });
                  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

                  const sortedLogs = [...userLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                  const htmlContent = `
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <style>
                          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                          body { 
                            font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                            padding: 30px; 
                            color: #1e293b; 
                            line-height: 1.5;
                          }
                          .top-bar {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            margin-bottom: 40px;
                            border-bottom: 2px solid #00bff3;
                            padding-bottom: 20px;
                          }
                          .company-info {
                            flex: 1;
                          }
                          .logo {
                            max-width: 250px;
                            height: auto;
                            margin-bottom: 10px;
                          }
                          .company-name {
                            color: #14233c;
                            font-size: 18px;
                            font-weight: 700;
                            text-transform: uppercase;
                            margin: 0;
                          }
                          .company-subtitle {
                            color: #64748b;
                            font-size: 10px;
                            margin: 2px 0 0;
                          }
                          .report-title {
                            text-align: right;
                            flex: 1;
                          }
                          .report-title h1 {
                            margin: 0;
                            color: #14233c;
                            font-size: 22px;
                            font-weight: 700;
                          }
                          .report-title p {
                            margin: 5px 0 0;
                            color: #00bff3;
                            font-size: 12px;
                            font-weight: 700;
                            letter-spacing: 1px;
                          }
                          .qr-img { 
                            width: 80px; 
                            height: 80px; 
                            padding: 5px; 
                            border: 1px solid #e2e8f0;
                            border-radius: 8px;
                            margin-top: 10px;
                          }
                          .info-section { 
                            display: flex;
                            gap: 40px;
                            margin-bottom: 30px;
                            background: #f8fafc;
                            padding: 20px;
                            border-radius: 12px;
                          }
                          .user-info { flex: 2; }
                          .user-info h2 { 
                            font-size: 16px; 
                            margin: 0 0 15px 0; 
                            color: #14233c;
                            border-left: 4px solid #00bff3;
                            padding-left: 10px;
                          }
                          .info-grid { 
                            display: grid; 
                            grid-template-columns: 1fr 1fr; 
                            gap: 15px; 
                            font-size: 12px; 
                          }
                          .info-item label {
                            display: block;
                            color: #64748b;
                            font-size: 10px;
                            text-transform: uppercase;
                            font-weight: 700;
                            margin-bottom: 2px;
                          }
                          .info-item span {
                            color: #1e293b;
                            font-weight: 600;
                          }
                          table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-top: 20px; 
                            font-size: 11px; 
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                          }
                          th { 
                            background: #14233c; 
                            color: white;
                            text-align: left; 
                            padding: 12px 15px; 
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                          }
                          td { 
                            padding: 10px 15px; 
                            border-bottom: 1px solid #f1f5f9; 
                            color: #334155;
                          }
                          tr:nth-child(even) { background-color: #f8fafc; }
                          .type-badge {
                            display: inline-block;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-weight: 700;
                            font-size: 9px;
                          }
                          .type-in { background: #dcfce7; color: #166534; }
                          .type-out { background: #fee2e2; color: #991b1b; }
                          .footer { 
                            margin-top: 50px; 
                            text-align: center; 
                            font-size: 9px; 
                            color: #94a3b8; 
                            border-top: 1px solid #f1f5f9; 
                            padding-top: 20px; 
                          }
                          .watermark {
                            position: fixed;
                            bottom: 20px;
                            right: 20px;
                            font-size: 8px;
                            color: #cbd5e1;
                          }
                        </style>
                      </head>
                      <body>
                        <div class="top-bar">
                          <div class="company-info">
                            <img src="https://firebasestorage.googleapis.com/v0/b/objetivo-similar-mobile.appspot.com/o/public%2Flogo_empresa.png?alt=media" class="logo" onerror="this.src='https://placehold.co/250x80/14233c/ffffff?text=OBJETIVO+SIMILAR'"/>
                            <p class="company-subtitle">CONSTRUÇÃO CIVIL E ENGENHARIA</p>
                          </div>
                          <div class="report-title">
                            <h1>CONTROLO DE FREQUÊNCIA</h1>
                            <p>RELATÓRIO INDIVIDUAL DE ATIVIDADE</p>
                            <img src="${qrCodeUrl}" class="qr-img" />
                          </div>
                        </div>
                        
                        <div class="info-section">
                          <div class="user-info">
                            <h2>DETALHES DO COLABORADOR</h2>
                            <div class="info-grid">
                              <div class="info-item">
                                <label>Nome Completo</label>
                                <span>${user.name?.toUpperCase() || 'N/A'}</span>
                              </div>
                              <div class="info-item">
                                <label>Email Profissional</label>
                                <span>${user.email}</span>
                              </div>
                              <div class="info-item">
                                <label>Função / Nível</label>
                                <span>${user.role?.toUpperCase() || 'COLABORADOR'}</span>
                              </div>
                              <div class="info-item">
                                <label>Obra Ativa</label>
                                <span>${userWork?.name || 'CENTRAL / SEDE'}</span>
                              </div>
                            </div>
                          </div>
                          <div class="info-item" style="text-align: right; min-width: 120px;">
                            <label>Emissão</label>
                            <span>${format(new Date(), 'dd/MM/yyyy')}</span><br/>
                            <span style="font-size: 10px; color: #64748b;">${format(new Date(), 'HH:mm:ss')}</span>
                          </div>
                        </div>
 
                        <table>
                          <thead>
                            <tr>
                              <th style="width: 20%">DATA</th>
                              <th style="width: 15%">HORA</th>
                              <th style="width: 20%">REGISTO</th>
                              <th style="width: 45%">OBRA / LOCALIZAÇÃO</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${sortedLogs.map(log => {
                    const d = new Date(log.timestamp);
                    return `
                                <tr>
                                  <td>${format(d, 'dd/MM/yyyy')}</td>
                                  <td><strong>${format(d, 'HH:mm')}</strong></td>
                                  <td>
                                    <span class="type-badge ${log.type === 'check_in' ? 'type-in' : 'type-out'}">
                                      ${log.type === 'check_in' ? 'ENTRADA' : 'SAÍDA'}
                                    </span>
                                  </td>
                                  <td>${log.location_name || 'LOCAL NÃO IDENTIFICADO'}</td>
                                </tr>
                              `;
                  }).join('')}
                          </tbody>
                        </table>
 
                        <div class="footer">
                          Este documento é gerado automaticamente pelo Sistema de Gestão de Presenças Objetivo Similar Lda.<br/>
                          A validade jurídica deste extracto pode ser verificada através da leitura do QR Code acima.
                        </div>
                        <div class="watermark">Gerado via Objetivo Similar App</div>
                      </body>
                    </html>
                  `;

                  const { uri } = await Print.printToFileAsync({ html: htmlContent });

                  if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    const pdfName = `Relacao_Ponto_${user.name.replace(/\s+/g, '_')}.pdf`;
                    const newUri = FileSystem.cacheDirectory + pdfName;
                    await FileSystem.deleteAsync(newUri, { idempotent: true });
                    await FileSystem.moveAsync({
                      from: uri,
                      to: newUri,
                    });
                    await Sharing.shareAsync(newUri, {
                      UTI: 'com.adobe.pdf',
                      mimeType: 'application/pdf',
                      dialogTitle: 'Compartilhar Relatório'
                    });
                  } else {
                    // Fallback for web if needed, though expo-print handles it
                    const pdfName = `Relacao_Ponto_${user.name.replace(/\s+/g, '_')}.pdf`;
                    await Print.printAsync({ html: htmlContent });
                    showNotification('Sucesso', 'Relatório gerado com sucesso!', 'success');
                  }
                } catch (error) {
                  console.error(error);
                  showNotification('Erro', 'Falha ao gerar o relatório.', 'error');
                }
              }}
            >
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>EXPORTAR RELATÓRIO PDF</Text>
            </TouchableOpacity>
          </ScrollView>
        </MotiView>
      </View>
    </Modal>
  );
};

const ChangePasswordModal = ({
  visible,
  onClose,
  onSave,
  isDarkMode
}: {
  visible: boolean,
  onClose: () => void,
  onSave: (pwd: string) => Promise<void>,
  isDarkMode: boolean
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async () => {
    console.log('ChangePasswordModal: handleUpdate triggered');
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Erro", "A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As palavras-passe não coincidem.");
      return;
    }

    setLoading(true);
    try {
      console.log('ChangePasswordModal: calling onSave...');
      await onSave(newPassword);
      console.log('ChangePasswordModal: onSave successful');
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      // Auto close after 2.5 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      console.log('ChangePasswordModal: onSave failed:', err.message);
      Alert.alert("Erro na Atualização", err.message || "Não foi possível atualizar a palavra-passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' }}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              Keyboard.dismiss();
              // Optionally close on backdrop press, but maybe better not to for password forms
            }}
          />
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <MotiView
              from={{ opacity: 0, scale: 0.9, translateY: 30 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              style={{
                backgroundColor: isDarkMode ? '#1e293b' : 'white',
                borderRadius: 28,
                padding: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 10
              }}
            >
              {success ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ alignItems: 'center', paddingVertical: 20 }}
                >
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Check size={32} color="white" />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c', marginBottom: 8, textAlign: 'center' }}>Atualizada!</Text>
                  <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center' }}>A tua nova palavra-passe foi guardada. Receberás um e-mail em breve.</Text>
                </MotiView>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c' }}>Alterar Palavra-passe</Text>
                    <TouchableOpacity
                      onPress={onClose}
                      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={20} color={isDarkMode ? 'white' : '#64748B'} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ gap: 16, marginBottom: 24 }}>
                    <View>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#00aeef', marginBottom: 8, textTransform: 'uppercase' }}>Nova Palavra-passe</Text>
                      <View style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>
                        <Lock size={18} color="#64748B" />
                        <TextInput
                          secureTextEntry={!showPassword}
                          value={newPassword}
                          onChangeText={setNewPassword}
                          placeholder="Mínimo 6 caracteres"
                          placeholderTextColor="#94A3B8"
                          style={{ flex: 1, marginLeft: 12, color: isDarkMode ? 'white' : '#14233c', fontSize: 15 }}
                        />
                        <TouchableOpacity style={{ padding: 10 }} onPress={() => setShowPassword(!showPassword)}>
                          <Eye size={18} color={showPassword ? '#00aeef' : '#64748B'} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>Confirmar Palavra-passe</Text>
                      <View style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>
                        <Lock size={18} color="#64748B" />
                        <TextInput
                          secureTextEntry={!showPassword}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          placeholder="Repetir palavra-passe"
                          placeholderTextColor="#94A3B8"
                          style={{ flex: 1, marginLeft: 12, color: isDarkMode ? 'white' : '#14233c', fontSize: 15 }}
                        />
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleUpdate}
                    disabled={loading}
                    style={{
                      backgroundColor: '#00aeef',
                      height: 56,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: loading ? 0.7 : 1,
                      shadowColor: '#00aeef',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>ATUALIZAR AGORA</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </MotiView>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const ServerConfigModal = ({
  visible,
  onClose,
  apiUrl,
  onSave,
  isDarkMode
}: {
  visible: boolean,
  onClose: () => void,
  apiUrl: string | null,
  onSave: (url: string | null) => void,
  isDarkMode: boolean
}) => {
  const [url, setUrl] = useState(apiUrl || '');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 }}
        >
          <Text style={{ fontSize: 20, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c', marginBottom: 8 }}>Configuração de Servidor</Text>
          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
            Utilize esta opção se estiver a testar o backend localmente no seu computador (via Metro/Expo Go).
          </Text>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#00aeef', marginBottom: 8 }}>API URL OVERRIDE</Text>
            <View style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 48, justifyContent: 'center', borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }}>
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="http://192.168.x.x:3000"
                placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.3)' : '#94A3B8'}
                style={{ color: isDarkMode ? 'white' : '#14233c', fontSize: 14 }}
                autoCapitalize="none"
              />
            </View>
            <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 8 }}>
              Ex: http://192.168.1.100:3000. Deixe vazio para usar a deteção automática.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: '700' }}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onSave(url.trim() || null);
                onClose();
              }}
              style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: '#00aeef', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: 'white', fontWeight: '900' }}>GUARDAR</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

// Removed AnimatedBackground

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<AppRole>('colaborador');
  const isGestorOnly = userRole === 'gestor';
  const isAdmin = ['super_admin', 'admin'].includes(userRole);
  const isWorker = userRole === 'colaborador';
  const isGestor = ['super_admin', 'admin', 'gestor'].includes(userRole);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const currentUserRef = useRef<AppUser | null>(null);
  const canManageSomething = isAdmin || currentUser?.can_manage_projects || currentUser?.can_manage_employees || currentUser?.can_view_users;

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const [notification, setNotification] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({ visible: false, title: '', message: '', type: 'success' });

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ visible: true, title, message, type });
    // Auto-close success/info notifications after 8 seconds
    if (type === 'success') {
      setTimeout(() => {
        setNotification(prev => prev.title === title ? { ...prev, visible: false } : prev);
      }, 8000);
    }
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };
  const [loginForm, setLoginForm] = useState({ matricula: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ matricula?: string; password?: string }>({});
  const [activeTab, setActiveTab] = usePersistentState<Tab>('os_active_tab', 'home');
  const [mgmtSubTab, setMgmtSubTab] = useState<'dashboard' | 'access_control'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClockedIn, setIsClockedIn] = usePersistentState(`os_clocked_in_${currentUser?.id || 'anonymous'}`, false);
  const [isOnLunch, setIsOnLunch] = usePersistentState(`os_on_lunch_${currentUser?.id || 'anonymous'}`, false);
  const [isOnline, setIsOnline] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [employeesList, setEmployeesList] = useState<AppUser[]>([]);
  const [attendanceSettings, setAttendanceSettings] = usePersistentState('os_attendance_settings', {
    startHour: 8,
    endHour: 18,
    allowedLocations: ['Sede', 'Obra Tejo', 'Edifício Horizonte']
  });
  const [attendanceMode, setAttendanceMode] = useState<'personal' | 'management'>('personal');
  const [selectedUserDetail, setSelectedUserDetail] = useState<AppUser | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'colaborador' as AppRole,
    startTime: '08:00',
    endTime: '17:00',
    location_id: '',
  });
  const [newProject, setNewProject] = useState<{ name: string; addressSearch: string; latitude: string; longitude: string; radius_meters: string; start_date: string; end_date: string }>({
    name: '',
    addressSearch: '',
    latitude: '',
    longitude: '',
    radius_meters: '500', // default
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addMonths(new Date(), 6), 'yyyy-MM-dd')
  });
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<{ message?: string, error?: string, path?: string, type?: string } | null>(null);

  const visibleWorkLocations = useMemo(() => {
    if (isAdmin || (isGestorOnly && currentUser?.can_view_all_locations)) {
      return workLocations;
    }
    return (workLocations || []).filter(loc => loc.id === currentUser?.location_id);
  }, [workLocations, isAdmin, isGestorOnly, currentUser]);

  const visibleEmployees = useMemo(() => {
    if (isAdmin) return employeesList;

    if (isGestorOnly) {
      // If they have the specific permission to view users
      if (currentUser?.can_view_users) {
        // If they also have permission to see all locations, they see everyone
        if (currentUser?.can_view_all_locations) {
          return employeesList;
        }
        // Otherwise they see their assigned location team
        if (currentUser?.location_id) {
          return employeesList.filter(emp =>
            (emp.location_id === currentUser.location_id || emp.id === currentUser.id) &&
            emp.role !== 'admin' && emp.role !== 'super_admin'
          );
        }
      }
      // If no view permission, or no location, only see self
      return employeesList.filter(emp => emp.id === currentUser?.id);
    }

    return employeesList.filter(emp => emp.id === currentUser?.id);
  }, [employeesList, isAdmin, isGestorOnly, currentUser]);

  const visibleTimeLogs = useMemo(() => {
    if (isAdmin || (isGestorOnly && currentUser?.can_view_users)) {
      return timeLogs;
    }
    const visibleEmpIds = new Set(visibleEmployees.map(e => e.id));
    return timeLogs.filter(log => visibleEmpIds.has(log.app_user_id));
  }, [timeLogs, visibleEmployees, isAdmin, isGestorOnly, currentUser]);

  const todayStats = useMemo(() => {
    if (!currentUser) return { hasCheckIn: false, hasCheckOut: false, hasLunchStart: false, hasLunchEnd: false };
    const todayLogs = timeLogs.filter(l => l.app_user_id === currentUser.id && isSameDay(new Date(l.timestamp), new Date()));
    return {
      hasCheckIn: todayLogs.some(l => l.type === 'check_in'),
      hasCheckOut: todayLogs.some(l => l.type === 'check_out'),
      hasLunchStart: todayLogs.some(l => l.type === 'lunch_start'),
      hasLunchEnd: todayLogs.some(l => l.type === 'lunch_end'),
    };
  }, [timeLogs, currentUser]);

  // Error Modal Component
  const ErrorModal = () => {
    if (!errorStatus) return null;
    const errorMessage = errorStatus.message || errorStatus.error || '';
    const isPermissionError = errorMessage.includes('Missing or insufficient permissions');

    return (
      <Modal
        transparent
        visible={!!errorStatus}
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderRadius: 32, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center', borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
          >
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FE4A4920', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <ShieldAlert size={40} color="#FE4A49" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: isDarkMode ? '#fff' : '#0F172A', marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 }}>
              {isPermissionError ? 'Acesso Restrito' : 'Erro de Sistema'}
            </Text>
            <Text style={{ fontSize: 15, color: isDarkMode ? '#94A3B8' : '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              {isPermissionError
                ? 'Você não tem permissão para visualizar estes dados. Se você é um novo funcionário, aguarde a ativação do seu perfil pelo administrador.'
                : 'Ocorreu um erro inesperado na sincronização dos dados.'}
            </Text>

            <View style={{ backgroundColor: isDarkMode ? '#0f172a' : '#F1F5F9', padding: 16, borderRadius: 16, width: '100%', marginBottom: 32 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: isDarkMode ? '#334155' : '#94A3B8', marginBottom: 4 }}>DETALHES TÉCNICOS</Text>
              <Text style={{ fontSize: 12, color: isDarkMode ? '#64748B' : '#475569', fontFamily: Platform.OS === 'ios' ? 'JetBrains Mono' : 'monospace' }}>
                Type: {errorStatus.type || 'SYNC_ERROR'}
              </Text>
              {errorStatus.path && (
                <Text style={{ fontSize: 12, color: isDarkMode ? '#64748B' : '#475569', fontFamily: Platform.OS === 'ios' ? 'JetBrains Mono' : 'monospace' }}>
                  Path: {errorStatus.path}
                </Text>
              )}
            </View>

            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setErrorStatus(null);
                  // Force a reload if it's a critical error
                  if (isPermissionError) {
                    setIsLoading(true);
                    setTimeout(() => setIsLoading(false), 500);
                  }
                }}
                style={{ backgroundColor: '#00A3FF', height: 56, borderRadius: 16, width: '100%', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>TENTAR NOVAMENTE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setErrorStatus(null)}
                style={{ height: 56, borderRadius: 16, width: '100%', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#E2E8F0' }}
              >
                <Text style={{ color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: '700', fontSize: 14 }}>IGNORAR</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>
    );
  };
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [attendancePolicies, setAttendancePolicies] = useState<AttendancePolicy>({
    id: 'pol-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    allow_remote_work: false, max_allowed_distance_meters: 500, max_late_minutes: 15, require_geolocation: true
  });
  const [selectedRecordForMap, setSelectedRecordForMap] = useState<TimeLog | null>(null);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<WorkLocation | null>(null);
  const [showPunchConfirmation, setShowPunchConfirmation] = useState<{ type: 'check_in' | 'check_out', coords: { latitude: number, longitude: number }, locationName: string } | null>(null);
  const [currentCapturedCoords, setCurrentCapturedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userLocationHistory, setUserLocationHistory] = useState<UserLocationHistory[]>([]);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);

  const [pushEnabled, setPushEnabled] = usePersistentState('os_push_enabled', false);
  const [currentPush, setCurrentPush] = useState<{ title: string, message: string } | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [showOvertimeForm, setShowOvertimeForm] = useState(false);
  const [overtimeDate, setOvertimeDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [overtimeHours, setOvertimeHours] = useState('2');
  const [overtimeReason, setOvertimeReason] = useState('');
  const [assigningEmployeeId, setAssigningEmployeeId] = useState<string | null>(null);

  const managementStats = useMemo(() => {
    if (!isGestor) return { workingCount: 0, alertsToday: 0, pendingLeaves: 0 };

    const workingCount = visibleEmployees.filter(e =>
      visibleTimeLogs.some(l => l.app_user_id === e.id && l.type === 'check_in' && isToday(new Date(l.timestamp)))
    ).length;

    const alertsToday = notifications.filter(n =>
      isToday(new Date(n.timestamp)) && n.type === 'warning'
    ).length;

    const pendingLeaves = leaveRequests.filter(lr => lr.status === 'pending').length;

    return { workingCount, alertsToday, pendingLeaves };
  }, [isGestor, visibleEmployees, visibleTimeLogs, notifications, leaveRequests]);

  const filteredEmployeesForMgmt = useMemo(() => {
    if (!isGestor) return [];
    return visibleEmployees
      .filter(emp => {
        if (isAdmin) return currentUser?.role === 'super_admin' || emp.role !== 'super_admin';
        return emp.role !== 'admin' && emp.role !== 'super_admin';
      })
      .filter(e =>
        e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [isGestor, visibleEmployees, isAdmin, currentUser, searchTerm]);

  const [showWorkScheduleForm, setShowWorkScheduleForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<WorkSchedule>>({
    day_of_week: 'Segunda-feira',
    start_time: '08:00',
    end_time: '17:00'
  });

  const handleAddSchedule = async () => {
    if (!isAdmin && !currentUser?.can_manage_employees) return;
    try {
      const scheduleData = {
        ...newSchedule,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true
      };
      await addDoc(collection(db, 'work_schedules'), scheduleData);
      showNotification('Sucesso', 'Horário de trabalho adicionado.', 'success');
      setShowWorkScheduleForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'work_schedules');
    }
  };

  const calculateTotalMinutes = (userLogs: TimeLog[], startDate: Date, endDate: Date) => {
    const logsInRange = userLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });

    const dayGroups: { [key: string]: TimeLog[] } = {};
    logsInRange.forEach(log => {
      const d = format(new Date(log.timestamp), 'yyyy-MM-dd');
      if (!dayGroups[d]) dayGroups[d] = [];
      dayGroups[d].push(log);
    });

    let totalMs = 0;
    Object.values(dayGroups).forEach(logs => {
      const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      let dayStart: number | null = null;
      let lunchStart: number | null = null;
      let dayMs = 0;
      let lunchMs = 0;

      sortedLogs.forEach(l => {
        if (l.type === 'check_in' && !dayStart) dayStart = new Date(l.timestamp).getTime();
        if (l.type === 'lunch_start' && dayStart && !lunchStart) lunchStart = new Date(l.timestamp).getTime();
        if (l.type === 'lunch_end' && lunchStart) {
          lunchMs += new Date(l.timestamp).getTime() - lunchStart;
          lunchStart = null;
        }
        if (l.type === 'check_out' && dayStart) {
          dayMs += new Date(l.timestamp).getTime() - dayStart;
          dayStart = null;
        }
      });

      // If finished day but lunch was still active (unlikely but safe)
      if (lunchStart && !dayStart) {
        // Should have been closed by checkout, but if not we ignore it or cap it
      }

      totalMs += (dayMs - lunchMs);
    });

    return Math.floor(totalMs / (1000 * 60));
  };

  const formatMinutes = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  };

  const monthlyHours = useMemo(() => {
    if (!currentUser) return '0h 0m';
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const totalMins = calculateTotalMinutes(timeLogs.filter(l => l.app_user_id === currentUser.id), monthStart, monthEnd);
    return formatMinutes(totalMins);
  }, [timeLogs, currentUser]);

  const handleExportIndividual = async (user: AppUser) => {
    try {
      showNotification('A exportar...', `Gerando relatório individual para ${user.name}`, 'success');

      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      const userLogsInRange = timeLogs.filter(l => l.app_user_id === user.id && new Date(l.timestamp) >= monthStart && new Date(l.timestamp) <= monthEnd)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const totalMins = calculateTotalMinutes(timeLogs.filter(l => l.app_user_id === user.id), monthStart, monthEnd);

      const individualQrData = JSON.stringify({
        type: 'INDIVIDUAL_REPORT',
        user_id: user.id,
        period: format(monthStart, 'MM/yyyy'),
        generated_at: new Date().toISOString()
      });
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(individualQrData)}`;

      const dayGroups: { [key: string]: TimeLog[] } = {};
      userLogsInRange.forEach(log => {
        const d = format(new Date(log.timestamp), 'yyyy-MM-dd');
        if (!dayGroups[d]) dayGroups[d] = [];
        dayGroups[d].push(log);
      });

      const dailyRows = Object.keys(dayGroups).sort().map(d => {
        const logs = [...dayGroups[d]].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        let entrada = '-';
        let saida = '-';
        let almoco = '-';
        let obra = logs.length > 0 ? (logs[0].location_name || 'Desconhecida') : '-';

        if (logs.length > 0) entrada = format(new Date(logs[0].timestamp), 'HH:mm');
        if (logs.length > 1) {
          saida = format(new Date(logs[logs.length - 1].timestamp), 'HH:mm');
        }

        let customDayMs = 0;
        let currentIn: number | null = null;
        for (let i = 0; i < logs.length; i++) {
          if (logs[i].type === 'check_in') {
            currentIn = new Date(logs[i].timestamp).getTime();
          } else if (logs[i].type === 'check_out' && currentIn) {
            customDayMs += new Date(logs[i].timestamp).getTime() - currentIn;
            currentIn = null;
          }
        }

        let gapMs = 0;
        if (logs.length >= 4) {
          const firstOut = logs.find(l => l.type === 'check_out');
          const lastIn = [...logs].reverse().find(l => l.type === 'check_in');
          if (firstOut && lastIn && firstOut.id !== lastIn.id) {
            gapMs = new Date(lastIn.timestamp).getTime() - new Date(firstOut.timestamp).getTime();
          }
        }

        if (gapMs > 0) almoco = formatMinutes(Math.floor(gapMs / 60000));
        const total = formatMinutes(Math.floor(customDayMs / 60000));

        return `
          <tr>
            <td><strong>${format(new Date(d), 'dd/MM/yyyy')}</strong></td>
            <td>${obra}</td>
            <td><span class="badge badge-in">${entrada}</span></td>
            <td><span class="badge badge-out">${saida}</span></td>
            <td>${almoco}</td>
            <td><strong>${total}</strong></td>
          </tr>
        `;
      }).join('');

      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
              .logo-container h1 { margin: 0; color: #14233c; font-size: 24px; font-weight: 900; }
              .logo-container p { margin: 2px 0 0; color: #0ea5e9; font-weight: 700; font-size: 13px; text-transform: uppercase; }
              .logo-container span.sub { display: block; color: #9ca3af; font-weight: 700; font-size: 11px; margin-top: 2px; }
              .summary { display: flex; gap: 20px; margin-bottom: 30px; }
              .stat-box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
              .stat-label { font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; }
              .stat-value { font-size: 18px; font-weight: 900; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
              th { text-align: left; background: #14233c; padding: 12px 15px; color: white; font-weight: 700; text-transform: uppercase; font-size: 10px; }
              td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; }
              .badge { padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; }
              .badge-in { background: #dcfce7; color: #166534; }
              .badge-out { background: #fee2e2; color: #991b1b; }
              .qr-container { text-align: right; }
              .qr-img { width: 80px; height: 80px; border: 1px solid #e2e8f0; border-radius: 10px; }
              .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; font-weight: 700; }
              .total-footer { margin-top: 20px; text-align: right; font-size: 14px; color: #14233c; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-container">
                <h1>OBJETIVO SIMILAR</h1>
                <p>CONSTRUÇÕES UNIPESSOAL LDA</p>
                <span class="sub">CONSTRUÇÃO CIVIL E ENGENHARIA</span>
              </div>
              <div class="qr-container">
                <img src="${qrCodeUrl}" class="qr-img" />
              </div>
            </div>

            <h2 style="font-size: 16px; color: #14233c; border-left: 4px solid #0ea5e9; padding-left: 10px;">RELATÓRIO DO MÊS - ${format(monthStart, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}</h2>

            <div class="summary">
              <div class="stat-box">
                <div class="stat-label">Funcionário</div>
                <div class="stat-value">${user.name.toUpperCase()}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Total Gasto</div>
                <div class="stat-value">${formatMinutes(totalMins)}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Dias Trabalhados</div>
                <div class="stat-value">${Object.keys(dayGroups).length}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>Obra</th>
                  <th>Entrada</th>
                  <th>Saída</th>
                  <th>Almoço</th>
                  <th>Horas Trabalhado</th>
                </tr>
              </thead>
              <tbody>
                ${dailyRows}
              </tbody>
            </table>

            <div class="total-footer">
              <strong>TOTAL DE HORAS:</strong> ${formatMinutes(totalMins)}
            </div>

            <div class="footer">
              RELATÓRIO DE PRESENÇAS E HORAS MENSAL GERADO EM ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}<br/>
              © ${new Date().getFullYear()} OBJETIVO SIMILAR LDA
            </div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html: htmlContent });
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const pdfName = `Relatorio_Individual_${user.name.replace(/\s+/g, '_')}.pdf`;
        const newUri = FileSystem.cacheDirectory + pdfName;
        await FileSystem.deleteAsync(newUri, { idempotent: true });
        await FileSystem.moveAsync({
          from: uri,
          to: newUri,
        });
        await Sharing.shareAsync(newUri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar Relatório Individual'
        });
      }
    } catch (error) {
      console.error(error);
      showNotification('Erro', 'Falha ao gerar PDF individual.', 'error');
    }
  };

  const handleExportGeneral = async () => {
    try {
      showNotification('Relatório Coletivo', 'Compilando total de horas de todos os colaboradores...', 'success');

      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());

      const collectiveQrData = JSON.stringify({
        type: 'COLLECTIVE_REPORT',
        period: format(monthStart, 'MM/yyyy'),
        generated_at: new Date().toISOString()
      });
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(collectiveQrData)}`;

      let usersSummaryHtml = '';

      employeesList.forEach((user) => {
        const totalMins = calculateTotalMinutes(timeLogs.filter(l => l.app_user_id === user.id), monthStart, monthEnd);
        const loc = workLocations.find(w => w.id === user.location_id);
        const locationName = loc ? loc.name : 'Não Definida';

        usersSummaryHtml += `
          <tr>
            <td><strong>${user.name}</strong></td>
            <td>${user.email}</td>
            <td>${locationName}</td>
            <td>${user.role.toUpperCase()}</td>
            <td style="text-align: right; font-weight: 900; color: #00A3FF;">${formatMinutes(totalMins)}</td>
          </tr>
        `;
      });

      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
              .logo-container h1 { margin: 0; color: #14233c; font-size: 24px; font-weight: 900; line-height: 1.1; }
              .logo-container p { margin: 2px 0 0; color: #0ea5e9; font-weight: 700; font-size: 13px; text-transform: uppercase; }
              .logo-container span.sub { display: block; color: #9ca3af; font-weight: 700; font-size: 11px; margin-top: 2px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
              th { text-align: left; background: #14233c; padding: 12px 15px; color: white; font-weight: 700; text-transform: uppercase; font-size: 10px; }
              td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; }
              .qr-container { text-align: right; }
              .qr-img { width: 80px; height: 80px; border: 1px solid #e2e8f0; border-radius: 10px; }
              .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; font-weight: 700; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-container">
                <h1>OBJETIVO SIMILAR</h1>
                <p>CONSTRUÇÕES UNIPESSOAL LDA</p>
                <span class="sub">CONSTRUÇÃO CIVIL E ENGENHARIA</span>
              </div>
              <div class="qr-container">
                <img src="${qrCodeUrl}" class="qr-img" />
              </div>
            </div>

            <h2 style="font-size: 16px; color: #14233c; border-left: 4px solid #0ea5e9; padding-left: 10px;">RELATÓRIO GERAL MENSAL - ${format(monthStart, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}</h2>

            <table>
              <thead>
                <tr>
                  <th>Nome do Funcionário</th>
                  <th>Email</th>
                  <th>Obra Principal</th>
                  <th>Cargo</th>
                  <th style="text-align: right;">Total Trabalhado</th>
                </tr>
              </thead>
              <tbody>
                ${usersSummaryHtml}
              </tbody>
            </table>

            <div class="footer">
              RESUMO DE HORAS MENSAL GERADO EM ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}<br/>
              © ${new Date().getFullYear()} OBJETIVO SIMILAR LDA
            </div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html: htmlContent });
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const pdfName = `Relatorio_Geral_${format(new Date(), 'MMyyyy')}.pdf`;
        const newUri = FileSystem.cacheDirectory + pdfName;
        await FileSystem.deleteAsync(newUri, { idempotent: true });
        await FileSystem.moveAsync({
          from: uri,
          to: newUri,
        });
        await Sharing.shareAsync(newUri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar Relatório Coletivo'
        });
      }
    } catch (err) {
      console.error(err);
      showNotification('Erro Exportação', 'Não foi possível compilar o relatório coletivo.', 'error');
    }
  };

  /* Removed Draggable FAB logic */

  const scheduleSimulatedPushContent = (title: string, message: string) => {
    setCurrentPush({ title, message });
    setTimeout(() => {
      setCurrentPush(null);
    }, 4000);
  };

  // Seed Users to Firestore
  useEffect(() => {
    const seedUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snap = await getDocs(query(usersRef, limit(1)));

        if (snap.empty) {
          console.log('Base de dados vazia. A criar utilizadores iniciais...');
          for (const user of DEFAULT_USERS) {
            await setDoc(doc(db, 'users', user.id), {
              ...user,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
          console.log('Utilizadores criados com sucesso.');
        }
      } catch (error) {
        console.error('Erro ao semear utilizadores:', error);
      }
    };

    seedUsers();
  }, []);

  const [customApiUrl, setCustomApiUrl] = usePersistentState<string | null>('os_custom_api_url', null);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const getApiUrl = (path: string) => {
    if (path.startsWith('http')) return path;

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // User override
    if (customApiUrl) {
      let base = customApiUrl.trim();

      // If it doesn't have a protocol, add http://
      if (!base.includes('://')) {
        // If it was something like "http:192.168.1.1" (typo)
        if (base.startsWith('http:')) {
          base = base.replace('http:', 'http://');
        } else if (base.startsWith('https:')) {
          base = base.replace('https:', 'https://');
        } else {
          base = `http://${base}`;
        }
      }

      // Clean double slashes in protocol (e.g. http:/// -> http://)
      base = base.replace(/:\/+(\d)/, '://$1').replace(/:\/+/, '://');

      const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
      const finalUrl = `${cleanBase}${normalizedPath}`;
      console.log(`[DEBUG] getApiUrl: custom override used. Base: ${customApiUrl} -> finalUrl: ${finalUrl}`);
      return finalUrl;
    }

    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const { hostname, origin } = window.location;

      // If we are in the Cloud (AI Studio / Production)
      if (hostname.includes('run.app') || hostname.includes('google.com') || hostname.includes('webcontainer.io')) {
        return path;
      }

      // If we are on localhost (web dev)
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:3000${path}`;
      }
    }

    // MOBILE / EXPO GO logic
    // Try to detect the Metro host IP automatically
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:3000${path}`;
    }

    // FINAL FALLBACK
    return `https://ais-dev-hrbmnvjuqn72ok4yi7upyq-252096587423.europe-west3.run.app${path}`;
  };

  // Firebase Auth Listener
  useEffect(() => {
    // Check server health
    const healthUrl = getApiUrl('/api/health');
    if (Platform.OS === 'web') {
      fetch(healthUrl)
        .then(r => r.json())
        .then(data => console.log('Backend Health (Web):', data))
        .catch(err => console.log('Backend connection failed:', err));
    } else {
      // No telemóvel, usamos um timeout menor para não travar o arranque
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      fetch(healthUrl, { signal: controller.signal })
        .then(r => r.json())
        .then(data => {
          console.log('Backend Health (Mobile):', data);
          clearTimeout(timeoutId);
        })
        .catch(err => {
          console.log('Backend mobile health check failed - Using Cloud fallback');
          clearTimeout(timeoutId);
        });
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch or create user in Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          const isAdminEmail = user.email === 'ronaldojiconda@gmail.com';
          const isSuperAdminEmail = user.email === 'ronaldopaulino32@hotmail.com';

          console.log('Auth check for:', user.email, 'isAdmin:', isAdminEmail, 'isSuperAdmin:', isSuperAdminEmail);

          if (userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            console.log('UserData from Firestore:', userData.role);
            // Force roles for specific emails if they mismatch
            if (isSuperAdminEmail && userData.role !== 'super_admin') {
              userData.role = 'super_admin';
              await updateDoc(userDocRef, { role: 'super_admin' });
            } else if (isAdminEmail && userData.role !== 'admin' && userData.role !== 'super_admin') {
              userData.role = 'admin';
              await updateDoc(userDocRef, { role: 'admin' });
            }
            setCurrentUser(userData);
            setUserRole(userData.role || 'colaborador');
          } else {
            const role = isSuperAdminEmail ? 'super_admin' : (isAdminEmail ? 'admin' : 'colaborador');
            const newUser: AppUser = {
              id: user.uid,
              email: user.email || '',
              keycloak_user_id: user.uid,
              active: true,
              role: role as AppRole,
              name: user.displayName || 'Utilizador',
              avatar: user.photoURL || '',
              created_at: new Date().toISOString()
            };
            await setDoc(userDocRef, newUser);
            setCurrentUser(newUser);
            setUserRole(role);
          }
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Error checking/creating user profile:", error);
          // Fallback if firestore fails
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserRole('colaborador');
      }
      setAuthReady(true);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []); // Only once on mount

  // Real-time location tracking for clocked-in users
  useEffect(() => {
    if (!isAuthenticated || !currentUser || !isClockedIn) return;

    let locationUnsub: any = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        locationUnsub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 50,
            timeInterval: 60000,
          },
          async (location) => {
            const { latitude, longitude, accuracy } = location.coords;
            const userRef = doc(db, 'users', currentUser.id);
            let outOfBounds = false;
            let distToSite = 0;

            if (currentUser.location_id) {
              const assignedSite = workLocations.find(l => l.id === currentUser.location_id);
              if (assignedSite) {
                distToSite = getDistanceFromLatLonInM(latitude, longitude, assignedSite.latitude, assignedSite.longitude);
                if (distToSite > (assignedSite.radius_meters || 500)) {
                  outOfBounds = true;
                }
              }
            }

            try {
              await updateDoc(userRef, {
                last_location: {
                  latitude,
                  longitude,
                  accuracy: accuracy || 0,
                  timestamp: new Date().toISOString(),
                  out_of_bounds: outOfBounds,
                  distance: distToSite
                },
                updated_at: new Date().toISOString()
              });

              await addDoc(collection(db, 'user_location_history'), {
                keycloak_user_id: currentUser.id,
                latitude,
                longitude,
                accuracy: accuracy || 0,
                source: 'periodic_tracking',
                timestamp: new Date().toISOString()
              });
            } catch (err) {
              console.error("Error updating tracking:", err);
            }
          }
        );
      } catch (err) {
        console.error("Tracking setup error:", err);
      }
    };

    startTracking();

    return () => {
      if (locationUnsub && locationUnsub.remove) {
        locationUnsub.remove();
      }
    };
  }, [isAuthenticated, currentUser, isClockedIn, workLocations]);

  // Sync user location history for managers
  useEffect(() => {
    if (!isAuthenticated || !currentUser || !isGestor) return;

    const historyUnsub = onSnapshot(
      query(collection(db, 'user_location_history'), orderBy('timestamp', 'desc'), limit(500)),
      (snapshot) => {
        setUserLocationHistory(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as UserLocationHistory)));
      },
      (error) => {
        console.error("Error syncing history:", error);
      }
    );

    return () => historyUnsub();
  }, [isAuthenticated, currentUser, isGestor]);

  // Firestore Sync Listeners
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    // Work Locations
    const locsUnsub = onSnapshot(collection(db, 'work_locations'), (snapshot) => {
      const locs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as WorkLocation));
      setWorkLocations(locs.length > 0 ? locs : WORK_LOCATIONS);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'work_locations');
      } catch (e: any) {
        setErrorStatus(JSON.parse(e.message));
      }
    });

    // Time Logs (Filtered for current user unless manager)
    const logsQuery = (isAdmin || currentUser?.can_view_users)
      ? query(collection(db, 'time_logs'), orderBy('timestamp', 'desc'), limit(3000))
      : query(collection(db, 'time_logs'), where('app_user_id', '==', currentUser.id), orderBy('timestamp', 'desc'), limit(1500));

    const logsUnsub = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as TimeLog));
      setTimeLogs(logs);

      // Update check-in status from most recent log of the current user
      if (currentUser) {
        const myLogs = logs.filter(l => l.app_user_id === currentUser.id);
        if (myLogs.length > 0 && myLogs[0].type) {
          const logTimestamp = new Date(myLogs[0].timestamp);
          if (isSameDay(logTimestamp, new Date())) {
            const latestType = myLogs[0].type;
            setIsClockedIn(latestType === 'check_in' || latestType === 'lunch_start' || latestType === 'lunch_end');
            setIsOnLunch(latestType === 'lunch_start');
          } else {
            setIsClockedIn(false);
            setIsOnLunch(false);
          }
        } else {
          setIsClockedIn(false);
          setIsOnLunch(false);
        }
      }
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'time_logs');
      } catch (e: any) {
        setErrorStatus(JSON.parse(e.message));
      }
    });

    // Leave Requests
    const leaveQuery = (isAdmin || currentUser?.can_view_users)
      ? query(collection(db, 'leave_requests'), orderBy('created_at', 'desc'), limit(500))
      : query(collection(db, 'leave_requests'), where('keycloak_user_id', '==', currentUser.id), orderBy('created_at', 'desc'), limit(100));

    const leaveUnsub = onSnapshot(leaveQuery, (snapshot) => {
      setLeaveRequests(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as LeaveRequest)));
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'leave_requests');
      } catch (e: any) {
        setErrorStatus(JSON.parse(e.message));
      }
    });

    // Global Notifications History
    const allNotifsQuery = (isAdmin || currentUser?.can_view_users)
      ? query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(50))
      : query(collection(db, 'notifications'), where('app_user_id', 'in', [currentUser.id, 'all']), orderBy('timestamp', 'desc'), limit(50));

    const allNotifsUnsub = onSnapshot(allNotifsQuery, (snap) => {
      setNotifications(snap.docs.map(d => ({ ...d.data(), id: d.id } as NotificationItem)));
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      } catch (e: any) {
        setErrorStatus(JSON.parse(e.message));
      }
    });

    // Overtime Requests
    const overtimeQuery = (isAdmin || currentUser?.can_view_users)
      ? query(collection(db, 'overtime_requests'), orderBy('created_at', 'desc'), limit(500))
      : query(collection(db, 'overtime_requests'), where('user_id', '==', currentUser.id), orderBy('created_at', 'desc'), limit(100));

    const overtimeUnsub = onSnapshot(overtimeQuery, (snapshot) => {
      setOvertimeRequests(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as OvertimeRequest)));
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'overtime_requests');
      } catch (e: any) {
        setErrorStatus(JSON.parse(e.message));
      }
    });

    // Push Listener (Fresh notifications only)
    const pushUnsub = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(1)), (snapshot) => {
      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data() as NotificationItem;
        const isFresh = (Date.now() - latest.timestamp) < 3000;
        // Don't show push for things I did (unless direct response, but here we keep it simple)
        if (isFresh && pushEnabled) {
          setCurrentPush({ title: latest.title, message: latest.message });
          setTimeout(() => setCurrentPush(null), 5000);
        }
      }
    });

    // Employee List (Managers only)
    let usersUnsub = () => { };
    if (isAdmin || (isGestorOnly && currentUser?.can_view_users)) {
      usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        setEmployeesList(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as AppUser)));
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'users');
        } catch (e: any) {
          setErrorStatus(JSON.parse(e.message));
        }
      });
    }

    return () => {
      locsUnsub();
      logsUnsub();
      leaveUnsub();
      overtimeUnsub();
      allNotifsUnsub();
      pushUnsub();
      usersUnsub();
    };
  }, [isAuthenticated, currentUser, userRole]);

  useEffect(() => {
    const checkInit = async () => {
      const seen = await AsyncStorage.getItem('os_onboarding_seen');
      setTimeout(() => {
        setIsLoading(false);
        if (!seen) setShowOnboarding(true);
      }, 2000);
    };
    checkInit();
  }, []);



  const searchAddress = async () => {
    if (!newProject.addressSearch) return;
    setIsCapturingLocation(true);
    try {
      const results = await Location.geocodeAsync(newProject.addressSearch);
      if (results && results.length > 0) {
        setNewProject(prev => ({
          ...prev,
          latitude: results[0].latitude.toString(),
          longitude: results[0].longitude.toString(),
          addressSearch: 'Encontrado'
        }));
        setTimeout(() => setNewProject(prev => ({ ...prev, addressSearch: '' })), 2000);
      } else {
        showNotification('Busca', 'Endereço não encontrado.', 'warning');
      }
    } catch (e) {
      console.warn(e);
      showNotification('Erro', 'Houve um erro ao procurar endereço.', 'error');
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const captureCurrentLocationForProject = async () => {
    setIsCapturingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showNotification('Permissão', 'Acesso à localização negado.', 'error');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setNewProject(prev => ({
        ...prev,
        latitude: loc.coords.latitude.toString(),
        longitude: loc.coords.longitude.toString()
      }));
    } catch (e) {
      console.warn(e);
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!isAdmin && !currentUser?.can_manage_projects) {
      showNotification('Acesso Negado', 'Não tens permissão para remover obras.', 'error');
      return;
    }
    try {
      await deleteDoc(doc(db, 'work_locations', projectId));
      addSystemNotification('Estaleiro Removido', `A obra "${projectName}" foi removida do sistema.`, 'managers', 'warning');
      showNotification('Sucesso', 'Estaleiro removido.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'work_locations');
    }
  };

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    // Only admins or people with manage_employees permission can delete
    if (!isAdmin && !currentUser?.can_manage_employees) {
      showNotification('Acesso Negado', 'Permissões insuficientes para eliminar funcionários.', 'error');
      return;
    }

    // Safety check: Gestores cannot delete Admins
    const targetEmp = employeesList.find(e => e.id === employeeId);
    if (!isAdmin && (targetEmp?.role === 'admin' || targetEmp?.role === 'super_admin')) {
      showNotification('Ação Bloqueada', 'Não tem permissão para eliminar um administrador.', 'error');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', employeeId));
      addSystemNotification('Equipa Reduzida', `${employeeName} foi removido da equipa.`, 'managers', 'warning');
      showNotification('Sucesso', 'Funcionário removido.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users');
    }
  };

  const handleUpdatePassword = async (pwd: string) => {
    if (!currentUser) {
      console.log("App: handleUpdatePassword - no currentUser");
      return;
    }

    console.log(`App: handleUpdatePassword started for UID: ${currentUser.id}`);
    try {
      const url = getApiUrl('/api/update-password');
      console.log(`App: Fetching password update from: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.id,
          newPassword: pwd,
          email: currentUser.email,
          name: currentUser.name
        })
      });

      console.log(`App: Password update response status: ${response.status}`);
      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
        console.log("App: Password update response JSON:", data);
      } else {
        const text = await response.text();
        console.log("App: Password update response text (non-JSON):", text);

        if (response.status === 404) {
          console.warn('Backend returned 404 for password update. This usually means the server.ts is out of date or not correctly reachable.');
          throw new Error("O endpoint de atualização não foi encontrado no servidor (404). Por favor, verifique se o backend está na versão mais recente.");
        }
        throw new Error(text || `Erro do servidor (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data?.error || `Falha ao atualizar password (${response.status})`);
      }

      showNotification('Sucesso', 'Palavra-passe atualizada com sucesso.', 'success');
      console.log("App: Password update successful");
    } catch (err: any) {
      console.error('App: Password update error:', err);
      // We throw to the modal so it can show the alert
      throw err;
    }
  };

  const handleAddProject = async () => {
    if (!isGestor) {
      showNotification('Acesso Negado', 'Não tens permissão para adicionar obras.', 'error');
      return;
    }

    if (!newProject.name || !newProject.latitude || !newProject.longitude || !newProject.radius_meters) {
      showNotification('Aviso', 'Preencha os dados obrigatórios da obra.', 'warning');
      return;
    }

    // Validação de nomes duplicados
    const nameExists = workLocations.some(loc => loc.name.toLowerCase().trim() === newProject.name.toLowerCase().trim());
    if (nameExists) {
      showNotification('Nome Duplicado', 'Já existe uma obra com este nome.', 'error');
      return;
    }

    const lat = parseFloat(newProject.latitude);
    const lon = parseFloat(newProject.longitude);
    const rad = parseInt(newProject.radius_meters) || 500;

    if (isNaN(lat) || isNaN(lon)) {
      showNotification('Aviso', 'Latitude ou Longitude inválida.', 'warning');
      return;
    }

    try {
      const newProj: Omit<WorkLocation, 'id'> = {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        name: newProject.name,
        latitude: lat,
        longitude: lon,
        radius_meters: rad,
        active: true,
        progress: 0,
        status: 'active',
        image: REALISTIC_IMAGES[Math.floor(Math.random() * REALISTIC_IMAGES.length)],
        themeColor: '#00A3FF',
        start_date: newProject.start_date,
        end_date: newProject.end_date
      };

      const docRef = await addDoc(collection(db, 'work_locations'), newProj);

      // Notify about new project
      await addNotification({
        title: 'Novo Estaleiro Registado',
        message: `O estaleiro "${newProject.name}" foi adicionado ao sistema por ${currentUser?.name || 'Administrador'}.`,
        type: 'success',
        app_user_id: 'managers' // Manager notification
      });

      setShowProjectForm(false);
      setNewProject({ name: '', addressSearch: '', latitude: '', longitude: '', radius_meters: '500', start_date: format(new Date(), 'yyyy-MM-dd'), end_date: '' });
      setEditingProjectId(null);
      showNotification('Sucesso', 'Obra registada com sucesso.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'work_locations');
    }
  };

  const handleUpdateProject = async () => {
    if (!isGestor) {
      showNotification('Acesso Negado', 'Não tens permissão para editar obras.', 'error');
      return;
    }

    if (!editingProjectId) return;

    if (!newProject.name || !newProject.latitude || !newProject.longitude || !newProject.radius_meters) {
      showNotification('Aviso', 'Preencha os dados obrigatórios da obra.', 'warning');
      return;
    }

    const lat = parseFloat(newProject.latitude);
    const lon = parseFloat(newProject.longitude);
    const rad = parseInt(newProject.radius_meters) || 500;

    if (isNaN(lat) || isNaN(lon)) {
      showNotification('Aviso', 'Latitude ou Longitude inválida.', 'warning');
      return;
    }

    try {
      await updateDoc(doc(db, 'work_locations', editingProjectId), {
        updated_at: new Date().toISOString(),
        name: newProject.name,
        latitude: lat,
        longitude: lon,
        radius_meters: rad,
        start_date: newProject.start_date,
        end_date: newProject.end_date
      });

      showNotification('Sucesso', 'Obra atualizada com sucesso!', 'success');
      setNewProject({ name: '', addressSearch: '', latitude: '', longitude: '', radius_meters: '500', start_date: format(new Date(), 'yyyy-MM-dd'), end_date: '' });
      setShowProjectForm(false);
      setEditingProjectId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'work_locations');
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleAddEmployee = async () => {
    if (!isAdmin && !currentUser?.can_manage_employees) {
      showNotification('Acesso Negado', 'Permissões insuficientes para adicionar funcionários.', 'error');
      return;
    }
    if (!newEmployee.name || !newEmployee.email) {
      showNotification('Aviso', 'Preencha o nome e email do funcionário.', 'warning');
      return;
    }

    try {
      showNotification('Processando...', 'Criando conta e enviando email...', 'success');
      const password = generatePassword();

      const registerUrl = getApiUrl('/api/register-employee');
      console.log('Fetching:', registerUrl);

      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: newEmployee.name,
          email: newEmployee.email.toLowerCase().trim(),
          role: newEmployee.role || 'colaborador',
          location_id: newEmployee.location_id || null,
          password: password
        }),
      }).catch(err => {
        console.error('Fetch error:', err);
        const msg = `Falha de rede: Não foi possível contactar o servidor em ${registerUrl}. Verifique se o backend está a correr na porta 3000 e se é acessível do seu dispositivo.`;
        showNotification('Erro de Ligação', msg, 'error');
        throw new Error(msg);
      });

      let result;
      const responseText = await response.text();

      // Check for Google Identity Proxy or Cloud Run error screens
      if (responseText.includes('<!doctype html>') || responseText.includes('<html')) {
        let errorMsg = 'O servidor retornou HTML em vez de JSON.';

        if (responseText.includes('accounts.google.com') || responseText.includes('Sign in')) {
          errorMsg = 'Bloqueio de Autenticação (Google Identity Proxy). O seu dispositivo não consegue aceder ao Backend da Cloud sem login prévio no browser. Recomendamos usar o IP local do seu computador se estiver a testar via Metro/Expo Go.';
        } else if (responseText.includes('Cookie check')) {
          errorMsg = 'Erro de Cookies/Sessão no Proxy da Cloud. Tente usar o IP local do seu computador no telemóvel.';
        }

        console.error('HTML Response detected:', responseText.substring(0, 500));
        throw new Error(errorMsg);
      }

      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON response. Response text:', responseText.substring(0, 500));
        throw new Error(`Resposta inválida do servidor. Verifique a configuração do API URL.`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao registrar funcionário');
      }

      // Notify about new employee
      await addNotification({
        title: 'Novo Funcionário',
        message: `${newEmployee.name} foi adicionado à equipa como ${newEmployee.role}.`,
        type: 'info',
        app_user_id: 'managers'
      });

      setShowEmployeeForm(false);
      setNewEmployee({ name: '', email: '', role: 'colaborador', startTime: '08:00', endTime: '17:00' as any, location_id: '' });
      showNotification('Sucesso', `Funcionário ${newEmployee.name} registado com sucesso. As credenciais foram enviadas por e-mail.`, 'success');
    } catch (error: any) {
      console.error(error);
      showNotification('Erro', error.message || 'Não foi possível registar o funcionário.', 'error');
    }
  };

  const handleUpdateUser = async (uid: string, data: Partial<AppUser>) => {
    // Only admins or people with manage_employees permission can update others
    if (!isAdmin && !currentUser?.can_manage_employees && uid !== currentUser?.id) {
      showNotification('Acesso Negado', 'Não tem permissão para alterar outros perfis.', 'error');
      return;
    }

    // Safety check: Gestores cannot modify Admins
    const targetEmp = employeesList.find(e => e.id === uid);
    if (!isAdmin && (targetEmp?.role === 'admin' || targetEmp?.role === 'super_admin')) {
      showNotification('Ação Bloqueada', 'Não tem permissão para alterar dados de um administrador.', 'error');
      return;
    }

    // Role/Permission guard: only Admins can change roles or permissions
    const isChangingPerms = data.role !== undefined ||
      data.can_view_all_locations !== undefined ||
      data.can_view_users !== undefined ||
      data.can_manage_projects !== undefined ||
      data.can_manage_employees !== undefined;

    if (!isAdmin && isChangingPerms) {
      showNotification('Ação Bloqueada', 'Apenas administradores podem gerir cargos e permissões.', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', uid), {
        ...data,
        updated_at: new Date().toISOString()
      });
      showNotification('Sucesso', 'Utilizador atualizado com sucesso.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const confirmPunch = useCallback(async (type: 'check_in' | 'check_out' | 'lunch_start' | 'lunch_end', coords: { latitude: number, longitude: number }, locationName: string) => {
    if (!currentUser) return;

    // Check if user is active
    if (currentUser.active === false) {
      showNotification('Conta Inativa', 'A sua conta está desativada. Contacte a administração.', 'error');
      return;
    }

    // Check if user has an assigned location
    if (!currentUser.location_id) {
      showNotification('Obra não Atribuída', 'Não tem uma obra atribuída. Contacte o seu gestor.', 'error');
      setIsFloatingMenuOpen(false);
      setShowPunchConfirmation(null);
      return;
    }

    // Cooldown check: prevent multiple punches within 2 minutes
    const myLogs = timeLogs.filter(l => l.app_user_id === currentUser.id);
    if (myLogs.length > 0) {
      const lastPunchTime = new Date(myLogs[0].timestamp).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - lastPunchTime) / (1000 * 60);
      if (diffMinutes < 2) {
        showNotification('Operação Bloqueada', `Deve aguardar pelo menos 2 minutos entre registos.`, 'warning');
        setIsFloatingMenuOpen(false);
        setShowPunchConfirmation(null);
        return;
      }
    }

    // Strict Sequence and Daily Limits
    const todayLogs = myLogs.filter(l => isSameDay(new Date(l.timestamp), new Date()));
    const hasCheckIn = todayLogs.some(l => l.type === 'check_in');
    const hasCheckOut = todayLogs.some(l => l.type === 'check_out');
    const hasLunchStart = todayLogs.some(l => l.type === 'lunch_start');
    const hasLunchEnd = todayLogs.some(l => l.type === 'lunch_end');

    if (type === 'check_in') {
      if (hasCheckIn) {
        showNotification('Operação Bloqueada', 'Já realizou a entrada hoje.', 'warning');
        return;
      }
    } else {
      // All other types require a check-in today
      if (!hasCheckIn) {
        showNotification('Operação Bloqueada', 'Deve realizar a entrada primeiro.', 'warning');
        return;
      }

      if (type === 'lunch_start') {
        if (hasLunchStart) {
          showNotification('Operação Bloqueada', 'Já registou o início do almoço hoje.', 'warning');
          return;
        }
        if (hasCheckOut) {
          showNotification('Operação Bloqueada', 'Já realizou o check-out hoje.', 'warning');
          return;
        }
      } else if (type === 'lunch_end') {
        if (!hasLunchStart) {
          showNotification('Operação Bloqueada', 'Deve registar o início do almoço primeiro.', 'warning');
          return;
        }
        if (hasLunchEnd) {
          showNotification('Operação Bloqueada', 'Já registou o fim do almoço hoje.', 'warning');
          return;
        }
      } else if (type === 'check_out') {
        if (hasCheckOut) {
          showNotification('Operação Bloqueada', 'Já realizou a saída hoje.', 'warning');
          return;
        }
        if (hasLunchStart && !hasLunchEnd) {
          showNotification('Operação Bloqueada', 'Deve terminar o almoço antes de sair.', 'warning');
          return;
        }
      }
    }

    // Find nearest work site to associate with the log
    let nearestLoc: WorkLocation | null = null;
    let minDistance = Infinity;

    const permittedLocations = workLocations.filter(loc => loc.id === currentUser?.location_id);
    permittedLocations.forEach(loc => {
      const dist = getDistanceFromLatLonInM(coords.latitude, coords.longitude, loc.latitude, loc.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestLoc = loc;
      }
    });

    if (!nearestLoc || minDistance > nearestLoc.radius_meters) {
      await addNotification({
        title: 'Tentativa Fora do Raio',
        message: `${currentUser?.name} tentou um ${type} fora da zona permitida (a ${Math.round(minDistance)}m de ${nearestLoc?.name || 'qualquer obra'}).`,
        type: 'warning',
        app_user_id: 'managers'
      });
      showNotification('Operação Bloqueada', `Está a ${Math.round(minDistance)}m da obra. Aproxime-se para registar o ponto.`, 'error');
      setIsFloatingMenuOpen(false);
      setShowPunchConfirmation(null);
      return;
    }

    try {
      const record: Omit<TimeLog, 'id'> = {
        created_at: new Date().toISOString(),
        app_user_id: currentUser.id,
        work_location_id: nearestLoc.id,
        device_id: 'dev-' + Math.random().toString(36).substr(2, 5),
        timestamp: new Date().toISOString(),
        type,
        latitude: coords.latitude,
        longitude: coords.longitude,
        valid: true,
        employee_name: currentUser?.name || 'Funcionário',
        location_name: locationName
      };

      await addDoc(collection(db, 'time_logs'), record);

      await addNotification({
        title: type === 'check_in' ? 'Novo Check-in' : type === 'check_out' ? 'Novo Check-out' : type === 'lunch_start' ? 'Pausa Almoço' : 'Fim Almoço',
        message: `${currentUser?.name} registou ${type} em ${locationName}.`,
        type: 'info',
        app_user_id: 'managers'
      });

      if (type === 'check_in' || type === 'lunch_end') {
        setIsClockedIn(true);
        if (type === 'lunch_end') setIsOnLunch(false);
      } else if (type === 'check_out') {
        setIsClockedIn(false);
        setIsOnLunch(false);
      } else if (type === 'lunch_start') {
        setIsOnLunch(true);
      }

      setIsFloatingMenuOpen(false);
      setShowPunchConfirmation(null);

      showNotification(
        type === 'check_in' ? 'Entrada Confirmada' : type === 'check_out' ? 'Saída Confirmada' : type === 'lunch_start' ? 'Bom Almoço!' : 'Bom Trabalho!',
        `Registo de ${type} efetuado com sucesso.`,
        'success'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'time_logs');
    }
  }, [currentUser, timeLogs, workLocations, setIsClockedIn, setIsOnLunch, setIsFloatingMenuOpen, setShowPunchConfirmation]);

  const handleRequestOvertime = async (targetUserId: string, targetUserName: string, date: string, hours: number, reason: string) => {
    if (!currentUser) return;
    try {
      const newRequest = {
        user_id: targetUserId,
        user_name: targetUserName,
        requested_by_id: currentUser.id,
        requested_by_name: currentUser.name || currentUser.email,
        date,
        hours,
        reason,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      await addDoc(collection(db, 'overtime_requests'), newRequest);

      // Notify employee directly
      await addNotification({
        title: 'Pedido de Hora Extra',
        message: `${currentUser.name || currentUser.email} pede que faças ${hours}h extras no dia ${date}. Aceitas?`,
        type: 'warning',
        app_user_id: targetUserId
      });

      showNotification('Sucesso', 'Pedido de hora extra enviado ao funcionário.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'overtime_requests');
    }
  };

  const handleProcessOvertime = async (requestId: string, approve: boolean) => {
    if (!currentUser) return;
    try {
      const request = overtimeRequests.find(r => r.id === requestId);
      if (!request) return;

      const status = approve ? 'approved' : 'rejected';
      await updateDoc(doc(db, 'overtime_requests', requestId), {
        status,
        updated_at: new Date().toISOString(),
        approver_id: currentUser.id
      });

      await addNotification({
        title: approve ? 'Hora Extra Aceite' : 'Hora Extra Recusada',
        message: `O funcionário ${request.user_name} ${approve ? 'aceitou' : 'recusou'} fazer ${request.hours}h extra no dia ${request.date}.`,
        type: approve ? 'success' : 'warning',
        app_user_id: request.requested_by_id || 'all'
      });

      showNotification('Sucesso', `Pedido de hora extra ${approve ? 'aceite' : 'recusado'}.`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'overtime_requests');
    }
  };

  const handleLunchToggle = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;

    if (!currentUser.location_id) {
      showNotification('Obra não Atribuída', 'Não tem uma obra atribuída para registar pausa.', 'warning');
      return;
    }

    if (!isClockedIn) {
      showNotification('Operação Inválida', 'Você precisa estar em turno para iniciar uma pausa.', 'warning');
      return;
    }

    setIsCapturingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showNotification('Permissão Necessária', 'Precisamos de acesso ao GPS para validar a pausa.', 'error');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      // Anti-fraud: Verify if user is near a site or if policy requires it
      // For now we check if they are near ANY valid site if it's start of lunch
      let nearestLoc: WorkLocation | null = null;
      let minDistance = Infinity;

      const permittedLocations = workLocations.filter(loc => loc.id === currentUser?.location_id);
      permittedLocations.forEach(loc => {
        const d = getDistanceFromLatLonInM(latitude, longitude, loc.latitude, loc.longitude);
        if (d < minDistance) {
          minDistance = d;
          nearestLoc = loc;
        }
      });

      const type = isOnLunch ? 'lunch_end' : 'lunch_start';
      const locationName = nearestLoc ? nearestLoc.name : 'Local Desconhecido';

      await confirmPunch(type, { latitude, longitude }, locationName);

    } catch (error) {
      console.error('Lunch toggle error:', error);
      showNotification('Erro GPS', 'Não foi possível capturar sua localização.', 'error');
    } finally {
      setIsCapturingLocation(false);
    }
  }, [isAuthenticated, currentUser, isClockedIn, isOnLunch, workLocations, confirmPunch]);

  const handleGPSCheckInOut = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;

    if (!currentUser.location_id) {
      showNotification('Obra não Atribuída', 'Não tem uma obra atribuída para registar o ponto.', 'warning');
      return;
    }

    if (isClockedIn && isOnLunch) {
      showNotification('Operação Bloqueada', 'Deve finalizar sua pausa de almoço antes de registrar a saída.', 'warning');
      return;
    }

    setIsCapturingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showNotification('Acesso Restrito', 'O registo de ponto requere permissão de GPS ativa.', 'warning');
        setIsCapturingLocation(false);
        return;
      }

      // Use Balanced accuracy for speed unless it's a critical punch confirmation
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      let locationName = 'Localização GPS';
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (address) {
          locationName = `${address.street || ''}, ${address.city || ''}`.replace(/^, /, '').trim() || locationName;
        }
      } catch (e) {
        console.warn('Reverse geocode failed', e);
      }

      setShowPunchConfirmation({
        type: isClockedIn ? 'check_out' : 'check_in',
        coords: { latitude: location.coords.latitude, longitude: location.coords.longitude },
        locationName
      });
    } catch (error) {
      console.error(error);
      showNotification('Erro', 'Ocorreu um erro ao obter localização GPS.', 'error');
    } finally {
      setIsCapturingLocation(false);
    }
  }, [isAuthenticated, currentUser, isClockedIn, isOnLunch, confirmPunch]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showNotification('Permissão Negada', 'Precisamos de acesso à galeria para alterar a foto.', 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (currentUser) {
          setCurrentUser({ ...currentUser, avatar: result.assets[0].uri });
        }
      }
    } catch (error) {
      console.error(error);
      showNotification('Erro', 'Não foi possível carregar a imagem.', 'error');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      closeNotification();
      setIsCapturingLocation(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google login error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        showNotification('Erro de Configuração', 'O login com Google não está ativado no console do Firebase. Por favor, ative-o ou use o login personalizado.', 'error');
      } else if (error.code === 'auth/popup-blocked') {
        showNotification('Popup Bloqueado', 'O navegador bloqueou a janela de login. Por favor, permita popups para este site.', 'warning');
      } else {
        showNotification('Erro de Login', 'Não foi possível realizar o login com Google. Tente novamente ou use o login personalizado.', 'error');
      }
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handlePersonalizedLogin = async () => {
    setLoginError(null);
    setFieldErrors({});

    let hasErrors = false;
    const errors: { matricula?: string; password?: string } = {};

    if (!loginForm.matricula) {
      errors.matricula = 'O e-mail é obrigatório';
      hasErrors = true;
    }

    if (!loginForm.password) {
      errors.password = 'A palavra-passe é obrigatória';
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    closeNotification();
    setIsCapturingLocation(true);
    try {
      const emailLower = loginForm.matricula.toLowerCase().trim();

      // Usar Autenticação Real do Firebase
      await signInWithEmailAndPassword(auth, emailLower, loginForm.password);

      // O listener onAuthStateChanged tratará de definir o estado do utilizador
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        setLoginError('O login com e-mail/senha está desativado no Firebase Console. Ative em Autenticação -> Método de Login.');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setLoginError('E-mail ou Palavra-passe incorretos.');
      } else {
        setLoginError(error.message || 'Falha na autenticação. Verifique os seus dados.');
      }
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const addNotification = async (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead' | 'app_user_id'> & { app_user_id?: string }) => {
    try {
      const newNotif: Omit<NotificationItem, 'id'> = {
        ...notif,
        timestamp: Date.now(),
        isRead: false,
        app_user_id: notif.app_user_id || currentUser?.id || 'all'
      };

      await addDoc(collection(db, 'notifications'), newNotif);
    } catch (error) {
      console.error('Error adding notification:', error);
      // Fallback to local state if needed would go here, but with Firebase we trust Firestore
    }
  };

  const addSystemNotification = (title: string, message: string, targetUser: string = 'all', type: 'info' | 'warning' | 'success' = 'info') => {
    addNotification({ title, message, type, app_user_id: targetUser });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleLogout = async () => {
    try {
      console.log("Attempting logout...");
      await signOut(auth);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserRole('colaborador');
      setLoginForm({ matricula: '', password: '' });
      showNotification('Sessão Terminada', 'A sua sessão foi encerrada.', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Erro', 'Não foi possível sair do sistema.', 'error');
    }
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('os_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <ErrorModal />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={[styles.container, { backgroundColor: '#14233c', justifyContent: 'center' }]}>
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              style={{ alignItems: 'center' }}
            >
              <View style={styles.splashLogoContainer}>
                <View style={styles.splashLogoInner}>
                  <Text style={styles.splashLogoText}>os</Text>
                </View>
              </View>
              <View style={{ marginTop: 40, alignItems: 'center' }}>
                <Text style={styles.splashBrandText}>
                  OBJETIVO <Text style={{ color: '#00aeef' }}>SIMILAR</Text>
                </Text>
                <View style={styles.splashSeparator} />
                <View style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}>
                  <Text style={styles.splashSubText}>CALCULATING STRUCTURES</Text>
                  <Text style={styles.splashSubText}>LOADING 3D ENGINE</Text>
                </View>
              </View>
              <ActivityIndicator size="small" color="#00aeef" style={{ marginTop: 40 }} />
            </MotiView>
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  if (showOnboarding) {
    const slides = [
      { title: "Bem-vindo", desc: "Gestão operacional avançada.", icon: Rocket },
      { title: "Ponto Digital", desc: "Controle seguro via GPS.", icon: MapPin },
      { title: "Segurança", desc: "Protocolos em tempo real.", icon: ShieldCheck }
    ];
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NativeSafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0B101B' : 'white' }]}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <AnimatePresence>
                <MotiView
                  key={currentSlide}
                  from={{ opacity: 0, translateX: 50 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  exit={{ opacity: 0, translateX: -50 }}
                  style={{ alignItems: 'center' }}
                >
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(0,163,255,0.1)' }]}>
                    {React.createElement(slides[currentSlide].icon, { color: '#00A3FF', size: 48 })}
                  </View>
                  <Text style={[styles.h1, { color: isDarkMode ? 'white' : '#0F172A' }]}>{slides[currentSlide].title}</Text>
                  <Text style={[styles.p, { color: isDarkMode ? '#94a3b8' : '#64748B' }]}>{slides[currentSlide].desc}</Text>
                </MotiView>
              </AnimatePresence>
            </View>
            <View style={{ padding: 32, gap: 16 }}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => currentSlide < slides.length - 1 ? setCurrentSlide(prev => prev + 1) : finishOnboarding()}
              >
                <Text style={styles.primaryBtnText}>{currentSlide < slides.length - 1 ? "Próximo" : "Começar"}</Text>
              </TouchableOpacity>
            </View>
            <Modal transparent visible={notification.visible} animationType="none" onRequestClose={closeNotification}>
              <MotiView
                from={{ opacity: 0, scale: 0.9, translateY: 50 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                exit={{ opacity: 0, scale: 0.9, translateY: 50 }}
                style={styles.notifOverlay}
              >
                <View style={styles.customNotifCard}>
                  <View style={[styles.customNotifIconContainer, { backgroundColor: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#f59e0b' }]}>
                    {notification.type === 'success' ? <CheckCircle2 size={32} color="#fff" /> :
                      notification.type === 'error' ? <XCircle size={32} color="#fff" /> :
                        <AlertTriangle size={32} color="#fff" />}
                  </View>

                  <Text style={styles.customNotifTitle}>{notification.title}</Text>
                  <Text style={styles.customNotifMessage}>{notification.message}</Text>

                  <TouchableOpacity
                    style={[styles.customNotifButton, { backgroundColor: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#f59e0b' }]}
                    onPress={closeNotification}
                  >
                    <Text style={styles.customNotifButtonText}>ENTENDIDO</Text>
                  </TouchableOpacity>
                </View>
              </MotiView>
            </Modal>
          </NativeSafeAreaView>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <ErrorModal />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={[styles.container, { backgroundColor: '#14233c' }]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center' }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <MotiView
                  from={{ opacity: 0, translateY: 30 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={styles.loginLayout}
                >
                  <View style={styles.splashLogoContainer}>
                    <View style={[styles.splashLogoInner, { width: 60, height: 60 }]}>
                      <Text style={[styles.splashLogoText, { fontSize: 28 }]}>os</Text>
                    </View>
                  </View>

                  <Text style={styles.loginTitle}>OBJETIVO <Text style={{ color: '#00aeef' }}>SIMILAR</Text></Text>
                  <Text style={styles.loginSubtitle}>App de Gestão Operacional</Text>

                  <View style={styles.loginFormContainer}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.fieldLabel}>E-MAIL</Text>
                      <View style={[styles.fieldWrapper, {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderColor: fieldErrors.matricula ? '#ef4444' : 'rgba(255,255,255,0.2)',
                        borderWidth: fieldErrors.matricula ? 1 : 1
                      }]}>
                        <User size={18} color={fieldErrors.matricula ? '#ef4444' : '#00aeef'} />
                        <TextInput
                          placeholder="Ex: ricardo@objetivo.pt"
                          placeholderTextColor="rgba(255,255,255,0.5)"
                          style={styles.fieldInput}
                          value={loginForm.matricula}
                          onChangeText={(v) => {
                            setLoginForm({ ...loginForm, matricula: v });
                            if (fieldErrors.matricula) setFieldErrors({ ...fieldErrors, matricula: undefined });
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                      {fieldErrors.matricula && (
                        <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 4, marginLeft: 4 }}>{fieldErrors.matricula}</Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.fieldLabel}>PALAVRA-PASSE</Text>
                      <View style={[styles.fieldWrapper, {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderColor: fieldErrors.password ? '#ef4444' : 'rgba(255,255,255,0.2)',
                        borderWidth: fieldErrors.password ? 1 : 1
                      }]}>
                        <Lock size={18} color={fieldErrors.password ? '#ef4444' : '#00aeef'} />
                        <TextInput
                          placeholder="••••••••"
                          placeholderTextColor="rgba(255,255,255,0.5)"
                          style={styles.fieldInput}
                          value={loginForm.password}
                          onChangeText={(v) => {
                            setLoginForm({ ...loginForm, password: v });
                            if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                          }}
                          secureTextEntry
                        />
                      </View>
                      {fieldErrors.password && (
                        <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 4, marginLeft: 4 }}>{fieldErrors.password}</Text>
                      )}
                    </View>

                    {loginError && (
                      <MotiView
                        from={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        style={{ marginBottom: 16 }}
                      >
                        <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '500' }}>{loginError}</Text>
                      </MotiView>
                    )}

                    <TouchableOpacity
                      style={styles.brandButton}
                      onPress={handlePersonalizedLogin}
                      activeOpacity={0.8}
                    >
                      {isCapturingLocation ? (
                        <ActivityIndicator color="#14233c" size="small" />
                      ) : (
                        <Text style={styles.brandButtonText}>ACEDER AO SISTEMA</Text>
                      )}
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 16 }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                      <Text style={{ marginHorizontal: 12, color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700' }}>OU ACESSO DIGITAL</Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    </View>

                    <TouchableOpacity
                      style={[styles.secondaryBtn, { backgroundColor: 'white', flexDirection: 'row', gap: 12, height: 56, borderRadius: 16 }]}
                      onPress={handleGoogleLogin}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                        style={{ width: 22, height: 22 }}
                      />
                      <Text style={[styles.secondaryBtnText, { color: '#14233c', fontWeight: '800' }]}>ENTRAR COM GOOGLE</Text>
                    </TouchableOpacity>

                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 12, fontStyle: 'italic' }}>
                      * O acesso ao sistema é independente da sua localização.
                    </Text>

                    <View style={styles.loginInfoBox}>
                      <ShieldAlert size={14} color="#f0cc4a" />
                      <Text style={styles.loginInfoText}>Ambiente seguro e monitorizado</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setShowServerConfig(true)}
                      style={{ marginTop: 32, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                    >
                      <Settings2 size={16} color="rgba(255,255,255,0.3)" />
                      <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700' }}>CONFIGURAÇÕES DE SERVIDOR</Text>
                    </TouchableOpacity>


                  </View>
                </MotiView>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>

          <Modal transparent visible={notification.visible} animationType="none" onRequestClose={closeNotification}>
            <MotiView
              from={{ opacity: 0, scale: 0.9, translateY: 50 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, translateY: 50 }}
              style={styles.notifOverlay}
            >
              <View style={styles.customNotifCard}>
                <View style={[styles.customNotifIconContainer, { backgroundColor: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#f59e0b' }]}>
                  {notification.type === 'success' ? <CheckCircle2 size={32} color="#fff" /> :
                    notification.type === 'error' ? <XCircle size={32} color="#fff" /> :
                      <AlertTriangle size={32} color="#fff" />}
                </View>

                <Text style={styles.customNotifTitle}>{notification.title}</Text>
                <Text style={styles.customNotifMessage}>{notification.message}</Text>

                <TouchableOpacity
                  style={[styles.customNotifButton, { backgroundColor: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#f59e0b' }]}
                  onPress={closeNotification}
                >
                  <Text style={styles.customNotifButtonText}>ENTENDIDO</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          </Modal>
          <ServerConfigModal
            visible={showServerConfig}
            onClose={() => setShowServerConfig(false)}
            apiUrl={customApiUrl}
            onSave={setCustomApiUrl}
            isDarkMode={isDarkMode}
          />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NativeSafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0B101B' : '#FFFFFF' }]}>
          <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

          {/* Error Handling Modal */}
          <ErrorModal />

          {/* Simulated Push Notification Global Toast */}
          {pushEnabled && currentPush && (
            <AnimatePresence>
              <MotiView
                from={{ opacity: 0, translateY: -50 }}
                animate={{ opacity: 1, translateY: 10 }}
                exit={{ opacity: 0, translateY: -50 }}
                style={{
                  position: 'absolute', top: 50, left: 16, right: 16, zIndex: 9999,
                  backgroundColor: isDarkMode ? '#1e293b' : 'white', borderRadius: 16, padding: 16,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
                  flexDirection: 'row', alignItems: 'center'
                }}
              >
                <View style={{ backgroundColor: '#00A3FF', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={20} color="white" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: isDarkMode ? 'white' : '#0F172A' }}>{currentPush.title}</Text>
                  <Text style={{ fontSize: 13, color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>{currentPush.message}</Text>
                </View>
              </MotiView>
            </AnimatePresence>
          )}

          {/* Notifications Modal */}
          <Modal visible={showNotificationsModal} transparent animationType="fade" onRequestClose={() => setShowNotificationsModal(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(20,35,60,0.85)', justifyContent: 'center', padding: 20 }}>
              <MotiView
                from={{ opacity: 0, scale: 0.95, translateY: 20 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                style={{ backgroundColor: isDarkMode ? '#0B101B' : 'white', borderRadius: 32, padding: 24, maxHeight: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 15 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                  <View>
                    <Text style={{ fontSize: 28, fontWeight: '900', color: isDarkMode ? 'white' : '#0F172A', letterSpacing: -1 }}>Notificações</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#00A3FF' }} />
                      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>{notifications.filter(n => !n.isRead).length} novos alertas</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setShowNotificationsModal(false)} style={{ padding: 12, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0' }}>
                    <X size={24} color={isDarkMode ? 'white' : '#64748B'} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                  {notifications.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#64748B', marginVertical: 30 }}>Nenhuma notificação.</Text>
                  ) : (
                    notifications.map(n => (
                      <TouchableOpacity
                        key={n.id}
                        onPress={() => markNotificationAsRead(n.id)}
                        style={{
                          backgroundColor: n.isRead ? (isDarkMode ? '#1e293b' : 'transparent') : (n.type === 'warning' ? 'rgba(254,74,73,0.1)' : 'rgba(0,163,255,0.1)'),
                          borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: 16, padding: 16, marginBottom: 12,
                          flexDirection: 'row', opacity: n.isRead ? 0.6 : 1
                        }}
                      >
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: n.type === 'warning' ? '#FE4A49' : '#00A3FF', marginTop: 6 }} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: isDarkMode ? 'white' : '#1e293b' }}>{n.title}</Text>
                          <Text style={{ fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#64748B', marginTop: 4 }}>{n.message}</Text>
                        </View>
                        {!n.isRead && <Check size={16} color="#10b981" />}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
                <TouchableOpacity onPress={clearNotifications} style={[styles.secondaryBtn, { marginTop: 16 }]}>
                  <Text style={styles.secondaryBtnText}>LIMPAR TUDO</Text>
                </TouchableOpacity>
              </MotiView>
            </View>
          </Modal>

          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium' }]}>Objetivo <Text style={{ color: '#00A3FF' }}>Similar</Text></Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.liveDot, { width: 8, height: 8 }]} />
                <Text style={styles.headerSubtitle}>Sistema Operacional v2.4</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowNotificationsModal(true)} style={styles.headerActionBtn}>
                <Bell size={20} color={isDarkMode ? 'white' : '#14233c'} />
                {notifications.some(n => !n.isRead) && <View style={styles.notifBadgeSmall} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={styles.headerActionBtn}>
                {isDarkMode ? <Sun size={20} color="white" /> : <Moon size={20} color="#14233c" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={[styles.headerActionBtn, { backgroundColor: '#ef444420' }]}>
                <LogOut size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <MotiView
              key={activeTab}
              from={{ opacity: 0, translateX: 10, scale: 0.98 }}
              animate={{ opacity: 1, translateX: 0, scale: 1 }}
              exit={{ opacity: 0, translateX: -10, scale: 0.98 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              {activeTab === 'home' && (
                <View style={{ gap: 16 }}>
                  {/* Welcome Bento Node */}
                  <View style={styles.welcomeBento}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bentoMuted}>GESTÃO DE ATIVOS</Text>
                      <Text style={styles.bentoLarge}>Olá, {currentUser?.name?.split(' ')[0]}</Text>
                      <View style={styles.bentoRoleBadge}>
                        <ShieldCheck size={10} color="#00aeef" />
                        <Text style={styles.bentoRoleText}>{currentUser?.role?.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.bentoAvatarContainer}>
                      {currentUser?.avatar ? (
                        <Image source={{ uri: currentUser.avatar }} style={styles.bentoAvatar} />
                      ) : (
                        <View style={styles.bentoAvatarPlaceholder}>
                          <User size={32} color="white" />
                        </View>
                      )}
                      <View style={styles.onlineStatusRing} />
                    </View>
                  </View>

                  {/* Bento Grid Row 1 */}
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={[styles.bentoNode, { flex: 1.2, height: 180, backgroundColor: '#14233c' }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={[styles.bentoMuted, { color: 'rgba(255,255,255,0.4)' }]}>PONTO DIGITAL</Text>
                        <Wifi size={14} color="#00aeef" />
                      </View>
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={[styles.bentoTime, { color: isClockedIn ? '#10b981' : 'white' }]}>{format(new Date(), 'HH:mm')}</Text>
                        <Text style={[styles.bentoSub, { color: 'rgba(255,255,255,0.5)' }]}>
                          {isClockedIn ? 'Turno a decorrer' : 'Fora de turno'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                        {(() => {
                          const { hasCheckIn, hasCheckOut, hasLunchStart, hasLunchEnd } = todayStats;

                          const checkInText = hasCheckIn ? 'JÁ ENTROU' : 'ENTRADA';
                          const checkOutText = hasCheckOut ? 'JÁ SAIU' : 'SAÍDA';
                          const lunchText = hasLunchEnd ? 'ALMOÇO [X]' : (isOnLunch ? 'FIM PAUSA' : 'ALMOÇO');

                          const hasLocation = !!currentUser?.location_id;
                          const mainActionDisabled = !hasLocation || hasCheckOut || (isClockedIn ? (hasLunchStart && !hasLunchEnd) : hasCheckIn);
                          const lunchActionDisabled = !hasLocation || hasLunchEnd || !isClockedIn || (isOnLunch ? false : hasLunchStart);

                          return (
                            <>
                              <TouchableOpacity
                                disabled={mainActionDisabled}
                                style={[
                                  styles.bentoActionBtn,
                                  { flex: 1, backgroundColor: isClockedIn ? '#f0cc4a' : '#00A3FF', opacity: mainActionDisabled ? 0.3 : 1 }
                                ]}
                                onPress={handleGPSCheckInOut}
                              >
                                <Text style={[styles.bentoActionText, { color: isClockedIn ? '#14233c' : 'white' }]}>
                                  {!hasLocation ? 'SEM OBRA' : (isClockedIn ? checkOutText : checkInText)}
                                </Text>
                                <ChevronRight size={14} color={isClockedIn ? '#14233c' : 'white'} />
                              </TouchableOpacity>

                              {isClockedIn && (
                                <TouchableOpacity
                                  disabled={lunchActionDisabled}
                                  style={[
                                    styles.bentoActionBtn,
                                    { flex: 1, backgroundColor: isOnLunch ? '#ef4444' : '#10b981', opacity: lunchActionDisabled ? 0.3 : 1 }
                                  ]}
                                  onPress={handleLunchToggle}
                                >
                                  <Text style={[styles.bentoActionText, { color: 'white' }]}>
                                    {!hasLocation ? 'BLOQUEADO' : lunchText}
                                  </Text>
                                  <Coffee size={14} color="white" />
                                </TouchableOpacity>
                              )}
                            </>
                          );
                        })()}
                      </View>
                      <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 8, textAlign: 'center' }}>Registo GPS obrigatório</Text>
                    </View>

                    <View style={[styles.bentoNode, { flex: 1, height: 180, backgroundColor: isDarkMode ? '#1e293b' : 'white', justifyContent: 'center' }]}>
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={styles.circularProgressContainer}>
                          <Svg width="80" height="80">
                            <SvgCircle cx="40" cy="40" r="35" stroke={isDarkMode ? '#334155' : '#f1f5f9'} strokeWidth="6" fill="none" />
                            <SvgCircle
                              cx="40" cy="40" r="35"
                              stroke={isOnLunch ? '#ef4444' : (isClockedIn ? '#10b981' : '#00A3FF')}
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray="220"
                              strokeDashoffset={isOnLunch ? 165 : 55}
                              strokeLinecap="round"
                            />
                          </Svg>
                          <View style={styles.circularCenter}>
                            {isOnLunch ? (
                              <Coffee size={24} color="#ef4444" />
                            ) : (
                              <Text style={[styles.circularVal, { color: isDarkMode ? 'white' : '#14233c' }]}>
                                {isClockedIn ? 'ON' : '75%'}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <Text style={[styles.bentoSub, { textAlign: 'center', color: isDarkMode ? '#64748B' : '#94A3B8' }]}>
                        {isOnLunch ? 'Em Pausa' : (isClockedIn ? 'Trabalhando' : 'Meta Semanal')}
                      </Text>
                    </View>
                  </View>

                  {/* Integrated Worksites Map */}
                  <View style={{ backgroundColor: isDarkMode ? '#111111' : 'white', borderRadius: 24, overflow: 'hidden', height: 260, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <MapView
                      style={{ flex: 1 }}
                      initialRegion={{
                        latitude: visibleWorkLocations[0]?.latitude || 38.7223,
                        longitude: visibleWorkLocations[0]?.longitude || -9.1393,
                        latitudeDelta: 0.12,
                        longitudeDelta: 0.12,
                      }}
                      customMapStyle={isDarkMode ? undefined : []} // In a real app we'd use a custom dark style JSON
                    >
                      {visibleWorkLocations.map(loc => (
                        <Marker
                          key={loc.id}
                          coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                          onPress={() => setSelectedProjectForDetails(loc)}
                        >
                          <View style={{ alignItems: 'center' }}>
                            <View style={{ backgroundColor: 'rgba(20,35,60,0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                              <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>{loc.name.toUpperCase()}</Text>
                            </View>
                            <View style={{ backgroundColor: loc.themeColor || '#00A3FF', padding: 6, borderRadius: 12, borderWidth: 2, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 }}>
                              <Construction size={14} color="white" />
                            </View>
                          </View>
                        </Marker>
                      ))}
                      {employeesList.filter(emp => currentUser?.role === 'super_admin' || emp.role !== 'super_admin').map(emp => {
                        if (!emp.last_location) return null;
                        const empLogs = timeLogs.filter(l => l.app_user_id === emp.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                        const isClocked = empLogs.length > 0 && empLogs[0].type === 'check_in' && isSameDay(new Date(empLogs[0].timestamp), new Date());
                        if (!isClocked) return null;

                        return (
                          <Marker coordinate={{ latitude: emp.last_location.latitude, longitude: emp.last_location.longitude }} key={`live-op-${emp.id}`}>
                            <View style={{ alignItems: 'center' }}>
                              <View style={{ backgroundColor: emp.last_location.out_of_bounds ? '#FE4A49' : '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginBottom: 2 }}>
                                <Text style={{ color: 'white', fontSize: 8, fontWeight: 'bold' }}>{emp.name?.substring(0, 10)}...</Text>
                              </View>
                              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: emp.last_location.out_of_bounds ? '#FE4A49' : '#10b981', borderWidth: 2, borderColor: 'white' }} />
                            </View>
                          </Marker>
                        );
                      })}
                    </MapView>
                    <View style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>MAPA OPERACIONAL DE OBRAS</Text>
                    </View>
                  </View>

                  {/* Summary Row */}
                  <View style={{ backgroundColor: '#14233c', padding: 20, borderRadius: 24, marginVertical: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <View>
                        <Text style={[styles.bentoMuted, { color: 'rgba(255,255,255,0.6)' }]}>RESUMO MENSAL</Text>
                        <Text style={[styles.bentoLarge, { fontSize: 24, fontWeight: '900', color: 'white', marginTop: -4, textTransform: 'capitalize' }]}>{format(new Date(), 'MMMM', { locale: ptBR })}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.iconGhostBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                        onPress={() => {
                          if (!currentUser) return;
                          if (isAdmin || isGestor) {
                            handleExportGeneral();
                          } else {
                            handleExportIndividual(currentUser);
                          }
                        }}
                      >
                        <Download size={18} color="white" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                      {[
                        { label: 'PRESENÇA', val: '100%', color: '#10b981' },
                        { label: 'HORAS', val: monthlyHours, color: '#00A3FF' },
                        { label: 'STATUS', val: 'OTIMIZADO', color: '#f0cc4a' }
                      ].map((stat, i) => (
                        <View key={i} style={{ alignItems: 'center' }}>
                          <Text style={[styles.mono, { fontSize: 18, fontWeight: '900', color: stat.color }]}>{stat.val}</Text>
                          <Text style={[styles.bentoMuted, { fontSize: 8, marginTop: 8, color: 'rgba(255,255,255,0.6)' }]}>{stat.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {isGestor && (
                    <View style={{ backgroundColor: '#14233c', padding: 20, borderRadius: 24, marginVertical: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={[styles.bentoMuted, { color: 'rgba(255,255,255,0.6)' }]}>CONTROLE DE OBRAS</Text>
                        <TrendingUp size={16} color="#00A3FF" />
                      </View>
                      <View style={{ gap: 20 }}>
                        {visibleWorkLocations.slice(0, 2).map(p => (
                          <TouchableOpacity key={p.id} onPress={() => setSelectedProjectForDetails(p)} activeOpacity={0.7}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                              <Text style={{ fontSize: 14, fontWeight: '900', color: 'white' }}>{p.name}</Text>
                              <Text style={[styles.mono, { fontSize: 12, color: p.themeColor || '#00A3FF' }]}>{p.progress || 0}%</Text>
                            </View>
                            <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                              <MotiView
                                from={{ width: 0 }}
                                animate={{ width: `${p.progress || 0}%` }}
                                transition={{ type: 'spring', damping: 20 }}
                                style={{ height: '100%', backgroundColor: p.themeColor || '#00A3FF' }}
                              />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {showPunchConfirmation && (
                    <PunchConfirmationModal
                      type={showPunchConfirmation.type}
                      coords={showPunchConfirmation.coords}
                      locationName={showPunchConfirmation.locationName}
                      isDarkMode={isDarkMode}
                      onConfirm={() => confirmPunch(showPunchConfirmation.type, showPunchConfirmation.coords, showPunchConfirmation.locationName)}
                      onCancel={() => setShowPunchConfirmation(null)}
                    />
                  )}
                </View>
              )}

              {activeTab === 'projects' && (
                <View style={{ gap: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.sectionTitle}>CENTRAL DE OBRAS</Text>
                    {(isAdmin || isGestor || currentUser?.can_manage_projects) && (
                      <TouchableOpacity
                        style={styles.headerActionBtn}
                        onPress={() => {
                          setShowProjectForm(!showProjectForm);
                        }}
                      >
                        <Plus size={20} color={isDarkMode ? 'white' : '#14233c'} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Projects Overview Map */}
                  <View style={{ backgroundColor: isDarkMode ? '#111111' : 'white', borderRadius: 24, overflow: 'hidden', height: 300, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <MapView
                      style={{ flex: 1 }}
                      initialRegion={{
                        latitude: visibleWorkLocations[0]?.latitude || 38.7223,
                        longitude: visibleWorkLocations[0]?.longitude || -9.1393,
                        latitudeDelta: 0.5,
                        longitudeDelta: 0.5,
                      }}
                    >
                      {visibleWorkLocations.map(loc => (
                        <Marker
                          key={loc.id}
                          coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                          onPress={() => setSelectedProjectForDetails(loc)}
                        >
                          <View style={{ alignItems: 'center' }}>
                            <View style={{ backgroundColor: 'rgba(20,35,60,0.85)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginBottom: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                              <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>{loc.name.toUpperCase()}</Text>
                            </View>
                            <View style={{ backgroundColor: loc.themeColor || '#00A3FF', padding: 8, borderRadius: 16, borderWidth: 3, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 }}>
                              <Construction size={18} color="white" />
                            </View>
                          </View>
                        </Marker>
                      ))}
                      {employeesList.filter(emp => currentUser?.role === 'super_admin' || emp.role !== 'super_admin').map(emp => {
                        if (!emp.last_location) return null;
                        const empLogs = timeLogs.filter(l => l.app_user_id === emp.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                        const isClocked = empLogs.length > 0 && empLogs[0].type === 'check_in' && isSameDay(new Date(empLogs[0].timestamp), new Date());
                        if (!isClocked) return null;

                        return (
                          <Marker coordinate={{ latitude: emp.last_location.latitude, longitude: emp.last_location.longitude }} key={`live-${emp.id}`}>
                            <View style={{ alignItems: 'center' }}>
                              <View style={{ backgroundColor: emp.last_location.out_of_bounds ? '#FE4A49' : '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginBottom: 2 }}>
                                <Text style={{ color: 'white', fontSize: 8, fontWeight: 'bold' }}>{emp.name?.substring(0, 10)}...</Text>
                              </View>
                              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: emp.last_location.out_of_bounds ? '#FE4A49' : '#10b981', borderWidth: 2, borderColor: 'white' }} />
                            </View>
                          </Marker>
                        );
                      })}
                    </MapView>
                    <View style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(20,35,60,0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>VISTA GERAL DE ESTALEIROS</Text>
                    </View>
                  </View>

                  {showProjectForm && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.9, translateY: -20 }}
                      animate={{ opacity: 1, scale: 1, translateY: 0 }}
                      style={{ backgroundColor: isDarkMode ? '#111111' : 'white', borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c', letterSpacing: -0.5 }}>{editingProjectId ? 'Editar Obra' : 'Configurar Novo Estaleiro'}</Text>
                        <TouchableOpacity onPress={() => { setShowProjectForm(false); setEditingProjectId(null); }} style={{ padding: 4 }}>
                          <X size={20} color="#64748B" />
                        </TouchableOpacity>
                      </View>

                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#00A3FF', marginBottom: 8, letterSpacing: 1 }}>IDENTIFICAÇÃO</Text>
                      <View style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0', marginBottom: 16 }]}>
                        <TextInput
                          style={{ flex: 1, color: isDarkMode ? 'white' : '#0F172A', fontSize: 15, fontWeight: '600' }}
                          placeholder="Nome da Obra..."
                          placeholderTextColor="#94A3B8"
                          value={newProject.name}
                          onChangeText={text => setNewProject({ ...newProject, name: text })}
                        />
                      </View>

                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#00A3FF', marginBottom: 8, letterSpacing: 1 }}>GEOLOCALIZAÇÃO</Text>
                      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                        <View style={[styles.fieldWrapper, { flex: 1, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0', marginBottom: 0 }]}>
                          <TextInput
                            style={{ flex: 1, color: isDarkMode ? 'white' : '#0F172A', fontSize: 15 }}
                            placeholder="Procurar morada..."
                            placeholderTextColor="#94A3B8"
                            value={newProject.addressSearch}
                            onChangeText={text => setNewProject({ ...newProject, addressSearch: text })}
                            onSubmitEditing={searchAddress}
                          />
                        </View>
                        <TouchableOpacity
                          style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
                          onPress={searchAddress}
                          disabled={isCapturingLocation}
                        >
                          <Search size={20} color="#64748B" />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, backgroundColor: 'rgba(0,163,255,0.05)', borderWidth: 1, borderColor: 'rgba(0,163,255,0.1)', borderStyle: 'dashed', marginBottom: 16 }}
                        onPress={captureCurrentLocationForProject}
                        disabled={isCapturingLocation}
                      >
                        {isCapturingLocation ? (
                          <ActivityIndicator size="small" color="#00A3FF" />
                        ) : (
                          <>
                            <MapPin size={16} color="#00A3FF" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#00A3FF', fontWeight: '800', fontSize: 12 }}>OBTER COORDENADAS ATUAIS</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                        <View style={{ flex: 1 }}>
                          <View style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0', marginBottom: 0 }]}>
                            <TextInput
                              style={{ flex: 1, color: isDarkMode ? 'white' : '#0F172A', fontSize: 14 }}
                              placeholder="LAT"
                              placeholderTextColor="#94A3B8"
                              keyboardType="numeric"
                              value={newProject.latitude}
                              onChangeText={text => setNewProject({ ...newProject, latitude: text })}
                            />
                          </View>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0', marginBottom: 0 }]}>
                            <TextInput
                              style={{ flex: 1, color: isDarkMode ? 'white' : '#0F172A', fontSize: 14 }}
                              placeholder="LON"
                              placeholderTextColor="#94A3B8"
                              keyboardType="numeric"
                              value={newProject.longitude}
                              onChangeText={text => setNewProject({ ...newProject, longitude: text })}
                            />
                          </View>
                        </View>
                      </View>

                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#00A3FF', marginBottom: 8, letterSpacing: 1 }}>PARÂMETROS DE ACESSO</Text>
                      <View style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0', marginBottom: 24 }]}>
                        <TextInput
                          style={{ flex: 1, color: isDarkMode ? 'white' : '#0F172A', fontSize: 15 }}
                          placeholder="Raio de validação (metros)"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={newProject.radius_meters}
                          onChangeText={text => setNewProject({ ...newProject, radius_meters: text })}
                        />
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B' }}>METROS</Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: '#00A3FF', marginBottom: 8, letterSpacing: 1 }}>DATA INÍCIO</Text>
                          <TextInput
                            style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', marginBottom: 0 }]}
                            placeholder="AAAA-MM-DD"
                            value={newProject.start_date}
                            onChangeText={text => setNewProject({ ...newProject, start_date: text })}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: '#00A3FF', marginBottom: 8, letterSpacing: 1 }}>FIM PREVISTO</Text>
                          <TextInput
                            style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', marginBottom: 0 }]}
                            placeholder="AAAA-MM-DD"
                            value={newProject.end_date}
                            onChangeText={text => setNewProject({ ...newProject, end_date: text })}
                          />
                        </View>
                      </View>

                      <TouchableOpacity
                        style={{ backgroundColor: '#00A3FF', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#00A3FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                        onPress={editingProjectId ? handleUpdateProject : handleAddProject}
                      >
                        <Text style={{ color: 'white', fontWeight: '900', fontSize: 15, letterSpacing: 1 }}>{editingProjectId ? 'ATUALIZAR OBRA' : 'CONFIRMAR REGISTO'}</Text>
                      </TouchableOpacity>
                    </MotiView>
                  )}

                  {visibleWorkLocations.map(p => {
                    const colabCount = employeesList.filter(e => e.location_id === p.id).length;
                    let daysRemaining = '-';
                    if (p.end_date) {
                      const remaining = differenceInDays(new Date(p.end_date), new Date());
                      daysRemaining = remaining > 0 ? `${remaining}d` : 'Fim';
                    }
                    return (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        key={p.id}
                        onPress={() => setSelectedProjectForDetails(p)}
                        style={[styles.projectCardPremium, { backgroundColor: isDarkMode ? '#111111' : 'white', borderColor: isDarkMode ? 'white/5' : 'rgba(0,0,0,0.05)' }]}
                      >
                        <View style={styles.projectImageContainer}>
                          <Image source={{ uri: p.image || 'https://picsum.photos/800/600' }} style={styles.projectImagePremium} />
                          <View style={[styles.projectStatusBadge, { backgroundColor: p.status === 'active' ? '#10b981' : '#f0cc4a' }]}>
                            <Text style={styles.projectStatusText}>{(p.status || 'ATIVO').toUpperCase()}</Text>
                          </View>
                        </View>

                        <View style={styles.projectInfoPremium}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.projectTitlePremium, { color: isDarkMode ? 'white' : '#14233c' }]}>{p.name}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <MapPin size={10} color="#64748B" />
                                <Text style={styles.projectLocPremium}>{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</Text>
                              </View>
                            </View>
                            {isGestor && (
                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                  onPress={() => {
                                    setEditingProjectId(p.id);
                                    setNewProject({
                                      name: p.name,
                                      addressSearch: '',
                                      latitude: (p.latitude || 0).toString(),
                                      longitude: (p.longitude || 0).toString(),
                                      radius_meters: (p.radius_meters || 500).toString(),
                                      start_date: p.start_date || '',
                                      end_date: p.end_date || ''
                                    });
                                    setShowProjectForm(true);
                                  }}
                                  style={styles.iconGhostBtn}
                                >
                                  <Edit2 size={14} color="#00A3FF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => {
                                    if (Platform.OS === 'web') {
                                      const val = window.prompt("Insira a nova percentagem (0-100):", String(p.progress || 0));
                                      if (val !== null) {
                                        const prog = parseInt(val || '0');
                                        if (!isNaN(prog)) {
                                          const finalProg = Math.min(100, Math.max(0, prog));
                                          updateDoc(doc(db, 'work_locations', p.id), { progress: finalProg }).catch(e => console.error(e));
                                          setWorkLocations(prev => prev.map(proj => proj.id === p.id ? { ...proj, progress: finalProg } : proj));
                                        }
                                      }
                                    } else {
                                      Alert.prompt(
                                        "Editar Progresso",
                                        "Insira a nova percentagem (0-100):",
                                        [
                                          { text: "Cancelar", style: "cancel" },
                                          {
                                            text: "Atualizar", onPress: async (val) => {
                                              const prog = parseInt(val || '0');
                                              if (!isNaN(prog)) {
                                                const finalProg = Math.min(100, Math.max(0, prog));
                                                try {
                                                  await updateDoc(doc(db, 'work_locations', p.id), { progress: finalProg });
                                                  setWorkLocations(prev => prev.map(proj =>
                                                    proj.id === p.id ? { ...proj, progress: finalProg } : proj
                                                  ));
                                                } catch (e) {
                                                  console.error(e);
                                                }
                                              }
                                            }
                                          }
                                        ],
                                        'plain-text',
                                        String(p.progress || 0)
                                      );
                                    }
                                  }}
                                  style={styles.iconGhostBtn}
                                >
                                  <Settings size={14} color="#64748B" />
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>

                          <View style={{ marginTop: 20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                              <Text style={styles.bentoMuted}>PROGRESSO ATUAL</Text>
                              <Text style={[styles.mono, { fontSize: 12, color: p.themeColor || '#00aeef' }]}>{p.progress || 0}%</Text>
                            </View>
                            <View style={[styles.progressBarPremium, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
                              <MotiView
                                from={{ width: 0 }}
                                animate={{ width: `${p.progress || 0}%` }}
                                transition={{ type: 'spring', damping: 20 }}
                                style={[styles.progressFillPremium, { backgroundColor: p.themeColor || '#00aeef' }]}
                              />
                            </View>
                          </View>

                          <View style={styles.projectFooter}>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                              <View style={{ alignItems: 'center' }}>
                                <Text style={[styles.mono, { fontSize: 10, color: isDarkMode ? 'white' : '#14233c' }]}>{colabCount}</Text>
                                <Text style={styles.bentoMuted}>COLAB.</Text>
                              </View>
                              <View style={{ width: 1, height: 16, backgroundColor: 'rgba(100, 116, 139, 0.2)', alignSelf: 'center' }} />
                              <View style={{ alignItems: 'center' }}>
                                <Text style={[styles.mono, { fontSize: 10, color: isDarkMode ? 'white' : '#14233c' }]}>{daysRemaining}</Text>
                                <Text style={styles.bentoMuted}>RESTA</Text>
                              </View>
                            </View>
                            <TouchableOpacity onPress={() => {
                              if (isGestor) {
                                Alert.alert(
                                  'Eliminar Obra',
                                  'Deseja eliminar esta obra?',
                                  [
                                    { text: 'Não', style: 'cancel' },
                                    { text: 'Sim', style: 'destructive', onPress: () => handleDeleteProject(p.id, p.name) }
                                  ]
                                );
                              }
                            }}>
                              <X size={16} color="#ef4444" opacity={0.5} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )
                  })}

                  {isGestor && visibleWorkLocations.length === 0 && (
                    <Text style={styles.placeholderText}>Nenhuma obra registada.</Text>
                  )}

                  {selectedProjectForDetails && (
                    <ProjectDetailsModal
                      project={selectedProjectForDetails}
                      onClose={() => setSelectedProjectForDetails(null)}
                      isDarkMode={isDarkMode}
                      employeesList={employeesList}
                      timeLogs={timeLogs}
                    />
                  )}
                </View>
              )}

              {activeTab === 'attendance' && (
                <View style={{ gap: 20 }}>
                  {attendanceMode === 'management' && isGestor && notifications.some(n => !n.isRead) && (
                    <View style={[styles.glassCard, { backgroundColor: 'rgba(254, 74, 73, 0.05)', borderColor: 'rgba(254, 74, 73, 0.1)', padding: 16 }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ShieldAlert size={18} color="#FE4A49" />
                          <Text style={[styles.bentoMuted, { color: '#FE4A49' }]}>ALERTAS DE CONFORMIDADE</Text>
                        </View>
                        <TouchableOpacity onPress={clearNotifications}>
                          <Text style={{ fontSize: 9, fontWeight: '900', color: '#FE4A49' }}>LIMPAR</Text>
                        </TouchableOpacity>
                      </View>
                      {notifications.filter(n => !n.isRead && n.type === 'warning').slice(0, 2).map(n => (
                        <MotiView
                          key={n.id}
                          from={{ opacity: 0, translateX: -10 }}
                          animate={{ opacity: 1, translateX: 0 }}
                          style={[styles.glassCard, { backgroundColor: 'white', padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }]}
                        >
                          <AlertCircle size={14} color="#FE4A49" />
                          <Text style={{ fontSize: 11, color: '#14233c', flex: 1, marginLeft: 8 }}>{n.message}</Text>
                          <TouchableOpacity onPress={() => markNotificationAsRead(n.id)} style={styles.iconGhostBtn}>
                            <Check size={14} color="#10b981" />
                          </TouchableOpacity>
                        </MotiView>
                      ))}
                    </View>
                  )}

                  {attendanceMode === 'personal' && isWorker && !isClockedIn && (
                    <MotiView
                      from={{ opacity: 0, translateY: -20 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      style={styles.reminderBanner}
                    >
                      <View style={styles.reminderIconBox}>
                        <Clock size={20} color="#00aeef" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reminderTitle}>Lembrete de Ponto</Text>
                        <Text style={styles.reminderDesc}>Ainda não registou a sua entrada de hoje ({format(new Date(), 'dd MMM')}).</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.reminderActionBtn}
                        onPress={() => setActiveTab('home')}
                      >
                        <Text style={styles.reminderActionText}>REGISTRAR</Text>
                      </TouchableOpacity>
                    </MotiView>
                  )}

                  <View style={styles.segmentControlPremium}>
                    <TouchableOpacity
                      style={[styles.segmentBtnPremium, attendanceMode === 'personal' && styles.segmentBtnActivePremium]}
                      onPress={() => setAttendanceMode('personal')}
                    >
                      <Text style={[styles.segmentTextPremium, attendanceMode === 'personal' && styles.segmentTextActivePremium]}>MEU HISTÓRICO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.segmentBtnPremium,
                        attendanceMode === 'management' && styles.segmentBtnActivePremium,
                        !isGestor && { opacity: 0.3 }
                      ]}
                      onPress={() => {
                        if (isGestor) {
                          setAttendanceMode('management');
                        } else {
                          showNotification('Acesso Negado', 'Esta funcionalidade é exclusiva para gestores ou administradores.', 'error');
                        }
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.segmentTextPremium, attendanceMode === 'management' && styles.segmentTextActivePremium]}>GESTÃO GLOBAL</Text>
                        {!isGestor && <Lock size={10} color="#64748B" />}
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* NEW EXPANDED CALENDAR SECTION */}
                  {attendanceMode === 'personal' && (
                    <View>
                      {overtimeRequests.filter(or => or.status === 'pending' && or.user_id === currentUser.id).length > 0 && (
                        <View style={{ gap: 12, marginBottom: 16 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.sectionTitle}>PEDIDOS DE HORA EXTRA</Text>
                            <View style={{ backgroundColor: '#00A3FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 10, fontWeight: '900', color: 'white' }}>{overtimeRequests.filter(or => or.status === 'pending' && or.user_id === currentUser.id).length}</Text>
                            </View>
                          </View>

                          {overtimeRequests.filter(or => or.status === 'pending' && or.user_id === currentUser.id).map(or => (
                            <View key={or.id} style={[styles.glassCard, { backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: 16 }]}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View>
                                  <Text style={{ fontSize: 13, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c' }}>{or.requested_by_name || 'Gestão'}</Text>
                                  <Text style={{ fontSize: 11, color: '#64748B' }}>Pede que faças {or.hours}h • {or.date}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                  <TouchableOpacity
                                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}
                                    onPress={() => handleProcessOvertime(or.id, false)}
                                  >
                                    <X size={16} color="#ef4444" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center' }}
                                    onPress={() => handleProcessOvertime(or.id, true)}
                                  >
                                    <Check size={16} color="#10b981" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                              <Text style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748B', marginTop: 8, fontStyle: 'italic' }}>"{or.reason}"</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <MotiView
                        from={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={[styles.calendarContainerPremium, { backgroundColor: isDarkMode ? '#111111' : 'white' }]}
                      >
                        {/* Calendar Header */}
                        <View style={styles.calendarHeaderPremium}>
                          <View>
                            <Text style={[styles.calendarMonthText, { color: isDarkMode ? 'white' : '#14233c' }]}>
                              {format(currentCalendarDate, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Clock size={10} color="#00A3FF" />
                              <Text style={[styles.calendarSubText, { color: '#00A3FF', fontWeight: '800' }]}>TOTAL MENSAL: {monthlyHours}</Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                              onPress={() => setCurrentCalendarDate(subMonths(currentCalendarDate, 12))}
                              style={[styles.calendarNavBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                            >
                              <ChevronsLeft size={18} color={isDarkMode ? 'white' : '#94a3b8'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => setCurrentCalendarDate(subMonths(currentCalendarDate, 1))}
                              style={[styles.calendarNavBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                            >
                              <ChevronLeft size={18} color={isDarkMode ? 'white' : '#64748B'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => setCurrentCalendarDate(addMonths(currentCalendarDate, 1))}
                              style={[styles.calendarNavBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                            >
                              <ChevronRight size={18} color={isDarkMode ? 'white' : '#64748B'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => setCurrentCalendarDate(addMonths(currentCalendarDate, 12))}
                              style={[styles.calendarNavBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                            >
                              <ChevronsRight size={18} color={isDarkMode ? 'white' : '#94a3b8'} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Weekday Headers */}
                        <View style={styles.weekdayContainer}>
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <Text key={day} style={styles.weekdayText}>{day}</Text>
                          ))}
                        </View>

                        {/* Days Grid */}
                        <View style={styles.daysGrid}>
                          {(() => {
                            const monthStart = startOfMonth(currentCalendarDate);
                            const monthEnd = endOfMonth(monthStart);
                            const startDate = startOfWeek(monthStart);
                            const endDate = endOfWeek(monthEnd);

                            const dayRows = eachDayOfInterval({ start: startDate, end: endDate });

                            return dayRows.map((day, idx) => {
                              const isCurrentMonth = isSameMonth(day, monthStart);
                              const isDaySelected = isSameDay(day, selectedDate);
                              const isTodayDay = isToday(day);
                              const hasLogs = timeLogs.some(log => isSameDay(new Date(log.timestamp), day) && log.app_user_id === currentUser?.id);

                              return (
                                <TouchableOpacity
                                  key={idx}
                                  onPress={() => setSelectedDate(startOfDay(day))}
                                  style={[
                                    styles.dayCell,
                                    isDaySelected && styles.dayCellSelected,
                                    !isCurrentMonth && { opacity: 0.25 }
                                  ]}
                                >
                                  <Text style={[
                                    styles.dayText,
                                    { color: isDarkMode ? 'white' : '#14233c' },
                                    isDaySelected && { color: 'white', fontWeight: '900' },
                                    isTodayDay && !isDaySelected && { color: '#00A3FF', fontWeight: '800' }
                                  ]}>
                                    {format(day, 'd')}
                                  </Text>
                                  <View style={styles.dotContainer}>
                                    {hasLogs && <View style={[styles.dayDot, { backgroundColor: '#00A3FF' }]} />}
                                    {isTodayDay && <View style={[styles.dayDot, { backgroundColor: '#10b981' }]} />}
                                  </View>
                                </TouchableOpacity>
                              );
                            });
                          })()}
                        </View>

                        {/* Selected Day Details Card */}
                        <MotiView
                          from={{ opacity: 0, translateY: 10 }}
                          animate={{ opacity: 1, translateY: 0 }}
                          transition={{ type: 'timing', duration: 300 }}
                          style={[styles.dayDetailCard, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={styles.detailDateText}>
                              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </Text>
                            <Calendar size={14} color="#00A3FF" />
                          </View>

                          <View style={{ gap: 10 }}>
                            {(() => {
                              const logsForDay = timeLogs.filter(t => isSameDay(new Date(t.timestamp), selectedDate) && t.app_user_id === currentUser?.id);

                              if (logsForDay.length === 0) {
                                return (
                                  <View style={styles.calendarDetailRow}>
                                    <AlertCircle size={12} color="#64748B" />
                                    <Text style={styles.calendarDetailRowText}>Nenhum registro de ponto encontrado.</Text>
                                  </View>
                                );
                              }

                              const checkIn = logsForDay.find(l => l.type === 'check_in');
                              const checkOut = logsForDay.find(l => l.type === 'check_out');

                              let totalHoursStr = '--';
                              if (checkIn && checkOut) {
                                const diff = new Date(checkOut.timestamp).getTime() - new Date(checkIn.timestamp).getTime();
                                const hoursNum = Math.floor(diff / (1000 * 60 * 60));
                                const minsNum = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                totalHoursStr = `${hoursNum}h ${minsNum}m`;
                              }

                              return (
                                <>
                                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                                    <View style={{ flex: 1, backgroundColor: isDarkMode ? 'rgba(0,163,255,0.05)' : 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>TOTAL DO DIA</Text>
                                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#00A3FF' }}>{totalHoursStr}</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: isDarkMode ? 'rgba(16,185,129,0.05)' : 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>EVENTOS</Text>
                                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#10b981' }}>{logsForDay.length}</Text>
                                    </View>
                                  </View>

                                  {logsForDay.map(log => (
                                    <View key={log.id} style={[styles.calendarDetailRow, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'white', padding: 10, borderRadius: 10 }]}>
                                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: log.type === 'check_in' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                        <Clock size={14} color={log.type === 'check_in' ? '#10b981' : '#ef4444'} />
                                      </View>
                                      <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.calendarDetailRowText, { fontWeight: '800', color: isDarkMode ? 'white' : '#14233c' }]}>
                                          {format(new Date(log.timestamp), 'HH:mm')} — {log.type === 'check_in' ? 'Entrada' : 'Saída'}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#64748B' }}>{log.location_name}</Text>
                                      </View>
                                    </View>
                                  ))}
                                </>
                              );
                            })()}
                          </View>
                        </MotiView>
                      </MotiView>
                    </View>
                  )}

                  {attendanceMode === 'personal' ? (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.sectionTitle}>LOGS DE ATIVIDADE</Text>
                        <Calendar size={16} color="#64748B" />
                      </View>
                      {timeLogs.filter(t => t.app_user_id === currentUser?.id).map(l => (
                        <MotiView
                          key={l.id}
                          from={{ opacity: 0, translateY: 10 }}
                          animate={{ opacity: 1, translateY: 0 }}
                          style={[styles.logItemPremium, { backgroundColor: isDarkMode ? '#111111' : 'white' }]}
                        >
                          <View style={styles.dateBoxPremium}>
                            <Text style={[styles.mono, { fontSize: 13, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c' }]}>{format(new Date(l.timestamp), 'dd')}</Text>
                            <Text style={[styles.bentoMuted, { fontSize: 7, color: '#64748B' }]}>{format(new Date(l.timestamp), 'MMM').toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1, paddingLeft: 16 }}>
                            <Text style={[styles.logTitlePremium, { color: isDarkMode ? 'white' : '#14233c' }]}>{l.location_name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                              <Clock size={10} color="#64748B" />
                              <Text style={[styles.mono, { fontSize: 11, color: '#64748B' }]}>{format(new Date(l.timestamp), 'HH:mm')} — {l.type === 'check_in' ? 'ENTRADA' : 'SAÍDA'}</Text>
                            </View>
                          </View>
                          <View style={[styles.typeBadgePremium, { backgroundColor: 'rgba(0,163,255,0.1)' }]}>
                            <Construction size={14} color="#00A3FF" />
                          </View>
                        </MotiView>
                      ))}
                    </>
                  ) : (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.sectionTitle}>MONITORIZAÇÃO REAL-TIME</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TouchableOpacity
                            style={styles.headerActionBtn}
                            onPress={() => setShowSettings(true)}
                          >
                            <Settings size={18} color={isDarkMode ? 'white' : '#14233c'} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={{ gap: 12 }}>
                        {timeLogs.map(record => (
                          <TouchableOpacity
                            key={record.id}
                            onPress={() => setSelectedRecordForMap(record)}
                            style={[styles.managementCardPremium, { backgroundColor: isDarkMode ? '#111111' : 'white' }]}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <View style={styles.empAvatarSmall}>
                                <Text style={{ color: 'white', fontWeight: '900', fontSize: 10 }}>{(record.employee_name || 'U').charAt(0)}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.employeeNamePremium, { color: isDarkMode ? 'white' : '#0F172A' }]}>{record.employee_name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <MapPin size={10} color="#64748B" />
                                  <Text style={styles.recordLocPremium} numberOfLines={1}>{record.location_name}</Text>
                                </View>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.mono, { fontSize: 12, color: '#00aeef' }]}>{format(new Date(record.timestamp), 'HH:mm')} - {record.type === 'check_in' ? 'ENTRADA' : 'SAÍDA'}</Text>
                                <Text style={[styles.bentoMuted, { fontSize: 8 }]}>{format(new Date(record.timestamp), 'dd MMM')}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {selectedRecordForMap && (
                        <LocationHistoryMap
                          log={selectedRecordForMap}
                          onClose={() => setSelectedRecordForMap(null)}
                          isDarkMode={isDarkMode}
                          history={userLocationHistory}
                          users={employeesList}
                        />
                      )}
                    </>
                  )}
                </View>
              )}

              {activeTab === 'profile' && (
                <View style={{ gap: 20 }}>
                  <View style={styles.profileHeaderLarge}>
                    <TouchableOpacity style={styles.profileAvatarLarge} onPress={pickImage} activeOpacity={0.8}>
                      {currentUser?.avatar ? (
                        <Image source={{ uri: currentUser.avatar }} style={{ width: '100%', height: '100%', borderRadius: 50 }} />
                      ) : (
                        <User size={64} color="white" />
                      )}
                      <View style={styles.avatarEditBadge}>
                        <Camera size={14} color="white" />
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.profileNameLarge}>{currentUser?.name || 'Funcionário'}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{currentUser?.role?.toUpperCase() || 'FUNCIONÁRIO'}</Text>
                    </View>
                  </View>

                  <View style={styles.profileDetailsList}>

                    {(isAdmin || isGestor || currentUser?.can_manage_employees) && showEmployeeForm && (
                      <MotiView
                        from={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', borderRadius: 24, padding: 20, marginBottom: 16, marginTop: 12 }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c', marginBottom: 16 }}>Novo Funcionário</Text>

                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, marginTop: -4 }}>NOME COMPLETO</Text>
                        <View style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0', marginBottom: 16 }]}>
                          <TextInput
                            style={{ flex: 1, color: isDarkMode ? 'white' : '#0F172A', fontSize: 16 }}
                            placeholder="Eg. João Silva"
                            placeholderTextColor="#94A3B8"
                            value={newEmployee.name}
                            onChangeText={text => setNewEmployee({ ...newEmployee, name: text })}
                          />
                        </View>

                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 }}>E-MAIL (KEYCLOAK)</Text>
                        <View style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0', marginBottom: 16 }]}>
                          <TextInput
                            style={{ flex: 1, color: isDarkMode ? 'white' : '#0F172A', fontSize: 16 }}
                            placeholder="joao@objetivo.pt"
                            placeholderTextColor="#94A3B8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={newEmployee.email}
                            onChangeText={text => setNewEmployee({ ...newEmployee, email: text })}
                          />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 }}>HORA DE ENTRADA</Text>
                            <View style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0', marginBottom: 0 }]}>
                              <TextInput
                                style={{ flex: 1, color: isDarkMode ? 'white' : '#0F172A', fontSize: 16 }}
                                placeholder="08:00"
                                placeholderTextColor="#94A3B8"
                                value={newEmployee.startTime}
                                onChangeText={text => setNewEmployee({ ...newEmployee, startTime: text })}
                              />
                            </View>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 }}>HORA DE SAÍDA</Text>
                            <View style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0', marginBottom: 0 }]}>
                              <TextInput
                                style={{ flex: 1, color: isDarkMode ? 'white' : '#0F172A', fontSize: 16 }}
                                placeholder="17:00"
                                placeholderTextColor="#94A3B8"
                                value={newEmployee.endTime}
                                onChangeText={text => setNewEmployee({ ...newEmployee, endTime: text })}
                              />
                            </View>
                          </View>
                        </View>

                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 }}>PERFIL / CARGO</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                          {(['colaborador', 'gestor', 'admin'] as AppRole[]).map(role => (
                            <TouchableOpacity
                              key={role}
                              style={{ flex: 1, backgroundColor: newEmployee.role === role ? '#00A3FF' : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9'), padding: 12, borderRadius: 12, alignItems: 'center' }}
                              onPress={() => setNewEmployee({ ...newEmployee, role })}
                            >
                              <Text style={{ color: newEmployee.role === role ? 'white' : (isDarkMode ? '#94A3B8' : '#64748B'), fontWeight: '800', fontSize: 12 }}>{role.toUpperCase() === 'FUNCIONARIO' ? 'FUNC.' : role.toUpperCase()}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <TouchableOpacity
                          style={{ backgroundColor: '#00A3FF', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                          onPress={handleAddEmployee}
                        >
                          <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>ADICIONAR FUNCIONÁRIO</Text>
                        </TouchableOpacity>
                      </MotiView>
                    )}

                    <View style={{ gap: 8 }}>
                      {(isAdmin || isGestor || currentUser?.can_manage_employees) && visibleEmployees
                        .filter(emp => {
                          if (isAdmin) return currentUser?.role === 'super_admin' || emp.role !== 'super_admin';
                          return emp.role !== 'admin' && emp.role !== 'super_admin';
                        })
                        .map(emp => (
                          <View key={emp.id} style={styles.payslipItem}>
                            <View style={[styles.avatarHeader, { width: 32, height: 32, borderRadius: 16 }]}>
                              <User size={16} color="white" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={styles.payslipMonth}>{emp.name}</Text>
                              <Text style={styles.payslipVal}>{emp.email} • {emp.role}</Text>
                            </View>
                            {emp.id !== currentUser?.id && (
                              <TouchableOpacity
                                onPress={() => {
                                  Alert.alert(
                                    'Remover Funcionário',
                                    `Deseja remover ${emp.name} da equipa?`,
                                    [
                                      { text: 'Cancelar', style: 'cancel' },
                                      {
                                        text: 'Remover',
                                        style: 'destructive',
                                        onPress: () => handleDeleteEmployee(emp.id, emp.name)
                                      }
                                    ]
                                  );
                                }}
                                style={{ padding: 8 }}
                              >
                                <XCircle size={20} color="#ef4444" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                    </View>
                  </View>

                  <View style={styles.profileDetailsList}>
                    <View style={styles.detailRow}>
                      <User size={20} color="#64748B" />
                      <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={styles.detailLabel}>EMAIL</Text>
                        <Text style={styles.detailValue}>{(currentUser as any)?.email || '--'}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Briefcase size={20} color="#64748B" />
                      <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={styles.detailLabel}>FUNÇÃO</Text>
                        <Text style={styles.detailValue}>{isGestor ? 'Gestão / Administração' : 'Especialista Operacional'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Work Schedule Section */}
                  <View style={[styles.profileDetailsList, { marginTop: 16 }]}>
                    <View style={styles.profileSectionHeader}>
                      <Text style={styles.profileSectionTitle}>HORÁRIO DE TRABALHO</Text>
                    </View>
                    {workSchedules.filter(ws => !ws.keycloak_user_id || ws.keycloak_user_id === currentUser?.keycloak_user_id).map(ws => (
                      <View key={ws.id} style={styles.detailRow}>
                        <Calendar size={18} color="#00A3FF" />
                        <View style={{ flex: 1, marginLeft: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View>
                            <Text style={styles.detailLabel}>{ws.day_of_week.toUpperCase()}</Text>
                            <Text style={styles.detailValue}>{ws.start_time} — {ws.end_time}</Text>
                          </View>
                          {ws.active && <View style={styles.activeLed} />}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Leave Requests Section */}
                  <View style={[styles.profileDetailsList, { marginTop: 16 }]}>
                    <View style={styles.profileSectionHeader}>
                      <Text style={styles.profileSectionTitle}>PEDIDOS DE AUSÊNCIA</Text>
                      <TouchableOpacity
                        onPress={() => {
                          Alert.prompt(
                            "Novo Pedido de Ausência",
                            "Descreva o motivo (Férias, Doença, etc.)",
                            [
                              { text: "Cancelar", style: "cancel" },
                              {
                                text: "Enviar", onPress: (reason) => {
                                  if (!reason) return;
                                  const newLv: LeaveRequest = {
                                    id: Math.random().toString(36).substr(2, 9),
                                    keycloak_user_id: currentUser?.keycloak_user_id || '',
                                    type: 'vacation',
                                    start_date: new Date().toISOString(),
                                    end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
                                    status: 'pending',
                                    reason: reason as string,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                    approver_id: ''
                                  };
                                  setLeaveRequests([newLv, ...leaveRequests]);
                                  showNotification('Sucesso', 'Pedido enviado para aprovação.', 'success');
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <Plus size={14} color="#00A3FF" />
                      </TouchableOpacity>
                    </View>
                    {leaveRequests.filter(lr => lr.keycloak_user_id === currentUser?.keycloak_user_id).map(lr => (
                      <View key={lr.id} style={styles.detailRow}>
                        <History size={18} color="#64748B" />
                        <View style={{ flex: 1, marginLeft: 15 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.detailLabel}>{lr.type.toUpperCase()}</Text>
                            <View style={[styles.statusMiniTag, { backgroundColor: lr.status === 'pending' ? '#FEF3C7' : '#DCFCE7' }]}>
                              <Text style={[styles.statusMiniTagText, { color: lr.status === 'pending' ? '#92400E' : '#166534' }]}>{lr.status.toUpperCase()}</Text>
                            </View>
                          </View>
                          <Text style={styles.detailValue}>{format(new Date(lr.start_date), "d MMM")} — {format(new Date(lr.end_date), "d MMM, yyyy")}</Text>
                          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{lr.reason}</Text>
                        </View>
                      </View>
                    ))}
                    {leaveRequests.filter(lr => lr.keycloak_user_id === currentUser?.keycloak_user_id).length === 0 && (
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: '#94A3B8' }}>Nenhum pedido registado.</Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.profileDetailsList, { marginTop: 16 }]}>
                    <View style={styles.profileSectionHeader}>
                      <Text style={styles.profileSectionTitle}>PREFERÊNCIAS</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Bell size={20} color="#64748B" />
                      <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={styles.detailLabel}>NOTIFICAÇÕES</Text>
                        <Text style={styles.detailValue}>{notifications.length} Alertas Ativos</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowChangePassword(true)}
                      style={styles.detailRow}
                    >
                      <Lock size={20} color="#00A3FF" />
                      <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={[styles.detailLabel, { color: '#00A3FF' }]}>SEGURANÇA</Text>
                        <Text style={styles.detailValue}>Alterar Palavra-passe</Text>
                      </View>
                      <ChevronRight size={18} color="#00A3FF" />
                    </TouchableOpacity>
                    <View style={styles.detailRow}>
                      <Smartphone size={20} color="#64748B" />
                      <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={styles.detailLabel}>NOTIFICAÇÕES PUSH</Text>
                        <Text style={styles.detailValue}>{pushEnabled ? 'Ativadas' : 'Desativadas'}</Text>
                      </View>
                      <Switch
                        value={pushEnabled}
                        onValueChange={(val) => {
                          setPushEnabled(val);
                          if (val) {
                            scheduleSimulatedPushContent("Bem-vindo às Notificações!", "Os alertas aparecerão no topo da tela.");
                          }
                        }}
                        trackColor={{ false: '#cbd5e1', true: '#00A3FF' }}
                        thumbColor="white"
                      />
                    </View>
                  </View>

                  <TouchableOpacity style={[styles.brandButton, { backgroundColor: '#ef4444', shadowColor: '#ef4444', marginTop: 20 }]} onPress={handleLogout}>
                    <Text style={[styles.brandButtonText, { color: 'white' }]}>SAIR DO SISTEMA</Text>
                  </TouchableOpacity>
                </View>
              )}

              {canManageSomething && activeTab === 'management' && (
                <View style={{ gap: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.sectionTitlePremium, { color: isDarkMode ? 'white' : '#14233c', fontSize: 24, fontWeight: '900' }]}>Gestão</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={[styles.techBadge, { backgroundColor: mgmtSubTab === 'dashboard' ? '#00A3FF' : '#14233c' }]}
                        onPress={() => setMgmtSubTab('dashboard')}
                      >
                        <BarChart3 size={12} color="white" />
                        <Text style={{ color: 'white', fontWeight: '900', fontSize: 10 }}>DASHBOARD</Text>
                      </TouchableOpacity>
                      {isAdmin && (
                        <TouchableOpacity
                          style={[styles.techBadge, { backgroundColor: mgmtSubTab === 'access_control' ? '#00A3FF' : '#14233c' }]}
                          onPress={() => setMgmtSubTab('access_control')}
                        >
                          <ShieldCheck size={12} color="white" />
                          <Text style={{ color: 'white', fontWeight: '900', fontSize: 10 }}>ACESSOS</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {mgmtSubTab === 'dashboard' ? (
                    <View style={{ gap: 16 }}>
                      {/* Stats Tiles */}
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1, backgroundColor: '#14233c', padding: 16, borderRadius: 20 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '800' }}>TRABALHANDO AGORA</Text>
                          <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', marginTop: 4 }}>{managementStats.workingCount}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
                          <Text style={{ color: '#64748B', fontSize: 9, fontWeight: '800' }}>ALERTAS HOJE</Text>
                          <Text style={{ color: '#FE4A49', fontSize: 24, fontWeight: '900', marginTop: 4 }}>{managementStats.alertsToday}</Text>
                        </View>
                      </View>

                      <View style={{ gap: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                          <Text style={styles.sectionTitle}>PEDIDOS PENDENTES</Text>
                          <View style={{ backgroundColor: '#f0cc4a', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#14233c' }}>{managementStats.pendingLeaves}</Text>
                          </View>
                        </View>

                        {leaveRequests.filter(lr => lr.status === 'pending').map(lr => {
                          const emp = visibleEmployees.find(e => e.keycloak_user_id === lr.keycloak_user_id);
                          return (
                            <View key={lr.id} style={[styles.glassCard, { backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: 16 }]}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View>
                                  <Text style={{ fontSize: 13, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c' }}>{emp?.name || 'Funcionário'}</Text>
                                  <Text style={{ fontSize: 11, color: '#64748B' }}>{lr.type.toUpperCase()} • {format(new Date(lr.start_date), 'dd/MM')}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                  <TouchableOpacity
                                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}
                                    onPress={async () => {
                                      try {
                                        await updateDoc(doc(db, 'leave_requests', lr.id), { status: 'rejected', updated_at: new Date().toISOString(), approver_id: currentUser?.id });
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.UPDATE, 'leave_requests');
                                      }
                                    }}
                                  >
                                    <X size={16} color="#ef4444" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center' }}
                                    onPress={async () => {
                                      try {
                                        await updateDoc(doc(db, 'leave_requests', lr.id), { status: 'approved', updated_at: new Date().toISOString(), approver_id: currentUser?.id });
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.UPDATE, 'leave_requests');
                                      }
                                    }}
                                  >
                                    <Check size={16} color="#10b981" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                              <Text style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748B', marginTop: 8, fontStyle: 'italic' }}>"{lr.reason}"</Text>
                            </View>
                          );
                        })}

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <Text style={styles.sectionTitle}>Equipa e Alocações</Text>
                          {(isAdmin || isGestor || currentUser?.can_manage_employees) && (
                            <TouchableOpacity
                              style={[styles.smallBtn, { backgroundColor: '#00aeef' }]}
                              onPress={() => setShowEmployeeForm(!showEmployeeForm)}
                            >
                              <Plus size={16} color="white" />
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Project Allocation Summary */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                          <View style={{ flexDirection: 'row', gap: 12 }}>
                            {visibleWorkLocations.map(loc => {
                              const workerCount = visibleEmployees.filter(e => e.location_id === loc.id).length;
                              return (
                                <View key={loc.id} style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: 12, borderRadius: 16, width: 140, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#f1f5f9' }}>
                                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>{loc.name.toUpperCase()}</Text>
                                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#00aeef' }}>{workerCount}</Text>
                                    <Text style={{ fontSize: 10, color: '#94a3b8' }}>colab.</Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </ScrollView>

                        {showEmployeeForm && (
                          <MotiView
                            from={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', borderRadius: 24, padding: 20, marginBottom: 16, marginTop: 12 }}
                          >
                            <Text style={{ fontSize: 16, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c', marginBottom: 16 }}>Novo Funcionário</Text>
                            <TextInput
                              style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}
                              placeholder="Nome"
                              placeholderTextColor="#94a3b8"
                              value={newEmployee.name}
                              onChangeText={text => setNewEmployee({ ...newEmployee, name: text })}
                            />
                            <TextInput
                              style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}
                              placeholder="Email"
                              placeholderTextColor="#94a3b8"
                              value={newEmployee.email}
                              onChangeText={text => setNewEmployee({ ...newEmployee, email: text })}
                            />

                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, marginTop: 8 }}>ALOCAR A OBRA (OPCIONAL)</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                              {visibleWorkLocations.map(loc => (
                                <TouchableOpacity
                                  key={loc.id}
                                  onPress={() => setNewEmployee({ ...newEmployee, location_id: loc.id })}
                                  style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 10,
                                    backgroundColor: newEmployee.location_id === loc.id ? '#00aeef' : (isDarkMode ? '#334155' : '#E2E8F0')
                                  }}
                                >
                                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: newEmployee.location_id === loc.id ? 'white' : (isDarkMode ? '#94a3b8' : '#64748B') }}>{loc.name}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>

                            <TouchableOpacity style={{ backgroundColor: '#00aeef', padding: 15, borderRadius: 12, alignItems: 'center' }} onPress={handleAddEmployee}>
                              <Text style={{ color: 'white', fontWeight: '900' }}>ADICIONAR</Text>
                            </TouchableOpacity>
                          </MotiView>
                        )}

                        <View style={{ gap: 8 }}>
                          {filteredEmployeesForMgmt.map(emp => {
                            const empWork = visibleWorkLocations.find(l => l.id === emp.location_id);
                            const isAssigning = assigningEmployeeId === emp.id;
                            return (
                              <View key={emp.id} style={{ marginBottom: 8 }}>
                                <View style={[styles.payslipItem, { borderLeftWidth: empWork ? 4 : 0, borderLeftColor: '#00aeef' }]}>
                                  <View style={[styles.avatarHeader, { width: 32, height: 32, borderRadius: 16 }]}>
                                    <User size={16} color="white" />
                                    {emp.last_location?.out_of_bounds && (
                                      <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 2, borderColor: isDarkMode ? '#1e293b' : 'white' }} />
                                    )}
                                  </View>
                                  <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.payslipMonth, { fontSize: 14 }]}>{emp.name}</Text>
                                    <Text style={[styles.payslipVal, { fontSize: 11 }]}>{emp.email}</Text>
                                    {empWork && (
                                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                                        <MapPin size={10} color="#00aeef" />
                                        <Text style={{ fontSize: 10, color: '#00aeef', fontWeight: '800' }}>{empWork.name.toUpperCase()}</Text>
                                      </View>
                                    )}
                                  </View>
                                  <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {(isAdmin || isGestor || currentUser?.can_manage_projects || currentUser?.can_manage_employees) && emp.role !== 'super_admin' && (
                                      <TouchableOpacity
                                        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
                                        onPress={() => handleExportIndividual(emp)}
                                      >
                                        <Download size={14} color="#00aeef" />
                                      </TouchableOpacity>
                                    )}
                                    {(isAdmin || isGestor || currentUser?.can_manage_projects || currentUser?.can_manage_employees) && emp.role !== 'super_admin' && (
                                      <TouchableOpacity
                                        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isAssigning ? '#00aeef' : (isDarkMode ? '#334155' : '#f1f5f9'), alignItems: 'center', justifyContent: 'center' }}
                                        onPress={() => setAssigningEmployeeId(isAssigning ? null : emp.id)}
                                      >
                                        <HardHat size={14} color={isAssigning ? "white" : "#64748B"} />
                                      </TouchableOpacity>
                                    )}
                                    {(isAdmin || isGestor || currentUser?.can_manage_projects || currentUser?.can_manage_employees) && emp.role !== 'super_admin' && emp.last_location?.out_of_bounds && (
                                      <TouchableOpacity
                                        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}
                                        onPress={() => {
                                          // Mocking a log record to show on map
                                          const mockLog: TimeLog = {
                                            id: 'mock-' + emp.id,
                                            timestamp: emp.last_location?.timestamp || new Date().toISOString(),
                                            type: 'check_in',
                                            work_location_id: emp.location_id || '',
                                            location_name: 'Fora de Limites',
                                            latitude: emp.last_location?.latitude || 0,
                                            longitude: emp.last_location?.longitude || 0,
                                            valid: true,
                                            employee_name: emp.name || 'Funcionário',
                                            platform: 'mobile'
                                          } as any; // Cast for mock log if needed
                                          setSelectedRecordForMap(mockLog);
                                        }}
                                      >
                                        <MapIcon size={14} color="#ef4444" />
                                      </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                      style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
                                      onPress={() => setSelectedUserDetail(emp)}
                                    >
                                      <ChevronRight size={14} color="#64748B" />
                                    </TouchableOpacity>
                                  </View>
                                </View>

                                {isAssigning && (
                                  <MotiView
                                    from={{ opacity: 0, scaleY: 0 }}
                                    animate={{ opacity: 1, scaleY: 1 }}
                                    style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: 12, borderRadius: 16, marginTop: 4, borderWidth: 1, borderColor: '#00aeef' }}
                                  >
                                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 8 }}>ALTERAR ALOCAÇÃO:</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                      {visibleWorkLocations.map(loc => (
                                        <TouchableOpacity
                                          key={loc.id}
                                          onPress={async () => {
                                            try {
                                              await updateDoc(doc(db, 'users', emp.id), {
                                                location_id: loc.id,
                                                updated_at: new Date().toISOString()
                                              });
                                              setAssigningEmployeeId(null);
                                            } catch (error) {
                                              handleFirestoreError(error, OperationType.UPDATE, `users/${emp.id}`);
                                            }
                                          }}
                                          style={{
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            borderRadius: 10,
                                            borderWidth: 1,
                                            borderColor: emp.location_id === loc.id ? '#00aeef' : (isDarkMode ? '#334155' : '#E2E8F0'),
                                            backgroundColor: emp.location_id === loc.id ? '#00aeef' : 'transparent'
                                          }}
                                        >
                                          <Text style={{ fontSize: 10, fontWeight: 'bold', color: emp.location_id === loc.id ? 'white' : (isDarkMode ? '#94a3b8' : '#64748B') }}>{loc.name}</Text>
                                        </TouchableOpacity>
                                      ))}
                                      <TouchableOpacity
                                        onPress={async () => {
                                          try {
                                            await updateDoc(doc(db, 'users', emp.id), {
                                              location_id: deleteField(),
                                              updated_at: new Date().toISOString()
                                            });
                                            setAssigningEmployeeId(null);
                                          } catch (error) {
                                            handleFirestoreError(error, OperationType.UPDATE, `users/${emp.id}`);
                                          }
                                        }}
                                        style={{
                                          paddingHorizontal: 12,
                                          paddingVertical: 6,
                                          borderRadius: 10,
                                          backgroundColor: !emp.location_id ? '#EF4444' : (isDarkMode ? '#334155' : '#E2E8F0')
                                        }}
                                      >
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: !emp.location_id ? 'white' : (isDarkMode ? '#94a3b8' : '#64748B') }}>Remover</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </MotiView>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </View>

                      <View style={{ marginTop: 12 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>MONITORIZAÇÃO REAL-TIME</Text>
                        <View style={{ gap: 12 }}>
                          {visibleTimeLogs.slice(0, 10).map(record => {
                            return (
                              <TouchableOpacity
                                key={record.id}
                                onPress={() => setSelectedRecordForMap(record)}
                                style={[styles.managementCardPremium, { backgroundColor: isDarkMode ? '#111111' : 'white', borderWidth: 1, borderColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                  <View style={[styles.empAvatarSmall, { backgroundColor: '#00aeef' }]}>
                                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 10 }}>{(record.employee_name || 'U').charAt(0)}</Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={[styles.employeeNamePremium, { color: isDarkMode ? 'white' : '#0F172A', fontSize: 14 }]}>{record.employee_name}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                      <MapPin size={10} color="#64748B" />
                                      <Text style={[styles.recordLocPremium, { fontSize: 11 }]} numberOfLines={1}>{record.location_name}</Text>
                                    </View>
                                  </View>
                                  <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.mono, { fontSize: 11, color: record.type === 'check_in' ? '#10b981' : '#ef4444' }]}>{format(new Date(record.timestamp), 'HH:mm')} - {record.type === 'check_in' ? 'Entrada' : 'Saída'}</Text>
                                    <Text style={[styles.bentoMuted, { fontSize: 8 }]}>{format(new Date(record.timestamp), 'dd MMM')}</Text>
                                  </View>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {selectedRecordForMap && (
                        <LocationHistoryMap
                          log={selectedRecordForMap}
                          onClose={() => setSelectedRecordForMap(null)}
                          isDarkMode={isDarkMode}
                          history={userLocationHistory}
                          users={employeesList}
                        />
                      )}

                      {selectedUserDetail && (
                        <EmployeeDetailModal
                          user={selectedUserDetail}
                          onClose={() => setSelectedUserDetail(null)}
                          isDarkMode={isDarkMode}
                          timeLogs={timeLogs}
                          workLocations={workLocations}
                          showNotification={showNotification}
                          isAdmin={isAdmin}
                          isManager={isAdmin || isGestor || !!currentUser?.can_manage_employees}
                          onUpdateUser={handleUpdateUser}
                          onDeleteEmployee={handleDeleteEmployee}
                          onRequestOvertime={handleRequestOvertime}
                        />
                      )}

                      <View style={[styles.profileDetailsList, { backgroundColor: isDarkMode ? '#1e293b' : 'white', marginTop: 12 }]}>
                        <View style={styles.profileSectionHeader}>
                          <Text style={styles.profileSectionTitle}>POLÍTICAS E ESCALAS</Text>
                          {(isAdmin || isGestor || currentUser?.can_manage_employees) && (
                            <TouchableOpacity onPress={() => setShowWorkScheduleForm(true)}>
                              <Plus size={16} color="#00A3FF" />
                            </TouchableOpacity>
                          )}
                        </View>

                        {showWorkScheduleForm && (
                          <MotiView
                            from={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            style={{ padding: 16, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: 12, marginBottom: 12 }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#64748B', marginBottom: 8 }}>CONFIGURAR ESCALA</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                              <TextInput
                                style={[styles.fieldWrapper, { flex: 1, height: 40, marginBottom: 0 }]}
                                placeholder="Dia (Ex: Terça)"
                                value={newSchedule.day_of_week}
                                onChangeText={t => setNewSchedule({ ...newSchedule, day_of_week: t })}
                              />
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                              <TextInput
                                style={[styles.fieldWrapper, { flex: 1, height: 40, marginBottom: 0 }]}
                                placeholder="Entrada (08:00)"
                                value={newSchedule.start_time}
                                onChangeText={t => setNewSchedule({ ...newSchedule, start_time: t })}
                              />
                              <TextInput
                                style={[styles.fieldWrapper, { flex: 1, height: 40, marginBottom: 0 }]}
                                placeholder="Saída (17:00)"
                                value={newSchedule.end_time}
                                onChangeText={t => setNewSchedule({ ...newSchedule, end_time: t })}
                              />
                            </View>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                              <TouchableOpacity style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: '#00A3FF', alignItems: 'center', justifyContent: 'center' }} onPress={handleAddSchedule}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>SALVAR</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }} onPress={() => setShowWorkScheduleForm(false)}>
                                <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>CANCELAR</Text>
                              </TouchableOpacity>
                            </View>
                          </MotiView>
                        )}

                        {workSchedules.map(ws => {
                          return (
                            <View key={ws.id} style={styles.detailRow}>
                              <Calendar size={18} color="#00aeef" />
                              <View style={{ flex: 1, marginLeft: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.detailLabel}>{ws.day_of_week}</Text>
                                <Text style={styles.detailValue}>{ws.start_time} — {ws.end_time}</Text>
                                {(isAdmin || isGestor || currentUser?.can_manage_employees) && (
                                  <TouchableOpacity onPress={async () => {
                                    try {
                                      await deleteDoc(doc(db, 'work_schedules', ws.id));
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}>
                                    <X size={14} color="#ef4444" />
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : isAdmin ? (
                    <MotiView
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      style={{ gap: 16 }}
                    >
                      <View style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#f1f5f9' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                          <ShieldAlert size={20} color="#FE4A49" />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c' }}>Painel de Acessos</Text>
                          </View>
                          <TouchableOpacity
                            style={{ backgroundColor: '#00A3FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                            onPress={handleExportGeneral}
                          >
                            <Download size={18} color="white" />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Exportar Todos</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 16 }}>
                          <TextInput
                            style={[styles.fieldWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', marginBottom: 0 }]}
                            placeholder="Pesquisar por nome ou email..."
                            placeholderTextColor="#94a3b8"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                          />
                        </View>

                        <View style={{ gap: 12 }}>
                          {employeesList
                            .filter(e => e.id !== currentUser?.id)
                            .filter(e =>
                              e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              e.email?.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map(user => (
                              <View key={user.id} style={{ padding: 16, borderRadius: 20, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0' }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                  <TouchableOpacity
                                    onPress={() => setSelectedUserDetail(user)}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
                                  >
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#14233c', alignItems: 'center', justifyContent: 'center' }}>
                                      <Text style={{ color: 'white', fontWeight: '900' }}>{user.name?.charAt(0) || 'U'}</Text>
                                    </View>
                                    <View>
                                      <Text style={{ fontSize: 14, fontWeight: '800', color: isDarkMode ? 'white' : '#14233c' }}>{user.name}</Text>
                                      <Text style={{ fontSize: 11, color: '#64748B' }}>{user.email}</Text>
                                    </View>
                                    <ChevronRight size={14} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
                                  </TouchableOpacity>
                                  {isAdmin && (
                                    <Switch
                                      value={user.active}
                                      thumbColor="#fff"
                                      trackColor={{ false: '#ef4444', true: '#10b981' }}
                                      onValueChange={async (active) => {
                                        try {
                                          await updateDoc(doc(db, 'users', user.id), { active, updated_at: new Date().toISOString() });
                                          showNotification('Acesso Atualizado', `Status de ${user.name} alterado para ${active ? 'ATIVO' : 'BLOQUEADO'}.`, active ? 'success' : 'warning');
                                        } catch (error) {
                                          handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
                                        }
                                      }}
                                    />
                                  )}
                                </View>

                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                  {(['colaborador', 'gestor', 'admin'] as AppRole[]).map(role => (
                                    <TouchableOpacity
                                      key={role}
                                      onPress={async () => {
                                        try {
                                          await updateDoc(doc(db, 'users', user.id), { role, updated_at: new Date().toISOString() });
                                          showNotification('Nível de Acesso', `${user.name} agora é ${role.toUpperCase()}.`, 'success');
                                        } catch (error) {
                                          handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
                                        }
                                      }}
                                      style={{
                                        flex: 1,
                                        paddingVertical: 8,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        backgroundColor: user.role === role ? '#00A3FF' : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff'),
                                        borderWidth: 1,
                                        borderColor: user.role === role ? '#00A3FF' : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0')
                                      }}
                                    >
                                      <Text style={{ fontSize: 9, fontWeight: '900', color: user.role === role ? 'white' : '#64748B' }}>{role.toUpperCase()}</Text>
                                    </TouchableOpacity>
                                  ))}
                                  <TouchableOpacity
                                    onPress={() => handleExportIndividual(user)}
                                    style={{
                                      paddingHorizontal: 10,
                                      paddingVertical: 8,
                                      borderRadius: 10,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: '#00A3FF',
                                      marginLeft: 4
                                    }}
                                  >
                                    <Download size={14} color="white" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ))}
                        </View>
                      </View>

                      <View style={{ padding: 20, backgroundColor: 'rgba(240,204,74,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(240,204,74,0.1)', flexDirection: 'row', gap: 12 }}>
                        <AlertTriangle size={20} color="#f0cc4a" />
                        <Text style={{ flex: 1, fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748B', lineHeight: 16 }}>
                          Utilizadores marcados como INATIVOS não conseguirão realizar login ou registar ponto, mesmo com credenciais corretas.
                        </Text>
                      </View>
                    </MotiView>
                  ) : null}
                </View>
              )}
            </MotiView>
          </ScrollView>

          <View style={[styles.tabBarPremium, { backgroundColor: isDarkMode ? '#1e293b' : 'white' }]}>
            {([
              { id: 'home', icon: Home, label: 'Início', hide: false },
              { id: 'projects', icon: Construction, label: 'Obras', hide: false },
              { id: 'attendance', icon: Clock, label: 'Ponto', hide: false },
              { id: 'management', icon: Users, label: 'Gestão', hide: !canManageSomething },
              { id: 'profile', icon: User, label: 'Conta', hide: false },
            ] as { id: Tab, icon: any, label: string, hide: boolean }[]).filter(item => !item.hide).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setActiveTab(item.id)}
                  style={styles.tabItemPremium}
                  activeOpacity={0.7}
                >
                  <MotiView
                    animate={{
                      scale: isActive ? 1.05 : 1,
                      translateY: isActive ? -4 : 0
                    }}
                    transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                    style={[
                      styles.tabIconCircle,
                      isActive && { backgroundColor: isDarkMode ? 'rgba(0, 163, 255, 0.15)' : 'rgba(0, 163, 255, 0.1)' }
                    ]}
                  >
                    <item.icon
                      size={22}
                      color={isActive ? '#00A3FF' : (isDarkMode ? '#64748B' : '#94A3B8')}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {isActive && (
                      <MotiView
                        from={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={styles.tabIndicatorFloating}
                      />
                    )}
                    {item.id === 'attendance' && notifications.some(n => !n.isRead) && (
                      <View style={styles.notifBadgeTab} />
                    )}
                  </MotiView>
                  <Text style={[
                    styles.tabLabelPremium,
                    {
                      color: isActive ? '#00A3FF' : (isDarkMode ? '#94A3B8' : '#64748B'),
                      fontWeight: isActive ? '900' : '700'
                    }
                  ]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Floating Action Menu (Fixed) */}
          <View style={styles.fabContainer}>
            <AnimatePresence>
              {isFloatingMenuOpen && (
                <View style={styles.fabActions}>
                  {[
                    { id: 'scan', label: 'Escanear QR', icon: QrCode, color: '#00A3FF', action: () => { setIsFloatingMenuOpen(false); showNotification('Scanner', 'Scanner de QR Code ativado.', 'warning'); } },
                    { id: 'checkin', label: isClockedIn ? 'Check-out' : 'Check-in', icon: isClockedIn ? LogOut : MapPin, color: isClockedIn ? '#FE4A49' : '#00A3FF', action: () => { setIsFloatingMenuOpen(false); handleGPSCheckInOut(); } },
                    { id: 'project', label: 'Nova Obra', icon: Construction, color: '#f0cc4a', action: () => { setIsFloatingMenuOpen(false); setActiveTab('projects'); setEditingProjectId(null); setShowProjectForm(true); setNewProject({ name: '', addressSearch: '', latitude: '', longitude: '', radius_meters: '500', start_date: format(new Date(), 'yyyy-MM-dd'), end_date: '' }); }, hide: !isAdmin && !currentUser?.can_manage_projects },
                  ].filter(item => !item.hide).map((item, index) => (
                    <MotiView
                      key={item.id}
                      from={{ opacity: 0, translateY: 20, scale: 0.5 }}
                      animate={{ opacity: 1, translateY: 0, scale: 1 }}
                      exit={{ opacity: 0, translateY: 20, scale: 0.5 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 100, delay: index * 50 }}
                      style={{ marginBottom: 12, alignItems: 'center', flexDirection: 'row-reverse' }}
                    >
                      <TouchableOpacity
                        onPress={item.action}
                        style={[styles.fabActionBtn, { backgroundColor: item.color }]}
                      >
                        <item.icon size={20} color="white" />
                      </TouchableOpacity>
                      <View style={[styles.fabActionLabel, { backgroundColor: isDarkMode ? '#1e293b' : 'white' }]}>
                        <Text style={[styles.fabActionLabelText, { color: isDarkMode ? 'white' : '#14233c' }]}>{item.label}</Text>
                      </View>
                    </MotiView>
                  ))}
                </View>
              )}
            </AnimatePresence>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setIsFloatingMenuOpen(!isFloatingMenuOpen)}
              style={[styles.fabMain, { backgroundColor: '#00A3FF' }]}
            >
              <MotiView
                animate={{ rotate: isFloatingMenuOpen ? '45deg' : '0deg' }}
                transition={{ type: 'timing', duration: 200 }}
              >
                <Plus size={32} color="white" />
              </MotiView>
            </TouchableOpacity>
          </View>
        </NativeSafeAreaView>

        <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <MotiView
              from={{ translateY: 300, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              style={{ backgroundColor: isDarkMode ? '#0B101B' : 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, maxHeight: '80%' }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: isDarkMode ? 'white' : '#14233c' }}>Configurações de Alerta</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={24} color={isDarkMode ? 'white' : '#64748B'} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 24 }}>
                  <Text style={styles.inputLabel}>Horário de Funcionamento (Normal)</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>IÍCIO (H)</Text>
                      <TextInput
                        style={[styles.fieldInput, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', color: isDarkMode ? 'white' : '#0F172A', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}
                        value={String(attendanceSettings.startHour)}
                        keyboardType="numeric"
                        onChangeText={(v) => setAttendanceSettings({ ...attendanceSettings, startHour: parseInt(v) || 0 })}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>FIM (H)</Text>
                      <TextInput
                        style={[styles.fieldInput, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', color: isDarkMode ? 'white' : '#0F172A', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}
                        value={String(attendanceSettings.endHour)}
                        keyboardType="numeric"
                        onChangeText={(v) => setAttendanceSettings({ ...attendanceSettings, endHour: parseInt(v) || 0 })}
                      />
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 10 }}>Registos fora desta janela gerarão alerta de "Horário Incomum".</Text>
                </View>

                <View style={{ marginBottom: 32 }}>
                  <Text style={styles.inputLabel}>Locais Autorizados</Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    {attendanceSettings.allowedLocations.map((loc, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }}>
                        <MapPin size={16} color="#00aeef" />
                        <Text style={{ flex: 1, marginLeft: 10, color: isDarkMode ? 'white' : '#14233c', fontWeight: '600' }}>{loc}</Text>
                        <TouchableOpacity onPress={() => {
                          const newLocs = [...attendanceSettings.allowedLocations];
                          newLocs.splice(idx, 1);
                          setAttendanceSettings({ ...attendanceSettings, allowedLocations: newLocs });
                        }}>
                          <X size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#00aeef', justifyContent: 'center' }}
                    onPress={() => {
                      Alert.prompt(
                        "Novo Local Autorizado",
                        "Insira o nome (ex: Sede, Obra Sul)",
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Adicionar", onPress: (loc) => {
                              if (loc) setAttendanceSettings({ ...attendanceSettings, allowedLocations: [...attendanceSettings.allowedLocations, loc] });
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Plus size={16} color="#00aeef" />
                    <Text style={{ color: '#00aeef', fontWeight: '800', fontSize: 12 }}>ADICIONAR LOCAL</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={styles.primaryBtnText}>Guardar Configurações</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            </MotiView>
          </View>
        </Modal>

        <Modal transparent visible={notification.visible} animationType="none" onRequestClose={closeNotification}>
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 50 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, translateY: 50 }}
            style={styles.notifOverlay}
          >
            <View style={styles.customNotifCard}>
              <View style={[styles.customNotifIconContainer, { backgroundColor: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#f59e0b' }]}>
                {notification.type === 'success' ? <CheckCircle2 size={32} color="#fff" /> :
                  notification.type === 'error' ? <XCircle size={32} color="#fff" /> :
                    <AlertTriangle size={32} color="#fff" />}
              </View>

              <Text style={styles.customNotifTitle}>{notification.title}</Text>
              <Text style={styles.customNotifMessage}>{notification.message}</Text>

              <TouchableOpacity
                style={[styles.customNotifButton, { backgroundColor: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#f59e0b' }]}
                onPress={closeNotification}
              >
                <Text style={styles.customNotifButtonText}>ENTENDIDO</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </Modal>
        <ServerConfigModal
          visible={showServerConfig}
          onClose={() => setShowServerConfig(false)}
          apiUrl={customApiUrl}
          onSave={setCustomApiUrl}
          isDarkMode={isDarkMode}
        />
        <ChangePasswordModal
          visible={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          onSave={handleUpdatePassword}
          isDarkMode={isDarkMode}
        />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoBox: { width: 44, height: 44, backgroundColor: '#14233c', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00aeef' },
  logoText: { color: 'white', fontWeight: '900', fontSize: 18, fontStyle: 'italic' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#14233c', letterSpacing: 0.5 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 174, 239, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00aeef',
  },
  liveText: {
    color: '#00aeef',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  statMiniBox: {
    flex: 1,
  },
  statMiniVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00aeef',
  },
  statMiniLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  greetingText: {
    fontSize: 22,
    color: 'rgba(20, 35, 60, 0.7)',
  },
  subGreeting: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  avatarHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00aeef',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 4,
  },
  monthSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  monthTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#14233c',
    letterSpacing: 1,
  },
  monthStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthStat: {
    alignItems: 'center',
  },
  monthStatVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#14233c',
  },
  monthStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  notifPanel: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  notifPanelTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#7f1d1d',
    textTransform: 'uppercase',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  notifMessage: {
    fontSize: 12,
    color: '#450a0a',
    flex: 1,
  },
  financeTotal: {
    fontSize: 32,
    fontWeight: '900',
  },
  monthBadge: {
    backgroundColor: 'rgba(0, 174, 239, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  monthBadgeText: {
    color: '#00aeef',
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  financeDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 15,
  },
  financeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financeItem: {
  },
  finLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  finVal: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  payslipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  payslipMonth: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14233c',
  },
  payslipVal: {
    fontSize: 12,
    color: '#64748B',
  },
  statusTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  statusTagText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  profileHeaderLarge: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  profileAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#14233c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#00aeef',
    marginBottom: 16,
    position: 'relative',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00aeef',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profileNameLarge: {
    fontSize: 24,
    fontWeight: '900',
    color: '#14233c',
  },
  roleBadge: {
    backgroundColor: '#f0cc4a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#14233c',
  },
  profileDetailsList: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14233c',
    marginTop: 2,
  },
  profileSectionHeader: {
    padding: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00A3FF',
    letterSpacing: 1,
  },
  activeLed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusMiniTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusMiniTagText: {
    fontSize: 8,
    fontWeight: '900',
  },
  splashLogoContainer: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: 'rgba(0, 174, 239, 0.3)',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogoInner: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00aeef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogoText: {
    color: '#00aeef',
    fontSize: 40,
    fontWeight: '900',
  },
  splashBrandText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  splashSeparator: {
    width: 250,
    height: 2,
    backgroundColor: '#00aeef',
    marginTop: 15,
  },
  splashSubText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  loginLayout: {
    width: '100%',
    alignItems: 'center',
  },
  loginTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 20,
    letterSpacing: 1,
  },
  loginSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loginFormContainer: {
    width: '100%',
    marginTop: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 5,
  },
  fieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fieldInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
    height: '100%',
  },
  brandButton: {
    backgroundColor: '#f0cc4a',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#f0cc4a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  brandButtonText: {
    color: '#14233c',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  loginInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    gap: 8,
  },
  loginInfoText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  iconBox: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  h1: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  h2: { fontSize: 24, fontWeight: '900', textAlign: 'center', color: '#0F172A', marginBottom: 24 },
  p: { fontSize: 16, textAlign: 'center', paddingHorizontal: 20, lineHeight: 24 },
  primaryBtn: { backgroundColor: '#00A3FF', paddingVertical: 16, borderRadius: 16, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  primaryBtnText: { color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  loginCard: { backgroundColor: 'white', borderRadius: 32, padding: 32, width: '100%', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerSubtitle: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
  },
  smallBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(0, 163, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.1)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'white',
    marginBottom: 16,
    gap: 10,
  },
  managementCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  recordDate: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  recordTime: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  recordLoc: {
    fontSize: 13,
    color: '#64748B',
  },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 2 },
  cardLabel: { fontSize: 11, fontWeight: '900', color: '#64748B', textTransform: 'uppercase' },
  clockTime: { fontSize: 36, fontWeight: '900', color: '#0F172A' },
  cardDesc: { fontSize: 12, color: '#64748B' },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A', textTransform: 'uppercase', marginBottom: 12 },
  sectionTitlePremium: {
    fontSize: 24,
    fontWeight: '900',
    color: '#14233c',
  },
  techBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00aeef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  taskItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 10 },
  taskTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  taskTime: { fontSize: 11, color: '#64748B' },
  profilePic: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#00A3FF', alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', paddingBottom: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0', justifyContent: 'space-around' },
  tabItem: { alignItems: 'center', gap: 4 },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,163,255,0.1)',
    gap: 12,
    shadowColor: '#00aeef',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reminderIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,163,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  reminderDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  reminderActionBtn: {
    backgroundColor: '#00aeef',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reminderActionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  tabLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0' },
  projectCard: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  projectImage: { width: '100%', height: 160 },
  projectInfo: { padding: 16 },
  projectTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  projectLoc: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 10, fontWeight: '900', color: '#64748B', textTransform: 'uppercase' },
  logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 16, marginBottom: 10 },
  dateBox: { width: 44, height: 44, backgroundColor: '#F8FAFC', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  dateText: { fontSize: 10, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  logTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  logTime: { fontSize: 11, color: '#64748B' },
  typeBadge: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  metaLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
  metaValue: { fontSize: 14, fontWeight: '800', color: 'white' },
  placeholderText: { fontSize: 12, color: '#64748B', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  profileRole: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  profileStats: { flexDirection: 'row', gap: 40, marginVertical: 20 },
  statBox: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },

  // Premium / Bento Styles
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadgeSmall: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FE4A49',
    borderWidth: 1,
    borderColor: 'white',
  },
  welcomeBento: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A3FF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#00A3FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  bentoMuted: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
  bentoLarge: {
    fontSize: 26,
    fontWeight: '900',
    color: 'white',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-condensed',
  },
  bentoRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  bentoRoleText: {
    fontSize: 8,
    fontWeight: '900',
    color: 'white',
  },
  bentoAvatarContainer: {
    position: 'relative',
  },
  bentoAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bentoAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineStatusRing: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#00A3FF',
  },
  bentoNode: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bentoTime: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'JetBrains Mono' : 'monospace',
  },
  bentoSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  bentoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0cc4a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  bentoActionText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#14233c',
  },
  circularProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularVal: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'JetBrains Mono' : 'monospace',
  },
  iconGhostBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskItemPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  taskCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(100, 116, 139, 0.05)',
    padding: 2,
  },
  taskCheckInner: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Tab Bar Premium
  tabBarPremium: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 20,
    right: 20,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 100,
  },
  tabItemPremium: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabIndicatorFloating: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00A3FF',
  },
  tabLabelPremium: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  notifBadgeTab: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FE4A49',
    borderWidth: 2,
    borderColor: 'white',
  },
  // Project Premium
  projectCardPremium: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  projectImageContainer: {
    height: 140,
    position: 'relative',
  },
  projectImagePremium: {
    width: '100%',
    height: '100%',
  },
  projectStatusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  projectStatusText: {
    fontSize: 8,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 1,
  },
  projectInfoPremium: {
    padding: 20,
  },
  projectTitlePremium: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium',
  },
  projectLocPremium: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  progressBarPremium: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFillPremium: {
    height: '100%',
    borderRadius: 4,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.1)',
  },
  // Attendance Premium
  segmentControlPremium: {
    flexDirection: 'row',
    backgroundColor: 'rgba(100, 116, 139, 0.05)',
    borderRadius: 16,
    padding: 6,
  },
  segmentBtnPremium: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentBtnActivePremium: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentTextPremium: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
  },
  segmentTextActivePremium: {
    color: '#14233c',
  },
  logItemPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  dateBoxPremium: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(100, 116, 139, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTitlePremium: {
    fontSize: 14,
    fontWeight: '800',
  },
  typeBadgePremium: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  managementCardPremium: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  employeeNamePremium: {
    fontSize: 14,
    fontWeight: '800',
  },
  recordLocPremium: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  empAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00aeef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'JetBrains Mono' : 'monospace',
    letterSpacing: -0.5,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Floating Action Menu
  fabContainer: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  fabMain: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00A3FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabActions: {
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  fabActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginLeft: 12,
  },
  fabActionLabel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  fabActionLabelText: {
    fontSize: 12,
    fontWeight: '800',
  },
  // Calendar Styles
  calendarContainerPremium: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,163,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 10,
  },
  calendarHeaderPremium: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif',
    letterSpacing: 0.5,
  },
  calendarSubText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  weekdayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderRadius: 12,
  },
  dayCellSelected: {
    backgroundColor: '#00A3FF',
    shadowColor: '#00A3FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
    height: 4,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dayDetailCard: {
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  detailDateText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  calendarDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarDetailRowText: {
    fontSize: 12,
    color: '#14233c',
    fontWeight: '500',
  },
  notifOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  customNotifCard: {
    backgroundColor: '#1e293b',
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  customNotifIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  customNotifTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  customNotifMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  customNotifButton: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  customNotifButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
