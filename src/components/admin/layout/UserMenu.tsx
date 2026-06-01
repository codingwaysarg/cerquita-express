import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { clearSession, getUserEmail } from "@/lib/admin/auth";

export function UserMenu() {
  const navigate = useNavigate();
  const email = getUserEmail() || "operator@smartfridge.io";
  const initial = email[0]?.toUpperCase() || "O";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Cuenta">
          <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{initial}</AvatarFallback></Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Operador<br /><span className="text-foreground font-medium truncate block">{email}</span></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { clearSession(); navigate({ to: "/admin/login" }); }}>
          <LogOut className="h-3.5 w-3.5 mr-2" />Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
