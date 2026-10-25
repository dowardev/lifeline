// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * LBDS-298 - e2e test for the calendar picker in the event
 * create/update modal. Drives the real Vue + Ionic + Pinia stack
 * against the Vite dev server, with the backend endpoints stubbed
 * via cy.intercept so the test does not depend on a running
 * Laravel or a seeded DB.
 *
 * The project's e2e harness is Cypress (see cypress.config.ts and
 * `pnpm run test:e2e`). The ticket's "Playwright" wording was a
 * suggestion from the ticket author; the acceptance test is the
 * end-to-end coverage, not the specific runner.
 */

// LBDS-305 - the picker contract is `CalendarItem` from
// `calendarStore.ts`. Every row carries `source_id`, a nested
// `source` block (null for local rows), `archived_at` (null while
// alive), and `selectable` (false for archived mirrors). The local
// rows in these stubs use the same null/null/null/true defaults
// the backend `CalendarResource` emits for `calendars.user_id = ...`
// rows with `source_id = null`.

const localRow = (params: {
  id: number
  user_id: number
  name: string
  default: number
}) => ({
  id: params.id,
  user_id: params.user_id,
  name: params.name,
  default: params.default,
  source_id: null,
  source: null,
  archived_at: null,
  selectable: true,
})

const mirrorRow = (params: {
  id: number
  user_id: number
  name: string
  source_id: number
  source_type: 'ics' | 'caldav' | 'google'
  source_username?: string | null
  color?: string
  default?: number
}) => ({
  id: params.id,
  user_id: params.user_id,
  name: params.name,
  default: params.default ?? 0,
  source_id: params.source_id,
  source: {
    id: params.source_id,
    type: params.source_type,
    name: params.name,
    color: params.color ?? '#3880ff',
    username: params.source_username ?? null,
  },
  archived_at: null,
  selectable: true,
})

const CALENDARS = [
  localRow({ id: 1, user_id: 7, name: 'Personal', default: 1 }),
  localRow({ id: 2, user_id: 7, name: 'Trabajo', default: 0 }),
  localRow({ id: 3, user_id: 7, name: 'Side', default: 0 }),
]

// LBDS-305 - one local + two mirrors (a Google one carrying the
// same name the user already has locally, and a CalDAV one), so
// the picker has to list the local calendar and the external
// sources in the same list.
const CALENDARS_WITH_SOURCE = [
  localRow({ id: 1, user_id: 7, name: 'Personal', default: 1 }),
  mirrorRow({
    id: 10, user_id: 7, name: 'Personal',
    source_id: 99, source_type: 'google',
    source_username: 'alice@gmail.com',
    color: '#4285f4',
  }),
  mirrorRow({
    id: 11, user_id: 7, name: 'Work',
    source_id: 100, source_type: 'caldav',
    source_username: null, color: '#ff8800',
  }),
]

const CALENDARS_EMPTY: { id: number; user_id: number; name: string; default: number; source_id: null; source: null; archived_at: null; selectable: boolean }[] = []

function stubBackends(): void {
  cy.intercept('GET', '**/api/v1/calendars*', (req) => {
    // The test parametrises whether the user has calendars via
    // an alias so each test can decide.
    const url = new URL(req.url)
    const empty = url.searchParams.get('__empty') === '1'
    const withSource = url.searchParams.get('__with_source') === '1'
    const data = empty
      ? CALENDARS_EMPTY
      : (withSource ? CALENDARS_WITH_SOURCE : CALENDARS)
    req.reply({
      status: 200,
      body: {
        data,
        links: { first: '...', last: '...', prev: null, next: null },
        meta: { current_page: 1, from: 1, last_page: 1, per_page: 50, to: data.length },
      },
    })
  }).as('getCalendars')

  // Stub the rest of the read endpoints so the page does not error
  // before we get to the modal. Empty data is fine; the picker does
  // not depend on it.
  cy.intercept('GET', '**/api/v1/events*', { body: { data: [], links: {}, meta: {} } })
  cy.intercept('GET', '**/api/v1/calendar-sources*', { body: { data: [], links: {}, meta: {} } })
  cy.intercept('GET', '**/api/v1/external-events*', { body: [] })
  cy.intercept('GET', '**/api/v1/external-contacts*', { body: [] })
  cy.intercept('GET', '**/api/v1/external-tasks*', { body: [] })
  cy.intercept('GET', '**/api/v1/wakatime-durations*', { body: {} })
  cy.intercept('GET', '**/api/v1/admin-tags*', { body: [] })
  cy.intercept('GET', '**/api/v1/notes*', { body: { data: [], links: {}, meta: {} } })
  cy.intercept('GET', '**/api/v1/tasks*', { body: { data: [], links: {}, meta: {} } })
  cy.intercept('GET', '**/api/v1/documents*', { body: { data: [], links: {}, meta: {} } })
}

/**
 * Opens the "Agregar evento" modal from the calendar page.
 *
 * The page opens the modal from an ICON-ONLY toolbar button
 * (`ion-button fill="clear"` wrapping the `addOutline` icon), so there
 * is no "Añadir evento" label to match on this page — that label only
 * exists on the CalendarWidget. The second button of that slot is the
 * options trigger, so it is excluded by id.
 */
function openAddEventModal(): void {
  cy.get('ion-buttons[slot="end"] ion-button:not(#main-options-trigger)')
    .first()
    .click({ force: true })
}

describe('Calendar picker (LBDS-298)', () => {
  beforeEach(() => {
    // Force a fresh storage so the SSO/anonymous state from
    // previous specs does not bleed into the picker's request.
    cy.clearLocalStorage()
    cy.clearCookies()
    stubBackends()
  })

  it('renders the Calendario select when the user has at least one calendar', () => {
    cy.visit('/calendar')
    openAddEventModal()

    // The picker is an `ion-select` inside the "Otros" card, the same
    // control the availability select uses. It must be present AND
    // enabled so its popover can open.
    cy.get('ion-select.calendar-select').should('exist')
      .and('not.have.attr', 'disabled')
    // Pre-selects the default:1 row.
    cy.get('ion-select.calendar-select')
      .invoke('text')
      .should('match', /Personal/)
  })

  it('opens the select popover with one option per calendar and closes after pick', () => {
    cy.visit('/calendar')
    openAddEventModal()
    cy.get('ion-select.calendar-select').click({ force: true })

    // The select's popover renders one option per calendar.
    cy.get('ion-select-popover').should('exist')
    cy.get('ion-select-popover')
      .find('.select-interface-option')
      .should('have.length', CALENDARS.length)

    // Pick the second calendar. The popover closes and the select
    // reflects the new selection.
    cy.get('ion-select-popover')
      .find('.select-interface-option').filter({ hasText: 'Trabajo' }).first()
      .click({ force: true })
    cy.get('ion-select.calendar-select')
      .invoke('text')
      .should('match', /Trabajo/)
  })

  it('renders the Calendario row disabled with "Sin calendarios" when the user has zero', () => {
    // Override the calendars stub for this test only.
    cy.intercept('GET', '**/api/v1/calendars*', { body: { data: [], links: {}, meta: {} } }).as('getCalendarsEmpty')
    cy.visit('/calendar')
    openAddEventModal()

    // The select is rendered (so the user can see the picker exists)
    // but disabled (the popover does not open on tap), and it says
    // there are no calendars.
    cy.get('ion-select.calendar-select').should('exist')
      .and('have.attr', 'disabled')
    cy.get('ion-select.calendar-select')
      .invoke('text')
      .should('match', /Sin calendarios/)
  })

  it('LBDS-305: lists the mirrored external sources in the same picker', () => {
    // Override the stub for this test only: 1 local + 2 mirrors.
    cy.intercept('GET', '**/api/v1/calendars*', (req) => {
      req.reply({
        status: 200,
        body: {
          data: CALENDARS_WITH_SOURCE,
          links: { first: '...', last: '...', prev: null, next: null },
          meta: { current_page: 1, from: 1, last_page: 1, per_page: 50, to: CALENDARS_WITH_SOURCE.length },
        },
      })
    }).as('getCalendarsWithSource')
    cy.visit('/calendar')
    openAddEventModal()
    cy.get('ion-select.calendar-select').click({ force: true })

    // The select's popover renders one option per row: the local
    // calendar AND the mirrored external sources, in the same list.
    cy.get('ion-select-popover').should('exist')
    cy.get('ion-select-popover')
      .find('.select-interface-option')
      .should('have.length', CALENDARS_WITH_SOURCE.length)

    // A mirrored option carries the kind of its source and the
    // account, so two Google accounts with the same calendar name
    // are told apart.
    cy.get('ion-select-popover')
      .find('.select-interface-option').filter({ hasText: 'alice@gmail.com' })
      .should('exist')
    cy.get('ion-select-popover')
      .find('.select-interface-option').filter({ hasText: 'Google' })
      .should('exist')

    // The local option keeps just the calendar name.
    cy.get('ion-select-popover')
      .find('.select-interface-option').filter({ hasText: 'Personal' })
      .invoke('text')
      .should('not.match', /Google|CalDAV/)

    // Picking a mirrored source closes the popover and the select
    // reflects the new selection.
    cy.get('ion-select-popover')
      .find('.select-interface-option').filter({ hasText: 'Work' }).first()
      .click({ force: true })
    cy.get('ion-select.calendar-select')
      .invoke('text')
      .should('match', /Work/)
  })
})
