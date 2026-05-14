"use client";

import { useActionState, useState } from "react";

import { saveProfilePermissions } from "@/app/protected/admin/actions";
import { Button } from "@/components/ui/button";
import type {
  DbModulePermission,
  DbProfile,
  PermissionFormState,
} from "@/lib/finance/admin-server";
import { FINANCE_MODULES, PERMISSION_ACTIONS } from "@/lib/finance/permissions";

const initialState: PermissionFormState = {};

export function PermissionsForm({
  profiles,
  permissions,
}: {
  profiles: DbProfile[];
  permissions: DbModulePermission[];
}) {
  const editableProfiles = profiles.filter((profile) => profile.role !== "admin");
  const [selectedProfileId, setSelectedProfileId] = useState(editableProfiles[0]?.id ?? "");
  const [state, formAction, isPending] = useActionState(saveProfilePermissions, initialState);
  const selectedPermissions = permissions.filter((permission) => permission.profile_id === selectedProfileId);

  if (editableProfiles.length === 0) {
    return <p className="text-sm text-muted-foreground">Cadastre um usuario familiar antes.</p>;
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="profile_id" value={selectedProfileId} />

      <select
        value={selectedProfileId}
        onChange={(event) => setSelectedProfileId(event.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
      >
        {editableProfiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name}
          </option>
        ))}
      </select>

      <div className="space-y-3">
        {FINANCE_MODULES.map((module) => {
          const modulePermission = selectedPermissions.find(
            (permission) => permission.module === module.key,
          );

          return (
            <div key={module.key} className="rounded-xl border p-4">
              <p className="mb-3 font-medium">{module.label}</p>
              <div className="grid gap-3 md:grid-cols-4">
                {PERMISSION_ACTIONS.map((action) => (
                  <label key={action.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name={`${module.key}.${action.key}`}
                      defaultChecked={Boolean(modulePermission?.[action.key])}
                    />
                    {action.label}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar permissoes"}
      </Button>
    </form>
  );
}
