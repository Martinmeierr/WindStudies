import { useState } from 'react'
import { Wind, Sparkles, FolderOpen, UserPlus, Rocket, Link2, Users, Mic, LogOut } from 'lucide-react'
import { cn }        from '@/lib/utils'
import { Button }    from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import WF1Ideas        from '@/components/tabs/WF1Ideas'
import WF3Onboarding   from '@/components/tabs/WF3Onboarding'
import WF4NuevoCliente from '@/components/tabs/WF4NuevoCliente'
import WF4v2NuevoCliente from '@/components/tabs/WF4v2NuevoCliente'
import WFProspectos    from '@/components/tabs/WFProspectos'
import GeneradorLinkSondeo from '@/components/tabs/GeneradorLinkSondeo'
import WFEntrevista from '@/components/tabs/WFEntrevista'

const TABS = [
  {
    id:    'wf1',
    label: 'Generador de Ideas',
    icon:  Sparkles,
    desc:  'Generá ideas de contenido para un cliente según el anillo estratégico.',
    component: WF1Ideas,
  },
  {
    id:    'wf3',
    label: 'Ingesta Onboarding',
    icon:  FolderOpen,
    desc:  'Procesá los archivos de onboarding de un cliente desde Google Drive.',
    component: WF3Onboarding,
  },
  {
    id:    'wf4',
    label: 'Alta Cliente',
    icon:  UserPlus,
    desc:  'Creá la estructura en Drive y Notion para un nuevo cliente.',
    component: WF4NuevoCliente,
  },
  {
    id:    'wf4v2',
    label: 'Alta Cliente v2',
    icon:  Rocket,
    desc:  'Versión nueva del alta — payload estructurado y validación reforzada. No toca el alta actual.',
    component: WF4v2NuevoCliente,
  },
  {
    id:    'prospectos',
    label: 'Prospectos Clientes',
    icon:  Users,
    desc:  'Buscá empresas por rubro y zona, y guardalas en Notion para aprobar.',
    component: WFProspectos,
  },
  {
    id:    'sondeo-links',
    label: 'Link Sondeo',
    icon:  Link2,
    desc:  'Generá el link del Sondeo Previo para cada cliente, con el código embebido.',
    component: GeneradorLinkSondeo,
  },
  {
    id:    'entrevista',
    label: 'Entrevista',
    icon:  Mic,
    desc:  'Pegá las notas de la entrevista — Claude las resume y guarda como 02_ENTREVISTA en ONBOARDING.',
    component: WFEntrevista,
  },
]

export default function Dashboard({ logout, showToast }) {
  const [activeTab, setActiveTab] = useState('wf1')

  const current = TABS.find(t => t.id === activeTab)
  const Comp = current.component

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Wind className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <span className="font-bold text-base tracking-tight">WindStudies</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground gap-1.5 hover:text-foreground"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </Button>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">

        {/* Sidebar tabs */}
        <aside className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
            Workflows
          </p>
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-all duration-200 w-full',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-primary' : '')} />
                {tab.label}
              </button>
            )
          })}

        </aside>

        {/* Main card */}
        <Card className="animate-fade-in shadow-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              {(() => { const Icon = current.icon; return <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div> })()}
              <div>
                <CardTitle>{current.label}</CardTitle>
                <CardDescription className="mt-0.5">{current.desc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <Comp key={activeTab} showToast={showToast} />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
