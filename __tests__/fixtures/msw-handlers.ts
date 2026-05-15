import { http, HttpResponse } from "msw";

import {
  mockDashboardTables,
  mockExpenses,
  mockPermissions,
  mockProfiles,
  mockSupabaseUrl,
} from "./msw-finance-data";

function readEqFilter(value: string | null) {
  return value?.replace("eq.", "") ?? null;
}

function readInFilter(value: string | null) {
  const match = value?.match(/^in\.\((.*)\)$/);
  return match ? match[1].split(",") : [];
}

export const mswFinanceHandlers = [
  http.get(`${mockSupabaseUrl}/rest/v1/profiles`, ({ request }) => {
    const url = new URL(request.url);
    const id = readEqFilter(url.searchParams.get("id"));

    if (!id) return HttpResponse.json(mockProfiles);
    return HttpResponse.json(mockProfiles.filter((profile) => profile.id === id));
  }),

  http.get(`${mockSupabaseUrl}/rest/v1/user_module_permissions`, ({ request }) => {
    const url = new URL(request.url);
    const profileId = readEqFilter(url.searchParams.get("profile_id"));
    const module = readEqFilter(url.searchParams.get("module"));

    return HttpResponse.json(
      mockPermissions.filter((permission) => {
        if (profileId && permission.profile_id !== profileId) return false;
        if (module && permission.module !== module) return false;
        return true;
      }),
    );
  }),

  http.get(`${mockSupabaseUrl}/rest/v1/expenses`, ({ request }) => {
    const url = new URL(request.url);
    const memberIds = readInFilter(url.searchParams.get("family_member_id"));

    if (memberIds.length === 0) return HttpResponse.json(mockExpenses);
    return HttpResponse.json(mockExpenses.filter((expense) => memberIds.includes(expense.family_member_id)));
  }),

  http.get(`${mockSupabaseUrl}/rest/v1/:table`, ({ params }) => {
    const table = String(params.table) as keyof typeof mockDashboardTables;
    return HttpResponse.json(mockDashboardTables[table] ?? []);
  }),
];
