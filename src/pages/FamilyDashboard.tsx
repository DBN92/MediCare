import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFamilyAccess, FamilyAccessToken, FamilyPermissions } from '@/hooks/useFamilyAccess';
import { useCareEvents } from '@/hooks/useCareEvents';
import { Patient } from '@/hooks/usePatients';
import { FamilyLayout } from '@/components/FamilyLayout';
import FamilyCare from '@/components/FamilyCare';
import { MedicalTimeline } from '@/components/MedicalTimeline';
import { FamilyPrescriptions } from '@/components/FamilyPrescriptions';
import { 
  Heart, 
  Droplets, 
  Pill, 
  Utensils, 
  FileText, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Activity,
  Clock,
  User,
  AlertCircle,
  Smile
} from 'lucide-react';

interface CareEvent {
  id: string;
  patient_id: string;
  type: string;
  description?: string;
  created_at: string;
  created_by: string;
  metadata?: any;
  humor_scale?: number;
  happiness_scale?: number;
  humor_notes?: string;
}

const FamilyDashboard: React.FC = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId, token: urlToken } = useParams<{ patientId: string; token: string }>();
  const { validateTokenWithData, getPermissions } = useFamilyAccess();
  const { events, loading: eventsLoading } = useCareEvents();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [token, setToken] = useState<FamilyAccessToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine view from URL path instead of query parameter
  const view = location.pathname.includes('/medical') ? 'medical' : 
               location.pathname.includes('/care') ? 'care' : 'dashboard';

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // Usar parâmetros da URL em vez de localStorage
        if (!patientId || !urlToken) {
          navigate('/family/login');
          return;
        }

        const result = await validateTokenWithData(patientId, urlToken);
        if (!result.isValid || !result.patient || !result.tokenData) {
          navigate('/family/login');
          return;
        }

        setToken(result.tokenData);
        setPatient(result.patient);
      } catch (err) {
        console.error('Validation error:', err);
        setError('Erro ao validar acesso');
        navigate('/family/login');
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
  }, [navigate, validateTokenWithData, patientId, urlToken]);

  // Helper functions
  const getTypeIcon = (type: string) => {
    const icons = {
      drink: Droplets,
      med: Pill,
      meal: Utensils,
      note: FileText,
      bathroom: Heart,
      humor: Smile
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      drink: 'text-blue-600',
      med: 'text-green-600',
      meal: 'text-orange-600',
      note: 'text-gray-600',
      bathroom: 'text-purple-600',
      humor: 'text-yellow-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      drink: 'bg-blue-100 text-blue-800',
      med: 'bg-green-100 text-green-800',
      meal: 'bg-orange-100 text-orange-800',
      note: 'bg-gray-100 text-gray-800',
      bathroom: 'bg-purple-100 text-purple-800',
      humor: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getHumorEmoji = (scale: number) => {
    const emojis = {
      1: '😢',
      2: '😔',
      3: '😐',
      4: '😊',
      5: '😄'
    };
    return emojis[scale as keyof typeof emojis] || '😐';
  };

  const getHappinessEmoji = (scale: number) => {
    const emojis = {
      1: '😭',
      2: '😞',
      3: '😐',
      4: '😊',
      5: '🥰'
    };
    return emojis[scale as keyof typeof emojis] || '😐';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !patient || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldX className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">{error || 'Token inválido ou expirado'}</p>
            <Button onClick={() => navigate('/family/login')} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Memoizar permissões
  const permissions = useMemo(() => {
    if (!token) return { 
      canView: false, 
      canEdit: false,
      canRegisterLiquids: false,
      canRegisterMedications: false,
      canRegisterMeals: false,
      canRegisterActivities: false
    };
    return getPermissions(token.role);
  }, [token, getPermissions]);

  // Memoizar eventos do paciente
  const patientEvents = useMemo(() => {
    if (!patient) return [];
    return events.filter(event => event.patient_id === patient.id);
  }, [events, patient]);

  // Memoizar último evento de humor
  const latestHumorEvent = useMemo(() => {
    return patientEvents
      .filter(event => event.type === 'mood')
      .sort((a, b) => new Date(b.occurred_at || b.created_at).getTime() - new Date(a.occurred_at || a.created_at).getTime())[0];
  }, [patientEvents]);

  // Memoizar eventos de hoje
  const todayEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return patientEvents.filter(event => 
      (event.occurred_at || event.created_at)?.startsWith(today)
    );
  }, [patientEvents]);

  // Memoizar estatísticas
  const stats = useMemo(() => ({
    liquids: todayEvents.filter(e => e.type === 'feeding').length,
    medications: todayEvents.filter(e => e.type === 'diaper').length,
    meals: todayEvents.filter(e => e.type === 'sleep').length,
    notes: todayEvents.filter(e => e.type === 'bathroom').length,
    humor: todayEvents.filter(e => e.type === 'mood').length
  }), [todayEvents]);

  // Helper function para labels dos tipos
  const getTypeLabel = (type: string) => {
    const labels = {
      feeding: 'Alimentação',
      diaper: 'Fralda',
      sleep: 'Sono',
      bathroom: 'Banheiro',
      mood: 'Humor'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Humor Status */}
      {latestHumorEvent && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5 text-blue-500" />
              Estado de Humor Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-blue-600">
                {latestHumorEvent.humor_scale || latestHumorEvent.happiness_scale || 'N/A'}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  Registrado em {new Date(latestHumorEvent.created_at).toLocaleString('pt-BR')}
                </p>
                {latestHumorEvent.humor_notes && (
                  <p className="text-sm mt-1 text-gray-700">
                    {latestHumorEvent.humor_notes}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Líquidos', value: stats.liquids, icon: Droplets, color: 'text-blue-500' },
          { label: 'Medicamentos', value: stats.medications, icon: Pill, color: 'text-purple-500' },
          { label: 'Refeições', value: stats.meals, icon: Utensils, color: 'text-green-500' },
          { label: 'Anotações', value: stats.notes, icon: FileText, color: 'text-orange-500' },
          { label: 'Humor', value: stats.humor, icon: Smile, color: 'text-pink-500' }
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
                <Icon className={`h-8 w-8 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Info */}
      {permissions.canView && (
        <Card>
          <CardHeader>
            <CardTitle>Suas Permissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {permissions.canEdit && (
                <Badge variant="secondary" className="justify-center">
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  Pode Registrar Cuidados
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      {todayEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eventos de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {getTypeIcon(event.type)}
                  <div className="flex-1">
                    {event.type === 'mood' ? (
                      <div>
                        <p className="font-medium">Humor: {event.humor_scale || event.happiness_scale}</p>
                        {event.humor_notes && (
                          <p className="text-sm text-gray-600">{event.humor_notes}</p>
                        )}
                      </div>
                    ) : (
                      <p className="font-medium">{getTypeLabel(event.type)}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(event.occurred_at || event.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCare = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        {patient && (
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
              {patient.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold">{patient?.name}</h2>
          <p className="text-gray-600">Registrar Cuidados</p>
        </div>
      </div>

      {!permissions.canEdit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para registrar cuidados. Entre em contato com a equipe médica.
          </AlertDescription>
        </Alert>
      )}

      {permissions.canEdit && (
        <FamilyCare 
          patient={patient} 
          permissions={permissions}
        />
      )}
    </div>
  );

  const renderMedical = () => (
    <div className="space-y-6">
      <FamilyPrescriptions patientId={patient?.id || ''} permissions={permissions} />
      <MedicalTimeline patientId={patient?.id || ''} />
    </div>
  );

  return (
    <FamilyLayout patient={patient} permissions={permissions} currentPage={view === 'medical' ? 'medical' : view === 'care' ? 'care' : 'dashboard'}>
      <div className="p-4 max-w-4xl mx-auto">
        {view === 'medical' ? renderMedical() : view === 'care' ? renderCare() : renderDashboard()}
      </div>
    </FamilyLayout>
  );
});

export default FamilyDashboard;