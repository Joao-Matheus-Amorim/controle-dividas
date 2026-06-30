"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, Sparkles, UserRound } from "lucide-react";

import { saveProfileFeaturePermissions } from "@/app/protected/admin/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import type { DbFeaturePermission, DbProfile, PermissionFormState } from "@/lib/finance/admin-types";
import { FEATURE_PERMISSIONS } from "@/lib/finance/permissions";
import { cn } from "@/lib/utils";

const initialState: PermissionFormState = {};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function FeaturePermissionsForm({
  profiles,
  featurePermissions,
}: {
  profiles: DbProfile[];
  featurePermissions: DbFeaturePermission[];
}) {
  const editableProfiles = profiles.filter((profile) => profile.role !== "admin");
  const [selectedProfileId, setSelectedProfileId] = useState(editableProfiles[0]?.id ?? "");
  const [state, formAction, isPending] = useActionState(saveProfileFeaturePermissions, initialState);

  const selectedProfile = editableProfiles.find((profile) => profile.id === selectedProfileId);
  const selectedFeaturePermissions = useMemo(
    () => featurePermissions.filter((permission) => permission.profile_id === selectedProfileId),
    [featurePermissions, selectedProfileId],
  );
  const enabledFeatureCount = selectedFeaturePermissions.filter((permission) => permission.is_enabled).length;

  if (editableProfiles.length === 0) {
    return null;
  }

  return (
    <form action={formAction} className="space-y-5" key={selectedProfileId}>
      <input type="hidden" name="profile_id" value={selectedProfileId} />

      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[1.75rem] border border-border bg-ff-bg-soft p-4 shadow-ff-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-lg shadow-primary/10">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Funcionalidades</p>
              <p className="text-sm font-semibold text-foreground">Escolha um perfil</p>
            </div>
          </div>

          <div className="space-y-2">
            {editableProfiles.map((profile) => {
              const isSelected = profile.id === selectedProfileId;
              const profileEnabledCount = featurePermissions.filter(
                (permission) => permission.profile_id === profile.id && permission.is_enabled,
              ).length;

              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition duration-200",
                    isSelected
                      ? "border-primary/50 bg-primary/15 shadow-ff-lg"
                      : "border-border bg-background/50 hover:border-ff-border-strong hover:bg-ff-bg-soft hover:shadow-xl hover:shadow-black/20",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition",
                      isSelected ? "bg-primary text-foreground" : "bg-card text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {initials(profile.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{profile.name}</p>
                    <p className="truncate text-xs text-ff-subtle-foreground">{profileEnabledCount} funcionalidade(s)</p>
                  </div>
                  {isSelected ? <Check className="h-4 w-4 text-primary" /> : null}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-[1.75rem] border border-border bg-card p-4 shadow-ff-lg md:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-lg shadow-primary/10">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Permissões por feature</p>
                <p className="text-sm font-semibold text-foreground">
                  {selectedProfile?.name || "Perfil selecionado"}
                </p>
              </div>
            </div>
            <div className="rounded-full border border-border bg-ff-bg-soft px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              {enabledFeatureCount}/{FEATURE_PERMISSIONS.length} ativas
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {FEATURE_PERMISSIONS.map((feature) => {
              const featurePermission = selectedFeaturePermissions.find(
                (permission) => permission.feature_key === feature.key,
              );
              const inputId = `${selectedProfileId}.${feature.key}.is_enabled`;

              return (
                <label
                  key={`${selectedProfileId}-${feature.key}`}
                  htmlFor={inputId}
                  className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background/55 p-4 text-sm text-foreground transition duration-200 hover:border-primary/35 hover:bg-primary/10 hover:text-foreground"
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    name={`${feature.key}.is_enabled`}
                    defaultChecked={Boolean(featurePermission?.is_enabled)}
                    className="peer sr-only"
                  />
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-ff-border-strong bg-background text-transparent transition peer-checked:border-primary peer-checked:bg-primary peer-checked:text-foreground group-hover:border-primary/50">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="block font-semibold peer-checked:text-foreground">{feature.label}</span>
                </label>
              );
            })}
          </div>
        </section>
      </section>

      <AppActionFeedback error={state.error} success={state.success} />

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="h-12 rounded-2xl bg-primary px-6 font-semibold text-foreground shadow-ff-lg hover:bg-ff-primary-hover"
        >
          {isPending ? "Salvando..." : "Salvar funcionalidades"}
        </Button>
      </div>
    </form>
  );
}
