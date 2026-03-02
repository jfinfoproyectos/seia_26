"use client"

import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { getPostLogoutRedirect, signOut } from "@/services/authService"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { getProfileAction, updateProfileAction } from "@/app/actions"

function getInitials(name?: string) {
  const n = (name || "").trim()
  if (!n) return "--"
  const parts = n.split(/\s+/)
  const first = parts[0]?.[0] || ""
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : ""
  return (first + last).toUpperCase()
}

function resolveAvatarUrl(image?: string | null) {
  const src = (image || "").trim()
  if (!src) return undefined
  if (/^https?:\/\//.test(src) || src.startsWith("data:")) return src
  const base = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")
  try {
    return new URL(src, base).toString()
  } catch {
    return src
  }
}

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const [loading, setLoading] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const { data: session, refetch } = authClient.useSession()

  const su = session?.user as { name?: string; email?: string; image?: string } | null | undefined
  const rawImage = su?.image ?? (su as unknown as { avatar?: string })?.avatar ?? (su as unknown as { picture?: string })?.picture ?? (su as unknown as { photoURL?: string })?.photoURL ?? null
  const displayedUser = {
    name: su?.name ?? user.name,
    email: su?.email ?? user.email,
    avatar: resolveAvatarUrl(rawImage) ?? user.avatar ?? "/avatars/shadcn.jpg",
  }

  const initialFirst = useMemo(() => (displayedUser.name || "").split(/\s+/)[0] || "", [displayedUser.name])
  const initialLast = useMemo(() => {
    const parts = (displayedUser.name || "").split(/\s+/)
    return parts.length > 1 ? parts[parts.length - 1] || "" : ""
  }, [displayedUser.name])
  const [firstName, setFirstName] = useState(initialFirst)
  const [lastName, setLastName] = useState(initialLast)
  const [identificacion, setIdentificacion] = useState("")
  const [telefono, setTelefono] = useState("")
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [loadingProfile, setLoadingProfile] = useState(false)
  const fullName = useMemo(() => `${firstName}`.trim() + (lastName.trim() ? ` ${lastName.trim()}` : ""), [firstName, lastName])

  // Load profile data when dialog opens
  const loadProfile = async () => {
    setLoadingProfile(true)
    try {
      const profile = await getProfileAction();

      if (profile?.identificacion) {
        setIdentificacion(profile.identificacion)
        setFirstName(profile.nombres || "")
        setLastName(profile.apellido || "")
        setTelefono(profile.telefono || "")
        setDataProcessingConsent(profile.dataProcessingConsent || false)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleSaveAccount = async () => {
    setSaveError("")
    setSaving(true)

    // Update user name
    const { error } = await authClient.updateUser({ name: fullName })
    if (error) {
      setSaveError(error.message || "Error al actualizar el perfil")
      setSaving(false)
      return
    }

    // Update profile data via server action
    try {
      const formData = new FormData()
      formData.append("identificacion", identificacion)
      formData.append("nombres", firstName)
      formData.append("apellido", lastName)
      formData.append("telefono", telefono)
      await updateProfileAction(formData)
    } catch (err) {
      setSaveError("Error al guardar los datos del perfil")
      setSaving(false)
      return
    }

    await refetch?.()
    setSaving(false)
    setAccountOpen(false)
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await signOut()
      router.push(getPostLogoutRedirect())
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={displayedUser.avatar} alt={displayedUser.name ?? ""} />
                  <AvatarFallback className="rounded-lg">{getInitials(displayedUser.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayedUser.name}</span>
                  <span className="truncate text-xs">{displayedUser.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={displayedUser.avatar} alt={displayedUser.name ?? ""} />
                    <AvatarFallback className="rounded-lg">{getInitials(displayedUser.name)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayedUser.name}</span>
                    <span className="truncate text-xs">{displayedUser.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    setFirstName((displayedUser.name || "").split(/\s+/)[0] || "")
                    const parts = (displayedUser.name || "").split(/\s+/)
                    setLastName(parts.length > 1 ? parts[parts.length - 1] || "" : "")
                    setMenuOpen(false)
                    setAccountOpen(true)
                    loadProfile() // Load profile data
                  }}
                >
                  <BadgeCheck />
                  Cuenta
                </DropdownMenuItem>

              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} disabled={loading}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualización de datos</DialogTitle>
            <DialogDescription>Actualiza tu información personal</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <div>
              <Label htmlFor="identificacion">Identificación</Label>
              <Input className="mt-2.5" id="identificacion" value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} placeholder="Cédula" />
            </div>
            <div>
              <Label htmlFor="first-name">Nombres</Label>
              <Input className="mt-2.5" id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Tus nombres" />
            </div>
            <div>
              <Label htmlFor="last-name">Apellido</Label>
              <Input className="mt-2.5" id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Tu apellido" />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input className="mt-2.5" id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Número de teléfono" />
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/50">
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${dataProcessingConsent ? 'bg-green-500 border-green-500' : 'bg-transparent border-gray-400'}`}>
                {dataProcessingConsent && <div className="h-2 w-2 bg-white rounded-full" />}
              </div>
              <div className="space-y-1">
                <Label htmlFor="habeas-data" className="text-sm font-medium leading-none cursor-default">
                  Aceptación de tratamiento de datos (Habeas Data)
                </Label>
                <p className="text-xs text-muted-foreground">
                  {dataProcessingConsent
                    ? "Has aceptado el tratamiento de tus datos personales."
                    : "No has aceptado el tratamiento de tus datos personales."
                  }
                </p>
              </div>
            </div>



            {saveError && <div className="text-sm text-destructive">{saveError}</div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAccountOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveAccount} disabled={saving || !fullName.trim() || !identificacion.trim()}>{saving ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
