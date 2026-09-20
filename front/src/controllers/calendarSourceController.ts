// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

// 1. Imports (services)
import { calendarSourceService } from '@/services/calendarSourceService';

// 4. Interface and types imports
import type { CalendarSourceDto, DiscoveredCollection } from '@/services/calendarSourceService';

export interface ConnectionTestOutcome {
  ok: boolean;
  kind: 'connection' | 'auth';
  message: string;
  detail?: string;
}

interface HttpError {
  response?: { status?: number; data?: { message?: unknown; discovery_errors?: unknown } };
  message?: unknown;
}

function serverMessage(params: { error: unknown }): string | null {
  if (typeof params.error !== 'object' || params.error === null) return null;
  const message = (params.error as HttpError).response?.data?.message;
  return typeof message === 'string' && message !== '' ? message : null;
}

function serverDiscoveryErrors(params: { error: unknown }): Record<string, string> | undefined {
  if (typeof params.error !== 'object' || params.error === null) return undefined;
  const raw = (params.error as HttpError).response?.data?.discovery_errors;
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  for (const [kind, detail] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof detail === 'string') out[kind] = detail;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function errorStatus(error: unknown): number | null {
  if (typeof error === 'object' && error !== null) {
    const status = (error as HttpError).response?.status;
    if (typeof status === 'number') return status;
  }
  return null;
}

function isSessionError(error: unknown): boolean {
  if (errorStatus(error) === 401) return true;
  if (typeof error === 'object' && error !== null) {
    const message = (error as HttpError).message;
    if (typeof message === 'string' && message.includes('SSO no disponible')) return true;
  }
  return false;
}

export class CalendarSourceController {
  async testConnection(params: {
    type: 'google' | 'caldav';
    url: string;
    username?: string;
    password?: string;
  }): Promise<ConnectionTestOutcome> {
    const { type, url, username, password } = params;
    try {
      const result = await calendarSourceService.testConnection({
        type: type === 'google' ? 'ics' : 'caldav',
        url,
        username,
        password,
      });
      if (typeof result.event_count === 'number') {
        return {
          ok: true,
          kind: 'connection',
          message: `Conexión verificada — ${result.event_count} eventos`,
        };
      }
      return { ok: true, kind: 'connection', message: 'Conexión verificada' };
    } catch (error) {
      console.error('[calendarSource]', error);
      if (isSessionError(error)) {
        return { ok: false, kind: 'auth', message: 'Sesión inválida' };
      }
      return {
        ok: false,
        kind: 'connection',
        message: 'Problema al verificar',
            detail: serverMessage({ error }) ?? 'Sin respuesta del servidor',
      };
    }
  }

  async listSources(): Promise<CalendarSourceDto[]> {
    return calendarSourceService.listSources();
  }

  async saveSource(params: {
    serverId: number | null;
    type: 'google' | 'caldav';
    name: string;
    url?: string;
    username?: string;
    password?: string;
    color: string;
    collections?: { href: string; subscribed: boolean; hidden?: boolean }[];
  }): Promise<{
    ok: boolean;
    kind: 'connection' | 'auth';
    message: string;
    source?: CalendarSourceDto;
  }> {
    const { serverId, type, name, url, username, password, color, collections } = params;
    try {
      const payload = {
        type: type === 'google' ? ('ics' as const) : ('caldav' as const),
        name,
        url,
        username,
        color,
        ...(password !== undefined && password !== '' ? { password } : {}),
      };
      const source =
        serverId === null
          ? await calendarSourceService.createSource(payload)
          : await calendarSourceService.updateSource({
              id: serverId,
              ...payload,
              ...(collections !== undefined ? { collections } : {}),
            });
      return { ok: true, kind: 'connection', message: 'Conexión guardada', source };
    } catch (error) {
      console.error('[calendarSource]', error);
      if (isSessionError(error)) {
        return { ok: false, kind: 'auth', message: 'Sesión inválida' };
      }
      return {
        ok: false,
        kind: 'connection',
        message: 'No se pudo guardar',
      };
    }
  }

  async startGoogleOAuth(): Promise<{ ok: boolean; url?: string; message?: string }> {
    try {
      const url = await calendarSourceService.getGoogleAuthorizeUrl();
      return { ok: true, url };
    } catch (error) {
      console.error('[calendarSource]', error);
      if (isSessionError(error)) {
        return { ok: false, message: 'Sin sesión: iniciá sesión de nuevo' };
      }
      return { ok: false, message: 'No se pudo conectar con Google' };
    }
  }

  async discoverCollections(params: {
    serverId: number;
  }): Promise<
    ConnectionTestOutcome & {
      collections?: DiscoveredCollection[];
      discoveryErrors?: Record<string, string>;
    }
  > {
    try {
      const { collections, discoveryErrors } = await calendarSourceService.discoverCollections({
        id: params.serverId,
      });
      if (collections.length === 0) {
        return {
          ok: false,
          kind: 'connection',
          message: 'No se encontraron colecciones en el servidor',
          discoveryErrors,
        };
      }
      return {
        ok: true,
        kind: 'connection',
        message: `${collections.length} colecciones encontradas`,
        collections,
        discoveryErrors,
      };
    } catch (error) {
      console.error('[calendarSource]', error);
      if (isSessionError(error)) {
        return { ok: false, kind: 'auth', message: 'Sesión inválida' };
      }
      return {
        ok: false,
        kind: 'connection',
        message: 'No se pudieron descubrir calendarios',
        discoveryErrors: serverDiscoveryErrors({ error }),
      };
    }
  }

  async syncSource(params: {
    serverId: number;
    collectionHref?: string;
  }): Promise<ConnectionTestOutcome> {
    try {
      const result = await calendarSourceService.syncSource({
        id: params.serverId,
        collectionHref: params.collectionHref,
      });
      return {
        ok: true,
        kind: 'connection',
        message: `Sincronizados ${result.upserted} elementos (${result.pruned} eliminados)`,
      };
    } catch (error) {
      console.error('[calendarSource]', error);
      if (isSessionError(error)) {
        return { ok: false, kind: 'auth', message: 'Sesión inválida' };
      }
      return {
        ok: false,
        kind: 'connection',
        message: 'No se pudo sincronizar',
      };
    }
  }

  async saveCollections(params: {
    serverId: number;
    collections: { href: string; subscribed: boolean; hidden?: boolean }[];
  }): Promise<ConnectionTestOutcome> {
    try {
      await calendarSourceService.updateSource({
        id: params.serverId,
        collections: params.collections,
      });
      return { ok: true, kind: 'connection', message: 'Suscripción actualizada' };
    } catch (error) {
      console.error('[calendarSource]', error);
      if (isSessionError(error)) {
        return { ok: false, kind: 'auth', message: 'Sesión inválida' };
      }
      return { ok: false, kind: 'connection', message: 'No se pudo guardar' };
    }
  }

  async removeSource(params: { serverId: number | null }): Promise<ConnectionTestOutcome> {
    const { serverId } = params;
    if (serverId === null) return { ok: true, kind: 'connection', message: 'Conexión descartada' };
    try {
      await calendarSourceService.removeSource({ id: serverId });
      return { ok: true, kind: 'connection', message: 'Conexión eliminada' };
    } catch (error) {
      console.error('[calendarSource]', error);
      if (isSessionError(error)) {
        return { ok: false, kind: 'auth', message: 'Sesión inválida' };
      }
      return {
        ok: false,
        kind: 'connection',
        message: 'No se pudo eliminar',
      };
    }
  }
}
